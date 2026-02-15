import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import { Video, Square, Play, Pause, Download } from 'lucide-react';

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob) => void;
  onClose: () => void;
}

export function VideoRecorder({ onVideoRecorded, onClose }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Handle permission errors gracefully
      if (error instanceof Error && error.name === 'NotAllowedError') {
        // Permission was denied, but don't show error - user should use file upload instead
        return;
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      chunksRef.current = [];
    };

    recorder.start();
    setIsRecording(true);
    setRecordingTime(0);
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && isRecording) {
      if (isPaused) {
        mediaRecorder.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorder.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveRecording = () => {
    if (recordedBlob) {
      onVideoRecorded(recordedBlob);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                <h3 className="text-lg font-medium">Video Recorder</h3>
              </div>
              <Button variant="ghost" onClick={onClose}>×</Button>
            </div>

            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-64 object-cover"
              />
              
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-2 py-1 rounded text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  REC {formatTime(recordingTime)}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              {!isRecording && !recordedBlob && (
                <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700">
                  <Video className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              )}

              {isRecording && (
                <>
                  <Button onClick={pauseRecording} variant="outline">
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button onClick={stopRecording} variant="destructive">
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                </>
              )}

              {recordedBlob && (
                <div className="flex gap-2">
                  <Button onClick={() => setRecordedBlob(null)} variant="outline">
                    Record Again
                  </Button>
                  <Button onClick={handleSaveRecording} className="bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Save Recording
                  </Button>
                </div>
              )}
            </div>

            {recordedBlob && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground text-center">
                  Recording saved! You can record again or save this recording.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}