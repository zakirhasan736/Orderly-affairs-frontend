'use client';

import { cn } from '@common/ui/utils';
import { BRAND_LOGO, BRAND_MARK_LIGHT } from '@/constants/brand';

export type AuthPortalMode = 'login' | 'signup';

type SignupStepMeta = {
  title: string;
  description: string;
};

export type CheckoutOrderSummary = {
  planLabel: string;
  planPrice: string;
  planNote: string;
  dueToday: string;
  dueNote: string;
  footerNote: string;
};

const DEFAULT_SIGNUP_STEPS: SignupStepMeta[] = [
  {
    title: 'Create your account',
    description: 'Email and a password',
  },
  {
    title: 'Secure it',
    description: 'SMS, email, or authenticator app',
  },
  {
    title: 'Choose your plan',
    description: 'Then payment, or start the trial',
  },
];

type AuthPortalShellProps = {
  mode: AuthPortalMode;
  signupStep?: 1 | 2 | 3;
  /** Override sidebar step descriptions (e.g. email + MFA method on step 3). */
  signupSteps?: SignupStepMeta[];
  /** When set, left panel shows checkout order summary instead of signup steps. */
  checkoutSummary?: CheckoutOrderSummary | null;
  mobileTitle: string;
  mobileStepLabel?: string;
  mobileSubtitle?: string;
  mobileShowTagline?: boolean;
  /** Mobile top chrome: brand ink banner vs reset white bar vs checkout vs plan */
  mobileChrome?: 'brand' | 'reset' | 'checkout' | 'plan';
  onMobileBack?: () => void;
  children: React.ReactNode;
  className?: string;
};

function BrandMark({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center',
        compact ? 'gap-2.5' : 'gap-[11px]',
        className,
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden bg-white',
          compact
            ? 'h-[34px] w-[34px] rounded-[9px]'
            : 'h-11 w-11 rounded-[11px]',
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_LOGO}
          alt="Orderly Affairs"
          width={compact ? 26 : 32}
          height={compact ? 26 : 32}
          className="h-[78%] w-[78%] object-contain"
          onError={e => {
            const el = e.currentTarget;
            if (el.dataset.fallback === '1') return;
            el.dataset.fallback = '1';
            el.src = BRAND_MARK_LIGHT;
            el.className = 'h-[78%] w-[78%] object-contain brightness-0';
          }}
        />
      </div>
      <span
        className={cn(
          'font-semibold tracking-[-0.01em] text-white',
          compact ? 'text-[14.5px]' : 'text-[15px]',
        )}
      >
        Orderly Affairs
      </span>
    </div>
  );
}

function BrandAside({
  children,
  contentMaxWidth = '600px',
  wide,
}: {
  children: React.ReactNode;
  contentMaxWidth?: string;
  /** Checkout order panel — ~38–40% brand column. */
  wide?: boolean;
}) {
  return (
    <aside
      className={cn(
        'relative hidden bg-[#213D59] text-white lg:flex',
        // Stay viewport-tall even when the login card is taller, so the
        // headline is not pushed below the fold by mt-auto.
        'sticky top-0 h-[100dvh] min-h-[100dvh] max-h-[100dvh] shrink-0 self-start overflow-hidden',
        wide
          ? 'w-[min(40%,560px)]'
          : 'w-[44%] xl:w-[42%]',
      )}
    >
      <div
        className={cn(
          'ml-auto flex h-full min-h-0 w-full flex-col',
          wide
            ? 'px-[46px] py-[clamp(1.5rem,4vh,2.75rem)]'
            : 'px-11 py-[clamp(1.5rem,4vh,2.75rem)]',
        )}
        style={{ maxWidth: contentMaxWidth }}
      >
        {children}
      </div>
    </aside>
  );
}

function LoginBrandPanel() {
  return (
    <BrandAside contentMaxWidth="600px">
      <div className="flex h-full min-h-0 flex-col items-center">
        <BrandMark className="justify-center" />

        <div className="flex flex-1 flex-col items-center justify-center px-1 text-center">
          <h2 className="m-0 max-w-[16ch] font-[family-name:var(--font-family-display)] text-[clamp(1.85rem,4.6vh,2.75rem)] font-normal leading-[1.15] text-white">
            A single, trusted place for your life's essentials
          </h2>
          <p
            className="mt-4 mb-0 max-w-[36ch] text-[clamp(14px,1.7vh,16.5px)] leading-[1.65] text-pretty"
            style={{ color: 'rgba(255,255,255,.72)' }}
          >
            Your accounts, documents, wishes and letters — private while
            you&apos;re here, and handed to the right people when you&apos;re
            not.
          </p>
        </div>

        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 pb-[max(0px,env(safe-area-inset-bottom))] text-center text-[12px] tracking-[-0.01em] text-white/40">
          <li>Encrypted at rest</li>
          <li>You choose who opens it</li>
        </ul>
      </div>
    </BrandAside>
  );
}

function SignupBrandPanel({
  activeStep,
  steps,
}: {
  activeStep: 1 | 2 | 3;
  steps: SignupStepMeta[];
}) {
  return (
    <BrandAside contentMaxWidth="520px">
      <BrandMark />

      <ol className="mt-10 flex flex-col gap-5">
        {steps.map((item, index) => {
          const stepNum = (index + 1) as 1 | 2 | 3;
          const isFuture = stepNum > activeStep;
          const isComplete = stepNum < activeStep;
          const isActive = stepNum === activeStep;

          return (
            <li key={item.title} className="flex gap-3.5">
              <span
                className={cn(
                  'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[12px] font-semibold',
                  isActive
                    ? 'bg-white text-[#213D59] ring-2 ring-white/35 ring-offset-2 ring-offset-[#213D59]'
                    : isComplete
                      ? 'bg-[rgba(255,255,255,.22)] text-white'
                      : 'bg-[rgba(255,255,255,.16)] text-white/60',
                )}
                aria-hidden
              >
                {isComplete ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6.2 4.8 8.5 9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  stepNum
                )}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    'm-0 text-[15px] font-semibold leading-snug',
                    isFuture ? 'text-white/60' : 'text-white',
                  )}
                >
                  {item.title}
                </p>
                <p
                  className={cn(
                    'mt-[3px] mb-0 text-[13px] leading-snug',
                    isFuture ? 'text-white/45' : 'text-white/60',
                  )}
                >
                  {item.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-auto mb-0 max-w-[22rem] text-[13px] leading-[1.7] text-white/55">
        {activeStep === 3
          ? 'Your vault is already saving. Choosing a plan only decides how long you keep access after the trial.'
          : 'Your vault is encrypted at rest. Only you and the people you name can ever open it.'}
      </p>
    </BrandAside>
  );
}

function CheckoutBrandPanel({ summary }: { summary: CheckoutOrderSummary }) {
  return (
    <BrandAside contentMaxWidth="520px" wide>
      <BrandMark />

      <div className="mt-auto w-full">
        <p
          className="m-0 font-[family-name:var(--font-family-mono)] text-[11px] font-medium tracking-[0.14em] uppercase"
          style={{ color: 'rgba(255,255,255,.82)' }}
        >
          Your order
        </p>
        <div
          className="mt-5 rounded-2xl border px-6 py-[22px]"
          style={{
            background: 'rgba(255,255,255,.06)',
            borderColor: 'rgba(255,255,255,.12)',
          }}
        >
          <div className="flex items-baseline gap-3">
            <span className="flex-1 text-[16.5px] font-semibold text-white">
              {summary.planLabel}
            </span>
            <span className="font-[family-name:var(--font-family-display)] text-[22px] font-normal leading-none text-white">
              {summary.planPrice}
            </span>
          </div>
          <p
            className="mt-2 mb-0 text-sm"
            style={{ color: 'rgba(255,255,255,.85)' }}
          >
            {summary.planNote}
          </p>

          <div
            className="mt-[18px] flex items-baseline gap-3 border-t pt-4"
            style={{ borderColor: 'rgba(255,255,255,.12)' }}
          >
            <span
              className="flex-1 text-[14.5px]"
              style={{ color: 'rgba(255,255,255,.9)' }}
            >
              Due today
            </span>
            <span className="text-[16.5px] font-semibold text-white">
              {summary.dueToday}
            </span>
          </div>
          <p
            className="mt-2 mb-0 text-[13.5px] leading-snug text-pretty"
            style={{ color: 'rgba(255,255,255,.82)' }}
          >
            {summary.dueNote}
          </p>
        </div>

        <div
          className="mt-[26px] border-t pt-[22px] text-sm leading-[1.7] text-pretty"
          style={{
            borderColor: 'rgba(255,255,255,.14)',
            color: 'rgba(255,255,255,.85)',
          }}
        >
          {summary.footerNote}
        </div>
      </div>
    </BrandAside>
  );
}

export function AuthPortalShell({
  mode,
  signupStep = 1,
  signupSteps = DEFAULT_SIGNUP_STEPS,
  checkoutSummary = null,
  mobileTitle,
  mobileStepLabel,
  mobileSubtitle,
  mobileShowTagline = false,
  mobileChrome = 'brand',
  onMobileBack,
  children,
  className,
}: AuthPortalShellProps) {
  const isResetChrome = mobileChrome === 'reset';
  const isCheckoutChrome = mobileChrome === 'checkout';
  const isPlanChrome = mobileChrome === 'plan';
  const isFillChrome = isPlanChrome || isCheckoutChrome;

  const aside =
    checkoutSummary ? (
      <CheckoutBrandPanel summary={checkoutSummary} />
    ) : mode === 'signup' && !isResetChrome ? (
      <SignupBrandPanel activeStep={signupStep} steps={signupSteps} />
    ) : (
      <LoginBrandPanel />
    );

  return (
    <div
      className={cn(
        'auth-portal flex w-full bg-[#F6F8FA]',
        isFillChrome
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden lg:min-h-[100dvh] lg:h-auto lg:max-h-none lg:overflow-visible'
          : 'min-h-[100dvh]',
        className,
      )}
    >
      {aside}

      <div
        className={cn(
          'flex flex-1 flex-col',
          isFillChrome
            ? 'min-h-0 overflow-hidden lg:min-h-[100dvh] lg:overflow-visible'
            : 'min-h-[100dvh]',
        )}
      >
        {isResetChrome ? (
          <header className="flex h-auto shrink-0 items-center gap-2.5 border-b border-[#e4e6e1] bg-white px-4 pb-3.5 pt-[max(0.5rem,env(safe-area-inset-top))] lg:hidden">
            <button
              type="button"
              onClick={onMobileBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#7688a1] bg-white text-[#213D59]"
              aria-label="Back"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#213D59"
                strokeWidth="2"
                aria-hidden
              >
                <path d="m14 6-6 6 6 6" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-[15px] font-semibold text-[#213D59]">
              Reset password
            </span>
          </header>
        ) : isCheckoutChrome ? (
          <header
            className="h-auto shrink-0 bg-[#213D59] text-white lg:hidden"
            style={{
              paddingTop: 'max(0.875rem, env(safe-area-inset-top))',
              paddingRight: 20,
              paddingBottom: 20,
              paddingLeft: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={onMobileBack}
                aria-label="Back"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="m14 6-6 6 6 6" strokeLinecap="round" />
                </svg>
              </button>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>
                Secure checkout
              </span>
            </div>
            {mobileStepLabel ? (
              <p
                style={{
                  margin: '16px 0 0',
                  font: "500 11px 'IBM Plex Mono', monospace",
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.82)',
                }}
              >
                {mobileStepLabel}
              </p>
            ) : null}
            <h1
              style={{
                margin: '8px 0 0',
                font: '750 25px/1.2 system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
                color: '#fff',
              }}
            >
              {mobileTitle}
            </h1>
          </header>
        ) : (
          <header
            className={cn(
              'h-auto shrink-0 bg-[#213D59] text-white lg:hidden',
              mobileShowTagline
                ? 'px-6 pb-[30px] pt-[max(20px,env(safe-area-inset-top))]'
                : isPlanChrome
                  ? 'px-5 pb-[22px] pt-[max(0.875rem,env(safe-area-inset-top))]'
                  : mobileSubtitle
                    ? 'px-5 pb-7 pt-[max(0.875rem,env(safe-area-inset-top))]'
                    : 'px-5 pb-6 pt-[max(0.875rem,env(safe-area-inset-top))]',
            )}
          >
            <BrandMark compact />
            {mobileStepLabel && !mobileShowTagline ? (
              <p className="mb-0 mt-[18px] font-[family-name:var(--font-family-mono)] text-[11px] font-medium tracking-[0.14em] uppercase text-white/82">
                {mobileStepLabel}
              </p>
            ) : null}
            <h1
              className={cn(
                'm-0 font-[family-name:var(--font-family-display)] font-normal leading-[1.2] text-white',
                mobileShowTagline
                  ? 'mt-[22px] text-[30px]'
                  : isPlanChrome
                    ? 'mt-2 text-[26px]'
                    : 'mt-1.5 max-w-[16ch] text-[26px]',
              )}
            >
              {mobileShowTagline
                ? "A single, trusted place for your life's essentials"
                : mobileTitle}
            </h1>
            {mobileSubtitle && !mobileShowTagline ? (
              <p
                className={cn(
                  'mb-0 mt-2 leading-snug text-white/90',
                  isPlanChrome
                    ? 'max-w-none text-[14.5px] leading-[1.55]'
                    : 'max-w-[34ch] text-[13.5px] text-white/70',
                )}
              >
                {mobileSubtitle}
              </p>
            ) : null}
          </header>
        )}

        <main
          className={cn(
            'flex flex-1 flex-col',
            isFillChrome
              ? 'min-h-0 items-stretch overflow-hidden px-0 py-0 lg:items-start lg:justify-start lg:overflow-visible lg:p-0'
              : isResetChrome
                ? 'items-center justify-start gap-3.5 px-5 py-5 sm:px-8 lg:justify-center lg:gap-6 lg:p-14'
                : 'items-center justify-start gap-3 px-5 py-[18px] sm:px-8 lg:justify-center lg:gap-6 lg:p-14',
          )}
        >
          <div
            className={cn(
              'flex w-full flex-col',
              isFillChrome
                ? 'min-h-0 max-w-none flex-1 gap-0 lg:mx-0 lg:max-w-[880px] lg:flex-none'
                : 'max-w-[520px] flex-1 gap-3.5 lg:flex-none lg:gap-6',
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthCard({
  children,
  className,
  flushOnMobile = false,
  flush = false,
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  flushOnMobile?: boolean;
  /** No card chrome on any breakpoint (paper background, nested cards only). */
  flush?: boolean;
  /** Wider desktop content (plan / payment) — fluid width. */
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        'w-full',
        wide ? 'max-w-[880px]' : 'max-w-[520px]',
        flush
          ? cn(
              'flex min-h-0 flex-1 flex-col rounded-none border-0 bg-transparent p-0 lg:flex-none',
              wide && 'lg:w-full lg:max-w-[880px]',
            )
          : flushOnMobile
            ? cn(
                'flex min-h-0 flex-1 flex-col rounded-none border-0 bg-transparent p-0 lg:block lg:flex-none',
                wide
                  ? 'lg:rounded-[18px] lg:border lg:border-[#7688a1]/35 lg:bg-white lg:px-[52px] lg:py-[44px]'
                  : 'lg:rounded-[18px] lg:border lg:border-[#e4e6e1] lg:bg-white lg:p-[34px]',
              )
            : 'rounded-[18px] border border-[#e4e6e1] bg-white p-[18px] sm:p-[26px] lg:p-[34px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AuthModeToggle({
  isNewUser,
  onChange,
  disabled,
}: {
  isNewUser: boolean;
  onChange: (isNewUser: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="mb-0 flex gap-1 rounded-[12px] bg-[#eceae4] p-1 lg:mb-[26px] lg:bg-[#f2f1ec]"
      role="tablist"
      aria-label="Account mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={!isNewUser}
        disabled={disabled}
        onClick={() => onChange(false)}
        className={cn(
          'flex-1 rounded-[9px] px-3 py-[9px] text-center text-[13.5px] font-medium transition',
          !isNewUser
            ? 'bg-white text-[#213D59] shadow-[0_1px_2px_rgba(33, 61, 89,.08)]'
            : 'text-[#6e7c77]',
        )}
      >
        Sign in
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={isNewUser}
        disabled={disabled}
        onClick={() => onChange(true)}
        className={cn(
          'flex-1 rounded-[9px] px-3 py-[9px] text-center text-[13.5px] font-medium transition',
          isNewUser
            ? 'bg-white text-[#213D59] shadow-[0_1px_2px_rgba(33, 61, 89,.08)]'
            : 'text-[#6e7c77]',
        )}
      >
        Create account
      </button>
    </div>
  );
}

export function AuthFieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[12px] font-medium text-[#5c6b66] lg:mb-[6px] lg:text-[12.5px]"
    >
      {children}
    </label>
  );
}

export function PasswordStrengthBars({
  score,
  hint,
}: {
  score: number;
  hint?: string;
}) {
  const filled = Math.min(4, Math.max(0, Math.ceil((score / 5) * 4)));
  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-[5px]">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-sm',
              i < filled ? 'bg-[#2B5A8C]' : 'bg-[#e4e6e1]',
            )}
          />
        ))}
      </div>
      {hint ? (
        <p className="m-0 text-[12.5px] text-[#6e7c77]">{hint}</p>
      ) : null}
    </div>
  );
}
