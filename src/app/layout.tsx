import type { Metadata } from 'next';
import { headers } from 'next/headers';
import AppProviders from '@/components/AppProviders';
import '@/styles/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Orderly Affairs',
  description: 'Secure end-of-life vault and next-of-kin access',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const nonce = headerStore.get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&family=Poppins:wght@400;600&display=swap"
          rel="stylesheet"
        />
        {nonce ? <meta property="csp-nonce" content={nonce} /> : null}
      </head>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
