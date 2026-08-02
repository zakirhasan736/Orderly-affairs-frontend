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
    content: `Thank you for your support of our small business. This kit is built for two moments in life: gathering and organizing your family's important day to day information, and preparing something clear and thoughtful for your next of kin in case of an emergency. Whether you're a family getting your household in order or an older adult putting together a plan for loved ones to lean on later, this kit gives you an easy framework to gather, organize, and communicate what matters.

This isn't just about paperwork. It's about peace of mind now, and about making things easier for whoever needs this information, especially if they're navigating a hard moment. Each section walks you through a different area of life (financial, legal, personal, or practical) with simple instructions. Some parts are quick, like listing your vehicles. Others, like estate plans, take more careful thought.`,
  },
  {
    id: 'go_at_your_pace',
    title: 'Pace',
    shortTitle: 'Pace',
    eyebrow: 'No pressure',
    icon: BookOpenText,
    colorClass: 'from-blue-500/15 to-cyan-500/10 text-blue-600',
    content: `As you fill it out, think about who will use this: a spouse organizing shared finances, a parent handing this to an adult child, or a next of kin who may not know where everything is or what you'd want. Your care and clarity here will guide them, whoever they are.

This kit is a gift, not just for the future but for right now: it offers control, comfort, and peace of mind today, for your family and for whoever comes after.`,
  },
  {
    id: 'subsection-1C',
    title: 'A few things to keep in mind',
    shortTitle: 'Reminders',
    eyebrow: 'Important notes',
    icon: ClipboardList,
    colorClass: 'from-amber-500/15 to-yellow-500/10 text-amber-600',
    content: `• This isn't about getting everything perfect. It's about making sure your life is understandable and accessible.

• Life changes. So should your kit. Come back to it from time to time—when you move, get a new pet, sell a car, or update your will.

• Keep it in one place. Let someone you trust know where to find it.

• And most importantly, remember this is not a legal document. Please consult with an attorney when drafting your will, designating beneficiaries, or making binding decisions.`,
  },
  {
    id: 'copyright_legal_notice',
    title: 'Copyright & legal notice',
    shortTitle: 'Legal',
    eyebrow: 'Please read',
    icon: ScrollText,
    colorClass: 'from-slate-500/15 to-zinc-500/10 text-slate-600',
    content: `The Orderly Affairs Kit was created with great care and compassion to help people bring peace, clarity, and dignity to one of life's most difficult transitions.

Orderly Affairs is not affiliated with any other product or company, and all material herein is protected by copyright. This kit is offered as a personal organizational tool and does not constitute legal, financial, or medical advice.

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
                  Orderly Affairs Kit
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Introduction
                </span>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Welcome to your planning guide
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                Read this short introduction before completing the kit. It
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
                    then continue into the kit. You can revisit anytime.
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
