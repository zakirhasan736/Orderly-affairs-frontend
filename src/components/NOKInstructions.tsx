'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  FolderOpen,
  Heart,
  Mail,
  MapPin,
} from 'lucide-react';
import { Button } from '@common/ui/button';
import { cn } from '@common/ui/utils';

interface NOKInstructionsProps {
  onOwnerLetterAccess: () => void;
  onDeliverMessages: () => void;
}

const EARLY_TASKS = [
  {
    id: 'notify',
    title: 'Notify key people',
    description:
      'Let close family members, trusted friends, neighbors, and employers know. Begin by using Deliver Messages above, then check Friends & Family for contacts.',
    icon: Bell,
    tone: 'bg-amber-50 border-amber-100',
    iconTone: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'funeral',
    title: 'Begin funeral or memorial arrangements',
    description:
      'Funeral homes can help coordinate with hospitals, religious institutions, and cemeteries. Check End-of-Life Wishes.',
    icon: Clock,
    tone: 'bg-orange-50 border-orange-100',
    iconTone: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'certificates',
    title: 'Request certified death certificates',
    description:
      'Ask for at least 10 copies. Needed to close accounts, access benefits, and manage the estate.',
    icon: FileText,
    tone: 'bg-rose-50 border-rose-100',
    iconTone: 'bg-rose-100 text-rose-600',
  },
  {
    id: 'legal',
    title: 'Locate legal documents',
    description:
      'Look for a will, trust, power of attorney, and guardianship papers in Estate Documents.',
    icon: MapPin,
    tone: 'bg-sky-50 border-sky-100',
    iconTone: 'bg-sky-100 text-sky-600',
  },
] as const;

export function NOKInstructions({
  onOwnerLetterAccess,
  onDeliverMessages,
}: NOKInstructionsProps) {
  const [gentleOpen, setGentleOpen] = useState(true);
  const [earlyChecked, setEarlyChecked] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-3">
      {/* A Gentle Start */}
      <section className="overflow-hidden rounded-[18px] border border-sky-100 bg-sky-50/70 shadow-sm">
        <button
          type="button"
          onClick={() => setGentleOpen(v => !v)}
          className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left"
        >
          <Heart className="h-[18px] w-[18px] shrink-0 text-sky-500" />
          <span className="min-w-0 flex-1 text-[15px] font-semibold text-[#10213f]">
            A Gentle Start
          </span>
          {gentleOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>
        {gentleOpen ? (
          <div className="space-y-3 border-t border-sky-100/80 px-4 pb-4 pt-3 text-[13px] leading-6 text-slate-600">
            <p>
              If you&apos;re reading this, it&apos;s likely because someone you
              love has passed, and you&apos;re now stepping into the challenging
              role of organizing what they left behind.
            </p>
            <p>
              First, please know—we&apos;re sincerely sorry for your loss. This
              Orderly Affairs Kit was created to bring you peace and clarity in
              this moment, when things may feel overwhelming.
            </p>
          </div>
        ) : null}
      </section>

      {/* Important First Steps */}
      <section className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-4">
        <h3 className="mb-3 text-[15px] font-semibold text-[#10213f]">
          Important First Steps
        </h3>
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onOwnerLetterAccess}
            className="flex w-full items-center gap-3 rounded-2xl bg-rose-50/90 px-3.5 py-3.5 text-left transition active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              <Heart className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-[#10213f]">
                Read Your Personal Letter
              </span>
              <span className="mt-0.5 block text-[12px] leading-5 text-slate-500">
                Your loved one wrote this specifically for you
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          </button>

          <button
            type="button"
            onClick={onDeliverMessages}
            className="flex w-full items-center gap-3 rounded-2xl bg-sky-50/90 px-3.5 py-3.5 text-left transition active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <Mail className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-[#10213f]">
                Deliver Messages to Others
              </span>
              <span className="mt-0.5 block text-[12px] leading-5 text-slate-500">
                Send prepared messages to other family and friends
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          </button>
        </div>
      </section>

      {/* Early Tasks */}
      <section className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-4">
        <div className="mb-2 flex items-center gap-2">
          <FolderOpen className="h-[18px] w-[18px] text-orange-500" />
          <h3 className="min-w-0 flex-1 text-[15px] font-semibold text-[#10213f]">
            Next of Kin Early Tasks
          </h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            Checklist
          </span>
        </div>
        <p className="mb-3 text-[12px] leading-5 text-slate-500">
          After someone passes away, several practical steps may need to be
          taken quickly. This list is meant to guide you through those early
          tasks.
        </p>
        <div className="space-y-2">
          {EARLY_TASKS.map(task => {
            const Icon = task.icon;
            const checked = !!earlyChecked[task.id];
            return (
              <label
                key={task.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3 transition active:scale-[0.99]',
                  task.tone,
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    task.iconTone,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-[13px] font-semibold text-[#10213f]',
                      checked && 'text-slate-400 line-through',
                    )}
                  >
                    {task.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-5 text-slate-500">
                    {task.description}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setEarlyChecked(prev => ({
                      ...prev,
                      [task.id]: !prev[task.id],
                    }))
                  }
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[#10213f]"
                />
              </label>
            );
          })}
        </div>
      </section>

      {/* What This Kit Is For */}
      <section className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-sm">
        <h3 className="text-[15px] font-semibold text-[#10213f]">
          What This Kit Is For
        </h3>
        <div className="mt-2 space-y-2.5 text-[13px] leading-6 text-slate-600">
          <p>
            Managing an estate can be complex. Some estates are simple, while
            others may require formal legal steps like probate.
          </p>
          <div className="rounded-2xl bg-slate-50 px-3.5 py-3">
            <p className="text-[12px] font-semibold text-[#10213f]">
              This kit holds the information you&apos;ll need to:
            </p>
            <ul className="mt-1.5 space-y-1 text-[12px] text-slate-500">
              <li>• Understand and honor your loved one&apos;s wishes</li>
              <li>• Locate important documents and accounts</li>
              <li>• Navigate legal, financial, and personal details</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-3.5 py-3">
            <p className="text-[13px] font-semibold text-amber-950">
              A Note About Legal Help
            </p>
            <p className="mt-1 text-[12px] leading-5 text-amber-900/80">
              This kit is not a substitute for legal advice. Consult a licensed
              attorney when dealing with court filings or beneficiary questions.
            </p>
          </div>
        </div>
      </section>

      {/* Obituary */}
      <section className="overflow-hidden rounded-[18px] border border-violet-100 bg-violet-50/70 p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#10213f]">
          <span aria-hidden>🕊️</span> Obituary Content
        </h3>
        <p className="mt-2 text-[13px] leading-6 text-slate-600">
          Pages marked with a dove symbol are designed to help you write a
          meaningful obituary. Use these notes as a guide, and feel free to add
          your own stories.
        </p>
      </section>

      {/* Resources */}
      <section className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#10213f]">
          <ExternalLink className="h-4 w-4" />
          Additional Resources
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            window.open(
              'https://orderly-affairs.com/state-specific-probate/',
              '_blank',
            )
          }
          className="mt-3 h-9 w-auto rounded-xl"
        >
          <ExternalLink className="mr-2 h-3.5 w-3.5" />
          State-Specific Probate Information
        </Button>
      </section>

      {/* Anchor */}
      <section className="overflow-hidden rounded-[18px] border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#10213f]">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          Use This Kit as Your Anchor
        </h3>
        <p className="mt-2 text-[13px] leading-6 text-slate-600">
          Let it hold the financial, legal, and personal threads in one place.
          Take your time and reach out for help when you need it.
        </p>
      </section>
    </div>
  );
}
