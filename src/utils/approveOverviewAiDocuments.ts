/**
 * Approve overview Review & fill: persist only checked sections,
 * applying person destination for ID / health cards when chosen.
 */

import { toast } from 'sonner';
import type { OverviewApprovePayload } from '@/components/ai/AiOverviewReadMatchDialog';
import {
  listDashboardAiPatches,
  markDashboardAiPatchPersisted,
  takeDashboardAiPatch,
  type StashedAiPatch,
} from '@/utils/aiDashboardPatchCache';
import { persistAiResultToSectionBackground } from '@/services/aiBackgroundSectionPersist';
import { markAiSectionReviewed } from '@/utils/aiSectionReviewState';
import { markAiSectionFilled } from '@/utils/aiSectionFillGuard';
import { markAiAutofillDoneForSection } from '@/utils/aiAutofillDoneSections';
import { AI_SECTION_BY_ID } from '@/utils/aiSectionRegistry';
import {
  applyIdentityPersonChoice,
  extractIdentityPersonName,
  isIdentityDocumentCandidate,
} from '@/utils/aiIdentityDocument';
import {
  applyInsurancePersonChoice,
  extractInsuranceMemberName,
  isHealthInsuranceCardCandidate,
} from '@/utils/aiInsuranceDocument';
import type { IdentityPersonChoice } from '@/utils/aiIdentityDocument';

function patchesForFile(fileId?: string): StashedAiPatch[] {
  if (!fileId) return [];
  return listDashboardAiPatches().filter(entry => entry.file_id === fileId);
}

async function persistOne(args: {
  sectionId: string;
  sectionKey: string;
  subsection?: string | null;
  result: unknown;
  fileId?: string;
  fileName?: string;
}) {
  const saved = await persistAiResultToSectionBackground({
    sectionId: args.sectionId,
    sectionKey: args.sectionKey,
    result: args.result,
    subsection: args.subsection,
  });
  if (!saved.ok) {
    throw new Error(saved.error || `Could not save section ${args.sectionId}`);
  }
  markDashboardAiPatchPersisted(args.sectionId, args.fileId);
  markAiSectionFilled(args.sectionId);
  markAiAutofillDoneForSection({
    sectionId: args.sectionId,
    fileId: args.fileId,
    fileName: args.fileName,
  });
  markAiSectionReviewed({
    sectionId: args.sectionId,
    fileId: args.fileId,
  });
}

export async function approveOverviewAiDocuments(
  payload: OverviewApprovePayload,
): Promise<{ saved: number; failed: number }> {
  let saved = 0;
  let failed = 0;

  for (const doc of payload.documents) {
    const patches = patchesForFile(doc.fileId);
    if (!patches.length && !doc.selectedSectionIds.length) continue;

    const personChoice = (doc.personChoice || 'self') as IdentityPersonChoice;
    const primary =
      patches.find(p => doc.selectedSectionIds.includes(p.section_id)) ||
      patches[0] ||
      null;

    const needsIdentity =
      primary &&
      isIdentityDocumentCandidate({
        sectionId: primary.section_id,
        sectionKey: primary.section_key,
        documentSummary: primary.document_summary,
        fileName: doc.fileName || primary.file_name,
        result: primary.result,
      });

    const needsInsurance =
      primary &&
      isHealthInsuranceCardCandidate({
        sectionId: primary.section_id,
        sectionKey: primary.section_key,
        documentSummary: primary.document_summary,
        fileName: doc.fileName || primary.file_name,
        result: primary.result,
      });

    // Person remap for ID / insurance (may change destination section).
    if (primary && (needsIdentity || needsInsurance) && personChoice) {
      try {
        const remapped = needsInsurance
          ? applyInsurancePersonChoice(personChoice, {
              sectionId: primary.section_id,
              sectionKey: primary.section_key,
              subsection: primary.subsection,
              sectionLabel: AI_SECTION_BY_ID[primary.section_id]?.label,
              result: primary.result,
            })
          : applyIdentityPersonChoice(personChoice, {
              sectionId: primary.section_id,
              sectionKey: primary.section_key,
              subsection: primary.subsection,
              sectionLabel: AI_SECTION_BY_ID[primary.section_id]?.label,
              result: primary.result,
              documentSummary: primary.document_summary,
              fileName: doc.fileName || primary.file_name,
            });

        // If remapped away from original, drop the old stash and persist new target.
        if (remapped.sectionId !== primary.section_id) {
          takeDashboardAiPatch(primary.section_id, primary.file_id);
          await persistOne({
            sectionId: remapped.sectionId,
            sectionKey: remapped.sectionKey,
            subsection: remapped.subsection,
            result: remapped.result,
            fileId: doc.fileId || primary.file_id,
            fileName: doc.fileName,
          });
          saved += 1;
        } else if (doc.selectedSectionIds.includes(primary.section_id)) {
          await persistOne({
            sectionId: remapped.sectionId,
            sectionKey: remapped.sectionKey,
            subsection: remapped.subsection,
            result: remapped.result,
            fileId: doc.fileId || primary.file_id,
            fileName: doc.fileName,
          });
          takeDashboardAiPatch(primary.section_id, primary.file_id);
          saved += 1;
        }
      } catch (error) {
        console.warn('Overview person remap persist failed', error);
        failed += 1;
      }
    }

    for (const sectionId of doc.selectedSectionIds) {
      // Already handled as remapped primary.
      if (
        primary &&
        (needsIdentity || needsInsurance) &&
        sectionId === primary.section_id
      ) {
        continue;
      }

      const stash = patches.find(p => p.section_id === sectionId);
      if (!stash?.result) continue;
      if (stash.vault_persisted) {
        markAiSectionReviewed({ sectionId, fileId: stash.file_id });
        continue;
      }

      try {
        await persistOne({
          sectionId,
          sectionKey:
            stash.section_key || AI_SECTION_BY_ID[sectionId]?.key || '',
          subsection: stash.subsection,
          result: stash.result,
          fileId: stash.file_id || doc.fileId,
          fileName: doc.fileName || stash.file_name,
        });
        takeDashboardAiPatch(sectionId, stash.file_id);
        saved += 1;
      } catch (error) {
        console.warn('Overview section persist failed', sectionId, error);
        failed += 1;
      }
    }
  }

  if (saved > 0) {
    toast.success(
      saved > 1
        ? `Saved ${saved} section fills to your vault`
        : 'Saved to your vault',
    );
  }
  if (failed > 0) {
    toast.error(
      failed > 1
        ? `${failed} sections could not be saved. Check Vault Activity.`
        : 'One section could not be saved. Check Vault Activity.',
    );
  }
  if (saved === 0 && failed === 0) {
    toast.message('Nothing selected to fill');
  }

  return { saved, failed };
}

export function detectOverviewPersonPrompt(args: {
  fileId?: string;
  fileName?: string;
  documentSummary?: string;
  sectionId?: string;
}): {
  needsPersonChoice: boolean;
  personPromptKind?: 'identity' | 'insurance';
  personName?: string | null;
} {
  const patches = patchesForFile(args.fileId);
  const primary =
    patches.find(p => p.section_id === args.sectionId) || patches[0] || null;
  if (!primary) {
    return { needsPersonChoice: false };
  }

  const base = {
    sectionId: primary.section_id,
    sectionKey: primary.section_key,
    documentSummary: args.documentSummary || primary.document_summary,
    fileName: args.fileName || primary.file_name,
    result: primary.result,
  };

  if (isHealthInsuranceCardCandidate(base)) {
    return {
      needsPersonChoice: true,
      personPromptKind: 'insurance',
      personName: extractInsuranceMemberName(primary.result),
    };
  }
  if (isIdentityDocumentCandidate(base)) {
    return {
      needsPersonChoice: true,
      personPromptKind: 'identity',
      personName: extractIdentityPersonName(primary.result),
    };
  }
  return { needsPersonChoice: false };
}
