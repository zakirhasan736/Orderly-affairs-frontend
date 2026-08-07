'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@common/ui/badge';
import { Button } from '@common/ui/button';
import { cn } from '@common/ui/utils';
import { EnhancedCalendar } from '@/components/EnhancedCalendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@common/ui/dialog';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Textarea } from '@common/ui/textarea';
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  Download,
  Eye,
  FileText,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Printer,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { DatePicker } from '@/components/DatePicker';
import { toast } from 'sonner';
import {
  applyNokLetterTemplateDefaults,
  buildNokLetterPreviewText,
  mergeNokLetterAutofill,
  NOK_LETTER_DEFAULTS,
} from '@/utils/nokLetterPreview';

import {
  MOBILE_SHEET_SCROLL_CLASS,
  MOBILE_SHEET_SCROLL_PADDING,
  MOBILE_SHEET_FOOTER_CLASS,
  MobileBottomSheet,
  MobileSheetHandle,
  useIsMobile,
} from '@/components/MobileBottomSheet';

import {
  type NOKLetter,
  type NOKLetterIn,
  useGetNokLetterQuery,
  useSaveNokLetterMutation,
  useSendNokLetterNowMutation,
} from '@/services/nokLetterApi';
import {
  type NextKinAccessResponse,
  useGetMyNextKinQuery,
} from '@/services/authApi';
import { useFamilyAcl } from '@/contexts/FamilyAclContext';

type LetterData = Partial<NOKLetter & NOKLetterIn>;

interface NextOfKinLetterFieldProps {
  data?: LetterData;
  onChange: (data: LetterData) => void;
  formData?: Record<string, unknown>;
  selectedNokId?: string;
  /** When true, optimizes layout for a sheet / bottom-sheet container */
  embeddedInSheet?: boolean;
  onClose?: () => void;
  recipientName?: string;
  /** Kit owner's name — used to autofill the printed signature. */
  ownerName?: string | null;
}

const MIN_TOUCH = 'min-h-11';

const LETTER_SHEET_SPRING = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 340,
};

function LetterPreviewBody({
  letterPreview,
  nokEmail,
}: {
  letterPreview: string;
  nokEmail?: string;
}) {
  return (
    <div className="mx-auto max-w-[57.6rem] rounded-2xl border bg-white px-5 py-7 shadow-xl sm:px-12 sm:py-12">
      <div className="mb-8 border-b pb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Orderly Affairs
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-gray-950">
          Letter to Next of Kin
        </h3>
        {nokEmail && (
          <p className="mt-2 break-all text-sm text-gray-500">
            Prepared for {nokEmail}
          </p>
        )}
      </div>
      <div className="whitespace-pre-line font-serif text-[14px] leading-7 text-gray-800 sm:text-[15px] sm:leading-8">
        {letterPreview}
      </div>
    </div>
  );
}

const DEFAULTS = NOK_LETTER_DEFAULTS;

const EDITOR_STEPS = [
  {
    id: 'recipient',
    label: 'Recipient',
    icon: UserRound,
    helper: 'Delivery timing and recipient details',
  },
  {
    id: 'message',
    label: 'Message',
    icon: Mail,
    helper: 'Opening message and kit description',
  },
  {
    id: 'access',
    label: 'Access',
    icon: ShieldCheck,
    helper: 'Login, URL, and allowed access',
  },
  {
    id: 'items',
    label: 'Items',
    icon: KeyRound,
    helper: 'Key bag and documents bag',
  },
  {
    id: 'closing',
    label: 'Closing',
    icon: Sparkles,
    helper: 'Final words, then export, send, or schedule',
  },
] as const;

function LetterSelectableCard({
  selected,
  onSelect,
  title,
  description,
  icon: Icon,
  iconClassName,
  disabled = false,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  icon: React.ElementType;
  iconClassName?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      data-oa-mutate={disabled ? undefined : true}
      onClick={() => {
        if (disabled) return;
        onSelect();
      }}
      className={cn(
        'flex w-full min-h-[88px] flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-background hover:border-primary/40',
        disabled && 'cursor-default opacity-90 hover:border-border',
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

function LetterWizardStepper({
  currentIndex,
  onStepClick,
  compact = false,
  dotsOnly = false,
}: {
  currentIndex: number;
  onStepClick?: (index: number) => void;
  compact?: boolean;
  dotsOnly?: boolean;
}) {
  if (dotsOnly) {
    const step = EDITOR_STEPS[currentIndex];
    return (
      <nav
        aria-label="Letter editor progress"
        className="flex items-center gap-3"
      >
        <div className="flex gap-1">
          {EDITOR_STEPS.map((_, index) => (
            <div
              key={EDITOR_STEPS[index].id}
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
          Step {currentIndex + 1} of {EDITOR_STEPS.length}
        </p>
      </nav>
    );
  }

  return (
    <div
      className={cn(
        compact && 'overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      )}
    >
      <nav
        aria-label="Letter editor progress"
        className={cn(
          'flex items-center gap-0',
          compact && 'min-w-[min(100%,22rem)]',
        )}
      >
        {EDITOR_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;
          const canNavigate = isComplete && !!onStepClick;

          return (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <div
                  className={cn(
                    'h-0.5 min-w-2 flex-1 rounded-full transition-colors sm:min-w-3',
                    index <= currentIndex ? 'bg-primary/40' : 'bg-muted',
                  )}
                  aria-hidden
                />
              )}
              <button
                type="button"
                disabled={!canNavigate}
                onClick={() => canNavigate && onStepClick?.(index)}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`${step.label}${isComplete ? ', completed' : isActive ? ', current' : ''}`}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-0.5 py-1 transition sm:gap-1.5 sm:px-1',
                  canNavigate &&
                    'cursor-pointer hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  !canNavigate && !isActive && 'cursor-default',
                )}
              >
                <div
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-full text-xs font-semibold transition',
                    compact ? 'h-8 w-8' : 'h-9 w-9',
                    isActive && 'bg-primary text-primary-foreground shadow-sm',
                    isComplete && 'bg-primary/15 text-primary',
                    !isActive && !isComplete && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isComplete ? (
                    <Check className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'w-full truncate text-center font-medium leading-tight',
                    compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs',
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
    </div>
  );
}

function DeliveryTimingSelector({
  letterDate,
  onSetUponDeath,
  onSetSpecificDate,
  onDateChange,
  isMobile,
  disabled = false,
}: {
  letterDate?: string | null;
  onSetUponDeath: () => void;
  onSetSpecificDate: () => void;
  onDateChange: (value: string | undefined) => void;
  isMobile: boolean;
  disabled?: boolean;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isUponDeath = !letterDate;

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Delivery Timing</Label>
      <div className="grid gap-3 sm:grid-cols-2">
        <LetterSelectableCard
          selected={isUponDeath}
          disabled={disabled}
          onSelect={onSetUponDeath}
          title="Hold for passing"
          description="Keep the letter on file — portal access still waits until after you've passed."
          icon={Zap}
          iconClassName="bg-emerald-100 text-emerald-700"
        />
        <LetterSelectableCard
          selected={!isUponDeath}
          disabled={disabled}
          onSelect={onSetSpecificDate}
          title="Schedule email"
          description="Pick a future date — Orderly Affairs emails it automatically then."
          icon={CalendarIcon}
          iconClassName="bg-amber-100 text-amber-700"
        />
      </div>

      {!isUponDeath &&
        (isMobile ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn('h-auto w-full justify-start rounded-2xl px-4 py-3', MIN_TOUCH)}
              onClick={() => !disabled && setCalendarOpen(true)}
            >
              <span className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarIcon className="h-5 w-5" />
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Selected date
                </span>
                <span className="truncate text-sm font-semibold">
                  {formatLetterDate(letterDate) || 'Tap to choose date'}
                </span>
              </span>
            </Button>

            <MobileBottomSheet
              open={calendarOpen}
              onClose={() => setCalendarOpen(false)}
              className="max-h-[85dvh]"
              labelledBy="letter-date-picker-title"
              zClassName="z-[85]"
            >
              <div className="flex h-full min-h-0 flex-col">
                <MobileSheetHandle />
                <div className="flex shrink-0 items-center justify-between border-b px-4 pb-3 pt-1">
                  <h3 id="letter-date-picker-title" className="text-lg font-semibold">
                    Choose delivery date
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setCalendarOpen(false)}
                    className="h-10 w-10 rounded-full"
                    aria-label="Close calendar"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex flex-1 flex-col items-center overflow-y-auto px-3 py-4">
                  <EnhancedCalendar
                    mode="single"
                    selected={
                      letterDate ? new Date(letterDate) : undefined
                    }
                    onSelect={date => {
                      if (date) {
                        onDateChange(date.toISOString());
                        setCalendarOpen(false);
                      }
                    }}
                  />
                  <div className="mt-4 flex w-full gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={() => {
                        onDateChange(new Date().toISOString());
                        setCalendarOpen(false);
                      }}
                    >
                      Today
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 rounded-xl"
                      onClick={() => {
                        onSetUponDeath();
                        setCalendarOpen(false);
                      }}
                    >
                      Upon Death
                    </Button>
                  </div>
                </div>
              </div>
            </MobileBottomSheet>
          </>
        ) : (
          <DatePicker
            value={letterDate || undefined}
            onChange={onDateChange}
            placeholder="Select delivery date"
            className="rounded-2xl"
            sheetTitle="Choose delivery date"
          />
        ))}
    </div>
  );
}

function mergeAccessManagementAutofill(
  letter: LetterData,
  person?: NextKinAccessResponse | null,
  ownerName?: string | null,
): LetterData {
  const next: LetterData = {
    ...mergeNokLetterAutofill(letter as any, person),
  };

  if (!String(next.signer_name || '').trim()) {
    const resolved = String(ownerName || '').trim();
    if (resolved) next.signer_name = resolved;
  }

  return next;
}

function isValidEmail(value?: string) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatLetterDate(value?: string | null) {
  if (!value) return '';

  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function FieldBlock({
  label,
  description,
  icon,
  children,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] border border-border/60 bg-background p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}

        <div className="min-w-0">
          <Label className="text-sm font-black text-foreground">{label}</Label>
          {description && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

export function NextOfKinLetterField({
  data,
  onChange,
  selectedNokId,
  embeddedInSheet = false,
  onClose,
  recipientName,
  ownerName = null,
}: NextOfKinLetterFieldProps) {
  const { isReadOnly } = useFamilyAcl();
  const isMobile = useIsMobile();
  const [wizardStep, setWizardStep] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    data: serverData,
    isFetching,
    isError,
    refetch,
  } = useGetNokLetterQuery(
    selectedNokId ? { nokId: selectedNokId } : undefined,
    { refetchOnMountOrArgChange: true },
  );

  const { data: nextKinPeople = [] } = useGetMyNextKinQuery(undefined);

  const selectedPerson = useMemo(
    () => nextKinPeople.find(person => person.id === selectedNokId),
    [nextKinPeople, selectedNokId],
  );

  const [saveLetter, { isLoading: isSaving }] = useSaveNokLetterMutation();
  const [sendLetterNow, { isLoading: isSendingNow }] =
    useSendNokLetterNowMutation();

  const [localData, setLocalData] = useState<LetterData>(data || {});
  const [deliveryAction, setDeliveryAction] = useState<
    'export' | 'send_now' | 'schedule'
  >('send_now');
  const [deliveryBusy, setDeliveryBusy] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
    setWizardStep(0);
  }, [selectedNokId]);

  useEffect(() => {
    // 404 / no saved letter yet → start from template + Access Management autofill.
    // Do not treat empty GET as a completed letter (sidebar uses customized content).
    if (!serverData && !isError) return;

    const base = serverData || data || {};
    const merged = applyNokLetterTemplateDefaults(
      mergeAccessManagementAutofill(base, selectedPerson, ownerName),
    );
    setLocalData(merged);
    if (!isReadOnly) {
      onChange(merged);
    }
    hydratedRef.current = true;
  }, [serverData, isError, selectedPerson, ownerName, isReadOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (isReadOnly) return;

    setLocalData(prev => {
      const merged = applyNokLetterTemplateDefaults(
        mergeAccessManagementAutofill(prev, selectedPerson, ownerName),
      );

      if (JSON.stringify(prev) === JSON.stringify(merged)) {
        return prev;
      }

      onChange(merged);
      return merged;
    });
  }, [selectedPerson, ownerName, isReadOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data || hydratedRef.current) return;

    setLocalData(
      applyNokLetterTemplateDefaults(
        mergeAccessManagementAutofill(data, selectedPerson, ownerName),
      ),
    );
  }, [data, selectedPerson]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    if (isReadOnly) return;
    if (!selectedNokId) return;
    if (!hydratedRef.current) return;
    if (isFetching) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        await saveLetter({
          nokId: selectedNokId,
          body: {
            letter_date: localData.letter_date || null,
            letter_to: localData.letter_to || undefined,
            letter_greeting: localData.letter_greeting || undefined,
            letter_opening: localData.letter_opening || undefined,
            kit_description: localData.kit_description || undefined,
            access_url: localData.access_url || undefined,
            login_credentials_text:
              localData.login_credentials_text || undefined,

            nok_email: localData.nok_email || undefined,
            nok_phone: localData.nok_phone || undefined,
            password_card_location:
              localData.password_card_location || undefined,

            accessible_sections: localData.accessible_sections || undefined,
            key_bag_info: localData.key_bag_info || undefined,
            key_bag_location: localData.key_bag_location || undefined,
            documents_bag_info: localData.documents_bag_info || undefined,
            documents_bag_location:
              localData.documents_bag_location || undefined,
            incomplete_kit_message:
              localData.incomplete_kit_message || undefined,
            closing_message: localData.closing_message || undefined,
            letter_signature: localData.letter_signature || undefined,
            signer_name: localData.signer_name || undefined,
          },
        }).unwrap();
      } catch {
        toast.error('Could not save NOK letter');
      }
    }, 550);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [JSON.stringify(localData), isFetching, selectedNokId, saveLetter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldChange = <K extends keyof LetterData>(
    field: K,
    value: LetterData[K],
  ) => {
    if (isReadOnly) return;
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    onChange(updated);
  };

  const loginCredentialsText =
    localData.login_credentials_text ||
    `I have registered your email address (${
      localData.nok_email || 'will auto-populate from Access Management'
    }) and your phone number (${
      localData.nok_phone || 'will auto-populate from Access Management'
    }), which you can use as your login credentials. The password to gain access to the kit is printed on a password card located ${
      localData.password_card_location ||
      'will auto-populate from Access Management'
    }.`;

  const generateLetterContent = () =>
    buildNokLetterPreviewText(localData, selectedPerson, ownerName);

  const letterPreview = useMemo(
    () => generateLetterContent(),
    [JSON.stringify(localData), selectedPerson, ownerName],
  );

  const handlePrint = () => {
    const content = escapeHtml(generateLetterContent());

    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups for printing.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Letter to Next of Kin</title>
          <style>
            body {
              font-family: Georgia, 'Times New Roman', serif;
              line-height: 1.75;
              max-width: 820px;
              margin: 0 auto;
              padding: 48px 24px;
              color: #1f2937;
              background: #ffffff;
            }

            .eyebrow {
              font-family: Arial, sans-serif;
              font-size: 11px;
              letter-spacing: 0.18em;
              text-transform: uppercase;
              color: #6b7280;
              margin-bottom: 10px;
            }

            h1 {
              font-family: Arial, sans-serif;
              font-size: 28px;
              margin: 0 0 28px;
              color: #111827;
            }

            .letter-content {
              white-space: pre-line;
              font-size: 15px;
            }

            @media print {
              body {
                margin: 0;
                padding: 28px;
              }
            }
          </style>
        </head>
        <body>
          <div class="eyebrow">Orderly Affairs</div>
          <h1>Letter to Next of Kin</h1>
          <div class="letter-content">${content}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExport = () => {
    const content = generateLetterContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `letter-to-next-of-kin-${
      new Date().toISOString().split('T')[0]
    }.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    toast.success('Letter exported — print & mail it yourself if you prefer.');
  };

  const persistLetterNow = async () => {
    if (!selectedNokId) {
      toast.error('Select a next of kin recipient first.');
      return null;
    }
    return saveLetter({
      nokId: selectedNokId,
      body: {
        letter_date: localData.letter_date || null,
        letter_to: localData.letter_to || undefined,
        letter_greeting: localData.letter_greeting || undefined,
        letter_opening: localData.letter_opening || undefined,
        kit_description: localData.kit_description || undefined,
        access_url: localData.access_url || undefined,
        login_credentials_text: localData.login_credentials_text || undefined,
        nok_email: localData.nok_email || undefined,
        nok_phone: localData.nok_phone || undefined,
        password_card_location: localData.password_card_location || undefined,
        accessible_sections: localData.accessible_sections || undefined,
        key_bag_info: localData.key_bag_info || undefined,
        key_bag_location: localData.key_bag_location || undefined,
        documents_bag_info: localData.documents_bag_info || undefined,
        documents_bag_location: localData.documents_bag_location || undefined,
        incomplete_kit_message: localData.incomplete_kit_message || undefined,
        closing_message: localData.closing_message || undefined,
        letter_signature: localData.letter_signature || undefined,
        signer_name: localData.signer_name || undefined,
      },
    }).unwrap();
  };

  const handleSendNow = async () => {
    if (isReadOnly) {
      toast.error('Your family role is view-only.');
      return;
    }
    if (!isValidEmail(localData.nok_email)) {
      toast.error(
        'Add a valid Next of Kin email in Access Management before sending.',
      );
      return;
    }
    setDeliveryBusy(true);
    try {
      await persistLetterNow();
      const sent = await sendLetterNow({
        nokId: selectedNokId,
      }).unwrap();
      setLocalData(prev => ({ ...prev, ...sent }));
      onChange({ ...localData, ...sent });
      toast.success(
        'Letter emailed. They still cannot log in until the portal unlocks after your passing.',
      );
      onClose?.();
    } catch (error: any) {
      toast.error(
        error?.data?.detail ||
          error?.message ||
          'Could not send the letter. Please try again.',
      );
    } finally {
      setDeliveryBusy(false);
    }
  };

  const handleSchedule = async () => {
    if (isReadOnly) {
      toast.error('Your family role is view-only.');
      return;
    }
    if (!localData.letter_date) {
      toast.error('Pick a future delivery date first.');
      setDeliveryAction('schedule');
      setWizardStep(0);
      return;
    }
    const sendAt = Date.parse(localData.letter_date);
    if (!Number.isFinite(sendAt) || sendAt <= Date.now()) {
      toast.error('Choose a future date to schedule the email.');
      setWizardStep(0);
      return;
    }
    setDeliveryBusy(true);
    try {
      const saved = await persistLetterNow();
      if (saved) {
        setLocalData(prev => ({ ...prev, ...saved }));
        onChange({ ...localData, ...saved });
      }
      toast.success(
        `Letter scheduled for ${formatLetterDate(localData.letter_date)}.`,
      );
      onClose?.();
    } catch (error: any) {
      toast.error(
        error?.data?.detail ||
          error?.message ||
          'Could not schedule the letter. Please try again.',
      );
    } finally {
      setDeliveryBusy(false);
    }
  };

  const handleDeliveryAction = async () => {
    if (deliveryAction === 'export') {
      handleExport();
      return;
    }
    if (deliveryAction === 'send_now') {
      await handleSendNow();
      return;
    }
    await handleSchedule();
  };

  const handleEmail = () => {
    if (!isValidEmail(localData.nok_email)) {
      toast.error(
        'Please provide a valid Next of Kin email in Access Management first.',
      );
      return;
    }

    const subject = 'Letter to Next of Kin - Orderly Affairs Kit';
    const body = `Please find below your Letter to Next of Kin from your Orderly Affairs Kit:\n\n${generateLetterContent()}`;

    window.location.href = `mailto:${localData.nok_email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  const isLastStep = wizardStep === EDITOR_STEPS.length - 1;
  const compactSheet = embeddedInSheet && isMobile;

  const stepIntro = (title: string, description: string) =>
    compactSheet ? null : (
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    );

  const goToWizardStep = (index: number) => {
    if (index < wizardStep) setWizardStep(index);
  };

  const goToPreviousStep = () => {
    if (wizardStep > 0) setWizardStep(wizardStep - 1);
  };

  const goToNextStep = () => {
    if (wizardStep < EDITOR_STEPS.length - 1) setWizardStep(wizardStep + 1);
  };

  const renderWizardStepContent = () => {
    switch (wizardStep) {
      case 0:
        return (
          <>
            {stepIntro(
              'Recipient & delivery timing',
              'Confirm who receives this letter. You can still email it now — portal login waits until after your passing.',
            )}

            <DeliveryTimingSelector
              letterDate={localData.letter_date}
              isMobile={isMobile}
              disabled={isReadOnly}
              onSetUponDeath={() =>
                handleFieldChange('letter_date', null as any)
              }
              onSetSpecificDate={() => {
                if (!localData.letter_date) {
                  handleFieldChange(
                    'letter_date',
                    new Date().toISOString() as any,
                  );
                }
              }}
              onDateChange={value =>
                handleFieldChange(
                  'letter_date',
                  (value || null) as any,
                )
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldBlock
                label="To"
                description="Recipient name."
                icon={<UserRound className="h-4 w-4" />}
              >
                <Input readOnly={isReadOnly}
                  value={localData.letter_to || ''}
                  onChange={e =>
                    handleFieldChange('letter_to', e.target.value as any)
                  }
                  placeholder="Will auto-populate from Access Management"
                  className="h-12 rounded-2xl"
                />
              </FieldBlock>

              <FieldBlock
                label="Greeting"
                description="Word only (e.g. Dear) — the recipient name is added automatically."
                icon={<Mail className="h-4 w-4" />}
              >
                <Input readOnly={isReadOnly}
                  value={
                    localData.letter_greeting || DEFAULTS.letter_greeting
                  }
                  onChange={e =>
                    handleFieldChange(
                      'letter_greeting',
                      e.target.value as any,
                    )
                  }
                  placeholder="Dear"
                  className="h-12 rounded-2xl"
                />
              </FieldBlock>
            </div>
          </>
        );
      case 1:
        return (
          <>
            {stepIntro(
              'Opening Message',
              'Write the heartfelt opening and kit description.',
            )}
            <FieldBlock label="Opening Message">
              <Textarea readOnly={isReadOnly}
                value={localData.letter_opening || DEFAULTS.letter_opening}
                onChange={e =>
                  handleFieldChange('letter_opening', e.target.value as any)
                }
                rows={7}
                className="min-h-[180px] rounded-2xl"
              />
            </FieldBlock>
            <FieldBlock label="Kit Description">
              <Textarea readOnly={isReadOnly}
                value={localData.kit_description || DEFAULTS.kit_description}
                onChange={e =>
                  handleFieldChange('kit_description', e.target.value as any)
                }
                rows={6}
                className="min-h-[160px] rounded-2xl"
              />
            </FieldBlock>
          </>
        );
      case 2:
        return (
          <>
            {stepIntro(
              'Access Details',
              'Login info and sections your next of kin can access.',
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <FieldBlock
                label="Access URL"
                icon={<ShieldCheck className="h-4 w-4" />}
              >
                <Input readOnly={isReadOnly}
                  value={localData.access_url || DEFAULTS.access_url}
                  onChange={e =>
                    handleFieldChange('access_url', e.target.value as any)
                  }
                  className="h-12 rounded-2xl"
                />
              </FieldBlock>
              <FieldBlock
                label="Password Card Location"
                description="Auto-filled from Access Management."
                icon={<KeyRound className="h-4 w-4" />}
              >
                <Input
                  value={localData.password_card_location || ''}
                  readOnly
                  placeholder="Will auto-populate"
                  className="h-12 rounded-2xl bg-muted/60"
                />
              </FieldBlock>
            </div>
            <FieldBlock label="Login Credentials Information">
              <Textarea readOnly={isReadOnly}
                value={loginCredentialsText}
                onChange={e =>
                  handleFieldChange(
                    'login_credentials_text',
                    e.target.value as any,
                  )
                }
                rows={5}
                className="min-h-[150px] rounded-2xl"
              />
            </FieldBlock>
            <div className="grid gap-4 md:grid-cols-2">
              <FieldBlock
                label="Next of Kin Email"
                icon={<Mail className="h-4 w-4" />}
              >
                <Input
                  value={localData.nok_email || ''}
                  readOnly
                  placeholder="Will auto-populate"
                  className="h-12 rounded-2xl bg-muted/60"
                />
              </FieldBlock>
              <FieldBlock
                label="Next of Kin Phone"
                icon={<Users className="h-4 w-4" />}
              >
                <Input
                  value={localData.nok_phone || ''}
                  readOnly
                  placeholder="Will auto-populate"
                  className="h-12 rounded-2xl bg-muted/60"
                />
              </FieldBlock>
            </div>
            <FieldBlock label="Accessible Sections">
              <Textarea readOnly={isReadOnly}
                value={
                  localData.accessible_sections ||
                  DEFAULTS.accessible_sections
                }
                onChange={e =>
                  handleFieldChange(
                    'accessible_sections',
                    e.target.value as any,
                  )
                }
                rows={7}
                className="min-h-[180px] rounded-2xl"
              />
            </FieldBlock>
          </>
        );
      case 3:
        return (
          <>
            {stepIntro(
              'Physical Items',
              'Key bag and documents bag details.',
            )}
            <FieldBlock
              label="Key Bag Information"
              icon={<KeyRound className="h-4 w-4" />}
            >
              <Textarea readOnly={isReadOnly}
                value={localData.key_bag_info || DEFAULTS.key_bag_info}
                onChange={e =>
                  handleFieldChange('key_bag_info', e.target.value as any)
                }
                rows={5}
                className="min-h-[150px] rounded-2xl"
              />
            </FieldBlock>
            <FieldBlock
              label="Key Bag Location"
              description="Auto-filled from Access Management."
              icon={<MapPin className="h-4 w-4" />}
            >
              <Input
                value={localData.key_bag_location || ''}
                readOnly
                placeholder="Will auto-populate"
                className="h-12 rounded-2xl bg-muted/60"
              />
            </FieldBlock>
            <FieldBlock
              label="Documents Bag Information"
              icon={<FileText className="h-4 w-4" />}
            >
              <Textarea readOnly={isReadOnly}
                value={
                  localData.documents_bag_info || DEFAULTS.documents_bag_info
                }
                onChange={e =>
                  handleFieldChange(
                    'documents_bag_info',
                    e.target.value as any,
                  )
                }
                rows={5}
                className="min-h-[150px] rounded-2xl"
              />
            </FieldBlock>
            <FieldBlock
              label="Documents Bag Location"
              description="Auto-filled from Access Management."
              icon={<MapPin className="h-4 w-4" />}
            >
              <Input
                value={localData.documents_bag_location || ''}
                readOnly
                placeholder="Will auto-populate"
                className="h-12 rounded-2xl bg-muted/60"
              />
            </FieldBlock>
          </>
        );
      case 4:
        return (
          <>
            {stepIntro(
              'Closing & delivery',
              'Finish your note, then choose how to share the letter.',
            )}
            <FieldBlock label="Incomplete Kit Message">
              <Textarea readOnly={isReadOnly}
                value={
                  localData.incomplete_kit_message ||
                  DEFAULTS.incomplete_kit_message
                }
                onChange={e =>
                  handleFieldChange(
                    'incomplete_kit_message',
                    e.target.value as any,
                  )
                }
                rows={5}
                className="min-h-[150px] rounded-2xl"
              />
            </FieldBlock>
            <FieldBlock label="Closing Message">
              <Textarea readOnly={isReadOnly}
                value={localData.closing_message || DEFAULTS.closing_message}
                onChange={e =>
                  handleFieldChange('closing_message', e.target.value as any)
                }
                rows={5}
                className="min-h-[150px] rounded-2xl"
              />
            </FieldBlock>
            <FieldBlock label="Closing line">
              <Input readOnly={isReadOnly}
                value={
                  localData.letter_signature || DEFAULTS.letter_signature
                }
                onChange={e =>
                  handleFieldChange('letter_signature', e.target.value as any)
                }
                placeholder="With love,"
                className="h-12 rounded-2xl"
              />
            </FieldBlock>
            <FieldBlock label="Your name (signature)">
              <Input readOnly={isReadOnly}
                value={String(localData.signer_name || ownerName || '').trim()}
                onChange={e =>
                  handleFieldChange('signer_name', e.target.value as any)
                }
                placeholder="Your full name as it should appear"
                className="h-12 rounded-2xl"
              />
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                Auto-filled from your Vital Information name when available.
                Edit if you want a different printed name under the closing.
              </p>
            </FieldBlock>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">How should it be delivered?</Label>
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                They still cannot log in until the portal unlocks after your
                passing — the password card is what opens it.
              </p>
              <div className="grid gap-2.5">
                <LetterSelectableCard
                  selected={deliveryAction === 'export'}
                  disabled={isReadOnly}
                  onSelect={() => setDeliveryAction('export')}
                  title="Print & mail it yourself"
                  description="Download a copy to print and send physically."
                  icon={Printer}
                  iconClassName="bg-slate-100 text-slate-700"
                />
                <LetterSelectableCard
                  selected={deliveryAction === 'send_now'}
                  disabled={isReadOnly}
                  onSelect={() => setDeliveryAction('send_now')}
                  title="Send it now"
                  description="Email it through the portal right away so they know the letter exists."
                  icon={Send}
                  iconClassName="bg-emerald-100 text-emerald-700"
                />
                <LetterSelectableCard
                  selected={deliveryAction === 'schedule'}
                  disabled={isReadOnly}
                  onSelect={() => setDeliveryAction('schedule')}
                  title="Schedule for later"
                  description={
                    localData.letter_date
                      ? `Sends automatically on ${formatLetterDate(localData.letter_date)}.`
                      : 'Pick a future date — Orderly Affairs emails it then.'
                  }
                  icon={CalendarIcon}
                  iconClassName="bg-amber-100 text-amber-700"
                />
              </div>
              {deliveryAction === 'schedule' && !localData.letter_date ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-2xl"
                  onClick={() => setWizardStep(0)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Choose schedule date
                </Button>
              ) : null}
              {localData.delivery_status === 'sent' ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-900">
                  This letter was already emailed
                  {localData.sent_at
                    ? ` on ${formatLetterDate(localData.sent_at)}`
                    : ''}
                  .
                </p>
              ) : null}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const previewActions = (
    <>
      <Button onClick={handlePrint} variant="outline" className="rounded-2xl">
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
      <Button onClick={handleExport} variant="outline" className="rounded-2xl">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      {isValidEmail(localData.nok_email) && (
        <Button onClick={handleEmail} className="rounded-2xl">
          <Send className="mr-2 h-4 w-4" />
          Email
        </Button>
      )}
    </>
  );

  const sheetFooter = (
    <div
      className={cn(
        'flex w-full gap-2',
        compactSheet
          ? 'flex-row'
          : isMobile
            ? 'flex-col-reverse'
            : 'flex-col-reverse sm:flex-row sm:justify-between',
      )}
    >
      {wizardStep === 0 ? (
        onClose ? (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={cn(
              'rounded-2xl',
              MIN_TOUCH,
              compactSheet ? 'flex-1' : isMobile && embeddedInSheet ? 'w-full' : 'w-auto',
            )}
          >
            Cancel
          </Button>
        ) : (
          <div className="hidden sm:block" />
        )
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={goToPreviousStep}
          className={cn(
            'rounded-2xl',
            MIN_TOUCH,
            compactSheet ? 'flex-1' : isMobile && embeddedInSheet ? 'w-full' : 'w-auto',
          )}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}

      {!isLastStep ? (
        <Button
          type="button"
          onClick={goToNextStep}
          className={cn(
            'rounded-2xl',
            MIN_TOUCH,
            compactSheet ? 'flex-[1.4]' : isMobile && embeddedInSheet ? 'w-full' : 'w-auto',
          )}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : isReadOnly ? (
        <Button
          type="button"
          data-oa-view-ok
          variant="outline"
          onClick={() => setPreviewOpen(true)}
          className={cn(
            'rounded-2xl',
            MIN_TOUCH,
            compactSheet ? 'flex-[1.4]' : isMobile && embeddedInSheet ? 'w-full' : 'w-auto',
          )}
        >
          <Eye className="mr-2 h-4 w-4" />
          View letter
        </Button>
      ) : (
        <Button
          type="button"
          data-oa-mutate
          onClick={() => void handleDeliveryAction()}
          disabled={deliveryBusy || isSaving || isSendingNow}
          className={cn(
            'rounded-2xl',
            MIN_TOUCH,
            compactSheet ? 'flex-[1.4]' : isMobile && embeddedInSheet ? 'w-full' : 'w-auto',
          )}
        >
          {deliveryBusy || isSendingNow ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : deliveryAction === 'export' ? (
            <Download className="mr-2 h-4 w-4" />
          ) : deliveryAction === 'schedule' ? (
            <CalendarIcon className="mr-2 h-4 w-4" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {deliveryAction === 'export'
            ? compactSheet
              ? 'Export'
              : 'Export letter'
            : deliveryAction === 'schedule'
              ? compactSheet
                ? 'Schedule'
                : 'Schedule send'
              : compactSheet
                ? 'Send now'
                : 'Send now'}
        </Button>
      )}
    </div>
  );

  const wizardFooter = embeddedInSheet ? (
    sheetFooter
  ) : (
    <div
      className={cn(
        'flex w-full gap-2',
        isMobile
          ? 'flex-col'
          : 'flex-col-reverse sm:flex-row sm:items-center sm:justify-between',
      )}
    >
      {wizardStep === 0 ? (
        <div className="hidden sm:block" />
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={goToPreviousStep}
          className={cn('rounded-2xl', MIN_TOUCH, 'w-full sm:w-auto')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {!isMobile && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-2xl">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92svh] w-[calc(100vw-1rem)] max-w-[67.2rem] sm:max-w-[67.2rem] gap-0 overflow-hidden rounded-3xl border-border/70 p-0 shadow-2xl">
              <DialogHeader className="border-b bg-muted/30 px-5 py-5 pr-14 sm:px-6">
                <DialogTitle>Letter Preview</DialogTitle>
                <DialogDescription>
                  Review before printing, exporting, or emailing.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[calc(92svh-170px)] overflow-y-auto bg-muted/30 px-4 py-5 sm:px-8">
                <LetterPreviewBody
                  letterPreview={letterPreview}
                  nokEmail={localData.nok_email}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 border-t bg-background px-4 py-3 sm:flex sm:justify-end">
                {previewActions}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {!isLastStep ? (
          <Button
            type="button"
            data-oa-view-ok
            onClick={goToNextStep}
            className={cn('rounded-2xl', MIN_TOUCH, 'w-full sm:w-auto')}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : isReadOnly ? (
          <Button
            type="button"
            data-oa-view-ok
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            className={cn('rounded-2xl', MIN_TOUCH, 'w-full sm:w-auto')}
          >
            <Eye className="mr-2 h-4 w-4" />
            View letter
          </Button>
        ) : (
          <Button
            type="button"
            data-oa-mutate
            onClick={() => void handleDeliveryAction()}
            disabled={deliveryBusy || isSaving || isSendingNow}
            className={cn('rounded-2xl', MIN_TOUCH, 'w-full sm:w-auto')}
          >
            {deliveryBusy || isSendingNow ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : deliveryAction === 'export' ? (
              <Download className="mr-2 h-4 w-4" />
            ) : deliveryAction === 'schedule' ? (
              <CalendarIcon className="mr-2 h-4 w-4" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {deliveryAction === 'export'
              ? 'Export'
              : deliveryAction === 'schedule'
                ? 'Schedule send'
                : 'Send now'}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
    <div
      className={cn(
        embeddedInSheet
          ? 'flex h-full min-h-0 flex-col'
          : 'mx-auto w-full max-w-5xl space-y-5',
      )}
      data-field-type="NextOfKinLetter"
      data-oa-family-readonly={isReadOnly ? 'true' : undefined}
    >
      {isReadOnly ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          View-only — your family role can read this letter but cannot edit or
          send it.
        </div>
      ) : null}
      {!embeddedInSheet && (
      <div className="rounded-[1.75rem] border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              {isFetching || (!isReadOnly && isSaving) ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-foreground">
                  Next of Kin Letter
                </h3>

                <Badge
                  variant="outline"
                  className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-primary"
                >
                  {isFetching
                    ? 'Loading'
                    : isReadOnly
                      ? 'View only'
                      : isSaving
                        ? 'Saving'
                        : 'Auto-saved'}
                </Badge>
              </div>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                A single focused editor. Use the steps below to complete the
                letter without losing the main content area.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isError && (
              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                className="rounded-2xl"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}

            {!isMobile ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-2xl">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-h-[92svh] w-[calc(100vw-1rem)] max-w-[67.2rem] sm:max-w-[67.2rem] gap-0 overflow-hidden rounded-3xl border-border/70 p-0 shadow-2xl">
                  <DialogHeader className="border-b bg-muted/30 px-5 py-5 pr-14 sm:px-6">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </span>
                      Letter Preview
                    </DialogTitle>

                    <DialogDescription>
                      Review the final letter before printing, exporting, or
                      emailing.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="max-h-[calc(92svh-170px)] overflow-y-auto bg-muted/30 px-4 py-5 sm:px-8">
                    <LetterPreviewBody
                      letterPreview={letterPreview}
                      nokEmail={localData.nok_email}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t bg-background px-4 py-3 sm:flex sm:justify-end">
                    {previewActions}
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            )}
          </div>
        </div>
      </div>
      )}

      <div
        className={cn(
          'flex flex-col',
          embeddedInSheet
            ? 'min-h-0 flex-1'
            : 'rounded-[1.75rem] border border-border/60 bg-card shadow-sm',
        )}
      >
        {isMobile && embeddedInSheet && <MobileSheetHandle />}

        <div
          className={cn(
            'shrink-0 space-y-0 border-b px-4 pb-3 sm:px-6 sm:pb-4',
            embeddedInSheet && isMobile ? 'pt-1' : 'pt-4 sm:pt-5',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                id="nok-letter-wizard-title"
                className={cn(
                  'text-left font-semibold',
                  compactSheet ? 'text-base' : 'text-lg sm:text-xl',
                )}
              >
                {compactSheet && recipientName
                  ? recipientName
                  : 'Next of Kin Letter'}
              </h2>
              {!compactSheet && (
                <p className="text-left text-sm text-muted-foreground">
                  Step {wizardStep + 1} of {EDITOR_STEPS.length}
                </p>
              )}
              {embeddedInSheet && recipientName && !compactSheet && (
                <p className="mt-0.5 truncate text-left text-xs text-muted-foreground">
                  {recipientName}
                </p>
              )}
              {compactSheet && (
                <p className="mt-0.5 text-left text-xs text-muted-foreground">
                  Letter editor · tap <span className="font-medium text-foreground">Preview</span> to read the full letter
                </p>
              )}
              {!embeddedInSheet && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs text-primary"
                  >
                    {isFetching ? 'Loading' : isSaving ? 'Saving' : 'Auto-saved'}
                  </Badge>
                  {isError && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => refetch()}
                      className="h-8 rounded-xl px-2 text-xs"
                    >
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                      Retry
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {embeddedInSheet && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewOpen(true)}
                  className="h-9 shrink-0 rounded-xl px-2.5 text-xs font-medium"
                  aria-label="Preview letter"
                >
                  <Eye className="mr-1.5 h-4 w-4" />
                  Preview
                </Button>
              )}
              {embeddedInSheet && isMobile && onClose && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-10 w-10 rounded-full"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
          <div className="mt-3">
            <LetterWizardStepper
              currentIndex={wizardStep}
              onStepClick={goToWizardStep}
              compact={isMobile}
              dotsOnly={compactSheet}
            />
          </div>
        </div>

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6',
            MOBILE_SHEET_SCROLL_CLASS,
            compactSheet ? 'py-3' : 'py-5',
            embeddedInSheet && MOBILE_SHEET_SCROLL_PADDING,
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={wizardStep}
              initial={{
                opacity: 0,
                y: isMobile ? 16 : 0,
                x: isMobile ? 0 : 12,
              }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{
                opacity: 0,
                y: isMobile ? -8 : 0,
                x: isMobile ? 0 : -12,
              }}
              transition={isMobile ? LETTER_SHEET_SPRING : { duration: 0.2 }}
              className={cn(compactSheet ? 'space-y-4' : 'space-y-6')}
            >
              <fieldset
                disabled={isReadOnly}
                className="min-w-0 space-y-inherit border-0 p-0 disabled:opacity-[0.98] [&_button]:cursor-default"
              >
                <legend className="sr-only">
                  {isReadOnly ? 'View-only letter' : 'Edit letter'}
                </legend>
                {renderWizardStepContent()}
              </fieldset>
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          className={cn(
            'shrink-0 border-t px-4 py-3 sm:px-6 sm:py-4',
            compactSheet
              ? cn(
                  MOBILE_SHEET_FOOTER_CLASS,
                  'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
                )
              : 'bg-background/95 backdrop-blur',
          )}
        >
          {wizardFooter}
        </div>
      </div>
    </div>

    {isMobile ? (
      <MobileBottomSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        className="max-h-[92dvh]"
        labelledBy="nok-letter-preview-title"
        zClassName="z-[80]"
      >
        <div className="flex h-full min-h-0 flex-col">
          <MobileSheetHandle />
          <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 pb-4 pt-1">
            <div>
              <h3 id="nok-letter-preview-title" className="text-lg font-semibold">
                Letter Preview
              </h3>
              <p className="text-sm text-muted-foreground">
                Review before printing, exporting, or emailing.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setPreviewOpen(false)}
              className="h-10 w-10 shrink-0 rounded-full"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/30 px-4 py-4',
              MOBILE_SHEET_SCROLL_CLASS,
              MOBILE_SHEET_SCROLL_PADDING,
            )}
          >
            <LetterPreviewBody
              letterPreview={letterPreview}
              nokEmail={localData.nok_email}
            />
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {previewActions}
          </div>
        </div>
      </MobileBottomSheet>
    ) : (
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[92svh] w-[calc(100vw-2rem)] max-w-[67.2rem] sm:max-w-[67.2rem] gap-0 overflow-hidden rounded-3xl border-border/70 p-0 shadow-2xl">
          <DialogHeader className="border-b bg-muted/30 px-5 py-5 pr-14 sm:px-6">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </span>
              Letter Preview
            </DialogTitle>
            <DialogDescription>
              Review the final letter before printing, exporting, or emailing.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(92svh-170px)] overflow-y-auto bg-muted/30 px-4 py-5 sm:px-8">
            <LetterPreviewBody
              letterPreview={letterPreview}
              nokEmail={localData.nok_email}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 border-t bg-background px-4 py-3 sm:flex sm:justify-end">
            {previewActions}
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}
