
import React, { useRef, useMemo,useEffect } from 'react';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { Upload, Camera, X } from 'lucide-react';
import Cookies from 'js-cookie';
import { uploadFile } from '@/libs/api/upload';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export function TextInputWithUpload({
  label,
  value = {},
  onChange,
  helperText,
  placeholder,
}: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const token = Cookies.get('auth_token') || Cookies.get('nok_auth_token');

  const files = value.files || [];
  const deleted = value._deleted_files || [];
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraOpen, setCameraOpen] = React.useState(false);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = { ...value };
    newValue.text = e.target.value;
    onChange(newValue);
  };
  // ✅ Detect camera support
  const cameraSupported = useMemo(() => {
    if (typeof navigator === 'undefined') return false;

    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);
const startCamera = async () => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });

    setStream(mediaStream);
    setCameraOpen(true);
  } catch (err) {
    console.error('Camera not available, fallback to mobile capture', err);
    cameraRef.current?.click();
  }
};
useEffect(() => {
  if (cameraOpen && stream && videoRef.current) {
    videoRef.current.srcObject = stream;
  }
}, [cameraOpen, stream]);
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  setStream(null);
  setCameraOpen(false);
}
function capturePhoto() {
  if (!videoRef.current || !canvasRef.current) return;

  const video = videoRef.current;
  const canvas = canvasRef.current;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(async blob => {
    if (!blob) return;

    const file = new File([blob], `capture_${Date.now()}.png`, {
      type: 'image/png',
    });

    await handleUpload(file);

    stopCamera();
  }, 'image/png');
}
useEffect(() => {
  return () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };
}, [stream]);
  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Unsupported file type. Only images and PDFs are allowed.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 10MB.';
    }

    return null;
  }

  // async function handleUpload(file: File) {
  //   if (!token) return;

  //   const error = validateFile(file);
  //   if (error) {
  //     alert(error);
  //     return;
  //   }

  //   const uploaded = await uploadFile(token, file);

  //   onChange({
  //     ...value,
  //     files: [
  //       ...files,
  //       {
  //         ...uploaded,
  //         version: 1,
  //         scan_status: 'pending', // 🔐 backend will update
  //       },
  //     ],
  //   });
  // }
  async function handleUpload(file: File) {
  if (!token) return;

  const error = validateFile(file);
  if (error) {
    alert(error);
    return;
  }

  const uploaded = await uploadFile(token, file);

  // Replace current file instead of adding to the array
  onChange({
    ...value,
    files: [
      {
        ...uploaded,
        version: 1,
        scan_status: 'pending', // backend will update
      },
    ],
    _deleted_files: files.length && files[0].public_id ? [files[0].public_id] : [],
  });
}

  function removeFile(file: any, index: number) {
    onChange({
      ...value,
      files: files.filter((_: any, i: number) => i !== index),
      _deleted_files: file.public_id ? [...deleted, file.public_id] : deleted,
    });
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      <Input
        value={value?.text || ''}
        onChange={handleTextChange}
        placeholder={placeholder}
        className="w-full"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-1" /> Upload
        </Button>

        <Button size="sm" variant="outline" onClick={startCamera}>
          <Camera className="h-4 w-4 mr-1" /> Take Photo
        </Button>
      </div>

      {/* File upload */}
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf"
        onChange={e => e.target.files && handleUpload(e.target.files[0])}
      />

      {/* Camera capture ONLY */}
      <input
        ref={cameraRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {files.map((f: any, i: number) => (
        <div
          key={f.public_id}
          className="flex justify-between items-center bg-muted p-2 rounded text-xs"
        >
          <a href={f.url} target="_blank" className="underline">
            {f.name}
            {f.version && <span className="ml-1">v{f.version}</span>}
          </a>

          <button onClick={() => removeFile(f, i)}>
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black rounded-xl overflow-hidden max-w-xl w-full">
            <video ref={videoRef} autoPlay playsInline className="w-full" />

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex justify-between p-4 bg-gray-900">
              <Button variant="outline" onClick={stopCamera}>
                Cancel
              </Button>

              <Button onClick={capturePhoto} disabled={!stream}>
                Capture
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
