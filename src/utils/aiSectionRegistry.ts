export type AiSectionRegistryEntry = {
  key: string;
  id: string;
  label: string;
  defaultSubsection: string;
};

export const AI_SECTION_REGISTRY: AiSectionRegistryEntry[] = [
  {
    key: 'vital_information',
    id: '1',
    label: 'Vital Information & Key Contacts',
    defaultSubsection: '1A',
  },
  {
    key: 'vehicles',
    id: '5',
    label: 'Vehicles',
    defaultSubsection: '5A',
  },
  {
    key: 'main_residence',
    id: '6',
    label: 'Main Residence',
    defaultSubsection: '6A',
  },
  {
    key: 'insurance_policies',
    id: '7',
    label: 'Insurance Policies',
    defaultSubsection: '7A',
  },
  {
    key: 'community_memberships',
    id: '8',
    label: 'Organizations & Memberships',
    defaultSubsection: '8A',
  },
  {
    key: 'charitable_giving',
    id: '9',
    label: 'Charitable Contributions',
    defaultSubsection: '9A',
  },
  {
    key: 'education_accomplishments',
    id: '10',
    label: 'Education History',
    defaultSubsection: '10A',
  },
  {
    key: 'military_service',
    id: '11',
    label: 'Military Service',
    defaultSubsection: '11A',
  },
  {
    key: 'banking_financial_accounts',
    id: '12',
    label: 'Bank Accounts',
    defaultSubsection: '12A',
  },
  {
    key: 'passwords_online_accounts',
    id: '13',
    label: 'Passwords & Online Accounts',
    defaultSubsection: '13A',
  },
  {
    key: 'investment_accounts',
    id: '14',
    label: 'Investments',
    defaultSubsection: '14A',
  },
  {
    key: 'health_information',
    id: '15',
    label: 'Healthcare',
    defaultSubsection: '15A',
  },
  {
    key: 'credit_cards_debt',
    id: '16',
    label: 'Credit Cards & Debt',
    defaultSubsection: '16A',
  },
  {
    key: 'family_treasured_connections',
    id: '17',
    label: 'Family & Relationships',
    defaultSubsection: '17A',
  },
  {
    key: 'employment_business',
    id: '18',
    label: 'Employment & Income',
    defaultSubsection: '18A',
  },
  {
    key: 'assets_valuables',
    id: '19',
    label: 'Assets & Valuables',
    defaultSubsection: '19A',
  },
  {
    key: 'legal_documents_records',
    id: '20',
    label: 'Legal Documents & Records',
    defaultSubsection: '20A',
  },
  {
    key: 'estate_planning_final_wishes',
    id: '21',
    label: 'Estate Planning & Final Wishes',
    defaultSubsection: '21A',
  },
];

export const AI_SECTION_BY_KEY = Object.fromEntries(
  AI_SECTION_REGISTRY.map(entry => [entry.key, entry]),
) as Record<string, AiSectionRegistryEntry>;

export const AI_SECTION_BY_ID = Object.fromEntries(
  AI_SECTION_REGISTRY.map(entry => [entry.id, entry]),
) as Record<string, AiSectionRegistryEntry>;

export function getAiSectionLabel(sectionId: string) {
  return AI_SECTION_BY_ID[sectionId]?.label ?? `Section ${sectionId}`;
}
