import type { SchemaSub } from '@/vault-prototype/types';
import { listAiUploadHistory, type AiUploadHistoryItem } from '@/utils/aiUploadHistory';

export type AttachedVaultDocument = {
  fileId: string;
  fileName: string;
  mimeType?: string;
};

function tokensFrom(...parts: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const blob = parts.filter(Boolean).join(' ').toLowerCase();
  for (const token of blob.match(/[a-z0-9]{3,}/g) || []) {
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

function extraTokensForSub(sub: SchemaSub): string[] {
  const id = String(sub.id || '').toLowerCase();
  const name = String(sub.name || '').toLowerCase();
  if (/license|driver|state.?id/.test(`${id} ${name}`)) {
    return ['driver', 'license', 'state', 'dl'];
  }
  if (/passport/.test(`${id} ${name}`)) {
    return ['passport'];
  }
  return [];
}

function haystackForItem(item: Pick<AiUploadHistoryItem, 'fileName' | 'displayTitle' | 'documentSummary'>): string {
  return [item.fileName, item.displayTitle, item.documentSummary]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function filesFromRecord(record: Record<string, unknown> | undefined): AttachedVaultDocument[] {
  if (!record) return [];
  const out: AttachedVaultDocument[] = [];
  const seen = new Set<string>();

  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const entry = node as Record<string, unknown>;
    const files = Array.isArray(entry.files) ? entry.files : null;
    if (files) {
      files.forEach(file => {
        if (!file || typeof file !== 'object') return;
        const row = file as Record<string, unknown>;
        const fileId = String(row.file_id || row.fileId || '').trim();
        if (!fileId || seen.has(fileId)) return;
        seen.add(fileId);
        out.push({
          fileId,
          fileName: String(row.name || row.file_name || row.original_filename || 'Document'),
          mimeType: String(row.mime_type || row.content_type || '') || undefined,
        });
      });
    }
    Object.values(entry).forEach(visit);
  };

  visit(record);
  return out;
}

export function scoreVaultDocumentMatch(
  item: Pick<AiUploadHistoryItem, 'fileName' | 'displayTitle' | 'documentSummary'>,
  sub: SchemaSub,
  record?: Record<string, unknown>,
): number {
  const hay = haystackForItem(item);
  if (!hay) return 0;
  const recordBits = Object.values(record || {})
    .filter(value => typeof value === 'string')
    .slice(0, 8)
    .map(value => String(value));
  const tokens = [
    ...tokensFrom(sub.id, sub.name, sub.entry, ...recordBits),
    ...extraTokensForSub(sub),
  ];
  let score = 0;
  for (const token of tokens) {
    if (hay.includes(token)) score += 1;
  }
  return score;
}

export function pickAttachedVaultDocument(
  items: AiUploadHistoryItem[],
  sub: SchemaSub,
  record?: Record<string, unknown>,
): AttachedVaultDocument | null {
  const embedded = filesFromRecord(record);
  if (embedded[0]) return embedded[0];

  const usable = items.filter(
    item =>
      String(item.fileId || '').trim() &&
      String(item.status || '').toLowerCase() !== 'failed',
  );
  if (!usable.length) return null;

  let best: AiUploadHistoryItem | null = null;
  let bestScore = 0;
  for (const item of usable) {
    const score = scoreVaultDocumentMatch(item, sub, record);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  if (best && bestScore > 0) {
    return {
      fileId: String(best.fileId),
      fileName: best.displayTitle || best.fileName,
      mimeType: best.mimeType,
    };
  }

  const identityLike = /license|driver|passport|state.?id/.test(
    `${sub.id} ${sub.name}`.toLowerCase(),
  );
  if (identityLike && usable.length) {
    const newest = [...usable].sort(
      (a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
    )[0];
    return {
      fileId: String(newest.fileId),
      fileName: newest.displayTitle || newest.fileName,
      mimeType: newest.mimeType,
    };
  }

  return null;
}

export function findAttachedVaultDocument(args: {
  sectionId: string;
  sub: SchemaSub;
  record?: Record<string, unknown>;
}): AttachedVaultDocument | null {
  return pickAttachedVaultDocument(
    listAiUploadHistory({ sectionId: args.sectionId }),
    args.sub,
    args.record,
  );
}
