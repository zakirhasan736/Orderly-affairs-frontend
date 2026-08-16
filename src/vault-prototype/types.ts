export type SchemaFieldType =
  | 'text'
  | 'long'
  | 'choice'
  | 'multi'
  | 'toggle'
  | 'masked'
  | 'tel'
  | 'email'
  | 'num'
  | 'money'
  | 'date'
  | 'doc'
  | 'url';

export type SchemaField = {
  k: string;
  t: SchemaFieldType;
  opts?: string[];
  req?: number | boolean;
  ph?: string;
  hint?: string;
  w?: 'half';
  /** Stored vault JSON key. When set, the UI writes this key instead of the HTML label slug. */
  store?: string;
  /** How to render choice fields. Dropdowns stay selects so saved values stay selected. */
  ui?: 'select' | 'pills' | 'checks';
};

export type SchemaSub = {
  id: string;
  name: string;
  kind: 'form' | 'entries';
  desc?: string;
  dove?: number;
  entry?: string;
  fields: SchemaField[];
};

export type SchemaSection = {
  id: string;
  apiId: string;
  name: string;
  icon: string;
  collection: string;
  desc: string;
  dove?: number;
  subs: SchemaSub[];
};

export function fieldSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 96);
}

export function fieldViewKey(field: SchemaField): string {
  return field.store || fieldSlug(field.k);
}

export const HTML_ID_TO_API: Record<string, string> = {
  instructions: '0',
  'vital-information': '1',
  passwords: '13',
  'access-management': '2',
  'personal-messages': '4',
  'letter-next-of-kin': '3',
  'main-residence': '6',
  vehicles: '5',
  assets: '19',
  'bank-accounts': '12',
  investments: '14',
  'credit-cards': '16',
  employment: '18',
  'insurance-policies': '7',
  healthcare: '15',
  family: '17',
  education: '10',
  military: '11',
  organizations: '8',
  charitable: '9',
  'legal-documents': '20',
  'estate-planning': '21',
};

export const API_ID_TO_HTML: Record<string, string> = Object.fromEntries(
  Object.entries(HTML_ID_TO_API).map(([html, api]) => [api, html]),
);

export const VAULT_COLLECTIONS: { id: string; label: string; icon: string }[] = [
  { id: 'Start here', label: 'Start here', icon: 'book' },
  { id: 'Identity', label: 'Identity', icon: 'id' },
  { id: 'People & access', label: 'People & access', icon: 'users' },
  { id: 'Property', label: 'Property', icon: 'house' },
  { id: 'Money', label: 'Money', icon: 'bank' },
  { id: 'Protection', label: 'Protection', icon: 'shield' },
  { id: 'Life', label: 'Life', icon: 'flag' },
  { id: 'Legal & estate', label: 'Legal & estate', icon: 'scale' },
];
