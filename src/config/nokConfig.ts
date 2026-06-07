export const nokConfig = {
  version: '1.0',
  roles: {
    owner: {
      can_read: true,
      can_edit: true,
      can_export: true,
      can_manage_access: true,
      hidden_sections: [],
    },
    nok: {
      read_only: true,
      can_export: true,
      can_edit: false,
      can_manage_access: false,
      hidden_sections: ['2', '3', '4'],
    },
  },
  ui: {
    dashboard: {
      quick_actions: [
        {
          id: 'qa_obituary_material',
          label: 'Obituary material',
          description:
            'View sections marked with 🕊️ that contain biographical and life story information',
          filter: { dove_tag: true },
          icon: '🕊️',
        },
        {
          id: 'qa_checklists',
          label: 'Action Checklists',
          description:
            'View all sections with actionable checklists for next of kin tasks',
          filter: { has_checklist: true },
          icon: '📋',
        },
      ],
    },
    icons: {
      checklist: '📋',
      dove: '🕊️',
      section_complete: '✓',
      section_incomplete: '○',
    },
  },
  sections: [
    {
      id: '1',
      code: '1-START',
      title: 'START HERE! Instructions',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '1A',
          title: 'Instructions - Owner',
          has_checklist: false,
          dove_tag: false,
          correlates_with: ['global.instructions'],
        },
        {
          id: '1B',
          title: 'Vital Information & Key Contacts',
          has_checklist: true,
          checklist_ref: 'Orderly Checklist: Key Contacts',
          dove_tag: true,
          correlates_with: ['owner.vital_info', 'owner.key_contacts'],
          exports_allowed: ['pdf', 'csv', 'zip'],
        },
        {
          id: '1C',
          title: 'Instructions - For Next of Kin',
          has_checklist: true,
          checklist_ref: 'Next of Kin Early Tasks',
          dove_tag: true,
          visible_to_nok: true,
          correlates_with: ['nok.guidance'],
          actions: {
            deliver_messages_button_ref: 'messages.deliver_to_loved_ones',
          },
        },
      ],
    },
    {
      id: '2',
      code: '2-ACCESS',
      title: 'Access Management',
      visible_to_nok: false,
      read_only: true,
      subsections: [],
    },
    {
      id: '3',
      code: '2-VEH',
      title: 'Vehicles',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '4A',
          title: 'Vehicles',
          has_checklist: true,
          checklist_ref: 'Vehicle Checklist',
          dove_tag: false,
          correlates_with: [
            'owner.vehicles[*].vin',
            'owner.vehicles[*].title_location',
            'owner.vehicles[*].lienholder',
            'owner.vehicles[*].insurance',
          ],
          exports_allowed: ['pdf', 'csv'],
        },
      ],
    },
    {
      id: '4',
      code: '3-RES',
      title: 'Main Residence',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '5A',
          title: 'Home Information & Inventory',
          has_checklist: true,
          checklist_ref: 'Home Inventory Checklist',
          dove_tag: false,
          correlates_with: [
            'owner.main_home.inventory',
            'owner.main_home.docs',
          ],
        },
        {
          id: '5B',
          title: 'Mortgage or Lease',
          has_checklist: true,
          checklist_ref: 'Mortgage/Lease Management',
          dove_tag: false,
          correlates_with: [
            'owner.main_home.mortgage',
            'owner.main_home.lease',
          ],
        },
        {
          id: '5C',
          title: 'Homeowners Association (HOA)',
          has_checklist: true,
          checklist_ref: 'HOA Actions',
          dove_tag: false,
          correlates_with: ['owner.main_home.hoa'],
        },
        {
          id: '5D',
          title: 'Utility Services',
          has_checklist: true,
          checklist_ref: 'Utilities Close/Transfer',
          dove_tag: false,
          correlates_with: ['owner.main_home.utilities[*]'],
        },
        {
          id: '5E',
          title: 'People With Access',
          has_checklist: true,
          checklist_ref: 'Home Access Log',
          dove_tag: false,
          correlates_with: ['owner.main_home.access_list[*]'],
        },
        {
          id: '5F',
          title: 'Repairs & Maintenance',
          has_checklist: true,
          checklist_ref: 'Repairs/Maintenance Log',
          dove_tag: false,
          correlates_with: ['owner.main_home.repairs_log[*]'],
        },
      ],
    },
    {
      id: '5',
      code: '4-VAC',
      title: 'Vacation Home',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '6A',
          title: 'Home Information & Inventory',
          has_checklist: true,
          checklist_ref: 'Home Inventory Checklist',
          dove_tag: false,
          correlates_with: ['owner.vac_home.inventory'],
        },
        {
          id: '6B',
          title: 'Mortgage or Lease',
          has_checklist: true,
          checklist_ref: 'Mortgage/Lease Management',
          dove_tag: false,
          correlates_with: ['owner.vac_home.mortgage'],
        },
        {
          id: '6C',
          title: 'Homeowners Association (HOA)',
          has_checklist: true,
          checklist_ref: 'HOA Actions',
          dove_tag: false,
          correlates_with: ['owner.vac_home.hoa'],
        },
        {
          id: '6D',
          title: 'Utility Services',
          has_checklist: true,
          checklist_ref: 'Utilities Close/Transfer',
          dove_tag: false,
          correlates_with: ['owner.vac_home.utilities[*]'],
        },
        {
          id: '6E',
          title: 'People With Access',
          has_checklist: true,
          checklist_ref: 'Home Access Log',
          dove_tag: false,
          correlates_with: ['owner.vac_home.access_list[*]'],
        },
        {
          id: '6F',
          title: 'Repairs & Maintenance',
          has_checklist: true,
          checklist_ref: 'Repairs/Maintenance Log',
          dove_tag: false,
          correlates_with: ['owner.vac_home.repairs_log[*]'],
        },
      ],
    },
    {
      id: '6',
      code: '5-INS',
      title: 'Insurance Policies',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '6A',
          title: 'Insurance Policies',
          has_checklist: true,
          checklist_ref: 'Insurance Policy Actions',
          dove_tag: false,
          correlates_with: ['owner.insurance[*]'],
        },
      ],
    },
    {
      id: '7',
      code: '6-COMM',
      title: 'Community Memberships',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '7A',
          title: 'Community Memberships',
          has_checklist: true,
          checklist_ref: 'Membership Close/Transfer',
          dove_tag: false,
          correlates_with: ['owner.memberships.community[*]'],
        },
      ],
    },
    {
      id: '8',
      code: '7-CHAR',
      title: 'Charitable Donations',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '8A',
          title: 'Charitable Donations',
          has_checklist: true,
          checklist_ref: 'Charity Notices/Receipts',
          dove_tag: false,
          correlates_with: ['owner.charity[*]'],
        },
      ],
    },
    {
      id: '9',
      code: '8-EDU',
      title: 'Education & Accomplishments',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '9A',
          title: 'Education & Accomplishments',
          has_checklist: false,
          dove_tag: true,
          correlates_with: ['owner.bio.education', 'owner.bio.awards'],
        },
      ],
    },
    {
      id: '10',
      code: '9-MIL',
      title: 'Military Service',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '10A',
          title: 'Military Service',
          has_checklist: true,
          checklist_ref: 'Military Docs Finder',
          dove_tag: true,
          correlates_with: ['owner.military.records'],
        },
      ],
    },
    {
      id: '11',
      code: '10-BANK',
      title: 'Bank Accounts',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '11A',
          title: 'Bank Accounts',
          has_checklist: true,
          checklist_ref: 'Bank/Payable-on-Death',
          dove_tag: false,
          correlates_with: ['owner.bank[*]'],
        },
        {
          id: '11B',
          title: 'Digital Payment Apps',
          has_checklist: true,
          checklist_ref: 'Payments/App Closure',
          dove_tag: false,
          correlates_with: ['owner.payment_apps[*]'],
        },
      ],
    },
    {
      id: '12',
      code: '11-PASS',
      title: 'Passwords & Online Accounts',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '12A',
          title: 'Online Accounts & Digital Assets',
          has_checklist: true,
          checklist_ref: 'Digital Assets Access',
          dove_tag: false,
          correlates_with: ['owner.digital.accounts[*]'],
        },
        {
          id: '12B',
          title: 'Digital Backup & Security Tips',
          has_checklist: false,
          dove_tag: false,
          correlates_with: ['owner.digital.usb', 'owner.digital.encryption'],
        },
        {
          id: '12C',
          title: 'Physical Access Codes',
          has_checklist: true,
          checklist_ref: 'Codes & Key Bag',
          dove_tag: false,
          correlates_with: ['owner.key_bag', 'owner.safes'],
        },
      ],
    },
    {
      id: '13',
      code: '12-INV',
      title: 'Investment Accounts',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '13A',
          title: 'Investment Accounts',
          has_checklist: true,
          checklist_ref: 'Investment Beneficiaries',
          dove_tag: false,
          correlates_with: ['owner.investments[*]'],
        },
        {
          id: '13B',
          title: 'Conservator of a Minor Beneficiary Checklist',
          has_checklist: true,
          checklist_ref: 'Minor Beneficiary Steps',
          dove_tag: false,
          correlates_with: ['owner.investments.minor_beneficiaries[*]'],
        },
      ],
    },
    {
      id: '14',
      code: '13-HEALTH',
      title: 'Health & Medical',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '14A',
          title: 'Current Health Information',
          has_checklist: true,
          checklist_ref: 'Health Info Transfer',
          dove_tag: false,
          correlates_with: ['owner.health.current'],
        },
        {
          id: '14B',
          title: 'Past Medical History',
          has_checklist: false,
          dove_tag: false,
          correlates_with: ['owner.health.history'],
        },
        {
          id: '14C',
          title: 'Medicaid/Medicare',
          has_checklist: true,
          checklist_ref: 'Medicare/Medicaid Steps',
          dove_tag: false,
          correlates_with: ['owner.health.medicare_medicaid'],
        },
      ],
    },
    {
      id: '15',
      code: '14-DEBT',
      title: 'Debt',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '15A',
          title: 'Credit Cards',
          has_checklist: true,
          checklist_ref: 'Card Closure/Claims',
          dove_tag: false,
          correlates_with: ['owner.debts.credit_cards[*]'],
        },
        {
          id: '15B',
          title: 'Student Loans',
          has_checklist: true,
          checklist_ref: 'Loan Servicer Notices',
          dove_tag: false,
          correlates_with: ['owner.debts.student_loans[*]'],
        },
        {
          id: '15C',
          title: 'Personal Debt and Loans',
          has_checklist: true,
          checklist_ref: 'Personal Loan Ledger',
          dove_tag: false,
          correlates_with: ['owner.debts.personal[*]'],
        },
        {
          id: '15D',
          title: 'Medical Debt',
          has_checklist: true,
          checklist_ref: 'Medical Billing Steps',
          dove_tag: false,
          correlates_with: ['owner.debts.medical[*]'],
        },
      ],
    },
    {
      id: '16',
      code: '15-FAM',
      title: 'Family & Treasured Connections',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '16A',
          title: 'Ancestry and Family Tree',
          has_checklist: false,
          dove_tag: true,
          correlates_with: ['owner.family.tree'],
        },
        {
          id: '16B',
          title: 'Family Members',
          has_checklist: false,
          dove_tag: true,
          correlates_with: ['owner.family.members[*]'],
        },
        {
          id: '16C',
          title: 'Dependents',
          has_checklist: true,
          checklist_ref: 'Dependent Care Steps',
          dove_tag: false,
          correlates_with: ['owner.family.dependents[*]'],
        },
        {
          id: '16D',
          title: 'Friends & Contacts List',
          has_checklist: true,
          checklist_ref: 'Notify Friends',
          dove_tag: true,
          correlates_with: ['owner.friends[*]'],
        },
        {
          id: '16E',
          title: 'Important People',
          has_checklist: false,
          dove_tag: true,
          correlates_with: ['owner.important_people[*]'],
        },
        {
          id: '16F',
          title: 'Memorabilia & Sentimental Items',
          has_checklist: false,
          dove_tag: true,
          correlates_with: ['owner.sentimental[*]'],
        },
        {
          id: '16G',
          title: 'Pets Care & Records',
          has_checklist: true,
          checklist_ref: 'Pet Care Handover',
          dove_tag: false,
          correlates_with: ['owner.pets[*]'],
        },
      ],
    },
    {
      id: '17',
      code: '16-EMP',
      title: 'Employment & Income',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '17A',
          title: 'Current Employment',
          has_checklist: true,
          checklist_ref: 'Employer/Benefits Notices',
          dove_tag: false,
          correlates_with: ['owner.employment.current'],
        },
        {
          id: '17B',
          title: 'Business Ownership',
          has_checklist: true,
          checklist_ref: 'Business Representative Checklist',
          dove_tag: false,
          correlates_with: ['owner.business'],
        },
        {
          id: '17C',
          title: 'Past Employment',
          has_checklist: false,
          dove_tag: true,
          correlates_with: ['owner.employment.past[*]'],
        },
        {
          id: '17D',
          title: 'Retirement/Social Security/Freelance/Other Income',
          has_checklist: true,
          checklist_ref: 'Income Continuation/Closure',
          dove_tag: false,
          correlates_with: ['owner.income[*]'],
        },
      ],
    },
    {
      id: '18',
      code: '17-ASSETS',
      title: 'Assets',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '18A',
          title: 'Valuable Items',
          has_checklist: true,
          checklist_ref: 'Asset Inventory/Disposition',
          dove_tag: false,
          correlates_with: ['owner.assets.valuable[*]'],
        },
        {
          id: '18B',
          title: 'Real Estate Properties',
          has_checklist: true,
          checklist_ref: 'Property Management',
          dove_tag: false,
          correlates_with: ['owner.assets.real_estate[*]'],
        },
        {
          id: '18C',
          title: 'Past Employment',
          has_checklist: false,
          dove_tag: true,
          correlates_with: ['owner.employment.past[*]'],
        },
      ],
    },
    {
      id: '19',
      code: '18-LEGAL',
      title: 'Legal Documents',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '19A',
          title: 'Legal Documents',
          has_checklist: true,
          checklist_ref: 'Locate Originals (Docs Bag)',
          dove_tag: false,
          correlates_with: ['owner.legal.documents[*]'],
        },
      ],
    },
    {
      id: '20',
      code: '19-TAX',
      title: 'Tax Information',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '20A',
          title: 'Tax Information',
          has_checklist: true,
          checklist_ref: 'Tax Docs/CPA Coordination',
          dove_tag: false,
          correlates_with: ['owner.tax[*]'],
        },
      ],
    },
    {
      id: '21',
      code: '20-ESTATE',
      title: 'Estate Plans',
      visible_to_nok: true,
      read_only: true,
      subsections: [
        {
          id: '21A',
          title: 'Financial Power of Attorney',
          has_checklist: true,
          checklist_ref: 'POA Steps/Revocation',
          dove_tag: false,
          correlates_with: ['owner.estate.poa'],
        },
        {
          id: '21B',
          title: 'Guardianship',
          has_checklist: true,
          checklist_ref: 'Guardianship Actions',
          dove_tag: false,
          correlates_with: ['owner.estate.guardianship'],
        },
        {
          id: '21C',
          title: 'End-of-Life Ceremonies & Wishes',
          has_checklist: true,
          checklist_ref: 'Funeral/Memorial Steps',
          dove_tag: true,
          correlates_with: ['owner.end_of_life.wishes'],
        },
        {
          id: '21D',
          title: 'Medical or Health Directives',
          has_checklist: true,
          checklist_ref: 'Advance Directives Access',
          dove_tag: false,
          correlates_with: ['owner.estate.medical_directives'],
        },
        {
          id: '21E',
          title: 'Will or Trust',
          has_checklist: true,
          checklist_ref: 'Will/Trust Location & Next Steps',
          dove_tag: false,
          correlates_with: ['owner.estate.will', 'owner.estate.trust'],
        },
      ],
    },
  ],
};

export const NOK_HIDDEN_SECTION_IDS = new Set(
  nokConfig.roles.nok.hidden_sections,
);

export const isHiddenFromNokDashboard = (sectionId: string) =>
  NOK_HIDDEN_SECTION_IDS.has(sectionId);

// Helper functions for NOK configuration
export const getNOKSectionConfig = (sectionId: string) => {
  return nokConfig.sections.find(section => section.id === sectionId);
};

export const isVisibleToNOK = (sectionId: string) => {
  const sectionConfig = getNOKSectionConfig(sectionId);
  return sectionConfig?.visible_to_nok ?? true;
};

export const hasChecklist = (sectionId: string, subsectionId?: string) => {
  const sectionConfig = getNOKSectionConfig(sectionId);
  if (!sectionConfig) return false;

  if (subsectionId) {
    const subsection = sectionConfig.subsections?.find(
      sub => sub.id === subsectionId,
    );
    return subsection?.has_checklist ?? false;
  }

  return sectionConfig.subsections?.some(sub => sub.has_checklist) ?? false;
};

export const hasDoveTag = (sectionId: string, subsectionId?: string) => {
  const sectionConfig = getNOKSectionConfig(sectionId);
  if (!sectionConfig) return false;

  if (subsectionId) {
    const subsection = sectionConfig.subsections?.find(
      sub => sub.id === subsectionId,
    );
    return subsection?.dove_tag ?? false;
  }

  return sectionConfig.subsections?.some(sub => sub.dove_tag) ?? false;
};

export const getChecklistReference = (
  sectionId: string,
  subsectionId?: string,
) => {
  const sectionConfig = getNOKSectionConfig(sectionId);
  if (!sectionConfig) return null;

  if (subsectionId) {
    const subsection = sectionConfig.subsections?.find(
      sub => sub.id === subsectionId,
    );
    return subsection?.checklist_ref ?? null;
  }

  return null;
};

export const getQuickActionSections = (actionId: string) => {
  const quickAction = nokConfig.ui.dashboard.quick_actions.find(
    action => action.id === actionId,
  );
  if (!quickAction) return [];

  const filter = quickAction.filter;

  return nokConfig.sections.filter(section => {
    if (filter.dove_tag) {
      return section.subsections?.some(sub => sub.dove_tag) ?? false;
    }
    if (filter.has_checklist) {
      return section.subsections?.some(sub => sub.has_checklist) ?? false;
    }
    return false;
  });
};
