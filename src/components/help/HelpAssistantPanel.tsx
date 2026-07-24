'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Headphones,
  Mail,
  MapPin,
  Mic,
  PlayCircle,
  SendHorizontal,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { cn } from '@common/ui/utils';
import { Button } from '@/components/common/ui/button';
import { useHelpAssistant } from '@/components/help/HelpAssistantContext';
import {
  SUPPORT_EMAIL,
  type HelpChatAction,
  type HelpChatMessage,
} from '@/utils/helpAssistantBrain';
import { toast } from 'sonner';

type HelpAssistantPanelProps = {
  onStartTour?: () => void;
  onNavigateToSection?: (sectionId: string) => void;
  onFocusUpload?: () => void;
  currentSectionId?: string | null;
};

const QUICK_CHIPS = [
  'Start a tour',
  'Help with insurance',
  'Fill vehicle section',
  'Email support',
  'Talk to live agent',
  'Upload a document',
  'Explain access people',
  'Write a next of kin letter',
];

function SuggestionRail({
  chips,
  disabled,
  onPick,
}: {
  chips: string[];
  disabled?: boolean;
  onPick: (chip: string) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    scrollLeft: number;
    moved: boolean;
  }>({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    el.scrollLeft = drag.scrollLeft - delta;
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (el?.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    dragRef.current.active = false;
  };

  return (
    <div className="mb-2">
      <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Suggestions — drag to browse · tap to refresh reply
      </p>
      <div
        ref={railRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex cursor-grab gap-1.5 overflow-x-auto pb-1 active:cursor-grabbing touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {chips.map(chip => (
          <button
            key={chip}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (dragRef.current.moved) {
                dragRef.current.moved = false;
                return;
              }
              onPick(chip);
            }}
            className="shrink-0 rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-[#475569] shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5" aria-label="Assistant is typing">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7c3aed]"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

function ChatBubble({
  message,
  onAction,
}: {
  message: HelpChatMessage;
  onAction: (action: HelpChatAction) => void;
}) {
  const isUser = message.role === 'user';
  const isLive = message.role === 'live_agent';
  const isSystem = message.role === 'system';

  return (
    <div
      className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser ? (
        <span
          className={cn(
            'mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-white',
            isLive
              ? 'bg-[#10213f] text-white'
              : isSystem
                ? 'bg-slate-200 text-slate-600'
                : 'bg-white/80 text-[#7c3aed]',
          )}
        >
          {isLive ? (
            <Headphones className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
        </span>
      ) : null}
      <div
        className={cn(
          'max-w-[88%] rounded-[22px] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm sm:text-sm',
          isUser
            ? 'rounded-br-md bg-[#1e1b4b] text-white'
            : isLive
              ? 'rounded-bl-md border border-[#10213f]/15 bg-[#10213f] text-white'
              : isSystem
                ? 'rounded-bl-md border border-slate-200 bg-slate-100/90 text-slate-600'
                : 'rounded-bl-md border border-white/70 bg-white/75 text-[#334155] backdrop-blur-md',
          message.animate && !isUser && 'animate-in fade-in slide-in-from-bottom-1 duration-300',
        )}
      >
        {isLive ? (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/70">
            Live agent
          </p>
        ) : null}
        <p className="whitespace-pre-wrap">{message.text}</p>
        {message.actions?.length ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.actions.map((action, index) => (
              <button
                key={`${message.id}-a-${index}`}
                type="button"
                onClick={() => onAction(action)}
                className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#1e1b4b] shadow-sm transition hover:bg-white"
              >
                {action.type === 'tour' && (
                  <>
                    <PlayCircle className="h-3 w-3" /> Start tour
                  </>
                )}
                {action.type === 'upload' && (
                  <>
                    <UploadCloud className="h-3 w-3" /> Upload doc
                  </>
                )}
                {action.type === 'email' && (
                  <>
                    <Mail className="h-3 w-3" /> Email us
                  </>
                )}
                {action.type === 'live_agent' && (
                  <>
                    <Headphones className="h-3 w-3" /> Live agent
                  </>
                )}
                {(action.type === 'navigate' ||
                  action.type === 'fill_section') && (
                  <>
                    <MapPin className="h-3 w-3" />{' '}
                    {action.type === 'fill_section'
                      ? `Fill ${action.label}`
                      : `Open ${action.label}`}
                  </>
                )}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function HelpAssistantPanel({
  onStartTour,
  onNavigateToSection,
  onFocusUpload,
  currentSectionId,
}: HelpAssistantPanelProps) {
  const {
    open,
    mode,
    messages,
    liveMessages,
    isTyping,
    liveConnected,
    liveConnecting,
    liveError,
    closeHelp,
    setMode,
    sendMessage,
    applySuggestion,
    sendLiveMessage,
    connectLiveAgent,
    pushAssistant,
  } = useHelpAssistant();
  const [draft, setDraft] = useState('');
  const [liveDraft, setLiveDraft] = useState('');
  const [liveSending, setLiveSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState(
    'Help with my Orderly Affairs vault',
  );
  const [emailBody, setEmailBody] = useState('');
  const [mounted, setMounted] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, liveMessages, isTyping, open, mode]);

  const sectionHint = useMemo(() => {
    if (mode === 'live') {
      if (liveConnecting) return 'Connecting to live agent…';
      if (liveConnected) return 'Live with Orderly Affairs support';
      return 'Live agent';
    }
    if (!currentSectionId || currentSectionId === 'dashboard') {
      return 'Ask anything about your vault';
    }
    return `You’re in section ${currentSectionId}`;
  }, [currentSectionId, mode, liveConnected, liveConnecting]);

  const runAction = (action: HelpChatAction) => {
    if (action.type === 'tour') {
      closeHelp();
      onStartTour?.();
      toast.success('Starting guided tour');
      return;
    }
    if (action.type === 'navigate' || action.type === 'fill_section') {
      onNavigateToSection?.(action.sectionId);
      pushAssistant({
        text:
          action.type === 'fill_section'
            ? `Opening ${action.label}. Upload a document or edit fields there — I can also fill from the dashboard upload.`
            : `Taking you to ${action.label}.`,
      });
      if (action.type === 'fill_section') {
        window.setTimeout(() => onFocusUpload?.(), 400);
      }
      return;
    }
    if (action.type === 'upload') {
      closeHelp();
      onNavigateToSection?.('dashboard');
      window.setTimeout(() => onFocusUpload?.(), 350);
      toast.message('Open the document upload on your dashboard');
      return;
    }
    if (action.type === 'email') {
      setMode('email');
      return;
    }
    if (action.type === 'live_agent') {
      void connectLiveAgent();
      toast.message('Connecting you to a live agent…');
    }
  };

  const submitChat = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!draft.trim() || isTyping) return;
    sendMessage(draft);
    setDraft('');
  };

  const submitEmail = (event: React.FormEvent) => {
    event.preventDefault();
    const subject = encodeURIComponent(
      emailSubject.trim() || 'Orderly Affairs support',
    );
    const body = encodeURIComponent(
      `${emailBody.trim()}\n\n— Sent from Orderly Affairs help assistant`,
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    toast.success('Opening your email app');
    pushAssistant({
      text: `Email form ready for ${SUPPORT_EMAIL}. Prefer chat? Connect a live agent — their replies show here from our admin inbox.`,
      actions: [{ type: 'live_agent' }, { type: 'tour' }],
    });
    setMode('chat');
  };

  const submitLive = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = liveDraft.trim();
    if (!text || liveSending) return;
    setLiveSending(true);
    try {
      await sendLiveMessage(text);
      setLiveDraft('');
    } catch {
      toast.error('Could not send — try again in a moment');
    } finally {
      setLiveSending(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-stretch justify-center sm:items-center sm:p-4 md:p-6">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-[#1a1030]/45 backdrop-blur-[6px]"
        aria-label="Close help"
        onClick={closeHelp}
      />

      <div
        className={cn(
          'relative z-10 flex h-[100dvh] w-full max-w-[560px] flex-col overflow-hidden bg-white pointer-events-auto sm:h-[min(92dvh,820px)] sm:rounded-[32px] sm:border sm:border-white/50 sm:shadow-[0_30px_80px_rgba(40,20,80,0.28)]',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Orderly Affairs assistant"
        onClick={event => event.stopPropagation()}
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,#efe8ff_0%,#f7e9f4_28%,#eaf4ff_58%,#eef8f3_100%)]" />
        <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-[#c4b5fd]/35 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-24 h-48 w-48 rounded-full bg-[#fda4af]/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-24 left-1/3 h-40 w-40 rounded-full bg-[#93c5fd]/30 blur-3xl" />

        <header className="relative z-10 flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.85rem,env(safe-area-inset-top))] sm:px-5 sm:pt-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-[#5b21b6] shadow-sm ring-1 ring-white/80 backdrop-blur">
              {mode === 'live' ? (
                <Headphones className="h-5 w-5 text-[#10213f]" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight text-[#1e1b4b]">
                orderly
              </p>
              <p className="truncate text-[11px] font-medium text-[#64748b]">
                {sectionHint}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-white/55 p-1 shadow-sm ring-1 ring-white/70 backdrop-blur">
            {(
              [
                ['chat', 'AI'],
                ['email', 'Email'],
                ['live', 'Live'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={cn(
                  'rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition',
                  mode === id
                    ? 'bg-[#1e1b4b] text-white shadow-sm'
                    : 'text-[#475569] hover:bg-white/80',
                )}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={closeHelp}
              className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-full text-[#64748b] hover:bg-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div
          ref={scrollerRef}
          className="relative z-10 flex-1 space-y-3.5 overflow-y-auto px-4 py-3 sm:px-5"
        >
          {mode === 'chat' && (
            <>
              {messages.map(message => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  onAction={runAction}
                />
              ))}
              {isTyping ? (
                <div className="flex justify-start gap-2">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#7c3aed] shadow-sm ring-1 ring-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <div className="rounded-[22px] rounded-bl-md border border-white/70 bg-white/75 px-3.5 py-3 shadow-sm backdrop-blur-md">
                    <TypingDots />
                  </div>
                </div>
              ) : null}
            </>
          )}

          {mode === 'email' && (
            <form
              onSubmit={submitEmail}
              className="space-y-3 rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1e1b4b]">
                <Mail className="h-4 w-4" />
                Email support
              </div>
              <p className="text-xs text-slate-500">
                Sends through your mail app to{' '}
                <span className="font-semibold text-slate-700">
                  {SUPPORT_EMAIL}
                </span>
              </p>
              <label className="block text-xs font-semibold text-slate-600">
                Subject
                <input
                  value={emailSubject}
                  onChange={event => setEmailSubject(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-[#7c3aed]/25 focus:ring-2"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Message
                <textarea
                  value={emailBody}
                  onChange={event => setEmailBody(event.target.value)}
                  rows={5}
                  placeholder="Tell us what you need help with…"
                  className="mt-1 w-full resize-none rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-[#7c3aed]/25 focus:ring-2"
                  required
                />
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  onClick={() => setMode('chat')}
                >
                  Back to AI
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[#1e1b4b] text-white hover:bg-[#312e81]"
                >
                  Open email
                </Button>
              </div>
            </form>
          )}

          {mode === 'live' && (
            <div className="space-y-3.5">
              <div className="rounded-[20px] border border-[#10213f]/10 bg-white/75 px-3.5 py-2.5 text-xs text-slate-600 shadow-sm backdrop-blur">
                {liveConnecting
                  ? 'Connecting to live support…'
                  : liveConnected
                    ? 'You’re in live chat. Messages go to our admin support inbox — agent replies appear here.'
                    : 'Tap connect to open a live thread with our team.'}
                {liveError ? (
                  <p className="mt-1.5 font-medium text-rose-600">{liveError}</p>
                ) : null}
                {!liveConnected && !liveConnecting ? (
                  <Button
                    type="button"
                    className="mt-2 w-full rounded-2xl bg-[#10213f] text-white hover:bg-[#1a335f]"
                    onClick={() => void connectLiveAgent()}
                  >
                    Connect to live agent
                  </Button>
                ) : null}
              </div>

              {liveMessages.map(message => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  onAction={runAction}
                />
              ))}
            </div>
          )}
        </div>

        {mode === 'chat' ? (
          <div className="relative z-10 border-t border-white/40 bg-white/35 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl sm:px-4 sm:pb-4">
            <SuggestionRail
              chips={QUICK_CHIPS}
              disabled={isTyping}
              onPick={chip => applySuggestion(chip)}
            />
            <form onSubmit={submitChat}>
              <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-2 py-1.5 shadow-[0_12px_40px_rgba(30,27,75,0.12)] backdrop-blur">
                <input
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  placeholder={
                    isTyping ? 'Assistant is typing…' : 'What are you looking for?'
                  }
                  disabled={isTyping}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
                />
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50"
                  aria-label="Voice (coming soon)"
                  onClick={() =>
                    toast.message(
                      'Voice assist is coming soon — type your question for now',
                    )
                  }
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  disabled={isTyping || !draft.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e1b4b] text-white shadow-md disabled:opacity-50"
                  aria-label="Send"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {mode === 'live' ? (
          <div className="relative z-10 border-t border-white/40 bg-white/35 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl sm:px-4 sm:pb-4">
            <form onSubmit={event => void submitLive(event)}>
              <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-2 py-1.5 shadow-[0_12px_40px_rgba(30,27,75,0.12)] backdrop-blur">
                <input
                  value={liveDraft}
                  onChange={event => setLiveDraft(event.target.value)}
                  placeholder="Message the live agent…"
                  disabled={!liveConnected || liveSending}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!liveConnected || liveSending || !liveDraft.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#10213f] text-white shadow-md disabled:opacity-50"
                  aria-label="Send to live agent"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function HelpAssistantFab() {
  const { open, openHelp } = useHelpAssistant();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || open) return null;
  return createPortal(
    <button
      type="button"
      onClick={() => openHelp({ mode: 'chat' })}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-[99990] flex h-11 w-11 items-center justify-center rounded-full bg-[#10213f] text-white shadow-lg ring-2 ring-white/90 md:bottom-6 md:right-4 md:h-12 md:w-12"
      aria-label="Open help assistant"
    >
      <Sparkles className="h-[18px] w-[18px]" />
    </button>,
    document.body,
  );
}
