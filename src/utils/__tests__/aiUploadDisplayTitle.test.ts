import { describe, expect, it } from 'vitest';
import {
  polishUploadedDocumentName,
  resolveUploadDisplayTitle,
  uploadedFileKindLabel,
} from '@/utils/aiUploadDisplayTitle';

describe('polishUploadedDocumentName', () => {
  it('turns underscores into readable names and keeps the file type', () => {
    expect(polishUploadedDocumentName('Auto_Insurance.PDF')).toBe(
      'Auto Insurance.pdf',
    );
    expect(polishUploadedDocumentName('driver-license.png')).toBe(
      'Driver License.png',
    );
  });

  it('keeps camera dump names so the user can recognize the file', () => {
    expect(polishUploadedDocumentName('IMG_8615.JPEG')).toBe('IMG 8615.jpg');
    expect(polishUploadedDocumentName('DSC0123.webp')).toBe('DSC0123.webp');
  });

  it('adds an extension from mime when the name has none', () => {
    expect(
      polishUploadedDocumentName('Passport Scan', 'application/pdf'),
    ).toBe('Passport Scan.pdf');
    expect(polishUploadedDocumentName('front-id', 'image/jpeg')).toBe(
      'Front ID.jpg',
    );
  });

  it('ignores placeholder names', () => {
    expect(polishUploadedDocumentName('Uploaded document')).toBeNull();
    expect(polishUploadedDocumentName('untitled.pdf')).toBeNull();
  });
});

describe('resolveUploadDisplayTitle', () => {
  it('uses the uploaded filename instead of the matched section', () => {
    expect(
      resolveUploadDisplayTitle({
        fileName: 'johns_passport.pdf',
        sectionId: '1',
        targetSectionLabel: 'Vital Information & Key Contacts',
        displayTitle: 'Identity document',
        documentSummary: 'US passport for John',
      }),
    ).toBe('Johns Passport.pdf');
  });

  it('does not rename an image to the section label', () => {
    expect(
      resolveUploadDisplayTitle({
        fileName: 'IMG_8615.jpeg',
        mimeType: 'image/jpeg',
        sectionId: '7',
        targetSectionLabel: 'Insurance Policies',
        displayTitle: 'Insurance Policies',
      }),
    ).toBe('IMG 8615.jpg');
  });

  it('falls back to a type label only when the original name is missing', () => {
    expect(
      resolveUploadDisplayTitle({
        fileName: '',
        mimeType: 'application/pdf',
        sectionId: '5',
        targetSectionLabel: 'Vehicles',
      }),
    ).toBe('Uploaded PDF');
  });
});

describe('uploadedFileKindLabel', () => {
  it('labels PDFs and images from name or mime', () => {
    expect(
      uploadedFileKindLabel({ fileName: 'policy.pdf' }),
    ).toBe('PDF');
    expect(
      uploadedFileKindLabel({ mimeType: 'image/png', fileName: 'scan' }),
    ).toBe('Image');
  });
});
