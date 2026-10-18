import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requestKey(ownerId: string): string {
  if (!UUID_PATTERN.test(ownerId)) throw new Error('Invalid account owner');
  return `tassla.dog-creation.v1.${ownerId.toLowerCase()}`;
}

export async function readDogCreationRequestId(ownerId: string): Promise<string | null> {
  const stored = await SecureStore.getItemAsync(requestKey(ownerId));
  if (stored === null) return null;
  if (!UUID_PATTERN.test(stored)) throw new Error('Dog creation recovery data is unavailable');
  return stored;
}

export async function getOrCreateDogCreationRequestId(ownerId: string): Promise<string> {
  const key = requestKey(ownerId);
  const existing = await SecureStore.getItemAsync(key);
  if (existing !== null) {
    if (!UUID_PATTERN.test(existing)) throw new Error('Dog creation recovery data is unavailable');
    return existing;
  }

  const requestId = Crypto.randomUUID();
  await SecureStore.setItemAsync(key, requestId);
  const confirmed = await SecureStore.getItemAsync(key);
  if (confirmed !== requestId) throw new Error('Dog creation recovery data could not be saved');
  return requestId;
}

export async function clearDogCreationRequest(ownerId: string, expectedRequestId?: string): Promise<void> {
  const key = requestKey(ownerId);
  const current = await SecureStore.getItemAsync(key);
  if (current === null) return;
  if (expectedRequestId !== undefined && current !== expectedRequestId) {
    throw new Error('Dog creation request changed before cleanup');
  }
  await SecureStore.deleteItemAsync(key);
  if (await SecureStore.getItemAsync(key) !== null) throw new Error('Dog creation recovery data could not be cleared');
}
