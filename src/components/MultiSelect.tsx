import React, { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@common/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@common/ui/popover';
import { Badge } from '@common/ui/badge';

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, value = [], onChange, placeholder = "Select items...", className }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter(item => item !== option)
      : [...value, option];
    onChange(newValue);
  };

  const handleRemove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(item => item !== option));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };
 
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={`w-full justify-between min-h-10 ${className}`}
        >
          <div className="flex flex-wrap gap-1 mr-2">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {value.slice(0, 2).map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="text-xs px-2 py-0.5"
                  >
                    {item}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={(e) => handleRemove(item, e)}
                    />
                  </Badge>
                ))}
                {value.length > 2 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    +{value.length - 2} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {value.length > 0 && (
              <X
                className="h-4 w-4 cursor-pointer hover:text-destructive"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-60 overflow-auto">
          {options.map((option) => {
            const isSelected = value.includes(option);
            return (
              <div
                key={option}
                className={`flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-muted ${
                  isSelected ? 'bg-muted' : ''
                }`}
                onClick={() => handleSelect(option)}
              >
                <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                  isSelected ? 'bg-primary border-primary' : 'border-input'
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span className="text-sm">{option}</span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}