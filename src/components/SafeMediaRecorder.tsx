'use client';

import React, { useState } from 'react';
import { VideoRecorder } from './VideoRecorder';
import { AudioRecorder } from './AudioRecorder';
import { MediaModalPortal } from './MediaModalPortal';
import { uploadMessageMedia } from '@/libs/api/lettersOfNaxtKinMessage';
import { blobToMediaFile, validateMessageMediaSize } from '@/utils/mediaUpload';
import { toast } from 'sonner';

interface SafeMediaRecorderProps {
  type: 'video' | 'audio';
  onUploaded: (media: {
    url: string;
    public_id: string;
    type: string;
    format?: string;
    size?: number;
  }) => void;
  onClose: () => void;
}

/**
 * Opens the video/audio recorder directly.
 * Permission checks happen inside the recorder (user-gesture friendly).
 * Do not pre-call getUserMedia here — that double-request races on Chrome
 * and surfaces a false "permission blocked" dialog.
 */
export function SafeMediaRecorder({
  type,
  onUploaded,
  onClose,
}: SafeMediaRecorderProps) {
  const [uploading, setUploading] = useState(false);

  const isVideo = type === 'video';
  const mediaLabel = isVideo ? 'Video' : 'Audio';

  const handleRecorded = async (blob: Blob) => {
    try {
      validateMessageMediaSize(blob.size);

      setUploading(true);

      const file = blobToMediaFile(blob, type);
      const media = await uploadMessageMedia(file);

      onUploaded(media);
      toast.success(`${mediaLabel} saved`);
      onClose();
      return true;
    } catch (error) {
      console.error(`${mediaLabel} upload failed:`, error);
      throw error instanceof Error
        ? error
        : new Error(`${mediaLabel} upload failed. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

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
