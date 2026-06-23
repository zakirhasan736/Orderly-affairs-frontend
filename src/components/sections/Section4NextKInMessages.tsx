'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { cn } from '@common/ui/utils';
import { useIsMobile } from '@/components/MobileBottomSheet';
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  FileText,
  HeartHandshake,
  MessageCircleHeart,
  Mic,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';

const SECTION_4A = {
  id: '4A',
  title: 'Personal Messages',
  fields: [
    {
      key: 'letters_data',
      label: 'Letters and Messages',
      type: 'LettersToNextOfKin',
    },
  ],
};

const GUIDE_STEPS = [
  {
    title: 'Choose recipient',
    text: 'Pick someone from Access Management or enter their name and email.',
    icon: HeartHandshake,
  },
  {
    title: 'Create message',
    text: 'Write a letter, record video or audio, or upload an existing file.',
    icon: Sparkles,
  },
  {
    title: 'Set delivery',
    text: 'Deliver upon death or schedule for a specific date or occasion.',
    icon: CalendarClock,
  },
];

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  isActive?: boolean;
  fullFormData?: any;
  messagesClearNonce?: number;
}

function GuidePanel({ className }: { className?: string }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className={cn('space-y-3', className)}>
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
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-muted/20 px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground sm:text-xs">
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Letters
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1">
            <Video className="h-3.5 w-3.5" />
            Video
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1">
            <Mic className="h-3.5 w-3.5" />
            Audio
          </span>
        </div>
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
            <p className="text-sm font-semibold">How it works</p>
            <p className="text-xs text-muted-foreground">3 steps · message types</p>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
      </summary>
      <div className="border-t px-3 pb-4 pt-3">
        <GuidePanel />
      </div>
    </details>
  );
}

export default function Section4NextOfKinMessages({
  data = {},
  onChange = () => {},
  isActive = false,
  fullFormData,
  messagesClearNonce = 0,
}: Props) {
  const isMobile = useIsMobile();
  const subsectionData = data['4A'] || {};

  const updateSubsection = (key: string, value: any) => {
    onChange({
      ...data,
      '4A': {
        ...subsectionData,
        [key]: value,
      },
    });
  };

  const savedMessagesCount = useMemo(() => {
    const lettersData = subsectionData?.letters_data;
    if (Array.isArray(lettersData)) return lettersData.length;
    if (Array.isArray(lettersData?.letters)) return lettersData.letters.length;
    return 0;
  }, [subsectionData]);

  return (
    <Card
      id="subsection-4A"
      className={cn(
        'overflow-hidden rounded-3xl border-slate-200/80 shadow-sm transition-all',
        isActive && 'bg-primary/[0.02] ring-2 ring-primary/40',
        isMobile && 'rounded-2xl',
      )}
    >
      <CardHeader className="border-b px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2.5 text-base sm:gap-3 sm:text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground sm:h-9 sm:w-9 sm:text-sm">
              {SECTION_4A.id}
            </span>
            <span>{SECTION_4A.title}</span>
          </CardTitle>
          <span
            className={cn(
              'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs',
              savedMessagesCount > 0
                ? 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700'
                : 'bg-muted/30 text-muted-foreground',
            )}
          >
            <MessageCircleHeart className="h-3.5 w-3.5 shrink-0" />
            {savedMessagesCount > 0
              ? `${savedMessagesCount} message${savedMessagesCount === 1 ? '' : 's'}`
              : 'No messages yet'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-3 sm:space-y-5 sm:p-6">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-6">
          <div className="min-w-0 scroll-mt-6">
            {SECTION_4A.fields.map(field => (
              <DynamicFormField
                key={field.key}
                field={field}
                value={subsectionData[field.key]}
                formData={fullFormData}
                onChange={value => updateSubsection(field.key, value)}
                lettersClearNonce={messagesClearNonce}
              />
            ))}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <GuidePanel />
            </div>
          </aside>
        </div>

        <MobileGuide />
      </CardContent>
    </Card>
  );
}
