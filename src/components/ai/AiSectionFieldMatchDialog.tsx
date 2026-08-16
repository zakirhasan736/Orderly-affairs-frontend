'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { cn } from '@common/ui/utils';
import { AI_REVIEW_FILL_DIALOG_SHEET, AI_REVIEW_FILL_FOOTER, AI_REVIEW_FILL_BUTTON, AI_REVIEW_DOC_PANE, AI_REVIEW_TWO_PANE } from '@/utils/aiMobileUi';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import type {
  DetectedAiFact,
  StashedAiPatch,
} from '@/utils/aiDashboardPatchCache';
import {
  buildFieldMatchRows,
  averageMatchConfidence,
} from '@/utils/aiFieldMatchReview';
import { aiNoFieldsMessage } from '@/utils/aiReadSourceLabels';
import { AI_SECTION_BY_ID } from '@/utils/aiSectionRegistry';
import { unwrapAiAutofillPatch } from '@/utils/aiPatchNormalizer';
import { flattenDetectedFactsFromPatch } from '@/utils/aiSemanticFieldMatch';
import { describeAutofillItem } from '@/utils/aiMultiItemAutofill';
import { AiReviewDocumentPane } from '@/components/ai/AiReviewDocumentPane';
import { AiReviewDetailFields } from '@/components/ai/AiReviewDetailFields';
import { AiReviewDocPills } from '@/components/ai/AiReviewDocPills';
import { polishUploadedDocumentName } from '@/utils/aiUploadDisplayTitle';
import { VaultPrivacySaveToggle } from '@/components/vault/VaultPrivacySaveToggle';
import { highlightVaultSections } from '@/vault-prototype/navigate';
import { composeEntryTitle } from '@/vault-prototype/entryDisplayTitle';
import {
  aiFieldBadge,
  aiFillActionLabel,
  previewAiFillAgainstVault,
} from '@/utils/aiFillPreview';

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
  onReviewLater?: () => void;
  /** Open this uploaded file, not the first Jeep/Honda/Toyota in the list. */
  focusFileId?: string | null;
};

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
  const composed = composeEntryTitle(item);
  if (composed) return composed;
  const described = describeAutofillItem(item);
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
  onReviewLater,
  focusFileId,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);

  const docs = documents.length ? documents : [];
  const fileKey = docs.map(d => d.fileId).join('|');
  const safeIndex = Math.min(activeIndex, Math.max(0, docs.length - 1));
  const activeDoc = docs[safeIndex] || null;

  const facts = activeDoc?.facts || [];
  const documentSummary = activeDoc?.documentSummary;

  const fillPreview = useMemo(
    () =>
      previewAiFillAgainstVault({
        sectionId,
        facts: activeDoc?.facts || [],
        sectionData,
      }),
    [activeDoc?.facts, sectionData, sectionId],
  );

  const rows = useMemo(
    () =>
      buildFieldMatchRows({
        sectionId,
        subsection: activeDoc?.subsection || subsection,
        sectionData,
        facts,
        matchedItem: fillPreview.matchedItem ?? null,
      }),
    [
      sectionId,
      subsection,
      sectionData,
      facts,
      activeDoc?.subsection,
      fillPreview.matchedItem,
    ],
  );

  useEffect(() => {
    if (!open) return;
    const wanted = String(focusFileId || '').trim();
    const idx = wanted
      ? docs.findIndex(doc => String(doc.fileId || '').trim() === wanted)
      : 0;
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [open, sectionId, focusFileId, fileKey]);

  useEffect(() => {
    if (!open || !sectionId) {
      highlightVaultSections([]);
      return;
    }
    highlightVaultSections([sectionId]);
    return () => highlightVaultSections([]);
  }, [open, sectionId]);

  useEffect(() => {
    if (!open || !activeDoc) return;
    const next: Record<string, string> = {};
    const preview = previewAiFillAgainstVault({
      sectionId,
      facts: activeDoc.facts || [],
      sectionData,
    });
    const built = buildFieldMatchRows({
      sectionId,
      subsection: activeDoc.subsection || subsection,
      sectionData,
      facts: activeDoc.facts || [],
      matchedItem: preview.matchedItem ?? null,
    });
    built.forEach(row => {
      next[row.fieldKey] = String(row.aiValue || row.currentValue || '').trim();
    });
    setDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sectionId, safeIndex, activeDoc?.fileId]);

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

  const fillKind = hasDirtyEdits ? 'update' : fillPreview.kind;
  const itemHeadline =
    (activeDoc ? tabLabel(activeDoc, safeIndex, sectionId) : '') ||
    fillPreview.title;

  const handleClose = () => {
    onReviewLater?.();
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
        if (!next) onReviewLater?.();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className={cn(AI_REVIEW_FILL_DIALOG_SHEET, 'bg-[#F6F8FA]')}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-[#E4EAF0] bg-white px-4 py-3 pr-12 text-left sm:px-5">
          <div className="flex justify-center md:hidden" aria-hidden>
            <div className="-mt-1 mb-1 h-1.5 w-12 rounded-full bg-[#D5DDE5]" />
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF6FD] text-[#3EB1E5]">
              <ListChecks className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-[#213D59]">
                Review & fill · {itemHeadline || sectionLabel}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-[#6A7481]">
                Check the document, confirm the summary, then Add any number
                still missing.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {docs.length > 1 ? (
          <AiReviewDocPills
            items={docs.map((doc, index) => ({
              id: doc.fileId || `${doc.fileName}-${index}`,
              index: index + 1,
              active: index === safeIndex,
              label: `${tabLabel(doc, index, sectionId)}${
                doc.alreadyAutoFilled ? ' · filled' : ''
              }`,
            }))}
            onSelect={id => {
              const next = docs.findIndex(
                (doc, index) =>
                  (doc.fileId || `${doc.fileName}-${index}`) === id,
              );
              if (next >= 0) setActiveIndex(next);
            }}
          />
        ) : null}

        {activeDoc ? (
          <div className={AI_REVIEW_TWO_PANE}>
            <div className="min-h-0 px-3 pt-3 sm:px-5 sm:pt-4">
              <AiReviewDocumentPane
                fileId={activeDoc.fileId}
                fileName={activeDoc.fileName}
                active={open}
                className={AI_REVIEW_DOC_PANE}
              />
            </div>

            <div className="px-3 py-3 sm:px-5 sm:py-4">
              <p className="text-[18px] font-semibold leading-snug tracking-tight text-[#213D59] sm:text-[20px]">
                {polishUploadedDocumentName(activeDoc.fileName) ||
                  tabLabel(activeDoc, safeIndex, sectionId)}
              </p>
              {activeDoc.fileName ? (
                <p className="mt-0.5 truncate text-[12px] text-[#7A8794]">
                  {activeDoc.fileName}
                  {subsectionLabel ? ` · ${subsectionLabel}` : ''}
                </p>
              ) : null}

              {documentSummary ? (
                <div className="mt-3 rounded-2xl border border-[#E4EAF0] bg-white px-3.5 py-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A8794]">
                    AI summary
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-[#213D59]">
                    {documentSummary}
                  </p>
                </div>
              ) : null}

              <div className="mt-3 rounded-2xl border border-[#E4EAF0] bg-white px-3.5 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-[#213D59]">
                    Filing location
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F6F0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1F9D6B]">
                    • {sectionLabel}
                  </span>
                </div>
                <p className="mt-2 text-[14px] font-semibold text-[#213D59]">
                  <span className="font-medium text-[#7A8794]">File to: </span>
                  {sectionLabel}
                  {subsectionLabel ? ` · ${subsectionLabel}` : ''}
                </p>
              </div>

              <VaultPrivacySaveToggle
                className="mt-3"
                sectionId={sectionId}
                subsectionId={subsectionLabel}
              />

              <p className="mt-2 flex flex-wrap items-center gap-x-1 text-[12px] text-[#7A8794]">
                {filledFromDocCount > 0 ? (
                  <span className="font-semibold text-[#1F9D6B]">
                    {filledFromDocCount} from document
                  </span>
                ) : (
                  <span className="font-semibold text-[#213D59]">
                    Ready to fill
                  </span>
                )}
                {canFillCount > 0 ? (
                  <span className="text-[#B4761A]">· {canFillCount} can fill</span>
                ) : null}
                {stillEmptyCount > 0 ? (
                  <span>· {stillEmptyCount} still empty</span>
                ) : null}
                {avgConfidence > 0 ? (
                  <span>· Match {avgConfidence}%</span>
                ) : null}
              </p>

              <div className="mt-3 rounded-2xl border border-[#E4EAF0] bg-white px-4 py-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[16px] font-semibold tracking-tight text-[#213D59]">
                      Details
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-[#6A7481]">
                      {fillKind === 'same'
                        ? 'This is already in your Vault. Nothing new to fill.'
                        : fillKind === 'update'
                          ? 'This item is already on file. New or changed values are marked.'
                          : 'Empty rows show Add. Filled rows have an edit icon.'}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E8F6F0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1F9D6B]">
                    • {stillEmptyCount} still empty
                  </span>
                </div>
                <AiReviewDetailFields
                  className="mt-1"
                  splitEmpty
                  emptyMessage={aiNoFieldsMessage()}
                  fields={rows.map(row => ({
                    id: row.fieldKey,
                    label: row.fieldLabel,
                    value: drafts[row.fieldKey] ?? '',
                    sectionId,
                    sectionTitle: itemHeadline || sectionLabel,
                    badge: aiFieldBadge(fillPreview.fieldKind[row.fieldKey]),
                    placeholder: row.aiValue
                      ? `AI suggests: ${row.aiValue}`
                      : 'Type the value from the document',
                    hint:
                      row.status === 'filled'
                        ? 'From document'
                        : row.status === 'available'
                          ? 'Can fill'
                          : undefined,
                    onChange: value =>
                      setDrafts(prev => ({
                        ...prev,
                        [row.fieldKey]: value,
                      })),
                  }))}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className={cn(AI_REVIEW_FILL_FOOTER, 'shrink-0')}>
            <Button
              type="button"
              variant="outline"
              className={cn(
                AI_REVIEW_FILL_BUTTON,
                'border-[#E4EAF0] text-[#213D59]',
              )}
              onClick={handleClose}
            >
              {hasDirtyEdits
                ? 'Review later without saving edits'
                : 'Review later'}
            </Button>
            {docs.length > 1 ? (
              <Button
                type="button"
                variant="outline"
                className={cn(
                  AI_REVIEW_FILL_BUTTON,
                  'border-[#213D59]/20 text-[#213D59]',
                )}
                disabled={busy || applying}
                onClick={() => void handleApplyAi()}
              >
                {busy || applying
                  ? 'Filling…'
                  : `Fill all ${docs.length} documents`}
              </Button>
            ) : null}
            {hasDirtyEdits && activeDoc ? (
              <Button
                type="button"
                className={cn(
                  AI_REVIEW_FILL_BUTTON,
                  'bg-[#213D59] text-white hover:bg-[#2C4B6B]',
                )}
                disabled={busy || applying}
                onClick={() => void handleSaveEdits()}
              >
                {busy || applying ? 'Saving…' : aiFillActionLabel(fillKind)}
              </Button>
            ) : docs.length > 0 ? (
              <Button
                type="button"
                className={cn(
                  AI_REVIEW_FILL_BUTTON,
                  'bg-[#213D59] text-white hover:bg-[#2C4B6B]',
                )}
                disabled={busy || applying}
                onClick={() => void handleApplyAi()}
              >
                {busy || applying ? 'Filling…' : aiFillActionLabel(fillKind)}
              </Button>
            ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
