'use client';

import { useEffect, useRef } from 'react';
import {
  getNotificationPreferences,
  parseMonthDayFromDate,
  setNotificationPreferences,
  toServerNotificationPrefsPatch,
  type SpecialDayPref,
} from '@/utils/notificationPreferences';
import { useUpdateNotificationPreferencesMutation } from '@/services/authApi';

function readDob(formData: Record<string, any> | null | undefined): string {
  const section = formData?.['1'] || formData?.vital_info || {};
  const vital = section.vital_info || section;
  return String(vital?.date_of_birth || section?.date_of_birth || '').trim();
}

/**
 * When Vital Information has a date of birth, keep a month/day birthday
 * on notification prefs so the daily wish job can run without decrypting
 * the full vault payload.
 */
export function useSyncSpecialDaysFromVault(
  formData: Record<string, any> | null | undefined,
) {
  const [updatePrefs] = useUpdateNotificationPreferencesMutation();
  const lastSent = useRef('');

  useEffect(() => {
    const parsed = parseMonthDayFromDate(readDob(formData));
    if (!parsed) return;
    const stamp = `birthday:${parsed.month}-${parsed.day}`;
    if (lastSent.current === stamp) return;

    const prefs = getNotificationPreferences();
    const existing = prefs.specialDays || [];
    const index = existing.findIndex(item => item.kind === 'birthday');
    let nextDays: SpecialDayPref[];
    if (index >= 0) {
      const current = existing[index];
      if (current.month === parsed.month && current.day === parsed.day) {
        lastSent.current = stamp;
        return;
      }
      nextDays = existing.map((item, i) =>
        i === index
          ? { ...item, month: parsed.month, day: parsed.day, source: 'vault' }
          : item,
      );
    } else {
      nextDays = [
        ...existing,
        {
          kind: 'birthday',
          month: parsed.month,
          day: parsed.day,
          label: 'Birthday',
          enabled: true,
          source: 'vault',
        },
      ];
    }

    lastSent.current = stamp;
    const next = setNotificationPreferences({ specialDays: nextDays });
    void updatePrefs(toServerNotificationPrefsPatch(next));
  }, [formData, updatePrefs]);
}
