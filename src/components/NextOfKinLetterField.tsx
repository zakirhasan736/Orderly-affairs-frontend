'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@common/ui/badge';
import { Button } from '@common/ui/button';
import { cn } from '@common/ui/utils';
import { Calendar } from '@common/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@common/ui/card';
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
import { Popover, PopoverContent, PopoverTrigger } from '@common/ui/popover';
import { Textarea } from '@common/ui/textarea';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
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
} from 'lucide-react';
import { toast } from 'sonner';

import {
  MOBILE_SHEET_SCROLL_PADDING,
  MobileBottomSheet,
  MobileSheetHandle,
  useIsMobile,
} from '@/components/MobileBottomSheet';

import {
  type NOKLetter,
  type NOKLetterIn,
  useGetNokLetterQuery,
  useSaveNokLetterMutation,
} from '@/services/nokLetterApi';
import {
  type NextKinAccessResponse,
  useGetMyNextKinQuery,
} from '@/services/authApi';

type LetterData = Partial<NOKLetter & NOKLetterIn>;

interface NextOfKinLetterFieldProps {
  data?: LetterData;
  onChange: (data: LetterData) => void;
  formData?: Record<string, unknown>;
  selectedNokId?: string;
  /** When true, optimizes layout for a mobile bottom sheet container */
  embeddedInSheet?: boolean;
}

function LetterPreviewBody({
  letterPreview,
  nokEmail,
}: {
  letterPreview: string;
  nokEmail?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border bg-white px-5 py-7 shadow-xl sm:px-12 sm:py-12">
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

const DEFAULTS = {
  letter_greeting: 'Dear',
  access_url: 'https://orderly-affairs.com',
  letter_opening:
    "I'm writing you this note as someone I trust deeply.\n\nAs my next of kin, the executor of my will, a close friend, my attorney, or someone who cares—I want you to know that I've prepared something to help guide you through what comes next.",
  kit_description:
    "I've subscribed to an Orderly Affairs Kit. Inside, you'll find everything you may need to manage my affairs if I'm no longer able to, or when I'm gone. It includes not only documents, but also instructions—gentle step-by-step guides to make this process less overwhelming.",
  accessible_sections:
    "Once you log in, you'll be able to manage the sections below on my behalf:\n\n(Autofill sections based on selection in the access management section)",
  key_bag_info:
    '• The Key Bag: This contains important keys and a guide to what each is for. It may include house keys, PO box keys, or vehicle keys. It is located',
  documents_bag_info:
    '• The Documents Bag: Please keep this safe. It contains original documents and space to store items such as death certificates. You may need to refer to it even after everything has been settled. It is located',
  incomplete_kit_message:
    "If any part of the kit is incomplete, please don't worry. Even the unfinished parts can still help you stay organized. I've done my best to make sure you won't be left searching through drawers or wondering where things are.",
  closing_message:
    "Above all, this kit is my way of caring for you—even when I can't be here in person.\n\nTake your time. Breathe. You've got this, and I'm grateful it's you.",
  letter_signature: 'With love,',
};

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
    helper: 'Final words and signature',
  },
] as const;

type EditorStep = (typeof EDITOR_STEPS)[number]['id'];

function mergeAccessManagementAutofill(
  letter: LetterData,
  person?: NextKinAccessResponse | null,
): LetterData {
  if (!person) return letter;

  return {
    ...letter,
    letter_to: person.full_name || letter.letter_to,
    nok_email: person.email || letter.nok_email,
    nok_phone: person.phone_number || letter.nok_phone,
    password_card_location:
      person.card_storage_location || letter.password_card_location,
    key_bag_location: person.key_bag_location || letter.key_bag_location,
    documents_bag_location:
      person.documents_bag_location || letter.documents_bag_location,
  };
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
}: NextOfKinLetterFieldProps) {
  const isMobile = useIsMobile();
  const [activeStep, setActiveStep] = useState<EditorStep>('recipient');
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

  const [localData, setLocalData] = useState<LetterData>(data || {});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
    setActiveStep('recipient');
  }, [selectedNokId]);

  useEffect(() => {
    if (!serverData) return;

    const merged = mergeAccessManagementAutofill(serverData, selectedPerson);
    setLocalData(merged);
    onChange(merged);
    hydratedRef.current = true;
  }, [serverData, selectedPerson]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedPerson || !hydratedRef.current) return;

    setLocalData(prev => {
      const merged = mergeAccessManagementAutofill(prev, selectedPerson);

      if (JSON.stringify(prev) === JSON.stringify(merged)) {
        return prev;
      }

      onChange(merged);
      return merged;
    });
  }, [selectedPerson]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data || hydratedRef.current) return;

    setLocalData(mergeAccessManagementAutofill(data, selectedPerson));
  }, [data, selectedPerson]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

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

  const generateLetterContent = () => {
    const date = localData.letter_date
      ? new Date(localData.letter_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Upon Death';

    return `${date}

${localData.letter_greeting || DEFAULTS.letter_greeting} ${
      localData.letter_to || '[Next of Kin Name]'
    },

${localData.letter_opening || DEFAULTS.letter_opening}

${localData.kit_description || DEFAULTS.kit_description}

You can access the kit online at: ${localData.access_url || DEFAULTS.access_url}

${loginCredentialsText}

${localData.accessible_sections || DEFAULTS.accessible_sections}

In addition to the online kit, you'll find two important physical items:

${localData.key_bag_info || DEFAULTS.key_bag_info} ${
      localData.key_bag_location || '[Key Bag Location]'
    }.

${localData.documents_bag_info || DEFAULTS.documents_bag_info} ${
      localData.documents_bag_location || '[Documents Bag Location]'
    }.

${localData.incomplete_kit_message || DEFAULTS.incomplete_kit_message}

${localData.closing_message || DEFAULTS.closing_message}

${localData.letter_signature || DEFAULTS.letter_signature}

[Your signature]`;
  };

  const letterPreview = useMemo(
    () => generateLetterContent(),
    [JSON.stringify(localData)],
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
    toast.success('Letter exported successfully!');
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

  const currentStep = EDITOR_STEPS.find(step => step.id === activeStep);
  const showMobileSheetChrome = isMobile && embeddedInSheet;
  const showMobileStickyBar = isMobile && !embeddedInSheet;

  const goToPreviousStep = () => {
    const index = EDITOR_STEPS.findIndex(step => step.id === activeStep);
    const previous = EDITOR_STEPS[index - 1];
    if (previous) setActiveStep(previous.id);
  };

  const goToNextStep = () => {
    const index = EDITOR_STEPS.findIndex(step => step.id === activeStep);
    const next = EDITOR_STEPS[index + 1];
    if (next) setActiveStep(next.id);
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

  const mobileStepFooter = (
    <div
      className={cn(
        'grid grid-cols-4 gap-2',
        showMobileSheetChrome &&
          'sticky bottom-0 border-t bg-background/95 px-1 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]',
      )}
    >
      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-2xl text-xs"
        disabled={activeStep === 'recipient'}
        onClick={goToPreviousStep}
      >
        Back
      </Button>

      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-2xl text-xs"
        onClick={() => setPreviewOpen(true)}
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-2xl text-xs"
        onClick={handleExport}
      >
        Export
      </Button>

      <Button
        type="button"
        className="h-11 rounded-2xl text-xs"
        disabled={activeStep === 'closing'}
        onClick={goToNextStep}
      >
        Next
      </Button>
    </div>
  );

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-5xl space-y-5',
        showMobileStickyBar && 'pb-24',
        !isMobile && 'xl:pb-8',
        embeddedInSheet && 'max-w-none space-y-4',
      )}
      data-field-type="NextOfKinLetter"
    >
      {/* ================= TOP STATUS ================= */}
      {!showMobileSheetChrome && (
      <div className="rounded-[1.75rem] border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              {isFetching || isSaving ? (
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
                  {isFetching ? 'Loading' : isSaving ? 'Saving' : 'Auto-saved'}
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

                <DialogContent className="max-h-[92svh] w-[calc(100vw-1rem)] max-w-4xl gap-0 overflow-hidden rounded-3xl border-border/70 p-0 shadow-2xl">
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

      {showMobileSheetChrome && (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-3 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            {isFetching || isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Letter editor</p>
            <p className="text-xs text-muted-foreground">
              {isFetching ? 'Loading' : isSaving ? 'Saving' : 'Auto-saved'}
            </p>
          </div>
        </div>
      )}

      {/* ================= STEP NAV ================= */}
      <div
        className={cn(
          'rounded-[1.75rem] border border-border/60 bg-background p-2 shadow-sm',
          embeddedInSheet && 'rounded-2xl',
        )}
      >
        <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0">
          {EDITOR_STEPS.map(step => {
            const Icon = step.icon;
            const active = activeStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`min-w-[150px] rounded-2xl px-3 py-3 text-left transition sm:min-w-0 ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-black">{step.label}</span>
                </div>

                <p
                  className={`mt-1 line-clamp-1 text-[11px] ${
                    active
                      ? 'text-primary-foreground/75'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.helper}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= MAIN ONE VIEW CONTENT ================= */}
      <Card
        className={cn(
          'overflow-hidden rounded-[2rem] border-border/60 shadow-sm',
          embeddedInSheet && 'rounded-2xl',
        )}
      >
        <CardHeader
          className={cn(
            'border-b border-border/60 bg-muted/20 p-5 sm:p-6',
            embeddedInSheet && 'p-4',
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {currentStep && <currentStep.icon className="h-5 w-5" />}
            </div>

            <div>
              <CardTitle className="text-xl font-black">
                {currentStep?.label}
              </CardTitle>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {currentStep?.helper}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent
          className={cn(
            'space-y-4 p-4 sm:p-6',
            embeddedInSheet && 'p-3 sm:p-4',
          )}
        >
          {activeStep === 'recipient' && (
            <>
              <FieldBlock
                label="Delivery Date"
                description="Leave empty for upon-death delivery."
                icon={<CalendarIcon className="h-4 w-4" />}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-start rounded-2xl px-4 py-3 text-left"
                    >
                      <span className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CalendarIcon className="h-5 w-5" />
                      </span>

                      <span className="flex min-w-0 flex-col">
                        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          Automatic delivery
                        </span>
                        <span className="truncate text-sm font-black text-foreground">
                          {formatLetterDate(localData.letter_date) ||
                            'Upon death'}
                        </span>
                      </span>
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-auto overflow-hidden rounded-3xl p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={
                        localData.letter_date
                          ? new Date(localData.letter_date)
                          : undefined
                      }
                      onSelect={date =>
                        handleFieldChange(
                          'letter_date',
                          date ? (date.toISOString() as any) : (null as any),
                        )
                      }
                      initialFocus
                    />

                    <div className="flex justify-between border-t px-4 py-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() =>
                          handleFieldChange(
                            'letter_date',
                            new Date().toISOString() as any,
                          )
                        }
                      >
                        Today
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() =>
                          handleFieldChange('letter_date', null as any)
                        }
                      >
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </FieldBlock>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock
                  label="To"
                  description="Recipient name."
                  icon={<UserRound className="h-4 w-4" />}
                >
                  <Input
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
                  description="Opening greeting."
                  icon={<Mail className="h-4 w-4" />}
                >
                  <Input
                    value={
                      localData.letter_greeting || DEFAULTS.letter_greeting
                    }
                    onChange={e =>
                      handleFieldChange(
                        'letter_greeting',
                        e.target.value as any,
                      )
                    }
                    className="h-12 rounded-2xl"
                  />
                </FieldBlock>
              </div>
            </>
          )}

          {activeStep === 'message' && (
            <>
              <FieldBlock label="Opening Message">
                <Textarea
                  value={localData.letter_opening || DEFAULTS.letter_opening}
                  onChange={e =>
                    handleFieldChange('letter_opening', e.target.value as any)
                  }
                  rows={7}
                  className="min-h-[180px] rounded-2xl"
                />
              </FieldBlock>

              <FieldBlock label="Kit Description">
                <Textarea
                  value={localData.kit_description || DEFAULTS.kit_description}
                  onChange={e =>
                    handleFieldChange('kit_description', e.target.value as any)
                  }
                  rows={6}
                  className="min-h-[160px] rounded-2xl"
                />
              </FieldBlock>
            </>
          )}

          {activeStep === 'access' && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock
                  label="Access URL"
                  icon={<ShieldCheck className="h-4 w-4" />}
                >
                  <Input
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
                <Textarea
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
                <Textarea
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
          )}

          {activeStep === 'items' && (
            <>
              <FieldBlock
                label="Key Bag Information"
                icon={<KeyRound className="h-4 w-4" />}
              >
                <Textarea
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
                <Textarea
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
          )}

          {activeStep === 'closing' && (
            <>
              <FieldBlock label="Incomplete Kit Message">
                <Textarea
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
                <Textarea
                  value={localData.closing_message || DEFAULTS.closing_message}
                  onChange={e =>
                    handleFieldChange('closing_message', e.target.value as any)
                  }
                  rows={5}
                  className="min-h-[150px] rounded-2xl"
                />
              </FieldBlock>

              <FieldBlock label="Signature">
                <Input
                  value={
                    localData.letter_signature || DEFAULTS.letter_signature
                  }
                  onChange={e =>
                    handleFieldChange('letter_signature', e.target.value as any)
                  }
                  className="h-12 rounded-2xl"
                />
              </FieldBlock>
            </>
          )}

          {/* Desktop action footer */}
          <div className="hidden items-center justify-between gap-3 border-t border-border/60 pt-5 sm:flex">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              disabled={activeStep === 'recipient'}
              onClick={() => {
                const index = EDITOR_STEPS.findIndex(
                  step => step.id === activeStep,
                );
                const previous = EDITOR_STEPS[index - 1];
                if (previous) setActiveStep(previous.id);
              }}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={handleExport}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              {isValidEmail(localData.nok_email) && (
                <Button
                  type="button"
                  className="rounded-2xl"
                  onClick={handleEmail}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Email
                </Button>
              )}
            </div>

            <Button
              type="button"
              className="rounded-2xl"
              disabled={activeStep === 'closing'}
              onClick={() => {
                const index = EDITOR_STEPS.findIndex(
                  step => step.id === activeStep,
                );
                const next = EDITOR_STEPS[index + 1];
                if (next) setActiveStep(next.id);
              }}
            >
              Next
            </Button>
          </div>
          {showMobileSheetChrome && mobileStepFooter}
        </CardContent>
      </Card>

      {/* Mobile sticky actions (inline page only) */}
      {showMobileStickyBar && (
        <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 border-t border-border/60 bg-background/95 px-3 py-3 shadow-2xl backdrop-blur-xl sm:hidden">
          <div className="mx-auto max-w-md">{mobileStepFooter}</div>
        </div>
      )}

      {/* Mobile preview bottom sheet */}
      {isMobile && (
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
      )}
    </div>
  );
}
