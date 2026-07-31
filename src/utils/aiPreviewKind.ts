/** Resolve how to preview an uploaded AI document (image / pdf / text / other). */

export type AiPreviewKind = 'image' | 'pdf' | 'text' | 'other';

function baseMime(raw?: string | null): string {
  return String(raw || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
}

export function mimeFromFileName(fileName?: string | null): string {
  const name = String(fileName || '').trim().toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  if (name.endsWith('.bmp')) return 'image/bmp';
  if (name.endsWith('.tif') || name.endsWith('.tiff')) return 'image/tiff';
  if (
    name.endsWith('.txt') ||
    name.endsWith('.csv') ||
    name.endsWith('.md') ||
    name.endsWith('.log') ||
    name.endsWith('.json')
  ) {
    return 'text/plain';
  }
  return '';
}

export function resolveAiPreviewMime(args: {
  contentType?: string | null;
  blobType?: string | null;
  fileName?: string | null;
  fallbackMime?: string | null;
}): string {
  const fromHeader = baseMime(args.contentType);
  const fromBlob = baseMime(args.blobType);
  const fromName = mimeFromFileName(args.fileName);
  const fromFallback = baseMime(args.fallbackMime);

  const candidates = [fromHeader, fromBlob, fromFallback, fromName].filter(
    Boolean,
  );

  for (const mime of candidates) {
    if (mime && mime !== 'application/octet-stream') return mime;
  }

  return fromName || fromHeader || fromBlob || fromFallback || 'application/octet-stream';
}

export function resolveAiPreviewKind(args: {
  mime?: string | null;
  fileName?: string | null;
}): AiPreviewKind {
  const mime = resolveAiPreviewMime({
    contentType: args.mime,
    fileName: args.fileName,
  });
  const name = String(args.fileName || '').toLowerCase();

  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(name)) {
    return 'image';
  }
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml' ||
    /\.(txt|csv|md|log|json|xml)$/i.test(name)
  ) {
    return 'text';
  }
  return 'other';
}
