'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/common/ui/alert-dialog';

export interface MultiItemAutofillDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemLabel: string;
  items: T[];
  describeItem: (item: T) => string;
  targetIndex?: number;
  onAddAll: () => void;
  onAddFirstOnly: () => void;
}

export function MultiItemAutofillDialog<T>({
  open,
  onOpenChange,
  itemLabel,
  items,
  describeItem,
  targetIndex,
  onAddAll,
  onAddFirstOnly,
}: MultiItemAutofillDialogProps<T>) {
  const count = items.length;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {count} {itemLabel.toLowerCase()}
            {count === 1 ? '' : 's'} found
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left">
              <p>
                This document appears to list multiple {itemLabel.toLowerCase()}
                s. Would you like to create a separate card for each one and
                auto-fill them?
              </p>
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                {items.map((item, index) => (
                  <li key={`multi-item-${index}`}>
                    {index + 1}. {describeItem(item)}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onAddFirstOnly}>
            Only fill{' '}
            {typeof targetIndex === 'number'
              ? `${itemLabel} #${targetIndex + 1}`
              : `the first ${itemLabel.toLowerCase()}`}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAddAll}>
            Add all {count} {itemLabel.toLowerCase()}
            {count === 1 ? '' : 's'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
