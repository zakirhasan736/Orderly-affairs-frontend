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
import type {
  DetectedAiFact,
  StashedAiPatch,
} from '@/utils/aiDashboardPatchCache';
import {
  buildFieldMatchRows,
  averageMatchConfidence,
  countEditableEmptyRows,
  countUnfilledAiRows,
} from '@/utils/aiFieldMatchReview';
import { aiNoFieldsMessage } from '@/utils/aiReadSourceLabels';
import { AI_SECTION_BY_ID } from '@/utils/aiSectionRegistry';
import { unwrapAiAutofillPatch } from '@/utils/aiPatchNormalizer';
import { flattenDetectedFactsFromPatch } from '@/utils/aiSemanticFieldMatch';
import { describeAutofillItem } from '@/utils/aiMultiItemAutofill';

export type MatchReviewDocument = {
  fileId?: string;
  fileName?: string;
  documentSummary?: string;
  facts: DetectedAiFact[];
  result?: unknown;
  subsection?: string | null;
  createdAt?: number;
  /** True when overview/background already wrote this extract into the vault. */
  alreadyAutoFilled?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  subsection?: string | null;
  /** One entry per uploaded document pending for this section. */
  documents: MatchReviewDocument[];
  sectionData: unknown;
  /** Apply every pending document into separate cards / fields. */
  onApplyAll: () => void | Promise<void>;
  /** Save manual edits for the currently selected document. */
  onSaveEdits: (
    edits: Record<string, string>,
    document: MatchReviewDocument,
  ) => void | Promise<void>;
  onCloseReviewed: () => void;
  applying?: boolean;
};

function StatusPill({ status }: { status: 'filled' | 'available' | 'empty' }) {
  if (status === 'filled') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        From document
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
      Still empty
    </span>
  );
}

function asTabText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['label', 'name', 'value', 'text', 'title']) {
      const nested = asTabText(record[key]);
      if (nested) return nested;
    }
  }
  return '';
}

function normalizeFactKey(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function itemFromMatchDocument(
  doc: MatchReviewDocument,
  sectionId: string,
): Record<string, unknown> {
  const item: Record<string, unknown> = {};

  (doc.facts || []).forEach(fact => {
    const keys = [
      normalizeFactKey(fact.field_key || ''),
      normalizeFactKey(fact.label || ''),
    ].filter(Boolean);
    keys.forEach(key => {
      if (!item[key] && fact.value) item[key] = fact.value;
    });
  });

  const patch = unwrapAiAutofillPatch(doc.result);
  const preferredKeys =
    sectionId === '5'
      ? ['5A']
      : sectionId === '7'
        ? ['7A']
        : doc.subsection
          ? [doc.subsection]
          : [];

  const tryCard = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return;
    const card = Array.isArray(raw)
      ? (raw.find(entry => entry && typeof entry === 'object') as
          | Record<string, unknown>
          | undefined)
      : (raw as Record<string, unknown>);
    if (!card) return;
    Object.entries(card).forEach(([key, value]) => {
      if (item[key] == null || item[key] === '') item[key] = value;
    });
  };

  preferredKeys.forEach(key => tryCard(patch[key]));
  if (!asTabText(item.make) && !asTabText(item.policy_company)) {
    Object.values(patch).forEach(value => {
      if (Array.isArray(value) || (value && typeof value === 'object')) {
        tryCard(value);
      }
    });
  }

  return item;
}

/** Toyota · Camry · 2020 — never bare "1" / "Document 1". */
function tabLabel(
  doc: MatchReviewDocument,
  index: number,
  sectionId: string,
) {
  const item = itemFromMatchDocument(doc, sectionId);

  if (sectionId === '5') {
    const parts = [item.make, item.model, item.year]
      .map(asTabText)
      .filter(Boolean);
    if (parts.length) return parts.join(' · ');
  }

  if (sectionId === '7') {
    const parts = [
      item.policy_company || item.insurance_company,
      item.policy_type,
      item.policy_number,
    ]
      .map(asTabText)
      .filter(Boolean);
    if (parts.length) return parts.join(' · ');
  }

  const described = describeAutofillItem(item, [
    'make',
    'model',
    'year',
    'policy_company',
    'insurance_company',
    'policy_type',
    'policy_number',
    'vin',
  ]);
  if (described && described !== 'Entry') return described;
  if (doc.fileName) return doc.fileName.replace(/\.[^.]+$/, '');
  return `Document ${index + 1}`;
}

export function stashToMatchDocument(stash: StashedAiPatch): MatchReviewDocument {
  const facts =
    stash.detectedFields && stash.detectedFields.length
      ? stash.detectedFields
      : flattenDetectedFactsFromPatch(
          unwrapAiAutofillPatch(stash.result),
          stash.section_key,
        );
  return {
    fileId: stash.file_id,
    fileName: stash.file_name,
    documentSummary: stash.document_summary,
    facts,
    result: stash.result,
    subsection: stash.subsection,
    createdAt: stash.createdAt,
    alreadyAutoFilled: Boolean(stash.vault_persisted),
  };
}

export function AiSectionFieldMatchDialog({
  open,
  onOpenChange,
  sectionId,
  subsection,
  documents,
  sectionData,
  onApplyAll,
  onSaveEdits,
  onCloseReviewed,
  applying = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);

  const docs = documents.length ? documents : [];
  const safeIndex = Math.min(activeIndex, Math.max(0, docs.length - 1));
  const activeDoc = docs[safeIndex] || null;

  const facts = activeDoc?.facts || [];
  const fileName = activeDoc?.fileName;
  const documentSummary = activeDoc?.documentSummary;

  const rows = useMemo(
    () =>
      buildFieldMatchRows({
        sectionId,
        subsection: activeDoc?.subsection || subsection,
        sectionData,
        facts,
      }),
    [sectionId, subsection, sectionData, facts, activeDoc?.subsection],
  );

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
  }, [open, sectionId, docs.map(d => d.fileId).join('|')]);

  useEffect(() => {
    if (!open || !activeDoc) return;
    const next: Record<string, string> = {};
    const built = buildFieldMatchRows({
      sectionId,
      subsection: activeDoc.subsection || subsection,
      sectionData,
      facts: activeDoc.facts || [],
    });
    built.forEach(row => {
      next[row.fieldKey] =
        row.currentValue ||
        (row.status === 'available' && row.aiValue ? row.aiValue : '') ||
        '';
    });
    setDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sectionId, safeIndex, activeDoc?.fileId]);

  const unfilledCount = countUnfilledAiRows(rows);
  const editableCount = countEditableEmptyRows(rows);
  const filledFromDocCount = rows.filter(row => row.status === 'filled').length;
  const canFillCount = rows.filter(row => row.status === 'available').length;
  const stillEmptyCount = rows.filter(row => row.status === 'empty').length;
  const avgConfidence = averageMatchConfidence(rows);
  const sectionLabel = getAiSectionLabel(sectionId) || `Section ${sectionId}`;
  const subsectionLabel =
    activeDoc?.subsection ||
    subsection ||
    AI_SECTION_BY_ID[sectionId]?.defaultSubsection ||
    null;
  const anyAlreadyAutoFilled = docs.some(doc => doc.alreadyAutoFilled);

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

  const hasDirtyEdits = Object.keys(dirtyEdits).length > 0;

  const handleClose = () => {
    onCloseReviewed();
    onOpenChange(false);
  };

  const handleApplyAi = async () => {
    setBusy(true);
    try {
      await onApplyAll();
      onCloseReviewed();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!activeDoc) return;
    setBusy(true);
    try {
      await onSaveEdits(dirtyEdits, activeDoc);
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
                {docs.length > 1
                  ? `${docs.length} documents ready — tabs are named by vehicle/policy (Toyota, Honda, Jeep…).`
                  : 'We read your uploaded document and matched it to this section.'}{' '}
                Fields may already be filled from that read. Review them, fill
                what is still empty, save edits, fill all documents, or skip to
                keep the auto-filled data.
              </DialogDescription>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 rounded-xl border border-[#c5d4e8] bg-[#eef3f9] px-3 py-2.5 text-xs text-[#213D59]">
            {anyAlreadyAutoFilled || filledFromDocCount > 0 ? (
              <span className="font-semibold">
                {filledFromDocCount} already filled from document
              </span>
            ) : (
              <span className="font-semibold">Ready to apply document data</span>
            )}
            {canFillCount > 0 ? (
              <span className="text-[#8a6a1a]">
                · {canFillCount} can still fill
              </span>
            ) : null}
            {stillEmptyCount > 0 ? (
              <span className="text-slate-600">
                · {stillEmptyCount} still empty
              </span>
            ) : null}
          </div>

          {docs.length > 1 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {docs.map((doc, index) => (
                <button
                  key={doc.fileId || `${doc.fileName}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    index === safeIndex
                      ? 'border-[#213D59] bg-[#213D59] text-white'
                      : 'border-slate-200 bg-white text-[#213D59] hover:border-[#213D59]/40',
                  )}
                >
                  {tabLabel(doc, index, sectionId)}
                  {doc.alreadyAutoFilled ? ' · filled' : ''}
                </button>
              ))}
            </div>
          ) : null}

          {documentSummary ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {docs.length > 1 ? (
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#2B5A8C]">
                  {tabLabel(activeDoc!, safeIndex, sectionId)}
                  {fileName ? ` · ${fileName}` : ''}
                </span>
              ) : null}
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
            {docs.length > 1
              ? 'Fill all applies each document. Skip keeps values already filled from the document read.'
              : editableCount > 0
                ? `${editableCount} field${editableCount === 1 ? '' : 's'} can still be filled or edited. Skip keeps what the document already filled.`
                : 'All listed fields already have document values. Skip to keep them, or update if you changed anything.'}
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {docs.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={busy || applying}
                onClick={() => void handleApplyAi()}
              >
                {busy || applying
                  ? 'Filling…'
                  : docs.length > 1
                    ? `Fill all ${docs.length} documents`
                    : unfilledCount > 0
                      ? 'Fill remaining from document'
                      : 'Update from document'}
              </Button>
            ) : null}
            {hasDirtyEdits && activeDoc ? (
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
              {hasDirtyEdits
                ? 'Skip without saving edits'
                : filledFromDocCount > 0 || anyAlreadyAutoFilled
                  ? 'Skip — keep filled data'
                  : 'Skip'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
