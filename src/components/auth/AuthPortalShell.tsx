'use client';

import { cn } from '@common/ui/utils';
import { BRAND_LOGO } from '@/constants/brand';

export type AuthPortalMode = 'login' | 'signup';

type SignupStepMeta = {
  title: string;
  description: string;
};

const DEFAULT_SIGNUP_STEPS: SignupStepMeta[] = [
  {
    title: 'Create your account',
    description: 'Email and a password',
  },
  {
    title: 'Secure it',
    description: 'Authenticator app, email, or SMS',
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
  mobileTitle: string;
  mobileStepLabel?: string;
  mobileSubtitle?: string;
  mobileShowTagline?: boolean;
  /** Mobile top chrome: brand ink banner vs reset white bar */
  mobileChrome?: 'brand' | 'reset';
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
          'flex shrink-0 items-center justify-center bg-white',
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
        />
      </div>
      <span
        className={cn(
          'font-semibold tracking-[-0.01em] text-white',
          compact ? 'text-[14px]' : 'text-[15px]',
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
}: {
  children: React.ReactNode;
  contentMaxWidth?: string;
}) {
  return (
    <aside className="relative hidden min-h-[100dvh] w-[44%] bg-[#132b26] text-white lg:flex xl:w-[42%]">
      <div
        className="ml-auto flex h-full w-full flex-col p-11"
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
      <BrandMark />

      <div className="mt-auto max-w-[34ch]">
        <h2 className="m-0 font-[family-name:var(--font-family-serif)] text-[44px] font-normal leading-[1.12] text-white">
          One place, so nobody has to guess.
        </h2>
        <p
          className="mt-6 mb-0 text-[16.5px] leading-[1.7] text-pretty"
          style={{ color: 'rgba(255,255,255,.72)' }}
        >
          Your accounts, documents, wishes and letters — private while you&apos;re
          here, and handed to the right people when you&apos;re not.
        </p>
      </div>

      <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[12px] tracking-[-0.01em] text-white/40">
        <li>Encrypted at rest</li>
        <li>SOC 2 hosting</li>
        <li>You choose who opens it</li>
      </ul>
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
                    ? 'bg-white text-[#132b26]'
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

export function AuthPortalShell({
  mode,
  signupStep = 1,
  signupSteps = DEFAULT_SIGNUP_STEPS,
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

  return (
    <div
      className={cn(
        'auth-portal flex min-h-[100dvh] w-full bg-[#f7f6f2]',
        className,
      )}
    >
      {mode === 'signup' && !isResetChrome ? (
        <SignupBrandPanel activeStep={signupStep} steps={signupSteps} />
      ) : (
        <LoginBrandPanel />
      )}

      <div className="flex min-h-[100dvh] flex-1 flex-col">
        {isResetChrome ? (
          <header className="flex h-auto shrink-0 items-center gap-2.5 border-b border-[#e4e6e1] bg-white px-4 pb-3.5 pt-[max(0.5rem,env(safe-area-inset-top))] lg:hidden">
            <button
              type="button"
              onClick={onMobileBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#e4e6e1]"
              aria-label="Back"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3c4a46"
                strokeWidth="2"
                aria-hidden
              >
                <path d="m14 6-6 6 6 6" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-[15px] font-semibold text-[#132b26]">
              Reset password
            </span>
          </header>
        ) : (
          <header
            className={cn(
              'h-auto bg-[#132b26] text-white lg:hidden',
              mobileShowTagline
                ? 'px-6 pb-[30px] pt-[max(20px,env(safe-area-inset-top))]'
                : mobileSubtitle
                  ? 'px-5 pb-7 pt-[max(0.875rem,env(safe-area-inset-top))]'
                  : 'px-5 pb-6 pt-[max(0.875rem,env(safe-area-inset-top))]',
            )}
          >
            <BrandMark compact />
            {mobileStepLabel && !mobileShowTagline ? (
              <p className="mb-0 mt-[18px] text-[11px] font-medium tracking-[0.14em] text-white/60">
                {mobileStepLabel}
              </p>
            ) : null}
            <h1
              className={cn(
                'm-0 font-[family-name:var(--font-family-serif)] font-normal leading-[1.2] text-white',
                mobileShowTagline
                  ? 'mt-[22px] text-[30px]'
                  : 'mt-1.5 max-w-[16ch] text-[26px]',
              )}
            >
              {mobileShowTagline
                ? 'One place, so nobody has to guess.'
                : mobileTitle}
            </h1>
            {mobileSubtitle && !mobileShowTagline ? (
              <p className="mb-0 mt-2 max-w-[34ch] text-[13.5px] leading-snug text-white/70">
                {mobileSubtitle}
              </p>
            ) : null}
          </header>
        )}

        <main
          className={cn(
            'flex flex-1 flex-col items-center px-5 sm:px-8 lg:justify-center lg:gap-6 lg:p-14',
            isResetChrome
              ? 'justify-start gap-3.5 py-5'
              : 'justify-start gap-3 py-[18px]',
          )}
        >
          <div className="flex w-full max-w-[520px] flex-1 flex-col gap-3.5 lg:flex-none lg:gap-6">
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
}: {
  children: React.ReactNode;
  className?: string;
  flushOnMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        'w-full max-w-[520px]',
        flushOnMobile
          ? 'rounded-none border-0 bg-transparent p-0 lg:rounded-[18px] lg:border lg:border-[#e4e6e1] lg:bg-white lg:p-[34px]'
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
            ? 'bg-white text-[#132b26] shadow-[0_1px_2px_rgba(19,43,38,.08)]'
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
            ? 'bg-white text-[#132b26] shadow-[0_1px_2px_rgba(19,43,38,.08)]'
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
              i < filled ? 'bg-[#2e7d6e]' : 'bg-[#e4e6e1]',
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
