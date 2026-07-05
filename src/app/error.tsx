'use client';

import { useEffect } from 'react';
import { devError } from '@/utils/clientLogger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    devError('Application error', error);
  }, [error]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Something went wrong</h2>
      <p>Please try again. If the problem continues, contact support.</p>

      <button
        onClick={() => reset()}
        style={{
          marginTop: '10px',
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '5px',
        }}
      >
        Try again
      </button>
    </div>
  );
}
