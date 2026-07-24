'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { cn } from '@common/ui/utils';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import type { AiPendingUpload } from '@/utils/aiDocumentRouting';
import { AI_MOBILE_ACTION_BUTTON } from '@/utils/aiMobileUi';
import {
  listDashboardAiPatches,
  type DetectedAiFact,
} from '@/utils/aiDashboardPatchCache';

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

export function AiDetectedInformationPanel({
  onNavigateToSection,
}: {
  onNavigateToSection?: (sectionId: string) => void;
}) {
  const routing = useOptionalAiDocumentRouting();
  const [stashTick, setStashTick] = useState(0);

  useEffect(() => {
    const onStash = () => setStashTick(value => value + 1);
    window.addEventListener('orderly-ai-patch-stashed', onStash);
    return () => window.removeEventListener('orderly-ai-patch-stashed', onStash);
  }, []);

  const detected = useMemo(
    () => dedupeHighlightedUploads(routing?.pendingUploads || []),
    [routing?.pendingUploads, stashTick],
  );

  const factsBySection = useMemo(() => {
    const map = new Map<string, DetectedAiFact[]>();
    listDashboardAiPatches().forEach(entry => {
      const facts = entry.detectedFields || [];
      if (!facts.length) return;
      map.set(entry.section_id, facts.slice(0, 8));
    });
    return map;
  }, [stashTick, detected]);

  if (!detected.length && !factsBySection.size) {
    return null;
  }

  const cards =
    detected.length > 0
      ? detected
      : listDashboardAiPatches().map(entry => ({
          targetSectionId: entry.section_id,
          file_id: entry.file_id,
          documentSummary: entry.document_summary,
          extractedFields: entry.detectedFields,
          highlightUpload: true,
          createdAt: entry.createdAt,
        }));

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/40 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-3 sm:mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Detected data (temporary)
          </p>
          <h3 className="text-lg font-semibold text-[#10213f]">
            Matched fields ready to place
          </h3>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
        {cards.map(upload => {
          const sectionId = upload.targetSectionId;
          const label = getAiSectionLabel(sectionId);
          const facts =
            factsBySection.get(sectionId) ||
            (upload.extractedFields as DetectedAiFact[] | undefined) ||
            [];
          const fieldCount = facts.length;

          return (
            <div
              key={`${sectionId}:${upload.file_id}`}
              className="flex flex-col justify-between rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-sm sm:p-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-[#10213f]">{label}</span>
                </div>
                <p className="text-sm text-slate-600">
                  {fieldCount > 0
                    ? `${fieldCount} field${fieldCount === 1 ? '' : 's'} visualized from your upload`
                    : upload.documentSummary ||
                      'Document saved for this section'}
                </p>
                {facts.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {facts.slice(0, 5).map(fact => (
                      <li
                        key={`${fact.label}:${fact.value}`}
                        className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
                      >
                        <span className="font-semibold text-[#10213f]">
                          {fact.label}:
                        </span>{' '}
                        <span className="break-all">{fact.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className={cn(
                  AI_MOBILE_ACTION_BUTTON,
                  'mt-3 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 sm:mt-4',
                )}
                onClick={() => {
                  const pending =
                    routing?.getPendingUploadsForSection(sectionId)?.[0];
                  if (pending && routing) {
                    routing.navigateToPendingSection(pending, 'autofill');
                    return;
                  }
                  onNavigateToSection?.(sectionId);
                }}
              >
                Open {label}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
