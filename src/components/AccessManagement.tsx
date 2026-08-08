'use client';

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Textarea } from '@common/ui/textarea';
import { Badge } from '@common/ui/badge';
import { BrandDangerConfirm } from '@/components/BrandDangerConfirm';
import { BrandSuccessScreen } from '@/components/BrandSuccessScreen';
import { InlineNotice } from '@/components/common/ui/inline-notice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@common/ui/dialog';
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
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
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
  useRevealNextKinPasswordMutation,
  useRevokeAllNextKinAccessMutation,
  useRevokeNextKinAccessMutation,
  useUpdateNextKinMutation,
} from '@/services/authApi';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
import {
  isDuplicateAccessEmail,
  validateAccessWizardStep,
  MAX_NEXTKIN_ACCOUNTS,
  MAX_NOK_AUTHORIZED_SECTIONS,
  type WizardStepId,
} from '@/utils/accessManagementValidation';

import { PasswordCard } from './PasswordCard';
import {
  MOBILE_SHEET_FOOTER_CLASS,
  MOBILE_SHEET_SCROLL_CLASS,
  MOBILE_SHEET_SCROLL_PADDING,
  MobileBottomSheet,
  MobileSheetHandle,
  useIsMobile,
} from './MobileBottomSheet';
import { formConfig } from '../config/formConfig';
import {
  formatVaultSectionTitle,
  formatVaultSubsectionTitle,
  VAULT_NAVIGATION,
} from '@/utils/vaultNavigation';

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
  has_master_password?: boolean;
  password_card_generated: boolean;
  card_storage_location?: string;
  key_bag_location?: string;
  documents_bag_location?: string;
  special_instructions?: string;
}

type PersonAction = 'saving' | 'deleting' | 'approving' | 'revoking';
type WizardMode = 'add' | 'edit';

const WIZARD_STEPS: { id: WizardStepId; label: string }[] = [
  { id: 'person', label: 'Person' },
  { id: 'access', label: 'Access Level' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'review', label: 'Review' },
];

const SECTION_PRESETS: Record<string, string[] | 'all'> = {
  'Full Access': 'all',
  'Financial & Tax': ['7', '12', '14', '16', '19'],
  'Healthcare & Medical': ['15'],
  'Legal & Estate': ['20', '21'],
  'Personal & Family': ['1', '17'],
  'Business & Employment': ['18'],
  'Insurance & Benefits': ['7', '11'],
};

type SectionRegistryItem = {
  id: string;
  title: string;
  subsections: { id: string; title: string }[];
};

function buildSectionRegistry(): SectionRegistryItem[] {
  const items: SectionRegistryItem[] = [];
  const order = new Map(VAULT_NAVIGATION.map((s, i) => [s.id, i]));

  formConfig.chunks.forEach(chunk => {
    chunk.sections.forEach(section => {
      if (section.id === '0') return;

      items.push({
        id: section.id,
        title: section.title,
        subsections: (section.subsections ?? []).map(sub => ({
          id: sub.id,
          title: sub.title,
        })),
      });
    });
  });

  items.sort(
    (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
  );

  return items;
}

function expandParentSectionIds(
  parentId: string,
  registry: SectionRegistryItem[],
): string[] {
  const section = registry.find(entry => entry.id === parentId);
  if (!section) return [parentId];

  const ids = [parentId];
  section.subsections.forEach(sub => ids.push(sub.id));
  return ids;
}

function expandPresetToSectionIds(
  preset: string,
  registry: SectionRegistryItem[],
): string[] {
  const presetSections = SECTION_PRESETS[preset];
  if (!presetSections || presetSections === 'all') return [];

  const ids = new Set<string>();
  presetSections.forEach(parentId => {
    expandParentSectionIds(parentId, registry).forEach(id => ids.add(id));
  });

  return Array.from(ids);
}

function isPresetFullySelected(
  preset: string,
  authorizedSections: string[],
  registry: SectionRegistryItem[],
): boolean {
  const presetIds = expandPresetToSectionIds(preset, registry);
  return (
    presetIds.length > 0 &&
    presetIds.every(id => authorizedSections.includes(id))
  );
}

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

type CreateNextKinResponseWithId = {
  id?: string;
  _id?: string;
  master_password?: string | null;
};

type NextKinApiPersonExtras = {
  _id?: string;
  id?: string;
  master_password?: string | null;
  has_master_password?: boolean;
};

function toNextKinApiBody(
  person: AuthorizedPerson,
  options?: { isCreate?: boolean; passwordChanged?: boolean },
) {
  const {
    __clientId: _clientId,
    _id,
    master_password,
    card_storage_location,
    key_bag_location,
    documents_bag_location,
    special_instructions,
    password_card_generated,
    phone_number,
    ...shared
  } = person;

  const digits = String(phone_number || '').replace(/\D/g, '');
  const normalizedPhone =
    phone_number && String(phone_number).trim().startsWith('+')
      ? String(phone_number).trim()
      : digits
        ? digits.length === 10
          ? `+1${digits}`
          : digits.length === 11 && digits.startsWith('1')
            ? `+${digits}`
            : `+${digits}`
        : '';

  const credentialExtras = {
    card_storage_location,
    key_bag_location,
    documents_bag_location,
    special_instructions,
    password_card_generated,
  };

  const withPhone = {
    ...shared,
    ...(normalizedPhone ? { phone_number: normalizedPhone } : {}),
  };

  if (options?.isCreate) {
    return {
      ...withPhone,
      master_password,
      ...credentialExtras,
    };
  }

  if (person.immediate_access) {
    if (options?.passwordChanged && master_password?.trim()) {
      return { ...withPhone, master_password };
    }
    return withPhone;
  }

  return {
    ...withPhone,
    ...(master_password?.trim() ? { master_password } : {}),
    ...credentialExtras,
  };
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
  steps,
  currentIndex,
  onStepClick,
  compact = false,
}: {
  steps: { id: WizardStepId; label: string }[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
  compact?: boolean;
}) {
  if (compact) {
    const step = steps[currentIndex];
    return (
      <nav
        aria-label="Add trusted person progress"
        className="flex items-center gap-3"
      >
        <div className="flex gap-1">
          {steps.map((_, index) => (
            <div
              key={steps[index].id}
              className={cn(
                'h-1.5 rounded-full transition-all',
                index === currentIndex
                  ? 'w-6 bg-primary'
                  : index < currentIndex
                    ? 'w-3 bg-primary/40'
                    : 'w-3 bg-muted',
              )}
              aria-hidden
            />
          ))}
        </div>
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{step.label}</span>
          <span className="mx-1.5 text-muted-foreground/60">·</span>
          Step {currentIndex + 1} of {steps.length}
        </p>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Add trusted person progress"
      className="flex items-center gap-0"
    >
      {steps.map((step, index) => {
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

function TrustedPersonLoginPassword({
  password,
  passwordOnFile = false,
  personId,
  className,
  compact = false,
}: {
  password?: string;
  passwordOnFile?: boolean;
  /** Server id — used for secure reveal when list APIs omit plaintext. */
  personId?: string;
  className?: string;
  compact?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState('');
  const [revealing, setRevealing] = useState(false);
  const [needsStepUp, setNeedsStepUp] = useState(false);
  const [stepUpPassword, setStepUpPassword] = useState('');
  const [stepUpError, setStepUpError] = useState('');
  const stepUpInputRef = useRef<HTMLInputElement>(null);
  const [revealNextKinPassword] = useRevealNextKinPasswordMutation();
  const effectivePassword = password?.trim() || revealedPassword.trim();
  const hasPassword = Boolean(effectivePassword);
  const canReveal = Boolean(personId) && passwordOnFile && !hasPassword;

  const runReveal = async (accountPassword: string) => {
    if (!personId) return;
    const pwIn = accountPassword.trim();
    if (!pwIn) {
      setStepUpError('Enter your Orderly Affairs sign-in password.');
      return;
    }
    setRevealing(true);
    setStepUpError('');
    try {
      const res = await revealNextKinPassword({
        id: personId,
        password: pwIn,
      }).unwrap();
      const pw = (res.master_password || '').trim();
      if (!pw) {
        toast.error('No password on file');
        return;
      }
      setRevealedPassword(pw);
      setVisible(true);
      setNeedsStepUp(false);
      setStepUpPassword('');
      setStepUpError('');
    } catch (err: unknown) {
      const message = getSafeErrorMessage(err, 'Could not reveal password');
      setStepUpError(message);
      toast.error(message);
    } finally {
      setRevealing(false);
    }
  };

  const submitStepUp = () => {
    // Prefer the live input value so browser autofill still works when
    // React state has not caught the autofilled password yet.
    const fromDom = stepUpInputRef.current?.value || '';
    void runReveal(fromDom || stepUpPassword);
  };

  const handleToggle = async () => {
    if (visible) {
      setVisible(false);
      return;
    }
    if (hasPassword) {
      setVisible(true);
      return;
    }
    if (!personId) return;
    setStepUpError('');
    setNeedsStepUp(true);
  };

  const showToggle = hasPassword || canReveal;

  const stepUpBlock = needsStepUp ? (
    <form
      className="mt-2 space-y-2 rounded-xl border bg-muted/40 p-2.5"
      onSubmit={e => {
        e.preventDefault();
        submitStepUp();
      }}
    >
      <p className="text-[11px] leading-snug text-muted-foreground">
        Enter your Orderly Affairs sign-in password (the one you use to log in
        to this vault) — not {compact ? 'their' : 'this person’s'} login
        password.
      </p>
      <Input
        ref={stepUpInputRef}
        type="password"
        name="orderly-step-up-password"
        autoComplete="current-password"
        value={stepUpPassword}
        onChange={e => {
          setStepUpPassword(e.target.value);
          if (stepUpError) setStepUpError('');
        }}
        onInput={e => {
          // Keep state in sync with browser autofill.
          setStepUpPassword((e.target as HTMLInputElement).value);
        }}
        placeholder="Your Orderly Affairs password"
        className="h-9"
        autoFocus
      />
      {stepUpError ? (
        <p className="text-[11px] leading-snug text-rose-700">{stepUpError}</p>
      ) : null}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={revealing}
          onClick={() => {
            setNeedsStepUp(false);
            setStepUpPassword('');
            setStepUpError('');
          }}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={revealing}>
          {revealing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Reveal'}
        </Button>
      </div>
    </form>
  ) : null;

  if (compact) {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center gap-2 rounded-xl border bg-background/80 px-2.5 py-2">
          <KeyRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
            Login
          </span>
          <span
            className={cn(
              'min-w-0 flex-1 truncate font-mono text-xs tracking-wide',
              !hasPassword && 'text-muted-foreground',
            )}
          >
            {hasPassword
              ? visible
                ? effectivePassword
                : '•'.repeat(Math.min(effectivePassword.length, 12))
              : passwordOnFile
                ? 'Saved — tap eye to reveal'
                : 'Not set — edit to generate'}
          </span>
          {showToggle && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-lg"
              onClick={() => void handleToggle()}
              disabled={revealing}
              aria-label={visible ? 'Hide password' : 'Show password'}
              title={
                visible
                  ? 'Hide password'
                  : 'Reveal with your Orderly Affairs sign-in password'
              }
            >
              {revealing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : visible ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
        {stepUpBlock}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="overflow-hidden rounded-2xl border bg-background">
        <div className="flex items-start gap-3 px-3 py-3">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Login Password
            </p>
            <p
              className={cn(
                'mt-0.5 text-sm leading-5 break-all font-mono tracking-wider',
                !hasPassword && 'text-muted-foreground',
              )}
            >
              {hasPassword
                ? visible
                  ? effectivePassword
                  : '•'.repeat(Math.min(effectivePassword.length, 14))
                : passwordOnFile
                  ? 'Saved on server — tap eye to reveal securely'
                  : 'Not saved — edit and generate a password'}
            </p>
          </div>
          {showToggle && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl"
              onClick={() => void handleToggle()}
              disabled={revealing}
              aria-label={visible ? 'Hide password' : 'Show password'}
              title={
                visible
                  ? 'Hide password'
                  : 'Reveal with your Orderly Affairs sign-in password'
              }
            >
              {revealing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : visible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      {stepUpBlock}
    </div>
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
  const timingLabel = person.immediate_access ? 'Immediate' : 'Upon Death access';

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

function TrustedPersonMobileActionBar({
  person,
  isBusy,
  isDeleting,
  isApproving,
  isRevoking,
  onEdit,
  onViewCard,
  onApprove,
  onRevoke,
  onDelete,
  revokeDisabled,
}: {
  person: AuthorizedPerson;
  isBusy: boolean;
  isDeleting: boolean;
  isApproving: boolean;
  isRevoking: boolean;
  onEdit: () => void;
  onViewCard: () => void;
  onApprove: () => void;
  onRevoke: () => void;
  onDelete: () => void;
  revokeDisabled: boolean;
}) {
  return (
    <div
      className={cn(
        'grid gap-1',
        person._id
          ? person.immediate_access
            ? 'grid-cols-3'
            : 'grid-cols-4'
          : person.immediate_access
            ? 'grid-cols-2'
            : 'grid-cols-3',
      )}
    >
      <MobileIconAction
        label="Edit"
        icon={Pencil}
        onClick={onEdit}
        disabled={isBusy}
      />
      {!person.immediate_access && (
        <MobileIconAction
          label="Card"
          icon={Eye}
          onClick={onViewCard}
          disabled={isBusy}
          tone="primary"
        />
      )}
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
  );
}

function TrustedPersonMobileDetails({
  person,
  index,
  hasNokLetter,
  hideActions = false,
  isBusy,
  isDeleting,
  isApproving,
  isRevoking,
  onEdit,
  onViewCard,
  onApprove,
  onRevoke,
  onDelete,
  revokeDisabled,
}: {
  person: AuthorizedPerson;
  index: number;
  hasNokLetter: boolean;
  hideActions?: boolean;
  isBusy: boolean;
  isDeleting: boolean;
  isApproving: boolean;
  isRevoking: boolean;
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
            {person.immediate_access ? 'Immediate' : 'Upon Death access'}
          </p>
        </div>
      </div>

      {hasNokLetter && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
          Will Receive Next of Kin Letter
        </div>
      )}

      {person._id && (
        <TrustedPersonLoginPassword
          password={person.master_password}
          passwordOnFile={person.has_master_password}
          personId={person._id}
          compact
        />
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

      {!hideActions && (
        <div className="rounded-2xl border bg-muted/20 p-1">
          <TrustedPersonMobileActionBar
            person={person}
            isBusy={isBusy}
            isDeleting={isDeleting}
            isApproving={isApproving}
            isRevoking={isRevoking}
            onEdit={onEdit}
            onViewCard={onViewCard}
            onApprove={onApprove}
            onRevoke={onRevoke}
            onDelete={onDelete}
            revokeDisabled={revokeDisabled}
          />
        </div>
      )}

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
  const accessLabel = isFullAccess ? 'Full kit' : `${sectionCount} sections`;
  const timingLabel = person.immediate_access ? 'Immediate' : 'Upon death';

  return (
    <article
      className={cn(
        'group flex w-full max-w-full overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:border-slate-300/80 hover:shadow-md',
        hasNokLetter && 'border-emerald-200/80',
        !person._id && 'border-amber-200/80 bg-amber-50/20',
      )}
    >
      <div
        className={cn(
          'w-1 shrink-0',
          isFullAccess ? 'bg-emerald-500' : 'bg-blue-500',
        )}
        aria-hidden
      />

      <div className="flex min-w-0 flex-1 flex-col sm:flex-row">
        <div className="min-w-0 flex-1 p-4 sm:p-4 sm:pr-3">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                {initials}
              </div>
              {person._id && (
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card',
                    isActiveAccess ? 'bg-emerald-500' : 'bg-slate-300',
                  )}
                  title={isActiveAccess ? 'Active' : 'Inactive'}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <h4 className="truncate text-base font-semibold tracking-tight">
                  {displayName}
                </h4>
                {person._id && (
                  <span
                    className={cn(
                      'text-[11px] font-medium',
                      isActiveAccess
                        ? 'text-emerald-600'
                        : 'text-muted-foreground',
                    )}
                  >
                    {isActiveAccess ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
              {person.relationship && (
                <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                  {person.relationship}
                </p>
              )}
              <p className="mt-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{accessLabel}</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span>{timingLabel}</span>
                {hasNokLetter && (
                  <>
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span className="text-emerald-600">Next of Kin letter</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {(person.email || person.phone_number || person._id) && (
            <div className="mt-3 space-y-2">
              {(person.email || person.phone_number) && (
                <div className="flex flex-wrap gap-2">
                  {person.email && (
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{person.email}</span>
                    </span>
                  )}
                  {person.phone_number && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {person.phone_number}
                    </span>
                  )}
                </div>
              )}
              {person._id && (
                <TrustedPersonLoginPassword
                  password={person.master_password}
                  passwordOnFile={person.has_master_password}
                  personId={person._id}
                  compact
                />
              )}
            </div>
          )}

          {!person._id && (
            <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/60 px-2.5 py-2 text-xs text-amber-900">
              Unsaved draft — open Edit to finish setup.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-row flex-wrap gap-1.5 border-t border-border/60 bg-muted/20 p-2.5 sm:w-[7.75rem] sm:flex-col sm:border-l sm:border-t-0 sm:p-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1 justify-start rounded-xl text-xs font-medium sm:w-full sm:flex-none"
            onClick={onEdit}
            disabled={isBusy}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            Edit
          </Button>
          {!person.immediate_access && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 flex-1 justify-start rounded-xl text-xs font-medium sm:w-full sm:flex-none"
              onClick={onViewCard}
              disabled={isBusy}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              Card
            </Button>
          )}
          {person._id &&
            (person.immediate_access ? (
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 justify-start rounded-xl text-xs font-medium sm:w-full sm:flex-none"
                onClick={onRevoke}
                disabled={isBusy || revokeDisabled}
              >
                {isRevoking ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                ) : (
                  <Lock className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                )}
                Revoke
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 justify-start rounded-xl text-xs font-medium sm:w-full sm:flex-none"
                onClick={onApprove}
                disabled={isBusy}
              >
                {isApproving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                ) : (
                  <Unlock className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                )}
                Approve
              </Button>
            ))}
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1 justify-start rounded-xl text-xs font-medium text-destructive hover:bg-accent hover:text-destructive sm:w-full sm:flex-none"
            onClick={onDelete}
            disabled={isBusy}
            aria-label={`Delete ${displayName}`}
          >
            {isDeleting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            )}
            Delete
          </Button>
        </div>
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

interface AccessManagementProps {
  /** When true, defers section title/copy to Section 2 wrapper — toolbar + list only. */
  embedded?: boolean;
  ref?: React.Ref<AccessManagementHandle>;
}

export type AccessManagementHandle = {
  openAddWizard: () => void;
};

export function AccessManagement({
  embedded = false,
  ref,
}: AccessManagementProps) {
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
  const [cardStepUpIndex, setCardStepUpIndex] = useState<number | null>(null);
  const [cardStepUpPassword, setCardStepUpPassword] = useState('');
  const [cardStepUpError, setCardStepUpError] = useState('');
  const [cardStepUpBusy, setCardStepUpBusy] = useState(false);
  const cardStepUpInputRef = useRef<HTMLInputElement>(null);
  const [originalMasterPassword, setOriginalMasterPassword] = useState('');
  const [detailViewIndex, setDetailViewIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [cancelPendingInvite, setCancelPendingInvite] = useState(false);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);
  const [inviteSuccessName, setInviteSuccessName] = useState<string | null>(
    null,
  );
  const [inviteSuccessImmediate, setInviteSuccessImmediate] = useState(false);

  const [createNextKin] = useCreateNextKinMutation();
  const [updateNextKin] = useUpdateNextKinMutation();
  const [deleteNextKin] = useDeleteNextKinMutation();
  const [approveNextKinAccess] = useApproveNextKinAccessMutation();
  const [revealNextKinPassword] = useRevealNextKinPasswordMutation();
  const [revokeNextKinAccess, { isLoading: isRevokingOne }] =
    useRevokeNextKinAccessMutation();
  const [revokeAllNextKinAccess, { isLoading: isRevokingAll }] =
    useRevokeAllNextKinAccessMutation();

  const closeCardStepUp = useCallback(() => {
    setCardStepUpIndex(null);
    setCardStepUpPassword('');
    setCardStepUpError('');
    setCardStepUpBusy(false);
  }, []);

  /** Open password card only after login is available (or confirmed missing). */
  const requestCardPreview = useCallback((index: number) => {
    const person = authorizedPeople[index];
    if (!person) return;
    const local = (person.master_password || '').trim();
    if (local) {
      setCardPreviewIndex(index);
      return;
    }
    if (person._id && person.has_master_password) {
      setCardStepUpError('');
      setCardStepUpPassword('');
      setCardStepUpIndex(index);
      return;
    }
    // No password on file — still allow viewing locations / access level.
    setCardPreviewIndex(index);
  }, [authorizedPeople]);

  const submitCardStepUp = useCallback(async () => {
    if (cardStepUpIndex === null) return;
    const person = authorizedPeople[cardStepUpIndex];
    if (!person?._id) {
      closeCardStepUp();
      return;
    }
    const fromDom = cardStepUpInputRef.current?.value || '';
    const accountPassword = (fromDom || cardStepUpPassword).trim();
    if (!accountPassword) {
      setCardStepUpError('Enter your Orderly Affairs sign-in password.');
      return;
    }
    setCardStepUpBusy(true);
    setCardStepUpError('');
    try {
      const res = await revealNextKinPassword({
        id: person._id,
        password: accountPassword,
      }).unwrap();
      const pw = (res.master_password || '').trim();
      if (!pw) {
        setCardStepUpError(
          'No login password is on file for this person. Edit them to generate one.',
        );
        return;
      }
      setAuthorizedPeople(prev =>
        prev.map((p, i) =>
          i === cardStepUpIndex ? { ...p, master_password: pw } : p,
        ),
      );
      const openIndex = cardStepUpIndex;
      closeCardStepUp();
      setCardPreviewIndex(openIndex);
    } catch (err: unknown) {
      setCardStepUpError(
        getSafeErrorMessage(err, 'Could not load password for card'),
      );
    } finally {
      setCardStepUpBusy(false);
    }
  }, [
    authorizedPeople,
    cardStepUpIndex,
    cardStepUpPassword,
    closeCardStepUp,
    revealNextKinPassword,
  ]);

  useEffect(() => {
    if (!data) return;

    setAuthorizedPeople(prev => {
      const prevById = new Map(
        prev.filter(p => p._id).map(p => [p._id as string, p]),
      );
      const unsaved = prev.filter(p => !p._id);
      const fromApi: AuthorizedPerson[] = data.map(rawNextKin => {
        const nk = rawNextKin as typeof rawNextKin & NextKinApiPersonExtras;
        const personId = nk.id || nk._id;
        const previous = personId ? prevById.get(personId) : undefined;
        const apiPassword = (nk.master_password || '').trim();
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
          // Keep session-local password after create/reveal; list APIs omit it.
          master_password:
            apiPassword || previous?.master_password?.trim() || '',
          has_master_password: !!(
            (nk as { has_master_password?: boolean }).has_master_password ||
            apiPassword ||
            previous?.master_password?.trim()
          ),
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

  const sectionRegistry = useMemo(() => buildSectionRegistry(), []);

  const sectionOptions = useMemo(() => {
    const options: { id: string; label: string; isSubsection: boolean }[] = [];

    sectionRegistry.forEach(section => {
      options.push({
        id: section.id,
        label: formatVaultSectionTitle(section),
        isSubsection: false,
      });

      section.subsections.forEach(sub => {
        options.push({
          id: sub.id,
          label: formatVaultSubsectionTitle(section.id, sub),
          isSubsection: true,
        });
      });
    });

    return options;
  }, [sectionRegistry]);

  const sectionGroupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sectionListRef = useRef<HTMLDivElement | null>(null);

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

  const openAddWizard = useCallback(() => {
    if (authorizedPeople.length >= MAX_NEXTKIN_ACCOUNTS) {
      toast.error(
        `You can add at most ${MAX_NEXTKIN_ACCOUNTS} next-of-kin accounts`,
      );
      return;
    }
    setDraft(createEmptyPerson());
    setOriginalMasterPassword('');
    setWizardMode('add');
    setWizardIndex(null);
    setWizardStep(0);
    setSectionPickerOpen(false);
    setShowWizardCardPreview(!isMobile);
    setWizardOpen(true);
  }, [authorizedPeople.length, isMobile]);

  useImperativeHandle(ref, () => ({ openAddWizard }), [openAddWizard]);

  const openEditWizard = (index: number) => {
    const person = authorizedPeople[index];
    setDraft({ ...person });
    setOriginalMasterPassword(person.master_password || '');
    setWizardMode('edit');
    setWizardIndex(index);
    setWizardStep(0);
    setSectionPickerOpen(
      authorizedPeople[index].authorized_sections.length > 0,
    );
    setShowWizardCardPreview(!isMobile);
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
    if (draft.authorized_sections.includes(id)) {
      patchDraft({
        authorized_sections: draft.authorized_sections.filter(s => s !== id),
      });
      return;
    }
    if (draft.authorized_sections.length >= MAX_NOK_AUTHORIZED_SECTIONS) {
      toast.error(
        `Next-of-Kin section access allows at most ${MAX_NOK_AUTHORIZED_SECTIONS} sections`,
      );
      return;
    }
    patchDraft({
      authorized_sections: [...draft.authorized_sections, id],
    });
  };

  const toggleDraftSectionGroup = (parentId: string) => {
    if (!draft) return;

    const groupIds = expandParentSectionIds(parentId, sectionRegistry);
    const allSelected = groupIds.every(id =>
      draft.authorized_sections.includes(id),
    );

    if (allSelected) {
      patchDraft({
        authorized_sections: draft.authorized_sections.filter(
          id => !groupIds.includes(id),
        ),
      });
      return;
    }

    const merged = Array.from(
      new Set([...draft.authorized_sections, ...groupIds]),
    );
    if (merged.length > MAX_NOK_AUTHORIZED_SECTIONS) {
      toast.error(
        `Next-of-Kin section access allows at most ${MAX_NOK_AUTHORIZED_SECTIONS} sections`,
      );
      return;
    }

    patchDraft({
      authorized_sections: merged,
    });
  };

  const scrollToSectionGroup = (parentSectionId: string) => {
    setSectionPickerOpen(true);

    window.setTimeout(() => {
      const groupNode = sectionGroupRefs.current[parentSectionId];
      const listNode = sectionListRef.current;

      if (groupNode && listNode) {
        const top =
          groupNode.offsetTop - listNode.offsetTop + listNode.scrollTop;
        listNode.scrollTo({ top: Math.max(top - 8, 0), behavior: 'smooth' });
        return;
      }

      groupNode?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const togglePresetOnDraft = (preset: string) => {
    if (!draft) return;

    if (SECTION_PRESETS[preset] === 'all') {
      patchDraft({
        access_level: 'Full Kit Access',
        authorized_sections: [],
      });
      toast.success('Full kit access selected');
      return;
    }

    const presetIds = expandPresetToSectionIds(preset, sectionRegistry);
    if (presetIds.length === 0) return;

    const isActive = isPresetFullySelected(
      preset,
      draft.authorized_sections,
      sectionRegistry,
    );

    const nextSections = isActive
      ? draft.authorized_sections.filter(id => !presetIds.includes(id))
      : Array.from(new Set([...draft.authorized_sections, ...presetIds]));

    if (!isActive && nextSections.length > MAX_NOK_AUTHORIZED_SECTIONS) {
      toast.error(
        `Next-of-Kin section access allows at most ${MAX_NOK_AUTHORIZED_SECTIONS} sections`,
      );
      return;
    }

    patchDraft({
      access_level: 'Section-Specific Access',
      authorized_sections: nextSections,
    });

    if (!isActive) {
      const firstParentId = SECTION_PRESETS[preset]?.[0];
      if (typeof firstParentId === 'string') {
        scrollToSectionGroup(firstParentId);
      }
      toast.success(`Added ${preset} sections`);
    } else {
      toast.success(`Removed ${preset} sections`);
    }
  };

  const validateWizardStep = (stepId: WizardStepId | undefined): boolean => {
    const result = validateAccessWizardStep(stepId, draft);
    if (!result.ok && result.message) {
      toast.error(result.message);
    }
    return result.ok;
  };

  const goNextStep = () => {
    if (!validateWizardStep(currentWizardStepId)) return;
    setWizardStep(s => Math.min(s + 1, wizardSteps.length - 1));
  };

  const goPrevStep = () => {
    setWizardStep(s => Math.max(s - 1, 0));
  };

  const goToWizardStep = (index: number) => {
    if (index < 0 || index >= wizardSteps.length) return;
    if (index > wizardStep) return;
    setWizardStep(index);
  };

  const saveWizard = async () => {
    if (!draft) return;

    for (const step of wizardSteps) {
      if (!validateWizardStep(step.id)) return;
    }

    if (
      !draft._id &&
      isDuplicateAccessEmail(draft.email, authorizedPeople, {
        excludeIndex: wizardMode === 'edit' ? wizardIndex ?? undefined : undefined,
      })
    ) {
      toast.error(
        `A trusted person with ${draft.email} is already in your list.`,
      );
      return;
    }

    const personKey = draft._id || draft.__clientId || 'wizard-save';
    setPersonAction(personKey, 'saving');

    try {
      const passwordChanged =
        Boolean(draft.master_password?.trim()) &&
        draft.master_password !== originalMasterPassword;
      const savePayload = toNextKinApiBody(draft, {
        isCreate: !draft._id,
        passwordChanged,
      });

      if (draft._id) {
        const result = await updateNextKin({
          nextkinId: draft._id,
          body: savePayload,
        }).unwrap() as { password_email_sent?: boolean };
        if (wizardIndex !== null) {
          setAuthorizedPeople(prev => {
            const copy = [...prev];
            copy[wizardIndex] = draft;
            return copy;
          });
        }
        if (result.password_email_sent) {
          setInviteSuccessImmediate(true);
          setInviteSuccessName(draft.full_name || 'them');
        } else {
          toast.success(`Updated ${draft.full_name}`);
        }
        if (passwordChanged && draft._id && draft.master_password?.trim()) {
          const { shareVaultDekWithCollaborator } = await import(
            '@/libs/e2ee/shareVaultDek'
          );
          const share = await shareVaultDekWithCollaborator({
            collaboratorId: draft._id,
            password: draft.master_password.trim(),
            requireUnlocked: true,
          });
          if (!share.ok) {
            toast.error(
              share.reason === 'locked'
                ? 'Saved person, but unlock your vault and re-save their password so they can open encrypted sections.'
                : 'Saved person, but vault key share failed. Re-save their password while your vault is unlocked.',
            );
          }
        } else if (draft._id && draft.master_password?.trim()) {
          const { shareVaultDekWithCollaborator } = await import(
            '@/libs/e2ee/shareVaultDek'
          );
          await shareVaultDekWithCollaborator({
            collaboratorId: draft._id,
            password: draft.master_password.trim(),
          });
        }
      } else {
        const res =
          (await createNextKin(savePayload).unwrap()) as CreateNextKinResponseWithId;
        const saved: AuthorizedPerson = {
          ...draft,
          _id: res.id || res._id,
          __clientId: res.id || res._id || draft.__clientId,
          master_password:
            (res.master_password || '').trim() || draft.master_password || '',
          has_master_password: true,
        };
        setAuthorizedPeople(prev => [...prev, saved]);
        setInviteSuccessImmediate(Boolean(draft.immediate_access));
        setInviteSuccessName(draft.full_name || 'them');
        const nokId = saved._id;
        const nokPw = (saved.master_password || '').trim();
        if (nokId && nokPw) {
          const { shareVaultDekWithCollaborator } = await import(
            '@/libs/e2ee/shareVaultDek'
          );
          const share = await shareVaultDekWithCollaborator({
            collaboratorId: nokId,
            password: nokPw,
            requireUnlocked: true,
          });
          if (!share.ok) {
            toast.error(
              share.reason === 'locked'
                ? 'Invite created, but unlock your vault then edit this person to share encrypted section access.'
                : 'Person saved, but vault key share failed. Edit and re-save their password with vault unlocked.',
            );
          }
        }
      }
      refetch();
      closeWizard();
    } catch (error) {
      toast.error(getSafeErrorMessage(error, 'Save failed'));
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
      setCancelPendingInvite(false);
      return;
    }

    const personKey = getPersonKey(person, index);
    setPersonAction(personKey, 'deleting');

    try {
      await deleteNextKin(person._id).unwrap();
      setAuthorizedPeople(prev => prev.filter((_, idx) => idx !== index));
      toast.success(
        cancelPendingInvite
          ? 'Access removed and pending invitation cancelled'
          : 'Access removed',
      );
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Delete failed');
    } finally {
      setPersonAction(personKey);
      setDeleteTarget(null);
      setCancelPendingInvite(false);
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

  const wizardSteps = useMemo(() => {
    return WIZARD_STEPS.map(step =>
      step.id === 'credentials' && draft?.immediate_access
        ? { ...step, label: 'Login Password' }
        : step,
    );
  }, [draft?.immediate_access]);

  const currentWizardStepId = wizardSteps[wizardStep]?.id;

  useEffect(() => {
    if (!wizardOpen) return;
    setWizardStep(prev => Math.min(prev, Math.max(wizardSteps.length - 1, 0)));
  }, [wizardOpen, wizardSteps.length]);

  const isWizardSaving = Boolean(
    draft &&
      personActions[draft._id || draft.__clientId || 'wizard-save'] ===
        'saving',
  );

  const renderWizardShell = () => (
      <>
        {isMobile && <MobileSheetHandle />}

        <div
          className={cn(
            'shrink-0 space-y-0 border-b px-4 pb-3 sm:px-6 sm:pb-4',
            isMobile ? 'pt-1' : 'pt-5',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                id="wizard-sheet-title"
                className="text-left text-base font-semibold sm:text-xl"
              >
                {wizardMode === 'add'
                  ? 'Add Trusted Person'
                  : 'Edit Trusted Person'}
              </h2>
              {!isMobile && (
                <p className="text-left text-sm text-muted-foreground">
                  Step {wizardStep + 1} of {wizardSteps.length}
                </p>
              )}
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
          <div className="mt-3">
            <WizardStepper
              steps={wizardSteps}
              currentIndex={wizardStep}
              onStepClick={goToWizardStep}
              compact={isMobile}
            />
          </div>
        </div>

        {draft && (
          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6',
              MOBILE_SHEET_SCROLL_CLASS,
              isMobile
                ? cn('py-3', MOBILE_SHEET_SCROLL_PADDING)
                : 'py-5',
            )}
          >
            <div className={cn(isMobile ? 'space-y-4' : 'space-y-6')}>
{currentWizardStepId === 'person' && (
                    <>
                      <div>
                        <h4 className="font-semibold">Personal Information</h4>
                        <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
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
                        <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
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
                            title="Upon Death access"
                            description="No login email now. Password stays on the card until access is granted."
                            icon={Clock}
                            iconClassName="bg-blue-100 text-blue-700"
                          />
                        </div>
                        {!draft.immediate_access && (
                          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700">
                            Upon Death people are not emailed a password. Keep
                            the password card safe for when access is needed.
                          </p>
                        )}
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
                              Will Receive Next of Kin Letter
                            </span>
                          </label>
                        )}
                      </div>
                    </>
                  )}

                  {currentWizardStepId === 'access' && (
                    <>
                      <div>
                        <h4 className="font-semibold">Choose Access Level</h4>
                        <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
                          Full kit or up to {MAX_NOK_AUTHORIZED_SECTIONS}{' '}
                          specific sections. Next of kin can view only.
                        </p>
                        {draft.immediate_access && (
                          <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-5 text-emerald-900">
                            Immediate access — they will receive login details by
                            email (sections, email &amp; password). No password
                            card is required.
                          </p>
                        )}
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
                          description="They can open your complete kit (view only)."
                          icon={ShieldCheck}
                          iconClassName="bg-emerald-100 text-emerald-700"
                        />
                        <SelectableOptionCard
                          selected={
                            draft.access_level === 'Section-Specific Access'
                          }
                          onSelect={() => {
                            patchDraft({
                              access_level: 'Section-Specific Access',
                            });
                            setSectionPickerOpen(true);
                          }}
                          title="Section-Specific Access"
                          description={`Choose up to ${MAX_NOK_AUTHORIZED_SECTIONS} sections they can view.`}
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
                                {draft.authorized_sections.length} /{' '}
                                {MAX_NOK_AUTHORIZED_SECTIONS} selected
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
                            {Object.keys(SECTION_PRESETS).map(preset => {
                              const isFullAccessPreset =
                                SECTION_PRESETS[preset] === 'all';
                              const isActive = isFullAccessPreset
                                ? draft.access_level === 'Full Kit Access'
                                : isPresetFullySelected(
                                    preset,
                                    draft.authorized_sections,
                                    sectionRegistry,
                                  );

                              return (
                                <Button
                                  key={preset}
                                  type="button"
                                  size="sm"
                                  variant={isActive ? 'default' : 'outline'}
                                  className={cn(
                                    'rounded-full',
                                    isActive &&
                                      'border-primary bg-primary text-primary-foreground shadow-sm',
                                  )}
                                  onClick={() => togglePresetOnDraft(preset)}
                                >
                                  <Sparkles className="mr-1 h-3 w-3" />
                                  {preset}
                                </Button>
                              );
                            })}
                          </div>
                          <p className="mt-2 text-xs leading-5 text-blue-900/80">
                            Tap a category to select all of its subsections.
                            Tap again to remove that category. You can combine
                            multiple categories and uncheck individual items.
                          </p>
                          {sectionPickerOpen && (
                            <div
                              ref={sectionListRef}
                              className="mt-3 max-h-[min(50vh,320px)] space-y-3 overflow-y-auto rounded-xl border bg-background p-2 sm:max-h-72"
                            >
                              {sectionRegistry.map(section => {
                                const groupIds = expandParentSectionIds(
                                  section.id,
                                  sectionRegistry,
                                );
                                const selectedCount = groupIds.filter(id =>
                                  draft.authorized_sections.includes(id),
                                ).length;
                                const allSelected =
                                  selectedCount === groupIds.length &&
                                  groupIds.length > 0;
                                const someSelected =
                                  selectedCount > 0 && !allSelected;

                                return (
                                  <div
                                    key={section.id}
                                    ref={node => {
                                      sectionGroupRefs.current[section.id] =
                                        node;
                                    }}
                                    className="rounded-lg border border-border/60 bg-muted/20 p-2"
                                  >
                                    <label
                                      className={cn(
                                        'flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/80',
                                        MIN_TOUCH,
                                      )}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={input => {
                                          if (input) {
                                            input.indeterminate = someSelected;
                                          }
                                        }}
                                        onChange={() =>
                                          toggleDraftSectionGroup(section.id)
                                        }
                                        className="h-4 w-4"
                                      />
                                      <span className="min-w-0 flex-1 text-sm font-semibold">
                                        {formatVaultSectionTitle(section)}
                                      </span>
                                    </label>

                                    {section.subsections.length > 0 ? (
                                      <div className="ml-2 space-y-0.5 border-l border-border/70 pl-2">
                                        {section.subsections.map(sub => (
                                          <label
                                            key={sub.id}
                                            className={cn(
                                              'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/80',
                                              MIN_TOUCH,
                                            )}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={draft.authorized_sections.includes(
                                                sub.id,
                                              )}
                                              onChange={() =>
                                                toggleDraftSection(sub.id)
                                              }
                                              className="h-4 w-4"
                                            />
                                            <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                                              {formatVaultSubsectionTitle(
                                                section.id,
                                                sub,
                                              )}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {currentWizardStepId === 'credentials' && (
                    <>
                      <div>
                        <h4 className="font-semibold">
                          {draft.immediate_access
                            ? 'Login Password'
                            : 'Create Credentials'}
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {draft.immediate_access
                            ? 'Generate a login password. It will be emailed to this person when you save.'
                            : 'Add storage details, then generate the password card.'}
                        </p>
                      </div>

                      {draft.immediate_access ? (
                        <div className="space-y-2 rounded-2xl border bg-muted/20 p-4">
                          <Label htmlFor="wizard-password-immediate">
                            Login Password
                          </Label>
                          {wizardMode === 'edit' &&
                            !draft.master_password?.trim() && (
                              <p className="text-xs leading-5 text-amber-800">
                                No saved password on file. Click{' '}
                                <strong>Generate</strong> to create one for
                                email login.
                              </p>
                            )}
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              id="wizard-password-immediate"
                              value={draft.master_password}
                              onChange={e =>
                                patchDraft({
                                  master_password: e.target.value,
                                })
                              }
                              className={cn(
                                'rounded-2xl bg-background font-mono tracking-wider',
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
                          <p className="text-xs leading-5 text-muted-foreground">
                            {wizardMode === 'edit' &&
                            draft.master_password !== originalMasterPassword
                              ? 'Saving will email this person the new password and login link.'
                              : 'No password card is needed for immediate access.'}
                          </p>
                        </div>
                      ) : (
                        <>
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
                          <div className="space-y-4">
                            <div className="space-y-2 rounded-2xl border bg-muted/20 p-4">
                              <Label htmlFor="wizard-password">
                                Master Password
                              </Label>
                              {wizardMode === 'edit' &&
                                !draft.master_password?.trim() && (
                                  <p className="text-xs leading-5 text-amber-800">
                                    This person&apos;s password was created before
                                    passwords were saved for editing. Click{' '}
                                    <strong>Generate</strong> to create a new one
                                    for the card and login.
                                  </p>
                                )}
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                  id="wizard-password"
                                  value={draft.master_password}
                                  onChange={e =>
                                    patchDraft({
                                      master_password: e.target.value,
                                    })
                                  }
                                  className={cn(
                                    'rounded-2xl bg-background font-mono tracking-wider',
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
                              card_storage_location={
                                draft.card_storage_location
                              }
                            />
                          </div>
                        )}
                      </div>
                        </>
                      )}
                    </>
                  )}

                  {currentWizardStepId === 'review' && (
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
                              : 'Upon Death access',
                          ],
                          ['Access level', draft.access_level],
                          [
                            'Sections',
                            draft.access_level === 'Full Kit Access'
                              ? 'All sections'
                              : `${draft.authorized_sections.length} selected`,
                          ],
                          ...(draft.immediate_access
                            ? [
                                [
                                  'Login password',
                                  draft.master_password
                                    ? 'Set — emailed on save'
                                    : '—',
                                ],
                              ]
                            : [
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
                              ]),
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
                      {!draft.immediate_access && (
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
                      )}
                      {draft.immediate_access && (
                        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                          Login credentials will be emailed to{' '}
                          <strong>{draft.email}</strong> when you save. No
                          password card is required.
                        </p>
                      )}
                    </>
                  )}
            </div>
            </div>
          )}

          <div
            className={cn(
              'shrink-0 border-t px-4 py-3 sm:px-6 sm:py-4',
              isMobile
                ? cn(
                    MOBILE_SHEET_FOOTER_CLASS,
                    'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
                  )
                : 'bg-background/95 backdrop-blur',
            )}
          >
            <div
              className={cn(
                'flex w-full gap-2',
                isMobile ? 'flex-row' : 'flex-col-reverse sm:flex-row sm:justify-between',
              )}
            >
              {wizardStep === 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeWizard}
                  className={cn(
                    'rounded-2xl',
                    MIN_TOUCH,
                    isMobile ? 'flex-1' : 'w-auto',
                  )}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goPrevStep}
                  className={cn(
                    'rounded-2xl',
                    MIN_TOUCH,
                    isMobile ? 'flex-1' : 'w-auto',
                  )}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}

              {wizardStep < wizardSteps.length - 1 ? (
                <Button
                  type="button"
                  onClick={goNextStep}
                  className={cn(
                    'rounded-2xl',
                    MIN_TOUCH,
                    isMobile ? 'flex-[1.4]' : 'w-auto',
                  )}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void saveWizard()}
                  disabled={isWizardSaving}
                  className={cn(
                    'relative z-10 touch-manipulation rounded-2xl',
                    MIN_TOUCH,
                    isMobile ? 'flex-[1.4]' : 'w-auto',
                  )}
                >
                  {isWizardSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  {isWizardSaving
                    ? 'Saving...'
                    : isMobile
                      ? 'Save'
                      : 'Save Trusted Person'}
                </Button>
              )}
            </div>
          </div>
      </>
  );

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading access management">
        <div className="h-28 animate-pulse rounded-3xl bg-muted" />
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full space-y-6',
        isMobile && 'space-y-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]',
        embedded && !isMobile && 'space-y-4',
      )}
    >
      <div
        className={cn(
          'flex gap-4',
          embedded && !isMobile
            ? 'items-center justify-between border-b border-slate-100 pb-4'
            : isMobile
              ? 'flex-row items-center justify-between gap-3'
              : 'flex-col sm:flex-row sm:items-start sm:justify-between',
        )}
      >
        {embedded && !isMobile ? (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
              savedCount >= 1
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
            )}
          >
            {savedCount >= 1
              ? `${savedCount} ${savedCount === 1 ? 'person' : 'people'}`
              : 'Add at least 1 trusted person to enable emergency access'}
          </span>
        ) : (
          <div className="min-w-0">
            {!isMobile && !embedded && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                2A Kit Access Control
              </p>
            )}
            <h2
              className={cn(
                'font-semibold tracking-tight',
                isMobile ? 'text-lg' : 'mt-1 text-2xl sm:text-3xl',
              )}
            >
              {isMobile || embedded ? 'Trusted People' : 'Access Management'}
            </h2>
            {!isMobile && !embedded && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Add trusted people, choose full or section-specific access, and
                revoke access anytime.
              </p>
            )}
          </div>
        )}
        <div
          className={cn(
            'flex shrink-0 gap-2',
            isMobile ? 'flex-row' : 'flex-col sm:w-auto sm:flex-row',
          )}
        >
          {!isMobile && (
            <Button
              variant="outline"
              onClick={() => setRevokeAllOpen(true)}
              disabled={
                !authorizedPeople.length || isRevokingAll || hasPersonAction
              }
              className={cn(
                'rounded-2xl border-destructive/30 text-destructive hover:text-destructive',
                MIN_TOUCH,
                'w-auto',
              )}
            >
              {isRevokingAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Revoke All
            </Button>
          )}
          <Button
            onClick={openAddWizard}
            disabled={authorizedPeople.length >= MAX_NEXTKIN_ACCOUNTS}
            className={cn(
              'rounded-2xl',
              MIN_TOUCH,
              isMobile ? 'h-10 px-3' : 'w-auto',
            )}
          >
            <Plus className={cn('h-4 w-4', !isMobile && 'mr-2')} />
            {!isMobile &&
              (authorizedPeople.length >= MAX_NEXTKIN_ACCOUNTS
                ? `Limit ${MAX_NEXTKIN_ACCOUNTS} reached`
                : 'Add Next of Kin')}
            {isMobile && <span className="sr-only">Add Next of Kin</span>}
          </Button>
        </div>
      </div>

      {needsDesignation && !embedded && (
        <div
          className={cn(
            'flex gap-3',
            !isMobile &&
              'flex-col sm:flex-row sm:items-center sm:justify-between',
          )}
        >
          <InlineNotice
            className="min-w-0 flex-1"
            variant="warning"
            title="Add at least one person"
            description={
              isMobile
                ? undefined
                : 'Please add at least one trusted person who can access your kit.'
            }
          />
          {!isMobile && (
            <Button
              variant="secondary"
              onClick={openAddWizard}
              className={cn(
                'shrink-0 rounded-xl bg-background',
                MIN_TOUCH,
                'w-full sm:w-auto',
              )}
            >
              Add Now
            </Button>
          )}
        </div>
      )}

      <div
        className={cn(
          'grid w-full gap-6',
          !embedded && 'lg:grid-cols-[minmax(0,1fr)_280px]',
        )}
      >
        <div className="min-w-0 w-full space-y-4">
          <div
            className={cn(
              'w-full rounded-3xl border bg-card shadow-sm',
              isMobile && 'rounded-2xl border-0 bg-transparent shadow-none',
              embedded && !isMobile && 'rounded-2xl border-0 bg-transparent shadow-none',
            )}
          >
            <div
              className={cn(
                'border-b',
                isMobile || embedded ? 'hidden' : 'p-4 sm:p-5',
              )}
            >
              <h3 className="text-lg font-semibold">Trusted People</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                People who can access your kit
              </p>
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
                            onViewCard={() => requestCardPreview(index)}
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
        {!embedded && (
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-2xl border bg-card p-4 shadow-sm">
            <h4 className="text-sm font-semibold">Setup Progress</h4>
            <p className="mt-2 text-2xl font-semibold">
              {savedCount}{' '}
              <span className="text-base font-normal text-muted-foreground">
                / 1 people added
              </span>
            </p>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={setupProgress * 100}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: setupProgress * 100 + '%' }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Add at least 1 trusted person to enable emergency access. Use
              Revoke All if you need to immediately lock everyone out.
            </p>
          </div>
        </aside>
        )}
      </div>

      {/* Add / Edit wizard */}
      {isMobile ? (
        <MobileBottomSheet
          open={wizardOpen}
          onClose={closeWizard}
          className="h-[min(96dvh,100svh)]"
          labelledBy="wizard-sheet-title"
        >
          <div className="flex h-full min-h-0 flex-col">
            {renderWizardShell()}
          </div>
        </MobileBottomSheet>
      ) : (
        <Sheet open={wizardOpen} onOpenChange={open => !open && closeWizard()}>
          <SheetContent
            side="right"
            className="flex h-full max-w-lg flex-col gap-0 p-0 sm:max-w-xl"
          >
            <div className="flex h-full min-h-0 flex-col">
              {renderWizardShell()}
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
            <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 pb-3 pt-1">
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
            {detailViewIndex !== null &&
              (() => {
                const person = authorizedPeople[detailViewIndex];
                const key = getPersonKey(person, detailViewIndex);
                const action = personActions[key];
                const isBusy = !!action || isRevokingAll;
                const isDeleting = action === 'deleting';
                const isApproving = action === 'approving';
                const isRevoking = action === 'revoking';
                const hasNokLetter =
                  !person.immediate_access && person.nok_letter_received;

                const actionHandlers = {
                  onEdit: () => {
                    setDetailViewIndex(null);
                    openEditWizard(detailViewIndex);
                  },
                  onViewCard: () => {
                    setDetailViewIndex(null);
                    requestCardPreview(detailViewIndex);
                  },
                  onApprove: () => approveOne(detailViewIndex),
                  onRevoke: () => revokeOne(detailViewIndex),
                  onDelete: () => {
                    setDetailViewIndex(null);
                    setDeleteTarget(detailViewIndex);
                  },
                };

                return (
                  <>
                    <div
                      className={cn(
                        'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3',
                        MOBILE_SHEET_SCROLL_CLASS,
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
                        hideActions
                        revokeDisabled={isRevokingOne}
                        {...actionHandlers}
                      />
                    </div>
                    <div
                      className={cn(
                        MOBILE_SHEET_FOOTER_CLASS,
                        'shrink-0 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
                      )}
                    >
                      <TrustedPersonMobileActionBar
                        person={person}
                        isBusy={isBusy}
                        isDeleting={isDeleting}
                        isApproving={isApproving}
                        isRevoking={isRevoking}
                        revokeDisabled={isRevokingOne}
                        {...actionHandlers}
                      />
                    </div>
                  </>
                );
              })()}
          </div>
        </MobileBottomSheet>
      )}

      {/* Unlock login before opening password card */}
      <Dialog
        open={cardStepUpIndex !== null}
        onOpenChange={open => {
          if (!open) closeCardStepUp();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm to view password card</DialogTitle>
            <DialogDescription>
              Enter your Orderly Affairs sign-in password (the one you use to
              log in to this vault) — not{' '}
              {cardStepUpIndex !== null
                ? authorizedPeople[cardStepUpIndex]?.full_name ||
                  'this person’s'
                : 'this person’s'}{' '}
              login password. The card opens only after verification succeeds.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-2 py-1"
            onSubmit={e => {
              e.preventDefault();
              void submitCardStepUp();
            }}
          >
            <Label htmlFor="card-step-up-password">Your sign-in password</Label>
            <Input
              id="card-step-up-password"
              ref={cardStepUpInputRef}
              type="password"
              name="orderly-card-step-up-password"
              autoComplete="current-password"
              autoFocus
              value={cardStepUpPassword}
              onChange={e => {
                setCardStepUpPassword(e.target.value);
                if (cardStepUpError) setCardStepUpError('');
              }}
              onInput={e =>
                setCardStepUpPassword((e.target as HTMLInputElement).value)
              }
              placeholder="Your Orderly Affairs password"
              className="h-10"
            />
            {cardStepUpError ? (
              <p className="text-sm text-rose-700">{cardStepUpError}</p>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={cardStepUpBusy}
                onClick={closeCardStepUp}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={cardStepUpBusy}>
                {cardStepUpBusy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                View card
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
      <BrandDangerConfirm
        open={deleteTarget !== null}
        title={
          deleteTarget !== null
            ? (() => {
                const raw =
                  authorizedPeople[deleteTarget]?.full_name?.trim() ||
                  'this person';
                const first =
                  raw.split(/\s+/).filter(Boolean)[0] || 'this person';
                return `Remove ${first}'s access?`;
              })()
            : 'Remove access?'
        }
        description={
          deleteTarget !== null
            ? (() => {
                const raw =
                  authorizedPeople[deleteTarget]?.full_name?.trim() || '';
                const first = raw.split(/\s+/).filter(Boolean)[0];
                const who = first || 'This person';
                return `${who} will no longer be able to open any part of your vault, and their invitation link will stop working. You can add them again later.`;
              })()
            : 'They will no longer be able to open any part of your vault.'
        }
        cancelLabel="Keep access"
        confirmLabel="Remove"
        checkboxLabel="Also cancel their pending invitation email"
        checkboxChecked={cancelPendingInvite}
        onCheckboxChange={setCancelPendingInvite}
        onCancel={() => {
          setDeleteTarget(null);
          setCancelPendingInvite(false);
        }}
        onConfirm={() => void confirmDelete()}
        busy={
          deleteTarget !== null &&
          personActions[
            getPersonKey(authorizedPeople[deleteTarget], deleteTarget)
          ] === 'deleting'
        }
      />

      {/* Revoke all confirmation */}
      <BrandDangerConfirm
        open={revokeAllOpen}
        title="Revoke all access?"
        description="This will immediately revoke access for every trusted person on your account. They won’t be able to open your vault until you restore them."
        cancelLabel="Keep access"
        confirmLabel="Revoke all"
        onCancel={() => setRevokeAllOpen(false)}
        onConfirm={() => void confirmRevokeAll()}
        busy={isRevokingAll}
      />

      {isMobile && !wizardOpen && detailViewIndex === null && (
        <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 md:hidden">
          <Button
            onClick={openAddWizard}
            className={cn(
              'h-12 w-full rounded-2xl shadow-lg shadow-primary/20',
              MIN_TOUCH,
            )}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Trusted Person
          </Button>
        </div>
      )}

      <BrandSuccessScreen
        open={Boolean(inviteSuccessName)}
        variant="confirm"
        title={
          inviteSuccessImmediate
            ? `Invitation sent to ${inviteSuccessName}`
            : `${inviteSuccessName} saved`
        }
        description={
          inviteSuccessImmediate
            ? "They'll get a temporary password by email so they can sign in."
            : 'Upon Death notice sent — no password in the email. They will use the master password on the Password Card when access opens.'
        }
        secondaryAction={{
          label: 'Back to People & roles',
          onClick: () => {
            setInviteSuccessName(null);
            setInviteSuccessImmediate(false);
          },
          variant: 'outline',
        }}
        onClose={() => {
          setInviteSuccessName(null);
          setInviteSuccessImmediate(false);
        }}
      />
    </div>
  );
}
