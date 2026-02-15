'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error occurred:', error);
  }, [error]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Something went wrong!</h2>
      <p>{error.message || 'An unexpected error occurred.'}</p>
      <p>{error.digest && `Error Digest: ${error.digest}`}</p>

      <button
        onClick={() => {
          // Attempt to recover by trying to re-render the segment
          reset();
        }}
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
