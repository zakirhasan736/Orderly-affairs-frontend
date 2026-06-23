'use client';

import { useCallback, useState } from 'react';

export function useAiDocumentDropZone(
  onFile: (file: File) => void | Promise<void>,
  disabled = false,
) {
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(
    (file: File | null | undefined) => {
      if (!file || disabled) return;
      void onFile(file);
    },
    [disabled, onFile],
  );

  const onDragEnter = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      processFile(event.dataTransfer.files?.[0] ?? null);
    },
    [disabled, processFile],
  );

  return {
    isDragging,
    processFile,
    dropZoneProps: {
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop,
    },
  };
}
