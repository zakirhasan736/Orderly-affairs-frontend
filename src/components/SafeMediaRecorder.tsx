'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import { AlertTriangle } from 'lucide-react';
import { VideoRecorder } from './VideoRecorder';
import { AudioRecorder } from './AudioRecorder';
import { MediaModalPortal } from './MediaModalPortal';
import { uploadMessageMedia } from '@/libs/api/lettersOfNaxtKinMessage';
import { blobToMediaFile } from '@/utils/mediaUpload';
import { toast } from 'sonner';

interface SafeMediaRecorderProps {
  type: 'video' | 'audio';
  token?: string | null;
  onUploaded: (media: {
    url: string;
    public_id: string;
    type: string;
    format?: string;
    size?: number;
  }) => void;
  onClose: () => void;
}

export function SafeMediaRecorder({
  type,
  token,
  onUploaded,
  onClose,
}: SafeMediaRecorderProps) {
  const [ready, setReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  const isVideo = type === 'video';
  const mediaLabel = isVideo ? 'Video' : 'Audio';

  const handleRecorded = async (blob: Blob) => {
    if (!token) {
      toast.error('Authentication expired. Please log in again.');
      return false;
    }

    try {
      setUploading(true);

      const file = blobToMediaFile(blob, type);
      const media = await uploadMessageMedia(token, file);

      onUploaded(media);
      toast.success(`${mediaLabel} uploaded successfully`);
      onClose();
      return true;
    } catch (error) {
      console.error(error);
      toast.error(`${mediaLabel} upload failed. Please try again.`);
      return false;
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const prepareRecorder = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          if (!cancelled) setPermissionError(true);
          return;
        }

        const constraints = isVideo
          ? { video: true, audio: true }
          : { audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach(track => track.stop());

        if (cancelled) return;

        setPermissionError(false);
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        setReady(true);
      } catch (error) {
        console.error(error);
        if (!cancelled) setPermissionError(true);
      }
    };

    void prepareRecorder();

    return () => {
      cancelled = true;
    };
  }, [isVideo]);

  if (!token) {
    return (
      <ModalShell>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div>
          <h3 className="text-lg font-semibold">Authentication expired</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please log in again before recording media.
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </ModalShell>
    );
  }

  if (permissionError) {
    return (
      <ModalShell>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-700">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div>
          <h3 className="text-lg font-semibold">Recording permission blocked</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please allow {isVideo ? 'camera and microphone' : 'microphone'}{' '}
            access in your browser settings, then try again.
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </ModalShell>
    );
  }

  if (!ready) {
    return (
      <ModalShell>
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-semibold text-slate-900">
          Opening {mediaLabel.toLowerCase()} recorder...
        </p>
      </ModalShell>
    );
  }

  return (
    <MediaModalPortal>
      {isVideo ? (
        <VideoRecorder
          onVideoRecorded={handleRecorded}
          onClose={onClose}
          uploading={uploading}
        />
      ) : (
        <AudioRecorder
          onAudioRecorded={handleRecorded}
          onClose={onClose}
          uploading={uploading}
        />
      )}
    </MediaModalPortal>
  );
}

function ModalShell({
  children,
  wide = false,
  uploading = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
  uploading?: boolean;
}) {
  return (
    <MediaModalPortal>
      <Card
        className={`relative w-full overflow-hidden rounded-3xl border border-border/70 shadow-2xl ${
          wide ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        {uploading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 px-6 text-center backdrop-blur-sm">
            <div className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-semibold text-slate-900">Uploading...</p>
          </div>
        )}
        <CardContent className="space-y-5 p-5 text-center sm:p-6">
          {children}
        </CardContent>
      </Card>
    </MediaModalPortal>
  );
}
