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
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Camera,
} from 'lucide-react';

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob) => Promise<boolean> | boolean;
  onClose: () => void;
  uploading?: boolean;
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
    'video/mp4',
    'video/mp4;codecs=avc1,mp4a',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
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
  uploading = false,
}: VideoRecorderProps) {
  const [status, setStatus] = useState<RecorderStatus>('loading');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement | null>(null);

  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef(0);

  const previewUrlRef = useRef<string | null>(null);

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

  const revokePreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  };

  const attachLiveStream = async (
    videoEl: HTMLVideoElement,
    mediaStream: MediaStream,
  ) => {
    videoEl.setAttribute('playsinline', 'true');
    videoEl.setAttribute('webkit-playsinline', 'true');
    videoEl.setAttribute('autoplay', 'true');
    videoEl.setAttribute('muted', 'true');
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.autoplay = true;
    videoEl.srcObject = mediaStream;

    await new Promise<void>(resolve => {
      const handleReady = () => {
        videoEl.removeEventListener('loadedmetadata', handleReady);
        resolve();
      };

      if (videoEl.readyState >= 1) {
        resolve();
        return;
      }

      videoEl.addEventListener('loadedmetadata', handleReady);
    });

    try {
      await videoEl.play();
    } catch {
      // iOS may block until user gesture; preview usually still works after play().
    }
  };

  const cleanupRecorder = () => {
    try {
      const recorder = recorderRef.current;

      if (
        recorder &&
        (recorder.state === 'recording' || recorder.state === 'paused')
      ) {
        recorder.stop();
      }
    } catch {
      // ignore cleanup errors
    }

    recorderRef.current = null;
  };

  const cleanupAll = () => {
    clearTimer();
    cleanupRecorder();
    stopStream();
    revokePreviewUrl();
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

      if (liveVideoRef.current) {
        await attachLiveStream(liveVideoRef.current, mediaStream);
      }

      setStatus('idle');
    } catch (err: any) {
      console.error(err);

      if (err?.name === 'NotAllowedError') {
        setError('Camera or microphone permission was denied.');
      } else if (err?.name === 'NotFoundError') {
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
      cleanupAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const videoEl = liveVideoRef.current;
    const stream = streamRef.current;

    if (!videoEl || !stream || previewUrl || recordedBlob) return;

    void attachLiveStream(videoEl, stream);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, previewUrl, recordedBlob]);

  useEffect(() => {
    if (!previewUrl || !recordedVideoRef.current) return;

    const videoEl = recordedVideoRef.current;

    videoEl.load();
    videoEl.currentTime = 0;

    // Let the browser show the first frame. Autoplay may be blocked, so controls remain visible.
    videoEl.play().catch(() => {});
  }, [previewUrl]);

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
      setPreviewUrl(null);
      revokePreviewUrl();
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
        previewUrlRef.current = url;

        setRecordedBlob(blob);
        setPreviewUrl(url);
        setStatus('stopped');

        // Stop camera after recording so the preview area focuses on the saved video.
        stopStream();
      };

      recorder.start(1000);

      startTimer();
      setStatus('recording');
    } catch (err) {
      console.error(err);
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
    recorderRef.current = null;
    resetTimer();
    setError('');

    await startCamera();
  };

  const handleSaveRecording = async () => {
    if (!recordedBlob || saving || uploading) return;

    setSaving(true);
    try {
      const success = await onVideoRecorded(recordedBlob);
      if (!success) {
        setError('Upload failed. Your recording is still here — try Save again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    cleanupAll();
    onClose();
  };

  const isRecordedPreview = Boolean(previewUrl && recordedBlob);

  return (
    <Card className="relative w-full rounded-[28px] border border-white/10 bg-white shadow-2xl">
      {(uploading || saving) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[28px] bg-white/90 px-6 text-center backdrop-blur-sm">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-slate-900">
            {uploading ? 'Uploading your video...' : 'Saving...'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Please keep this screen open.
          </p>
        </div>
      )}

      <CardContent className="flex max-h-[min(92dvh,900px)] flex-col p-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Video className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-950 sm:text-lg">
                  Video Recorder
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
              onClick={handleClose}
              className="h-10 w-10 rounded-full p-0"
              aria-label="Close video recorder"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              {/* Video Preview Area */}
              <div className="space-y-4">
                <div className="relative rounded-[28px] bg-black shadow-xl">
                  {isRecordedPreview ? (
                    <video
                      key={previewUrl}
                      ref={recordedVideoRef}
                      controls
                      playsInline
                      preload="metadata"
                      src={previewUrl || undefined}
                      className="aspect-video w-full bg-black object-contain"
                      style={{ WebkitTransform: 'translateZ(0)' }}
                    />
                  ) : (
                    <video
                      ref={liveVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="aspect-video w-full bg-black object-contain"
                      style={{ WebkitTransform: 'translateZ(0)' }}
                    />
                  )}

                  {/* Top status badge */}
                  <div className="absolute left-4 top-4">
                    {isRecordedPreview ? (
                      <div className="flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                        <CheckCircle2 className="h-4 w-4" />
                        RECORDED PREVIEW
                      </div>
                    ) : status === 'recording' || status === 'paused' ? (
                      <div className="flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                        {status === 'paused' ? 'PAUSED' : 'REC'}{' '}
                        {formatTime(elapsedMs)}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-lg backdrop-blur">
                        <Camera className="h-4 w-4" />
                        LIVE CAMERA
                      </div>
                    )}
                  </div>

                  {status === 'loading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
                      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <p className="text-sm font-semibold">
                        Starting camera...
                      </p>
                    </div>
                  )}
                </div>

                {isRecordedPreview && recordedBlob && (
                  <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-sm font-black text-emerald-950">
                            Recorded video is ready to preview
                          </p>
                          <p className="mt-1 text-xs font-medium leading-5 text-emerald-700">
                            Watch the video above. If it looks good, click Save
                            Recording.
                          </p>
                        </div>
                      </div>

                      <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                        {formatBytes(recordedBlob.size)}
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex gap-3 rounded-[22px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </div>

              {/* Side Controls */}
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Recording Status
                  </p>

                  <h4 className="mt-2 text-xl font-black text-slate-950">
                    {isRecordedPreview
                      ? 'Preview Ready'
                      : status === 'recording'
                        ? 'Recording'
                        : status === 'paused'
                          ? 'Paused'
                          : status === 'loading'
                            ? 'Loading'
                            : 'Ready'}
                  </h4>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    {isRecordedPreview
                      ? 'Your recorded video is showing in the preview area.'
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
                  {(status === 'idle' || status === 'error') &&
                    !recordedBlob && (
                      <Button
                        type="button"
                        onClick={startRecording}
                        className="h-12 rounded-2xl bg-red-600 text-white hover:bg-red-700"
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
                    onClick={handleClose}
                    className="h-11 rounded-2xl text-slate-500 hover:text-slate-900"
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
