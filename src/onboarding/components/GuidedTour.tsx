'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import { ownerTour, type OwnerTourStep } from '@/onboarding/config/ownerTour';
import {
  nextKinTour,
  type NextKinTourStep,
} from '@/onboarding/config/nextKinTour';
import { SpotlightOverlay } from './SpotlightOverlay';
import { useOnboarding } from './OnboardingProvider';
import { useUpdateTourStatusMutation } from '@/services/onboardingApi';
import { cn } from '@common/ui/utils';

type TourStep = OwnerTourStep | NextKinTourStep;

type Props = {
  role: 'owner' | 'nextkin';
  activeSection: string;
  setActiveSection: (section: string) => void;
};

function getEnsureSection(step: TourStep): string | undefined {
  if (
    'ensureSection' in step &&
    typeof (step as OwnerTourStep).ensureSection === 'string'
  ) {
    return (step as OwnerTourStep).ensureSection;
  }
  return undefined;
}

export const GuidedTour = ({
  role,
  activeSection,
  setActiveSection,
}: Props) => {
  const { stopTour } = useOnboarding();
  const [updateStatus] = useUpdateTourStatusMutation();
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const steps: TourStep[] = role === 'owner' ? ownerTour : nextKinTour;
  const step = steps[index];
  const total = steps.length;

  // Keep the right screen visible for each step (overview targets need dashboard).
  useEffect(() => {
    if (!step) return;

    const ensureSection = getEnsureSection(step);

    if (ensureSection && activeSection !== ensureSection) {
      setReady(false);
      setActiveSection(ensureSection);
      return;
    }

    // Section is correct — mount overlay. SpotlightOverlay hides the tooltip
    // until the target has finished scrolling into place (avoids mid-scroll flicker).
    setReady(true);
  }, [activeSection, setActiveSection, step]);

  const finish = useCallback(async () => {
    await updateStatus({ has_completed: true });
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#213D59', '#2B5A8C', '#f5f8fc', '#e7eef7'],
    });
    stopTour();
  }, [stopTour, updateStatus]);

  const next = useCallback(async () => {
    if (index + 1 >= total) {
      await finish();
      return;
    }
    setIndex(i => i + 1);
  }, [finish, index, total]);

  const back = useCallback(() => {
    if (index > 0) setIndex(i => i - 1);
  }, [index]);

  const skip = useCallback(async () => {
    await updateStatus({ has_completed: true });
    stopTour();
  }, [stopTour, updateStatus]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') void next();
      if (e.key === 'ArrowLeft') back();
      if (e.key === 'Escape') void skip();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [back, next, skip]);

  if (!step || !ready) return null;

  return (
    <SpotlightOverlay targetSelector={step.selector} onClose={() => void skip()}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className={cn(
            'absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[1001] w-[calc(100%-2rem)] max-w-md -translate-x-1/2',
            'rounded-[14px] bg-[#213D59] px-5 py-[18px] text-white shadow-[0_18px_40px_rgba(33, 61, 89,0.35)]',
          )}
        >
          <p className="m-0 text-[11.5px] font-medium text-white/55">
            Step {index + 1} of {total}
          </p>
          {step.title ? (
            <p className="mt-2 mb-0 text-[15px] font-semibold leading-snug text-white">
              {step.title}
            </p>
          ) : null}
          <p
            className={cn(
              'mb-0 text-[15px] leading-[1.55] text-pretty text-white/90',
              step.title ? 'mt-1.5' : 'mt-2',
            )}
          >
            {step.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={index === 0}
              onClick={back}
              className="h-[38px] rounded-[19px] border border-white/30 bg-transparent px-3.5 text-[12.5px] font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => void next()}
              className="h-[38px] rounded-[19px] border-0 bg-white px-4 text-[12.5px] font-medium text-[#213D59] transition hover:bg-[#f5f8fc]"
            >
              {index === total - 1 ? 'Finish' : 'Next'}
            </button>
            <button
              type="button"
              onClick={() => void skip()}
              className="ml-auto text-[12.5px] font-medium text-white/55 transition hover:text-white"
            >
              Skip
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </SpotlightOverlay>
  );
};
