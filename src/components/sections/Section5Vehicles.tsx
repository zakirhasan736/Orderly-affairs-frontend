'use client';

import React, { useRef, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
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
import { SectionAiDocumentUploader } from '@/components/ai/SectionAiDocumentUploader';
import {
  type UploadedAIFile,
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';
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



const describeVehicle = (vehicle: Record<string, unknown>) => {
  const parts = [vehicle.year, vehicle.make, vehicle.model]
    .filter(value => value !== null && value !== undefined && value !== '')
    .map(value => String(value));

  if (parts.length > 0) return parts.join(' ');
  if (vehicle.vin) return `VIN ${vehicle.vin}`;
  return 'Vehicle';
};

const isEmptyValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (
    typeof value === 'object' &&
    value !== null &&
    'text' in value &&
    'files' in value
  ) {
    const uploadValue = value as { text?: string; files?: unknown[] };
    return !uploadValue.text && (!uploadValue.files || uploadValue.files.length === 0);
  }
  return false;
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

  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});
  const [multiVehiclePrompt, setMultiVehiclePrompt] = useState<{
    vehicles: Record<string, unknown>[];
    targetIndex?: number;
  } | null>(null);

  const vehicles: any[] = Array.isArray(data['5A']) ? data['5A'] : [];

  const show5A = !activeSubsection || activeSubsection === '5A';

  useScrollToVaultTopic(activeTopicId, vehicles.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyVehicle = () => {
    return Object.fromEntries(
      SECTION_5.fields.map(field => [
        field.key,
        field.type === 'TextInputWithUpload'
          ? { text: '', files: [], _deleted_files: [] }
          : '',
      ]),
    );
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
    return latestUploadRef.current[String(scope)] ?? uploadedFiles[scope] ?? null;
  };

  const cleanPatchObject = (patch: any) => {
    if (!patch || typeof patch !== 'object') return {};

    return Object.fromEntries(
      Object.entries(patch)
        .map(([key, value]) => {
          if (key === 'year' && value !== null && value !== undefined && value !== '') {
            return [key, String(value)];
          }
          return [key, value];
        })
        .filter(([, value]) => !isEmptyValue(value)),
    );
  };

  const normalizeVehiclePatch = (patch: any) => {
    return {
      ...createEmptyVehicle(),
      ...cleanPatchObject(patch),
    };
  };

  const extractVehicleArrayFromPatch = (patch: any) => {
    const root =
      patch?.patch && typeof patch.patch === 'object' ? patch.patch : patch;
    let rawVehicles = root?.['5A'];

    if (
      !rawVehicles &&
      root &&
      typeof root === 'object' &&
      !Array.isArray(root) &&
      (root.vin || root.make || root.model || root.year)
    ) {
      rawVehicles = [root];
    }

    if (Array.isArray(rawVehicles)) {
      return rawVehicles
        .map(vehicle => normalizeVehiclePatch(vehicle))
        .filter(vehicle =>
          Object.values(vehicle).some(value => !isEmptyValue(value)),
        );
    }

    if (rawVehicles && typeof rawVehicles === 'object') {
      const vehicle = normalizeVehiclePatch(rawVehicles);

      return Object.values(vehicle).some(value => !isEmptyValue(value))
        ? [vehicle]
        : [];
    }

    return [];
  };

  const applyExtractedVehicles = (
    extractedVehicles: Record<string, unknown>[],
    targetIndex?: number,
  ) => {
    const normalized = extractedVehicles.map(vehicle =>
      normalizeVehiclePatch(cleanPatchObject(vehicle)),
    );

    if (normalized.length === 0) return;

    if (typeof targetIndex === 'number') {
      const next = [...vehicles];

      normalized.forEach((vehicle, offset) => {
        const index = targetIndex + offset;

        if (index < next.length) {
          next[index] = {
            ...(next[index] || createEmptyVehicle()),
            ...vehicle,
          };
        } else {
          next.push(vehicle);
        }
      });

      updateVehicles(next);
      return;
    }

    updateVehicles([...vehicles, ...normalized]);
  };

  const finishAutofillNotice = (
    count: number,
    targetIndex?: number,
    addedAll = true,
  ) => {
    if (count === 1 && typeof targetIndex === 'number') {
      setAiNotice(
        `AI filled ${SECTION_5.itemLabel} #${targetIndex + 1}. Please review the fields.`,
      );
      return;
    }

    if (typeof targetIndex === 'number') {
      setAiNotice(
        addedAll
          ? `AI filled ${count} vehicles starting at ${SECTION_5.itemLabel} #${targetIndex + 1}. Please review each card.`
          : `AI filled only ${SECTION_5.itemLabel} #${targetIndex + 1}. Please review the fields.`,
      );
      return;
    }

    setAiNotice(
      count === 1
        ? 'AI added 1 vehicle. Please review the fields.'
        : `AI added ${count} vehicles. Please review the fields.`,
    );
  };

  const handleDocumentUpload = async (file?: File | null,
    scope: UploadScope = 'full', runAutofill?: () => void | Promise<void>) => {
    try {
      if (!file) return;

      setAiError('');
      setAiNotice('');

      const validationError = validateAiDocumentFile(file);
      if (validationError) {
        setAiError(validationError);
        return;
      }

      setUploadingScope(scope);

      const uploaded = await uploadAIDocument(file);

      const uploadedRecord: UploadedAIFile = {
        file_id: uploaded.file_id,
        mime_type: uploaded.mime_type,
        expires_at: uploaded.expires_at,
      };

      latestUploadRef.current[String(scope)] = uploadedRecord;
      setUploadedFiles(prev => ({
        ...prev,
        [scope]: uploadedRecord,
      }));

      setUploadingScope(null);
      setAiNotice('Document uploaded. Running AI autofill…');

      if (runAutofill) {
        await runAutofill();
      }
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

      if (extractedVehicles.length > 1) {
        setMultiVehiclePrompt({
          vehicles: extractedVehicles,
          targetIndex: vehicleIndex,
        });
        setAiNotice(
          `Found ${extractedVehicles.length} vehicles in this document.`,
        );
        return;
      }

      applyExtractedVehicles(extractedVehicles, vehicleIndex);
      finishAutofillNotice(1, vehicleIndex);
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
    uploadLabel,
    onAutofill,
    compact = false,
    tone,
  }: {
    scope: UploadScope;
    title: string;
    description: string;
    buttonLabel?: string;
    uploadLabel?: string;
    onAutofill: () => void | Promise<void>;
    compact?: boolean;
    tone?: import('@/components/ai/SectionAiDocumentUploader').SectionAiUploaderTone;
  }) => (
    <SectionAiDocumentUploader
      title={title}
      description={description}
      buttonLabel={buttonLabel}
      uploadLabel={uploadLabel}
      compact={compact}
      tone={tone}
      disabled={isAnyAIActionRunning}
      isUploading={uploadingScope === scope}
      isReading={aiLoadingScope === scope}
      uploadedMimeType={getUploadedFileForScope(scope)?.mime_type}
      onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
      onAutofill={onAutofill}
    />
  );

  if (!show5A) return null;

  const pendingVehicleCount = multiVehiclePrompt?.vehicles.length ?? 0;
  const pendingTargetIndex = multiVehiclePrompt?.targetIndex;

  return (
    <div className="space-y-8">
      <AlertDialog
        open={multiVehiclePrompt !== null}
        onOpenChange={open => {
          if (!open) setMultiVehiclePrompt(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingVehicleCount} vehicles found
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p>
                  This document appears to list multiple vehicles. Would you
                  like to create a separate vehicle card for each one and
                  auto-fill them?
                </p>
                <ul className="space-y-1 rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                  {multiVehiclePrompt?.vehicles.map((vehicle, index) => (
                    <li key={`pending-vehicle-${index}`}>
                      {index + 1}. {describeVehicle(vehicle)}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                if (!multiVehiclePrompt) return;
                applyExtractedVehicles(
                  [multiVehiclePrompt.vehicles[0]],
                  pendingTargetIndex,
                );
                finishAutofillNotice(1, pendingTargetIndex, false);
                setMultiVehiclePrompt(null);
              }}
            >
              Only fill{' '}
              {typeof pendingTargetIndex === 'number'
                ? `${SECTION_5.itemLabel} #${pendingTargetIndex + 1}`
                : 'the first vehicle'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!multiVehiclePrompt) return;
                applyExtractedVehicles(
                  multiVehiclePrompt.vehicles,
                  pendingTargetIndex,
                );
                finishAutofillNotice(
                  multiVehiclePrompt.vehicles.length,
                  pendingTargetIndex,
                  true,
                );
                setMultiVehiclePrompt(null);
              }}
            >
              Add all {pendingVehicleCount} vehicles
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          {renderUploader({
            scope: 'full',
            title: 'Upload document for one or more vehicles',
            description:
              'Use this for insurance cards, registration documents, or any file that may list multiple vehicles. AI will detect each vehicle and can create separate cards.',
            buttonLabel: 'Extract Vehicles',
            onAutofill: () => handleAutofill('full'),
          })}

          {vehicles.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <Car className="h-5 w-5 text-slate-500" />
              </div>

              <p className="font-medium text-slate-800">
                No vehicles added yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Upload an insurance card or registration above to auto-detect
                multiple vehicles, or click “Add Vehicle” to start a blank card.
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
                      document, or maintenance receipt. If the document lists
                      multiple vehicles, AI can create and fill additional
                      cards.
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
                    description: `AI will fill ${itemLabel} first. If multiple vehicles are found (for example, an insurance card with 2 cars), you can add them all as separate cards.`,
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
