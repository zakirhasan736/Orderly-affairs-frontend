'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Headphones, RefreshCw, SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminGetSupportThread,
  adminListSupportThreads,
  adminReplySupportThread,
  type SupportMessage,
  type SupportThread,
} from '@/libs/api/supportChat';
import { cn } from '@common/ui/utils';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AdminSupportInboxPage() {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selected, setSelected] = useState<SupportThread | null>(null);
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      setError(null);
      const data = await adminListSupportThreads();
      setThreads(data.threads);
      setLoadingList(false);
      return data.threads;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to load support threads';
      setError(msg);
      setLoadingList(false);
      return [] as SupportThread[];
    }
  }, []);

  const loadThread = useCallback(async (threadId: string) => {
    setLoadingThread(true);
    try {
      const data = await adminGetSupportThread(threadId);
      setSelected(data.thread);
      setMessages(data.messages);
      setThreads(prev =>
        prev.map(t => (t.id === threadId ? { ...t, unread: 0 } : t)),
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to open conversation',
      );
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
    const id = window.setInterval(() => {
      void loadThreads();
    }, 8000);
    return () => window.clearInterval(id);
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedId) return;
    void loadThread(selectedId);
    const id = window.setInterval(() => {
      void loadThread(selectedId);
    }, 4000);
    return () => window.clearInterval(id);
  }, [selectedId, loadThread]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const unreadTotal = useMemo(
    () => threads.reduce((sum, t) => sum + (t.unread || 0), 0),
    [threads],
  );

  const sendReply = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const { message } = await adminReplySupportThread(
        selectedId,
        draft.trim(),
      );
      setMessages(prev =>
        prev.some(m => m.id === message.id) ? prev : [...prev, message],
      );
      setDraft('');
      void loadThreads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reply failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-900">
      <header className="border-b border-slate-200 bg-[#10213f] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <Headphones className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Support inbox
              </h1>
              <p className="text-xs text-white/70">
                Live agent replies for vault owners
                {unreadTotal > 0 ? ` · ${unreadTotal} unread` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadThreads()}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[320px_1fr] lg:py-6">
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
            Conversations
          </div>
          {loadingList ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Loading…
            </p>
          ) : error ? (
            <div className="space-y-2 px-4 py-6 text-sm">
              <p className="font-medium text-rose-600">Could not load inbox</p>
              <p className="text-xs text-slate-500 whitespace-pre-wrap">
                {error.includes('Admin only') || error.includes('403')
                  ? 'Sign in with an admin account (JWT role: admin) to use this inbox.'
                  : error}
              </p>
            </div>
          ) : threads.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              No live support threads yet. When an owner taps Live agent in help,
              they appear here.
            </p>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
              {threads.map(thread => (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(thread.id)}
                    className={cn(
                      'flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-slate-50',
                      selectedId === thread.id && 'bg-[#10213f]/5',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-800">
                        {thread.owner_email || 'Owner'}
                      </span>
                      {thread.unread > 0 ? (
                        <span className="rounded-full bg-[#10213f] px-2 py-0.5 text-[10px] font-bold text-white">
                          {thread.unread}
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-500">
                      {thread.last_preview || 'No messages yet'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatTime(thread.last_message_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-500">
              Select a conversation to reply. Owner messages from the help Live
              tab land here in real time.
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">
                  {selected?.owner_email || 'Owner'}
                </p>
                <p className="text-xs text-slate-500">
                  {selected?.subject || 'Live support'} ·{' '}
                  {selected?.status || 'open'}
                </p>
              </div>

              <div
                ref={scrollerRef}
                className="flex-1 space-y-3 overflow-y-auto bg-[#f8fafc] px-4 py-4"
              >
                {loadingThread && messages.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">Loading…</p>
                ) : (
                  messages.map(message => {
                    const isAdmin = message.sender === 'admin';
                    const isOwner = message.sender === 'owner';
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex',
                          isAdmin ? 'justify-end' : 'justify-start',
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
                            isAdmin
                              ? 'rounded-br-md bg-[#10213f] text-white'
                              : isOwner
                                ? 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                                : 'rounded-bl-md bg-slate-200 text-slate-600',
                          )}
                        >
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                            {isAdmin
                              ? 'You (admin)'
                              : isOwner
                                ? 'Owner'
                                : 'System'}
                          </p>
                          <p className="whitespace-pre-wrap">{message.text}</p>
                          <p className="mt-1 text-[10px] opacity-60">
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={event => void sendReply(event)}
                className="border-t border-slate-100 bg-white p-3"
              >
                <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2">
                  <textarea
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    rows={2}
                    placeholder="Reply to the owner…"
                    className="min-h-[44px] min-w-0 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#10213f] text-white disabled:opacity-50"
                    aria-label="Send reply"
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
