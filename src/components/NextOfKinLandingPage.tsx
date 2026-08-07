import React, { useState, useMemo } from 'react';
import { formatVaultSectionTitle, VAULT_NAVIGATION } from '@/utils/vaultNavigation';
import { Button } from '@common/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Badge } from '@common/ui/badge';
// import { Alert, AlertDescription } from '@common/ui/alert';
import { 
  User, 
  Shield, 
  FileText, 
  Heart, 
  Car, 
  Home, 
  CreditCard, 
  Users, 
  GraduationCap, 
  Medal, 
  Banknote, 
  Lock, 
  TrendingUp, 
  Activity, 
  UserCheck, 
  Briefcase, 
  Gem, 
  Scale, 
  Calculator, 
  ScrollText,
  Clock,
  LogOut,
  Mail,
  MessageSquare
} from 'lucide-react';
import { formConfig } from '../config/formConfig';
import { Subsection } from '@/types/formTypes';
interface FormField {
  key: string;
  type: string;
}

interface NextOfKinLandingPageProps {
  nokData: any;
  formData: any;
  onViewSection: (sectionId: string) => void;
  onLogout: () => void;
  onOwnerLetterAccess: () => void;
  onDeliverMessages: () => void;
}

export const NextOfKinLandingPage: React.FC<NextOfKinLandingPageProps> = ({
  nokData,
  formData,
  onViewSection,
  onLogout,
  onOwnerLetterAccess,
  onDeliverMessages
}) => {
  const [sessionTime, setSessionTime] = useState(15 * 60); // 15 minutes in seconds

  // Start session countdown
  React.useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get section icons
  const getSectionIcon = (sectionId: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      '1': <User className="h-5 w-5" />,
      '2': <Car className="h-5 w-5" />,
      '3': <FileText className="h-5 w-5" />,
      '4': <Home className="h-5 w-5" />,
      '5': <Shield className="h-5 w-5" />,
      '6': <Users className="h-5 w-5" />,
      '7': <Heart className="h-5 w-5" />,
      '8': <GraduationCap className="h-5 w-5" />,
      '9': <Medal className="h-5 w-5" />,
      '10': <Banknote className="h-5 w-5" />,
      '11': <Lock className="h-5 w-5" />,
      '12': <TrendingUp className="h-5 w-5" />,
      '13': <Activity className="h-5 w-5" />,
      '14': <CreditCard className="h-5 w-5" />,
      '15': <UserCheck className="h-5 w-5" />,
      '16': <Briefcase className="h-5 w-5" />,
      '17': <Gem className="h-5 w-5" />,
      '18': <Scale className="h-5 w-5" />,
      '19': <Calculator className="h-5 w-5" />,
      '20': <ScrollText className="h-5 w-5" />
    };
    return iconMap[sectionId] || <FileText className="h-5 w-5" />;
  };

  // Get all sections and filter based on access rights
  const allSections = useMemo(() => {
    const order = new Map(VAULT_NAVIGATION.map((s, i) => [s.id, i]));
    return formConfig.chunks
      .flatMap(chunk => chunk.sections)
      .slice()
      .sort(
        (a, b) =>
          (order.get(String(a.id)) ?? 999) - (order.get(String(b.id)) ?? 999),
      );
  }, []);

  const authorizedSections = useMemo(() => {
    if (nokData.access_level === 'Full Kit Access') {
      return allSections;
    }
    
    // Filter sections based on authorized_sections
    const authorizedSectionIds = nokData.authorized_sections || [];
    if (!Array.isArray(authorizedSectionIds)) {
      // If authorized_sections is not an array, try to convert it or return empty
      return [];
    }
    
    return allSections.filter(section => 
      authorizedSectionIds.includes(section.id)
    );
  }, [allSections, nokData]);

  // Calculate completion status for each section
  const getSectionStatus = (sectionId: string) => {
    const sectionData = formData[sectionId];
    if (!sectionData) return { completed: 0, total: 0, status: 'not_provided' };

    // Get section configuration
    const section = allSections.find(s => s.id === sectionId);
    if (!section) return { completed: 0, total: 0, status: 'not_provided' };

    let totalFields = 0;
    let completedFields = 0;

    // Count fields in main section
    if (section.fields) {
      section.fields.forEach((field: FormField) => {
        if (field.type !== 'Instructions') {
          totalFields++;
          const value = sectionData[field.key];
          if (
            value &&
            ((typeof value === 'string' && value.trim().length > 0) ||
              (Array.isArray(value) && value.length > 0) ||
              (typeof value === 'object' && Object.keys(value).length > 0))
          ) {
            completedFields++;
          }
        }
      });
    }

    // Count fields in subsections
    if (section.subsections) {
      section.subsections.forEach((subsection: Subsection) => {
        if (subsection.fields) {
          subsection.fields.forEach((field: FormField) => {
            if (field.type !== 'Instructions') {
              totalFields++;
              const subsectionData = sectionData[subsection.id];
              if (subsectionData) {
                const value = subsectionData[field.key];
                if (
                  value &&
                  ((typeof value === 'string' && value.trim().length > 0) ||
                    (Array.isArray(value) && value.length > 0) ||
                    (typeof value === 'object' &&
                      Object.keys(value).length > 0))
                ) {
                  completedFields++;
                }
              }
            }
          });
        }
      });
    }

    const completionRatio = totalFields > 0 ? completedFields / totalFields : 0;
    let status = 'pending';
    if (completionRatio === 0) status = 'not_provided';
    else if (completionRatio === 1) status = 'complete';
    else status = 'pending';

    return { completed: completedFields, total: totalFields, status };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">✅ Complete</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">⚠️ Pending</Badge>;
      case 'not_provided':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">❌ Not Provided</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Security Banner */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <p className="text-orange-800 dark:text-orange-200">
              <Shield className="h-4 w-4 inline mr-1" />
              Access may be revoked by Kit Owner at any time
            </p>
            <div className="flex items-center gap-4">
              <p className="text-orange-700 dark:text-orange-300">
                <Clock className="h-4 w-4 inline mr-1" />
                Session expires in: {formatTime(sessionTime)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-orange-800 hover:text-orange-900 dark:text-orange-200"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">
              Welcome, {nokData.person_name}
            </h1>
            <p className="text-muted-foreground">
              You have been granted access to the following sections of the Kit.
            </p>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  nokData.access_level === 'Full Kit Access'
                    ? 'default'
                    : 'secondary'
                }
              >
                {nokData.access_level}
              </Badge>
              <span className="text-sm text-muted-foreground">
                • {nokData.relationship}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Authorized Sections */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Authorized Sections</h2>

            <div className="grid gap-4">
              {authorizedSections.map(section => {
                const statusInfo = getSectionStatus(section.id);

                return (
                  <Card
                    key={section.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {getSectionIcon(section.id)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium">
                              {formatVaultSectionTitle(section)}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {section.description ||
                                `Manage and review ${section.title.toLowerCase()} information.`}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              {getStatusBadge(statusInfo.status)}
                              {statusInfo.total > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {statusInfo.completed} of {statusInfo.total}{' '}
                                  items completed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => onViewSection(section.id)}
                          variant="outline"
                          size="sm"
                          className="ml-3"
                        >
                          View Section
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Access Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Access Panel</h2>

            {/* Owner Letter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Owner Letter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Access the Kit Owner&apos;s pre-written instructions and
                  Password Card location details.
                </p>
                <Button
                  onClick={onOwnerLetterAccess}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Open Owner Letter
                </Button>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messages & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Deliver the Kit Owner&apos;s pre-recorded messages and notes
                  to designated loved ones.
                </p>
                <Button
                  onClick={onDeliverMessages}
                  variant="outline"
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Deliver Messages to Loved Ones
                </Button>
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Session Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{nokData.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Relationship:</span>
                  <span>{nokData.relationship}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Access Level:</span>
                  <span>{nokData.access_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Login Time:</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};