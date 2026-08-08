import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
import {
  asPlainFieldText,
  getAiFieldDisplayLabel,
  resolveClosestOption,
} from '@/utils/aiPatchNormalizer';
import { MultiSelect } from './MultiSelect';
import { AccessManagement } from './AccessManagement';
import { LettersToNextOfKinField } from './LettersToNextOfKinField';
import { NextOfKinLetterField } from './NextOfKinLetterField';
import { useFamilyAcl } from '@/contexts/FamilyAclContext';
import { fieldShouldMask } from '@/utils/sensitiveFields';
import { cn } from '@common/ui/utils';


interface DynamicFormFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  formData?: any; // Add formData to check conditional fields
  isVisible?: boolean; // Allow parent to control visibility
  rowId?: string;
  className?: string; // Allow custom CSS classes
  lettersClearNonce?: number;
}

export function DynamicFormField({ field, value, onChange, formData, rowId, isVisible = true, className, lettersClearNonce }: DynamicFormFieldProps) {
  const { isReadOnly } = useFamilyAcl();
  // Plain inputs must never receive `{ text, files }` (shows as "[object Object]").
  const rawValue = value !== undefined && value !== null ? value : (field.defaultValue || '');
  const currentValue =
    field.type === 'TextInput' ||
    field.type === 'TextArea' ||
    field.type === 'DatePicker' ||
    field.type === 'DateInput'
      ? asPlainFieldText(rawValue)
      : rawValue;
  const isMaskedField = fieldShouldMask(field);
  const [showSecret, setShowSecret] = useState(false);
  // If there's a default value and no current value, set it
  React.useEffect(() => {
    if (isReadOnly) return;
    if (field.defaultValue && (value === undefined || value === null || value === '')) {
      onChange(field.defaultValue);
    }
  }, [field.defaultValue, value, onChange, isReadOnly]);

  // Re-mask when navigating to another row/field so secrets don't stay revealed.
  React.useEffect(() => {
    setShowSecret(false);
  }, [field.key, rowId]);

  const lockedOnChange = (next: any) => {
    if (isReadOnly) return;
    onChange(next);
  };

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
      case 'TextInput': {
        return (
          <div className="relative w-full">
            <Input
              value={currentValue}
              onChange={e => lockedOnChange(e.target.value)}
              placeholder={field.placeholder}
              readOnly={isReadOnly}
              autoComplete={isMaskedField ? 'off' : undefined}
              type={
                isMaskedField
                  ? showSecret
                    ? 'text'
                    : 'password'
                  : field.inputType || 'text'
              }
              className={cn(
                className || 'w-full',
                isReadOnly && 'cursor-default bg-slate-50',
                isMaskedField && 'pr-20',
              )}
            />
            {isMaskedField && (
              <button
                type="button"
                data-oa-view-ok
                onClick={() => setShowSecret(prev => !prev)}
                className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label={showSecret ? 'Hide value' : 'Show value'}
                title={showSecret ? 'Hide' : 'Show'}
              >
                {showSecret ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                <span>{showSecret ? 'Hide' : 'Show'}</span>
              </button>
            )}
          </div>
        );
      }

      case 'TextArea':
        return (
          <div className="relative w-full">
            <Textarea
              value={
                isMaskedField && !showSecret && currentValue
                  ? '•'.repeat(Math.min(String(currentValue).length || 8, 24))
                  : currentValue
              }
              onChange={e => {
                if (isMaskedField && !showSecret) return;
                lockedOnChange(e.target.value);
              }}
              onFocus={() => {
                if (isMaskedField && !showSecret) setShowSecret(true);
              }}
              placeholder={field.placeholder}
              className={`w-full min-h-30${isReadOnly ? ' cursor-default bg-slate-50' : ''}${isMaskedField ? ' pr-20' : ''}`}
              readOnly={
                isReadOnly ||
                (isMaskedField && !showSecret) ||
                (field.defaultValue !== undefined &&
                  field.defaultValue.includes('•'))
              }
            />
            {isMaskedField && (
              <button
                type="button"
                data-oa-view-ok
                onClick={() => setShowSecret(prev => !prev)}
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label={showSecret ? 'Hide value' : 'Show value'}
              >
                {showSecret ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                <span>{showSecret ? 'Hide' : 'Show'}</span>
              </button>
            )}
          </div>
        );

      case 'TextInputWithUpload':
        return (
          <TextInputWithUpload
            label={getAiFieldDisplayLabel(field)}
            value={value}
            onChange={lockedOnChange}
            placeholder={field.placeholder}
            helperText={field.helperText}
            disabled={isReadOnly}
            sensitive={isMaskedField}
          />
        );

      case 'DatePicker':
      case 'DateInput':
        return (
          <DatePicker
            value={value}
            onChange={lockedOnChange}
            placeholder="MM / DD / YYYY"
            className={className || 'w-full'}
            disabled={isReadOnly}
          />
        );

      case 'Dropdown': {
        let selectValue = '';
        if (typeof value === 'string' || typeof value === 'number') {
          selectValue = String(value);
        } else if (value && typeof value === 'object') {
          const record = value as Record<string, unknown>;
          selectValue = String(
            record.label ??
              record.name ??
              record.value ??
              record.text ??
              record.title ??
              '',
          );
        }
        const options = field.options || [];
        const knownValue =
          resolveClosestOption(selectValue, options) ||
          (options.includes(selectValue) ? selectValue : '');
        return (
          <Select
            value={knownValue}
            onValueChange={lockedOnChange}
            disabled={isReadOnly}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  selectValue && !knownValue
                    ? selectValue
                    : field.placeholder || 'Select an option'
                }
              />
            </SelectTrigger>
            <SelectContent className="z-[200] max-h-[min(60dvh,320px)]">
              {options.map(option => (
                <SelectItem key={option} value={option}>
                  {field.optionLabels?.[option] ?? option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      case 'MultiSelect':
        return (
          <MultiSelect
            options={field.options || []}
            value={value || []}
            onChange={lockedOnChange}
            placeholder={field.placeholder || 'Select sections...'}
            disabled={isReadOnly}
          />
        );

      case 'Checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              disabled={isReadOnly}
              checked={
                value === true ||
                value === 'true' ||
                value === 'yes' ||
                value === 'Yes' ||
                value === 1 ||
                value === '1'
              }
              onCheckedChange={checked => lockedOnChange(checked === true)}
            />
            <Label htmlFor={field.key}>{field.label}</Label>
          </div>
        );

      case 'RadioButtons': {
        const options = field.options ?? [];

        if (options.length === 1) {
          const singleOption = options[0];
          const checked =
            value === singleOption ||
            value === true ||
            value === 'true' ||
            value === 'yes' ||
            value === 'Yes' ||
            value === 1 ||
            value === '1';

          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.key}
                disabled={isReadOnly}
                checked={checked}
                onCheckedChange={checkedNext =>
                  lockedOnChange(checkedNext ? singleOption : '')
                }
              />
              <Label htmlFor={field.key}>{singleOption}</Label>
            </div>
          );
        }

        const radioValue =
          resolveClosestOption(value, options) ||
          (typeof value === 'string' ? value : '') ||
          '';

        return (
          <RadioGroup
            key={`${field.key}-${rowId}`}
            value={radioValue}
            onValueChange={lockedOnChange}
            disabled={isReadOnly}
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
              onChange={lockedOnChange}
              helperText={field.helperText}
              formData={formData}
              clearNonce={lettersClearNonce}
            />
          </div>
        );

      case 'NextOfKinLetter':
        return (
          <div className="w-full">
            <NextOfKinLetterField
              data={value}
              onChange={lockedOnChange}
              formData={formData}
            />
          </div>
        );

      default:
        return (
          <div className="relative w-full">
            <Input
              value={asPlainFieldText(value) || ''}
              onChange={e => lockedOnChange(e.target.value)}
              placeholder={field.placeholder}
              readOnly={isReadOnly}
              autoComplete={isMaskedField ? 'off' : undefined}
              type={
                isMaskedField ? (showSecret ? 'text' : 'password') : 'text'
              }
              className={cn(
                'w-full',
                isReadOnly && 'cursor-default bg-slate-50',
                isMaskedField && 'pr-20',
              )}
            />
            {isMaskedField && (
              <button
                type="button"
                data-oa-view-ok
                onClick={() => setShowSecret(prev => !prev)}
                className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label={showSecret ? 'Hide value' : 'Show value'}
              >
                {showSecret ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                <span>{showSecret ? 'Hide' : 'Show'}</span>
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      {field.type !== 'TextInputWithUpload' && field.type !== 'Checkbox' && field.type !== 'InstructionsModal' && field.type !== 'Instructions' && field.type !== 'LettersToNextOfKin' && field.type !== 'NextOfKinLetter' && (
        <Label className="flex items-center gap-1">
          {getAiFieldDisplayLabel(field)}
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