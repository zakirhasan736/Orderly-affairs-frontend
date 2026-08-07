import type { Metadata } from 'next';
import TermsOfServiceView from '@/components/legal/TermsOfServiceView';

export const metadata: Metadata = {
  title: 'Terms of Service | Orderly Affairs',
  description:
    'Terms of Service for Orderly Affairs Digital, LLC — website, web app, and mobile app.',
};

export default function TermsOfServicesPage() {
  return <TermsOfServiceView />;
}
