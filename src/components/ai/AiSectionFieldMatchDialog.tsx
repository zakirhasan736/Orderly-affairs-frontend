'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleDashed,
  FileSearch,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { Input } from '@/components/common/ui/input';
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
  buildFieldMatchRows,
  averageMatchConfidence,
  countEditableEmptyRows,
  countUnfilledAiRows,
} from '@/utils/aiFieldMatchReview';
import { aiNoFieldsMessage } from '@/utils/aiReadSourceLabels';
import { AI_SECTION_BY_ID } from '@/utils/aiSectionRegistry';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  subsection?: string | null;
  fileName?: string;
  documentSummary?: string;
  facts: DetectedAiFact[];
  sectionData: unknown;
  /** Apply remaining AI patch into the section form. */
  onApplyRemaining: () => void | Promise<void>;
  /** Save manual edits made in this popup (fieldKey → text). */
  onSaveEdits: (edits: Record<string, string>) => void | Promise<void>;
  onCloseReviewed: () => void;
  applying?: boolean;
};

function StatusPill({ status }: { status: 'filled' | 'available' | 'empty' }) {
  if (status === 'filled') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Filled
      </span>
    );
  }
  if (status === 'available') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
        <Sparkles className="h-3 w-3" />
        Can fill
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      <CircleDashed className="h-3 w-3" />
      Empty
    </span>
  );
}

export function AiSectionFieldMatchDialog({
  open,
  onOpenChange,
  sectionId,
  subsection,
  fileName,
  documentSummary,
  facts,
  sectionData,
  onApplyRemaining,
  onSaveEdits,
  onCloseReviewed,
  applying = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const rows = useMemo(
    () =>
      buildFieldMatchRows({
        sectionId,
        subsection,
        sectionData,
        facts,
      }),
    [sectionId, subsection, sectionData, facts],
  );

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string> = {};
    const built = buildFieldMatchRows({
      sectionId,
      subsection,
      sectionData,
      facts,
    });
    built.forEach(row => {
      next[row.fieldKey] =
        row.currentValue ||
        (row.status === 'available' && row.aiValue ? row.aiValue : '') ||
        '';
    });
    setDrafts(next);
    // Only seed drafts when the dialog opens for a section/file.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sectionId, fileName]);

  const unfilledCount = countUnfilledAiRows(rows);
  const editableCount = countEditableEmptyRows(rows);
  const avgConfidence = averageMatchConfidence(rows);
  const sectionLabel = getAiSectionLabel(sectionId) || `Section ${sectionId}`;
  const subsectionLabel =
    subsection ||
    AI_SECTION_BY_ID[sectionId]?.defaultSubsection ||
    null;

  const dirtyEdits = useMemo(() => {
    const edits: Record<string, string> = {};
    rows.forEach(row => {
      const draft = (drafts[row.fieldKey] || '').trim();
      const current = (row.currentValue || '').trim();
      if (draft && draft !== current) {
        edits[row.fieldKey] = draft;
      }
    });
    return edits;
  }, [drafts, rows]);

  const handleClose = () => {
    onCloseReviewed();
    onOpenChange(false);
  };

  const handleApplyAi = async () => {
    setBusy(true);
    try {
      await onApplyRemaining();
      onCloseReviewed();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdits = async () => {
    setBusy(true);
    try {
      await onSaveEdits(dirtyEdits);
      onCloseReviewed();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) {
          onCloseReviewed();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className={cn(AI_ROUTING_DIALOG_SHEET, 'md:max-w-3xl')}>
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7eef7] text-[#2B5A8C]">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[#213D59]">
                Review & fill · {sectionLabel}
                {subsectionLabel ? (
                  <span className="font-normal text-slate-500">
                    {' '}
                    · {subsectionLabel}
                  </span>
                ) : null}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Left: fields we read from your document. Right: this section’s
                form fields (including subsection groups) with match confidence.
              </DialogDescription>
            </div>
          </div>
          {documentSummary ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {documentSummary}
            </p>
          ) : null}
          {avgConfidence > 0 ? (
            <p className="text-xs font-semibold text-[#213D59]">
              Average field match confidence: {avgConfidence}%
            </p>
          ) : null}
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-[#f5f8fc] px-3 py-2.5">
              <FileSearch className="h-4 w-4 text-[#2B5A8C]" />
              <h3 className="text-sm font-semibold text-[#213D59]">
                What we read
              </h3>
            </div>
            <ul className="max-h-[min(44vh,340px)] space-y-1.5 overflow-y-auto p-3">
              {facts.length === 0 ? (
                <li className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
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

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-[#f5f8fc] px-3 py-2.5">
              <ListChecks className="h-4 w-4 text-[#2B5A8C]" />
              <h3 className="text-sm font-semibold text-[#213D59]">
                This section’s fields
              </h3>
            </div>
            <ul className="max-h-[min(44vh,340px)] space-y-2 overflow-y-auto p-3">
              {rows.length === 0 ? (
                <li className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                  No fields listed for this section.
                </li>
              ) : (
                rows.map(row => {
                  const editable =
                    row.status === 'empty' || row.status === 'available';
                  return (
                    <li
                      key={row.fieldKey}
                      className={cn(
                        'rounded-lg px-2.5 py-2 text-sm',
                        row.status === 'filled' && 'bg-emerald-50/80',
                        row.status === 'available' && 'bg-amber-50/80',
                        row.status === 'empty' && 'bg-slate-50',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-[#213D59]">
                          {row.fieldLabel}
                        </span>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StatusPill status={row.status} />
                          {row.matchConfidence > 0 ? (
                            <span className="text-[10px] font-semibold tabular-nums text-slate-500">
                              Match {row.matchConfidence}%
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {editable ? (
                        <div className="mt-2 space-y-1.5">
                          <Input
                            value={drafts[row.fieldKey] ?? ''}
                            onChange={event =>
                              setDrafts(prev => ({
                                ...prev,
                                [row.fieldKey]: event.target.value,
                              }))
                            }
                            placeholder={
                              row.aiValue
                                ? `AI suggests: ${row.aiValue}`
                                : 'Type value…'
                            }
                            className="h-9 rounded-lg bg-white text-sm"
                          />
                          {row.aiValue &&
                          (drafts[row.fieldKey] || '').trim() !==
                            row.aiValue.trim() ? (
                            <button
                              type="button"
                              className="text-[11px] font-semibold text-[#2B5A8C] hover:underline"
                              onClick={() =>
                                setDrafts(prev => ({
                                  ...prev,
                                  [row.fieldKey]: row.aiValue || '',
                                }))
                              }
                            >
                              Use AI value
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-1 break-all text-xs text-slate-600">
                          {row.currentValue || (
                            <span className="italic text-slate-400">
                              Not filled
                            </span>
                          )}
                        </p>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">
            {editableCount > 0
              ? `${editableCount} field${editableCount === 1 ? '' : 's'} can be edited here. Filled ones are locked as read-only.`
              : 'All listed fields already have values. You can close.'}
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {unfilledCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={busy || applying}
                onClick={() => void handleApplyAi()}
              >
                {busy || applying ? 'Filling…' : 'Fill all from AI'}
              </Button>
            ) : null}
            {Object.keys(dirtyEdits).length > 0 ? (
              <Button
                type="button"
                className="rounded-xl bg-[#213D59] hover:bg-[#1a3148]"
                disabled={busy || applying}
                onClick={() => void handleSaveEdits()}
              >
                {busy || applying ? 'Saving…' : 'Save edits'}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={handleClose}
            >
              {Object.keys(dirtyEdits).length > 0 || unfilledCount > 0
                ? 'Close'
                : 'Done'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
