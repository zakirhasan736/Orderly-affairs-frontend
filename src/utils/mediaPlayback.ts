/**
 * Safari / iOS cannot play WebM (common from Chrome MediaRecorder).
 * Cloudinary can re-encode on the fly when we inject delivery transforms.
 */

function isCloudinaryDeliveryUrl(url: string) {
  return /res\.cloudinary\.com\//i.test(url) && /\/(?:video|image|raw)\/upload\//i.test(url);
}

function insertCloudinaryTransform(url: string, transform: string) {
  // Avoid stacking the same transform repeatedly.
  if (url.includes(`/${transform}/`) || url.includes(`,${transform}`) || url.includes(`${transform},`)) {
    return url;
  }

  return url.replace(
    /(\/(?:video|image|raw)\/upload\/)/i,
    `$1${transform}/`,
  );
}

/** True when the browser likely cannot play WebM natively. */
export function browserNeedsMp4Playback() {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari =
    /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS|Android/i.test(ua);

  return isIOS || isSafari;
}

/**
 * Return a URL Safari can play.
 * - Video: force H.264 MP4
 * - Audio: force AAC in M4A (Safari-friendly)
 */
export function toPlayableMediaUrl(
  url: string | undefined,
  kind: 'video' | 'audio' | 'image' = 'video',
) {
  if (!url) return '';
  if (kind === 'image' || !isCloudinaryDeliveryUrl(url)) return url;

  const lower = url.toLowerCase();
  const alreadyMp4Friendly =
    kind === 'video'
      ? /\.mp4($|\?)/i.test(lower) || /\/f_mp4\b/i.test(url)
      : /\.(m4a|mp3|aac)($|\?)/i.test(lower) || /\/f_(m4a|mp3|aac)\b/i.test(url);

  if (alreadyMp4Friendly && !/\.webm($|\?)/i.test(lower)) {
    return url;
  }

  // Always transform WebM (and other non-Safari formats) via Cloudinary.
  if (kind === 'audio') {
    return insertCloudinaryTransform(url, 'f_m4a,ac_aac');
  }

  return insertCloudinaryTransform(url, 'f_mp4,vc_h264,ac_aac');
}
