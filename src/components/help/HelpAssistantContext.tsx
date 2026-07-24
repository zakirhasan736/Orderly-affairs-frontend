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
  typingDelayMs,
  type HelpChatMessage,
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
  liveConnected: boolean;
  liveConnecting: boolean;
  liveError: string | null;
  openHelp: (opts?: { mode?: HelpMode; seed?: string }) => void;
  closeHelp: () => void;
  setMode: (mode: HelpMode) => void;
  sendMessage: (text: string) => void;
  /** Replace the latest assistant reply with a new response for this suggestion. */
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
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveConnecting, setLiveConnecting] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRemoteIdRef = useRef<string | undefined>(undefined);
  const liveHydratedRef = useRef(false);

  const clearTypingTimer = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, []);

  const scheduleAssistantReply = useCallback(
    (reply: HelpChatMessage) => {
      clearTypingTimer();
      setIsTyping(true);
      typingTimerRef.current = setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { ...reply, animate: true }]);
        typingTimerRef.current = null;
      }, typingDelayMs(reply.text));
    },
    [clearTypingTimer],
  );

  const mergeLiveMessages = useCallback((incoming: SupportMessage[]) => {
    if (!incoming.length) return;
    setLiveMessages(prev => {
      const seen = new Set(
        prev.map(m => m.remoteId).filter(Boolean) as string[],
      );
      const mapped = incoming
        .map(mapSupportToChat)
        .filter(m => m.remoteId && !seen.has(m.remoteId));
      if (!mapped.length) return prev;
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
        setLiveMessages(data.messages.map(mapSupportToChat));
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

  const connectLiveAgent = useCallback(async () => {
    setLiveConnecting(true);
    setLiveError(null);
    setModeState('live');
    try {
      liveHydratedRef.current = false;
      lastRemoteIdRef.current = undefined;
      await pollLive();
      setLiveConnected(true);
      stopLivePoll();
      pollRef.current = setInterval(() => {
        void pollLive();
      }, 3000);
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
  }, [pollLive, stopLivePoll]);

  const setMode = useCallback(
    (next: HelpMode) => {
      setModeState(next);
      if (next === 'live') {
        void connectLiveAgent();
      } else {
        stopLivePoll();
      }
    },
    [connectLiveAgent, stopLivePoll],
  );

  const openHelp = useCallback(
    (opts?: { mode?: HelpMode; seed?: string }) => {
      const nextMode = opts?.mode || 'chat';
      setOpen(true);
      if (nextMode === 'live') {
        void connectLiveAgent();
      } else {
        setModeState(nextMode);
        stopLivePoll();
      }
      if (opts?.seed?.trim() && nextMode === 'chat') {
        const userMsg: HelpChatMessage = {
          id: createAssistantId(),
          role: 'user',
          text: opts.seed.trim(),
          createdAt: Date.now(),
        };
        setMessages(prev => [...prev, userMsg]);
        scheduleAssistantReply(respondToHelpMessage(opts.seed));
      }
    },
    [connectLiveAgent, scheduleAssistantReply, stopLivePoll],
  );

  const closeHelp = useCallback(() => {
    setOpen(false);
    clearTypingTimer();
    setIsTyping(false);
    stopLivePoll();
  }, [clearTypingTimer, stopLivePoll]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
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
            text: 'Connecting you to a live Orderly Affairs agent. Their replies appear in the Live tab from our admin support inbox.',
            createdAt: Date.now(),
            animate: true,
          },
        ]);
        void connectLiveAgent();
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
      scheduleAssistantReply(respondToHelpMessage(trimmed));
    },
    [connectLiveAgent, scheduleAssistantReply, stopLivePoll],
  );

  const applySuggestion = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const lower = trimmed.toLowerCase();
      if (
        /\b(talk to live agent|live agent|live chat|human agent)\b/.test(lower)
      ) {
        void connectLiveAgent();
        return;
      }

      clearTypingTimer();
      setModeState('chat');
      stopLivePoll();
      setIsTyping(true);

      const reply = respondToHelpMessage(trimmed);
      typingTimerRef.current = setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => {
          const next = [...prev];
          let lastAssistant = -1;
          for (let i = next.length - 1; i >= 0; i -= 1) {
            if (next[i]?.role === 'assistant') {
              lastAssistant = i;
              break;
            }
          }
          const updated: HelpChatMessage = {
            ...reply,
            id: createAssistantId(),
            animate: true,
            createdAt: Date.now(),
          };
          if (lastAssistant >= 0) {
            next[lastAssistant] = updated;
            return next;
          }
          return [...next, updated];
        });
        typingTimerRef.current = null;
      }, typingDelayMs(reply.text));
    },
    [clearTypingTimer, connectLiveAgent, isTyping, stopLivePoll],
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
      try {
        const { message } = await sendOwnerSupportMessage(trimmed);
        setLiveMessages(prev => {
          const withoutOptimistic = prev.filter(m => m.id !== optimistic.id);
          if (withoutOptimistic.some(m => m.remoteId === message.id)) {
            return withoutOptimistic;
          }
          return [...withoutOptimistic, mapSupportToChat(message)].sort(
            (a, b) => a.createdAt - b.createdAt,
          );
        });
        lastRemoteIdRef.current = message.id;
        setLiveError(null);
      } catch (err) {
        setLiveMessages(prev => prev.filter(m => m.id !== optimistic.id));
        setLiveError(
          err instanceof Error ? err.message : 'Failed to send message',
        );
        throw err;
      }
    },
    [connectLiveAgent, liveConnected],
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
      clearTypingTimer();
      stopLivePoll();
    };
  }, [clearTypingTimer, stopLivePoll]);

  useEffect(() => {
    if (open && mode === 'live' && liveConnected && !pollRef.current) {
      pollRef.current = setInterval(() => {
        void pollLive();
      }, 3000);
    }
  }, [open, mode, liveConnected, pollLive]);

  const value = useMemo(
    () => ({
      open,
      mode,
      messages,
      liveMessages,
      isTyping,
      liveConnected,
      liveConnecting,
      liveError,
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
      liveConnected,
      liveConnecting,
      liveError,
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
