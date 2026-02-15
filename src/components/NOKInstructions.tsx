import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Button } from '@common/ui/button';
import { Badge } from '@common/ui/badge';
import { 
  Heart, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Phone,
  Clock,
  MapPin
} from 'lucide-react';

interface NOKInstructionsProps {
  onOwnerLetterAccess: () => void;
  onDeliverMessages: () => void;
}

export function NOKInstructions({ onOwnerLetterAccess, onDeliverMessages }: NOKInstructionsProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-blue-500" />
            A Gentle Start
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            If you're reading this, it's likely because someone you love has passed, and you're now stepping into the challenging role of organizing what they left behind.
          </p>
          <p>
            First, please know—we're sincerely sorry for your loss. This Orderly Affairs Kit was created to bring you peace and clarity in this moment, when things may feel overwhelming.
          </p>
        </CardContent>
      </Card>

      {/* Important Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Important First Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Button 
              onClick={onOwnerLetterAccess}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 border-pink-200 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-950"
            >
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="font-medium">Read Your Personal Letter</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                Your loved one wrote this specifically for you
              </p>
            </Button>

            <Button 
              onClick={onDeliverMessages}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Deliver Messages to Others</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                Send prepared messages to other family and friends
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Early Tasks Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Next of Kin Early Tasks
            <Badge variant="outline" className="text-xs">Checklist</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            After someone passes away, several practical steps may need to be taken quickly. This list is meant to guide you through those early tasks.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-950/50 dark:border-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm">Notify key people</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Let close family members, trusted friends, neighbors, and employers know. Begin by using the "deliver messages" button above, then check the Friends & Family section for additional contacts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-950/50 dark:border-orange-800">
              <Clock className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm">Begin funeral or memorial arrangements</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Funeral homes can often help with more than just services—they coordinate with hospitals, religious institutions, cemeteries, and organ donation services. Check the End-of-Life Wishes section.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/50 dark:border-red-800">
              <FileText className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm">Request multiple certified copies of the death certificate</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask for at least 10. These will be needed to close accounts, access benefits, transfer titles, and manage the estate. Store these securely in the Fireproof Documents bag.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/50 dark:border-blue-800">
              <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm">Locate legal documents</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Look for a will, trust, power of attorney, and any guardianship papers. The Estate Documents section in this kit can help you find what you need.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What This Kit Is For */}
      <Card>
        <CardHeader>
          <CardTitle>What This Kit Is For</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Managing an estate can be complex, whether you're a spouse, a trustee, a child, or a close friend. Some estates are simple, while others may require formal legal steps like probate.
          </p>
          
          <p className="text-sm">
            Each state has its own rules about what qualifies as a "small estate." It may help to check your state's probate website or speak to a professional to understand what applies in your situation.
          </p>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">This kit holds the information you'll need to:</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Understand and honor your loved one's wishes</li>
              <li>• Locate important documents and accounts</li>
              <li>• Navigate legal, financial, and personal details</li>
            </ul>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/50 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm">A Note About Legal Help</h4>
              <p className="text-xs text-muted-foreground mt-1">
                This kit is not a substitute for legal advice. Every estate is different, and you should consult a licensed attorney or estate expert, especially when dealing with court filings or beneficiary questions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Obituary Content Helper */}
      <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🕊️ Obituary Content (Dove Symbol Pages)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Pages marked with a dove symbol (🕊️) are designed to help you write a meaningful obituary. Your loved one may have already included important details they'd like highlighted, such as life milestones, special memories, and accomplishments.
          </p>
          <p className="text-sm mt-2">
            Use these notes as a guide, and feel free to add your own stories and tributes to capture the complete picture of their life and legacy.
          </p>
        </CardContent>
      </Card>

      {/* State Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Additional Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://orderly-affairs.com/state-specific-probate/', '_blank')}
            className="w-full justify-start"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            State-Specific Probate Information
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Each state handles estates differently, especially based on size or whether a will is present. Visit your local court's website for guidance on what comes next.
          </p>
        </CardContent>
      </Card>

      {/* Use This Kit as Your Anchor */}
      <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Use This Kit as Your Anchor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            Let it hold the financial, legal, and personal threads in one place. Come back to it as often as needed.
          </p>
          <p className="text-sm text-muted-foreground">
            Remember: There's no perfect way to do this. Take your time and reach out for help when you need it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}