'use client';

import React, { useMemo } from 'react';
import { MapPin, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { useAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import {
  isAiPendingUploadConsumed,
  type AiPendingUpload,
} from '@/utils/aiDocumentRouting';
import { isAiAutofillDoneForSection } from '@/utils/aiAutofillDoneSections';
import {
  AI_MOBILE_ACTION_BUTTON,
  AI_MOBILE_FLOATING_STACK,
} from '@/utils/aiMobileUi';

function isSectionDoneForUpload(sectionId: string, fileId?: string) {
  if (!isAiAutofillDoneForSection(sectionId)) return false;
  // Autofill-done for this section means the card should not keep nagging.
  void fileId;
  return true;
}

/**
 * One card at a time: the next unfilled related section.
 * Stacked multi-section popups were confusing after partner autofill.
 */
function pickNextNotification(
  uploads: AiPendingUpload[],
  currentSectionId: string,
): { active: AiPendingUpload | null; remaining: number } {
  const candidates = uploads
    .filter(upload => {
      if (upload.targetSectionId === currentSectionId) return false;
      if (isSectionDoneForUpload(upload.targetSectionId, upload.file_id)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.highlightUpload !== b.highlightUpload) {
        return a.highlightUpload ? -1 : 1;
      }
      return a.createdAt - b.createdAt;
    });

  if (!candidates.length) return { active: null, remaining: 0 };

  const active = candidates[0];
  const remaining = candidates.filter(
    item => item.targetSectionId !== active.targetSectionId,
  ).length;

  return { active, remaining };
}

export function AiRoutingFloatingNotifications() {
  const {
    pendingUploads,
    navigateToPendingSection,
    dismissHighlight,
    currentSectionId,
    batchSilentMode,
  } = useAiDocumentRouting();

  const { active, remaining } = useMemo(
    () => pickNextNotification(pendingUploads, currentSectionId),
    [currentSectionId, pendingUploads],
  );

  // Overview batch upload fills silently via task cards — no floating popups.
  if (batchSilentMode || currentSectionId === 'dashboard' || !active) {
    return null;
  }

  // Safety: never show a card for data already filled.
  if (
    isAiPendingUploadConsumed(active, {}, isSectionDoneForUpload) ||
    isAiAutofillDoneForSection(active.targetSectionId)
  ) {
    return null;
  }

  const label = getAiSectionLabel(active.targetSectionId);
  const fieldCount = active.extractedFields?.length ?? 0;

  return (
    <div className={AI_MOBILE_FLOATING_STACK}>
      <div
        key={`${active.targetSectionId}:${active.file_id}`}
        className="pointer-events-auto overflow-hidden rounded-2xl border border-indigo-200/90 bg-white/95 shadow-xl shadow-slate-900/15 backdrop-blur-sm sm:shadow-lg"
      >
        <div className="flex items-start gap-3 p-3.5 sm:p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <MapPin className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              Next: {label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {active.documentSummary ||
                (fieldCount > 0
                  ? `${fieldCount} field${fieldCount === 1 ? '' : 's'} ready to review`
                  : 'Related data from your upload — open to review')}
            </p>
            {remaining > 0 ? (
              <p className="mt-1 text-[11px] font-medium text-slate-400">
                +{remaining} more section{remaining === 1 ? '' : 's'} after this
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 touch-manipulation"
            aria-label={`Dismiss ${label} notification`}
            onClick={() =>
              dismissHighlight(active.targetSectionId, active.uploadScope)
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/90 px-3.5 py-3 sm:px-4">
          <Button
            type="button"
            size="sm"
            className={AI_MOBILE_ACTION_BUTTON}
            onClick={() => navigateToPendingSection(active, 'autofill')}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Go to {label}
          </Button>
        </div>
      </div>
    </div>
  );
}
