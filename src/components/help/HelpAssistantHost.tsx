'use client';

import React, { useEffect } from 'react';
import {
  HelpAssistantFab,
  HelpAssistantPanel,
} from '@/components/help/HelpAssistantPanel';
import {
  useHelpAssistant,
  useOptionalHelpAssistant,
} from '@/components/help/HelpAssistantContext';
import { useVaultFillGaps } from '@/components/vault/VaultFillGapsContext';
import { AI_SECTION_BY_ID } from '@/utils/aiSectionRegistry';

type HelpAssistantHostProps = {
  currentSectionId?: string | null;
  formData?: Record<string, unknown>;
  onStartTour: () => void;
  onNavigateToSection: (sectionId: string) => void;
  onFocusUpload: () => void;
};

function HelpVaultContextSync({
  currentSectionId,
  formData,
}: {
  currentSectionId?: string | null;
  formData?: Record<string, unknown>;
}) {
  const { setVaultContext } = useHelpAssistant();
  useEffect(() => {
    setVaultContext({
      currentSectionId: currentSectionId ?? null,
      formData,
    });
  }, [currentSectionId, formData, setVaultContext]);
  return null;
}

/**
 * Owner Contact Support / AI assistant (sidebar + FAB).
 */
export function HelpAssistantHost({
  currentSectionId,
  formData,
  onStartTour,
  onNavigateToSection,
  onFocusUpload,
}: HelpAssistantHostProps) {
  const fillGaps = useVaultFillGaps();

  const onShowEmptyFields = (sectionId: string, label: string) => {
    const subsectionId =
      AI_SECTION_BY_ID[sectionId]?.defaultSubsection || `${sectionId}A`;
    fillGaps?.openFillGaps({
      sectionId,
      subsectionId,
      title: `Empty fields · ${label}`,
    });
  };

  return (
    <>
      <HelpVaultContextSync
        currentSectionId={currentSectionId}
        formData={formData}
      />
      <HelpAssistantPanel
        currentSectionId={currentSectionId}
        formData={formData}
        onStartTour={onStartTour}
        onNavigateToSection={onNavigateToSection}
        onFocusUpload={onFocusUpload}
        onShowEmptyFields={onShowEmptyFields}
      />
      <HelpAssistantFab />
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
