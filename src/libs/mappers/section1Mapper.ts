const CONTACT_KEYS = ['next_of_kin', 'executor_trustee', 'additional_contacts'];

export function mapUIToSection1Payload(data: any) {
  return {
    vital_info: data.vital_info || {},
    next_of_kin: data.next_of_kin || [],
    executor_trustee: data.executor_trustee || [],
    additional_contacts: data.additional_contacts || [],
  };
}

export function mapSection1ResponseToUI(apiResponse: any) {
  if (!apiResponse?.data) return {};

  return {
    vital_info: apiResponse.data.vital_info || {},
    next_of_kin: apiResponse.data.next_of_kin || [],
    executor_trustee: apiResponse.data.executor_trustee || [],
    additional_contacts: apiResponse.data.additional_contacts || [],
  };
}
