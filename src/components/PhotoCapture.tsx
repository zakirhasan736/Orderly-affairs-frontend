'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import { AlertTriangle, Camera, RotateCcw, X } from 'lucide-react';
import { MediaModalPortal } from './MediaModalPortal';
import { blobToPhotoFile } from '@/utils/mediaUpload';

interface PhotoCaptureProps {
  open: boolean;
  uploading?: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File) => void;
}

export function PhotoCapture({
  open,
  uploading = false,
  onClose,
  onPhotoCaptured,
}: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
    'environment',
  );

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCapturedBlob(null);
  };

  const startCamera = async (facing: 'environment' | 'user') => {
    stopStream();
    clearPreview();
    setStatus('loading');
    setError('');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported on this device.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('ready');
    } catch (err) {
      console.error('Camera start failed:', err);
      setStatus('error');
      setError(
        err instanceof Error
          ? err.message
          : 'Could not access the camera. Check permissions and try again.',
      );
    }
  };

  useEffect(() => {
    if (!open) {
      stopStream();
      clearPreview();
      setStatus('loading');
      setError('');
      return;
    }

    void startCamera(facingMode);

    return () => {
      stopStream();
      clearPreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facingMode]);

  if (!open) return null;

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      blob => {
        if (!blob) return;

        stopStream();
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      },
      'image/jpeg',
      0.92,
    );
  };

  const retake = () => {
    clearPreview();
    void startCamera(facingMode);
  };

  const usePhoto = () => {
    if (!capturedBlob) return;
    onPhotoCaptured(blobToPhotoFile(capturedBlob));
  };

  const openFallbackCapture = () => {
    fallbackInputRef.current?.click();
  };

  const handleFallbackChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onPhotoCaptured(file);
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
          ref={fallbackInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFallbackChange}
          className="sr-only"
          tabIndex={-1}
        />

        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Take Photo</h3>
                <p className="text-sm text-muted-foreground">
                  Use your camera, then upload the photo to this message.
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

          <div className="overflow-hidden rounded-2xl border bg-black">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Captured preview"
                className="aspect-[4/3] w-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[4/3] w-full object-cover"
              />
            )}
          </div>

          {status === 'loading' && !previewUrl && (
            <p className="text-center text-sm text-muted-foreground">
              Starting camera...
            </p>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-3">
                <p className="text-sm">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openFallbackCapture}
                  disabled={uploading}
                >
                  Open device camera
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!previewUrl ? (
              <>
                <Button
                  type="button"
                  onClick={capturePhoto}
                  disabled={status !== 'ready' || uploading}
                  className="flex-1 rounded-xl"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFacingMode(current =>
                      current === 'environment' ? 'user' : 'environment',
                    )
                  }
                  disabled={status !== 'ready' || uploading}
                  className="rounded-xl"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Flip
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={retake}
                  disabled={uploading}
                  className="flex-1 rounded-xl"
                >
                  Retake
                </Button>
                <Button
                  type="button"
                  onClick={usePhoto}
                  disabled={uploading}
                  className="flex-1 rounded-xl"
                >
                  Use Photo
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </MediaModalPortal>
  );
}
