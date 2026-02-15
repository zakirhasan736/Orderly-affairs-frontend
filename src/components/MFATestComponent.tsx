import React, { useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Alert, AlertDescription } from '@common/ui/alert';
import { Badge } from '@common/ui/badge';
import { Shield, Smartphone, CheckCircle2, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function MFATestComponent() {
  const [testSecret] = useState('JBSWY3DPEHPK3PXP'); // Base32 test secret
  const [testCode, setTestCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<{ success: boolean; timestamp: number } | null>(null);

  // Generate a time-based code for testing (simplified TOTP)
  const generateTimeBasedCode = () => {
    const now = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(now / 30); // 30-second window
    // Simplified: just use the time step to generate a "valid" 6-digit code
    const code = String(timeStep % 1000000).padStart(6, '0');
    return code;
  };

  const validateMFACode = async () => {
    if (!testCode || testCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsValidating(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, accept the generated time-based code or any code ending in '123'
      const validCode = generateTimeBasedCode();
      const isValid = testCode === validCode || testCode.endsWith('123');

      setLastValidation({
        success: isValid,
        timestamp: Date.now()
      });

      if (isValid) {
        toast.success('✅ MFA code verified successfully!');
      } else {
        toast.error('❌ Invalid MFA code. Try using a code ending in "123" for testing.');
      }

    } catch (error) {
      toast.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(testSecret);
    toast.success('Secret copied to clipboard');
  };

  const generateTestCode = () => {
    const code = generateTimeBasedCode();
    setTestCode(code);
    toast.info(`Generated test code: ${code}`);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>MFA Testing Tool</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              This tool demonstrates MFA functionality. Use an authenticator app with the test secret below, or use the "Generate Test Code" button.
            </AlertDescription>
          </Alert>

          {/* Test Secret */}
          <div className="space-y-2">
            <Label>Test MFA Secret</Label>
            <div className="flex items-center gap-2">
              <Input
                value={testSecret}
                readOnly
                className="font-mono text-sm enhanced-field-frame"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copySecret}
                className="flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add this secret to Google Authenticator or Authy as "Orderly Affairs Test"
            </p>
          </div>

          {/* QR Code Info */}
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-sm font-medium">Manual Entry Instructions:</p>
            <p className="text-xs text-muted-foreground mt-1">
              Account: test@orderlyaffairs.com<br />
              Key: {testSecret}<br />
              Type: Time-based (TOTP)
            </p>
          </div>

          {/* Test Code Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="testCode">Enter MFA Code</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateTestCode}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Generate Test Code
              </Button>
            </div>
            <Input
              id="testCode"
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-lg tracking-wider enhanced-field-frame"
              maxLength={6}
            />
            <p className="text-xs text-muted-foreground">
              💡 Tip: Any code ending in "123" will be accepted for testing
            </p>
          </div>

          {/* Validate Button */}
          <Button
            onClick={validateMFACode}
            disabled={isValidating || testCode.length !== 6}
            className="w-full btn-primary"
          >
            {isValidating ? 'Validating...' : 'Validate Code'}
          </Button>

          {/* Last Validation Result */}
          {lastValidation && (
            <Alert variant={lastValidation.success ? 'default' : 'destructive'}>
              {lastValidation.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    {lastValidation.success ? 'Code Valid' : 'Code Invalid'}
                  </span>
                  <Badge variant={lastValidation.success ? 'default' : 'destructive'}>
                    {new Date(lastValidation.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Current Time-Based Code Display */}
          <div className="p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Valid Code:</span>
              <Badge variant="outline" className="font-mono">
                {generateTimeBasedCode()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This code changes every 30 seconds (simplified for demo)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}