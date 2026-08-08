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
  return {
    vital_info: data.vital_info || {},
    identity_documents: Array.isArray(data.identity_documents)
      ? data.identity_documents
      : [],
    next_of_kin: data.next_of_kin || [],
    executor_trustee: data.executor_trustee || [],
    additional_contacts: data.additional_contacts || [],
  };
}

export function mapSection1ResponseToUI(apiResponse: any) {
  if (!apiResponse?.data) return {};

  const vitalRaw = apiResponse.data.vital_info || {};
  const vital_info = Object.fromEntries(
    Object.entries(vitalRaw).map(([key, value]) => [key, coerceDisplayValue(value)]),
  );

  return {
    vital_info,
    identity_documents: apiResponse.data.identity_documents || [],
    next_of_kin: apiResponse.data.next_of_kin || [],
    executor_trustee: apiResponse.data.executor_trustee || [],
    additional_contacts: apiResponse.data.additional_contacts || [],
  };
}
