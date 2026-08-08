'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import { ownerTour, type OwnerTourStep } from '@/onboarding/config/ownerTour';
import {
  nextKinTour,
  type NextKinTourStep,
} from '@/onboarding/config/nextKinTour';
import {
  SpotlightOverlay,
  type SpotlightRect,
} from './SpotlightOverlay';
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

/** Place the card near the spotlight target instead of always bottom-center. */
function getTooltipStyle(
  rect: SpotlightRect,
  placement: OwnerTourStep['tooltipPlacement'] = 'auto',
): CSSProperties {
  const gap = 16;
  const tipWidth = 400;
  const tipHeight = 260;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const spaceRight = vw - rect.right - gap;
  const spaceLeft = rect.left - gap;
  const spaceBelow = vh - rect.bottom - gap;
  const width = Math.min(tipWidth, Math.max(280, Math.min(vw - 32, tipWidth)));

  const clampTop = (top: number) =>
    Math.max(16, Math.min(top, vh - tipHeight - 16));
  const clampLeft = (left: number) =>
    Math.max(16, Math.min(left, vw - width - 16));

  const besideRight = (): CSSProperties => ({
    left: clampLeft(rect.right + gap),
    top: clampTop(rect.top),
    width,
    maxWidth: width,
    transform: 'none',
    bottom: 'auto',
  });

  const belowTarget = (): CSSProperties => ({
    left: clampLeft(rect.right - width),
    top: Math.min(rect.bottom + gap, vh - tipHeight - 16),
    width,
    maxWidth: width,
    transform: 'none',
    bottom: 'auto',
  });

  if (placement === 'beside') return besideRight();
  if (placement === 'below') return belowTarget();

  // Left-rail targets (sidebar): sit to the right.
  if (rect.left < vw * 0.42 && spaceRight >= Math.min(width, 280)) {
    return besideRight();
  }

  // Top / right targets (header % bar): sit below, aligned toward the target.
  if (rect.top < vh * 0.35 && spaceBelow >= 160) {
    return belowTarget();
  }

  // Right-side targets with room on the left: sit to the left.
  if (spaceLeft >= Math.min(width, 300)) {
    return {
      left: clampLeft(rect.left - width - gap),
      top: clampTop(rect.top),
      width,
      maxWidth: width,
      transform: 'none',
      bottom: 'auto',
    };
  }

  return {
    left: '50%',
    bottom: 'max(1rem, env(safe-area-inset-bottom))',
    top: 'auto',
    width: 'calc(100% - 2rem)',
    maxWidth: '28rem',
    transform: 'translateX(-50%)',
  };
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

    if (
      'peopleTab' in step &&
      typeof (step as OwnerTourStep).peopleTab === 'string'
    ) {
      window.dispatchEvent(
        new CustomEvent('orderly-open-people-hub', {
          detail: { tab: (step as OwnerTourStep).peopleTab },
        }),
      );
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

  const tooltipPlacement =
    'tooltipPlacement' in step
      ? (step as OwnerTourStep).tooltipPlacement
      : undefined;

  return (
    <SpotlightOverlay targetSelector={step.selector} onClose={() => void skip()}>
      {rect => (
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className={cn(
              'absolute z-[1001] rounded-[14px] bg-[#213D59] px-5 py-[18px] text-white shadow-[0_18px_40px_rgba(33,61,89,0.35)]',
            )}
            style={getTooltipStyle(rect, tooltipPlacement)}
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
                'mb-0 whitespace-pre-line text-[15px] leading-[1.55] text-pretty text-white/90',
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
      )}
    </SpotlightOverlay>
  );
};
