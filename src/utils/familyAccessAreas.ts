import { formConfig } from '@/config/formConfig';
import {
  formatVaultSectionTitle,
  getVaultSectionDisplayNumber,
} from '@/utils/vaultNavigation';

export type FamilyAccessAreaRow = {
  id: string;
  title: string;
  group: string;
  hint?: string;
};

/** All markable vault / dashboard areas for family ACL. */
export function getFamilyAccessAreaRows(): FamilyAccessAreaRow[] {
  const accessDisplay = getVaultSectionDisplayNumber('2');
  const letterDisplay = getVaultSectionDisplayNumber('3');
  const messagesDisplay = getVaultSectionDisplayNumber('4');

  const special: FamilyAccessAreaRow[] = [
    {
      id: 'overview',
      title: 'Dashboard overview',
      group: 'Dashboard',
      hint: 'Overview snapshot + document drag & drop zone',
    },
    {
      id: 'section2_nextkin',
      title: 'Access management (Next of Kin)',
      group: 'People & letters',
      hint: `Section ${accessDisplay} — approve / manage Next of Kin`,
    },
    {
      id: '3',
      title: 'Letter of next of kin',
      group: 'People & letters',
      hint: `Section ${letterDisplay} — NOK letters`,
    },
    {
      id: '4',
      title: 'Personal messages',
      group: 'People & letters',
      hint: `Section ${messagesDisplay} — letters, audio, video messages`,
    },
    {
      id: 'billing',
      title: 'Billing & subscription',
      group: 'Account',
      hint: 'View billing status (payment changes stay owner-only)',
    },
    {
      id: 'vault_settings',
      title: 'Vault Settings (roles & security)',
      group: 'Account',
      hint: 'Family role management area in Vault Settings',
    },
  ];

  const vault = formConfig.chunks.flatMap(chunk =>
    chunk.sections
      .filter(section => !['2', '3', '4'].includes(String(section.id)))
      .map(section => ({
        id: String(section.id),
        title: formatVaultSectionTitle({
          id: String(section.id),
          title: section.title,
        }),
        group: 'Vault sections',
        hint: 'Section data & per-section drag/drop when role allows upload',
      })),
  );

  return [...special, ...vault];
}

export type FamilyAccessLevel =
  | 'Full Dashboard Access'
  | 'Area-Specific Access';
