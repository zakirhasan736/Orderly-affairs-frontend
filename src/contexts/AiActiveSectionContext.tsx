'use client';

import React, { createContext, useContext, useMemo } from 'react';

type AiActiveSectionValue = {
  sectionId: string | null;
  subsectionId: string | null;
  /** Current section form bucket for attachment galleries / progress. */
  sectionData: Record<string, unknown> | null;
};

const AiActiveSectionContext = createContext<AiActiveSectionValue>({
  sectionId: null,
  subsectionId: null,
  sectionData: null,
});

export function AiActiveSectionProvider({
  sectionId,
  subsectionId = null,
  sectionData = null,
  children,
}: {
  sectionId: string | null;
  subsectionId?: string | null;
  sectionData?: Record<string, unknown> | null;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      sectionId,
      subsectionId: subsectionId ?? null,
      sectionData: sectionData ?? null,
    }),
    [sectionId, subsectionId, sectionData],
  );

  return (
    <AiActiveSectionContext.Provider value={value}>
      {children}
    </AiActiveSectionContext.Provider>
  );
}

export function useAiActiveSectionId() {
  return useContext(AiActiveSectionContext).sectionId;
}

export function useAiActiveSubsectionId() {
  return useContext(AiActiveSectionContext).subsectionId;
}

export function useAiActiveSectionData() {
  return useContext(AiActiveSectionContext).sectionData;
}
