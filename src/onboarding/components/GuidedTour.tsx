'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check } from 'lucide-react';

import { ownerTour } from '@/onboarding/config/ownerTour';
import { nextKinTour } from '@/onboarding/config/nextKinTour';
import { SpotlightOverlay } from './SpotlightOverlay';
import { useOnboarding } from './OnboardingProvider';
import { useUpdateTourStatusMutation } from '@/services/onboardingApi';

const clickSound =
  typeof Audio !== 'undefined' ? new Audio('/sounds/step.mp3') : null;

type Props = {
  role: 'owner' | 'nextkin';
  activeSection: string;
  setActiveSection: (section: string) => void;
};

export const GuidedTour = ({ role }: Props) => {
  const { stopTour } = useOnboarding();
  const [updateStatus] = useUpdateTourStatusMutation();
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const steps = role === 'owner' ? ownerTour : nextKinTour;
  const step = steps[index];

  useEffect(() => {
    if (clickSound) clickSound.play().catch(() => {});
  }, [index]);

  const next = async () => {
    if (index + 1 >= steps.length) {
      await updateStatus({ has_completed: true });
      setCompleted(true);

      confetti({
        particleCount: 150,
        spread: 90,
      });

      setTimeout(() => stopTour(), 2000);
      return;
    }

    setIndex(prev => prev + 1);
  };

  const back = () => index > 0 && setIndex(prev => prev - 1);

  if (!step) return null;

  return (
    <SpotlightOverlay targetSelector={step.selector}>
      <AnimatePresence mode="wait">
        {!completed ? (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="absolute bottom-16 z-99999 left-1/2 -translate-x-1/2 
              w-[480px] max-w-[90vw] 
              bg-white/95 dark:bg-neutral-900/95 
              backdrop-blur-xl 
              p-8 rounded-3xl shadow-2xl"
          >
            {/* Magnetic Arrow */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                className="w-6 h-6 bg-white dark:bg-neutral-900 rotate-45 border"
              />
            </div>

            <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {step.description}
            </p>

            {/* Progress Dots */}
            <div className="flex gap-2 justify-center mb-6">
              {steps.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: i === index ? 1.3 : 1,
                    backgroundColor: i === index ? '#fbbf24' : '#d4d4d4',
                  }}
                  className="w-2.5 h-2.5 rounded-full"
                />
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={back} className="text-sm text-muted-foreground">
                ← Back
              </button>

              <button
                onClick={next}
                className="px-5 py-2 bg-amber-400 rounded-xl font-medium"
              >
                {index === steps.length - 1 ? 'Finish' : 'Next →'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 
              bg-white dark:bg-neutral-900 
              p-10 rounded-3xl shadow-2xl text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260 }}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Check className="text-white w-8 h-8" />
            </motion.div>

            <h3 className="text-xl font-semibold">Tour Completed 🎉</h3>
          </motion.div>
        )}
      </AnimatePresence>
    </SpotlightOverlay>
  );
};
