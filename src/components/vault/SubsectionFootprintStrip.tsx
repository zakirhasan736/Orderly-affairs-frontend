'use client';

import React from 'react';
import { SectionLastUpdatedPin } from '@/components/vault/SectionLastUpdatedPin';
import { cn } from '@common/ui/utils';

/**
 * Always-visible footprint strip for the active subsection / item.
 */
export function SubsectionFootprintStrip({
  sectionId,
  subsectionId,
  topicId,
  className,
}: {
  sectionId: string;
  subsectionId: string | null;
  topicId?: string | null;
  className?: string;
}) {
  if (!subsectionId) return null;

  let scopeId: string | null = subsectionId;
  if (topicId) {
    const parts = String(topicId).split(':');
    if (parts.length >= 3) {
      scopeId = `${subsectionId}:${Number(parts[2]) || 0}`;
    } else if (parts.length === 2) {
      scopeId = `${subsectionId}:${Number(parts[1]) || 0}`;
    }
  }

  return (
    <div
      className={cn(
        'mb-2 flex flex-wrap items-center gap-2',
        className,
      )}
    >
      <SectionLastUpdatedPin
        sectionId={sectionId}
        subsectionId={subsectionId}
        scopeId={scopeId}
        label="Last update here"
        compact
      />
    </div>
  );
}
