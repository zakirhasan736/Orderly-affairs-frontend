'use client';

import React, { useMemo } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { cn } from '@common/ui/utils';
import { useAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import type { AiPendingUpload } from '@/utils/aiDocumentRouting';
import { AI_MOBILE_ACTION_BUTTON } from '@/utils/aiMobileUi';

function dedupeHighlightedUploads(uploads: AiPendingUpload[]) {
  const seen = new Set<string>();
  const result: AiPendingUpload[] = [];

  for (const upload of uploads) {
    if (!upload.highlightUpload) continue;
    if (seen.has(upload.targetSectionId)) continue;
    seen.add(upload.targetSectionId);
    result.push(upload);
  }

  return result.sort((a, b) => b.createdAt - a.createdAt);
}

export function AiDetectedInformationPanel() {
  const { pendingUploads, navigateToPendingSection } = useAiDocumentRouting();

  const detected = useMemo(
    () => dedupeHighlightedUploads(pendingUploads),
    [pendingUploads],
  );

  if (!detected.length) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/50 p-4 shadow-sm sm:rounded-[28px] sm:p-6">
      <div className="mb-3 flex items-center gap-3 sm:mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Detected Information
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            Ready to review and fill
          </h3>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
        {detected.map(upload => {
          const label = getAiSectionLabel(upload.targetSectionId);
          const fieldCount = upload.extractedFields?.length ?? 0;

          return (
            <div
              key={`${upload.targetSectionId}:${upload.file_id}`}
              className="flex flex-col justify-between rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-sm sm:p-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span className="font-semibold text-slate-900">{label}</span>
                </div>
                <p className="text-sm text-slate-600">
                  {fieldCount > 0
                    ? `${fieldCount} field${fieldCount === 1 ? '' : 's'} ready to fill`
                    : upload.documentSummary || 'Document saved for this section'}
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className={cn(
                  AI_MOBILE_ACTION_BUTTON,
                  'mt-3 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 sm:mt-4',
                )}
                onClick={() => navigateToPendingSection(upload, 'autofill')}
              >
                Go to {label}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
