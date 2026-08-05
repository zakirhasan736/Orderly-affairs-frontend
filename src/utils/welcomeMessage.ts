/** First name (or email local-part) for greeting copy. */
export function resolveWelcomeFirstName(
  fullName?: string | null,
  email?: string | null,
): string | null {
  const raw = (fullName || '').trim();
  if (raw) {
    const first = raw.split(/\s+/)[0];
    return first || null;
  }
  if (email) {
    const local = email
      .split('@')[0]
      ?.replace(/[._+-]+/g, ' ')
      .trim();
    const first = local?.split(/\s+/)[0];
    if (!first) return null;
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  return null;
}

/** Toast / banner copy: first sign-in vs returning user. */
export function buildWelcomeMessage(options: {
  fullName?: string | null;
  email?: string | null;
  returning?: boolean;
}): string {
  const name = resolveWelcomeFirstName(options.fullName, options.email);
  const returning = options.returning !== false;
  if (name) {
    return returning ? `Welcome back, ${name}` : `Welcome, ${name}`;
  }
  return returning ? 'Welcome back' : 'Welcome';
}
