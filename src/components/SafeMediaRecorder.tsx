'use client';

import React, { useState } from 'react';
import { VideoRecorder } from './VideoRecorder';
import { AudioRecorder } from './AudioRecorder';
import { MediaModalPortal } from './MediaModalPortal';
import {
  uploadMessageMedia,
  type MessageMediaUploadResult,
} from '@/libs/api/lettersOfNaxtKinMessage';
import { blobToMediaFile, validateMessageMediaSize } from '@/utils/mediaUpload';
import { toast } from 'sonner';

interface SafeMediaRecorderProps {
  type: 'video' | 'audio';
  onUploaded: (
    media: MessageMediaUploadResult,
  ) => void | Promise<void>;
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

      if (!blob.size) {
        throw new Error(
          'Recording is empty. Please record again, then save.',
        );
      }

      setUploading(true);

      const file = blobToMediaFile(blob, type);
      const media = await uploadMessageMedia(file, type);

      await onUploaded(media);
      onClose();
      return true;
    } catch (error) {
      console.error(`${mediaLabel} upload failed:`, error);
      const message =
        error instanceof Error
          ? error.message
          : `Could not save ${mediaLabel.toLowerCase()}. Please try again.`;
      toast.error(message);
      throw error instanceof Error
        ? error
        : new Error(message);
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
