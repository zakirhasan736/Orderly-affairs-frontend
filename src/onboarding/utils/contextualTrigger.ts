export const shouldTriggerContextualTour = (
  formData: any,
  nextKinList: any[],
) => {
  if (!nextKinList || nextKinList.length === 0) {
    return 'assign_nok';
  }

  if (!formData?.['4']?.['4A']) {
    return 'create_messages';
  }

  return null;
};
