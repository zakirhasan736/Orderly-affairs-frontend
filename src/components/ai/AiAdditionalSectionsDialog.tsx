'use client';

import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
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
import { AiExtractedFieldsPreview } from '@/components/ai/AiExtractedFieldsPreview';
import type {
  AiAdditionalSection,
  AiSectionPreview,
} from '@/utils/aiDocumentRouting';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import { AI_ROUTING_DIALOG_SHEET } from '@/utils/aiMobileUi';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSectionLabel: string;
  documentSummary?: string;
  additionalSections: AiAdditionalSection[];
  sectionPreviews?: AiSectionPreview[];
  onLater: () => void;
  onGoToSection: (section: AiAdditionalSection) => void;
};

type SectionCardItem = {
  section_key: string;
  section_id: string;
  section_label: string;
  data_summary?: string;
  extracted_fields?: AiAdditionalSection['extracted_fields'];
  status?: 'filled' | 'pending';
};

function resolveSectionLabel(section: SectionCardItem) {
  return (
    section.section_label ||
    getAiSectionLabel(section.section_id) ||
    'Another section'
  );
}

function toAdditionalSection(section: SectionCardItem): AiAdditionalSection {
  return {
    section_key: section.section_key,
    section_id: section.section_id,
    section_label: resolveSectionLabel(section),
    data_summary: section.data_summary || '',
    extracted_fields: section.extracted_fields,
  };
}

function buildDialogTitle(items: SectionCardItem[]) {
  const labels = items.map(item => resolveSectionLabel(item)).filter(Boolean);

  if (labels.length === 1) {
    return `Also found ${labels[0]} data`;
  }

  if (labels.length >= 2) {
    return `Found data for ${labels.length} more sections`;
  }

  return 'This file has more information';
}

function StatusBadge({ status }: { status?: 'filled' | 'pending' }) {
  if (status === 'filled') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Filled
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
      <Sparkles className="h-3 w-3" />
      Ready to fill
    </span>
  );
}

function SectionRoutingCard({
  section,
  onGoToSection,
}: {
  section: SectionCardItem;
  onGoToSection: (section: AiAdditionalSection) => void;
}) {
  const label = resolveSectionLabel(section);
  const isPending = section.status !== 'filled';
  const sectionId = section.section_id || '?';

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100/80">
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm"
            aria-hidden
          >
            {sectionId}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-base font-semibold leading-snug text-slate-900">
                {label}
              </h3>
              <StatusBadge status={section.status} />
            </div>
            {section.data_summary ? (
              <p className="text-sm leading-relaxed text-slate-600">
                {section.data_summary}
              </p>
            ) : null}
          </div>
        </div>

        <AiExtractedFieldsPreview fields={section.extracted_fields || []} />
      </div>

      {isPending ? (
        <div className="border-t border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-5">
          <Button
            type="button"
            className="min-h-11 w-full rounded-xl text-[15px] font-semibold touch-manipulation sm:min-h-10 sm:text-sm"
            onClick={() => onGoToSection(toAdditionalSection(section))}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Go to {label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export function AiAdditionalSectionsDialog({
  open,
  onOpenChange,
  currentSectionLabel,
  documentSummary,
  additionalSections,
  sectionPreviews = [],
  onLater,
  onGoToSection,
}: Props) {
  const pendingPreviews = sectionPreviews.filter(
    item => item.status === 'pending',
  );
  const filledPreviews = sectionPreviews.filter(
    item => item.status === 'filled',
  );

  const previewItems: SectionCardItem[] = pendingPreviews.map(section => ({
    section_key: section.section_key,
    section_id: section.section_id || '',
    section_label: section.section_label,
    data_summary: section.data_summary,
    extracted_fields: section.extracted_fields,
    status: section.status,
  }));

  const legacyItems: SectionCardItem[] = additionalSections.map(section => ({
    section_key: section.section_key,
    section_id: section.section_id,
    section_label: section.section_label,
    data_summary: section.data_summary,
    extracted_fields: section.extracted_fields,
    status: 'pending',
  }));

  const displayItems =
    previewItems.length > 0 ? previewItems : legacyItems;
  const hasStructuredPreviews = sectionPreviews.length > 0;
  const pendingCount = displayItems.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={AI_ROUTING_DIALOG_SHEET}>
        <DialogHeader className="space-y-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 ring-1 ring-indigo-200/80">
              <Layers3 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1 pt-0.5">
              <DialogTitle className="text-left text-lg font-semibold leading-snug tracking-tight text-slate-900 sm:text-xl">
                {hasStructuredPreviews
                  ? buildDialogTitle(displayItems)
                  : 'This file has more information'}
              </DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed text-slate-600">
                {hasStructuredPreviews ? (
                  <>
                    Your document contains details for other vault sections.
                    Review what we found, then jump there to auto-fill — no
                    re-upload needed.
                  </>
                ) : (
                  <>
                    We updated{' '}
                    <span className="font-medium text-slate-900">
                      {currentSectionLabel}
                    </span>
                    . The same file also has data waiting in other sections.
                  </>
                )}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-2.5 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              <span className="font-medium">{currentSectionLabel}</span> updated
              from this document
            </span>
          </div>

          {documentSummary ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-3.5 py-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <FileSearch className="h-3.5 w-3.5" />
                Document summary
              </div>
              <p className="text-sm leading-relaxed text-slate-700">
                {documentSummary}
              </p>
            </div>
          ) : null}

          {pendingCount > 0 ? (
            <p className="text-xs font-medium text-slate-500">
              {pendingCount} more section{pendingCount === 1 ? '' : 's'} ready
              to auto-fill
            </p>
          ) : null}
        </DialogHeader>

        <div
          className={cn(
            'max-h-[min(42vh,360px)] space-y-3 overflow-y-auto overscroll-contain pr-0.5',
            'sm:max-h-none sm:overflow-visible',
            displayItems.length > 1 && 'md:grid md:grid-cols-2 md:gap-4 md:space-y-0',
          )}
        >
          {displayItems.map(section => (
            <SectionRoutingCard
              key={`${section.section_key}-${section.section_id}`}
              section={section}
              onGoToSection={onGoToSection}
            />
          ))}
        </div>

        {filledPreviews.length > 0 && pendingCount > 0 ? (
          <p className="text-sm leading-relaxed text-slate-600">
            Other sections from this upload are already filled. Continue with
            the remaining section{pendingCount === 1 ? '' : 's'} above.
          </p>
        ) : null}

        <DialogFooter className="sticky bottom-0 -mx-4 mt-1 flex-col gap-0 border-t border-slate-100 bg-white/95 px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pt-2 sm:pb-0">
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full rounded-xl text-slate-600 touch-manipulation hover:bg-slate-100 hover:text-slate-900 sm:min-h-9 sm:w-auto sm:px-4"
            onClick={onLater}
          >
            I&apos;ll do this later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
