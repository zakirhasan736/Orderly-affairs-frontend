'use client';

import type { ReactNode } from 'react';
import { cn } from '@common/ui/utils';

export type BrandSuccessVariant = 'celebration' | 'confirm' | 'export';

export type BrandSuccessAction = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'outline';
};

type BrandSuccessScreenProps = {
  open: boolean;
  variant?: BrandSuccessVariant;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  primaryAction?: BrandSuccessAction;
  secondaryAction?: BrandSuccessAction;
  onClose: () => void;
  className?: string;
};

function CheckGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden
    >
      <path
        d="m5 13 4 4L19 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" />
    </svg>
  );
}

function DownloadGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden
    >
      <path
        d="M12 16V6m0 0-4 4m4-4 4 4M5 19h14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SuccessIcon({
  variant,
  icon,
}: {
  variant: BrandSuccessVariant;
  icon?: ReactNode;
}) {
  const isHero = variant === 'celebration';
  const tone =
    variant === 'export' ? 'text-[#5a6b80]' : 'text-[#2b5a8c]';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-[#e7eef7]',
        isHero ? 'h-14 w-14' : 'h-12 w-12',
        tone,
      )}
      aria-hidden
    >
      {icon ??
        (variant === 'celebration' ? (
          <CheckGlyph size={24} />
        ) : variant === 'export' ? (
          <DownloadGlyph />
        ) : (
          <MailGlyph />
        ))}
    </span>
  );
}

function ActionButton({
  action,
  busy,
}: {
  action: BrandSuccessAction;
  busy?: boolean;
}) {
  const isPrimary = (action.variant ?? 'primary') === 'primary';

  return (
    <button
      type="button"
      disabled={busy}
      onClick={action.onClick}
        className={cn(
          'min-w-[7.5rem] rounded-[21px] px-5 font-[family-name:var(--font-family)] text-[14px] font-medium transition disabled:opacity-50',
          isPrimary
            ? 'h-[42px] border-0 bg-[#213d59] text-white hover:bg-[#1a3148]'
            : 'h-[42px] border border-[#7688a1] bg-white text-[#213d59] hover:bg-[#f5f8fc]',
        )}
    >
      {action.label}
    </button>
  );
}

/**
 * Brand success popups — celebration (kit ready), confirm (invite sent), export ready.
 */
export function BrandSuccessScreen({
  open,
  variant = 'confirm',
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  onClose,
  className,
}: BrandSuccessScreenProps) {
  if (!open) return null;

  const isHero = variant === 'celebration';
  const actions = [secondaryAction, primaryAction].filter(
    Boolean,
  ) as BrandSuccessAction[];

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(33,61,89,0.45)] p-4 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-success-title"
        aria-describedby={description ? 'brand-success-desc' : undefined}
        className={cn(
          'w-full max-w-[min(100%,28rem)] rounded-2xl border border-[#7688a1] bg-white text-center shadow-[0_20px_50px_rgba(33,61,89,0.24)]',
          isHero ? 'px-[30px] py-9' : 'p-[30px]',
          className,
        )}
        onClick={event => event.stopPropagation()}
      >
        <SuccessIcon variant={variant} icon={icon} />

        <h2
          id="brand-success-title"
          className={cn(
            'mb-0 text-[#213D59]',
            isHero
              ? 'mt-5 font-[family-name:var(--font-family-display)] text-[26px] font-normal leading-[1.25]'
              : 'mt-4 text-[19px] font-semibold leading-snug',
          )}
        >
          {title}
        </h2>

        {description ? (
          <p
            id="brand-success-desc"
            className={cn(
              'mb-0 text-[#5a6b80]',
              isHero
                ? 'mt-3 text-[15px] leading-[1.65]'
                : 'mt-2.5 text-[14.5px] leading-[1.6]',
            )}
          >
            {description}
          </p>
        ) : null}

        {actions.length > 0 ? (
          <div
            className={cn(
              'flex flex-wrap items-center justify-center gap-2.5',
              isHero ? 'mt-[22px]' : 'mt-[18px]',
            )}
          >
            {actions.map(action => (
              <ActionButton key={action.label} action={action} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
