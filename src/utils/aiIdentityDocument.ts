/**
 * Identity documents (driver's license, passport, military/school ID, etc.)
 * often land in Vital Information. Ask whose ID it is before writing fields.
 *
 * Routing (product):
 * - self → Vital Information 1A identity_documents
 * - spouse / partner / dependent / other → Legal Documents 20A identity_documents
 */

import { unwrapAiAutofillPatch } from '@/utils/aiPatchNormalizer';
import { AI_SECTION_BY_KEY } from '@/utils/aiSectionRegistry';
import {
  createEmptyIdentityDocument,
  IDENTITY_DOCUMENT_TYPES,
} from '@/utils/identityDocumentFields';

export type IdentityPersonChoice =
  | 'self'
  | 'spouse'
  | 'dependent'
  | 'other';

const IDENTITY_DOC_RE =
  /\b(driver'?s?\s*licen[cs]e|driving\s*licen[cs]e|state\s*id(?:entification)?|identification\s*card|id\s*card|passport|military\s*id|military\s*identification|dod\s*id|common\s*access\s*card|\bcac\b|school\s*id|student\s*id|campus\s*id|birth\s*certificate|social\s*security\s*card|ssn\s*card|green\s*card|permanent\s*resident|national\s*id|photo\s*id)\b/i;

const LEGAL_SECTION = AI_SECTION_BY_KEY.legal_documents_records;

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
  // State ID backs often print a roadside assistance line — still a license/ID.
  if (
    /\broadside\s*assistance\b/i.test(text) &&
    /\b(dob|date\s*of\s*birth|class\s*:|magnetic|barcode|identification)\b/i.test(
      text,
    )
  ) {
    return "Driver's license / ID";
  }
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
      block.social_security_card ||
      (Array.isArray(block.identity_documents) &&
        block.identity_documents.length > 0) ||
      (Array.isArray(patch?.identity_documents) &&
        (patch!.identity_documents as unknown[]).length > 0)
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

function mapDocumentType(
  label: string,
): (typeof IDENTITY_DOCUMENT_TYPES)[number] {
  const text = label.toLowerCase();
  if (text.includes('passport')) return 'Passport';
  if (text.includes('birth')) return 'Birth certificate';
  if (text.includes('social') || text.includes('ssn') || text.includes('sin')) {
    return 'SSN/SIN card';
  }
  if (
    text.includes('driver') ||
    text.includes('license') ||
    text.includes('state id')
  ) {
    return "Driver's license";
  }
  if (text.includes('marriage')) return 'Marriage certificate';
  if (text.includes('divorce')) return 'Divorce certificate';
  return 'Other';
}

export function buildIdentityDocumentCard(args: {
  mode: 'owner' | 'family';
  vital?: Record<string, unknown> | null;
  personName?: string | null;
  assignedTo?: string;
  documentSummary?: string | null;
  fileName?: string | null;
}): Record<string, unknown> {
  const vital = args.vital || {};
  const label = inferIdentityDocumentLabel({
    documentSummary: args.documentSummary,
    fileName: args.fileName,
  });
  const name =
    String(args.personName || '').trim() ||
    String(vital.full_legal_name || '').trim();

  const card: Record<string, unknown> = {
    ...createEmptyIdentityDocument(args.mode),
    category: 'identity',
    full_legal_name: name,
    date_of_birth: String(vital.date_of_birth || vital.birthdate || '').trim(),
    document_type: mapDocumentType(label),
    document_number:
      String(
        vital.drivers_license_number ||
          vital.passport_number ||
          vital.document_number ||
          vital.social_security_number ||
          '',
      ).trim(),
    issue_date: String(
      vital.drivers_license_issue_date ||
        vital.issue_date ||
        vital.passport_issue_date ||
        '',
    ).trim(),
    expiration_date: String(
      vital.drivers_license_expiration_date ||
        vital.expiration_date ||
        vital.passport_expiration_date ||
        '',
    ).trim(),
    issuing_authority: String(
      vital.issuing_authority || vital.state || vital.country || '',
    ).trim(),
    last_updated: new Date().toISOString().slice(0, 10),
  };

  if (args.mode === 'family') {
    card.assigned_to = args.assignedTo || 'Other';
    card.assigned_to_name = name;
  }

  return card;
}

function wrapLegalIdentityResult(card: Record<string, unknown>) {
  return {
    section: 'legal_documents_records',
    scope: 'subsection',
    subsection: '20A',
    confidence: 0.9,
    patch: {
      '20A': {
        identity_documents: [card],
      },
    },
  };
}

function ensureOwnerIdentityDocuments(
  result: unknown,
  args: {
    documentSummary?: string | null;
    fileName?: string | null;
  },
): unknown {
  const patch = unwrapAiAutofillPatch(result) as Record<string, unknown> | null;
  if (!patch) return result;

  if (
    Array.isArray(patch.identity_documents) &&
    patch.identity_documents.length > 0
  ) {
    return result;
  }

  const vital =
    (patch.vital_info as Record<string, unknown> | undefined) || {};
  const hasVital = Object.values(vital).some(
    value => value !== null && value !== undefined && String(value).trim() !== '',
  );
  if (!hasVital) return result;

  const card = buildIdentityDocumentCard({
    mode: 'owner',
    vital,
    documentSummary: args.documentSummary,
    fileName: args.fileName,
  });

  return {
    ...(typeof result === 'object' && result ? result : {}),
    patch: {
      ...patch,
      identity_documents: [card],
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
    const vitalMeta = AI_SECTION_BY_KEY.vital_information;
    return {
      sectionId: vitalMeta?.id || '1',
      sectionKey: vitalMeta?.key || 'vital_information',
      subsection: '1A',
      sectionLabel: vitalMeta?.label || args.sectionLabel || 'Vital Information',
      result: ensureOwnerIdentityDocuments(args.result, {
        documentSummary: args.documentSummary,
        fileName: args.fileName,
      }),
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

  const assignedTo =
    choice === 'spouse'
      ? 'Spouse/Partner'
      : choice === 'dependent'
        ? 'Dependent'
        : 'Other';

  const card = buildIdentityDocumentCard({
    mode: 'family',
    vital,
    personName: name,
    assignedTo,
    documentSummary: args.documentSummary,
    fileName: args.fileName,
  });

  const legalId = LEGAL_SECTION?.id || '20';
  const legalKey = LEGAL_SECTION?.key || 'legal_documents_records';
  const legalLabel = LEGAL_SECTION?.label || 'Legal Documents & Records';

  return {
    sectionId: legalId,
    sectionKey: legalKey,
    subsection: '20A',
    sectionLabel: legalLabel,
    result: wrapLegalIdentityResult(card),
  };
}
