import type { Metadata } from 'next';
import InstructionsForNextOfKinPageView from '@/components/legal/InstructionsForNextOfKinView';

export const metadata: Metadata = {
  title: 'Instructions for Your Next of Kin | Orderly Affairs',
  description:
    'What being named as next of kin means, what to do now, and how Vault access is released after verification.',
};

export default function NextKinInstructionsPage() {
  return <InstructionsForNextOfKinPageView />;
}
