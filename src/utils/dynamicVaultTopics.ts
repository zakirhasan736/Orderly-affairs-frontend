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

const str = (value: unknown) => String(value ?? '').trim();

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

const SUBSECTION_TOPIC_CONFIG: Record<
  string,
  Record<string, SubsectionTopicConfig>
> = {
  '5': {
    '5A': topicConfig('5A', 'Vehicle', ['year', 'make', 'model']),
  },
  '7': {
    '7A': topicConfig('7A', 'Policy', [
      'policy_type',
      'policy_company',
      'policy_number',
    ]),
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

  return readTopicItems(sectionData, config).map((item, index) => ({
    id: `${subsectionId}:${index}`,
    sectionId,
    subsectionId,
    index,
    label: config.getLabel(
      (item && typeof item === 'object' ? item : {}) as Record<string, unknown>,
      index,
    ),
  }));
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
