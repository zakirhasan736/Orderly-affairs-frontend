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

type RunAiAutofillArgs = {
  sectionKey: string;
  sectionId: string;
  file_id: string;
  mime_type?: string;
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
  subsection,
  uploadScope = 'full',
  useRoutedCache,
  fields,
  aiRouting,
}: RunAiAutofillArgs) {
  try {
    // Overview already filled + saved this section — never hit the temp document API again.
    if (isAiAutofillDoneForSection(sectionId)) {
      markAiSectionFilled(sectionId);
      return {
        result: peekDashboardAiPatch(sectionId)?.result || { patch: {} },
        document_summary: 'Auto fill already completed for this section.',
        additional_sections: undefined,
        section_previews: undefined,
        document_deleted: true,
        already_filled: true,
      };
    }

    const peeked = peekDashboardAiPatch(sectionId);
    // Prefer temp-stored extraction for this exact section (overview upload path).
    if (
      peeked?.result &&
      (!file_id || !peeked.file_id || peeked.file_id === file_id)
    ) {
      const stashedPatch = unwrapAiAutofillPatch(peeked.result);
      if (aiPatchHasValues(stashedPatch)) {
        const stashed = takeDashboardAiPatch(sectionId);
        if (stashed) {
          const json = {
            result: stashed.result as any,
            document_summary: stashed.document_summary,
            additional_sections: undefined,
            section_previews: undefined,
            document_deleted: false,
          };

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

          return json;
        }
      }
      // Empty stash — drop it and try a live extraction.
      takeDashboardAiPatch(sectionId);
    }

    const json = await autofillSectionFromDocument({
      section: sectionKey,
      file_id,
      subsection,
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

    markAiSectionFilled(sectionId);
    markAiAutofillDoneForSection({
      sectionId,
      fileId: file_id,
    });
    aiRouting?.handleAutofillSuccess({
      file_id,
      mime_type: mime_type || 'application/pdf',
      currentSectionId: sectionId,
      uploadScope,
      additional_sections: json.additional_sections,
      section_previews: json.section_previews,
      document_summary: json.document_summary,
      document_deleted: json.document_deleted,
      deferAdditionalDialog: true,
    });

    return json;
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
