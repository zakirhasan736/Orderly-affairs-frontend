/**
 * Vault section catalog for Cypress form/save E2E coverage.
 * Titles match `VAULT_NAVIGATION` sidebar labels.
 */
export type VaultSectionSpec = {
  id: string;
  /** Sidebar nav match (partial ok) */
  nav: RegExp;
  /** Visible heading / badge once open */
  heading: RegExp;
  /** Section has DynamicForm text fields to fill */
  hasTextFields: boolean;
  /** May need an "Add …" card before inputs appear */
  needsAddCard?: boolean;
  /** POST/PUT kit sections expected on Save */
  expectsSectionSave?: boolean;
  /** Special flow notes */
  kind?: 'instructions' | 'access' | 'letter' | 'messages' | 'form';
};

export const VAULT_SECTIONS: VaultSectionSpec[] = [
  {
    id: '0',
    nav: /0\.\s*Instructions/i,
    heading: /section 0|instructions/i,
    hasTextFields: false,
    expectsSectionSave: false,
    kind: 'instructions',
  },
  {
    id: '1',
    nav: /1\.\s*Vital/i,
    heading: /section 1|vital/i,
    hasTextFields: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '2',
    nav: /2\.\s*Access Management/i,
    heading: /section 2|access management/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: false,
    kind: 'access',
  },
  {
    id: '3',
    nav: /3\.\s*Letter/i,
    heading: /section 3|letter to next of kin|introductory/i,
    hasTextFields: true,
    expectsSectionSave: false,
    kind: 'letter',
  },
  {
    id: '4',
    nav: /4\.\s*Personal Messages/i,
    heading: /section 4|personal messages|messages/i,
    hasTextFields: true,
    expectsSectionSave: false,
    kind: 'messages',
  },
  {
    id: '5',
    nav: /5\.\s*Vehicles/i,
    heading: /section 5|vehicles/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '6',
    nav: /6\.\s*Main Residence/i,
    heading: /section 6|main residence|home/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '7',
    nav: /7\.\s*Insurance/i,
    heading: /section 7|insurance/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '8',
    nav: /8\.\s*Organizations|8\.\s*Community/i,
    heading: /section 8|organizations|membership/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '9',
    nav: /9\.\s*Charitable/i,
    heading: /section 9|charitable|charit/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '10',
    nav: /10\.\s*Education/i,
    heading: /section 10|education/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '11',
    nav: /11\.\s*Military/i,
    heading: /section 11|military/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '12',
    nav: /12\.\s*Bank/i,
    heading: /section 12|bank/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '13',
    nav: /13\.\s*Passwords/i,
    heading: /section 13|password|online account/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '14',
    nav: /14\.\s*Invest/i,
    heading: /section 14|invest/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '15',
    nav: /15\.\s*Health/i,
    heading: /section 15|health|medical/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '16',
    nav: /16\.\s*Credit/i,
    heading: /section 16|credit|debt/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '17',
    nav: /17\.\s*Family/i,
    heading: /section 17|family|relationship/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '18',
    nav: /18\.\s*Employment/i,
    heading: /section 18|employment|income/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '19',
    nav: /19\.\s*Assets/i,
    heading: /section 19|assets|valuables/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '20',
    nav: /20\.\s*Legal/i,
    heading: /section 20|legal document/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
  {
    id: '21',
    nav: /21\.\s*Estate/i,
    heading: /section 21|estate|final wish/i,
    hasTextFields: true,
    needsAddCard: true,
    expectsSectionSave: true,
    kind: 'form',
  },
];

export const FORM_SECTIONS = VAULT_SECTIONS.filter(s => s.kind === 'form');

/** Seed for Section 3 letter recipients (upon-death + nok letter flag). */
export const LETTER_READY_NEXT_KIN = [
  {
    id: 'nok-1',
    email: 'trusted@example.com',
    full_name: 'Trusted Person',
    relationship: 'Spouse',
    phone_number: '+15551234567',
    full_access: true,
    authorized_sections: 'all',
    access_level: 'full',
    immediate_access: false,
    access_timing: 'upon_death',
    nok_letter_received: true,
    owner_id: 'owner-1',
    nextkin: {
      id: 'nok-1',
      email: 'trusted@example.com',
      full_name: 'Trusted Person',
      relationship: 'Spouse',
    },
    password_card_generated: true,
    has_master_password: true,
    card_storage_location: 'Safe drawer',
    key_bag_location: 'Hall closet',
    documents_bag_location: 'Office shelf',
  },
];
