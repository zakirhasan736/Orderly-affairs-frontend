'use client';

import { BRAND_LOGO, BRAND_MARK_LIGHT } from '@/constants/brand';
import { cn } from '@common/ui/utils';

/** Same-origin public file: `public/images/brand-logo.png`. */
export const BRAND_LOGO_SRC = BRAND_LOGO;

export function BrandLogo({
  className,
  size = 36,
  alt = 'Orderly Affairs',
}: {
  className?: string;
  size?: number;
  alt?: string;
}) {
  return (
    // Native img so login/email surfaces do not depend on /_next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_LOGO_SRC}
      alt={alt}
      width={size}
      height={size}
      className={cn('object-contain', className)}
      onError={e => {
        const el = e.currentTarget;
        if (el.dataset.fallback === '1') return;
        el.dataset.fallback = '1';
        el.src = BRAND_MARK_LIGHT;
        el.className = cn('object-contain brightness-0', className);
      }}
    />
  );
}
