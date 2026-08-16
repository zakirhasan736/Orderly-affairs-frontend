/**
 * Titles for uploaded AI documents on the overview Documents popup.
 * Always prefer the file the user uploaded (polished), never the matched section name.
 */

import { inferIdentityDocumentLabel } from '@/utils/aiIdentityDocument';
import { AI_SECTION_REGISTRY, getAiSectionLabel } from '@/utils/aiSectionRegistry';

const CAMERA_FILE_RE =
  /^(img|dsc|dcim|photo|screenshot|image|pix|scan|whatsapp|signal)[_-]?\d+/i;

const PLACEHOLDER_STEM_RE = /^(uploaded document|untitled|file)$/i;

const KEEP_UPPER = new Set([
  'id',
  'ssn',
  'dl',
  'poa',
  'vin',
  'img',
  'dsc',
  'dcim',
  'w2',
  'irs',
  'pdf',
]);

const GENERIC_TYPE_TITLES = new Set(
  [
    'identity document',
    'vehicle document',
    'insurance document',
    'health document',
    'legal document',
    'family document',
    'banking document',
    'education document',
    'uploaded document',
    'overview',
  ].map(value => value.toLowerCase()),
);

export function isGenericCameraFileName(fileName?: string | null): boolean {
  const base = String(fileName || '')
    .trim()
    .replace(/\.[a-z0-9]{1,8}$/i, '');
  if (!base) return true;
  if (CAMERA_FILE_RE.test(base)) return true;
  if (/^\d{6,}$/.test(base)) return true;
  return false;
}

function basename(fileName?: string | null): string {
  return String(fileName || '')
    .trim()
    .replace(/^.*[\\/]/, '');
}

function splitNameAndExt(fileName?: string | null): {
  stem: string;
  ext: string;
} {
  const base = basename(fileName);
  const match = base.match(/\.([a-z0-9]{1,8})$/i);
  if (!match) return { stem: base, ext: '' };
  return {
    stem: base.slice(0, -match[0].length),
    ext: match[1].toLowerCase(),
  };
}

function extFromMime(mimeType?: string | null): string {
  const mime = String(mimeType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!mime) return '';
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'text/plain') return 'txt';
  if (mime.startsWith('image/')) {
    const sub = mime.slice('image/'.length).split('+')[0];
    if (sub === 'jpeg') return 'jpg';
    if (sub === 'svg+xml' || sub === 'svg') return 'svg';
    return sub || 'jpg';
  }
  return '';
}

function normalizeExt(ext: string): string {
  if (ext === 'jpeg') return 'jpg';
  return ext;
}

function titleCaseStem(stem: string): string {
  return stem
    .split(' ')
    .filter(Boolean)
    .map(word => {
      const lower = word.toLowerCase();
      if (KEEP_UPPER.has(lower)) return word.toUpperCase();
      if (/^[A-Za-z]{2,4}\d+$/.test(word)) return word.toUpperCase();
      if (/^\d/.test(word)) return word;
      if (word.length <= 3 && /^[A-Z]+$/.test(word)) return word;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function isPlaceholderStem(stem: string): boolean {
  return !stem || PLACEHOLDER_STEM_RE.test(stem);
}

/**
 * Readable name from the file the user actually uploaded.
 * Example: Auto_Insurance.PDF → Auto Insurance.pdf, IMG_8615.JPEG → IMG 8615.jpg
 */
export function polishUploadedDocumentName(
  fileName?: string | null,
  mimeType?: string | null,
): string | null {
  const { stem: rawStem, ext: rawExt } = splitNameAndExt(fileName);
  const stem = rawStem
    .replace(/_/g, ' ')
    .replace(/([A-Za-z])-+([A-Za-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  if (isPlaceholderStem(stem)) return null;

  const ext = normalizeExt(rawExt || extFromMime(mimeType));
  const titled = titleCaseStem(stem);
  if (!titled) return null;
  return ext ? `${titled}.${ext}` : titled;
}

export function uploadedFileKindLabel(args: {
  fileName?: string | null;
  mimeType?: string | null;
}): 'PDF' | 'Image' | 'Text' | 'Document' {
  const mime = String(args.mimeType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  const name = basename(args.fileName).toLowerCase();
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'PDF';
  if (
    mime.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|bmp|tiff?|heic|heif)$/i.test(name)
  ) {
    return 'Image';
  }
  if (mime.startsWith('text/') || /\.(txt|csv|md|log)$/i.test(name)) {
    return 'Text';
  }
  return 'Document';
}

/** Map free-text AI summary / filename cues → short document type label. */
export function inferDocumentTypeLabel(args: {
  documentSummary?: string | null;
  fileName?: string | null;
  sectionId?: string | null;
}): string | null {
  const text = `${args.documentSummary || ''} ${args.fileName || ''}`.trim();
  if (!text) return null;

  if (
    /\b(passport|driver|licen[cs]e|birth\s*cert|social\s*security|ssn|state\s*id|military\s*id)\b/i.test(
      text,
    )
  ) {
    return inferIdentityDocumentLabel({
      documentSummary: args.documentSummary,
      fileName: args.fileName,
    });
  }

  if (
    /\b(health\s*insurance|medical\s*insurance|insurance\s*card|member\s*id|rx\s*bin|group\s*(?:number|#))\b/i.test(
      text,
    )
  ) {
    return 'Insurance card';
  }
  if (
    /\b(auto|vehicle|car)\b.*\binsurance\b|\binsurance\b.*\b(auto|vehicle|car)\b/i.test(
      text,
    )
  ) {
    return 'Auto insurance';
  }
  if (
    /\b(registration|title|vin)\b/i.test(text) &&
    /\b(vehicle|car|truck|vin)\b/i.test(text)
  ) {
    return 'Vehicle registration';
  }
  if (/\b(bank|checking|savings|statement)\b/i.test(text)) {
    return 'Bank statement';
  }
  if (/\b(tax|w-?2|1099|irs)\b/i.test(text)) {
    return 'Tax document';
  }
  if (/\b(will|trust|power\s*of\s*attorney|poa|estate)\b/i.test(text)) {
    return 'Legal document';
  }
  if (/\b(diploma|transcript|degree|school|iep|504)\b/i.test(text)) {
    return 'Education document';
  }
  if (/\b(deed|mortgage|property|lease)\b/i.test(text)) {
    return 'Property document';
  }
  if (/\b(pay\s*stub|wages|employer|employment)\b/i.test(text)) {
    return 'Employment document';
  }

  const summary = String(args.documentSummary || '').trim();
  if (summary && summary.length <= 48 && !/[.!?]/.test(summary)) {
    return summary;
  }

  return null;
}

function looksLikeSectionTitle(
  value: string,
  args: {
    sectionId?: string | null;
    targetSectionLabel?: string | null;
  },
): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return false;
  if (GENERIC_TYPE_TITLES.has(v)) return true;
  if (/^section\s+\d+[a-z]?$/i.test(v)) return true;
  if (args.targetSectionLabel && v === args.targetSectionLabel.trim().toLowerCase()) {
    return true;
  }
  if (args.sectionId && args.sectionId !== 'overview') {
    if (v === getAiSectionLabel(args.sectionId).toLowerCase()) return true;
  }
  return AI_SECTION_REGISTRY.some(entry => entry.label.toLowerCase() === v);
}

/**
 * Title shown on upload cards: the polished original filename.
 * Matched section stays as metadata — never as the document name.
 */
export function resolveUploadDisplayTitle(args: {
  displayTitle?: string | null;
  documentSummary?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  sectionId?: string | null;
  targetSectionLabel?: string | null;
  fileId?: string | null;
}): string {
  const fromFile = polishUploadedDocumentName(args.fileName, args.mimeType);
  if (fromFile) return fromFile;

  const explicit = String(args.displayTitle || '').trim();
  if (
    explicit &&
    !looksLikeSectionTitle(explicit, args) &&
    !isGenericCameraFileName(explicit)
  ) {
    const polishedExplicit = polishUploadedDocumentName(explicit, args.mimeType);
    if (polishedExplicit) return polishedExplicit;
    if (!GENERIC_TYPE_TITLES.has(explicit.toLowerCase())) return explicit;
  }

  const kind = uploadedFileKindLabel({
    fileName: args.fileName,
    mimeType: args.mimeType,
  });
  if (kind === 'PDF') return 'Uploaded PDF';
  if (kind === 'Image') return 'Uploaded image';
  if (kind === 'Text') return 'Uploaded text file';
  return 'Uploaded document';
}
