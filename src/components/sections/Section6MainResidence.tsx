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
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  Home,
} from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { autofillSectionFromDocument } from '@/services/aiAutofill';
import { uploadAIDocument } from '@/services/aiDocumentUpload';

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const SECTION_6A = {
  id: '6A',
  title: 'Home Information & Inventory',
  fields: [
    {
      key: 'inventory_instructions',
      label: 'Home Inventory Instructions',
      type: 'Instructions',
      content:
        'Document anything of value in your home, either on paper or even on video. Share details about sentimental, historical, or monetary items you want noted. This record is helpful for individuals who will inherit specific items and aids in processing insurance claims.',
    },
    {
      key: 'home_address',
      label: 'Home Address',
      type: 'TextArea',
      helperText: 'Full address of your primary residence',
      required: true,
    },
    {
      key: 'residence_type',
      label: 'Type of Residence',
      type: 'Dropdown',
      options: [
        'Single Family Home',
        'Townhouse',
        'Condominium',
        'Apartment',
        'Mobile Home',
        'Other',
      ],
      helperText: 'Type of your primary residence',
    },
    {
      key: 'custom_residence_type',
      label: 'Specify Residence Type',
      type: 'TextInput',
      placeholder: 'Enter custom residence type',
      helperText: 'Please specify the type of residence',
      conditionalOn: 'residence_type',
      conditionalValue: 'Other',
    },
    {
      key: 'ownership_status',
      label: 'Ownership Status',
      type: 'RadioButtons',
      options: ['Own', 'Rent', 'Other'],
      helperText: 'Do you own or rent your primary residence?',
    },
    {
      key: 'ownership_type',
      label: 'Ownership Type',
      type: 'Dropdown',
      options: [
        'Sole Ownership',
        'Joint Tenancy',
        'Tenants in Common',
        'Community Property',
        'Life Estate',
        'Trust Ownership',
        'Other',
      ],
      helperText: 'How the home is owned',
      conditionalOn: 'ownership_status',
      conditionalValue: 'Own',
    },
    {
      key: 'custom_ownership_type',
      label: 'Specify Ownership Type',
      type: 'TextInput',
      placeholder: 'Enter custom ownership type',
      helperText: 'Please specify the type of ownership',
      conditionalOn: 'ownership_type',
      conditionalValue: 'Other',
    },
    {
      key: 'year_purchased_leased',
      label: 'Year Purchased or Leased',
      type: 'TextInput',
      helperText: 'Year you acquired or began leasing this property',
    },
    {
      key: 'joint_owners',
      label: 'Joint Owner(s)',
      type: 'TextArea',
      helperText: 'Names and relationships of any co-owners or joint tenants',
    },
    {
      key: 'county',
      label: 'County',
      type: 'TextInput',
      helperText: 'County where the property is located',
    },
    {
      key: 'mortgage_financial_documents_label',
      label: 'Mortgage & Financial Documents',
      type: 'Instructions',
      content:
        'Important financial documents and statements for property ownership and financing',
    },
    {
      key: 'mortgage_lienholder_landlord',
      label: 'Mortgage Lienholder or Landlord',
      type: 'TextInputWithUpload',
      helperText:
        'Primary lender or landlord contact information and business card if available',
    },
    {
      key: 'payment_methods',
      label: 'Payment Methods Used',
      type: 'TextArea',
      helperText:
        'How payments are made (check, online, autopay, etc.) and include online access details if available',
    },
    {
      key: 'property_ownership_docs_label',
      label: 'Property Ownership Documents',
      type: 'Instructions',
      content:
        'Essential legal documents that establish and verify property ownership',
    },
    {
      key: 'property_deeds_titles',
      label: 'Property Deeds & Titles',
      type: 'TextInputWithUpload',
      helperText:
        'Upload deeds and titles or note their location (Recommendation: Place in Protected Documents bag)',
    },
    {
      key: 'current_financing_docs_label',
      label: 'Current Financing Documents',
      type: 'Instructions',
      content:
        'Current mortgage statements, loans, and ongoing financial obligations for the property',
    },
    {
      key: 'mortgage_lease_statement',
      label: 'Current Mortgage Statement or Lease Agreement',
      type: 'TextInputWithUpload',
      helperText: 'Upload current mortgage statement or lease agreement copy',
    },
    {
      key: 'second_mortgage_heloc',
      label: 'Second Mortgages or HELOCs',
      type: 'TextInputWithUpload',
      helperText:
        'Statements for any second mortgages or Home Equity Lines of Credit',
    },
    {
      key: 'property_tax_bills',
      label: 'Property Tax Bills or Statements',
      type: 'TextInputWithUpload',
      helperText: 'Upload current property tax bills and payment records',
    },
    {
      key: 'historical_special_docs_label',
      label: 'Historical & Special Documents',
      type: 'Instructions',
      content:
        'Past transactions, paid-off debts, and special financing arrangements',
    },
    {
      key: 'closing_refinancing_docs',
      label: 'Closing or Refinancing Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload closing/refinancing documents or notes on where they can be found',
    },
    {
      key: 'paid_off_documentation',
      label: 'Paid-Off Liens/Mortgages',
      type: 'TextInputWithUpload',
      helperText:
        'Documentation confirming any liens, notes, or mortgages have been paid off',
    },
    {
      key: 'reverse_mortgage_info',
      label: 'Reverse Mortgage Information',
      type: 'TextInputWithUpload',
      helperText: 'Information and documents about any reverse mortgages',
    },
    {
      key: 'professional_contacts_label',
      label: 'Professional Contacts',
      type: 'Instructions',
      content:
        'Real estate professionals and service providers related to your property',
    },
    {
      key: 'realtor_landlord_contact',
      label: 'Real Estate Agent or Landlord Contact',
      type: 'TextInputWithUpload',
      helperText:
        'Contact details and business cards for real estate agent or landlord',
    },
    {
      key: 'occupancy_info_label',
      label: 'Current Occupancy Information',
      type: 'Instructions',
      content: 'Details about who currently lives in the home and any pets',
    },
    {
      key: 'residents',
      label: 'Residents',
      type: 'TextArea',
      helperText: 'Names of all people currently living in the home',
    },
    {
      key: 'pets',
      label: 'Pets',
      type: 'TextArea',
      helperText:
        'Details about pets, including names, types, and any special care instructions',
    },
    {
      key: 'year_built',
      label: 'Year Built',
      type: 'TextInput',
      helperText: 'Year the home was constructed',
    },
    {
      key: 'square_footage',
      label: 'Square Footage',
      type: 'TextInput',
      helperText: 'Approximate square footage of the home',
    },
    {
      key: 'lot_size',
      label: 'Lot Size',
      type: 'TextInput',
      helperText: 'Size of the property lot',
    },
    {
      key: 'bedrooms',
      label: 'Number of Bedrooms',
      type: 'TextInput',
      helperText: 'Total number of bedrooms',
    },
    {
      key: 'bathrooms',
      label: 'Number of Bathrooms',
      type: 'TextInput',
      helperText: 'Total number of bathrooms',
    },
    {
      key: 'home_features',
      label: 'Important Home Features',
      type: 'TextArea',
      helperText:
        'Pool, septic system, well, solar panels, generator, basement, attic, garage, or other special features',
    },
    {
      key: 'major_appliances',
      label: 'Major Appliances',
      type: 'TextArea',
      helperText:
        'HVAC system, water heater, washer/dryer, refrigerator, and other major appliances with model numbers and warranty info',
    },
    {
      key: 'home_inventory',
      label: 'Home Inventory',
      type: 'TextInputWithUpload',
      helperText:
        'Upload photos, video, or written inventory of valuable items and furnishings. Include sentimental, historical, or monetary items with details about their significance, value, and intended inheritors. This documentation is crucial for insurance claims and inheritance purposes.',
    },
    {
      key: 'inventory_date_location',
      label: 'Home Inventory Completion',
      type: 'TextArea',
      helperText:
        'I produced a home inventory on _____ (Month/Day/Year) and it is located _____. Include the date you completed your inventory and where it can be found.',
    },
    {
      key: 'other_documents_header',
      label: 'Other Important Home Documents & Information',
      type: 'Instructions',
      content:
        'Please include or note where to find these important items to help manage your home:',
    },
    {
      key: 'new_homes_label',
      label: 'New Homes',
      type: 'Instructions',
      content:
        'If you have a new home, provide contractor, builder, warranty information, and important manuals or guides:',
    },
    {
      key: 'builder_info',
      label: 'Builder/Contractor Information',
      type: 'TextInputWithUpload',
      helperText:
        'Contact information for builder, contractor, or development company',
    },
    {
      key: 'home_warranty',
      label: 'Home Warranty Information',
      type: 'TextInputWithUpload',
      helperText:
        'Warranty documents, coverage details, and contact information',
    },
    {
      key: 'appliance_manuals',
      label: 'Appliance Manuals & Warranties',
      type: 'TextInputWithUpload',
      helperText:
        'User manuals, warranty information for major appliances and systems',
    },
    {
      key: 'emergency_shutoffs_label',
      label: 'Emergency Information',
      type: 'Instructions',
      content: 'Critical information for emergencies and utility management:',
    },
    {
      key: 'utility_shutoffs',
      label: 'Utility Shut-off Locations',
      type: 'TextInputWithUpload',
      helperText:
        'Location of water, gas, and electrical shut-offs with photos or diagrams',
    },
    {
      key: 'circuit_breaker',
      label: 'Circuit Breaker Panel',
      type: 'TextInputWithUpload',
      helperText:
        'Photo of breaker panel with circuits labeled, or upload existing diagram',
    },
    {
      key: 'home_systems_notes',
      label: 'Home Systems Notes',
      type: 'TextArea',
      helperText:
        'Important notes about HVAC, plumbing, electrical, or other home systems',
    },
    {
      key: 'security_system',
      label: 'Security System Information',
      type: 'TextInputWithUpload',
      helperText:
        'Security system details, codes, monitoring company information',
    },
    {
      key: 'smart_home_devices',
      label: 'Smart Home & Connected Devices',
      type: 'TextArea',
      helperText:
        'List of smart home devices, apps, and login information for connected systems',
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

type UploadScope = '6A';

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

export default function Section6MainResidence({
  data = {},
  onChange = () => {},
  activeSubsection,
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
    '6A': null,
  });

  const subsectionData = data['6A'] || {};
  const show6A = !activeSubsection || activeSubsection === '6A';

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const getUploadedFileForScope = (scope: UploadScope) => {
    return uploadedFiles[scope] || null;
  };

  const updateField = (key: string, value: any) => {
    onChange({
      ...data,
      '6A': {
        ...subsectionData,
        [key]: value,
      },
    });
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

  const handleDocumentUpload = async (
    file?: File | null,
    scope: UploadScope = '6A',
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

  const handleAutofill = async (scope: UploadScope = '6A') => {
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
        section: 'main_residence',
        file_id: uploadedFile.file_id,
        subsection: '6A',
      });

      const patch = json?.result?.patch ?? {};
      const subsectionPatch = cleanPatchObject(patch?.['6A']);

      if (Object.keys(subsectionPatch).length === 0) {
        setAiError(
          'AI could not find main residence information in this document.',
        );
        return;
      }

      onChange({
        ...data,
        '6A': {
          ...subsectionData,
          ...subsectionPatch,
        },
      });

      setAiNotice('AI filled 6A Main Residence. Please review the fields.');
    } catch (err: any) {
      setAiError(err?.message || 'AI autofill failed');
    } finally {
      setAiLoadingScope(null);
    }
  };

  const renderUploader = () => {
    const scope: UploadScope = '6A';
    const uploadedFile = getUploadedFileForScope(scope);
    const isUploading = uploadingScope === scope;
    const isReading = aiLoadingScope === scope;

    return (
      <div
        className={[
          'relative overflow-hidden rounded-2xl border border-dashed',
          'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-emerald-50/50',
          'p-4 shadow-sm transition-all duration-200',
          'hover:border-emerald-300 hover:shadow-md',
          'space-y-4',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-cyan-100/70 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className="h-5 w-5 text-emerald-600" />
              )}
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-900">
                Upload document for 6A Main Residence
              </p>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                Upload a deed, lease, mortgage statement, tax bill, home
                warranty, appliance manual, home inventory, utility shutoff
                photo, or residence information document.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => handleAutofill('6A')}
            disabled={isAnyAIActionRunning || !uploadedFile}
            className="shrink-0 rounded-xl"
          >
            {isReading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isReading ? 'Reading…' : 'Auto-fill 6A'}
          </Button>
        </div>

        <div className="relative grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <label
            className={[
              'group flex cursor-pointer flex-col items-center justify-center gap-2',
              'rounded-xl border border-slate-200 bg-white/80 px-4 py-5 text-center',
              'transition hover:border-emerald-300 hover:bg-emerald-50/50',
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
                void handleDocumentUpload(file, '6A');
                event.currentTarget.value = '';
              }}
            />

            <UploadCloud className="h-5 w-5 text-slate-500 group-hover:text-emerald-600" />

            <div>
              <p className="text-sm font-medium text-slate-800">
                Click to upload residence document
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

  if (!show6A) return null;

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

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-emerald-50/70">
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-emerald-600" />
            6A. {SECTION_6A.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 p-5">
          {renderUploader()}

          {SECTION_6A.fields.map((field: any) => (
            <DynamicFormField
              key={field.key}
              field={field}
              value={subsectionData[field.key]}
              formData={subsectionData}
              onChange={(value: any) => updateField(field.key, value)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
