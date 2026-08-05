/**
 * Vault fields often store upload wrappers:
 * `{ text: "VIN…", files: [], deleted_files: [] }`
 * NOK / read-only views must show plain text, not raw JSON.
 */

export type VaultUploadFile = {
  url?: string;
  secure_url?: string;
  name?: string;
  original_filename?: string;
  public_id?: string;
};

export function isVaultUploadField(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    'text' in record ||
    'files' in record ||
    'deleted_files' in record ||
    '_deleted_files' in record
  );
}

export function vaultFieldPlainText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map(vaultFieldPlainText).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (isVaultUploadField(record)) {
      return vaultFieldPlainText(record.text);
    }
    for (const key of ['label', 'name', 'value', 'title']) {
      const nested = vaultFieldPlainText(record[key]);
      if (nested) return nested;
    }
  }
  return '';
}

export function vaultUploadFiles(value: unknown): VaultUploadFile[] {
  if (!isVaultUploadField(value)) return [];
  const files = (value as { files?: unknown }).files;
  if (!Array.isArray(files)) return [];
  return files.filter(
    (f): f is VaultUploadFile => Boolean(f) && typeof f === 'object',
  );
}

/** True when a field should be shown in NOK read views. */
export function vaultFieldHasDisplayContent(value: unknown): boolean {
  if (value == null || value === '') return false;
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim().length > 0;
  }
  if (Array.isArray(value)) return value.length > 0;
  if (isVaultUploadField(value)) {
    return (
      vaultFieldPlainText(value).length > 0 || vaultUploadFiles(value).length > 0
    );
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(
      vaultFieldHasDisplayContent,
    );
  }
  return Boolean(value);
}
