import {
  AiDocumentMismatchError,
  AiDocumentUnavailableError,
} from '@/utils/aiDocumentRouting';
import type { AiDocumentRoutingContextValue } from '@/contexts/AiDocumentRoutingContext';
import type { FieldDefinition } from '@/types/formTypes';
import { buildFieldCatalogForAi } from '@/utils/aiPatchNormalizer';
import { getSectionFieldCatalog } from '@/utils/aiSectionFieldCatalog';
import { autofillSectionFromDocument } from '@/services/aiAutofill';
import {
  peekDashboardAiPatch,
  takeDashboardAiPatch,
  markDashboardAiPatchPersisted,
} from '@/utils/aiDashboardPatchCache';
import {
  aiPatchHasValues,
  unwrapAiAutofillPatch,
} from '@/utils/aiPatchNormalizer';
import { markAiSectionFilled } from '@/utils/aiSectionFillGuard';
import {
  isAiAutofillDoneForSection,
  markAiAutofillDoneForSection,
} from '@/utils/aiAutofillDoneSections';
import { persistAiResultToSectionBackground } from '@/services/aiBackgroundSectionPersist';
import { ensureFreshSession } from '@/libs/secureFetch';
import { gateUploadedDocumentPerson } from '@/utils/aiDocumentPersonGate';
import { AI_SECTION_BY_ID } from '@/utils/aiSectionRegistry';
import {
  mergePatchesFillEmptyOnly,
  resolveGapCandidateKeys,
} from '@/utils/aiGapFill';
import {
  DEPENDENT_EDUCATION_MUST_FILL_KEYS,
  getIdentityDocumentFields,
  identityDocumentCardLabel,
  IDENTITY_MUST_FILL_KEYS,
} from '@/utils/identityDocumentFields';
import { recordNewFill } from '@/utils/newFillMarkers';

type RunAiAutofillArgs = {
  sectionKey: string;
  sectionId: string;
  file_id: string;
  mime_type?: string;
  fileName?: string | null;
  subsection?: string | null;
  uploadScope?: string;
  useRoutedCache?: boolean;
  fields?: FieldDefinition[];
  aiRouting?: Pick<
    AiDocumentRoutingContextValue,
    | 'handleMismatch'
    | 'handleAutofillSuccess'
    | 'releaseAdditionalSectionsDialog'
    | 'clearAllPendingForFile'
    | 'clearPendingForSection'
    | 'getPendingUploadsForSection'
    | 'shouldHighlightUpload'
  > | null;
};

/** Shared shape so callers can safely read optional partner_results / routing flags. */
export type RunAiSectionAutofillResult = {
  // AI patches vary by section; keep this flexible for section callers.
  result?: any;
  document_summary?: string;
  additional_sections?: Array<{
    section_key?: string;
    [key: string]: unknown;
  }>;
  section_previews?: unknown;
  document_deleted?: boolean;
  already_filled?: boolean;
  identity_skipped?: boolean;
  identity_routed?: boolean;
  routed_section_id?: string;
  partner_results?: Record<string, any>;
};

export function releaseDeferredAiRoutingDialog(
  aiRouting?: Pick<
    AiDocumentRoutingContextValue,
    'releaseAdditionalSectionsDialog'
  > | null,
) {
  aiRouting?.releaseAdditionalSectionsDialog();
}

function shouldUseRoutedCache(
  sectionId: string,
  fileId: string,
  uploadScope: string,
  aiRouting?: RunAiAutofillArgs['aiRouting'],
  explicit?: boolean,
) {
  if (explicit) return true;
  if (!aiRouting) return false;

  const pending = aiRouting.getPendingUploadsForSection(sectionId).find(
    item =>
      item.file_id === fileId &&
      (item.uploadScope === uploadScope ||
        item.uploadScope === 'full' ||
        uploadScope === 'full'),
  );

  if (pending) return true;

  return aiRouting.shouldHighlightUpload(sectionId, uploadScope);
}

function buildMergedFieldCatalog(
  sectionKey: string,
  sectionId: string,
  fields?: FieldDefinition[],
) {
  const local = fields?.length ? buildFieldCatalogForAi(fields) : [];
  const fromForm = getSectionFieldCatalog(sectionKey, null).catalog || [];
  const byKey = new Map<string, (typeof fromForm)[number]>();
  fromForm.forEach(item => {
    if (item?.key) byKey.set(item.key, item);
  });
  local.forEach(item => {
    if (item?.key) byKey.set(item.key, item);
  });

  // Always include identity card keys for Vital / Legal identity targets.
  if (sectionId === '1' || sectionId === '20') {
    const mode = sectionId === '20' ? 'family' : 'owner';
    buildFieldCatalogForAi(
      getIdentityDocumentFields(mode) as FieldDefinition[],
    ).forEach(item => {
      if (item?.key) byKey.set(item.key, item);
    });
    // Ensure must-fill keys exist even if a field was filtered from UI schema.
    IDENTITY_MUST_FILL_KEYS.forEach(key => {
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          label: key.replace(/_/g, ' '),
          type: 'TextInput',
          helperText: '',
          placeholder: '',
          options: [],
        });
      }
    });
  }

  if (sectionId === '17') {
    DEPENDENT_EDUCATION_MUST_FILL_KEYS.forEach(key => {
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          label: key.replace(/_/g, ' '),
          type: 'TextInput',
          helperText: '',
          placeholder: '',
          options: [],
        });
      }
    });
  }

  return [...byKey.values()];
}

function recordIdentityFillsFromResult(
  sectionId: string,
  result: unknown,
) {
  if (typeof window === 'undefined') return;
  const patch = unwrapAiAutofillPatch(result) as Record<string, unknown> | null;
  if (!patch) return;

  const cards: unknown[] =
    (Array.isArray(patch.identity_documents) && patch.identity_documents) ||
    (Array.isArray((patch['20A'] as Record<string, unknown> | undefined)?.identity_documents) &&
      ((patch['20A'] as Record<string, unknown>).identity_documents as unknown[])) ||
    [];

  const subsectionId = sectionId === '20' ? '20A' : '1A';
  const mode = sectionId === '20' ? 'family' : 'owner';

  cards.forEach((card, index) => {
    if (!card || typeof card !== 'object') return;
    recordNewFill({
      sectionId,
      subsectionId,
      topicGroupKey: 'identity_documents',
      index,
      label: identityDocumentCardLabel(
        card as Record<string, unknown>,
        index,
        mode,
      ),
    });
  });
}

async function runGapRereadPass(args: {
  sectionKey: string;
  sectionId: string;
  file_id: string;
  subsection?: string | null;
  use_routed_cache?: boolean;
  primaryResult: unknown;
  fieldCatalog: Array<{
    key: string;
    label: string;
    type: string;
    helperText?: string;
    placeholder?: string;
    options?: string[];
  }>;
}): Promise<unknown> {
  const emptyKeys = resolveGapCandidateKeys({
    sectionId: args.sectionId,
    fieldCatalog: args.fieldCatalog,
    primaryResult: args.primaryResult,
  });
  if (emptyKeys.length === 0) return args.primaryResult;

  // Build focused catalog from known fields; synthesize entries for must-fill
  // keys that were empty but missing from the catalog list.
  const byKey = new Map(args.fieldCatalog.map(item => [item.key, item]));
  const focusedCatalog = emptyKeys.map(key => {
    const existing = byKey.get(key);
    if (existing) return existing;
    return {
      key,
      label: key.replace(/_/g, ' '),
      type: 'TextInput',
    };
  });
  if (!focusedCatalog.length) return args.primaryResult;

  try {
    const gapJson = await autofillSectionFromDocument({
      section: args.sectionKey,
      file_id: args.file_id,
      subsection: args.subsection,
      defer_persist: true,
      use_routed_cache: args.use_routed_cache,
      field_catalog: focusedCatalog,
    });
    if (!gapJson?.result || !aiPatchHasValues(unwrapAiAutofillPatch(gapJson.result))) {
      return args.primaryResult;
    }

    const mergedPatch = mergePatchesFillEmptyOnly(
      args.primaryResult,
      gapJson.result,
    );
    if (
      args.primaryResult &&
      typeof args.primaryResult === 'object' &&
      'patch' in (args.primaryResult as object)
    ) {
      return {
        ...(args.primaryResult as object),
        patch: mergedPatch,
      };
    }
    return { patch: mergedPatch };
  } catch (err) {
    console.warn('AI gap re-read failed; keeping first pass', err);
    return args.primaryResult;
  }
}

export async function runAiSectionAutofill({
  sectionKey,
  sectionId,
  file_id,
  mime_type,
  fileName,
  subsection,
  uploadScope = 'full',
  useRoutedCache,
  fields,
  aiRouting,
}: RunAiAutofillArgs): Promise<RunAiSectionAutofillResult | null> {
  try {
    // Same document already filled this section — don't re-hit the temp API.
    // Other documents for the same section (2nd vehicle, 2nd policy) still run.
    if (file_id && isAiAutofillDoneForSection(sectionId, file_id)) {
      markAiSectionFilled(sectionId);
      return {
        result: peekDashboardAiPatch(sectionId, file_id)?.result || {
          patch: {},
        },
        document_summary: 'Auto fill already completed for this document.',
        additional_sections: undefined,
        section_previews: undefined,
        document_deleted: true,
        already_filled: true,
      };
    }

    const persistRoutedResult = async (args: {
      result: unknown;
      documentSummary?: string;
      sourceFileName?: string | null;
    }) => {
      const gated = await gateUploadedDocumentPerson({
        sectionId,
        sectionKey,
        subsection,
        sectionLabel: AI_SECTION_BY_ID[sectionId]?.label,
        result: args.result,
        documentSummary: args.documentSummary,
        fileName: args.sourceFileName || fileName,
      });

      if (gated.skipped) {
        return {
          result: { patch: {} },
          document_summary:
            'Skipped — choose whose ID this is later if you still want it filled.',
          additional_sections: undefined,
          section_previews: undefined,
          document_deleted: false,
          identity_skipped: true,
          routed_section_id: undefined as string | undefined,
        };
      }

      const target = gated.target;
      const routedAway = target.sectionId !== sectionId;

      try {
        await ensureFreshSession();
        const saved = await persistAiResultToSectionBackground({
          sectionId: target.sectionId,
          sectionKey: target.sectionKey,
          result: target.result,
          subsection: target.subsection,
        });
        if (saved.ok) {
          markDashboardAiPatchPersisted(target.sectionId, file_id);
          markAiSectionFilled(target.sectionId);
          markAiAutofillDoneForSection({
            sectionId: target.sectionId,
            fileId: file_id,
            fileName: args.sourceFileName || fileName || undefined,
          });
        } else {
          console.warn('Section AI vault save failed:', saved.error);
        }
      } catch (persistErr) {
        console.warn('Section AI vault save failed', persistErr);
      }

      aiRouting?.handleAutofillSuccess({
        file_id,
        mime_type: mime_type || 'application/pdf',
        currentSectionId: target.sectionId,
        uploadScope: routedAway ? 'full' : uploadScope,
        additional_sections: undefined,
        section_previews: undefined,
        document_summary: args.documentSummary,
        document_deleted: false,
        deferAdditionalDialog: true,
      });

      // If the user chose spouse/dependent, don't also paint vital fields here.
      if (routedAway) {
        return {
          result: { patch: {} },
          document_summary:
            args.documentSummary ||
            `Saved to ${target.sectionLabel || 'Family & Relationships'} instead of this section.`,
          additional_sections: undefined,
          section_previews: undefined,
          document_deleted: false,
          identity_routed: true,
          routed_section_id: target.sectionId,
        };
      }

      return {
        result: target.result,
        document_summary: args.documentSummary,
        additional_sections: undefined,
        section_previews: undefined,
        document_deleted: false,
        routed_section_id: target.sectionId,
      };
    };

    const peeked = peekDashboardAiPatch(sectionId, file_id);
    // Prefer temp-stored extraction for this exact document × section.
    if (
      peeked?.result &&
      (!file_id || !peeked.file_id || peeked.file_id === file_id)
    ) {
      const stashedPatch = unwrapAiAutofillPatch(peeked.result);
      if (aiPatchHasValues(stashedPatch)) {
        const stashed = takeDashboardAiPatch(sectionId, peeked.file_id || file_id);
        if (stashed) {
          if (!stashed.vault_persisted) {
            return persistRoutedResult({
              result: stashed.result,
              documentSummary: stashed.document_summary,
              sourceFileName: stashed.file_name,
            });
          }

          markAiSectionFilled(sectionId);
          markAiAutofillDoneForSection({
            sectionId,
            fileId: stashed.file_id || file_id,
            fileName: stashed.file_name,
          });
          aiRouting?.handleAutofillSuccess({
            file_id: stashed.file_id || file_id,
            mime_type: mime_type || 'application/pdf',
            currentSectionId: sectionId,
            uploadScope,
            additional_sections: undefined,
            section_previews: undefined,
            document_summary: stashed.document_summary,
            document_deleted: false,
            deferAdditionalDialog: true,
          });

          return {
            result: stashed.result as any,
            document_summary: stashed.document_summary,
            additional_sections: undefined,
            section_previews: undefined,
            document_deleted: false,
          };
        }
      }
      // Empty stash — drop it and try a live extraction.
      takeDashboardAiPatch(sectionId, peeked.file_id || file_id);
    }

    const fieldCatalog = buildMergedFieldCatalog(sectionKey, sectionId, fields);
    const useCache = shouldUseRoutedCache(
      sectionId,
      file_id,
      uploadScope,
      aiRouting,
      useRoutedCache,
    );

    const json = await autofillSectionFromDocument({
      section: sectionKey,
      file_id,
      subsection,
      // Client writes E2EE ciphertext; server AES merge cannot touch v3 rows.
      defer_persist: true,
      use_routed_cache: useCache,
      field_catalog: fieldCatalog,
    });

    const gapFilledResult = await runGapRereadPass({
      sectionKey,
      sectionId,
      file_id,
      subsection,
      use_routed_cache: useCache,
      primaryResult: json.result,
      fieldCatalog,
    });

    const routed = await persistRoutedResult({
      result: gapFilledResult,
      documentSummary: json.document_summary,
    });

    if (routed && !routed.identity_skipped) {
      recordIdentityFillsFromResult(
        routed.routed_section_id || sectionId,
        routed.result,
      );
    }

    return {
      ...routed,
      additional_sections: json.additional_sections,
      section_previews: json.section_previews,
      document_deleted: json.document_deleted,
      partner_results: json.partner_results,
    };
  } catch (error) {
    if (error instanceof AiDocumentMismatchError) {
      aiRouting?.handleMismatch(error.detail, {
        currentSectionId: sectionId,
        uploadScope,
      });
      return null;
    }

    if (error instanceof AiDocumentUnavailableError) {
      aiRouting?.clearAllPendingForFile(file_id);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('orderly-ai-document-consumed', {
            detail: {
              sectionId,
              uploadScope,
              fileId: file_id,
            },
          }),
        );
      }

      throw error;
    }

    throw error;
  }
}
