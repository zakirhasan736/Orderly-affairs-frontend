export const GO_VAULT_SECTION = 'orderly-go-section';
export const OPEN_VAULT_SUBSECTION = 'orderly-open-vault-sub';
export const HIGHLIGHT_VAULT_SECTIONS = 'orderly-highlight-vault-sections';

export function highlightVaultSections(sectionIds: string[]) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(HIGHLIGHT_VAULT_SECTIONS, {
      detail: { sectionIds: sectionIds.filter(Boolean) },
    }),
  );
}

export function goToVaultSection(sectionId: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(GO_VAULT_SECTION, { detail: { sectionId } }),
  );
}

const WRITE_NOK_LETTER_KEY = 'oa_write_nok_letter_id';

export function goToNokLetter(nokId: string) {
  if (typeof window === 'undefined' || !nokId) return;
  try {
    sessionStorage.setItem(WRITE_NOK_LETTER_KEY, nokId);
  } catch {
    /* ignore */
  }
  goToVaultSection('3');
}

export function consumeWriteNokLetterId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const id = sessionStorage.getItem(WRITE_NOK_LETTER_KEY);
    if (id) sessionStorage.removeItem(WRITE_NOK_LETTER_KEY);
    return id;
  } catch {
    return null;
  }
}

export function openVaultSubsection(sectionId: string, subId: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(OPEN_VAULT_SUBSECTION, {
      detail: { sectionId, subId },
    }),
  );
}
