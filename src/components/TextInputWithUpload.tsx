// import React, { useRef } from 'react';
// import { Input } from '@common/ui/input';
// import { Button } from '@common/ui/button';
// import { Label } from '@common/ui/label';
// import { Upload, Camera } from 'lucide-react';

// interface TextInputWithUploadProps {
//   label: string;
//   value: any;
//   onChange: (value: any) => void;
//   placeholder?: string;
//   required?: boolean;
//   helperText?: string;
// }

// export function TextInputWithUpload({ 
//   label, 
//   value, 
//   onChange, 
//   placeholder, 
//   required, 
//   helperText 
// }: TextInputWithUploadProps) {
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newValue = { ...value };
//     newValue.text = e.target.value;
//     onChange(newValue);
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const newValue = { ...value };
//       if (!newValue.files) newValue.files = [];
//       newValue.files.push({
//         name: file.name,
//         size: file.size,
//         type: file.type,
//         uploadedAt: new Date().toISOString()
//       });
//       onChange(newValue);
//     }
//   };

//   const handleCameraCapture = () => {
//     const newValue = { ...value };
//     if (!newValue.files) newValue.files = [];
//     newValue.files.push({
//       name: `Camera_${new Date().toISOString()}.jpg`,
//       type: 'camera-capture',
//       capturedAt: new Date().toISOString()
//     });
//     onChange(newValue);
//   };

//   const removeFile = (index: number) => {
//     const newValue = { ...value };
//     if (newValue.files) {
//       newValue.files.splice(index, 1);
//       onChange(newValue);
//     }
//   };

//   return (
//     <div className="space-y-2">
//       <Label className="flex items-center gap-1">
//         {label}
//         {required && <span className="text-destructive">*</span>}
//       </Label>
      
//       {helperText && (
//         helperText === "Your living will, advance directives, or DNR orders" || helperText === "Your medical records and health documents location" ? (
//           <Label className="text-foreground">{helperText}</Label>
//         ) : (
//           <p className="text-xs text-muted-foreground text-[12px]">{helperText}</p>
//         )
//       )}
      
//       <div className="space-y-2">
//         <Input
//           value={value?.text || ''}
//           onChange={handleTextChange}
//           placeholder={placeholder}
//           className="w-full"
//         />
        
//         <div className="flex gap-2">
//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={() => fileInputRef.current?.click()}
//             className="flex-1"
//           >
//             <Upload className="h-3 w-3 mr-1" />
//             Upload File
//           </Button>
//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={handleCameraCapture}
//             className="flex-1"
//           >
//             <Camera className="h-3 w-3 mr-1" />
//             Take Photo
//           </Button>
//         </div>
//       </div>
      
//       <input
//         ref={fileInputRef}
//         type="file"
//         onChange={handleFileUpload}
//         className="hidden"
//         accept="image/*,application/pdf"
//         multiple
//       />
      
//       {value?.files && value.files.length > 0 && (
//         <div className="space-y-1">
//           {value.files.map((file: any, index: number) => (
//             <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-xs">
//               <span>{file.name}</span>
//               <Button
//                 type="button"
//                 variant="ghost"
//                 size="sm"
//                 onClick={() => removeFile(index)}
//                 className="h-6 w-6 p-0"
//               >
//                 ×
//               </Button>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
import React, { useRef, useMemo } from 'react';
import { Button } from '@common/ui/button';
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
}: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const token = Cookies.get('auth_token') || Cookies.get('nok_auth_token');

  const files = value.files || [];
  const deleted = value._deleted_files || [];

  // ✅ Detect camera support
  const cameraSupported = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Unsupported file type. Only images and PDFs are allowed.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 10MB.';
    }

    return null;
  }

  async function handleUpload(file: File) {
    if (!token) return;

    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    const uploaded = await uploadFile(token, file);

    onChange({
      ...value,
      files: [
        ...files,
        {
          ...uploaded,
          version: 1,
          scan_status: 'pending', // 🔐 backend will update
        },
      ],
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

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-1" /> Upload
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={!cameraSupported}
          onClick={() => cameraRef.current?.click()}
          title={
            cameraSupported
              ? 'Open camera'
              : 'Camera not supported on this device'
          }
        >
          <Camera className="h-4 w-4 mr-1" /> Camera
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
        onChange={e => e.target.files && handleUpload(e.target.files[0])}
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
    </div>
  );
}
