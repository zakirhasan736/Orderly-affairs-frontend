/**
 * Health insurance cards: ask whose card it is, then stamp relationship on the policy.
 * Auto / vehicle insurance is a different kind — never treat it as Healthcare.
 */

import { unwrapAiAutofillPatch } from '@/utils/aiPatchNormalizer';
import type { IdentityPersonChoice } from '@/utils/aiIdentityDocument';

const AUTO_INSURANCE_RE =
  /\b(auto(?:mobile)?\s*(?:insurance|policy|card)?|vehicle\s*(?:insurance|policy|card)?|(?:car|truck|suv|jeep|honda|motorcycle)\s*(?:insurance|policy)|vin\b|license\s*plate|garaging|collision|comprehensive|bodily\s*injury|year\s*make\s*model)\b/i;

const HEALTH_CARD_RE =
  /\b(health\s*insurance|medical\s*insurance|dental\s*insurance|member\s*id|group\s*(?:number|#|no\.?)|rx\s*bin|rxbin|rx\s*pcn|rxpcn|optum|united\s*healthcare|u\.?h\.?c\.?|aetna|cigna|blue\s*cross|blue\s*shield|anthem|humana|kaiser|medicare|medicaid|payer\s*id)\b/i;

function insuranceBlob(args: {
  sectionKey?: string | null;
  sectionId?: string | null;
  documentSummary?: string | null;
  fileName?: string | null;
  result?: unknown;
  documentKind?: string | null;
}): string {
  return [
    args.documentKind || '',
    args.documentSummary || '',
    args.fileName || '',
    JSON.stringify(unwrapAiAutofillPatch(args.result) || {}),
  ].join(' ');
}

export function isVehicleInsuranceDocument(args: {
  sectionKey?: string | null;
  sectionId?: string | null;
  documentSummary?: string | null;
  fileName?: string | null;
  result?: unknown;
  documentKind?: string | null;
}): boolean {
  const kind = String(args.documentKind || '').toLowerCase();
  if (kind.includes('auto') || kind.includes('vehicle')) return true;
  return AUTO_INSURANCE_RE.test(insuranceBlob(args));
}

export function isHealthInsuranceCardCandidate(args: {
  sectionKey?: string | null;
  sectionId?: string | null;
  documentSummary?: string | null;
  fileName?: string | null;
  result?: unknown;
  documentKind?: string | null;
}): boolean {
  if (isVehicleInsuranceDocument(args)) return false;

  const kind = String(args.documentKind || '').toLowerCase();
  if (kind.includes('health') || kind.includes('medical') || kind.includes('dental')) {
    return true;
  }

  const text = insuranceBlob(args);
  if (HEALTH_CARD_RE.test(text)) return true;

  if (
    args.sectionKey === 'insurance_policies' ||
    args.sectionId === '7' ||
    args.sectionKey === 'health_information' ||
    args.sectionId === '15'
  ) {
    const patch = unwrapAiAutofillPatch(args.result) as Record<
      string,
      unknown
    > | null;
    const rows = Array.isArray(patch?.['7A'])
      ? (patch?.['7A'] as Record<string, unknown>[])
      : [];
    const healthish = rows.some(row => {
      const type = String(row.policy_type || '').toLowerCase();
      return (
        Boolean(row.rx_bin || row.rx_pcn || row.group_number) ||
        (Boolean(row.member_id) &&
          (type.includes('health') ||
            type.includes('medical') ||
            type.includes('dental') ||
            type.includes('medicaid'))) ||
        type.includes('health') ||
        type.includes('medical') ||
        type.includes('dental') ||
        type.includes('medicaid')
      );
    });
    if (healthish) return true;
  }

  return false;
}

export function extractInsuranceMemberName(result: unknown): string | null {
  const patch = unwrapAiAutofillPatch(result) as Record<string, unknown> | null;
  if (!patch) return null;
  const rows = Array.isArray(patch['7A'])
    ? (patch['7A'] as Record<string, unknown>[])
    : [];
  for (const row of rows) {
    const name = String(row.member_name || '').trim();
    if (name) return name;
  }
  return null;
}

function relationshipLabel(choice: IdentityPersonChoice): string {
  if (choice === 'spouse') return 'Spouse/Partner';
  if (choice === 'dependent') return 'Dependent';
  if (choice === 'other') return 'Other';
  return 'Me (primary)';
}

/**
 * Keep insurance/health destination; stamp covered_relationship (+ ensure Health type).
 */
export function applyInsurancePersonChoice(
  choice: IdentityPersonChoice,
  args: {
    sectionId: string;
    sectionKey: string;
    subsection?: string | null;
    sectionLabel?: string;
    result: unknown;
  },
): {
  sectionId: string;
  sectionKey: string;
  subsection?: string;
  sectionLabel?: string;
  result: unknown;
} {
  const patch = {
    ...(unwrapAiAutofillPatch(args.result) as Record<string, unknown>),
  };
  const rows = Array.isArray(patch['7A'])
    ? [...(patch['7A'] as Record<string, unknown>[])]
    : [];

  if (rows.length) {
    patch['7A'] = rows.map(row => {
      const next = { ...row };
      const type = String(next.policy_type || '');
      if (
        !type ||
        !/health|medical|dental|medicaid/i.test(type)
      ) {
        // Only coerce when this extract looks like a health card.
        if (
          next.member_id ||
          next.group_number ||
          next.rx_bin ||
          next.plan_name ||
          next.member_name
        ) {
          if (
            !isVehicleInsuranceDocument({
              sectionId: args.sectionId,
              sectionKey: args.sectionKey,
              result: args.result,
            })
          ) {
            next.policy_type = 'Health';
          }
        }
      }
      next.covered_relationship = relationshipLabel(choice);
      if (!next.member_id && next.policy_number) {
        const policyNo =
          typeof next.policy_number === 'string'
            ? next.policy_number
            : String(
                (next.policy_number as { text?: string } | null)?.text || '',
              ).trim();
        if (policyNo) next.member_id = policyNo;
      }
      return next;
    });
  }

  const wrapped =
    args.result &&
    typeof args.result === 'object' &&
    'patch' in (args.result as object)
      ? {
          ...(args.result as Record<string, unknown>),
          patch,
          section: args.sectionKey,
        }
      : {
          section: args.sectionKey,
          scope: 'section',
          subsection: args.subsection || '7A',
          confidence: 0.9,
          patch,
        };

  // Prefer saving health cards into Insurance (structured card fields).
  // Also remap mis-routed Vital / Healthcare extracts so member ID & group # land on 7A.
  const preferInsurance =
    args.sectionKey === 'health_information' ||
    args.sectionId === '15' ||
    args.sectionKey === 'vital_information' ||
    args.sectionId === '1' ||
    isHealthInsuranceCardCandidate({
      sectionId: args.sectionId,
      sectionKey: args.sectionKey,
      result: args.result,
    });

  return {
    sectionId: preferInsurance ? '7' : args.sectionId,
    sectionKey: preferInsurance ? 'insurance_policies' : args.sectionKey,
    subsection: preferInsurance ? '7A' : args.subsection || undefined,
    sectionLabel: preferInsurance
      ? 'Insurance Policies'
      : args.sectionLabel,
    result: wrapped,
  };
}
