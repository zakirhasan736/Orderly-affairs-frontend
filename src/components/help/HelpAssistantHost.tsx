'use client';

import React from 'react';
import { useOptionalHelpAssistant } from '@/components/help/HelpAssistantContext';

type HelpAssistantHostProps = {
  currentSectionId?: string | null;
  onStartTour: () => void;
  onNavigateToSection: (sectionId: string) => void;
  onFocusUpload: () => void;
};

/**
 * Contact / live-support UI is hidden for now.
 * Keep the host mounted so optional help context hooks stay safe.
 */
export function HelpAssistantHost(_props: HelpAssistantHostProps) {
  return null;
}

export function HelpOpenButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const help = useOptionalHelpAssistant();
  // Support popup disabled — keep a no-op button for layout callers.
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void help;
      }}
      aria-hidden
      tabIndex={-1}
      style={{ display: 'none' }}
    >
      {children}
    </button>
  );
}
