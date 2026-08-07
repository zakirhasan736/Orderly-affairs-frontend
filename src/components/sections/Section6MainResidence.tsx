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
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  Home,
  Building2,
  Landmark,
  Package,
  Receipt,
  ScrollText,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import { DynamicFormField } from '@/components/DynamicFormField';
import {
  type FieldGroup,
  buildFieldMap,
  getInstructionOverview,
  VaultOverviewBox,
  VaultEncryptedBadge,
  VaultGroupCards,
} from '@/utils/vaultGroupedFields';
import { Alert, AlertDescription } from '@/components/common/ui/alert';

import { releaseDeferredAiRoutingDialog, runAiSectionAutofill } from '@/services/aiSectionAutofill';
import {
  createEmptyItemFromFields,
  mergeAiPatchWithDefaults,
} from '@/utils/aiPatchNormalizer';
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

import { getVaultSubsectionDisplayId } from '@/utils/vaultNavigation';
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
      key: 'mortgage_maturity_date',
      label: 'Mortgage / Loan Maturity Date',
      type: 'DatePicker',
      helperText:
        'When the home loan or mortgage is paid off / matures — used for renewal deadline reminder emails',
    },
    {
      key: 'lease_end_date',
      label: 'Lease End Date',
      type: 'DatePicker',
      helperText:
        'If renting, when the current lease ends — reminder emails at 10, 5, 1 days and on the day',
    },
    {
      key: 'property_tax_due_date',
      label: 'Next Property Tax Due Date',
      type: 'DatePicker',
      helperText:
        'Next property tax payment or filing deadline — reminder emails follow the same schedule as insurance',
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

const FIELD_MAP_6A = buildFieldMap(SECTION_6A.fields);

const SECTION_6A_GROUPS: FieldGroup[] = [
  {
    key: 'property_identity',
    title: 'Property Identity',
    subtitle: 'Address, residence type, ownership, and county',
    icon: Home,
    accent: 'from-emerald-500/[0.07] to-teal-500/[0.03]',
    iconWrap: 'bg-emerald-500/10 text-emerald-700',
    layout: 'grid',
    span: 'full',
    fieldKeys: [
      'home_address',
      'residence_type',
      'custom_residence_type',
      'ownership_status',
      'ownership_type',
      'custom_ownership_type',
      'year_purchased_leased',
      'joint_owners',
      'county',
    ],
  },
  {
    key: 'property_details',
    title: 'Property Details',
    subtitle: 'Size, rooms, features, and major appliances',
    icon: Building2,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'stack',
    fieldKeys: [
      'year_built',
      'square_footage',
      'lot_size',
      'bedrooms',
      'bathrooms',
      'home_features',
      'major_appliances',
    ],
  },
  {
    key: 'mortgage_payments',
    title: 'Mortgage & Payments',
    subtitle: 'Lender or landlord and payment methods',
    icon: Receipt,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'grid',
    fieldKeys: [
      'mortgage_lienholder_landlord',
      'payment_methods',
      'mortgage_maturity_date',
      'lease_end_date',
      'property_tax_due_date',
    ],
  },
  {
    key: 'ownership_documents',
    title: 'Ownership Documents',
    subtitle: 'Deeds, titles, and proof of ownership',
    icon: FileText,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: ['property_deeds_titles'],
  },
  {
    key: 'current_financing',
    title: 'Current Financing',
    subtitle: 'Mortgage statements, HELOCs, and property taxes',
    icon: Landmark,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'grid',
    fieldKeys: [
      'mortgage_lease_statement',
      'second_mortgage_heloc',
      'property_tax_bills',
    ],
  },
  {
    key: 'historical_documents',
    title: 'Historical Documents',
    subtitle: 'Closing records, paid-off liens, and reverse mortgages',
    icon: ScrollText,
    accent: 'from-slate-500/[0.07] to-gray-500/[0.03]',
    iconWrap: 'bg-slate-500/10 text-slate-600',
    layout: 'grid',
    fieldKeys: [
      'closing_refinancing_docs',
      'paid_off_documentation',
      'reverse_mortgage_info',
    ],
  },
  {
    key: 'professional_contacts',
    title: 'Professional Contacts',
    subtitle: 'Real estate agent or landlord contact details',
    icon: Users,
    accent: 'from-indigo-500/[0.07] to-blue-500/[0.03]',
    iconWrap: 'bg-indigo-500/10 text-indigo-700',
    layout: 'grid',
    fieldKeys: ['realtor_landlord_contact'],
  },
  {
    key: 'builder_warranty',
    title: 'Builder & Warranty',
    subtitle: 'New home builder, warranty, and appliance manuals',
    icon: Wrench,
    accent: 'from-orange-500/[0.07] to-amber-500/[0.03]',
    iconWrap: 'bg-orange-500/10 text-orange-700',
    layout: 'grid',
    fieldKeys: ['builder_info', 'home_warranty', 'appliance_manuals'],
  },
  {
    key: 'occupancy',
    title: 'Current Occupancy',
    subtitle: 'Who lives in the home and pets on the property',
    icon: Users,
    accent: 'from-rose-500/[0.07] to-pink-500/[0.03]',
    iconWrap: 'bg-rose-500/10 text-rose-700',
    layout: 'stack',
    fieldKeys: ['residents', 'pets'],
  },
  {
    key: 'home_inventory',
    title: 'Home Inventory',
    subtitle: 'Valuable items, furnishings, and inventory location',
    icon: Package,
    accent: 'from-teal-500/[0.07] to-emerald-500/[0.03]',
    iconWrap: 'bg-teal-500/10 text-teal-700',
    layout: 'stack',
    fieldKeys: ['home_inventory', 'inventory_date_location'],
  },
  {
    key: 'emergency_systems',
    title: 'Emergency & Systems',
    subtitle: 'Shut-offs, breaker panel, security, and smart home',
    icon: Zap,
    accent: 'from-yellow-500/[0.07] to-amber-500/[0.03]',
    iconWrap: 'bg-yellow-500/10 text-yellow-700',
    layout: 'stack',
    fieldKeys: [
      'utility_shutoffs',
      'circuit_breaker',
      'home_systems_notes',
      'security_system',
      'smart_home_devices',
    ],
  },
];

const INSTRUCTION_OVERVIEW =
  getInstructionOverview(SECTION_6A.fields, 'inventory_instructions') ?? {
    label: 'Home Information Overview',
    content:
      'Document your primary residence, ownership details, financing, inventory, and emergency information so your family can manage the home and insurance claims.',
  };

const SUBSECTION_SUBTITLE =
  'Grouped home records for property details, financing, inventory, and emergency systems in a mobile-friendly layout.';

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

  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});

  const aiRouting = useOptionalAiDocumentRouting();

  useRestoreAiPendingUploadForSection({
    sectionId: '6',
    setUploadedFiles,
    latestUploadRef,
  });

  const subsectionData = data['6A'] || {};
  const show6A = !activeSubsection || activeSubsection === '6A';

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('6', String(scope)) ?? null;

    return resolveAiUploadedFileForScope(scope, uploadedFiles, latestUploadRef, pendingFile);
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

    const uploadKeys = new Set(
      SECTION_6A.fields
        .filter(field => String(field.type || '').includes('Upload'))
        .map(field => field.key),
    );

    return Object.fromEntries(
      Object.entries(patch)
        .map(([key, value]) => {
          if (uploadKeys.has(key) && typeof value === 'string') {
            return [key, { text: value, files: [] }];
          }
          return [key, value];
        })
        .filter(([, value]) => {
          if (value === null || value === undefined || value === '') return false;
          if (Array.isArray(value) && value.length === 0) return false;
          return true;
        }),
    );
  };

  const handleDocumentUpload = async (file?: File | null,
    scope: UploadScope = '6A', runAutofill?: () => void | Promise<void>) => {
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

      const uploaded = await uploadAIDocument(file, { section: '6' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '6',
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

      const json = await runAiSectionAutofill({
        sectionKey: 'main_residence',
        sectionId: '6',
        file_id: uploadedFile.file_id,
        mime_type: uploadedFile.mime_type,
        subsection: '6A',
        uploadScope: String(scope),
        fields: SECTION_6A.fields,
        aiRouting,
        });

      if (!json) return;

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
      releaseDeferredAiRoutingDialog(aiRouting);
    }
  };

  const renderUploader = () => {
    const scope: UploadScope = '6A';

    return (
      <SectionAiDocumentUploader
        title="Upload document for Main Residence"
        description={`Property deed, mortgage statement, tax bill, insurance declaration, utility bill, or home inventory — AI will fill Section ${getVaultSubsectionDisplayId('6', '6A')}.`}
        buttonLabel="Auto-fill 6A"
        uploadLabel="Drag and drop or click to upload main residence document"
        disabled={isAnyAIActionRunning}
        isUploading={uploadingScope === scope}
        isReading={aiLoadingScope === scope}
        uploadedFile={getUploadedFileForScope(scope)}
      highlightUpload={aiRouting?.shouldHighlightUpload('6', String(scope)) ?? false}
        onUpload={file =>
          handleDocumentUpload(file, scope, () => handleAutofill(scope))
        }
        onAutofill={() => handleAutofill(scope)}
      />
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

      <div
        id="subsection-6A"
        className={cn(
          'rounded-3xl',
          activeSubsection === '6A' && 'border border-primary p-1',
        )}
      >
        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 via-white to-indigo-50/60 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl tracking-tight text-slate-900">
                  <Home className="h-5 w-5 text-emerald-600" />
                  {getVaultSubsectionDisplayId('6', '6A')}. {SECTION_6A.title}
                </CardTitle>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  {SUBSECTION_SUBTITLE}
                </p>
              </div>
              <VaultEncryptedBadge />
            </div>
          </CardHeader>

          <CardContent className="space-y-8 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_36%)] p-4 sm:p-6">
            <VaultOverviewBox
              label={INSTRUCTION_OVERVIEW.label}
              content={INSTRUCTION_OVERVIEW.content}
            />

            {renderUploader()}

            <VaultGroupCards
              groups={SECTION_6A_GROUPS}
              fieldMap={FIELD_MAP_6A}
              renderField={fieldKey => (
                <DynamicFormField
                  key={fieldKey}
                  field={FIELD_MAP_6A[fieldKey]}
                  value={subsectionData[fieldKey]}
                  formData={subsectionData}
                  onChange={(value: any) => updateField(fieldKey, value)}
                  className="space-y-2"
                />
              )}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
