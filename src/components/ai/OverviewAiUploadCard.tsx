'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { cn } from '@common/ui/utils';
import { AI_DOCUMENT_ACCEPT } from '@/utils/aiDocumentUploadUi';
import type {
  DashboardAiJob,
  DashboardAiJobStatus,
} from '@/hooks/useDashboardAiBatchRunner';
import { upsertAiUploadHistory } from '@/utils/aiUploadHistory';
import { AiUploadHistoryPopup } from '@/components/ai/AiUploadHistoryPopup';

function isActiveStatus(status: DashboardAiJobStatus) {
  return !['queued', 'done', 'error', 'needs_section_choice'].includes(status);
}

function CircularDocProgress({
  progress,
  isWorking,
  compact,
}: {
  progress: number;
  isWorking: boolean;
  compact?: boolean;
}) {
  const size = compact ? 44 : 72;
  const stroke = compact ? 3.5 : 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const displayProgress =
    isWorking && clamped < 8 ? Math.max(clamped, 12) : clamped;
  const offset = circumference - (displayProgress / 100) * circumference;
  const complete = clamped >= 100 && !isWorking;
  const inner = compact ? 'h-8 w-8' : 'h-12 w-12';

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center',
        compact ? 'h-11 w-11' : 'h-[72px] w-[72px]',
        isWorking && 'ai-doc-progress-pulse',
      )}
      aria-hidden
    >
      {isWorking && !compact ? (
        <span className="pointer-events-none absolute inset-0 rounded-full bg-white/25 ai-doc-progress-halo" />
      ) : null}

      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={compact ? '#e8e6e0' : 'rgba(33, 61, 89,0.12)'}
          strokeWidth={stroke}
        />
        <g
          className={cn(isWorking && 'ai-doc-progress-spin')}
          style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={
              complete
                ? '#2B5A8C'
                : compact
                  ? '#213D59'
                  : '#2B5A8C'
            }
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              'transition-[stroke-dashoffset,stroke] duration-700 ease-out',
              isWorking && 'ai-doc-progress-stroke',
            )}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: `${size / 2}px ${size / 2}px`,
            }}
          />
        </g>
      </svg>

      <div
        className={cn(
          'relative z-[1] flex flex-col items-center justify-center rounded-full transition-colors duration-300',
          inner,
          complete
            ? 'bg-[#E8F6F0] text-[#1F9D6B]'
            : isWorking
              ? 'bg-[#213D59] text-white'
              : 'bg-[rgba(33,61,89,0.05)] text-[#213D59]',
        )}
      >
        {complete ? (
          <CheckCircle2 className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        ) : isWorking ? (
          <span
            className={cn(
              'font-bold leading-none tabular-nums',
              compact ? 'text-[9px]' : 'text-[12px]',
            )}
          >
            {Math.round(clamped)}%
          </span>
        ) : (
          <FileText className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        )}
      </div>
    </div>
  );
}

type OverviewAiUploadCardProps = {
  className?: string;
  jobs: DashboardAiJob[];
  enqueueFiles: (
    files: FileList | File[],
    opts?: { sectionId?: string; source?: 'overview' | 'section' },
  ) => void;
  dismissJob?: (jobId: string) => void;
  maxConcurrent?: number;
  hasReviewableDocs?: boolean;
  onOpenReview?: () => void;
  /** When set, click opens the right upload drawer instead of the file picker. */
  onOpenDrawer?: () => void;
};

export function OverviewAiUploadCard({
  className,
  jobs,
  enqueueFiles,
  dismissJob,
  hasReviewableDocs = false,
  onOpenReview,
  onOpenDrawer,
}: OverviewAiUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    jobs.forEach(job => {
      upsertAiUploadHistory({
        id: job.id,
        fileName: job.fileName,
        status: job.status,
        progress:
          job.status === 'done' || job.status === 'error'
            ? 100
            : job.status === 'needs_section_choice'
              ? 80
              : Math.max(0, Math.min(99, job.progress || 0)),
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        fileId: job.file_id,
        mimeType: job.mime_type,
        sectionId: job.targetSectionId || undefined,
        sectionIds: job.targetSectionId
          ? [String(job.targetSectionId)]
          : undefined,
        targetSectionLabel: job.targetSectionLabel,
        error: job.error,
        source: 'overview',
      });
    });
  }, [jobs]);

  const onFiles = useCallback(
    (list: FileList | File[] | null) => {
      if (!list || !list.length) return;
      enqueueFiles(list);
    },
    [enqueueFiles],
  );

  const batchProgress = useMemo(() => {
    if (!jobs.length) return 0;
    const sum = jobs.reduce((total, job) => {
      if (job.status === 'done') return total + 100;
      if (job.status === 'error') return total + 100;
      return total + Math.max(0, Math.min(99, job.progress || 0));
    }, 0);
    return Math.round(sum / jobs.length);
  }, [jobs]);

  const isWorking = jobs.some(
    job => job.status === 'queued' || isActiveStatus(job.status),
  );
  const doneCount = jobs.filter(job => job.status === 'done').length;
  const totalCount = jobs.length;

  const summaryText = useMemo(() => {
    if (!totalCount) {
      return 'Policies, IDs, deeds, statements — drop them here and we fill the matching sections.';
    }
    if (isWorking) {
      const live = jobs.find(
        job =>
          job.status !== 'queued' &&
          job.status !== 'done' &&
          job.status !== 'error',
      );
      return live?.message || `Processing ${doneCount} of ${totalCount}…`;
    }
    if (doneCount === totalCount && totalCount > 0) {
      return `All ${totalCount} document${totalCount === 1 ? '' : 's'} filled.`;
    }
    return `${doneCount} of ${totalCount} document${totalCount === 1 ? '' : 's'} ready.`;
  }, [doneCount, isWorking, jobs, totalCount]);

  const liveTitle = useMemo(() => {
    if (!isWorking) return 'Upload a document';
    const live = jobs.find(
      job =>
        job.status !== 'queued' &&
        job.status !== 'done' &&
        job.status !== 'error',
    );
    if (live?.status === 'filling') return 'Filling matched fields…';
    if (live?.status === 'routing') return 'Matching vault sections…';
    if (live?.status === 'almost') return 'Finishing the read…';
    if (live?.status === 'uploading' || live?.status === 'starting') {
      return 'Uploading securely…';
    }
    if (live?.readSource === 'system') return 'Our system is reading…';
    if (live?.readSource === 'cache') return 'Reusing a prior read…';
    return 'Virtual Assistant is reading…';
  }, [isWorking, jobs]);

  const openPicker = () => inputRef.current?.click();
  const activate = () => openPicker();

  return (
    <section className={cn('space-y-2', className)} data-ai-overview-upload>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={AI_DOCUMENT_ACCEPT}
        multiple
        onChange={event => {
          onFiles(event.currentTarget.files);
          event.currentTarget.value = '';
          onOpenDrawer?.();
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={activate}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            const target = event.target as HTMLElement | null;
            if (
              target?.closest(
                'input, textarea, select, [contenteditable="true"]',
              )
            ) {
              return;
            }
            event.preventDefault();
            activate();
          }
        }}
        onDragEnter={event => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={event => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={event => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setIsDragging(false);
        }}
        onDrop={event => {
          event.preventDefault();
          setIsDragging(false);
          onFiles(event.dataTransfer.files);
          onOpenDrawer?.();
        }}
        className={cn(
          'relative flex cursor-pointer flex-wrap items-center gap-[18px] overflow-hidden rounded-[16px] border-2 border-dashed px-6 py-[22px] transition',
          isDragging
            ? 'border-[#3EB1E5] bg-[#EAF6FD]'
            : 'border-[#E4EAF0] bg-[#F6F8FA] hover:border-[#3EB1E5] hover:bg-[#EAF6FD]',
        )}
      >
        <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[13px] border border-[#E4EAF0] bg-white text-[#619FCE]">
          {onOpenDrawer && !isWorking ? (
            <UploadCloud className="h-[21px] w-[21px]" />
          ) : (
            <CircularDocProgress
              progress={totalCount ? batchProgress : 0}
              isWorking={isWorking}
              compact
            />
          )}
        </span>
        <div className="min-w-[200px] flex-1">
          <p className="text-[15.5px] font-bold text-[#213D59]">
            {isWorking ? liveTitle : 'Drop files here or browse'}
          </p>
          <p className="mt-0.5 text-[13.5px] text-[#7A8794]">
            {isWorking
              ? summaryText
              : 'PDF, JPG, PNG, HEIC. Up to 15 MB each.'}
          </p>
          {onOpenDrawer ? (
            <div className="mt-3 flex flex-wrap gap-[7px]">
              {[
                'Personal',
                'Employment',
                'Education',
                'Insurance',
                'Banking',
                'Healthcare',
                'Legal',
                'Assets',
              ].map(tag => (
                <span
                  key={tag}
                  className="rounded-full bg-[#EFF3F7] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#6A7481]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {onOpenDrawer ? (
          <div
            className="flex shrink-0 flex-wrap items-center gap-2"
            onClick={event => event.stopPropagation()}
            onKeyDown={event => event.stopPropagation()}
          >
            {hasReviewableDocs && onOpenReview ? (
              <button
                type="button"
                onClick={onOpenReview}
                className="inline-flex h-10 items-center rounded-full border border-[#3EB1E5] bg-white px-4 text-[13px] font-semibold text-[#213D59] hover:bg-[#EAF6FD]"
              >
                Review pending
              </button>
            ) : null}
            <span
              role="button"
              tabIndex={0}
              onClick={openPicker}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openPicker();
                }
              }}
              className="inline-flex h-10 shrink-0 items-center rounded-full bg-[#213D59] px-[18px] text-[14px] font-semibold text-white"
            >
              Choose files
            </span>
          </div>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div
              onClick={event => event.stopPropagation()}
              onKeyDown={event => event.stopPropagation()}
            >
              <AiUploadHistoryPopup
                jobs={jobs}
                absolute={false}
                source="overview"
                variant="dialog"
                onDismissJob={dismissJob}
              />
            </div>
            {hasReviewableDocs && onOpenReview ? (
              <Button
                type="button"
                variant="outline"
                onClick={event => {
                  event.stopPropagation();
                  onOpenReview();
                }}
                className="h-11 shrink-0 rounded-xl border-[#213D59]/25 bg-[#EAF6FD] px-3 text-[12px] font-semibold text-[#213D59] hover:bg-[#EAF6FD] sm:px-4 sm:text-[13px]"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Review & assign
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={event => {
                event.stopPropagation();
                openPicker();
              }}
              className="h-11 shrink-0 rounded-xl bg-[var(--ink)] px-4 text-[12px] font-semibold text-white hover:bg-[var(--accent-teal)] sm:px-5 sm:text-[13px]"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
