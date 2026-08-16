'use client';

import React from 'react';
import { AccessManagement, type AccessManagementHandle } from '@/components/AccessManagement';
import { FamilyAccessManagement } from '@/components/vault/FamilyAccessManagement';
import { FamilyRoleAreaDefaultsDialog } from '@/components/vault/FamilyRoleAreaDefaultsDialog';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileKey2,
  KeyRound,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { cn } from '@/components/common/ui/utils';

const SECTION_2A = {
  id: '2A',
  title: 'Access Control',
};

const GUIDE_STEPS = [
  {
    title: 'Add next of kin',
    text: 'Invite up to 5 people who can access your Vault in an emergency: full Vault or up to 5 specific sections. Next of kin is view-only.',
    icon: UserPlus,
  },
  {
    title: 'Add family & others',
    text: 'Invite up to 5 family, friends, or advisors who can view or edit your Vault while you are living. Choose their role and which areas they can open.',
    icon: Users,
  },
  {
    title: 'Set access & timing',
    text: 'For next of kin, choose immediate login (email with password) or upon-death access (password card). Family collaborators use their own family login.',
    icon: ShieldCheck,
  },
  {
    title: 'Password card',
    text: 'Print each next-of-kin card and store it securely. Tell people where it is, not the password itself.',
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
  'Maximum 5 next-of-kin accounts and 5 family/other collaborators.',
  'Family & others (below) can view or edit the vault. Next of kin is view-only.',
  'Use Revoke All if you need to immediately lock next-of-kin access.',
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
            <p className="text-xs text-muted-foreground">5 steps · security rules</p>
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
  const [familyRoleAreasOpen, setFamilyRoleAreasOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<
    'all' | 'kin' | 'contributors' | 'activity'
  >('all');

  const showKin = filter === 'all' || filter === 'kin';
  const showContributors = filter === 'all' || filter === 'contributors';
  const showActivity = filter === 'activity';

  return (
    <div id="subsection-2A" className={cn('space-y-5', isActive && 'ring-0')}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[16px] border border-[#E4EAF0] border-t-[3px] border-t-[#213D59] bg-white p-[18px] max-md:rounded-[14px]">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#213D59] text-white">
              <Users className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-[16px] font-bold text-[#213D59]">Next of kin</p>
              <p className="text-[12.5px] text-[#7A8794]">Access after you pass</p>
            </div>
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] text-[#414A55]">
            <li>Sees nothing at all while you are living</li>
            <li>Reaches the next of kin portal once your Vault unlocks</li>
            <li>Gets their own sealed letter from you</li>
            <li>Read only, they settle your affairs, they do not edit your Vault</li>
          </ul>
        </div>
        <div className="rounded-[16px] border border-[#E4EAF0] border-t-[3px] border-t-[#1F9D6B] bg-white p-[18px] max-md:rounded-[14px]">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#E8F6F0] text-[#1F9D6B]">
              <UserPlus className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-[16px] font-bold text-[#213D59]">Contributor</p>
              <p className="text-[12.5px] text-[#7A8794]">Access starting now</p>
            </div>
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] text-[#414A55]">
            <li>Works in your Vault today, alongside you</li>
            <li>You set view or edit for every section, one at a time</li>
            <li>Edit means they can add, change, and delete entries in that section</li>
            <li>Every change is logged with their name and the time</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 rounded-[16px] border border-[#CFE6F5] bg-[#EAF6FD] px-4 py-3.5 text-[13.5px] text-[#213D59] max-md:rounded-[14px]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          The two roles are independent. A spouse is usually both: a contributor today
          and a next of kin later. An attorney is often next of kin only.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {(
            [
              ['all', 'Everyone'],
              ['kin', 'Next of kin'],
              ['contributors', 'Contributors'],
              ['activity', 'Activity log'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                'inline-flex h-10 items-center rounded-full border px-3.5 text-[13px] font-semibold',
                filter === id
                  ? 'border-[#213D59] bg-[#213D59] text-white'
                  : 'border-[#E4EAF0] bg-white text-[#213D59]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => accessRef.current?.openAddWizard()}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#213D59] px-[18px] text-[14px] font-semibold text-white"
        >
          <UserPlus className="h-4 w-4" />
          Invite a person
        </button>
        <button
          type="button"
          onClick={() => setFamilyRoleAreasOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#E4EAF0] bg-white px-4 text-[14px] font-semibold text-[#213D59]"
        >
          <Settings2 className="h-4 w-4" />
          Role defaults
        </button>
      </div>

      <div className={cn(showActivity && 'hidden')}>
        <div className={cn(!showKin && 'hidden', 'space-y-5')}>
          <div className="flex items-center gap-3">
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-[#213D59] text-white">
              <Users className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[17px] font-bold tracking-[-0.02em] text-[#213D59]">
                Next of kin
              </h3>
              <p className="text-[12.5px] text-[#7A8794]">
                Nothing visible until your Vault unlocks. Read only after that.
              </p>
            </div>
          </div>

          <div
            id="access-management-panel"
            className="scroll-mt-6 overflow-hidden rounded-[16px] border border-[#E4EAF0] bg-white max-md:rounded-[14px]"
          >
            <div className="p-3 sm:p-5">
              <AccessManagement ref={accessRef} embedded />
            </div>
          </div>
        </div>

        <div className={cn(!showContributors && 'hidden', 'mt-5 space-y-5')}>
          <div className="flex items-center gap-3">
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-[#E8F6F0] text-[#1F9D6B]">
              <Users className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[17px] font-bold tracking-[-0.02em] text-[#213D59]">
                Contributors
              </h3>
              <p className="text-[12.5px] text-[#7A8794]">
                People who can view or edit your Vault today.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFamilyRoleAreasOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-full bg-[#EAF6FD] text-[#213D59]"
              aria-label="Manage default access areas by role"
            >
              <Settings2 className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div
            id="family-access-panel"
            className="scroll-mt-6 overflow-hidden rounded-[16px] border border-[#E4EAF0] bg-white max-md:rounded-[14px]"
          >
            <div className="p-3 sm:p-5">
              <FamilyAccessManagement variant="access-management" />
            </div>
          </div>
        </div>
      </div>

      {showActivity ? (
        <div className="rounded-[16px] border border-[#E4EAF0] bg-white p-5 max-md:rounded-[14px]">
          <p className="text-[15px] font-bold text-[#213D59]">Activity log</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#7A8794]">
            Every contributor change is stored with their name and the time. Open
            a contributor card to review the areas they can view or edit.
          </p>
          <button
            type="button"
            onClick={() => setFilter('contributors')}
            className="mt-4 inline-flex h-10 items-center rounded-full border border-[#E4EAF0] bg-white px-4 text-[13px] font-semibold text-[#213D59]"
          >
            View contributors
          </button>
        </div>
      ) : null}

      <MobileGuide />

      <FamilyRoleAreaDefaultsDialog
        open={familyRoleAreasOpen}
        onOpenChange={setFamilyRoleAreasOpen}
      />
    </div>
  );
}
