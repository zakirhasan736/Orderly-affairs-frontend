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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&family=Poppins:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
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
