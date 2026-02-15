'use client';

import React, { createContext, useContext, useState } from 'react';

type Role = 'owner' | 'nextkin';

interface OnboardingContextType {
  startTour: (role: Role) => void;
  stopTour: () => void;
  activeRole: Role | null;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const OnboardingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeRole, setActiveRole] = useState<Role | null>(null);

  const startTour = (role: Role) => {
    setActiveRole(role);
  };

  const stopTour = () => {
    setActiveRole(null);
    localStorage.setItem('onboarding_completed', 'true');
  };

  return (
    <OnboardingContext.Provider value={{ startTour, stopTour, activeRole }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be inside OnboardingProvider');
  return ctx;
};
