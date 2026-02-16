'use client';

import React, { createContext, useContext, useState } from 'react';

type Role = 'owner' | 'nextkin';

interface ContextType {
  activeRole: Role | null;
  startTour: (role: Role) => void;
  stopTour: () => void;
}

const Context = createContext<ContextType | null>(null);

export const OnboardingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeRole, setActiveRole] = useState<Role | null>(null);

  const startTour = (role: Role) => setActiveRole(role);
  const stopTour = () => setActiveRole(null);

  return (
    <Context.Provider value={{ activeRole, startTour, stopTour }}>
      {children}
    </Context.Provider>
  );
};

export const useOnboarding = () => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('Must wrap in OnboardingProvider');
  return ctx;
};
