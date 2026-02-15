import React, { useState } from 'react';
import { Button } from '@common/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@common/ui/dialog';
import { Info, CheckCircle } from 'lucide-react';

interface PODInstructionsModalProps {
  label: string;
  helperText?: string;
}

export const PODInstructionsModal = React.forwardRef<
  HTMLDivElement,
  PODInstructionsModalProps
>(({ label, helperText }, ref) => {
  const [open, setOpen] = useState(false);

  const instructions = [
    {
      step: 1,
      title: "Contact Your Bank",
      description: "Call or visit your bank and ask for a Payable on Death (POD) or Transfer on Death (TOD) designation form."
    },
    {
      step: 2,
      title: "Provide Beneficiary Information",
      description: "You'll need the full legal name, date of birth, and possibly Social Security number of the person you want to name."
    },
    {
      step: 3,
      title: "Complete the Form",
      description: "Fill out and sign the POD form; some banks may require a notary or in-branch signature."
    },
    {
      step: 4,
      title: "Submit to the Bank",
      description: "Return the completed form to your bank. Ask for a copy for your records."
    },
    {
      step: 5,
      title: "Review Regularly",
      description: "Check your POD designations after major life events (marriage, divorce, new children, etc.) to ensure they remain up to date."
    }
  ];

  return (
    <div ref={ref} className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2 h-auto py-8 px-8 text-left justify-start min-h-[120px]"
          >
            <div className="flex items-center gap-2 flex-1">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">{label}</div>
                {helperText && (
                  <div className="text-sm text-muted-foreground mt-1">{helperText}</div>
                )}
              </div>
            </div>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Info className="h-6 w-6 text-blue-500" />
              How to Assign a Payable on Death (POD) Beneficiary
            </DialogTitle>
            <DialogDescription className="text-base">
              Follow these step-by-step instructions to properly set up POD beneficiaries with your bank.
              This process helps ensure your account funds transfer directly to your beneficiary, potentially avoiding probate.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            {instructions.map((instruction) => (
              <div key={instruction.step} className="flex gap-4 p-4 rounded-lg bg-muted/50 border">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                    {instruction.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2">{instruction.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {instruction.description}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                    Why Set Up POD Beneficiaries?
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Payable on Death designations allow your account funds to transfer directly to your named 
                    beneficiary upon your passing, potentially avoiding the probate process and ensuring faster 
                    access to funds for your loved ones.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6 pt-4 border-t">
            <Button onClick={() => setOpen(false)} className="px-6">
              Got it, thanks!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

PODInstructionsModal.displayName = "PODInstructionsModal";