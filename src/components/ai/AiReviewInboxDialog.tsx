'use client';

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { AiReviewInboxPanel } from '@/components/ai/AiReviewInboxPanel';
import type { OverviewExpiryAlert } from '@/utils/overviewExpiryAlerts';
import {
  filterVisibleNotices,
  markAllNoticesRead,
  type DashboardNotice,
} from '@/utils/dashboardNotifications';
import { listDashboardAiPatches } from '@/utils/aiDashboardPatchCache';
import { markAllAiReviewsRead } from '@/utils/vaultAlertState';
import {
  normalizeVaultActivityTab,
  OPEN_VAULT_ACTIVITY_TAB_EVENT,
  type VaultActivityTabInput,
} from '@/utils/vaultActivityTabs';
import { cn } from '@common/ui/utils';

type AiReviewInboxDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: VaultActivityTabInput;
  onNavigateToSection?: (sectionId: string) => void;
  onOpenNotificationSettings?: () => void;
  ownerName?: string | null;
  ownerEmail?: string | null;
  reminders?: OverviewExpiryAlert[];
  notices?: DashboardNotice[];
};

/**
 * Header bell → Vault activity (To review / Vault docs / Due dates).
 */
export function AiReviewInboxDialog({
  open,
  onOpenChange,
  initialTab = 'alerts',
  onNavigateToSection,
  onOpenNotificationSettings,
  ownerName,
  ownerEmail,
  reminders = [],
  notices = [],
}: AiReviewInboxDialogProps) {
  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(
      new CustomEvent(OPEN_VAULT_ACTIVITY_TAB_EVENT, {
        detail: { tab: normalizeVaultActivityTab(initialTab) },
      }),
    );
  }, [open, initialTab]);

  // Opening vault activity = viewed alerts — clear header bell badge.
  useEffect(() => {
    if (!open) return;
    const noticeIds = filterVisibleNotices(notices, 50).map(n => n.id);
    if (noticeIds.length > 0) {
      markAllNoticesRead(noticeIds);
    }
    const reviewItems = listDashboardAiPatches()
      .map(entry => ({
        sectionId: String(entry.section_id || '').trim(),
        fileId: String(entry.file_id || '').trim(),
      }))
      .filter(
        item =>
          item.sectionId &&
          item.sectionId !== 'overview' &&
          item.fileId,
      );
    if (reviewItems.length > 0) {
      markAllAiReviewsRead(reviewItems);
    }
  }, [open, notices]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        No CSS transform: Chrome blanks PDF thumbnails/iframes inside
        transformed ancestors (Radix default centering uses translate).
      */}
      <DialogContent
        className={cn(
          'flex max-h-[min(92dvh,52rem)] w-[min(100vw-1.5rem,42rem)] flex-col gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-[42rem]',
          '!left-[max(0.75rem,calc(50%-min(21rem,calc(50vw-0.75rem))))] !right-auto !top-[3vh]',
          '!translate-x-0 !translate-y-0',
          'data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100',
        )}
      >
        <DialogTitle className="sr-only">Vault activity</DialogTitle>
        <DialogDescription className="sr-only">
          To review, vault documents, and due dates
        </DialogDescription>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl shadow-2xl ring-1 ring-black/10">
          <AiReviewInboxPanel
            onNavigateToSection={sectionId => {
              onOpenChange(false);
              onNavigateToSection?.(sectionId);
            }}
            onOpenNotificationSettings={
              onOpenNotificationSettings
                ? () => {
                    onOpenChange(false);
                    onOpenNotificationSettings();
                  }
                : undefined
            }
            ownerName={ownerName}
            ownerEmail={ownerEmail}
            reminders={reminders}
            notices={notices}
            className="border-0 shadow-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
