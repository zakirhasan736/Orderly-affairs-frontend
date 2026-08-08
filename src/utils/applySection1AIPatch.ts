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

  const contactKeys = ['next_of_kin', 'executor_trustee', 'additional_contacts'] as const;
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
      // Fill empty vital fields only; keep existing contact arrays
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
        next_of_kin: currentData?.next_of_kin || [],
        executor_trustee: currentData?.executor_trustee || [],
        additional_contacts: currentData?.additional_contacts || [],
      };
    }
  }

  return {
    ...currentData,
    vital_info: nextVital,
    next_of_kin: Array.isArray(patch?.next_of_kin)
      ? patch.next_of_kin
      : currentData?.next_of_kin || [],
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
  if (subsection === 'vital_info') {
    return applySection1AIPatch(currentData, {
      vital_info: patch?.vital_info || patch,
    });
  }

  if (subsection === 'next_of_kin') {
    return {
      ...currentData,
      next_of_kin: Array.isArray(patch?.next_of_kin)
        ? patch.next_of_kin
        : currentData?.next_of_kin || [],
    };
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
