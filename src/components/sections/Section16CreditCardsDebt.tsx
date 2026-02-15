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
/* CONFIG — 16A CREDIT CARDS                                           */
/* ------------------------------------------------------------------ */

const SECTION_16A = {
  subsectionId: '16A',
  title: 'Credit Cards',
  itemLabel: 'Credit Card',
  fields: [
    {
      key: 'card_name',
      label: 'Card Name/Bank',
      type: 'TextInput',
      helperText: 'Name of the credit card or issuing bank',
    },
    {
      key: 'card_type',
      label: 'Card Type',
      type: 'Dropdown',
      options: [
        'Visa',
        'MasterCard',
        'American Express',
        'Discover',
        'Store Card',
        'Business Card',
        'Other',
      ],
      helperText: 'Type of credit card',
    },
    {
      key: 'card_type_other',
      label: 'Please specify other card type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of credit card',
      conditionalDisplay: { field: 'card_type', value: 'Other' },
    },
    {
      key: 'card_number',
      label: 'Card Number (last 4 digits)',
      type: 'TextInput',
      helperText: 'Last 4 digits of the card number for identification',
    },
    {
      key: 'account_number',
      label: 'Full Account Number',
      type: 'TextInputWithUpload',
      helperText:
        'Full account number or upload photo of card/statement (store securely)',
    },
    {
      key: 'credit_limit',
      label: 'Credit Limit',
      type: 'TextInput',
      helperText: 'Maximum credit limit on this card',
    },
    {
      key: 'current_balance',
      label: 'Approximate Current Balance',
      type: 'TextInput',
      helperText: 'Current balance owed on this card',
    },
    {
      key: 'monthly_payment',
      label: 'Monthly Payment',
      type: 'TextInput',
      helperText: 'Typical monthly payment amount',
    },
    {
      key: 'autopay_setup',
      label: 'Autopay Information',
      type: 'TextArea',
      helperText:
        'If autopay is set up, which bank account and for what amount',
    },
    {
      key: 'card_benefits',
      label: 'Card Benefits',
      type: 'TextArea',
      helperText:
        'Rewards programs, cash back, travel benefits, or other card perks',
    },
    {
      key: 'customer_service',
      label: 'Customer Service Contact',
      type: 'TextInputWithUpload',
      helperText:
        'Phone number for customer service or upload contact information',
    },
    {
      key: 'online_account',
      label: 'Online Account Access',
      type: 'TextArea',
      helperText: 'Username and password for online account management',
    },
    {
      key: 'authorized_users',
      label: 'Authorized Users',
      type: 'TextArea',
      helperText: 'Names of any authorized users on this account',
    },
    {
      key: 'card_documents',
      label: 'Card Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload recent statements, terms and conditions, or card agreements',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* CONFIG — 16B OTHER DEBTS                                            */
/* ------------------------------------------------------------------ */

const SECTION_16B = {
  subsectionId: '16B',
  title: 'Other Debts',
  itemLabel: 'Debt',
  fields: [
    {
      key: 'debt_type',
      label: 'Type of Debt',
      type: 'Dropdown',
      options: [
        'Personal Loan',
        'Student Loan',
        'Auto Loan',
        'Home Equity Loan',
        'Line of Credit',
        'Medical Debt',
        'Tax Debt',
        'Business Loan',
        'Other',
      ],
      helperText: 'Category of this debt',
    },
    {
      key: 'debt_type_other',
      label: 'Please specify other debt type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of debt',
      conditionalDisplay: { field: 'debt_type', value: 'Other' },
    },
    {
      key: 'creditor_name',
      label: 'Creditor/Lender Name',
      type: 'TextInput',
      helperText: 'Name of the company or institution you owe money to',
    },
    {
      key: 'account_number',
      label: 'Account Number',
      type: 'TextInputWithUpload',
      helperText: 'Account or loan number for this debt',
    },
    {
      key: 'current_balance',
      label: 'Current Balance Owed',
      type: 'TextInput',
      helperText: 'Amount currently owed on this debt',
    },
    {
      key: 'monthly_payment',
      label: 'Monthly Payment Amount',
      type: 'TextInput',
      helperText: 'Required monthly payment amount',
    },
    {
      key: 'payment_due_date',
      label: 'Payment Due Date',
      type: 'TextInput',
      helperText: 'Day of the month payment is due',
    },
    {
      key: 'interest_rate',
      label: 'Interest Rate',
      type: 'TextInput',
      helperText: 'Interest rate on this debt',
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      type: 'TextArea',
      helperText: 'How payments are made (autopay, check, online, etc.)',
    },
    {
      key: 'cosigners',
      label: 'Co-signers or Joint Borrowers',
      type: 'TextArea',
      helperText: 'Names of any co-signers or joint borrowers on this debt',
    },
    {
      key: 'collateral',
      label: 'Collateral',
      type: 'TextArea',
      helperText: 'Any property securing this debt (car, house, etc.)',
    },
    {
      key: 'creditor_contact',
      label: 'Creditor Contact Information',
      type: 'TextInputWithUpload',
      helperText:
        'Phone, address, or upload contact information for the lender',
    },
    {
      key: 'debt_documents',
      label: 'Debt Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload loan agreements, recent statements, or payment records',
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

export default function Section16CreditCardsDebt({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  /* ---------- 16A DATA ---------- */
  const creditCards: any[] = Array.isArray(data['16A']) ? data['16A'] : [];

  const update16A = (next: any[]) => {
    onChange({ ...data, '16A': next });
  };

  const addCreditCard = () => {
    const empty = Object.fromEntries(SECTION_16A.fields.map(f => [f.key, '']));
    update16A([...creditCards, empty]);
  };

  const updateCreditCard = (i: number, key: string, value: any) => {
    const next = [...creditCards];
    next[i] = { ...next[i], [key]: value };
    update16A(next);
  };

  const removeCreditCard = (i: number) => {
    update16A(creditCards.filter((_, idx) => idx !== i));
  };

  /* ---------- 16B DATA ---------- */
  const debts: any[] = Array.isArray(data['16B']) ? data['16B'] : [];

  const update16B = (next: any[]) => {
    onChange({ ...data, '16B': next });
  };

  const addDebt = () => {
    const empty = Object.fromEntries(SECTION_16B.fields.map(f => [f.key, '']));
    update16B([...debts, empty]);
  };

  const updateDebt = (i: number, key: string, value: any) => {
    const next = [...debts];
    next[i] = { ...next[i], [key]: value };
    update16B(next);
  };

  const removeDebt = (i: number) => {
    update16B(debts.filter((_, idx) => idx !== i));
  };

  const show16A = !activeSubsection || activeSubsection === '16A';
  const show16B = !activeSubsection || activeSubsection === '16B';

  return (
    <div className="space-y-10">
      {/* ====================== 16A ====================== */}
      <div
        id="subsection-16A"
        className={`rounded-3xl ${show16A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>16A. {SECTION_16A.title}</CardTitle>
              <Button size="sm" onClick={addCreditCard}>
                <Plus className="h-4 w-4 mr-1" />
                Add {SECTION_16A.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {creditCards.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No credit cards added yet.
              </div>
            )}

            {creditCards.map((card, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <strong>
                    {SECTION_16A.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeCreditCard(index)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_16A.fields.map(field => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={card[field.key]}
                      formData={card}
                      onChange={value =>
                        updateCreditCard(index, field.key, value)
                      }
                    />
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ====================== 16B ====================== */}
      <div
        id="subsection-16B"
        className={`rounded-3xl ${show16B ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>16B. {SECTION_16B.title}</CardTitle>
              <Button size="sm" onClick={addDebt}>
                <Plus className="h-4 w-4 mr-1" />
                Add {SECTION_16B.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {debts.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No debts added yet.
              </div>
            )}

            {debts.map((debt, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <strong>
                    {SECTION_16B.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeDebt(index)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_16B.fields.map(field => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={debt[field.key]}
                      formData={debt}
                      onChange={value => updateDebt(index, field.key, value)}
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
