/**
 * Competitor-style Browse taxonomy: short category tiles that group vault sections.
 * Labels stay short on purpose — detail lives in the section list under each tile.
 *
 * Order: daily-use categories first; after-passing / legacy groups last.
 */

export type OverviewBrowseCategory = {
  id: string;
  label: string;
  /** Lucide icon name key used by the Browse grid. */
  icon:
    | 'family'
    | 'finance'
    | 'property'
    | 'passwords'
    | 'insurance'
    | 'health'
    | 'legal'
    | 'work'
    | 'identity'
    | 'community';
  sectionIds: string[];
};

export const OVERVIEW_BROWSE_CATEGORIES: OverviewBrowseCategory[] = [
  {
    id: 'finance',
    label: 'Finance',
    icon: 'finance',
    sectionIds: ['12', '14', '16'],
  },
  {
    id: 'property',
    label: 'Property',
    icon: 'property',
    sectionIds: ['6', '5', '19'],
  },
  {
    id: 'passwords',
    label: 'Passwords',
    icon: 'passwords',
    sectionIds: ['13'],
  },
  {
    id: 'insurance',
    label: 'Insurance',
    icon: 'insurance',
    sectionIds: ['7'],
  },
  {
    id: 'health',
    label: 'Healthcare',
    icon: 'health',
    sectionIds: ['15'],
  },
  {
    id: 'identity',
    label: 'Identity',
    icon: 'identity',
    sectionIds: ['1'],
  },
  {
    id: 'family',
    label: 'Family',
    icon: 'family',
    sectionIds: ['17', '2', '3', '4'],
  },
  {
    id: 'work',
    label: 'Work',
    icon: 'work',
    sectionIds: ['18'],
  },
  {
    id: 'community',
    label: 'Community',
    icon: 'community',
    sectionIds: ['8', '9', '10', '11'],
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: 'legal',
    sectionIds: ['20', '21'],
  },
];
