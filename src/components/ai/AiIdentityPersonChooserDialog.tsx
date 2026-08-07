'use client';

import React, { useEffect, useState } from 'react';
import { IdCard, User, Users, Baby, UserRound } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import type { IdentityPersonChoice } from '@/utils/aiIdentityDocument';
import {
  resolveIdentityPersonPrompt,
  subscribeIdentityPersonPrompt,
  type IdentityPersonPromptDetail,
} from '@/utils/aiIdentityPersonPrompt';
import {
  AI_MOBILE_ACTION_BUTTON,
  AI_ROUTING_DIALOG_SHEET,
} from '@/utils/aiMobileUi';
import { cn } from '@common/ui/utils';

const OPTIONS: Array<{
  choice: IdentityPersonChoice;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    choice: 'self',
    label: 'Me (primary)',
    description: 'Fill Vital Information for the vault owner',
    icon: User,
  },
  {
    choice: 'spouse',
    label: 'Spouse / partner',
    description: 'Add or update a Family Members card',
    icon: Users,
  },
  {
    choice: 'dependent',
    label: 'Dependent',
    description: 'Add or update a Dependents card (child, etc.)',
    icon: Baby,
  },
  {
    choice: 'other',
    label: 'Someone else',
    description: 'Add a Family Members card for another relative',
    icon: UserRound,
  },
];

/**
 * Global listener dialog — mounts once under AiDocumentRoutingProvider.
 */
export function AiIdentityPersonChooserDialog() {
  const [detail, setDetail] = useState<IdentityPersonPromptDetail | null>(null);

  useEffect(() => subscribeIdentityPersonPrompt(setDetail), []);

  const open = Boolean(detail);
  const isInsurance = detail?.kind === 'insurance';
  const documentLabel =
    detail?.documentLabel ||
    (isInsurance ? 'Health insurance card' : 'Identification document');
  const personName = detail?.personName?.trim() || null;

  const choose = (choice: IdentityPersonChoice | null) => {
    resolveIdentityPersonPrompt(choice);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) choose(null);
      }}
    >
      <DialogContent className={AI_ROUTING_DIALOG_SHEET}>
        <DialogHeader className="text-left">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-800 ring-1 ring-sky-200">
            <IdCard className="h-5 w-5" />
          </div>
          <DialogTitle className="text-left text-base leading-snug sm:text-lg">
            Whose {documentLabel.toLowerCase()} is this?
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2 text-sm leading-relaxed text-slate-600">
            <p>
              {isInsurance
                ? 'We found health insurance details on this upload. Choose who this card covers so member ID, group number, and benefits land on the right policy.'
                : 'We found identity details on this upload. Choose where they belong so we don’t overwrite the wrong person’s Vital Information.'}
            </p>
            {personName ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-900">
                Name on document: {personName}
              </p>
            ) : null}
            {detail?.fileName ? (
              <p className="text-xs text-slate-500">File: {detail.fileName}</p>
            ) : null}
            {detail?.documentSummary ? (
              <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700">
                {detail.documentSummary}
              </p>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {OPTIONS.map(option => {
            const Icon = option.icon;
            const description = isInsurance
              ? option.choice === 'self'
                ? 'Save on your Health insurance policy card'
                : option.choice === 'spouse'
                  ? 'Tag as Spouse/Partner on the insurance policy'
                  : option.choice === 'dependent'
                    ? 'Tag as Dependent on the insurance policy'
                    : 'Tag as Other covered person on the insurance policy'
              : option.description;
            return (
              <button
                key={option.choice}
                type="button"
                onClick={() => choose(option.choice)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-left transition',
                  'hover:border-[#213D59]/35 hover:bg-[#f4f7fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#213D59]/30',
                )}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef3f8] text-[#213D59]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-600">
                    {description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className={AI_MOBILE_ACTION_BUTTON}
            onClick={() => choose(null)}
          >
            Skip for now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
