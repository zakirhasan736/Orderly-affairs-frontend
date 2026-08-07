/**
 * Identity documents (driver's license, passport, military/school ID, etc.)
 * often land in Vital Information. Ask whose ID it is before writing fields.
 */

import { unwrapAiAutofillPatch } from '@/utils/aiPatchNormalizer';
import { AI_SECTION_BY_KEY } from '@/utils/aiSectionRegistry';

export type IdentityPersonChoice =
  | 'self'
  | 'spouse'
  | 'dependent'
  | 'other';

const IDENTITY_DOC_RE =
  /\b(driver'?s?\s*licen[cs]e|driving\s*licen[cs]e|state\s*id(?:entification)?|identification\s*card|id\s*card|passport|military\s*id|military\s*identification|dod\s*id|common\s*access\s*card|\bcac\b|school\s*id|student\s*id|campus\s*id|birth\s*certificate|social\s*security\s*card|ssn\s*card|green\s*card|permanent\s*resident|national\s*id|photo\s*id)\b/i;

const FAMILY_SECTION = AI_SECTION_BY_KEY.family_treasured_connections;

export function inferIdentityDocumentLabel(args: {
  documentSummary?: string | null;
  fileName?: string | null;
}): string {
  const text = `${args.documentSummary || ''} ${args.fileName || ''}`;
  if (/passport/i.test(text)) return 'Passport';
  if (/military|dod\s*id|\bcac\b/i.test(text)) return 'Military ID';
  if (/school|student|campus/i.test(text)) return 'School ID';
  if (/birth\s*certificate/i.test(text)) return 'Birth certificate';
  if (/social\s*security|ssn\s*card/i.test(text)) return 'Social Security card';
  if (/driver|licen[cs]e|state\s*id|identification|photo\s*id|id\s*card/i.test(text)) {
    return "Driver's license / ID";
  }
  return 'Identification document';
}

export function isIdentityDocumentCandidate(args: {
  sectionKey?: string | null;
  sectionId?: string | null;
  documentSummary?: string | null;
  fileName?: string | null;
  result?: unknown;
}): boolean {
  const text = [
    args.documentSummary || '',
    args.fileName || '',
    JSON.stringify(unwrapAiAutofillPatch(args.result) || {}),
  ].join(' ');

  // Insurance "member ID card" must not trigger the vital-info ID chooser.
  if (
    /\b(health\s*insurance|medical\s*insurance|dental\s*insurance|member\s*id|group\s*(?:number|#)|rx\s*bin|rxbin|optum|united\s*healthcare|insurance\s*card|payer\s*id)\b/i.test(
      text,
    )
  ) {
    return false;
  }

  if (
    args.sectionKey === 'insurance_policies' ||
    args.sectionId === '7' ||
    args.sectionKey === 'health_information' ||
    args.sectionId === '15'
  ) {
    return false;
  }

  if (IDENTITY_DOC_RE.test(text)) return true;

  // Overview classifies ID pages as vital_information — always confirm person.
  if (
    args.sectionKey === 'vital_information' ||
    args.sectionId === '1'
  ) {
    const vital = (unwrapAiAutofillPatch(args.result) as {
      vital_info?: Record<string, unknown>;
    } | null)?.vital_info;
    if (vital && typeof vital === 'object') {
      const name = String(vital.full_legal_name || '').trim();
      const dob = String(vital.date_of_birth || '').trim();
      // Name + DOB is the classic ID extract shape.
      if (name && dob) return true;
      if (name && /licen|passport|id|certificate/i.test(text)) return true;
    }
  }

  if (
    args.sectionKey === 'legal_documents_records' ||
    args.sectionId === '20'
  ) {
    const patch = unwrapAiAutofillPatch(args.result) as Record<
      string,
      unknown
    > | null;
    const block =
      (patch?.['20A'] as Record<string, unknown> | undefined) || patch || {};
    if (
      block.passport ||
      block.drivers_license ||
      block.birth_certificate ||
      block.social_security_card
    ) {
      return true;
    }
  }

  return false;
}

export function extractIdentityPersonName(result: unknown): string | null {
  const patch = unwrapAiAutofillPatch(result) as Record<string, unknown> | null;
  if (!patch) return null;

  const vital = patch.vital_info as Record<string, unknown> | undefined;
  if (vital?.full_legal_name) {
    const name = String(vital.full_legal_name).trim();
    if (name) return name;
  }

  const block20 =
    (patch['20A'] as Record<string, unknown> | undefined) || patch;
  for (const key of [
    'passport',
    'drivers_license',
    'birth_certificate',
    'social_security_card',
  ]) {
    const raw = block20[key];
    if (typeof raw === 'string' && raw.trim()) {
      // Often "Name: … License #: …" — pull a leading name-like segment.
      const nameMatch = raw.match(
        /(?:name|full\s*name)\s*[:#-]?\s*([A-Za-z][A-Za-z .'’-]{2,80})/i,
      );
      if (nameMatch?.[1]) return nameMatch[1].trim();
    }
  }

  return null;
}

function compactJoin(parts: Array<string | null | undefined>) {
  return parts
    .map(part => (part == null ? '' : String(part).trim()))
    .filter(Boolean)
    .join(' · ');
}

function identityNotesFromVital(
  vital: Record<string, unknown>,
  documentSummary?: string | null,
  fileName?: string | null,
) {
  const bits = [
    inferIdentityDocumentLabel({ documentSummary, fileName }),
    vital.social_security_number
      ? `SSN note: ${String(vital.social_security_number)}`
      : null,
    documentSummary || null,
    fileName ? `Source file: ${fileName}` : null,
  ];
  return compactJoin(bits);
}

function wrapFamilyResult(
  subsection: '17B' | '17C',
  card: Record<string, unknown>,
) {
  return {
    section: 'family_treasured_connections',
    scope: 'subsection',
    subsection,
    confidence: 0.9,
    patch: {
      [subsection]: [card],
    },
  };
}

export type IdentityRouteTarget = {
  sectionId: string;
  sectionKey: string;
  subsection?: string;
  sectionLabel?: string;
  result: unknown;
};

/**
 * Remap a vital / legal ID extract to the vault destination for the chosen person.
 */
export function applyIdentityPersonChoice(
  choice: IdentityPersonChoice,
  args: {
    sectionId: string;
    sectionKey: string;
    subsection?: string | null;
    sectionLabel?: string;
    result: unknown;
    documentSummary?: string | null;
    fileName?: string | null;
  },
): IdentityRouteTarget {
  if (choice === 'self') {
    return {
      sectionId: args.sectionId,
      sectionKey: args.sectionKey,
      subsection: args.subsection || undefined,
      sectionLabel: args.sectionLabel,
      result: args.result,
    };
  }

  const patch = unwrapAiAutofillPatch(args.result) as Record<
    string,
    unknown
  > | null;
  const vital = (patch?.vital_info as Record<string, unknown> | undefined) || {};
  const name =
    String(vital.full_legal_name || '').trim() ||
    extractIdentityPersonName(args.result) ||
    '';
  const birthdate = String(vital.date_of_birth || '').trim();
  const contact = compactJoin([
    vital.phone_number ? String(vital.phone_number) : null,
    vital.primary_email_username
      ? String(vital.primary_email_username)
      : null,
  ]);
  const notes = identityNotesFromVital(
    vital,
    args.documentSummary,
    args.fileName,
  );

  const familyId = FAMILY_SECTION?.id || '17';
  const familyKey = FAMILY_SECTION?.key || 'family_treasured_connections';
  const familyLabel = FAMILY_SECTION?.label || 'Family & Relationships';

  if (choice === 'dependent') {
    return {
      sectionId: familyId,
      sectionKey: familyKey,
      subsection: '17C',
      sectionLabel: familyLabel,
      result: wrapFamilyResult('17C', {
        dependent_name: name || null,
        relationship: 'Child',
        birthdate: birthdate || null,
        dependency_type: null,
        support_details: null,
        backup_caregivers: null,
        special_needs: null,
        future_care_plans: null,
        legal_documents: notes || null,
        financial_accounts: null,
      }),
    };
  }

  const relationship =
    choice === 'spouse' ? 'Spouse/Partner' : 'Other Family';

  return {
    sectionId: familyId,
    sectionKey: familyKey,
    subsection: '17B',
    sectionLabel: familyLabel,
    result: wrapFamilyResult('17B', {
      person_name: name || null,
      relationship,
      contact_info: contact || null,
      birthdate: birthdate || null,
      importance: null,
      notify_instructions: null,
      special_considerations: notes || null,
      photos_mementos: args.fileName
        ? `Uploaded ID: ${args.fileName}`
        : null,
    }),
  };
}
