/**
 * Guards against section GET/refresh overwriting a just-applied AI fill.
 */
const recentFills = new Map<string, number>();

export function markAiSectionFilled(sectionId: string) {
  if (!sectionId) return;
  recentFills.set(String(sectionId), Date.now());
}

export function wasAiSectionRecentlyFilled(
  sectionId: string,
  withinMs = 20000,
) {
  const stamped = recentFills.get(String(sectionId));
  if (!stamped) return false;
  return Date.now() - stamped < withinMs;
}

export function clearAiSectionFillGuard(sectionId: string) {
  recentFills.delete(String(sectionId));
}
