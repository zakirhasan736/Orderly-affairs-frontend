'use client';

import React, { createContext, useContext } from 'react';
import {
  useDashboardAiBatchRunner,
  type DashboardAiJob,
} from '@/hooks/useDashboardAiBatchRunner';

type DashboardAiBatchContextValue = ReturnType<typeof useDashboardAiBatchRunner>;

const DashboardAiBatchContext =
  createContext<DashboardAiBatchContextValue | null>(null);

/**
 * Keeps overview AI upload jobs alive across section navigation so the
 * progress ring/percent still shows when the user returns to Overview.
 */
export function DashboardAiBatchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useDashboardAiBatchRunner();
  return (
    <DashboardAiBatchContext.Provider value={value}>
      {children}
    </DashboardAiBatchContext.Provider>
  );
}

export function useDashboardAiBatch(): DashboardAiBatchContextValue {
  const value = useContext(DashboardAiBatchContext);
  if (!value) {
    throw new Error(
      'useDashboardAiBatch must be used within DashboardAiBatchProvider',
    );
  }
  return value;
}

export function useOptionalDashboardAiBatch(): DashboardAiBatchContextValue | null {
  return useContext(DashboardAiBatchContext);
}

export type { DashboardAiJob };
