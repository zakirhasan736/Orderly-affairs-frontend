'use client';

import React, { useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
import { Badge } from '@/components/common/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Mic,
  ShieldCheck,
  CalendarClock,
  HeartHandshake,
  Sparkles,
  MessageCircleHeart,
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
      helperText:
        'Create and manage personal letters, video messages, and audio recordings for your loved ones',
    },
  ],
};

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  isActive?: boolean;
  fullFormData?: any;
}

export default function Section4NextOfKinMessages({
  data = {},
  onChange = () => {},
  isActive = false,
  fullFormData,
}: Props) {
  const [showGuide, setShowGuide] = useState(false);

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
    <section
      id="subsection-4A"
      className={[
        'relative overflow-hidden rounded-[28px] border bg-background shadow-sm transition-all duration-300',
        isActive
          ? 'border-primary/60 ring-4 ring-primary/10'
          : 'border-border/70',
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_32%),linear-gradient(to_bottom,hsl(var(--muted)/0.35),transparent_45%)]" />

      <Card className="relative border-0 bg-transparent shadow-none">
        <CardHeader className="space-y-5 p-4 sm:p-6 lg:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {SECTION_4A.id}
                </Badge>

                <Badge
                  variant="outline"
                  className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-primary"
                >
                  <MessageCircleHeart className="mr-1 h-3 w-3" />
                  Legacy messages
                </Badge>

                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {savedMessagesCount} saved
                </Badge>
              </div>

              <div className="space-y-2">
                <CardTitle className="text-[22px] font-semibold tracking-tight text-foreground sm:text-3xl">
                  {SECTION_4A.title}
                </CardTitle>

                <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Create private letters, audio recordings, and video messages
                  for loved ones. Each message can be saved for delivery upon
                  death or scheduled for a specific date.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-3xl border bg-background/85 p-2 shadow-sm backdrop-blur">
              <FeaturePill icon={<FileText />} label="Letters" />
              <FeaturePill icon={<Video />} label="Video" />
              <FeaturePill icon={<Mic />} label="Audio" />
            </div>
          </div>

          <div className="rounded-3xl border bg-background/90 p-4 shadow-sm backdrop-blur sm:p-5">
            <button
              type="button"
              onClick={() => setShowGuide(prev => !prev)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground sm:text-base">
                    Quick guide
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                    Keep the page clean, but open this when the user needs help.
                  </p>
                </div>
              </div>

              {showGuide ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
            </button>

            {showGuide && (
              <div className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2 lg:grid-cols-3">
                <GuideCard
                  icon={<HeartHandshake className="h-4 w-4" />}
                  title="Choose recipient"
                  text="Select a person from Access Management or enter the details manually."
                />

                <GuideCard
                  icon={<Sparkles className="h-4 w-4" />}
                  title="Create message"
                  text="Write a letter, record video, record audio, or upload an existing file."
                />

                <GuideCard
                  icon={<CalendarClock className="h-4 w-4" />}
                  title="Set delivery"
                  text="Deliver upon death or schedule the message for a future date."
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 lg:p-8 lg:pt-0">
          <div className="rounded-[24px] border bg-card p-3 shadow-sm sm:p-5">
            {SECTION_4A.fields.map(field => (
              <DynamicFormField
                key={field.key}
                field={field}
                value={subsectionData[field.key]}
                formData={fullFormData}
                onChange={value => updateSubsection(field.key, value)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function FeaturePill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3 text-center">
      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-xl bg-background text-primary shadow-sm [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </div>
      <p className="text-[11px] font-medium sm:text-xs">{label}</p>
    </div>
  );
}

function GuideCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}
