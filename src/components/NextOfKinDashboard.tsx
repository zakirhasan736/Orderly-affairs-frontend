import React, { useState, useEffect } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Badge } from '@common/ui/badge';
import { Alert, AlertDescription } from '@common/ui/alert';
import { Shield, User, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface LoginAttempt {
  id: string;
  personName: string;
  relationship: string;
  email: string;
  accessLevel: string;
  authorizedSections?: string[];
  loginTime: Date;
  isActive: boolean;
  ipAddress?: string;
}

interface NextOfKinDashboardProps {
  ownerName: string;
  onRevokeAccess: (attemptId: string) => void;
  onRevokeAll: () => void;
}

export function NextOfKinDashboard({ ownerName, onRevokeAccess, onRevokeAll }: NextOfKinDashboardProps) {
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Simulate login attempts for demo
  useEffect(() => {
    const mockAttempts: LoginAttempt[] = [
      {
        id: '1',
        personName: 'Sarah Johnson',
        relationship: 'Daughter',
        email: 'sarah.johnson@email.com',
        accessLevel: 'Full Kit Access',
        loginTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        isActive: true,
        ipAddress: '192.168.1.105'
      },
      {
        id: '2',
        personName: 'Michael Thompson',
        relationship: 'Attorney',
        email: 'michael@lawfirm.com',
        accessLevel: 'Section-Specific Access',
        authorizedSections: ['18. Legal Documents', '20. Estate Planning', '19. Tax Information'],
        loginTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        isActive: false,
        ipAddress: '10.0.0.45'
      },
      {
        id: '3',
        personName: 'Jennifer Martinez',
        relationship: 'Spouse',
        email: 'jen.martinez@email.com',
        accessLevel: 'Full Kit Access',
        loginTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        isActive: false,
        ipAddress: '192.168.1.102'
      }
    ];
    setLoginAttempts(mockAttempts);
  }, []);

  const handleRevokeAccess = (attemptId: string) => {
    setLoginAttempts(prev => prev.map(attempt => 
      attempt.id === attemptId ? { ...attempt, isActive: false } : attempt
    ));
    onRevokeAccess(attemptId);
    toast.success('Access revoked successfully');
  };

  const handleRevokeAll = () => {
    setLoginAttempts(prev => prev.map(attempt => ({ ...attempt, isActive: false })));
    onRevokeAll();
    toast.success('All active sessions have been revoked');
  };

  const filteredAttempts = showActiveOnly 
    ? loginAttempts.filter(attempt => attempt.isActive)
    : loginAttempts;

  const activeSessionsCount = loginAttempts.filter(attempt => attempt.isActive).length;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Kit Access Dashboard
          </h2>
          <p className="text-muted-foreground">Monitor and manage access to {ownerName}'s Orderly Affairs Kit</p>
        </div>
        
        {activeSessionsCount > 0 && (
          <Button
            onClick={handleRevokeAll}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Revoke All ({activeSessionsCount})
          </Button>
        )}
      </div>

      {/* Active Sessions Alert */}
      {activeSessionsCount > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{activeSessionsCount} active session{activeSessionsCount !== 1 ? 's' : ''}</strong>
            {activeSessionsCount === 1 ? ' is' : ' are'} currently accessing the kit. 
            You can revoke access immediately if needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Options */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-active-only"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="show-active-only" className="text-sm font-medium">
            Show active sessions only
          </label>
        </div>
        <Badge variant="secondary">
          {filteredAttempts.length} session{filteredAttempts.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Login Attempts List */}
      {filteredAttempts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {showActiveOnly ? 'No active sessions' : 'No login attempts yet'}
            </h3>
            <p className="text-muted-foreground text-center">
              {showActiveOnly 
                ? 'No one is currently accessing the kit.' 
                : 'When authorized people log in, their access attempts will appear here.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAttempts.map((attempt) => (
            <Card key={attempt.id} className={`${attempt.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${attempt.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{attempt.personName}</span>
                        <Badge variant={attempt.accessLevel === 'Full Kit Access' ? 'default' : 'secondary'}>
                          {attempt.accessLevel === 'Full Kit Access' ? 'Full Access' : 'Limited Access'}
                        </Badge>
                        {attempt.isActive && (
                          <Badge className="bg-green-500 text-white">Active</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {attempt.relationship} • {attempt.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(attempt.loginTime)}
                      </div>
                      {attempt.ipAddress && (
                        <div className="text-xs">IP: {attempt.ipAddress}</div>
                      )}
                    </div>
                    
                    {attempt.isActive && (
                      <Button
                        onClick={() => handleRevokeAccess(attempt.id)}
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        Revoke Access
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              
              {attempt.accessLevel === 'Section-Specific Access' && attempt.authorizedSections && (
                <CardContent className="pt-0">
                  <div className="bg-white border rounded-lg p-3">
                    <h4 className="text-sm font-medium mb-2">Authorized Sections:</h4>
                    <div className="flex flex-wrap gap-1">
                      {attempt.authorizedSections.map((section, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Summary Information */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{activeSessionsCount}</div>
              <div className="text-sm text-muted-foreground">Active Sessions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{loginAttempts.length}</div>
              <div className="text-sm text-muted-foreground">Total Logins</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {loginAttempts.filter(a => a.accessLevel === 'Full Kit Access').length}
              </div>
              <div className="text-sm text-muted-foreground">Full Access</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {loginAttempts.filter(a => a.accessLevel === 'Section-Specific Access').length}
              </div>
              <div className="text-sm text-muted-foreground">Limited Access</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Security Notes</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• You will receive email/SMS notifications for all login attempts</li>
            <li>• Revoked sessions will immediately lose access to the kit</li>
            <li>• Each person's access is logged with timestamps and IP addresses</li>
            <li>• You can update or remove authorized people at any time</li>
            <li>• Use "Revoke All" in emergency situations to lock down all access</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}