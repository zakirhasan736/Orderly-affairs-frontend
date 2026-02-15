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

const SECTION_5 = {
  subsectionId: '5A',
  title: 'Current Vehicles',
  itemLabel: 'Vehicle',
  fields: [
    {
      key: 'year',
      label: 'Year',
      type: 'TextInput',
      helperText: 'Vehicle year',
    },
    {
      key: 'make',
      label: 'Make',
      type: 'TextInput',
      helperText: 'Vehicle manufacturer',
    },
    {
      key: 'model',
      label: 'Model',
      type: 'TextInput',
      helperText: 'Vehicle model',
    },
    {
      key: 'color',
      label: 'Color',
      type: 'TextInput',
      helperText: 'Vehicle color',
    },
    {
      key: 'vin',
      label: 'VIN',
      type: 'TextInput',
      helperText: 'Vehicle identification number',
    },
    {
      key: 'license_plate',
      label: 'License Plate',
      type: 'TextInput',
      helperText: 'Current license plate number',
    },
    {
      key: 'registration_expiry',
      label: 'Registration Expiry',
      type: 'DatePicker',
      helperText: 'When does registration expire?',
    },
    {
      key: 'insurance_company',
      label: 'Insurance Company',
      type: 'TextInput',
      helperText: 'Current insurance provider',
    },
    {
      key: 'insurance_policy',
      label: 'Insurance Policy Number',
      type: 'TextInput',
      helperText: 'Insurance policy number',
    },
    {
      key: 'financing',
      label: 'Financing Information',
      type: 'TextArea',
      helperText: 'Loan details, payment information, or if owned outright',
    },
    {
      key: 'maintenance_records',
      label: 'Maintenance Records',
      type: 'TextInputWithUpload',
      helperText: 'Service records, receipts, or maintenance schedule',
    },
    {
      key: 'parking_location',
      label: 'Usual Parking Location',
      type: 'TextInput',
      helperText: 'Where the vehicle is typically parked',
    },
    {
      key: 'spare_keys',
      label: 'Spare Key Locations',
      type: 'TextInput',
      helperText: 'Where spare keys are located',
    },
    {
      key: 'notes',
      label: 'Additional Notes',
      type: 'TextArea',
      helperText: 'Any other important information about this vehicle',
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

export default function Section5Vehicles({
  data = {},
  onChange = () => {},
  activeSubsection,
}: Props) {
  /* ---------- SAFE ARRAY NORMALIZER ---------- */
  const vehicles: any[] = Array.isArray(data['5A']) ? data['5A'] : [];

  const updateVehicles = (next: any[]) => {
    onChange({
      ...data,
      '5A': next,
    });
  };

  const addVehicle = () => {
    const emptyVehicle = Object.fromEntries(
      SECTION_5.fields.map(f => [f.key, '']),
    );
    updateVehicles([...vehicles, emptyVehicle]);
  };

  const updateVehicle = (index: number, fieldKey: string, value: any) => {
    const next = [...vehicles];
    next[index] = { ...next[index], [fieldKey]: value };
    updateVehicles(next);
  };

  const removeVehicle = (index: number) => {
    updateVehicles(vehicles.filter((_, i) => i !== index));
  };

  const show5A = !activeSubsection || activeSubsection === '5A';

  return (
    <div className="space-y-8">
      <div
        id="subsection-5A"
        className={`rounded-3xl ${show5A ? 'border border-primary' : ''}`}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>5A. {SECTION_5.title}</CardTitle>

              <Button size="sm" onClick={addVehicle}>
                <Plus className="h-4 w-4 mr-1" />
                Add {SECTION_5.itemLabel}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {vehicles.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No vehicles added yet.
              </div>
            )}

            {vehicles.map((vehicle, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <strong>
                    {SECTION_5.itemLabel} #{index + 1}
                  </strong>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeVehicle(index)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {SECTION_5.fields.map(field => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={vehicle[field.key]}
                      formData={vehicle}
                      onChange={value => updateVehicle(index, field.key, value)}
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
