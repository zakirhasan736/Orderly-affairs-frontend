import React, { useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Badge } from '@common/ui/badge';
import { Check, X, User, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { VAULT_NAVIGATION } from '@/utils/vaultNavigation';

interface OwnerNotificationModalProps {
  nokData: any;
  onApprove: () => void;
  onRevoke: () => void;
  onClose: () => void;
}

export const OwnerNotificationModal: React.FC<OwnerNotificationModalProps> = ({
  nokData,
  onApprove: _onApprove,
  onRevoke,
  onClose
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRevoke = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`Access denied for ${nokData.person_name}`);
      onRevoke();
    } finally {
      setIsProcessing(false);
    }
  };

  const getSectionNames = (sectionIds: string[]) => {
    return sectionIds.map(id => {
      const section = VAULT_NAVIGATION.find(s => s.id === id);
      return section?.title || `Section ${id}`;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Access Notification</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Requestor Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{nokData.person_name}</span>
              <Badge variant="secondary" className="text-xs">
                {nokData.relationship}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Email: {nokData.email_address || nokData.email}</p>
              {(nokData.phone_number || nokData.phone) && <p>Phone: {nokData.phone_number || nokData.phone}</p>}
            </div>
          </div>

          {/* Access Level */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Granted Access Level:</span>
            </div>
            
            <div className="ml-6">
              <Badge 
                variant={nokData.access_level === 'Full Kit Access' ? 'default' : 'secondary'}
                className="mb-2"
              >
                {nokData.access_level}
              </Badge>
              
              {nokData.access_level === 'Specific Sections' && nokData.authorized_sections.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Authorized Sections:</p>
                  <div className="space-y-1">
                    {getSectionNames(nokData.authorized_sections).map((sectionName, index) => (
                      <div key={index} className="text-sm ml-2">
                        • {sectionName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Auto-Approval Notice */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800 dark:text-green-200">Living access is not automatic</p>
                <p className="text-green-700 dark:text-green-300">
                  Release access from Access Management: confirm, then re-enter your
                  password. They receive login details immediately. If that was not
                  what you intended, revoke their access from the email.
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Security Notice</p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  If this access request was not expected or authorized, click "Deny Access" immediately to revoke their session.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleRevoke}
              disabled={isProcessing}
              variant="destructive"
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Deny Access
            </Button>
          </div>

          {/* Acknowledge Button */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
            disabled={isProcessing}
          >
            Acknowledge & Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};