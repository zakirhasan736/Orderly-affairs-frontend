'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import { cn } from '@common/ui/utils';
import { useIsMobile } from '@/components/MobileBottomSheet';
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
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
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

        const finalMimeType = (
          recorder.mimeType ||
          mimeType ||
          'audio/webm'
        )
          .split(';')[0]
          .trim();

        const blob = new Blob(chunksRef.current, {
          type: finalMimeType || 'audio/webm',
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
      try {
        if (typeof recorder.requestData === 'function') {
          recorder.requestData();
        }
      } catch {
        // ignore
      }
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
    setError('');
    try {
      const success = await onAudioRecorded(recordedBlob);
      if (!success) {
        setError(
          'Upload failed. Your recording is still here — try Save again. If this keeps happening, check your connection and try a shorter clip.',
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Upload failed. Your recording is still here — try Save again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const isMobile = useIsMobile();

  const statusLabel =
    status === 'recording'
      ? 'Recording'
      : status === 'paused'
        ? 'Paused'
        : status === 'stopped'
          ? 'Preview Ready'
          : 'Ready';

  return (
    <Card className="relative w-full rounded-[28px] border border-white/10 bg-white shadow-2xl">
      {(uploading || saving) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[28px] bg-white/90 px-6 text-center backdrop-blur-sm">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-slate-900">
            {uploading ? 'Uploading your audio...' : 'Saving...'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Please keep this screen open.
          </p>
        </div>
      )}

      <CardContent
        className={cn(
          'flex flex-col p-0',
          isMobile ? 'max-h-[94dvh]' : 'max-h-[min(92dvh,900px)]',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 py-4',
            isMobile ? 'px-4' : 'px-4 sm:px-6',
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Mic className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-950 sm:text-lg">
                Audio Recorder
              </h3>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-500 sm:text-sm">
                Record your message, preview it, then save it.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 rounded-full p-0"
            aria-label="Close audio recorder"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain',
            isMobile ? 'px-3 py-3' : 'px-4 py-4 sm:px-6 sm:py-5',
          )}
        >
          <div
            className={cn(
              'grid gap-4',
              !isMobile && 'gap-5 lg:grid-cols-[minmax(0,1fr)_260px]',
            )}
          >
            <div className="space-y-3 sm:space-y-4">
              <div
                className={cn(
                  'relative overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-inner sm:rounded-[28px]',
                  isMobile ? 'min-h-[min(44dvh,380px)]' : 'min-h-[280px]',
                )}
              >
                <div className="flex h-full min-h-[inherit] flex-col items-center justify-center p-5 text-center sm:p-6">
                  <div
                    className={cn(
                      'mb-5 flex items-center justify-center rounded-full transition',
                      isMobile ? 'h-28 w-28' : 'h-24 w-24',
                      status === 'recording'
                        ? 'bg-red-500/10 text-red-600 ring-8 ring-red-500/10'
                        : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    <Mic
                      className={cn(
                        isMobile ? 'h-12 w-12' : 'h-11 w-11',
                        status === 'recording' && 'animate-pulse',
                      )}
                    />
                  </div>

                  <div
                    className={cn(
                      'mb-5 flex items-end justify-center gap-1',
                      isMobile ? 'h-16 w-full max-w-[280px]' : 'h-12',
                    )}
                  >
                    {Array.from({ length: isMobile ? 28 : 22 }).map(
                      (_, index) => (
                        <span
                          key={index}
                          className={cn(
                            'w-1 rounded-full transition',
                            status === 'recording'
                              ? 'animate-pulse bg-red-500'
                              : 'bg-slate-300/70',
                          )}
                          style={{
                            height: `${12 + ((index * 9) % (isMobile ? 44 : 36))}px`,
                            animationDelay: `${index * 60}ms`,
                          }}
                        />
                      ),
                    )}
                  </div>

                  <p className="font-mono text-4xl font-black tracking-tight text-slate-950">
                    {formatTime(elapsedMs)}
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {status === 'recording'
                      ? 'Recording in progress...'
                      : status === 'paused'
                        ? 'Recording paused'
                        : status === 'stopped'
                          ? 'Recording complete'
                          : 'Ready to record'}
                  </p>

                  {status === 'recording' && (
                    <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                      REC {formatTime(elapsedMs)}
                    </div>
                  )}
                </div>
              </div>

              {audioUrl && (
                <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-emerald-950">
                      Preview recording
                    </p>
                    {recordedBlob && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                        {formatBytes(recordedBlob.size)}
                      </span>
                    )}
                  </div>

                  <audio controls src={audioUrl} className="w-full" />
                </div>
              )}

              {error && (
                <div className="flex gap-3 rounded-[22px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:rounded-[28px]">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Recording Status
                </p>

                <h4 className="mt-2 text-xl font-black text-slate-950">
                  {statusLabel}
                </h4>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  {status === 'stopped'
                    ? 'Your recorded audio is ready to preview above.'
                    : 'Use the buttons below to record your personal message.'}
                </p>
              </div>

              <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-500">Duration</p>
                <p className="mt-1 text-3xl font-black text-slate-950">
                  {formatTime(elapsedMs)}
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {(status === 'idle' || status === 'error') && (
                  <Button
                    type="button"
                    onClick={startRecording}
                    className={cn(
                      'h-12 rounded-2xl bg-red-600 text-white hover:bg-red-700',
                      isMobile && 'w-full',
                    )}
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
                      className="h-12 rounded-2xl bg-white"
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={stopRecording}
                      className="h-12 rounded-2xl"
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
                      className="h-12 rounded-2xl"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={stopRecording}
                      className="h-12 rounded-2xl"
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
                      onClick={handleSaveRecording}
                      disabled={uploading || saving}
                      className="h-12 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {uploading || saving ? 'Uploading...' : 'Save Recording'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetRecording}
                      className="h-12 rounded-2xl bg-white"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Record Again
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={resetRecording}
                      className="h-12 rounded-2xl"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Recording
                    </Button>
                  </>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className={cn(
                    'h-11 rounded-2xl text-slate-500 hover:text-slate-900',
                    isMobile && 'w-full',
                  )}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
