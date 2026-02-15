
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Textarea } from '@common/ui/textarea';
import { Calendar } from '@common/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@common/ui/popover';
import { Button } from '@common/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@common/ui/dialog';
import {
  Calendar as CalendarIcon,
  FileText,
  Users,
  Mail,
  Printer,
  Download,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

// ✅ hooks that accept optional nokId
import {
  useGetNokLetterQuery,
  useSaveNokLetterMutation,
} from '@/services/nokLetterApi';

interface NextOfKinLetterFieldProps {
  data: any;
  onChange: (data: any) => void;
  formData?: any;
  /** the selected NOK user _id (role=nextkin) this letter is for */
  selectedNokId?: string;
}

function isValidEmail(v?: string) {
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function NextOfKinLetterField({
  data,
  onChange,
  selectedNokId,
}: NextOfKinLetterFieldProps) {
  // pass nokId into the GET
  const {
    data: serverData,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetNokLetterQuery(
    selectedNokId ? { nokId: selectedNokId } : undefined
  );

  // POST upsert that includes nokId
  const [saveLetter, { isLoading: isSaving }] = useSaveNokLetterMutation();

  const [localData, setLocalData] = useState<any>(data || {});
  const debTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);
  const hydratedOnce = useRef(false);

  // 1) hydrate from server on first load or refetch
  useEffect(() => {
    if (!serverData) return;
    setLocalData(serverData);
    onChange(serverData);
    hydratedOnce.current = true;
  }, [serverData]); // eslint-disable-line

  // 2) keep local in sync if parent updates externally
  useEffect(() => {
    if (!data) return;
    const a = JSON.stringify(data);
    const b = JSON.stringify(localData);
    if (a !== b) setLocalData(data);
  }, [data]); // eslint-disable-line

  // 3) debounced autosave (after first hydration and not while fetching)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!hydratedOnce.current) return;
    if (isFetching) return;

    if (debTimer.current) clearTimeout(debTimer.current);
    debTimer.current = setTimeout(async () => {
      try {
        await saveLetter({
          nokId: selectedNokId, // <-- send the target NOK
          body: {
            letter_date: localData.letter_date || undefined,
            letter_to: localData.letter_to || undefined,
            letter_greeting: localData.letter_greeting || undefined,
            letter_opening: localData.letter_opening || undefined,
            kit_description: localData.kit_description || undefined,
            access_url: localData.access_url || undefined,
            login_credentials_text:
              localData.login_credentials_text || undefined,

            // let server autofill if blank
            nok_email: localData.nok_email || undefined,
            nok_phone: localData.nok_phone || undefined,
            password_card_location:
              localData.password_card_location || undefined,

            accessible_sections: localData.accessible_sections || undefined,
            key_bag_info: localData.key_bag_info || undefined,
            key_bag_location: localData.key_bag_location || undefined,
            documents_bag_info: localData.documents_bag_info || undefined,
            documents_bag_location:
              localData.documents_bag_location || undefined,
            incomplete_kit_message:
              localData.incomplete_kit_message || undefined,
            closing_message: localData.closing_message || undefined,
            letter_signature: localData.letter_signature || undefined,
          },
        }).unwrap();
      } catch {
        toast.error('Could not save NOK letter');
      }
    }, 500);

    return () => {
      if (debTimer.current) clearTimeout(debTimer.current);
    };
  }, [JSON.stringify(localData), isFetching, selectedNokId]); // eslint-disable-line

  const handleFieldChange = (field: string, value: any) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    onChange(updated);
  };

  const generateLetterContent = () => {
    const date = localData.letter_date
      ? new Date(localData.letter_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '[Date]';

    return `${date}

${localData.letter_greeting || 'Dear'} ${
      localData.letter_to || '[Next of Kin Name]'
    },

${
  localData.letter_opening ||
  "I'm writing you this note as someone I trust deeply.\n\nAs my next of kin, the executor of my will, a close friend, my attorney, or someone who cares—I want you to know that I've prepared something to help guide you through what comes next."
}

${
  localData.kit_description ||
  "I've subscribed to an Orderly Affairs Kit. Inside, you'll find everything you may need to manage my affairs if I'm no longer able to, or when I'm gone. It includes not only documents, but also instructions—gentle step-by-step guides to make this process less overwhelming."
}

You can access the kit online at: ${
      localData.access_url || 'https://orderly-affairs.com'
    }

${
  localData.login_credentials_text ||
  `I have registered your email address (${
    localData.nok_email || '[Email will auto-populate]'
  }) and your phone number (${
    localData.nok_phone || '[Phone will auto-populate]'
  }), which you can use as your login credentials. The password to gain access to the kit, is printed on a password card located ${
    localData.password_card_location ||
    '[Password Card Location will auto-populate]'
  }.`
}

${
  localData.accessible_sections ||
  "Once you log in, you'll be able to manage the sections below on my behalf:\n\n(Autofill sections based on selection in the access management section)"
}

In addition to the online kit, you'll find two important physical items:

${
  localData.key_bag_info ||
  '• The Key Bag: This contains important keys and a guide to what each is for. It may include house keys, PO box keys, or vehicle keys. It is located'
} ${localData.key_bag_location || '[Key Bag Location]'}.

${
  localData.documents_bag_info ||
  '• The Documents Bag: Please keep this safe. It contains original documents and space to store items such as death certificates. You may need to refer to it even after everything has been settled. It is located'
} ${localData.documents_bag_location || '[Documents Bag Location]'}.

${
  localData.incomplete_kit_message ||
  "If any part of the kit is incomplete, please don't worry. Even the unfinished parts can still help you stay organized. I've done my best to make sure you won't be left searching through drawers or wondering where things are."
}

${
  localData.closing_message ||
  "Above all, this kit is my way of caring for you—even when I can't be here in person.\n\nTake your time. Breathe. You've got this, and I'm grateful it's you."
}

${localData.letter_signature || 'With love,'}

[Your signature]`;
  };

  const handlePrint = () => {
    const content = generateLetterContent();
    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Pop-up blocked. Please allow pop-ups for printing.');
      return;
    }
    w.document.write(`
      <html><head><title>Letter to Next of Kin</title>
      <style>body{font-family:'Times New Roman',serif;line-height:1.6;max-width:800px;margin:0 auto;padding:40px 20px;color:#333}
      h1{text-align:center;margin-bottom:30px;color:#444}.letter-content{white-space:pre-line;font-size:14px}
      @media print{body{margin:0;padding:20px}}</style></head>
      <body><h1>Letter to Next of Kin</h1><div class="letter-content">${content}</div></body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const handleExport = () => {
    const content = generateLetterContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `letter-to-next-of-kin-${
      new Date().toISOString().split('T')[0]
    }.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Letter exported successfully!');
  };

  const handleEmail = () => {
    if (!isValidEmail(localData.nok_email)) {
      toast.error(
        'Please provide a valid Next of Kin email in Access Management first.'
      );
      return;
    }
    const content = generateLetterContent();
    const subject = 'Letter to Next of Kin - Orderly Affairs Kit';
    const body = `Please find below your Letter to Next of Kin from your Orderly Affairs Kit:\n\n${content}`;
    const mailtoLink = `mailto:${
      localData.nok_email
    }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      window.location.href = mailtoLink;
      toast.success('Email client opened with letter content.');
    } catch {
      toast.error(
        'Unable to open email client. Please copy the letter content manually.'
      );
    }
  };

  return (
    <div className="space-y-6" data-field-type="NextOfKinLetter">
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        {selectedNokId && (
          <span>
            Target NOK: <code className="text-xs">{selectedNokId}</code>
          </span>
        )}
        <span>
          {isFetching ? 'Loading letter…' : isSaving ? 'Saving…' : ''}
        </span>
        {isError && (
          <>
            <span>Failed to load.</span>
            <button className="underline" onClick={() => refetch()}>
              Retry
            </button>
          </>
        )}
      </div>

      {/* ======= MAIN FORM ======= */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Letter to Next of Kin
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This letter will be provided to your designated next of kin.
            Information automatically populates from your Access Management
            section.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localData.letter_date
                    ? new Date(localData.letter_date).toLocaleDateString(
                        'en-US',
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )
                    : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    localData.letter_date
                      ? new Date(localData.letter_date)
                      : undefined
                  }
                  onSelect={date =>
                    handleFieldChange('letter_date', date?.toISOString())
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To */}
          <div className="space-y-2">
            <Label>To</Label>
            <Input
              value={localData.letter_to || ''}
              onChange={e => handleFieldChange('letter_to', e.target.value)}
              placeholder="Will auto-populate from Access Management"
            />
          </div>

          {/* Greeting */}
          <div className="space-y-2">
            <Label>Greeting</Label>
            <Input
              value={localData.letter_greeting ?? 'Dear'}
              onChange={e =>
                handleFieldChange('letter_greeting', e.target.value)
              }
            />
          </div>

          {/* Opening */}
          <div className="space-y-2">
            <Label>Opening Message</Label>
            <Textarea
              value={
                localData.letter_opening ??
                "I'm writing you this note as someone I trust deeply.\n\nAs my next of kin, the executor of my will, a close friend, my attorney, or someone who cares—I want you to know that I've prepared something to help guide you through what comes next."
              }
              onChange={e =>
                handleFieldChange('letter_opening', e.target.value)
              }
              rows={4}
            />
          </div>

          {/* Kit Description */}
          <div className="space-y-2">
            <Label>Kit Description</Label>
            <Textarea
              value={
                localData.kit_description ??
                "I've subscribed to an Orderly Affairs Kit. Inside, you'll find everything you may need to manage my affairs if I'm no longer able to, or when I'm gone. It includes not only documents, but also instructions—gentle step-by-step guides to make this process less overwhelming."
              }
              onChange={e =>
                handleFieldChange('kit_description', e.target.value)
              }
              rows={3}
            />
          </div>

          {/* Access URL */}
          <div className="space-y-2">
            <Label>Access URL</Label>
            <Input
              value={localData.access_url ?? 'https://orderly-affairs.com'}
              onChange={e => handleFieldChange('access_url', e.target.value)}
            />
          </div>

          {/* Login Credentials Text */}
          <div className="space-y-2">
            <Label>Login Credentials Information</Label>
            <Textarea
              value={
                localData.login_credentials_text ??
                `I have registered your email address (${
                  localData.nok_email ||
                  'will auto-populate from Access Management'
                }) and your phone number (${
                  localData.nok_phone ||
                  'will auto-populate from Access Management'
                }), which you can use as your login credentials. The password to gain access to the kit, is printed on a password card located ${
                  localData.password_card_location ||
                  'will auto-populate from Access Management'
                }.`
              }
              onChange={e =>
                handleFieldChange('login_credentials_text', e.target.value)
              }
              rows={3}
            />
          </div>

          {/* Auto fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Next of Kin Email (Auto-populated)
              </Label>
              <Input
                value={localData.nok_email || ''}
                readOnly
                className="bg-muted"
                placeholder="Will auto-populate from Access Management"
              />
              <p className="text-xs text-muted-foreground">
                This field automatically populates from your Access Management
                section
              </p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Next of Kin Phone (Auto-populated)
              </Label>
              <Input
                value={localData.nok_phone || ''}
                readOnly
                className="bg-muted"
                placeholder="Will auto-populate from Access Management"
              />
              <p className="text-xs text-muted-foreground">
                This field automatically populates from your Access Management
                section
              </p>
            </div>
          </div>

          {/* Password card location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Password Card Location (Auto-populated)
            </Label>
            <Input
              value={localData.password_card_location || ''}
              readOnly
              className="bg-muted"
              placeholder="Will auto-populate from Access Management"
            />
            <p className="text-xs text-muted-foreground">
              This field automatically populates from your Access Management
              section
            </p>
          </div>

          {/* Accessible Sections */}
          <div className="space-y-2">
            <Label>Accessible Sections</Label>
            <Textarea
              value={
                localData.accessible_sections ??
                "Once you log in, you'll be able to manage the sections below on my behalf:\n\n(Autofill sections based on selection in the access management section)"
              }
              onChange={e =>
                handleFieldChange('accessible_sections', e.target.value)
              }
              rows={4}
            />
          </div>

          {/* Key Bag */}
          <div className="space-y-2">
            <Label>The Key Bag Information</Label>
            <Textarea
              value={
                localData.key_bag_info ??
                '• The Key Bag: This contains important keys and a guide to what each is for. It may include house keys, PO box keys, or vehicle keys. It is located'
              }
              onChange={e => handleFieldChange('key_bag_info', e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Key Bag Location</Label>
            <Input
              value={localData.key_bag_location || ''}
              onChange={e =>
                handleFieldChange('key_bag_location', e.target.value)
              }
              placeholder="(text field)."
            />
          </div>

          {/* Documents Bag */}
          <div className="space-y-2">
            <Label>The Documents Bag Information</Label>
            <Textarea
              value={
                localData.documents_bag_info ??
                '• The Documents Bag: Please keep this safe. It contains original documents and space to store items such as death certificates. You may need to refer to it even after everything has been settled. It is located'
              }
              onChange={e =>
                handleFieldChange('documents_bag_info', e.target.value)
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Documents Bag Location</Label>
            <Input
              value={localData.documents_bag_location || ''}
              onChange={e =>
                handleFieldChange('documents_bag_location', e.target.value)
              }
              placeholder="(text field)"
            />
          </div>

          {/* Incomplete / Closing / Signature */}
          <div className="space-y-2">
            <Label>Incomplete Kit Message</Label>
            <Textarea
              value={
                localData.incomplete_kit_message ??
                "If any part of the kit is incomplete, please don't worry. Even the unfinished parts can still help you stay organized. I've done my best to make sure you won't be left searching through drawers or wondering where things are."
              }
              onChange={e =>
                handleFieldChange('incomplete_kit_message', e.target.value)
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Closing Message</Label>
            <Textarea
              value={
                localData.closing_message ??
                "Above all, this kit is my way of caring for you—even when I can't be here in person.\n\nTake your time. Breathe. You've got this, and I'm grateful it's you."
              }
              onChange={e =>
                handleFieldChange('closing_message', e.target.value)
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Signature</Label>
            <Input
              value={localData.letter_signature ?? 'With love,'}
              onChange={e =>
                handleFieldChange('letter_signature', e.target.value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Letter Actions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Preview, print, export, or email your letter to next of kin.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview Letter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Letter to Next of Kin - Preview</DialogTitle>
                  <DialogDescription>
                    Review your letter before printing or finalizing.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <div className="bg-white p-8 border rounded-lg shadow-sm">
                    <div className="font-serif leading-relaxed whitespace-pre-line text-gray-800">
                      {generateLetterContent()}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                    <Button
                      onClick={handleExport}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                    {isValidEmail(localData.nok_email) && (
                      <Button
                        onClick={handleEmail}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Letter
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export as Text
            </Button>

            {isValidEmail(localData.nok_email) ? (
              <Button
                onClick={handleEmail}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email to {localData.nok_email}
              </Button>
            ) : (
              <Button
                disabled
                variant="outline"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email (No valid recipient)
              </Button>
            )}
          </div>

          {localData.nok_email ? (
            <p className="text-sm text-muted-foreground mt-3">
              Email will be sent to: {localData.nok_email}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-3">
              Email becomes available once you set Next of Kin in Access
              Management.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

