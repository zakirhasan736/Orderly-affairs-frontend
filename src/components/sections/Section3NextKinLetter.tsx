'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@common/ui/utils';
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Lock,
  Plus,
  Users,
} from 'lucide-react';

import { NextOfKinLetterField } from '@/components/NextOfKinLetterField';
import { NokLetterPreviewDialog } from '@/components/NokLetterPreviewDialog';
import { VaultDetailDrawer } from '@/components/vault-prototype/VaultDetailDrawer';
import { goToVaultSection } from '@/vault-prototype/navigate';
import {
  type NextKinAccessResponse,
  useGetMyNextKinQuery,
} from '@/services/authApi';
import { useGetNokLetterQuery } from '@/services/nokLetterApi';
import { isNokLetterDelivered } from '@/utils/nokLetterPreview';
import { useFamilyAcl } from '@/contexts/FamilyAclContext';

type LetterData = Record<string, unknown>;

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
        'flex flex-col rounded-[16px] border border-[#E4EAF0] bg-white p-[18px] max-md:rounded-[14px]',
        !isDelivered && 'border-[#EBD9B4]',
      )}
    >
      <div className="mb-3.5 flex items-center gap-3">
        <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#213D59] text-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15.5px] font-bold text-[#213D59]">{name}</p>
          <p className="text-[12.5px] text-[#7A8794]">
            {person.relationship || 'Next of kin'}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[11.5px] font-semibold',
            isDelivered
              ? 'bg-[#E8F6F0] text-[#1F9D6B]'
              : 'bg-[#FDF4E4] text-[#B4761A]',
          )}
        >
          {isDelivered ? 'Sealed' : 'Not written'}
        </span>
      </div>
      <div
        className={cn(
          'flex-1 rounded-[11px] px-3.5 py-3.5 text-[13.5px] leading-relaxed',
          isDelivered
            ? 'bg-[#F6F8FA] italic text-[#414A55]'
            : 'bg-[#FDF4E4] text-[#8A5A10]',
        )}
      >
        {isDelivered
          ? 'This letter is written and sealed. It stays private until an access person unlocks your Vault.'
          : `${name} was named next of kin and this letter is still empty. If your Vault unlocked today they would find nothing addressed to them.`}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          data-oa-view-ok
          onClick={onOpen}
          className="inline-flex min-h-11 items-center rounded-full bg-[#213D59] px-4 text-[13px] font-semibold text-white"
        >
          {readOnly ? 'View letter' : isDelivered ? 'Open editor' : 'Write letter'}
        </button>
        <button
          type="button"
          data-oa-view-ok
          onClick={onPreview}
          className="inline-flex min-h-11 items-center rounded-full border border-[#E4EAF0] bg-white px-4 text-[13px] font-semibold text-[#213D59]"
        >
          Preview
        </button>
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
  filter = 'all',
}: {
  person: NextKinAccessResponse;
  isSelected: boolean;
  onOpen: () => void;
  onPreview: () => void;
  compact?: boolean;
  readOnly?: boolean;
  filter?: 'all' | 'sealed' | 'empty';
}) {
  const { data: letter } = useGetNokLetterQuery({ nokId: person.id });
  const isDelivered = isNokLetterDelivered(letter);
  if (filter === 'sealed' && !isDelivered) return null;
  if (filter === 'empty' && isDelivered) return null;

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
    <div className="rounded-[16px] border border-dashed border-[#D5DDE5] bg-[#F6F8FA] px-5 py-10 text-center max-md:rounded-[14px]">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-[#213D59] shadow-sm">
        <Users className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-[16px] font-bold text-[#213D59]">
        No next of kin named yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-[#7A8794]">
        Name someone in Access Management first. Their sealed letter is created
        automatically, then you write it here.
      </p>
      <button
        type="button"
        onClick={() => goToVaultSection('2')}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#213D59] px-5 text-[14px] font-semibold text-white"
      >
        <Users className="h-4 w-4" />
        Name a next of kin
      </button>
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
  ownerName = null,
}: Props) {
  const { isReadOnly } = useFamilyAcl();
  const [letterSheetOpen, setLetterSheetOpen] = useState(false);
  const [previewNokId, setPreviewNokId] = useState<string | null>(null);
  const [viewNokId, setViewNokId] = useState<string | null>(null);
  const [letterFilter, setLetterFilter] = useState<'all' | 'sealed' | 'empty'>(
    'all',
  );
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
    <div id="subsection-3A" className="space-y-4">
      {letterReadyPeople.map(person => (
        <MarkedNokLetterSync
          key={`letter-sync-${person.id}`}
          nokId={person.id}
        />
      ))}

      <div className="flex gap-3 rounded-[16px] border border-[#CFE6F5] bg-[#EAF6FD] px-4 py-3.5 text-[13.5px] text-[#213D59] max-md:rounded-[14px]">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Letters stay sealed while you are living. Nobody, including the person
          it is addressed to, can read a letter before your Vault unlocks. Edit
          yours as often as you like.
        </p>
      </div>

      {isReadOnly ? (
        <div className="rounded-[14px] border border-[#E4EAF0] bg-[#F6F8FA] px-4 py-3 text-[13px] text-[#6A7481]">
          View-only. You can open and read letters, but cannot edit, send, or
          schedule them.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {(
            [
              ['all', `All (${letterReadyPeople.length})`],
              ['sealed', 'Sealed'],
              ['empty', 'Not written'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setLetterFilter(id)}
              className={cn(
                'inline-flex h-10 items-center rounded-full border px-3.5 text-[13px] font-semibold',
                letterFilter === id
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
          onClick={() => goToVaultSection('2')}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#E4EAF0] bg-white px-4 text-[13px] font-semibold text-[#213D59]"
        >
          <Users className="h-4 w-4" />
          Manage next of kin
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : letterReadyPeople.length === 0 ? (
        <EmptyRecipientsState />
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2">
          {letterReadyPeople.map(person => {
            const isSelected = person.id === selectedNokId;
            return (
              <RecipientCardWithStatus
                key={person.id}
                person={person}
                isSelected={isSelected}
                onOpen={() => openLetterForRecipient(person.id)}
                onPreview={() => openPreviewForRecipient(person.id)}
                compact={false}
                readOnly={isReadOnly}
                filter={letterFilter}
              />
            );
          })}
          {!isReadOnly ? (
            <button
              type="button"
              onClick={() => goToVaultSection('2')}
              className="flex min-h-[180px] flex-col items-center justify-center rounded-[16px] border border-dashed border-[#D5DDE5] bg-[#F6F8FA] p-[18px] text-center max-md:rounded-[14px]"
            >
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-white text-[#213D59] shadow-sm">
                <Plus className="h-5 w-5" />
              </span>
              <span className="text-[14.5px] font-semibold text-[#213D59]">
                Name another next of kin
              </span>
              <span className="mt-1 text-[12.5px] text-[#7A8794]">
                Their letter is created for you
              </span>
            </button>
          ) : null}
        </div>
      )}

      <VaultDetailDrawer
        open={letterSheetOpen && !!selectedNokId && !!selectedPerson}
        onClose={() => setLetterSheetOpen(false)}
        title={
          selectedPerson
            ? `Letter to ${getDisplayName(selectedPerson)}`
            : 'Letter to Next of Kin'
        }
        subtitle="Sealed until your Vault unlocks. Edit as often as you like."
        icon={<FileText className="h-5 w-5" />}
        hideHeader
        padded={false}
        wide
      >
        {selectedNokId && selectedPerson ? (
          <NextOfKinLetterField
            data={(data.next_of_kin_letter_data || {}) as any}
            onChange={value => updateLetterData(value as LetterData)}
            selectedNokId={selectedNokId}
            embeddedInSheet
            onClose={() => setLetterSheetOpen(false)}
            recipientName={getDisplayName(selectedPerson)}
            ownerName={ownerName}
          />
        ) : null}
      </VaultDetailDrawer>

      {previewNokId && previewPerson ? (
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
      ) : null}
    </div>
  );
}
