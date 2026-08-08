'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { InlineNotice } from '@/components/common/ui/inline-notice';
import { cn } from '@common/ui/utils';

/**
 * Shows a one-shot banner when redirected with ?session=expired,
 * then strips the query so a refresh does not keep flashing it.
 */
export function SessionExpiredNotice({
  className,
  description = 'For your security we signed you out. Sign in again to continue.',
}: {
  className?: string;
  description?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') !== 'expired') return;
    setVisible(true);
    params.delete('session');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname]);

  if (!visible) return null;

  return (
    <InlineNotice
      variant="warning"
      className={cn(className)}
      title="Session expired"
      description={description}
    />
  );
}
