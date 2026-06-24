'use client';

import React, { useMemo } from 'react';
import { MapPin, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { useAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import type { AiPendingUpload } from '@/utils/aiDocumentRouting';
import {
  AI_MOBILE_ACTION_BUTTON,
  AI_MOBILE_FLOATING_STACK,
} from '@/utils/aiMobileUi';

function dedupeHighlightedUploads(uploads: AiPendingUpload[]) {
  const seen = new Set<string>();
  const result: AiPendingUpload[] = [];

  for (const upload of uploads) {
    if (!upload.highlightUpload) continue;
    const key = upload.targetSectionId;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(upload);
  }

  return result;
}

export function AiRoutingFloatingNotifications() {
  const {
    pendingUploads,
    navigateToPendingSection,
    dismissHighlight,
    currentSectionId,
  } = useAiDocumentRouting();

  const notifications = useMemo(
    () =>
      dedupeHighlightedUploads(pendingUploads).filter(
        item => item.targetSectionId !== currentSectionId,
      ),
    [currentSectionId, pendingUploads],
  );

  if (!notifications.length) {
    return null;
  }

  return (
    <div className={AI_MOBILE_FLOATING_STACK}>
      {notifications.map(upload => {
        const label = getAiSectionLabel(upload.targetSectionId);
        const fieldCount = upload.extractedFields?.length ?? 0;

        return (
          <div
            key={`${upload.targetSectionId}:${upload.file_id}`}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-indigo-200/90 bg-white/95 shadow-xl shadow-slate-900/15 backdrop-blur-sm sm:shadow-lg"
          >
            <div className="flex items-start gap-3 p-3.5 sm:p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <MapPin className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  Information found for {label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {upload.documentSummary ||
                    (fieldCount > 0
                      ? `${fieldCount} field${fieldCount === 1 ? '' : 's'} ready to fill`
                      : 'Document ready — auto-fill when you arrive')}
                </p>
              </div>

              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 touch-manipulation"
                aria-label={`Dismiss ${label} notification`}
                onClick={() =>
                  dismissHighlight(upload.targetSectionId, upload.uploadScope)
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
                onClick={() => navigateToPendingSection(upload, 'autofill')}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Go to {label}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
