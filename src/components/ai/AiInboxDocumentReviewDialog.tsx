'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { cn } from '@common/ui/utils';
import { AI_REVIEW_FILL_DIALOG_SHEET, AI_REVIEW_FILL_FOOTER, AI_REVIEW_FILL_BUTTON, AI_REVIEW_DOC_PANE, AI_REVIEW_TWO_PANE } from '@/utils/aiMobileUi';
import type { DetectedAiFact } from '@/utils/aiDashboardPatchCache';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import { buildAiUploadReviewSummary } from '@/utils/aiUploadReviewSummary';
import { AiReviewDocumentPane } from '@/components/ai/AiReviewDocumentPane';
import { AiReviewDetailFields } from '@/components/ai/AiReviewDetailFields';
import { polishUploadedDocumentName } from '@/utils/aiUploadDisplayTitle';
import { VaultPrivacySaveToggle } from '@/components/vault/VaultPrivacySaveToggle';
import { highlightVaultSections } from '@/vault-prototype/navigate';
import {
  mergeFactsWithSectionCatalog,
  uniqueEditableFacts,
} from '@/utils/aiReviewCatalogFacts';

export type AiInboxReviewDocument = {
  id: string;
  fileId?: string;
  fileName: string;
  mimeType?: string;
  sectionId: string;
  sectionLabel: string;
  subsectionLabel: string;
  summary?: string;
  facts: DetectedAiFact[];
};

type EditableFact = DetectedAiFact & { editId: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: AiInboxReviewDocument | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  onAccept: (editedFacts: DetectedAiFact[]) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onOpenSection?: () => void;
};

function initialsFromName(name?: string | null, email?: string | null) {
  const source = (name || email || 'You').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || 'YO';
}

/**
 * Inbox / dashboard document review — same preview + fill style as section popups.
 */
export function AiInboxDocumentReviewDialog({
  open,
  onOpenChange,
  document,
  ownerName,
  ownerEmail,
  onAccept,
  onDelete,
  onOpenSection,
}: Props) {
  const extraCountRef = useRef(0);
  const [busy, setBusy] = useState<'accept' | 'delete' | null>(null);
  const [edits, setEdits] = useState<EditableFact[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (!open || !document) {
      setEdits([]);
      setSummaryOpen(false);
      return;
    }
    setEdits(
      uniqueEditableFacts(
        mergeFactsWithSectionCatalog({
          facts: document.facts || [],
          sectionIds: document.sectionId ? [document.sectionId] : [],
        }),
      ),
    );
    setSummaryOpen(false);
  }, [open, document]);

  useEffect(() => {
    if (!open || !document?.sectionId) {
      highlightVaultSections([]);
      return;
    }
    highlightVaultSections([document.sectionId]);
    return () => highlightVaultSections([]);
  }, [open, document?.sectionId]);

  const aiSummary = useMemo(
    () =>
      buildAiUploadReviewSummary({
        summary: document?.summary,
        fileName: document?.fileName,
        sectionLabel: document?.sectionLabel,
        facts: edits,
      }),
    [document?.summary, document?.fileName, document?.sectionLabel, edits],
  );

  if (!document) return null;

  const title =
    document.sectionLabel || getAiSectionLabel(document.sectionId) || 'Document';
  const displayName = ownerName?.trim() || 'You';
  const displayEmail = ownerEmail?.trim() || '';
  const initials = initialsFromName(displayName, displayEmail);
  const displayFile =
    polishUploadedDocumentName(document.fileName, document.mimeType) ||
    document.fileName;
  const summaryLong = aiSummary.length > 220;
  const summaryShown =
    summaryOpen || !summaryLong
      ? aiSummary
      : `${aiSummary.slice(0, 220).trim()}…`;

  const runAccept = async () => {
    setBusy('accept');
    try {
      await onAccept(edits.map(({ editId: _editId, ...fact }) => fact));
      onOpenChange(false);
    } finally {
      setBusy(null);
    }
  };

  const runDelete = async () => {
    if (!onDelete) return;
    setBusy('delete');
    try {
      await onDelete();
      onOpenChange(false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(AI_REVIEW_FILL_DIALOG_SHEET, 'bg-[#F6F8FA]')}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-[#E4EAF0] bg-white px-3 py-3 pr-12 sm:px-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#213D59] transition hover:bg-[#F6F8FA]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-[15px] font-semibold text-[#213D59]">
              Review & fill · {displayFile || title}
            </DialogTitle>
            <DialogDescription className="truncate text-[12px] text-[#6A7481]">
              {document.fileName}
            </DialogDescription>
          </div>
          {onDelete ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void runDelete()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FBEDEA] text-[#C2442E] transition hover:bg-[#FBEDEA] disabled:opacity-50"
              aria-label="Delete upload"
              title="Delete file"
            >
              {busy === 'delete' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>

        <div className={AI_REVIEW_TWO_PANE}>
            <div className="min-h-0 px-3 pt-3 sm:px-5 sm:pt-4">
            <AiReviewDocumentPane
              fileId={document.fileId}
              fileName={document.fileName}
              mimeType={document.mimeType}
              active={open}
              className={AI_REVIEW_DOC_PANE}
            />
          </div>

          <div className="space-y-3 px-3 py-3 sm:px-5 sm:py-4">
            <p className="text-[18px] font-semibold leading-snug tracking-tight text-[#213D59] sm:text-[20px]">
              {displayFile}
            </p>
            <p className="truncate text-[12px] text-[#7A8794]">
              {document.fileName}
            </p>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF6FD] text-[11px] font-bold text-[#213D59]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#213D59]">
                  {displayName}
                </p>
                {displayEmail ? (
                  <p className="truncate text-[11px] text-[#6A7481]">
                    {displayEmail}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E4EAF0] bg-white px-3.5 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A8794]">
                AI summary
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-[#213D59]">
                {summaryShown}
              </p>
              {summaryLong ? (
                <button
                  type="button"
                  className="mt-1.5 text-[12px] font-semibold text-[#2E7FAD] hover:underline"
                  onClick={() => setSummaryOpen(value => !value)}
                >
                  {summaryOpen ? 'Show less' : 'Show more'}
                </button>
              ) : null}
            </div>

            <div className="rounded-2xl border border-[#E4EAF0] bg-white px-3.5 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-[#213D59]">
                  Filing location
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F6F0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1F9D6B]">
                  • New location
                </span>
              </div>
              <p className="mt-2 text-[14px] font-semibold text-[#213D59]">
                <span className="font-medium text-[#7A8794]">File to: </span>
                {title}
                {document.subsectionLabel ? ` · ${document.subsectionLabel}` : ''}
              </p>
            </div>

            <VaultPrivacySaveToggle
              sectionId={document.sectionId}
              subsectionId={document.subsectionLabel || null}
            />

            <div className="rounded-2xl border border-[#E4EAF0] bg-white px-4 py-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[16px] font-semibold tracking-tight text-[#213D59]">
                    Details
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#6A7481]">
                    You can edit any detail. Empty rows show Add — type the
                    value from the document.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E8F6F0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1F9D6B]">
                  • {edits.filter(fact => !String(fact.value || '').trim()).length} still empty
                </span>
              </div>
              <AiReviewDetailFields
                className="mt-2"
                splitEmpty
                emptyMessage="No extracted fields were listed. You can still Accept, or add a number from the document."
                addFieldLabel="Add a number from the document"
                onAddField={() => {
                  extraCountRef.current += 1;
                  const editId = `extra-${extraCountRef.current}`;
                  setEdits(prev => [
                    ...prev,
                    {
                      editId,
                      label: 'Detail from document',
                      value: '',
                      field_key: 'notes',
                      concept: 'user_added',
                    },
                  ]);
                }}
                fields={edits.map(fact => ({
                  id: fact.editId,
                  label: fact.label,
                  value: fact.value,
                  sectionId: document.sectionId,
                  sectionTitle: document.sectionLabel || title,
                  hint: fact.value ? 'From document' : undefined,
                  labelEditable: fact.concept === 'user_added',
                  onLabelChange: label =>
                    setEdits(prev =>
                      prev.map(item =>
                        item.editId === fact.editId ? { ...item, label } : item,
                      ),
                    ),
                  onChange: value =>
                    setEdits(prev =>
                      prev.map(item =>
                        item.editId === fact.editId ? { ...item, value } : item,
                      ),
                    ),
                }))}
              />
            </div>
          </div>
        </div>

        <div className={cn(AI_REVIEW_FILL_FOOTER, 'w-full shrink-0')}>
            {onDelete ? (
              <Button
                type="button"
                disabled={busy !== null}
                onClick={() => void runDelete()}
                className={cn(
                  AI_REVIEW_FILL_BUTTON,
                  'bg-[#FBEDEA] text-[#C2442E] hover:bg-[#FBEDEA]',
                )}
              >
                Delete file
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={busy !== null}
              onClick={() => void runAccept()}
              className={cn(
                AI_REVIEW_FILL_BUTTON,
                'bg-[#213D59] text-white hover:bg-[#2C4B6B]',
              )}
            >
              {busy === 'accept' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Accept filing location
            </Button>
          {onOpenSection ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => {
                onOpenSection();
                onOpenChange(false);
              }}
              className={cn(AI_REVIEW_FILL_BUTTON, 'border-[#E4EAF0] text-[#213D59]')}
            >
              Open full section
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
