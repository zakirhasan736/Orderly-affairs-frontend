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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { Button } from '@/components/common/ui/button';
import { cn } from '@common/ui/utils';
import { useIsMobile } from '@/components/MobileBottomSheet';
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
    } catch {
      toast.error('Could not upload screenshot. Please try again.');
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

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            'flex flex-col gap-0 overflow-hidden border-slate-200/90 bg-white p-0 shadow-2xl',
            // Mobile: bottom sheet, compact
            'max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-bottom)))] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:pb-[env(safe-area-inset-bottom)]',
            // Desktop: centered card
            'sm:max-h-[min(88dvh,40rem)] sm:w-[min(100vw-2rem,34rem)] sm:max-w-[34rem] sm:rounded-2xl',
          )}
        >
          {sent ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center sm:px-8 sm:py-12">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/60 sm:mb-4 sm:h-14 sm:w-14">
                <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-[#213D59] sm:text-xl">
                Thanks — sent
              </h3>
              <p className="mt-1.5 text-sm text-slate-500">
                We read every note.
              </p>
              <Button
                className="mt-6 h-10 min-w-[7.5rem] rounded-full bg-[#213D59] px-5 hover:bg-[#00305C]"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="flex shrink-0 justify-center pt-2.5 sm:hidden" aria-hidden>
                <div className="h-1 w-10 rounded-full bg-slate-300/90" />
              </div>

              <DialogHeader className="shrink-0 space-y-0 border-b border-slate-100 px-4 pb-3 pt-2 text-left sm:px-5 sm:pb-3.5 sm:pt-4">
                <DialogTitle className="pr-8 text-base font-semibold tracking-tight text-[#213D59] sm:text-lg">
                  Leave feedback
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Share an idea, bug, or note about Orderly Affairs.
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3.5 sm:px-5 sm:py-4">
                <div className="space-y-4 sm:space-y-5">
                  <section>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
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
                              'flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 transition sm:py-3',
                              active
                                ? 'border-[#213D59] bg-[#213D59] text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50',
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-4 w-4',
                                active ? 'text-white' : 'text-[#213D59]',
                              )}
                            />
                            <span className="text-[11px] font-semibold leading-none sm:text-xs">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Feeling <span className="font-normal normal-case tracking-normal text-slate-400">· optional</span>
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
                              'rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition sm:px-3 sm:text-xs',
                              active
                                ? 'border-[#213D59] bg-[#213D59] text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                            )}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div>
                      <label
                        htmlFor="feedback-subject"
                        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                      >
                        Title{' '}
                        <span className="font-normal normal-case tracking-normal text-slate-400">
                          · optional
                        </span>
                      </label>
                      <input
                        id="feedback-subject"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        maxLength={200}
                        placeholder="Short summary"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-[#213D59]/15 placeholder:text-slate-400 focus:border-[#213D59] focus:ring-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="feedback-message"
                        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                      >
                        Details{' '}
                        <span className="font-normal normal-case tracking-normal text-rose-500">
                          · required
                        </span>
                      </label>
                      <textarea
                        id="feedback-message"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        maxLength={4000}
                        rows={3}
                        placeholder="What should we change?"
                        className="min-h-[5.5rem] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-900 outline-none ring-[#213D59]/15 placeholder:text-slate-400 focus:border-[#213D59] focus:ring-2 sm:min-h-[6.5rem]"
                      />
                      <p className="mt-1 text-right text-[10px] tabular-nums text-slate-400">
                        {message.trim().length}/4000
                      </p>
                    </div>
                  </section>

                  <section>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Screenshot{' '}
                      <span className="font-normal normal-case tracking-normal text-slate-400">
                        · optional
                      </span>
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
                      className={cn(
                        'flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-[#f8fafc] px-3 py-3 text-xs font-medium text-slate-600 transition sm:text-sm',
                        'hover:border-[#213D59]/40 hover:bg-[#213D59]/[0.03]',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                      )}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-4 w-4 text-[#213D59]" />
                          Add screenshot
                          {attachments.length > 0
                            ? ` (${attachments.length}/3)`
                            : ''}
                        </>
                      )}
                    </button>

                    {attachments.length > 0 ? (
                      <ul className="mt-2.5 grid grid-cols-3 gap-2">
                        {attachments.map((item, index) => (
                          <li
                            key={`${item.public_id || item.url}-${index}`}
                            className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
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
                              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white transition hover:bg-black"
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
              </div>

              <div
                className={cn(
                  'shrink-0 border-t border-slate-200/90 bg-white px-4 py-3 sm:px-5',
                  'pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3.5',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 rounded-full px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => handleOpenChange(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className={cn(
                      'h-10 min-w-[8.5rem] rounded-full px-5 text-sm font-semibold shadow-sm',
                      canSend
                        ? 'bg-[#213D59] hover:bg-[#00305C]'
                        : 'bg-slate-300 text-white hover:bg-slate-300',
                    )}
                    disabled={!canSend}
                    onClick={() => void onSubmit()}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Send'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
