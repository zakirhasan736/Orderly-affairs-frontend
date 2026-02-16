'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import { ownerTour } from '@/onboarding/config/ownerTour';
import { nextKinTour } from '@/onboarding/config/nextKinTour';
import { SpotlightOverlay } from './SpotlightOverlay';
import { useOnboarding } from './OnboardingProvider';
import { useUpdateTourStatusMutation } from '@/services/onboardingApi';

type Props = {
  role: 'owner' | 'nextkin';
  activeSection: string;
  setActiveSection: (section: string) => void;
};

export const GuidedTour = ({
  role,
  activeSection,
  setActiveSection,
}: Props) => {
  const { stopTour } = useOnboarding();
  const [updateStatus] = useUpdateTourStatusMutation();
  const [index, setIndex] = useState(0);

  const steps = role === 'owner' ? ownerTour : nextKinTour;
  const step = steps[index];

  const progress = ((index + 1) / steps.length) * 100;

  // ----------------------------------
  // Keyboard Navigation
  // ----------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
      if (e.key === 'Escape') skip();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (!step) return null;

  const next = async () => {
    const nextIndex = index + 1;

    if (nextIndex >= steps.length) {
      await updateStatus({ has_completed: true });

      // 🎉 Confetti burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      stopTour();
      return;
    }

    setIndex(nextIndex);
  };

  const back = () => {
    if (index > 0) setIndex(index - 1);
  };

  const skip = async () => {
    await updateStatus({ has_completed: true });
    stopTour();
  };

  return (
    <SpotlightOverlay targetSelector={step.selector} onClose={skip}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 
            w-[500px] max-w-[92vw]  
            bg-white/90 dark:bg-neutral-900/90 
            p-8 rounded-3xl 
            shadow-2xl border border-white/20"
        >
          {/* Arrow Pointer */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 
            w-6 h-6 bg-white dark:bg-neutral-900 rotate-45 border-l border-t border-white/20" />

          {/* Header */}
          <div className="mb-6">
            <div className="text-xs uppercase tracking-widest text-amber-500 font-semibold mb-2">
              Guided Tour
            </div>

            <h3 className="text-2xl font-semibold mb-2">
              {step.title}
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <div className="text-xs mt-2 text-muted-foreground">
              Step {index + 1} of {steps.length}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <button
              disabled={index === 0}
              onClick={back}
              className="text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-30"
            >
              ← Back
            </button>

            <div className="flex gap-3">
              <button
                onClick={skip}
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                Skip
              </button>

              <button
                onClick={next}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 
                text-black font-medium text-sm transition shadow-md hover:shadow-lg"
              >
                {index === steps.length - 1 ? 'Finish 🎉' : 'Next →'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </SpotlightOverlay>
  );
};
