import React from 'react';
import { Button } from '@common/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Alert, AlertDescription } from '@common/ui/alert';
import { Download, X, FileText, Heart, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface OwnerLetterModalProps {
  nokData: any;
  onClose: () => void;
}

export const OwnerLetterModal: React.FC<OwnerLetterModalProps> = ({
  nokData,
  onClose
}) => {
  if (!nokData) {
    return null;
  }

  const handleDownloadPDF = () => {
    toast.success('Owner Letter PDF downloaded');
    // In real implementation, this would download the actual PDF
  };

  const ownerLetter = `
Dear ${nokData.full_name},

If you are reading this letter, it means you have been granted access to my Orderly Affairs Kit. Thank you for taking on this important responsibility during what I know is a difficult time.

I have chosen you as my ${nokData.relationship.toLowerCase()} to help manage my affairs because I trust you completely. This Kit contains important information about my life, finances, and wishes, and I know you will handle it with the care and attention it deserves.

IMPORTANT INFORMATION FOR YOU:

Your Master Access Password Card Location:
The physical Password Card with your unique access credentials is stored in my Fireproof Document Bag, located in the main bedroom closet, top shelf, in the blue safety case. This card contains:
- Your unique Master Access Password
- Emergency contact information
- Additional instructions specific to your role

What You Can Access:
Based on your authorization level (${nokData.access_level}), you have access to ${nokData.access_level === 'Full Kit Access' ? 'all sections of my Kit' : 'specific sections that are relevant to your responsibilities'}. Please use this access responsibly and only for the purposes I have outlined.

Important Guidelines:
1. Keep all information confidential and secure
2. Only share details with other authorized family members when necessary
3. Use the checklist features to track what needs to be done
4. Contact my attorney or financial advisor if you need professional guidance
5. Remember that you can export or print any checklists you need

Special Messages:
I want you to know how grateful I am for your willingness to help with these matters. I chose you because of your organizational skills, your trustworthiness, and your caring nature. Please don't feel overwhelmed - take things one step at a time, and don't hesitate to ask for help from the professionals I've listed in the Kit.

If you need immediate assistance:
- My primary attorney: Contact information in Legal Documents section
- My financial advisor: Contact information in Investment section  
- My accountant: Contact information in Tax Information section

Take care of yourself during this time, and know that having this Kit organized is my way of trying to make things a little easier for you and the family.

With love and gratitude,

[Kit Owner's Name]
[Date Kit was Last Updated]

P.S. There may be additional personal messages for you and other family members that can be delivered through the "Messages & Notes" feature in your access panel. These are separate from this letter and contain more personal thoughts I wanted to share.
  `;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl mx-auto max-h-[90vh] flex flex-col   bg-white">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Kit Owner's Letter</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Personal instructions and guidance for {nokData.person_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          <Alert className="mb-6">
            <Heart className="h-4 w-4" />
            <AlertDescription>
              This letter was written specifically for you by the Kit Owner. It
              contains important information about your responsibilities and
              where to find your access credentials.
            </AlertDescription>
          </Alert>

          <div className="bg-muted/30 rounded-lg p-6 space-y-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {ownerLetter.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-4 leading-relaxed">
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Password Card Location Reminder
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Your Master Access Password Card is stored in the Fireproof
                  Document Bag, located in the main bedroom closet, top shelf,
                  in the blue safety case.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};