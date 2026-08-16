import { secureFetch } from '@/libs/secureFetch';
import {
  setCachedVaultPrivacy,
  type VaultPrivacyPolicy,
  type VaultPrivacyRule,
} from '@/utils/vaultPrivacyPolicy';
import { SENSITIVE_DEFAULT_RULES } from '@/utils/vaultSensitiveFields';

function withSensitiveDefaults(policy: VaultPrivacyPolicy): VaultPrivacyPolicy {
  const rules = Array.isArray(policy?.rules) ? [...policy.rules] : [];
  const seen = new Set(
    rules.map(
      rule =>
        `${rule.sectionId}|${rule.subsectionId || ''}|${rule.fieldKey || ''}`,
    ),
  );
  SENSITIVE_DEFAULT_RULES.forEach(item => {
    const key = `${item.sectionId}||${item.fieldKey}`;
    if (seen.has(key)) return;
    seen.add(key);
    const rule: VaultPrivacyRule = {
      sectionId: item.sectionId,
      subsectionId: null,
      fieldKey: item.fieldKey,
      mode: item.mode,
      shareWithNok: false,
    };
    rules.push(rule);
  });
  return { rules };
}

export async function fetchVaultPrivacy(): Promise<VaultPrivacyPolicy> {
  const res = await secureFetch('/auth/vault-privacy');
  if (!res.ok) {
    const fallback = withSensitiveDefaults({ rules: [] });
    setCachedVaultPrivacy(fallback);
    return fallback;
  }
  const json = withSensitiveDefaults((await res.json()) as VaultPrivacyPolicy);
  setCachedVaultPrivacy(json);
  return json;
}

export async function saveVaultPrivacy(
  policy: VaultPrivacyPolicy,
): Promise<VaultPrivacyPolicy> {
  const res = await secureFetch('/auth/vault-privacy', {
    method: 'PUT',
    body: JSON.stringify(policy),
  });
  if (!res.ok) throw new Error('Could not save privacy settings');
  const json = (await res.json()) as VaultPrivacyPolicy;
  setCachedVaultPrivacy(json);
  return json;
}

export async function fetchVaultZkCiphertext(
  sectionId: string,
): Promise<string | null> {
  const res = await secureFetch(
    `/auth/vault-privacy/zk/${encodeURIComponent(sectionId)}`,
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json?.ciphertext || null;
}

export async function saveVaultZkCiphertext(
  sectionId: string,
  ciphertext: string | null,
): Promise<void> {
  const res = await secureFetch(
    `/auth/vault-privacy/zk/${encodeURIComponent(sectionId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ ciphertext }),
    },
  );
  if (!res.ok) throw new Error('Could not save zero-knowledge fields');
}
