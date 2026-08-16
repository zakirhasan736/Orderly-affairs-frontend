function coerceDisplayValue(value: unknown): unknown {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('files' in record || 'text' in record) return value;
    for (const key of ['label', 'name', 'value', 'text', 'title']) {
      if (typeof record[key] === 'string') return record[key];
    }
    return '';
  }
  return '';
}

export function mapUIToSection1Payload(data: any) {
  const {
    vital_info,
    identity_documents,
    next_of_kin,
    executor_trustee,
    additional_contacts,
    ...rest
  } = data || {};
  return {
    vital_info: vital_info || {},
    identity_documents: Array.isArray(identity_documents)
      ? identity_documents
      : [],
    next_of_kin: next_of_kin || [],
    executor_trustee: executor_trustee || [],
    additional_contacts: additional_contacts || [],
    ...rest,
  };
}

export function mapSection1ResponseToUI(apiResponse: any) {
  if (!apiResponse?.data) return {};

  const vitalRaw = apiResponse.data.vital_info || {};
  const vital_info = Object.fromEntries(
    Object.entries(vitalRaw).map(([key, value]) => [key, coerceDisplayValue(value)]),
  );

  return {
    ...apiResponse.data,
    vital_info,
    identity_documents: apiResponse.data.identity_documents || [],
    next_of_kin: apiResponse.data.next_of_kin || [],
    executor_trustee: apiResponse.data.executor_trustee || [],
    additional_contacts: apiResponse.data.additional_contacts || [],
  };
}
