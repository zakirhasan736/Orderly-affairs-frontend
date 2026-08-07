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
}: RunAiAutofillArgs) {
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

    const json = await autofillSectionFromDocument({
      section: sectionKey,
      file_id,
      subsection,
      // Client writes E2EE ciphertext; server AES merge cannot touch v3 rows.
      defer_persist: true,
      use_routed_cache: shouldUseRoutedCache(
        sectionId,
        file_id,
        uploadScope,
        aiRouting,
        useRoutedCache,
      ),
      // Merge local section fields with formConfig catalog so no keys are omitted.
      field_catalog: (() => {
        const local = fields?.length ? buildFieldCatalogForAi(fields) : [];
        const fromForm = getSectionFieldCatalog(sectionKey, null).catalog || [];
        const byKey = new Map<string, (typeof fromForm)[number]>();
        fromForm.forEach(item => {
          if (item?.key) byKey.set(item.key, item);
        });
        local.forEach(item => {
          if (item?.key) byKey.set(item.key, item);
        });
        return [...byKey.values()];
      })(),
    });

    const routed = await persistRoutedResult({
      result: json.result,
      documentSummary: json.document_summary,
    });

    return {
      ...routed,
      additional_sections: json.additional_sections,
      section_previews: json.section_previews,
      document_deleted: json.document_deleted,
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
