import { useEffect } from 'react';
import type { UploadedAIFile } from '@/utils/aiDocumentUploadUi';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';

type RestoreArgs = {
  sectionId: string;
  setUploadedFiles: React.Dispatch<
    React.SetStateAction<Record<string, UploadedAIFile | null>>
  >;
  latestUploadRef: React.MutableRefObject<Record<string, UploadedAIFile>>;
};

export function resolveAiUploadedFileForScope(
  scope: string,
  uploadedFiles: Record<string, UploadedAIFile | null>,
  latestUploadRef: React.MutableRefObject<Record<string, UploadedAIFile>>,
  pendingFile?: UploadedAIFile | null,
) {
  if (pendingFile) {
    return pendingFile;
  }

  return latestUploadRef.current[String(scope)] ?? uploadedFiles[scope] ?? null;
}

export function useAiUploadedFileResolver(sectionId: string, scope: string) {
  const routing = useOptionalAiDocumentRouting();
  const pendingFile =
    routing?.getPendingFileForSection(sectionId, scope) ?? null;
  const highlightUpload =
    routing?.shouldHighlightUpload(sectionId, scope) ?? false;

  return {
    pendingFile,
    highlightUpload,
    clearPendingForSection: routing?.clearPendingForSection,
    clearAllPendingForFile: routing?.clearAllPendingForFile,
    dismissHighlight: routing?.dismissHighlight,
  };
}

export function useRestoreAiPendingUploadForSection({
  sectionId,
  setUploadedFiles,
  latestUploadRef,
}: RestoreArgs) {
  const routing = useOptionalAiDocumentRouting();
  const pendingUploads = routing?.getPendingUploadsForSection(sectionId) ?? [];

  useEffect(() => {
    const activeUploads = pendingUploads.filter(upload => upload.highlightUpload);

    activeUploads.forEach(pendingUpload => {
      const scope = pendingUpload.uploadScope || 'full';
      const pendingFile = {
        file_id: pendingUpload.file_id,
        mime_type: pendingUpload.mime_type,
        expires_at: pendingUpload.expires_at,
      };

      latestUploadRef.current[String(scope)] = pendingFile;
      setUploadedFiles(prev => ({
        ...prev,
        [scope]: pendingFile,
      }));
    });

    if (activeUploads.length) {
      window.dispatchEvent(
        new CustomEvent('orderly-ai-pending-restored', {
          detail: { sectionId },
        }),
      );
    }
  }, [pendingUploads, sectionId, setUploadedFiles, latestUploadRef]);

  useEffect(() => {
    const handleConsumed = (event: Event) => {
      const detail = (event as CustomEvent<{
        sectionId?: string;
        uploadScope?: string;
        fileId?: string;
      }>).detail;

      if (!detail?.fileId) return;

      const scopesToClear = Object.keys(latestUploadRef.current).filter(scope => {
        const file = latestUploadRef.current[String(scope)];
        return file?.file_id === detail.fileId;
      });

      if (!scopesToClear.length) return;

      scopesToClear.forEach(scope => {
        delete latestUploadRef.current[String(scope)];
        setUploadedFiles(prev => ({
          ...prev,
          [scope]: null,
        }));
      });
    };

    window.addEventListener('orderly-ai-document-consumed', handleConsumed);
    return () => {
      window.removeEventListener('orderly-ai-document-consumed', handleConsumed);
    };
  }, [setUploadedFiles, latestUploadRef]);
}
