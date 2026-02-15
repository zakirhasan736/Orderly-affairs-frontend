import React from 'react';
import { Button } from '@common/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Alert, AlertDescription } from '@common/ui/alert';
import { Lock, AlertTriangle, Shield } from 'lucide-react';

interface RevocationModalProps {
  reason?: string;
  onClose: () => void;
}

export const RevocationModal: React.FC<RevocationModalProps> = ({
  reason = "Access revoked by Kit Owner. Your session has ended.",
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto border-red-200 dark:border-red-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-lg text-red-800 dark:text-red-200">
            Access Revoked
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-left">
              {reason}
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Your access to the Orderly Affairs Kit has been terminated.</p>
            <p>If you believe this was an error, please contact the Kit Owner directly.</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Security Notice</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This action has been logged for security purposes. 
              The Kit Owner has been notified of this session termination.
            </p>
          </div>

          <Button
            onClick={onClose}
            className="w-full"
            variant="default"
          >
            Return to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};