/**
 * Shared identity-document card schema for Legal Documents 20A
 * (and owner mode used by Vital 1A when present).
 */

export const IDENTITY_DOCUMENT_TYPES = [
  'Passport',
  'Birth certificate',
  'SSN/SIN card',
  "Driver's license",
  'Marriage certificate',
  'Divorce certificate',
  'Naturalization',
  'Immigration',
  'Other',
] as const;

export const IDENTITY_ASSIGNED_TO_OPTIONS = [
  'Self',
  'Spouse/Partner',
  'Dependent',
  'Other',
  'Household',
] as const;

/**
 * Client-required identity card fields that must be re-read by AI when empty
 * after the first OCR/autofill pass.
 */
export const IDENTITY_MUST_FILL_KEYS = [
  'assigned_to',
  'assigned_to_name',
  'category',
  'full_legal_name',
  'date_of_birth',
  'document_type',
  'document_number',
  'issue_date',
  'expiration_date',
  'issuing_authority',
  'document_location',
  'last_updated',
] as const;

/** Education fields on Dependent (17C) cards — also gap-re-read when empty. */
export const DEPENDENT_EDUCATION_MUST_FILL_KEYS = [
  'school_name',
  'grade',
  'enrollment_contact',
  'iep_or_504',
  'iep_504_details',
  'emergency_pickup_list',
] as const;

export type IdentityDocumentFieldsMode = 'owner' | 'family';

export function getIdentityDocumentFields(mode: IdentityDocumentFieldsMode) {
  const assigned =
    mode === 'family'
      ? [
          {
            key: 'assigned_to',
            label: 'Assigned to',
            type: 'Dropdown' as const,
            options: [...IDENTITY_ASSIGNED_TO_OPTIONS],
            helperText: 'Who this identity document belongs to',
            required: true,
          },
          {
            key: 'assigned_to_name',
            label: 'Person name',
            type: 'TextInput' as const,
            helperText: 'Full name when assigned to someone other than Self',
            required: true,
            conditionalDisplay: {
              field: 'assigned_to',
              value: ['Spouse/Partner', 'Dependent', 'Other', 'Household'],
            },
          },
        ]
      : [];

  return [
    ...assigned,
    {
      key: 'category',
      label: 'Category',
      type: 'TextInput' as const,
      helperText: 'Document category',
      defaultValue: 'identity',
    },
    {
      key: 'full_legal_name',
      label: 'Full legal name',
      type: 'TextInput' as const,
      helperText: 'Name as printed on the document',
      required: true,
    },
    {
      key: 'date_of_birth',
      label: 'Date of birth',
      type: 'DatePicker' as const,
      helperText: 'Date of birth on the document',
    },
    {
      key: 'document_type',
      label: 'Document type',
      type: 'Dropdown' as const,
      options: [...IDENTITY_DOCUMENT_TYPES],
      helperText: 'Passport, birth certificate, SSN card, license, etc.',
      required: true,
    },
    {
      key: 'document_number',
      label: 'Document number',
      type: 'TextInput' as const,
      helperText: 'Passport number, certificate number, license number, etc.',
    },
    {
      key: 'issue_date',
      label: 'Issue date',
      type: 'DatePicker' as const,
      helperText: 'Date the document was issued',
    },
    {
      key: 'expiration_date',
      label: 'Expiration date',
      type: 'DatePicker' as const,
      helperText: 'Expiration date if applicable',
    },
    {
      key: 'issuing_authority',
      label: 'Issuing authority',
      type: 'TextInput' as const,
      helperText: 'Agency or office that issued the document',
    },
    {
      key: 'document_location',
      label: 'Physical / digital location of the original',
      type: 'TextArea' as const,
      helperText: 'Where the original is stored (safe, file bag, cloud folder, etc.)',
    },
    {
      key: 'last_updated',
      label: 'Last updated',
      type: 'DatePicker' as const,
      helperText: 'When this record was last reviewed or updated',
    },
    {
      key: 'document_upload',
      label: 'Document file',
      type: 'TextInputWithUpload' as const,
      helperText: 'Upload a scan or photo of this document',
      allowFieldUpload: true,
    },
  ];
}

export function createEmptyIdentityDocument(
  mode: IdentityDocumentFieldsMode,
): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const field of getIdentityDocumentFields(mode)) {
    if (field.key === 'category') {
      item.category = 'identity';
    } else if (field.type === 'TextInputWithUpload') {
      item[field.key] = { text: '', files: [] };
    } else if (field.key === 'assigned_to' && mode === 'family') {
      item.assigned_to = 'Self';
    } else {
      item[field.key] = '';
    }
  }
  return item;
}

export function identityDocumentCardLabel(
  item: Record<string, unknown>,
  index: number,
  mode: IdentityDocumentFieldsMode,
): string {
  const type = String(item.document_type || '').trim();
  const name =
    mode === 'family'
      ? String(item.assigned_to_name || item.full_legal_name || '').trim()
      : String(item.full_legal_name || '').trim();
  const assigned =
    mode === 'family' ? String(item.assigned_to || '').trim() : '';
  const parts = [
    type || 'Identity document',
    assigned && assigned !== 'Self' ? assigned : null,
    name,
  ].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  return `Identity document #${index + 1}`;
}

/** Legacy Section 20A upload-only keys → document_type labels. */
export const LEGACY_IDENTITY_UPLOAD_KEYS: Record<string, string> = {
  birth_certificate: 'Birth certificate',
  social_security_card: 'SSN/SIN card',
  passport: 'Passport',
  drivers_license: "Driver's license",
  marriage_certificate: 'Marriage certificate',
  divorce_decree: 'Divorce certificate',
  naturalization_certificate: 'Naturalization',
  immigration_documents: 'Immigration',
  children_birth_certificates: 'Birth certificate',
  name_change_documents: 'Other',
};

/**
 * Build identity_documents cards from legacy 20A upload/note slots
 * (used for read migration and AI patches that still return old keys).
 */
export function migrateLegacyIdentityUploads(
  sectionData: Record<string, unknown> | null | undefined,
): Record<string, unknown>[] {
  const existing = Array.isArray(sectionData?.identity_documents)
    ? (sectionData!.identity_documents as Record<string, unknown>[])
    : [];
  if (existing.length > 0) return existing;

  return cardsFromLegacyIdentitySlots(sectionData);
}

export function cardsFromLegacyIdentitySlots(
  sectionData: Record<string, unknown> | null | undefined,
): Record<string, unknown>[] {
  if (!sectionData || typeof sectionData !== 'object') return [];

  const migrated: Record<string, unknown>[] = [];
  for (const [key, docType] of Object.entries(LEGACY_IDENTITY_UPLOAD_KEYS)) {
    const raw = sectionData[key];
    if (raw == null || raw === '') continue;

    let text = '';
    let files: unknown[] = [];
    if (typeof raw === 'string') {
      text = raw.trim();
    } else if (typeof raw === 'object') {
      const upload = raw as { text?: string; files?: unknown[] };
      text = String(upload.text || '').trim();
      files = Array.isArray(upload.files) ? upload.files : [];
    }
    if (!text && files.length === 0) continue;

    migrated.push({
      ...createEmptyIdentityDocument('family'),
      document_type: docType,
      document_location: text,
      document_upload: {
        text,
        files,
      },
      assigned_to:
        key === 'children_birth_certificates' ? 'Dependent' : 'Self',
    });
  }
  return migrated;
}

export const IDENTITY_DOCUMENT_FIELD_KEYS = getIdentityDocumentFields('owner')
  .map(f => f.key)
  .filter(k => k !== 'category');
