import React, { useEffect, useCallback } from 'react';
import { Card } from '@common/ui/card';
import { Button } from '@common/ui/button';
import { Plus, Minus } from 'lucide-react';
import { DynamicFormField } from './DynamicFormField';
import { FieldDefinition } from '@/types/formTypes';

interface RepeatableGroupProps {
  title: string;
  itemLabel: string;
  fields: FieldDefinition[];
  values: any[];
  onChange: (values: any[]) => void;
  minItems?: number;
  subsectionId?: string; // Add subsectionId to generate proper IDs
}

export function RepeatableGroup({ 
  title, 
  itemLabel, 
  fields, 
  values, 
  onChange, 
  minItems = 1,
  subsectionId 
}: RepeatableGroupProps) {
  // Ensure minimum items using useEffect to avoid render-time state updates
  useEffect(() => {
    if (values.length === 0 && minItems > 0) {
      const initialValues = Array(minItems).fill(null).map(() => ({}));
      onChange(initialValues);
    }
  }, [values.length, minItems]); // Remove onChange from deps to prevent infinite loops

  const addItem = useCallback(() => {
    const newValues = [...values, {}];
    onChange(newValues);
  }, [values, onChange]);

  const removeItem = useCallback((index: number) => {
    if (values.length <= minItems) return;
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  }, [values, minItems, onChange]);

  const updateItem = useCallback((index: number, field: string, value: any) => {
    const newValues = [...values];
    if (!newValues[index]) newValues[index] = {};
    newValues[index][field] = value;
    onChange(newValues);
  }, [values, onChange]);

  // If no values and we're waiting for useEffect to initialize, show empty state
  if (values.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4>{title}</h4>
          <Button type="button" onClick={addItem} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add {itemLabel}
          </Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>
            No {itemLabel.toLowerCase()}s added yet. Click{' '}
            <p>
              No {itemLabel.toLowerCase()}s added yet. Click &quot;Add{' '}
              {itemLabel}&quot; to get started.
            </p>
            Add {itemLabel}&quot; to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4>{title}</h4>
        <Button type="button" onClick={addItem} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add {itemLabel}
        </Button>
      </div>

      {values.map((item, index) => (
        <Card 
          key={subsectionId ? `${subsectionId}-item-${index}` : `item-${index}`} 
          id={subsectionId ? `repeatable-item-${subsectionId}-${index}` : undefined}
          className="p-4 scroll-mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h5>{itemLabel} {index + 1}</h5>
            {values.length > minItems && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeItem(index)}
              >
                <Minus className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div 
                key={field.key}
                className={field.type === 'TextArea' || field.type === 'TextInputWithUpload' ? 'md:col-span-2' : ''}
              >
                <DynamicFormField
                  field={field}
                  value={item[field.key]}
                  formData={item}
                  onChange={(value) => updateItem(index, field.key, value)}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}