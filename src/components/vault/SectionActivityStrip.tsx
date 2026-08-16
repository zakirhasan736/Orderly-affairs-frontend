'use client';

import React from 'react';
import { CloudUpload } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { SectionLastUpdatedPin } from '@/components/vault/SectionLastUpdatedPin';
import { SectionUpdateRecipientsPicker } from '@/components/vault/SectionUpdateRecipientsPicker';
import { useUploadedDocuments } from '@/hooks/useUploadedDocuments';

type SectionActivityStripProps = {
  sectionId: string;
  subsectionId?: string | null;
  topicId?: string | null;
  className?: string;
  showRecipients?: boolean;
};

function scopeFromTopic(
  subsectionId?: string | null,
  topicId?: string | null,
) {
  if (!subsectionId) return null;
  if (!topicId) return subsectionId;
  const parts = String(topicId).split(':');
  if (parts.length >= 3) return `${subsectionId}:${Number(parts[2]) || 0}`;
  if (parts.length === 2) return `${subsectionId}:${Number(parts[1]) || 0}`;
  return subsectionId;
}

/**
 * Dashed status bar on every section: last-updated footprint,
 * who receives the update notice, and Overview-linked hint.
 * Section documents live next to Expand all / Collapse all, not here.
 */
export function SectionActivityStrip({
  sectionId,
  subsectionId,
  topicId,
  className,
  showRecipients = true,
}: SectionActivityStripProps) {
  const { linkedFromOverview } = useUploadedDocuments(sectionId);
  const scopeId = scopeFromTopic(subsectionId, topicId);

  return (
    <div
      className={cn(
        'mb-3 flex flex-wrap items-center gap-3 rounded-[14px] border border-dashed border-[#C9E4F5] bg-[#F3F9FD] px-3 py-2.5',
        className,
      )}
    >
      <SectionLastUpdatedPin
        sectionId={sectionId}
        subsectionId={subsectionId}
        scopeId={scopeId}
        label="Updated"
        className="border-transparent bg-transparent px-0 shadow-none"
      />
      {showRecipients ? (
        <SectionUpdateRecipientsPicker sectionId={sectionId} compact />
      ) : null}
      {linkedFromOverview ? (
        <div className="inline-flex min-w-0 items-center gap-1.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[#3EB1E5] ring-1 ring-[#E4EAF0]">
            <CloudUpload className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-semibold text-[#2E7FAD]">
              Linked from Overview
            </span>
            <span className="block truncate text-[10px] text-[#7A8794]">
              Read on Overview — no re-read needed
            </span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
