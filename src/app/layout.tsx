'use client';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import AppInitializer from '@/components/AppInitializer';
import { Toaster } from '@/components/common/ui/sonner';
import { OnboardingProvider } from '@/onboarding/components/OnboardingProvider';
import '@/styles/styles.css';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <AppInitializer />
          <OnboardingProvider>{children}</OnboardingProvider>
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}
