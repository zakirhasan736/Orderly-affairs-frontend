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

const SECTION_12A = {
  subsectionId: '12A',
  title: 'Bank Accounts',
  itemLabel: 'Bank Account',
  fields: [
    {
      key: 'bank_name',
      label: 'Bank Name',
      type: 'TextInput',
      helperText: 'Name of the financial institution',
      required: true,
    },
    {
      key: 'account_type',
      label: 'Account Type',
      type: 'Dropdown',
      options: [
        'Checking',
        'Savings',
        'Money Market',
        'Certificate of Deposit (CD)',
        'Business Checking',
        'Business Savings',
        'Other',
      ],
      helperText: 'Type of bank account',
    },
    {
      key: 'account_type_other',
      label: 'Please specify other account type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of bank account',
      conditionalDisplay: { field: 'account_type', value: 'Other' },
    },
    {
      key: 'account_number',
      label: 'Account Number',
      type: 'TextInputWithUpload',
      helperText:
        'Account number or upload a photo of bank statement showing account details',
    },
    {
      key: 'routing_number',
      label: 'Routing Number',
      type: 'TextInput',
      helperText: 'Bank routing number for transfers',
    },
    {
      key: 'account_purpose',
      label: 'Account Purpose',
      type: 'TextArea',
      helperText:
        'What this account is used for (household expenses, emergency fund, business, etc.)',
    },
    {
      key: 'joint_account_holders',
      label: 'Joint Account Holders',
      type: 'TextArea',
      helperText: 'Names of other people on this account',
    },
    {
      key: 'beneficiaries',
      label: 'Beneficiaries',
      type: 'TextArea',
      helperText: 'Named beneficiaries for this account',
    },
    {
      key: 'bank_contact',
      label: 'Bank Contact Information',
      type: 'TextInputWithUpload',
      helperText: 'Branch location, phone number, or upload business cards',
    },
    {
      key: 'online_banking',
      label: 'Online Banking Username',
      type: 'TextInput',
      helperText: 'Username for online banking access',
    },
    {
      key: 'online_banking_password',
      label: 'Online Banking Password',
      type: 'TextInput',
      helperText: 'Password for online banking',
    },
    {
      key: 'automatic_payments',
      label: 'Automatic Payments',
      type: 'TextArea',
      helperText:
        'List of bills or transfers automatically paid from this account',
    },
    {
      key: 'debit_cards',
      label: 'Debit/ATM Cards',
      type: 'TextInputWithUpload',
      helperText: 'Information about cards linked to this account',
    },
    {
      key: 'safe_deposit_box',
      label: 'Safe Deposit Box',
      type: 'TextArea',
      helperText:
        'If you have a safe deposit box at this bank, include box number and key location',
    },
    {
      key: 'account_documents',
      label: 'Account Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload recent statements, signature cards, or account opening documents',
    },
  ],
};

const SECTION_12B = {
  subsectionId: '12B',
  title: 'Digital Payment Services',
  itemLabel: 'Digital Payment Account',
  fields: [
    {
      key: 'service_name',
      label: 'Service Name',
      type: 'Dropdown',
      options: [
        'PayPal',
        'Venmo',
        'Cash App',
        'Zelle',
        'Apple Pay',
        'Google Pay',
        'Samsung Pay',
        'Stripe',
        'Square',
        'Other',
      ],
      helperText: 'Name of the digital payment service',
    },
    {
      key: 'service_name_other',
      label: 'Please specify other service name',
      type: 'TextInput',
      helperText: 'Please describe the specific digital payment service',
      conditionalDisplay: { field: 'service_name', value: 'Other' },
    },
    {
      key: 'account_email_phone',
      label: 'Account Email/Phone',
      type: 'TextInput',
      helperText: 'Email address or phone number associated with the account',
    },
    {
      key: 'username',
      label: 'Username',
      type: 'TextInput',
      helperText: 'Username or handle for the service',
    },
    {
      key: 'password',
      label: 'Password',
      type: 'TextInput',
      helperText: 'Password for the account',
    },
    {
      key: 'linked_accounts',
      label: 'Linked Bank Accounts/Cards',
      type: 'TextArea',
      helperText: 'Bank accounts or credit cards linked to this service',
    },
    {
      key: 'account_balance',
      label: 'Typical Account Balance',
      type: 'TextInput',
      helperText: 'Approximate balance usually maintained',
    },
    {
      key: 'business_personal',
      label: 'Account Type',
      type: 'RadioButtons',
      options: ['Personal', 'Business'],
      helperText: 'Is this a personal or business account?',
    },
    {
      key: 'regular_transactions',
      label: 'Regular Transactions',
      type: 'TextArea',
      helperText: 'Regular payments or transfers made through this service',
    },
    {
      key: 'security_info',
      label: 'Security Information',
      type: 'TextArea',
      helperText:
        'Two-factor authentication setup, security questions, or backup codes',
    },
    {
      key: 'service_documents',
      label: 'Service Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload account statements, transaction records, or screenshots',
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

export default function Section12BankingFinancialAccounts({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  /* ---------- NORMALIZERS ---------- */
  const bankAccounts: any[] = Array.isArray(data['12A']) ? data['12A'] : [];
  const digitalAccounts: any[] = Array.isArray(data['12B']) ? data['12B'] : [];

  const updateSubsection = (key: '12A' | '12B', next: any[]) => {
    onChange({ ...data, [key]: next });
  };

  const makeEmptyItem = (fields: any[]) => ({
    __rowId: crypto.randomUUID(),
    ...Object.fromEntries(fields.map(f => [f.key, ''])),
  });


  const show = (id: string) => !activeSubsection || activeSubsection === id;

  /* ------------------------------------------------------------------ */
  /* RENDER                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-12">
      {/* ===================== 12A — BANK ACCOUNTS ===================== */}
      <div
        id="subsection-12A"
        className={show('12A') ? 'border border-primary rounded-3xl' : ''}
      >
        <Card>
          <CardHeader className="flex-row justify-between items-center">
            <CardTitle>12A. {SECTION_12A.title}</CardTitle>
            <Button
              size="sm"
              onClick={() =>
                updateSubsection('12A', [
                  ...bankAccounts,
                  makeEmptyItem(SECTION_12A.fields),
                ])
              }
            >
              <Plus className="h-4 w-4 mr-1" /> Add {SECTION_12A.itemLabel}
            </Button>
          </CardHeader>

          <CardContent className="space-y-8">
            {bankAccounts.map((item, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between mb-4">
                  <strong>
                    {SECTION_12A.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      updateSubsection(
                        '12A',
                        bankAccounts.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Minus className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_12A.fields.map(field => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      formData={item}
                      onChange={v => {
                        const next = [...bankAccounts];
                        next[index] = { ...next[index], [field.key]: v };
                        updateSubsection('12A', next);
                      }}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ===================== 12B — DIGITAL PAYMENTS ===================== */}
      <div
        id="subsection-12B"
        className={show('12B') ? 'border border-primary rounded-3xl' : ''}
      >
        <Card>
          <CardHeader className="flex-row justify-between items-center">
            <CardTitle>12B. {SECTION_12B.title}</CardTitle>
            <Button
              size="sm"
              onClick={() =>
                updateSubsection('12B', [
                  ...digitalAccounts,
                  makeEmptyItem(SECTION_12B.fields),
                ])
              }
            >
              <Plus className="h-4 w-4 mr-1" /> Add {SECTION_12B.itemLabel}
            </Button>
          </CardHeader>

          <CardContent className="space-y-8">
            {digitalAccounts.map((item, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between mb-4">
                  <strong>
                    {SECTION_12B.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      updateSubsection(
                        '12B',
                        digitalAccounts.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Minus className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_12B.fields.map(field => (
                    <DynamicFormField
                      key={`${field.key}-${item.__rowId}`}
                      field={field}
                      value={item[field.key]}
                      formData={item}
                      rowId={item.__rowId}
                      onChange={v => {
                        const next = [...digitalAccounts];
                        next[index] = { ...next[index], [field.key]: v };
                        updateSubsection('12B', next);
                      }}
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
