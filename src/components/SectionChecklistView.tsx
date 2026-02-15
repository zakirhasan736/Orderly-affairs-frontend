import React, { useMemo } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import { Badge } from '@common/ui/badge';
import { Alert, AlertDescription } from '@common/ui/alert';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FolderOpen,
  Clock,
  LogOut,
  Shield
} from 'lucide-react';
import { formConfig } from '../config/formConfig';
import { toast } from 'sonner';
interface FormField {
  key: string;
  type: string;
  label?: string;
  helperText?: string;
}

interface SectionChecklistViewProps {
  sectionId: string;
  nokData: any;
  formData: any;
  onBack: () => void;
  onLogout: () => void;
  sessionTime: number;
}

export const SectionChecklistView: React.FC<SectionChecklistViewProps> = ({
  sectionId,
  nokData,
  formData,
  onBack,
  onLogout,
  sessionTime
}) => {
  // Get section configuration
  const section = useMemo(() => {
    const allSections = formConfig.chunks.flatMap(chunk => chunk.sections);
    return allSections.find(s => s.id === sectionId);
  }, [sectionId]);

  // Extract checklist items from section data
  const checklistItems = useMemo(() => {
    if (!section || !formData[sectionId]) return [];

    const sectionData = formData[sectionId];
    const items: any[] = [];

    // Process main section fields
    if (section.fields) {
      section.fields.forEach((field: FormField) => {
        if (field.type !== 'Instructions') {
          const value = sectionData[field.key];
          const status = getFieldStatus(value);

          items.push({
            id: field.key,
            title: field.label,
            type: 'field',
            status,
            storageLocation: getStorageLocation(field, value),
            description: field.helperText || '',
            value: value,
          });
        }
      });
    }

    // Process subsections
    if (section.subsections) {
      section.subsections.forEach((subsection: any) => {
        const subsectionData = sectionData[subsection.id];
        
        if (subsection.fields) {
          subsection.fields.forEach((field: any) => {
            if (field.type !== 'Instructions') {
              const value = subsectionData?.[field.key];
              const status = getFieldStatus(value);
              
              items.push({
                id: `${subsection.id}_${field.key}`,
                title: `${subsection.title}: ${field.label}`,
                type: 'subsection_field',
                subsectionId: subsection.id,
                status,
                storageLocation: getStorageLocation(field, value),
                description: field.helperText || '',
                value: value
              });
            }
          });
        }

        // Handle repeatable items
        if (subsectionData && Array.isArray(subsectionData)) {
          subsectionData.forEach((item, index) => {
            items.push({
              id: `${subsection.id}_item_${index}`,
              title: `${subsection.title} #${index + 1}`,
              type: 'repeatable_item',
              subsectionId: subsection.id,
              status: 'complete',
              storageLocation: getStorageLocation({}, item),
              description: getItemDescription(item),
              value: item
            });
          });
        }
      });
    }

    return items;
  }, [section, formData, sectionId]);

  const getFieldStatus = (value: any) => {
    if (!value) return 'not_provided';
    
    if (typeof value === 'string') {
      return value.trim().length > 0 ? 'complete' : 'not_provided';
    }
    
    if (Array.isArray(value)) {
      return value.length > 0 ? 'complete' : 'not_provided';
    }
    
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length > 0 ? 'complete' : 'not_provided';
    }
    
    return value ? 'complete' : 'not_provided';
  };

  const getStorageLocation = (field: any, value: any) => {
    // Check if there's upload data indicating storage location
    if (value && typeof value === 'object' && value.uploadData) {
      return 'Digital Upload';
    }
    
    // Default storage locations based on section
    const defaultLocations: Record<string, string> = {
      '3': 'Fireproof Document Bag',
      '5': 'Insurance Policy Folder',
      '9': 'Military Records Folder',
      '10': 'Bank Statements Folder',
      '12': 'Investment Account Folder',
      '13': 'Medical Records Folder',
      '14': 'Financial Documents Folder',
      '18': 'Legal Documents Folder',
      '20': 'Estate Planning Folder'
    };
    
    return defaultLocations[sectionId] || 'Fireproof Document Bag';
  };

  const getItemDescription = (item: any) => {
    // Generate description based on item content
    const keys = Object.keys(item);
    const nonEmptyValues = keys
      .filter(key => item[key] && typeof item[key] === 'string' && item[key].trim().length > 0)
      .slice(0, 3)
      .map(key => item[key]);
    
    return nonEmptyValues.join(', ') || 'Item details available';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'not_provided':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Complete</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      case 'not_provided':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Not Provided</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExportPDF = () => {
    // Mock PDF export functionality
    toast.success('Checklist exported as PDF');
    // In real implementation, this would generate and download a PDF
  };

  const handlePrint = () => {
    // Mock print functionality
    window.print();
    toast.success('Print dialog opened');
  };

  const stats = useMemo(() => {
    const complete = checklistItems.filter(item => item.status === 'complete').length;
    const pending = checklistItems.filter(item => item.status === 'pending').length;
    const notProvided = checklistItems.filter(item => item.status === 'not_provided').length;
    const total = checklistItems.length;
    
    return { complete, pending, notProvided, total };
  }, [checklistItems]);

  if (!section) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Section not found or access denied.</AlertDescription>
        </Alert>
      </div>
    );
  }

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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{section.title} Checklist</h1>
              <p className="text-sm text-muted-foreground">
                Viewing items accessible to {nokData.person_name} ({nokData.relationship})
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="container mx-auto px-4 py-4">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold text-green-600">{stats.complete}</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-red-600">{stats.notProvided}</div>
                <div className="text-sm text-muted-foreground">Not Provided</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checklist Items */}
      <div className="container mx-auto px-4 pb-6">
        <div className="space-y-3">
          {checklistItems.map((item) => (
            <Card key={item.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.title}</h3>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        )}
                        {item.value && typeof item.value === 'string' && item.value.length < 100 && (
                          <p className="text-xs text-foreground mt-1 font-mono bg-muted p-1 rounded">
                            {item.value}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FolderOpen className="h-3 w-3" />
                        <span>Stored in: {item.storageLocation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {checklistItems.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No items found in this section.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};