import { useEffect } from 'react';
import {
  mergeAiUploadMeta,
  type UploadedAIFile,
} from '@/utils/aiDocumentUploadUi';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { isAiAutofillDoneForSection } from '@/utils/aiAutofillDoneSections';

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
    return mergeAiUploadMeta(pendingFile);
  }

  const local =
    latestUploadRef.current[String(scope)] ?? uploadedFiles[scope] ?? null;
  return local ? mergeAiUploadMeta(local) : null;
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
    // Restore each open document that has not filled this section yet.
    // Do not bail when a *different* document already filled the section —
    // multi-vehicle / multi-policy uploads need every sibling restored.
    const activeUploads = pendingUploads.filter(upload => {
      if (!upload.highlightUpload) return false;
      if (isAiAutofillDoneForSection(sectionId, upload.file_id)) return false;
      return true;
    });

    activeUploads.forEach(pendingUpload => {
      const scope = pendingUpload.uploadScope || 'full';
      const pendingFile = mergeAiUploadMeta({
        file_id: pendingUpload.file_id,
        mime_type: pendingUpload.mime_type,
        expires_at: pendingUpload.expires_at,
        file_name: pendingUpload.file_name,
        uploaded_at: pendingUpload.uploaded_at || pendingUpload.createdAt,
      });

      latestUploadRef.current[String(scope)] = pendingFile;

      // Pattern-B sections use scopes like "21A-full". Mirror the dashboard
      // "full" pending file so Auto-fill can find it immediately.
      const mirroredScopes = new Set<string>([String(scope)]);
      if (scope === 'full' && pendingUpload.targetSubsection) {
        mirroredScopes.add(`${pendingUpload.targetSubsection}-full`);
      }

      mirroredScopes.forEach(key => {
        latestUploadRef.current[key] = pendingFile;
      });

      setUploadedFiles(prev => {
        const next = { ...prev, [scope]: pendingFile };
        mirroredScopes.forEach(key => {
          next[key] = pendingFile;
        });
        return next;
      });
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
