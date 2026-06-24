export const AI_UPLOAD_DETECTION_HINT =
  'System automatically detects the correct section from your document.';

export const AI_SUPPORTED_UPLOAD_CATEGORIES = [
  'Personal Information',
  'Employment & Income',
  'Education History',
  'Insurance & Vehicles',
  'Banking & Investments',
  'Healthcare',
  'Legal Documents',
  'Assets & Estate Planning',
] as const;

export const AI_PENDING_ROUTED_HINT =
  'Your document is ready here. Auto-fill will run automatically — no need to read or upload again.';

export const AI_GUIDED_NAVIGATION_EVENT = 'orderly-ai-guided-navigation';

export type AiGuidedNavigationDetail = {
  sectionLabel: string;
  durationMs?: number;
};

export function scrollToAiUploadZone() {
  const highlighted = document.querySelector('[data-ai-upload-zone="highlight"]');
  if (highlighted) {
    highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return highlighted;
  }

  const zone = document.querySelector('[data-ai-upload-zone]');
  zone?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return zone;
}

export function triggerAiAutofillButton() {
  const highlightedZone = document.querySelector(
    '[data-ai-upload-zone="highlight"]',
  );
  const scopedButton = highlightedZone?.querySelector(
    '[data-ai-autofill-trigger]:not(:disabled)',
  ) as HTMLButtonElement | null;

  if (scopedButton) {
    scopedButton.click();
    return true;
  }

  const button = document.querySelector(
    '[data-ai-autofill-trigger]:not(:disabled)',
  ) as HTMLButtonElement | null;

  if (button) {
    button.click();
    return true;
  }

  return false;
}

export function triggerAiAutofillWhenReady(maxWaitMs = 6000) {
  const start = Date.now();

  const attempt = () => {
    if (triggerAiAutofillButton()) {
      return;
    }

    if (Date.now() - start < maxWaitMs) {
      window.setTimeout(attempt, 120);
    }
  };

  attempt();
}

export function pulseAiUploadZone(durationMs = 4500) {
  const zone =
    document.querySelector('[data-ai-upload-zone="highlight"]') ||
    document.querySelector('[data-ai-upload-zone]');

  if (!zone || !(zone instanceof HTMLElement)) {
    return;
  }

  zone.setAttribute('data-ai-guided-pulse', 'active');
  window.setTimeout(() => {
    zone.removeAttribute('data-ai-guided-pulse');
  }, durationMs);
}

export function runGuidedNavigationToUpload(
  sectionLabel: string,
  options?: { autofill?: boolean; durationMs?: number },
) {
  const durationMs = options?.durationMs ?? 4500;

  scrollToAiUploadZone();
  pulseAiUploadZone(durationMs);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<AiGuidedNavigationDetail>(AI_GUIDED_NAVIGATION_EVENT, {
        detail: { sectionLabel, durationMs },
      }),
    );
  }

  if (options?.autofill !== false) {
    window.setTimeout(() => triggerAiAutofillWhenReady(), 280);
  }
}
