'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { Button } from '@/components/common/ui/button';
import { DynamicFormField } from '@/components/DynamicFormField';
import {
  applySectionFieldValue,
  isMeaningfulFilled,
  listAreaFields,
  listIncompleteFields,
  type IncompleteField,
} from '@/utils/sectionCompletion';
import { cn } from '@common/ui/utils';

export type FillGapsTarget = {
  sectionId: string;
  subsectionId: string;
  itemIndex?: number;
  groupId?: string;
  title: string;
  sectionData: Record<string, unknown> | undefined;
  onApplySectionData: (next: Record<string, unknown>) => void;
};

type FillTab = 'empty' | 'area';

type IncompleteFieldsFillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: FillGapsTarget | null;
};

function isBlankDraft(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && !value.trim())
  );
}

export function IncompleteFieldsFillDialog({
  open,
  onOpenChange,
  target,
}: IncompleteFieldsFillDialogProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<FillTab>('empty');

  const scope = useMemo(
    () =>
      target
        ? {
            itemIndex: target.itemIndex,
            groupId: target.groupId,
          }
        : undefined,
    [target],
  );

  const emptyFields = useMemo(() => {
    if (!target) return [] as IncompleteField[];
    return listIncompleteFields(
      target.sectionId,
      target.subsectionId,
      target.sectionData,
      scope,
    );
  }, [target, scope]);

  const areaFields = useMemo(() => {
    if (!target) return [] as IncompleteField[];
    return listAreaFields(
      target.sectionId,
      target.subsectionId,
      target.sectionData,
      scope,
    );
  }, [target, scope]);

  const visibleFields = tab === 'empty' ? emptyFields : areaFields;

  useEffect(() => {
    if (!open || !target) {
      setDraft({});
      setTab('empty');
      return;
    }

    const all = listAreaFields(
      target.sectionId,
      target.subsectionId,
      target.sectionData,
      { itemIndex: target.itemIndex, groupId: target.groupId },
    );
    const empty = all.filter(item => !isMeaningfulFilled(item.value));
    setTab(empty.length > 0 ? 'empty' : 'area');

    const next: Record<string, unknown> = {};
    for (const item of all) {
      next[item.key] = isMeaningfulFilled(item.value) ? item.value : '';
    }
    setDraft(next);
  }, [open, target]);

  const emptyStillOpen = emptyFields.filter(item => isBlankDraft(draft[item.key]));

  const onSave = () => {
    if (!target) return;
    setSaving(true);
    try {
      let nextData = target.sectionData ? { ...target.sectionData } : {};
      const toSave = tab === 'empty' ? emptyFields : areaFields;

      for (const item of toSave) {
        const value = draft[item.key];
        if (tab === 'empty' && isBlankDraft(value)) continue;

        // On "This area", skip unchanged blanks that were already blank.
        if (
          tab === 'area' &&
          isBlankDraft(value) &&
          !isMeaningfulFilled(item.value)
        ) {
          continue;
        }

        nextData = applySectionFieldValue(
          nextData,
          target.subsectionId,
          item.key,
          value,
          { itemIndex: target.itemIndex, groupId: target.groupId },
        );
      }
      target.onApplySectionData(nextData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const description =
    tab === 'empty'
      ? emptyFields.length === 0
        ? 'Nothing empty here — switch to This area to review what’s already filled.'
        : `${emptyFields.length} blank field${emptyFields.length === 1 ? '' : 's'} in this spot. Fill what you know, skip the rest.`
      : areaFields.length === 0
        ? 'No editable fields in this spot.'
        : `${areaFields.length} field${areaFields.length === 1 ? '' : 's'} in this spot — edit anything, including what’s already filled.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,42rem)] w-[min(100vw-1.25rem,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[36rem]">
        <DialogHeader className="shrink-0 space-y-1 border-b border-slate-100 bg-gradient-to-b from-[#f7f9fc] to-white px-5 pb-3 pt-5 pr-12 text-left sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2B5A8C]">
            Quick fill
          </p>
          <DialogTitle className="text-lg font-semibold text-[#213D59]">
            {target?.title || 'This part of your vault'}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-slate-600">
            {description}
          </DialogDescription>

          <div
            className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100/90 p-1"
            role="tablist"
            aria-label="Field views"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'empty'}
              onClick={() => setTab('empty')}
              className={cn(
                'rounded-lg px-3 py-2 text-[12.5px] font-semibold transition',
                tab === 'empty'
                  ? 'bg-white text-[#213D59] shadow-sm'
                  : 'text-slate-500 hover:text-[#213D59]',
              )}
            >
              Still empty
              {emptyFields.length > 0 ? (
                <span
                  className={cn(
                    'ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-md px-1 text-[10px] font-bold',
                    tab === 'empty'
                      ? 'bg-[#213D59] text-white'
                      : 'bg-slate-200 text-slate-600',
                  )}
                >
                  {emptyFields.length}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'area'}
              onClick={() => setTab('area')}
              className={cn(
                'rounded-lg px-3 py-2 text-[12.5px] font-semibold transition',
                tab === 'area'
                  ? 'bg-white text-[#213D59] shadow-sm'
                  : 'text-slate-500 hover:text-[#213D59]',
              )}
            >
              This area
              {areaFields.length > 0 ? (
                <span
                  className={cn(
                    'ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-md px-1 text-[10px] font-bold',
                    tab === 'area'
                      ? 'bg-[#213D59] text-white'
                      : 'bg-slate-200 text-slate-600',
                  )}
                >
                  {areaFields.length}
                </span>
              ) : null}
            </button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {visibleFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-[#213D59]">
                {tab === 'empty' ? 'No blanks left' : 'Nothing to show'}
              </p>
              <p className="max-w-[28ch] text-[12.5px] text-slate-500">
                {tab === 'empty'
                  ? 'Open This area if you want to tweak fields that are already filled.'
                  : 'This spot has no fillable fields.'}
              </p>
              {tab === 'empty' && areaFields.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-1 rounded-full border-[#213D59]/20 text-[#213D59]"
                  onClick={() => setTab('area')}
                >
                  Review this area
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3.5">
              {visibleFields.map(item => {
                const filled = isMeaningfulFilled(
                  draft[item.key] !== undefined ? draft[item.key] : item.value,
                );
                return (
                  <div
                    key={item.key}
                    className={cn(
                      'rounded-xl border bg-white p-3.5',
                      filled
                        ? 'border-slate-200'
                        : 'border-amber-200/80 bg-amber-50/20',
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {item.label}
                      </p>
                      <span
                        className={cn(
                          'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                          filled
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800',
                        )}
                      >
                        {filled ? 'Filled' : 'Empty'}
                      </span>
                    </div>
                    <DynamicFormField
                      field={item.field}
                      value={draft[item.key]}
                      formData={draft}
                      onChange={value =>
                        setDraft(prev => ({ ...prev, [item.key]: value }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur-md sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              {tab === 'empty' && emptyFields.length > 0
                ? emptyStillOpen.length === 0
                  ? 'Ready to save'
                  : `${emptyStillOpen.length} still empty (optional to skip)`
                : tab === 'area' && areaFields.length > 0
                  ? 'Edits save to this vault area'
                  : null}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {visibleFields.length > 0 ? (
                <Button
                  type="button"
                  className={cn(
                    'rounded-full bg-[#213D59] hover:bg-[#00305C]',
                    'min-w-[7.5rem]',
                  )}
                  disabled={saving}
                  onClick={onSave}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
