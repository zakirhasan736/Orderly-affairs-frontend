'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { AccessManagement, type AccessManagementHandle } from '@/components/AccessManagement';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileKey2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/components/common/ui/utils';

const SECTION_2A = {
  id: '2A',
  title: 'Kit Access Control',
};

const GUIDE_STEPS = [
  {
    title: 'Add next of kin',
    text: 'Invite up to 5 people who can open your kit dashboard — full kit or up to 5 specific sections.',
    icon: UserPlus,
  },
  {
    title: 'Set access & timing',
    text: 'Choose immediate login (email with password) or upon-death access (password card). Next of kin is view-only.',
    icon: ShieldCheck,
  },
  {
    title: 'Password card',
    text: 'Print each card and store it securely. Tell people where it is — not the password itself.',
    icon: FileKey2,
  },
  {
    title: 'Stay notified',
    text: 'You get an alert when someone logs in. Revoke one person or everyone anytime.',
    icon: Bell,
  },
];

const SECURITY_RULES = [
  'Do not give anyone their Master Access Password directly.',
  'Only tell them where their printed Password Card is stored.',
  'Add at least 1 trusted next of kin to enable emergency access.',
  'Maximum 5 next-of-kin accounts. Family edit roles are managed in Vault Settings — not here.',
  'Use Revoke All if you need to immediately lock everyone out.',
];

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  isActive?: boolean;
}

function GuideAccordion({ className }: { className?: string }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-3.5 sm:rounded-3xl sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold text-amber-950">Security</h4>
        </div>
        <ul className="mt-2.5 space-y-2">
          {SECURITY_RULES.map(rule => (
            <li
              key={rule}
              className="flex gap-2 text-xs leading-5 text-amber-950/85 sm:text-sm sm:leading-6"
            >
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 sm:h-4 sm:w-4" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border bg-card p-3.5 shadow-sm sm:rounded-3xl sm:p-4">
        <h4 className="text-sm font-semibold">How it works</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tap a step for details.
        </p>
        <ol className="mt-3 space-y-1">
          {GUIDE_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isOpen = openIndex === index;
            return (
              <li key={step.title} className="overflow-hidden rounded-xl border">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-muted/30"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    {index + 1}. {step.title}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {isOpen && (
                  <p className="border-t bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
                    {step.text}
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-muted/20 px-3 py-2 text-center text-[11px] leading-4 text-muted-foreground sm:text-xs sm:leading-5">
          <KeyRound className="mr-1 inline h-3 w-3 align-text-bottom" />
          Immediate = email login · Upon death = printed password card
        </p>
      </div>
    </div>
  );
}

function MobileGuide() {
  return (
    <details className="group rounded-2xl border bg-card lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">How it works & security</p>
            <p className="text-xs text-muted-foreground">4 steps · security rules</p>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
      </summary>
      <div className="border-t px-3 pb-4 pt-3">
        <GuideAccordion />
      </div>
    </details>
  );
}

export default function Section2AccessManagement({ isActive = false }: Props) {
  const accessRef = React.useRef<AccessManagementHandle>(null);

  return (
    <Card
      id="subsection-2A"
      className={cn(
        'overflow-hidden rounded-3xl border-slate-200/80 shadow-sm transition-all',
        isActive && 'bg-primary/[0.02] ring-2 ring-primary/40',
      )}
    >
      <CardHeader className="border-b px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2.5 text-base sm:gap-3 sm:text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground sm:h-9 sm:w-9 sm:text-sm">
              {SECTION_2A.id}
            </span>
            <span>{SECTION_2A.title}</span>
          </CardTitle>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            Add at least 1 trusted person to enable emergency access
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-3 sm:space-y-5 sm:p-6">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-6">
          <div
            id="access-management-panel"
            className="min-w-0 scroll-mt-6 rounded-2xl border border-slate-200/80 bg-background sm:rounded-3xl"
          >
            <div className="p-3 sm:p-5">
              <AccessManagement ref={accessRef} embedded />
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <GuideAccordion />
            </div>
          </aside>
        </div>

        <MobileGuide />
      </CardContent>
    </Card>
  );
}
