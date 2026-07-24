'use client';

import React, { createContext, useContext } from 'react';

const AiActiveSectionContext = createContext<string | null>(null);

export function AiActiveSectionProvider({
  sectionId,
  children,
}: {
  sectionId: string | null;
  children: React.ReactNode;
}) {
  return (
    <AiActiveSectionContext.Provider value={sectionId}>
      {children}
    </AiActiveSectionContext.Provider>
  );
}

export function useAiActiveSectionId() {
  return useContext(AiActiveSectionContext);
}
