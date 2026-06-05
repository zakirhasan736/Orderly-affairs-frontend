'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Textarea } from '@common/ui/textarea';
import { Badge } from '@common/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@common/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@common/ui/sheet';
import { cn } from '@common/ui/utils';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  FileText,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useApproveNextKinAccessMutation,
  useCreateNextKinMutation,
  useDeleteNextKinMutation,
  useGetMyNextKinQuery,
  useRevokeAllNextKinAccessMutation,
  useRevokeNextKinAccessMutation,
  useUpdateNextKinMutation,
} from '@/services/authApi';

import { PasswordCard } from './PasswordCard';
import {
  MOBILE_SHEET_SCROLL_PADDING,
  MobileBottomSheet,
  MobileSheetHandle,
  useIsMobile,
} from './MobileBottomSheet';
import { formConfig } from '../config/formConfig';

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

interface AuthorizedPerson {
  _id?: string;
  __clientId?: string;
  full_name: string;
  relationship: string;
  email: string;
  phone_number?: string;
  access_level: 'Full Kit Access' | 'Section-Specific Access';
  authorized_sections: string[];
  immediate_access: boolean;
  nok_letter_received: boolean;
  master_password: string;
  password_card_generated: boolean;
  card_storage_location?: string;
  key_bag_location?: string;
  documents_bag_location?: string;
  special_instructions?: string;
}

type PersonAction = 'saving' | 'deleting' | 'approving' | 'revoking';
type WizardStepId = 'person' | 'access' | 'credentials' | 'review';
type WizardMode = 'add' | 'edit';

const WIZARD_STEPS: { id: WizardStepId; label: string }[] = [
  { id: 'person', label: 'Person' },
  { id: 'access', label: 'Access Level' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'review', label: 'Review' },
];

const HOW_ACCESS_STEPS = [
  'Add a trusted person with their contact details',
  'Choose full kit or section-specific permissions',
  'Generate secure credentials and password card',
  'Share the card location — never the password directly',
  'Track logins and revoke access anytime',
];

const FEATURE_CARDS = [
  {
    title: "You're in Control",
    description: 'Decide who sees what and change it anytime.',
    icon: Shield,
    tone: 'text-blue-600 bg-blue-50',
  },
  {
    title: 'Secure & Private',
    description: 'Unique credentials per person with instant revoke.',
    icon: Lock,
    tone: 'text-emerald-600 bg-emerald-50',
  },
  {
    title: 'Password Card',
    description: 'Printable cards for safe offline sharing.',
    icon: CreditCard,
    tone: 'text-violet-600 bg-violet-50',
  },
  {
    title: 'Activity Tracking',
    description: 'Get notified when someone accesses your kit.',
    icon: Bell,
    tone: 'text-primary bg-primary/10',
  },
];

const SECTION_PRESETS: Record<string, string[] | 'all'> = {
  'Full Access': 'all',
  'Financial & Tax': ['7', '12', '14', '16', '19', '20'],
  'Healthcare & Medical': ['15'],
  'Legal & Estate': ['20', '21'],
  'Personal & Family': ['1', '2', '17'],
  'Business & Employment': ['18'],
  'Insurance & Benefits': ['7', '11'],
};

const MIN_TOUCH = 'min-h-11';

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

function makeClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function generatePassword(length = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  if (typeof window !== 'undefined' && window.crypto) {
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    return Array.from(values, value => chars[value % chars.length]).join('');
  }
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

function createEmptyPerson(): AuthorizedPerson {
  return {
    __clientId: makeClientId(),
    full_name: '',
    relationship: '',
    email: '',
    phone_number: '',
    access_level: 'Full Kit Access',
    authorized_sections: [],
    immediate_access: true,
    nok_letter_received: false,
    master_password: generatePassword(),
    password_card_generated: false,
    card_storage_location: '',
    key_bag_location: '',
    documents_bag_location: '',
    special_instructions: '',
  };
}

function getPersonKey(person: AuthorizedPerson, index: number) {
  return person._id || person.__clientId || `person-${index}`;
}

function normalizeAccessLevel(
  accessLevel?: string,
): AuthorizedPerson['access_level'] {
  return accessLevel === 'Section-Specific Access'
    ? 'Section-Specific Access'
    : 'Full Kit Access';
}

type CreateNextKinResponseWithId = { id?: string; _id?: string };

type NextKinApiPersonExtras = {
  _id?: string;
  master_password?: string | null;
};

function getApiErrorDetail(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'data' in error &&
    error.data &&
    typeof error.data === 'object' &&
    'detail' in error.data
  ) {
    const detail = error.data.detail;
    return typeof detail === 'string' ? detail : '';
  }
  if (error instanceof Error) return error.message;
  return '';
}

function MobileIconAction({
  label,
  icon: Icon,
  onClick,
  disabled,
  tone = 'default',
  loading,
}: {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger' | 'primary';
  loading?: boolean;
}) {
  const toneClasses = {
    default: 'bg-muted/60 text-foreground',
    danger: 'bg-destructive/10 text-destructive',
    primary: 'bg-primary/10 text-primary',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-2 transition active:scale-[0.97] disabled:opacity-50"
    >
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-2xl',
          toneClasses[tone],
        )}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </span>
      <span className="text-[11px] font-medium leading-none text-muted-foreground">
        {label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* UI building blocks                                                  */
/* ------------------------------------------------------------------ */

function SelectableOptionCard({
  selected,
  onSelect,
  title,
  description,
  icon: Icon,
  iconClassName,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  icon: React.ElementType;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full min-h-[88px] flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-background hover:border-primary/40',
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {selected && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}

function WizardStepper({
  currentIndex,
  onStepClick,
}: {
  currentIndex: number;
  onStepClick?: (index: number) => void;
}) {
  return (
    <nav
      aria-label="Add trusted person progress"
      className="flex items-center gap-0"
    >
      {WIZARD_STEPS.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;
        const canNavigate = isComplete && !!onStepClick;

        return (
          <React.Fragment key={step.id}>
            {index > 0 && (
              <div
                className={cn(
                  'h-0.5 min-w-3 flex-1 rounded-full transition-colors',
                  index <= currentIndex ? 'bg-primary/40' : 'bg-muted',
                )}
                aria-hidden
              />
            )}
            <button
              type="button"
              disabled={!canNavigate}
              onClick={() => canNavigate && onStepClick(index)}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`${step.label}${isComplete ? ', completed' : isActive ? ', current' : ''}`}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl px-1 py-1 transition',
                canNavigate &&
                  'cursor-pointer hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                !canNavigate && !isActive && 'cursor-default',
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition',
                  isActive && 'bg-primary text-primary-foreground shadow-sm',
                  isComplete && 'bg-primary/15 text-primary',
                  !isActive && !isComplete && 'bg-muted text-muted-foreground',
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'truncate text-center text-[10px] font-medium sm:text-xs',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                  canNavigate && 'underline-offset-2 hover:underline',
                )}
              >
                {step.label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

function getPersonInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('');
}

function TrustedPersonStatusPill({ person }: { person: AuthorizedPerson }) {
  const isActiveAccess = Boolean(person._id && person.immediate_access);
  if (!person._id) return null;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium sm:px-2.5 sm:py-1 sm:text-xs',
        isActiveAccess
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-muted text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isActiveAccess ? 'bg-emerald-500' : 'bg-muted-foreground/50',
        )}
      />
      {isActiveAccess ? 'Active' : 'Inactive'}
    </span>
  );
}

function TrustedPersonMobileListItem({
  person,
  index,
  hasNokLetter,
  onOpen,
}: {
  person: AuthorizedPerson;
  index: number;
  hasNokLetter: boolean;
  onOpen: () => void;
}) {
  const initials = getPersonInitials(person.full_name);
  const isFullAccess = person.access_level === 'Full Kit Access';
  const displayName = person.full_name || `Person ${index + 1}`;
  const sectionCount = person.authorized_sections.length;
  const accessLabel = isFullAccess ? 'Full Kit' : `${sectionCount} Sections`;
  const timingLabel = person.immediate_access ? 'Immediate' : 'Upon Death';

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-sm transition active:scale-[0.99] active:bg-muted/30',
        hasNokLetter && 'border-emerald-200',
        !person._id && 'border-amber-200 bg-amber-50/40',
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/75 text-sm font-bold text-primary-foreground">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate text-base font-semibold">
            {displayName}
          </span>
          <TrustedPersonStatusPill person={person} />
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {person.relationship
            ? `${person.relationship} · ${accessLabel} · ${timingLabel}`
            : `${accessLabel} · ${timingLabel}`}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}

function TrustedPersonMobileDetails({
  person,
  index,
  isBusy,
  isDeleting,
  isApproving,
  isRevoking,
  hasNokLetter,
  onEdit,
  onViewCard,
  onApprove,
  onRevoke,
  onDelete,
  revokeDisabled,
}: {
  person: AuthorizedPerson;
  index: number;
  isBusy: boolean;
  isDeleting: boolean;
  isApproving: boolean;
  isRevoking: boolean;
  hasNokLetter: boolean;
  onEdit: () => void;
  onViewCard: () => void;
  onApprove: () => void;
  onRevoke: () => void;
  onDelete: () => void;
  revokeDisabled: boolean;
}) {
  const initials = getPersonInitials(person.full_name);
  const isFullAccess = person.access_level === 'Full Kit Access';
  const displayName = person.full_name || `Person ${index + 1}`;
  const sectionCount = person.authorized_sections.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-x-3 gap-y-1">
        <div className="row-span-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/75 text-base font-bold text-primary-foreground shadow-md">
          {initials}
        </div>
        <h4 className="col-start-2 col-end-3 min-w-0 text-lg font-semibold leading-snug">
          {displayName}
        </h4>
        <div className="col-start-3 row-span-2 self-start">
          <TrustedPersonStatusPill person={person} />
        </div>
        {person.relationship && (
          <p className="col-start-2 col-end-3 min-w-0 text-sm capitalize text-muted-foreground">
            {person.relationship}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border bg-muted/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Access
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
            {isFullAccess ? (
              <Unlock className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-blue-600" />
            )}
            {isFullAccess ? 'Full Kit' : `${sectionCount} Sections`}
          </p>
        </div>
        <div className="rounded-2xl border bg-muted/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Timing
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
            {person.immediate_access ? (
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-amber-600" />
            )}
            {person.immediate_access ? 'Immediate' : 'Upon Death'}
          </p>
        </div>
      </div>

      {hasNokLetter && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
          Next of Kin letter received
        </div>
      )}

      {(person.email || person.phone_number) && (
        <div className="overflow-hidden rounded-2xl border bg-background">
          {person.email && (
            <div className="flex items-start gap-3 border-b px-3 py-3 last:border-b-0">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Email
                </p>
                <p className="mt-0.5 text-sm leading-5 break-words [overflow-wrap:anywhere]">
                  {person.email}
                </p>
              </div>
            </div>
          )}
          {person.phone_number && (
            <div className="flex items-start gap-3 px-3 py-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Phone
                </p>
                <p className="mt-0.5 text-sm leading-5">{person.phone_number}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          'grid gap-1 rounded-2xl border bg-muted/20 p-1',
          person._id ? 'grid-cols-4' : 'grid-cols-3',
        )}
      >
        <MobileIconAction
          label="Edit"
          icon={Pencil}
          onClick={onEdit}
          disabled={isBusy}
        />
        <MobileIconAction
          label="Card"
          icon={Eye}
          onClick={onViewCard}
          disabled={isBusy}
          tone="primary"
        />
        {person._id &&
          (person.immediate_access ? (
            <MobileIconAction
              label="Revoke"
              icon={Lock}
              onClick={onRevoke}
              disabled={isBusy || revokeDisabled}
              tone="danger"
              loading={isRevoking}
            />
          ) : (
            <MobileIconAction
              label="Approve"
              icon={Unlock}
              onClick={onApprove}
              disabled={isBusy}
              loading={isApproving}
            />
          ))}
        <MobileIconAction
          label="Delete"
          icon={Trash2}
          onClick={onDelete}
          disabled={isBusy}
          tone="danger"
          loading={isDeleting}
        />
      </div>

      {!person._id && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
          Unsaved draft — tap Edit to finish setup.
        </p>
      )}
    </div>
  );
}

function TrustedPersonCard({
  person,
  index,
  isBusy,
  isDeleting,
  isApproving,
  isRevoking,
  hasNokLetter,
  onEdit,
  onViewCard,
  onApprove,
  onRevoke,
  onDelete,
  revokeDisabled,
}: {
  person: AuthorizedPerson;
  index: number;
  isBusy: boolean;
  isDeleting: boolean;
  isApproving: boolean;
  isRevoking: boolean;
  hasNokLetter: boolean;
  onEdit: () => void;
  onViewCard: () => void;
  onApprove: () => void;
  onRevoke: () => void;
  onDelete: () => void;
  revokeDisabled: boolean;
}) {
  const initials = getPersonInitials(person.full_name);
  const isFullAccess = person.access_level === 'Full Kit Access';
  const isActiveAccess = Boolean(person._id && person.immediate_access);
  const displayName = person.full_name || `Person ${index + 1}`;
  const sectionCount = person.authorized_sections.length;

  return (
    <article
      className={cn(
        'w-full max-w-full overflow-hidden rounded-3xl border bg-card shadow-sm transition hover:shadow-md',
        hasNokLetter && 'border-emerald-200',
        isActiveAccess && 'ring-1 ring-emerald-500/20',
      )}
    >
      <div
        className={cn(
          'h-1 w-full',
          isFullAccess
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
            : 'bg-gradient-to-r from-blue-500 to-blue-400',
        )}
        aria-hidden
      />

      <div className="p-5">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/75 text-base font-bold text-primary-foreground shadow-sm">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="truncate text-lg font-semibold tracking-tight">
                  {displayName}
                </h4>
                {person.relationship && (
                  <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                    {person.relationship}
                  </p>
                )}
              </div>
              <TrustedPersonStatusPill person={person} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                className={cn(
                  'gap-1 rounded-full px-2.5 py-1 text-xs',
                  isFullAccess
                    ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                    : 'bg-blue-600 text-white hover:bg-blue-600',
                )}
              >
                {isFullAccess ? (
                  <Unlock className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {isFullAccess ? 'Full Access' : `${sectionCount} Sections`}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'gap-1 rounded-full px-2.5 py-1 text-xs',
                  person.immediate_access
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700',
                )}
              >
                <Clock className="h-3 w-3" />
                {person.immediate_access ? 'Immediate Access' : 'Upon Death'}
              </Badge>
              {hasNokLetter && (
                <Badge
                  variant="outline"
                  className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
                >
                  <CheckCircle className="h-3 w-3" />
                  NOK letter
                </Badge>
              )}
            </div>
          </div>
        </div>

        {(person.email || person.phone_number) && (
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-muted/35 p-3">
            {person.email && (
              <div className="flex min-w-0 items-center gap-2.5 text-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="min-w-0 truncate text-muted-foreground">
                  {person.email}
                </span>
              </div>
            )}
            {person.phone_number && (
              <div className="flex min-w-0 items-center gap-2.5 text-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm">
                  <Phone className="h-4 w-4" />
                </span>
                <span className="min-w-0 truncate text-muted-foreground">
                  {person.phone_number}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 border-t pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Actions
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              className={cn('rounded-xl sm:min-w-[108px]', MIN_TOUCH)}
              onClick={onEdit}
              disabled={isBusy}
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              className={cn('rounded-xl sm:min-w-[108px]', MIN_TOUCH)}
              onClick={onViewCard}
              disabled={isBusy}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              View Card
            </Button>
            {person._id &&
              (person.immediate_access ? (
                <Button
                  variant="outline"
                  className={cn(
                    'rounded-xl border-destructive/30 text-destructive hover:text-destructive sm:min-w-[108px]',
                    MIN_TOUCH,
                  )}
                  onClick={onRevoke}
                  disabled={isBusy || revokeDisabled}
                >
                  {isRevoking ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="mr-1.5 h-4 w-4" />
                  )}
                  Revoke
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className={cn('rounded-xl sm:min-w-[108px]', MIN_TOUCH)}
                  onClick={onApprove}
                  disabled={isBusy}
                >
                  {isApproving ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Unlock className="mr-1.5 h-4 w-4" />
                  )}
                  Approve
                </Button>
              ))}
            <Button
              variant="outline"
              className={cn(
                'rounded-xl border-destructive/30 text-destructive hover:text-destructive sm:min-w-[108px]',
                MIN_TOUCH,
              )}
              onClick={onDelete}
              disabled={isBusy}
              aria-label={`Delete ${displayName}`}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="ml-1.5">Delete</span>
            </Button>
          </div>
        </div>

        {!person._id && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
            Unsaved draft — open Edit to finish setup.
          </p>
        )}
      </div>
    </article>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed bg-muted/30 p-8 text-center sm:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <Users className="h-8 w-8" aria-hidden />
      </div>
      <h3 className="mt-5 text-lg font-semibold">
        No trusted people added yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Add someone you trust and choose their access level. You can update or
        revoke access anytime.
      </p>
      <Button
        onClick={onAdd}
        className={cn('mt-6 w-full rounded-2xl sm:w-auto', MIN_TOUCH)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Your First Person
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function AccessManagement() {
  const isMobile = useIsMobile();
  const { data, isLoading, refetch } = useGetMyNextKinQuery(undefined);

  const [authorizedPeople, setAuthorizedPeople] = useState<AuthorizedPerson[]>(
    [],
  );
  const [personActions, setPersonActions] = useState<
    Record<string, PersonAction>
  >({});
  const [search, setSearch] = useState('');

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardMode, setWizardMode] = useState<WizardMode>('add');
  const [wizardIndex, setWizardIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<AuthorizedPerson | null>(null);
  const [showWizardCardPreview, setShowWizardCardPreview] = useState(true);
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);

  const [cardPreviewIndex, setCardPreviewIndex] = useState<number | null>(null);
  const [detailViewIndex, setDetailViewIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);

  const [createNextKin] = useCreateNextKinMutation();
  const [updateNextKin] = useUpdateNextKinMutation();
  const [deleteNextKin] = useDeleteNextKinMutation();
  const [approveNextKinAccess] = useApproveNextKinAccessMutation();
  const [revokeNextKinAccess, { isLoading: isRevokingOne }] =
    useRevokeNextKinAccessMutation();
  const [revokeAllNextKinAccess, { isLoading: isRevokingAll }] =
    useRevokeAllNextKinAccessMutation();

  useEffect(() => {
    if (!data) return;

    setAuthorizedPeople(prev => {
      const unsaved = prev.filter(p => !p._id);
      const fromApi: AuthorizedPerson[] = data.map(rawNextKin => {
        const nk = rawNextKin as typeof rawNextKin & NextKinApiPersonExtras;
        const personId = nk.id || nk._id;
        return {
          _id: personId,
          __clientId: personId || makeClientId(),
          full_name: nk.full_name || '',
          relationship: nk.relationship || '',
          email: nk.email || '',
          phone_number: nk.phone_number || '',
          access_level: normalizeAccessLevel(nk.access_level),
          authorized_sections: Array.isArray(nk.authorized_sections)
            ? nk.authorized_sections
            : [],
          immediate_access: !!nk.immediate_access,
          nok_letter_received: !!nk.nok_letter_received,
          master_password: nk.master_password || '',
          password_card_generated: !!nk.password_card_generated,
          card_storage_location: nk.card_storage_location || '',
          key_bag_location: nk.key_bag_location || '',
          documents_bag_location: nk.documents_bag_location || '',
          special_instructions: nk.special_instructions || '',
        };
      });
      return [...fromApi, ...unsaved];
    });
  }, [data]);

  const sectionOptions = useMemo(() => {
    const options: { id: string; label: string; isSubsection: boolean }[] = [];
    formConfig.chunks.forEach(chunk => {
      chunk.sections.forEach(section => {
        if (section.id === '0') return;
        options.push({
          id: section.id,
          label: `${section.id}. ${section.title}`,
          isSubsection: false,
        });
        section.subsections?.forEach(sub => {
          options.push({
            id: sub.id,
            label: `${sub.id}. ${sub.title}`,
            isSubsection: true,
          });
        });
      });
    });
    return options;
  }, []);

  const sectionLabelMap = useMemo(
    () =>
      sectionOptions.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = item.label;
        return acc;
      }, {}),
    [sectionOptions],
  );

  const savedCount = authorizedPeople.filter(p => p._id).length;
  const setupProgress = Math.min(savedCount, 1);
  const needsDesignation = savedCount < 1;

  const filteredPeople = useMemo(() => {
    const term = search.trim().toLowerCase();
    const mapped = authorizedPeople.map((person, index) => ({
      person,
      index,
      key: getPersonKey(person, index),
    }));
    if (!term) return mapped;
    return mapped.filter(({ person }) =>
      [person.full_name, person.email, person.relationship].some(field =>
        field.toLowerCase().includes(term),
      ),
    );
  }, [authorizedPeople, search]);

  const hasPersonAction = Object.keys(personActions).length > 0;

  const setPersonAction = (key: string, action?: PersonAction) => {
    setPersonActions(prev => {
      const next = { ...prev };
      if (action) next[key] = action;
      else delete next[key];
      return next;
    });
  };

  const patchDraft = useCallback((patch: Partial<AuthorizedPerson>) => {
    setDraft(prev => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const openAddWizard = () => {
    setDraft(createEmptyPerson());
    setWizardMode('add');
    setWizardIndex(null);
    setWizardStep(0);
    setSectionPickerOpen(false);
    setShowWizardCardPreview(true);
    setWizardOpen(true);
  };

  const openEditWizard = (index: number) => {
    setDraft({ ...authorizedPeople[index] });
    setWizardMode('edit');
    setWizardIndex(index);
    setWizardStep(0);
    setSectionPickerOpen(
      authorizedPeople[index].authorized_sections.length > 0,
    );
    setShowWizardCardPreview(true);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setDraft(null);
    setWizardStep(0);
    setWizardIndex(null);
  };

  const toggleDraftSection = (id: string) => {
    if (!draft) return;
    const updated = draft.authorized_sections.includes(id)
      ? draft.authorized_sections.filter(s => s !== id)
      : [...draft.authorized_sections, id];
    patchDraft({ authorized_sections: updated });
  };

  const applyPresetToDraft = (preset: string) => {
    if (!draft) return;
    const presetSections = SECTION_PRESETS[preset];

    if (presetSections === 'all') {
      patchDraft({
        access_level: 'Full Kit Access',
        authorized_sections: [],
      });
      toast.success(`Applied preset: ${preset}`);
      return;
    }

    const expandedSections: string[] = [];
    presetSections.forEach(sectionId => {
      expandedSections.push(sectionId);
      sectionOptions
        .filter(s => s.isSubsection && s.id.startsWith(sectionId))
        .forEach(s => expandedSections.push(s.id));
    });

    patchDraft({
      access_level: 'Section-Specific Access',
      authorized_sections: Array.from(new Set(expandedSections)),
    });
    setSectionPickerOpen(true);
    toast.success(`Applied preset: ${preset}`);
  };

  const validateWizardStep = (step: number): boolean => {
    if (!draft) return false;

    if (step === 0) {
      if (!draft.full_name?.trim() || !draft.email?.trim() || !draft.relationship?.trim()) {
        toast.error('Full name, email, and relationship are required');
        return false;
      }
      return true;
    }

    if (step === 1) {
      if (
        draft.access_level === 'Section-Specific Access' &&
        draft.authorized_sections.length === 0
      ) {
        toast.error('Select at least one section for section-specific access');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!draft.master_password?.trim()) {
        toast.error('Generate or enter a master password');
        return false;
      }
      return true;
    }

    return true;
  };

  const goNextStep = () => {
    if (!validateWizardStep(wizardStep)) return;
    setWizardStep(s => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const goPrevStep = () => {
    setWizardStep(s => Math.max(s - 1, 0));
  };

  const goToWizardStep = (index: number) => {
    if (index < 0 || index >= WIZARD_STEPS.length) return;
    if (index > wizardStep) return;
    setWizardStep(index);
  };

  const saveWizard = async () => {
    if (!draft || !validateWizardStep(0) || !validateWizardStep(1) || !validateWizardStep(2)) {
      return;
    }

    const normalizedEmail = draft.email.trim().toLowerCase();
    const duplicateInList = authorizedPeople.some((candidate, idx) => {
      if (wizardMode === 'edit' && wizardIndex === idx) return false;
      return candidate.email.trim().toLowerCase() === normalizedEmail;
    });

    if (!draft._id && duplicateInList) {
      toast.error(
        `A trusted person with ${draft.email} is already in your list.`,
      );
      return;
    }

    const personKey = draft._id || draft.__clientId || 'wizard-save';
    setPersonAction(personKey, 'saving');

    try {
      if (draft._id) {
        await updateNextKin({ nextkinId: draft._id, body: draft }).unwrap();
        if (wizardIndex !== null) {
          setAuthorizedPeople(prev => {
            const copy = [...prev];
            copy[wizardIndex] = draft;
            return copy;
          });
        }
        toast.success(`Updated ${draft.full_name}`);
      } else {
        const res =
          (await createNextKin(draft).unwrap()) as CreateNextKinResponseWithId;
        const saved: AuthorizedPerson = {
          ...draft,
          _id: res.id || res._id,
          __clientId: res.id || res._id || draft.__clientId,
        };
        setAuthorizedPeople(prev => [...prev, saved]);
        toast.success(`Added ${draft.full_name}`);
      }
      refetch();
      closeWizard();
    } catch (error) {
      console.error(error);
      const detail = getApiErrorDetail(error);
      if (detail === 'Next-of-Kin already exists') {
        toast.error(
          `A Next-of-Kin with ${draft.email} already exists. Use a different email.`,
        );
      } else {
        toast.error(detail || 'Save failed');
      }
    } finally {
      setPersonAction(personKey);
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    const index = deleteTarget;
    const person = authorizedPeople[index];

    if (!person._id) {
      setAuthorizedPeople(prev => prev.filter((_, idx) => idx !== index));
      setDeleteTarget(null);
      return;
    }

    const personKey = getPersonKey(person, index);
    setPersonAction(personKey, 'deleting');

    try {
      await deleteNextKin(person._id).unwrap();
      setAuthorizedPeople(prev => prev.filter((_, idx) => idx !== index));
      toast.success('Deleted');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Delete failed');
    } finally {
      setPersonAction(personKey);
      setDeleteTarget(null);
    }
  };

  const approveOne = async (index: number) => {
    const person = authorizedPeople[index];
    if (!person._id) {
      toast.error('Please save this person first');
      return;
    }
    const personKey = getPersonKey(person, index);
    setPersonAction(personKey, 'approving');
    try {
      await approveNextKinAccess(person._id).unwrap();
      setAuthorizedPeople(prev => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          immediate_access: true,
          nok_letter_received: false,
        };
        return copy;
      });
      toast.success('Access approved');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Approve failed');
    } finally {
      setPersonAction(personKey);
    }
  };

  const revokeOne = async (index: number) => {
    const person = authorizedPeople[index];
    if (!person._id) {
      setAuthorizedPeople(prev => {
        const copy = [...prev];
        copy[index] = { ...copy[index], immediate_access: false };
        return copy;
      });
      return;
    }
    const personKey = getPersonKey(person, index);
    setPersonAction(personKey, 'revoking');
    try {
      await revokeNextKinAccess(person._id).unwrap();
      setAuthorizedPeople(prev => {
        const copy = [...prev];
        copy[index] = { ...copy[index], immediate_access: false };
        return copy;
      });
      toast.success('Access revoked');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Revoke failed');
    } finally {
      setPersonAction(personKey);
    }
  };

  const confirmRevokeAll = async () => {
    if (!authorizedPeople.length) return;
    try {
      await revokeAllNextKinAccess().unwrap();
      setAuthorizedPeople(prev =>
        prev.map(person => ({ ...person, immediate_access: false })),
      );
      toast.success('All access revoked');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Revoke all failed');
    } finally {
      setRevokeAllOpen(false);
    }
  };

  const draftSectionLabels = useMemo(() => {
    if (!draft) return [];
    return draft.authorized_sections.map(
      id => sectionLabelMap[id] || id,
    );
  }, [draft, sectionLabelMap]);

  const isWizardSaving = Boolean(
    draft &&
      personActions[draft._id || draft.__clientId || 'wizard-save'] ===
        'saving',
  );

  function WizardShell() {
    return (
      <>
        {isMobile && <MobileSheetHandle />}

        <div
          className={cn(
            'shrink-0 space-y-0 border-b px-4 pb-4 sm:px-6',
            isMobile ? 'pt-1' : 'pt-5',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                id="wizard-sheet-title"
                className="text-left text-lg font-semibold sm:text-xl"
              >
                {wizardMode === 'add'
                  ? 'Add Trusted Person'
                  : 'Edit Trusted Person'}
              </h2>
              <p className="text-left text-sm text-muted-foreground">
                Step {wizardStep + 1} of {WIZARD_STEPS.length}
              </p>
            </div>
            {isMobile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeWizard}
                className="h-10 w-10 shrink-0 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="mt-4">
            <WizardStepper
              currentIndex={wizardStep}
              onStepClick={goToWizardStep}
            />
          </div>
        </div>

        {draft && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={wizardStep}
                initial={{ opacity: 0, y: isMobile ? 16 : 0, x: isMobile ? 0 : 12 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: isMobile ? -8 : 0, x: isMobile ? 0 : -12 }}
                transition={
                  isMobile
                    ? { type: 'spring', damping: 28, stiffness: 340 }
                    : { duration: 0.2 }
                }
                className="space-y-6"
              >
{wizardStep === 0 && (
                    <>
                      <div>
                        <h4 className="font-semibold">Personal Information</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Who are you granting access to?
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="wizard-full-name">Full Name</Label>
                          <Input
                            id="wizard-full-name"
                            value={draft.full_name}
                            onChange={e =>
                              patchDraft({ full_name: e.target.value })
                            }
                            placeholder="Enter full name"
                            className={cn('rounded-2xl', MIN_TOUCH)}
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="wizard-relationship">Relationship</Label>
                          <Input
                            id="wizard-relationship"
                            value={draft.relationship}
                            onChange={e =>
                              patchDraft({ relationship: e.target.value })
                            }
                            placeholder="e.g. Spouse, Brother, Friend"
                            className={cn('rounded-2xl', MIN_TOUCH)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wizard-email">Email</Label>
                          <Input
                            id="wizard-email"
                            type="email"
                            value={draft.email}
                            onChange={e => patchDraft({ email: e.target.value })}
                            placeholder="email@example.com"
                            className={cn('rounded-2xl', MIN_TOUCH)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wizard-phone">Phone</Label>
                          <Input
                            id="wizard-phone"
                            type="tel"
                            value={draft.phone_number || ''}
                            onChange={e =>
                              patchDraft({ phone_number: e.target.value })
                            }
                            placeholder="Phone number"
                            className={cn('rounded-2xl', MIN_TOUCH)}
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold">Access Timing</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          When should this person be able to access?
                        </p>
                        <div
                          role="radiogroup"
                          aria-label="Access timing"
                          className="mt-4 grid gap-3 sm:grid-cols-2"
                        >
                          <SelectableOptionCard
                            selected={draft.immediate_access}
                            onSelect={() =>
                              patchDraft({
                                immediate_access: true,
                                nok_letter_received: false,
                              })
                            }
                            title="Immediate Access"
                            description="They can access right away after approval."
                            icon={Zap}
                            iconClassName="bg-emerald-100 text-emerald-700"
                          />
                          <SelectableOptionCard
                            selected={!draft.immediate_access}
                            onSelect={() =>
                              patchDraft({ immediate_access: false })
                            }
                            title="Upon Death"
                            description="Access after your Next of Kin letter is received."
                            icon={Clock}
                            iconClassName="bg-blue-100 text-blue-700"
                          />
                        </div>
                        {!draft.immediate_access && (
                          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border bg-background px-4 py-3">
                            <input
                              type="checkbox"
                              checked={draft.nok_letter_received}
                              onChange={e =>
                                patchDraft({
                                  nok_letter_received: e.target.checked,
                                })
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm">
                              Next of Kin letter received
                            </span>
                          </label>
                        )}
                      </div>
                    </>
                  )}

                  {wizardStep === 1 && (
                    <>
                      <div>
                        <h4 className="font-semibold">Choose Access Level</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Control how much of your kit they can view.
                        </p>
                      </div>
                      <div
                        role="radiogroup"
                        aria-label="Access level"
                        className="grid gap-3"
                      >
                        <SelectableOptionCard
                          selected={draft.access_level === 'Full Kit Access'}
                          onSelect={() =>
                            patchDraft({
                              access_level: 'Full Kit Access',
                              authorized_sections: [],
                            })
                          }
                          title="Full Kit Access"
                          description="They can view your complete kit."
                          icon={ShieldCheck}
                          iconClassName="bg-emerald-100 text-emerald-700"
                        />
                        <SelectableOptionCard
                          selected={
                            draft.access_level === 'Section-Specific Access'
                          }
                          onSelect={() =>
                            patchDraft({
                              access_level: 'Section-Specific Access',
                            })
                          }
                          title="Section-Specific Access"
                          description="Choose exactly which sections they can access."
                          icon={FileText}
                          iconClassName="bg-blue-100 text-blue-700"
                        />
                      </div>

                      {draft.access_level === 'Section-Specific Access' && (
                        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium text-blue-950">
                                Select Sections
                              </p>
                              <p className="text-sm text-blue-800">
                                {draft.authorized_sections.length} selected
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className={cn('rounded-xl bg-background', MIN_TOUCH)}
                              onClick={() =>
                                setSectionPickerOpen(v => !v)
                              }
                            >
                              {sectionPickerOpen ? 'Hide' : 'Show'} Sections
                            </Button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {Object.keys(SECTION_PRESETS).map(preset => (
                              <Button
                                key={preset}
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => applyPresetToDraft(preset)}
                              >
                                <Sparkles className="mr-1 h-3 w-3" />
                                {preset}
                              </Button>
                            ))}
                          </div>
                          {sectionPickerOpen && (
                            <div className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-xl border bg-background p-2">
                              {sectionOptions.map(section => (
                                <label
                                  key={section.id}
                                  className={cn(
                                    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted',
                                    section.isSubsection && 'ml-3',
                                    MIN_TOUCH,
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={draft.authorized_sections.includes(
                                      section.id,
                                    )}
                                    onChange={() =>
                                      toggleDraftSection(section.id)
                                    }
                                    className="h-4 w-4"
                                  />
                                  <span
                                    className={cn(
                                      'min-w-0 flex-1 text-sm',
                                      !section.isSubsection && 'font-medium',
                                    )}
                                  >
                                    {section.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {wizardStep === 2 && (
                    <>
                      <div>
                        <h4 className="font-semibold">Create Credentials</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Generate a secure master password and storage details.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wizard-password">Master Password</Label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            id="wizard-password"
                            value={draft.master_password}
                            onChange={e =>
                              patchDraft({ master_password: e.target.value })
                            }
                            className={cn(
                              'rounded-2xl font-mono tracking-wider',
                              MIN_TOUCH,
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className={cn('shrink-0 rounded-2xl', MIN_TOUCH)}
                            onClick={() =>
                              patchDraft({
                                master_password: generatePassword(),
                              })
                            }
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="wizard-card-loc">Card Location</Label>
                          <Input
                            id="wizard-card-loc"
                            value={draft.card_storage_location || ''}
                            onChange={e =>
                              patchDraft({
                                card_storage_location: e.target.value,
                              })
                            }
                            placeholder="Where the password card is kept"
                            className={cn('rounded-2xl', MIN_TOUCH)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wizard-key-loc">Key Bag Location</Label>
                          <Input
                            id="wizard-key-loc"
                            value={draft.key_bag_location || ''}
                            onChange={e =>
                              patchDraft({ key_bag_location: e.target.value })
                            }
                            placeholder="Where keys are stored"
                            className={cn('rounded-2xl', MIN_TOUCH)}
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="wizard-doc-loc">
                            Document Bag Location
                          </Label>
                          <Input
                            id="wizard-doc-loc"
                            value={draft.documents_bag_location || ''}
                            onChange={e =>
                              patchDraft({
                                documents_bag_location: e.target.value,
                              })
                            }
                            placeholder="e.g. Fireproof document bag"
                            className={cn('rounded-2xl', MIN_TOUCH)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wizard-instructions">
                          Special Instructions
                        </Label>
                        <Textarea
                          id="wizard-instructions"
                          value={draft.special_instructions || ''}
                          onChange={e =>
                            patchDraft({
                              special_instructions: e.target.value,
                            })
                          }
                          className="min-h-[100px] rounded-2xl"
                        />
                      </div>
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="font-semibold">Password Card Preview</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={MIN_TOUCH}
                            onClick={() =>
                              setShowWizardCardPreview(v => !v)
                            }
                          >
                            <Eye className="mr-1.5 h-4 w-4" />
                            {showWizardCardPreview ? 'Hide' : 'Preview'}
                          </Button>
                        </div>
                        {showWizardCardPreview && (
                          <PasswordCard
                            personName={
                              draft.full_name || 'Trusted Person'
                            }
                            masterPassword={draft.master_password}
                            email={draft.email}
                            phone={draft.phone_number}
                            relationship={draft.relationship}
                            accessLevel={draft.access_level}
                            authorizedSections={draftSectionLabels}
                            immediateAccess={draft.immediate_access}
                            card_storage_location={draft.card_storage_location}
                          />
                        )}
                      </div>
                    </>
                  )}

                  {wizardStep === 3 && (
                    <>
                      <div>
                        <h4 className="font-semibold">Review</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Confirm details before saving.
                        </p>
                      </div>
                      <dl className="divide-y rounded-2xl border">
                        {[
                          ['Name', draft.full_name],
                          ['Relationship', draft.relationship],
                          ['Email', draft.email],
                          ['Phone', draft.phone_number || '—'],
                          [
                            'Access timing',
                            draft.immediate_access
                              ? 'Immediate Access'
                              : 'Upon Death',
                          ],
                          ['Access level', draft.access_level],
                          [
                            'Sections',
                            draft.access_level === 'Full Kit Access'
                              ? 'All sections'
                              : `${draft.authorized_sections.length} selected`,
                          ],
                          [
                            'Card location',
                            draft.card_storage_location || '—',
                          ],
                          [
                            'Key bag location',
                            draft.key_bag_location || '—',
                          ],
                          [
                            'Document bag location',
                            draft.documents_bag_location || '—',
                          ],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="flex justify-between gap-4 px-4 py-3 text-sm"
                          >
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="text-right font-medium">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <PasswordCard
                        personName={draft.full_name || 'Trusted Person'}
                        masterPassword={draft.master_password}
                        email={draft.email}
                        phone={draft.phone_number}
                        relationship={draft.relationship}
                        accessLevel={draft.access_level}
                        authorizedSections={draftSectionLabels}
                        immediateAccess={draft.immediate_access}
                        card_storage_location={draft.card_storage_location}
                      />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          <div
            className={cn(
              'shrink-0 border-t bg-background/95 px-4 py-4 backdrop-blur sm:px-6',
              isMobile && 'sticky bottom-0 pb-[max(1rem,env(safe-area-inset-bottom))]',
            )}
          >
            <div
              className={cn(
                'flex w-full gap-2',
                isMobile
                  ? 'flex-col-reverse'
                  : 'flex-col-reverse sm:flex-row sm:justify-between',
              )}
            >
              {wizardStep === 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeWizard}
                  className={cn('rounded-2xl', MIN_TOUCH, 'w-auto')}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goPrevStep}
                  className={cn('rounded-2xl', MIN_TOUCH, 'w-auto')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}

              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={goNextStep}
                  className={cn('rounded-2xl', MIN_TOUCH, 'w-auto')}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={saveWizard}
                  disabled={isWizardSaving}
                  className={cn('rounded-2xl', MIN_TOUCH, 'w-auto')}
                >
                  {isWizardSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  {isWizardSaving ? 'Saving...' : 'Save Trusted Person'}
                </Button>
              )}
            </div>
          </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading access management">
        <div className="h-28 animate-pulse rounded-3xl bg-muted" />
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            2A Kit Access Control
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Access Management
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage who can access your kit, what they can see, and revoke access anytime.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setRevokeAllOpen(true)}
            disabled={!authorizedPeople.length || isRevokingAll || hasPersonAction}
            className={cn('rounded-2xl border-destructive/30 text-destructive hover:text-destructive', MIN_TOUCH, 'w-auto')}
          >
            {isRevokingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            Revoke All
          </Button>
          <Button onClick={openAddWizard} className={cn('rounded-2xl', MIN_TOUCH, 'w-auto')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Trusted Person
          </Button>
        </div>
      </div>

      {needsDesignation && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h4 className="font-semibold">Access designation required</h4>
              <p className="mt-1 text-sm leading-6">Please add at least one trusted person who can access your kit.</p>
            </div>
          </div>
          <Button variant="secondary" onClick={openAddWizard} className={cn('shrink-0 rounded-xl bg-background', MIN_TOUCH, 'w-full sm:w-auto')}>
            Add Now
          </Button>
        </div>
      )}

      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 w-full space-y-4">
          <div
            className={cn(
              'w-full rounded-3xl border bg-card shadow-sm',
              isMobile && 'rounded-2xl border-0 bg-transparent shadow-none',
            )}
          >
            <div
              className={cn(
                'border-b',
                isMobile ? 'border-0 pb-3' : 'p-4 sm:p-5',
              )}
            >
              <h3 className="text-lg font-semibold">Trusted People</h3>
              <p className="mt-1 text-sm text-muted-foreground">People who can access your kit</p>
            </div>
            <div className={cn('w-full', isMobile ? 'pt-0' : 'p-4 sm:p-5')}>
              {authorizedPeople.length > 0 && (
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, relationship..." className={cn('rounded-2xl pl-9 pr-10', MIN_TOUCH)} aria-label="Search trusted people" />
                  {search && (
                    <button type="button" onClick={() => setSearch('')} className={cn('absolute right-1 top-1/2 -translate-y-1/2 rounded-lg px-3 text-muted-foreground hover:text-foreground', MIN_TOUCH)} aria-label="Clear search">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              {authorizedPeople.length === 0 ? (
                <EmptyState onAdd={openAddWizard} />
              ) : filteredPeople.length === 0 ? (
                <div className="rounded-2xl bg-muted/30 p-8 text-center">
                  <p className="font-medium">No people found</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try a different search term.</p>
                </div>
              ) : (
                <ul
                  className={cn('w-full', isMobile ? 'space-y-2' : 'space-y-4')}
                  role="list"
                >
                  {filteredPeople.map(({ person, index, key }) => {
                    const action = personActions[key];
                    const isBusy = !!action || isRevokingAll;
                    const isDeleting = action === 'deleting';
                    const isApproving = action === 'approving';
                    const isRevoking = action === 'revoking';
                    const hasNokLetter = !person.immediate_access && person.nok_letter_received;
                    return (
                      <motion.li key={key} layout className="w-full" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }}>
                        {isMobile ? (
                          <TrustedPersonMobileListItem
                            person={person}
                            index={index}
                            hasNokLetter={hasNokLetter}
                            onOpen={() => setDetailViewIndex(index)}
                          />
                        ) : (
                          <TrustedPersonCard
                            person={person}
                            index={index}
                            isBusy={isBusy}
                            isDeleting={isDeleting}
                            isApproving={isApproving}
                            isRevoking={isRevoking}
                            hasNokLetter={hasNokLetter}
                            revokeDisabled={isRevokingOne}
                            onEdit={() => openEditWizard(index)}
                            onViewCard={() => setCardPreviewIndex(index)}
                            onApprove={() => approveOne(index)}
                            onRevoke={() => revokeOne(index)}
                            onDelete={() => setDeleteTarget(index)}
                          />
                        )}
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h4 className="text-sm font-semibold">Setup Progress</h4>
            <p className="mt-2 text-2xl font-semibold">{savedCount} <span className="text-base font-normal text-muted-foreground">/ 1 people added</span></p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={setupProgress * 100} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: setupProgress * 100 + '%' }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">At least 1 trusted person is required</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h4 className="font-semibold">How Access Works</h4>
            <ol className="mt-4 space-y-3">
              {HOW_ACCESS_STEPS.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm leading-6">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <div className="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
        {FEATURE_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', card.tone)}><Icon className="h-5 w-5" /></div>
              <h4 className="mt-3 font-semibold">{card.title}</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Add / Edit wizard */}
      {isMobile ? (
        <MobileBottomSheet
          open={wizardOpen}
          onClose={closeWizard}
          className="h-[96dvh]"
          labelledBy="wizard-sheet-title"
        >
          <div className="flex h-full min-h-0 flex-col">
            <WizardShell />
          </div>
        </MobileBottomSheet>
      ) : (
        <Sheet open={wizardOpen} onOpenChange={open => !open && closeWizard()}>
          <SheetContent
            side="right"
            className="flex h-full max-w-lg flex-col gap-0 p-0 sm:max-w-xl"
          >
            <div className="flex h-full min-h-0 flex-col">
              <WizardShell />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Trusted person details (mobile) */}
      {isMobile && (
        <MobileBottomSheet
          open={detailViewIndex !== null}
          onClose={() => setDetailViewIndex(null)}
          className="max-h-[92dvh]"
          labelledBy="person-detail-title"
        >
          <div className="flex h-full min-h-0 flex-col">
            <MobileSheetHandle />
            <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 pb-4 pt-1">
              <div className="min-w-0">
                <h3 id="person-detail-title" className="text-lg font-semibold">
                  Trusted Person
                </h3>
                <p className="truncate text-sm text-muted-foreground">
                  {detailViewIndex !== null
                    ? authorizedPeople[detailViewIndex]?.full_name
                    : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setDetailViewIndex(null)}
                className="h-10 w-10 shrink-0 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {detailViewIndex !== null && (() => {
            const person = authorizedPeople[detailViewIndex];
            const key = getPersonKey(person, detailViewIndex);
            const action = personActions[key];
            const isBusy = !!action || isRevokingAll;
            const isDeleting = action === 'deleting';
            const isApproving = action === 'approving';
            const isRevoking = action === 'revoking';
            const hasNokLetter =
              !person.immediate_access && person.nok_letter_received;

            return (
              <div
                className={cn(
                  'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4',
                  MOBILE_SHEET_SCROLL_PADDING,
                )}
              >
                <TrustedPersonMobileDetails
                  person={person}
                  index={detailViewIndex}
                  isBusy={isBusy}
                  isDeleting={isDeleting}
                  isApproving={isApproving}
                  isRevoking={isRevoking}
                  hasNokLetter={hasNokLetter}
                  revokeDisabled={isRevokingOne}
                  onEdit={() => {
                    setDetailViewIndex(null);
                    openEditWizard(detailViewIndex);
                  }}
                  onViewCard={() => {
                    setDetailViewIndex(null);
                    setCardPreviewIndex(detailViewIndex);
                  }}
                  onApprove={() => approveOne(detailViewIndex)}
                  onRevoke={() => revokeOne(detailViewIndex)}
                  onDelete={() => {
                    setDetailViewIndex(null);
                    setDeleteTarget(detailViewIndex);
                  }}
                />
              </div>
            );
          })()}
          </div>
        </MobileBottomSheet>
      )}

      {/* Password card preview from list */}
      {isMobile ? (
        <MobileBottomSheet
          open={cardPreviewIndex !== null}
          onClose={() => setCardPreviewIndex(null)}
          className="h-[88dvh]"
          labelledBy="card-preview-title"
        >
          <MobileSheetHandle />
          <div className="flex items-start justify-between gap-3 border-b px-4 pb-4 pt-1">
            <div>
              <h3 id="card-preview-title" className="text-lg font-semibold">
                Password Card
              </h3>
              <p className="text-sm text-muted-foreground">
                {cardPreviewIndex !== null
                  ? authorizedPeople[cardPreviewIndex]?.full_name
                  : ''}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCardPreviewIndex(null)}
              className="h-10 w-10 shrink-0 rounded-full"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {cardPreviewIndex !== null && (
            <div
              className={cn(
                'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-5',
                MOBILE_SHEET_SCROLL_PADDING,
              )}
            >
              <PasswordCard
                personName={
                  authorizedPeople[cardPreviewIndex].full_name ||
                  'Trusted Person'
                }
                masterPassword={
                  authorizedPeople[cardPreviewIndex].master_password
                }
                email={authorizedPeople[cardPreviewIndex].email}
                phone={authorizedPeople[cardPreviewIndex].phone_number}
                relationship={
                  authorizedPeople[cardPreviewIndex].relationship
                }
                accessLevel={
                  authorizedPeople[cardPreviewIndex].access_level
                }
                authorizedSections={authorizedPeople[
                  cardPreviewIndex
                ].authorized_sections.map(
                  id => sectionLabelMap[id] || id,
                )}
                immediateAccess={
                  authorizedPeople[cardPreviewIndex].immediate_access
                }
                card_storage_location={
                  authorizedPeople[cardPreviewIndex].card_storage_location
                }
              />
            </div>
          )}
        </MobileBottomSheet>
      ) : (
        <Sheet
          open={cardPreviewIndex !== null}
          onOpenChange={open => !open && setCardPreviewIndex(null)}
        >
          <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Password Card</SheetTitle>
              <SheetDescription>
                {cardPreviewIndex !== null
                  ? authorizedPeople[cardPreviewIndex]?.full_name
                  : ''}
              </SheetDescription>
            </SheetHeader>
            {cardPreviewIndex !== null && (
              <div className="px-4 pb-6">
                <PasswordCard
                  personName={
                    authorizedPeople[cardPreviewIndex].full_name ||
                    'Trusted Person'
                  }
                  masterPassword={
                    authorizedPeople[cardPreviewIndex].master_password
                  }
                  email={authorizedPeople[cardPreviewIndex].email}
                  phone={authorizedPeople[cardPreviewIndex].phone_number}
                  relationship={
                    authorizedPeople[cardPreviewIndex].relationship
                  }
                  accessLevel={
                    authorizedPeople[cardPreviewIndex].access_level
                  }
                  authorizedSections={authorizedPeople[
                    cardPreviewIndex
                  ].authorized_sections.map(
                    id => sectionLabelMap[id] || id,
                  )}
                  immediateAccess={
                    authorizedPeople[cardPreviewIndex].immediate_access
                  }
                  card_storage_location={
                    authorizedPeople[cardPreviewIndex].card_storage_location
                  }
                />
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete trusted person?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget !== null &&
                `This will permanently remove ${authorizedPeople[deleteTarget]?.full_name || 'this person'} from your access list.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={MIN_TOUCH}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={cn(
                'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                MIN_TOUCH,
              )}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke all confirmation */}
      <AlertDialog open={revokeAllOpen} onOpenChange={setRevokeAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke all access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke access for every trusted person on
              your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={MIN_TOUCH}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeAll}
              className={MIN_TOUCH}
            >
              Revoke All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
