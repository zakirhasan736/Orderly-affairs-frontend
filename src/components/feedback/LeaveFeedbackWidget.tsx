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
import { uploadFile, deleteUpload } from '@/libs/api/upload';
import {
  submitFeedback,
  type FeedbackAttachment,
  type FeedbackCategory,
} from '@/libs/api/feedback';

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

type PendingShot = FeedbackAttachment & { previewUrl?: string };

export function LeaveFeedbackWidget() {
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

  return (
    <>
      {createPortal(
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Leave feedback"
          className={cn(
            'fixed top-1/2 right-0 z-[95] -translate-y-1/2',
            'flex items-center gap-2 rounded-l-lg rounded-r-none',
            'bg-[#213D59] px-2.5 py-3 text-white shadow-lg',
            'ring-1 ring-black/10 transition',
            'hover:bg-[#00305C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B5A8C]',
            open && 'pointer-events-none opacity-0',
          )}
        >
          <span
            className="select-none text-[11px] font-semibold tracking-[0.14em]"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            LEAVE FEEDBACK
          </span>
        </button>,
        document.body,
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            'flex max-h-[min(92dvh,44rem)] w-[min(100vw-1.25rem,40rem)] flex-col gap-0 overflow-hidden border-slate-200/90 p-0 shadow-2xl',
            'sm:max-w-[40rem]',
          )}
        >
          {sent ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-[#213D59]">
                Thanks for helping us improve
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
                Your note is with our team. We read every submission.
              </p>
              <Button
                className="mt-8 h-11 min-w-[8.5rem] rounded-full bg-[#213D59] px-6 hover:bg-[#00305C]"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* Sticky header */}
              <DialogHeader className="shrink-0 space-y-1.5 border-b border-slate-100 bg-gradient-to-b from-[#f7f9fc] to-white px-6 pb-4 pt-5 pr-12 text-left sm:px-7 sm:pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2B5A8C]">
                  Leave feedback
                </p>
                <DialogTitle className="text-[1.35rem] font-semibold tracking-tight text-[#213D59] sm:text-2xl">
                  What Would You Change?
                </DialogTitle>
                <DialogDescription className="text-[13.5px] leading-relaxed text-slate-600">
                  Tell us what would make Orderly Affairs clearer, faster, or
                  more useful. Screenshots help a lot.
                </DialogDescription>
              </DialogHeader>

              {/* Scrollable body only */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-7">
                <div className="space-y-6">
                  <section>
                    <p className="mb-2.5 text-[12px] font-semibold text-slate-700">
                      1. What kind of feedback?
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {CATEGORIES.map(item => {
                        const Icon = item.icon;
                        const active = category === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setCategory(item.id)}
                            className={cn(
                              'rounded-xl border px-3 py-3 text-left transition',
                              active
                                ? 'border-[#213D59] bg-[#213D59] text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50',
                            )}
                          >
                            <Icon
                              className={cn(
                                'mb-2 h-4.5 w-4.5 h-[18px] w-[18px]',
                                active ? 'text-white' : 'text-[#213D59]',
                              )}
                            />
                            <span className="block text-sm font-semibold">
                              {item.label}
                            </span>
                            <span
                              className={cn(
                                'mt-0.5 block text-[11px] leading-snug',
                                active ? 'text-white/80' : 'text-slate-500',
                              )}
                            >
                              {item.hint}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <p className="mb-2.5 text-[12px] font-semibold text-slate-700">
                      2. How does this feel?{' '}
                      <span className="font-normal text-slate-400">
                        Optional
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
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
                              'rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition',
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

                  <section className="space-y-4">
                    <div>
                      <label
                        htmlFor="feedback-subject"
                        className="mb-1.5 block text-[12px] font-semibold text-slate-700"
                      >
                        3. Short title{' '}
                        <span className="font-normal text-slate-400">
                          Optional
                        </span>
                      </label>
                      <input
                        id="feedback-subject"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        maxLength={200}
                        placeholder="e.g. Hard to find next-of-kin letter preview"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none ring-[#213D59]/15 placeholder:text-slate-400 focus:border-[#213D59] focus:ring-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="feedback-message"
                        className="mb-1.5 block text-[12px] font-semibold text-slate-700"
                      >
                        4. Your feedback{' '}
                        <span className="font-normal text-rose-500">
                          Required
                        </span>
                      </label>
                      <textarea
                        id="feedback-message"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        maxLength={4000}
                        rows={4}
                        placeholder="What would you change, and why? Be specific — steps, section names, or what you expected."
                        className="min-h-[7.5rem] w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-900 outline-none ring-[#213D59]/15 placeholder:text-slate-400 focus:border-[#213D59] focus:ring-2"
                      />
                      <div className="mt-1.5 flex items-center justify-between gap-3">
                        <p className="text-[11px] text-slate-400">
                          {message.trim().length < 8
                            ? 'Add at least a short sentence to send.'
                            : 'Looks good — you can send when ready.'}
                        </p>
                        <p className="shrink-0 text-[11px] tabular-nums text-slate-400">
                          {message.trim().length}/4000
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <p className="mb-1.5 text-[12px] font-semibold text-slate-700">
                      5. Screenshot{' '}
                      <span className="font-normal text-slate-400">
                        Optional · up to 3
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
                        'flex w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-slate-300 bg-[#f8fafc] px-4 py-4 text-sm font-medium text-slate-600 transition',
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
                          Attach a screenshot
                        </>
                      )}
                    </button>

                    {attachments.length > 0 ? (
                      <ul className="mt-3 grid grid-cols-3 gap-2.5">
                        {attachments.map((item, index) => (
                          <li
                            key={`${item.public_id || item.url}-${index}`}
                            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.previewUrl || item.url}
                              alt={item.name || 'Screenshot'}
                              className="h-24 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => void removeAttachment(index)}
                              className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white transition hover:bg-black"
                              aria-label="Remove screenshot"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <p className="mt-3 truncate text-[11px] text-slate-400">
                      Sending from {pagePath}
                    </p>
                  </section>
                </div>
              </div>

              {/* Sticky floating footer — always visible */}
              <div
                className={cn(
                  'shrink-0 border-t border-slate-200/90 bg-white/95 px-6 py-3.5 backdrop-blur-md sm:px-7',
                  'pb-[max(0.875rem,env(safe-area-inset-bottom))]',
                  'shadow-[0_-8px_24px_rgba(15,23,42,0.06)]',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 rounded-full px-4 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => handleOpenChange(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className={cn(
                      'h-11 min-w-[9.5rem] rounded-full px-6 font-semibold shadow-sm',
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
                      'Send feedback'
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
