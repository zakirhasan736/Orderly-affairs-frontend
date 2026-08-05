import { describe, expect, it } from 'vitest';
import {
  isVaultUploadField,
  vaultFieldHasDisplayContent,
  vaultFieldPlainText,
} from '@/utils/vaultFieldDisplay';

describe('vaultFieldDisplay', () => {
  it('unwraps upload field JSON to plain text', () => {
    const vin = {
      deleted_files: [],
      files: [],
      text: '5J8TB4H50NL014723',
    };
    expect(isVaultUploadField(vin)).toBe(true);
    expect(vaultFieldPlainText(vin)).toBe('5J8TB4H50NL014723');
    expect(vaultFieldHasDisplayContent(vin)).toBe(true);
  });

  it('shows policy number text without JSON', () => {
    expect(
      vaultFieldPlainText({
        deleted_files: [],
        files: [],
        text: 'AUTO-IL-4471982-03',
      }),
    ).toBe('AUTO-IL-4471982-03');
  });

  it('keeps plain strings as-is', () => {
    expect(vaultFieldPlainText('Honda')).toBe('Honda');
    expect(isVaultUploadField('Honda')).toBe(false);
  });
});
