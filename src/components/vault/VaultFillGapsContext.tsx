'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  IncompleteFieldsFillDialog,
  type FillGapsTarget,
} from '@/components/vault/IncompleteFieldsFillDialog';

type OpenFillGapsArgs = {
  sectionId: string;
  subsectionId: string;
  itemIndex?: number;
  groupId?: string;
  title: string;
  /** Prefer opening on empty fields or the full area (already filled). */
  initialTab?: 'empty' | 'area';
};

type VaultFillGapsContextValue = {
  openFillGaps: (args: OpenFillGapsArgs) => void;
};

const VaultFillGapsContext = createContext<VaultFillGapsContextValue | null>(
  null,
);

export function useVaultFillGaps() {
  return useContext(VaultFillGapsContext);
}

export function VaultFillGapsProvider({
  formData,
  updateSectionData,
  children,
}: {
  formData: Record<string, unknown>;
  updateSectionData: (sectionId: string, data: Record<string, unknown>) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<FillGapsTarget | null>(null);

  const openFillGaps = useCallback(
    (args: OpenFillGapsArgs) => {
      const sectionData = formData[args.sectionId] as
        | Record<string, unknown>
        | undefined;
      setTarget({
        sectionId: args.sectionId,
        subsectionId: args.subsectionId,
        itemIndex: args.itemIndex,
        groupId: args.groupId,
        title: args.title,
        initialTab: args.initialTab,
        sectionData,
        onApplySectionData: next => {
          updateSectionData(args.sectionId, next);
        },
      });
      setOpen(true);
    },
    [formData, updateSectionData],
  );

  // Keep sectionData fresh when dialog is open
  const liveTarget =
    target && open
      ? {
          ...target,
          sectionData: formData[target.sectionId] as
            | Record<string, unknown>
            | undefined,
          onApplySectionData: (next: Record<string, unknown>) => {
            updateSectionData(target.sectionId, next);
          },
        }
      : target;

  return (
    <VaultFillGapsContext.Provider value={{ openFillGaps }}>
      {children}
      <IncompleteFieldsFillDialog
        open={open}
        onOpenChange={setOpen}
        target={liveTarget}
      />
    </VaultFillGapsContext.Provider>
  );
}
