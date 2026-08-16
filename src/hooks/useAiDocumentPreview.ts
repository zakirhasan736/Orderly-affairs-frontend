import { useEffect, useState } from 'react';
import { fetchAiDocumentPreviewBlobCached } from '@/utils/aiDocumentPreviewCache';
import {
  resolveAiPreviewKind,
  resolveAiPreviewMime,
  type AiPreviewKind,
} from '@/utils/aiPreviewKind';

export function useAiDocumentPreview(
  fileId?: string | null,
  fileName?: string | null,
  mimeHint?: string | null,
  active = true,
) {
  const [loading, setLoading] = useState(Boolean(active && fileId));
  const [error, setError] = useState('');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [kind, setKind] = useState<AiPreviewKind>('other');

  useEffect(() => {
    if (!active || !fileId) {
      setLoading(false);
      setError('');
      setTextContent(null);
      setPdfBytes(null);
      setKind('other');
      setObjectUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;

    const load = async () => {
      setLoading(true);
      setError('');
      setTextContent(null);
      setPdfBytes(null);
      setKind('other');
      setObjectUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });

      try {
        const { blob, mimeType: fetchedMime, fileName: fetchedName } =
          await fetchAiDocumentPreviewBlobCached(fileId);
        if (cancelled) return;

        const buffer = await blob.arrayBuffer();
        if (cancelled) return;

        const titleHint = fileName || fetchedName || '';
        const mime = resolveAiPreviewMime({
          contentType: fetchedMime,
          blobType: blob.type,
          fileName: titleHint,
          fallbackMime: mimeHint,
          bytes: buffer,
        });
        const nextKind = resolveAiPreviewKind({
          mime,
          fileName: titleHint,
          bytes: buffer,
        });
        setKind(nextKind);

        if (nextKind === 'text') {
          const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
          if (!cancelled) setTextContent(text || '(Empty text file)');
          return;
        }

        const typed = new Blob([buffer], {
          type:
            nextKind === 'pdf'
              ? 'application/pdf'
              : mime || 'application/octet-stream',
        });
        createdUrl = URL.createObjectURL(typed);
        if (!cancelled) {
          if (nextKind === 'pdf') setPdfBytes(new Uint8Array(buffer));
          setObjectUrl(createdUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Could not open this document.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [active, fileId, fileName, mimeHint]);

  return { loading, error, objectUrl, pdfBytes, textContent, kind };
}
