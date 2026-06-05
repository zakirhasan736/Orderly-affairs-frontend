'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
import { AccessManagement } from '@/components/AccessManagement';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileKey2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const SECTION_2A = {
  id: '2A',
  title: 'Kit Access Control',
};

const SETUP_STEPS = [
  {
    title: 'Add trusted people',
    shortText: 'Choose who can access your kit when needed.',
    details:
      'Add one Primary Next of Kin or multiple trusted people. Each person can have full kit access or access to selected sections only.',
    icon: UserPlus,
  },
  {
    title: 'Choose access level',
    shortText: 'Give full access or section-only access.',
    details:
      'For each person, select whether they can access the entire kit or only specific sections such as Insurance, Vehicles, Legal Documents, or Health Information.',
    icon: ShieldCheck,
  },
  {
    title: 'Create password cards',
    shortText: 'Generate a secure access card for each person.',
    details:
      'Each person gets a unique Master Access Password card. Print or export each card and store it securely, such as in your Fireproof Document Bag.',
    icon: FileKey2,
  },
  {
    title: 'Monitor access',
    shortText: 'Get notified when someone logs in.',
    details:
      'Whenever someone accesses the kit, you receive a notification with their name, access type, and timestamp. You can revoke access anytime.',
    icon: Bell,
  },
];

const SECURITY_RULES = [
  'Do not give anyone their Master Access Password directly.',
  'Only tell them where their printed Password Card is stored.',
  'Assign at least one trusted person before finishing this section.',
  'Use Revoke All if you need to immediately lock everyone out.',
];

/* ------------------------------------------------------------------ */
/* PROPS                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  isActive?: boolean;
}

/* ------------------------------------------------------------------ */
/* SMALL COMPONENTS                                                    */
/* ------------------------------------------------------------------ */

function StatusPill({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'warning' | 'success';
}) {
  const toneClass =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}
    >
      {children}
    </span>
  );
}

function MobileSetupGuide() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4 lg:hidden">
      <div className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-4">
        <div className="flex sm:flex-row flex-col items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <StatusPill tone="success">Owner setup</StatusPill>

            <h3 className="mt-3 text-lg font-semibold leading-tight">
              Control who can access your kit
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add trusted people, choose what they can see, then generate secure
              access cards.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Never send the password directly. Store the printed password card
              safely.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(prev => !prev)}
          className="mt-4 w-full rounded-2xl"
        >
          {open ? 'Hide setup guide' : 'Show setup guide'}
          {open ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      </div>

      {open && (
        <div className="space-y-3">
          {SETUP_STEPS.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="rounded-2xl border bg-card p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {index + 1}. {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {step.shortText}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DesktopGuidePanel() {
  const [openStep, setOpenStep] = React.useState<number | null>(0);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6 space-y-4">
        <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <StatusPill tone="success">
              Required before emergency access
            </StatusPill>

            <h3 className="mt-4 text-xl font-semibold leading-tight">
              Set up trusted access
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add the people who can access your Orderly Affairs Kit and decide
              exactly what they are allowed to see.
            </p>
          </div>

          <div className="border-t bg-background/70 p-4">
            <Button
              type="button"
              className="w-full rounded-2xl"
              onClick={() =>
                document
                  .getElementById('access-management-panel')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Start adding people
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-amber-600" />
            <h4 className="font-semibold">Security reminder</h4>
          </div>

          <div className="space-y-3">
            {SECURITY_RULES.slice(0, 3).map(rule => (
              <div key={rule} className="flex gap-2 text-sm leading-6">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-muted-foreground">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border bg-muted/30 p-3">
          {SETUP_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isOpen = openStep === index;

            return (
              <div key={step.title} className="border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenStep(isOpen ? null : index)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-background"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {step.shortText}
                    </p>
                  </div>

                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-3 pb-4 pl-[60px] text-sm leading-6 text-muted-foreground">
                    {step.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function ActionOverviewCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {SETUP_STEPS.map((step, index) => {
        const Icon = step.icon;

        return (
          <div
            key={step.title}
            className="rounded-2xl border bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Step {index + 1}
                </p>
                <h4 className="mt-1 font-semibold">{step.title}</h4>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {step.shortText}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SecurityNotice() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left sm:p-5"
      >
        <div className="flex gap-3">
          <div className="flex h-6 w-6 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>

          <div>
            <h3 className="font-semibold text-amber-950">
              Important password card rule
            </h3>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              Do not give anyone their Master Access Password directly.
            </p>
          </div>
        </div>

        {open ? (
          <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-amber-700" />
        ) : (
          <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-amber-700" />
        )}
      </button>

      {open && (
        <div className="border-t border-amber-200 px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {SECURITY_RULES.map(rule => (
              <div
                key={rule}
                className="flex gap-2 rounded-2xl bg-background/70 p-3 text-sm leading-6 text-amber-950"
              >
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section2AccessManagement({ isActive = false }: Props) {
  return (
    <Card
      id="subsection-2A"
      className={`overflow-hidden rounded-3xl transition-all ${
        isActive ? 'ring-2 ring-primary/50 bg-primary/5' : ''
      }`}
    >
      {/* ================= HEADER ================= */}
      <CardHeader className="border-b bg-gradient-to-r from-background via-background to-muted/40 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                {SECTION_2A.id}
              </span>
              <span>{SECTION_2A.title}</span>
            </CardTitle>

            <p className="mt-2 max-w-2xl text-sm sm:leading-6 text-muted-foreground">
              Manage who can access your kit, what sections they can view, and
              how their emergency access works.
            </p>
          </div>

          <div className="flex flex-nowrap gap-1 sm:gap-2">
            <StatusPill>
              <Users className="mr-.7 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Trusted people
            </StatusPill>
            <StatusPill tone="warning">
              <KeyRound className="mr-.7 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Password cards
            </StatusPill>
          </div>
        </div>
      </CardHeader>

      {/* ================= CONTENT ================= */}
      <CardContent className="p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
          {/* Desktop left guide */}
          <DesktopGuidePanel />

          {/* Main work area */}
          <div className="min-w-0 space-y-6">
            {/* Mobile compact guide */}
            <MobileSetupGuide />

            {/* Desktop top overview */}
            <div className="hidden space-y-5 lg:block">
              <ActionOverviewCards />
              <SecurityNotice />
            </div>

            {/* Mobile security notice */}
            <div className="lg:hidden">
              <SecurityNotice />
            </div>

            {/* Access Management Controller */}
            <div
              id="access-management-panel"
              className="scroll-mt-6 rounded-3xl border bg-background shadow-sm"
            >
              <div className="border-b p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                      Main action area
                    </div>

                    <h3 className="text-lg font-semibold">
                      Add and manage access
                    </h3>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Add trusted people below. For each person, choose full kit
                      access or select only the sections they should see.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-3 pt-5 sm:p-5">
                <AccessManagement />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
