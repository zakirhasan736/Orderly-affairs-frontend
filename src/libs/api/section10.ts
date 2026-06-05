const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const UPLOAD_KEYS = ['documents'] as const;

function normalizeUploadField(value: unknown) {
  if (value === '' || value == null) {
    return { text: '', files: [], _deleted_files: [] };
  }

  if (typeof value === 'object') {
    const field = value as Record<string, unknown>;
    return {
      text: typeof field.text === 'string' ? field.text : '',
      files: Array.isArray(field.files) ? field.files : [],
      _deleted_files: Array.isArray(field._deleted_files)
        ? field._deleted_files
        : [],
    };
  }

  return { text: '', files: [], _deleted_files: [] };
}

function sanitizeSection10Payload(payload: Record<string, unknown>) {
  const items = payload['10A'];
  if (!Array.isArray(items)) return payload;

  return {
    ...payload,
    '10A': items.map(item => {
      if (!item || typeof item !== 'object') return item;

      const next = { ...(item as Record<string, unknown>) };
      for (const key of UPLOAD_KEYS) {
        if (key in next) {
          next[key] = normalizeUploadField(next[key]);
        }
      }
      return next;
    }),
  };
}

export async function saveSection10(token: string, payload: any) {
  const res = await fetch(
    `${API_BASE}/sections/section10-education-accomplishments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sanitizeSection10Payload(payload)),
    },
  );

  if (!res.ok) throw new Error('Failed to save Section 10');
  return res.json();
}

export async function getSection10(token: string) {
  const res = await fetch(
    `${API_BASE}/sections/section10-education-accomplishments`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok) throw new Error('Failed to load Section 10');
  return res.json();
}