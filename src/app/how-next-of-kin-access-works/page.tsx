import type { Metadata } from 'next';
import HowNextOfKinAccessWorksPublicView from '@/components/legal/HowNextOfKinAccessWorksPublicView';

export const metadata: Metadata = {
  title: 'How Next-of-Kin Access Works | Orderly Affairs',
  description:
    'Your Vault stays private while you are living. After you pass, access is released only after verification — and nobody is handed your password.',
};

export default function HowNextOfKinAccessWorksPage() {
  return <HowNextOfKinAccessWorksPublicView />;
}
