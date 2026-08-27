'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { Button } from '@/components/common/ui/button';
import { cn } from '@common/ui/utils';
import { AiReviewDocumentPane } from '@/components/ai/AiReviewDocumentPane';
import {
  AI_REVIEW_DOC_PANE,
  AI_REVIEW_FILL_BUTTON,
  AI_REVIEW_FILL_DIALOG_SHEET,
  AI_REVIEW_FILL_FOOTER,
  AI_REVIEW_TWO_PANE,
} from '@/utils/aiMobileUi';
import { formatDateOnlyDisplayValue } from '@/utils/dateOnly';
import { schemaFieldPreview, schemaValueIsFilled } from '@/vault-prototype/schemaFieldPreview';
import type { SchemaField } from '@/vault-prototype/types';
import { fieldViewKey } from '@/vault-prototype/types';
import type { AttachedVaultDocument } from '@/utils/vaultAttachedDocument';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: SchemaField[];
  values: Record<string, unknown>;
  document: AttachedVaultDocument | null;
  onEdit?: () => void;
};

function displayValue(field: SchemaField, value: unknown): string {
  if (field.t === 'date') {
    return formatDateOnlyDisplayValue(String(value || ''));
  }
  return schemaFieldPreview(field, value, { revealMasked: true }) || '—';
}

export function VaultFilledDocumentViewDialog({
  open,
  onOpenChange,
  title,
  fields,
  values,
  document,
  onEdit,
}: Props) {
  const rows = fields.filter(field => schemaValueIsFilled(values[fieldViewKey(field)]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(AI_REVIEW_FILL_DIALOG_SHEET, 'bg-[#F6F8FA]')}>
        <DialogHeader className="shrink-0 space-y-1 border-b border-[#E4EAF0]/80 bg-white px-4 py-3 pr-12 text-left sm:px-5">
          <DialogTitle className="text-[#213D59]">{title}</DialogTitle>
          <DialogDescription className="text-[13px] text-[#6A7481]">
            {document
              ? 'Uploaded document and the fields that were filled from it.'
              : 'Saved fields for this item. Use Edit if you need to change anything.'}
          </DialogDescription>
        </DialogHeader>

        <div className={AI_REVIEW_TWO_PANE}>
          {document ? (
            <AiReviewDocumentPane
              fileId={document.fileId}
              fileName={document.fileName}
              mimeType={document.mimeType}
              active={open}
              className={AI_REVIEW_DOC_PANE}
            />
          ) : null}
          <div className="space-y-2 px-4 py-3 sm:px-5">
            {rows.length === 0 ? (
              <p className="text-sm text-[#7A8794]">No filled fields yet.</p>
            ) : (
              rows.map(field => (
                <div
                  key={fieldViewKey(field)}
                  className="flex items-start justify-between gap-3 rounded-[12px] border border-[#E4EAF0] bg-white px-3.5 py-2.5"
                >
                  <p className="text-[12.5px] font-semibold text-[#7A8794]">{field.k}</p>
                  <p className="max-w-[60%] text-right text-[13.5px] font-semibold text-[#213D59]">
                    {displayValue(field, values[fieldViewKey(field)])}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={AI_REVIEW_FILL_FOOTER}>
          <Button
            type="button"
            variant="outline"
            className={AI_REVIEW_FILL_BUTTON}
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {onEdit ? (
            <Button
              type="button"
              className={cn(AI_REVIEW_FILL_BUTTON, 'bg-[#213D59] text-white hover:bg-[#2C4B6B]')}
              onClick={onEdit}
            >
              Edit
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function VaultViewDocumentButton({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#E4EAF0] px-3.5 text-[13px] font-semibold text-[#213D59] hover:bg-[#F6F8FA] md:h-[34px] md:min-h-[34px]"
    >
      <Eye className="h-3.5 w-3.5" />
      View
    </button>
  );
}
