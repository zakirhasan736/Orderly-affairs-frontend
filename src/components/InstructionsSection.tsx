import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Checkbox } from '@common/ui/checkbox';
import { Label } from '@common/ui/label';

interface InstructionsSectionProps {
  data: any;
  onChange: (data: any) => void;
}

export function InstructionsSection({ data, onChange }: InstructionsSectionProps) {
  const handleMarkAsRead = (checked: boolean) => {
    onChange({ ...data, markAsRead: checked });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1A – Instructions (Owner)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3>Important Instructions</h3>
            <div className="space-y-2 text-sm">
              <p>• Please complete all required fields in each section</p>
              <p>• Upload clear, readable copies of all requested documents</p>
              <p>• For photo uploads, ensure good lighting and all text is visible</p>
              <p>• Save your progress regularly - the form auto-saves on each entry</p>
              <p>• If you need to add multiple entries (vehicles, accounts, etc.), use the "Add Another" button</p>
              <p>• Contact support if you encounter any technical issues</p>
              <p>• Review all information before final submission</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-6">
            <Checkbox 
              id="mark-as-read" 
              checked={data.markAsRead || false}
              onCheckedChange={handleMarkAsRead}
            />
            <Label htmlFor="mark-as-read" className="text-sm">
              Mark as Read - I have read and understood these instructions
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}