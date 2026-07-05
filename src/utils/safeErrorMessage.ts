/**
 * Returns a safe user-facing error message.
 * Never surfaces raw backend detail (prevents enumeration and info leaks).
 */
export function getSafeErrorMessage(_err: unknown, fallback: string): string {
  return fallback;
}
