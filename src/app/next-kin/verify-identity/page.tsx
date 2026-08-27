import type { Metadata } from 'next';
import { Suspense } from 'react';
import DiditVerifyIdentityView, {
  DiditVerifyIdentityFallback,
} from '@/components/DiditVerifyIdentityView';

export const metadata: Metadata = {
  title: 'Identity verification | Orderly Affairs',
  description: 'Result of your next-of-kin identity check.',
};

export default function NextKinVerifyIdentityPage() {
  return (
    <Suspense fallback={<DiditVerifyIdentityFallback />}>
      <DiditVerifyIdentityView />
    </Suspense>
  );
}
