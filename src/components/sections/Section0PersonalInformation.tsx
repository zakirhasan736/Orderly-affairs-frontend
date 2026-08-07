'use client';

import React, { useState } from 'react';

import { Card, CardContent } from '@common/ui/card';
import { DynamicFormField } from '@/components/DynamicFormField';
import {
  BookOpenText,
  ChevronDown,
  ClipboardList,
  FileText,
  HeartHandshake,
  Info,
  Layers3,
  LockKeyhole,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  onFullyRead?: () => void;
  onContinue?: () => void;
}

type InstructionBlock = {
  id: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  icon: React.ElementType;
  colorClass: string;
  content: string;
};

const INSTRUCTION_BLOCKS: InstructionBlock[] = [
  {
    id: 'honored_youre_here',
    title: 'Welcome',
    shortTitle: 'Welcome',
    eyebrow: 'Start here',
    icon: HeartHandshake,
    colorClass: 'from-rose-500/15 to-orange-500/10 text-rose-600',
    content: `Welcome to Orderly Affairs. Your Vault is built to make everyday life easier to manage: all your household's important information, accounts, passwords, insurance, contacts, the stuff you're always digging for, kept in one organized place. And because life is unpredictable, it also doubles as something clear and ready for your next of kin if they ever need it.

Maybe you're a family tired of hunting for the Wi-Fi password or forgetting when the car insurance renews. Your Vault gives you one simple framework to gather what matters and keep it current. Down the line, that same information becomes exactly what a spouse, adult child, or next of kin would need if they ever had to step in.

This isn't just paperwork. It's what makes ordinary weeks run smoother today, and it happens to be a gift for whoever picks up the pieces later. Each section covers a different part of life: financial, legal, personal, and practical, with plain instructions to walk you through it. Some sections take five minutes, like listing your vehicles. Others, like your estate plans, deserve real time and thought. Go at whatever pace fits your life right now.`,
  },
  {
    id: 'go_at_your_pace',
    title: 'Pace',
    shortTitle: 'Pace',
    eyebrow: 'No pressure',
    icon: BookOpenText,
    colorClass: 'from-blue-500/15 to-cyan-500/10 text-blue-600',
    content: `As you build out your Vault, think about the people who'll actually open it day to day: you, your spouse, maybe a kid old enough to grab the Wi-Fi password without asking. Keep it current the way you'd keep any household reference up to date, because that's mostly what it is.

The side benefit is real, though. If a next of kin ever had to step in unexpectedly, the same information that saves you five minutes on a Tuesday is exactly what would save them from starting at zero. You don't have to build it for that moment specifically. Just keep things accurate and it takes care of itself.`,
  },
  {
    id: 'subsection-1C',
    title: 'Reminders',
    shortTitle: 'Reminders',
    eyebrow: 'Important notes',
    icon: ClipboardList,
    colorClass: 'from-amber-500/15 to-yellow-500/10 text-amber-600',
    content: `A few things to keep in mind as you go:

• Your Vault doesn't need to be perfect. The goal is that your life is understandable and easy to find your way through, not flawless.

• Life changes, so revisit your Vault when it does: a move, a new pet, a car you sold, a will you updated. A few minutes every so often keeps it accurate.

• Keep your Vault in one place, and make sure someone you trust actually knows how to access it. A perfectly organized Vault nobody can find or open does nobody any good.

• This is not a legal document. For anything binding, like your will, beneficiary designations, or other legal decisions, talk to an attorney.`,
  },
  {
    id: 'copyright_legal_notice',
    title: 'Copyright & legal notice',
    shortTitle: 'Legal',
    eyebrow: 'Please read',
    icon: ScrollText,
    colorClass: 'from-slate-500/15 to-zinc-500/10 text-slate-600',
    content: `The Orderly Affairs Vault was created with great care and compassion to help people bring peace, clarity, and dignity to one of life's most difficult transitions.

Orderly Affairs is not affiliated with any other product or company, and all material herein is protected by copyright. Your Vault is offered as a personal organizational tool and does not constitute legal, financial, or medical advice.

Please do not redistribute, copy, or resell any portion without written permission.`,
  },
];

function InstructionCard({
  block,
  index,
  isOpen,
  onToggle,
}: {
  block: InstructionBlock;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = block.icon;

  return (
    <article
      id={block.id}
      className="overflow-hidden rounded-3xl border bg-background shadow-sm transition-all duration-300 hover:shadow-md"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 p-4 text-left sm:p-5 lg:cursor-default"
      >
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${block.colorClass} sm:h-12 sm:w-12`}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {block.eyebrow}
              </span>

              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>

            <h3 className="text-base font-semibold leading-tight text-foreground sm:text-lg">
              {block.title}
            </h3>
          </div>
        </div>

        <ChevronDown
          className={`mt-2 h-5 w-5 shrink-0 text-muted-foreground transition-transform lg:hidden ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div className={`${isOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="border-t px-4 py-4 sm:px-5 sm:py-5">
          <div className="prose prose-sm max-w-none text-muted-foreground prose-p:leading-7 prose-strong:text-foreground">
            <DynamicFormField
              field={{
                key: block.id,
                label: '',
                type: 'Instructions',
                content: block.content,
              }}
              value={null}
              onChange={() => {}}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Section0PersonalInformation({
  onFullyRead,
  onContinue,
}: Props) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      INSTRUCTION_BLOCKS.map((block, index) => [block.id, index === 0]),
    ),
  );
  const [activeId, setActiveId] = useState(INSTRUCTION_BLOCKS[0].id);
  const [hasMarkedRead, setHasMarkedRead] = useState(false);

  const markAsRead = () => {
    if (hasMarkedRead) return;
    setHasMarkedRead(true);
    onFullyRead?.();
  };

  const scrollToBlock = (id: string) => {
    setActiveId(id);
    setOpenMap(prev => ({ ...prev, [id]: true }));

    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="w-full scroll-smooth">
      <div className="space-y-5 sm:space-y-6">
        <Card className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
          <CardContent className="p-4 sm:p-6 lg:p-7">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Orderly Affairs Vault
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Introduction
                </span>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Welcome to Orderly Affairs
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                Read this short introduction before building out your Vault. It
                explains how to use the sections, what to keep in mind, and how
                to protect the people who may rely on this information.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {INSTRUCTION_BLOCKS.map(block => (
              <button
                key={block.id}
                type="button"
                onClick={() => scrollToBlock(block.id)}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition ${
                  activeId === block.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground'
                }`}
              >
                {block.shortTitle}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-3xl border bg-background p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Layers3 className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold">Section guide</p>
                  <p className="text-xs text-muted-foreground">
                    Jump to any part
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {INSTRUCTION_BLOCKS.map((block, index) => {
                  const Icon = block.icon;
                  const isActive = activeId === block.id;

                  return (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => scrollToBlock(block.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          isActive ? 'bg-white/15' : 'bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-xs opacity-70">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="block truncate text-sm font-medium">
                          {block.shortTitle}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border bg-muted/30 p-3">
                <div className="flex gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-xs leading-5 text-muted-foreground">
                    This introduction is informational and does not replace
                    legal, financial, or medical advice.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            {INSTRUCTION_BLOCKS.map((block, index) => (
              <InstructionCard
                key={block.id}
                block={block}
                index={index}
                isOpen={openMap[block.id]}
                onToggle={() => {
                  setActiveId(block.id);
                  setOpenMap(prev => ({
                    ...prev,
                    [block.id]: !prev[block.id],
                  }));
                }}
              />
            ))}

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 sm:p-5">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <LockKeyhole className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">Confirm you’ve read this</h3>
                  <p className="mt-1 text-sm leading-6">
                    Mark these instructions as read to complete this section,
                    then continue into your Vault. You can revisit anytime.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={markAsRead}
                      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                        hasMarkedRead
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800'
                      }`}
                    >
                      {hasMarkedRead
                        ? 'Marked as read'
                        : "I've read these instructions"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        markAsRead();
                        onContinue?.();
                      }}
                      className="inline-flex items-center justify-center rounded-2xl border border-emerald-700 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                    >
                      Continue to Vital Information
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
