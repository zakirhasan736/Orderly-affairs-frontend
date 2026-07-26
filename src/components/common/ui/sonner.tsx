'use client';

import type { CSSProperties } from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
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

function WarnIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden
    >
      <path d="M12 8v5M12 16.5v.5" strokeLinecap="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden
    >
      <path d="M8 8l8 8M16 8l-8 8" strokeLinecap="round" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <span
      className="oa-toast-spinner"
      aria-hidden
    />
  );
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-right"
      closeButton
      gap={12}
      offset={{ top: '1rem', right: '1rem' }}
      mobileOffset={{
        top: 'max(1rem, env(safe-area-inset-top))',
        right: '1rem',
        left: '1rem',
      }}
      className="toaster group oa-toaster"
      icons={{
        success: <CheckIcon />,
        info: <CheckIcon />,
        warning: <WarnIcon />,
        error: <ErrorIcon />,
        loading: <LoadingIcon />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'oa-toast',
          title: 'oa-toast-title',
          description: 'oa-toast-description',
          icon: 'oa-toast-icon',
          closeButton: 'oa-toast-close',
          success: 'oa-toast--success',
          error: 'oa-toast--error',
          warning: 'oa-toast--warning',
          info: 'oa-toast--info',
          loading: 'oa-toast--loading',
        },
      }}
      style={
        {
          zIndex: 200,
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
