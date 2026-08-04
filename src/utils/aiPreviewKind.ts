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
  // Strip query/hash if any
  const clean = name.split('?')[0].split('#')[0];
  if (clean.endsWith('.pdf')) return 'application/pdf';
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
  if (clean.endsWith('.webp')) return 'image/webp';
  if (clean.endsWith('.gif')) return 'image/gif';
  if (clean.endsWith('.bmp')) return 'image/bmp';
  if (clean.endsWith('.tif') || clean.endsWith('.tiff')) return 'image/tiff';
  if (
    clean.endsWith('.txt') ||
    clean.endsWith('.csv') ||
    clean.endsWith('.md') ||
    clean.endsWith('.log') ||
    clean.endsWith('.json')
  ) {
    return 'text/plain';
  }
  if (clean.endsWith('.xml')) return 'application/xml';
  return '';
}

/** Sniff mime from file magic bytes (handles missing / wrong Content-Type). */
export function sniffMimeFromBytes(bytes: ArrayBuffer | Uint8Array | null | undefined): string {
  if (!bytes) return '';
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (u8.length < 4) return '';

  // PDF
  if (u8[0] === 0x25 && u8[1] === 0x50 && u8[2] === 0x44 && u8[3] === 0x46) {
    return 'application/pdf';
  }
  // PNG
  if (
    u8[0] === 0x89 &&
    u8[1] === 0x50 &&
    u8[2] === 0x4e &&
    u8[3] === 0x47
  ) {
    return 'image/png';
  }
  // JPEG
  if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) {
    return 'image/jpeg';
  }
  // GIF
  if (u8[0] === 0x47 && u8[1] === 0x49 && u8[2] === 0x46) {
    return 'image/gif';
  }
  // WEBP: RIFF....WEBP
  if (
    u8.length >= 12 &&
    u8[0] === 0x52 &&
    u8[1] === 0x49 &&
    u8[2] === 0x46 &&
    u8[3] === 0x46 &&
    u8[8] === 0x57 &&
    u8[9] === 0x45 &&
    u8[10] === 0x42 &&
    u8[11] === 0x50
  ) {
    return 'image/webp';
  }
  // BMP
  if (u8[0] === 0x42 && u8[1] === 0x4d) {
    return 'image/bmp';
  }

  // Likely UTF-8 / ASCII text (printable + common whitespace)
  const sample = u8.subarray(0, Math.min(u8.length, 512));
  let printable = 0;
  for (let i = 0; i < sample.length; i++) {
    const c = sample[i];
    if (
      c === 0x09 ||
      c === 0x0a ||
      c === 0x0d ||
      (c >= 0x20 && c <= 0x7e) ||
      c >= 0x80
    ) {
      printable += 1;
    } else if (c === 0x00) {
      return ''; // binary
    }
  }
  if (sample.length > 0 && printable / sample.length >= 0.9) {
    return 'text/plain';
  }

  return '';
}

function isGenericMime(mime: string): boolean {
  return (
    !mime ||
    mime === 'application/octet-stream' ||
    mime === 'binary/octet-stream' ||
    mime === 'application/download'
  );
}

export function resolveAiPreviewMime(args: {
  contentType?: string | null;
  blobType?: string | null;
  fileName?: string | null;
  fallbackMime?: string | null;
  /** First bytes of the file for magic sniffing */
  bytes?: ArrayBuffer | Uint8Array | null;
}): string {
  const fromHeader = baseMime(args.contentType);
  const fromBlob = baseMime(args.blobType);
  const fromName = mimeFromFileName(args.fileName);
  const fromFallback = baseMime(args.fallbackMime);
  const fromBytes = sniffMimeFromBytes(args.bytes);

  // Prefer concrete types; magic bytes beat generic octet-stream headers.
  const ranked = [
    !isGenericMime(fromHeader) ? fromHeader : '',
    !isGenericMime(fromBlob) ? fromBlob : '',
    fromBytes,
    fromName,
    fromFallback,
    fromHeader,
    fromBlob,
  ].filter(Boolean);

  for (const mime of ranked) {
    if (mime && !isGenericMime(mime)) return mime;
  }

  return fromName || fromBytes || fromHeader || fromBlob || fromFallback || 'application/octet-stream';
}

export function resolveAiPreviewKind(args: {
  mime?: string | null;
  fileName?: string | null;
  bytes?: ArrayBuffer | Uint8Array | null;
}): AiPreviewKind {
  const mime = resolveAiPreviewMime({
    contentType: args.mime,
    fileName: args.fileName,
    bytes: args.bytes,
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
