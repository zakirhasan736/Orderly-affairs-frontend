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
    mimeType = kind === 'video' ? 'video/mp4' : 'audio/mp4';
  }

  const rawExt = mimeType.split('/')[1]?.split(';')[0]?.trim().toLowerCase();
  const ext =
    rawExt && rawExt !== 'octet-stream'
      ? rawExt === 'quicktime'
        ? 'mov'
        : rawExt
      : kind === 'video'
        ? 'mp4'
        : 'm4a';

  return new File([blob], `${kind}-message-${Date.now()}.${ext}`, {
    type: mimeType,
  });
}

export function isAllowedMediaFile(file: File, kind: 'video' | 'audio') {
  if (file.type.startsWith(`${kind}/`)) return true;

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedExtensions = kind === 'video' ? VIDEO_EXTENSIONS : AUDIO_EXTENSIONS;

  return allowedExtensions.includes(ext);
}

export function inferMediaContentType(
  filename: string,
  fallback: 'video/mp4' | 'audio/mp4' = 'video/mp4',
) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return MIME_BY_EXT[ext] || fallback;
}
