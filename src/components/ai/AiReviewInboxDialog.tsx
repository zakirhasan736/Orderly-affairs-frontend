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
import type { DashboardNotice } from '@/utils/dashboardNotifications';
import {
  normalizeVaultActivityTab,
  OPEN_VAULT_ACTIVITY_TAB_EVENT,
  type VaultActivityTabInput,
} from '@/utils/vaultActivityTabs';

type AiReviewInboxDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: VaultActivityTabInput;
  onNavigateToSection?: (sectionId: string) => void;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,52rem)] w-[min(100vw-1.5rem,42rem)] flex-col gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-[42rem]">
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
