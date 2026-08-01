'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { cn } from '@common/ui/utils';
import { AI_ROUTING_DIALOG_SHEET } from '@/utils/aiMobileUi';
import { fetchAiDocumentPreviewBlob } from '@/services/aiDocumentUpload';
import {
  resolveAiPreviewKind,
  resolveAiPreviewMime,
} from '@/utils/aiPreviewKind';
import type { DetectedAiFact } from '@/utils/aiDashboardPatchCache';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import { buildAiUploadReviewSummary } from '@/utils/aiUploadReviewSummary';

export type AiInboxReviewDocument = {
  id: string;
  fileId?: string;
  fileName: string;
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

function uniqueEditableFacts(facts: DetectedAiFact[]): EditableFact[] {
  const seen = new Set<string>();
  const list: EditableFact[] = [];
  facts.forEach((fact, index) => {
    const key = `${fact.field_key || fact.label}|${fact.value}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    list.push({
      ...fact,
      editId: `${fact.field_key || fact.label || 'field'}-${index}`,
    });
  });
  return list;
}

function looksSensitive(label: string, fieldKey?: string) {
  const blob = `${label} ${fieldKey || ''}`.toLowerCase();
  return /account\s*number|routing|ssn|social|password|vin|policy\s*number|card\s*number/.test(
    blob,
  );
}

/**
 * Inbox document detail — preview + editable fields + Accept to save.
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
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<'image' | 'pdf' | 'text' | 'other'>(
    'other',
  );
  const [busy, setBusy] = useState<'accept' | 'delete' | null>(null);
  const [edits, setEdits] = useState<EditableFact[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open || !document) {
      setEdits([]);
      setRevealed({});
      return;
    }
    setEdits(uniqueEditableFacts(document.facts || []));
    setRevealed({});
  }, [open, document]);

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

  useEffect(() => {
    if (!open || !document?.fileId) {
      setPreviewError('');
      setTextContent(null);
      setLoadingPreview(false);
      setObjectUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;

    const load = async () => {
      setLoadingPreview(true);
      setPreviewError('');
      setTextContent(null);
      setObjectUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });

      try {
        const { blob, mimeType, fileName } = await fetchAiDocumentPreviewBlob(
          document.fileId!,
        );
        if (cancelled) return;
        const titleHint = document.fileName || fileName || '';
        const mime = resolveAiPreviewMime({
          contentType: mimeType,
          blobType: blob.type,
          fileName: titleHint,
        });
        const kind = resolveAiPreviewKind({ mime, fileName: titleHint });
        setPreviewKind(kind);

        if (kind === 'text') {
          const text = await blob.text();
          if (!cancelled) setTextContent(text || '(Empty text file)');
          return;
        }

        const typed =
          mime && mime !== blob.type
            ? new Blob([await blob.arrayBuffer()], { type: mime })
            : blob;
        createdUrl = URL.createObjectURL(typed);
        if (!cancelled) setObjectUrl(createdUrl);
      } catch (err) {
        if (!cancelled) {
          setPreviewError(
            err instanceof Error ? err.message : 'Could not open document.',
          );
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [open, document?.fileId, document?.fileName]);

  if (!document) return null;

  const title =
    document.sectionLabel || getAiSectionLabel(document.sectionId) || 'Document';
  const displayName = ownerName?.trim() || 'You';
  const displayEmail = ownerEmail?.trim() || '';
  const initials = initialsFromName(displayName, displayEmail);

  const runAccept = async () => {
    setBusy('accept');
    try {
      await onAccept(
        edits.map(({ editId: _editId, ...fact }) => fact),
      );
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
        className={cn(
          AI_ROUTING_DIALOG_SHEET,
          'gap-0 overflow-hidden border-0 bg-[#f3f5f7] p-0 sm:max-w-xl md:max-w-2xl',
        )}
      >
        <div className="flex items-center gap-2 border-b border-black/5 bg-white px-3 py-3 pr-12 sm:px-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#213D59] transition hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-[15px] font-semibold text-[#213D59]">
              {title}
              {document.subsectionLabel ? ` · ${document.subsectionLabel}` : ''}
            </DialogTitle>
            <DialogDescription className="truncate text-[12px] text-[#5a6b80]">
              {document.fileName}
            </DialogDescription>
          </div>
          {onDelete ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void runDelete()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
              aria-label="Delete upload"
              title="Delete upload"
            >
              {busy === 'delete' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>

        <div className="max-h-[min(78dvh,720px)] space-y-3 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loadingPreview ? (
              <div className="flex min-h-[220px] items-center justify-center gap-2 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading preview…</span>
              </div>
            ) : null}

            {!loadingPreview && previewError ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 px-4 text-center">
                <FileText className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-rose-600">{previewError}</p>
              </div>
            ) : null}

            {!loadingPreview && !previewError && textContent != null ? (
              <pre className="max-h-[280px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[12px] leading-relaxed text-slate-800 sm:max-h-[320px]">
                {textContent}
              </pre>
            ) : null}

            {!loadingPreview &&
            !previewError &&
            objectUrl &&
            previewKind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={objectUrl}
                alt={document.fileName}
                className="mx-auto max-h-[min(42dvh,360px)] w-full object-contain object-top bg-[#eef1f4]"
              />
            ) : null}

            {!loadingPreview &&
            !previewError &&
            objectUrl &&
            previewKind === 'pdf' ? (
              <iframe
                title={document.fileName}
                src={`${objectUrl}#toolbar=1&navpanes=0&view=FitH`}
                className="h-[min(42dvh,360px)] w-full border-0 bg-white"
              />
            ) : null}

            {!loadingPreview &&
            !previewError &&
            objectUrl &&
            previewKind === 'other' &&
            textContent == null ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 px-4 text-center">
                <FileText className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-600">Preview not available</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7785]">
              File to
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[14px] font-semibold text-[#1a2b3d]">
                {document.sectionLabel}
                {document.subsectionLabel
                  ? ` · ${document.subsectionLabel}`
                  : ''}
              </p>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                New
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7785]">
              Added by
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3d9c8] text-[12px] font-bold text-[#7a4a2b]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-[#1a2b3d]">
                  {displayName}
                </p>
                {displayEmail ? (
                  <p className="truncate text-[12px] text-[#5a6b80]">
                    {displayEmail}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
            <h3 className="text-[18px] font-semibold tracking-tight text-[#213D59] sm:text-[20px]">
              AI Summary
            </h3>
            <div className="mt-3 rounded-2xl bg-[#f4f6f8] px-3.5 py-3.5 sm:px-4 sm:py-4">
              <p className="whitespace-pre-wrap text-[14px] leading-[1.65] text-[#334155] sm:text-[15px]">
                {aiSummary}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold text-[#213D59]">
                  Review & edit fields
                </p>
                <p className="mt-0.5 text-[12px] text-[#5a6b80]">
                  Fix anything that doesn’t match the document, then Accept to
                  save.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-100">
                Editable
              </span>
            </div>

            {edits.length === 0 ? (
              <p className="mt-3 text-[13px] text-[#5a6b80]">
                No extracted fields were listed. You can still Accept to save
                what AI prepared, or open the section to review.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {edits.slice(0, 24).map((fact, index) => {
                  const sensitive = looksSensitive(fact.label, fact.field_key);
                  const showPlain = !sensitive || revealed[fact.editId];
                  return (
                    <li
                      key={fact.editId}
                      className="rounded-2xl bg-[#f4f6f8] px-3 py-2.5"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <label
                          htmlFor={fact.editId}
                          className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7785]"
                        >
                          {fact.label}
                        </label>
                        <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-800">
                          New
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          id={fact.editId}
                          type={showPlain ? 'text' : 'password'}
                          value={fact.value}
                          onChange={event => {
                            const value = event.target.value;
                            setEdits(prev =>
                              prev.map((item, i) =>
                                i === index ? { ...item, value } : item,
                              ),
                            );
                          }}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-[14px] font-medium text-[#1a2b3d] outline-none ring-[#2B5A8C]/30 focus:ring-2"
                          placeholder="Add"
                          autoComplete="off"
                        />
                        {sensitive ? (
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-[#213D59]"
                            onClick={() =>
                              setRevealed(prev => ({
                                ...prev,
                                [fact.editId]: !prev[fact.editId],
                              }))
                            }
                            aria-label={
                              showPlain ? 'Hide value' : 'Show value'
                            }
                          >
                            {showPlain ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {edits.length > 24 ? (
              <p className="mt-2 text-[12px] text-[#5a6b80]">
                +{edits.length - 24} more fields will also save with Accept
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2 border-t border-black/5 bg-white px-4 py-3 sm:px-5">
          <Button
            type="button"
            disabled={busy !== null}
            onClick={() => void runAccept()}
            className="h-12 w-full rounded-2xl bg-[#2B5A8C] text-[15px] font-semibold text-white hover:bg-[#214872]"
          >
            {busy === 'accept' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Accept & save
          </Button>
          <p className="text-center text-[11px] text-[#6b7785]">
            Nothing is written to your vault until you Accept.
          </p>
          {onOpenSection ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => {
                onOpenSection();
                onOpenChange(false);
              }}
              className="h-11 w-full rounded-2xl border-[#213D59]/20 text-[14px] font-semibold text-[#213D59]"
            >
              Open full section
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
