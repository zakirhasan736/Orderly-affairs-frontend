'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
import { Plus, Minus } from 'lucide-react';
import { DynamicFormField } from '@/components/DynamicFormField';

/* ------------------------------------------------------------------ */
/* CONFIG — HARD WIRED (from your JSON)                                */
/* ------------------------------------------------------------------ */

const SECTION_13A = {
  subsectionId: '13A',
  title: 'Online Accounts',
  itemLabel: 'Online Account',
  fields: [
    {
      key: 'account_type',
      label: 'Account Type',
      type: 'Dropdown',
      options: [
        'Social Media',
        'Email',
        'Banking',
        'Investment',
        'Shopping',
        'Streaming',
        'Cloud Storage',
        'Work/Professional',
        'Government',
        'Utilities',
        'Other',
      ],
      helperText: 'Category of online account',
    },
    {
      key: 'account_type_other',
      label: 'Please specify other account type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of online account',
      conditionalDisplay: { field: 'account_type', value: 'Other' },
    },
    {
      key: 'service_name',
      label: 'Service/Website Name',
      type: 'TextInput',
      helperText:
        'Name of the website or service (e.g., Facebook, Amazon, Netflix)',
    },
    {
      key: 'account_username',
      label: 'Username',
      type: 'TextInput',
      helperText: 'Username or login ID for this account',
    },
    {
      key: 'account_password',
      label: 'Password',
      type: 'TextInput',
      inputType: 'password',
      helperText: 'Password for this account',
    },
    {
      key: 'email_associated',
      label: 'Associated Email',
      type: 'TextInput',
      helperText: 'Email address used for this account',
    },
    {
      key: 'phone_associated',
      label: 'Associated Phone',
      type: 'TextInput',
      helperText: 'Phone number linked to this account',
    },
    {
      key: 'recovery_info',
      label: 'Recovery Information',
      type: 'TextArea',
      helperText:
        'Security questions, backup emails, or recovery phone numbers',
    },
    {
      key: 'two_factor_auth',
      label: 'Two-Factor Authentication',
      type: 'TextArea',
      helperText:
        'Details about 2FA setup, authenticator apps, or backup codes',
    },
    {
      key: 'account_value',
      label: 'Account Value/Importance',
      type: 'TextArea',
      helperText:
        'Financial value, personal importance, or business significance',
    },
    {
      key: 'closure_instructions',
      label: 'Account Closure Instructions',
      type: 'TextArea',
      helperText:
        'Instructions for closing, memorializing, or transferring this account',
    },
    {
      key: 'account_documents',
      label: 'Account Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload account statements, screenshots, or important account information',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* PROPS                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section13PasswordsOnlineAccounts({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  /* ---------- SAFE ARRAY NORMALIZER ---------- */
  const accounts: any[] = Array.isArray(data['13A']) ? data['13A'] : [];

  const updateAccounts = (next: any[]) => {
    onChange({
      ...data,
      '13A': next,
    });
  };

  const addAccount = () => {
    const emptyAccount = Object.fromEntries(
      SECTION_13A.fields.map(f => [f.key, '']),
    );
    updateAccounts([...accounts, emptyAccount]);
  };

  const updateAccount = (index: number, key: string, value: any) => {
    const next = [...accounts];
    next[index] = { ...next[index], [key]: value };
    updateAccounts(next);
  };

  const removeAccount = (index: number) => {
    updateAccounts(accounts.filter((_, i) => i !== index));
  };

  const show13A = !activeSubsection || activeSubsection === '13A';

  /* ------------------------------------------------------------------ */
  /* RENDER                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-8">
      <div
        id="subsection-13A"
        className={`rounded-3xl ${show13A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>13A. {SECTION_13A.title}</CardTitle>
              <Button size="sm" onClick={addAccount}>
                <Plus className="h-4 w-4 mr-1" />
                Add {SECTION_13A.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {accounts.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No online accounts added yet.
              </div>
            )}

            {accounts.map((account, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <strong>
                    {SECTION_13A.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeAccount(index)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_13A.fields.map(field => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={account[field.key]}
                      formData={account}
                      onChange={value => updateAccount(index, field.key, value)}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
