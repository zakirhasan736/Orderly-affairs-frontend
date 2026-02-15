import React from 'react';
import { Button } from '@common/ui/button';

interface QuickPermissionTestProps {
  onClose: () => void;
}

export function QuickPermissionTest({ onClose }: QuickPermissionTestProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white p-4 rounded-lg max-w-md">
        <h3 className="text-lg font-medium mb-4">Quick Permission Test</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This component would test camera/microphone permissions quickly.
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}