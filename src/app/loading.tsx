import React from 'react';

export default function Loading() {
  return (
    <div className="loading-container fixed top-0 left-0 w-full h-full bg-mono-0 z-[999999]">
      <div className="loading-content w-full h-full flex flex-col items-center justify-center gap-4">
        <p className="body-small text-mono-100">
          {' '}
          Loading... , please do not refresh this page.
        </p>
      </div>
    </div>
  );
}
