'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import {
  buildWelcomeMessage,
  createAssistantId,
  respondToHelpMessage,
  type HelpChatMessage,
  type HelpVaultContext,
} from '@/utils/helpAssistantBrain';
import {
  fetchMySupportMessages,
  sendOwnerSupportMessage,
  type SupportMessage,
} from '@/libs/api/supportChat';

type HelpMode = 'chat' | 'email' | 'live';

type HelpAssistantContextValue = {
  open: boolean;
  mode: HelpMode;
  messages: HelpChatMessage[];
  liveMessages: HelpChatMessage[];
  isTyping: boolean;
  typingLabel: string;
  streamingMessageId: string | null;
  liveConnected: boolean;
  liveConnecting: boolean;
  liveWaiting: boolean;
  liveError: string | null;
  vaultContext: HelpVaultContext;
  setVaultContext: (ctx: HelpVaultContext) => void;
  openHelp: (opts?: { mode?: HelpMode; seed?: string }) => void;
  closeHelp: () => void;
  setMode: (mode: HelpMode) => void;
  sendMessage: (text: string) => void;
  applySuggestion: (text: string) => void;
  sendLiveMessage: (text: string) => Promise<void>;
  connectLiveAgent: () => Promise<void>;
  pushAssistant: (
    message: Omit<HelpChatMessage, 'id' | 'createdAt' | 'role'> & {
      role?: HelpChatMessage['role'];
    },
  ) => void;
};

const HelpAssistantContext = createContext<HelpAssistantContextValue | null>(
  null,
);

function mapSupportToChat(msg: SupportMessage): HelpChatMessage {
  const role: HelpChatMessage['role'] =
    msg.sender === 'owner'
      ? 'user'
      : msg.sender === 'admin'
        ? 'live_agent'
        : 'system';
  return {
    id: `live-${msg.id}`,
    remoteId: msg.id,
    role,
    text: msg.text,
    createdAt: Date.parse(msg.created_at) || Date.now(),
  };
}

export function HelpAssistantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setModeState] = useState<HelpMode>('chat');
  const [messages, setMessages] = useState<HelpChatMessage[]>([
    buildWelcomeMessage(),
  ]);
  const [liveMessages, setLiveMessages] = useState<HelpChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingLabel, setTypingLabel] = useState('Writing a reply…');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveConnecting, setLiveConnecting] = useState(false);
  const [liveWaiting, setLiveWaiting] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [vaultContext, setVaultContext] = useState<HelpVaultContext>({});

  const vaultContextRef = useRef(vaultContext);
  vaultContextRef.current = vaultContext;

  const thinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingReplyRef = useRef<HelpChatMessage | null>(null);
  const isTypingRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRemoteIdRef = useRef<string | undefined>(undefined);
  const liveHydratedRef = useRef(false);
  const openRef = useRef(false);
  openRef.current = open;

  const clearReplyTimers = useCallback(() => {
    if (thinkTimerRef.current) {
      clearTimeout(thinkTimerRef.current);
      thinkTimerRef.current = null;
    }
    if (streamTimerRef.current) {
      clearTimeout(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const finalizeReply = useCallback(
    (reply: HelpChatMessage) => {
      if (pendingReplyRef.current && pendingReplyRef.current.id !== reply.id) {
        return;
      }
      pendingReplyRef.current = null;
      clearReplyTimers();
      isTypingRef.current = false;
      setStreamingMessageId(null);
      setIsTyping(false);
      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === reply.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...reply,
            text: reply.text,
            actions: reply.actions,
            suggestions: reply.suggestions,
            animate: true,
          };
          return next;
        }
        return [...prev, { ...reply, animate: true }];
      });
    },
    [clearReplyTimers],
  );

  /** Realistic typing: think → stream words → finalize (with safety net). */
  const scheduleAssistantReply = useCallback(
    (rawReply: HelpChatMessage) => {
      clearReplyTimers();
      const fullText =
        String(rawReply.text || '').trim() ||
        'I’m here to help with your vault — ask about a section, empty fields, renewals, or reach a live agent.';
      const reply: HelpChatMessage = {
        ...rawReply,
        id: rawReply.id || createAssistantId(),
        createdAt: Date.now(),
        text: fullText,
      };
      pendingReplyRef.current = reply;
      isTypingRef.current = true;
      setTypingLabel('Orderly is typing…');
      setIsTyping(true);
      setStreamingMessageId(null);

      const thinkMs = Math.min(
        1100,
        420 + Math.min(fullText.length, 160) * 3,
      );
      const chunkSize = Math.max(3, Math.ceil(fullText.length / 52));
      const streamBudget = Math.min(6500, Math.ceil(fullText.length / chunkSize) * 32 + 800);

      thinkTimerRef.current = setTimeout(() => {
        thinkTimerRef.current = null;
        if (pendingReplyRef.current?.id !== reply.id) return;

        setTypingLabel('Writing a reply…');
        setStreamingMessageId(reply.id);
        setMessages(prev => [
          ...prev,
          {
            ...reply,
            text: '',
            actions: undefined,
            suggestions: undefined,
            animate: true,
          },
        ]);

        let cursor = 0;
        const tick = () => {
          if (pendingReplyRef.current?.id !== reply.id) return;
          cursor = Math.min(fullText.length, cursor + chunkSize);
          const slice = fullText.slice(0, cursor);
          setMessages(prev =>
            prev.map(m => (m.id === reply.id ? { ...m, text: slice } : m)),
          );
          if (cursor >= fullText.length) {
            streamTimerRef.current = null;
            finalizeReply(reply);
            return;
          }
          streamTimerRef.current = setTimeout(tick, 24 + (cursor % 7));
        };
        tick();
      }, thinkMs);

      safetyTimerRef.current = setTimeout(() => {
        if (pendingReplyRef.current?.id === reply.id) {
          finalizeReply(reply);
        }
      }, thinkMs + streamBudget);
    },
    [clearReplyTimers, finalizeReply],
  );

  const flushPendingReply = useCallback(() => {
    const pending = pendingReplyRef.current;
    if (pending) {
      finalizeReply(pending);
      return;
    }
    clearReplyTimers();
    isTypingRef.current = false;
    setIsTyping(false);
    setStreamingMessageId(null);
  }, [clearReplyTimers, finalizeReply]);

  const mergeLiveMessages = useCallback((incoming: SupportMessage[]) => {
    if (!incoming.length) return;
    setLiveMessages(prev => {
      const seen = new Set(
        prev.map(m => m.remoteId).filter(Boolean) as string[],
      );
      const mapped = incoming
        .map(mapSupportToChat)
        .filter(m => m.remoteId && !seen.has(m.remoteId))
        .map(m =>
          m.role === 'live_agent' ? { ...m, animate: true } : m,
        );
      if (!mapped.length) return prev;

      const hasAgent = mapped.some(m => m.role === 'live_agent');
      if (hasAgent) {
        setLiveWaiting(false);
        if (openRef.current) {
          toast.message('Live agent replied');
        }
      }

      const next = [...prev, ...mapped].sort(
        (a, b) => a.createdAt - b.createdAt,
      );
      const last = next[next.length - 1];
      if (last?.remoteId) lastRemoteIdRef.current = last.remoteId;
      return next;
    });
  }, []);

  const stopLivePoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollLive = useCallback(async () => {
    try {
      const after = liveHydratedRef.current
        ? lastRemoteIdRef.current
        : undefined;
      const data = await fetchMySupportMessages(after);
      if (!liveHydratedRef.current) {
        setLiveMessages(
          data.messages.map(msg => {
            const mapped = mapSupportToChat(msg);
            return mapped;
          }),
        );
        const last = data.messages[data.messages.length - 1];
        lastRemoteIdRef.current = last?.id;
        liveHydratedRef.current = true;
      } else {
        mergeLiveMessages(data.messages);
      }
      setLiveConnected(true);
      setLiveError(null);
    } catch (err) {
      setLiveError(
        err instanceof Error ? err.message : 'Could not reach live support',
      );
    }
  }, [mergeLiveMessages]);

  const startLivePoll = useCallback(() => {
    stopLivePoll();
    pollRef.current = setInterval(() => {
      void pollLive();
    }, 2000);
  }, [pollLive, stopLivePoll]);

  const connectLiveAgent = useCallback(async () => {
    setLiveConnecting(true);
    setLiveError(null);
    setModeState('live');
    setLiveWaiting(false);
    try {
      liveHydratedRef.current = false;
      lastRemoteIdRef.current = undefined;
      await pollLive();
      setLiveConnected(true);
      startLivePoll();
    } catch (err) {
      setLiveConnected(false);
      const message =
        err instanceof Error
          ? err.message
          : 'Could not connect to a live agent';
      setLiveError(message);
      toast.error(message);
    } finally {
      setLiveConnecting(false);
    }
  }, [pollLive, startLivePoll]);

  const setMode = useCallback(
    (next: HelpMode) => {
      if (next === 'live') {
        // Live agent is coming soon — keep users on AI chat.
        setModeState('chat');
        stopLivePoll();
        setLiveWaiting(false);
        return;
      }
      setModeState(next);
      stopLivePoll();
      setLiveWaiting(false);
    },
    [stopLivePoll],
  );

  const openHelp = useCallback(
    (opts?: { mode?: HelpMode; seed?: string }) => {
      const nextMode = opts?.mode === 'live' ? 'chat' : opts?.mode || 'chat';
      setOpen(true);
      setModeState(nextMode);
      stopLivePoll();
      if (opts?.seed?.trim() && nextMode === 'chat') {
        const userMsg: HelpChatMessage = {
          id: createAssistantId(),
          role: 'user',
          text: opts.seed.trim(),
          createdAt: Date.now(),
        };
        setMessages(prev => [...prev, userMsg]);
        scheduleAssistantReply(
          respondToHelpMessage(opts.seed, vaultContextRef.current),
        );
      }
    },
    [scheduleAssistantReply, stopLivePoll],
  );

  const closeHelp = useCallback(() => {
    setOpen(false);
    // Never drop an in-flight AI reply when the panel closes.
    flushPendingReply();
    stopLivePoll();
  }, [flushPendingReply, stopLivePoll]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      // If a prior reply got stuck, unlock and continue.
      if (isTypingRef.current && !pendingReplyRef.current) {
        isTypingRef.current = false;
        setIsTyping(false);
      }
      if (isTypingRef.current) {
        flushPendingReply();
      }

      const lower = trimmed.toLowerCase();
      if (
        /\b(talk to live agent|live agent|live chat|human agent)\b/.test(lower)
      ) {
        const userMsg: HelpChatMessage = {
          id: createAssistantId(),
          role: 'user',
          text: trimmed,
          createdAt: Date.now(),
        };
        setMessages(prev => [
          ...prev,
          userMsg,
          {
            id: createAssistantId(),
            role: 'assistant',
            text:
              'Live agent chat is coming soon.\n\nFor now, AI assistance and Email support are available. Ask me anything about your vault, or switch to the Email tab to reach our team.',
            createdAt: Date.now(),
            animate: true,
            actions: [{ type: 'email' }, { type: 'tour' }],
            suggestions: [
              'Email support',
              "What's empty in Vehicles?",
              'Start a tour',
            ],
          },
        ]);
        setModeState('chat');
        return;
      }

      const userMsg: HelpChatMessage = {
        id: createAssistantId(),
        role: 'user',
        text: trimmed,
        createdAt: Date.now(),
      };
      setMessages(prev => [...prev, userMsg]);
      setModeState('chat');
      stopLivePoll();

      try {
        const reply = respondToHelpMessage(trimmed, vaultContextRef.current);
        scheduleAssistantReply(reply);
      } catch (err) {
        console.error('[helpAssistant] sendMessage failed', err);
        scheduleAssistantReply({
          id: createAssistantId(),
          role: 'assistant',
          text: 'I hit a snag answering that. Please try again or use Email support.',
          createdAt: Date.now(),
          actions: [{ type: 'email' }, { type: 'tour' }],
        });
      }
    },
    [
      flushPendingReply,
      scheduleAssistantReply,
      stopLivePoll,
    ],
  );

  const applySuggestion = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage],
  );

  const sendLiveMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!liveConnected) {
        await connectLiveAgent();
      }
      const optimistic: HelpChatMessage = {
        id: createAssistantId(),
        role: 'user',
        text: trimmed,
        createdAt: Date.now(),
      };
      setLiveMessages(prev => [...prev, optimistic]);
      setLiveWaiting(true);
      try {
        const { message } = await sendOwnerSupportMessage(trimmed);
        setLiveMessages(prev => {
          const withoutOptimistic = prev.filter(m => m.id !== optimistic.id);
          const base = withoutOptimistic.some(m => m.remoteId === message.id)
            ? withoutOptimistic
            : [...withoutOptimistic, mapSupportToChat(message)];
          const withNotice = [
            ...base,
            {
              id: createAssistantId(),
              role: 'system' as const,
              text: 'Message delivered to support. An agent will reply here when available — you can keep waiting, or switch to the AI tab for instant help.',
              createdAt: Date.now(),
              animate: true,
            },
          ].sort((a, b) => a.createdAt - b.createdAt);
          return withNotice;
        });
        lastRemoteIdRef.current = message.id;
        setLiveError(null);
        if (!pollRef.current) startLivePoll();
        // Soft waiting indicator — auto-clear the “typing” style after a bit
        // so it doesn’t look stuck if no agent is online.
        window.setTimeout(() => {
          setLiveWaiting(false);
        }, 4000);
      } catch (err) {
        setLiveMessages(prev => prev.filter(m => m.id !== optimistic.id));
        setLiveWaiting(false);
        setLiveError(
          err instanceof Error ? err.message : 'Failed to send message',
        );
        throw err;
      }
    },
    [connectLiveAgent, liveConnected, startLivePoll],
  );

  const pushAssistant = useCallback(
    (
      message: Omit<HelpChatMessage, 'id' | 'createdAt' | 'role'> & {
        role?: HelpChatMessage['role'];
      },
    ) => {
      const reply: HelpChatMessage = {
        id: createAssistantId(),
        role: message.role || 'assistant',
        text: message.text,
        actions: message.actions,
        suggestions: message.suggestions,
        createdAt: Date.now(),
        animate: true,
      };
      scheduleAssistantReply(reply);
    },
    [scheduleAssistantReply],
  );

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (
        event as CustomEvent<{ mode?: HelpMode; seed?: string }>
      ).detail;
      openHelp(detail);
    };
    window.addEventListener('orderly-open-help', onOpen as EventListener);
    return () =>
      window.removeEventListener('orderly-open-help', onOpen as EventListener);
  }, [openHelp]);

  useEffect(() => {
    return () => {
      // If the provider unmounts mid-reply (HMR), drop timers cleanly.
      clearReplyTimers();
      stopLivePoll();
      pendingReplyRef.current = null;
      isTypingRef.current = false;
    };
  }, [clearReplyTimers, stopLivePoll]);

  useEffect(() => {
    if (open && mode === 'live' && liveConnected && !pollRef.current) {
      startLivePoll();
    }
  }, [open, mode, liveConnected, startLivePoll]);

  const value = useMemo(
    () => ({
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
      vaultContext,
      setVaultContext,
      openHelp,
      closeHelp,
      setMode,
      sendMessage,
      applySuggestion,
      sendLiveMessage,
      connectLiveAgent,
      pushAssistant,
    }),
    [
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
      vaultContext,
      openHelp,
      closeHelp,
      setMode,
      sendMessage,
      applySuggestion,
      sendLiveMessage,
      connectLiveAgent,
      pushAssistant,
    ],
  );

  return (
    <HelpAssistantContext.Provider value={value}>
      {children}
    </HelpAssistantContext.Provider>
  );
}

export function useHelpAssistant() {
  const ctx = useContext(HelpAssistantContext);
  if (!ctx) {
    throw new Error('useHelpAssistant must be used within HelpAssistantProvider');
  }
  return ctx;
}

export function useOptionalHelpAssistant() {
  return useContext(HelpAssistantContext);
}
