/** Minimum passing-signal checklist items an immediate-access NOK must check. */
export const MIN_DEATH_SIGNAL_CHECKS = 2;

/** Checklist item IDs that can contribute to automatic passing detection. */
export const DEATH_SIGNAL_CHECKLIST_IDS = new Set([
  'gather_documents',
  'notify_immediate',
  'notify_banks',
  'notify_employer',
  'contact_insurance',
  'funeral_arrangements',
  'locate_will',
  'freeze_accounts',
]);

export const isDeathSignalChecklistItem = (itemId: string) =>
  DEATH_SIGNAL_CHECKLIST_IDS.has(itemId);
