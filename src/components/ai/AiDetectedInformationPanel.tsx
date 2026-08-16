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
import { isAiAutofillDoneForSection } from '@/utils/aiAutofillDoneSections';

function dedupeOpenUploads(uploads: AiPendingUpload[]) {
  const seen = new Set<string>();
  const result: AiPendingUpload[] = [];

  for (const upload of uploads) {
    // Skip only when THIS document already filled the section.
    if (
      isAiAutofillDoneForSection(upload.targetSectionId, upload.file_id)
    ) {
      continue;
    }
    // One card per document×section (not one per section).
    const key = `${upload.file_id}::${upload.targetSectionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(upload);
  }

  return result.sort((a, b) => {
    if (a.highlightUpload !== b.highlightUpload) {
      return a.highlightUpload ? -1 : 1;
    }
    return b.createdAt - a.createdAt;
  });
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
    () => dedupeOpenUploads(routing?.pendingUploads || []),
    [routing?.pendingUploads, stashTick],
  );

  const factsBySection = useMemo(() => {
    const map = new Map<string, DetectedAiFact[]>();
    listDashboardAiPatches().forEach(entry => {
      if (isAiAutofillDoneForSection(entry.section_id, entry.file_id)) return;
      const facts = entry.detectedFields || [];
      if (!facts.length) return;
      // Prefer newest open doc per section for the fact preview strip.
      if (!map.has(entry.section_id)) {
        map.set(entry.section_id, facts.slice(0, 8));
      }
    });
    return map;
  }, [stashTick, detected]);

  if (!detected.length && !factsBySection.size) {
    return null;
  }

  const cards =
    detected.length > 0
      ? detected
      : listDashboardAiPatches()
          .filter(
            entry =>
              !isAiAutofillDoneForSection(entry.section_id, entry.file_id),
          )
          .map(entry => ({
            targetSectionId: entry.section_id,
            file_id: entry.file_id,
            documentSummary: entry.document_summary,
            extractedFields: entry.detectedFields,
            highlightUpload: true,
            createdAt: entry.createdAt,
          }));

  const primary = cards[0];
  const rest = cards.slice(1);

  if (!primary) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#7688a1]/40 bg-[#EAF6FD]/50 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-3 sm:mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF6FD] text-[#2E7FAD]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-kicker text-[#2E7FAD]">
            Detected data
          </p>
          <h3 className="text-lg font-semibold text-[#213D59]">
            {cards.length === 1
              ? 'Matched section ready to review'
              : `${cards.length} matched sections — review one at a time`}
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        <div
          key={`${primary.targetSectionId}:${primary.file_id}`}
          className="flex flex-col justify-between rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-sm sm:p-4"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <FileText className="h-4 w-4 text-[#2E7FAD]" />
              <span className="font-semibold text-[#213D59]">
                {getAiSectionLabel(primary.targetSectionId)}
              </span>
              <span className="rounded-full bg-[#EAF6FD] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#2E7FAD]">
                Next
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {(factsBySection.get(primary.targetSectionId) || []).length > 0
                ? `${(factsBySection.get(primary.targetSectionId) || []).length} fields from your upload`
                : primary.documentSummary ||
                  'Document saved for this section'}
            </p>
            {(factsBySection.get(primary.targetSectionId) || []).length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {(factsBySection.get(primary.targetSectionId) || [])
                  .slice(0, 5)
                  .map(fact => (
                    <li
                      key={`${fact.label}:${fact.value}`}
                      className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
                    >
                      <span className="font-semibold text-[#213D59]">
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
                  'mt-3 border-[#2B5A8C]/30 bg-[#EAF6FD]/60 hover:bg-[#EAF6FD] sm:mt-4',
                )}
                onClick={() => {
                  const sectionId = primary.targetSectionId;
                  const pending =
                    routing?.getPendingUploadsForSection(sectionId)?.[0];
                  if (pending && routing) {
                    routing.navigateToPendingSection(pending, 'autofill');
                    return;
                  }
                  onNavigateToSection?.(sectionId);
                }}
              >
                Open {getAiSectionLabel(primary.targetSectionId)}
              </Button>
            </div>

        {rest.length > 0 ? (
          <div className="rounded-xl border border-dashed border-[#2B5A8C]/30 bg-white/70 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5a6b80]">
              After that
            </p>
            <ul className="mt-1.5 space-y-1">
              {rest.map(upload => {
                const label = getAiSectionLabel(upload.targetSectionId);
                return (
                  <li key={`${upload.targetSectionId}:${upload.file_id}`}>
                    <button
                      type="button"
                      className="flex w-full min-h-11 items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-left text-sm text-[#213D59] hover:bg-[#EAF6FD]/80"
                      onClick={() => {
                        const pending =
                          routing?.getPendingUploadsForSection(
                            upload.targetSectionId,
                          )?.[0];
                        if (pending && routing) {
                          routing.navigateToPendingSection(pending, 'autofill');
                          return;
                        }
                        onNavigateToSection?.(upload.targetSectionId);
                      }}
                    >
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-slate-400">Open</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
