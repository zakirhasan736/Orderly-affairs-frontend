import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, Info } from 'lucide-react';

import { cn } from './utils';

const inlineNoticeVariants = cva(
  'flex w-full items-start gap-3 rounded-[13px] border p-4',
  {
    variants: {
      variant: {
        warning: 'border-[#9a7326] bg-[#fff3dd]',
        danger: 'border-[#a2453c] bg-[#fbeceb]',
        info: 'border-[#2c7a63] bg-[#f7f9fc]',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
);

const iconClass: Record<NonNullable<VariantProps<typeof inlineNoticeVariants>['variant']>, string> =
  {
    warning: 'text-[#6d4d15]',
    danger: 'text-[#b4483f]',
    info: 'text-[#2b5a8c]',
  };

const titleClass: Record<NonNullable<VariantProps<typeof inlineNoticeVariants>['variant']>, string> =
  {
    warning: 'text-[#7a5a1c]',
    danger: 'text-[#8e372f]',
    info: 'text-[#2b5a8c]',
  };

const bodyClass: Record<NonNullable<VariantProps<typeof inlineNoticeVariants>['variant']>, string> =
  {
    warning: 'text-[#6d4d15]',
    danger: 'text-[#b4483f]',
    info: 'text-[#2b5a8c]',
  };

export type InlineNoticeProps = React.ComponentProps<'div'> &
  VariantProps<typeof inlineNoticeVariants> & {
    title: React.ReactNode;
    description?: React.ReactNode;
    icon?: React.ReactNode;
  };

function InlineNotice({
  className,
  variant = 'info',
  title,
  description,
  icon,
  role,
  ...props
}: InlineNoticeProps) {
  const tone = variant ?? 'info';
  const DefaultIcon = tone === 'info' ? Info : AlertTriangle;

  return (
    <div
      data-slot="inline-notice"
      role={role ?? (tone === 'info' ? 'status' : 'alert')}
      className={cn(inlineNoticeVariants({ variant: tone }), className)}
      {...props}
    >
      <span className={cn('mt-0.5 flex-none', iconClass[tone])} aria-hidden>
        {icon ?? <DefaultIcon className="size-4" strokeWidth={2.2} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('m-0 text-[14.5px] font-semibold leading-snug', titleClass[tone])}>
          {title}
        </p>
        {description ? (
          <p
            className={cn(
              'm-0 mt-1 text-[13.5px] leading-[1.5]',
              bodyClass[tone],
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export { InlineNotice, inlineNoticeVariants };
