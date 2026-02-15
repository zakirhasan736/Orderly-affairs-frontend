'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { DynamicFormField } from '@/components/DynamicFormField';

/* ------------------------------------------------------------------ */
/* CONFIG — HARD WIRED (from your JSON)                                */
/* ------------------------------------------------------------------ */

const SECTION_6A = {
  id: '6A',
  title: 'Home Information & Inventory',
  fields: [
    {
      key: 'inventory_instructions',
      label: 'Home Inventory Instructions',
      type: 'Instructions',
      content:
        'Document anything of value in your home, either on paper or even on video. Share details about sentimental, historical, or monetary items you want noted. This record is helpful for individuals who will inherit specific items and aids in processing insurance claims.',
    },
    {
      key: 'home_address',
      label: 'Home Address',
      type: 'TextArea',
      helperText: 'Full address of your primary residence',
      required: true,
    },
    {
      key: 'residence_type',
      label: 'Type of Residence',
      type: 'Dropdown',
      options: [
        'Single Family Home',
        'Townhouse',
        'Condominium',
        'Apartment',
        'Mobile Home',
        'Other',
      ],
      helperText: 'Type of your primary residence',
    },
    {
      key: 'custom_residence_type',
      label: 'Specify Residence Type',
      type: 'TextInput',
      placeholder: 'Enter custom residence type',
      helperText: 'Please specify the type of residence',
      conditionalOn: 'residence_type',
      conditionalValue: 'Other',
    },
    {
      key: 'ownership_status',
      label: 'Ownership Status',
      type: 'RadioButtons',
      options: ['Own', 'Rent', 'Other'],
      helperText: 'Do you own or rent your primary residence?',
    },
    {
      key: 'ownership_type',
      label: 'Ownership Type',
      type: 'Dropdown',
      options: [
        'Sole Ownership',
        'Joint Tenancy',
        'Tenants in Common',
        'Community Property',
        'Life Estate',
        'Trust Ownership',
        'Other',
      ],
      helperText: 'How the home is owned',
      conditionalOn: 'ownership_status',
      conditionalValue: 'Own',
    },
    {
      key: 'custom_ownership_type',
      label: 'Specify Ownership Type',
      type: 'TextInput',
      placeholder: 'Enter custom ownership type',
      helperText: 'Please specify the type of ownership',
      conditionalOn: 'ownership_type',
      conditionalValue: 'Other',
    },
    {
      key: 'year_purchased_leased',
      label: 'Year Purchased or Leased',
      type: 'TextInput',
      helperText: 'Year you acquired or began leasing this property',
    },
    {
      key: 'joint_owners',
      label: 'Joint Owner(s)',
      type: 'TextArea',
      helperText: 'Names and relationships of any co-owners or joint tenants',
    },
    {
      key: 'county',
      label: 'County',
      type: 'TextInput',
      helperText: 'County where the property is located',
    },

    {
      key: 'mortgage_financial_documents_label',
      label: 'Mortgage & Financial Documents',
      type: 'Instructions',
      content:
        'Important financial documents and statements for property ownership and financing',
    },
    {
      key: 'mortgage_lienholder_landlord',
      label: 'Mortgage Lienholder or Landlord',
      type: 'TextInputWithUpload',
      helperText:
        'Primary lender or landlord contact information and business card if available',
    },
    {
      key: 'payment_methods',
      label: 'Payment Methods Used',
      type: 'TextArea',
      helperText:
        'How payments are made (check, online, autopay, etc.) and include online access details if available',
    },

    {
      key: 'property_ownership_docs_label',
      label: 'Property Ownership Documents',
      type: 'Instructions',
      content:
        'Essential legal documents that establish and verify property ownership',
    },
    {
      key: 'property_deeds_titles',
      label: 'Property Deeds & Titles',
      type: 'TextInputWithUpload',
      helperText:
        'Upload deeds and titles or note their location (Recommendation: Place in Protected Documents bag)',
    },

    {
      key: 'current_financing_docs_label',
      label: 'Current Financing Documents',
      type: 'Instructions',
      content:
        'Current mortgage statements, loans, and ongoing financial obligations for the property',
    },
    {
      key: 'mortgage_lease_statement',
      label: 'Current Mortgage Statement or Lease Agreement',
      type: 'TextInputWithUpload',
      helperText: 'Upload current mortgage statement or lease agreement copy',
    },
    {
      key: 'second_mortgage_heloc',
      label: 'Second Mortgages or HELOCs',
      type: 'TextInputWithUpload',
      helperText:
        'Statements for any second mortgages or Home Equity Lines of Credit',
    },
    {
      key: 'property_tax_bills',
      label: 'Property Tax Bills or Statements',
      type: 'TextInputWithUpload',
      helperText: 'Upload current property tax bills and payment records',
    },

    {
      key: 'historical_special_docs_label',
      label: 'Historical & Special Documents',
      type: 'Instructions',
      content:
        'Past transactions, paid-off debts, and special financing arrangements',
    },
    {
      key: 'closing_refinancing_docs',
      label: 'Closing or Refinancing Documents',
      type: 'TextInputWithUpload',
      helperText:
        'Upload closing/refinancing documents or notes on where they can be found',
    },
    {
      key: 'paid_off_documentation',
      label: 'Paid-Off Liens/Mortgages',
      type: 'TextInputWithUpload',
      helperText:
        'Documentation confirming any liens, notes, or mortgages have been paid off',
    },
    {
      key: 'reverse_mortgage_info',
      label: 'Reverse Mortgage Information',
      type: 'TextInputWithUpload',
      helperText: 'Information and documents about any reverse mortgages',
    },

    {
      key: 'professional_contacts_label',
      label: 'Professional Contacts',
      type: 'Instructions',
      content:
        'Real estate professionals and service providers related to your property',
    },
    {
      key: 'realtor_landlord_contact',
      label: 'Real Estate Agent or Landlord Contact',
      type: 'TextInputWithUpload',
      helperText:
        'Contact details and business cards for real estate agent or landlord',
    },

    {
      key: 'occupancy_info_label',
      label: 'Current Occupancy Information',
      type: 'Instructions',
      content: 'Details about who currently lives in the home and any pets',
    },
    {
      key: 'residents',
      label: 'Residents',
      type: 'TextArea',
      helperText: 'Names of all people currently living in the home',
    },
    {
      key: 'pets',
      label: 'Pets',
      type: 'TextArea',
      helperText:
        'Details about pets, including names, types, and any special care instructions',
    },

    {
      key: 'year_built',
      label: 'Year Built',
      type: 'TextInput',
      helperText: 'Year the home was constructed',
    },
    {
      key: 'square_footage',
      label: 'Square Footage',
      type: 'TextInput',
      helperText: 'Approximate square footage of the home',
    },
    {
      key: 'lot_size',
      label: 'Lot Size',
      type: 'TextInput',
      helperText: 'Size of the property lot',
    },
    {
      key: 'bedrooms',
      label: 'Number of Bedrooms',
      type: 'TextInput',
      helperText: 'Total number of bedrooms',
    },
    {
      key: 'bathrooms',
      label: 'Number of Bathrooms',
      type: 'TextInput',
      helperText: 'Total number of bathrooms',
    },
    {
      key: 'home_features',
      label: 'Important Home Features',
      type: 'TextArea',
      helperText:
        'Pool, septic system, well, solar panels, generator, basement, attic, garage, or other special features',
    },
    {
      key: 'major_appliances',
      label: 'Major Appliances',
      type: 'TextArea',
      helperText:
        'HVAC system, water heater, washer/dryer, refrigerator, and other major appliances with model numbers and warranty info',
    },
    {
      key: 'home_inventory',
      label: 'Home Inventory',
      type: 'TextInputWithUpload',
      helperText:
        'Upload photos, video, or written inventory of valuable items and furnishings. Include sentimental, historical, or monetary items with details about their significance, value, and intended inheritors. This documentation is crucial for insurance claims and inheritance purposes.',
    },
    {
      key: 'inventory_date_location',
      label: 'Home Inventory Completion',
      type: 'TextArea',
      helperText:
        'I produced a home inventory on _____ (Month/Day/Year) and it is located _____. Include the date you completed your inventory and where it can be found.',
    },
    {
      key: 'other_documents_header',
      label: 'Other Important Home Documents & Information',
      type: 'Instructions',
      content:
        'Please include or note where to find these important items to help manage your home:',
    },
    {
      key: 'new_homes_label',
      label: 'New Homes',
      type: 'Instructions',
      content:
        'If you have a new home, provide contractor, builder, warranty information, and important manuals or guides:',
    },
    {
      key: 'builder_info',
      label: 'Builder/Contractor Information',
      type: 'TextInputWithUpload',
      helperText:
        'Contact information for builder, contractor, or development company',
    },
    {
      key: 'home_warranty',
      label: 'Home Warranty Information',
      type: 'TextInputWithUpload',
      helperText:
        'Warranty documents, coverage details, and contact information',
    },
    {
      key: 'appliance_manuals',
      label: 'Appliance Manuals & Warranties',
      type: 'TextInputWithUpload',
      helperText:
        'User manuals, warranty information for major appliances and systems',
    },
    {
      key: 'emergency_shutoffs_label',
      label: 'Emergency Information',
      type: 'Instructions',
      content: 'Critical information for emergencies and utility management:',
    },
    {
      key: 'utility_shutoffs',
      label: 'Utility Shut-off Locations',
      type: 'TextInputWithUpload',
      helperText:
        'Location of water, gas, and electrical shut-offs with photos or diagrams',
    },
    {
      key: 'circuit_breaker',
      label: 'Circuit Breaker Panel',
      type: 'TextInputWithUpload',
      helperText:
        'Photo of breaker panel with circuits labeled, or upload existing diagram',
    },
    {
      key: 'home_systems_notes',
      label: 'Home Systems Notes',
      type: 'TextArea',
      helperText:
        'Important notes about HVAC, plumbing, electrical, or other home systems',
    },
    {
      key: 'security_system',
      label: 'Security System Information',
      type: 'TextInputWithUpload',
      helperText:
        'Security system details, codes, monitoring company information',
    },
    {
      key: 'smart_home_devices',
      label: 'Smart Home & Connected Devices',
      type: 'TextArea',
      helperText:
        'List of smart home devices, apps, and login information for connected systems',
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

export default function Section6MainResidence({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  const subsectionData = data['6A'] || {};

  const updateField = (key: string, value: any) => {
    onChange({
      ...data,
      '6A': {
        ...subsectionData,
        [key]: value,
      },
    });
  };

  const show6A = !activeSubsection || activeSubsection === '6A';

  return (
    <div className="space-y-8">
      <div
        id="subsection-6A"
        className={`rounded-3xl ${show6A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <CardTitle>6A. {SECTION_6A.title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {SECTION_6A.fields.map(field => (
              <DynamicFormField
                key={field.key}
                field={field}
                value={subsectionData[field.key]}
                formData={subsectionData}
                onChange={value => updateField(field.key, value)}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
