import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const alertVariants = cva(
  "relative w-full rounded-[13px] border p-4 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-1 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-[#2c7a63] bg-[#f7f9fc] text-[#2b5a8c] [&>svg]:text-[#2b5a8c] *:data-[slot=alert-description]:text-[#2b5a8c]",
        info:
          "border-[#2c7a63] bg-[#f7f9fc] text-[#2b5a8c] [&>svg]:text-[#2b5a8c] *:data-[slot=alert-description]:text-[#2b5a8c]",
        warning:
          "border-[#9a7326] bg-[#fff3dd] text-[#7a5a1c] [&>svg]:text-[#6d4d15] *:data-[slot=alert-description]:text-[#6d4d15]",
        destructive:
          "border-[#a2453c] bg-[#fbeceb] text-[#8e372f] [&>svg]:text-[#b4483f] *:data-[slot=alert-description]:text-[#b4483f]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 min-h-4 text-[14.5px] font-semibold leading-snug tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-[13.5px] leading-[1.5] [&_p]:leading-[1.5]",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
