'use client';

import React, { useMemo } from 'react';
import { Button } from '@common/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@common/ui/dialog';
import { Loader2 } from 'lucide-react';
import {
  MobileBottomSheet,
  MOBILE_NESTED_SHEET_Z,
  MOBILE_SHEET_SCROLL_PADDING,
  useFrozenIsMobile,
} from '@/components/MobileBottomSheet';
import { useGetNokLetterQuery } from '@/services/nokLetterApi';
import type { NextKinAccessResponse } from '@/services/authApi';
import {
  buildNokLetterPreviewText,
  type NokLetterData,
} from '@/utils/nokLetterPreview';

function LetterPreviewBody({
  letterPreview,
  nokEmail,
}: {
  letterPreview: string;
  nokEmail?: string;
}) {
  return (
    <div className="mx-auto max-w-[57.6rem] rounded-2xl border bg-white px-5 py-7 shadow-xl sm:px-12 sm:py-12">
      <div className="mb-8 border-b pb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Orderly Affairs
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-gray-950">
          Letter to Next of Kin
        </h3>
        {nokEmail && (
          <p className="mt-2 break-all text-sm text-gray-500">
            Prepared for {nokEmail}
          </p>
        )}
      </div>
      <div className="whitespace-pre-line font-serif text-[14px] leading-7 text-gray-800 sm:text-[15px] sm:leading-8">
        {letterPreview}
      </div>
    </div>
  );
}

export function NokLetterPreviewDialog({
  open,
  onClose,
  nokId,
  person,
  fallbackData,
  ownerName,
}: {
  open: boolean;
  onClose: () => void;
  nokId: string;
  person?: NextKinAccessResponse | null;
  fallbackData?: NokLetterData;
  /** Kit owner's display name for the printed signature line. */
  ownerName?: string | null;
}) {
  const isMobile = useFrozenIsMobile(open);
  const { data: serverData, isFetching } = useGetNokLetterQuery(
    { nokId },
    { skip: !open || !nokId },
  );

  const letterPreview = useMemo(() => {
    const merged = {
      ...(fallbackData || {}),
      ...(serverData || {}),
    } as NokLetterData;
    return buildNokLetterPreviewText(merged, person, ownerName);
  }, [serverData, fallbackData, person, ownerName]);

  const nokEmail =
    serverData?.nok_email || person?.email || fallbackData?.nok_email;

  const body = isFetching ? (
    <div className="flex items-center justify-center gap-3 py-16">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Loading letter…</span>
    </div>
  ) : (
    <LetterPreviewBody letterPreview={letterPreview} nokEmail={nokEmail} />
  );

  if (isMobile) {
    return (
      <MobileBottomSheet
        open={open}
        onClose={onClose}
        className="h-[92dvh]"
        labelledBy="nok-preview-title"
        zClassName={MOBILE_NESTED_SHEET_Z}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <h3 id="nok-preview-title" className="text-lg font-semibold">
              Letter Preview
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl"
            >
              Close
            </Button>
          </div>
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 ${MOBILE_SHEET_SCROLL_PADDING}`}
          >
            {body}
          </div>
        </div>
      </MobileBottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent
        className="z-[140] max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[67.2rem] sm:max-w-[67.2rem] overflow-hidden p-0"
        onOpenAutoFocus={event => event.preventDefault()}
        onFocusOutside={event => event.preventDefault()}
        onPointerDownOutside={event => {
          const target = event.target as HTMLElement | null;
          if (target?.closest('[data-slot="dialog-overlay"]')) return;
          event.preventDefault();
        }}
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Letter Preview</DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(90vh-4.5rem)] overflow-y-auto bg-muted/30 p-4 sm:p-6">
          {body}
        </div>
      </DialogContent>
    </Dialog>
  );
}
