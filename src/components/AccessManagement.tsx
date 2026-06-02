'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@common/ui/card';
import { Badge } from '@common/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@common/ui/collapsible';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  Plus,
  Save,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Unlock,
  UserPlus,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useApproveNextKinAccessMutation,
  useCreateNextKinMutation,
  useDeleteNextKinMutation,
  useGetMyNextKinQuery,
  useRevokeAllNextKinAccessMutation,
  useRevokeNextKinAccessMutation,
  useUpdateNextKinMutation,
} from '@/services/authApi';

import { DynamicFormField } from './DynamicFormField';
import { PasswordCard } from './PasswordCard';
import { formConfig } from '../config/formConfig';

interface AuthorizedPerson {
  _id?: string;
  __clientId?: string;
  full_name: string;
  relationship: string;
  email: string;
  phone_number?: string;
  access_level: 'Full Kit Access' | 'Section-Specific Access';
  authorized_sections: string[];
  immediate_access: boolean;
  nok_letter_received: boolean;
  master_password: string;
  password_card_generated: boolean;
  card_storage_location?: string;
  special_instructions?: string;
}

type PersonAction = 'saving' | 'deleting' | 'approving' | 'revoking';

const SECTION_PRESETS: Record<string, string[] | 'all'> = {
  'Full Access': 'all',
  'Financial & Tax': ['7', '12', '14', '16', '19', '20'],
  'Healthcare & Medical': ['15'],
  'Legal & Estate': ['20', '21'],
  'Personal & Family': ['1', '2', '17'],
  'Business & Employment': ['18'],
  'Insurance & Benefits': ['7', '11'],
};

function makeClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function generatePassword(length = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  if (typeof window !== 'undefined' && window.crypto) {
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);

    return Array.from(values, value => chars[value % chars.length]).join('');
  }

  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

function createEmptyPerson(): AuthorizedPerson {
  return {
    __clientId: makeClientId(),
    full_name: '',
    relationship: '',
    email: '',
    phone_number: '',
    access_level: 'Full Kit Access',
    authorized_sections: [],
    immediate_access: false,
    nok_letter_received: false,
    master_password: generatePassword(),
    password_card_generated: false,
    card_storage_location: '',
    special_instructions: '',
  };
}

function getPersonKey(person: AuthorizedPerson, index: number) {
  return person._id || person.__clientId || `person-${index}`;
}

function normalizeAccessLevel(
  accessLevel?: string,
): AuthorizedPerson['access_level'] {
  return accessLevel === 'Section-Specific Access'
    ? 'Section-Specific Access'
    : 'Full Kit Access';
}

type CreateNextKinResponseWithId = {
  id?: string;
  _id?: string;
};

type NextKinApiPersonExtras = {
  _id?: string;
  master_password?: string | null;
};

function getApiErrorDetail(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'data' in error &&
    error.data &&
    typeof error.data === 'object' &&
    'detail' in error.data
  ) {
    const detail = error.data.detail;
    return typeof detail === 'string' ? detail : '';
  }

  if (error instanceof Error) return error.message;

  return '';
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed bg-muted/30 p-6 text-center sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <UserPlus className="h-8 w-8" />
      </div>

      <h3 className="mt-5 text-lg font-semibold">
        No trusted people added yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Add at least one trusted person who can access your kit when needed. You
        can give full kit access or selected section access.
      </p>

      <Button onClick={onAdd} className="mt-5 rounded-2xl">
        <Plus className="mr-2 h-4 w-4" />
        Add First Person
      </Button>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-2xl font-semibold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function AccessBadge({ person }: { person: AuthorizedPerson }) {
  const isFull = person.access_level === 'Full Kit Access';

  return (
    <Badge
      className={`gap-1 rounded-full px-2.5 py-1 text-xs ${
        isFull
          ? 'bg-emerald-600 text-white hover:bg-emerald-600'
          : 'bg-blue-600 text-white hover:bg-blue-600'
      }`}
    >
      {isFull ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {isFull ? 'Full Access' : `${person.authorized_sections.length} Sections`}
    </Badge>
  );
}

function AccessStatusBadge({ person }: { person: AuthorizedPerson }) {
  return (
    <Badge
      variant="outline"
      className={`gap-1 rounded-full px-2.5 py-1 text-xs ${
        person.immediate_access
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
    >
      <Clock className="h-3 w-3" />
      {person.immediate_access ? 'Immediate Access' : 'Upon Death'}
    </Badge>
  );
}

export function AccessManagement() {
  const { data, isLoading, refetch } = useGetMyNextKinQuery(undefined);

  const [authorizedPeople, setAuthorizedPeople] = useState<AuthorizedPerson[]>(
    [],
  );

  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>(
    {},
  );

  const [showPasswordCards, setShowPasswordCards] = useState<
    Record<string, boolean>
  >({});

  const [expandedSectionPicker, setExpandedSectionPicker] = useState<
    Record<string, boolean>
  >({});

  const [personActions, setPersonActions] = useState<
    Record<string, PersonAction>
  >({});

  const [search, setSearch] = useState('');

  const [createNextKin] = useCreateNextKinMutation();
  const [updateNextKin] = useUpdateNextKinMutation();
  const [deleteNextKin] = useDeleteNextKinMutation();
  const [approveNextKinAccess] = useApproveNextKinAccessMutation();
  const [revokeNextKinAccess, { isLoading: isRevokingOne }] =
    useRevokeNextKinAccessMutation();
  const [revokeAllNextKinAccess, { isLoading: isRevokingAll }] =
    useRevokeAllNextKinAccessMutation();

  useEffect(() => {
    if (!data) return;

    setAuthorizedPeople(prev => {
      const unsaved = prev.filter(p => !p._id);

      const fromApi: AuthorizedPerson[] = data.map(rawNextKin => {
        const nk = rawNextKin as typeof rawNextKin & NextKinApiPersonExtras;
        const personId = nk.id || nk._id;

        return {
          _id: personId,
          __clientId: personId || makeClientId(),
          full_name: nk.full_name || '',
          relationship: nk.relationship || '',
          email: nk.email || '',
          phone_number: nk.phone_number || '',
          access_level: normalizeAccessLevel(nk.access_level),
          authorized_sections: Array.isArray(nk.authorized_sections)
            ? nk.authorized_sections
            : [],
          immediate_access: !!nk.immediate_access,
          nok_letter_received: !!nk.nok_letter_received,
          master_password: nk.master_password || '',
          password_card_generated: !!nk.password_card_generated,
          card_storage_location: nk.card_storage_location || '',
          special_instructions: nk.special_instructions || '',
        };
      });

      return [...fromApi, ...unsaved];
    });
  }, [data]);

  const sectionOptions = useMemo(() => {
    const options: { id: string; label: string; isSubsection: boolean }[] = [];

    formConfig.chunks.forEach(chunk => {
      chunk.sections.forEach(section => {
        if (section.id === '0') return;

        options.push({
          id: section.id,
          label: `${section.id}. ${section.title}`,
          isSubsection: false,
        });

        section.subsections?.forEach(sub => {
          options.push({
            id: sub.id,
            label: `${sub.id}. ${sub.title}`,
            isSubsection: true,
          });
        });
      });
    });

    return options;
  }, []);

  const sectionLabelMap = useMemo(() => {
    return sectionOptions.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.label;
      return acc;
    }, {});
  }, [sectionOptions]);

  const filteredPeople = useMemo(() => {
    const term = search.trim().toLowerCase();

    const mapped = authorizedPeople.map((person, index) => ({
      person,
      index,
      key: getPersonKey(person, index),
    }));

    if (!term) return mapped;

    return mapped.filter(({ person }) => {
      return (
        person.full_name.toLowerCase().includes(term) ||
        person.email.toLowerCase().includes(term) ||
        person.relationship.toLowerCase().includes(term)
      );
    });
  }, [authorizedPeople, search]);

  const totalImmediate = authorizedPeople.filter(
    p => p.immediate_access,
  ).length;

  const totalSectionSpecific = authorizedPeople.filter(
    p => p.access_level === 'Section-Specific Access',
  ).length;

  const hasPersonAction = Object.keys(personActions).length > 0;

  const addPerson = () => {
    const nextPerson = createEmptyPerson();

    setAuthorizedPeople(prev => [...prev, nextPerson]);

    setCollapsedItems(prev => ({
      ...prev,
      [nextPerson.__clientId as string]: false,
    }));
  };

  const patchPerson = (index: number, patch: Partial<AuthorizedPerson>) => {
    setAuthorizedPeople(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const updatePerson = <K extends keyof AuthorizedPerson>(
    index: number,
    key: K,
    value: AuthorizedPerson[K],
  ) => {
    patchPerson(index, { [key]: value } as Partial<AuthorizedPerson>);
  };

  const setPersonAction = (key: string, action?: PersonAction) => {
    setPersonActions(prev => {
      const next = { ...prev };

      if (action) {
        next[key] = action;
      } else {
        delete next[key];
      }

      return next;
    });
  };

  const toggleSection = (index: number, id: string) => {
    const person = authorizedPeople[index];

    const updated = person.authorized_sections.includes(id)
      ? person.authorized_sections.filter(sectionId => sectionId !== id)
      : [...person.authorized_sections, id];

    updatePerson(index, 'authorized_sections', updated);
  };

  const applyPreset = (index: number, preset: string) => {
    const presetSections = SECTION_PRESETS[preset];
    const personKey = getPersonKey(authorizedPeople[index], index);

    if (presetSections === 'all') {
      patchPerson(index, {
        access_level: 'Full Kit Access',
        authorized_sections: [],
      });

      toast.success(`Applied preset: ${preset}`);
      return;
    }

    const expandedSections: string[] = [];

    presetSections.forEach(sectionId => {
      expandedSections.push(sectionId);

      const subs = sectionOptions
        .filter(s => s.isSubsection && s.id.startsWith(sectionId))
        .map(s => s.id);

      expandedSections.push(...subs);
    });

    patchPerson(index, {
      access_level: 'Section-Specific Access',
      authorized_sections: Array.from(new Set(expandedSections)),
    });

    setExpandedSectionPicker(prev => ({ ...prev, [personKey]: true }));

    toast.success(`Applied preset: ${preset}`);
  };

  const savePerson = async (index: number) => {
    const person = authorizedPeople[index];

    if (!person.full_name || !person.email || !person.relationship) {
      toast.error('Full Name, Email, and Relationship are required');
      return;
    }

    const normalizedEmail = person.email.trim().toLowerCase();
    const duplicateInList = authorizedPeople.some((candidate, idx) => {
      if (idx === index) return false;
      return candidate.email.trim().toLowerCase() === normalizedEmail;
    });

    if (!person._id && duplicateInList) {
      toast.error(
        `A Next-of-Kin with ${person.email} is already in your access list.`
      );
      return;
    }

    const personKey = getPersonKey(person, index);
    setPersonAction(personKey, 'saving');

    try {
      if (person._id) {
        await updateNextKin({ nextkinId: person._id, body: person }).unwrap();
        toast.success(`Updated ${person.full_name}`);
      } else {
        const res =
          (await createNextKin(person).unwrap()) as CreateNextKinResponseWithId;

        patchPerson(index, {
          _id: res.id || res._id,
          __clientId: res.id || res._id || person.__clientId,
        });

        toast.success(`Added ${person.full_name}`);
      }

      refetch();
    } catch (error) {
      console.error(error);
      const detail = getApiErrorDetail(error);

      if (detail === 'Next-of-Kin already exists') {
        toast.error(
          `A Next-of-Kin with ${person.email} already exists. Use the existing entry or enter a different email.`
        );
        return;
      }

      toast.error(detail || 'Save failed');
    } finally {
      setPersonAction(personKey);
    }
  };

  const deletePerson = async (index: number) => {
    const person = authorizedPeople[index];

    if (!person._id) {
      setAuthorizedPeople(prev => prev.filter((_, idx) => idx !== index));
      return;
    }

    if (!window.confirm(`Delete ${person.full_name}?`)) return;

    const personKey = getPersonKey(person, index);
    setPersonAction(personKey, 'deleting');

    try {
      await deleteNextKin(person._id).unwrap();
      setAuthorizedPeople(prev => prev.filter((_, idx) => idx !== index));
      toast.success('Deleted');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Delete failed');
    } finally {
      setPersonAction(personKey);
    }
  };

  const approveOne = async (index: number) => {
    const person = authorizedPeople[index];
    const id = person._id;

    if (!id) {
      toast.error('Please save this person first');
      return;
    }

    const personKey = getPersonKey(person, index);
    setPersonAction(personKey, 'approving');

    try {
      await approveNextKinAccess(id).unwrap();
      patchPerson(index, {
        immediate_access: true,
        nok_letter_received: false,
      });
      toast.success('Access approved');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Approve failed');
    } finally {
      setPersonAction(personKey);
    }
  };

  const revokeOne = async (index: number) => {
    const person = authorizedPeople[index];
    const id = person._id;

    if (!id) {
      updatePerson(index, 'immediate_access', false);
      return;
    }

    const personKey = getPersonKey(person, index);
    setPersonAction(personKey, 'revoking');

    try {
      await revokeNextKinAccess(id).unwrap();
      updatePerson(index, 'immediate_access', false);
      toast.success('Access revoked');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Revoke failed');
    } finally {
      setPersonAction(personKey);
    }
  };

  const revokeAll = async () => {
    if (!authorizedPeople.length) return;

    if (!window.confirm('Revoke access for all trusted people?')) return;

    try {
      await revokeAllNextKinAccess().unwrap();

      setAuthorizedPeople(prev =>
        prev.map(person => ({ ...person, immediate_access: false })),
      );

      toast.success('All access revoked');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Revoke all failed');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-3xl bg-muted" />
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard */}
      <div className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-sm">
              <Shield className="h-7 w-7" />
            </div>

            <div>
              <div className="inline-flex items-center rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                Secure access control
              </div>

              <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
                Trusted People Access
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Add trusted people, control what they can see, and generate
                secure password cards for emergency access.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <Button
              variant="outline"
              onClick={revokeAll}
              disabled={!authorizedPeople.length || isRevokingAll || hasPersonAction}
              className="rounded-2xl border-destructive/30 text-destructive hover:text-destructive"
            >
              {isRevokingAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              {isRevokingAll ? 'Revoking...' : 'Revoke All'}
            </Button>

            <Button onClick={addPerson} className="rounded-2xl">
              <Plus className="mr-2 h-4 w-4" />
              Add Person
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Trusted People"
            value={authorizedPeople.length}
            icon={Users}
          />
          <StatCard
            label="Immediate Access"
            value={totalImmediate}
            icon={Unlock}
          />
          <StatCard
            label="Section-Specific"
            value={totalSectionSpecific}
            icon={SlidersHorizontal}
          />
        </div>
      </div>

      {/* Notice */}
      <div className="flex gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <h4 className="font-semibold">Access designation required</h4>
          <p className="mt-1 text-sm leading-6">
            Add at least one trusted person. Store the printed password card
            safely. Only share the card location, not the password directly.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-3xl border bg-background p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search name, email, relationship..."
            className="h-11 rounded-2xl pl-9 pr-10"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          Showing {filteredPeople.length} of {authorizedPeople.length}
        </div>
      </div>

      {/* People */}
      {authorizedPeople.length === 0 ? (
        <EmptyState onAdd={addPerson} />
      ) : filteredPeople.length === 0 ? (
        <div className="rounded-3xl border bg-muted/30 p-8 text-center">
          <p className="font-medium">No people found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search term.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPeople.map(({ person, index, key }) => {
            const collapsed = collapsedItems[key] ?? true;
            const showCard = showPasswordCards[key] ?? false;
            const action = personActions[key];
            const isSaving = action === 'saving';
            const isDeleting = action === 'deleting';
            const isApproving = action === 'approving';
            const isRevoking = action === 'revoking';
            const isPersonBusy = !!action || isRevokingAll;
            const hasReceivedNokLetter =
              !person.immediate_access && person.nok_letter_received;

            const showSectionPicker =
              expandedSectionPicker[key] ??
              (person.authorized_sections &&
                person.authorized_sections.length > 0);

            const authorizedSectionLabels = person.authorized_sections.map(
              sectionId => sectionLabelMap[sectionId] || sectionId,
            );

            return (
              <Card
                key={key}
                className={`overflow-hidden rounded-3xl md:border shadow-sm transition hover:shadow-md ${
                  hasReceivedNokLetter
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : ''
                }`}
              >
                <Collapsible
                  open={!collapsed}
                  onOpenChange={open =>
                    setCollapsedItems(prev => ({ ...prev, [key]: !open }))
                  } 
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer border-b bg-card p-3  transition hover:bg-muted/30 sm:p-5">
                      <CardTitle className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            {collapsed ? (
                              <ChevronRight className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-base font-semibold sm:text-lg">
                                {person.full_name || `Person ${index + 1}`}
                              </span>

                              <AccessBadge person={person} />
                              <AccessStatusBadge person={person} />
                              {hasReceivedNokLetter && (
                                <Badge
                                  variant="outline"
                                  className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  NOK letter received
                                </Badge>
                              )}
                            </div>

                            <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
                              {person.relationship && (
                                <span className="inline-flex items-center gap-1">
                                  <UserRound className="h-3.5 w-3.5" />
                                  {person.relationship}
                                </span>
                              )}

                              {person.email && (
                                <span className="inline-flex min-w-0 items-center gap-1">
                                  <Mail className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">
                                    {person.email}
                                  </span>
                                </span>
                              )}

                              {person.phone_number && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5" />
                                  {person.phone_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
                          {person._id &&
                            (person.immediate_access ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-destructive/30 text-destructive hover:text-destructive"
                                onClick={event => {
                                  event.stopPropagation();
                                  revokeOne(index);
                                }}
                                disabled={isPersonBusy || isRevokingOne}
                              >
                                {isRevoking ? (
                                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                ) : (
                                  <Lock className="mr-1.5 h-4 w-4" />
                                )}
                                {isRevoking ? 'Revoking...' : 'Revoke'}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={event => {
                                  event.stopPropagation();
                                  approveOne(index);
                                }}
                                disabled={isPersonBusy}
                              >
                                {isApproving ? (
                                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                ) : (
                                  <Unlock className="mr-1.5 h-4 w-4" />
                                )}
                                {isApproving ? 'Approving...' : 'Approve'}
                              </Button>
                            ))}

                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={event => {
                              event.stopPropagation();
                              savePerson(index);
                            }}
                            disabled={isPersonBusy}
                          >
                            {isSaving ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-1.5 h-4 w-4" />
                            )}
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-destructive/30 text-destructive hover:text-destructive"
                            onClick={event => {
                              event.stopPropagation();
                              deletePerson(index);
                            }}
                            disabled={isPersonBusy}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="ml-1.5 sm:hidden">
                              {isDeleting ? 'Deleting' : 'Delete'}
                            </span>
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="space-y-6 p-3  sm:p-5">
                      {/* Person Information */}
                      <div className="rounded-3xl md:border bg-muted/20 p-0 sm:p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <UserRound className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Person Information</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <DynamicFormField
                            field={{
                              key: 'full_name',
                              label: 'Full Name',
                              type: 'TextInput',
                            }}
                            value={person.full_name}
                            formData={person}
                            onChange={value =>
                              updatePerson(index, 'full_name', value)
                            }
                          />

                          <DynamicFormField
                            field={{
                              key: 'relationship',
                              label: 'Relationship',
                              type: 'TextInput',
                            }}
                            value={person.relationship}
                            formData={person}
                            onChange={value =>
                              updatePerson(index, 'relationship', value)
                            }
                          />

                          <DynamicFormField
                            field={{
                              key: 'email',
                              label: 'Email',
                              type: 'TextInput',
                            }}
                            value={person.email}
                            formData={person}
                            onChange={value =>
                              updatePerson(index, 'email', value)
                            }
                          />

                          <DynamicFormField
                            field={{
                              key: 'phone_number',
                              label: 'Phone',
                              type: 'TextInput',
                            }}
                            value={person.phone_number}
                            formData={person}
                            onChange={value =>
                              updatePerson(index, 'phone_number', value)
                            }
                          />
                        </div>
                      </div>

                      {/* Access Setup */}
                      <div className="rounded-3xl md:border bg-muted/20 p-0 sm:p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Shield className="h-5 w-5 text-primary" />
                              <h4 className="font-semibold">Access Setup</h4>
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                              Choose full kit access or section-specific access.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 sm:items-end">
                            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border bg-background px-4 py-3 text-sm">
                              <input
                                type="checkbox"
                                checked={person.immediate_access}
                                onChange={event => {
                                  const checked = event.target.checked;

                                  patchPerson(index, {
                                    immediate_access: checked,
                                    nok_letter_received: checked
                                      ? false
                                      : person.nok_letter_received,
                                  });
                                }}
                                className="h-4 w-4"
                              />
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Immediate Access
                              </span>
                            </label>

                            {!person.immediate_access && (
                              <label
                                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                                  person.nok_letter_received
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                    : 'bg-background'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={person.nok_letter_received}
                                  onChange={event =>
                                    updatePerson(
                                      index,
                                      'nok_letter_received',
                                      event.target.checked,
                                    )
                                  }
                                  className="h-4 w-4"
                                />
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" />
                                  Next-of-Kin Letter Received?
                                </span>
                              </label>
                            )}
                          </div>
                        </div>

                        <DynamicFormField
                          field={{
                            key: 'access_level',
                            label: 'Access Level',
                            type: 'RadioButtons',
                            options: [
                              'Full Kit Access',
                              'Section-Specific Access',
                            ],
                          }}
                          value={person.access_level}
                          formData={person}
                          onChange={value =>
                            updatePerson(index, 'access_level', value)
                          }
                        />

                        {person.access_level === 'Section-Specific Access' && (
                          <div className="mt-5 rounded-3xl border border-blue-200 bg-blue-50/70 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <label className="font-medium text-blue-950">
                                  Select Sections
                                </label>

                                <p className="mt-1 text-sm text-blue-800">
                                  {person.authorized_sections.length} selected
                                </p>
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl bg-background"
                                onClick={() =>
                                  setExpandedSectionPicker(prev => ({
                                    ...prev,
                                    [key]: !prev[key],
                                  }))
                                }
                              >
                                {showSectionPicker ? 'Hide' : 'Show'} All
                                Sections
                              </Button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {Object.keys(SECTION_PRESETS).map(preset => {
                                const presetSections = SECTION_PRESETS[preset];

                                const isActive =
                                  preset === 'Full Access'
                                    ? person.access_level === 'Full Kit Access'
                                    : Array.isArray(presetSections) &&
                                      presetSections.every(sectionId =>
                                        person.authorized_sections.includes(
                                          sectionId,
                                        ),
                                      );

                                return (
                                  <Button
                                    key={preset}
                                    size="sm"
                                    variant={isActive ? 'default' : 'outline'}
                                    className="rounded-full"
                                    onClick={() => applyPreset(index, preset)}
                                  >
                                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                    {preset}
                                  </Button>
                                );
                              })}
                            </div>

                            {showSectionPicker && (
                              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto rounded-2xl border bg-background p-3">
                                {sectionOptions.map(section => (
                                  <label
                                    key={section.id}
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-muted ${
                                      section.isSubsection ? 'ml-3' : ''
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={person.authorized_sections.includes(
                                        section.id,
                                      )}
                                      onChange={() =>
                                        toggleSection(index, section.id)
                                      }
                                      className="h-4 w-4 shrink-0"
                                    />

                                    <span
                                      className={`min-w-0 flex-1 ${
                                        section.isSubsection
                                          ? 'text-sm text-muted-foreground'
                                          : 'font-medium'
                                      }`}
                                    >
                                      {section.label}
                                    </span>

                                    {person.authorized_sections.includes(
                                      section.id,
                                    ) && (
                                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                                    )}
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Password Card Setup */}
                      <div className="rounded-3xl md:border bg-muted/20 p-0 sm:p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <KeyRound className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Password Card</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium">
                              Master Password
                            </label>

                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Input
                                value={person.master_password}
                                onChange={event =>
                                  updatePerson(
                                    index,
                                    'master_password',
                                    event.target.value,
                                  )
                                }
                                className="rounded-2xl"
                              />

                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() =>
                                  updatePerson(
                                    index,
                                    'master_password',
                                    generatePassword(),
                                  )
                                }
                              >
                                Generate
                              </Button>
                            </div>
                          </div>

                          <DynamicFormField
                            field={{
                              key: 'card_storage_location',
                              label: 'Card Location',
                              type: 'TextInput',
                            }}
                            value={person.card_storage_location}
                            formData={person}
                            onChange={value =>
                              updatePerson(
                                index,
                                'card_storage_location',
                                value,
                              )
                            }
                          />
                        </div>

                        <div className="mt-4">
                          <DynamicFormField
                            field={{
                              key: 'special_instructions',
                              label: 'Special Instructions',
                              type: 'TextArea',
                            }}
                            value={person.special_instructions}
                            formData={person}
                            onChange={value =>
                              updatePerson(index, 'special_instructions', value)
                            }
                          />
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <Button
                            variant="outline"
                            className="rounded-2xl"
                            onClick={() =>
                              setShowPasswordCards(prev => ({
                                ...prev,
                                [key]: !prev[key],
                              }))
                            }
                          >
                            {showCard ? (
                              <EyeOff className="mr-2 h-4 w-4" />
                            ) : (
                              <Eye className="mr-2 h-4 w-4" />
                            )}
                            {showCard ? 'Hide' : 'Show'} Password Card
                          </Button>

                          <Button
                            className="rounded-2xl px-8"
                            onClick={event => {
                              event.stopPropagation();
                              savePerson(index);
                            }}
                            disabled={isPersonBusy}
                          >
                            {isSaving ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            {isSaving ? 'Saving...' : 'Save Person'}
                          </Button>
                        </div>

                        {showCard && (
                          <div className="mt-5">
                            <PasswordCard
                              personName={person.full_name}
                              masterPassword={person.master_password}
                              email={person.email}
                              card_storage_location={
                                person.card_storage_location
                              }
                              phone={person.phone_number}
                              relationship={person.relationship}
                              accessLevel={person.access_level}
                              authorizedSections={authorizedSectionLabels}
                              immediateAccess={person.immediate_access}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
