/**
 * Client-side E2EE for vault sections.
 * DEK never leaves the browser in plaintext. Server stores wrapped DEK only.
 */

const SESSION_KEY = 'oa_e2ee_dek_b64';
const META_KEY = 'oa_e2ee_meta';
const KDF_ITERATIONS = 310_000;

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
  return Boolean(sessionStorage.getItem(SESSION_KEY));
}

export function lockE2ee(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(META_KEY);
}

export function rememberDek(dek: Uint8Array): void {
  sessionStorage.setItem(SESSION_KEY, b64encode(dek));
}

export function loadDekBytes(): Uint8Array | null {
  const b64 = sessionStorage.getItem(SESSION_KEY);
  if (!b64) return null;
  return b64decode(b64);
}

export async function encryptJson(plaintext: unknown): Promise<string> {
  const dek = loadDekBytes();
  if (!dek) throw new Error('Vault locked — sign in again to unlock E2EE');
  const key = await importAesKey(dek);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(plaintext ?? {}));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const packed = new Uint8Array(iv.length + ct.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ct), iv.length);
  return b64encode(packed);
}

export async function decryptJson<T = Record<string, unknown>>(
  ciphertextB64: string,
): Promise<T> {
  const dek = loadDekBytes();
  if (!dek) throw new Error('Vault locked — sign in again to unlock E2EE');
  const key = await importAesKey(dek);
  const packed = b64decode(ciphertextB64);
  const iv = packed.slice(0, 12);
  const ct = packed.slice(12);
  const raw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
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
    const wk = await deriveWrappingKey(
      password,
      status.salt_b64!,
      status.kdf_iterations || KDF_ITERATIONS,
    );
    const dek = await unwrapDek(status.wrapped_dek_b64!, wk);
    rememberDek(dek);
    return { created: false };
  }

  // Next-of-Kin cannot create an owner envelope — wait for owner nok-wrap.
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
  rememberDek(dek);
  return { created: true };
}

/**
 * Re-wrap the in-session DEK under a new password (password change while unlocked).
 */
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

/** Wrap current DEK for a NOK using their master password. */
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

export { KDF_ITERATIONS, b64encode, b64decode };
