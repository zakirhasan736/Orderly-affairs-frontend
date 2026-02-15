import React, { useState } from 'react';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Alert, AlertDescription } from '@common/ui/alert';
import { Badge } from '@common/ui/badge';
import { Shield, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

interface AuthorizedPerson {
  person_name: string;
  relationship: string;
  email_address: string;
  phone_number: string;
  access_level: string;
  authorized_sections?: string[];
  master_password: string;
}

interface NextOfKinLoginProps {
  authorizedPeople: AuthorizedPerson[];
  onLogin: (person: AuthorizedPerson) => void;
  onNotifyOwner: (person: AuthorizedPerson, loginTime: Date) => void;
}

export function NextOfKinLogin({ authorizedPeople, onLogin, onNotifyOwner }: NextOfKinLoginProps) {
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [loginAttempt, setLoginAttempt] = useState<{
    success: boolean;
    person?: AuthorizedPerson;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setLoginAttempt(null);

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find matching person
    const matchedPerson = authorizedPeople.find(person => 
      (person.email_address.toLowerCase() === contact.toLowerCase() || 
       person.phone_number === contact) && 
      person.master_password === password
    );

    if (matchedPerson) {
      const loginTime = new Date();
      setLoginAttempt({
        success: true,
        person: matchedPerson,
        message: `Welcome, ${matchedPerson.person_name}! You have ${matchedPerson.access_level.toLowerCase()}.`
      });
      
      // Notify owner
      onNotifyOwner(matchedPerson, loginTime);
      
      // Proceed to kit access
      setTimeout(() => {
        onLogin(matchedPerson);
      }, 2000);
    } else {
      setLoginAttempt({
        success: false,
        message: 'Invalid email/phone or password. Please check your credentials and try again.'
      });
    }

    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contact && password) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Orderly Affairs Kit</h1>
          <p className="text-muted-foreground">Next of Kin Access Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Secure Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="contact">Email Address or Phone Number</Label>
                <Input
                  id="contact"
                  type="text"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="Enter your registered email or phone"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Master Access Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your unique master password"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find this password on your Password Card
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!contact || !password || isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Access Kit'}
              </Button>
            </form>

            {loginAttempt && (
              <Alert
                className={`mt-4 ${loginAttempt.success ? 'border-green-500' : 'border-red-500'}`}
              >
                <div className="flex items-center gap-2">
                  {loginAttempt.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription>{loginAttempt.message}</AlertDescription>
                </div>

                {loginAttempt.success && loginAttempt.person && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Access Level:</span>
                      <Badge
                        variant={
                          loginAttempt.person.access_level === 'Full Kit Access'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {loginAttempt.person.access_level}
                      </Badge>
                    </div>

                    {loginAttempt.person.access_level ===
                      'Section-Specific Access' &&
                      loginAttempt.person.authorized_sections && (
                        <div className="text-sm">
                          <span className="font-medium">
                            Authorized Sections:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {loginAttempt.person.authorized_sections.map(
                              section => (
                                <Badge
                                  key={section}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {section}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    <div className="text-xs text-muted-foreground">
                      Redirecting to kit access...
                    </div>
                  </div>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
            <p className="text-blue-700">
              If you don&apos;t have your Password Card or are having trouble
              accessing the kit, please contact the kit owner directly.
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            This is a secure portal. All access attempts are logged and the kit
            owner will be notified of successful logins.
          </p>
        </div>
      </div>
    </div>
  );
}