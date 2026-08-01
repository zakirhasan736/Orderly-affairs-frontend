import { secureFetch } from '@/libs/secureFetch';

export type FeedbackCategory = 'idea' | 'bug' | 'confusing' | 'other';

export type FeedbackAttachment = {
  url: string;
  public_id?: string | null;
  name?: string | null;
  type?: string | null;
};

export type FeedbackItem = {
  id: string;
  owner_id: string;
  owner_email: string;
  category: FeedbackCategory | string;
  subject: string;
  message: string;
  page_path: string;
  rating: number | null;
  attachments: FeedbackAttachment[];
  status: string;
  created_at: string;
};

export type SubmitFeedbackPayload = {
  category: FeedbackCategory;
  message: string;
  subject?: string;
  page_path?: string;
  rating?: number | null;
  attachments?: FeedbackAttachment[];
};

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    let detail = raw || `Feedback request failed (${res.status})`;
    try {
      const parsed = JSON.parse(raw) as { detail?: unknown };
      if (typeof parsed.detail === 'string' && parsed.detail.trim()) {
        detail = parsed.detail;
      }
    } catch {
      /* keep raw */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function submitFeedback(payload: SubmitFeedbackPayload) {
  const res = await secureFetch('/feedback/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return readJson<{ feedback: FeedbackItem }>(res);
}

export async function adminListFeedback(params?: {
  status?: string;
  category?: string;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.category) qs.set('category', params.category);
  if (params?.limit) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await secureFetch(`/admin/feedback/list${suffix}`, { method: 'GET' });
  return readJson<{ feedback: FeedbackItem[]; count: number }>(res);
}

export async function adminUpdateFeedbackStatus(
  feedbackId: string,
  status: 'open' | 'reviewed' | 'closed',
) {
  const res = await secureFetch(
    `/admin/feedback/${encodeURIComponent(feedbackId)}?status=${encodeURIComponent(status)}`,
    { method: 'PATCH' },
  );
  return readJson<{ feedback: FeedbackItem }>(res);
}
