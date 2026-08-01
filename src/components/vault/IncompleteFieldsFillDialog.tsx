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
import type { FieldDefinition } from '@/types/formTypes';
import {
  applySectionFieldValue,
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

type IncompleteFieldsFillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: FillGapsTarget | null;
};

export function IncompleteFieldsFillDialog({
  open,
  onOpenChange,
  target,
}: IncompleteFieldsFillDialogProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const incomplete = useMemo(() => {
    if (!target) return [] as IncompleteField[];
    return listIncompleteFields(
      target.sectionId,
      target.subsectionId,
      target.sectionData,
      { itemIndex: target.itemIndex, groupId: target.groupId },
    );
  }, [target]);

  useEffect(() => {
    if (!open || !target) {
      setDraft({});
      return;
    }
    const next: Record<string, unknown> = {};
    for (const item of listIncompleteFields(
      target.sectionId,
      target.subsectionId,
      target.sectionData,
      { itemIndex: target.itemIndex, groupId: target.groupId },
    )) {
      next[item.key] = '';
    }
    setDraft(next);
  }, [open, target]);

  const remaining = incomplete.filter(
    item =>
      draft[item.key] === undefined ||
      draft[item.key] === null ||
      (typeof draft[item.key] === 'string' &&
        !(draft[item.key] as string).trim()),
  );

  const onSave = () => {
    if (!target) return;
    setSaving(true);
    try {
      let nextData = target.sectionData
        ? { ...target.sectionData }
        : {};
      for (const item of incomplete) {
        const value = draft[item.key];
        if (
          value === undefined ||
          value === null ||
          (typeof value === 'string' && !value.trim())
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

  const fields: FieldDefinition[] = incomplete.map(i => i.field);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,40rem)] w-[min(100vw-1.25rem,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[36rem]">
        <DialogHeader className="shrink-0 space-y-1 border-b border-slate-100 bg-gradient-to-b from-[#f7f9fc] to-white px-5 pb-3.5 pt-5 pr-12 text-left sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2B5A8C]">
            Fill empty fields
          </p>
          <DialogTitle className="text-lg font-semibold text-[#213D59]">
            {target?.title || 'Complete this part'}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-slate-600">
            {incomplete.length === 0
              ? 'Everything here looks complete.'
              : `${incomplete.length} empty field${incomplete.length === 1 ? '' : 's'} — fill what you can, then save.`}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {incomplete.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-[#213D59]">All filled</p>
              <p className="text-[12.5px] text-slate-500">
                No empty fields in this subsection.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map(field => (
                <div
                  key={field.key}
                  className="rounded-xl border border-slate-200 bg-white p-3.5"
                >
                  <DynamicFormField
                    field={field}
                    value={draft[field.key]}
                    formData={draft}
                    onChange={value =>
                      setDraft(prev => ({ ...prev, [field.key]: value }))
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur-md sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              {incomplete.length > 0
                ? remaining.length === 0
                  ? 'Ready to save'
                  : `${remaining.length} still empty (optional to skip)`
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
              {incomplete.length > 0 ? (
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
