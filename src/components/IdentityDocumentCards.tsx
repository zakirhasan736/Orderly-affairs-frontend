'use client';

import React, { useMemo } from 'react';
import { Plus, Minus, IdCard } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { Card } from '@/components/common/ui/card';
import { DynamicFormField } from '@/components/DynamicFormField';
import { VaultFieldUploadThumb } from '@/components/vault/VaultFieldUploadThumb';
import { cn } from '@common/ui/utils';
import { getTopicCardProps } from '@/utils/vaultTopicNavigation';
import {
  createEmptyIdentityDocument,
  getIdentityDocumentFields,
  identityDocumentCardLabel,
  type IdentityDocumentFieldsMode,
} from '@/utils/identityDocumentFields';
import { isNewFillActive, type NewFillMarker } from '@/utils/newFillMarkers';

type IdentityDocumentCardsProps = {
  mode: IdentityDocumentFieldsMode;
  items: Record<string, unknown>[];
  onChange: (next: Record<string, unknown>[]) => void;
  subsectionId: string;
  topicGroupKey?: string;
  activeTopicId?: string | null;
  className?: string;
  /** Optional new-fill markers for highlight */
  newFills?: NewFillMarker[];
  sectionId?: string;
};

function firstUploadFile(item: Record<string, unknown>) {
  const upload = item.document_upload;
  if (!upload || typeof upload !== 'object') return null;
  const files = (upload as { files?: unknown[] }).files;
  if (!Array.isArray(files) || !files.length) return null;
  const file = files[0];
  if (!file || typeof file !== 'object') return null;
  return file as {
    public_id?: string;
    url?: string;
    name?: string;
    original_filename?: string;
    mime_type?: string;
    content_type?: string;
  };
}

export function IdentityDocumentCards({
  mode,
  items,
  onChange,
  subsectionId,
  topicGroupKey = 'identity_documents',
  activeTopicId = null,
  className,
  newFills = [],
  sectionId,
}: IdentityDocumentCardsProps) {
  const fields = useMemo(() => getIdentityDocumentFields(mode), [mode]);
  // Hide category from UI — always identity
  const visibleFields = fields.filter(f => f.key !== 'category');

  const addItem = () => {
    onChange([...items, createEmptyIdentityDocument(mode)]);
  };

  const updateItem = (index: number, fieldKey: string, value: unknown) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [fieldKey]: value, category: 'identity' } : item,
    );
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 rounded-2xl border bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#213D59]/10 text-[#213D59]">
            <IdCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Identity documents</h3>
            <p className="text-sm text-slate-500">
              {mode === 'owner'
                ? 'Passport, birth certificate, SSN card, and other IDs for you. Upload a scan — fields fill for review.'
                : 'Identity documents for spouse, partner, or dependents. Assign each card to a person.'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          data-ai-autofill-trigger
          onClick={addItem}
          className="rounded-xl"
        >
          <Plus className="mr-1 h-4 w-4" />
          Add document
        </Button>
      </div>

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-center text-sm text-slate-500">
          None added yet — tap{' '}
          <span className="font-semibold text-slate-700">Add document</span>, then
          upload a file so AI can fill the fields.
        </div>
      )}

      {items.map((item, index) => {
        const topicProps = getTopicCardProps(
          subsectionId,
          index,
          activeTopicId,
          topicGroupKey,
        );
        const label = identityDocumentCardLabel(item, index, mode);
        const file = firstUploadFile(item);
        const isNew =
          sectionId &&
          isNewFillActive(newFills, {
            sectionId,
            subsectionId,
            topicGroupKey,
            index,
          });

        return (
          <Card
            key={`${topicGroupKey}-${index}`}
            id={topicProps.id}
            className={cn(
              topicProps.className,
              isNew && 'ring-2 ring-amber-300 border-amber-300',
            )}
            data-new-fill={isNew ? 'true' : undefined}
          >
            <div className="flex flex-col gap-3 border-b bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <strong className="text-slate-900">{label}</strong>
                {isNew ? (
                  <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                    Just filled
                  </span>
                ) : null}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => removeItem(index)}
                className="rounded-xl"
              >
                <Minus className="mr-1 h-4 w-4" />
                Remove
              </Button>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {file?.public_id || file?.url ? (
                <div className="mx-auto w-full max-w-xs">
                  <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Document preview
                  </p>
                  <VaultFieldUploadThumb
                    publicId={file.public_id}
                    previewUrl={file.url}
                    fileName={file.original_filename || file.name}
                    mimeType={file.mime_type || file.content_type}
                  />
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {visibleFields.map(field => (
                  <div
                    key={field.key}
                    className={cn(
                      field.type === 'TextArea' ||
                        field.type === 'TextInputWithUpload'
                        ? 'sm:col-span-2'
                        : undefined,
                    )}
                  >
                    <DynamicFormField
                      field={field as any}
                      value={item[field.key]}
                      onChange={value => updateItem(index, field.key, value)}
                      formData={item}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
