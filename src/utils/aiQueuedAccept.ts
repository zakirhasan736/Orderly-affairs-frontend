/**
 * When the user Accepts an AI fill before extraction has stashed a patch,
 * queue the accept and flush automatically once the patch arrives.
 */

import { peekDashboardAiPatch } from '@/utils/aiDashboardPatchCache';
import { markAiSectionReviewed } from '@/utils/aiSectionReviewState';
import {
  persistAllPendingStashesForSection,
  persistPartnerStashesForFiles,
} from '@/services/aiBackgroundSectionPersist';

export type QueuedAiAccept = {
  sectionId: string;
  fileId?: string;
  fileName?: string;
  queuedAt: number;
};

const STORAGE_KEY = 'orderly_ai_queued_accepts_v1';

function readQueue(): QueuedAiAccept[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is QueuedAiAccept =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as QueuedAiAccept).sectionId === 'string',
      )
      .map(item => ({
        sectionId: String(item.sectionId),
        fileId: item.fileId ? String(item.fileId) : undefined,
        fileName: item.fileName ? String(item.fileName) : undefined,
        queuedAt: Number(item.queuedAt) || Date.now(),
      }));
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedAiAccept[]) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function queueKey(item: Pick<QueuedAiAccept, 'sectionId' | 'fileId'>) {
  return `${item.sectionId}:${item.fileId || '*'}`;
}

export function listQueuedAiAccepts(): QueuedAiAccept[] {
  return readQueue();
}

export function hasQueuedAiAccept(args: {
  sectionId: string;
  fileId?: string | null;
}): boolean {
  const key = queueKey({
    sectionId: args.sectionId,
    fileId: args.fileId || undefined,
  });
  return readQueue().some(item => queueKey(item) === key);
}

export function queueAiAccept(args: {
  sectionId: string;
  fileId?: string | null;
  fileName?: string | null;
}): void {
  if (!args.sectionId || args.sectionId === 'overview') return;
  const next = readQueue().filter(
    item =>
      queueKey(item) !==
      queueKey({
        sectionId: args.sectionId,
        fileId: args.fileId || undefined,
      }),
  );
  next.push({
    sectionId: args.sectionId,
    fileId: args.fileId || undefined,
    fileName: args.fileName || undefined,
    queuedAt: Date.now(),
  });
  writeQueue(next);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('orderly-ai-accept-queued', { detail: args }),
    );
  }
}

export function removeQueuedAiAccept(args: {
  sectionId: string;
  fileId?: string | null;
}): void {
  const key = queueKey({
    sectionId: args.sectionId,
    fileId: args.fileId || undefined,
  });
  writeQueue(readQueue().filter(item => queueKey(item) !== key));
}

export type FlushQueuedAcceptsResult = {
  flushed: number;
  failed: number;
  clearedFiles: string[];
  sectionIds: string[];
};

let flushInFlight: Promise<FlushQueuedAcceptsResult> | null = null;

/**
 * Persist any queued accepts whose AI patches are now available.
 */
export async function flushQueuedAiAccepts(): Promise<FlushQueuedAcceptsResult> {
  if (flushInFlight) return flushInFlight;

  flushInFlight = (async () => {
    const queue = readQueue();
    if (!queue.length) {
      return { flushed: 0, failed: 0, clearedFiles: [], sectionIds: [] };
    }

    let flushed = 0;
    let failed = 0;
    const clearedFiles = new Set<string>();
    const sectionIds = new Set<string>();

    for (const item of queue) {
      const { listDashboardAiPatchesForSection } = await import(
        '@/utils/aiDashboardPatchCache'
      );
      const sectionPatches = listDashboardAiPatchesForSection(item.sectionId);
      if (!sectionPatches.length) continue;

      const primary =
        peekDashboardAiPatch(item.sectionId, item.fileId) ||
        (item.fileId
          ? sectionPatches.find(p => p.file_id === item.fileId) || null
          : sectionPatches[0] || null);

      // File-specific accept still waiting on that file's extract.
      if (item.fileId && !primary) continue;

      const { isIdentityDocumentCandidate } = await import(
        '@/utils/aiIdentityDocument'
      );
      const { gateIdentityDocumentPerson } = await import(
        '@/utils/aiIdentityGate'
      );
      const { AI_SECTION_BY_ID } = await import('@/utils/aiSectionRegistry');
      const { persistAiResultToSectionBackground } = await import(
        '@/services/aiBackgroundSectionPersist'
      );
      const { takeDashboardAiPatch } = await import(
        '@/utils/aiDashboardPatchCache'
      );

      if (
        primary?.result &&
        isIdentityDocumentCandidate({
          sectionId: item.sectionId,
          sectionKey: primary.section_key,
          documentSummary: primary.document_summary,
          fileName: item.fileName || primary.file_name,
          result: primary.result,
        })
      ) {
        const meta = AI_SECTION_BY_ID[item.sectionId];
        const gated = await gateIdentityDocumentPerson({
          sectionId: item.sectionId,
          sectionKey: primary.section_key || meta?.key || '',
          subsection: primary.subsection,
          sectionLabel: meta?.label,
          result: primary.result,
          documentSummary: primary.document_summary,
          fileName: item.fileName || primary.file_name,
        });

        if (gated.skipped) {
          removeQueuedAiAccept(item);
          markAiSectionReviewed({
            sectionId: item.sectionId,
            fileId: item.fileId,
          });
          continue;
        }

        if (gated.target.sectionId !== item.sectionId) {
          takeDashboardAiPatch(item.sectionId, item.fileId || primary.file_id);
          const saved = await persistAiResultToSectionBackground({
            sectionId: gated.target.sectionId,
            sectionKey: gated.target.sectionKey,
            result: gated.target.result,
            subsection: gated.target.subsection,
          });
          if (!saved.ok) {
            failed += 1;
            continue;
          }
          flushed += 1;
          sectionIds.add(gated.target.sectionId);
          if (item.fileId) clearedFiles.add(item.fileId);
          markAiSectionReviewed({
            sectionId: item.sectionId,
            fileId: item.fileId,
          });
          markAiSectionReviewed({
            sectionId: gated.target.sectionId,
            fileId: item.fileId,
          });
          removeQueuedAiAccept(item);
          continue;
        }
      }

      const flush = await persistAllPendingStashesForSection({
        sectionId: item.sectionId,
        primary,
        onFileDone: fileId => {
          if (fileId) clearedFiles.add(fileId);
        },
      });

      if (flush.saved === 0) {
        if (flush.failed > 0) failed += 1;
        continue;
      }

      const partners = await persistPartnerStashesForFiles({
        fileIds: [...clearedFiles],
        excludeSectionId: item.sectionId,
        onFileDone: fileId => {
          if (fileId) clearedFiles.add(fileId);
        },
      });

      flushed += flush.saved + partners.saved;
      flush.sectionIds.forEach(id => sectionIds.add(id));
      partners.sectionIds.forEach(id => sectionIds.add(id));

      markAiSectionReviewed({
        sectionId: item.sectionId,
        fileId: item.fileId,
      });
      removeQueuedAiAccept(item);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('orderly-ai-queued-accept-flushed', {
            detail: {
              sectionId: item.sectionId,
              fileId: item.fileId,
              fileIds: [...clearedFiles],
            },
          }),
        );
      }
    }

    return {
      flushed,
      failed,
      clearedFiles: [...clearedFiles],
      sectionIds: [...sectionIds],
    };
  })();

  try {
    return await flushInFlight;
  } finally {
    flushInFlight = null;
  }
}
