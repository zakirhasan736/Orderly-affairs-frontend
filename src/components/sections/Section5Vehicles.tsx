'use client';

import React, { useEffect, useRef, useState } from 'react';
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

import { releaseDeferredAiRoutingDialog, runAiSectionAutofill } from '@/services/aiSectionAutofill';
import {
  createEmptyItemFromFields,
  mergeAiPatchWithDefaults,
} from '@/utils/aiPatchNormalizer';
import { isJunkVehicleCard, vehiclesAreDuplicates } from '@/utils/aiItemDedup';
import { useAiMultiItemAutofill } from '@/hooks/useAiMultiItemAutofill';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import {
  resolveAiUploadedFileForScope,
  useRestoreAiPendingUploadForSection,
} from '@/hooks/useAiUploadedFileResolver';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import { SectionAiDocumentUploader } from '@/components/ai/SectionAiDocumentUploader';
import {
  buildUploadedAiFile,
  type UploadedAIFile,
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';
import { getItemDisplayLabel } from '@/utils/dynamicVaultTopics';

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

  const aiRouting = useOptionalAiDocumentRouting();

  useRestoreAiPendingUploadForSection({
    sectionId: '5',
    setUploadedFiles,
    latestUploadRef,
  });

  // Coerce a legacy single-object save so one card still renders.
  // Drop OCR junk titles like "TO.01/08" that are not real vehicles.
  const vehiclesRaw: any[] = Array.isArray(data['5A'])
    ? data['5A']
    : data['5A'] && typeof data['5A'] === 'object'
      ? [data['5A']]
      : [];
  const vehicles: any[] = vehiclesRaw.filter(
    item =>
      item &&
      typeof item === 'object' &&
      !isJunkVehicleCard(item as Record<string, unknown>),
  );

  useEffect(() => {
    if (vehiclesRaw.length > 0 && vehicles.length !== vehiclesRaw.length) {
      onChange({
        ...data,
        '5A': vehicles,
      });
    }
    // One-time prune of junk cards already saved in the vault.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const show5A = !activeSubsection || activeSubsection === '5A';

  useScrollToVaultTopic(activeTopicId, vehicles.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const createEmptyVehicle = () => createEmptyItemFromFields(SECTION_5.fields);

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

  const multiItemAutofill = useAiMultiItemAutofill({
    itemLabel: SECTION_5.itemLabel,
    createEmpty: createEmptyVehicle,
    getCurrentItems: () => vehicles,
    setItems: updateVehicles,
    setAiNotice,
    describeFields: ['make', 'model', 'year', 'vin'],
    isDuplicate: vehiclesAreDuplicates,
    conflictMode: 'ask',
    onFlowComplete: () => releaseDeferredAiRoutingDialog(aiRouting),
  });

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('5', String(scope)) ?? null;

    return resolveAiUploadedFileForScope(scope, uploadedFiles, latestUploadRef, pendingFile);
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

  const normalizeVehiclePatch = (patch: any) =>
    mergeAiPatchWithDefaults(patch, SECTION_5.fields, createEmptyVehicle);

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
        )
        .filter(vehicle => !isJunkVehicleCard(vehicle as Record<string, unknown>));
    }

    if (rawVehicles && typeof rawVehicles === 'object') {
      const vehicle = normalizeVehiclePatch(rawVehicles);

      return Object.values(vehicle).some(value => !isEmptyValue(value))
        ? [vehicle]
        : [];
    }

    return [];
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

      const uploaded = await uploadAIDocument(file, { section: '5' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '5',
        source: 'section',
      });

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
    
      return uploadedRecord;
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

      const json = await runAiSectionAutofill({
        sectionKey: 'vehicles',
        sectionId: '5',
        file_id: uploadedFile.file_id,
        mime_type: uploadedFile.mime_type,
        subsection: '5A',
        uploadScope: String(scope),
        fields: SECTION_5.fields,
        aiRouting,
        });

      if (!json) return;

      const patch = json?.result?.patch ?? {};
      const extractedVehicles = extractVehicleArrayFromPatch(patch);

      if (extractedVehicles.length === 0) {
        const hasInsuranceFollowUp = (json.additional_sections || []).some(
          section => section.section_key === 'insurance_policies',
        );
        if (hasInsuranceFollowUp) {
          setAiNotice(
            'No new vehicle fields were found, but insurance details are ready in the Insurance section.',
          );
          releaseDeferredAiRoutingDialog(aiRouting);
          return;
        }
        setAiError('AI could not find vehicle information in this document.');
        releaseDeferredAiRoutingDialog(aiRouting);
        return;
      }

      const disposition = multiItemAutofill.processExtraction(
        extractedVehicles,
        vehicleIndex,
        {
          setAiError,
          setAiNotice,
          emptyError:
            'AI could not find vehicle information in this document.',
        },
      );
      if (disposition !== 'pending_user') {
        releaseDeferredAiRoutingDialog(aiRouting);
      }
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
      sectionId="5"
      subsectionId="5A"
      disabled={isAnyAIActionRunning}
      isUploading={uploadingScope === scope}
      isReading={aiLoadingScope === scope}
      uploadedFile={getUploadedFileForScope(scope)}
      highlightUpload={aiRouting?.shouldHighlightUpload('5', String(scope)) ?? false}
      showOverviewPin={aiRouting?.shouldShowOverviewPin('5') ?? false}
      onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
      onAutofill={onAutofill}
    />
  );

  if (!show5A) return null;

  return (
    <div className="space-y-8">
      {multiItemAutofill.dialog}

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
            const itemLabel = getItemDisplayLabel(
              '5',
              '5A',
              vehicle || {},
              index,
              SECTION_5.itemLabel,
            );
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
                      Fill in the details for this vehicle, or use the document
                      uploader above to extract information automatically.
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
                  <p className="text-sm text-slate-500">
                    Use the uploader at the top of this page to extract one or
                    more vehicles. Edit the fields below for this vehicle card.
                  </p>

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
