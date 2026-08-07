/** 0 = no app-level size cap (nginx / vault quota may still apply). */
export const MESSAGE_MEDIA_MAX_BYTES = 0;

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'm4v'];
const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'wav', 'webm', 'aac', 'ogg'];
const IMAGE_FORMATS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']);

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

  // Strip codec parameters for stable extensions + Content-Type.
  let baseMime = mimeType.split(';')[0].trim().toLowerCase() || mimeType;

  // Some browsers label mic-only MediaRecorder blobs as video/webm.
  if (kind === 'audio' && baseMime.startsWith('video/')) {
    baseMime = baseMime.replace(/^video\//, 'audio/');
  }
  if (kind === 'video' && baseMime.startsWith('audio/')) {
    baseMime = baseMime.replace(/^audio\//, 'video/');
  }

  const rawExt = baseMime.split('/')[1]?.trim().toLowerCase();
  const ext =
    rawExt && rawExt !== 'octet-stream'
      ? rawExt === 'quicktime'
        ? 'mov'
        : rawExt === 'mpeg'
          ? kind === 'audio'
            ? 'mp3'
            : 'mp4'
          : rawExt
      : 'webm';

  return new File([blob], `${kind}-message-${Date.now()}.${ext}`, {
    type: baseMime,
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
  const mime = (file.type || '').toLowerCase();

  if (mime.startsWith('image/') || IMAGE_FORMATS.has(file.name.split('.').pop()?.toLowerCase() || '')) {
    if (file.name && mime.startsWith('image/')) return file;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    return new File([file], file.name || `photo-message-${Date.now()}.${ext}`, {
      type: mime.startsWith('image/') ? file.type : `image/${ext === 'jpg' ? 'jpeg' : ext}`,
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
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith(`${kind}/`)) return true;

  // iOS / Android sometimes report voice notes as video/mp4 or empty mime.
  if (kind === 'audio') {
    if (mime === 'video/mp4' || mime === 'video/quicktime') {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (['m4a', 'mp3', 'aac', 'wav', 'ogg'].includes(ext)) return true;
    }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedExtensions = kind === 'video' ? VIDEO_EXTENSIONS : AUDIO_EXTENSIONS;

  return allowedExtensions.includes(ext);
}

/** Video messages may attach a still photo via Take Photo. */
export function isAllowedVideoMessageFile(file: File) {
  if (isAllowedMediaFile(file, 'video')) return true;
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('image/')) return true;

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return IMAGE_FORMATS.has(ext);
}

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
  if (!size || size <= 0) {
    throw new Error('Recording is empty. Please try again.');
  }
  if (MESSAGE_MEDIA_MAX_BYTES > 0 && size > MESSAGE_MEDIA_MAX_BYTES) {
    throw new Error(
      `Recording is too large (${formatMediaFileSize(size)}). Maximum size is ${formatMediaFileSize(MESSAGE_MEDIA_MAX_BYTES)}.`,
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
