'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import {
  Camera,
  ChevronLeft,
  FolderOpen,
  Images,
  Mic,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { MediaModalPortal } from './MediaModalPortal';

interface MediaMessagePickerProps {
  type: 'video' | 'audio';
  open: boolean;
  uploading?: boolean;
  onClose: () => void;
  onRecord: () => void;
  onTakePhoto?: () => void;
  onFileSelected: (file: File) => void;
}

const VIDEO_ACCEPT = 'video/*';
const VIDEO_LIBRARY_ACCEPT = 'video/*,image/*';
const AUDIO_ACCEPT =
  'audio/*,audio/mpeg,audio/mp4,audio/wav,audio/x-m4a,audio/aac';

export function MediaMessagePicker({
  type,
  open,
  uploading = false,
  onClose,
  onRecord,
  onTakePhoto,
  onFileSelected,
}: MediaMessagePickerProps) {
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const libraryInputId = useId();
  const fileInputId = useId();
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideo = type === 'video';
  const mediaLabel = isVideo ? 'Video' : 'Audio';
  const accept = isVideo ? VIDEO_ACCEPT : AUDIO_ACCEPT;
  const libraryAccept = isVideo ? VIDEO_LIBRARY_ACCEPT : AUDIO_ACCEPT;

  useEffect(() => {
    if (!open) setShowSourceMenu(false);
  }, [open]);

  if (!open) return null;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (file) onFileSelected(file);
  };

  const openLibraryPicker = () => {
    libraryInputRef.current?.click();
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const startPhotoCapture = () => {
    if (onTakePhoto) {
      onClose();
      onTakePhoto();
      return;
    }

    openLibraryPicker();
  };

  const startRecording = () => {
    onClose();
    onRecord();
  };

  return (
    <MediaModalPortal onBackdropClick={uploading ? undefined : onClose}>
      <Card className="relative w-full overflow-hidden rounded-3xl border border-border/70 shadow-2xl">
        {uploading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 px-6 text-center backdrop-blur-sm">
            <div className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-semibold text-slate-900">Uploading...</p>
          </div>
        )}

        <input
          id={libraryInputId}
          ref={libraryInputRef}
          type="file"
          accept={libraryAccept}
          onChange={handleInputChange}
          className="sr-only"
          tabIndex={-1}
        />
        <input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="sr-only"
          tabIndex={-1}
        />

        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {showSourceMenu && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSourceMenu(false)}
                  disabled={uploading}
                  className="mr-1 rounded-full px-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  isVideo
                    ? 'bg-red-500/10 text-red-600'
                    : 'bg-blue-500/10 text-blue-600'
                }`}
              >
                {isVideo ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
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
              disabled={uploading}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {!showSourceMenu ? (
            <button
              type="button"
              onClick={() => setShowSourceMenu(true)}
              disabled={uploading}
              className={`w-full rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 ${
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
                <Upload className="h-6 w-6" />
              </div>

              <p className="font-semibold">
                {isVideo ? 'Upload Video' : 'Upload Audio'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isVideo
                  ? 'Record video, take a photo, pick from your gallery, or choose a file.'
                  : 'Record audio, pick from your gallery, or choose a file.'}
              </p>
            </button>
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-slate-950 text-white shadow-lg">
              <SourceOption
                icon={isVideo ? <Video className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                label={isVideo ? 'Record Video' : 'Record Audio'}
                onClick={startRecording}
              />
              {isVideo && (
                <SourceOption
                  icon={<Camera className="h-5 w-5" />}
                  label="Take Photo"
                  onClick={startPhotoCapture}
                />
              )}
              <SourceOption
                icon={<Images className="h-5 w-5" />}
                label="Photo Library"
                onClick={openLibraryPicker}
              />
              <SourceOption
                icon={<FolderOpen className="h-5 w-5" />}
                label="Choose File"
                onClick={openFilePicker}
                isLast
              />
            </div>
          )}
        </CardContent>
      </Card>
    </MediaModalPortal>
  );
}

function SourceOption({
  icon,
  label,
  onClick,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isLast?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-4 text-left text-[17px] font-normal transition hover:bg-white/10 active:bg-white/15 ${
        isLast ? '' : 'border-b border-white/10'
      }`}
    >
      <span className="flex h-6 w-6 items-center justify-center text-white">
        {icon}
      </span>
      {label}
    </button>
  );
}
