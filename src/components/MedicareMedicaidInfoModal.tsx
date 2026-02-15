import React from 'react';
import { Button } from '@common/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@common/ui/dialog';
import { Separator } from '@common/ui/separator';
import { Info, ExternalLink, FileText, Users, Building, Heart } from 'lucide-react';
import { Badge } from '@common/ui/badge';

export function MedicareMedicaidInfoModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Medicare & Medicaid Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-blue-600" />
            Medicare and Medicaid Overview
          </DialogTitle>
          <DialogDescription>
            Comprehensive guide to understanding Medicare and Medicaid programs, including coverage details, organization tips, and helpful resources for managing your healthcare benefits.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Introduction */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm">
              If you're compiling health insurance information, consider using the Insurance section of your folder to
              organize documents. This section is especially helpful if you are collecting details about Medicare or Medicaid,
              as these programs have many components that can be complex to understand and manage.
            </p>
          </div>

          {/* What is Medicare */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">What is Medicare?</h3>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Medicare is a federally administered health insurance program designed primarily for:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-card border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Age-Based</span>
                </div>
                <p className="text-xs text-muted-foreground">People aged 65 and older</p>
              </div>
              
              <div className="bg-card border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Disability</span>
                </div>
                <p className="text-xs text-muted-foreground">Individuals with certain disabilities</p>
              </div>
              
              <div className="bg-card border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">ESRD</span>
                </div>
                <p className="text-xs text-muted-foreground">Those diagnosed with end-stage renal disease</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Medicare consists of several parts:</h4>
              
              <div className="space-y-3">
                <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Part A</Badge>
                    <span className="font-medium">Hospital Insurance</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Covers inpatient hospital stays, skilled nursing facilities, some home health services, and hospice care.
                  </p>
                </div>

                <div className="border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Part B</Badge>
                    <span className="font-medium">Medical Insurance</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Covers doctor visits, outpatient care, durable medical equipment, home health services, and many preventive services.
                  </p>
                </div>

                <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Part C</Badge>
                    <span className="font-medium">Medicare Advantage (MA)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Offered by private insurance companies approved by Medicare, these plans include all Part A and Part B services and may offer additional benefits like prescription drug coverage.
                  </p>
                </div>

                <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Part D</Badge>
                    <span className="font-medium">Prescription Drug Coverage</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Helps cover the cost of outpatient prescription medications.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* What is Medicaid */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">What is Medicaid?</h3>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm mb-3">
                Medicaid is a state-administered program that provides health coverage to certain groups based on income
                and other criteria. Eligibility and benefits may vary from state to state.
              </p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Generally, Medicaid covers:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Children</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Low-income adults</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Pregnant women</span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                Medicaid programs operate under federal guidelines but are managed by individual states.
              </p>
            </div>
          </div>

          <Separator />

          {/* Organizing Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold">Organizing This Information</h3>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm">
                Use this folder to store your Medicare and Medicaid paperwork, enrollment information, and any
                correspondence you receive. This will help your next of kin quickly access essential details when needed.
              </p>
            </div>
          </div>

          <Separator />

          {/* Helpful Resources */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Helpful Resources</h3>
            </div>
            
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm mb-3">For more detailed information, visit:</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://www.cms.gov/Outreach-and-Education/Medicare-Learning-Network-MLN/MLNProducts/Downloads/ProgramBasics.pdf', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                CMS Program Basics Guide
              </Button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              This information is provided for educational purposes. Always consult with Medicare, Medicaid, or healthcare professionals for specific guidance about your coverage.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}