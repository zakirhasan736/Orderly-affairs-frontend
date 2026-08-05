/**
 * Wipe vault-adjacent secrets from sessionStorage on logout / session expiry.
 * Reduces shared-machine and post-XSS exposure of AI extracts and E2EE keys.
 */

const SENSITIVE_SESSION_KEYS = [
  'orderly_dashboard_ai_patches',
  'orderly_ai_pending_uploads',
  'orderly_ai_pending_upload',
  'orderly_ai_filled_sections_by_file',
  'orderly_ai_upload_meta',
  'orderly_ai_autofill_done_sections',
  'orderly_ai_section_reviews_dismissed',
  'orderly_section_last_updated',
  'oa_e2ee_session_dek',
  'oa_e2ee_dek_b64',
  'oa_e2ee_meta',
] as const;

export function clearSensitiveClientStorage(): void {
  if (typeof window === 'undefined') return;

  for (const key of SENSITIVE_SESSION_KEYS) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  try {
    void import('@/utils/aiDocumentPreviewCache').then(
      ({ invalidateAiDocumentPreviewCache }) => {
        invalidateAiDocumentPreviewCache();
      },
    );
  } catch {
    /* ignore */
  }
}
