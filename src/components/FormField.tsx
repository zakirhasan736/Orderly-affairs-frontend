import React, { useRef } from 'react';
import { Input } from '@common/ui/input';
import { Textarea } from '@common/ui/textarea';
import { Button } from '@common/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@common/ui/select';
import { RadioGroup, RadioGroupItem } from '@common/ui/radio-group';
import { Label } from '@common/ui/label';
import { Upload } from 'lucide-react';
import { DatePicker } from './DatePicker';
// Using built-in date formatting instead of date-fns for simplicity

interface FormFieldProps {
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'radio' | 'upload';
  value: any;
  onChange: (value: any) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

export function FormField({ label, type, value, onChange, options = [], placeholder, required }: FormFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file.name);
    }
  };

  const renderField = () => {
    switch (type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[100px]"
          />
        );

      case 'date':
        return (
          <DatePicker
            value={value}
            onChange={onChange}
            placeholder={placeholder || "MM / DD / YYYY"}
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent className="z-[200] max-h-[min(60dvh,320px)]">
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange}>
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'upload':
        return (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
            {value && (
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {value}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {renderField()}
    </div>
  );
}