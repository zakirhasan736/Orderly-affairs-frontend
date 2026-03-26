'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Badge } from '@common/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@common/ui/collapsible';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Users,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  Lock,
  Unlock,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useCreateNextKinMutation,
  useGetMyNextKinQuery,
  useUpdateNextKinMutation,
  useDeleteNextKinMutation,
  useApproveNextKinAccessMutation,
  useRevokeNextKinAccessMutation,
  useRevokeAllNextKinAccessMutation,
} from '@/services/authApi';

import { DynamicFormField } from './DynamicFormField';
import { PasswordCard } from './PasswordCard';
import { formConfig } from '../config/formConfig';

interface AuthorizedPerson {
  _id?: string;
  full_name: string;
  relationship: string;
  email: string;
  phone_number?: string;
  access_level: 'Full Kit Access' | 'Section-Specific Access';
  authorized_sections: string[];
  immediate_access: boolean;
  master_password: string;
  password_card_generated: boolean;
  card_storage_location?: string;
  special_instructions?: string;
}

const SECTION_PRESETS: Record<string, string[] | 'all'> = {
  'Full Access': 'all',
  'Financial & Tax': ['7', '12', '14', '16', '19', '20'],
  'Healthcare & Medical': ['15'],
  'Legal & Estate': ['20', '21'],
  'Personal & Family': ['1', '2', '17'],
  'Business & Employment': ['18'],
  'Insurance & Benefits': ['7', '11'],
};

export function AccessManagement() {
  const { data, isLoading, refetch } = useGetMyNextKinQuery(undefined);


  const [authorizedPeople, setAuthorizedPeople] = useState<AuthorizedPerson[]>(
    [],
  );
  const [collapsedItems, setCollapsedItems] = useState<Record<number, boolean>>(
    {},
  );
  const [showPasswordCards, setShowPasswordCards] = useState<
    Record<number, boolean>
  >({});
  const [expandedSectionPicker, setExpandedSectionPicker] = useState<
    Record<number, boolean>
  >({});

  const [createNextKin] = useCreateNextKinMutation();
  const [updateNextKin] = useUpdateNextKinMutation();
  const [deleteNextKin] = useDeleteNextKinMutation();
  const [approveNextKinAccess] = useApproveNextKinAccessMutation();
  const [revokeNextKinAccess, { isLoading: isRevokingOne }] =
    useRevokeNextKinAccessMutation();
  const [revokeAllNextKinAccess] = useRevokeAllNextKinAccessMutation();

  useEffect(() => {
    if (!data) return;
    setAuthorizedPeople(prev => {
      const unsaved = prev.filter(p => !p._id);
      const fromApi: AuthorizedPerson[] = data.map((nk: any) => ({
        _id: nk.id,
        full_name: nk.full_name || '',
        relationship: nk.relationship || '',
        email: nk.email,   
        phone_number: nk.phone_number || '',
        access_level: nk.access_level || 'Full Kit Access',
        authorized_sections: nk.authorized_sections || [],
        immediate_access: !!nk.immediate_access, 
      // KEEP backend values
        master_password: nk.master_password || '************', // never returned by backend (correct)
        password_card_generated: !!nk.password_card_generated,
        card_storage_location: nk.card_storage_location || '',
        special_instructions: nk.special_instructions || '',
      }));
      console.log('Fetched next of kin from API:', fromApi);
      return [...fromApi, ...unsaved];
    });
  }, [data]); 

  const generatePassword = () =>
    Array.from({ length: 12 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(
        Math.floor(Math.random() * 36),
      ),
    ).join('');

  const updatePerson = (i: number, key: keyof AuthorizedPerson, val: any) => {
    setAuthorizedPeople(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [key]: val };
      return copy;
    });
  };

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
        section.subsections?.forEach((sub: any) =>
          options.push({
            id: sub.id,
            label: `${sub.id}. ${sub.title}`,
            isSubsection: true,
          }),
        );
      });
    });
    return options;
  }, []);

  const toggleSection = (i: number, id: string) => {
    const p = authorizedPeople[i];
    const updated = p.authorized_sections.includes(id)
      ? p.authorized_sections.filter(s => s !== id)
      : [...p.authorized_sections, id];
    updatePerson(i, 'authorized_sections', updated);
  };

  const applyPreset = (i: number, preset: string) => {
    if (preset === 'Full Access') {
      updatePerson(i, 'access_level', 'Full Kit Access');
      updatePerson(i, 'authorized_sections', []);
    } else {
      updatePerson(i, 'access_level', 'Section-Specific Access');
    const presetSections = SECTION_PRESETS[preset];

    if (presetSections === 'all') {
      updatePerson(i, 'access_level', 'Full Kit Access');
      updatePerson(i, 'authorized_sections', []);
      return;
    }

    const expandedSections: string[] = [];

    presetSections.forEach(sectionId => {
      expandedSections.push(sectionId);

      const section = sectionOptions.find(
        s => s.id === sectionId && !s.isSubsection,
      );

      if (section) {
        const subs = sectionOptions
          .filter(s => s.isSubsection && s.id.startsWith(sectionId))
          .map(s => s.id);

        expandedSections.push(...subs);
      }
    });

    updatePerson(i, 'access_level', 'Section-Specific Access');
    updatePerson(i, 'authorized_sections', expandedSections);
    }
    toast.success(`Applied preset: ${preset}`);
  };

  const getAccessSummary = (p: AuthorizedPerson) =>
    p.access_level === 'Full Kit Access'
      ? {
          text: 'Full Kit Access',
          color: 'bg-green-500',
          icon: <Unlock className="h-3 w-3" />,
        }
      : {
          text: `${p.authorized_sections.length} Sections`,
          color: 'bg-blue-500',
          icon: <Lock className="h-3 w-3" />,
        };

  const savePerson = async (i: number) => {
    const p = authorizedPeople[i];
    if (!p.full_name || !p.email || !p.relationship) {
      toast.error('Full Name, Email, Relationship required');
      return;
    }
    try {
      if (p._id) {
        await updateNextKin({ nextkinId: p._id, body: p }).unwrap();
        toast.success(`Updated ${p.full_name}`);
      } else {
        const res: any = await createNextKin(p).unwrap();
        updatePerson(i, '_id', res.id);
        toast.success(`Added ${p.full_name}`);
      }
      refetch();
    } catch {
      toast.error('Save failed');
    }
  };

  const deletePerson = async (i: number) => {
    const p = authorizedPeople[i];
    if (!p._id) {
      setAuthorizedPeople(prev => prev.filter((_, idx) => idx !== i));
      return;
    }
    if (!confirm(`Delete ${p.full_name}?`)) return;
    await deleteNextKin(p._id).unwrap();
    setAuthorizedPeople(prev => prev.filter((_, idx) => idx !== i));
    toast.success('Deleted');
  };

  const approveOne = async (i: number) => {
    await approveNextKinAccess(authorizedPeople[i]._id!).unwrap();
    updatePerson(i, 'immediate_access', true);
    refetch();
  };

  const revokeOne = async (i: number) => {
    await revokeNextKinAccess(authorizedPeople[i]._id!).unwrap();
    updatePerson(i, 'immediate_access', false);
    refetch();
  };

  const revokeAll = async () => {
    await revokeAllNextKinAccess().unwrap();
    setAuthorizedPeople(p => p.map(x => ({ ...x, immediate_access: false })));
    refetch();
  };

  if (isLoading) return <div className="p-6">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <h4 className="font-medium text-amber-900">
            Access Designation Required
          </h4>
          <p className="text-sm text-amber-800">
            Designate at least one person who can access your kit.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-medium">Authorized People</h3>
          <Badge>{authorizedPeople.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={revokeAll}>
            Revoke All
          </Button>
          <Button
            onClick={() =>
              setAuthorizedPeople(p => [
                ...p,
                {
                  full_name: '',
                  relationship: '',
                  email: '',
                  phone_number: '',
                  access_level: 'Full Kit Access',
                  authorized_sections: [],
                  immediate_access: false,
                  master_password: generatePassword(),
                  password_card_generated: false,
                },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Add Person
          </Button>
        </div>
      </div>

      {authorizedPeople.map((p, i) => {
        const collapsed = collapsedItems[i] ?? true;
        const showCard = showPasswordCards[i] ?? false;
        // const showSectionPicker = expandedSectionPicker[i] ?? false;
        const showSectionPicker =
          expandedSectionPicker[i] ??
          (p.authorized_sections && p.authorized_sections.length > 0);
        const summary = getAccessSummary(p);

        return (
          <Card key={p._id || i}>
            <Collapsible
              open={!collapsed}
              onOpenChange={() =>
                setCollapsedItems(prev => ({ ...prev, [i]: !prev[i] }))
              }
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{p.full_name || `Person ${i + 1}`}</span>
                          <Badge
                            className={`${summary.color} text-white text-xs flex items-center gap-1`}
                          >
                            {summary.icon}
                            {summary.text}
                          </Badge>
                          {/* {p.immediate_access && ( */}
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3" />{' '}
                            {p.immediate_access
                              ? 'Immediate Access'
                              : ' Upon Death'}
                          </Badge>
                          {/* // )} */}
                        </div>
                        {p.relationship && (
                          <p className="text-sm text-muted-foreground">
                            {p.relationship}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p._id &&
                        (p.immediate_access ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive cursor-pointer"
                            onClick={e => {
                              e.stopPropagation();
                              revokeOne(i);
                            }}
                            disabled={isRevokingOne}
                          >
                            <Lock className="h-4 w-4 mr-1" /> Revoke
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                            onClick={e => {
                              e.stopPropagation();
                              approveOne(i);
                            }}
                          >
                            <Unlock className="h-4 w-4 mr-1" /> Approve
                          </Button>
                        ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer"
                        onClick={e => {
                          e.stopPropagation();
                          savePerson(i);
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive cursor-pointer"
                        onClick={e => {
                          e.stopPropagation();
                          deletePerson(i);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DynamicFormField
                      field={{
                        key: 'full_name',
                        label: 'Full Name',
                        type: 'TextInput',
                      }}
                      value={p.full_name}
                      onChange={v => updatePerson(i, 'full_name', v)}
                    />
                    <DynamicFormField
                      field={{
                        key: 'relationship',
                        label: 'Relationship',
                        type: 'TextInput',
                      }}
                      value={p.relationship}
                      onChange={v => updatePerson(i, 'relationship', v)}
                    />
                    <DynamicFormField
                      field={{
                        key: 'email',
                        label: 'Email',
                        type: 'TextInput',
                      }}
                      value={p.email}
                      onChange={v => updatePerson(i, 'email', v)}
                    />
                    <DynamicFormField
                      field={{
                        key: 'phone_number',
                        label: 'Phone',
                        type: 'TextInput',
                      }}
                      value={p.phone_number}
                      onChange={v => updatePerson(i, 'phone_number', v)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={p.immediate_access}
                      onChange={e =>
                        updatePerson(i, 'immediate_access', e.target.checked)
                      }
                    />
                    <label className="text-sm flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Immediate Access
                    </label>
                  </div>

                  <DynamicFormField
                    field={{
                      key: 'access_level',
                      label: 'Access Level',
                      type: 'RadioButtons',
                      options: ['Full Kit Access', 'Section-Specific Access'],
                    }}
                    value={p.access_level}
                    onChange={v => updatePerson(i, 'access_level', v)}
                  />

                  {p.access_level === 'Section-Specific Access' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <label className="text-sm font-medium mb-2 block">
                        Select Sections ({p.authorized_sections.length})
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {Object.keys(SECTION_PRESETS).map(preset => {
                          const presetSections = SECTION_PRESETS[preset];

                          const isActive =
                            preset === 'Full Access'
                              ? p.access_level === 'Full Kit Access'
                              : Array.isArray(presetSections) &&
                                presetSections.every(s =>
                                  p.authorized_sections.includes(s),
                                );

                          return (
                            <Button
                              key={preset}
                              size="sm"
                              variant={isActive ? 'default' : 'outline'}
                              className={
                                isActive ? 'bg-blue-600 text-white' : ''
                              }
                              onClick={() => applyPreset(i, preset)}
                            >
                              {preset}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedSectionPicker(prev => ({
                            ...prev,
                            [i]: !prev[i],
                          }))
                        }
                      >
                        {showSectionPicker ? 'Hide' : 'Show'} All Sections
                      </Button>
                      {showSectionPicker && (
                        <div className="max-h-64 overflow-y-auto mt-3 space-y-2 border rounded p-2 bg-white">
                          {sectionOptions.map(section => (
                            <label
                              key={section.id}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="checkbox"
                                checked={p.authorized_sections.includes(
                                  section.id,
                                )}
                                onChange={() => toggleSection(i, section.id)}
                              />
                              <span
                                className={
                                  section.isSubsection
                                    ? 'text-sm ml-4'
                                    : 'font-medium'
                                }
                              >
                                {section.label}
                              </span>
                              {p.authorized_sections.includes(section.id) && (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Master Password
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={p.master_password}
                          onChange={e =>
                            updatePerson(i, 'master_password', e.target.value)
                          }
                        />
                        <Button
                          size="sm"
                          className="cursor-pointer"
                          onClick={() =>
                            updatePerson(
                              i,
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
                      value={p.card_storage_location}
                      onChange={v =>
                        updatePerson(i, 'card_storage_location', v)
                      }
                    />
                  </div>

                  <DynamicFormField
                    field={{
                      key: 'special_instructions',
                      label: 'Special Instructions',
                      type: 'TextArea',
                    }}
                    value={p.special_instructions}
                    onChange={v => updatePerson(i, 'special_instructions', v)}
                  />

                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setShowPasswordCards(prev => ({
                          ...prev,
                          [i]: !prev[i],
                        }))
                      }
                    >
                      {showCard ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}{' '}
                      {showCard ? 'Hide' : 'Show'} Password Card
                    </Button>

                    <Button
                      // variant="ghost"
                      size="sm"
                      className="px-6 cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        savePerson(i);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                  {showCard && (
                    <PasswordCard
                      personName={p.full_name}
                      masterPassword={p.master_password}
                      email={p.email}
                      card_storage_location={p.card_storage_location}
                      phone={p.phone_number}
                      relationship={p.relationship}
                      accessLevel={p.access_level}
                      authorizedSections={p.authorized_sections}
                      immediateAccess={p.immediate_access}
                    />
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}
