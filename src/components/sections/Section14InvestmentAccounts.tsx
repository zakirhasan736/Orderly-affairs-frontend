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

const SECTION_14A = {
  subsectionId: '14A',
  title: 'Investment Accounts',
  itemLabel: 'Investment Account',
  fields: [
    {
      key: 'account_type',
      label: 'Account Type',
      type: 'Dropdown',
      options: [
        '401(k)',
        '403(b)',
        'IRA - Traditional',
        'IRA - Roth',
        'SEP-IRA',
        'Pension',
        'Brokerage Account',
        'Mutual Fund',
        'Bonds',
        'Stocks',
        'Annuity',
        'Other',
      ],
      helperText: 'Type of investment or retirement account',
    },
    {
      key: 'account_type_other',
      label: 'Please specify other account type',
      type: 'TextInput',
      helperText:
        'Please describe the specific type of investment or retirement account',
      conditionalDisplay: { field: 'account_type', value: 'Other' },
    },
    {
      key: 'financial_institution',
      label: 'Financial Institution',
      type: 'TextInput',
      helperText: 'Company managing this account (e.g., Fidelity, Vanguard)',
    },
    {
      key: 'account_number',
      label: 'Account Number',
      type: 'TextInputWithUpload',
      helperText:
        'Account number or upload a statement showing account details',
    },
    {
      key: 'account_value',
      label: 'Approximate Account Value',
      type: 'TextInput',
      helperText: 'Current approximate value of the account',
    },
    {
      key: 'beneficiaries',
      label: 'Beneficiaries',
      type: 'TextArea',
      helperText: 'Named beneficiaries and their percentages',
    },
    {
      key: 'advisor_contact',
      label: 'Financial Advisor Contact',
      type: 'TextInputWithUpload',
      helperText:
        'Contact information for financial advisor or account manager',
    },
    {
      key: 'employer_connection',
      label: 'Employer Connection',
      type: 'TextArea',
      helperText: 'If employer-sponsored, include company name and HR contact',
    },
    {
      key: 'login_credentials',
      label: 'Online Account Access',
      type: 'TextArea',
      helperText: 'Username and password for online account access',
    },
    {
      key: 'distribution_instructions',
      label: 'Distribution Instructions',
      type: 'TextArea',
      helperText:
        'Your wishes for distributions or Required Minimum Distributions (RMDs)',
    },
    {
      key: 'account_documents',
      label: 'Account Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload recent statements, beneficiary forms, or plan documents',
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

export default function Section14InvestmentAccounts({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  /* ---------- SAFE ARRAY NORMALIZER ---------- */
  const accounts: any[] = Array.isArray(data['14A']) ? data['14A'] : [];

  const updateAccounts = (next: any[]) => {
    onChange({
      ...data,
      '14A': next,
    });
  };

  const addAccount = () => {
    const emptyAccount = Object.fromEntries(
      SECTION_14A.fields.map(f => [f.key, '']),
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

  const show14A = !activeSubsection || activeSubsection === '14A';

  /* ------------------------------------------------------------------ */
  /* RENDER                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-8">
      <div
        id="subsection-14A"
        className={`rounded-3xl ${show14A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>14A. {SECTION_14A.title}</CardTitle>
              <Button size="sm" onClick={addAccount}>
                <Plus className="h-4 w-4 mr-1" />
                Add {SECTION_14A.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {accounts.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No investment accounts added yet.
              </div>
            )}

            {accounts.map((account, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <strong>
                    {SECTION_14A.itemLabel} #{index + 1}
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
                  {SECTION_14A.fields.map(field => (
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
