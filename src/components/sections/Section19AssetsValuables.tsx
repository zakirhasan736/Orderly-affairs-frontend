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
   REPEATABLE SECTION FACTORY
============================================================ */

const createRepeatableSection = (
  subsectionId: string,
  title: string,
  itemLabel: string,
  fields: any[],
) => ({ subsectionId, title, itemLabel, fields });

/* ============================================================
   SECTION 19A — VALUABLE ITEMS
============================================================ */

const SECTION_19A = createRepeatableSection(
  '19A',
  'Valuable Items',
  'Asset / Valuable',
  [
    {
      key: 'item_type',
      label: 'Type of Item',
      type: 'Dropdown',
      options: [
        'Jewelry',
        'Artwork',
        'Collectibles',
        'Antiques',
        'Precious Metals',
        'Coins/Currency',
        'Electronics',
        'Musical Instruments',
        'Sports Memorabilia',
        'Books/Documents',
        'Furniture',
        'Tools/Equipment',
        'Other',
      ],
      helperText: 'Category of valuable item',
    },
    {
      key: 'item_type_other',
      label: 'Please specify other item type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of valuable item',
      conditionalDisplay: { field: 'item_type', value: 'Other' },
    },
    {
      key: 'item_description',
      label: 'Item Description',
      type: 'TextArea',
      helperText:
        'Detailed description of the item including brand, model, characteristics',
    },
    {
      key: 'estimated_value',
      label: 'Estimated Value',
      type: 'TextInput',
      helperText: 'Approximate current value of the item',
    },
    {
      key: 'purchase_info',
      label: 'Purchase Information',
      type: 'TextArea',
      helperText: 'When and where purchased, original cost',
    },
    {
      key: 'current_location',
      label: 'Current Location',
      type: 'TextArea',
      helperText: 'Where this item is currently stored or displayed',
    },
    {
      key: 'insurance_info',
      label: 'Insurance Information',
      type: 'TextArea',
      helperText: 'Whether item is insured, policy details, or coverage amount',
    },
    {
      key: 'appraisal_info',
      label: 'Appraisal Information',
      type: 'TextInputWithUpload',
      helperText:
        'Professional appraisals, certificates of authenticity, or valuation documents',
    },
    {
      key: 'intended_recipient',
      label: 'Intended Recipient',
      type: 'TextArea',
      helperText: 'Who you want to inherit this item',
    },
    {
      key: 'care_instructions',
      label: 'Care Instructions',
      type: 'TextArea',
      helperText: 'Special care, maintenance, or storage requirements',
    },
    {
      key: 'item_history',
      label: 'Item History/Significance',
      type: 'TextArea',
      helperText:
        'Family history, sentimental value, or why this item is important',
    },
    {
      key: 'item_documents',
      label: 'Item Documentation',
      type: 'TextInputWithUpload',
      helperText:
        'Upload photos, receipts, certificates, or other documentation',
    },
  ],
);

/* ============================================================
   SECTION 19B — REAL ESTATE PROPERTIES
============================================================ */

const SECTION_19B = createRepeatableSection(
  '19B',
  'Real Estate Properties',
  'Property',
  [
    {
      key: 'property_type',
      label: 'Property Type',
      type: 'Dropdown',
      options: [
        'Residential Rental',
        'Commercial Property',
        'Vacant Land',
        'Investment Property',
        'Vacation Home',
        'Mobile Home',
        'Condo/Townhouse',
        'Farm/Agricultural',
        'Other',
      ],
      helperText: 'Type of real estate property',
    },
    {
      key: 'property_type_other',
      label: 'Please specify other property type',
      type: 'TextInput',
      helperText: 'Please describe the specific type of real estate property',
      conditionalDisplay: { field: 'property_type', value: 'Other' },
    },
    {
      key: 'property_address',
      label: 'Property Address',
      type: 'TextArea',
      helperText: 'Complete address of the property',
    },
    {
      key: 'property_description',
      label: 'Property Description',
      type: 'TextArea',
      helperText: 'Description of the property, size, features, etc.',
    },
    {
      key: 'ownership_details',
      label: 'Ownership Details',
      type: 'TextArea',
      helperText:
        'How property is owned (sole, joint, trust, etc.) and ownership percentages',
    },
    {
      key: 'purchase_info',
      label: 'Purchase Information',
      type: 'TextArea',
      helperText: 'When purchased, purchase price, and from whom',
    },
    {
      key: 'current_value',
      label: 'Current Estimated Value',
      type: 'TextInput',
      helperText: 'Current estimated market value',
    },
    {
      key: 'mortgage_info',
      label: 'Mortgage Information',
      type: 'TextArea',
      helperText: 'Outstanding mortgage balance, lender, payment details',
    },
    {
      key: 'rental_info',
      label: 'Rental Information',
      type: 'TextArea',
      helperText:
        'If rental property, tenant information, lease details, rental income',
    },
    {
      key: 'property_manager',
      label: 'Property Manager',
      type: 'TextInputWithUpload',
      helperText:
        'Contact information for property manager or management company',
    },
    {
      key: 'property_taxes',
      label: 'Property Tax Information',
      type: 'TextInputWithUpload',
      helperText: 'Annual property taxes, payment method, and upload tax bills',
    },
    {
      key: 'insurance_info',
      label: 'Property Insurance',
      type: 'TextInputWithUpload',
      helperText: 'Insurance company, policy number, coverage details',
    },
    {
      key: 'intended_disposition',
      label: 'Intended Disposition',
      type: 'TextArea',
      helperText:
        'Your wishes for this property (sell, keep in family, specific heir, etc.)',
    },
    {
      key: 'property_documents',
      label: 'Property Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload deeds, surveys, appraisals, or other property documents',
    },
  ],
);

/* ============================================================
   COMPONENT
============================================================ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  activeSubsection?: string | null;
}

export default function Section19AssetsValuables({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  const update = (key: string, value: any) =>
    onChange({ ...data, [key]: value });

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

    const updateItem = (index: number, key: string, value: any) => {
      const next = [...items];
      next[index] = { ...next[index], [key]: value };
      update(section.subsectionId, next);
    };

    const removeItem = (index: number) =>
      update(
        section.subsectionId,
        items.filter((_: any, i: number) => i !== index),
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
              <Plus className="h-4 w-4 mr-1" />
              Add {section.itemLabel}
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {items.length === 0 && (
              <div className="text-muted-foreground text-center py-6">
                No {section.title.toLowerCase()} added yet.
              </div>
            )}

            {items.map((item: any, index: number) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between mb-4">
                  <strong>
                    {section.itemLabel} #{index + 1}
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
                  {section.fields.map((field: any) => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      formData={item}
                      onChange={(v: any) => updateItem(index, field.key, v)}
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
      {[SECTION_19A, SECTION_19B].map(renderRepeatable)}
    </div>
  );
}
