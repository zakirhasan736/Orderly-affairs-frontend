/**
 * Clear, US-English AI error copy for document upload / autofill.
 * Prefer plain language over technical "busy / quota / 503" wording.
 */

export const AI_BUSY_USER_MESSAGE =
  "Our AI is finishing other documents right now. Please wait about a minute, then try again. Your upload is saved — nothing is wrong with your file.";

export const AI_GENERIC_FAIL_USER_MESSAGE =
  "We couldn't finish reading that document. Please try again in a moment.";

export function isAiBusyMessage(raw?: string | null): boolean {
  const msg = String(raw || '').toLowerCase();
  if (!msg) return false;
  return (
    /\b(busy|quota|rate.?limit|too many requests|resource.?exhausted|503|temporarily unavailable|finishing other|high demand|try again in (a )?minute)\b/.test(
      msg,
    ) || msg.includes('ai service unavailable')
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
    return AI_BUSY_USER_MESSAGE;
  }

  const lower = message.toLowerCase();
  if (/timeout|timed out|took too long/.test(lower)) {
    return "This document is taking longer than usual to read. Please wait a minute and try again — large scans often need a second pass.";
  }
  if (/expired|no longer available|not found|deleted/.test(lower)) {
    return "That upload expired or was removed. Please upload the document again.";
  }
  if (/login expired|token invalid|unauthorized|401/.test(lower)) {
    return "Your session expired. Please sign in again, then retry the upload.";
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
