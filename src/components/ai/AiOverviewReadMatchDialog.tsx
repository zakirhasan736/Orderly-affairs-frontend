'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  FileSearch,
  Layers3,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { cn } from '@common/ui/utils';
import { AI_ROUTING_DIALOG_SHEET } from '@/utils/aiMobileUi';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import type { DetectedAiFact } from '@/utils/aiDashboardPatchCache';
import {
  aiNoFieldsMessage,
  aiReadSourceDetail,
  aiReadSourceShort,
  aiReadSourceTitle,
} from '@/utils/aiReadSourceLabels';

export type OverviewMatchedSection = {
  sectionId: string;
  sectionLabel?: string;
  summary?: string;
  factCount?: number;
};

export type OverviewDocumentReview = {
  id: string;
  fileName: string;
  documentSummary?: string;
  facts: DetectedAiFact[];
  matchedSections: OverviewMatchedSection[];
  readSource?: 'system' | 'gemini' | 'cache';
  extractMethod?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: OverviewDocumentReview[];
  onOpenSection: (sectionId: string) => void;
};

function uniqueFacts(facts: DetectedAiFact[]) {
  const seen = new Set<string>();
  const list: DetectedAiFact[] = [];
  for (const fact of facts) {
    const key = `${fact.label}|${fact.value}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(fact);
  }
  return list;
}

export function AiOverviewReadMatchDialog({
  open,
  onOpenChange,
  documents,
  onOpenSection,
}: Props) {
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const firstDocId = documents[0]?.id || null;

  useEffect(() => {
    if (!open) return;
    setOpenDocId(firstDocId);
    // Intentionally only re-seed when dialog opens or first doc changes —
    // `documents` array identity changes every parent render and caused
    // Maximum update depth with Radix Dialog presence.
  }, [open, firstDocId]);

  const totalFacts = useMemo(
    () => documents.reduce((sum, doc) => sum + uniqueFacts(doc.facts).length, 0),
    [documents],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(AI_ROUTING_DIALOG_SHEET, 'md:max-w-3xl')}>
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7eef7] text-[#2B5A8C]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[#213D59]">
                {documents.length <= 1
                  ? 'Document read complete'
                  : `${documents.length} documents read`}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Open each document to review what we read and which vault
                sections were matched. Only one card stays open at a time.
              </DialogDescription>
            </div>
          </div>
          {documents.length > 1 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {totalFacts} fields across {documents.length} files — expand a
              card below.
            </p>
          ) : null}
        </DialogHeader>

        <div className="max-h-[min(62vh,560px)] space-y-2 overflow-y-auto pr-0.5">
          {documents.map((doc, index) => {
            const isOpen = openDocId === doc.id;
            const facts = uniqueFacts(doc.facts);
            return (
              <article
                key={doc.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-[#f5f8fc]"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenDocId(current =>
                      current === doc.id ? null : doc.id,
                    )
                  }
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#213D59] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[#213D59]">
                      {doc.fileName || `Document ${index + 1}`}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {facts.length} fields · {doc.matchedSections.length}{' '}
                      section
                      {doc.matchedSections.length === 1 ? '' : 's'} ·{' '}
                      {aiReadSourceShort(doc.readSource)}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-slate-400 transition',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>

                {isOpen ? (
                  <div className="space-y-3 border-t border-slate-100 px-3 pb-3 pt-3">
                    {doc.documentSummary ? (
                      <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {doc.documentSummary}
                      </p>
                    ) : null}

                    <p
                      className={cn(
                        'rounded-xl px-3 py-2 text-xs font-semibold',
                        doc.readSource === 'system'
                          ? 'bg-emerald-50 text-emerald-800'
                          : doc.readSource === 'cache'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-[#e7eef7] text-[#213D59]',
                      )}
                    >
                      {aiReadSourceTitle(doc.readSource)}
                      <span className="mt-0.5 block font-normal opacity-90">
                        {aiReadSourceDetail(doc.readSource)}
                      </span>
                    </p>

                    <div className="grid gap-3 md:grid-cols-2">
                      <section className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 border-b border-slate-100 bg-[#f5f8fc] px-3 py-2">
                          <FileSearch className="h-3.5 w-3.5 text-[#2B5A8C]" />
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#213D59]">
                            Fields we read
                          </h3>
                          <span className="ml-auto text-[11px] font-semibold text-slate-400">
                            {facts.length}
                          </span>
                        </div>
                        <ul className="max-h-52 space-y-1.5 overflow-y-auto p-2.5">
                          {facts.length === 0 ? (
                            <li className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500">
                              {aiNoFieldsMessage()}
                            </li>
                          ) : (
                            facts.map(fact => (
                              <li
                                key={`${fact.label}:${fact.value}`}
                                className="rounded-lg bg-slate-50 px-2.5 py-2 text-sm text-slate-700"
                              >
                                <span className="font-semibold text-[#213D59]">
                                  {fact.label}:
                                </span>{' '}
                                <span className="break-all">{fact.value}</span>
                              </li>
                            ))
                          )}
                        </ul>
                      </section>

                      <section className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 border-b border-slate-100 bg-[#f5f8fc] px-3 py-2">
                          <Layers3 className="h-3.5 w-3.5 text-[#2B5A8C]" />
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#213D59]">
                            Matched sections
                          </h3>
                          <span className="ml-auto text-[11px] font-semibold text-slate-400">
                            {doc.matchedSections.length}
                          </span>
                        </div>
                        <ul className="max-h-52 space-y-2 overflow-y-auto p-2.5">
                          {doc.matchedSections.length === 0 ? (
                            <li className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500">
                              No vault sections matched yet.
                            </li>
                          ) : (
                            doc.matchedSections.map(section => {
                              const label =
                                section.sectionLabel ||
                                getAiSectionLabel(section.sectionId) ||
                                `Section ${section.sectionId}`;
                              return (
                                <li key={section.sectionId}>
                                  <button
                                    type="button"
                                    className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-[#2B5A8C]/40 hover:bg-[#e7eef7]/50"
                                    onClick={() => {
                                      onOpenChange(false);
                                      onOpenSection(section.sectionId);
                                    }}
                                  >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#213D59] text-[11px] font-bold text-white">
                                      {section.sectionId}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block font-semibold text-[#213D59]">
                                        {label}
                                      </span>
                                      <span className="mt-0.5 block text-xs text-slate-500">
                                        {section.summary ||
                                          (section.factCount
                                            ? `${section.factCount} fields ready`
                                            : 'Ready to review')}
                                      </span>
                                    </span>
                                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                                  </button>
                                </li>
                              );
                            })
                          )}
                        </ul>
                      </section>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <p className="text-xs text-slate-500">
            Sidebar shows New data on matched sections until you open and review
            them.
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
