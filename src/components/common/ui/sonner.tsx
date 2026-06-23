"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      offset={{ top: "1rem", right: "1rem" }}
      mobileOffset={{ top: "max(1rem, env(safe-area-inset-top))", right: "1rem" }}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          zIndex: 100,
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
