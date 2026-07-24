'use client';

import React from 'react';
import { ArrowDown, Eye, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { getReadableAiDocumentType } from '@/utils/aiDocumentUploadUi';
import type { AiPendingUpload } from '@/utils/aiDocumentRouting';
import { AI_MOBILE_ACTION_BUTTON } from '@/utils/aiMobileUi';

type Props = {
  pendingUpload: AiPendingUpload;
  onDismiss: () => void;
  onScrollToUpload: () => void;
  onAutofillNow?: () => void;
  mode?: 'autofill' | 'review';
};

export function AiPendingUploadBanner({
  pendingUpload,
  onDismiss,
  onScrollToUpload,
  onAutofillNow,
  mode = 'autofill',
}: Props) {
  const fileLabel = getReadableAiDocumentType(pendingUpload.mime_type);
  const isReview = mode === 'review';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-3.5 shadow-sm sm:p-4">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-100/80 blur-2xl" />

      <div className="relative flex flex-col gap-3.5 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
            {isReview ? <Eye className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold text-slate-900">
              {isReview ? 'AI found information to review' : 'Ready to auto-fill'}
            </p>
            <p className="break-words text-sm leading-relaxed text-slate-600">
              {fileLabel}
              {pendingUpload.file_name ? ` · ${pendingUpload.file_name}` : ''}
              {pendingUpload.documentSummary
                ? ` · ${pendingUpload.documentSummary}`
                : ''}
              {isReview
                ? '. Fields were already filled — review them below. Do not re-run Auto-fill for this file.'
                : '. Tap below — no re-upload needed.'}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:max-w-sm lg:shrink-0">
          {onAutofillNow ? (
            <Button
              type="button"
              size="sm"
              className={AI_MOBILE_ACTION_BUTTON}
              onClick={onAutofillNow}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isReview ? 'Review & auto-fill' : 'Auto-fill now'}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 w-full rounded-2xl touch-manipulation sm:min-h-9 sm:w-auto sm:rounded-xl"
            onClick={onScrollToUpload}
          >
            <ArrowDown className="mr-2 h-4 w-4" />
            Show upload
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-10 w-full rounded-2xl text-slate-500 touch-manipulation sm:min-h-9 sm:w-auto sm:rounded-xl"
            onClick={onDismiss}
          >
            <X className="mr-2 h-4 w-4" />
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
