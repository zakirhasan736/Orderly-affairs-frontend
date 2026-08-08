export type SectionId = string;
export type SubsectionId = string;

export interface VaultSubsection {
  id: SubsectionId;
  title: string;
}

export interface VaultSection {
  id: SectionId;
  title: string;
  subsections?: VaultSubsection[];
  hasObituaryTag?: boolean;
}

/**
 * Sidebar / product order. Internal `id` values stay stable for API, DB, and
 * ACL (Family remains `"17"`). Display helpers remain for cross-references
 * and export IDs; section titles themselves are shown without numeric prefixes.
 */
export const VAULT_NAVIGATION: VaultSection[] = [
  {
    id: '0',
    title: 'Instructions',
  },
  {
    id: '1',
    title: 'Vital Information & Key Contacts',
    subsections: [
      { id: '1A', title: 'Vital Information' },
      { id: '1B', title: 'Key Contacts' },
    ],
  },
  {
    id: '17',
    title: 'Family & Relationships',
    subsections: [
      { id: '17A', title: 'Ancestry & Family Tree' },
      { id: '17B', title: 'Family Members' },
      { id: '17C', title: 'Dependents' },
      { id: '17D', title: 'Friends & Contacts' },
      { id: '17E', title: 'Important Relationships' },
      { id: '17F', title: ' Memorabilia & Sentimental Items' },
      { id: '17G', title: 'Pet Care & Records' },
    ],
  },
  {
    id: '2',
    title: 'Access Management',
    subsections: [{ id: '2A', title: 'Kit Access Control' }],
  },
  {
    id: '3',
    title: 'Letter to Next of Kin',
    subsections: [{ id: '3A', title: 'Introductory Letter' }],
  },
  {
    id: '4',
    title: 'Personal Messages',
    subsections: [{ id: '4A', title: 'Messages & Letters' }],
  },
  {
    id: '5',
    title: 'Vehicles',
    subsections: [{ id: '5A', title: 'Current Vehicles' }],
  },
  {
    id: '6',
    title: 'Main Residence',
    subsections: [{ id: '6A', title: 'Home Information' }],
  },
  {
    id: '7',
    title: 'Insurance Policies',
    subsections: [{ id: '7A', title: 'Insurance Policies' }],
  },
  {
    id: '8',
    title: 'Organizations & Memberships',
    subsections: [{ id: '8A', title: 'Groups & Associations' }],
  },
  {
    id: '9',
    title: 'Charitable Contributions',
    hasObituaryTag: true,
    subsections: [{ id: '9A', title: 'Charities & Donations' }],
  },
  {
    id: '10',
    title: 'Education History',
    hasObituaryTag: true,
    subsections: [{ id: '10A', title: 'Education Background' }],
  },
  {
    id: '11',
    title: 'Military Service',
    hasObituaryTag: true,
    subsections: [{ id: '11A', title: 'Service Details' }],
  },
  {
    id: '12',
    title: 'Bank Accounts',
    subsections: [
      { id: '12A', title: 'Banking Information' },
      { id: '12B', title: 'Digital Payment Services' },
    ],
  },
  {
    id: '13',
    title: 'Passwords & Online Accounts',
    subsections: [{ id: '13A', title: 'Digital Accounts' }],
  },
  {
    id: '14',
    title: 'Investments',
    subsections: [{ id: '14A', title: 'Investments & Assets' }],
  },
  {
    id: '15',
    title: 'Healthcare',
    subsections: [
      { id: '15A', title: 'Medical Information' },
      { id: '15B', title: 'Healthcare Providers' },
    ],
  },
  {
    id: '16',
    title: 'Credit Cards & Debt',
    subsections: [
      { id: '16A', title: 'Debt & Credit Cards' },
      { id: '16B', title: 'Other Debts' },
    ],
  },
  {
    id: '18',
    title: 'Employment & Income',
    subsections: [
      { id: '18A', title: 'Current Employment' },
      { id: '18B', title: 'Business Ownership' },
      { id: '18C', title: 'Past Employment' },
      { id: '18D', title: 'Income Sources' },
    ],
  },
  {
    id: '19',
    title: 'Assets & Valuables',
    subsections: [
      { id: '19A', title: 'Valuables Inventory' },
      { id: '19B', title: 'Real Estate Properties' },
    ],
  },
  {
    id: '20',
    title: 'Legal Documents & Records',
    subsections: [
      { id: '20A', title: 'Legal & Tax Documents' },
      { id: '20B', title: 'Tax Documents' },
      { id: '20C', title: 'Other Important Documents' },
    ],
  },
  {
    id: '21',
    title: 'Estate Planning & Final Wishes',
    subsections: [
      { id: '21A', title: 'Estate Planning' },
      { id: '21B', title: 'Final Arrangements & Wishes' },
      { id: '21C', title: 'Guardianship Arrangements' },
    ],
  },
];

/** User-facing section number from nav order (Family after Vital → `2`, not `17`). */
export function getVaultSectionDisplayNumber(sectionId: string): string {
  const idx = VAULT_NAVIGATION.findIndex(s => s.id === sectionId);
  return idx >= 0 ? String(idx) : sectionId;
}

/** User-facing subsection id (`17A` under Family → `2A`). */
export function getVaultSubsectionDisplayId(
  sectionId: string,
  subsectionId: string,
): string {
  const display = getVaultSectionDisplayNumber(sectionId);
  const suffix = String(subsectionId || '').replace(/^\d+/, '');
  return suffix ? `${display}${suffix}` : display;
}

export function formatVaultSectionTitle(
  section: Pick<VaultSection, 'id' | 'title'>,
): string {
  return section.title;
}

export function formatVaultSubsectionTitle(
  sectionId: string,
  subsection: Pick<VaultSubsection, 'id' | 'title'>,
): string {
  void sectionId;
  return subsection.title;
}
