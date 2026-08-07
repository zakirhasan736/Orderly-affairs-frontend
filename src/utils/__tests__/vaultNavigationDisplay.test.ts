import { describe, expect, it } from 'vitest';
import {
  getVaultSectionDisplayNumber,
  getVaultSubsectionDisplayId,
  VAULT_NAVIGATION,
} from '@/utils/vaultNavigation';

describe('vault section display numbering', () => {
  it('numbers Family after Vital as 2 while keeping internal id 17', () => {
    expect(VAULT_NAVIGATION.map(s => s.id).slice(0, 4)).toEqual([
      '0',
      '1',
      '17',
      '2',
    ]);
    expect(getVaultSectionDisplayNumber('1')).toBe('1');
    expect(getVaultSectionDisplayNumber('17')).toBe('2');
    expect(getVaultSectionDisplayNumber('2')).toBe('3');
    expect(getVaultSubsectionDisplayId('17', '17A')).toBe('2A');
    expect(getVaultSubsectionDisplayId('2', '2A')).toBe('3A');
    expect(getVaultSectionDisplayNumber('12')).toBe('13');
    expect(getVaultSubsectionDisplayId('12', '12A')).toBe('13A');
    expect(getVaultSubsectionDisplayId('12', '12B')).toBe('13B');
  });
});
