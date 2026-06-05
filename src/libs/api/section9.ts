const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const UPLOAD_KEYS = ['account_info', 'contact_details', 'tax_documents'] as const;

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

function sanitizeSection9Payload(payload: Record<string, unknown>) {
  const charities = payload['9A'];
  if (!Array.isArray(charities)) return payload;

  return {
    ...payload,
    '9A': charities.map(charity => {
      if (!charity || typeof charity !== 'object') return charity;

      const next = { ...(charity as Record<string, unknown>) };
      for (const key of UPLOAD_KEYS) {
        if (key in next) {
          next[key] = normalizeUploadField(next[key]);
        }
      }
      return next;
    }),
  };
}

export async function saveSection9(token: string, payload: any) {
  const res = await fetch(`${API_BASE}/sections/section9-charitable-giving`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(sanitizeSection9Payload(payload)),
  });

  if (!res.ok) throw new Error('Failed to save Section 9');
  return res.json();
}

export async function getSection9(token: string) {
  const res = await fetch(`${API_BASE}/sections/section9-charitable-giving`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to load Section 9');
  return res.json();
}
