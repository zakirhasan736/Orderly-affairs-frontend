export type OverviewTaskTag = 'HEART' | 'MONEY' | 'DOCS' | 'LIFE';

export type OverviewTaskCard = {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  tag: OverviewTaskTag;
};

export type OverviewTaskGroup = {
  id: string;
  title: string;
  tag: OverviewTaskTag;
  cards: OverviewTaskCard[];
};

export const OVERVIEW_TASK_GROUPS: OverviewTaskGroup[] = [
  {
    id: 'money',
    title: 'Money & property',
    tag: 'MONEY',
    cards: [
      {
        id: 'banks',
        sectionId: '12',
        title: 'List my bank accounts',
        description: 'Checking, savings, and digital payments.',
        tag: 'MONEY',
      },
      {
        id: 'insurance',
        sectionId: '7',
        title: 'Cover my insurance policies',
        description: 'Life, auto, home, and health coverage.',
        tag: 'MONEY',
      },
      {
        id: 'investments',
        sectionId: '14',
        title: 'Track investments',
        description: 'Brokerage, retirement, and other assets.',
        tag: 'MONEY',
      },
      {
        id: 'home',
        sectionId: '6',
        title: 'Document my home',
        description: 'Residence details, deeds, and access notes.',
        tag: 'MONEY',
      },
    ],
  },
  {
    id: 'docs',
    title: 'Documents & identity',
    tag: 'DOCS',
    cards: [
      {
        id: 'vital',
        sectionId: '1',
        title: 'Vital information',
        description: 'Identity, contacts, and key personal details.',
        tag: 'DOCS',
      },
      {
        id: 'passwords',
        sectionId: '13',
        title: 'Passwords & accounts',
        description: 'Logins, recovery notes, and digital access.',
        tag: 'DOCS',
      },
      {
        id: 'health',
        sectionId: '15',
        title: 'Healthcare records',
        description: 'Providers, insurance, and medical notes.',
        tag: 'DOCS',
      },
      {
        id: 'vehicles',
        sectionId: '5',
        title: 'Vehicles',
        description: 'Cars, titles, and related documents.',
        tag: 'DOCS',
      },
    ],
  },
  {
    id: 'life',
    title: 'Life & community',
    tag: 'LIFE',
    cards: [
      {
        id: 'family',
        sectionId: '17',
        title: 'Family & relationships',
        description: 'People, history, and treasured connections.',
        tag: 'LIFE',
      },
      {
        id: 'work',
        sectionId: '18',
        title: 'Employment & business',
        description: 'Work history, benefits, and business notes.',
        tag: 'LIFE',
      },
      {
        id: 'education',
        sectionId: '10',
        title: 'Education history',
        description: 'Schools, degrees, and accomplishments.',
        tag: 'LIFE',
      },
      {
        id: 'giving',
        sectionId: '9',
        title: 'Charitable giving',
        description: 'Organizations and donation preferences.',
        tag: 'LIFE',
      },
    ],
  },
  // After-passing / legacy planning — last so daily-use groups come first.
  {
    id: 'loved-ones',
    title: 'For your loved ones',
    tag: 'HEART',
    cards: [
      {
        id: 'nok-letter',
        sectionId: '3',
        title: 'Letter to Next of Kin',
        description: 'A first note for the people you trust most.',
        tag: 'HEART',
      },
      {
        id: 'final-wishes',
        sectionId: '21',
        title: 'Record my final wishes',
        description: 'Funeral, burial, and estate planning details.',
        tag: 'HEART',
      },
      {
        id: 'messages',
        sectionId: '4',
        title: 'Leave personal messages',
        description: 'Letters, audio, or video for specific people.',
        tag: 'HEART',
      },
      {
        id: 'will-location',
        sectionId: '20',
        title: 'Where is my will?',
        description: 'Legal documents and where to find them.',
        tag: 'HEART',
      },
    ],
  },
];

export const OVERVIEW_TAG_STYLES: Record<
  OverviewTaskTag,
  { badge: string; label: string }
> = {
  HEART: {
    badge: 'bg-rose-50 text-rose-600',
    label: 'HEART',
  },
  MONEY: {
    badge: 'bg-emerald-50 text-emerald-700',
    label: 'MONEY',
  },
  DOCS: {
    badge: 'bg-sky-50 text-sky-700',
    label: 'DOCS',
  },
  LIFE: {
    badge: 'bg-violet-50 text-violet-700',
    label: 'LIFE',
  },
};
