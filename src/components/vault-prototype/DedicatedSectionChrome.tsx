'use client';

import React from 'react';
import { Sparkles, Upload } from 'lucide-react';
import { schemaByApiId } from '@/vault-prototype';
import { SchemaIcon } from '@/vault-prototype/icons';
import { ProgressBar } from '@/components/vault-ui';
import { SectionActivityStrip } from '@/components/vault/SectionActivityStrip';
import { UploadedDocumentsButton } from '@/components/vault/UploadedDocumentsButton';

export function DedicatedSectionChrome({
  apiSectionId,
  progressLabel,
  progressValue,
  progressHint,
  pendingReviewCount = 0,
  onOpenReview,
  onUpload,
  children,
}: {
  apiSectionId: string;
  progressLabel?: string;
  progressValue?: number;
  progressHint?: string;
  pendingReviewCount?: number;
  onOpenReview?: () => void;
  onUpload?: () => void;
  children: React.ReactNode;
}) {
  const section = schemaByApiId(apiSectionId);
  if (!section) return <>{children}</>;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[22px] border border-[#E4EAF0] bg-white px-7 py-6 max-md:rounded-[14px] max-md:px-4">
        <div className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-[#EAF6FD]" />
        <div className="relative z-[1] flex flex-wrap items-start gap-5">
          <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] bg-[#213D59] text-white">
            <SchemaIcon name={section.icon} className="h-6 w-6" />
          </div>
          <div className="min-w-[280px] flex-1">
            <h1 className="text-[27px] font-bold tracking-[-0.028em] text-[#213D59] max-md:text-[23px]">
              {section.name}
            </h1>
            <p className="mt-1.5 max-w-[620px] text-[14.5px] text-[#7A8794]">
              {section.desc}
            </p>
            {onOpenReview || onUpload ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {onOpenReview && pendingReviewCount > 0 ? (
                  <button
                    type="button"
                    onClick={onOpenReview}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#EAF6FD] px-3.5 text-[13px] font-semibold text-[#213D59] ring-1 ring-[#3EB1E5]/60 md:h-[34px] md:min-h-[34px]"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#3EB1E5]" />
                    Review {pendingReviewCount}{' '}
                    {pendingReviewCount === 1 ? 'document' : 'documents'}
                  </button>
                ) : null}
                {onUpload ? (
                  <button
                    type="button"
                    onClick={onUpload}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#213D59] px-3.5 text-[13px] font-semibold text-white md:h-[34px] md:min-h-[34px]"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload a document
                  </button>
                ) : null}
                <UploadedDocumentsButton
                  sectionId={apiSectionId}
                  dense
                />
              </div>
            ) : (
              <div className="mt-3">
                <UploadedDocumentsButton
                  sectionId={apiSectionId}
                  dense
                />
              </div>
            )}
          </div>
          {typeof progressValue === 'number' ? (
            <div className="min-w-[180px]">
              <div className="mb-1.5 flex justify-between text-[12px] font-semibold text-[#7A8794]">
                <span>{progressLabel || 'Progress'}</span>
                <span className="tabular-nums">{Math.round(progressValue)}%</span>
              </div>
              <ProgressBar value={progressValue} size="hero" className="bg-[#E4EAF0]" />
              {progressHint ? (
                <p className="mt-2 text-[12px] text-[#7A8794]">{progressHint}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <SectionActivityStrip sectionId={apiSectionId} />
      {children}
    </div>
  );
}
