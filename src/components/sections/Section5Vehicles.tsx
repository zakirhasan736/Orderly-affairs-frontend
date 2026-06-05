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
  Car,
} from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { autofillSectionFromDocument } from '@/services/aiAutofill';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const SECTION_5 = {
  subsectionId: '5A',
  title: 'Current Vehicles',
  itemLabel: 'Vehicle',
  fields: [
    {
      key: 'year',
      label: 'Year',
      type: 'TextInput',
      helperText: 'Vehicle year',
    },
    {
      key: 'make',
      label: 'Make',
      type: 'TextInput',
      helperText: 'Vehicle manufacturer',
    },
    {
      key: 'model',
      label: 'Model',
      type: 'TextInput',
      helperText: 'Vehicle model',
    },
    {
      key: 'color',
      label: 'Color',
      type: 'TextInput',
      helperText: 'Vehicle color',
    },
    {
      key: 'vin',
      label: 'VIN',
      type: 'TextInput',
      helperText: 'Vehicle identification number',
    },
    {
      key: 'license_plate',
      label: 'License Plate',
      type: 'TextInput',
      helperText: 'Current license plate number',
    },
    {
      key: 'registration_expiry',
      label: 'Registration Expiry',
      type: 'DatePicker',
      helperText: 'When does registration expire?',
    },
    {
      key: 'insurance_company',
      label: 'Insurance Company',
      type: 'TextInput',
      helperText: 'Current insurance provider',
    },
    {
      key: 'insurance_policy',
      label: 'Insurance Policy Number',
      type: 'TextInput',
      helperText: 'Insurance policy number',
    },
    {
      key: 'financing',
      label: 'Financing Information',
      type: 'TextArea',
      helperText: 'Loan details, payment information, or if owned outright',
    },
    {
      key: 'maintenance_records',
      label: 'Maintenance Records',
      type: 'TextInputWithUpload',
      helperText: 'Service records, receipts, or maintenance schedule',
    },
    {
      key: 'parking_location',
      label: 'Usual Parking Location',
      type: 'TextInput',
      helperText: 'Where the vehicle is typically parked',
    },
    {
      key: 'spare_keys',
      label: 'Spare Key Locations',
      type: 'TextInput',
      helperText: 'Where spare keys are located',
    },
    {
      key: 'notes',
      label: 'Additional Notes',
      type: 'TextArea',
      helperText: 'Any other important information about this vehicle',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
  activeTopicId?: string | null;
}

type UploadScope = 'full' | `vehicle:${number}`;

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

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section5Vehicles({
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
  >({
    full: null,
  });

  const vehicles: any[] = Array.isArray(data['5A']) ? data['5A'] : [];

  const show5A = !activeSubsection || activeSubsection === '5A';

  useScrollToVaultTopic(activeTopicId, vehicles.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyVehicle = () => {
    return Object.fromEntries(SECTION_5.fields.map(field => [field.key, '']));
  };

  const updateVehicles = (next: any[]) => {
    onChange({
      ...data,
      '5A': next,
    });
  };

  const addVehicle = () => {
    updateVehicles([...vehicles, createEmptyVehicle()]);
  };

  const updateVehicle = (index: number, fieldKey: string, value: any) => {
    const next = [...vehicles];

    next[index] = {
      ...(next[index] || {}),
      [fieldKey]: value,
    };

    updateVehicles(next);
  };

  const removeVehicle = (index: number) => {
    updateVehicles(vehicles.filter((_, itemIndex) => itemIndex !== index));
  };

  const getUploadedFileForScope = (scope: UploadScope) => {
    return uploadedFiles[scope] || null;
  };

  const cleanPatchObject = (patch: any) => {
    if (!patch || typeof patch !== 'object') return {};

    return Object.fromEntries(
      Object.entries(patch).filter(([, value]) => {
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      }),
    );
  };

  const normalizeVehiclePatch = (patch: any) => {
    return {
      ...createEmptyVehicle(),
      ...cleanPatchObject(patch),
    };
  };

  const extractVehicleArrayFromPatch = (patch: any) => {
    const rawVehicles = patch?.['5A'];

    if (Array.isArray(rawVehicles)) {
      return rawVehicles
        .map(vehicle => normalizeVehiclePatch(vehicle))
        .filter(vehicle => {
          return Object.values(vehicle).some(value => value !== '');
        });
    }

    if (rawVehicles && typeof rawVehicles === 'object') {
      const vehicle = normalizeVehiclePatch(rawVehicles);

      return Object.values(vehicle).some(value => value !== '')
        ? [vehicle]
        : [];
    }

    return [];
  };

  const handleDocumentUpload = async (
    file?: File | null,
    scope: UploadScope = 'full',
  ) => {
    try {
      if (!file) return;

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
    scope: UploadScope = 'full',
    vehicleIndex?: number,
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
        section: 'vehicles',
        file_id: uploadedFile.file_id,
        subsection: '5A',
      });

      const patch = json?.result?.patch ?? {};
      const extractedVehicles = extractVehicleArrayFromPatch(patch);

      if (extractedVehicles.length === 0) {
        setAiError('AI could not find vehicle information in this document.');
        return;
      }

      if (typeof vehicleIndex === 'number') {
        const firstVehicle = cleanPatchObject(extractedVehicles[0]);
        const next = [...vehicles];

        next[vehicleIndex] = {
          ...(next[vehicleIndex] || createEmptyVehicle()),
          ...firstVehicle,
        };

        updateVehicles(next);

        setAiNotice(
          `AI filled ${SECTION_5.itemLabel} #${vehicleIndex + 1}. Please review the fields.`,
        );

        return;
      }

      updateVehicles([...vehicles, ...extractedVehicles]);

      setAiNotice(
        extractedVehicles.length === 1
          ? 'AI added 1 vehicle. Please review the fields.'
          : `AI added ${extractedVehicles.length} vehicles. Please review the fields.`,
      );
    } catch (err: any) {
      setAiError(err?.message || 'AI autofill failed');
    } finally {
      setAiLoadingScope(null);
    }
  };

  const renderUploader = ({
    scope,
    title,
    description,
    buttonLabel = 'Auto-fill',
    onAutofill,
    compact = false,
  }: {
    scope: UploadScope;
    title: string;
    description: string;
    buttonLabel?: string;
    onAutofill: () => void;
    compact?: boolean;
  }) => {
    const uploadedFile = getUploadedFileForScope(scope);
    const isUploading = uploadingScope === scope;
    const isReading = aiLoadingScope === scope;

    return (
      <div
        className={[
          'relative overflow-hidden rounded-2xl border border-dashed',
          'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-blue-50/50',
          'p-4 shadow-sm transition-all duration-200',
          'hover:border-blue-300 hover:shadow-md',
          compact ? 'space-y-3' : 'space-y-4',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-cyan-100/70 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className="h-5 w-5 text-blue-600" />
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
              'group flex cursor-pointer flex-col items-center justify-center gap-2',
              'rounded-xl border border-slate-200 bg-white/80 px-4 py-5 text-center',
              'transition hover:border-blue-300 hover:bg-blue-50/50',
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

            <UploadCloud className="h-5 w-5 text-slate-500 group-hover:text-blue-600" />

            <div>
              <p className="text-sm font-medium text-slate-800">
                Click to upload vehicle document
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

  if (!show5A) return null;

  return (
    <div className="space-y-8">
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

      <Card
        id="subsection-5A"
        className="overflow-hidden border-slate-200 shadow-sm"
      >
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              5A. {SECTION_5.title}
            </CardTitle>

            <Button
              type="button"
              size="sm"
              onClick={addVehicle}
              className="rounded-xl"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add {SECTION_5.itemLabel}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-5">
          {/* {renderUploader({
            scope: 'full',
            title: 'Upload document for multiple vehicles',
            description:
              'Use this if one document contains one or more vehicles. AI will add extracted vehicles as new vehicle cards.',
            buttonLabel: 'Extract Vehicles',
            onAutofill: () => handleAutofill('full'),
          })} */}

          {vehicles.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <Car className="h-5 w-5 text-slate-500" />
              </div>

              <p className="font-medium text-slate-800">
                No vehicles added yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Click “Add Vehicle” to create a blank vehicle card, or upload a
                vehicle document above and let AI create the card.
              </p>
            </div>
          )}

          {vehicles.map((vehicle, index) => {
            const itemScope = `vehicle:${index}` as UploadScope;
            const itemLabel = `${SECTION_5.itemLabel} #${index + 1}`;
            const topicProps = getTopicCardProps('5A', index, activeTopicId);

            return (
              <Card
                key={`${itemScope}-${index}`}
                id={topicProps.id}
                className={topicProps.className}
              >
                <div className="flex flex-col gap-3 border-b bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong className="text-slate-900">{itemLabel}</strong>

                    <p className="text-sm text-slate-500">
                      Upload a registration, insurance card, title, loan
                      document, or maintenance receipt to autofill only this
                      vehicle.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeVehicle(index)}
                    className="rounded-xl"
                  >
                    <Minus className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <CardContent className="space-y-6 p-5">
                  {renderUploader({
                    scope: itemScope,
                    title: `Upload document for ${itemLabel}`,
                    description: `This will autofill only ${itemLabel}. It will not overwrite other vehicle cards.`,
                    buttonLabel: `Auto-fill ${itemLabel}`,
                    compact: true,
                    onAutofill: () => handleAutofill(itemScope, index),
                  })}

                  <div className="grid gap-4 md:grid-cols-2">
                    {SECTION_5.fields.map(field => (
                      <DynamicFormField
                        key={field.key}
                        field={field}
                        value={vehicle?.[field.key]}
                        formData={vehicle}
                        onChange={value =>
                          updateVehicle(index, field.key, value)
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
