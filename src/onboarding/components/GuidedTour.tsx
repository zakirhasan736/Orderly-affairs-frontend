'use client';

import { useState, useEffect } from 'react';
import { SpotlightOverlay } from './SpotlightOverlay';
import { ProgressBar } from './ProgressBar';
import { useOnboarding } from './OnboardingProvider';

interface Step {
  section: string;
  selector: string;
  title: string;
  description: string;
}

type Props = {
  steps: Step[];
  activeSection: string;
  setActiveSection: (section: string) => void;
  onFinish?: () => void;
};

export const GuidedTour: React.FC<Props> = ({
  steps,
  activeSection,
  setActiveSection,
  onFinish,
}) => {
  const { stopTour } = useOnboarding();
  const [index, setIndex] = useState(0);

  const step = steps[index];

  // Auto switch section if needed
  useEffect(() => {
    if (activeSection !== step.section) {
      setActiveSection(step.section);
    }
  }, [step.section, activeSection, setActiveSection]);

  const handleComplete = () => {
    stopTour(); 
    setIndex(0);

    if (onFinish) {
      onFinish();
    }
  };

  return (
    <SpotlightOverlay targetSelector={step.selector} onClose={handleComplete}>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-105 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-white/20 animate-luxuryFade transition-all duration-500">
        <ProgressBar current={index} total={steps.length} />

        <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

        <div className="flex justify-between">
          <button
            disabled={index === 0}
            onClick={() => setIndex(prev => prev - 1)}
            className="text-sm disabled:opacity-40"
          >
            Back
          </button>

          {index === steps.length - 1 ? (
            <button
              onClick={handleComplete}
              className="bg-amber-400 cursor-pointer text-black px-4 py-2 rounded-md text-sm"
            >
              Finish
            </button>
          ) : (
            <button
              onClick={() => setIndex(prev => prev + 1)}
              className="bg-amber-400 cursor-pointer text-black px-4 py-2 rounded-md text-sm"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </SpotlightOverlay>
  );
};
