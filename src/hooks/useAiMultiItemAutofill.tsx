'use client';

import { useCallback, useMemo, useState } from 'react';
import { MultiItemAutofillDialog } from '@/components/ai/MultiItemAutofillDialog';
import {
  applyItemsToIndexedList,
  buildAutofillSuccessNotice,
  buildMultiItemFoundNotice,
  describeAutofillItem,
} from '@/utils/aiMultiItemAutofill';

type PromptState<T> = {
  items: T[];
  targetIndex?: number;
  itemLabel: string;
};

export function useAiMultiItemAutofill<T extends Record<string, unknown>>({
  itemLabel,
  createEmpty,
  getCurrentItems,
  setItems,
  setAiNotice,
  describeFields,
}: {
  itemLabel: string;
  createEmpty: () => T;
  getCurrentItems: () => T[];
  setItems: (items: T[]) => void;
  setAiNotice: (message: string) => void;
  describeFields?: string[];
}) {
  const [prompt, setPrompt] = useState<PromptState<T> | null>(null);

  const preserveRowId = useMemo(() => {
    const sample = createEmpty();
    return Object.prototype.hasOwnProperty.call(sample, '__rowId');
  }, [createEmpty]);

  const normalizeItems = useCallback(
    (raw: T[]) => raw.map(item => ({ ...createEmpty(), ...item })),
    [createEmpty],
  );

  const applyExtracted = useCallback(
    (items: T[], targetIndex?: number) => {
      if (items.length === 0) return;

      setItems(
        applyItemsToIndexedList({
          currentItems: getCurrentItems(),
          extractedItems: normalizeItems(items),
          targetIndex,
          createEmpty,
          preserveRowId,
        }),
      );
    },
    [createEmpty, getCurrentItems, normalizeItems, preserveRowId, setItems],
  );

  const processExtraction = useCallback(
    (
      extracted: T[],
      targetIndex: number | undefined,
      {
        setAiError,
        setAiNotice,
        emptyError,
        itemLabel: labelOverride,
      }: {
        setAiError: (message: string) => void;
        setAiNotice: (message: string) => void;
        emptyError: string;
        itemLabel?: string;
      },
    ): boolean => {
      const activeLabel = labelOverride ?? itemLabel;

      if (extracted.length === 0) {
        setAiError(emptyError);
        return false;
      }

      if (extracted.length > 1) {
        setPrompt({ items: extracted, targetIndex, itemLabel: activeLabel });
        setAiNotice(buildMultiItemFoundNotice(extracted.length, activeLabel));
        return true;
      }

      applyExtracted(extracted, targetIndex);
      setAiNotice(buildAutofillSuccessNotice(1, activeLabel, targetIndex));
      return true;
    },
    [applyExtracted, itemLabel],
  );

  const activeLabel = prompt?.itemLabel ?? itemLabel;

  const dialog = (
    <MultiItemAutofillDialog
      open={prompt !== null}
      onOpenChange={open => {
        if (!open) setPrompt(null);
      }}
      itemLabel={activeLabel}
      items={prompt?.items ?? []}
      describeItem={item =>
        describeAutofillItem(
          item as Record<string, unknown>,
          describeFields,
        )
      }
      targetIndex={prompt?.targetIndex}
      onAddAll={() => {
        if (!prompt) return;
        applyExtracted(prompt.items, prompt.targetIndex);
        setAiNotice(
          buildAutofillSuccessNotice(
            prompt.items.length,
            prompt.itemLabel,
            prompt.targetIndex,
            true,
          ),
        );
        setPrompt(null);
      }}
      onAddFirstOnly={() => {
        if (!prompt) return;
        applyExtracted([prompt.items[0]], prompt.targetIndex);
        setAiNotice(
          buildAutofillSuccessNotice(
            1,
            prompt.itemLabel,
            prompt.targetIndex,
            false,
          ),
        );
        setPrompt(null);
      }}
    />
  );

  return { processExtraction, applyExtracted, dialog };
}
