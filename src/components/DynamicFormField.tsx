import React from 'react';
import { Input } from '@common/ui/input';
import { Textarea } from '@common/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@common/ui/select';
import { RadioGroup, RadioGroupItem } from '@common/ui/radio-group';
import { Label } from '@common/ui/label';
import { Checkbox } from '@common/ui/checkbox';
import { DatePicker } from './DatePicker';
import { TextInputWithUpload } from './TextInputWithUpload';
import { PODInstructionsModal } from './PODInstructionsModal';
import { FieldDefinition } from '@/types/formTypes';
import { MultiSelect } from './MultiSelect';
import { AccessManagement } from './AccessManagement';
import { LettersToNextOfKinField } from './LettersToNextOfKinField';
import { NextOfKinLetterField } from './NextOfKinLetterField';


interface DynamicFormFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  formData?: any; // Add formData to check conditional fields
  isVisible?: boolean; // Allow parent to control visibility
  rowId?: string;
  className?: string; // Allow custom CSS classes
}

export function DynamicFormField({ field, value, onChange, formData, rowId, isVisible = true, className }: DynamicFormFieldProps) {
  // Initialize value with default if no value is set
  const currentValue = value !== undefined && value !== null ? value : (field.defaultValue || '');
  
  // If there's a default value and no current value, set it
  React.useEffect(() => {
    if (field.defaultValue && (value === undefined || value === null || value === '')) {
      onChange(field.defaultValue);
    }
  }, [field.defaultValue, value, onChange]);

  // Check if field should be visible based on conditions
  const shouldShowField = () => {
    if (isVisible === false) return false;
    
    // Handle conditionalDisplay format (used in form config)
    if (field.conditionalDisplay && formData) {
      const conditionFieldValue = formData[field.conditionalDisplay.field];
      
      // Handle array of values (for multiple conditional values)
      if (Array.isArray(field.conditionalDisplay.value)) {
        return field.conditionalDisplay.value.includes(conditionFieldValue);
      }
      
      // Handle boolean conditionals for checkboxes
      if (field.conditionalDisplay.value === true || field.conditionalDisplay.value === 'true') {
        return conditionFieldValue === true;
      }
      if (field.conditionalDisplay.value === false || field.conditionalDisplay.value === 'false') {
        return conditionFieldValue === false;
      }
      
      return conditionFieldValue === field.conditionalDisplay.value;
    }
    
    // Handle legacy conditionalOn format (for backward compatibility)
    if (field.conditionalOn && field.conditionalValue !== undefined && formData) {
      const conditionFieldValue = formData[field.conditionalOn];
      
      // Handle array of values (for multiple conditional values)
      if (Array.isArray(field.conditionalValue)) {
        return field.conditionalValue.includes(conditionFieldValue);
      }
      
      // Handle boolean conditionals for checkboxes
      if (field.conditionalValue === true || field.conditionalValue === 'true') {
        return conditionFieldValue === true;
      }
      if (field.conditionalValue === false || field.conditionalValue === 'false') {
        return conditionFieldValue === false;
      }
      
      return conditionFieldValue === field.conditionalValue;
    }
    
    return true;
  };

  if (!shouldShowField()) {
    return null;
  }
  const renderField = () => {
    switch (field.type) {
      case 'TextInput':
        return (
          <Input
            value={currentValue}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={className || 'w-full'}
          />
        );

      case 'TextArea':
        return (
          <Textarea
            value={currentValue}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full min-h-30"
            readOnly={
              field.defaultValue !== undefined &&
              field.defaultValue.includes('•')
            }
          />
        );

      case 'TextInputWithUpload':
        return (
          <TextInputWithUpload
            label=""
            value={value}
            onChange={onChange}
            placeholder={field.placeholder}
            helperText={field.helperText}
          />
        );

      case 'DatePicker':
      case 'DateInput':
        return (
          <DatePicker
            value={value}
            onChange={onChange}
            placeholder="MM / DD / YYYY"
            className={className || 'w-full'}
          />
        );

      case 'Dropdown':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={field.placeholder || 'Select an option'}
              />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'MultiSelect':
        return (
          <MultiSelect
            options={field.options || []}
            value={value || []}
            onChange={onChange}
            placeholder={field.placeholder || 'Select sections...'}
          />
        );

      case 'Checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={value === true}
              onCheckedChange={checked => onChange(checked === true)}
            />
            <Label htmlFor={field.key}>{field.label}</Label>
          </div>
        );

      case 'RadioButtons': {
        const options = field.options ?? [];

        if (options.length === 1) {
          const singleOption = options[0];

          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.key}
                checked={value === singleOption}
                onCheckedChange={checked =>
                  onChange(checked ? singleOption : '')
                }
              />
              <Label htmlFor={field.key}>{singleOption}</Label>
            </div>
          );
        }

        return (
          <RadioGroup
            key={`${field.key}-${rowId}`}
            value={value || ''}
            onValueChange={onChange}
            className="space-y-3"
          >
            {options.map(option => (
              <div
                key={option}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem
                  value={option}
                  id={`${field.key}-${rowId}-${option}`}
                />
                <Label
                  htmlFor={`${field.key}-${rowId}-${option}`}
                  className="cursor-pointer flex-1 text-sm font-medium leading-relaxed"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      }

      case 'InstructionsModal':
        return (
          <PODInstructionsModal
            label={field.label}
            helperText={field.helperText}
          />
        );

      case 'Instructions':
        // Process content to convert escaped newlines to actual newlines
        const processedContent = field.content
          ? field.content
              .replace(/\\\\n/g, '\n') // Convert double-escaped newlines
              .replace(/\\n/g, '\n') // Convert single-escaped newlines
              .replace(/\\"/g, '"') // Convert escaped quotes
          : '';

        return (
          <div className="mb-6 p-4 bg-card border rounded-lg">
            <h3 className="text-lg font-medium text-foreground mb-3">
              {field.key === 'obituary_information_header' && (
                <span className="mr-2">🕊️</span>
              )}
              {field.label}
            </h3>
            {processedContent && (
              <div className="text-sm text-foreground whitespace-pre-line leading-relaxed space-y-2">
                {processedContent.split('\n\n').map((paragraph, index) => (
                  <div key={index} className="space-y-1">
                    {paragraph.split('\n').map((line, lineIndex) => (
                      <div key={lineIndex}>{line}</div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'AccessManagement':
        return (
          <div className="w-full">
            <AccessManagement />
          </div>
        );

      case 'LettersToNextOfKin':
        return (
          <div className="w-full">
            <LettersToNextOfKinField
              value={value}
              onChange={onChange}
              helperText={field.helperText}
              formData={formData}
            />
          </div>
        );

      case 'NextOfKinLetter':
        return (
          <div className="w-full">
            <NextOfKinLetterField
              data={value}
              onChange={onChange}
              formData={formData}
            />
          </div>
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {field.type !== 'TextInputWithUpload' && field.type !== 'Checkbox' && field.type !== 'InstructionsModal' && field.type !== 'Instructions' && field.type !== 'LettersToNextOfKin' && field.type !== 'NextOfKinLetter' && (
        <Label className="flex items-center gap-1">
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {field.helperText && field.type !== 'TextInputWithUpload' && field.type !== 'Checkbox' && field.type !== 'InstructionsModal' && field.type !== 'LettersToNextOfKin' && field.type !== 'NextOfKinLetter' && (
        <p className="text-xs text-muted-foreground">{field.helperText}</p>
      )}
      {field.helperText && field.type === 'Checkbox' && (
        <p className="text-xs text-muted-foreground ml-6">{field.helperText}</p>
      )}
      {renderField()}
    </div>
  );
}