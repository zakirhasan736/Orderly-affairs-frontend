'use client';

import { useCallback, useMemo, useState } from 'react';
import { MultiItemAutofillDialog } from '@/components/ai/MultiItemAutofillDialog';
import {
  applyItemsToIndexedList,
  buildAutofillSuccessNotice,
  buildMultiItemFoundNotice,
  describeAutofillItem,
} from '@/utils/aiMultiItemAutofill';
import { buildUpsertAutofillNotice } from '@/utils/aiItemDedup';

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
  conflictMode = 'ask',
  onFlowComplete,
}: {
  itemLabel: string;
  createEmpty: () => T;
  getCurrentItems: () => T[];
  setItems: (items: T[]) => void;
  setAiNotice: (message: string) => void;
  describeFields?: string[];
  isDuplicate?: (existing: T, incoming: T) => boolean;
  /** ask = overwrite confirm when matching cards already have values */
  conflictMode?: import('@/utils/aiItemDedup').AutofillConflictMode;
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
      if (items.length === 0) {
        return { added: 0, updated: 0, unchanged: 0 };
      }

      const { items: nextItems, added, updated, unchanged } =
        applyItemsToIndexedList({
          currentItems: getCurrentItems(),
          extractedItems: normalizeItems(items),
          targetIndex,
          createEmpty,
          preserveRowId,
          isDuplicate,
          conflictMode,
        });

      setItems(nextItems);
      return { added, updated, unchanged };
    },
    [
      conflictMode,
      createEmpty,
      getCurrentItems,
      isDuplicate,
      normalizeItems,
      preserveRowId,
      setItems,
    ],
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

      const { added, updated, unchanged } = applyExtracted(
        extracted,
        targetIndex,
      );
      const notice =
        buildUpsertAutofillNotice(
          added,
          updated,
          activeLabel,
          targetIndex,
          unchanged,
        ) || buildAutofillSuccessNotice(1, activeLabel, targetIndex);
      setAiNotice(notice);
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
        const { added, updated, unchanged } = applyExtracted(
          prompt.items,
          prompt.targetIndex,
        );
        setAiNotice(
          buildUpsertAutofillNotice(
            added,
            updated,
            prompt.itemLabel,
            prompt.targetIndex,
            unchanged,
          ) ||
            buildAutofillSuccessNotice(
              prompt.items.length,
              prompt.itemLabel,
              prompt.targetIndex,
              true,
            ),
        );
        closePrompt();
      }}
      onAddFirstOnly={() => {
        if (!prompt) return;
        const { added, updated, unchanged } = applyExtracted(
          [prompt.items[0]],
          prompt.targetIndex,
        );
        setAiNotice(
          buildUpsertAutofillNotice(
            added,
            updated,
            prompt.itemLabel,
            prompt.targetIndex,
            unchanged,
          ) ||
            buildAutofillSuccessNotice(
              1,
              prompt.itemLabel,
              prompt.targetIndex,
              false,
            ),
        );
        closePrompt();
      }}
    />
  );

  return { processExtraction, applyExtracted, dialog };
}
