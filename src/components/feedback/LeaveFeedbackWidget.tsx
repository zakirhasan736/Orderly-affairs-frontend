'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bug,
  CheckCircle2,
  HelpCircle,
  ImagePlus,
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@common/ui/utils';
import { useIsMobile } from '@/components/MobileBottomSheet';
import { VaultDetailDrawer } from '@/components/vault-prototype/VaultDetailDrawer';
import { uploadFile, deleteUpload } from '@/libs/api/upload';
import {
  submitFeedback,
  type FeedbackAttachment,
  type FeedbackCategory,
} from '@/libs/api/feedback';
import { useOptionalHelpAssistant } from '@/components/help/HelpAssistantContext';

const CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'idea',
    label: 'Idea',
    hint: 'A change that would make this better',
    icon: Lightbulb,
  },
  {
    id: 'bug',
    label: 'Bug',
    hint: 'Something looks broken or wrong',
    icon: Bug,
  },
  {
    id: 'confusing',
    label: 'Confusing',
    hint: 'Hard to understand or find',
    icon: HelpCircle,
  },
  {
    id: 'other',
    label: 'Other',
    hint: 'Anything else on your mind',
    icon: MessageSquarePlus,
  },
];

const RATINGS = [
  { value: 1, label: 'Frustrating' },
  { value: 2, label: 'Meh' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Love it' },
] as const;

export const OPEN_LEAVE_FEEDBACK_EVENT = 'orderly-open-feedback';

export function openLeaveFeedback() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_LEAVE_FEEDBACK_EVENT));
}

type PendingShot = FeedbackAttachment & { previewUrl?: string };

export function LeaveFeedbackWidget() {
  const help = useOptionalHelpAssistant();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('idea');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<PendingShot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_LEAVE_FEEDBACK_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_LEAVE_FEEDBACK_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      document.body.dataset.oaFeedbackOpen = '1';
    } else {
      delete document.body.dataset.oaFeedbackOpen;
    }
    return () => {
      delete document.body.dataset.oaFeedbackOpen;
    };
  }, [open]);

  const pagePath = useMemo(() => {
    if (typeof window === 'undefined') return '/dashboard';
    return `${window.location.pathname}${window.location.search || ''}`;
  }, [open]);

  const canSend = message.trim().length >= 8 && !uploading && !submitting;

  const resetForm = () => {
    setCategory('idea');
    setMessage('');
    setSubject('');
    setRating(null);
    setAttachments([]);
    setUploading(false);
    setSubmitting(false);
    setSent(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      window.setTimeout(() => resetForm(), 200);
    }
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = 3 - attachments.length;
    if (remaining <= 0) {
      toast.error('You can attach up to 3 screenshots');
      return;
    }

    const picked = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, remaining);

    if (!picked.length) {
      toast.error('Please choose an image file (PNG, JPG, or WebP)');
      return;
    }

    setUploading(true);
    try {
      for (const file of picked) {
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 8MB)`);
          continue;
        }
        const uploaded = await uploadFile(file);
        setAttachments(prev => [
          ...prev,
          {
            url: uploaded.url,
            public_id: uploaded.public_id,
            name: uploaded.name || file.name,
            type: uploaded.type || 'image',
            previewUrl: uploaded.url,
          },
        ]);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not upload screenshot. Please try again.',
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = async (index: number) => {
    const item = attachments[index];
    setAttachments(prev => prev.filter((_, i) => i !== index));
    if (item?.public_id) {
      try {
        await deleteUpload(item.public_id);
      } catch {
        /* best-effort cleanup */
      }
    }
  };

  const onSubmit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 8) {
      toast.error('Please add a bit more detail (at least a short sentence).');
      return;
    }
    if (uploading) {
      toast.error('Wait for screenshot upload to finish.');
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        category,
        message: trimmed,
        subject: subject.trim() || undefined,
        page_path: pagePath,
        rating,
        attachments: attachments.map(({ url, public_id, name, type }) => ({
          url,
          public_id,
          name,
          type,
        })),
      });
      setSent(true);
      toast.success('Thank you — your feedback was sent.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not send feedback',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  const showTriggers = !open && !help?.open;

  return (
    <>
      {showTriggers
        ? createPortal(
            isMobile ? (
              /* Mobile only: bottom icon FAB above Contact Support */
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Leave feedback"
                title="Leave feedback"
                className={cn(
                  'fixed z-[90] flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#2B5A8C] text-white shadow-lg ring-2 ring-white/90 transition hover:bg-[#213D59] active:scale-95',
                  'right-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom)+31px+0.5rem)]',
                )}
              >
                <MessageSquarePlus className="h-[13px] w-[13px]" />
              </button>
            ) : (
              /* Desktop only: vertical right-edge tab */
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Leave feedback"
                className={cn(
                  'fixed top-1/2 right-0 z-[95] flex -translate-y-1/2',
                  'items-center gap-2 rounded-l-lg rounded-r-none',
                  'bg-[#213D59] px-2.5 py-3 text-white shadow-lg',
                  'ring-1 ring-black/10 transition',
                  'hover:bg-[#00305C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B5A8C]',
                )}
              >
                <span
                  className="text-[11px] font-semibold tracking-[0.14em]"
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                  }}
                >
                  LEAVE FEEDBACK
                </span>
              </button>
            ),
            document.body,
          )
        : null}

      <VaultDetailDrawer
        open={open}
        onClose={() => handleOpenChange(false)}
        title={sent ? 'Thanks — sent' : 'Leave feedback'}
        subtitle={
          sent
            ? 'We read every note.'
            : 'Share an idea, a bug, or anything that would make the Vault clearer.'
        }
        icon={
          sent ? (
            <CheckCircle2 className="h-5 w-5 text-[#1F9D6B]" />
          ) : (
            <MessageSquarePlus className="h-5 w-5" />
          )
        }
        footer={
          sent ? (
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#213D59] px-5 text-[14px] font-semibold text-white"
            >
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#E4EAF0] bg-white px-4 text-[14px] font-semibold text-[#213D59]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSend}
                onClick={() => void onSubmit()}
                className={cn(
                  'inline-flex min-h-12 flex-1 items-center justify-center rounded-full px-5 text-[14px] font-semibold text-white',
                  canSend ? 'bg-[#213D59]' : 'bg-[#D7DEE5] text-white',
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send feedback'
                )}
              </button>
            </>
          )
        }
      >
        {sent ? (
          <p className="text-[13.5px] leading-relaxed text-[#7A8794]">
            Your note is with the team. You can keep using your Vault while we
            read it.
          </p>
        ) : (
          <div className="space-y-5">
            <section>
              <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#7A8794]">
                Type
              </p>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(item => {
                  const Icon = item.icon;
                  const active = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={item.hint}
                      onClick={() => setCategory(item.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-[12px] border px-1.5 py-3 transition',
                        active
                          ? 'border-[#213D59] bg-[#213D59] text-white'
                          : 'border-[#E4EAF0] bg-white text-[#213D59] hover:border-[#3EB1E5] hover:bg-[#EAF6FD]',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11.5px] font-semibold leading-none">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#7A8794]">
                Feeling
                <span className="font-semibold normal-case tracking-normal text-[#7A8794]">
                  {' '}
                  · optional
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {RATINGS.map(item => {
                  const active = rating === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setRating(prev =>
                          prev === item.value ? null : item.value,
                        )
                      }
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition',
                        active
                          ? 'border-[#213D59] bg-[#213D59] text-white'
                          : 'border-[#E4EAF0] bg-white text-[#6A7481] hover:border-[#3EB1E5]',
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <label
                  htmlFor="feedback-subject"
                  className="mb-1.5 block text-[12.5px] font-semibold text-[#6A7481]"
                >
                  Title
                </label>
                <input
                  id="feedback-subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={200}
                  placeholder="Short summary"
                  className="h-11 w-full rounded-[10px] border border-[#E4EAF0] bg-white px-3.5 text-[14.5px] text-[#213D59] outline-none placeholder:text-[#7A8794] focus:border-[#3EB1E5] focus:shadow-[0_0_0_3px_rgba(62,177,229,.14)]"
                />
              </div>
              <div>
                <label
                  htmlFor="feedback-message"
                  className="mb-1.5 block text-[12.5px] font-semibold text-[#6A7481]"
                >
                  Details <span className="text-[#C2442E]">*</span>
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={4000}
                  rows={5}
                  placeholder="What should we change?"
                  className="min-h-[104px] w-full resize-y rounded-[10px] border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14.5px] leading-[1.55] text-[#213D59] outline-none placeholder:text-[#7A8794] focus:border-[#3EB1E5] focus:shadow-[0_0_0_3px_rgba(62,177,229,.14)]"
                />
                <p className="mt-1.5 text-[12px] text-[#7A8794]">
                  {message.trim().length}/4000
                </p>
              </div>
            </section>

            <section>
              <p className="mb-1.5 text-[12.5px] font-semibold text-[#6A7481]">
                Screenshot
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={e => void onPickFiles(e.target.files)}
              />
              <button
                type="button"
                disabled={uploading || attachments.length >= 3}
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-[18px] rounded-[16px] border-2 border-dashed border-[#E4EAF0] bg-[#F6F8FA] px-6 py-[18px] text-left hover:border-[#3EB1E5] hover:bg-[#EAF6FD] disabled:opacity-60"
              >
                <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[13px] border border-[#E4EAF0] bg-white text-[#619FCE]">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-5 w-5" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15.5px] font-bold text-[#213D59]">
                    {uploading ? 'Uploading…' : 'Add a screenshot'}
                  </span>
                  <span className="mt-0.5 block text-[13.5px] text-[#7A8794]">
                    PNG, JPG, or WebP. Up to 3.
                    {attachments.length ? ` ${attachments.length}/3` : ''}
                  </span>
                </span>
              </button>
              {attachments.length > 0 ? (
                <ul className="mt-3 grid grid-cols-3 gap-2">
                  {attachments.map((item, index) => (
                    <li
                      key={`${item.public_id || item.url}-${index}`}
                      className="relative overflow-hidden rounded-[10px] border border-[#E4EAF0]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl || item.url}
                        alt={item.name || 'Screenshot'}
                        className="h-20 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => void removeAttachment(index)}
                        className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-[#213D59] text-white"
                        aria-label="Remove screenshot"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </div>
        )}
      </VaultDetailDrawer>
    </>
  );
}
