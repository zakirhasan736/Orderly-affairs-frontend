'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@common/ui/card';
import { Badge } from '@common/ui/badge';
import { Button } from '@common/ui/button';
import { cn } from '@common/ui/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@common/ui/select';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

import { NextOfKinLetterField } from '@/components/NextOfKinLetterField';
import {
  MOBILE_SHEET_SCROLL_PADDING,
  MobileBottomSheet,
  MobileSheetHandle,
  useIsMobile,
} from '@/components/MobileBottomSheet';
import {
  type NextKinAccessResponse,
  useGetMyNextKinQuery,
} from '@/services/authApi';
import { useGetNokLetterQuery } from '@/services/nokLetterApi';

type LetterData = Record<string, unknown>;

interface Props {
  data?: {
    selected_nok_id?: string;
    next_of_kin_letter_data?: LetterData;
    next_of_kin_letters_by_nok?: Record<string, LetterData>;
  };
  onChange?: (data: NonNullable<Props['data']>) => void;
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

function RecipientListItem({
  name,
  email,
  phone,
  isSelected,
  onOpen,
}: {
  name: string;
  email?: string | null;
  phone?: string | null;
  isSelected: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-sm transition active:scale-[0.99] active:bg-muted/30',
        isSelected && 'border-primary/40 bg-primary/5 ring-1 ring-primary/15',
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/75 text-sm font-bold text-primary-foreground">
        {getInitials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate text-base font-semibold">{name}</span>
          {isSelected && (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {email || phone || 'Tap to open letter editor'}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}

function InfoPill({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-[1.35rem] flex flex-row sm:flex-col sm:justify-center items-center gap-3 border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="smm:text-center text-left">
      <p className="text-base sm:text-center text-left font-black text-foreground">{title}</p>
      <p className="mt-1 text-xs sm:text-center text-left leading-5 text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export default function Section3NextOfKinLetter({
  data = {},
  onChange = () => {},
}: Props) {
  const isMobile = useIsMobile();
  const [letterSheetOpen, setLetterSheetOpen] = useState(false);
  const { data: nextKinPeople = [], isLoading } =
    useGetMyNextKinQuery(undefined);

  const letterReadyPeople = useMemo(() => {
    return nextKinPeople.filter(
      (person: NextKinAccessResponse) =>
        !person.immediate_access && person.nok_letter_received,
    );
  }, [nextKinPeople]);

  const selectedNokId = useMemo(() => {
    if (
      data.selected_nok_id &&
      letterReadyPeople.some(person => person.id === data.selected_nok_id)
    ) {
      return data.selected_nok_id;
    }

    return letterReadyPeople[0]?.id || '';
  }, [data.selected_nok_id, letterReadyPeople]);

  const selectedPerson = letterReadyPeople.find(
    person => person.id === selectedNokId,
  );

  useEffect(() => {
    if (!selectedNokId || data.selected_nok_id === selectedNokId) return;

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
  ]);

  const updateLetterData = (value: LetterData) => {
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
    onChange({
      ...data,
      selected_nok_id: nokId,
      next_of_kin_letter_data: data.next_of_kin_letters_by_nok?.[nokId] || {},
    });
  };

  const openLetterForRecipient = (nokId: string) => {
    handleRecipientChange(nokId);
    if (isMobile) {
      setLetterSheetOpen(true);
    }
  };

  return (
    <section className="space-y-5 sm:space-y-7">
      {/* ================= HERO ================= */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-gradient-to-br from-primary/10 via-background to-muted/50 shadow-sm sm:rounded-[2.25rem]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative grid gap-6 p-4 sm:p-7 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <Badge
                variant="outline"
                className="mb-4 rounded-full border-primary/20 bg-background/80 px-3 py-1 text-primary shadow-sm backdrop-blur"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Section 3
              </Badge>

              <h2 className="max-w-3xl text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Letters to Next of Kin
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Prepare a thoughtful, practical letter for the person who may
                need to access your Orderly Affairs kit. The letter can include
                access instructions, login details, document locations, and your
                personal message.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoPill
                icon={<Users className="h-5 w-5" />}
                title={`${letterReadyPeople.length}`}
                subtitle="marked recipients"
              />

              <InfoPill
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Auto-fill"
                subtitle="from access management"
              />

              <InfoPill
                icon={<FileText className="h-5 w-5" />}
                title="Ready"
                subtitle="preview, print, export"
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/60 bg-background/85 p-4 shadow-xl shadow-black/5 backdrop-blur sm:rounded-[1.85rem] sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <FileText className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-foreground">
                  Simple workflow
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Select a marked recipient, review the generated letter, then
                  print, export, or open it in your email app.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                'Mark recipient in Access Management',
                'Select the recipient here',
                'Review and customize the letter',
                'Preview, print, export, or email',
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-3 py-3 sm:px-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-xs font-black shadow-sm">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden hook sync components */}
      {letterReadyPeople.map(person => (
        <MarkedNokLetterSync
          key={`letter-sync-${person.id}`}
          nokId={person.id}
        />
      ))}

      {/* ================= LOADING / EMPTY / RECIPIENTS ================= */}
      {isLoading ? (
        <Card className="overflow-hidden rounded-[1.75rem] border-border/60 sm:rounded-[2rem]">
          <CardContent className="p-4 sm:p-7">
            <div className="flex items-center gap-4 rounded-3xl border border-border/60 bg-muted/30 p-5">
              <div className="h-11 w-11 animate-pulse rounded-2xl bg-muted" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-48 animate-pulse rounded-full bg-muted" />
                <div className="mt-3 h-3 w-72 max-w-full animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : letterReadyPeople.length === 0 ? (
        <Card className="overflow-hidden rounded-[1.75rem] border-amber-200 bg-amber-50/80 shadow-sm sm:rounded-[2rem]">
          <CardContent className="p-4 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-amber-950">
                  No next-of-kin letter recipient is ready yet
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900/80">
                  Go to Access Management and mark at least one upon-death
                  person as <strong>Next-of-Kin Letter Received</strong>. After
                  that, this section will create a personalized letter for that
                  person.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            'overflow-hidden rounded-[1.75rem] border-border/60 shadow-sm sm:rounded-[2rem]',
            isMobile && 'rounded-2xl border-0 bg-transparent shadow-none',
          )}
        >
          <CardContent
            className={cn(
              'space-y-5',
              isMobile ? 'p-0' : 'p-4 sm:p-6 lg:p-7',
            )}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-foreground">
                    Choose Recipient
                  </h3>

                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {letterReadyPeople.length} marked
                  </Badge>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {isMobile
                    ? 'Tap a recipient to open the letter editor.'
                    : 'Each marked upon-death person gets a separate letter using their name, email, phone, password card location, key bag location, and document bag location.'}
                </p>
              </div>

              {!isMobile && (
                <div className="w-full lg:w-80">
                  <Select
                    value={selectedNokId}
                    onValueChange={handleRecipientChange}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-border/70 bg-background shadow-sm">
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>

                    <SelectContent className="rounded-2xl">
                      {letterReadyPeople.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {getDisplayName(person)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {isMobile ? (
              <ul className="space-y-2" role="list">
                {letterReadyPeople.map(person => {
                  const isSelected = person.id === selectedNokId;
                  const name = getDisplayName(person);

                  return (
                    <li key={person.id}>
                      <RecipientListItem
                        name={name}
                        email={person.email}
                        phone={person.phone_number}
                        isSelected={isSelected}
                        onOpen={() => openLetterForRecipient(person.id)}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {letterReadyPeople.map(person => {
                  const isSelected = person.id === selectedNokId;
                  const name = getDisplayName(person);

                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => handleRecipientChange(person.id)}
                      className={`group rounded-[1.5rem] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                        isSelected
                          ? 'border-primary/40 bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/15'
                          : 'border-border/60 bg-background hover:border-primary/25'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black transition ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                          }`}
                        >
                          {getInitials(name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-black text-foreground">
                              {name}
                            </p>

                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                            )}
                          </div>

                          <div className="mt-3 space-y-2">
                            {person.email && (
                              <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{person.email}</span>
                              </div>
                            )}

                            {person.phone_number && (
                              <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                  {person.phone_number}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ================= SELECTED LETTER EDITOR (desktop) ================= */}
      {selectedNokId && selectedPerson && !isMobile && (
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-4 sm:rounded-[1.75rem] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <UserCheck className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Active letter
                  </p>
                  <h3 className="mt-1 text-base font-black text-foreground sm:text-lg">
                    {getDisplayName(selectedPerson)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review and customize this next-of-kin letter.
                  </p>
                </div>
              </div>

              <Badge
                variant="outline"
                className="w-fit rounded-full border-primary/20 bg-background px-3 py-1 text-primary"
              >
                Auto-saving enabled
              </Badge>
            </div>
          </div>

          <NextOfKinLetterField
            data={(data.next_of_kin_letter_data || {}) as any}
            onChange={value => updateLetterData(value as LetterData)}
            selectedNokId={selectedNokId}
          />
        </div>
      )}

      {/* ================= LETTER EDITOR (mobile bottom sheet) ================= */}
      {isMobile && (
        <MobileBottomSheet
          open={letterSheetOpen && !!selectedNokId && !!selectedPerson}
          onClose={() => setLetterSheetOpen(false)}
          className="h-[96dvh]"
          labelledBy="nok-letter-sheet-title"
        >
          <div className="flex h-full min-h-0 flex-col">
            <MobileSheetHandle />
            <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 pb-4 pt-1">
              <div className="min-w-0">
                <h3 id="nok-letter-sheet-title" className="text-lg font-semibold">
                  Next of Kin Letter
                </h3>
                <p className="truncate text-sm text-muted-foreground">
                  {selectedPerson ? getDisplayName(selectedPerson) : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setLetterSheetOpen(false)}
                className="h-10 w-10 shrink-0 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {selectedNokId && selectedPerson && (
              <div
                className={cn(
                  'min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-3',
                  MOBILE_SHEET_SCROLL_PADDING,
                )}
              >
                <NextOfKinLetterField
                  data={(data.next_of_kin_letter_data || {}) as any}
                  onChange={value => updateLetterData(value as LetterData)}
                  selectedNokId={selectedNokId}
                  embeddedInSheet
                />
              </div>
            )}
          </div>
        </MobileBottomSheet>
      )}
    </section>
  );
}
