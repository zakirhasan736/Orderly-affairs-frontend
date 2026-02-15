'use client';

import React from 'react';

interface Props {
  role: 'owner' | 'nextkin';
  onStart: () => void;
  onSkip: () => void;
}

export const WelcomeModal: React.FC<Props> = ({ role, onStart, onSkip }) => {
  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
      <div className="w-[500px] bg-white dark:bg-card rounded-2xl p-8 shadow-2xl text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            {role === 'owner'
              ? 'Welcome to Your Private Vault'
              : 'Secure Access Granted'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {role === 'owner'
              ? 'We’ll guide you through setting up your legacy vault.'
              : 'Let us show you how to access and manage your authorized sections.'}
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-muted-foreground hover:underline"
          >
            Explore on My Own
          </button>

          <button
            onClick={onStart}
            className="px-6 py-2 bg-amber-400 text-black rounded-md text-sm font-medium"
          >
            Start Guided Tour
          </button>
        </div>
      </div>
    </div>
  );
};
