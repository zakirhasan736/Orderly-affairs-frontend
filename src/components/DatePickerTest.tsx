import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@common/ui/card';
import { DatePicker, DatePickerStandard, DatePickerCompact, DatePickerNoIcon } from './DatePicker';
import { Button } from '@common/ui/button';
import { Label } from '@common/ui/label';

export function DatePickerTest() {
  const [standardDate, setStandardDate] = useState<string>('');
  const [compactDate, setCompactDate] = useState<string>('');
  const [noIconDate, setNoIconDate] = useState<string>('');
  const [errorDate, setErrorDate] = useState<string>('');
  const [disabledDate, setDisabledDate] = useState<string>('2023-12-25');

  const clearAllDates = () => {
    setStandardDate('');
    setCompactDate('');
    setNoIconDate('');
    setErrorDate('');
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>DatePicker Component Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Testing the standardized DatePicker component based on the "Date of Birth" field design.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Standard DatePicker */}
          <div className="space-y-2">
            <Label>DatePicker/Standard (Default)</Label>
            <DatePickerStandard
              value={standardDate}
              onChange={(value) => setStandardDate(value || '')}
              placeholder="MM / DD / YYYY"
            />
            <p className="text-xs text-muted-foreground">
              Current value: {standardDate || 'None selected'}
            </p>
          </div>

          {/* Compact DatePicker */}
          <div className="space-y-2">
            <Label>DatePicker/Compact</Label>
            <DatePickerCompact
              value={compactDate}
              onChange={(value) => setCompactDate(value || '')}
              placeholder="MM / DD / YYYY"
            />
            <p className="text-xs text-muted-foreground">
              Current value: {compactDate || 'None selected'}
            </p>
          </div>

          {/* No Icon DatePicker */}
          <div className="space-y-2">
            <Label>DatePicker/NoIcon</Label>
            <DatePickerNoIcon
              value={noIconDate}
              onChange={(value) => setNoIconDate(value || '')}
              placeholder="MM / DD / YYYY"
            />
            <p className="text-xs text-muted-foreground">
              Current value: {noIconDate || 'None selected'}
            </p>
          </div>

          {/* Error State DatePicker */}
          <div className="space-y-2">
            <Label>DatePicker with Error State</Label>
            <DatePicker
              value={errorDate}
              onChange={(value) => setErrorDate(value || '')}
              placeholder="MM / DD / YYYY"
              error={true}
              errorMessage="Please select a valid date"
            />
            <p className="text-xs text-muted-foreground">
              Current value: {errorDate || 'None selected'}
            </p>
          </div>

          {/* Disabled DatePicker */}
          <div className="space-y-2">
            <Label>DatePicker (Disabled)</Label>
            <DatePicker
              value={disabledDate}
              onChange={(value) => setDisabledDate(value || '')}
              placeholder="MM / DD / YYYY"
              disabled={true}
            />
            <p className="text-xs text-muted-foreground">
              Current value: {disabledDate || 'None selected'}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={clearAllDates} variant="outline">
              Clear All Dates
            </Button>
            <Button 
              onClick={() => {
                const today = new Date().toISOString();
                setStandardDate(today);
                setCompactDate(today);
                setNoIconDate(today);
                setErrorDate(today);
              }}
              variant="outline"
            >
              Set All to Today
            </Button>
          </div>

          {/* Design System Specifications */}
          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Design System Specifications</h4>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p>• <strong>Font:</strong> Same as DOB field (SF Pro Rounded, 14px, normal weight)</p>
              <p>• <strong>Corner radius:</strong> 10px (same as DOB field)</p>
              <p>• <strong>Field height:</strong> 40px (same as DOB field)</p>
              <p>• <strong>Border color (default):</strong> #E0E0E0</p>
              <p>• <strong>Border color (focus):</strong> #213D59 (Orderly Affairs brand color)</p>
              <p>• <strong>Background:</strong> White</p>
              <p>• <strong>Placeholder color:</strong> #A6A6A6</p>
              <p>• <strong>Text color:</strong> #000000</p>
              <p>• <strong>Selected date color:</strong> #213D59</p>
              <p>• <strong>Hover effect:</strong> Light gray background (#F7F7F7)</p>
              <p>• <strong>Calendar icon:</strong> Same as DOB field (#213D59)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}