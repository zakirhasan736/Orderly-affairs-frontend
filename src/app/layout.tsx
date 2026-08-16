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
        {nonce ? <meta property="csp-nonce" content={nonce} /> : null}
      </head>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
