'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit2,
  FileText,
  Heart,
  Mail,
  Mic,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  Users,
  Video,
  X,
  AlertTriangle,
  Save,
} from 'lucide-react';

import {
  MOBILE_SHEET_SCROLL_PADDING,
  MobileBottomSheet,
  MobileSheetHandle,
  useIsMobile,
} from '@/components/MobileBottomSheet';

import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Textarea } from '@common/ui/textarea';
import { Badge } from '@common/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@common/ui/select';

import { MediaMessagePicker } from '@/components/MediaMessagePicker';
import { SafeMediaRecorder } from '@/components/SafeMediaRecorder';
import { RichTextEditor } from '@/components/RichTextEditor';
import { DatePicker } from '@/components/DatePicker';

import {
  createMessage,
  updateMessage,
  deleteMessage,
  deleteMessageMedia,
  deleteUploadedMessageMedia,
  getMessages,
  uploadMessageMedia,
} from '@/libs/api/lettersOfNaxtKinMessage';
import {
  inferMediaContentType,
  isAllowedMediaFile,
} from '@/utils/mediaUpload';

/* ============================================================
   TYPES
============================================================ */

type MessageType = 'letter' | 'video' | 'audio';
type DeliveryTrigger = 'date' | 'death';
type MessageStatus = 'pending' | 'sent';

interface LettersProps {
  onBack?: () => void;
  navigateTo?: (screen: string) => void;
  value?: any;
  onChange?: (value: any) => void;
  isNextOfKin?: boolean;
  formData?: any;
  clearNonce?: number;
  /** When rendered inside a dashboard section on mobile */
  embeddedInSection?: boolean;
}

interface LetterMedia {
  url: string;
  public_id: string;
  type: string;
  format?: string;
  size?: number;
}

interface Letter {
  id: string;
  title: string;
  subject?: string;
  content?: string;
  recipient: string;
  recipientEmail: string;
  messageType: MessageType;
  deliveryTrigger: DeliveryTrigger;
  deliveryDate?: string;
  deliveryOccasion?: string;
  media?: LetterMedia;
  status?: MessageStatus;
  lastModified: Date;
}

interface RecipientOption {
  name: string;
  email?: string;
  source: string;
}

/* ============================================================
   HELPERS
============================================================ */

const letterTemplates = [
  {
    title: 'Letter to Spouse/Partner',
    content:
      'My dearest [NAME],\n\nIf you are reading this, it means I am no longer with you. I want you to know that you have been the love of my life and my greatest blessing.\n\n[Add your personal message here]\n\nWith all my love,\n[YOUR NAME]',
  },
  {
    title: 'Letter to Children',
    content:
      'My beloved children,\n\nYou have been the greatest joy of my life. I am so proud of who you have become and who you will continue to be.\n\n[Add your personal message here]\n\nRemember that I will always love you,\n[YOUR NAME]',
  },
  {
    title: 'Letter to Family',
    content:
      'Dear Family,\n\nThank you for all the love, laughter, and memories we have shared together. You have made my life complete.\n\n[Add your personal message here]\n\nWith love and gratitude,\n[YOUR NAME]',
  },
];

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(' ');
}

function emptyLetter(): Letter {
  return {
    id: `local-${Date.now()}`,
    title: '',
    subject: '',
    content: '',
    recipient: '',
    recipientEmail: '',
    messageType: 'letter',
    deliveryTrigger: 'death',
    deliveryDate: '',
    deliveryOccasion: '',
    status: 'pending',
    lastModified: new Date(),
  };
}

function normalizeLetter(raw: any): Letter {
  return {
    id: raw?._id || raw?.id || `local-${Date.now()}`,
    title: raw?.title || '',
    subject: raw?.subject || '',
    content: raw?.content || '',
    recipient: raw?.recipient || '',
    recipientEmail: raw?.recipient_email || raw?.recipientEmail || '',
    messageType: raw?.message_type || raw?.messageType || 'letter',
    deliveryTrigger: raw?.delivery_trigger || raw?.deliveryTrigger || 'death',
    deliveryDate: raw?.delivery_date || raw?.deliveryDate || '',
    deliveryOccasion: raw?.delivery_occasion || raw?.deliveryOccasion || '',
    media: raw?.media || undefined,
    status: raw?.status || 'pending',
    lastModified: raw?.updated_at
      ? new Date(raw.updated_at)
      : raw?.lastModified
        ? new Date(raw.lastModified)
        : new Date(),
  };
}

function normalizeValue(value: any): Letter[] {
  if (Array.isArray(value)) return value.map(normalizeLetter);
  if (Array.isArray(value?.letters)) return value.letters.map(normalizeLetter);
  return [];
}

function stripHtml(value?: string) {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatFileSize(size?: number) {
  if (!size) return '';
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function escapeHtml(value?: string) {
  if (!value) return '';
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export function Letters({
  onBack,
  value = {},
  onChange,
  isNextOfKin = false,
  formData,
  clearNonce = 0,
  embeddedInSection = false,
}: LettersProps) {
  const isMobile = useIsMobile();
  const token = isNextOfKin
    ? Cookies.get('nok_auth_token')
    : Cookies.get('auth_token');

  const [letters, setLetters] = useState<Letter[]>(() => normalizeValue(value));
  const [currentLetter, setCurrentLetter] = useState<Letter | null>(null);

  const [isWriting, setIsWriting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState(false);

  const [showTemplates, setShowTemplates] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [detailLetterId, setDetailLetterId] = useState<string | null>(null);

  const showHeader = Boolean(onBack);

  const recipientOptions = useMemo<RecipientOption[]>(() => {
    const contacts: RecipientOption[] = [];

    const accessData =
      formData?.['2']?.['2A']?.access_management_data ||
      formData?.['2A']?.access_management_data;

    const authorizedPeople = accessData?.authorized_people;

    if (Array.isArray(authorizedPeople)) {
      authorizedPeople.forEach((person: any) => {
        if (!person?.person_name) return;

        contacts.push({
          name: person.person_name,
          email: person.email_address || '',
          source: 'Access Management',
        });
      });
    }

    return contacts;
  }, [formData]);

  const suggestedRecipients = useMemo(() => {
    const existing = new Set(
      letters.map(item => item.recipient.trim().toLowerCase()).filter(Boolean),
    );

    return recipientOptions.filter(
      item => item.name && !existing.has(item.name.trim().toLowerCase()),
    );
  }, [letters, recipientOptions]);

  const pendingCount = letters.filter(item => item.status !== 'sent').length;
  const letterCount = letters.filter(
    item => item.messageType === 'letter',
  ).length;
  const videoCount = letters.filter(
    item => item.messageType === 'video',
  ).length;
  const audioCount = letters.filter(
    item => item.messageType === 'audio',
  ).length;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastNotifiedLettersRef = useRef('');

  useEffect(() => {
    if (!onChangeRef.current) return;

    const serialized = JSON.stringify(letters, (_, value) =>
      value instanceof Date ? value.toISOString() : value,
    );

    if (serialized === lastNotifiedLettersRef.current) return;

    lastNotifiedLettersRef.current = serialized;
    onChangeRef.current(letters);
  }, [letters]);

  useEffect(() => {
    if (!token) return;

    setIsLoading(true);

    getMessages(token)
      .then((data: any[]) => {
        setLetters(data.map(normalizeLetter));
      })
      .catch(() => {
        toast.error('Failed to load messages');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  useEffect(() => {
    if (!clearNonce) return;

    setLetters([]);
    setCurrentLetter(null);
    setIsWriting(false);
    setUploadingMedia(false);
    setShowVideoPicker(false);
    setShowAudioPicker(false);
    setShowVideoRecorder(false);
    setShowAudioRecorder(false);
    lastNotifiedLettersRef.current = '[]';
    onChangeRef.current?.([]);
  }, [clearNonce]);

  const refreshMessages = async () => {
    if (!token) return;

    const data = await getMessages(token);
    setLetters(data.map(normalizeLetter));
  };

  const openNewMessage = (type: MessageType = 'letter') => {
    setDetailLetterId(null);
    setCurrentLetter({
      ...emptyLetter(),
      messageType: type,
    });
    setIsWriting(true);
    setShowTemplates(false);
  };

  const useTemplate = (template: (typeof letterTemplates)[number]) => {
    setCurrentLetter({
      ...emptyLetter(),
      title: template.title,
      content: template.content,
      messageType: 'letter',
    });
    setIsWriting(true);
    setShowTemplates(false);
  };

  const createSuggestedMessage = (recipient: RecipientOption) => {
    setCurrentLetter({
      ...emptyLetter(),
      title: `Letter to ${recipient.name}`,
      recipient: recipient.name,
      recipientEmail: recipient.email || '',
      messageType: 'letter',
      content: `Dear ${recipient.name},\n\nIf you are reading this letter, it means I am no longer with you. I wanted to share some important thoughts, love, and guidance with you.\n\n[Please personalize this message with your own words.]\n\nWith love,\n[Your name]`,
    });

    setIsWriting(true);
    setShowSuggestions(false);
  };

  const getSavedMediaForLetter = (letter?: Letter | null) =>
    letters.find(item => item.id === letter?.id)?.media;

  const deleteStandaloneMedia = async (media?: LetterMedia) => {
    if (!token || !media?.public_id) return;

    await deleteUploadedMessageMedia(token, media.public_id, media.type);
  };

  const cleanupUnsavedMedia = (letter?: Letter | null) => {
    const currentMedia = letter?.media;
    const savedMedia = getSavedMediaForLetter(letter);

    if (
      currentMedia?.public_id &&
      currentMedia.public_id !== savedMedia?.public_id
    ) {
      void deleteStandaloneMedia(currentMedia).catch(error => {
        console.error('Failed to delete unsaved message media:', error);
      });
    }
  };

  const closeEditor = ({
    cleanupMedia = true,
  }: {
    cleanupMedia?: boolean;
  } = {}) => {
    if (cleanupMedia) cleanupUnsavedMedia(currentLetter);

    setIsWriting(false);
    setCurrentLetter(null);
    setUploadingMedia(false);
    setShowVideoPicker(false);
    setShowAudioPicker(false);
    setShowVideoRecorder(false);
    setShowAudioRecorder(false);
  };

  const attachMedia = (media: LetterMedia) => {
    cleanupUnsavedMedia(currentLetter);

    setCurrentLetter(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        media,
      };
    });
  };

  const handleMediaUploaded = (media: LetterMedia) => {
    attachMedia(media);
    setShowVideoPicker(false);
    setShowAudioPicker(false);
    setShowVideoRecorder(false);
    setShowAudioRecorder(false);
    toast.success('Media attached successfully');
  };

  const prepareMediaFile = (file: File, type: 'video' | 'audio') => {
    if (file.type && file.type !== 'application/octet-stream') {
      return file;
    }

    return new File([file], file.name, {
      type: inferMediaContentType(
        file.name,
        type === 'video' ? 'video/mp4' : 'audio/mp4',
      ),
    });
  };

  const uploadSelectedMediaFile = async (
    selectedFile: File,
    type: 'video' | 'audio',
  ) => {
    if (!token) {
      toast.error('You are not logged in');
      return;
    }

    if (!isAllowedMediaFile(selectedFile, type)) {
      toast.error(`Please select a valid ${type} file.`);
      return;
    }

    const file = prepareMediaFile(selectedFile, type);
    const mediaLabel = type === 'video' ? 'Video' : 'Audio';

    try {
      setUploadingMedia(true);
      const media = await uploadMessageMedia(token, file);
      handleMediaUploaded(media);
    } catch (error) {
      console.error(`${mediaLabel} upload failed:`, error);
      const message =
        error instanceof Error ? error.message : `${mediaLabel} upload failed`;
      toast.error(message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const openMediaRecorder = () => {
    if (!currentLetter || uploadingMedia) return;

    if (currentLetter.messageType === 'video') {
      setShowVideoPicker(true);
      return;
    }

    if (currentLetter.messageType === 'audio') {
      setShowAudioPicker(true);
    }
  };

  const removeAttachedMedia = async () => {
    if (!currentLetter?.media) return;

    if (!token) {
      toast.error('You are not logged in');
      return;
    }

    const media = currentLetter.media;
    const savedMedia = getSavedMediaForLetter(currentLetter);
    const isSavedAttachment =
      Boolean(savedMedia?.public_id) &&
      savedMedia?.public_id === media.public_id;

    try {
      setDeletingMedia(true);

      if (isSavedAttachment) {
        await deleteMessageMedia(token, currentLetter.id);

        setLetters(prev =>
          prev.map(item =>
            item.id === currentLetter.id
              ? {
                  ...item,
                  media: undefined,
                  lastModified: new Date(),
                }
              : item,
          ),
        );

        setCurrentLetter(prev =>
          prev
            ? {
                ...prev,
                media: undefined,
              }
            : prev,
        );
      } else {
        await deleteStandaloneMedia(media);

        setCurrentLetter(prev =>
          prev
            ? {
                ...prev,
                media: savedMedia,
              }
            : prev,
        );
      }

      toast.success('Media deleted');
    } catch {
      toast.error('Media delete failed');
    } finally {
      setDeletingMedia(false);
    }
  };

  const changeMessageType = (messageType: MessageType) => {
    if (currentLetter?.messageType !== messageType) {
      cleanupUnsavedMedia(currentLetter);
    }

    setCurrentLetter(prev =>
      prev
        ? {
            ...prev,
            messageType,
            media: prev.messageType === messageType ? prev.media : undefined,
          }
        : prev,
    );
  };

  const validateBeforeSave = (message: Letter) => {
    if (!message.title.trim()) {
      toast.error('Please add a message title');
      return false;
    }

    if (!message.recipient.trim()) {
      toast.error('Please add a recipient');
      return false;
    }

    if (message.deliveryTrigger === 'date' && !message.deliveryDate) {
      toast.error('Please select a delivery date');
      return false;
    }

    if (message.messageType !== 'letter' && !message.media?.url) {
      toast.error('Please record or upload your media before saving');
      return false;
    }

    return true;
  };

  const saveMessage = async () => {
    if (!token) {
      toast.error('You are not logged in');
      return;
    }

    if (!currentLetter) return;
    if (!validateBeforeSave(currentLetter)) return;

    const payload = {
      title: currentLetter.title,
      subject: currentLetter.subject || '',
      content: currentLetter.content || '',
      recipient: currentLetter.recipient,
      recipient_email: currentLetter.recipientEmail || '',
      message_type: currentLetter.messageType,
      delivery_trigger: currentLetter.deliveryTrigger,
      delivery_date: currentLetter.deliveryDate || null,
      delivery_occasion: currentLetter.deliveryOccasion || null,
      media: currentLetter.media || null,
    };

    try {
      setSaving(true);

      const alreadyExists = letters.some(item => item.id === currentLetter.id);

      if (alreadyExists) {
        await updateMessage(token, currentLetter.id, payload);
        toast.success('Message updated');
      } else {
        await createMessage(token, payload);
        toast.success('Message saved');
      }

      closeEditor({ cleanupMedia: false });
      await refreshMessages();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const editMessage = (letter: Letter) => {
    setCurrentLetter(letter);
    setIsWriting(true);
    setDetailLetterId(null);

    if (!isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  const patchCurrentLetter = (patch: Partial<Letter>) => {
    setCurrentLetter(prev => (prev ? { ...prev, ...patch } : prev));
  };

  const detailLetter = useMemo(
    () => letters.find(item => item.id === detailLetterId) || null,
    [letters, detailLetterId],
  );

  const openMessageDetail = (letter: Letter) => {
    if (isMobile) {
      setDetailLetterId(letter.id);
      return;
    }
    editMessage(letter);
  };

  const removeMessage = async (id: string) => {
    if (!token) {
      toast.error('You are not logged in');
      return;
    }

    if (!confirm('Delete this message?')) return;

    if (id.startsWith('local-')) {
      setLetters(prev => prev.filter(item => item.id !== id));
      toast.success('Message removed');
      return;
    }

    try {
      await deleteMessage(token, id);
      await refreshMessages();
      toast.success('Message deleted');
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Delete failed');
    }
  };

  const deliverMessages = async () => {
    setIsDelivering(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 900));

      setLetters(prev =>
        prev.map(item =>
          item.status === 'sent'
            ? item
            : {
                ...item,
                status: 'sent',
              },
        ),
      );

      toast.success('Pending messages marked as delivered');
    } catch {
      toast.error('Delivery failed');
    } finally {
      setIsDelivering(false);
    }
  };

  const printMessage = (letter: Letter) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString();

    const content =
      letter.messageType === 'letter'
        ? letter.content || ''
        : `<p>${escapeHtml(letter.content || 'Media message')}</p>`;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(letter.title)}</title>
          <style>
            @page { margin: 1in; size: letter; }
            body {
              max-width: 8.5in;
              margin: 0 auto;
              padding: 24px;
              color: #222;
              font-family: Georgia, 'Times New Roman', serif;
              line-height: 1.7;
            }
            .header {
              text-align: center;
              border-bottom: 1px solid #ddd;
              padding-bottom: 20px;
              margin-bottom: 36px;
            }
            h1 {
              font-size: 28px;
              margin: 0 0 8px;
            }
            .meta {
              color: #555;
              font-size: 14px;
            }
            .content {
              font-size: 16px;
              white-space: pre-wrap;
            }
            .footer {
              border-top: 1px solid #ddd;
              margin-top: 48px;
              padding-top: 16px;
              text-align: center;
              color: #777;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${escapeHtml(letter.title || 'Personal Message')}</h1>
            <div class="meta">To: ${escapeHtml(letter.recipient || 'Recipient')}</div>
          </div>
          <div class="content">${content}</div>
          <div class="footer">Printed from Orderly Affairs on ${currentDate}</div>
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <div
      className={cn( 
        'w-full max-w-none',
        showHeader && 'min-h-screen bg-slate-50/70',
      )}
    >
      {showHeader && (
        <div className="sticky top-0 z-30 border-b bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-10 w-10 shrink-0 rounded-full p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold sm:text-lg">
                  Personal Messages
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Letters, video, and audio messages for loved ones
                </p>
              </div>
            </div>

            {!isWriting && (
              <Button type="button" size="sm" onClick={() => openNewMessage()}>
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
            )}
          </div>
        </div>
      )}

      <div
        className={cn(
          showHeader ? 'mx-auto max-w-7xl p-4 sm:p-6' : '',
          embeddedInSection && isMobile && 'p-0',
        )}
      >
        {!isWriting && (
          <div className={cn('space-y-5', embeddedInSection && isMobile && 'space-y-3')}>
            {(!embeddedInSection || !isMobile) && (
              <HeroPanel
                pendingCount={pendingCount}
                letterCount={letterCount}
                videoCount={videoCount}
                audioCount={audioCount}
                onCreate={() => openNewMessage()}
                onTemplates={() => setShowTemplates(prev => !prev)}
              />
            )}

            {embeddedInSection && isMobile && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-3 py-3 shadow-sm">
                <div>
                  <p className="text-sm font-semibold">Personal messages</p>
                  <p className="text-xs text-muted-foreground">
                    {letters.length} saved · {pendingCount} pending
                  </p>
                </div>
                <Button type="button" size="sm" onClick={() => openNewMessage()}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  New
                </Button>
              </div>
            )}

            {isLoading && (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center gap-3 p-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">
                    Loading personal messages...
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoading && suggestedRecipients.length > 0 && (
              <SuggestedPanel
                recipients={suggestedRecipients}
                open={showSuggestions}
                onToggle={() => setShowSuggestions(prev => !prev)}
                onCreate={createSuggestedMessage}
              />
            )}

            {showTemplates && (
              <TemplateGrid templates={letterTemplates} onUse={useTemplate} />
            )}

            {!isLoading && letters.length > 0 && (
              <div className={cn(isMobile ? 'space-y-2' : 'grid gap-4')}>
                {letters.map(letter =>
                  isMobile ? (
                    <MessageListItem
                      key={letter.id}
                      letter={letter}
                      onOpen={() => openMessageDetail(letter)}
                    />
                  ) : (
                    <MessageCard
                      key={letter.id}
                      letter={letter}
                      onEdit={() => editMessage(letter)}
                      onDelete={() => removeMessage(letter.id)}
                      onPrint={() => printMessage(letter)}
                    />
                  ),
                )}
              </div>
            )}

            {!isLoading && letters.length === 0 && (
              <EmptyState onCreate={() => openNewMessage()} />
            )}

            {isNextOfKin && (
              <Card className="border-purple-200 bg-purple-50/70">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-purple-950">
                        Next of Kin Delivery
                      </h3>
                      <p className="mt-1 text-sm text-purple-700">
                        Deliver all pending messages to their recipients.
                      </p>
                    </div>

                    <Button
                      type="button"
                      disabled={isDelivering || pendingCount === 0}
                      onClick={deliverMessages}
                      className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {isDelivering ? 'Delivering...' : 'Deliver Messages'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {isWriting && currentLetter && !isMobile && (
          <MessageEditorPanel
            currentLetter={currentLetter}
            letters={letters}
            recipientOptions={recipientOptions}
            saving={saving}
            deletingMedia={deletingMedia}
            onPatch={patchCurrentLetter}
            onChangeMessageType={changeMessageType}
            onOpenMedia={openMediaRecorder}
            onDeleteMedia={removeAttachedMedia}
            uploadingMedia={uploadingMedia}
            onSave={saveMessage}
            onClose={() => closeEditor()}
          />
        )}
      </div>

      <MediaMessagePicker
        type="video"
        open={showVideoPicker}
        uploading={uploadingMedia}
        onClose={() => setShowVideoPicker(false)}
        onRecord={() => setShowVideoRecorder(true)}
        onFileSelected={file => void uploadSelectedMediaFile(file, 'video')}
      />

      <MediaMessagePicker
        type="audio"
        open={showAudioPicker}
        uploading={uploadingMedia}
        onClose={() => setShowAudioPicker(false)}
        onRecord={() => setShowAudioRecorder(true)}
        onFileSelected={file => void uploadSelectedMediaFile(file, 'audio')}
      />

      {showVideoRecorder && (
        <SafeMediaRecorder
          type="video"
          token={token}
          onUploaded={handleMediaUploaded}
          onClose={() => setShowVideoRecorder(false)}
        />
      )}

      {showAudioRecorder && (
        <SafeMediaRecorder
          type="audio"
          token={token}
          onUploaded={handleMediaUploaded}
          onClose={() => setShowAudioRecorder(false)}
        />
      )}

      {/* Mobile message detail sheet */}
      {isMobile && detailLetter && (
        <MobileBottomSheet
          open={detailLetterId !== null}
          onClose={() => setDetailLetterId(null)}
          className="max-h-[92dvh]"
          labelledBy="message-detail-title"
        >
          <div className="flex h-full min-h-0 flex-col">
            <MobileSheetHandle />
            <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 pb-4 pt-1">
              <div className="min-w-0">
                <h3 id="message-detail-title" className="text-lg font-semibold">
                  Personal Message
                </h3>
                <p className="truncate text-sm text-muted-foreground">
                  {detailLetter.title || 'Untitled message'}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setDetailLetterId(null)}
                className="h-10 w-10 shrink-0 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div
              className={cn(
                'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4',
                MOBILE_SHEET_SCROLL_PADDING,
              )}
            >
              <MessageMobileDetails
                letter={detailLetter}
                onEdit={() => editMessage(detailLetter)}
                onPrint={() => printMessage(detailLetter)}
                onDelete={() => {
                  setDetailLetterId(null);
                  void removeMessage(detailLetter.id);
                }}
              />
            </div>
          </div>
        </MobileBottomSheet>
      )}

      {/* Mobile editor sheet */}
      {isMobile && isWriting && currentLetter && (
        <MobileBottomSheet
          open={isWriting}
          onClose={() => closeEditor()}
          className="h-[96dvh]"
          labelledBy="message-editor-title"
        >
          <div className="flex h-full min-h-0 flex-col">
            <MobileSheetHandle />
            <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 pb-4 pt-1">
              <div className="min-w-0">
                <h3 id="message-editor-title" className="text-lg font-semibold">
                  {letters.some(item => item.id === currentLetter.id)
                    ? 'Edit Message'
                    : 'New Message'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add recipient, delivery, and content
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => closeEditor()}
                className="h-10 w-10 shrink-0 rounded-full"
                aria-label="Close editor"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div
              className={cn(
                'min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-3',
                MOBILE_SHEET_SCROLL_PADDING,
              )}
            >
              <MessageEditorPanel
                currentLetter={currentLetter}
                letters={letters}
                recipientOptions={recipientOptions}
                saving={saving}
                deletingMedia={deletingMedia}
                embeddedInSheet
                onPatch={patchCurrentLetter}
                onChangeMessageType={changeMessageType}
                onOpenMedia={openMediaRecorder}
                onDeleteMedia={removeAttachedMedia}
                uploadingMedia={uploadingMedia}
                onSave={saveMessage}
                onClose={() => closeEditor()}
              />
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                variant="outline"
                onClick={() => closeEditor()}
                className="h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={saveMessage}
                className="h-11 rounded-xl"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </MobileBottomSheet>
      )}

    </div>
  );
}

/* ============================================================
   MAIN UI SECTIONS
============================================================ */

function HeroPanel({
  pendingCount,
  letterCount,
  videoCount,
  audioCount,
  onCreate,
  onTemplates,
}: {
  pendingCount: number;
  letterCount: number;
  videoCount: number;
  audioCount: number;
  onCreate: () => void;
  onTemplates: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border bg-card shadow-sm">
      <div className="relative p-5 sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_38%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full">
                <Heart className="mr-1 h-3 w-3" />
                Personal legacy
              </Badge>

              <Badge variant="outline" className="rounded-full">
                {pendingCount} pending
              </Badge>
            </div>

            <div>
              <h2 className="max-w-2xl text-xl font-semibold tracking-tight sm:text-2xl">
                Create meaningful messages for loved ones
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Write letters, record voice notes, or upload video messages.
                Everything stays organized by recipient and delivery timing.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[300px]">
            <Button type="button" size="lg" onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Message
            </Button>

            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={onTemplates}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Templates
            </Button>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<FileText className="h-4 w-4" />}
            label="Letters"
            value={letterCount}
          />
          <StatCard
            icon={<Video className="h-4 w-4" />}
            label="Videos"
            value={videoCount}
          />
          <StatCard
            icon={<Mic className="h-4 w-4" />}
            label="Audio"
            value={audioCount}
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Pending"
            value={pendingCount}
          />
        </div>
      </div>
    </div>
  );
}

function SuggestedPanel({
  recipients,
  open,
  onToggle,
  onCreate,
}: {
  recipients: RecipientOption[];
  open: boolean;
  onToggle: () => void;
  onCreate: (recipient: RecipientOption) => void;
}) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold">Suggested recipients</h3>
              <p className="text-sm text-muted-foreground">
                People from Access Management who do not have a message yet.
              </p>
            </div>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={onToggle}>
            {open ? 'Hide' : 'Show'} {recipients.length}
          </Button>
        </div>

        {open && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recipients.map((recipient, index) => (
              <div
                key={`${recipient.name}-${index}`}
                className="flex flex-col gap-3 rounded-2xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {recipient.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {recipient.email || recipient.source}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => onCreate(recipient)}
                  className="w-full sm:w-auto"
                >
                  Create
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TemplateGrid({
  templates,
  onUse,
}: {
  templates: typeof letterTemplates;
  onUse: (template: (typeof letterTemplates)[number]) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {templates.map((template, index) => (
        <Card
          key={index}
          onClick={() => onUse(template)}
          className="group cursor-pointer rounded-[24px] transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <CardContent className="p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>

            <h3 className="font-semibold">{template.title}</h3>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Start from a thoughtful draft and personalize it.
            </p>

            <Button type="button" className="mt-4 w-full" variant="outline">
              Use Template
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-8 text-center sm:p-12">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Heart className="h-8 w-8" />
        </div>

        <h3 className="text-lg font-semibold">No messages yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Create your first personal letter, video, or audio message for someone
          important.
        </p>

        <Button type="button" className="mt-5" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create First Message
        </Button>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   MOBILE LIST + DETAIL
============================================================ */

function MessageListItem({
  letter,
  onOpen,
}: {
  letter: Letter;
  onOpen: () => void;
}) {
  const isVideo = letter.messageType === 'video';
  const isAudio = letter.messageType === 'audio';
  const Icon = isVideo ? Video : isAudio ? Mic : FileText;
  const deliveryLabel =
    letter.deliveryTrigger === 'death' ? 'Upon death' : 'Specific date';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-sm transition active:scale-[0.99] active:bg-muted/30"
    >
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white',
          isVideo ? 'bg-rose-600' : isAudio ? 'bg-blue-600' : 'bg-primary',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate text-base font-semibold">
            {letter.title || 'Untitled message'}
          </span>
          {letter.status === 'sent' && (
            <Badge className="shrink-0 rounded-full bg-green-600 text-[10px]">
              Sent
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {letter.recipient || 'No recipient'} · {deliveryLabel}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}

function MessageMobileDetails({
  letter,
  onEdit,
  onPrint,
  onDelete,
}: {
  letter: Letter;
  onEdit: () => void;
  onPrint: () => void;
  onDelete: () => void;
}) {
  const isVideo = letter.messageType === 'video';
  const isAudio = letter.messageType === 'audio';
  const Icon = isVideo ? Video : isAudio ? Mic : FileText;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="rounded-full capitalize">
          <Icon className="mr-1 h-3 w-3" />
          {letter.messageType}
        </Badge>
        <Badge variant="outline" className="rounded-full">
          {letter.deliveryTrigger === 'death'
            ? 'Upon death'
            : 'Specific date'}
        </Badge>
        {letter.status === 'sent' && (
          <Badge className="rounded-full bg-green-600">Delivered</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border bg-muted/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recipient
          </p>
          <p className="mt-1 truncate text-sm font-semibold">
            {letter.recipient || 'Not set'}
          </p>
        </div>
        <div className="rounded-2xl border bg-muted/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Delivery
          </p>
          <p className="mt-1 text-sm font-semibold">
            {letter.deliveryTrigger === 'death'
              ? 'Upon death'
              : letter.deliveryDate
                ? new Date(letter.deliveryDate).toLocaleDateString()
                : 'Date not set'}
          </p>
        </div>
      </div>

      {letter.recipientEmail && (
        <div className="rounded-2xl border bg-background px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Email
          </p>
          <p className="mt-1 break-words text-sm [overflow-wrap:anywhere]">
            {letter.recipientEmail}
          </p>
        </div>
      )}

      {letter.messageType === 'letter' && letter.content && (
        <div className="rounded-2xl border bg-muted/25 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Preview
          </p>
          <p className="line-clamp-6 text-sm leading-6 text-muted-foreground">
            {stripHtml(letter.content)}
          </p>
        </div>
      )}

      {letter.media?.url && (
        <div className="rounded-2xl border bg-muted/25 p-3">
          {isVideo ? (
            <video
              controls
              src={letter.media.url}
              className="h-44 w-full rounded-xl bg-black object-cover"
            />
          ) : (
            <audio controls src={letter.media.url} className="w-full" />
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1 rounded-2xl border bg-muted/20 p-1">
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-h-[72px] flex-col gap-1.5 rounded-2xl py-2"
          onClick={onEdit}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted/60">
            <Edit2 className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Edit
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-h-[72px] flex-col gap-1.5 rounded-2xl py-2"
          onClick={onPrint}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Printer className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Print
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-h-[72px] flex-col gap-1.5 rounded-2xl py-2"
          onClick={onDelete}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Trash2 className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Delete
          </span>
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   EDITOR
============================================================ */

function MessageEditorPanel({
  currentLetter,
  letters,
  recipientOptions,
  saving,
  deletingMedia,
  embeddedInSheet = false,
  onPatch,
  onChangeMessageType,
  onOpenMedia,
  onDeleteMedia,
  uploadingMedia,
  onSave,
  onClose,
}: {
  currentLetter: Letter;
  letters: Letter[];
  recipientOptions: RecipientOption[];
  saving: boolean;
  deletingMedia: boolean;
  uploadingMedia: boolean;
  embeddedInSheet?: boolean;
  onPatch: (patch: Partial<Letter>) => void;
  onChangeMessageType: (type: MessageType) => void;
  onOpenMedia: () => void;
  onDeleteMedia: () => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className={cn('space-y-5', embeddedInSheet && 'space-y-4')}>
      {!embeddedInSheet && (
        <EditorHeader
          isEditing={letters.some(item => item.id === currentLetter.id)}
          onClose={onClose}
        />
      )}

      <div
        className={cn(
          'grid gap-5',
          !embeddedInSheet && 'xl:grid-cols-[minmax(0,1fr)_360px]',
        )}
      >
        <Card
          className={cn(
            'overflow-hidden rounded-[28px]',
            embeddedInSheet && 'rounded-2xl border-0 shadow-none',
          )}
        >
          <CardContent
            className={cn(
              'space-y-7 p-4 sm:p-6',
              embeddedInSheet && 'space-y-5 p-0',
            )}
          >
            <TypeSelector
              value={currentLetter.messageType}
              onChange={onChangeMessageType}
            />

            <BasicDetails
              letter={currentLetter}
              recipients={recipientOptions}
              onChange={onPatch}
            />

            <DeliverySection letter={currentLetter} onChange={onPatch} />

            {currentLetter.messageType === 'letter' ? (
              <LetterEditor letter={currentLetter} onChange={onPatch} />
            ) : (
              <MediaEditor
                letter={currentLetter}
                onAddMedia={onOpenMedia}
                onDeleteMedia={onDeleteMedia}
                deletingMedia={deletingMedia}
                uploadingMedia={uploadingMedia}
                onChange={onPatch}
              />
            )}

            {!embeddedInSheet && (
              <div className="sticky bottom-0 z-10 -mx-4 -mb-4 border-t bg-background/95 p-4 backdrop-blur sm:static sm:m-0 sm:border-t sm:bg-transparent sm:p-0">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={onSave}
                    className="h-11 flex-1 rounded-xl"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Message'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="h-11 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <PreviewSidebar letter={currentLetter} embeddedInSheet={embeddedInSheet} />
      </div>
    </div>
  );
}

function EditorHeader({
  isEditing,
  onClose,
}: {
  isEditing: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[28px] border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <Badge variant="outline" className="mb-2 rounded-full">
          {isEditing ? 'Editing' : 'New message'}
        </Badge>

        <h2 className="text-lg font-semibold sm:text-xl">
          {isEditing ? 'Edit Personal Message' : 'Create Personal Message'}
        </h2>

        <p className="text-sm text-muted-foreground">
          Add recipient, delivery timing, and your message content.
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="self-start rounded-full sm:self-auto"
      >
        <X className="mr-2 h-4 w-4" />
        Close
      </Button>
    </div>
  );
}

function TypeSelector({
  value,
  onChange,
}: {
  value: MessageType;
  onChange: (value: MessageType) => void;
}) {
  return (
    <div className="space-y-3">
      <Label className='pl-2 sm:pl-0'>Message Type</Label>

      <div className="grid gap-3 sm:grid-cols-3">
        <TypeCard
          active={value === 'letter'}
          icon={<FileText className="h-5 w-5" />}
          title="Letter"
          text="Write a rich text message"
          onClick={() => onChange('letter')}
        />

        <TypeCard
          active={value === 'video'}
          icon={<Video className="h-5 w-5" />}
          title="Video"
          text="Record or upload video"
          onClick={() => onChange('video')}
        />

        <TypeCard
          active={value === 'audio'}
          icon={<Mic className="h-5 w-5" />}
          title="Audio"
          text="Record or upload voice"
          onClick={() => onChange('audio')}
        />
      </div>
    </div>
  );
}

function BasicDetails({
  letter,
  recipients,
  onChange,
}: {
  letter: Letter;
  recipients: RecipientOption[];
  onChange: (patch: Partial<Letter>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FieldBlock label="Message Title">
        <Input
          value={letter.title}
          onChange={event => onChange({ title: event.target.value })}
          placeholder="e.g., Letter to My Children"
          className="h-11 rounded-xl"
        />
      </FieldBlock>

      <FieldBlock label="Recipient Email">
        <Input
          type="email"
          value={letter.recipientEmail}
          onChange={event => onChange({ recipientEmail: event.target.value })}
          placeholder="recipient@email.com"
          className="h-11 rounded-xl"
        />
      </FieldBlock>

      <FieldBlock label="Recipient Name" className="md:col-span-2">
        {recipients.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <Select
              value={letter.recipient}
              onValueChange={selectedName => {
                const selected = recipients.find(
                  item => item.name === selectedName,
                );

                onChange({
                  recipient: selectedName,
                  recipientEmail: selected?.email || letter.recipientEmail,
                });
              }}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select from Access Management" />
              </SelectTrigger>

              <SelectContent>
                {recipients.map((recipient, index) => (
                  <SelectItem
                    key={`${recipient.name}-${index}`}
                    value={recipient.name}
                  >
                    {recipient.name}
                    {recipient.email ? ` • ${recipient.email}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={letter.recipient}
              onChange={event => onChange({ recipient: event.target.value })}
              placeholder="Or type custom recipient"
              className="h-11 rounded-xl"
            />
          </div>
        ) : (
          <Input
            value={letter.recipient}
            onChange={event => onChange({ recipient: event.target.value })}
            placeholder="Who is this message for?"
            className="h-11 rounded-xl"
          />
        )}
      </FieldBlock>
    </div>
  );
}

function DeliverySection({
  letter,
  onChange,
}: {
  letter: Letter;
  onChange: (patch: Partial<Letter>) => void;
}) {
  return (
    <div className="space-y-3">
      <Label>Delivery Trigger</Label>

      <div className="grid gap-3 sm:grid-cols-2">
        <DeliveryCard
          active={letter.deliveryTrigger === 'death'}
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Upon death"
          text="Deliver when final verification occurs"
          onClick={() =>
            onChange({
              deliveryTrigger: 'death',
              deliveryDate: '',
              deliveryOccasion: '',
            })
          }
        />

        <DeliveryCard
          active={letter.deliveryTrigger === 'date'}
          icon={<Calendar className="h-5 w-5" />}
          title="Specific date"
          text="Schedule for birthday or occasion"
          onClick={() => onChange({ deliveryTrigger: 'date' })}
        />
      </div>

      {letter.deliveryTrigger === 'date' && (
        <div className="grid gap-4 rounded-2xl border bg-muted/30 p-4 md:grid-cols-2">
          <FieldBlock label="Delivery Date">
            <DatePicker
              value={letter.deliveryDate || ''}
              onChange={value => onChange({ deliveryDate: value || '' })}
              placeholder="Select delivery date"
            />
          </FieldBlock>

          <FieldBlock label="Occasion">
            <Input
              value={letter.deliveryOccasion || ''}
              onChange={event =>
                onChange({ deliveryOccasion: event.target.value })
              }
              placeholder="Birthday, anniversary, graduation..."
              className="h-11 rounded-xl"
            />
          </FieldBlock>
        </div>
      )}
    </div>
  );
}

function LetterEditor({
  letter,
  onChange,
}: {
  letter: Letter;
  onChange: (patch: Partial<Letter>) => void;
}) {
  return (
    <div className="space-y-4">
      <FieldBlock label="Letter Subject">
        <Input
          value={letter.subject || ''}
          onChange={event => onChange({ subject: event.target.value })}
          placeholder="Read this when you need me close"
          className="h-11 rounded-xl"
        />
      </FieldBlock>

      <div className="space-y-2">
        <Label>Letter Content</Label>
        <div className="overflow-hidden rounded-2xl border bg-background">
          <RichTextEditor
            value={letter.content || ''}
            onChange={content => onChange({ content })}
            placeholder="Write your heartfelt message here..."
          />
        </div>
      </div>
    </div>
  );
}

function MediaEditor({
  letter,
  onAddMedia,
  onDeleteMedia,
  deletingMedia,
  uploadingMedia,
  onChange,
}: {
  letter: Letter;
  onAddMedia: () => void;
  onDeleteMedia: () => void;
  deletingMedia: boolean;
  uploadingMedia: boolean;
  onChange: (patch: Partial<Letter>) => void;
}) {
  return (
    <div className="space-y-4">
      <MediaUploadPanel
        type={letter.messageType as 'video' | 'audio'}
        media={letter.media}
        onAddMedia={onAddMedia}
        onDelete={onDeleteMedia}
        deleting={deletingMedia}
        uploading={uploadingMedia}
      />

      <FieldBlock label="Message Description">
        <Textarea
          value={letter.content || ''}
          onChange={event => onChange({ content: event.target.value })}
          placeholder="Add a short description for this video or audio message..."
          rows={5}
          className="resize-none rounded-2xl"
        />
      </FieldBlock>
    </div>
  );
}

function PreviewSidebar({
  letter,
  embeddedInSheet = false,
}: {
  letter: Letter;
  embeddedInSheet?: boolean;
}) {
  return (
    <div
      className={cn(
        !embeddedInSheet && 'xl:sticky xl:top-6 xl:self-start',
      )}
    >
      <Card
        className={cn(
          'overflow-hidden rounded-[28px]',
          embeddedInSheet && 'rounded-2xl',
        )}
      >
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold">Message Preview</h3>
              <p className="text-xs text-muted-foreground">
                Review before saving
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <PreviewRow
              label="Type"
              value={
                letter.messageType === 'letter'
                  ? 'Written letter'
                  : letter.messageType === 'video'
                    ? 'Video message'
                    : 'Audio message'
              }
            />

            <PreviewRow
              label="Recipient"
              value={letter.recipient || 'Not selected'}
            />

            <PreviewRow
              label="Delivery"
              value={
                letter.deliveryTrigger === 'death'
                  ? 'Upon death'
                  : letter.deliveryDate || 'Date not selected'
              }
            />

            {letter.deliveryOccasion && (
              <PreviewRow label="Occasion" value={letter.deliveryOccasion} />
            )}

            {letter.media?.url && (
              <div className="rounded-2xl border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Attached media {formatFileSize(letter.media.size)}
                </p>

                {letter.messageType === 'video' ? (
                  <video
                    controls
                    src={letter.media.url}
                    className="h-40 w-full rounded-xl bg-black object-cover"
                  />
                ) : (
                  <audio controls src={letter.media.url} className="w-full" />
                )}
              </div>
            )}

            {letter.content && (
              <div className="rounded-2xl border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Content preview
                </p>
                <p className="line-clamp-5 text-sm leading-6">
                  {stripHtml(letter.content)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-background/80 p-4 shadow-sm backdrop-blur">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function FieldBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function TypeCard({
  active,
  icon,
  title,
  text,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-4 text-left transition hover:bg-muted/60',
        active
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-border bg-background',
      )}
    >
      <div
        className={cn(
          'mb-3 flex h-10 w-10 items-center justify-center rounded-xl',
          active
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-primary',
        )}
      >
        {icon}
      </div>

      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
    </button>
  );
}

function DeliveryCard({
  active,
  icon,
  title,
  text,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-2xl border p-4 text-left transition hover:bg-muted/60',
        active
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-border bg-background',
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          active
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-primary',
        )}
      >
        {icon}
      </div>

      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
      </div>
    </button>
  );
}

function MediaUploadPanel({
  type,
  media,
  onAddMedia,
  onDelete,
  deleting,
  uploading,
}: {
  type: 'video' | 'audio';
  media?: LetterMedia;
  onAddMedia: () => void;
  onDelete: () => void;
  deleting: boolean;
  uploading: boolean;
}) {
  const isVideo = type === 'video';

  return (
    <div className="rounded-[24px] border bg-muted/25 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm',
              isVideo ? 'bg-rose-600' : 'bg-blue-600',
            )}
          >
            {isVideo ? (
              <Video className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </div>

          <div>
            <h3 className="font-semibold">
              {isVideo ? 'Video Message' : 'Audio Message'}
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              {isVideo
                ? 'Record a new video, choose from your gallery, or upload a file.'
                : 'Record a new voice note, choose from your gallery, or upload a file.'}
            </p>
          </div>
        </div>

        {!media?.url && (
          <Button
            type="button"
            onClick={onAddMedia}
            disabled={uploading}
            className="h-11 rounded-xl lg:min-w-[200px]"
          >
            <Plus className="mr-2 h-4 w-4" />
            {uploading
              ? 'Uploading...'
              : isVideo
                ? 'Add Video'
                : 'Add Audio'}
          </Button>
        )}
      </div>

      {media?.url && (
        <div className="mt-5 rounded-2xl border bg-background p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium">
                {isVideo ? 'Video attached' : 'Audio attached'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {media.size && (
                <Badge variant="outline" className="rounded-full">
                  {formatFileSize(media.size)}
                </Badge>
              )}

              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={onDelete}
                className="h-9 rounded-xl"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>

          {isVideo ? (
            <video
              controls
              src={media.url}
              className="h-56 w-full rounded-xl bg-black object-cover sm:h-72"
            />
          ) : (
            <audio controls src={media.url} className="w-full" />
          )}
        </div>
      )}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="max-w-[180px] text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

function MessageCard({
  letter,
  onEdit,
  onDelete,
  onPrint,
}: {
  letter: Letter;
  onEdit: () => void;
  onDelete: () => void;
  onPrint: () => void;
}) {
  const isVideo = letter.messageType === 'video';
  const isAudio = letter.messageType === 'audio';
  const Icon = isVideo ? Video : isAudio ? Mic : FileText;

  return (
    <Card className="overflow-hidden rounded-[24px] transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full capitalize">
                <Icon className="mr-1 h-3 w-3" />
                {letter.messageType}
              </Badge>

              <Badge variant="outline" className="rounded-full">
                {letter.deliveryTrigger === 'death'
                  ? 'Upon death'
                  : 'Specific date'}
              </Badge>

              {letter.status === 'sent' && (
                <Badge className="rounded-full bg-green-600">Delivered</Badge>
              )}
            </div>

            <h3 className="mt-3 line-clamp-1 text-base font-semibold sm:text-lg">
              {letter.title || 'Untitled message'}
            </h3>

            <p className="mt-1 break-words text-sm text-muted-foreground">
              To: {letter.recipient || 'No recipient'}
              {letter.recipientEmail ? ` • ${letter.recipientEmail}` : ''}
            </p>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {letter.deliveryTrigger === 'date' && letter.deliveryDate && (
                <span>
                  📅 {new Date(letter.deliveryDate).toLocaleDateString()}
                </span>
              )}

              {letter.deliveryOccasion && (
                <span>🎉 {letter.deliveryOccasion}</span>
              )}

              <span>
                ✏️ {new Date(letter.lastModified).toLocaleDateString()}
              </span>
            </div>

            {letter.messageType === 'letter' && letter.content && (
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {stripHtml(letter.content)}
              </p>
            )}

            {letter.media?.url && (
              <div className="mt-4 rounded-2xl border bg-muted/25 p-3">
                {isVideo ? (
                  <video
                    controls
                    src={letter.media.url}
                    className="h-44 w-full rounded-xl bg-black object-cover sm:h-56"
                  />
                ) : (
                  <audio controls src={letter.media.url} className="w-full" />
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 border-t bg-muted/25 p-3 lg:w-[150px] lg:grid-cols-1 lg:border-l lg:border-t-0">
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Edit2 className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>

            <Button type="button" variant="outline" size="sm" onClick={onPrint}>
              <Printer className="mr-2 h-3.5 w-3.5" />
              Print
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Letters;
