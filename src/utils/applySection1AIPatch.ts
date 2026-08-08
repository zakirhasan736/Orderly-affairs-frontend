import { toDateOnlyString } from '@/utils/dateOnly';

const VITAL_DATE_KEYS = [
  'date_of_birth',
  'drivers_license_issue_date',
  'drivers_license_expiration_date',
] as const;

function normalizeVitalDates(
  vital: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!vital || typeof vital !== 'object') return {};
  const next = { ...vital };
  for (const key of VITAL_DATE_KEYS) {
    const normalized = toDateOnlyString(next[key] as string | Date | null | undefined);
    if (normalized) next[key] = normalized;
  }
  return next;
}

function mergeIdentityDocuments(currentData: any, patch: any) {
  if (Array.isArray(patch?.identity_documents) && patch.identity_documents.length) {
    const existing = Array.isArray(currentData?.identity_documents)
      ? currentData.identity_documents
      : [];
    // Append new AI cards; do not wipe user cards unless patch replaces explicitly
    if (existing.length === 0) return patch.identity_documents;
    return [...existing, ...patch.identity_documents];
  }
  return Array.isArray(currentData?.identity_documents)
    ? currentData.identity_documents
    : [];
}

export function applySection1AIPatch(currentData: any, patch: any) {
  const nextVital = normalizeVitalDates({
    ...(currentData?.vital_info || {}),
    ...(patch?.vital_info || {}),
  });

  const hasExistingVital = Object.values(currentData?.vital_info || {}).some(
    value => value !== null && value !== undefined && String(value).trim() !== '',
  );
  const hasIncomingVital = Object.values(patch?.vital_info || {}).some(
    value => value !== null && value !== undefined && String(value).trim() !== '',
  );

  const contactKeys = ['executor_trustee', 'additional_contacts'] as const;
  const wouldReplaceContacts = contactKeys.some(key => {
    const incoming = patch?.[key];
    const existing = currentData?.[key];
    return (
      Array.isArray(incoming) &&
      incoming.length > 0 &&
      Array.isArray(existing) &&
      existing.length > 0
    );
  });

  if ((hasExistingVital && hasIncomingVital) || wouldReplaceContacts) {
    const confirmed =
      typeof window !== 'undefined' &&
      window.confirm(
        'This document would update existing Vital Information. Continue and overwrite?',
      );
    if (!confirmed) {
      const mergedVital = { ...(currentData?.vital_info || {}) };
      for (const [key, value] of Object.entries(patch?.vital_info || {})) {
        const existing = mergedVital[key];
        const empty =
          existing === null ||
          existing === undefined ||
          String(existing).trim() === '';
        if (empty) mergedVital[key] = value;
      }
      return {
        ...currentData,
        vital_info: normalizeVitalDates(mergedVital),
        identity_documents: mergeIdentityDocuments(currentData, patch),
        executor_trustee: currentData?.executor_trustee || [],
        additional_contacts: currentData?.additional_contacts || [],
      };
    }
  }

  return {
    ...currentData,
    vital_info: nextVital,
    identity_documents: mergeIdentityDocuments(currentData, patch),
    next_of_kin: currentData?.next_of_kin || [],
    executor_trustee: Array.isArray(patch?.executor_trustee)
      ? patch.executor_trustee
      : currentData?.executor_trustee || [],
    additional_contacts: Array.isArray(patch?.additional_contacts)
      ? patch.additional_contacts
      : currentData?.additional_contacts || [],
  };
}

export function applySection1SubsectionPatch(
  currentData: any,
  subsection: string,
  patch: any,
) {
  if (subsection === 'vital_info' || subsection === '1A') {
    return applySection1AIPatch(currentData, {
      vital_info: patch?.vital_info || patch,
      identity_documents: patch?.identity_documents,
    });
  }

  if (subsection === 'identity_documents') {
    return {
      ...currentData,
      identity_documents: Array.isArray(patch?.identity_documents)
        ? patch.identity_documents
        : mergeIdentityDocuments(currentData, patch),
    };
  }

  if (subsection === 'next_of_kin') {
    return currentData;
  }

  if (subsection === 'executor_trustee') {
    return {
      ...currentData,
      executor_trustee: Array.isArray(patch?.executor_trustee)
        ? patch.executor_trustee
        : currentData?.executor_trustee || [],
    };
  }

  if (subsection === 'additional_contacts') {
    return {
      ...currentData,
      additional_contacts: Array.isArray(patch?.additional_contacts)
        ? patch.additional_contacts
        : currentData?.additional_contacts || [],
    };
  }

  return currentData;
}
