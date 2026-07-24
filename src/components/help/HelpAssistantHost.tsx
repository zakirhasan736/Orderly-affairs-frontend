'use client';

import React from 'react';
import {
  HelpAssistantFab,
  HelpAssistantPanel,
} from '@/components/help/HelpAssistantPanel';
import { useOptionalHelpAssistant } from '@/components/help/HelpAssistantContext';

type HelpAssistantHostProps = {
  currentSectionId?: string | null;
  onStartTour: () => void;
  onNavigateToSection: (sectionId: string) => void;
  onFocusUpload: () => void;
};

export function HelpAssistantHost({
  currentSectionId,
  onStartTour,
  onNavigateToSection,
  onFocusUpload,
}: HelpAssistantHostProps) {
  return (
    <>
      <HelpAssistantFab />
      <HelpAssistantPanel
        currentSectionId={currentSectionId}
        onStartTour={onStartTour}
        onNavigateToSection={onNavigateToSection}
        onFocusUpload={onFocusUpload}
      />
    </>
  );
}

export function HelpOpenButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const help = useOptionalHelpAssistant();
  return (
    <button
      type="button"
      className={className}
      onClick={() => help?.openHelp({ mode: 'chat' })}
    >
      {children}
    </button>
  );
}
