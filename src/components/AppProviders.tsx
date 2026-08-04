'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import AppInitializer from '@/components/AppInitializer';
import { Toaster } from '@/components/common/ui/sonner';
import { OnboardingProvider } from '@/onboarding/components/OnboardingProvider';

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AppInitializer />
      <OnboardingProvider>{children}</OnboardingProvider>
      <Toaster />
    </Provider>
  );
}
