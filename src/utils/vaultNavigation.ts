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
      { id: '1C', title: 'Key Contacts' },
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
