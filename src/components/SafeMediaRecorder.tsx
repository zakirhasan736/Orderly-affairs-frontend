import React, { useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent } from '@common/ui/card';
import { AlertTriangle, Upload, Video, Mic, Loader2 } from 'lucide-react';
import { VideoRecorder } from './VideoRecorder';
import { AudioRecorder } from './AudioRecorder';
import {
  uploadMessageMedia,
} from '@/libs/api/lettersOfNaxtKinMessage';
import { toast } from 'sonner';

interface SafeMediaRecorderProps {
  type: 'video' | 'audio';
  token?: string;
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
  const [permissionError, setPermissionError] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (uploading) return null;
  if (!token) {
    toast.error('Authentication expired');
    return;
  }

  /* -------------------------------------------------- */
  /* PERMISSION CHECK                                  */
  /* -------------------------------------------------- */
  const checkPermissionsAndStart = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermissionError(true);
        return;
      }

      const constraints =
        type === 'video' ? { video: true, audio: true } : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop());
      setShowRecorder(true);
    } catch {
      setPermissionError(true);
    }
  };

  /* -------------------------------------------------- */
  /* HANDLE RECORDED MEDIA                              */
  /* -------------------------------------------------- */
const handleRecorded = async (blob: Blob) => {
  if (!token) return;

  try {
    setUploading(true);

    const extension = blob.type.split('/')[1] || 'webm';

    const file = new File(
      [blob],
      `${type}-message-${Date.now()}.${extension}`,
      { type: blob.type },
    );

    const media = await uploadMessageMedia(token, file);

    onUploaded(media);
    toast.success('Media uploaded successfully');
    onClose();
  } catch (e) {
    console.error(e);
    toast.error('Upload failed');
    setUploading(false);
  }
};

  /* -------------------------------------------------- */
  /* PERMISSION ERROR SCREEN                            */
  /* -------------------------------------------------- */
  if (permissionError) {
    return (
      <ModalShell>
        <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500" />
        <h3 className="font-medium">Recording Not Available</h3>
        <p className="text-sm text-muted-foreground">
          Please allow browser access or upload a file instead.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={checkPermissionsAndStart}>
            Try Again
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </ModalShell>
    );
  }

  /* -------------------------------------------------- */
  /* UPLOADING STATE                                   */
  /* -------------------------------------------------- */
  if (uploading) {
    return (
      <ModalShell>
        <Loader2 className="w-10 h-10 animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground mt-4">
          Uploading your message…
        </p>
      </ModalShell>
    );
  }

  /* -------------------------------------------------- */
  /* ACTIVE RECORDER                                   */
  /* -------------------------------------------------- */
  if (showRecorder) {
    return type === 'video' ? (
      <VideoRecorder onVideoRecorded={handleRecorded} onClose={onClose} />
    ) : (
      <AudioRecorder onAudioRecorded={handleRecorded} onClose={onClose} />
    );
  }

  /* -------------------------------------------------- */
  /* INITIAL SCREEN                                    */
  /* -------------------------------------------------- */
  return (
    <ModalShell>
      {type === 'video' ? (
        <Video className="w-12 h-12 mx-auto text-blue-500" />
      ) : (
        <Mic className="w-12 h-12 mx-auto text-blue-500" />
      )}
      <h3 className="font-medium">
        {type === 'video' ? 'Start Video Recording' : 'Start Audio Recording'}
      </h3>
      <p className="text-sm text-muted-foreground">
        We need access to your{' '}
        {type === 'video' ? 'camera and microphone' : 'microphone'}.
      </p>
      <div className="flex gap-2 mt-4">
        <Button onClick={checkPermissionsAndStart}>
          {type === 'video' ? 'Enable Camera' : 'Enable Microphone'}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------- */
/* MODAL SHELL                                        */
/* -------------------------------------------------- */
function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center space-y-4">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
