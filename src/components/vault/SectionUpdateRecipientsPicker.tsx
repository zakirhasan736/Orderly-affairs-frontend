'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@common/ui/utils';
import {
  applyServerNotificationPrefs,
  getNotificationPreferences,
  NOTIFICATION_PREFS_CHANGED,
  resolveSectionUpdateRecipientIds,
  setNotificationPreferences,
  toServerNotificationPrefsPatch,
} from '@/utils/notificationPreferences';
import {
  useGetMyFamilyQuery,
  useGetMyNextKinQuery,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  type FamilyMemberResponse,
  type NextKinAccessResponse,
} from '@/services/authApi';

export type UpdateNoticePerson = {
  id: string;
  name: string;
  email: string;
  kind: 'nok' | 'family';
  hint: string;
};

export function listUpdateNoticePeople(
  nextKinList: NextKinAccessResponse[],
  familyList: FamilyMemberResponse[],
): UpdateNoticePerson[] {
  return [
    ...nextKinList
      .filter(person => person.immediate_access && person.id)
      .map(person => ({
        id: person.id,
        name: person.full_name || person.email,
        email: person.email,
        kind: 'nok' as const,
        hint: 'Immediate access',
      })),
    ...familyList
      .filter(person => person.id)
      .map(person => ({
        id: person.id,
        name: person.full_name || person.email,
        email: person.email,
        kind: 'family' as const,
        hint: person.portal_role || 'Collaborator',
      })),
  ];
}

export function SectionUpdateRecipientsPicker({
  sectionId,
  compact = false,
  className,
}: {
  sectionId?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(!compact);
  const [tick, setTick] = useState(0);
  const { data: nextKinList = [] } = useGetMyNextKinQuery();
  const { data: familyList = [] } = useGetMyFamilyQuery();
  const { data: serverPrefs } = useGetNotificationPreferencesQuery();
  const [updatePrefs] = useUpdateNotificationPreferencesMutation();

  useEffect(() => {
    if (serverPrefs) applyServerNotificationPrefs(serverPrefs);
    setTick(value => value + 1);
  }, [serverPrefs]);

  useEffect(() => {
    const refresh = () => setTick(value => value + 1);
    window.addEventListener(NOTIFICATION_PREFS_CHANGED, refresh);
    return () => window.removeEventListener(NOTIFICATION_PREFS_CHANGED, refresh);
  }, []);

  const prefs = getNotificationPreferences();
  void tick;
  const people = useMemo(
    () => listUpdateNoticePeople(nextKinList, familyList),
    [familyList, nextKinList],
  );

  if (sectionId === '4') {
    return (
      <p className={cn('text-[12px] text-[#7A8794]', className)}>
        Personal messages stay private. Update notices are not sent for this
        section.
      </p>
    );
  }

  const selectedIds = resolveSectionUpdateRecipientIds(prefs, sectionId);

  const allIds = people.map(person => person.id);
  const checkedIds =
    selectedIds === null
      ? allIds
      : selectedIds.filter(id => allIds.includes(id));
  const names = people
    .filter(person => checkedIds.includes(person.id))
    .map(person => person.name);

  const save = async (nextIds: string[] | null) => {
    const current = getNotificationPreferences();
    const nextBySection = {
      ...current.sectionUpdateRecipientsBySection,
    };
    if (sectionId) {
      if (nextIds === null) {
        delete nextBySection[sectionId];
      } else {
        nextBySection[sectionId] = nextIds;
      }
    }
    const next = setNotificationPreferences({
      sectionUpdateRecipientIds: sectionId
        ? current.sectionUpdateRecipientIds
        : nextIds,
      sectionUpdateRecipientsBySection: nextBySection,
    });
    try {
      await updatePrefs({
        ...toServerNotificationPrefsPatch(next),
        section_update_recipients_by_section: sectionId
          ? { [sectionId]: nextIds }
          : nextBySection,
      }).unwrap();
    } catch {
      toast.error('Could not save who receives this notice');
    }
  };

  const toggle = (id: string) => {
    const next = checkedIds.includes(id)
      ? checkedIds.filter(item => item !== id)
      : [...checkedIds, id];
    void save(next.length === allIds.length ? null : next);
  };

  if (!people.length) {
    if (compact) return null;
    return (
      <div
        className={cn(
          'rounded-2xl border border-[#E4EAF0] bg-[#F6F8FA] px-3.5 py-3.5',
          className,
        )}
      >
        <p className="text-[14px] font-semibold text-[#213D59]">
          Who gets an update notice
        </p>
        <p className="mt-1 text-[12px] leading-snug text-slate-500">
          Name a next of kin with immediate access, or add a family member, to
          choose who is emailed when this section is saved.
        </p>
      </div>
    );
  }

  const list = (
    <ul className={cn('space-y-2', compact ? 'mt-2' : 'mt-3')}>
      {people.map(person => {
        const checked = checkedIds.includes(person.id);
        return (
          <li key={person.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-[#E4EAF0] bg-white px-3 py-2.5">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-[#C9D4DE] text-[#213D59] accent-[#213D59]"
                checked={checked}
                onChange={() => toggle(person.id)}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-[#213D59]">
                  {person.name}
                </span>
                <span className="block truncate text-[12px] text-[#7A8794]">
                  {person.kind === 'nok' ? 'Next of kin' : 'Family'} · {person.hint}
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );

  if (compact) {
    return (
      <div className={cn('min-w-0', className)}>
        <button
          type="button"
          onClick={() => setOpen(value => !value)}
          className="inline-flex max-w-full items-center gap-1.5 text-left"
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[#213D59] ring-1 ring-[#E4EAF0]">
            <Bell className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#213D59]">
              {names.length ? 'Notice sent to' : 'Choose who is notified'}
              <ChevronDown
                className={cn('h-3 w-3 transition', open && 'rotate-180')}
              />
            </span>
            <span className="block truncate text-[10px] text-[#7A8794]">
              {names.length ? names.join(', ') : 'Immediate NOK and family, by default'}
            </span>
          </span>
        </button>
        {open ? list : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#E4EAF0] bg-white px-3.5 py-3.5 sm:px-4',
        className,
      )}
    >
      <p className="text-[14px] font-semibold text-[#213D59] sm:text-[15px]">
        Who gets an update notice
      </p>
      <p className="mt-0.5 text-[12px] leading-snug text-slate-500 sm:text-[13px]">
        Immediate-access next of kin and family members are selected by default.
        Uncheck anyone who should not get an email or push when this section is
        saved.
      </p>
      {list}
    </div>
  );
}
