'use client';

import React, { createContext, useContext } from 'react';

type AiActiveSectionValue = {
  sectionId: string | null;
  subsectionId: string | null;
};

const AiActiveSectionContext = createContext<AiActiveSectionValue>({
  sectionId: null,
  subsectionId: null,
});

export function AiActiveSectionProvider({
  sectionId,
  subsectionId = null,
  children,
}: {
  sectionId: string | null;
  subsectionId?: string | null;
  children: React.ReactNode;
}) {
  return (
    <AiActiveSectionContext.Provider
      value={{ sectionId, subsectionId: subsectionId ?? null }}
    >
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
