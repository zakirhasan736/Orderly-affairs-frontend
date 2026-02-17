import { useEffect, useRef } from 'react';

export function useSectionAutoSave(
  sectionId: string,
  data: any,
  saveFunction: (data: any) => Promise<any>,
  delay = 1500,
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!data) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await saveFunction(data);
        console.log(`Section ${sectionId} auto-saved`);
      } catch (err) {
        console.error(`Auto-save failed for ${sectionId}`, err);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data]);
}
