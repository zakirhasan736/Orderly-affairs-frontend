export type VaultPrivacyMode = 'server' | 'zero_knowledge' | 'device_only';

export type VaultPrivacyRule = {
  sectionId: string;
  subsectionId?: string | null;
  fieldKey?: string | null;
  mode: VaultPrivacyMode;
  shareWithNok?: boolean;
};

export type VaultPrivacyPolicy = {
  rules: VaultPrivacyRule[];
};

const CHANGE_EVENT = 'oa-vault-privacy-changed';
const CACHE_KEY = 'oa_vault_privacy_v1';

let cached: VaultPrivacyPolicy = { rules: [] };

if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VaultPrivacyPolicy;
      if (parsed && Array.isArray(parsed.rules)) cached = parsed;
    }
  } catch {
    /* ignore */
  }
}

function ruleKey(rule: Pick<VaultPrivacyRule, 'sectionId' | 'subsectionId' | 'fieldKey'>) {
  return `${rule.sectionId}|${rule.subsectionId || ''}|${rule.fieldKey || ''}`;
}

export function getCachedVaultPrivacy(): VaultPrivacyPolicy {
  return cached;
}

export function setCachedVaultPrivacy(policy: VaultPrivacyPolicy) {
  cached = {
    rules: Array.isArray(policy?.rules) ? policy.rules : [],
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function loadCachedVaultPrivacyFromStorage() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as VaultPrivacyPolicy;
    if (parsed && Array.isArray(parsed.rules)) cached = parsed;
  } catch {
    /* ignore */
  }
}

export const VAULT_PRIVACY_CHANGED = CHANGE_EVENT;

function specificity(rule: VaultPrivacyRule) {
  let score = 1;
  if (rule.subsectionId) score += 2;
  if (rule.fieldKey) score += 4;
  return score;
}

export function resolveVaultPrivacyMode(args: {
  sectionId: string;
  subsectionId?: string | null;
  fieldKey?: string | null;
}): VaultPrivacyMode {
  const { sectionId, subsectionId, fieldKey } = args;
  let best: VaultPrivacyRule | null = null;
  let bestScore = -1;
  for (const rule of cached.rules) {
    if (rule.sectionId !== sectionId) continue;
    if (rule.subsectionId && rule.subsectionId !== (subsectionId || '')) continue;
    if (rule.fieldKey && rule.fieldKey !== (fieldKey || '')) continue;
    if (rule.fieldKey && !fieldKey) continue;
    const score = specificity(rule);
    if (score > bestScore) {
      best = rule;
      bestScore = score;
    }
  }
  return best?.mode || 'server';
}

export function upsertVaultPrivacyRule(next: VaultPrivacyRule) {
  const key = ruleKey(next);
  const rules = cached.rules.filter(rule => ruleKey(rule) !== key);
  const mode = next.mode || 'server';
  if (mode !== 'server') {
    rules.push({
      ...next,
      mode,
      shareWithNok: false,
    });
  }
  setCachedVaultPrivacy({ rules });
}

export function sectionIdFromVaultPath(path: string): string | null {
  const match = String(path || '').match(/section(\d+)/i);
  return match ? String(Number(match[1])) : null;
}
