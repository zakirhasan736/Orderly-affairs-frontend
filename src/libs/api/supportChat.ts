import { secureFetch } from '@/libs/secureFetch';

export type SupportSender = 'owner' | 'admin' | 'system';

export type SupportMessage = {
  id: string;
  thread_id: string;
  sender: SupportSender;
  text: string;
  created_at: string;
};

export type SupportThread = {
  id: string;
  owner_id: string;
  owner_email: string;
  status: string;
  subject: string;
  last_message_at: string;
  last_preview: string;
  unread: number;
  created_at: string;
};

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    let detail = raw || `Support request failed (${res.status})`;
    try {
      const parsed = JSON.parse(raw) as { detail?: unknown };
      if (typeof parsed.detail === 'string' && parsed.detail.trim()) {
        detail = parsed.detail;
      }
    } catch {
      /* keep raw */
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'Live agent chat requires an active owner login. Sign in as the Vault owner, then try Live again.',
      );
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

async function supportFetch(path: string, options?: RequestInit) {
  try {
    return await secureFetch(path, options);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/failed to fetch|networkerror|load failed|mixed content/i.test(msg)) {
      throw new Error(
        'Could not reach the API. Redeploy the portal so /oa-api proxies to https://api.orderly-affairs.com.',
      );
    }
    throw err instanceof Error ? err : new Error(msg || 'Request failed');
  }
}

export async function fetchMySupportThread() {
  const res = await supportFetch('/support/thread', { method: 'GET' });
  return readJson<{ thread: SupportThread }>(res);
}

export async function fetchMySupportMessages(after?: string) {
  const qs = after ? `?after=${encodeURIComponent(after)}` : '';
  const res = await supportFetch(`/support/thread/messages${qs}`, {
    method: 'GET',
  });
  return readJson<{ thread: SupportThread; messages: SupportMessage[] }>(res);
}

export async function sendOwnerSupportMessage(text: string) {
  const res = await supportFetch('/support/thread/messages', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return readJson<{ message: SupportMessage }>(res);
}

export async function adminListSupportThreads() {
  const res = await supportFetch('/admin/support/threads', { method: 'GET' });
  return readJson<{ threads: SupportThread[] }>(res);
}

export async function adminGetSupportThread(threadId: string) {
  const res = await supportFetch(`/admin/support/threads/${threadId}`, {
    method: 'GET',
  });
  return readJson<{ thread: SupportThread; messages: SupportMessage[] }>(res);
}

export async function adminReplySupportThread(threadId: string, text: string) {
  const res = await supportFetch(`/admin/support/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return readJson<{ message: SupportMessage }>(res);
}
