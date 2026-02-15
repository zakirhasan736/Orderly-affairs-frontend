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
   SECTION 18A — CURRENT EMPLOYMENT (NON-REPEATABLE)
============================================================ */

const SECTION_18A = {
  subsectionId: '18A',
  title: 'Current Employment',
  fields: [
    {
      key: 'employment_status',
      label: 'Employment Status',
      type: 'RadioButtons',
      options: [
        'Employed Full-Time',
        'Employed Part-Time',
        'Self-Employed',
        'Business Owner',
        'Retired',
        'Unemployed',
        'Disabled',
        'Other',
      ],
      helperText: 'Your current employment situation',
    },
    {
      key: 'employer_name',
      label: 'Employer/Company Name',
      type: 'TextInput',
      helperText: 'Name of your current employer or company',
      conditionalDisplay: {
        field: 'employment_status',
        value: ['Employed Full-Time', 'Employed Part-Time'],
      },
    },
    {
      key: 'job_title',
      label: 'Job Title/Position',
      type: 'TextInput',
      helperText: 'Your current job title or position',
    },
    {
      key: 'work_address',
      label: 'Work Address',
      type: 'TextArea',
      helperText: 'Address of your workplace',
    },
    {
      key: 'work_phone',
      label: 'Work Phone Number',
      type: 'TextInput',
      helperText: 'Main phone number for your workplace',
    },
    {
      key: 'supervisor_hr',
      label: 'Supervisor/HR Contact',
      type: 'TextInputWithUpload',
      helperText: 'Contact information for your supervisor or HR department',
    },
    {
      key: 'employee_id',
      label: 'Employee ID',
      type: 'TextInput',
      helperText: 'Your employee identification number',
    },
    {
      key: 'start_date',
      label: 'Start Date',
      type: 'DatePicker',
      helperText: 'When you started this job',
    },
    {
      key: 'salary_wage',
      label: 'Salary/Wage Information',
      type: 'TextArea',
      helperText: 'Annual salary or hourly wage information',
    },
    {
      key: 'benefits',
      label: 'Employment Benefits',
      type: 'TextArea',
      helperText:
        'Health insurance, retirement plans, life insurance, or other benefits through work',
    },
    {
      key: 'vacation_sick_time',
      label: 'Vacation/Sick Time',
      type: 'TextArea',
      helperText: 'Accrued vacation time, sick leave, or PTO balances',
    },
    {
      key: 'work_equipment',
      label: 'Company Equipment',
      type: 'TextArea',
      helperText:
        'Company-owned equipment you have (laptop, phone, car, tools, etc.)',
    },
    {
      key: 'employment_documents',
      label: 'Employment Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload employee handbook, benefits information, or contracts',
    },
  ],
};

/* ============================================================
   REPEATABLE SECTION FACTORY
============================================================ */

const createRepeatableSection = (
  subsectionId: string,
  title: string,
  itemLabel: string,
  fields: any[],
) => ({ subsectionId, title, itemLabel, fields });

/* ============================================================
   SECTIONS 18B–18D
============================================================ */

const SECTIONS = [
  createRepeatableSection('18B', 'Business Ownership', 'Business', [
    {
      key: 'business_name',
      label: 'Business Name',
      type: 'TextInput',
      helperText: 'Legal name of your business',
    },
    {
      key: 'business_type',
      label: 'Business Type',
      type: 'Dropdown',
      options: [
        'Sole Proprietorship',
        'Partnership',
        'LLC',
        'Corporation',
        'S-Corporation',
        'Non-Profit',
        'Other',
      ],
      helperText: 'Legal structure of your business',
    },
    {
      key: 'business_type_other',
      label: 'Please specify other business type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of business structure',
      conditionalDisplay: { field: 'business_type', value: 'Other' },
    },
    {
      key: 'business_address',
      label: 'Business Address',
      type: 'TextArea',
      helperText: 'Physical address of your business',
    },
    {
      key: 'business_phone',
      label: 'Business Phone',
      type: 'TextInput',
      helperText: 'Main business phone number',
    },
    {
      key: 'tax_id',
      label: 'Tax ID/EIN',
      type: 'TextInput',
      helperText: 'Business tax identification number',
    },
    {
      key: 'business_description',
      label: 'Business Description',
      type: 'TextArea',
      helperText: 'What your business does and main services/products',
    },
    {
      key: 'ownership_percentage',
      label: 'Ownership Percentage',
      type: 'TextInput',
      helperText: 'Your percentage of ownership in this business',
    },
    {
      key: 'business_partners',
      label: 'Business Partners',
      type: 'TextArea',
      helperText:
        'Names and contact information of business partners or co-owners',
    },
    {
      key: 'key_employees',
      label: 'Key Employees',
      type: 'TextArea',
      helperText: 'Important employees and their contact information',
    },
    {
      key: 'succession_plan',
      label: 'Business Succession Plan',
      type: 'TextArea',
      helperText:
        'Plans for business continuation or sale upon your death or incapacity',
    },
    {
      key: 'business_attorney',
      label: 'Business Attorney/Advisor',
      type: 'TextInputWithUpload',
      helperText:
        'Contact information for business attorney, accountant, or advisor',
    },
    {
      key: 'business_accounts',
      label: 'Business Financial Accounts',
      type: 'TextArea',
      helperText: 'Business bank accounts, credit cards, or financial accounts',
    },
    {
      key: 'business_documents',
      label: 'Business Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload business formation documents, partnerships agreements, or important contracts',
    },
  ]),

  createRepeatableSection('18C', 'Past Employment', 'Previous Job', [
    {
      key: 'employer_name',
      label: 'Employer Name',
      type: 'TextInput',
      helperText: 'Company or organization name',
    },
    {
      key: 'job_title',
      label: 'Job Title/Position',
      type: 'TextInput',
      helperText: 'Your position or title at this employer',
    },
    {
      key: 'employment_dates',
      label: 'Employment Dates',
      type: 'TextInput',
      helperText: 'Start and end dates (e.g., Jan 2010 - Dec 2015)',
    },
    {
      key: 'job_description',
      label: 'Job Description',
      type: 'TextArea',
      helperText: 'Brief description of your role and responsibilities',
    },
    {
      key: 'employer_address',
      label: 'Employer Address',
      type: 'TextArea',
      helperText: 'Company address and contact information',
    },
    {
      key: 'supervisor_contact',
      label: 'Supervisor/HR Contact',
      type: 'TextInputWithUpload',
      helperText: 'Contact information for former supervisor or HR department',
    },
    {
      key: 'reason_for_leaving',
      label: 'Reason for Leaving',
      type: 'TextArea',
      helperText: 'Why you left this position',
    },
    {
      key: 'achievements',
      label: 'Key Achievements',
      type: 'TextArea',
      helperText: 'Notable accomplishments or contributions in this role',
    },
    {
      key: 'employment_documents',
      label: 'Employment Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload employment letters, performance reviews, or other relevant documents',
    },
  ]),

  createRepeatableSection('18D', 'Income Sources', 'Income Source', [
    {
      key: 'income_type',
      label: 'Type of Income',
      type: 'Dropdown',
      options: [
        'Salary/Wages',
        'Social Security',
        'Pension',
        'Retirement Account Distributions',
        'Investment Income',
        'Rental Income',
        'Business Income',
        'Freelance/Contract Work',
        'Disability Benefits',
        'Alimony',
        'Other',
      ],
      helperText: 'Category of this income source',
    },
    {
      key: 'income_type_other',
      label: 'Please specify other income type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of income',
      conditionalDisplay: { field: 'income_type', value: 'Other' },
    },
    {
      key: 'income_source',
      label: 'Income Source',
      type: 'TextInput',
      helperText:
        'Where this income comes from (employer, government, investment company, etc.)',
    },
    {
      key: 'income_amount',
      label: 'Income Amount',
      type: 'TextInput',
      helperText: 'Amount and frequency (e.g., $3,000/month, $50,000/year)',
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      type: 'TextArea',
      helperText: 'How you receive this income (direct deposit, check, etc.)',
    },
    {
      key: 'tax_withholding',
      label: 'Tax Withholding',
      type: 'TextArea',
      helperText: 'Information about taxes withheld from this income',
    },
    {
      key: 'income_contact',
      label: 'Contact Information',
      type: 'TextInputWithUpload',
      helperText: 'Contact information for this income source',
    },
    {
      key: 'income_documents',
      label: 'Income Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload pay stubs, 1099s, benefit statements, or other income documentation',
    },
  ]),
];

/* ============================================================
   COMPONENT
============================================================ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
}

export default function Section18EmploymentBusiness({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  const update = (key: string, value: any) =>
    onChange({ ...data, [key]: value });

  const show18A = !activeSubsection || activeSubsection === '18A';

  const renderRepeatable = (section: any) => {
    const show = !activeSubsection || activeSubsection === section.subsectionId;

    const items = Array.isArray(data[section.subsectionId])
      ? data[section.subsectionId]
      : [];

    const addItem = () =>
      update(section.subsectionId, [
        ...items,
        Object.fromEntries(section.fields.map((f: any) => [f.key, ''])),
      ]);

    const updateItem = (i: number, key: string, val: any) => {
      const next = [...items];
      next[i] = { ...next[i], [key]: val };
      update(section.subsectionId, next);
    };

    const removeItem = (i: number) =>
      update(
        section.subsectionId,
        items.filter((_: any, idx: number) => idx !== i),
      );

    return (
      <div
        key={section.subsectionId}
        id={`subsection-${section.subsectionId}`}
        className={`rounded-3xl ${show ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>
              {section.subsectionId}. {section.title}
            </CardTitle>
            <Button size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Add {section.itemLabel}
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {items.map((item: any, i: number) => (
              <Card key={i} className="p-6">
                <div className="flex justify-between mb-4">
                  <strong>
                    {section.itemLabel} #{i + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeItem(i)}
                  >
                    <Minus className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {section.fields.map((field: any) => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      formData={item}
                      onChange={(v: any) => updateItem(i, field.key, v)}
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
      {/* ====================== 18A ====================== */}
      <div
        id="subsection-18A"
        className={`rounded-3xl ${show18A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <CardTitle>18A. {SECTION_18A.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {SECTION_18A.fields.map(field => (
              <DynamicFormField
                key={field.key}
                field={field}
                value={data['18A']?.[field.key]}
                formData={data['18A']}
                onChange={v =>
                  update('18A', { ...data['18A'], [field.key]: v })
                }
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {SECTIONS.map(renderRepeatable)}
    </div>
  );
}
