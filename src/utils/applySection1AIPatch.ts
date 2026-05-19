export function applySection1AIPatch(currentData: any, patch: any) {
  return {
    ...currentData,
    vital_info: {
      ...(currentData?.vital_info || {}),
      ...(patch?.vital_info || {}),
    },
    next_of_kin: Array.isArray(patch?.next_of_kin)
      ? patch.next_of_kin
      : currentData?.next_of_kin || [],
    executor_trustee: Array.isArray(patch?.executor_trustee)
      ? patch.executor_trustee
      : currentData?.executor_trustee || [],
    additional_contacts: Array.isArray(patch?.additional_contacts)
      ? patch.additional_contacts
      : currentData?.additional_contacts || [],
  };
}

export function applySection1SubsectionPatch(
  currentData: any,
  subsection: string,
  patch: any,
) {
  if (subsection === 'vital_info') {
    return {
      ...currentData,
      vital_info: {
        ...(currentData?.vital_info || {}),
        ...(patch?.vital_info || {}),
      },
    };
  }

  if (subsection === 'next_of_kin') {
    return {
      ...currentData,
      next_of_kin: Array.isArray(patch?.next_of_kin)
        ? patch.next_of_kin
        : currentData?.next_of_kin || [],
    };
  }

  if (subsection === 'executor_trustee') {
    return {
      ...currentData,
      executor_trustee: Array.isArray(patch?.executor_trustee)
        ? patch.executor_trustee
        : currentData?.executor_trustee || [],
    };
  }

  if (subsection === 'additional_contacts') {
    return {
      ...currentData,
      additional_contacts: Array.isArray(patch?.additional_contacts)
        ? patch.additional_contacts
        : currentData?.additional_contacts || [],
    };
  }

  return currentData;
}
