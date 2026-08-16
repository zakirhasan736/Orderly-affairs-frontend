import {
  resolveVaultPrivacyMode,
  type VaultPrivacyMode,
} from '@/utils/vaultPrivacyPolicy';
import {
  last4ServerPayload,
  sensitiveHandling,
} from '@/utils/vaultSensitiveFields';

const DEVICE_KEY = 'oa_device_vault_fields_v1';

type DeviceStore = Record<string, unknown>;

function readDeviceStore(): DeviceStore {
  try {
    const raw = localStorage.getItem(DEVICE_KEY);
    return raw ? (JSON.parse(raw) as DeviceStore) : {};
  } catch {
    return {};
  }
}

function writeDeviceStore(store: DeviceStore) {
  localStorage.setItem(DEVICE_KEY, JSON.stringify(store));
}

function clone<T>(value: T): T {
  return value == null ? value : (JSON.parse(JSON.stringify(value)) as T);
}

export function loadDeviceSection(sectionId: string): unknown {
  return clone(readDeviceStore()[sectionId] ?? {});
}

export function saveDeviceSection(sectionId: string, payload: unknown) {
  const store = readDeviceStore();
  store[sectionId] = payload ?? {};
  writeDeviceStore(store);
}

function modeFor(
  sectionId: string,
  subsectionId: string,
  fieldKey?: string,
): VaultPrivacyMode {
  return resolveVaultPrivacyMode({
    sectionId,
    subsectionId,
    fieldKey: fieldKey || null,
  });
}

function splitRecord(
  sectionId: string,
  subsectionId: string,
  record: Record<string, unknown>,
) {
  const server: Record<string, unknown> = {};
  const device: Record<string, unknown> = {};
  const zk: Record<string, unknown> = {};
  Object.entries(record).forEach(([key, value]) => {
    const handling = sensitiveHandling(sectionId, key);
    if (handling === 'document') {
      device[key] = value;
      return;
    }
    if (handling === 'credential') {
      zk[key] = value;
      return;
    }
    if (handling === 'secret_last4') {
      server[key] = last4ServerPayload(value);
      zk[key] = value;
      return;
    }
    const mode = modeFor(sectionId, subsectionId, key);
    if (mode === 'device_only') device[key] = value;
    else if (mode === 'zero_knowledge') zk[key] = value;
    else server[key] = value;
  });
  return { server, device, zk };
}

function mergeRecord(
  server: Record<string, unknown>,
  extra: Record<string, unknown>,
) {
  return { ...server, ...extra };
}

export function splitSectionPayload(sectionId: string, payload: unknown) {
  const source =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const server: Record<string, unknown> = {};
  const device: Record<string, unknown> = {};
  const zk: Record<string, unknown> = {};

  Object.entries(source).forEach(([key, value]) => {
    const subMode = modeFor(sectionId, key);
    if (subMode === 'device_only') {
      device[key] = value;
      return;
    }
    if (subMode === 'zero_knowledge') {
      zk[key] = value;
      return;
    }
    if (Array.isArray(value)) {
      const serverItems: unknown[] = [];
      const deviceItems: unknown[] = [];
      const zkItems: unknown[] = [];
      value.forEach(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          serverItems.push(item);
          deviceItems.push({});
          zkItems.push({});
          return;
        }
        const parts = splitRecord(
          sectionId,
          key,
          item as Record<string, unknown>,
        );
        serverItems.push(parts.server);
        deviceItems.push(parts.device);
        zkItems.push(parts.zk);
      });
      server[key] = serverItems;
      if (deviceItems.some(item => item && Object.keys(item as object).length)) {
        device[key] = deviceItems;
      }
      if (zkItems.some(item => item && Object.keys(item as object).length)) {
        zk[key] = zkItems;
      }
      return;
    }
    if (value && typeof value === 'object') {
      const parts = splitRecord(sectionId, key, value as Record<string, unknown>);
      server[key] = parts.server;
      if (Object.keys(parts.device).length) device[key] = parts.device;
      if (Object.keys(parts.zk).length) zk[key] = parts.zk;
      return;
    }
    server[key] = value;
  });

  return { server, device, zk };
}

function mergeBranch(serverVal: unknown, extraVal: unknown): unknown {
  if (Array.isArray(serverVal) || Array.isArray(extraVal)) {
    const serverArr = Array.isArray(serverVal) ? serverVal : [];
    const extraArr = Array.isArray(extraVal) ? extraVal : [];
    const len = Math.max(serverArr.length, extraArr.length);
    const next: unknown[] = [];
    for (let i = 0; i < len; i += 1) {
      const a = serverArr[i];
      const b = extraArr[i];
      if (a && typeof a === 'object' && !Array.isArray(a) && b && typeof b === 'object' && !Array.isArray(b)) {
        next.push(mergeRecord(a as Record<string, unknown>, b as Record<string, unknown>));
      } else {
        next.push(b ?? a);
      }
    }
    return next;
  }
  if (
    serverVal &&
    typeof serverVal === 'object' &&
    extraVal &&
    typeof extraVal === 'object' &&
    !Array.isArray(serverVal) &&
    !Array.isArray(extraVal)
  ) {
    return mergeRecord(
      serverVal as Record<string, unknown>,
      extraVal as Record<string, unknown>,
    );
  }
  return extraVal ?? serverVal;
}

export function mergeSectionPayload(
  serverPayload: unknown,
  devicePayload: unknown,
  zkPayload: unknown,
) {
  const server =
    serverPayload && typeof serverPayload === 'object' && !Array.isArray(serverPayload)
      ? { ...(serverPayload as Record<string, unknown>) }
      : {};
  const extras = [devicePayload, zkPayload];
  extras.forEach(extra => {
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return;
    Object.entries(extra as Record<string, unknown>).forEach(([key, value]) => {
      server[key] = mergeBranch(server[key], value);
    });
  });
  return server;
}
