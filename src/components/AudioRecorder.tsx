import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import { Mic, Square, Play, Pause, Download } from 'lucide-react';

interface AudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onClose: () => void;
}

export function AudioRecorder({ onAudioRecorded, onClose }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [stream, audioUrl]);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);

      chunksRef.current = [];
      const recorder = new MediaRecorder(mediaStream);
      setMediaRecorder(recorder);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        chunksRef.current = [];
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      // Handle permission errors gracefully
      if (error instanceof Error && error.name === 'NotAllowedError') {
        // Permission was denied, but don't show error - user should use file upload instead
        return;
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
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
      onAudioRecorded(recordedBlob);
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setRecordedBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                <h3 className="text-lg font-medium">Audio Recorder</h3>
              </div>
              <Button variant="ghost" onClick={onClose}>×</Button>
            </div>

            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Mic className={`w-12 h-12 ${isRecording ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
              </div>
              
              {isRecording && (
                <div className="flex items-center justify-center gap-2 text-red-600 font-medium">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  Recording {formatTime(recordingTime)}
                </div>
              )}
              
              {!isRecording && recordingTime > 0 && (
                <div className="text-muted-foreground">
                  Recorded: {formatTime(recordingTime)}
                </div>
              )}
            </div>

            {audioUrl && (
              <div className="bg-muted rounded-lg p-4">
                <audio ref={audioRef} controls className="w-full">
                  <source src={audioUrl} type="audio/webm" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              {!isRecording && !recordedBlob && (
                <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700">
                  <Mic className="w-4 h-4 mr-2" />
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
                    Stop
                  </Button>
                </>
              )}

              {recordedBlob && (
                <div className="flex gap-2">
                  <Button onClick={resetRecording} variant="outline">
                    Record Again
                  </Button>
                  <Button onClick={handleSaveRecording} className="bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Save Recording
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}