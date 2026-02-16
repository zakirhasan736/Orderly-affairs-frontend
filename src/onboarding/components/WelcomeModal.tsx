'use client';

import React from 'react';

interface Props {
  role: 'owner' | 'nextkin';
  onStart: () => void;
  onSkip: () => void;
}

export const WelcomeModal: React.FC<Props> = ({ role, onStart, onSkip }) => {
  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
      <div
        className="w-[520px] max-w-[90vw] 
        bg-white dark:bg-neutral-900 
        rounded-3xl p-10 shadow-2xl border border-white/20 text-center"
      >
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-amber-500 font-semibold mb-3">
            Welcome
          </div>

          <h2 className="text-3xl font-semibold mb-4 leading-tight">
            {role === 'owner'
              ? 'Welcome to Your Private Vault'
              : 'Secure Access Granted'}
          </h2>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {role === 'owner'
              ? 'We’ll guide you step-by-step through setting up your legacy vault.'
              : 'Let us show you how to navigate and access your authorized sections.'}
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Explore on my own
          </button>

          <button
            onClick={onStart}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-black rounded-xl text-sm font-medium transition shadow-md hover:shadow-lg"
          >
            Start Guided Tour →
          </button>
        </div>
      </div>
    </div>
  );
};
