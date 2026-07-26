/** Friendly labels for how a document was read (never say "Gemini"/"OCR" in UI). */

export type AiReadSource = 'system' | 'gemini' | 'cache';

export function aiReadSourceTitle(source?: AiReadSource | null): string {
  if (source === 'system') return 'Our system read this';
  if (source === 'cache') return 'Reused a prior read';
  return 'Virtual Assistant read this';
}

export function aiReadSourceDetail(source?: AiReadSource | null): string {
  if (source === 'system') {
    return 'Text was extracted on our servers, then matched to your vault fields.';
  }
  if (source === 'cache') {
    return 'Same file as before — we reused the previous extract (no new AI cost).';
  }
  return 'Virtual Assistant reviewed the document visually for harder scans or photos.';
}

export function aiReadSourceShort(source?: AiReadSource | null): string {
  if (source === 'system') return 'Our system';
  if (source === 'cache') return 'Prior read';
  return 'Virtual Assistant';
}

export function aiNoFieldsMessage(): string {
  return 'No fields detected for this document yet.';
}
