import * as React from 'react';

import { cn } from './utils';

/**
 * React 19: `ref` is a regular prop (do not use forwardRef — it breaks under
 * React Compiler as "Component is not a function").
 */
function Input({
  className,
  type,
  ref,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-11 w-full min-w-0 rounded-[12px] border px-3 py-5 text-[15px] bg-white transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
