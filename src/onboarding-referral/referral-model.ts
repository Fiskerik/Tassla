export interface PendingKennelReferral {
  code: string;
  capturedAt: number;
}

export const KENNEL_REFERRAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const PENDING_REFERRAL_KEY = 'tassla.pending-kennel-referral.v1';
const KENNEL_CODE_PATTERN = /^[A-Z0-9-]{4,40}$/;

export interface KeyValueStorage {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export function normalizeKennelCode(value: string): string | null {
  const code = value.trim().toUpperCase();
  return KENNEL_CODE_PATTERN.test(code) ? code : null;
}

export function parseKennelJoinUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== 'tassla:' || url.hostname !== 'join'
    || (url.pathname !== '' && url.pathname !== '/')
    || url.username || url.password || url.hash) return null;

  const entries = Array.from(url.searchParams.entries());
  if (entries.length !== 1 || entries[0]?.[0] !== 'code') return null;
  return normalizeKennelCode(entries[0][1]);
}

export function createPendingReferral(code: string, capturedAt = Date.now()): PendingKennelReferral | null {
  const normalized = normalizeKennelCode(code);
  if (!normalized || !Number.isFinite(capturedAt)) return null;
  return { code: normalized, capturedAt };
}

export function parsePendingReferral(value: string, now = Date.now()): PendingKennelReferral | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const row = parsed as Record<string, unknown>;
  if (Object.keys(row).length !== 2 || !Object.hasOwn(row, 'code') || !Object.hasOwn(row, 'capturedAt')
    || typeof row.code !== 'string' || typeof row.capturedAt !== 'number'
    || !Number.isFinite(row.capturedAt) || row.capturedAt > now
    || now - row.capturedAt > KENNEL_REFERRAL_TTL_MS) return null;
  const code = normalizeKennelCode(row.code);
  return code ? { code, capturedAt: row.capturedAt } : null;
}

export async function savePendingReferral(
  storage: KeyValueStorage,
  code: string,
  capturedAt = Date.now(),
): Promise<boolean> {
  const referral = createPendingReferral(code, capturedAt);
  if (!referral) return false;
  await storage.setItemAsync(PENDING_REFERRAL_KEY, JSON.stringify(referral));
  return true;
}

export async function readPendingReferral(
  storage: KeyValueStorage,
  now = Date.now(),
): Promise<PendingKennelReferral | null> {
  const value = await storage.getItemAsync(PENDING_REFERRAL_KEY);
  if (value === null) return null;
  const referral = parsePendingReferral(value, now);
  if (!referral) await clearPendingReferral(storage);
  return referral;
}

export function clearPendingReferral(storage: KeyValueStorage): Promise<void> {
  return storage.deleteItemAsync(PENDING_REFERRAL_KEY);
}
