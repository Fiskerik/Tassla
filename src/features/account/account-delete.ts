import * as SecureStore from 'expo-secure-store';
import { FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';

export type AccountDeleteResult =
  | { status: 'confirmed' }
  | { status: 'failed' }
  | { status: 'unknown' }
  | { status: 'unavailable' };

export interface CapturedAccountSession {
  ownerId: string;
  accessToken: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pendingKey(ownerId: string): string {
  if (!UUID_PATTERN.test(ownerId)) throw new Error('Invalid account owner');
  return 'tassla.account-deletion.v1.' + ownerId.toLowerCase();
}

export async function readAccountDeletionMarker(ownerId: string): Promise<'clear' | 'pending' | 'unavailable'> {
  try {
    const stored = await SecureStore.getItemAsync(pendingKey(ownerId));
    return stored === null ? 'clear' : 'pending';
  } catch {
    return 'unavailable';
  }
}

export async function hasUnresolvedAccountDeletion(ownerId: string): Promise<boolean> {
  return (await readAccountDeletionMarker(ownerId)) !== 'clear';
}

async function clearPendingMarker(ownerId: string): Promise<void> {
  await SecureStore.deleteItemAsync(pendingKey(ownerId));
}

function isConfirmedReceipt(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const receipt = value as Record<string, unknown>;
  return Object.keys(receipt).length === 1 && receipt.status === 'deleted';
}

function definiteHttpFailure(error: unknown): boolean {
  if (!(error instanceof FunctionsHttpError)) return false;
  const context: unknown = error.context;
  if (!context || typeof context !== 'object' || !('status' in context)) return false;
  const status = context.status;
  return typeof status === 'number' && [400, 401, 403, 405, 409].includes(status);
}

export async function requestAccountDeletion(
  client: SupabaseClient,
  captured: CapturedAccountSession,
  isCurrent: () => boolean,
): Promise<AccountDeleteResult> {
  if (!isCurrent() || !UUID_PATTERN.test(captured.ownerId) || !captured.accessToken
    || captured.accessToken.length > 8192 || /\s/.test(captured.accessToken)) return { status: 'unavailable' };

  let previous: string | null;
  try {
    previous = await SecureStore.getItemAsync(pendingKey(captured.ownerId));
  } catch {
    return { status: 'unavailable' };
  }
  if (!isCurrent()) return { status: 'unavailable' };
  if (previous !== null) return { status: 'unknown' };

  try {
    await SecureStore.setItemAsync(pendingKey(captured.ownerId), 'pending');
  } catch {
    return { status: 'unavailable' };
  }
  if (!isCurrent()) {
    try { await clearPendingMarker(captured.ownerId); } catch { /* Keep local state scoped to captured owner. */ }
    return { status: 'unavailable' };
  }

  try {
    const { data, error } = await client.functions.invoke<unknown>('delete-account', {
      headers: { Authorization: 'Bearer ' + captured.accessToken },
    });
    if (!isCurrent()) return { status: 'unknown' };
    if (error) {
      if (definiteHttpFailure(error)) {
        try { await clearPendingMarker(captured.ownerId); } catch { return { status: 'unavailable' }; }
        return isCurrent() ? { status: 'failed' } : { status: 'unavailable' };
      }
      return { status: 'unknown' };
    }
    if (!isConfirmedReceipt(data)) return { status: 'unknown' };
    try { await clearPendingMarker(captured.ownerId); } catch { /* Server success remains confirmed; local cleanup is reported separately. */ }
    return isCurrent() ? { status: 'confirmed' } : { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
}
