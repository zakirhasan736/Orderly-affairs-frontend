/**
 * Friendly titles for uploaded AI documents (Passport, Driver's license, …)
 * instead of camera filenames like IMG_8615.jpeg.
 */

import { inferIdentityDocumentLabel } from '@/utils/aiIdentityDocument';
import { listDashboardAiPatches } from '@/utils/aiDashboardPatchCache';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';

const CAMERA_FILE_RE =
  /^(img|dsc|dcim|photo|screenshot|image|pix|scan|whatsapp|signal)[_-]?\d+/i;

export function isGenericCameraFileName(fileName?: string | null): boolean {
  const base = String(fileName || '')
    .trim()
    .replace(/\.[a-z0-9]{1,8}$/i, '');
  if (!base) return true;
  if (CAMERA_FILE_RE.test(base)) return true;
  if (/^\d{6,}$/.test(base)) return true;
  return false;
}

function cleanFileStem(fileName?: string | null): string {
  return String(fileName || '')
    .trim()
    .replace(/\.[a-z0-9]{1,8}$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Map free-text AI summary / filename cues → short document type label. */
export function inferDocumentTypeLabel(args: {
  documentSummary?: string | null;
  fileName?: string | null;
  sectionId?: string | null;
}): string | null {
  const text = `${args.documentSummary || ''} ${args.fileName || ''}`.trim();
  if (!text) return null;

  // Prefer identity-specific labels when the text looks like an ID.
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

  if (/\b(health\s*insurance|medical\s*insurance|insurance\s*card|member\s*id|rx\s*bin|group\s*(?:number|#))\b/i.test(text)) {
    return 'Insurance card';
  }
  if (/\b(auto|vehicle|car)\b.*\binsurance\b|\binsurance\b.*\b(auto|vehicle|car)\b/i.test(text)) {
    return 'Auto insurance';
  }
  if (/\b(registration|title|vin)\b/i.test(text) && /\b(vehicle|car|truck|vin)\b/i.test(text)) {
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

  // Short summary that is already a clean label
  const summary = String(args.documentSummary || '').trim();
  if (summary && summary.length <= 48 && !/[.!?]/.test(summary)) {
    return summary;
  }

  return null;
}

function fallbackFromSection(sectionId?: string | null): string | null {
  const id = String(sectionId || '').trim();
  if (!id || id === 'overview') return null;
  switch (id) {
    case '1':
      return 'Identity document';
    case '5':
      return 'Vehicle document';
    case '7':
      return 'Insurance document';
    case '15':
      return 'Health document';
    case '20':
      return 'Legal document';
    case '17':
      return 'Family document';
    case '12':
      return 'Banking document';
    case '10':
      return 'Education document';
    default:
      return null;
  }
}

/**
 * Title shown on upload cards. Prefer typed labels over camera filenames.
 */
export function resolveUploadDisplayTitle(args: {
  displayTitle?: string | null;
  documentSummary?: string | null;
  fileName?: string | null;
  sectionId?: string | null;
  targetSectionLabel?: string | null;
  fileId?: string | null;
}): string {
  const explicit = String(args.displayTitle || '').trim();
  if (explicit && !isGenericCameraFileName(explicit)) return explicit;

  const fromArgs = inferDocumentTypeLabel({
    documentSummary: args.documentSummary,
    fileName: args.fileName,
    sectionId: args.sectionId,
  });
  if (fromArgs) return fromArgs;

  if (args.fileId) {
    const patches = listDashboardAiPatches().filter(
      entry => String(entry.file_id || '') === String(args.fileId),
    );
    for (const patch of patches) {
      const fromPatch = inferDocumentTypeLabel({
        documentSummary: patch.document_summary,
        fileName: patch.file_name || args.fileName,
        sectionId: patch.section_id || args.sectionId,
      });
      if (fromPatch) return fromPatch;
    }
  }

  const fromSection = fallbackFromSection(args.sectionId);
  if (fromSection) return fromSection;

  if (!isGenericCameraFileName(args.fileName)) {
    const stem = cleanFileStem(args.fileName);
    if (stem) return stem;
  }

  if (args.targetSectionLabel?.trim()) return args.targetSectionLabel.trim();
  if (args.sectionId && args.sectionId !== 'overview') {
    return getAiSectionLabel(args.sectionId);
  }
  return 'Uploaded document';
}
