'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { Button } from '@common/ui/button';
import { cn } from '@common/ui/utils';
import { Sheet, SheetContent } from '@common/ui/sheet';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  FileText,
  Mail,
  Phone,
  Printer,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import { NextOfKinLetterField } from '@/components/NextOfKinLetterField';
import { NokLetterPreviewDialog } from '@/components/NokLetterPreviewDialog';
import {
  getVaultSectionDisplayNumber,
} from '@/utils/vaultNavigation';
import {
  MobileBottomSheet,
  useIsMobile,
} from '@/components/MobileBottomSheet';
import {
  type NextKinAccessResponse,
  useGetMyNextKinQuery,
} from '@/services/authApi';
import { useGetNokLetterQuery } from '@/services/nokLetterApi';
import { isNokLetterDelivered } from '@/utils/nokLetterPreview';
import { useFamilyAcl } from '@/contexts/FamilyAclContext';

type LetterData = Record<string, unknown>;

const SECTION_3A = {
  id: '3A',
  title: 'Letter to Next of Kin',
};

const GUIDE_STEPS = [
  {
    title: 'What this letter is',
    text: "A personal note for the person who'll handle things when you're gone — it explains the Vault, what's inside, and where to find what they need.",
    icon: FileText,
  },
  {
    title: 'Fill in the essentials',
    text: "Recipient, relationship, and password card location — that card unlocks the portal only after you've passed. Add Key Bag and Documents Bag locations if you use them.",
    icon: ShieldCheck,
  },
  {
    title: 'Choose how it\'s delivered',
    text: 'Print & mail it yourself, send it now by email so they know it exists, or schedule a future send. They still cannot log in until the portal unlocks.',
    icon: Mail,
  },
  {
    title: 'Review & finish',
    text: 'Preview the letter, then Export, Send now, or Schedule from the closing step.',
    icon: Sparkles,
  },
];

const HELPFUL_NOTES = [
  'Only Upon Death access trusted people with Will Receive Next of Kin Letter checked appear here.',
  'Emailing the letter does not unlock the Vault — the master password on the Password Card does that after your passing.',
  `Complete Section ${getVaultSectionDisplayNumber('2')} Access Management (card & bag locations) before finishing this letter.`,
];

interface Props {
  data?: {
    selected_nok_id?: string;
    next_of_kin_letter_data?: LetterData;
    next_of_kin_letters_by_nok?: Record<string, LetterData>;
  };
  onChange?: (data: NonNullable<Props['data']>) => void;
  isActive?: boolean;
  /** Kit owner's name for the letter signature line. */
  ownerName?: string | null;
}

function MarkedNokLetterSync({ nokId }: { nokId: string }) {
  useGetNokLetterQuery({ nokId });
  return null;
}

function getDisplayName(person?: NextKinAccessResponse | null) {
  if (!person) return 'Next of Kin';
  return person.full_name || person.email || 'Next of Kin';
}

function getInitials(name?: string | null) {
  if (!name) return 'NK';
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return (
    parts
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase() || 'NK'
  );
}

function GuidePanel({ className }: { className?: string }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-3.5 sm:rounded-3xl sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold text-amber-950">Before you start</h4>
        </div>
        <ul className="mt-2.5 space-y-2">
          {HELPFUL_NOTES.map(note => (
            <li
              key={note}
              className="flex gap-2 text-xs leading-5 text-amber-950/85 sm:text-sm sm:leading-6"
            >
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 sm:h-4 sm:w-4" />
              <span>{note}</span>
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
            <p className="text-xs text-muted-foreground">4 steps · prerequisites</p>
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

function DeliveredBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/80">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      Delivered
    </span>
  );
}

function RecipientCard({
  person,
  isSelected,
  isDelivered,
  onOpen,
  onPreview,
  compact = false,
  readOnly = false,
}: {
  person: NextKinAccessResponse;
  isSelected: boolean;
  isDelivered: boolean;
  onOpen: () => void;
  onPreview: () => void;
  compact?: boolean;
  readOnly?: boolean;
}) {
  const name = getDisplayName(person);
  const initials = getInitials(name);
  const actionBtn =
    'h-9 w-full justify-start rounded-xl text-xs font-medium sm:flex-none';

  if (compact) {
    return (
      <div
        className={cn(
          'flex w-full items-stretch overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition hover:border-border hover:shadow-md',
          isSelected && 'border-primary/40 ring-1 ring-primary/20',
        )}
      >
        <div
          className={cn(
            'w-1 shrink-0',
            isSelected ? 'bg-primary' : 'bg-muted-foreground/30',
          )}
          aria-hidden
        />
        <button
          type="button"
          onClick={onOpen}
          data-oa-view-ok
          className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate text-base font-semibold">{name}</span>
              {isDelivered ? (
                <DeliveredBadge />
              ) : (
                isSelected && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                )
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {person.email ||
                person.phone_number ||
                (readOnly ? 'Tap to view letter' : 'Tap to open letter')}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={onPreview}
          data-oa-view-ok
          className="flex shrink-0 items-center border-l border-border/60 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label={`Preview letter for ${name}`}
        >
          <Eye className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <article
      className={cn(
        'group flex overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition hover:border-border hover:shadow-md',
        isSelected && 'border-primary/40 ring-1 ring-primary/20',
      )}
    >
      <div
        className={cn(
          'w-1 shrink-0',
          isSelected ? 'bg-primary' : 'bg-muted-foreground/25',
        )}
        aria-hidden
      />

      <div className="flex min-w-0 flex-1 flex-col sm:flex-row">
        <div className="min-w-0 flex-1 p-4 sm:p-5 sm:pr-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="line-clamp-1 text-base font-semibold tracking-tight sm:text-lg">
                    {name}
                  </h4>
                  <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-800 ring-1 ring-emerald-200/70">
                    Assigned Next of Kin
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upon-death access · personalized letter
                </p>
              </div>
            </div>
            {isDelivered ? (
              <DeliveredBadge />
            ) : (
              isSelected && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              )
            )}
          </div>

          <div className="mt-4 rounded-xl border border-border/70 bg-muted/25 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              {person.email && (
                <span className="inline-flex max-w-full items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {person.email}
                </span>
              )}
              {person.phone_number && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {person.phone_number}
                </span>
              )}
              {!person.email && !person.phone_number && (
                <span>No contact details on file</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1.5 border-t border-border/60 bg-muted/20 p-2.5 sm:w-[7.75rem] sm:border-l sm:border-t-0 sm:p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-oa-view-ok
            onClick={onPreview}
            className={actionBtn}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-oa-view-ok
            onClick={onOpen}
            className={actionBtn}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            {readOnly ? 'View' : 'Open'}
          </Button>
        </div>
      </div>
    </article>
  );
}

function RecipientCardWithStatus({
  person,
  isSelected,
  onOpen,
  onPreview,
  compact,
  readOnly = false,
}: {
  person: NextKinAccessResponse;
  isSelected: boolean;
  onOpen: () => void;
  onPreview: () => void;
  compact?: boolean;
  readOnly?: boolean;
}) {
  const { data: letter } = useGetNokLetterQuery({ nokId: person.id });
  const isDelivered = isNokLetterDelivered(letter);

  return (
    <RecipientCard
      person={person}
      isSelected={isSelected}
      isDelivered={isDelivered}
      onOpen={onOpen}
      onPreview={onPreview}
      compact={compact}
      readOnly={readOnly}
    />
  );
}

function EmptyRecipientsState() {
  return (
    <div className="rounded-3xl border border-dashed border-amber-200/90 bg-gradient-to-b from-amber-50/80 to-background px-5 py-10 text-center sm:px-8 sm:py-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <Users className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-amber-950 sm:text-lg">
        No recipients ready yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-amber-900/80">
        In{' '}
        <strong className="font-medium">
          Section {getVaultSectionDisplayNumber('2')} → Access Management
        </strong>
        ,
        add an upon-death trusted person and mark{' '}
        <strong className="font-medium">Next-of-Kin Letter Received</strong>.
        They will show up here automatically.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2.5">
      {[0, 1].map(i => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border bg-card p-3"
        >
          <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-32 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-48 max-w-full animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Section3NextOfKinLetter({
  data = {},
  onChange = () => {},
  isActive = false,
  ownerName = null,
}: Props) {
  const isMobile = useIsMobile();
  const { isReadOnly } = useFamilyAcl();
  const [letterSheetOpen, setLetterSheetOpen] = useState(false);
  const [previewNokId, setPreviewNokId] = useState<string | null>(null);
  const [viewNokId, setViewNokId] = useState<string | null>(null);
  const { data: nextKinPeople = [], isLoading } =
    useGetMyNextKinQuery(undefined);

  const letterReadyPeople = useMemo(() => {
    return nextKinPeople.filter(
      (person: NextKinAccessResponse) =>
        !person.immediate_access && person.nok_letter_received,
    );
  }, [nextKinPeople]);

  const selectedNokId = useMemo(() => {
    const preferred = viewNokId || data.selected_nok_id;
    if (
      preferred &&
      letterReadyPeople.some(person => person.id === preferred)
    ) {
      return preferred;
    }
    return letterReadyPeople[0]?.id || '';
  }, [data.selected_nok_id, letterReadyPeople, viewNokId]);

  const selectedPerson = letterReadyPeople.find(
    person => person.id === selectedNokId,
  );

  useEffect(() => {
    if (!selectedNokId || data.selected_nok_id === selectedNokId) return;
    if (isReadOnly) return;

    onChange({
      ...data,
      selected_nok_id: selectedNokId,
      next_of_kin_letter_data:
        data.next_of_kin_letters_by_nok?.[selectedNokId] || {},
    });
  }, [
    selectedNokId,
    data.selected_nok_id,
    data.next_of_kin_letters_by_nok,
    onChange,
    isReadOnly,
  ]);

  const updateLetterData = (value: LetterData) => {
    if (isReadOnly) return;
    if (!selectedNokId) return;

    onChange({
      ...data,
      selected_nok_id: selectedNokId,
      next_of_kin_letter_data: value,
      next_of_kin_letters_by_nok: {
        ...(data.next_of_kin_letters_by_nok || {}),
        [selectedNokId]: value,
      },
    });
  };

  const handleRecipientChange = (nokId: string) => {
    if (isReadOnly) {
      setViewNokId(nokId);
      return;
    }
    onChange({
      ...data,
      selected_nok_id: nokId,
      next_of_kin_letter_data: data.next_of_kin_letters_by_nok?.[nokId] || {},
    });
  };

  const openLetterForRecipient = (nokId: string) => {
    handleRecipientChange(nokId);
    setLetterSheetOpen(true);
  };

  const openPreviewForRecipient = (nokId: string) => {
    handleRecipientChange(nokId);
    setPreviewNokId(nokId);
  };

  const previewPerson = letterReadyPeople.find(p => p.id === previewNokId);

  return (
    <Card
      id="subsection-3A"
      className={cn(
        'overflow-hidden rounded-3xl border-slate-200/80 shadow-sm transition-all',
        isActive && 'bg-primary/[0.02] ring-2 ring-primary/40',
        isMobile && 'rounded-2xl',
      )}
    >
      {letterReadyPeople.map(person => (
        <MarkedNokLetterSync
          key={`letter-sync-${person.id}`}
          nokId={person.id}
        />
      ))}

      <CardHeader className="border-b px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2.5 text-base sm:gap-3 sm:text-xl">
            <span>{SECTION_3A.title}</span>
          </CardTitle>
          <span
            className={cn(
              'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs',
              letterReadyPeople.length > 0
                ? 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700'
                : 'bg-muted/30 text-muted-foreground',
            )}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            {isLoading
              ? 'Loading…'
              : letterReadyPeople.length > 0
                ? `${letterReadyPeople.length} recipient${letterReadyPeople.length === 1 ? '' : 's'} ready`
                : 'No recipients yet'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-3 sm:space-y-5 sm:p-6">
        {isReadOnly ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            View-only — you can open and read letters, but cannot edit, send, or
            schedule them.
          </div>
        ) : null}
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-6">
          <div className="min-w-0 scroll-mt-6 space-y-3">
            {letterReadyPeople.length > 0 && !isLoading && (
              <p className="text-xs text-muted-foreground sm:text-sm">
                {isReadOnly
                  ? 'Select a recipient to view their letter.'
                  : 'Select a recipient and open their letter to review, customize, print, or email.'}
              </p>
            )}

            {isLoading ? (
              <LoadingState />
            ) : letterReadyPeople.length === 0 ? (
              <EmptyRecipientsState />
            ) : (
              <ul
                className={cn(isMobile ? 'space-y-2.5' : 'space-y-3')}
                role="list"
              >
                {letterReadyPeople.map(person => {
                  const isSelected = person.id === selectedNokId;
                  return (
                    <li key={person.id}>
                      <RecipientCardWithStatus
                        person={person}
                        isSelected={isSelected}
                        onOpen={() => openLetterForRecipient(person.id)}
                        onPreview={() => openPreviewForRecipient(person.id)}
                        compact={isMobile}
                        readOnly={isReadOnly}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <GuidePanel />
            </div>
          </aside>
        </div>

        <MobileGuide />
      </CardContent>

      {isMobile ? (
        <MobileBottomSheet
          open={letterSheetOpen && !!selectedNokId && !!selectedPerson}
          onClose={() => setLetterSheetOpen(false)}
          className="h-[96dvh]"
          labelledBy="nok-letter-wizard-title"
        >
          <div className="flex h-full min-h-0 flex-col">
            {selectedNokId && selectedPerson && (
              <NextOfKinLetterField
                data={(data.next_of_kin_letter_data || {}) as any}
                onChange={value => updateLetterData(value as LetterData)}
                selectedNokId={selectedNokId}
                embeddedInSheet
                onClose={() => setLetterSheetOpen(false)}
                recipientName={getDisplayName(selectedPerson)}
                ownerName={ownerName}
              />
            )}
          </div>
        </MobileBottomSheet>
      ) : (
        <Sheet
          open={letterSheetOpen && !!selectedNokId && !!selectedPerson}
          onOpenChange={open => !open && setLetterSheetOpen(false)}
        >
          <SheetContent
            side="right"
            className="flex h-full max-w-lg flex-col gap-0 p-0 sm:max-w-xl"
          >
            <div className="flex h-full min-h-0 flex-col">
              {selectedNokId && selectedPerson && (
                <NextOfKinLetterField
                  data={(data.next_of_kin_letter_data || {}) as any}
                  onChange={value => updateLetterData(value as LetterData)}
                  selectedNokId={selectedNokId}
                  embeddedInSheet
                  onClose={() => setLetterSheetOpen(false)}
                  recipientName={getDisplayName(selectedPerson)}
                  ownerName={ownerName}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {previewNokId && previewPerson && (
        <NokLetterPreviewDialog
          open={!!previewNokId}
          onClose={() => setPreviewNokId(null)}
          nokId={previewNokId}
          person={previewPerson}
          ownerName={ownerName}
          fallbackData={
            (data.next_of_kin_letters_by_nok?.[previewNokId] ||
              data.next_of_kin_letter_data) as any
          }
        />
      )}
    </Card>
  );
}
