import { VAULT_SCHEMA } from '@/vault-prototype';
import { VAULT_COLLECTIONS } from '@/vault-prototype/types';

export type OverviewBrowseCategory = {
  id: string;
  label: string;
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

const COLLECTION_ICON: Record<string, OverviewBrowseCategory['icon']> = {
  'Start here': 'identity',
  Identity: 'identity',
  'People & access': 'family',
  Property: 'property',
  Money: 'finance',
  Protection: 'insurance',
  Life: 'community',
  'Legal & estate': 'legal',
};

export const OVERVIEW_BROWSE_CATEGORIES: OverviewBrowseCategory[] =
  VAULT_COLLECTIONS.map(collection => ({
    id: collection.id,
    label: collection.label,
    icon: COLLECTION_ICON[collection.id] || 'identity',
    sectionIds: VAULT_SCHEMA.filter(
      section => section.collection === collection.id,
    ).map(section => section.apiId),
  }));
