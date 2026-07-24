/**
 * Pure Access Management wizard validation.
 * Used by AccessManagement UI and unit tests.
 */

export type AccessLevelOption = 'Full Kit Access' | 'Section-Specific Access';

export type AccessPersonDraft = {
  full_name?: string | null;
  email?: string | null;
  relationship?: string | null;
  access_level?: AccessLevelOption | string | null;
  authorized_sections?: string[] | null;
  master_password?: string | null;
  immediate_access?: boolean | null;
};

export type WizardStepId = 'person' | 'access' | 'credentials' | 'review';

export type AccessValidationResult = {
  ok: boolean;
  message?: string;
};

function isBlank(value: string | null | undefined): boolean {
  return !value || !String(value).trim();
}

function isValidEmailShape(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Step 1 — identity fields must be filled. */
export function validateAccessPersonStep(
  draft: AccessPersonDraft | null | undefined,
): AccessValidationResult {
  if (!draft) {
    return { ok: false, message: 'Person details are required' };
  }

  if (
    isBlank(draft.full_name) ||
    isBlank(draft.email) ||
    isBlank(draft.relationship)
  ) {
    return {
      ok: false,
      message: 'Full name, email, and relationship are required',
    };
  }

  if (!isValidEmailShape(draft.email || '')) {
    return { ok: false, message: 'Enter a valid email address' };
  }

  return { ok: true };
}

/** Step 2 — section-specific access needs at least one section. */
export function validateAccessSectionsStep(
  draft: AccessPersonDraft | null | undefined,
): AccessValidationResult {
  if (!draft) {
    return { ok: false, message: 'Access details are required' };
  }

  if (draft.access_level === 'Section-Specific Access') {
    const sections = draft.authorized_sections || [];
    if (sections.length === 0) {
      return {
        ok: false,
        message: 'Select at least one section for section-specific access',
      };
    }
  }

  return { ok: true };
}

/** Step 3 — master/login password required. */
export function validateAccessCredentialsStep(
  draft: AccessPersonDraft | null | undefined,
): AccessValidationResult {
  if (!draft) {
    return { ok: false, message: 'Credentials are required' };
  }

  if (isBlank(draft.master_password)) {
    return {
      ok: false,
      message: draft.immediate_access
        ? 'Generate or enter a login password'
        : 'Generate or enter a master password',
    };
  }

  return { ok: true };
}

export function validateAccessWizardStep(
  stepId: WizardStepId | undefined,
  draft: AccessPersonDraft | null | undefined,
): AccessValidationResult {
  if (!stepId) return { ok: false, message: 'Unknown wizard step' };

  switch (stepId) {
    case 'person':
      return validateAccessPersonStep(draft);
    case 'access':
      return validateAccessSectionsStep(draft);
    case 'credentials':
      return validateAccessCredentialsStep(draft);
    case 'review':
      return { ok: true };
    default:
      return { ok: false, message: 'Unknown wizard step' };
  }
}

/** Full save gate — all steps must pass. */
export function validateAccessPersonForSave(
  draft: AccessPersonDraft | null | undefined,
): AccessValidationResult {
  for (const step of ['person', 'access', 'credentials'] as WizardStepId[]) {
    const result = validateAccessWizardStep(step, draft);
    if (!result.ok) return result;
  }
  return { ok: true };
}

export function isDuplicateAccessEmail(
  email: string,
  people: Array<{ email?: string | null }>,
  options?: { excludeIndex?: number },
): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  return people.some((candidate, idx) => {
    if (options?.excludeIndex !== undefined && options.excludeIndex === idx) {
      return false;
    }
    return (candidate.email || '').trim().toLowerCase() === normalized;
  });
}
