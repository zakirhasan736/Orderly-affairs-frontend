'use client';

import { cn } from '@common/ui/utils';

type BrandDangerConfirmProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  checkboxLabel?: string;
  checkboxChecked?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  passwordLabel?: string;
  passwordValue?: string;
  onPasswordChange?: (value: string) => void;
  passwordError?: string;
};

function WarningGlyph({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[#fbeceb] text-[#b4483f]',
        className,
      )}
      aria-hidden
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16.5v.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/**
 * Brand-styled destructive confirm dialog (access removal, deletes, etc.).
 * Fluid width — no fixed mock widths.
 */
export function BrandDangerConfirm({
  open,
  title,
  description,
  confirmLabel = 'Remove',
  cancelLabel = 'Keep access',
  checkboxLabel,
  checkboxChecked = false,
  onCheckboxChange,
  onConfirm,
  onCancel,
  busy = false,
  passwordLabel,
  passwordValue = '',
  onPasswordChange,
  passwordError,
}: BrandDangerConfirmProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(33,61,89,0.05)] p-4 sm:p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="brand-danger-title"
        aria-describedby="brand-danger-desc"
        className={cn(
          'w-full max-w-[min(100%,26rem)] rounded-2xl bg-white p-6',
          'shadow-[0_20px_50px_rgba(33, 61, 89,0.24)]',
        )}
      >
        <WarningGlyph />
        <h3
          id="brand-danger-title"
          className="mt-4 mb-0 text-[17px] font-semibold text-[#213D59]"
        >
          {title}
        </h3>
        <p
          id="brand-danger-desc"
          className="mt-2.5 mb-0 text-[13.5px] leading-relaxed text-[#5c6b66]"
        >
          {description}
        </p>

        {checkboxLabel ? (
          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[13px] text-[#3c4a46]">
            <input
              type="checkbox"
              checked={checkboxChecked}
              onChange={e => onCheckboxChange?.(e.target.checked)}
              className="mt-0.5 h-[17px] w-[17px] shrink-0 rounded-[5px] border-[1.5px] border-[#cfd8d4] accent-[#213D59]"
            />
            <span>{checkboxLabel}</span>
          </label>
        ) : null}

        {passwordLabel ? (
          <div className="mt-4 space-y-1.5">
            <label className="text-[13px] font-medium text-[#3c4a46]">
              {passwordLabel}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={passwordValue}
              onChange={e => onPasswordChange?.(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#e4e6e1] px-3 text-[13.5px] text-[#213D59] outline-none focus:border-[#213D59]"
            />
            {passwordError ? (
              <p className="text-[12px] text-[#b4483f]">{passwordError}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-[42px] flex-1 rounded-[21px] border border-[#e4e6e1] bg-white text-[13px] font-medium text-[#213D59] transition hover:bg-[#F6F8FA] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={
              busy ||
              Boolean(checkboxLabel && !checkboxChecked) ||
              Boolean(passwordLabel && !passwordValue.trim())
            }
            onClick={onConfirm}
            className="h-[42px] flex-1 rounded-[21px] border-0 bg-[#b4483f] text-[13px] font-medium text-white transition hover:bg-[#9a3c35] disabled:opacity-50"
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
