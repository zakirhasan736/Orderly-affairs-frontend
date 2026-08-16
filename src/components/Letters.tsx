'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  MOBILE_SHEET_FOOTER_CLASS,
  MOBILE_SHEET_SCROLL_CLASS,
  MOBILE_SHEET_SCROLL_PADDING,
  MobileBottomSheet,
  MobileSheetHandle,
  useIsMobile,
} from '@/components/MobileBottomSheet';
import { useFamilyAcl } from '@/contexts/FamilyAclContext';

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
import { Sheet, SheetContent } from '@common/ui/sheet';

import { MediaMessagePicker } from '@/components/MediaMessagePicker';
import { PhotoCapture } from '@/components/PhotoCapture';
import { SafeMediaRecorder } from '@/components/SafeMediaRecorder';
import { RichTextEditor } from '@/components/RichTextEditor';
import { DatePicker } from '@/components/DatePicker';
import { VaultDetailDrawer } from '@/components/vault-prototype/VaultDetailDrawer';

import {
  createMessage,
  updateMessage,
  deleteMessage,
  deleteMessageMedia,
  deleteUploadedMessageMedia,
  getMessages,
  refreshMessageMediaUrl,
  uploadMessageMedia,
} from '@/libs/api/lettersOfNaxtKinMessage';
import {
  isAllowedMediaFile,
  isAllowedVideoMessageFile,
  isImageMedia,
  prepareMessageMediaFile,
} from '@/utils/mediaUpload';
import { toPlayableMediaUrl } from '@/utils/mediaPlayback';

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
  public_id?: string;
  s3_key?: string;
  s3_bucket?: string;
  storage?: string;
  type: string;
  format?: string;
  size?: number;
  mime_type?: string;
}

function mediaAssetId(media?: LetterMedia | null): string {
  if (!media) return '';
  return String(media.s3_key || media.public_id || '').trim();
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

/** Local HH:mm from an ISO datetime, for `<input type="time">`. */
function getLocalTimeValue(iso?: string | null): string {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${String(parsed.getHours()).padStart(2, '0')}:${String(
    parsed.getMinutes(),
  ).padStart(2, '0')}`;
}

/** Current device local time as HH:mm. */
function getDeviceLocalTimeValue(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`;
}

/** Merge calendar date + local HH:mm into an ISO string in the device timezone. */
function applyLocalTimeToDate(
  dateIso: string,
  timeHHmm?: string | null,
): string {
  const base = new Date(dateIso);
  if (Number.isNaN(base.getTime())) return dateIso;
  const [hoursRaw, minutesRaw] = String(timeHHmm || '09:00').split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  const next = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    Number.isFinite(hours) ? hours : 9,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0,
  );
  return next.toISOString();
}

function formatScheduledDelivery(iso?: string | null): string {
  if (!iso) return 'Date not set';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Date not set';
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function MessageMediaPreview({
  messageType,
  media,
  className,
}: {
  messageType: MessageType;
  media: LetterMedia;
  className?: string;
}) {
  const [src, setSrc] = useState(media.url || '');

  useEffect(() => {
    let cancelled = false;
    setSrc(media.url || '');

    const refresh = async () => {
      if (!mediaAssetId(media)) return;
      const fresh = await refreshMessageMediaUrl(
        media.public_id,
        media.type || (messageType === 'audio' ? 'video' : messageType),
        {
          s3_key: media.s3_key,
          storage: media.storage,
          s3_bucket: media.s3_bucket,
        },
      );
      if (!cancelled && fresh) setSrc(fresh);
    };
    void refresh();

    return () => {
      cancelled = true;
    };
  }, [
    media.public_id,
    media.s3_key,
    media.s3_bucket,
    media.storage,
    media.url,
    media.type,
    messageType,
  ]);

  if (messageType === 'audio') {
    return (
      <audio
        controls
        playsInline
        preload="metadata"
        src={toPlayableMediaUrl(src, 'audio')}
        className={className ?? 'w-full'}
      />
    );
  }

  if (isImageMedia(media)) {
    return (
      <img
        src={src}
        alt="Attached photo"
        className={className ?? 'h-44 w-full rounded-xl object-cover'}
      />
    );
  }

  return (
    <video
      controls
      playsInline
      preload="metadata"
      src={toPlayableMediaUrl(src, 'video')}
      className={className ?? 'h-44 w-full rounded-xl bg-black object-cover'}
    />
  );
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
  const { isReadOnly } = useFamilyAcl();

  const [letters, setLetters] = useState<Letter[]>(() => normalizeValue(value));
  const [currentLetter, setCurrentLetter] = useState<Letter | null>(null);

  const [isWriting, setIsWriting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState(false);

  useEffect(() => {
    if (!isReadOnly) return;
    if (!isWriting) return;
    setIsWriting(false);
    setCurrentLetter(null);
  }, [isReadOnly, isWriting]);

  const [showTemplates, setShowTemplates] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
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
    setIsLoading(true);

    getMessages()
      .then((data: any[]) => {
        setLetters(data.map(normalizeLetter));
      })
      .catch(() => {
        toast.error('Failed to load messages');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!clearNonce) return;

    setLetters([]);
    setCurrentLetter(null);
    setIsWriting(false);
    setUploadingMedia(false);
    setShowVideoPicker(false);
    setShowAudioPicker(false);
    setShowVideoRecorder(false);
    setShowPhotoCapture(false);
    setShowAudioRecorder(false);
    lastNotifiedLettersRef.current = '[]';
    onChangeRef.current?.([]);
  }, [clearNonce]);

  const refreshMessages = async () => {
    const data = await getMessages();
    setLetters(data.map(normalizeLetter));
  };

  const openNewMessage = (type: MessageType = 'letter') => {
    if (isReadOnly) {
      toast.error('Your family role is view-only.');
      return;
    }
    setDetailLetterId(null);
    setCurrentLetter({
      ...emptyLetter(),
      messageType: type,
    });
    setIsWriting(true);
    setShowTemplates(false);
  };

  const useTemplate = (template: (typeof letterTemplates)[number]) => {
    if (isReadOnly) {
      toast.error('Your family role is view-only.');
      return;
    }
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
    if (isReadOnly) {
      toast.error('Your family role is view-only.');
      return;
    }
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
    if (!mediaAssetId(media)) return;

    await deleteUploadedMessageMedia(media?.public_id, media?.type, {
      s3_key: media?.s3_key,
      storage: media?.storage,
    });
  };

  /** Remove prior attachment from S3 (and Mongo if already saved). */
  const disposePreviousMedia = async (
    letter?: Letter | null,
    nextMedia?: LetterMedia | null,
  ) => {
    const currentMedia = letter?.media;
    const currentId = mediaAssetId(currentMedia);
    const nextId = mediaAssetId(nextMedia);
    if (!currentId || (nextId && currentId === nextId)) return;

    const savedMedia = getSavedMediaForLetter(letter);
    const isSavedAttachment =
      Boolean(mediaAssetId(savedMedia)) &&
      mediaAssetId(savedMedia) === currentId &&
      Boolean(letter?.id) &&
      !String(letter?.id).startsWith('local-');

    try {
      if (isSavedAttachment && letter?.id) {
        await deleteMessageMedia(letter.id);
        setLetters(prev =>
          prev.map(item =>
            item.id === letter.id
              ? { ...item, media: undefined, lastModified: new Date() }
              : item,
          ),
        );
      } else {
        await deleteStandaloneMedia(currentMedia);
      }
    } catch (error) {
      console.error('Failed to delete previous message media from S3:', error);
      throw error;
    }
  };

  const cleanupUnsavedMedia = (letter?: Letter | null) => {
    const currentMedia = letter?.media;
    const savedMedia = getSavedMediaForLetter(letter);

    if (
      mediaAssetId(currentMedia) &&
      mediaAssetId(currentMedia) !== mediaAssetId(savedMedia)
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
    setShowPhotoCapture(false);
    setShowAudioRecorder(false);
  };

  const attachMedia = async (media: LetterMedia) => {
    const previous = currentLetter;
    // Attach new media first so a failed old-delete never drops the new upload.
    setCurrentLetter(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        media,
      };
    });

    try {
      await disposePreviousMedia(previous, media);
    } catch (error) {
      console.error('Failed to delete previous message media from S3:', error);
      toast.error(
        'New media attached, but the previous file may still be in storage. Try remove again or re-save.',
      );
    }
  };

  const handleMediaUploaded = async (media: LetterMedia) => {
    await attachMedia(media);
    setShowVideoPicker(false);
    setShowAudioPicker(false);
    setShowVideoRecorder(false);
    setShowPhotoCapture(false);
    setShowAudioRecorder(false);
    toast.success('Media attached successfully');
  };

  const uploadSelectedMediaFile = async (
    selectedFile: File,
    type: 'video' | 'audio',
  ) => {
    if (type === 'video') {
      if (!isAllowedVideoMessageFile(selectedFile)) {
        toast.error('Please select a valid video or image file.');
        return;
      }
    } else if (!isAllowedMediaFile(selectedFile, type)) {
      toast.error(`Please select a valid ${type} file.`);
      return;
    }

    const file = prepareMessageMediaFile(selectedFile, type);
    const mediaLabel =
      type === 'video' && file.type.startsWith('image/')
        ? 'Photo'
        : type === 'video'
          ? 'Video'
          : 'Audio';

    try {
      setUploadingMedia(true);
      const media = await uploadMessageMedia(
        file,
        type === 'audio'
          ? 'audio'
          : file.type.startsWith('image/')
            ? 'image'
            : 'video',
      );
      await handleMediaUploaded(media);
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

    const media = currentLetter.media;
    const savedMedia = getSavedMediaForLetter(currentLetter);
    const isSavedAttachment =
      Boolean(mediaAssetId(savedMedia)) &&
      mediaAssetId(savedMedia) === mediaAssetId(media);

    try {
      setDeletingMedia(true);

      if (isSavedAttachment) {
        await deleteMessageMedia(currentLetter.id);

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
    } catch (error) {
      console.error('Media delete failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Media delete failed',
      );
    } finally {
      setDeletingMedia(false);
    }
  };

  const changeMessageType = (messageType: MessageType) => {
    if (isReadOnly) return;
    if (currentLetter?.messageType !== messageType) {
      void disposePreviousMedia(currentLetter, null).catch(error => {
        console.error('Failed to clear media when changing message type:', error);
      });
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
      toast.error(
        message.messageType === 'video'
          ? 'Add a video before saving (tap + Add Video)'
          : 'Add audio before saving (tap + Add Audio)',
      );
      return false;
    }

    return true;
  };

  const saveMessage = async () => {
    if (!currentLetter) return;
    if (isReadOnly) {
      toast.error('Your family role is view-only.');
      return;
    }
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
        await updateMessage(currentLetter.id, payload);
        toast.success('Message updated');
      } else {
        const created = await createMessage(payload);
        const normalized = normalizeLetter({
          ...currentLetter,
          ...created,
          id: created?._id || created?.id || currentLetter.id,
        });
        setLetters(prev => {
          if (prev.some(item => item.id === normalized.id)) return prev;
          return [normalized, ...prev];
        });
        toast.success('Message saved');
      }

      closeEditor({ cleanupMedia: false });
      try {
        await refreshMessages();
      } catch {
        // Local list already updated from create response when possible.
      }
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const editMessage = (letter: Letter) => {
    if (isReadOnly) {
      openMessageDetail(letter);
      return;
    }
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
    if (isReadOnly) return;
    setCurrentLetter(prev => (prev ? { ...prev, ...patch } : prev));
  };

  const detailLetter = useMemo(
    () => letters.find(item => item.id === detailLetterId) || null,
    [letters, detailLetterId],
  );

  const openMessageDetail = (letter: Letter) => {
    // Viewers (and mobile): browse only — never open the editable composer.
    if (isMobile || isReadOnly) {
      setDetailLetterId(letter.id);
      return;
    }
    editMessage(letter);
  };

  const removeMessage = async (id: string) => {
    if (isReadOnly) {
      toast.error('Your family role is view-only.');
      return;
    }
    if (!confirm('Delete this message?')) return;

    if (id.startsWith('local-')) {
      setLetters(prev => prev.filter(item => item.id !== id));
      toast.success('Message removed');
      return;
    }

    try {
      await deleteMessage(id);
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

    const contentHtml =
      letter.messageType === 'letter'
        ? `<p>${escapeHtml(stripHtml(letter.content) || '')
            .split('\n')
            .join('<br/>')}</p>`
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
          <div class="content">${contentHtml}</div>
          <div class="footer">Printed from Orderly Affairs on ${escapeHtml(currentDate)}</div>
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const editorOpen = Boolean(isWriting && currentLetter && !isReadOnly);
  const isEditingExisting = Boolean(
    currentLetter && letters.some(item => item.id === currentLetter.id),
  );
  const mediaOverlayOpen =
    showVideoPicker ||
    showAudioPicker ||
    showVideoRecorder ||
    showPhotoCapture ||
    showAudioRecorder;

  const dismissMediaOverlays = () => {
    setShowVideoPicker(false);
    setShowAudioPicker(false);
    setShowVideoRecorder(false);
    setShowPhotoCapture(false);
    setShowAudioRecorder(false);
  };

  const handleEditorOpenChange = (open: boolean) => {
    if (open) return;
    // Clicks inside the portaled media picker/recorder look "outside" the
    // Sheet — dismiss media first instead of destroying the whole editor.
    if (mediaOverlayOpen) {
      dismissMediaOverlays();
      return;
    }
    closeEditor();
  };

  const renderMessageEditorShell = () => {
    if (!currentLetter) return null;

    return (
      <>
        {isMobile && <MobileSheetHandle />}

        <div
          className={cn(
            'shrink-0 border-b px-4 pb-3 sm:px-6 sm:pb-4',
            isMobile ? 'pt-1' : 'pt-5',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                id="message-editor-title"
                className="text-left text-base font-semibold sm:text-xl"
              >
                {isEditingExisting ? 'Edit Message' : 'New Message'}
              </h2>
              {!isMobile && (
                <p className="mt-1 text-left text-sm text-muted-foreground">
                  Choose type, recipient, delivery, and content — then save.
                </p>
              )}
            </div>
            {isMobile && (
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
            )}
          </div>
        </div>

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6',
            MOBILE_SHEET_SCROLL_CLASS,
            isMobile
              ? cn('py-3', MOBILE_SHEET_SCROLL_PADDING)
              : 'py-5',
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

        <div
          className={cn(
            'shrink-0 border-t px-4 py-3 sm:px-6 sm:py-4',
            isMobile
              ? cn(
                  MOBILE_SHEET_FOOTER_CLASS,
                  'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
                )
              : 'bg-background/95 backdrop-blur',
          )}
        >
          <div
            className={cn(
              'flex w-full gap-2',
              isMobile
                ? 'grid grid-cols-2'
                : 'flex-col-reverse sm:flex-row sm:justify-between',
            )}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => closeEditor()}
              className={cn(
                'h-11 rounded-xl touch-manipulation',
                isMobile ? '' : 'w-auto',
              )}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void saveMessage()}
              className={cn(
                'relative z-10 h-11 rounded-xl touch-manipulation',
                isMobile ? '' : 'w-auto min-w-[9rem]',
              )}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : isMobile ? 'Save' : 'Save Message'}
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      className={cn(
        'w-full max-w-none',
        showHeader && 'min-h-screen bg-slate-50/70',
        embeddedInSection &&
          isMobile &&
          'pb-[calc(5.5rem+env(safe-area-inset-bottom))]',
      )}
      data-oa-family-readonly={isReadOnly ? 'true' : undefined}
    >
      {isReadOnly ? (
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          View-only — browse messages here. Creating or editing requires Editor
          or higher.
        </div>
      ) : null}
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

            {!isReadOnly && (
              <Button type="button" size="sm" data-oa-mutate onClick={() => openNewMessage()}>
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
        <div
          className={cn(
            'space-y-5',
            embeddedInSection && isMobile && 'space-y-2',
          )}
        >
            {embeddedInSection ? (
              <EmbeddedMessagesToolbar
                pendingCount={pendingCount}
                letterCount={letterCount}
                videoCount={videoCount}
                audioCount={audioCount}
                readOnly={isReadOnly}
                onCreate={() => openNewMessage()}
                onTemplates={() => setShowTemplates(prev => !prev)}
              />
            ) : (
              <HeroPanel
                pendingCount={pendingCount}
                letterCount={letterCount}
                videoCount={videoCount}
                audioCount={audioCount}
                readOnly={isReadOnly}
                onCreate={() => openNewMessage()}
                onTemplates={() => setShowTemplates(prev => !prev)}
              />
            )}

            {isLoading && (
              <Card
                className={cn(
                  'border-dashed',
                  embeddedInSection && isMobile && 'border-0 bg-transparent shadow-none',
                )}
              >
                <CardContent
                  className={cn(
                    'flex items-center justify-center gap-3 p-8',
                    embeddedInSection && isMobile && 'p-4',
                  )}
                >
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">
                    Loading messages...
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoading && !isReadOnly && suggestedRecipients.length > 0 && (
              <SuggestedPanel
                recipients={suggestedRecipients}
                open={showSuggestions}
                onToggle={() => setShowSuggestions(prev => !prev)}
                onCreate={createSuggestedMessage}
                compact={embeddedInSection && isMobile}
              />
            )}

            {showTemplates && !isReadOnly && (!embeddedInSection || !isMobile) && (
              <TemplateGrid templates={letterTemplates} onUse={useTemplate} />
            )}

            {!isLoading && letters.length > 0 && (
              <div
                className={cn(
                  isMobile
                    ? 'space-y-2.5'
                    : 'grid gap-3 sm:grid-cols-1 xl:grid-cols-2',
                )}
              >
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
                      readOnly={isReadOnly}
                    />
                  ),
                )}
              </div>
            )}

            {!isLoading && letters.length === 0 && (
              <EmptyState
                onCreate={() => openNewMessage()}
                compact={embeddedInSection && isMobile}
                embedded={embeddedInSection}
                readOnly={isReadOnly}
              />
            )}

            {isNextOfKin && !isReadOnly && (
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
      </div>

      <MediaMessagePicker
        type="video"
        open={showVideoPicker}
        uploading={uploadingMedia}
        onClose={() => setShowVideoPicker(false)}
        onRecord={() => setShowVideoRecorder(true)}
        onTakePhoto={() => setShowPhotoCapture(true)}
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
          onUploaded={handleMediaUploaded}
          onClose={() => setShowVideoRecorder(false)}
        />
      )}

      <PhotoCapture
        open={showPhotoCapture}
        uploading={uploadingMedia}
        onClose={() => setShowPhotoCapture(false)}
        onPhotoCaptured={file => {
          void uploadSelectedMediaFile(file, 'video');
        }}
      />

      {showAudioRecorder && (
        <SafeMediaRecorder
          type="audio"
          onUploaded={handleMediaUploaded}
          onClose={() => setShowAudioRecorder(false)}
        />
      )}

      {/* Mobile message detail drawer */}
      <VaultDetailDrawer
        open={isMobile && detailLetterId !== null && !!detailLetter}
        onClose={() => setDetailLetterId(null)}
        title="Personal Message"
        subtitle={detailLetter?.title || 'Untitled message'}
        icon={<Heart className="h-5 w-5" />}
        footer={
          detailLetter ? (
            <MessageMobileActionBar
              readOnly={isReadOnly}
              onEdit={() => editMessage(detailLetter)}
              onPrint={() => printMessage(detailLetter)}
              onDelete={() => {
                setDetailLetterId(null);
                void removeMessage(detailLetter.id);
              }}
            />
          ) : null
        }
      >
        {detailLetter ? (
          <MessageMobileDetails
            letter={detailLetter}
            hideActions
            onEdit={() => editMessage(detailLetter)}
            onPrint={() => printMessage(detailLetter)}
            onDelete={() => {
              setDetailLetterId(null);
              void removeMessage(detailLetter.id);
            }}
          />
        ) : null}
      </VaultDetailDrawer>

      <VaultDetailDrawer
        open={editorOpen}
        onClose={() => handleEditorOpenChange(false)}
        title={isEditingExisting ? 'Edit Message' : 'New Message'}
        subtitle="Choose type, recipient, delivery, and content, then save."
        icon={<FileText className="h-5 w-5" />}
        hideHeader
        padded={false}
        wide
      >
        {renderMessageEditorShell()}
      </VaultDetailDrawer>

      {isMobile &&
        embeddedInSection &&
        !isWriting &&
        detailLetterId === null && (
          <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 md:hidden">
            <Button
              type="button"
              onClick={() => openNewMessage()}
              className="h-12 w-full rounded-2xl shadow-lg shadow-primary/20"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </div>
        )}

    </div>
  );
}

/* ============================================================
   MAIN UI SECTIONS
============================================================ */

function EmbeddedMessagesToolbar({
  pendingCount,
  letterCount,
  videoCount,
  audioCount,
  onCreate,
  onTemplates,
  readOnly = false,
}: {
  pendingCount: number;
  letterCount: number;
  videoCount: number;
  audioCount: number;
  onCreate: () => void;
  onTemplates: () => void;
  readOnly?: boolean;
}) {
  const total = letterCount + videoCount + audioCount;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
        <span className="inline-flex h-10 items-center rounded-full border border-[#E4EAF0] bg-white px-3.5 text-[13px] font-semibold text-[#213D59]">
          All ({total})
        </span>
        <span className="inline-flex h-10 items-center rounded-full border border-[#E4EAF0] bg-white px-3.5 text-[13px] text-[#7A8794]">
          Letters {letterCount}
        </span>
        <span className="inline-flex h-10 items-center rounded-full border border-[#E4EAF0] bg-white px-3.5 text-[13px] text-[#7A8794]">
          Video {videoCount}
        </span>
        <span className="inline-flex h-10 items-center rounded-full border border-[#E4EAF0] bg-white px-3.5 text-[13px] text-[#7A8794]">
          Audio {audioCount}
        </span>
        <span className="inline-flex h-10 items-center rounded-full border border-[#E4EAF0] bg-white px-3.5 text-[13px] text-[#7A8794]">
          Pending {pendingCount}
        </span>
      </div>
      {!readOnly ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onTemplates}
            className="inline-flex h-10 items-center rounded-full border border-[#E4EAF0] bg-white px-4 text-[13px] font-semibold text-[#213D59]"
          >
            Templates
          </button>
          <button
            type="button"
            data-oa-mutate
            onClick={onCreate}
            className="inline-flex h-10 items-center rounded-full bg-[#213D59] px-4 text-[13px] font-semibold text-white"
          >
            New message
          </button>
        </div>
      ) : (
        <p className="text-[12px] font-medium text-[#7A8794]">View only</p>
      )}
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'neutral' | 'rose' | 'blue' | 'amber';
}) {
  const tones = {
    neutral: 'bg-background text-foreground ring-slate-200/80',
    rose: 'bg-rose-50/80 text-rose-800 ring-rose-200/60',
    blue: 'bg-blue-50/80 text-blue-800 ring-blue-200/60',
    amber: 'bg-amber-50/80 text-amber-900 ring-amber-200/60',
  };

  return (
    <div
      className={cn(
        'flex min-w-[5.5rem] items-center gap-2 rounded-xl px-2.5 py-2 ring-1',
        tones[tone],
      )}
    >
      <span className="shrink-0 opacity-80">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-none tabular-nums">{value}</p>
        <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wide opacity-70">
          {label}
        </p>
      </div>
    </div>
  );
}

function HeroPanel({
  pendingCount,
  letterCount,
  videoCount,
  audioCount,
  onCreate,
  onTemplates,
  readOnly = false,
}: {
  pendingCount: number;
  letterCount: number;
  videoCount: number;
  audioCount: number;
  onCreate: () => void;
  onTemplates: () => void;
  readOnly?: boolean;
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
              {readOnly ? (
                <Badge variant="outline" className="rounded-full">
                  View only
                </Badge>
              ) : null}
            </div>

            <div>
              <h2 className="max-w-2xl text-xl font-semibold tracking-tight sm:text-2xl">
                {readOnly
                  ? 'Personal messages for loved ones'
                  : 'Create meaningful messages for loved ones'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {readOnly
                  ? 'Browse letters, voice notes, and video messages. Editing is locked for your family role.'
                  : 'Write letters, record voice notes, or upload video messages. Everything stays organized by recipient and delivery timing.'}
              </p>
            </div>
          </div>

          {!readOnly ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[300px]">
            <Button type="button" size="lg" data-oa-mutate onClick={onCreate}>
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
          ) : null}
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
  compact = false,
}: {
  recipients: RecipientOption[];
  open: boolean;
  onToggle: () => void;
  onCreate: (recipient: RecipientOption) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="rounded-2xl border bg-primary/5">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <Users className="h-4 w-4 shrink-0 text-primary" />
            <p className="truncate text-sm font-medium">
              {recipients.length} suggested recipient
              {recipients.length === 1 ? '' : 's'}
            </p>
          </div>
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition',
              open && 'rotate-90',
            )}
          />
        </button>

        {open && (
          <div className="space-y-2 border-t px-3 pb-3 pt-2">
            {recipients.map((recipient, index) => (
              <div
                key={`${recipient.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-xl border bg-background px-3 py-2"
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
                  className="h-8 shrink-0 rounded-lg px-2.5 text-xs"
                >
                  Create
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

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

function EmptyState({
  onCreate,
  compact = false,
  embedded = false,
  readOnly = false,
}: {
  onCreate: () => void;
  compact?: boolean;
  embedded?: boolean;
  readOnly?: boolean;
}) {
  if (compact) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Heart className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-semibold">No messages yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {readOnly
            ? 'Nothing has been created for you to view yet.'
            : 'Tap New Message below to get started.'}
        </p>
      </div>
    );
  }

  if (embedded) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-background px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
          <Heart className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-lg font-semibold tracking-tight">
          Your messages will appear here
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Write a letter, record video, or capture audio — each one is saved
          for the right person at the right time.
        </p>
        {!readOnly ? (
        <Button type="button" className="mt-6 rounded-xl" data-oa-mutate onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create First Message
        </Button>
        ) : null}
      </div>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="p-8 text-center sm:p-12">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Heart className="h-8 w-8" />
        </div>

        <h3 className="text-lg font-semibold">No messages yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {readOnly
            ? 'No personal messages are available to view yet.'
            : 'Create your first personal letter, video, or audio message for someone important.'}
        </p>

        {!readOnly ? (
        <Button type="button" className="mt-5" data-oa-mutate onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create First Message
        </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ============================================================
   MOBILE LIST + DETAIL
============================================================ */

function MessageMobileActionBar({
  onEdit,
  onPrint,
  onDelete,
  readOnly = false,
}: {
  onEdit: () => void;
  onPrint: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className={cn('grid gap-1', readOnly ? 'grid-cols-1' : 'grid-cols-3')}>
      {!readOnly ? (
      <Button
        type="button"
        variant="ghost"
        data-oa-mutate
        className="h-auto min-h-[68px] flex-col gap-1.5 rounded-2xl py-2"
        onClick={onEdit}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60">
          <Edit2 className="h-5 w-5" />
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          Edit
        </span>
      </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        data-oa-view-ok
        className="h-auto min-h-[68px] flex-col gap-1.5 rounded-2xl py-2"
        onClick={onPrint}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Printer className="h-5 w-5" />
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          Print
        </span>
      </Button>
      {!readOnly ? (
      <Button
        type="button"
        variant="ghost"
        data-oa-mutate
        className="h-auto min-h-[68px] flex-col gap-1.5 rounded-2xl py-2"
        onClick={onDelete}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <Trash2 className="h-5 w-5" />
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          Delete
        </span>
      </Button>
      ) : null}
    </div>
  );
}

function MessageListItem({
  letter,
  onOpen,
}: {
  letter: Letter;
  onOpen: () => void;
}) {
  const meta = getMessageTypeMeta(letter.messageType);
  const { Icon, shortLabel, iconBg } = meta;
  const isDelivered = letter.status === 'sent';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col rounded-[14px] border border-[#E4EAF0] bg-white p-4 text-left"
    >
      <div className="mb-2 flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#213D59] text-sm font-bold text-white">
          {(letter.recipient || 'M').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-[#213D59]">
            {letter.title || 'Untitled message'}
          </p>
          <p className="truncate text-[12.5px] text-[#7A8794]">
            {letter.recipient || 'No recipient'} · {shortLabel}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-semibold',
            isDelivered
              ? 'bg-[#E8F6F0] text-[#1F9D6B]'
              : 'bg-[#FDF4E4] text-[#B4761A]',
          )}
        >
          {isDelivered ? 'Sealed' : 'Draft'}
        </span>
      </div>
      <p className="text-[12.5px] text-[#7A8794]">
        {formatDeliverySummary(letter)}
      </p>
    </button>
  );
}

function MessageMobileDetails({
  letter,
  onEdit,
  onPrint,
  onDelete,
  hideActions = false,
}: {
  letter: Letter;
  onEdit: () => void;
  onPrint: () => void;
  onDelete: () => void;
  hideActions?: boolean;
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
              : formatScheduledDelivery(letter.deliveryDate)}
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
          <MessageMediaPreview
            messageType={letter.messageType}
            media={letter.media}
          />
        </div>
      )}

      {!hideActions && (
        <MessageMobileActionBar
          onEdit={onEdit}
          onPrint={onPrint}
          onDelete={onDelete}
        />
      )}
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
    <div className={cn('space-y-5', embeddedInSheet && 'space-y-5')}>
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
            embeddedInSheet &&
              'rounded-none border-0 bg-transparent shadow-none',
          )}
        >
          <CardContent
            className={cn(
              'space-y-7 p-4 sm:p-6',
              embeddedInSheet && 'space-y-6 p-0',
            )}
          >
            <TypeSelector
              value={currentLetter.messageType}
              onChange={onChangeMessageType}
              compact={embeddedInSheet}
            />

            <BasicDetails
              letter={currentLetter}
              recipients={recipientOptions}
              onChange={onPatch}
              compact={embeddedInSheet}
            />

            <DeliverySection
              letter={currentLetter}
              onChange={onPatch}
              compact={embeddedInSheet}
            />

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

        {!embeddedInSheet && (
          <PreviewSidebar letter={currentLetter} embeddedInSheet={embeddedInSheet} />
        )}
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
  compact = false,
}: {
  value: MessageType;
  onChange: (value: MessageType) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Label className={cn(!compact && 'pl-2 sm:pl-0')}>Message Type</Label>

      <div
        className={cn(
          'grid gap-2.5 sm:gap-3',
          compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3',
        )}
      >
        <TypeCard
          active={value === 'letter'}
          icon={<FileText className="h-5 w-5" />}
          title="Letter"
          text="Write a rich text message"
          compact={compact}
          onClick={() => onChange('letter')}
        />

        <TypeCard
          active={value === 'video'}
          icon={<Video className="h-5 w-5" />}
          title="Video"
          text="Record or upload video"
          compact={compact}
          onClick={() => onChange('video')}
        />

        <TypeCard
          active={value === 'audio'}
          icon={<Mic className="h-5 w-5" />}
          title="Audio"
          text="Record or upload voice"
          compact={compact}
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
  compact = false,
}: {
  letter: Letter;
  recipients: RecipientOption[];
  onChange: (patch: Partial<Letter>) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        compact ? 'grid-cols-2 gap-3' : 'md:grid-cols-2',
      )}
    >
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

      <FieldBlock
        label="Recipient Name"
        className={compact ? 'sm:col-span-2' : 'md:col-span-2'}
      >
        {recipients.length > 0 ? (
          <div
            className={cn(
              'grid gap-3',
              compact ? 'grid-cols-1' : 'md:grid-cols-[1fr_1fr]',
            )}
          >
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

              <SelectContent className="z-[200] max-h-[min(60dvh,320px)]">
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
  compact = false,
}: {
  letter: Letter;
  onChange: (patch: Partial<Letter>) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Label>Delivery Trigger</Label>

      <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'sm:grid-cols-2')}>
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
        <div
          className={cn(
            'grid gap-4 rounded-2xl border bg-muted/30 p-4',
            compact
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'md:grid-cols-3',
          )}
        >
          <FieldBlock label="Delivery Date">
            <DatePicker
              value={letter.deliveryDate || ''}
              onChange={value => {
                if (!value) {
                  onChange({ deliveryDate: '' });
                  return;
                }
                const time =
                  getLocalTimeValue(letter.deliveryDate) ||
                  getDeviceLocalTimeValue();
                onChange({
                  deliveryDate: applyLocalTimeToDate(value, time),
                });
              }}
              placeholder="Select delivery date"
              sheetTitle="Choose delivery date"
            />
          </FieldBlock>

          <FieldBlock label="Delivery Time">
            <Input
              type="time"
              value={getLocalTimeValue(letter.deliveryDate)}
              onChange={event => {
                const time = event.target.value;
                if (!letter.deliveryDate) {
                  const today = new Date();
                  const seed = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate(),
                  ).toISOString();
                  onChange({
                    deliveryDate: applyLocalTimeToDate(
                      seed,
                      time || getDeviceLocalTimeValue(),
                    ),
                  });
                  return;
                }
                onChange({
                  deliveryDate: applyLocalTimeToDate(
                    letter.deliveryDate,
                    time || getDeviceLocalTimeValue(),
                  ),
                });
              }}
              className="h-11 rounded-xl"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              Uses your device&apos;s local time zone.
            </p>
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
                  : formatScheduledDelivery(letter.deliveryDate)
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

                {letter.messageType === 'video' || letter.messageType === 'audio' ? (
                  <MessageMediaPreview
                    messageType={letter.messageType}
                    media={letter.media}
                    className="h-40 w-full rounded-xl bg-black object-cover"
                  />
                ) : null}
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
  compact = false,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border text-left transition hover:bg-muted/60',
        compact ? 'p-3' : 'p-4',
        active
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-border bg-background',
      )}
    >
      <div
        className={cn(
          'mb-2 flex items-center justify-center rounded-xl',
          compact ? 'h-9 w-9' : 'mb-3 h-10 w-10',
          active
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-primary',
        )}
      >
        {icon}
      </div>

      <p className={cn('font-semibold', compact && 'text-sm')}>{title}</p>
      <p
        className={cn(
          'mt-1 leading-5 text-muted-foreground',
          compact ? 'hidden text-[11px] sm:line-clamp-2 sm:block' : 'text-xs',
        )}
      >
        {text}
      </p>
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
    <div className="rounded-2xl border bg-muted/25 p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm',
              isVideo ? 'bg-rose-600' : 'bg-blue-600',
            )}
          >
            {isVideo ? (
              <Video className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">
              {isVideo ? 'Video Message' : 'Audio Message'}
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {isVideo
                ? 'Record a new video, take a photo, choose from your gallery, or upload a file.'
                : 'Record a new voice note, choose from your gallery, or upload a file.'}
            </p>
          </div>
        </div>

        {!media?.url && (
          <Button
            type="button"
            onClick={onAddMedia}
            disabled={uploading}
            className="h-11 w-full rounded-xl"
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
        <div className="mt-4 rounded-2xl border bg-background p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
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
            <MessageMediaPreview
              messageType="video"
              media={media}
              className="aspect-video max-h-64 w-full rounded-xl bg-black object-cover"
            />
          ) : (
            <MessageMediaPreview
              messageType="audio"
              media={media}
              className="w-full"
            />
          )}

          <Button
            type="button"
            variant="outline"
            onClick={onAddMedia}
            disabled={uploading}
            className="mt-3 h-10 w-full rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : isVideo ? 'Replace Video' : 'Replace Audio'}
          </Button>
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

function getRecipientInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('');
}

function getMessageTypeMeta(messageType: MessageType) {
  switch (messageType) {
    case 'video':
      return {
        Icon: Video,
        label: 'Video message',
        shortLabel: 'Video',
        gradient: 'from-rose-500 via-rose-400 to-rose-300',
        iconBg: 'bg-gradient-to-br from-rose-600 to-rose-500',
        chip: 'bg-rose-50 text-rose-800 ring-rose-200/70',
        previewAccent: 'border-rose-400/60',
      };
    case 'audio':
      return {
        Icon: Mic,
        label: 'Audio message',
        shortLabel: 'Audio',
        gradient: 'from-blue-600 via-blue-500 to-blue-400',
        iconBg: 'bg-gradient-to-br from-blue-600 to-blue-500',
        chip: 'bg-blue-50 text-blue-800 ring-blue-200/70',
        previewAccent: 'border-blue-400/60',
      };
    default:
      return {
        Icon: FileText,
        label: 'Written letter',
        shortLabel: 'Letter',
        gradient: 'from-slate-700 via-slate-600 to-slate-500',
        iconBg: 'bg-gradient-to-br from-slate-800 to-slate-600',
        chip: 'bg-slate-100 text-slate-800 ring-slate-200/80',
        previewAccent: 'border-slate-400/60',
      };
  }
}

function formatDeliverySummary(letter: Letter) {
  if (letter.deliveryTrigger === 'death') {
    return 'Upon death';
  }
  const datePart = formatScheduledDelivery(letter.deliveryDate);
  return letter.deliveryOccasion
    ? `${datePart} · ${letter.deliveryOccasion}`
    : datePart;
}

function MessageStatusPill({ delivered }: { delivered: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1',
        delivered
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/80'
          : 'bg-amber-50 text-amber-800 ring-amber-200/70',
      )}
    >
      {delivered ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Delivered
        </>
      ) : (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Pending
        </>
      )}
    </span>
  );
}

function MessageCardActionRail({
  letter,
  onEdit,
  onDelete,
  onPrint,
  readOnly = false,
}: {
  letter: Letter;
  onEdit: () => void;
  onDelete: () => void;
  onPrint: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 bg-muted/20 px-4 py-3">
      {!readOnly ? (
      <Button type="button" variant="outline" size="sm" data-oa-mutate onClick={onEdit} className="rounded-xl">
        <Edit2 className="mr-1.5 h-3.5 w-3.5" />
        Edit
      </Button>
      ) : null}
      {letter.messageType === 'letter' && (
        <Button type="button" variant="outline" size="sm" data-oa-view-ok onClick={onPrint} className="rounded-xl">
          <Printer className="mr-1.5 h-3.5 w-3.5" />
          Print
        </Button>
      )}
      {!readOnly ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-oa-mutate
        onClick={onDelete}
        className="rounded-xl text-destructive hover:bg-accent hover:text-destructive"
      >
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        Delete
      </Button>
      ) : null}
    </div>
  );
}

function MessageCard({
  letter,
  onEdit,
  onDelete,
  onPrint,
  readOnly = false,
}: {
  letter: Letter;
  onEdit: () => void;
  onDelete: () => void;
  onPrint: () => void;
  readOnly?: boolean;
}) {
  const meta = getMessageTypeMeta(letter.messageType);
  const { Icon, shortLabel, iconBg, gradient } = meta;
  const isDelivered = letter.status === 'sent';
  const recipientName = letter.recipient || 'No recipient';
  const initials = getRecipientInitials(recipientName);
  const letterPreview =
    letter.messageType === 'letter' ? stripHtml(letter.content) : '';
  const hasVideo = Boolean(
    letter.media?.url && letter.messageType === 'video',
  );
  const hasAudio = Boolean(
    letter.media?.url && letter.messageType === 'audio',
  );
  const editedLabel = letter.lastModified.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      className={cn(
        'flex flex-col rounded-[16px] border border-[#E4EAF0] bg-white p-[18px] max-md:rounded-[14px]',
        !isDelivered && !letterPreview && 'border-[#EBD9B4]',
      )}
    >
      <div className="mb-3.5 flex items-center gap-3">
        <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#213D59] text-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15.5px] font-bold text-[#213D59]">
            {letter.title || 'Untitled message'}
          </p>
          <p className="truncate text-[12.5px] text-[#7A8794]">
            {recipientName}
            {letter.recipientEmail ? `, ${letter.recipientEmail}` : ''}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[11.5px] font-semibold',
            isDelivered
              ? 'bg-[#E8F6F0] text-[#1F9D6B]'
              : 'bg-[#FDF4E4] text-[#B4761A]',
          )}
        >
          {isDelivered ? 'Sealed' : 'Draft'}
        </span>
      </div>
      <div
        className={cn(
          'flex-1 rounded-[11px] px-3.5 py-3.5 text-[13.5px] leading-relaxed',
          letterPreview
            ? 'bg-[#F6F8FA] italic text-[#414A55]'
            : 'bg-[#FDF4E4] text-[#8A5A10]',
        )}
      >
        {letterPreview
          ? letterPreview
          : hasVideo || hasAudio
            ? `${shortLabel} attached. Open the editor to review it.`
            : 'This message is still empty. If it were delivered today, they would find nothing addressed to them.'}
      </div>
      {(hasVideo || hasAudio) && letter.media ? (
        <div className="mt-3">
          <MessageMediaPreview
            messageType={letter.messageType}
            media={letter.media}
            className={hasVideo ? 'h-24 w-full rounded-[11px] object-cover' : 'w-full'}
          />
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#7A8794]">
        <span>{shortLabel}</span>
        <span>{formatDeliverySummary(letter)}</span>
        <span>{editedLabel}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!readOnly ? (
          <button
            type="button"
            data-oa-mutate
            onClick={onEdit}
            className="inline-flex min-h-11 items-center rounded-full bg-[#213D59] px-4 text-[13px] font-semibold text-white"
          >
            Open editor
          </button>
        ) : null}
        <button
          type="button"
          data-oa-view-ok
          onClick={onPrint}
          className="inline-flex min-h-11 items-center rounded-full border border-[#E4EAF0] bg-white px-4 text-[13px] font-semibold text-[#213D59]"
        >
          Preview
        </button>
        {!readOnly ? (
          <button
            type="button"
            data-oa-mutate
            onClick={onDelete}
            className="inline-flex min-h-11 items-center rounded-full border border-[#EBCFC9] bg-white px-4 text-[13px] font-semibold text-[#C0392B]"
          >
            Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default Letters;
