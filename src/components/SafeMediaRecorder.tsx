'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import {
  AlertTriangle,
  Upload,
  Video,
  Mic,
  X,
  FileUp,
} from 'lucide-react';
import { VideoRecorder } from './VideoRecorder';
import { AudioRecorder } from './AudioRecorder';
import { MediaModalPortal } from './MediaModalPortal';
import { uploadMessageMedia } from '@/libs/api/lettersOfNaxtKinMessage';
import { blobToMediaFile, isAllowedMediaFile } from '@/utils/mediaUpload';
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
  const [showRecorder, setShowRecorder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isVideo = type === 'video';
  const Icon = isVideo ? Video : Mic;

  const acceptType = isVideo ? 'video/*' : 'audio/*';
  const mediaLabel = isVideo ? 'Video' : 'Audio';

  const validateFile = (file: File) => {
    if (!isAllowedMediaFile(file, type)) {
      toast.error(`Please upload a valid ${type} file.`);
      return false;
    }

    const maxSize = 250 * 1024 * 1024; // 250MB safety guard

    if (file.size > maxSize) {
      toast.error('File is too large. Please upload a smaller file.');
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    if (!token) {
      toast.error('Authentication expired. Please log in again.');
      return;
    }

    if (!validateFile(file)) return;

    try {
      setUploading(true);

      const media = await uploadMessageMedia(token, file);

      onUploaded(media);
      toast.success(`${mediaLabel} uploaded successfully`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(`${mediaLabel} upload failed`);
      return false;
    } finally {
      setUploading(false);
    }

    return true;
  };

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

  const startRecorder = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermissionError(true);
        return;
      }

      const constraints = isVideo
        ? { video: true, audio: true }
        : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      stream.getTracks().forEach(track => track.stop());

      setPermissionError(false);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      setShowRecorder(true);
    } catch (error) {
      console.error(error);
      setPermissionError(true);
    }
  };

  const handleFileInput = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    await uploadFile(file);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    await uploadFile(file);
  };

  if (!token) {
    return (
      <ModalShell>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div>
          <h3 className="text-lg font-semibold">Authentication expired</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please log in again before recording or uploading media.
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </ModalShell>
    );
  }

  if (showRecorder) {
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

  return (
    <ModalShell wide uploading={uploading}>
      <div className="flex items-start justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              isVideo
                ? 'bg-red-500/10 text-red-600'
                : 'bg-blue-500/10 text-blue-600'
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="text-left">
            <h3 className="text-lg font-semibold">{mediaLabel} Message</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Record a new message or upload an existing {type} file.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {permissionError && (
        <div className="flex gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-left text-sm text-yellow-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Recording permission blocked</p>
            <p className="mt-1">
              Please allow browser access or upload a file instead.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={startRecorder}
          className={`group rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
            isVideo
              ? 'border-red-200 bg-red-50/60 hover:bg-red-50'
              : 'border-blue-200 bg-blue-50/60 hover:bg-blue-50'
          }`}
        >
          <div
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
              isVideo ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <p className="font-semibold">Record {mediaLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your {isVideo ? 'camera and microphone' : 'microphone'} to
            create a new message.
          </p>
        </button>

        <div
          onDragOver={event => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`rounded-3xl border border-dashed p-5 text-center transition ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/30 hover:bg-muted/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptType}
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-muted-foreground shadow-sm">
            <FileUp className="h-6 w-6" />
          </div>

          <p className="font-semibold">Upload {mediaLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag and drop here, or choose a file from your device.
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 rounded-2xl"
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose File
          </Button>
        </div>
      </div>
    </ModalShell>
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
