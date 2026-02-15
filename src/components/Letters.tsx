import React, { useEffect, useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@common/ui/card';
import { Textarea } from '@common/ui/textarea';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@common/ui/select';
import { RadioGroup, RadioGroupItem } from '@common/ui/radio-group';
import { Badge } from '@common/ui/badge';
import { ArrowLeft, Plus, FileText,  Save, Edit2, Printer, Video, Mic, Calendar,  AlertTriangle, Send, Mail, Upload,  Trash2 } from 'lucide-react';

import { SafeMediaRecorder } from '@/components/SafeMediaRecorder';

// import { MediaDiagnostics } from '@/components/MediaDiagnostics';
// import { RecordingSupport } from '@/components/RecordingSupport';

import { RichTextEditor } from '@/components/RichTextEditor';
import { DatePicker } from '@/components/DatePicker';
import { toast } from 'sonner';
import { Edit3 } from 'lucide-react';
import {
  createMessage,
  updateMessage,
  deleteMessage,
  getMessages,
  uploadMessageMedia,
} from '@/libs/api/lettersOfNaxtKinMessage';

import Cookies from 'js-cookie';

interface LettersProps {
  onBack?: () => void;
  navigateTo?: (screen: string) => void;
  value?: any;
  onChange?: (value: any) => void;
  isNextOfKin?: boolean;
  formData?: any;
}

interface Letter {
  id: string;

  title: string;
  subject?: string;
  content?: string;

  recipient: string;
  recipientEmail: string;

  messageType: 'letter' | 'video' | 'audio';
  deliveryTrigger: 'date' | 'death';
  deliveryDate?: string;
  deliveryOccasion?: string;

  media?: {
    url: string;
    public_id: string;
    type: string;
    format?: string;
    size?: number;
  };

  status?: 'pending' | 'sent';
  lastModified: Date;
}

const letterTemplates = [
  {
    title: 'Letter to Spouse/Partner',
    content: 'My dearest [NAME],\\n\\nIf you are reading this, it means I am no longer with you. I want you to know that you have been the love of my life and my greatest blessing.\\n\\n[Add your personal message here]\\n\\nWith all my love,\\n[YOUR NAME]'
  },
  {
    title: 'Letter to Children',
    content: 'My beloved children,\\n\\nYou have been the greatest joy of my life. I am so proud of who you have become and who you will continue to be.\\n\\n[Add your personal message here]\\n\\nRemember that I will always love you,\\n[YOUR NAME]'
  },
  {
    title: 'Letter to Family',
    content: 'Dear Family,\\n\\nThank you for all the love, laughter, and memories we have shared together. You have made my life complete.\\n\\n[Add your personal message here]\\n\\nWith love and gratitude,\\n[YOUR NAME]'
  }
];

export function Letters({ onBack,  value = {}, onChange, isNextOfKin = false, formData }: LettersProps) {
  const mapLetter = (l: any): Letter => ({
    id: l._id,
    title: l.title,

    subject: l.subject ?? '',
    content: l.content ?? '',

    recipient: l.recipient,
    recipientEmail: l.recipient_email,

    messageType: l.message_type,
    deliveryTrigger: l.delivery_trigger,
    deliveryDate: l.delivery_date,
    deliveryOccasion: l.delivery_occasion ?? '',

    media: l.media,
    status: l.status,
    lastModified: new Date(l.updated_at),
  });

  // Initialize letters from value prop or default to empty array (no sample letters)
  const [letters, setLetters] = useState<Letter[]>(() => {
    if (value && Array.isArray(value)) {
      return value;
    }
    if (value && value.letters && Array.isArray(value.letters)) {
      return value.letters;
    }
    // Return empty array instead of sample letters
    return [];
  });
  // const isOwnerDeceased = formData?.owner_status === 'deceased';

const token = isNextOfKin
  ? Cookies.get('nok_auth_token')
  : Cookies.get('auth_token');
  // Use ref to track previous value and prevent unnecessary updates
  // const prevLettersRef = React.useRef<Letter[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<Letter | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestedLetters, setShowSuggestedLetters] = useState(false);

  // Extract authorized contacts from Access Management ONLY
  const getNextOfKinOptions = React.useMemo(() => {
    if (!formData) return [];
    
    const options: Array<{ name: string; email?: string; source: string }> = [];
    
    // Extract ONLY from Access Management (Section 2A)
    if (formData['2'] && formData['2']['2A'] && formData['2']['2A']['access_management_data']) {
      const accessData = formData['2']['2A']['access_management_data'];
      
      // Access Management data structure
      if (accessData.authorized_people && Array.isArray(accessData.authorized_people)) {
        accessData.authorized_people.forEach((person: any) => {
          if (person.person_name) {
            options.push({
              name: person.person_name,
              email: person.email_address || '', // Correct field name
              source: 'Access Management'
            });
          }
        });
      }
    }
    
    // Debug logging
    if (options.length > 0) {
      console.log('Letters: Found', options.length, 'authorized contacts:', options.map(c => `${c.name} (${c.source})`));
    } else {
      console.log('Letters: No authorized contacts found. Add people to Section 2A (Access Management) first.');
    }
    
    return options;
  }, [formData]);

  // Get suggested letters for people who don't have letters yet
  const getSuggestedLetters = React.useMemo(() => {
    const existingRecipients = new Set(letters.map(letter => letter.recipient.toLowerCase()));
    
    return getNextOfKinOptions.filter(contact => 
      contact.name && !existingRecipients.has(contact.name.toLowerCase())
    );
  }, [getNextOfKinOptions, letters]);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  // const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [
    rerecordingLetter, setRerecordingLetter] = useState<Letter | null>(null);

  // Update parent component when letters change
  // React.useEffect(() => {
  //   if (onChange) {
  //     // Use JSON.stringify for deep comparison to prevent unnecessary calls
  //     const lettersString = JSON.stringify(letters);
  //     const prevString = JSON.stringify(prevLettersRef.current);
      
  //     if (lettersString !== prevString) {
  //       prevLettersRef.current = letters;
  //       onChange(letters);
  //     }
  //   }
  // }, [letters]); // Remove onChange from dependencies to prevent infinite loop
  useEffect(() => {
    if (!onChange) return;
    onChange(letters);
  }, [letters]);

  // Reset letters when value prop changes (for clearing functionality)
useEffect(() => {
  if (!value) return;

  let newLetters: Letter[] = [];

  if (Array.isArray(value)) {
    newLetters = value;
  } else if (value.letters && Array.isArray(value.letters)) {
    newLetters = value.letters;
  }

  setLetters(prev => {
    if (JSON.stringify(prev) === JSON.stringify(newLetters)) {
      return prev; // 🔥 prevent infinite loop
    }
    return newLetters;
  });
}, [value]);


React.useEffect(() => {
  if (!token) return;

  setIsLoading(true);

  getMessages(token).then(data => {
    setLetters(data.map(mapLetter));
  })
    .catch(() => toast.error('Failed to load letters'))
    .finally(() => setIsLoading(false));
}, [token]);

  const handleNewLetter = () => {
    setCurrentLetter({
      id: Date.now().toString(),
      title: '',
      subject: '',
      content: '',

      recipient: '',
      recipientEmail: '',

      messageType: 'letter',
      deliveryTrigger: 'death',
      deliveryDate: undefined,
      deliveryOccasion: '',

      lastModified: new Date(),
    });

    setIsWriting(true);
  };
const handleMediaUploaded = (media: any) => {
  if (!currentLetter) return;

  setCurrentLetter(prev => ({
    ...prev!,
    media,
  }));

  toast.success('Media uploaded successfully');
};


  const handleUseTemplate = (template: any) => {
    setCurrentLetter({
      id: Date.now().toString(),
      title: template.title,
      recipient: '',
      recipientEmail: '',
      content: template.content,
      lastModified: new Date(),
      messageType: 'letter',
      deliveryTrigger: 'death',
      status: 'pending',
    });
    setIsWriting(true);
    setShowTemplates(false);
  };


  const createSuggestedLetter = (contact: { name: string; email?: string; source: string }) => {
    const newLetter: Letter = {
      id: Date.now().toString(),
      title: `Letter to ${contact.name}`,
      recipient: contact.name,
      recipientEmail: contact.email || '',
      content: `Dear ${contact.name},\n\nIf you are reading this letter, it means I am no longer with you. I wanted to take a moment to share some important thoughts and guidance as you navigate this difficult time.\n\n[Please personalize this message with your own words and feelings.]\n\nWith all my love,\n[Your name]`,
      lastModified: new Date(),
      messageType: 'letter',
      deliveryTrigger: 'death',
      status: 'pending',
    };

    setCurrentLetter(newLetter);
    setIsWriting(true);
  };

const handleSaveLetter = async () => {
  if (!currentLetter || !token) return;

const payload: any = {
  title: currentLetter.title,

  recipient: currentLetter.recipient,
  recipient_email: currentLetter.recipientEmail,

  message_type: currentLetter.messageType,
  media: currentLetter.media || null,

  delivery_trigger: currentLetter.deliveryTrigger,
  delivery_date: currentLetter.deliveryDate || null,
  delivery_occasion: currentLetter.deliveryOccasion || null,
};

if (currentLetter.subject !== undefined) {
  payload.subject = currentLetter.subject;
}

if (currentLetter.content !== undefined) {
  payload.content = currentLetter.content;
}

  try {
    const exists = letters.some(
      l => l.id === currentLetter.id && l.id.length > 10,
    );

    if (exists) {
      await updateMessage(token, currentLetter.id, payload);
      toast.success('Letter updated');
    } else {
      await createMessage(token, payload);
      toast.success('Letter saved');
    }

    setIsWriting(false);
    setCurrentLetter(null);

const refreshed = await getMessages(token);
setLetters(refreshed.map(mapLetter));


  } catch {
    toast.error('Save failed');
  }
};
// const handleSaveLetter = async () => {
//   if (!currentLetter || !token) return;

//   const payload: any = {
//     title: currentLetter.title,
//     recipient: currentLetter.recipient,
//     recipient_email: currentLetter.recipientEmail,
//     message_type: currentLetter.messageType,
//     media: currentLetter.media || null,
//     delivery_trigger: currentLetter.deliveryTrigger,
//     delivery_date: currentLetter.deliveryDate || null,
//     delivery_occasion: currentLetter.deliveryOccasion || null,
//   };

//   if (currentLetter.subject !== undefined) {
//     payload.subject = currentLetter.subject;
//   }

//   if (currentLetter.content !== undefined) {
//     payload.content = currentLetter.content;
//   }

//   try {
//     // 🔥 UPDATE
//     if (currentLetter.id && letters.find(l => l.id === currentLetter.id)) {
//       const updated = await updateMessage(
//         token,
//         currentLetter.id,
//         payload
//       );

//       setLetters(prev =>
//         prev.map(l =>
//           l.id === currentLetter.id ? mapLetter(updated) : l
//         )
//       );

//       toast.success('Letter updated');
//     }

//     // 🔥 CREATE
//     else {
//       const created = await createMessage(token, payload);

//       const newLetter = mapLetter(created);

//       setLetters(prev => [...prev, newLetter]);

//       setCurrentLetter(newLetter); // 🔥 important
//       toast.success('Letter saved');
//     }

//     setIsWriting(false);
//   } catch (err) {
//     toast.error('Save failed');
//   }
// };

  const handleEditLetter = (letter: Letter) => {
    setCurrentLetter(letter);
    setIsWriting(true);
  };

const handleDeleteMessage = async (id: string) => {
  if (!token) return;
  if (!confirm('Delete this message?')) return;

  await deleteMessage(token, id);
  setLetters(prev => prev.filter(l => l.id !== id));
  toast.success('Message deleted');
};

const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !token || !currentLetter) return;

  try {
    const media = await uploadMessageMedia(token, file);

    setCurrentLetter({
      ...currentLetter,
      media,
    });

    toast.success('Media uploaded');
  } catch {
    toast.error('Upload failed');
  }
};


  const handleDeliverMessages = async () => {
    setIsDelivering(true);
    try {
      // Mock delivery - in real app, this would send to backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const undeliveredLetters = letters.filter(
        letter => letter.status !== 'sent',
      );
      setLetters(prev =>
        prev.map(l =>
          undeliveredLetters.some(ul => ul.id === l.id)
            ? { ...l, status: 'sent' }
            : l,
        ),
      );

      
    } catch (error) {
      console.error('Error delivering messages:', error);
    } finally {
      setIsDelivering(false);
    }
  };

  const handlePrintLetter = (letter: Letter) => {
    // Create a new window with the letter content formatted for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString();
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${letter.title}</title>
          <style>
            @media print {
              @page {
                margin: 1in;
                size: letter;
              }
            }
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              color: #333;
              max-width: 8.5in;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .recipient {
              font-size: 18px;
              font-style: italic;
              margin-bottom: 5px;
            }
            .date {
              font-size: 14px;
              color: #666;
            }
            .content {
              margin-top: 40px;
              font-size: 16px;
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${letter.title}</div>
            <div class="recipient">To: ${letter.recipient}</div>
            <div class="date">Created: ${new Date(letter.lastModified).toLocaleDateString()}</div>
          </div>
          <div class="content">${letter.content}</div>
          <div class="footer">
            Printed from Orderly Affairs on ${currentDate}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Mic;
      default: return FileText;
    }
  };

  const getDeliveryTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'date': return Calendar;
      case 'death': return AlertTriangle;
      default: return Calendar;
    }
  };

  // If used as standalone component (not in form), show header
  const showHeader = !!onBack;

  return (
    <div
      className={
        showHeader
          ? 'min-h-screen bg-background w-full max-w-none'
          : 'w-full max-w-none'
      }
    >
      {/* Header */}
      {showHeader && (
        <div className="bg-primary text-primary-foreground p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-primary-foreground hover:bg-primary-foreground/20 p-2 mr-3"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl">Letters to Next of Kin</h1>
                <p className="text-primary-foreground/80 text-sm">
                  Messages for your loved ones
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isNextOfKin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeliverMessages}
                  disabled={
                    isDelivering ||
                    letters.filter(l => l.status !== 'sent').length === 0
                  }
                  className="text-primary-foreground hover:bg-primary-foreground/20 px-3 py-2 border border-primary-foreground/30"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isDelivering ? 'Delivering...' : 'Deliver Messages'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewLetter}
                className="text-primary-foreground hover:bg-primary-foreground/20 p-2"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        className={showHeader ? 'px-4 sm:px-6 pb-6 w-full' : 'w-full space-y-6'}
      >
        {/* Writing Interface */}
        {isWriting && currentLetter && (
          <Card
            className={`mb-6 ${showHeader ? '-mt-4' : ''} shadow-lg w-full`}
          >
            <CardHeader>
              <CardTitle>
                {currentLetter.id ? 'Edit Message' : 'Create New Message'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              {/* Message Type Selection */}
              <div>
                <Label>Choose Message Type</Label>
                <RadioGroup
                  value={currentLetter.messageType}
                  onValueChange={(value: 'letter' | 'video' | 'audio') =>
                    setCurrentLetter({ ...currentLetter, messageType: value })
                  }
                  className="flex flex-row gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="letter" id="letter" />
                    <Label htmlFor="letter" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Letter
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="video" id="video" />
                    <Label htmlFor="video" className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Video
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="audio" id="audio" />
                    <Label htmlFor="audio" className="flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Audio
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Basic Details */}
              <div>
                <Label htmlFor="title">Message Title</Label>
                <Input
                  id="title"
                  value={currentLetter.title}
                  onChange={e =>
                    setCurrentLetter({
                      ...currentLetter,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., Letter to My Children"
                />
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="recipient">Recipient Name(s)</Label>
                  {getNextOfKinOptions.length > 0 ? (
                    <div className="space-y-2">
                      <Select
                        value={currentLetter.recipient}
                        onValueChange={value => {
                          const selectedContact = getNextOfKinOptions.find(
                            contact => contact.name === value,
                          );
                          setCurrentLetter({
                            ...currentLetter,
                            recipient: value,
                            recipientEmail:
                              selectedContact?.email ||
                              currentLetter.recipientEmail,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select from authorized people or type custom name" />
                        </SelectTrigger>
                        <SelectContent>
                          {getNextOfKinOptions.map((contact, index) => (
                            <SelectItem
                              key={`${contact.source}-${contact.name}-${index}`}
                              value={contact.name}
                            >
                              <div className="flex flex-col">
                                <span>{contact.name}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{contact.source}</span>
                                  {contact.email && (
                                    <span>• {contact.email}</span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="recipient-custom"
                        value={currentLetter.recipient}
                        onChange={e =>
                          setCurrentLetter({
                            ...currentLetter,
                            recipient: e.target.value,
                          })
                        }
                        placeholder="Or type a custom recipient name"
                        className="text-sm"
                      />
                    </div>
                  ) : (
                    <Input
                      id="recipient"
                      value={currentLetter.recipient}
                      onChange={e =>
                        setCurrentLetter({
                          ...currentLetter,
                          recipient: e.target.value,
                        })
                      }
                      placeholder="Who is this message for?"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="recipientEmail">Recipient Email</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={currentLetter.recipientEmail}
                    onChange={e =>
                      setCurrentLetter({
                        ...currentLetter,
                        recipientEmail: e.target.value,
                      })
                    }
                    placeholder="Email address for delivery"
                  />
                </div>
              </div>

              {/* Delivery Trigger */}
              <div>
                <Label>Set Delivery Trigger</Label>
                <RadioGroup
                  value={currentLetter.deliveryTrigger}
                  onValueChange={(value: 'date' | 'death') =>
                    setCurrentLetter({
                      ...currentLetter,
                      deliveryTrigger: value,
                    })
                  }
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="death" id="death" />
                    <Label htmlFor="death" className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Upon death
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="date" id="date" />
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Specific date
                    </Label>
                  </div>
                </RadioGroup>

                {/* Conditional delivery details */}
                {currentLetter.deliveryTrigger === 'date' && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label htmlFor="deliveryDate">Delivery Date</Label>
                      <DatePicker
                        value={currentLetter.deliveryDate || ''}
                        onChange={value =>
                          setCurrentLetter({
                            ...currentLetter,
                            deliveryDate: value || '',
                          })
                        }
                        placeholder="Select delivery date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryOccasion">
                        Occasion (Optional)
                      </Label>
                      <Input
                        id="deliveryOccasion"
                        value={currentLetter.deliveryOccasion || ''}
                        onChange={e =>
                          setCurrentLetter({
                            ...currentLetter,
                            deliveryOccasion: e.target.value,
                          })
                        }
                        placeholder="e.g., Anniversary, Birthday, Graduation"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Letter Content Writing Section */}
              {currentLetter.messageType === 'letter' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Edit3 className="w-5 h-5 text-primary" />
                    <h3 className="text-lg">Write a Letter</h3>
                  </div>

                  {/* Letter Subject */}
                  <div>
                    <Label htmlFor="letterSubject">Letter Subject</Label>
                    <Input
                      id="letterSubject"
                      value={currentLetter.subject || ''}
                      onChange={e =>
                        setCurrentLetter({
                          ...currentLetter,
                          subject: e.target.value,
                        })
                      }
                      placeholder="Read This When You Need Me Close"
                      className="mt-2"
                    />
                  </div>

                  {/* Rich Text Editor */}
                  <div>
                    <RichTextEditor
                      value={currentLetter.content ?? ''}
                      onChange={content =>
                        setCurrentLetter({ ...currentLetter, content })
                      }
                      placeholder="Write your heartfelt message here..."
                    />
                  </div>
                </div>
              )}

              {/* File Upload for Video/Audio */}
              {currentLetter.messageType === 'video' && (
                <div>
                  <Label htmlFor="videoFile">Video Message</Label>
                  <div className="space-y-3 mt-2">
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-blue-800">
                          💡 <strong>Tip:</strong> Test permissions first or use
                          file upload
                        </p>
                      </div>
                    </div>

                    {/* Record Now Button */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => setShowVideoRecorder(true)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Record Now
                      </Button>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                      or
                    </div>

                    {/* File Upload - Always available */}
                    <div className="flex items-center gap-2">
                      <Input
                        id="videoFile"
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm" type="button">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {currentLetter.media?.url && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="w-4 h-4 text-green-600" />
                        <p className="text-sm text-green-800">Video uploaded</p>
                      </div>

                      {currentLetter.media.size && (
                        <p className="text-xs text-green-600 mb-2">
                          Size:{' '}
                          {(currentLetter.media.size / (1024 * 1024)).toFixed(
                            2,
                          )}{' '}
                          MB
                        </p>
                      )}

                      <video
                        controls
                        className="w-full h-32 bg-black rounded object-cover"
                        src={currentLetter.media.url}
                      />
                    </div>
                  )}
                </div>
              )}
              {currentLetter.messageType === 'audio' && (
                <div>
                  <Label htmlFor="audioFile">Audio Message</Label>

                  <div className="space-y-3 mt-2">
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-800">
                        💡 <strong>Tip:</strong> You can record or upload an
                        audio message
                      </p>
                    </div>

                    {/* Record Audio */}
                    <Button
                      type="button"
                      onClick={() => setShowAudioRecorder(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Record Audio
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                      or
                    </div>

                    {/* Upload Audio */}
                    <Input
                      id="audioFile"
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Preview */}
                  {currentLetter.media?.url && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-blue-800">Audio uploaded</p>
                      </div>

                      {currentLetter.media.size && (
                        <p className="text-xs text-blue-600 mb-2">
                          Size:{' '}
                          {(currentLetter.media.size / (1024 * 1024)).toFixed(
                            2,
                          )}{' '}
                          MB
                        </p>
                      )}

                      <audio
                        controls
                        className="w-full"
                        src={currentLetter.media.url}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Message Content for Video/Audio */}
              {currentLetter.messageType !== 'letter' && (
                <div>
                  <Label htmlFor="content">Message Description</Label>
                  <Textarea
                    id="content"
                    value={currentLetter.content}
                    onChange={e =>
                      setCurrentLetter({
                        ...currentLetter,
                        content: e.target.value,
                      })
                    }
                    placeholder="Describe your video/audio message..."
                    rows={6}
                    className="resize-none"
                  />
                </div>
              )}

              {/* Message Review Section */}
              {((currentLetter.media &&
                currentLetter.messageType !== 'letter') ||
                (currentLetter.messageType === 'letter' &&
                  currentLetter.content)) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Review Your Message
                  </h4>

                  <div className="space-y-3">
                    {/* Message Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Type:</span>{' '}
                        {currentLetter.messageType === 'letter'
                          ? 'Written Letter'
                          : currentLetter.messageType === 'video'
                            ? 'Video Message'
                            : 'Audio Message'}
                      </div>
                      <div>
                        <span className="font-medium">Delivery:</span>{' '}
                        {currentLetter.deliveryTrigger === 'death'
                          ? 'Upon passing'
                          : `On ${currentLetter.deliveryDate ? new Date(currentLetter.deliveryDate).toLocaleDateString() : 'selected date'}`}
                      </div>
                      {currentLetter.deliveryOccasion && (
                        <div className="col-span-2">
                          <span className="font-medium">Occasion:</span>{' '}
                          {currentLetter.deliveryOccasion}
                        </div>
                      )}
                    </div>

                    {/* Content Preview */}
                    {currentLetter.messageType === 'letter' &&
                      currentLetter.content && (
                        <div>
                          <p className="font-medium text-sm mb-2">
                            Letter Content Preview:
                          </p>
                          <div className="bg-white p-3 rounded border max-h-32 overflow-y-auto text-sm">
                            <div
                              dangerouslySetInnerHTML={{
                                __html:
                                  currentLetter.content.substring(0, 200) +
                                  (currentLetter.content.length > 200
                                    ? '...'
                                    : ''),
                              }}
                            />
                          </div>
                        </div>
                      )}

                    {/* Media Preview */}
                    {currentLetter.media?.url &&
                      currentLetter.messageType === 'video' && (
                        <video
                          controls
                          src={currentLetter.media.url}
                          className="w-full h-32"
                        />
                      )}

                    {currentLetter.media?.url &&
                      currentLetter.messageType === 'audio' && (
                        <audio controls src={currentLetter.media.url} />
                      )}

                    {currentLetter.content &&
                      currentLetter.messageType !== 'letter' && (
                        <div>
                          <p className="font-medium text-sm mb-2">
                            Description:
                          </p>
                          <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                            {currentLetter.content || 'No description provided'}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveLetter} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Save Message
                </Button>
                <Button variant="outline" onClick={() => setIsWriting(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary and Quick Actions */}
        {!isWriting && (
          <>
            <Card
              className={`mb-6 ${showHeader ? '-mt-4' : ''} shadow-lg w-full`}
            >
              <CardContent className="p-4 sm:p-6 w-full">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">
                      Loading your messages...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    <div>
                      <h3 className="text-primary">Your Messages</h3>
                      <p className="text-sm text-muted-foreground">
                        {letters.length} messages saved •{' '}
                        {letters.filter(l => l.status !== 'sent').length}{' '}
                        pending delivery
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <Button
                        onClick={handleNewLetter}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none sm:min-w-50"
                        size="lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Message
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="flex-1 sm:flex-none sm:min-w-37.5"
                      >
                        {showTemplates ? 'Hide Templates' : 'Show Templates'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suggested Letters */}
            {getSuggestedLetters.length > 0 && (
              <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Suggested Letters
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Create letters for people in your Access Management
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowSuggestedLetters(!showSuggestedLetters)
                      }
                      className="text-blue-700 dark:text-blue-300"
                    >
                      {showSuggestedLetters ? 'Hide' : 'Show'} (
                      {getSuggestedLetters.length})
                    </Button>
                  </div>

                  {showSuggestedLetters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getSuggestedLetters.map((contact, index) => (
                        <div
                          key={`suggested-${contact.source}-${contact.name}-${index}`}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {contact.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {contact.source}
                              {contact.email && ` • ${contact.email}`}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => createSuggestedLetter(contact)}
                            className="ml-3 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Create Letter
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Templates */}
            {showTemplates && (
              <div className="mb-6 w-full">
                <h2 className="text-primary mb-3">Letter Templates</h2>
                <div className="space-y-3 w-full">
                  {letterTemplates.map((template, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:shadow-md transition-shadow w-full"
                    >
                      <CardContent className="p-4 sm:p-6 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-primary">{template.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Pre-written template to get you started
                            </p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => handleUseTemplate(template)}
                            className="w-full sm:w-auto sm:flex-shrink-0"
                          >
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Messages List */}
            {!isLoading && (
              <div className="space-y-4   w-full">
                {letters.map(letter => {
                  const MessageIcon = getMessageTypeIcon(letter.messageType);
                  const TriggerIcon = getDeliveryTriggerIcon(
                    letter.deliveryTrigger,
                  );

                  return (
                    <Card
                      key={letter.id}
                      className="hover:shadow-md transition-shadow w-full"
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Message Header */}
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <MessageIcon className="w-5 h-5 text-primary" />
                                <span className="font-medium capitalize text-sm">
                                  {letter.messageType} Message
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TriggerIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {letter.deliveryTrigger === 'death'
                                    ? 'Upon death'
                                    : 'Specific date'}
                                </span>
                              </div>
                              {letter.status === 'sent' && (
                                <Badge variant="secondary" className="text-xs">
                                  Delivered
                                </Badge>
                              )}
                            </div>

                            {/* Title and Recipient */}
                            <h3 className="font-medium text-base mb-1 line-clamp-1">
                              {letter.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              To: {letter.recipient}
                              {letter.recipientEmail &&
                                ` (${letter.recipientEmail})`}
                            </p>

                            {/* Delivery Details */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                              {letter.deliveryTrigger === 'date' &&
                                letter.deliveryDate && (
                                  <span>
                                    📅{' '}
                                    {new Date(
                                      letter.deliveryDate,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              {letter.deliveryOccasion && (
                                <span>🎉 {letter.deliveryOccasion}</span>
                              )}
                              <span>
                                ✏️ Modified{' '}
                                {new Date(
                                  letter.lastModified,
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Content Preview */}
                            {letter.messageType === 'letter' &&
                              letter.content && (
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                                  {letter.content
                                    .replace(/\\n/g, ' ')
                                    .substring(0, 150)}
                                  {letter.content.length > 150 ? '...' : ''}
                                </p>
                              )}

                            {/* File Attachments and Preview */}
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {letter.media?.url && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs flex items-center gap-1"
                                  >
                                    {letter.messageType === 'video' ? (
                                      <Video className="w-3 h-3" />
                                    ) : (
                                      <Mic className="w-3 h-3" />
                                    )}
                                    Media attached
                                  </Badge>
                                )}

                                {letter.subject && (
                                  <Badge variant="outline" className="text-xs">
                                    Subject: {letter.subject}
                                  </Badge>
                                )}
                              </div>

                              {/* Media Preview */}
                              {letter.media?.url &&
                                letter.messageType === 'video' && (
                                  <div className="bg-muted rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">
                                        Video Preview
                                      </span>
                                    </div>

                                    <video
                                      controls
                                      src={letter.media.url}
                                      className="w-full h-32 bg-black rounded object-cover"
                                    />
                                  </div>
                                )}

                              {letter.media?.url &&
                                letter.messageType === 'audio' && (
                                  <div className="bg-muted rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">
                                        Audio Preview
                                      </span>
                                    </div>

                                    <audio
                                      controls
                                      src={letter.media.url}
                                      className="w-full"
                                    />
                                  </div>
                                )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditLetter(letter)}
                              className="h-8 px-3"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintLetter(letter)}
                              className="h-8 px-3"
                            >
                              <Printer className="w-3 h-3 mr-1" />
                              Print
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteMessage(letter.id)}
                              className="h-8 px-3"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {letters.length === 0 && (
                  <Card className="w-full">
                    <CardContent className="p-8 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No messages yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first personal message for your loved ones
                      </p>
                      <Button onClick={handleNewLetter}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Message
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Quick Actions - Next of Kin Only */}
            {isNextOfKin && (
              <div className="mt-8 pt-6 border-t bg-muted/20 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-lg">
                <div className="space-y-3">
                  <h3 className="font-medium text-primary">
                    Next of Kin Actions
                  </h3>
                  <Button
                    variant="default"
                    onClick={handleDeliverMessages}
                    disabled={
                      isDelivering ||
                      letters.filter(l => l.status !== 'sent').length === 0
                    }
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white"
                    size="lg"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {isDelivering
                      ? 'Delivering Messages...'
                      : 'Deliver Messages to Loved Ones'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    This will send all undelivered messages to their intended
                    recipients
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showVideoRecorder && (
        <SafeMediaRecorder
          type="video"
          token={token}
          onUploaded={handleMediaUploaded}
          onClose={() => {
            setShowVideoRecorder(false);
            setRerecordingLetter(null);
          }}
        />
      )}

      {showAudioRecorder && (
        <SafeMediaRecorder
          type="audio"
          token={token}
          onUploaded={handleMediaUploaded}
          onClose={() => {
            setShowAudioRecorder(false);
            setRerecordingLetter(null);
          }}
        />
      )}
    </div>
  );
}
