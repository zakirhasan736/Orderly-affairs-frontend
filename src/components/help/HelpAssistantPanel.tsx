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
  followUpSuggestions,
  type HelpChatAction,
  type HelpChatMessage,
} from '@/utils/helpAssistantBrain';
import { sendOwnerSupportMessage } from '@/libs/api/supportChat';
import { toast } from 'sonner';

type HelpAssistantPanelProps = {
  onStartTour?: () => void;
  onNavigateToSection?: (sectionId: string) => void;
  onFocusUpload?: () => void;
  onShowEmptyFields?: (sectionId: string, label: string) => void;
  currentSectionId?: string | null;
  formData?: Record<string, unknown>;
};

const FALLBACK_CHIPS = [
  'Start a tour',
  'What is still empty in Vehicles?',
  'When is my next insurance renewal?',
  'Help me fill vehicles',
  'Email support',
  'Upload a document',
];

function formatChatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

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
    // Don't start scroll-drag from a chip — that eats the tap-to-send click.
    if ((event.target as HTMLElement | null)?.closest('button')) return;
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
    if (Math.abs(delta) > 8) drag.moved = true;
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
        Suggested replies — tap to send
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
            onPointerDown={event => event.stopPropagation()}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              if (disabled) return;
              onPick(chip);
            }}
            className="shrink-0 rounded-full border border-[#c4b5fd]/50 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#4338ca] shadow-sm backdrop-blur transition hover:border-[#7c3aed]/40 hover:bg-[#f5f3ff] disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingDots({ colorClass = 'bg-[#7c3aed]' }: { colorClass?: string }) {
  return (
    <div className="flex items-center gap-1 px-0.5" aria-hidden>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={cn('h-1.5 w-1.5 animate-bounce rounded-full', colorClass)}
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

function WritingStatus({
  label,
  variant = 'ai',
}: {
  label: string;
  variant?: 'ai' | 'live';
}) {
  const isLive = variant === 'live';
  return (
    <div className="flex justify-start gap-2" aria-live="polite">
      <span
        className={cn(
          'mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-white',
          isLive ? 'bg-[#213D59] text-white' : 'bg-white/80 text-[#7c3aed]',
        )}
      >
        {isLive ? (
          <Headphones className="h-3.5 w-3.5" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
      </span>
      <div
        className={cn(
          'rounded-[22px] rounded-bl-md border px-3.5 py-2.5 shadow-sm backdrop-blur-md',
          isLive
            ? 'border-[#213D59]/15 bg-[#213D59]/90 text-white'
            : 'border-white/70 bg-white/80 text-[#475569]',
        )}
      >
        <div className="flex items-center gap-2">
          <TypingDots colorClass={isLive ? 'bg-white/80' : 'bg-[#7c3aed]'} />
          <span className="text-[12px] font-medium">{label}</span>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  onAction,
  onSuggest,
  isStreaming,
  showInlineSuggestions,
}: {
  message: HelpChatMessage;
  onAction: (action: HelpChatAction) => void;
  onSuggest?: (text: string) => void;
  isStreaming?: boolean;
  showInlineSuggestions?: boolean;
}) {
  const isUser = message.role === 'user';
  const isLive = message.role === 'live_agent';
  const isSystem = message.role === 'system';

  return (
    <div
      className={cn('flex flex-col gap-1.5', isUser ? 'items-end' : 'items-start')}
    >
      <div
        className={cn('flex max-w-full gap-2', isUser ? 'justify-end' : 'justify-start')}
      >
        {!isUser ? (
          <span
            className={cn(
              'mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-white',
              isLive
                ? 'bg-[#213D59] text-white'
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
                ? 'rounded-bl-md border border-[#213D59]/15 bg-[#213D59] text-white'
                : isSystem
                  ? 'rounded-bl-md border border-slate-200 bg-slate-100/90 text-slate-600'
                  : 'rounded-bl-md border border-white/70 bg-white/85 text-[#334155] backdrop-blur-md',
            message.animate && !isUser && 'animate-in fade-in slide-in-from-bottom-1 duration-300',
          )}
        >
          {isLive ? (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/70">
              Live agent
            </p>
          ) : !isUser && !isSystem ? (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]/80">
              Orderly assistant
            </p>
          ) : null}
          <p className="whitespace-pre-wrap">
            {message.text}
            {isStreaming ? (
              <span
                className={cn(
                  'ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse align-baseline',
                  isLive ? 'bg-white' : 'bg-[#7c3aed]',
                )}
              />
            ) : null}
          </p>
          {message.actions?.length && !isStreaming ? (
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
                      <Headphones className="h-3 w-3" /> Live · soon
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
                  {action.type === 'show_empty' && (
                    <>
                      <Sparkles className="h-3 w-3" /> Review empty in{' '}
                      {action.label}
                    </>
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <p
        className={cn(
          'px-10 text-[10px] text-slate-400',
          isUser ? 'text-right' : 'text-left',
        )}
      >
        {formatChatTime(message.createdAt)}
      </p>
      {showInlineSuggestions &&
      !isStreaming &&
      !isUser &&
      message.suggestions?.length &&
      onSuggest ? (
        <div className="ml-10 flex max-w-[90%] flex-wrap gap-1.5">
          {message.suggestions.slice(0, 4).map(chip => (
            <button
              key={`${message.id}-${chip}`}
              type="button"
              onClick={() => onSuggest(chip)}
              className="rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-2.5 py-1 text-[11px] font-semibold text-[#5b21b6] transition hover:bg-[#ede9fe]"
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function HelpAssistantPanel({
  onStartTour,
  onNavigateToSection,
  onFocusUpload,
  onShowEmptyFields,
  currentSectionId,
}: HelpAssistantPanelProps) {
  const {
    open,
    mode,
    messages,
    liveMessages,
    isTyping,
    typingLabel,
    streamingMessageId,
    liveConnected,
    liveConnecting,
    liveWaiting,
    liveError,
    closeHelp,
    setMode,
    sendMessage,
    sendLiveMessage,
    connectLiveAgent,
    pushAssistant,
  } = useHelpAssistant();
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<{
    stop: () => void;
    abort?: () => void;
  } | null>(null);
  const [liveDraft, setLiveDraft] = useState('');
  const [liveSending, setLiveSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState(
    'Help with my Orderly Affairs vault',
  );
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const canPortal = typeof document !== 'undefined';

  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [
    messages,
    liveMessages,
    isTyping,
    streamingMessageId,
    liveWaiting,
    open,
    mode,
  ]);

  const suggestionChips = useMemo(() => {
    if (mode !== 'chat') return FALLBACK_CHIPS;
    const lastAssistant = [...messages]
      .reverse()
      .find(m => m.role === 'assistant');
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const chips = followUpSuggestions(
      lastUser?.text || '',
      lastAssistant || null,
    );
    return chips.length ? chips : FALLBACK_CHIPS;
  }, [messages, mode]);

  const sectionHint = useMemo(() => {
    if (mode === 'live') {
      if (liveConnecting) return 'Connecting to live agent…';
      if (liveWaiting) return 'Waiting for agent reply…';
      if (liveConnected) return 'Live with Orderly Affairs support';
      return 'Live agent';
    }
    if (mode === 'email') return 'Email our team — replies also land in Live';
    if (isTyping) return typingLabel;
    if (!currentSectionId || currentSectionId === 'dashboard') {
      return 'Ask anything about your vault';
    }
    return `You’re in section ${currentSectionId}`;
  }, [
    currentSectionId,
    mode,
    liveConnected,
    liveConnecting,
    liveWaiting,
    isTyping,
    typingLabel,
  ]);

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
            ? `Opening ${action.label}. Upload a document or edit fields there — or ask me what’s still empty and I’ll open the fill popup.`
            : `Taking you to ${action.label}.`,
        suggestions: [
          `What's empty in ${action.label}?`,
          'Upload a document',
          'Email support',
        ],
      });
      if (action.type === 'fill_section') {
        window.setTimeout(() => onFocusUpload?.(), 400);
      }
      return;
    }
    if (action.type === 'show_empty') {
      onNavigateToSection?.(action.sectionId);
      onShowEmptyFields?.(action.sectionId, action.label);
      pushAssistant({
        text: `Opened the empty-fields popup for ${action.label}. Fill what’s missing there, or tell me the values in chat and I’ll guide you where they go.`,
        suggestions: [
          'Upload a document to fill gaps',
          `Open ${action.label}`,
          'Email support',
        ],
      });
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
      toast.message('Live agent is coming soon — use AI chat or Email support');
      setMode('chat');
      pushAssistant({
        text:
          'Live agent chat is coming soon.\n\nFor now, AI assistance and Email support are available. Ask me anything about your vault, or switch to the Email tab.',
        actions: [{ type: 'email' }, { type: 'tour' }],
        suggestions: ['Email support', "What's empty in Vehicles?", 'Start a tour'],
      });
      return;
    }
  };

  const submitChat = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!draft.trim() || isTyping) return;
    sendMessage(draft);
    setDraft('');
  };

  const sendSuggestedReply = (chip: string) => {
    const text = chip.trim();
    if (!text || isTyping) return;
    setDraft(text);
    // Put text in the composer first, then send as a user message.
    window.setTimeout(() => {
      sendMessage(text);
      setDraft('');
    }, 40);
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop?.();
      recognitionRef.current?.abort?.();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
    setListening(false);
  };

  const toggleVoiceInput = () => {
    if (listening) {
      stopListening();
      toast.message('Stopped listening');
      return;
    }

    type BrowserSpeechRecognition = {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
      onerror: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
      onend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
      onresult:
        | ((
            this: BrowserSpeechRecognition,
            ev: {
              resultIndex: number;
              results: ArrayLike<{
                isFinal?: boolean;
                0?: { transcript?: string };
              }>;
            },
          ) => void)
        | null;
      start: () => void;
      stop: () => void;
      abort: () => void;
    };

    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? (
            (
              window as Window & {
                SpeechRecognition?: new () => BrowserSpeechRecognition;
                webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
              }
            ).SpeechRecognition ||
            (
              window as Window & {
                webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
              }
            ).webkitSpeechRecognition
          )
        : undefined;

    if (!SpeechRecognitionCtor) {
      toast.message(
        'Voice input is not supported in this browser — type your question instead',
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      const baseDraft = draft.trim();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang =
        typeof navigator !== 'undefined' && navigator.language
          ? navigator.language
          : 'en-US';

      recognition.onstart = () => {
        setListening(true);
        toast.message('Listening… speak your question');
      };
      recognition.onerror = () => {
        stopListening();
        toast.error('Could not hear that — try again or type your question');
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setListening(false);
      };
      recognition.onresult = event => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          transcript += event.results[i]?.[0]?.transcript || '';
        }
        const next = transcript.trim();
        if (!next) return;
        setDraft(baseDraft ? `${baseDraft} ${next}` : next);
        const isFinal = Boolean(
          event.results[event.results.length - 1]?.isFinal,
        );
        if (isFinal) {
          toast.success('Heard you — tap send when ready');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      stopListening();
      toast.error('Microphone unavailable — check browser permissions');
    }
  };

  useEffect(() => {
    if (!open) stopListening();
    return () => stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    const subject = emailSubject.trim() || 'Orderly Affairs support';
    const body = emailBody.trim();
    if (!body) return;

    setEmailSending(true);
    const threadText = `Email support request\nSubject: ${subject}\n\n${body}`;
    try {
      // Also post into the live support thread so admin can reply in-app.
      await sendOwnerSupportMessage(threadText);
      toast.success('Sent to support — our team will email you back');
      pushAssistant({
        text: `Your message was sent to our support team at ${SUPPORT_EMAIL}. You can keep using AI assistance here while you wait for a reply.`,
        actions: [{ type: 'email' }, { type: 'tour' }],
        suggestions: [
          'Email support',
          "What's empty in Vehicles?",
          'Start a tour',
        ],
      });
      setEmailBody('');
      setMode('chat');
    } catch {
      const subjectEnc = encodeURIComponent(subject);
      const bodyEnc = encodeURIComponent(
        `${body}\n\n— Sent from Orderly Affairs help assistant`,
      );
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subjectEnc}&body=${bodyEnc}`;
      toast.message('Opened your email app (in-app send unavailable)');
      pushAssistant({
        text: `Opened your mail app for ${SUPPORT_EMAIL}. You can also keep chatting with AI assistance here.`,
        actions: [{ type: 'email' }, { type: 'tour' }],
      });
      setMode('chat');
    } finally {
      setEmailSending(false);
    }
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

  if (!open || !canPortal) return null;

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
                <Headphones className="h-5 w-5 text-[#213D59]" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-[15px] font-semibold tracking-tight text-[#1e1b4b]">
                  Contact Support
                </p>
                {mode === 'chat' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                ) : null}
              </div>
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
                onClick={() => {
                  if (id === 'live') {
                    toast.message(
                      'Live agent is coming soon — use AI chat or Email support',
                    );
                    setMode('chat');
                    pushAssistant({
                      text:
                        'Live agent chat is coming soon.\n\nAI assistance and Email support are available now. Ask me about empty fields, renewals, uploads, or email our team from the Email tab.',
                      actions: [{ type: 'email' }, { type: 'tour' }],
                      suggestions: [
                        'Email support',
                        "What's empty in Vehicles?",
                        'Start a tour',
                      ],
                    });
                    return;
                  }
                  setMode(id);
                }}
                className={cn(
                  'rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition',
                  mode === id
                    ? 'bg-[#1e1b4b] text-white shadow-sm'
                    : 'text-[#475569] hover:bg-white/80',
                  id === 'live' && 'opacity-70',
                )}
                title={
                  id === 'live' ? 'Live agent coming soon' : undefined
                }
              >
                {label}
                {id === 'live' ? (
                  <span className="ml-1 text-[9px] font-bold uppercase tracking-wide opacity-80">
                    Soon
                  </span>
                ) : null}
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
              {messages.map((message, index) => {
                const lastAssistantIndex = (() => {
                  for (let i = messages.length - 1; i >= 0; i -= 1) {
                    if (messages[i]?.role === 'assistant') return i;
                  }
                  return -1;
                })();
                return (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    onAction={runAction}
                    onSuggest={chip => sendSuggestedReply(chip)}
                    isStreaming={streamingMessageId === message.id}
                    showInlineSuggestions={
                      index === lastAssistantIndex && !isTyping
                    }
                  />
                );
              })}
              {isTyping && !streamingMessageId ? (
                <WritingStatus label={typingLabel || 'Orderly is typing…'} />
              ) : null}
            </>
          )}

          {mode === 'email' && (
            <form
              onSubmit={event => void submitEmail(event)}
              className="space-y-3 rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1e1b4b]">
                <Mail className="h-4 w-4" />
                Email support
              </div>
              <p className="text-xs text-slate-500">
                We deliver this to our admin support inbox. Replies show in the{' '}
                <span className="font-semibold text-slate-700">Live</span> tab —
                no need to open your email. You can still CC{' '}
                <span className="font-semibold text-slate-700">
                  {SUPPORT_EMAIL}
                </span>{' '}
                from your mail app if you prefer.
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
                  disabled={emailSending || !emailBody.trim()}
                  className="flex-1 rounded-2xl bg-[#1e1b4b] text-white hover:bg-[#312e81]"
                >
                  {emailSending ? 'Sending…' : 'Send to support'}
                </Button>
              </div>
              <button
                type="button"
                className="w-full text-center text-[11px] font-medium text-slate-500 underline-offset-2 hover:underline"
                onClick={() => {
                  const subjectEnc = encodeURIComponent(
                    emailSubject.trim() || 'Orderly Affairs support',
                  );
                  const bodyEnc = encodeURIComponent(
                    `${emailBody.trim()}\n\n— Sent from Orderly Affairs help assistant`,
                  );
                  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subjectEnc}&body=${bodyEnc}`;
                }}
              >
                Or open {SUPPORT_EMAIL} in your mail app
              </button>
            </form>
          )}

          {mode === 'live' && (
            <div className="space-y-3.5">
              <div className="rounded-[20px] border border-[#213D59]/10 bg-white/75 px-3.5 py-2.5 text-xs text-slate-600 shadow-sm backdrop-blur">
                {liveConnecting
                  ? 'Connecting to live support…'
                  : liveWaiting
                    ? 'Message sent. Waiting for an Orderly Affairs agent — replies appear here automatically.'
                    : liveConnected
                      ? 'You’re in live chat. Messages go to our admin support inbox — agent replies appear here.'
                      : 'Tap connect to open a live thread with our team.'}
                {liveError ? (
                  <p className="mt-1.5 font-medium text-rose-600">{liveError}</p>
                ) : null}
                {!liveConnected && !liveConnecting ? (
                  <Button
                    type="button"
                    className="mt-2 w-full rounded-2xl bg-[#213D59] text-white hover:bg-[#00305C]"
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
              {liveWaiting ? (
                <WritingStatus
                  label="Waiting for live agent…"
                  variant="live"
                />
              ) : null}
              {liveConnected && !liveWaiting && !liveConnecting ? (
                <div className="px-1 text-center text-[11px] text-slate-400">
                  Need an instant answer? Switch to the{' '}
                  <button
                    type="button"
                    className="font-semibold text-[#5b21b6] underline-offset-2 hover:underline"
                    onClick={() => setMode('chat')}
                  >
                    AI
                  </button>{' '}
                  tab.
                </div>
              ) : null}
            </div>
          )}
        </div>

        {mode === 'chat' ? (
          <div className="relative z-10 border-t border-white/40 bg-white/35 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl sm:px-4 sm:pb-4">
            <SuggestionRail
              chips={suggestionChips}
              disabled={isTyping}
              onPick={sendSuggestedReply}
            />
            <form onSubmit={submitChat}>
              <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-2 py-1.5 shadow-[0_12px_40px_rgba(30,27,75,0.12)] backdrop-blur">
                <input
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  placeholder={
                    isTyping
                      ? 'Orderly is typing…'
                      : listening
                        ? 'Listening…'
                        : 'Ask anything — or tap a suggestion'
                  }
                  disabled={isTyping}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
                />
                <button
                  type="button"
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-50',
                    listening
                      ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-200'
                      : 'text-slate-400',
                  )}
                  aria-label={listening ? 'Stop listening' : 'Speak your question'}
                  aria-pressed={listening}
                  onClick={toggleVoiceInput}
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
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#213D59] text-white shadow-md disabled:opacity-50"
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
  if (typeof document === 'undefined' || open) return null;
  return createPortal(
    <button
      type="button"
      data-help-assistant-fab
      onClick={() => openHelp({ mode: 'chat' })}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-[#213D59] text-white shadow-lg ring-2 ring-white/90 md:bottom-6 md:right-4 md:h-12 md:w-12 md:z-[90]"
      aria-label="Contact Support"
    >
      <Sparkles className="h-[18px] w-[18px]" />
    </button>,
    document.body,
  );
}
