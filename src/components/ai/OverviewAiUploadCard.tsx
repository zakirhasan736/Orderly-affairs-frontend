'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  FileText,
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
  return !['queued', 'done', 'error'].includes(status);
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
          stroke={compact ? '#e8e6e0' : 'rgba(19,43,38,0.12)'}
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
                ? '#2e7d6e'
                : compact
                  ? '#132b26'
                  : '#2e7d6e'
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
            ? 'bg-[rgba(46,125,110,0.12)] text-[#2e7d6e]'
            : isWorking
              ? 'bg-[#132b26] text-white'
              : 'bg-[rgba(19,43,38,0.05)] text-[#132b26]',
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
  enqueueFiles: (files: FileList | File[]) => void;
  dismissJob?: (jobId: string) => void;
  maxConcurrent?: number;
};

export function OverviewAiUploadCard({
  className,
  jobs,
  enqueueFiles,
  dismissJob,
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
          job.status === 'done'
            ? 100
            : job.status === 'error'
              ? 100
              : Math.max(0, Math.min(99, job.progress || 0)),
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        fileId: job.file_id,
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
    if (live?.status === 'filling' || live?.status === 'routing') {
      return 'Filling matched sections…';
    }
    if (live?.status === 'almost') return 'Almost done…';
    if (live?.status === 'uploading') return 'Uploading…';
    return 'Reading document…';
  }, [isWorking, jobs]);

  const openPicker = () => inputRef.current?.click();

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
        }}
      />

      {/* Single navy drop zone — mobile + desktop */}
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
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
        }}
        className={cn(
          'relative cursor-pointer overflow-hidden rounded-[20px] border border-dashed p-4 transition sm:p-5',
          isDragging
            ? 'border-[var(--accent-teal)] bg-[rgba(46,125,110,0.08)] scale-[1.01]'
            : 'border-[rgba(19,43,38,0.18)] bg-[var(--surface)] hover:border-[var(--accent-teal)]',
        )}
      >
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <CircularDocProgress
              progress={totalCount ? batchProgress : 0}
              isWorking={isWorking}
              compact
            />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-snug text-[var(--ink)] sm:text-base">
                {isWorking
                  ? liveTitle
                  : 'Document inbox — drop files to fill matching sections'}
              </p>
              <p className="mt-1 text-[12px] text-[var(--ink-muted)] sm:text-[13px]">
                {summaryText}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
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
        </div>
      </div>
    </section>
  );
}
