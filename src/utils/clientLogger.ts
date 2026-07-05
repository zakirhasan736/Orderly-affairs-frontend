const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.NEXT_PUBLIC_HIDE_CLIENT_LOGS === 'true';

/** Dev-only log — stripped from production bundles / no-op at runtime in prod. */
export function devLog(...args: unknown[]) {
  if (!isProd) console.log(...args);
}

/** Dev-only warn. */
export function devWarn(...args: unknown[]) {
  if (!isProd) console.warn(...args);
}

/** Dev-only error (never logs raw API payloads in production). */
export function devError(context: string, err?: unknown) {
  if (isProd) return;
  if (err !== undefined) {
    console.error(context, err);
  } else {
    console.error(context);
  }
}

/**
 * Disable console output in production so attackers inspecting DevTools
 * see minimal application noise. Errors should go to server-side monitoring.
 */
export function installProductionConsoleGuard() {
  if (!isProd || typeof window === 'undefined') return;

  const noop = () => {};
  const methods = ['log', 'debug', 'info', 'warn', 'error', 'trace'] as const;

  for (const method of methods) {
    try {
      (console as unknown as Record<string, unknown>)[method] = noop;
    } catch {
      // ignore
    }
  }
}
