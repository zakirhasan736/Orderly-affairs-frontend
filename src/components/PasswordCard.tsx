import React from 'react';
import { Button } from '@common/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Download, Printer, Clock } from 'lucide-react';

interface PasswordCardProps {
  personName: string;
  relationship: string;
  email: string;
  phone?: string;
  masterPassword: string;
  accessLevel: string;
  authorizedSections?: string[];
  immediateAccess?: boolean;
  onDownload?: () => void;
  onPrint?: () => void;
}

export function PasswordCard({
  personName,
  relationship,
  email,
  phone,
  masterPassword,
  accessLevel,
  authorizedSections,
  immediateAccess,
  onDownload,
  onPrint
}: PasswordCardProps) {
  const generateCard = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ORDERLY AFFAIRS KIT PASSWORD CARD</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 20px; 
      background: white;
      color: black;
    }
    .card { 
      border: 2px solid #000; 
      padding: 20px; 
      max-width: 500px; 
      margin: 0 auto;
      background: white;
    }
    .header { 
      text-align: center; 
      border-bottom: 1px solid #000; 
      padding-bottom: 15px; 
      margin-bottom: 20px; 
    }
    .title { 
      font-size: 18px; 
      font-weight: bold; 
      margin-bottom: 5px; 
    }
    .subtitle { 
      font-size: 14px; 
      color: #666; 
    }
    .section { 
      margin-bottom: 15px; 
    }
    .label { 
      font-weight: bold; 
      font-size: 12px; 
      color: #333; 
      text-transform: uppercase; 
    }
    .value { 
      font-size: 14px; 
      margin-top: 2px; 
      padding: 5px; 
      border: 1px solid #ccc; 
      background: #f9f9f9; 
    }
    .password { 
      font-family: monospace; 
      font-size: 16px; 
      font-weight: bold; 
      background: #ffeb3b; 
      border: 2px solid #f57c00; 
    }
    .instructions { 
      background: #e8f5e8; 
      border: 1px solid #4caf50; 
      padding: 10px; 
      margin-top: 20px; 
      font-size: 12px; 
    }
    .access-sections { 
      background: #f0f8ff; 
      border: 1px solid #2196f3; 
      padding: 8px; 
      margin-top: 5px; 
      font-size: 11px; 
    }
    .warning { 
      background: #ffe6e6; 
      border: 1px solid #f44336; 
      padding: 10px; 
      margin-top: 15px; 
      font-size: 11px; 
      text-align: center; 
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">ORDERLY AFFAIRS KIT</div>
      <div class="subtitle">PASSWORD CARD</div>
    </div>
    
    <div class="section">
      <div class="label">Authorized Person</div>
      <div class="value">${personName}</div>
    </div>
    
    <div class="section">
      <div class="label">Relationship</div>
      <div class="value">${relationship}</div>
    </div>
    
    <div class="section">
      <div class="label">Contact Information</div>
      <div class="value">
        Email: ${email}<br>
        Phone: ${phone}
      </div>
    </div>
    
    <div class="section">
      <div class="label">Master Access Password</div>
      <div class="value password">${masterPassword}</div>
    </div>
    
    <div class="section">
      <div class="label">Access Level</div>
      <div class="value">${accessLevel}</div>
      ${accessLevel === 'Section-Specific Access' && authorizedSections ? `
      <div class="access-sections">
        <strong>Authorized Sections:</strong><br>
        ${authorizedSections.join(', ')}
      </div>
      ` : ''}
    </div>
    
    <div class="instructions">
      <strong>ACCESS INSTRUCTIONS:</strong><br>
      1. Go to the Next of Kin Login page<br>
      2. Enter your registered email or phone number<br>
      3. Enter your Master Access Password exactly as shown above<br>
      4. You will have access to the sections specified by the kit owner
    </div>
    
    <div class="warning">
      <strong>⚠️ IMPORTANT SECURITY NOTICE ⚠️</strong><br>
      Keep this card in a secure location. Do not share the password directly with others. 
      Only share the location where this card is stored.
    </div>
  </div>
</body>
</html>`;
  };

  const handleDownload = () => {
    const htmlContent = generateCard();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `password-card-${personName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  const handlePrint = () => {
    const htmlContent = generateCard();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      onPrint?.();
    }
  };

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle className="text-center">Password Card Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div>
            <span className="font-semibold">Authorized Person:</span> {personName}
          </div>
          <div>
            <span className="font-semibold">Relationship:</span> {relationship}
          </div>
          <div>
            <span className="font-semibold">Contact:</span> {email} | {phone}
          </div>
          <div>
            <span className="font-semibold">Master Password:</span> 
            <code className="bg-yellow-200 px-2 py-1 ml-2 rounded border">{masterPassword}</code>
          </div>
          <div>
            <span className="font-semibold">Access Level:</span> {accessLevel}
          </div>
          {accessLevel === 'Section-Specific Access' && authorizedSections && (
            <div className="bg-blue-50 p-3 rounded border">
              <span className="font-semibold">Authorized Sections:</span>
              <div className="text-sm mt-1">{authorizedSections.join(', ')}</div>
            </div>
          )}
          {immediateAccess && (
            <div className="bg-purple-50 p-3 rounded border-2 border-purple-500">
              <div className="flex items-center gap-2 font-semibold text-purple-900">
                <Clock className="h-4 w-4" />
                Immediate Access Granted
              </div>
              <div className="text-sm mt-1 text-purple-700">
                This person can log in and access the kit NOW, even before passing.
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-center">
          <Button onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Card
          </Button>
          <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Card
          </Button>
        </div>

        <div className="text-sm text-muted-foreground bg-orange-50 p-3 rounded border">
          <strong>⚠️ Important:</strong> After generating this card, store it in a secure location 
          (like your Fireproof Document Bag) and only tell this person where to find it. 
          Do not give them the password directly.
        </div>
      </CardContent>
    </Card>
  );
}