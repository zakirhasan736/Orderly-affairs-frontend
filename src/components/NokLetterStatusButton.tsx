'use client';

import { FileText } from 'lucide-react';
import { Button } from '@common/ui/button';
import { cn } from '@common/ui/utils';
import { useGetNokLetterQuery } from '@/services/nokLetterApi';
import {
  resolveNokLetterUiStatus,
  type NokLetterUiStatus,
} from '@/utils/nokLetterPreview';
import { goToNokLetter } from '@/vault-prototype/navigate';

const LABEL: Record<NokLetterUiStatus, string> = {
  needs_write: 'Needs to be written',
  saved: 'Letter saved',
  sent: 'Letter sent',
};

function nokLetterBadgeLabel(status: NokLetterUiStatus): {
  text: string;
  tone: 'wait' | 'ok';
} {
  return {
    text: LABEL[status],
    tone: status === 'needs_write' ? 'wait' : 'ok',
  };
}

export function NokLetterStatusButton({
  nokId,
  enabled,
  className,
  compact,
}: {
  nokId?: string;
  enabled: boolean;
  className?: string;
  compact?: boolean;
}) {
  const { data, isError } = useGetNokLetterQuery(
    { nokId: nokId || '' },
    { skip: !enabled || !nokId },
  );
  if (!enabled || !nokId) return null;

  const status = isError
    ? 'needs_write'
    : resolveNokLetterUiStatus(data);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        compact
          ? 'h-9 flex-1 justify-start rounded-xl text-xs font-medium sm:w-full sm:flex-none'
          : 'h-9 rounded-xl text-xs font-medium',
        status === 'needs_write' && 'border-[#E8C98A] bg-[#FDF4E4] text-[#B4761A]',
        status === 'saved' && 'border-[#CDE8DA] bg-[#E8F6F0] text-[#1F9D6B]',
        status === 'sent' && 'border-[#CDE8DA] bg-[#E8F6F0] text-[#1F9D6B]',
        className,
      )}
      onClick={() => goToNokLetter(nokId)}
    >
      <FileText className="mr-1.5 h-3.5 w-3.5 shrink-0" />
      {LABEL[status]}
    </Button>
  );
}

export function NokLetterStatusBadge({
  nokId,
  enabled,
}: {
  nokId?: string;
  enabled: boolean;
}) {
  const { data, isError } = useGetNokLetterQuery(
    { nokId: nokId || '' },
    { skip: !enabled || !nokId },
  );
  if (!enabled) return null;
  const status = isError ? 'needs_write' : resolveNokLetterUiStatus(data);
  const badge = nokLetterBadgeLabel(status);
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        badge.tone === 'wait'
          ? 'bg-[#FDF4E4] text-[#B4761A]'
          : 'bg-[#E8F6F0] text-[#1F9D6B]',
      )}
    >
      {badge.text}
    </span>
  );
}
