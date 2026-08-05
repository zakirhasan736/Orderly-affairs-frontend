import { fetchAiDocumentPreviewBlob } from '@/services/aiDocumentUpload';

type PreviewPayload = {
  blob: Blob;
  mimeType: string;
  fileName?: string;
};

const inflight = new Map<string, Promise<PreviewPayload>>();
const resolved = new Map<string, PreviewPayload>();

/**
 * Deduped preview GETs so history cards and the click dialog share one fetch.
 */
export function fetchAiDocumentPreviewBlobCached(
  fileId: string,
): Promise<PreviewPayload> {
  const id = String(fileId || '').trim();
  if (!id) {
    return Promise.reject(new Error('Missing document id'));
  }

  const hit = resolved.get(id);
  if (hit) return Promise.resolve(hit);

  const pending = inflight.get(id);
  if (pending) return pending;

  const request = fetchAiDocumentPreviewBlob(id)
    .then(payload => {
      resolved.set(id, payload);
      inflight.delete(id);
      return payload;
    })
    .catch(error => {
      inflight.delete(id);
      throw error;
    });

  inflight.set(id, request);
  return request;
}

export function invalidateAiDocumentPreviewCache(fileId?: string) {
  if (!fileId) {
    inflight.clear();
    resolved.clear();
    return;
  }
  const id = String(fileId).trim();
  inflight.delete(id);
  resolved.delete(id);
}
