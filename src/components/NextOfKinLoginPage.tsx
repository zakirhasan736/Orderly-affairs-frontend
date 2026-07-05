
'use client';
import React, { useState } from 'react';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Alert, AlertDescription } from '@common/ui/alert';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, User } from 'lucide-react';
import { toast } from 'sonner';

interface NextOfKinLoginPageProps {
  onLoginSuccess: (nokData: any) => void;
  onBackToOwner: () => void;
  formData: any;
}

export const NextOfKinLoginPage: React.FC<NextOfKinLoginPageProps> = ({
  onLoginSuccess,
  onBackToOwner,
  formData,
}) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // const [nextkinLogin] = useNextkinLoginMutation();

  // ✅ Extract access management data (real next-of-kin list)
  const accessData = formData?.['2']?.['2A']?.['access_management_data'];

  const isUsingRealData =
    (Array.isArray(accessData) && accessData.length > 0) ||
    (accessData?.authorized_people &&
      Array.isArray(accessData.authorized_people) &&
      accessData.authorized_people.length > 0);

  // Demo fallback removed — use real access management data only
  const demoPeople: never[] = [];

  // Build the list of people (real data only)
  const authorizedPeople =
    Array.isArray(accessData) && accessData.length > 0
      ? accessData
      : accessData?.authorized_people || demoPeople;

const handleLogin = async () => {
  if (!emailOrPhone || !password) {
    setError('Please fill in both fields.');
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    await onLoginSuccess({
      email: emailOrPhone,
      password,
    });
  } catch (err: any) {
    setError(err?.message || 'Login failed');
  } finally {
    setIsLoading(false);
  }
};



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // prevent double submit
      handleLogin();
    }
  };

  const isFormValid =
    emailOrPhone.trim().length > 0 && password.trim().length > 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Next of Kin Access</h1>
          <p className="text-muted-foreground">
            Enter your registered email and password
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Secure Login</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant={isLocked ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {failedAttempts > 0 && failedAttempts < 3 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {3 - failedAttempts} attempt
                  {3 - failedAttempts !== 1 ? 's' : ''} remaining before
                  lockout.
                </AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={emailOrPhone}
                  onChange={e => setEmailOrPhone(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  disabled={isLocked || isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 pr-10"
                  disabled={isLocked || isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked || isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={!isFormValid || isLocked || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : (
                'Log In'
              )}
            </Button>

           
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" onClick={onBackToOwner} className="text-sm">
            ← Back to Owner Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
