'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
import {
  Plus,
  Minus,
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  Gem,
  Building2,
  Heart,
  Info,
  Landmark,
  MapPin,
  Receipt,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { autofillSectionFromDocument } from '@/services/aiAutofill';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';

/* ============================================================
   REPEATABLE SECTION FACTORY
============================================================ */

const createRepeatableSection = (
  subsectionId: string,
  title: string,
  itemLabel: string,
  fields: any[],
) => ({ subsectionId, title, itemLabel, fields });

/* ============================================================
   SECTION 19A — VALUABLE ITEMS
============================================================ */

const SECTION_19A = createRepeatableSection(
  '19A',
  'Valuable Items',
  'Asset / Valuable',
  [
    {
      key: 'item_type',
      label: 'Type of Item',
      type: 'Dropdown',
      options: [
        'Jewelry',
        'Artwork',
        'Collectibles',
        'Antiques',
        'Precious Metals',
        'Coins/Currency',
        'Electronics',
        'Musical Instruments',
        'Sports Memorabilia',
        'Books/Documents',
        'Furniture',
        'Tools/Equipment',
        'Other',
      ],
      helperText: 'Category of valuable item',
    },
    {
      key: 'item_type_other',
      label: 'Please specify other item type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of valuable item',
      conditionalDisplay: { field: 'item_type', value: 'Other' },
    },
    {
      key: 'item_description',
      label: 'Item Description',
      type: 'TextArea',
      helperText:
        'Detailed description of the item including brand, model, characteristics',
    },
    {
      key: 'estimated_value',
      label: 'Estimated Value',
      type: 'TextInput',
      helperText: 'Approximate current value of the item',
    },
    {
      key: 'purchase_info',
      label: 'Purchase Information',
      type: 'TextArea',
      helperText: 'When and where purchased, original cost',
    },
    {
      key: 'current_location',
      label: 'Current Location',
      type: 'TextArea',
      helperText: 'Where this item is currently stored or displayed',
    },
    {
      key: 'insurance_info',
      label: 'Insurance Information',
      type: 'TextArea',
      helperText: 'Whether item is insured, policy details, or coverage amount',
    },
    {
      key: 'appraisal_info',
      label: 'Appraisal Information',
      type: 'TextInputWithUpload',
      helperText:
        'Professional appraisals, certificates of authenticity, or valuation documents',
    },
    {
      key: 'intended_recipient',
      label: 'Intended Recipient',
      type: 'TextArea',
      helperText: 'Who you want to inherit this item',
    },
    {
      key: 'care_instructions',
      label: 'Care Instructions',
      type: 'TextArea',
      helperText: 'Special care, maintenance, or storage requirements',
    },
    {
      key: 'item_history',
      label: 'Item History/Significance',
      type: 'TextArea',
      helperText:
        'Family history, sentimental value, or why this item is important',
    },
    {
      key: 'item_documents',
      label: 'Item Documentation',
      type: 'TextInputWithUpload',
      helperText:
        'Upload photos, receipts, certificates, or other documentation',
    },
  ],
);

/* ============================================================
   SECTION 19B — REAL ESTATE PROPERTIES
============================================================ */

const SECTION_19B = createRepeatableSection(
  '19B',
  'Real Estate Properties',
  'Property',
  [
    {
      key: 'property_type',
      label: 'Property Type',
      type: 'Dropdown',
      options: [
        'Residential Rental',
        'Commercial Property',
        'Vacant Land',
        'Investment Property',
        'Vacation Home',
        'Mobile Home',
        'Condo/Townhouse',
        'Farm/Agricultural',
        'Other',
      ],
      helperText: 'Type of real estate property',
    },
    {
      key: 'property_type_other',
      label: 'Please specify other property type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of real estate property',
      conditionalDisplay: { field: 'property_type', value: 'Other' },
    },
    {
      key: 'property_address',
      label: 'Property Address',
      type: 'TextArea',
      helperText: 'Complete address of the property',
    },
    {
      key: 'property_description',
      label: 'Property Description',
      type: 'TextArea',
      helperText: 'Description of the property, size, features, etc.',
    },
    {
      key: 'ownership_details',
      label: 'Ownership Details',
      type: 'TextArea',
      helperText:
        'How property is owned (sole, joint, trust, etc.) and ownership percentages',
    },
    {
      key: 'purchase_info',
      label: 'Purchase Information',
      type: 'TextArea',
      helperText: 'When purchased, purchase price, and from whom',
    },
    {
      key: 'current_value',
      label: 'Current Estimated Value',
      type: 'TextInput',
      helperText: 'Current estimated market value',
    },
    {
      key: 'mortgage_info',
      label: 'Mortgage Information',
      type: 'TextArea',
      helperText: 'Outstanding mortgage balance, lender, payment details',
    },
    {
      key: 'rental_info',
      label: 'Rental Information',
      type: 'TextArea',
      helperText:
        'If rental property, tenant information, lease details, rental income',
    },
    {
      key: 'property_manager',
      label: 'Property Manager',
      type: 'TextInputWithUpload',
      helperText:
        'Contact information for property manager or management company',
    },
    {
      key: 'property_taxes',
      label: 'Property Tax Information',
      type: 'TextInputWithUpload',
      helperText: 'Annual property taxes, payment method, and upload tax bills',
    },
    {
      key: 'insurance_info',
      label: 'Property Insurance',
      type: 'TextInputWithUpload',
      helperText: 'Insurance company, policy number, coverage details',
    },
    {
      key: 'intended_disposition',
      label: 'Intended Disposition',
      type: 'TextArea',
      helperText:
        'Your wishes for this property (sell, keep in family, specific heir, etc.)',
    },
    {
      key: 'property_documents',
      label: 'Property Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload deeds, surveys, appraisals, or other property documents',
    },
  ],
);

type FieldGroup = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconWrap: string;
  layout: 'grid' | 'stack';
  fieldKeys: string[];
};

const SECTION_19A_GROUPS: FieldGroup[] = [
  {
    key: 'item_details',
    title: 'Item Details',
    subtitle: 'Type, description, and estimated value',
    icon: Gem,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'grid',
    fieldKeys: [
      'item_type',
      'item_type_other',
      'item_description',
      'estimated_value',
    ],
  },
  {
    key: 'purchase_location',
    title: 'Purchase & Location',
    subtitle: 'Where acquired and where the item is kept',
    icon: MapPin,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'grid',
    fieldKeys: ['purchase_info', 'current_location'],
  },
  {
    key: 'insurance_appraisal',
    title: 'Insurance & Appraisal',
    subtitle: 'Coverage details and professional valuations',
    icon: ShieldCheck,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'grid',
    fieldKeys: ['insurance_info', 'appraisal_info'],
  },
  {
    key: 'legacy_care',
    title: 'Legacy & Care',
    subtitle: 'Recipient wishes, care notes, and significance',
    icon: Heart,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'stack',
    fieldKeys: [
      'intended_recipient',
      'care_instructions',
      'item_history',
    ],
  },
  {
    key: 'documentation',
    title: 'Documentation',
    subtitle: 'Photos, receipts, and supporting records',
    icon: FileText,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: ['item_documents'],
  },
];

const SECTION_19B_GROUPS: FieldGroup[] = [
  {
    key: 'property_basics',
    title: 'Property Basics',
    subtitle: 'Type, address, and description',
    icon: Building2,
    accent: 'from-indigo-500/[0.07] to-blue-500/[0.03]',
    iconWrap: 'bg-indigo-500/10 text-indigo-700',
    layout: 'grid',
    fieldKeys: [
      'property_type',
      'property_type_other',
      'property_address',
      'property_description',
    ],
  },
  {
    key: 'ownership_value',
    title: 'Ownership & Value',
    subtitle: 'How owned, purchase history, and market value',
    icon: Landmark,
    accent: 'from-emerald-500/[0.07] to-teal-500/[0.03]',
    iconWrap: 'bg-emerald-500/10 text-emerald-700',
    layout: 'grid',
    fieldKeys: ['ownership_details', 'purchase_info', 'current_value'],
  },
  {
    key: 'financing_management',
    title: 'Financing & Management',
    subtitle: 'Mortgage, rental income, and property manager',
    icon: Receipt,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'stack',
    fieldKeys: ['mortgage_info', 'rental_info', 'property_manager'],
  },
  {
    key: 'taxes_insurance',
    title: 'Taxes & Insurance',
    subtitle: 'Property tax bills and insurance policies',
    icon: ShieldCheck,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'grid',
    fieldKeys: ['property_taxes', 'insurance_info'],
  },
  {
    key: 'disposition_records',
    title: 'Disposition & Records',
    subtitle: 'Future wishes and property documents',
    icon: ScrollText,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'stack',
    fieldKeys: ['intended_disposition', 'property_documents'],
  },
];

const SUBSECTION_GROUPS: Record<SubsectionId, FieldGroup[]> = {
  '19A': SECTION_19A_GROUPS,
  '19B': SECTION_19B_GROUPS,
};

const SUBSECTION_FIELD_MAP: Record<SubsectionId, Record<string, any>> = {
  '19A': Object.fromEntries(SECTION_19A.fields.map(f => [f.key, f])),
  '19B': Object.fromEntries(SECTION_19B.fields.map(f => [f.key, f])),
};

const SUBSECTION_OVERVIEW: Record<
  SubsectionId,
  { label: string; content: string }
> = {
  '19A': {
    label: 'Valuable Items Overview',
    content:
      'Document jewelry, collectibles, artwork, and other valuables your next of kin should know about. Add one card per item and group details by type, location, insurance, and who should inherit each piece.',
  },
  '19B': {
    label: 'Real Estate Overview',
    content:
      'Record rental properties, land, vacation homes, and other real estate you own outside your main residence. Add one card per property with ownership, financing, tax, and disposition details.',
  },
};

const SUBSECTION_SUBTITLE: Record<SubsectionId, string> = {
  '19A':
    'Add valuable items one at a time with grouped details in a clean two-column layout on desktop and mobile.',
  '19B':
    'Add each property with grouped ownership, financing, tax, and document details in the same mobile-friendly layout.',
};

/* ============================================================
   TYPES / HELPERS
============================================================ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
  activeTopicId?: string | null;
}

type SubsectionId = '19A' | '19B';

type UploadScope = '19A-full' | '19B-full' | `19A:${number}` | `19B:${number}`;

type UploadedAIFile = {
  file_id: string;
  mime_type: string;
  expires_at?: string;
};

const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;

const getReadableFileType = (mimeType?: string) => {
  if (!mimeType) return 'Document';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'text/plain') return 'Text';
  if (mimeType.includes('image')) return 'Image';
  return mimeType;
};

const createRowId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function Section19AssetsValuables({
  data = {},
  onChange = () => {},
  activeSubsection,
  activeTopicId,
}: Props) {
  const [aiNotice, setAiNotice] = useState('');
  const [aiError, setAiError] = useState('');

  const [uploadingScope, setUploadingScope] = useState<UploadScope | null>(
    null,
  );
  const [aiLoadingScope, setAiLoadingScope] = useState<UploadScope | null>(
    null,
  );

  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedAIFile | null>
  >({});

  const valuableItems: any[] = Array.isArray(data['19A']) ? data['19A'] : [];
  const properties: any[] = Array.isArray(data['19B']) ? data['19B'] : [];

  useScrollToVaultTopic(
    activeTopicId,
    valuableItems.length + properties.length,
  );

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const getConfig = (subsection: SubsectionId) => {
    return subsection === '19A' ? SECTION_19A : SECTION_19B;
  };

  const getItems = (subsection: SubsectionId) => {
    return subsection === '19A' ? valuableItems : properties;
  };

  const updateSubsection = (subsection: SubsectionId, next: any[]) => {
    onChange({
      ...data,
      [subsection]: next,
    });
  };

  const makeEmptyItem = (fields: any[]) => {
    return {
      ...Object.fromEntries(fields.map(field => [field.key, ''])),
      __rowId: createRowId(),
    };
  };

  const addItem = (subsection: SubsectionId) => {
    const config = getConfig(subsection);
    const items = getItems(subsection);

    updateSubsection(subsection, [...items, makeEmptyItem(config.fields)]);
  };

  const updateItem = (
    subsection: SubsectionId,
    index: number,
    key: string,
    value: any,
  ) => {
    const items = getItems(subsection);
    const next = [...items];

    next[index] = {
      ...(next[index] || {}),
      [key]: value,
      __rowId: next[index]?.__rowId || createRowId(),
    };

    updateSubsection(subsection, next);
  };

  const removeItem = (subsection: SubsectionId, index: number) => {
    const items = getItems(subsection);

    updateSubsection(
      subsection,
      items.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const getUploadedFileForScope = (scope: UploadScope) => {
    return uploadedFiles[scope] || null;
  };

  const cleanPatchObject = (patch: any) => {
    if (!patch || typeof patch !== 'object') return {};

    return Object.fromEntries(
      Object.entries(patch).filter(([key, value]) => {
        if (key === '__rowId') return false;
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      }),
    );
  };

  const normalizePatchItem = (subsection: SubsectionId, patch: any) => {
    const config = getConfig(subsection);

    return {
      ...makeEmptyItem(config.fields),
      ...cleanPatchObject(patch),
    };
  };

  const extractArrayFromPatch = (subsection: SubsectionId, patch: any) => {
    const rawItems = patch?.[subsection];

    if (Array.isArray(rawItems)) {
      return rawItems
        .map(item => normalizePatchItem(subsection, item))
        .filter(item => {
          return Object.entries(item).some(([key, value]) => {
            return key !== '__rowId' && value !== '';
          });
        });
    }

    if (rawItems && typeof rawItems === 'object') {
      const item = normalizePatchItem(subsection, rawItems);

      const hasValue = Object.entries(item).some(([key, value]) => {
        return key !== '__rowId' && value !== '';
      });

      return hasValue ? [item] : [];
    }

    return [];
  };

  const handleDocumentUpload = async (
    file?: File | null,
    scope?: UploadScope,
  ) => {
    try {
      if (!file || !scope) return;

      setAiError('');
      setAiNotice('');

      if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
        setAiError('Upload PDF, TXT, PNG, JPG, JPEG, or WEBP only.');
        return;
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        setAiError('File too large. Max 15MB.');
        return;
      }

      setUploadingScope(scope);

      const uploaded = await uploadAIDocument(file);

      setUploadedFiles(prev => ({
        ...prev,
 [scope]: {
    file_id: uploaded.file_id,
    mime_type: uploaded.mime_type,
    expires_at: uploaded.expires_at,
  },
      }));

      setAiNotice('Document uploaded. You can now use AI autofill.');
    } catch (err: any) {
      setAiError(err?.message || 'Document upload failed');
    } finally {
      setUploadingScope(null);
    }
  };

  const handleAutofill = async (
    subsection: SubsectionId,
    scope: UploadScope,
    itemIndex?: number,
  ) => {
    try {
      const uploadedFile = getUploadedFileForScope(scope);

      if (!uploadedFile) {
        setAiError('Please upload a document first.');
        return;
      }

      setAiError('');
      setAiNotice('');
      setAiLoadingScope(scope);

      const json = await autofillSectionFromDocument({
        section: 'assets_valuables',
        file_id: uploadedFile.file_id,
        subsection,
      });

      const patch = json?.result?.patch ?? {};
      const extractedItems = extractArrayFromPatch(subsection, patch);

      if (extractedItems.length === 0) {
        setAiError(
          subsection === '19A'
            ? 'AI could not find valuable item information in this document.'
            : 'AI could not find real estate property information in this document.',
        );
        return;
      }

      const config = getConfig(subsection);
      const items = getItems(subsection);

      if (typeof itemIndex === 'number') {
        const firstPatch = cleanPatchObject(extractedItems[0]);
        const next = [...items];

        next[itemIndex] = {
          ...(next[itemIndex] || makeEmptyItem(config.fields)),
          ...firstPatch,
          __rowId: next[itemIndex]?.__rowId || createRowId(),
        };

        updateSubsection(subsection, next);

        setAiNotice(
          `AI filled ${config.itemLabel} #${itemIndex + 1}. Please review the fields.`,
        );

        return;
      }

      updateSubsection(subsection, [...items, ...extractedItems]);

      setAiNotice(
        extractedItems.length === 1
          ? `AI added 1 ${config.itemLabel.toLowerCase()}. Please review the fields.`
          : `AI added ${extractedItems.length} ${config.itemLabel.toLowerCase()}s. Please review the fields.`,
      );
    } catch (err: any) {
      setAiError(err?.message || 'AI autofill failed');
    } finally {
      setAiLoadingScope(null);
    }
  };

  const renderUploader = ({
    subsection,
    scope,
    title,
    description,
    buttonLabel = 'Auto-fill',
    compact = false,
    onAutofill,
  }: {
    subsection: SubsectionId;
    scope: UploadScope;
    title: string;
    description: string;
    buttonLabel?: string;
    compact?: boolean;
    onAutofill: () => void;
  }) => {
    const uploadedFile = getUploadedFileForScope(scope);
    const isUploading = uploadingScope === scope;
    const isReading = aiLoadingScope === scope;
    const isValuable = subsection === '19A';

    const wrapperClass = isValuable
      ? 'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-amber-50/50 hover:border-amber-300'
      : 'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 hover:border-indigo-300';

    const iconClass = isValuable ? 'text-amber-600' : 'text-indigo-600';

    const uploadBoxClass = isValuable
      ? 'hover:border-amber-300 hover:bg-amber-50/50'
      : 'hover:border-indigo-300 hover:bg-indigo-50/50';

    const glowOne = isValuable ? 'bg-amber-100/70' : 'bg-indigo-100/70';
    const glowTwo = isValuable ? 'bg-yellow-100/70' : 'bg-blue-100/70';

    return (
      <div
        className={[
          'relative overflow-hidden rounded-2xl border border-dashed p-4 shadow-sm transition-all duration-200 hover:shadow-md',
          wrapperClass,
          compact ? 'space-y-3' : 'space-y-4',
        ].join(' ')}
      >
        <div
          className={[
            'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl',
            glowOne,
          ].join(' ')}
        />
        <div
          className={[
            'pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full blur-2xl',
            glowTwo,
          ].join(' ')}
        />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {isUploading ? (
                <Loader2 className={`h-5 w-5 animate-spin ${iconClass}`} />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className={`h-5 w-5 ${iconClass}`} />
              )}
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-900">{title}</p>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={onAutofill}
            disabled={isAnyAIActionRunning || !uploadedFile}
            className="shrink-0 rounded-xl"
          >
            {isReading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}

            {isReading ? 'Reading…' : buttonLabel}
          </Button>
        </div>

        <div className="relative grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <label
            className={[
              'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-5 text-center transition',
              uploadBoxClass,
              compact
                ? 'md:flex-row md:justify-start md:py-3 md:text-left'
                : '',
              isAnyAIActionRunning ? 'pointer-events-none opacity-60' : '',
            ].join(' ')}
          >
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.txt,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,image/png,image/jpeg,image/webp"
              disabled={isAnyAIActionRunning}
              onChange={event => {
                const file = event.currentTarget.files?.[0] || null;
                void handleDocumentUpload(file, scope);
                event.currentTarget.value = '';
              }}
            />

            <UploadCloud className={`h-5 w-5 ${iconClass}`} />

            <div>
              <p className="text-sm font-medium text-slate-800">
                Click to upload asset document
              </p>
              <p className="text-xs text-slate-500">
                PDF, TXT, PNG, JPG, JPEG, WEBP · Max 15MB
              </p>
            </div>
          </label>

          {uploadedFile && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <FileText className="h-4 w-4" />
              <span>{getReadableFileType(uploadedFile.mime_type)} ready</span>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="relative flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading document…
          </div>
        )}
      </div>
    );
  };

  const isFullWidthField = (field: any) =>
    field?.type === 'TextArea' ||
    field?.type === 'RadioButtons' ||
    field?.type === 'Instructions';

  const renderItemField = (
    subsection: SubsectionId,
    fieldKey: string,
    item: Record<string, any>,
    index: number,
  ) => {
    const field = SUBSECTION_FIELD_MAP[subsection][fieldKey];
    if (!field) return null;

    return (
      <DynamicFormField
        key={`${field.key}-${item.__rowId || index}`}
        field={field}
        value={item?.[field.key]}
        formData={item}
        rowId={item.__rowId}
        onChange={(value: any) => updateItem(subsection, index, field.key, value)}
        className="space-y-2"
      />
    );
  };

  const renderItemGroupFields = (
    subsection: SubsectionId,
    group: FieldGroup,
    item: Record<string, any>,
    index: number,
  ) => {
    if (group.layout === 'stack') {
      return (
        <div className="space-y-4">
          {group.fieldKeys.map(fieldKey =>
            renderItemField(subsection, fieldKey, item, index),
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {group.fieldKeys.map(fieldKey => {
          const field = SUBSECTION_FIELD_MAP[subsection][fieldKey];
          if (!field) return null;

          return (
            <div
              key={fieldKey}
              className={cn(isFullWidthField(field) && 'md:col-span-2')}
            >
              {renderItemField(subsection, fieldKey, item, index)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSubsection = (subsection: SubsectionId) => {
    const config = getConfig(subsection);
    const items = getItems(subsection);
    const isValuable = subsection === '19A';
    const fullScope = `${subsection}-full` as UploadScope;
    const Icon = isValuable ? Gem : Building2;
    const overview = SUBSECTION_OVERVIEW[subsection];
    const groups = SUBSECTION_GROUPS[subsection];

    const show = !activeSubsection || activeSubsection === subsection;
    if (!show) return null;

    return (
      <div
        key={subsection}
        id={`subsection-${subsection}`}
        className={cn(
          'rounded-3xl',
          activeSubsection === subsection && 'border border-primary p-1',
        )}
      >
        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 via-white to-indigo-50/60 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl tracking-tight text-slate-900">
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isValuable ? 'text-amber-600' : 'text-indigo-600',
                    )}
                  />
                  {subsection}. {config.title}
                </CardTitle>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  {SUBSECTION_SUBTITLE[subsection]}
                </p>
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 sm:self-end">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  AES-256-GCM encrypted at rest
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addItem(subsection)}
                  className="rounded-xl"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add {config.itemLabel}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_36%)] p-4 sm:p-6">
            <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Info className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {overview.label}
                </p>
                <p className="text-sm leading-6 text-slate-600">
                  {overview.content}
                </p>
              </div>
            </div>
            {/* {renderUploader({
              subsection,
              scope: fullScope,
              title: isValuable
                ? 'Upload document for multiple valuable items'
                : 'Upload document for multiple real estate properties',
              description: isValuable
                ? 'Use this if one document contains one or more valuable items, appraisals, receipts, certificates, photos, insurance schedules, or item inventories. AI will add extracted items as new cards.'
                : 'Use this if one document contains one or more properties, deeds, tax bills, leases, appraisals, mortgage statements, insurance policies, or property records. AI will add extracted properties as new cards.',
              buttonLabel: isValuable
                ? 'Extract Valuable Items'
                : 'Extract Properties',
              onAutofill: () => handleAutofill(subsection, fullScope),
            })} */}

            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-500" />
                </div>

                <p className="font-medium text-slate-800">
                  No {config.title.toLowerCase()} added yet.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Click “Add {config.itemLabel}” to create a blank card, or
                  upload a document above and let AI create the card.
                </p>
              </div>
            )}

            {items.map((item, index) => {
              const itemScope = `${subsection}:${index}` as UploadScope;
              const itemLabel = `${config.itemLabel} #${index + 1}`;
              const topicProps = getTopicCardProps(
                subsection,
                index,
                activeTopicId,
              );

              return (
                <Card
                  key={item.__rowId || `${subsection}-${index}`}
                  id={topicProps.id}
                  className={topicProps.className}
                >
                  <div className="flex flex-col gap-3 border-b bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <strong className="text-slate-900">{itemLabel}</strong>

                      <p className="text-sm text-slate-500">
                        {isValuable
                          ? 'Upload a receipt, appraisal, certificate, photo, insurance schedule, inventory sheet, or item document to autofill only this valuable item.'
                          : 'Upload a deed, tax bill, lease, mortgage statement, appraisal, insurance policy, or property document to autofill only this property.'}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeItem(subsection, index)}
                      className="rounded-xl"
                    >
                      <Minus className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>

                  <CardContent className="space-y-6 p-5">
                    {renderUploader({
                      subsection,
                      scope: itemScope,
                      title: `Upload document for ${itemLabel}`,
                      description: `This will autofill only ${itemLabel}. It will not overwrite other cards.`,
                      buttonLabel: `Auto-fill ${itemLabel}`,
                      compact: true,
                      onAutofill: () =>
                        handleAutofill(subsection, itemScope, index),
                    })}

                    <div className="grid gap-5 xl:grid-cols-2">
                      {groups.map(group => {
                        const GroupIcon = group.icon;

                        return (
                          <section
                            key={group.key}
                            className={cn(
                              'overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br shadow-sm',
                              group.accent,
                              group.layout === 'stack' && 'xl:col-span-2',
                            )}
                          >
                            <div className="border-b border-white/60 bg-white/50 px-5 py-4 backdrop-blur-sm">
                              <div className="flex items-start gap-3">
                                <div
                                  className={cn(
                                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                                    group.iconWrap,
                                  )}
                                >
                                  <GroupIcon className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                  <h3 className="text-base font-semibold text-slate-900">
                                    {group.title}
                                  </h3>
                                  <p className="mt-0.5 text-sm text-slate-600">
                                    {group.subtitle}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="px-3 py-5">
                              {renderItemGroupFields(
                                subsection,
                                group,
                                item,
                                index,
                              )}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {(aiNotice || aiError) && (
        <div className="space-y-3">
          {aiNotice && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{aiNotice}</AlertDescription>
            </Alert>
          )}

          {aiError && (
            <Alert variant="destructive">
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {renderSubsection('19A')}
      {renderSubsection('19B')}
    </div>
  );
}
