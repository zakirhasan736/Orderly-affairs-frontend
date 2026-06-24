'use client';

import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import type {
  AiAdditionalSection,
  AiSectionPreview,
} from '@/utils/aiDocumentRouting';
import { AiExtractedFieldsPreview } from '@/components/ai/AiExtractedFieldsPreview';
import { AI_MOBILE_ACTION_BUTTON, AI_ROUTING_DIALOG_SHEET } from '@/utils/aiMobileUi';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSectionLabel: string;
  suggestedSectionLabel: string;
  documentSummary?: string;
  extractedFieldCount?: number;
  additionalSections?: AiAdditionalSection[];
  sectionPreviews?: AiSectionPreview[];
  mismatchType?: 'wrong_section' | 'companion_section_first';
  onStayHere: () => void;
  onGoToSection: () => void;
};

export function AiSectionMismatchDialog({
  open,
  onOpenChange,
  currentSectionLabel,
  suggestedSectionLabel,
  documentSummary,
  extractedFieldCount = 0,
  additionalSections = [],
  sectionPreviews = [],
  mismatchType = 'wrong_section',
  onStayHere,
  onGoToSection,
}: Props) {
  const hasExtractedPreview = extractedFieldCount > 0;
  const isCompanionFirst = mismatchType === 'companion_section_first';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={AI_ROUTING_DIALOG_SHEET}>
        <DialogHeader className="text-left">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
            <FileText className="h-5 w-5" />
          </div>
          <DialogTitle className="text-left text-base leading-snug sm:text-lg">
            {isCompanionFirst
              ? `Fill ${suggestedSectionLabel} first`
              : `This document is for ${suggestedSectionLabel}, not ${currentSectionLabel}`}
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2 text-sm leading-relaxed text-slate-600">
            <p>
              {isCompanionFirst ? (
                <>
                  This document also includes{' '}
                  <span className="font-medium text-slate-900">
                    {suggestedSectionLabel}
                  </span>{' '}
                  information. Fill that section first, then return to{' '}
                  <span className="font-medium text-slate-900">
                    {currentSectionLabel}
                  </span>{' '}
                  — your upload is saved (no re-read, no re-upload).
                </>
              ) : (
                <>
                  Your file is saved. Go to{' '}
                  <span className="font-medium text-slate-900">
                    {suggestedSectionLabel}
                  </span>{' '}
                  — auto-fill will start instantly (no re-read, no re-upload).
                </>
              )}
            </p>

            {documentSummary ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                {documentSummary}
              </p>
            ) : null}

            {hasExtractedPreview ? (
              <p>
                We already extracted {extractedFieldCount} field
                {extractedFieldCount === 1 ? '' : 's'} from this document.
              </p>
            ) : null}

            {sectionPreviews.length ? (
              <div className="space-y-3">
                {sectionPreviews.map(section => (
                  <div
                    key={`${section.section_key}-${section.section_id}`}
                    className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3"
                  >
                    <p className="font-semibold text-slate-900">
                      {section.section_label}
                    </p>
                    {section.data_summary ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {section.data_summary}
                      </p>
                    ) : null}
                    <div className="mt-2">
                      <AiExtractedFieldsPreview
                        fields={section.extracted_fields || []}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : additionalSections.length ? (
              <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  Also found in this document
                </p>
                {additionalSections.map(section => (
                  <p
                    key={`${section.section_key}-${section.section_id}`}
                    className="text-sm text-slate-700"
                  >
                    <span className="font-medium text-slate-900">
                      {section.section_label}
                    </span>
                    {section.data_summary ? ` — ${section.data_summary}` : ''}
                  </p>
                ))}
              </div>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sticky bottom-0 -mx-4 flex-col gap-2.5 border-t border-slate-100 bg-white/95 px-4 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mx-0 sm:flex-col sm:space-x-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pt-0 sm:pb-0">
          <Button
            type="button"
            onClick={onGoToSection}
            className={AI_MOBILE_ACTION_BUTTON}
          >
            Go to {suggestedSectionLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onStayHere}
            className="min-h-11 w-full rounded-2xl touch-manipulation sm:min-h-9 sm:rounded-xl"
          >
            Stay here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
