import { describe, expect, it } from 'vitest';
import {
  buildNokLetterPreviewText,
  isNokLetterDelivered,
  mergeNokLetterAutofill,
  NOK_LETTER_DEFAULTS,
} from '@/utils/nokLetterPreview';
import {
  formatMediaFileSize,
  inferMediaContentType,
  isAllowedMediaFile,
  isAllowedVideoMessageFile,
  isImageMedia,
  MESSAGE_MEDIA_MAX_BYTES,
  validateMessageMediaSize,
} from '@/utils/mediaUpload';
import {
  isDuplicateAccessEmail,
  validateAccessPersonForSave,
  validateAccessSectionsStep,
} from '@/utils/accessManagementValidation';

describe('nokLetterPreview (Next of Kin letter)', () => {
  const person = {
    full_name: 'Alex Casey',
    email: 'alex@example.com',
    phone_number: '+15551234567',
    card_storage_location: 'Top drawer',
    key_bag_location: 'Hall closet',
    documents_bag_location: 'Safe',
  } as any;

  it('merges Access Management person into letter fields', () => {
    const merged = mergeNokLetterAutofill(
      { letter_to: '', nok_email: '' },
      person,
    );
    expect(merged.letter_to).toBe('Alex Casey');
    expect(merged.nok_email).toBe('alex@example.com');
    expect(merged.key_bag_location).toBe('Hall closet');
  });

  it('keeps letter unchanged when person is missing', () => {
    const letter = { letter_to: 'Existing' };
    expect(mergeNokLetterAutofill(letter, null)).toEqual(letter);
  });

  it('builds preview text with person autofill and defaults', () => {
    const text = buildNokLetterPreviewText(
      { letter_greeting: 'Dear', letter_to: '' },
      person,
    );
    expect(text).toContain('Alex Casey');
    expect(text).toContain('alex@example.com');
    expect(text).toContain(NOK_LETTER_DEFAULTS.access_url);
    expect(text).toContain('Hall closet');
  });

  it('detects delivered status only when sent', () => {
    expect(isNokLetterDelivered({ delivery_status: 'sent' })).toBe(true);
    expect(isNokLetterDelivered({ delivery_status: 'draft' })).toBe(false);
    expect(isNokLetterDelivered(null)).toBe(false);
  });
});

describe('mediaUpload (personal messages)', () => {
  it('allows media by mime and extension', () => {
    expect(
      isAllowedMediaFile(
        { type: 'video/webm', name: 'clip.webm' } as File,
        'video',
      ),
    ).toBe(true);
    expect(
      isAllowedMediaFile({ type: '', name: 'voice.mp3' } as File, 'audio'),
    ).toBe(true);
    expect(
      isAllowedMediaFile({ type: 'text/plain', name: 'a.txt' } as File, 'video'),
    ).toBe(false);
    expect(
      isAllowedVideoMessageFile({
        type: 'image/jpeg',
        name: 'still.jpg',
      } as File),
    ).toBe(true);
    expect(
      isAllowedVideoMessageFile({
        type: '',
        name: 'still.heic',
      } as File),
    ).toBe(true);
  });

  it('detects image media and formats sizes', () => {
    expect(isImageMedia({ type: 'image' })).toBe(true);
    expect(isImageMedia({ format: 'png' })).toBe(true);
    expect(isImageMedia({ url: 'https://cdn/x.jpg' })).toBe(true);
    expect(formatMediaFileSize()).toBe('');
    expect(formatMediaFileSize(2048)).toBe('2 KB');
    expect(formatMediaFileSize(2 * 1024 * 1024)).toBe('2.00 MB');
  });

  it('validates max size and infers content types', () => {
    expect(() => validateMessageMediaSize(1000)).not.toThrow();
    expect(() =>
      validateMessageMediaSize(MESSAGE_MEDIA_MAX_BYTES + 1),
    ).toThrow(/150 MB/i);
    expect(inferMediaContentType('clip.mp4')).toBe('video/mp4');
    expect(inferMediaContentType('voice.m4a', 'audio/mp4')).toBe('audio/mp4');
  });
});

describe('mediaPlayback (Safari / iOS)', () => {
  it('rewrites Cloudinary WebM video URLs to MP4 delivery', async () => {
    const { toPlayableMediaUrl } = await import('@/utils/mediaPlayback');
    const src =
      'https://res.cloudinary.com/demo/video/upload/v1/messages/media/clip.webm';
    expect(toPlayableMediaUrl(src, 'video')).toContain('f_mp4,vc_h264,ac_aac');
    expect(toPlayableMediaUrl(src, 'audio')).toContain('f_m4a,ac_aac');
  });
});

describe('accessManagement + NOK cross checks', () => {
  it('blocks section-specific access without sections and duplicate emails', () => {
    expect(
      validateAccessSectionsStep({
        access_level: 'Section-Specific Access',
        authorized_sections: [],
      }).ok,
    ).toBe(false);

    expect(
      validateAccessPersonForSave({
        full_name: 'Alex',
        email: 'alex@example.com',
        relationship: 'Friend',
        access_level: 'Section-Specific Access',
        authorized_sections: ['1', '4'],
        master_password: 'TempPass123!',
      }).ok,
    ).toBe(true);

    expect(
      isDuplicateAccessEmail('ALEX@example.com', [
        { email: 'alex@example.com' },
      ]),
    ).toBe(true);
  });
});
