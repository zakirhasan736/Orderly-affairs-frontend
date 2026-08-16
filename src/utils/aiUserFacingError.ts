/**
 * Clear, US-English AI copy for document upload / autofill.
 * Never show technical busy / quota / 429 / model names to normal users.
 */

export const AI_WAITING_USER_MESSAGE =
  'Still processing your document. Please wait...';

/** @deprecated Use AI_WAITING_USER_MESSAGE — kept so older imports keep working. */
export const AI_BUSY_USER_MESSAGE = AI_WAITING_USER_MESSAGE;

export const AI_GENERIC_FAIL_USER_MESSAGE =
  "We couldn't finish reading that document. Please try again in a moment.";

const TRANSIENT_CAPACITY =
  /\b(busy|quota|rate.?limit|too many requests|resource.?exhausted|503|429|temporarily unavailable|finishing other|high demand|try again in (a )?minute|ai service unavailable)\b/i;

export function isAiBusyMessage(raw?: string | null): boolean {
  const msg = String(raw || '');
  if (!msg) return false;
  return (
    TRANSIENT_CAPACITY.test(msg) ||
    msg.toLowerCase().includes(AI_WAITING_USER_MESSAGE.toLowerCase())
  );
}

export function isAiTransientWaitMessage(raw?: string | null): boolean {
  return isAiBusyMessage(raw);
}

function leaksTechnicalAiDetail(message: string): boolean {
  return /\b(sol|terra|luna|gpt-?4o|gpt-?5|openai|model|provider|429|503|rate.?limit|quota)\b/i.test(
    message,
  );
}

/** Map any API/raw AI error into a short message users can act on. */
export function toAiUserFacingMessage(
  raw?: unknown,
  fallback: string = AI_GENERIC_FAIL_USER_MESSAGE,
): string {
  const message =
    typeof raw === 'string'
      ? raw
      : raw instanceof Error
        ? raw.message
        : raw &&
            typeof raw === 'object' &&
            'message' in raw &&
            typeof (raw as { message?: unknown }).message === 'string'
          ? String((raw as { message: string }).message)
          : '';

  if (isAiBusyMessage(message)) {
    return AI_WAITING_USER_MESSAGE;
  }

  const lower = message.toLowerCase();
  if (/timeout|timed out|took too long/.test(lower)) {
    return AI_WAITING_USER_MESSAGE;
  }
  if (/expired|no longer available|not found|deleted/.test(lower)) {
    return 'That upload expired or was removed. Please upload the document again.';
  }
  if (/login expired|token invalid|unauthorized|401/.test(lower)) {
    return 'Your session expired. Please sign in again, then retry the upload.';
  }

  if (leaksTechnicalAiDetail(message)) {
    return fallback;
  }

  // Keep already-friendly product copy; rewrite terse/technical leftovers.
  if (
    message &&
    !/traceback|exception|stack|internal server|null|undefined|http\s*\d/i.test(
      message,
    ) &&
    message.length >= 24 &&
    message.length <= 280
  ) {
    return message;
  }

  return fallback;
}
