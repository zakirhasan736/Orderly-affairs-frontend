/**
 * Client-side E2EE for vault sections.
 * DEK never leaves the browser in plaintext. Server stores wrapped DEK only.
 *
 * AES-256-GCM is used for both legacy server v2 and client v3 — the difference
 * is key custody (server key vs browser DEK), not cipher strength.
 *
 * DEK is held in memory while unlocked. A tab-scoped sessionStorage copy
 * restores after soft/hard reload in the same tab so vault sections stay
 * readable after login. Cleared on idle lock, hidden-tab lock, and logout.
 */

const META_KEY = 'oa_e2ee_meta';
const SESSION_DEK_KEY = 'oa_e2ee_session_dek';
const KDF_ITERATIONS = 310_000;
const IDLE_LOCK_MS = 20 * 60 * 1000;
const HIDDEN_LOCK_MS = 2 * 60 * 1000;

/** In-tab only — cleared on lock / logout / full page reload. */
let _dekBytes: Uint8Array | null = null;
/** Non-extractable key for encrypt/decrypt (XSS cannot export raw bits easily). */
let _dekKey: CryptoKey | null = null;

let _idleTimer: ReturnType<typeof setTimeout> | null = null;
let _hiddenTimer: ReturnType<typeof setTimeout> | null = null;
let _activityBound = false;
let _onAutoLock: (() => void) | null = null;

function b64encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  bytes.forEach(b => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

function b64decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function importAesKey(raw: ArrayBuffer | Uint8Array): Promise<CryptoKey> {
  const keyData =
    raw instanceof Uint8Array
      ? (raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer)
      : raw;
  return crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

function clearIdleTimers(): void {
  if (_idleTimer) {
    clearTimeout(_idleTimer);
    _idleTimer = null;
  }
  if (_hiddenTimer) {
    clearTimeout(_hiddenTimer);
    _hiddenTimer = null;
  }
}

function bumpIdleTimer(): void {
  if (!_dekBytes || typeof window === 'undefined') return;
  if (_idleTimer) clearTimeout(_idleTimer);
  _idleTimer = setTimeout(() => {
    lockE2ee();
    _onAutoLock?.();
  }, IDLE_LOCK_MS);
}

function onVisibilityChange(): void {
  if (typeof document === 'undefined') return;
  if (document.visibilityState === 'hidden') {
    if (_hiddenTimer) clearTimeout(_hiddenTimer);
    _hiddenTimer = setTimeout(() => {
      if (document.visibilityState === 'hidden') {
        lockE2ee();
        _onAutoLock?.();
      }
    }, HIDDEN_LOCK_MS);
  } else {
    if (_hiddenTimer) {
      clearTimeout(_hiddenTimer);
      _hiddenTimer = null;
    }
    bumpIdleTimer();
  }
}

function bindActivityListeners(): void {
  if (typeof window === 'undefined' || _activityBound) return;
  _activityBound = true;
  const bump = () => bumpIdleTimer();
  window.addEventListener('pointerdown', bump, { passive: true });
  window.addEventListener('keydown', bump, { passive: true });
  window.addEventListener('scroll', bump, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
}

/** Optional UI hook when idle/hidden auto-lock fires. */
export function setE2eeAutoLockHandler(handler: (() => void) | null): void {
  _onAutoLock = handler;
}

export async function deriveWrappingKey(
  password: string,
  saltB64: string,
  iterations = KDF_ITERATIONS,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: b64decode(saltB64) as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function generateDek(): Promise<Uint8Array> {
  const dek = new Uint8Array(32);
  crypto.getRandomValues(dek);
  return dek;
}

export async function wrapDek(
  dek: Uint8Array,
  wrappingKey: CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    dek as BufferSource,
  );
  const packed = new Uint8Array(iv.length + ct.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ct), iv.length);
  return b64encode(packed);
}

export async function unwrapDek(
  wrappedB64: string,
  wrappingKey: CryptoKey,
): Promise<Uint8Array> {
  const packed = b64decode(wrappedB64);
  const iv = packed.slice(0, 12);
  const ct = packed.slice(12);
  const raw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    ct,
  );
  return new Uint8Array(raw);
}

export function isE2eeUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  return _dekBytes != null && _dekBytes.byteLength === 32 && _dekKey != null;
}

export function lockE2ee(): void {
  clearIdleTimers();
  if (_dekBytes) {
    _dekBytes.fill(0);
    _dekBytes = null;
  }
  _dekKey = null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_DEK_KEY);
      sessionStorage.removeItem('oa_e2ee_dek_b64');
      sessionStorage.removeItem(META_KEY);
    } catch {
      /* ignore */
    }
  }
}

export async function rememberDek(dek: Uint8Array): Promise<void> {
  if (_dekBytes) _dekBytes.fill(0);
  _dekBytes = new Uint8Array(dek);
  _dekKey = await importAesKey(_dekBytes);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(SESSION_DEK_KEY, b64encode(_dekBytes));
      sessionStorage.removeItem('oa_e2ee_dek_b64');
    } catch {
      /* ignore quota / private mode */
    }
    bindActivityListeners();
    bumpIdleTimer();
  }
}

/** Restore DEK after a same-tab reload (login soft-nav / refresh). */
export async function tryRestoreSessionDek(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isE2eeUnlocked()) return true;
  try {
    const raw = sessionStorage.getItem(SESSION_DEK_KEY);
    if (!raw) return false;
    const dek = b64decode(raw);
    if (dek.byteLength !== 32) {
      sessionStorage.removeItem(SESSION_DEK_KEY);
      return false;
    }
    await rememberDek(dek);
    return isE2eeUnlocked();
  } catch {
    try {
      sessionStorage.removeItem(SESSION_DEK_KEY);
    } catch {
      /* ignore */
    }
    return false;
  }
}

/** Copy of raw DEK for wrap/rewrap only — prefer encryptJson/decryptJson otherwise. */
export function loadDekBytes(): Uint8Array | null {
  if (!_dekBytes || _dekBytes.byteLength !== 32) return null;
  return new Uint8Array(_dekBytes);
}

export async function encryptJson(plaintext: unknown): Promise<string> {
  if (!_dekKey) throw new Error('Vault locked — sign in again to unlock E2EE');
  bumpIdleTimer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(plaintext ?? {}));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, _dekKey, data);
  const packed = new Uint8Array(iv.length + ct.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ct), iv.length);
  return b64encode(packed);
}

export async function decryptJson<T = Record<string, unknown>>(
  ciphertextB64: string,
): Promise<T> {
  if (!_dekKey) throw new Error('Vault locked — sign in again to unlock E2EE');
  bumpIdleTimer();
  const packed = b64decode(ciphertextB64);
  const iv = packed.slice(0, 12);
  const ct = packed.slice(12);
  const raw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    _dekKey,
    ct,
  );
  return JSON.parse(new TextDecoder().decode(raw)) as T;
}

export type E2eeStatus = {
  enabled: boolean;
  configured?: boolean;
  needs_setup?: boolean;
  role?: string;
  salt_b64?: string;
  wrapped_dek_b64?: string;
  kdf_iterations?: number;
};

/** After password login: unlock existing envelope or create a new DEK. */
export async function unlockOrSetupE2ee(
  password: string,
  fetchStatus: () => Promise<E2eeStatus>,
  postSetup: (body: {
    salt_b64: string;
    wrapped_dek_b64: string;
    kdf: string;
    kdf_iterations: number;
    wrap_alg: string;
  }) => Promise<unknown>,
): Promise<{ created: boolean }> {
  const status = await fetchStatus();
  if (!status.enabled) {
    lockE2ee();
    return { created: false };
  }

  const canUnwrap =
    status.configured &&
    !status.needs_setup &&
    status.salt_b64 &&
    status.wrapped_dek_b64;

  if (canUnwrap) {
    try {
      const wk = await deriveWrappingKey(
        password,
        status.salt_b64!,
        status.kdf_iterations || KDF_ITERATIONS,
      );
      const dek = await unwrapDek(status.wrapped_dek_b64!, wk);
      await rememberDek(dek);
      return { created: false };
    } catch {
      lockE2ee();
      throw new Error(
        'Could not unlock vault with this password. If you are a family member, ask the owner to re-save your invite password while their vault is unlocked.',
      );
    }
  }

  if (status.role === 'nextkin') {
    lockE2ee();
    return { created: false };
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const salt_b64 = b64encode(salt);
  const dek = await generateDek();
  const wk = await deriveWrappingKey(password, salt_b64, KDF_ITERATIONS);
  const wrapped_dek_b64 = await wrapDek(dek, wk);
  await postSetup({
    salt_b64,
    wrapped_dek_b64,
    kdf: 'PBKDF2-SHA256',
    kdf_iterations: KDF_ITERATIONS,
    wrap_alg: 'AES-GCM',
  });
  await rememberDek(dek);
  return { created: true };
}

export async function rewrapDekForNewPassword(newPassword: string): Promise<{
  salt_b64: string;
  wrapped_dek_b64: string;
  kdf: string;
  kdf_iterations: number;
  wrap_alg: string;
}> {
  const dek = loadDekBytes();
  if (!dek) throw new Error('Unlock vault before re-wrapping');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const salt_b64 = b64encode(salt);
  const wk = await deriveWrappingKey(newPassword, salt_b64, KDF_ITERATIONS);
  const wrapped_dek_b64 = await wrapDek(dek, wk);
  return {
    salt_b64,
    wrapped_dek_b64,
    kdf: 'PBKDF2-SHA256',
    kdf_iterations: KDF_ITERATIONS,
    wrap_alg: 'AES-GCM',
  };
}

export async function wrapDekForNokPassword(nokPassword: string): Promise<{
  salt_b64: string;
  wrapped_dek_b64: string;
  kdf: string;
  kdf_iterations: number;
  wrap_alg: string;
}> {
  const dek = loadDekBytes();
  if (!dek) throw new Error('Unlock your vault before sharing E2EE with NOK');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const salt_b64 = b64encode(salt);
  const wk = await deriveWrappingKey(nokPassword, salt_b64, KDF_ITERATIONS);
  const wrapped_dek_b64 = await wrapDek(dek, wk);
  return {
    salt_b64,
    wrapped_dek_b64,
    kdf: 'PBKDF2-SHA256',
    kdf_iterations: KDF_ITERATIONS,
    wrap_alg: 'AES-GCM',
  };
}

export { KDF_ITERATIONS, b64encode, b64decode, IDLE_LOCK_MS, HIDDEN_LOCK_MS };
