import * as SecureStore from 'expo-secure-store';
import { normalizeQuickLogLayout, type QuickLogLayout } from './quick-log-layout';

const STORAGE_PREFIX = 'tassla.quick-log-layout.v1';

export async function loadQuickLogLayout(ownerId?: string): Promise<QuickLogLayout> {
  const value = await SecureStore.getItemAsync(storageKey(ownerId));
  if (!value) return normalizeQuickLogLayout(null);
  try {
    return normalizeQuickLogLayout(JSON.parse(value));
  } catch {
    return normalizeQuickLogLayout(null);
  }
}

export function saveQuickLogLayout(layout: QuickLogLayout, ownerId?: string): Promise<void> {
  return SecureStore.setItemAsync(storageKey(ownerId), JSON.stringify(layout));
}

function storageKey(ownerId?: string): string {
  return ownerId ? `${STORAGE_PREFIX}.${ownerId}` : STORAGE_PREFIX;
}
