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

export function openVaultSubsection(sectionId: string, subId: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(OPEN_VAULT_SUBSECTION, {
      detail: { sectionId, subId },
    }),
  );
}
