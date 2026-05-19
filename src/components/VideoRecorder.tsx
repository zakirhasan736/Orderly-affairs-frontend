'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import {
  Video,
  Square,
  Play,
  Pause,
  Download,
  RotateCcw,
  X,
  AlertTriangle,
} from 'lucide-react';

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob) => void;
  onClose: () => void;
}

type RecorderStatus =
  | 'loading'
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'error';

function getSupportedVideoMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';

  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];

  return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
}

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
}

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function VideoRecorder({
  onVideoRecorded,
  onClose,
}: VideoRecorderProps) {
  const [status, setStatus] = useState<RecorderStatus>('loading');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();

    startedAtRef.current = Date.now();

    const tick = () => {
      const startedAt = startedAtRef.current;
      const running = startedAt ? Date.now() - startedAt : 0;
      setElapsedMs(elapsedBeforePauseRef.current + running);
    };

    tick();
    timerRef.current = window.setInterval(tick, 250);
  };

  const pauseTimer = () => {
    if (startedAtRef.current) {
      elapsedBeforePauseRef.current += Date.now() - startedAtRef.current;
    }

    startedAtRef.current = null;
    clearTimer();
    setElapsedMs(elapsedBeforePauseRef.current);
  };

  const resetTimer = () => {
    clearTimer();
    startedAtRef.current = null;
    elapsedBeforePauseRef.current = 0;
    setElapsedMs(0);
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const revokePreviewUrl = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const startCamera = async () => {
    try {
      setError('');
      setStatus('loading');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      setStatus('idle');
    } catch (error: any) {
      console.error(error);

      if (error?.name === 'NotAllowedError') {
        setError('Camera or microphone permission was denied.');
      } else if (error?.name === 'NotFoundError') {
        setError('Camera or microphone was not found.');
      } else {
        setError('Could not start camera.');
      }

      setStatus('error');
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      clearTimer();
      stopStream();

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const startRecording = () => {
    try {
      const mediaStream = streamRef.current;

      if (!mediaStream) {
        setError('Camera is not ready yet.');
        return;
      }

      if (typeof MediaRecorder === 'undefined') {
        setError('Media recording is not supported in this browser.');
        setStatus('error');
        return;
      }

      setError('');
      setRecordedBlob(null);
      revokePreviewUrl();
      setPreviewUrl(null);
      chunksRef.current = [];
      resetTimer();

      const mimeType = getSupportedVideoMimeType();

      const recorder = new MediaRecorder(
        mediaStream,
        mimeType ? { mimeType } : undefined,
      );

      recorderRef.current = recorder;

      recorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        pauseTimer();
        setError('Recording failed. Please try again.');
        setStatus('error');
      };

      recorder.onstop = () => {
        pauseTimer();

        const finalMimeType = recorder.mimeType || mimeType || 'video/webm';

        const blob = new Blob(chunksRef.current, {
          type: finalMimeType,
        });

        chunksRef.current = [];

        if (!blob.size) {
          setError('Recording is empty. Please try again.');
          setStatus('error');
          return;
        }

        const url = URL.createObjectURL(blob);

        setRecordedBlob(blob);
        setPreviewUrl(url);
        setStatus('stopped');
      };

      recorder.start(1000);

      // Important: start timer immediately on the first recording.
      startTimer();
      setStatus('recording');
    } catch (error) {
      console.error(error);
      pauseTimer();
      setError('Could not start video recording.');
      setStatus('error');
    }
  };

  const pauseRecording = () => {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state !== 'recording') return;

    recorder.pause();
    pauseTimer();
    setStatus('paused');
  };

  const resumeRecording = () => {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state !== 'paused') return;

    recorder.resume();
    startTimer();
    setStatus('recording');
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;

    if (!recorder) return;

    if (recorder.state === 'recording') {
      pauseTimer();
    }

    if (recorder.state === 'recording' || recorder.state === 'paused') {
      recorder.stop();
    }
  };

  const resetRecording = async () => {
    revokePreviewUrl();
    setPreviewUrl(null);
    setRecordedBlob(null);
    chunksRef.current = [];
    resetTimer();
    setError('');

    if (!streamRef.current) {
      await startCamera();
      return;
    }

    setStatus('idle');
  };

  const handleSaveRecording = () => {
    if (recordedBlob) {
      onVideoRecorded(recordedBlob);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border/70 shadow-2xl">
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
                <Video className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-lg font-semibold">Video Recorder</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Record your video, preview it, then attach it.
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

          <div className="relative overflow-hidden rounded-3xl bg-black">
            {previewUrl ? (
              <video
                controls
                src={previewUrl}
                className="aspect-video w-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="aspect-video w-full object-cover"
              />
            )}

            {(status === 'recording' || status === 'paused') && (
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                {status === 'paused' ? 'PAUSED' : 'REC'} {formatTime(elapsedMs)}
              </div>
            )}

            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                Starting camera...
              </div>
            )}
          </div>

          {recordedBlob && (
            <div className="rounded-2xl border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Preview recording</p>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {formatBytes(recordedBlob.size)}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {(status === 'idle' || status === 'error') && !recordedBlob && (
              <Button
                type="button"
                onClick={startRecording}
                className="rounded-2xl bg-red-600 text-white hover:bg-red-700"
              >
                <Video className="mr-2 h-4 w-4" />
                Start Recording
              </Button>
            )}

            {status === 'recording' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={pauseRecording}
                  className="rounded-2xl"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={stopRecording}
                  className="rounded-2xl"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Recording
                </Button>
              </>
            )}

            {status === 'paused' && (
              <>
                <Button
                  type="button"
                  onClick={resumeRecording}
                  className="rounded-2xl"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={stopRecording}
                  className="rounded-2xl"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Recording
                </Button>
              </>
            )}

            {status === 'stopped' && recordedBlob && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetRecording}
                  className="rounded-2xl"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Record Again
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveRecording}
                  className="rounded-2xl bg-green-600 text-white hover:bg-green-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Save Recording
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
