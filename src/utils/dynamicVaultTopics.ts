import { isJunkVehicleCard } from '@/utils/aiItemDedup';

export type DynamicTopic = {
  id: string;
  sectionId: string;
  subsectionId: string;
  label: string;
  index: number;
};

type TopicLabelFn = (item: Record<string, unknown>, index: number) => string;

type SubsectionTopicConfig = {
  dataKey: string;
  getLabel: TopicLabelFn;
  fallbackPrefix: string;
};

const str = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['label', 'name', 'value', 'text', 'title', 'type']) {
      const nested = str(record[key]);
      if (nested) return nested;
    }
  }
  return '';
};

function joinFields(item: Record<string, unknown>, fields: string[]) {
  return fields.map(field => str(item[field])).filter(Boolean).join(' · ');
}

function topicLabel(
  item: Record<string, unknown>,
  index: number,
  fields: string[],
  fallback: string,
) {
  return joinFields(item, fields) || `${fallback} #${index + 1}`;
}

function topicConfig(
  dataKey: string,
  fallback: string,
  fields: string[],
): SubsectionTopicConfig {
  return {
    dataKey,
    fallbackPrefix: fallback,
    getLabel: (item, index) => topicLabel(item, index, fields, fallback),
  };
}

export const SUBSECTION_TOPIC_CONFIG: Record<
  string,
  Record<string, SubsectionTopicConfig>
> = {
  '5': {
    // Make first so sidebar shows "Toyota · Camry · 2020", not year-leading labels.
    '5A': topicConfig('5A', 'Vehicle', ['make', 'model', 'year']),
  },
  '7': {
    '7A': {
      dataKey: '7A',
      fallbackPrefix: 'Policy',
      getLabel: (item, index) => {
        const company = str(item.policy_company || item.insurance_company);
        const type = str(item.policy_type);
        const notes = str(item.notes || item.additional_notes);
        const brandMatch = notes.match(
          /\b(toyota|honda|jeep|ford|chevrolet|chevy|bmw|nissan|hyundai|kia|subaru|mazda|lexus|gmc|ram|dodge|tesla)\b/i,
        );
        const brand = brandMatch?.[1]
          ? brandMatch[1].charAt(0).toUpperCase() +
            brandMatch[1].slice(1).toLowerCase()
          : '';
        const name = str(
          item.policy_name || item.named_insured || item.insured_name,
        );
        const parts = [company, brand || name, type].filter(Boolean);
        return parts.join(' · ') || `Policy #${index + 1}`;
      },
    },
  },
  '8': {
    '8A': topicConfig('8A', 'Organization', ['organization_name']),
  },
  '9': {
    '9A': topicConfig('9A', 'Charity', ['charity_name', 'cause_type']),
  },
  '10': {
    '10A': topicConfig('10A', 'Education', [
      'institution_name',
      'degree_type',
      'field_of_study',
    ]),
  },
  '11': {
    '11A': topicConfig('11A', 'Service Period', [
      'branch_of_service',
      'rank_achieved',
      'service_dates',
    ]),
  },
  '12': {
    '12A': topicConfig('12A', 'Bank Account', ['bank_name', 'account_type']),
    '12B': topicConfig('12B', 'Digital Payment', ['service_name']),
  },
  '13': {
    '13A': topicConfig('13A', 'Online Account', [
      'service_name',
      'account_type',
    ]),
  },
  '14': {
    '14A': topicConfig('14A', 'Investment', [
      'financial_institution',
      'account_type',
    ]),
  },
  '15': {
    '15B': topicConfig('15B', 'Provider', ['provider_name', 'specialty']),
  },
  '16': {
    '16A': topicConfig('16A', 'Credit Card', ['card_name', 'card_type']),
    '16B': topicConfig('16B', 'Debt', ['creditor_name', 'debt_type']),
  },
  '17': {
    '17B': topicConfig('17B', 'Family Member', ['person_name', 'relationship']),
    '17C': topicConfig('17C', 'Dependent', ['dependent_name', 'relationship']),
    '17D': topicConfig('17D', 'Friend', ['friend_name']),
    '17E': topicConfig('17E', 'Relationship', [
      'person_name',
      'relationship_type',
    ]),
    '17F': topicConfig('17F', 'Memorabilia', ['item_name', 'item_type']),
    '17G': topicConfig('17G', 'Pet', ['pet_name', 'pet_type']),
  },
  '18': {
    '18B': topicConfig('18B', 'Business', ['business_name', 'business_type']),
    '18C': topicConfig('18C', 'Previous Job', [
      'employer_name',
      'job_title',
    ]),
    '18D': topicConfig('18D', 'Income Source', [
      'income_source',
      'income_type',
    ]),
  },
  '19': {
    '19A': topicConfig('19A', 'Valuable', ['item_description', 'item_type']),
    '19B': topicConfig('19B', 'Property', [
      'property_address',
      'property_type',
    ]),
  },
  '20': {
    '20C': topicConfig('20C', 'Document', [
      'document_type',
      'document_description',
    ]),
  },
};

type MultiGroupTopicSource = {
  groupKey: string;
  fallbackPrefix: string;
  labelFields: string[];
};

/** Subsections whose items live in multiple root-level arrays (e.g. Section 1 contacts). */
const MULTI_GROUP_TOPIC_CONFIG: Record<
  string,
  Record<string, MultiGroupTopicSource[]>
> = {
  '1': {
    '1B': [
      {
        groupKey: 'next_of_kin',
        fallbackPrefix: 'Next of Kin',
        labelFields: ['contact_name', 'relationship'],
      },
      {
        groupKey: 'executor_trustee',
        fallbackPrefix: 'Executor / Trustee',
        labelFields: ['contact_name', 'role_title'],
      },
      {
        groupKey: 'additional_contacts',
        fallbackPrefix: 'Additional Contact',
        labelFields: ['contact_name', 'role_title'],
      },
    ],
    // Legacy nav id — same contact groups as 1B
    '1C': [
      {
        groupKey: 'next_of_kin',
        fallbackPrefix: 'Next of Kin',
        labelFields: ['contact_name', 'relationship'],
      },
      {
        groupKey: 'executor_trustee',
        fallbackPrefix: 'Executor / Trustee',
        labelFields: ['contact_name', 'role_title'],
      },
      {
        groupKey: 'additional_contacts',
        fallbackPrefix: 'Additional Contact',
        labelFields: ['contact_name', 'role_title'],
      },
    ],
  },
};

function readTopicItems(
  sectionData: Record<string, unknown> | undefined,
  config: SubsectionTopicConfig,
) {
  const raw = sectionData?.[config.dataKey];
  return Array.isArray(raw) ? raw : [];
}

function multiGroupTopicLabel(
  item: Record<string, unknown>,
  index: number,
  group: MultiGroupTopicSource,
) {
  const detail = joinFields(item, group.labelFields);

  if (detail) {
    return `${group.fallbackPrefix} · ${detail}`;
  }

  return `${group.fallbackPrefix} #${index + 1}`;
}

function readMultiGroupTopics(
  sectionId: string,
  subsectionId: string,
  sectionData: Record<string, unknown> | undefined,
  groups: MultiGroupTopicSource[],
): DynamicTopic[] {
  return groups.flatMap(group => {
    const raw = sectionData?.[group.groupKey];
    const items = Array.isArray(raw) ? raw : [];

    return items.map((item, index) => ({
      id: `${subsectionId}:${group.groupKey}:${index}`,
      sectionId,
      subsectionId,
      index,
      label: multiGroupTopicLabel(
        (item && typeof item === 'object' ? item : {}) as Record<
          string,
          unknown
        >,
        index,
        group,
      ),
    }));
  });
}

export function getDynamicTopicsForSubsection(
  sectionId: string,
  subsectionId: string,
  sectionData?: Record<string, unknown>,
): DynamicTopic[] {
  const multiGroup = MULTI_GROUP_TOPIC_CONFIG[sectionId]?.[subsectionId];
  if (multiGroup) {
    return readMultiGroupTopics(
      sectionId,
      subsectionId,
      sectionData,
      multiGroup,
    );
  }

  const config = SUBSECTION_TOPIC_CONFIG[sectionId]?.[subsectionId];
  if (!config) return [];

  // Keep real card indexes for scroll/focus, but hide empty shells / OCR junk
  // (e.g. "TO.01/08") so the sidebar only lists named document cards.
  return readTopicItems(sectionData, config)
    .map((item, index) => {
      const record =
        item && typeof item === 'object' && !Array.isArray(item)
          ? (item as Record<string, unknown>)
          : {};
      if (sectionId === '5' && isJunkVehicleCard(record)) return null;
      const hasContent = Object.entries(record).some(([key, value]) => {
        if (key === '__rowId') return false;
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') {
          const upload = value as { text?: unknown; files?: unknown[] };
          if ('text' in upload || 'files' in upload) {
            return Boolean(
              (typeof upload.text === 'string' && upload.text.trim()) ||
                (Array.isArray(upload.files) && upload.files.length),
            );
          }
          return Object.values(upload).some(
            nested => nested !== null && nested !== undefined && nested !== '',
          );
        }
        return true;
      });
      if (!hasContent) return null;
      return {
        id: `${subsectionId}:${index}`,
        sectionId,
        subsectionId,
        index,
        label: config.getLabel(record, index),
      };
    })
    .filter((topic): topic is DynamicTopic => topic !== null);
}

export function getDynamicTopicsForSection(
  sectionId: string,
  sectionData?: Record<string, unknown>,
): DynamicTopic[] {
  const multiGroupSection = MULTI_GROUP_TOPIC_CONFIG[sectionId];
  const standardSection = SUBSECTION_TOPIC_CONFIG[sectionId];
  const subsectionIds = new Set([
    ...Object.keys(multiGroupSection || {}),
    ...Object.keys(standardSection || {}),
  ]);

  if (subsectionIds.size === 0) return [];

  return [...subsectionIds].flatMap(subsectionId =>
    getDynamicTopicsForSubsection(sectionId, subsectionId, sectionData),
  );
}

export function subsectionHasDynamicTopics(
  sectionId: string,
  subsectionId: string,
) {
  return Boolean(
    SUBSECTION_TOPIC_CONFIG[sectionId]?.[subsectionId] ||
      MULTI_GROUP_TOPIC_CONFIG[sectionId]?.[subsectionId],
  );
}

export function getTopicElementId(topicId: string) {
  return `vault-topic-${topicId.replace(/:/g, '-')}`;
}

/**
 * Accordion / card title for a multi-item subsection — same labels as the
 * left sidebar dynamic topics (e.g. "State Farm · Vehicle", "Jeep · Wrangler").
 */
export function getItemDisplayLabel(
  sectionId: string,
  subsectionId: string,
  item: Record<string, unknown> | null | undefined,
  index: number,
  fallbackPrefix?: string,
): string {
  const record =
    item && typeof item === 'object' && !Array.isArray(item) ? item : {};
  const config = SUBSECTION_TOPIC_CONFIG[sectionId]?.[subsectionId];
  if (config) {
    return config.getLabel(record, index);
  }
  const prefix = fallbackPrefix || 'Item';
  return `${prefix} #${index + 1}`;
}

export function findDynamicTopic(
  sectionId: string,
  sectionData: Record<string, unknown> | undefined,
  topicId: string | null | undefined,
) {
  if (!topicId) return null;

  return (
    getDynamicTopicsForSection(sectionId, sectionData).find(
      topic => topic.id === topicId,
    ) || null
  );
}
