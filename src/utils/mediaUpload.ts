export const MESSAGE_MEDIA_MAX_BYTES = 150 * 1024 * 1024; // 150 MB

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'm4v'];
const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'wav', 'webm', 'aac', 'ogg'];

const MIME_BY_EXT: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  m4v: 'video/mp4',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
};

export function blobToMediaFile(blob: Blob, kind: 'video' | 'audio'): File {
  let mimeType = blob.type?.trim() || '';

  if (!mimeType || mimeType === 'application/octet-stream') {
    mimeType = kind === 'video' ? 'video/webm' : 'audio/webm';
  }

  const rawExt = mimeType.split('/')[1]?.split(';')[0]?.trim().toLowerCase();
  const ext =
    rawExt && rawExt !== 'octet-stream'
      ? rawExt === 'quicktime'
        ? 'mov'
        : rawExt
      : kind === 'video'
        ? 'webm'
        : 'webm';

  return new File([blob], `${kind}-message-${Date.now()}.${ext}`, {
    type: mimeType,
  });
}

export function blobToPhotoFile(blob: Blob): File {
  const mimeType =
    blob.type?.trim() && blob.type.startsWith('image/')
      ? blob.type
      : 'image/jpeg';

  const ext = mimeType.split('/')[1]?.split(';')[0] || 'jpg';

  return new File([blob], `photo-message-${Date.now()}.${ext}`, {
    type: mimeType,
  });
}

export function prepareMessageMediaFile(file: File, kind: 'video' | 'audio') {
  if (file.type?.startsWith('image/')) {
    if (file.name) return file;
    return new File([file], `photo-message-${Date.now()}.jpg`, {
      type: file.type || 'image/jpeg',
    });
  }

  if (file.type && file.type !== 'application/octet-stream') {
    return file;
  }

  return new File([file], file.name, {
    type: inferMediaContentType(
      file.name,
      kind === 'video' ? 'video/mp4' : 'audio/mp4',
    ),
  });
}

export function isAllowedMediaFile(file: File, kind: 'video' | 'audio') {
  if (file.type.startsWith(`${kind}/`)) return true;

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedExtensions = kind === 'video' ? VIDEO_EXTENSIONS : AUDIO_EXTENSIONS;

  return allowedExtensions.includes(ext);
}

/** Video messages may attach a still photo via Take Photo. */
export function isAllowedVideoMessageFile(file: File) {
  if (isAllowedMediaFile(file, 'video')) return true;
  return file.type.startsWith('image/');
}

const IMAGE_FORMATS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']);

export function isImageMedia(media?: {
  type?: string;
  format?: string;
  url?: string;
}) {
  if (!media) return false;
  if (media.type === 'image') return true;

  const format = media.format?.toLowerCase();
  if (format && IMAGE_FORMATS.has(format)) return true;

  const ext = media.url?.split('.').pop()?.split('?')[0]?.toLowerCase();
  return ext ? IMAGE_FORMATS.has(ext) : false;
}

export function formatMediaFileSize(size?: number) {
  if (!size) return '';

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(size / 1024).toFixed(0)} KB`;
}

export function validateMessageMediaSize(size: number) {
  if (size > MESSAGE_MEDIA_MAX_BYTES) {
    throw new Error(
      `Recording is too large (${formatMediaFileSize(size)}). Maximum size is 150 MB.`,
    );
  }
}

export function inferMediaContentType(
  filename: string,
  fallback: 'video/mp4' | 'audio/mp4' = 'video/mp4',
) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return MIME_BY_EXT[ext] || fallback;
}
