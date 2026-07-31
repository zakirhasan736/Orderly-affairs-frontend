'use client';

import { AiUploadedAttachmentList } from '@/components/ai/AiUploadedAttachmentList';
import React, { useRef, useState } from 'react';
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
  FolderOpen,
  Globe,
  Info,
  Landmark,
  Receipt,
  ScrollText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import { DynamicFormField } from '@/components/DynamicFormField';
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
import {
  buildUploadedAiFile,
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';
import { AiDocumentDropZoneInput } from '@/components/ai/AiDocumentDropZoneInput';
import { AI_PENDING_ROUTED_HINT } from '@/utils/aiRoutingUi';
import {
  getTopicCardProps,
  useScrollToVaultTopic,
} from '@/utils/vaultTopicNavigation';
import {
  applyExtractedArrayWithDedup,
  buildUpsertAutofillNotice,
} from '@/utils/aiItemDedup';

/* ============================================================
   STATIC SUBSECTIONS — 20A, 20B
============================================================ */

const SECTION_20A_FIELDS = [
  {
    key: 'legal_documents_instructions',
    label: 'Legal Documents Overview',
    type: 'Instructions',
    content:
      "To help your executors and trustees efficiently settle your estate, it's essential to keep organized records of your legal documents. This section is dedicated to storing copies of essential paperwork related to your personal and financial affairs. Consider storing the originals in your fireproof document bag.",
  },
  {
    key: 'identification_documents_header',
    label: 'Identification Documents',
    type: 'Instructions',
    content:
      'Essential identification documents for estate settlement and official processes',
  },
  {
    key: 'birth_certificate',
    label: 'Birth Certificate',
    type: 'TextInputWithUpload',
    helperText: 'Upload copy of birth certificate or note location of original',
  },
  {
    key: 'social_security_card',
    label: 'Social Security Card',
    type: 'TextInputWithUpload',
    helperText: 'Upload copy of Social Security card or note location',
  },
  {
    key: 'passport',
    label: 'Passport',
    type: 'TextInputWithUpload',
    helperText: 'Upload copy of current passport or note location',
  },
  {
    key: 'drivers_license',
    label: "Driver's License",
    type: 'TextInputWithUpload',
    helperText: "Upload copy of current driver's license or state ID",
  },
  {
    key: 'marriage_certificate',
    label: 'Marriage Certificate',
    type: 'TextInputWithUpload',
    helperText: 'Upload copy of marriage certificate(s) or note location',
  },
  {
    key: 'divorce_decree',
    label: 'Divorce Decree',
    type: 'TextInputWithUpload',
    helperText:
      'Upload copies of divorce decrees or legal separation documents',
  },
  {
    key: 'name_change_documents',
    label: 'Name Change Documents',
    type: 'TextInputWithUpload',
    helperText: 'Legal documents for any name changes',
  },
  {
    key: 'citizenship_documents_header',
    label: 'Citizenship & Immigration Documents',
    type: 'Instructions',
    content: 'Documents proving citizenship or immigration status',
  },
  {
    key: 'naturalization_certificate',
    label: 'Naturalization Certificate',
    type: 'TextInputWithUpload',
    helperText: 'Certificate of naturalization or citizenship',
  },
  {
    key: 'immigration_documents',
    label: 'Immigration Documents',
    type: 'TextInputWithUpload',
    helperText: 'Green card, visa, or other immigration documents',
  },
  {
    key: 'family_documents_header',
    label: 'Family Documents',
    type: 'Instructions',
    content: 'Documents related to children and family relationships',
  },
  {
    key: 'children_birth_certificates',
    label: "Children's Birth Certificates",
    type: 'TextInputWithUpload',
    helperText: 'Birth certificates for all children',
  },
  {
    key: 'adoption_documents',
    label: 'Adoption Documents',
    type: 'TextInputWithUpload',
    helperText: 'Adoption papers or legal guardianship documents',
  },
  {
    key: 'custody_agreements',
    label: 'Custody Agreements',
    type: 'TextInputWithUpload',
    helperText: 'Child custody or visitation agreements',
  },
];

const SECTION_20B_FIELDS = [
  {
    key: 'tax_documents_instructions',
    label: 'Tax Documents Overview',
    type: 'Instructions',
    content:
      'When managing an estate or trust, executors or trustees are required to file annual tax returns until the estate is fully settled. Keeping tax documents well-organized will make this process much smoother and less stressful for your loved ones.',
  },
  {
    key: 'current_tax_year',
    label: 'Current Tax Year Documents',
    type: 'TextInputWithUpload',
    helperText:
      'Upload current year tax returns, W-2s, 1099s, and supporting documents',
  },
  {
    key: 'previous_tax_years',
    label: 'Previous Tax Years',
    type: 'TextInputWithUpload',
    helperText:
      'Upload tax returns for previous 3-7 years (recommended for audit protection)',
  },
  {
    key: 'tax_preparer_info',
    label: 'Tax Preparer Information',
    type: 'TextInputWithUpload',
    helperText: 'Contact information for your tax preparer or CPA',
  },
  {
    key: 'tax_software',
    label: 'Tax Software Information',
    type: 'TextArea',
    helperText:
      'If you use tax software, include login information and where files are stored',
  },
  {
    key: 'business_tax_documents',
    label: 'Business Tax Documents',
    type: 'TextInputWithUpload',
    helperText:
      'Business tax returns, partnership returns, or corporate tax documents',
  },
  {
    key: 'estimated_tax_payments',
    label: 'Estimated Tax Payments',
    type: 'TextArea',
    helperText: 'Information about quarterly estimated tax payments',
  },
  {
    key: 'tax_filing_deadline',
    label: 'Next Tax Filing Deadline',
    type: 'DatePicker',
    helperText:
      'Next federal/state tax filing or estimated-payment deadline — reminder emails at 10, 5, 1 days and on the day',
  },
  {
    key: 'tax_debt_issues',
    label: 'Tax Debt or Issues',
    type: 'TextInputWithUpload',
    helperText:
      'Any outstanding tax debt, payment plans, or IRS correspondence',
  },
];

type StaticSubsectionId = '20A' | '20B';

const FIELD_MAP_20A = Object.fromEntries(
  SECTION_20A_FIELDS.map(field => [field.key, field]),
);
const FIELD_MAP_20B = Object.fromEntries(
  SECTION_20B_FIELDS.map(field => [field.key, field]),
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

const SECTION_20A_GROUPS: FieldGroup[] = [
  {
    key: 'identification_documents',
    title: 'Identification Documents',
    subtitle: 'Birth, SSN, passport, license, and marriage records',
    icon: FileText,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'grid',
    fieldKeys: [
      'birth_certificate',
      'social_security_card',
      'passport',
      'drivers_license',
      'marriage_certificate',
      'divorce_decree',
      'name_change_documents',
    ],
  },
  {
    key: 'citizenship_documents',
    title: 'Citizenship & Immigration',
    subtitle: 'Naturalization and immigration paperwork',
    icon: Globe,
    accent: 'from-cyan-500/[0.07] to-sky-500/[0.03]',
    iconWrap: 'bg-cyan-500/10 text-cyan-700',
    layout: 'grid',
    fieldKeys: ['naturalization_certificate', 'immigration_documents'],
  },
  {
    key: 'family_documents',
    title: 'Family Documents',
    subtitle: 'Children, adoption, and custody records',
    icon: Users,
    accent: 'from-violet-500/[0.07] to-purple-500/[0.03]',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    layout: 'grid',
    fieldKeys: [
      'children_birth_certificates',
      'adoption_documents',
      'custody_agreements',
    ],
  },
];

const SECTION_20B_GROUPS: FieldGroup[] = [
  {
    key: 'tax_returns',
    title: 'Tax Returns',
    subtitle: 'Current year and prior-year filings',
    icon: ScrollText,
    accent: 'from-emerald-500/[0.07] to-teal-500/[0.03]',
    iconWrap: 'bg-emerald-500/10 text-emerald-700',
    layout: 'grid',
    fieldKeys: ['current_tax_year', 'previous_tax_years'],
  },
  {
    key: 'preparer_access',
    title: 'Preparer & Software',
    subtitle: 'CPA contacts and tax software login details',
    icon: Receipt,
    accent: 'from-blue-500/[0.07] to-indigo-500/[0.03]',
    iconWrap: 'bg-blue-500/10 text-blue-600',
    layout: 'grid',
    fieldKeys: ['tax_preparer_info', 'tax_software'],
  },
  {
    key: 'business_tax_issues',
    title: 'Business Taxes & Issues',
    subtitle: 'Business returns, estimated payments, and IRS matters',
    icon: Landmark,
    accent: 'from-amber-500/[0.07] to-orange-500/[0.03]',
    iconWrap: 'bg-amber-500/10 text-amber-700',
    layout: 'stack',
    fieldKeys: [
      'business_tax_documents',
      'estimated_tax_payments',
      'tax_filing_deadline',
      'tax_debt_issues',
    ],
  },
];

const STATIC_SUBSECTION_GROUPS: Record<StaticSubsectionId, FieldGroup[]> = {
  '20A': SECTION_20A_GROUPS,
  '20B': SECTION_20B_GROUPS,
};

const STATIC_FIELD_MAP: Record<StaticSubsectionId, Record<string, any>> = {
  '20A': FIELD_MAP_20A,
  '20B': FIELD_MAP_20B,
};

const STATIC_OVERVIEW_KEY: Record<StaticSubsectionId, string> = {
  '20A': 'legal_documents_instructions',
  '20B': 'tax_documents_instructions',
};

const STATIC_SUBTITLE: Record<StaticSubsectionId, string> = {
  '20A':
    'Grouped personal legal records so you can fill identification, citizenship, and family documents without scrolling through one long form.',
  '20B':
    'Grouped tax records for returns, preparer details, and business tax matters in an easy mobile-friendly layout.',
};

/* ============================================================
   REPEATABLE SUBSECTION — 20C
============================================================ */

const SECTION_20C = {
  subsectionId: '20C',
  title: 'Other Important Documents',
  itemLabel: 'Document',
  fields: [
    {
      key: 'document_type',
      label: 'Document Type',
      type: 'Dropdown',
      options: [
        'Contract',
        'Lease Agreement',
        'Loan Document',
        'Insurance Policy',
        'Professional License',
        'Academic Diploma',
        'Award/Certificate',
        'Legal Settlement',
        'Court Order',
        'Power of Attorney',
        'Other',
      ],
      helperText: 'Type of legal or important document',
    },
    {
      key: 'document_description',
      label: 'Document Description',
      type: 'TextArea',
      helperText:
        "Brief description of what this document is and why it's important",
    },
    {
      key: 'parties_involved',
      label: 'Parties Involved',
      type: 'TextArea',
      helperText: 'Names of other parties, companies, or institutions involved',
    },
    {
      key: 'important_dates',
      label: 'Important Dates',
      type: 'TextArea',
      helperText:
        'Effective dates, expiration dates, or other important deadlines',
    },
    {
      key: 'expiration_date',
      label: 'Expiration / Renewal Date',
      type: 'DatePicker',
      helperText:
        'Primary expiration or renewal deadline — triggers reminder emails at 10, 5, 1 days and on the day',
    },
    {
      key: 'document_location',
      label: 'Document Location',
      type: 'TextArea',
      helperText: 'Where the original document is stored',
    },
    {
      key: 'renewal_requirements',
      label: 'Renewal Requirements',
      type: 'TextArea',
      helperText:
        'If this document requires renewal, maintenance, or ongoing action',
    },
    {
      key: 'contact_information',
      label: 'Related Contact Information',
      type: 'TextInputWithUpload',
      helperText:
        'Contact information for lawyers, institutions, or other parties related to this document',
    },
    {
      key: 'document_upload',
      label: 'Document Copy',
      type: 'TextInputWithUpload',
      helperText: 'Upload a copy of this document',
    },
  ],
};

/* ============================================================
   TYPES / HELPERS
============================================================ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
  activeTopicId?: string | null;
  disabledSubsections?: Record<string, boolean>;
}

type SubsectionId = '20A' | '20B' | '20C';

type UploadScope = '20A-full' | '20B-full' | '20C-full' | `20C:${number}`;

type UploadedAIFile = {
  file_id: string;
  mime_type: string;
  expires_at?: string;
  file_name?: string;
  uploaded_at?: number;
};

const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;

const STATIC_CONFIG: Record<
  StaticSubsectionId,
  {
    title: string;
    fields: any[];
    uploadTitle: string;
    uploadDescription: string;
    buttonLabel: string;
  }
> = {
  '20A': {
    title: 'Personal Legal Documents',
    fields: SECTION_20A_FIELDS,
    uploadTitle: 'Upload personal legal document',
    uploadDescription:
      'Upload birth certificates, Social Security card copies, passport, driver’s license, marriage/divorce records, name change documents, immigration records, adoption papers, or custody agreements. AI will fill the matching 20A fields.',
    buttonLabel: 'Auto-fill Legal Documents',
  },
  '20B': {
    title: 'Tax Documents',
    fields: SECTION_20B_FIELDS,
    uploadTitle: 'Upload tax document',
    uploadDescription:
      'Upload tax returns, W-2s, 1099s, IRS/state notices, tax preparer details, business tax records, or estimated tax payment documents. AI will fill the matching 20B fields.',
    buttonLabel: 'Auto-fill Tax Documents',
  },
};

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

export default function Section20LegalDocumentsRecords({
  data = {},
  onChange = () => {},
  activeSubsection,
  activeTopicId,
  disabledSubsections = {},
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

  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});

  const aiRouting = useOptionalAiDocumentRouting();

  useRestoreAiPendingUploadForSection({
    sectionId: '20',
    setUploadedFiles,
    latestUploadRef,
  });

  const documents: any[] = Array.isArray(data['20C']) ? data['20C'] : [];

  useScrollToVaultTopic(activeTopicId, documents.length);

  const isAnyAIActionRunning =
    uploadingScope !== null || aiLoadingScope !== null;

  const showSubsection = (id: SubsectionId) => {
    if (disabledSubsections[id]) return false;
    return !activeSubsection || activeSubsection === id;
  };

  const getUploadedFileForScope = (scope: UploadScope) => {
    const pendingFile =
      aiRouting?.getPendingFileForSection('20', String(scope)) ?? null;

    return resolveAiUploadedFileForScope(scope, uploadedFiles, latestUploadRef, pendingFile);
  };

  const updateStaticField = (
    subsection: StaticSubsectionId,
    key: string,
    value: any,
  ) => {
    onChange({
      ...data,
      [subsection]: {
        ...(data[subsection] || {}),
        [key]: value,
      },
    });
  };

  const updateStaticWithPatch = (
    subsection: StaticSubsectionId,
    patch: any,
  ) => {
    onChange({
      ...data,
      [subsection]: {
        ...(data[subsection] || {}),
        ...patch,
      },
    });
  };

  const updateDocuments = (next: any[]) => {
    onChange({
      ...data,
      '20C': next,
    });
  };

  const makeEmptyDocument = () => {
    return {
      ...Object.fromEntries(SECTION_20C.fields.map(field => [field.key, ''])),
      __rowId: createRowId(),
    };
  };

  const addDocument = () => {
    updateDocuments([...documents, makeEmptyDocument()]);
  };

  const updateDocument = (index: number, key: string, value: any) => {
    const next = [...documents];

    next[index] = {
      ...(next[index] || {}),
      [key]: value,
      __rowId: next[index]?.__rowId || createRowId(),
    };

    updateDocuments(next);
  };

  const removeDocument = (index: number) => {
    updateDocuments(documents.filter((_, itemIndex) => itemIndex !== index));
  };

  const cleanPatchObject = (patch: any) => {
    if (!patch || typeof patch !== 'object') return {};

    return Object.fromEntries(
      Object.entries(patch).filter(([key, value]) => {
        if (key === '__rowId') return false;
        if (key.endsWith('_instructions')) return false;
        if (key.endsWith('_header')) return false;
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      }),
    );
  };

  const extractStaticObjectFromPatch = (
    subsection: StaticSubsectionId,
    patch: any,
  ) => {
    const raw = patch?.[subsection];

    if (Array.isArray(raw)) {
      return cleanPatchObject(raw[0] || {});
    }

    if (raw && typeof raw === 'object') {
      return cleanPatchObject(raw);
    }

    return {};
  };

  const normalizeDocumentPatch = (patch: any) => {
    return {
      ...makeEmptyDocument(),
      ...cleanPatchObject(patch),
    };
  };

  const extractDocumentsFromPatch = (patch: any) => {
    const rawDocuments = patch?.['20C'];

    if (Array.isArray(rawDocuments)) {
      return rawDocuments
        .map(document => normalizeDocumentPatch(document))
        .filter(document => {
          return Object.entries(document).some(([key, value]) => {
            return key !== '__rowId' && value !== '';
          });
        });
    }

    if (rawDocuments && typeof rawDocuments === 'object') {
      const document = normalizeDocumentPatch(rawDocuments);

      const hasValue = Object.entries(document).some(([key, value]) => {
        return key !== '__rowId' && value !== '';
      });

      return hasValue ? [document] : [];
    }

    return [];
  };

  const handleDocumentUpload = async (file?: File | null,
    scope?: UploadScope,
    runAutofill?: () => void | Promise<void>,
  ) => {
    try {
      if (!file || !scope) return;

      setAiError('');
      setAiNotice('');

            const validationError = validateAiDocumentFile(file);
      if (validationError) {
        setAiError(validationError);
        return;
      }

      setUploadingScope(scope as UploadScope);

      const uploaded = await uploadAIDocument(file, { section: '20' });

      const uploadedRecord: UploadedAIFile = buildUploadedAiFile(uploaded, file, {
        sectionId: '20',
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

  const handleAutofillStatic = async (
    subsection: StaticSubsectionId,
    scope: UploadScope,
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
        sectionKey: 'legal_documents_records',
        sectionId: '20',
        file_id: uploadedFile.file_id,
        subsection,
        uploadScope: String(scope),
        aiRouting,
        });

      if (!json) return;

      const patch = json?.result?.patch ?? {};
      const extracted = extractStaticObjectFromPatch(subsection, patch);

      if (Object.keys(extracted).length === 0) {
        // POA and similar docs belong in 20C — recover if model put them there
        // while the user was autofilling 20A/20B.
        const recoveredDocuments = extractDocumentsFromPatch(patch);
        if (recoveredDocuments.length > 0) {
          const nextDocuments =
            documents.length === 0
              ? recoveredDocuments
              : [...documents, ...recoveredDocuments];
          updateDocuments(nextDocuments);
          setAiError('');
          setAiNotice(
            `This looks like an Other Important Document (for example Power of Attorney). Added under 20C — open “Other Important Documents” to review.`,
          );
          return;
        }

        setAiError(
          subsection === '20A'
            ? 'AI could not find personal legal document information in this file. If this is a Power of Attorney or similar, try Autofill under 20C Other Important Documents.'
            : 'AI could not find tax document information in this file.',
        );
        return;
      }

      updateStaticWithPatch(subsection, extracted);

      setAiNotice(
        subsection === '20A'
          ? 'AI filled personal legal document fields. Please review the results.'
          : 'AI filled tax document fields. Please review the results.',
      );
    } catch (err: any) {
      setAiError(err?.message || 'AI autofill failed');
    } finally {
      setAiLoadingScope(null);
      releaseDeferredAiRoutingDialog(aiRouting);
    }
  };

  const handleAutofill20C = async (
    scope: UploadScope = '20C-full',
    documentIndex?: number,
  ) => {
    try {
      const uploadedFile = getUploadedFileForScope(scope);

      if (!uploadedFile) {
        setAiError('Please upload an important document first.');
        return;
      }

      setAiError('');
      setAiNotice('');
      setAiLoadingScope(scope);

      const json = await runAiSectionAutofill({
        sectionKey: 'legal_documents_records',
        sectionId: '20',
        file_id: uploadedFile.file_id,
        mime_type: uploadedFile.mime_type,
        subsection: '20C',
        uploadScope: String(scope),
        aiRouting,
        });

      if (!json) return;

      const patch = json?.result?.patch ?? {};
      const extractedDocuments = extractDocumentsFromPatch(patch);

      if (extractedDocuments.length === 0) {
        setAiError(
          'AI could not find other important document information in this file.',
        );
        return;
      }

      if (typeof documentIndex === 'number') {
        const firstPatch = cleanPatchObject(extractedDocuments[0]);
        const next = [...documents];

        next[documentIndex] = {
          ...(next[documentIndex] || makeEmptyDocument()),
          ...firstPatch,
          __rowId: next[documentIndex]?.__rowId || createRowId(),
        };

        updateDocuments(next);

        setAiNotice(
          `AI filled Document #${documentIndex + 1}. Please review the fields.`,
        );

        return;
      }

      const upserted = applyExtractedArrayWithDedup(
        '20',
        '20C',
        documents,
        extractedDocuments,
        'overwrite',
      );
      updateDocuments(upserted.items);

      setAiNotice(
        buildUpsertAutofillNotice(
          upserted.added,
          upserted.updated,
          'Document',
        ) ||
          (extractedDocuments.length === 1
            ? 'AI added 1 important document. Please review the fields.'
            : `AI added ${extractedDocuments.length} important documents. Please review the fields.`),
      );
    } catch (err: any) {
      setAiError(err?.message || 'AI autofill failed');
    } finally {
      setAiLoadingScope(null);
      releaseDeferredAiRoutingDialog(aiRouting);
    }
  };

  const renderUploader = ({
    subsection,
    scope,
    title,
    description,
    buttonLabel,
    compact = false,
    onAutofill,
  }: {
    subsection: SubsectionId;
    scope: UploadScope;
    title: string;
    description: string;
    buttonLabel: string;
    compact?: boolean;
    onAutofill: () => void;
  }) => {
    const uploadedFile = getUploadedFileForScope(scope);
    const isUploading = uploadingScope === scope;
    const isReading = aiLoadingScope === scope;
    const highlightUpload =
      aiRouting?.shouldHighlightUpload('20', String(scope)) ?? false;

    const tone =
      subsection === '20A'
        ? {
            wrapper:
              'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 hover:border-blue-300',
            icon: 'text-blue-600',
            uploadBox: 'hover:border-blue-300 hover:bg-blue-50/50',
            glowOne: 'bg-blue-100/70',
            glowTwo: 'bg-sky-100/70',
          }
        : subsection === '20B'
          ? {
              wrapper:
                'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 hover:border-emerald-300',
              icon: 'text-emerald-600',
              uploadBox: 'hover:border-emerald-300 hover:bg-emerald-50/50',
              glowOne: 'bg-emerald-100/70',
              glowTwo: 'bg-green-100/70',
            }
          : {
              wrapper:
                'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-violet-50/60 hover:border-violet-300',
              icon: 'text-violet-600',
              uploadBox: 'hover:border-violet-300 hover:bg-violet-50/50',
              glowOne: 'bg-violet-100/70',
              glowTwo: 'bg-fuchsia-100/70',
            };

    return (
      <div
        data-ai-upload-zone={highlightUpload ? 'highlight' : undefined}
        className={[
          'relative overflow-hidden rounded-2xl border border-dashed p-4 shadow-sm transition-all duration-200 hover:shadow-md',
          tone.wrapper,
          compact ? 'space-y-3' : 'space-y-4',
        ].join(' ')}
      >
        <div
          className={[
            'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl',
            tone.glowOne,
          ].join(' ')}
        />
        <div
          className={[
            'pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full blur-2xl',
            tone.glowTwo,
          ].join(' ')}
        />

        {highlightUpload && (
          <div className="relative rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            {AI_PENDING_ROUTED_HINT}
          </div>
        )}

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {isUploading ? (
                <Loader2 className={`h-5 w-5 animate-spin ${tone.icon}`} />
              ) : uploadedFile ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className={`h-5 w-5 ${tone.icon}`} />
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
            data-ai-autofill-trigger
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
          <AiDocumentDropZoneInput
            onFile={uploaded => handleDocumentUpload(uploaded, scope, onAutofill)}
            disabled={isAnyAIActionRunning}
            showSupportedHint
            sectionId="20"
            className={[
              'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-3.5 text-center transition',
              tone.uploadBox,
              compact
                ? 'md:flex-row md:justify-start md:py-3 md:text-left'
                : '',
              isAnyAIActionRunning ? 'pointer-events-none opacity-60' : '',
            ].join(' ')}
            iconClassName={tone.icon}
          />
        </div>

        <AiUploadedAttachmentList file={uploadedFile} />

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

  const renderGroupField = (
    subsection: StaticSubsectionId,
    fieldKey: string,
    sectionData: Record<string, any>,
  ) => {
    const field = STATIC_FIELD_MAP[subsection][fieldKey];
    if (!field || field.type === 'Instructions') return null;

    return (
      <DynamicFormField
        key={field.key}
        field={field}
        value={sectionData?.[field.key]}
        formData={sectionData}
        onChange={value => updateStaticField(subsection, field.key, value)}
        className="space-y-2"
      />
    );
  };

  const renderGroupFields = (
    subsection: StaticSubsectionId,
    group: FieldGroup,
    sectionData: Record<string, any>,
  ) => {
    if (group.layout === 'stack') {
      return (
        <div className="space-y-4">
          {group.fieldKeys.map(fieldKey =>
            renderGroupField(subsection, fieldKey, sectionData),
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {group.fieldKeys.map(fieldKey => {
          const field = STATIC_FIELD_MAP[subsection][fieldKey];
          if (!field || field.type === 'Instructions') return null;

          return (
            <div
              key={fieldKey}
              className={cn(isFullWidthField(field) && 'md:col-span-2')}
            >
              {renderGroupField(subsection, fieldKey, sectionData)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStaticSection = (subsection: StaticSubsectionId) => {
    const config = STATIC_CONFIG[subsection];
    const sectionData = data[subsection] || {};
    const show = showSubsection(subsection);
    if (!show) return null;

    const scope = `${subsection}-full` as UploadScope;
    const overviewField =
      STATIC_FIELD_MAP[subsection][STATIC_OVERVIEW_KEY[subsection]];
    const groups = STATIC_SUBSECTION_GROUPS[subsection];

    return (
      <div
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
                <CardTitle className="text-xl tracking-tight text-slate-900">
                  {subsection}. {config.title}
                </CardTitle>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  {STATIC_SUBTITLE[subsection]}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                AES-256-GCM encrypted at rest
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_36%)] p-4 sm:p-6">
            {overviewField?.content && (
              <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Info className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {overviewField.label}
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    {overviewField.content}
                  </p>
                </div>
              </div>
            )}

            {renderUploader({
              subsection,
              scope,
              title: config.uploadTitle,
              description: config.uploadDescription,
              buttonLabel: config.buttonLabel,
              onAutofill: () => handleAutofillStatic(subsection, scope),
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
                      {renderGroupFields(subsection, group, sectionData)}
                    </div>
                  </section>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRepeatable20C = () => {
    const show = showSubsection('20C');

    return (
      <div
        id="subsection-20C"
        className={`rounded-3xl ${show ? 'border border-primary p-1' : ''}`}
      >
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-violet-50/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-violet-600" />
                20C. {SECTION_20C.title}
              </CardTitle>

              <Button
                type="button"
                size="sm"
            data-ai-autofill-trigger
            onClick={addDocument}
                className="rounded-xl"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add {SECTION_20C.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-5">
            {/* {renderUploader({
              subsection: '20C',
              scope: '20C-full',
              title: 'Upload one document or a document list',
              description:
                'Use this if one file contains one or more contracts, leases, loan documents, licenses, diplomas, awards, settlements, court orders, powers of attorney, or other important documents. AI will add extracted documents as new cards.',
              buttonLabel: 'Extract Documents',
              onAutofill: () => handleAutofill20C('20C-full'),
            })} */}

            {documents.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <FolderOpen className="h-5 w-5 text-slate-500" />
                </div>

                <p className="font-medium text-slate-800">
                  No important documents added yet.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Click “Add Document” to create a blank card, or upload a
                  document above and let AI create the card.
                </p>
              </div>
            )}

            {documents.map((item, index) => {
              const itemScope = `20C:${index}` as UploadScope;
              const itemLabel = `${SECTION_20C.itemLabel} #${index + 1}`;
              const topicProps = getTopicCardProps('20C', index, activeTopicId);

              return (
                <Card
                  key={item.__rowId || `${itemScope}-${index}`}
                  id={topicProps.id}
                  className={topicProps.className}
                >
                  <div className="flex flex-col gap-3 border-b bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <strong className="text-slate-900">{itemLabel}</strong>

                      <p className="text-sm text-slate-500">
                        Upload a contract, lease, license, diploma, settlement,
                        court order, power of attorney, or other record to
                        autofill only this document card.
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeDocument(index)}
                      className="rounded-xl"
                    >
                      <Minus className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>

                  <CardContent className="space-y-6 p-5">
                    {renderUploader({
                      subsection: '20C',
                      scope: itemScope,
                      title: `Upload document for ${itemLabel}`,
                      description: `This will autofill only ${itemLabel}. It will not overwrite other document cards.`,
                      buttonLabel: `Auto-fill ${itemLabel}`,
                      compact: true,
                      onAutofill: () => handleAutofill20C(itemScope, index),
                    })}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {SECTION_20C.fields.map(field => (
                        <DynamicFormField
                          key={`${field.key}-${item.__rowId || index}`}
                          field={field}
                          value={item?.[field.key]}
                          formData={item}
                          rowId={item.__rowId}
                          onChange={value =>
                            updateDocument(index, field.key, value)
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

      {renderStaticSection('20A')}
      {activeSubsection === '20B' && disabledSubsections['20B'] ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Business Taxes & Issues is marked as not applicable. Uncheck the box
            above to enable these fields.
          </p>
        </div>
      ) : (
        renderStaticSection('20B')
      )}
      {renderRepeatable20C()}
    </div>
  );
}
