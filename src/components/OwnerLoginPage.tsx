import React, { useState, useEffect } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Alert, AlertDescription } from '@common/ui/alert';
import { Badge } from '@common/ui/badge';
import { Eye, EyeOff, Mail, Lock, Shield, ArrowLeft, AlertCircle, Smartphone, MessageSquare, Phone } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';


interface OwnerLoginPageProps {
  onLoginSuccess: (userData: any) => void;
  onCreateAccount: () => void;
}

type LoginStep = 'credentials' | 'mfa_method_selection' | 'mfa_setup' | 'mfa_verify' | 'first_time_setup';
type MFAMethod = 'authenticator' | 'email' | 'sms';

export function OwnerLoginPage({ onLoginSuccess }: OwnerLoginPageProps) {
  // Form state
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // MFA method selection
  const [selectedMFAMethod, setSelectedMFAMethod] = useState<MFAMethod>('authenticator');
  const [backupEmail, setBackupEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Validation state
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    score: 0
  });

  // Clear error when user starts typing
  useEffect(() => {
    setError('');
  }, [email, password, confirmPassword, mfaCode, backupEmail, phoneNumber]);

  // Password strength validation
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ length: false, uppercase: false, lowercase: false, number: false, special: false, score: 0 });
      return;
    }

    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    setPasswordStrength({ ...checks, score });
  }, [password]);

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Get password strength color and text
  const getPasswordStrengthInfo = () => {
    const { score } = passwordStrength;
    if (score === 0) return { color: 'text-gray-400', text: 'No password entered', bgColor: 'bg-gray-200' };
    if (score <= 2) return { color: 'text-red-600', text: 'Weak password', bgColor: 'bg-red-200' };
    if (score <= 3) return { color: 'text-yellow-600', text: 'Fair password', bgColor: 'bg-yellow-200' };
    if (score <= 4) return { color: 'text-blue-600', text: 'Good password', bgColor: 'bg-blue-200' };
    return { color: 'text-green-600', text: 'Strong password', bgColor: 'bg-green-200' };
  };

  // Demo users for testing
  const demoUsers = [
    {
      email: 'owner@orderlyaffairs.com',
      password: 'StrongPassword123!',
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      mfaMethod: 'authenticator',
      backupEmail: 'backup@orderlyaffairs.com',
      phoneNumber: '+1234567890',
      lastLogin: new Date().toISOString()
    },
    {
      email: 'test@example.com',
      password: 'SecurePass456!',
      mfaSecret: 'KVKFKRCPNZQUYMLX',
      mfaMethod: 'email',
      backupEmail: 'test.backup@example.com',
      phoneNumber: '+1987654321',
      lastLogin: new Date().toISOString()
    }
  ];

  // Handle login/register
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      if (isNewUser) {
        // Registration flow
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        if (passwordStrength.score < 4) {
          throw new Error('Please create a stronger password with at least 4 of the required criteria');
        }

        // Check if user already exists
        const existingUser = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }

        // Set up MFA for new user
        setStep('mfa_method_selection');
      } else {
        // Login flow
        const userExists = demoUsers.find(u => 
          u.email.toLowerCase() === email.toLowerCase()
        );

        if (!userExists) {
          throw new Error('Account not found. Please register or check your email address.');
        }

        // Simulate password verification
        if (userExists.password !== password) {
          throw new Error('Invalid password');
        }
        
        // Check if MFA is already set up
        if (userExists.mfaSecret || userExists.mfaMethod) {
          setSelectedMFAMethod(
            (userExists.mfaMethod as MFAMethod) || 'authenticator',
          );

          setBackupEmail(userExists.backupEmail || '');
          setPhoneNumber(userExists.phoneNumber || '');
          setStep('mfa_verify');
          
          // For email/SMS, auto-send verification code
          if (userExists.mfaMethod === 'email' || userExists.mfaMethod === 'sms') {
            setTimeout(async () => {
              try {
                await sendVerificationCode();
              } catch (error) {
                console.error('Failed to send verification code:', error);
              }
            }, 500);
          }
        } else {
          // First time login - choose MFA method
          setStep('mfa_method_selection');
        }
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA setup completion
  const handleMFASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      if (mfaCode.length !== 6) {
        throw new Error('Please enter a valid 6-digit code');
      }

      let isValidCode = false;
      
      if (selectedMFAMethod === 'authenticator') {
        // For TOTP, verify against the secret
        isValidCode = verifyTOTPCode(mfaSecret, mfaCode);
      } else {
        // For email/SMS, accept any 6-digit code (in production, verify against sent code)
        isValidCode = /^\d{6}$/.test(mfaCode);
      }
      
      if (!isValidCode) {
        throw new Error('Invalid verification code. Please try again.');
      }

      // Create user account with MFA
      const userData = {
        email,
        password,
        mfaSecret: selectedMFAMethod === 'authenticator' ? mfaSecret : '',
        mfaMethod: selectedMFAMethod,
        backupEmail: selectedMFAMethod === 'email' ? backupEmail : '',
        phoneNumber: selectedMFAMethod === 'sms' ? phoneNumber : '',
        isFirstLogin: false,
        lastLogin: new Date().toISOString()
      };

      // Save user to localStorage (in production, use real database)
      localStorage.setItem('orderlyAffairsUser', JSON.stringify(userData));
      
      toast.success('MFA setup completed successfully!');
      onLoginSuccess(userData);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Setup failed');
      toast.error(error instanceof Error ? error.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA verification for returning users
  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      if (mfaCode.length !== 6) {
        throw new Error('Please enter a valid 6-digit code');
      }

      // Find user data
      const userData = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!userData) {
        throw new Error('User not found');
      }

      let isValidCode = false;

      if (userData.mfaMethod === 'authenticator' || (userData.mfaSecret && !userData.mfaMethod)) {
        // For TOTP, verify against the secret
        isValidCode = verifyTOTPCode(userData.mfaSecret, mfaCode);
      } else if (userData.mfaMethod === 'email' || userData.mfaMethod === 'sms') {
        // For email/SMS, accept any 6-digit code (in production, verify against sent code)
        isValidCode = /^\d{6}$/.test(mfaCode);
      } else {
        // Legacy users with mfaSecret but no mfaMethod (backward compatibility)
        isValidCode = verifyTOTPCode(userData.mfaSecret, mfaCode);
      }

      if (!isValidCode) {
        throw new Error('Invalid verification code. Please try again.');
      }

      // Update last login
      const updatedUserData = {
        ...userData,
        lastLogin: new Date().toISOString()
      };

      localStorage.setItem('orderlyAffairsUser', JSON.stringify(updatedUserData));
      
      toast.success('Login successful!');
      onLoginSuccess(updatedUserData);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed');
      toast.error(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Generate MFA secret
  const generateMFASecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  // Generate QR code URL (simplified for demo)
  const generateQRCodeUrl = (email: string, secret: string) => {
    const issuer = 'Orderly Affairs';
    const label = encodeURIComponent(`${issuer}:${email}`);
    const otpauth = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
  };

  // Verify TOTP code (simplified for demo)
  const verifyTOTPCode = (secret: string, code: string) => {
    // In production, use a proper TOTP library
    // For demo purposes, accept any 6-digit code
    return /^\d{6}$/.test(code);
  };

  // Handle MFA method selection
  const handleMFAMethodSelection = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate inputs based on selected method
      if (selectedMFAMethod === 'email') {
        if (!isValidEmail(backupEmail)) {
          throw new Error('Please enter a valid backup email address');
        }
      }
      
      if (selectedMFAMethod === 'sms' && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\D/g, ''))) {
        setError('Please enter a valid phone number');
        return;
      }

      // Setup MFA based on selected method
      if (selectedMFAMethod === 'authenticator') {
        const secret = generateMFASecret();
        const qrUrl = generateQRCodeUrl(email, secret);
        
        setMfaSecret(secret);
        setQrCodeUrl(qrUrl);
      }

      setStep('mfa_setup');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Setup failed');
      toast.error(error instanceof Error ? error.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  // Send verification code for email/SMS
  const sendVerificationCode = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setVerificationSent(true);
      toast.success(`Verification code sent to ${selectedMFAMethod === 'email' ? backupEmail : phoneNumber}`);
    } catch (error) {
      setError('Failed to send verification code');
      toast.error('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    setVerificationSent(false);
    await sendVerificationCode();
  };

  // Handle back navigation
  const handleBack = () => {
    setError('');
    setMfaCode('');
    setVerificationSent(false);
    
    if (step === 'mfa_verify' || step === 'mfa_setup') {
      if (isNewUser) {
        setStep('mfa_method_selection');
      } else {
        setStep('credentials');
      }
    } else if (step === 'mfa_method_selection') {
      setStep('credentials');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src={'/images/brand-logo.png'}
              alt="Orderly Affairs Logo"
              className="h-16 w-auto"
              width={120}
              height={64}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {step === 'credentials'
                ? isNewUser
                  ? 'Create Your Account'
                  : 'Welcome Back'
                : step === 'mfa_method_selection'
                  ? 'Choose Security Method'
                  : step === 'mfa_setup'
                    ? 'Set Up Two-Factor Authentication'
                    : 'Enter Verification Code'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {step === 'credentials'
                ? isNewUser
                  ? 'Set up your secure Orderly Affairs account'
                  : 'Sign in to your Orderly Affairs account'
                : step === 'mfa_method_selection'
                  ? 'Select your preferred two-factor authentication method'
                  : step === 'mfa_setup'
                    ? 'Complete your security setup'
                    : 'Enter the code to verify your identity'}
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="glass-card">
          <CardContent className="p-6">
            {/* Back Button */}
            {step !== 'credentials' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-4 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}

            {/* Error Alert */}
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Credentials Step */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="login-input-with-icon enhanced-field-frame"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="login-input-with-icon enhanced-field-frame"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Password strength indicator for new users */}
                {isNewUser && password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Password Strength
                      </span>
                      <span
                        className={`text-sm ${getPasswordStrengthInfo().color}`}
                      >
                        {getPasswordStrengthInfo().text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          getPasswordStrengthInfo().bgColor
                        }`}
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div
                        className={
                          passwordStrength.length
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }
                      >
                        ✓ 12+ characters
                      </div>
                      <div
                        className={
                          passwordStrength.uppercase
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }
                      >
                        ✓ Uppercase letter
                      </div>
                      <div
                        className={
                          passwordStrength.lowercase
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }
                      >
                        ✓ Lowercase letter
                      </div>
                      <div
                        className={
                          passwordStrength.number
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }
                      >
                        ✓ Number
                      </div>
                      <div
                        className={
                          passwordStrength.special
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }
                      >
                        ✓ Special character
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm password for new users */}
                {isNewUser && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="login-input-with-icon enhanced-field-frame"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-red-600">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? 'Please wait...'
                    : isNewUser
                      ? 'Create Account'
                      : 'Sign In'}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => {
                      setIsNewUser(!isNewUser);
                      setError('');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-sm"
                  >
                    {isNewUser
                      ? 'Already have an account? Sign in'
                      : 'Need an account? Create one'}
                  </Button>
                </div>
              </form>
            )}

            {/* MFA Method Selection Step */}
            {step === 'mfa_method_selection' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Choose how you&apos;d like to receive verification codes for
                    two-factor authentication:
                  </p>

                  <div className="space-y-3">
                    {/* Authenticator App Option */}
                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="mfaMethod"
                        value="authenticator"
                        checked={selectedMFAMethod === 'authenticator'}
                        onChange={e =>
                          setSelectedMFAMethod(e.target.value as MFAMethod)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Smartphone className="h-4 w-4 text-primary" />
                          <span className="font-medium">Authenticator App</span>
                          <Badge variant="secondary" className="text-xs">
                            Most Secure
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Use Google Authenticator, Authy, or similar apps.
                          Works offline and provides the highest security.
                        </p>
                      </div>
                    </label>

                    {/* Email Option */}
                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="mfaMethod"
                        value="email"
                        checked={selectedMFAMethod === 'email'}
                        onChange={e =>
                          setSelectedMFAMethod(e.target.value as MFAMethod)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">
                            Email Verification
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Convenient
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Receive codes via email. Requires internet access to
                          receive codes.
                        </p>
                      </div>
                    </label>

                    {/* SMS Option */}
                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="mfaMethod"
                        value="sms"
                        checked={selectedMFAMethod === 'sms'}
                        onChange={e =>
                          setSelectedMFAMethod(e.target.value as MFAMethod)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-green-500" />
                          <span className="font-medium">SMS/Text Message</span>
                          <Badge variant="outline" className="text-xs">
                            Universal
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Receive codes via text message. Works with any phone,
                          requires cellular service.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Additional inputs based on selection */}
                {selectedMFAMethod === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="backupEmail">Backup Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="backupEmail"
                        type="email"
                        value={backupEmail}
                        onChange={e => setBackupEmail(e.target.value)}
                        placeholder="Enter backup email for codes"
                        className="login-input-with-icon enhanced-field-frame"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This should be different from your main login email for
                      security.
                    </p>
                  </div>
                )}

                {selectedMFAMethod === 'sms' && (
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="login-input-with-icon enhanced-field-frame"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Include country code. Standard messaging rates may apply.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleMFAMethodSelection}
                  className="w-full btn-primary"
                  disabled={
                    loading ||
                    (selectedMFAMethod === 'email' && !backupEmail) ||
                    (selectedMFAMethod === 'sms' && !phoneNumber)
                  }
                >
                  {loading ? 'Setting up...' : 'Continue'}
                </Button>
              </div>
            )}

            {/* MFA Setup Step */}
            {step === 'mfa_setup' && (
              <div className="space-y-4">
                {selectedMFAMethod === 'authenticator' ? (
                  <>
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Scan this QR code with your authenticator app (Google
                        Authenticator, Authy, etc.) to set up two-factor
                        authentication.
                      </AlertDescription>
                    </Alert>

                    <div className="text-center space-y-4">
                      <div className="bg-white p-4 rounded-lg inline-block">
                        <img
                          src={qrCodeUrl}
                          alt="MFA QR Code"
                          className="w-48 h-48"
                        />
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p>Can&apos;t scan? Manual entry key:</p>
                        <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                          {mfaSecret}
                        </code>
                      </div>
                    </div>
                  </>
                ) : selectedMFAMethod === 'email' ? (
                  <>
                    <Alert>
                      <Mail className="h-4 w-4" />
                      <AlertDescription>
                        {verificationSent
                          ? `A verification code has been sent to ${backupEmail}. Please enter the 6-digit code below.`
                          : `We'll send a verification code to ${backupEmail} to complete setup.`}
                      </AlertDescription>
                    </Alert>

                    {!verificationSent && (
                      <div className="text-center">
                        <Button
                          onClick={sendVerificationCode}
                          className="btn-primary"
                          disabled={loading}
                        >
                          {loading ? 'Sending...' : 'Send Verification Code'}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Alert>
                      <MessageSquare className="h-4 w-4" />
                      <AlertDescription>
                        {verificationSent
                          ? `A verification code has been sent to ${phoneNumber}. Please enter the 6-digit code below.`
                          : `We'll send a verification code to ${phoneNumber} to complete setup.`}
                      </AlertDescription>
                    </Alert>

                    {!verificationSent && (
                      <div className="text-center">
                        <Button
                          onClick={sendVerificationCode}
                          className="btn-primary"
                          disabled={loading}
                        >
                          {loading ? 'Sending...' : 'Send Verification Code'}
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {(selectedMFAMethod === 'authenticator' ||
                  verificationSent) && (
                  <form onSubmit={handleMFASetup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mfaCode">Verification Code</Label>
                      <Input
                        id="mfaCode"
                        type="text"
                        value={mfaCode}
                        onChange={e =>
                          setMfaCode(
                            e.target.value.replace(/\D/g, '').slice(0, 6),
                          )
                        }
                        placeholder="Enter 6-digit code"
                        className="text-center text-lg tracking-wider enhanced-field-frame"
                        maxLength={6}
                        required
                      />
                    </div>

                    {selectedMFAMethod !== 'authenticator' &&
                      verificationSent && (
                        <div className="text-center">
                          <Button
                            type="button"
                            onClick={handleResendCode}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                          >
                            {loading ? 'Sending...' : 'Resend Code'}
                          </Button>
                        </div>
                      )}

                    <Button
                      type="submit"
                      className="w-full btn-primary"
                      disabled={loading || mfaCode.length !== 6}
                    >
                      {loading ? 'Verifying...' : 'Complete Setup'}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* MFA Verification Step */}
            {step === 'mfa_verify' && (
              <div className="space-y-4">
                {selectedMFAMethod === 'authenticator' ? (
                  <Alert>
                    <Smartphone className="h-4 w-4" />
                    <AlertDescription>
                      Open your authenticator app and enter the 6-digit code for
                      Orderly Affairs.
                    </AlertDescription>
                  </Alert>
                ) : selectedMFAMethod === 'email' ? (
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      {verificationSent
                        ? `Enter the verification code sent to ${backupEmail}.`
                        : `We'll send a verification code to ${backupEmail}.`}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <MessageSquare className="h-4 w-4" />
                    <AlertDescription>
                      {verificationSent
                        ? `Enter the verification code sent to ${phoneNumber}.`
                        : `We'll send a verification code to ${phoneNumber}.`}
                    </AlertDescription>
                  </Alert>
                )}

                {selectedMFAMethod !== 'authenticator' && !verificationSent && (
                  <div className="text-center">
                    <Button
                      onClick={sendVerificationCode}
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send Verification Code'}
                    </Button>
                  </div>
                )}

                {(selectedMFAMethod === 'authenticator' ||
                  verificationSent) && (
                  <form onSubmit={handleMFAVerify} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mfaCode">Verification Code</Label>
                      <Input
                        id="mfaCode"
                        type="text"
                        value={mfaCode}
                        onChange={e =>
                          setMfaCode(
                            e.target.value.replace(/\D/g, '').slice(0, 6),
                          )
                        }
                        placeholder="Enter 6-digit code"
                        className="text-center text-lg tracking-wider enhanced-field-frame"
                        maxLength={6}
                        required
                      />
                    </div>

                    {selectedMFAMethod !== 'authenticator' &&
                      verificationSent && (
                        <div className="text-center">
                          <Button
                            type="button"
                            onClick={handleResendCode}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                          >
                            {loading ? 'Sending...' : 'Resend Code'}
                          </Button>
                        </div>
                      )}

                    <Button
                      type="submit"
                      className="w-full btn-primary"
                      disabled={loading || mfaCode.length !== 6}
                    >
                      {loading ? 'Verifying...' : 'Verify & Sign In'}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert className="glass-card">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Orderly Affairs uses bank-level security to protect your sensitive
            information. Your data is encrypted and secure.
          </AlertDescription>
        </Alert>

        {/* Demo Credentials */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <h3 className="text-sm font-medium">Demo Credentials</h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <strong>Email:</strong> owner@orderlyaffairs.com
                </p>
                <p>
                  <strong>Password:</strong> StrongPassword123!
                </p>
                <p className="text-blue-600">✓ Authenticator App MFA</p>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <strong>Email:</strong> test@example.com
                </p>
                <p>
                  <strong>Password:</strong> SecurePass456!
                </p>
                <p className="text-green-600">✓ Email MFA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}