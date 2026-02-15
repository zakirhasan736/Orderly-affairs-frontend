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

/* ============================================================
   STATIC SUBSECTIONS (20A, 20B)
============================================================ */

const SECTION_20A_FIELDS = [
  {
    key: 'legal_documents_instructions',
    label: 'Legal Documents Overview',
    type: 'Instructions',
    content:
      "To help your executors and trustees efficiently settle your estate, it's essential to keep organized records of your legal documents. This section is dedicated to storing copies of essential paperwork related to your personal and financial affairs. Consider storing the originals in your fireproof document bag.",
  },

  {
    key: 'identification_documents_header',
    label: 'Identification Documents',
    type: 'Instructions',
    content:
      'Essential identification documents for estate settlement and official processes',
  },
  {
    key: 'birth_certificate',
    label: 'Birth Certificate',
    type: 'TextInputWithUpload',
    helperText: 'Upload copy of birth certificate or note location of original',
  },
  {
    key: 'social_security_card',
    label: 'Social Security Card',
    type: 'TextInputWithUpload',
    helperText: 'Upload copy of Social Security card or note location',
  },
  {
    key: 'passport',
    label: 'Passport',
    type: 'TextInputWithUpload',
    helperText: 'Upload copy of current passport or note location',
  },
  {
    key: 'drivers_license',
    label: "Driver's License",
    type: 'TextInputWithUpload',
    helperText: "Upload copy of current driver's license or state ID",
  },
  {
    key: 'marriage_certificate',
    label: 'Marriage Certificate',
    type: 'TextInputWithUpload',
    helperText: 'Upload copy of marriage certificate(s) or note location',
  },
  {
    key: 'divorce_decree',
    label: 'Divorce Decree',
    type: 'TextInputWithUpload',
    helperText:
      'Upload copies of divorce decrees or legal separation documents',
  },
  {
    key: 'name_change_documents',
    label: 'Name Change Documents',
    type: 'TextInputWithUpload',
    helperText: 'Legal documents for any name changes',
  },

  {
    key: 'citizenship_documents_header',
    label: 'Citizenship & Immigration Documents',
    type: 'Instructions',
    content: 'Documents proving citizenship or immigration status',
  },
  {
    key: 'naturalization_certificate',
    label: 'Naturalization Certificate',
    type: 'TextInputWithUpload',
    helperText: 'Certificate of naturalization or citizenship',
  },
  {
    key: 'immigration_documents',
    label: 'Immigration Documents',
    type: 'TextInputWithUpload',
    helperText: 'Green card, visa, or other immigration documents',
  },

  {
    key: 'family_documents_header',
    label: 'Family Documents',
    type: 'Instructions',
    content: 'Documents related to children and family relationships',
  },
  {
    key: 'children_birth_certificates',
    label: "Children's Birth Certificates",
    type: 'TextInputWithUpload',
    helperText: 'Birth certificates for all children',
  },
  {
    key: 'adoption_documents',
    label: 'Adoption Documents',
    type: 'TextInputWithUpload',
    helperText: 'Adoption papers or legal guardianship documents',
  },
  {
    key: 'custody_agreements',
    label: 'Custody Agreements',
    type: 'TextInputWithUpload',
    helperText: 'Child custody or visitation agreements',
  },
];

const SECTION_20B_FIELDS = [
  {
    key: 'tax_documents_instructions',
    label: 'Tax Documents Overview',
    type: 'Instructions',
    content:
      'When managing an estate or trust, executors or trustees are required to file annual tax returns until the estate is fully settled. Keeping tax documents well-organized will make this process much smoother and less stressful for your loved ones.',
  },

  {
    key: 'current_tax_year',
    label: 'Current Tax Year Documents',
    type: 'TextInputWithUpload',
    helperText:
      'Upload current year tax returns, W-2s, 1099s, and supporting documents',
  },
  {
    key: 'previous_tax_years',
    label: 'Previous Tax Years',
    type: 'TextInputWithUpload',
    helperText:
      'Upload tax returns for previous 3-7 years (recommended for audit protection)',
  },
  {
    key: 'tax_preparer_info',
    label: 'Tax Preparer Information',
    type: 'TextInputWithUpload',
    helperText: 'Contact information for your tax preparer or CPA',
  },
  {
    key: 'tax_software',
    label: 'Tax Software Information',
    type: 'TextArea',
    helperText:
      'If you use tax software, include login information and where files are stored',
  },
  {
    key: 'business_tax_documents',
    label: 'Business Tax Documents',
    type: 'TextInputWithUpload',
    helperText:
      'Business tax returns, partnership returns, or corporate tax documents',
  },
  {
    key: 'estimated_tax_payments',
    label: 'Estimated Tax Payments',
    type: 'TextArea',
    helperText: 'Information about quarterly estimated tax payments',
  },
  {
    key: 'tax_debt_issues',
    label: 'Tax Debt or Issues',
    type: 'TextInputWithUpload',
    helperText:
      'Any outstanding tax debt, payment plans, or IRS correspondence',
  },
];

/* ============================================================
   REPEATABLE SUBSECTION — 20C
============================================================ */

const SECTION_20C = {
  subsectionId: '20C',
  title: 'Other Important Documents',
  itemLabel: 'Document',
  fields: [
    {
      key: 'document_type',
      label: 'Document Type',
      type: 'Dropdown',
      options: [
        'Contract',
        'Lease Agreement',
        'Loan Document',
        'Insurance Policy',
        'Professional License',
        'Academic Diploma',
        'Award/Certificate',
        'Legal Settlement',
        'Court Order',
        'Power of Attorney',
        'Other',
      ],
      helperText: 'Type of legal or important document',
    },
    {
      key: 'document_description',
      label: 'Document Description',
      type: 'TextArea',
      helperText:
        "Brief description of what this document is and why it's important",
    },
    {
      key: 'parties_involved',
      label: 'Parties Involved',
      type: 'TextArea',
      helperText: 'Names of other parties, companies, or institutions involved',
    },
    {
      key: 'important_dates',
      label: 'Important Dates',
      type: 'TextArea',
      helperText:
        'Effective dates, expiration dates, or other important deadlines',
    },
    {
      key: 'document_location',
      label: 'Document Location',
      type: 'TextArea',
      helperText: 'Where the original document is stored',
    },
    {
      key: 'renewal_requirements',
      label: 'Renewal Requirements',
      type: 'TextArea',
      helperText:
        'If this document requires renewal, maintenance, or ongoing action',
    },
    {
      key: 'contact_information',
      label: 'Related Contact Information',
      type: 'TextInputWithUpload',
      helperText:
        'Contact information for lawyers, institutions, or other parties related to this document',
    },
    {
      key: 'document_upload',
      label: 'Document Copy',
      type: 'TextInputWithUpload',
      helperText: 'Upload a copy of this document',
    },
  ],
};

/* ============================================================
   COMPONENT
============================================================ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
}

export default function Section20LegalDocumentsRecords({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  const update = (key: string, value: any) =>
    onChange({ ...data, [key]: value });

  /* ---------- STATIC RENDERER ---------- */
  const renderStatic = (id: string, title: string, fields: any[]) => {
    const show = !activeSubsection || activeSubsection === id;

    return (
      <div
        id={`subsection-${id}`}
        className={`rounded-3xl ${show ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {id}. {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {fields.map(field => (
              <DynamicFormField
                key={field.key}
                field={field}
                value={data[id]?.[field.key]}
                formData={data[id] || {}}
                onChange={v =>
                  update(id, { ...(data[id] || {}), [field.key]: v })
                }
              />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  };

  /* ---------- REPEATABLE RENDERER ---------- */
  const renderRepeatable = () => {
    const show = !activeSubsection || activeSubsection === '20C';
    const items = Array.isArray(data['20C']) ? data['20C'] : [];

    const addItem = () =>
      update('20C', [
        ...items,
        Object.fromEntries(SECTION_20C.fields.map(f => [f.key, ''])),
      ]);

    const updateItem = (i: number, k: string, v: any) => {
      const next = [...items];
      next[i] = { ...next[i], [k]: v };
      update('20C', next);
    };

    const removeItem = (i: number) =>
      update(
        '20C',
        items.filter((_, idx) => idx !== i),
      );

    return (
      <div
        id="subsection-20C"
        className={`rounded-3xl ${show ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>20C. {SECTION_20C.title}</CardTitle>
            <Button size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add {SECTION_20C.itemLabel}
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {items.map((item, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between mb-4">
                  <strong>
                    {SECTION_20C.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeItem(index)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_20C.fields.map(field => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      formData={item}
                      onChange={v => updateItem(index, field.key, v)}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {renderStatic('20A', 'Personal Legal Documents', SECTION_20A_FIELDS)}
      {renderStatic('20B', 'Tax Documents', SECTION_20B_FIELDS)}
      {renderRepeatable()}
    </div>
  );
}
