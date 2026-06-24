'use client';

import { useCallback, useMemo, useState } from 'react';
import { MultiItemAutofillDialog } from '@/components/ai/MultiItemAutofillDialog';
import {
  applyItemsToIndexedList,
  buildAutofillSuccessNotice,
  buildMultiItemFoundNotice,
  describeAutofillItem,
} from '@/utils/aiMultiItemAutofill';
import { buildDuplicateSkippedNotice } from '@/utils/aiItemDedup';

type PromptState<T> = {
  items: T[];
  targetIndex?: number;
  itemLabel: string;
};

export type AiMultiItemExtractionResult = 'pending_user' | 'applied' | 'failed';

export function useAiMultiItemAutofill<T extends Record<string, unknown>>({
  itemLabel,
  createEmpty,
  getCurrentItems,
  setItems,
  setAiNotice,
  describeFields,
  isDuplicate,
  onFlowComplete,
}: {
  itemLabel: string;
  createEmpty: () => T;
  getCurrentItems: () => T[];
  setItems: (items: T[]) => void;
  setAiNotice: (message: string) => void;
  describeFields?: string[];
  isDuplicate?: (existing: T, incoming: T) => boolean;
  /** Called when multi-item dialog closes (apply, skip, or dismiss) */
  onFlowComplete?: () => void;
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
      if (items.length === 0) return 0;

      const { items: nextItems, skipped } = applyItemsToIndexedList({
        currentItems: getCurrentItems(),
        extractedItems: normalizeItems(items),
        targetIndex,
        createEmpty,
        preserveRowId,
        isDuplicate,
      });

      setItems(nextItems);
      return skipped;
    },
    [createEmpty, getCurrentItems, isDuplicate, normalizeItems, preserveRowId, setItems],
  );

  const closePrompt = useCallback(() => {
    setPrompt(null);
    onFlowComplete?.();
  }, [onFlowComplete]);

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
    ): AiMultiItemExtractionResult => {
      const activeLabel = labelOverride ?? itemLabel;

      if (extracted.length === 0) {
        setAiError(emptyError);
        return 'failed';
      }

      if (extracted.length > 1) {
        setPrompt({ items: extracted, targetIndex, itemLabel: activeLabel });
        setAiNotice(buildMultiItemFoundNotice(extracted.length, activeLabel));
        return 'pending_user';
      }

      const skipped = applyExtracted(extracted, targetIndex);
      const duplicateNotice = buildDuplicateSkippedNotice(skipped, activeLabel);
      if (skipped > 0 && skipped >= extracted.length) {
        setAiNotice(
          duplicateNotice ||
            `All ${activeLabel.toLowerCase()} entries were already on file.`,
        );
        return 'applied';
      }

      setAiNotice(
        [
          buildAutofillSuccessNotice(1, activeLabel, targetIndex),
          duplicateNotice,
        ]
          .filter(Boolean)
          .join(' '),
      );
      return 'applied';
    },
    [applyExtracted, itemLabel],
  );

  const activeLabel = prompt?.itemLabel ?? itemLabel;

  const dialog = (
    <MultiItemAutofillDialog
      open={prompt !== null}
      onOpenChange={open => {
        if (!open) closePrompt();
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
        const skipped = applyExtracted(prompt.items, prompt.targetIndex);
        const duplicateNotice = buildDuplicateSkippedNotice(
          skipped,
          prompt.itemLabel,
        );
        setAiNotice(
          [
            buildAutofillSuccessNotice(
              prompt.items.length,
              prompt.itemLabel,
              prompt.targetIndex,
              true,
            ),
            duplicateNotice,
          ]
            .filter(Boolean)
            .join(' '),
        );
        closePrompt();
      }}
      onAddFirstOnly={() => {
        if (!prompt) return;
        const skipped = applyExtracted([prompt.items[0]], prompt.targetIndex);
        const duplicateNotice = buildDuplicateSkippedNotice(
          skipped,
          prompt.itemLabel,
        );
        setAiNotice(
          [
            buildAutofillSuccessNotice(
              1,
              prompt.itemLabel,
              prompt.targetIndex,
              false,
            ),
            duplicateNotice,
          ]
            .filter(Boolean)
            .join(' '),
        );
        closePrompt();
      }}
    />
  );

  return { processExtraction, applyExtracted, dialog };
}
