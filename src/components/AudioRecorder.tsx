'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import {
  Mic,
  Square,
  Play,
  Pause,
  Download,
  RotateCcw,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';

interface AudioRecorderProps {
  onAudioRecorded: (blob: Blob) => Promise<boolean> | boolean;
  onClose: () => void;
  uploading?: boolean;
}

type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

function getSupportedAudioMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';

  const types = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mpeg',
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

export function AudioRecorder({
  onAudioRecorded,
  onClose,
  uploading = false,
}: AudioRecorderProps) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
  };

  const revokeAudioUrl = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError('');
      setRecordedBlob(null);
      revokeAudioUrl();
      setAudioUrl(null);
      chunksRef.current = [];
      resetTimer();

      if (typeof MediaRecorder === 'undefined') {
        setError('Media recording is not supported in this browser.');
        setStatus('error');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = mediaStream;

      const mimeType = getSupportedAudioMimeType();

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
        stopStream();
        setError('Recording failed. Please try again.');
        setStatus('error');
      };

      recorder.onstop = () => {
        pauseTimer();
        stopStream();

        const finalMimeType = recorder.mimeType || mimeType || 'audio/webm';

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
        setAudioUrl(url);
        setStatus('stopped');
      };

      recorder.start(1000);

      // Important: start timer immediately on the first recording.
      startTimer();
      setStatus('recording');
    } catch (error: any) {
      console.error(error);
      pauseTimer();
      stopStream();

      if (error?.name === 'NotAllowedError') {
        setError('Microphone permission was denied.');
      } else if (error?.name === 'NotFoundError') {
        setError('Microphone was not found.');
      } else {
        setError('Could not start audio recording.');
      }

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
    } else {
      stopStream();
    }
  };

  const resetRecording = () => {
    revokeAudioUrl();
    setAudioUrl(null);
    setRecordedBlob(null);
    chunksRef.current = [];
    resetTimer();
    setError('');
    setStatus('idle');
  };

  const handleSaveRecording = async () => {
    if (!recordedBlob || saving || uploading) return;

    setSaving(true);
    try {
      const success = await onAudioRecorded(recordedBlob);
      if (!success) {
        setError('Upload failed. Your recording is still here — try Save again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border/70 shadow-2xl">
      {(uploading || saving) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-white/90 px-6 text-center backdrop-blur-sm">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-slate-900">
            {uploading ? 'Uploading your audio...' : 'Saving...'}
          </p>
        </div>
      )}

      <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <Mic className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-lg font-semibold">Audio Recorder</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Record your voice, preview it, then attach it.
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

          <div className="rounded-3xl border bg-muted/30 p-4">
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl bg-background p-6 text-center">
              <div
                className={`mb-5 flex h-24 w-24 items-center justify-center rounded-full transition ${
                  status === 'recording'
                    ? 'bg-red-500/10 text-red-600 ring-8 ring-red-500/10'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Mic
                  className={`h-11 w-11 ${
                    status === 'recording' ? 'animate-pulse' : ''
                  }`}
                />
              </div>

              <div className="mb-5 flex h-12 items-end justify-center gap-1">
                {Array.from({ length: 22 }).map((_, index) => (
                  <span
                    key={index}
                    className={`w-1 rounded-full transition ${
                      status === 'recording'
                        ? 'animate-pulse bg-red-500'
                        : 'bg-muted-foreground/25'
                    }`}
                    style={{
                      height: `${10 + ((index * 9) % 36)}px`,
                      animationDelay: `${index * 60}ms`,
                    }}
                  />
                ))}
              </div>

              <p className="font-mono text-4xl font-bold tracking-tight">
                {formatTime(elapsedMs)}
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {status === 'recording'
                  ? 'Recording in progress...'
                  : status === 'paused'
                    ? 'Recording paused'
                    : status === 'stopped'
                      ? 'Recording complete'
                      : 'Ready to record'}
              </p>
            </div>
          </div>

          {audioUrl && (
            <div className="rounded-2xl border bg-background p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Preview recording</p>
                {recordedBlob && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {formatBytes(recordedBlob.size)}
                  </span>
                )}
              </div>

              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}

          {error && (
            <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {(status === 'idle' || status === 'error') && (
              <Button
                type="button"
                onClick={startRecording}
                className="rounded-2xl bg-red-600 text-white hover:bg-red-700"
              >
                <Mic className="mr-2 h-4 w-4" />
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
                  Stop
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
                  Stop
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
                  variant="destructive"
                  onClick={resetRecording}
                  className="rounded-2xl"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Recording
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
  );
}
