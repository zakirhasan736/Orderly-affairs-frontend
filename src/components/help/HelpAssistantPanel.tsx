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
import { VaultDetailDrawer } from '@/components/vault-prototype/VaultDetailDrawer';

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

/** Split chat text so long filenames / paths wrap cleanly in bubbles. */
function splitAssistantText(
  text: string,
): Array<{ kind: 'text' | 'file'; text: string }> {
  const raw = String(text || '');
  if (!raw) return [{ kind: 'text', text: '' }];

  const lines = raw.split('\n');
  const blocks: Array<{ kind: 'text' | 'file'; text: string }> = [];
  let textBuf: string[] = [];

  const flushText = () => {
    if (!textBuf.length) return;
    blocks.push({ kind: 'text', text: textBuf.join('\n') });
    textBuf = [];
  };

  const looksLikeFile = (line: string) =>
    /\.(?:pdf|png|jpe?g|webp|gif|doc|docx|xls|xlsx|txt|heic)\b/i.test(line) &&
    line.trim().length > 8 &&
    !line.trim().startsWith('•');

  for (const line of lines) {
    const trimmed = line.trim();
    if (looksLikeFile(trimmed)) {
      flushText();
      blocks.push({ kind: 'file', text: trimmed });
    } else {
      textBuf.push(line);
    }
  }
  flushText();

  return blocks.length ? blocks : [{ kind: 'text', text: raw }];
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
    pointerId: number | null;
  }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
    pointerId: null,
  });

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const el = railRef.current;
    if (!el) return;
    // Allow drag-scroll starting on chips or empty rail space.
    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
      pointerId: event.pointerId,
    };
    el.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 6) drag.moved = true;
    if (drag.moved) {
      el.scrollLeft = drag.scrollLeft - delta;
      event.preventDefault();
    }
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (el?.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    dragRef.current.active = false;
    dragRef.current.pointerId = null;
  };

  return (
    <div className="mb-2">
      <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Suggested replies — drag to browse, tap to fill
      </p>
      <div
        ref={railRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex cursor-grab gap-1.5 overflow-x-auto pb-1 select-none active:cursor-grabbing touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {chips.map(chip => (
          <button
            key={chip}
            type="button"
            disabled={disabled}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              // Ignore click after a horizontal drag-scroll.
              if (dragRef.current.moved || disabled) return;
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
  const textBlocks = useMemo(
    () => splitAssistantText(message.text),
    [message.text],
  );

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col gap-1.5',
        isUser ? 'items-end' : 'items-start',
      )}
    >
      <div
        className={cn(
          'flex w-full min-w-0 gap-2',
          isUser ? 'justify-end' : 'justify-start',
        )}
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
            'min-w-0 max-w-[calc(100%-2.75rem)] overflow-hidden rounded-[22px] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm sm:max-w-[85%] sm:text-sm',
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
          <div className="min-w-0 space-y-1.5 overflow-hidden">
            {textBlocks.map((block, index) =>
              block.kind === 'file' ? (
                <p
                  key={`${message.id}-f-${index}`}
                  title={block.text}
                  className={cn(
                    'rounded-lg px-2 py-1.5 font-mono text-[11px] leading-snug',
                    'break-all break-all [overflow-wrap:anywhere]',
                    isUser
                      ? 'bg-white/10 text-white/95'
                      : isLive
                        ? 'bg-white/10 text-white'
                        : 'bg-slate-100/90 text-[#334155]',
                  )}
                >
                  {block.text}
                </p>
              ) : (
                <p
                  key={`${message.id}-t-${index}`}
                  className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                >
                  {block.text}
                  {isStreaming && index === textBlocks.length - 1 ? (
                    <span
                      className={cn(
                        'ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse align-baseline',
                        isLive ? 'bg-white' : 'bg-[#7c3aed]',
                      )}
                    />
                  ) : null}
                </p>
              ),
            )}
          </div>
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
  const chatInputRef = useRef<HTMLInputElement>(null);
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
      // Close first so the section is visible — otherwise the full-screen
      // agent hides the destination and users think nothing happened.
      closeHelp();
      onNavigateToSection?.(action.sectionId);
      toast.success(
        action.type === 'fill_section'
          ? `Opened ${action.label} — upload or edit fields there`
          : `Opened ${action.label}`,
      );
      if (action.type === 'fill_section') {
        window.setTimeout(() => onFocusUpload?.(), 450);
      }
      return;
    }
    if (action.type === 'show_empty') {
      closeHelp();
      onNavigateToSection?.(action.sectionId);
      window.setTimeout(() => {
        onShowEmptyFields?.(action.sectionId, action.label);
      }, 350);
      toast.success(`Showing empty fields in ${action.label}`);
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

  const fillSuggestedReply = (chip: string) => {
    const text = chip.trim();
    if (!text || isTyping) return;
    setDraft(text);
    window.requestAnimationFrame(() => {
      const input = chatInputRef.current;
      if (!input) return;
      input.focus();
      const end = text.length;
      try {
        input.setSelectionRange(end, end);
      } catch {
        // ignore — some browsers restrict selection on type=text mid-render
      }
    });
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

  if (!canPortal) return null;

  return (
    <VaultDetailDrawer
      open={open}
      onClose={closeHelp}
      title="Get help"
      subtitle={sectionHint || 'Ask AI, email, or live agent'}
      icon={
        mode === 'live' ? (
          <Headphones className="h-5 w-5" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )
      }
      padded={false}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-[#E4EAF0] px-4 pb-3 pt-1 md:px-6">
          <div className="flex items-center gap-1 rounded-full border border-[#E4EAF0] bg-[#F6F8FA] p-1">
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
                  'flex-1 rounded-full px-2.5 py-2 text-[12.5px] font-semibold transition',
                  mode === id
                    ? 'bg-[#213D59] text-white'
                    : 'text-[#6A7481] hover:bg-white',
                  id === 'live' && 'opacity-70',
                )}
                title={id === 'live' ? 'Live agent coming soon' : undefined}
              >
                {label}
                {id === 'live' ? (
                  <span className="ml-1 text-[9px] font-bold uppercase tracking-wide opacity-80">
                    Soon
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mobile-sheet-scroll min-h-0 flex-1 space-y-3.5 overflow-y-auto overscroll-contain px-4 py-4 md:px-6"
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
                    onSuggest={chip => fillSuggestedReply(chip)}
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
              className="space-y-4"
            >
              <p className="text-[13.5px] leading-relaxed text-[#7A8794]">
                We deliver this to our support inbox. Replies show in the Live
                tab. You can also write {SUPPORT_EMAIL} from your mail app.
              </p>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-[#6A7481]">
                  Subject
                </label>
                <input
                  value={emailSubject}
                  onChange={event => setEmailSubject(event.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#E4EAF0] bg-white px-3.5 text-[14.5px] text-[#213D59] outline-none focus:border-[#3EB1E5] focus:shadow-[0_0_0_3px_rgba(62,177,229,.14)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold text-[#6A7481]">
                  Message
                </label>
                <textarea
                  value={emailBody}
                  onChange={event => setEmailBody(event.target.value)}
                  rows={6}
                  placeholder="Tell us what you need help with…"
                  className="min-h-[104px] w-full resize-y rounded-[10px] border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14.5px] leading-[1.55] text-[#213D59] outline-none focus:border-[#3EB1E5] focus:shadow-[0_0_0_3px_rgba(62,177,229,.14)]"
                  required
                />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-full border-[#E4EAF0] text-[#213D59]"
                  onClick={() => setMode('chat')}
                >
                  Back to AI
                </Button>
                <Button
                  type="submit"
                  disabled={emailSending || !emailBody.trim()}
                  className="h-11 flex-1 rounded-full bg-[#213D59] text-white hover:bg-[#2C4B6B]"
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
          <div className="shrink-0 border-t border-[#E4EAF0] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
            <SuggestionRail
              chips={suggestionChips}
              disabled={isTyping}
              onPick={fillSuggestedReply}
            />
            <form onSubmit={submitChat}>
              <div className="mt-2 flex items-center gap-2 rounded-full border border-[#E4EAF0] bg-[#F6F8FA] px-2 py-1.5">
                <input
                  ref={chatInputRef}
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
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[14.5px] text-[#213D59] outline-none placeholder:text-[#7A8794] disabled:opacity-60"
                />
                <button
                  type="button"
                  className={cn(
                    'grid h-11 w-11 place-items-center rounded-full',
                    listening
                      ? 'bg-[#FBEDEA] text-[#C2442E]'
                      : 'text-[#7A8794] hover:bg-white',
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
                  className="grid h-11 w-11 place-items-center rounded-full bg-[#213D59] text-white disabled:opacity-50"
                  aria-label="Send"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {mode === 'live' ? (
          <div className="shrink-0 border-t border-[#E4EAF0] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
            <form onSubmit={event => void submitLive(event)}>
              <div className="flex items-center gap-2 rounded-full border border-[#E4EAF0] bg-[#F6F8FA] px-2 py-1.5">
                <input
                  value={liveDraft}
                  onChange={event => setLiveDraft(event.target.value)}
                  placeholder="Message the live agent…"
                  disabled={!liveConnected || liveSending}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[14.5px] text-[#213D59] outline-none placeholder:text-[#7A8794] disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!liveConnected || liveSending || !liveDraft.trim()}
                  className="grid h-11 w-11 place-items-center rounded-full bg-[#213D59] text-white disabled:opacity-50"
                  aria-label="Send to live agent"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </VaultDetailDrawer>
  );
}

export function HelpAssistantFab() {
  const { open, openHelp } = useHelpAssistant();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    const sync = () =>
      setFeedbackOpen(document.body.dataset.oaFeedbackOpen === '1');
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-oa-feedback-open'],
    });
    return () => obs.disconnect();
  }, []);

  if (typeof document === 'undefined' || open || feedbackOpen) return null;
  return createPortal(
    <button
      type="button"
      data-help-assistant-fab
      onClick={() => openHelp({ mode: 'chat' })}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-[90] flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#213D59] text-white shadow-lg ring-2 ring-white/90 md:bottom-6 md:right-4 md:h-12 md:w-12 md:z-[90]"
      aria-label="Contact Support"
    >
      <Sparkles className="h-[13px] w-[13px] md:h-[18px] md:w-[18px]" />
    </button>,
    document.body,
  );
}
