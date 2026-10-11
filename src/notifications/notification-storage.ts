import * as SecureStore from 'expo-secure-store';
import { isUuid } from './notification-model';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  isNotificationPreferences,
  notificationPreferenceKey,
  type NotificationPreferences,
} from './notification-model';

export type FirstUseTipScreenId = 'log';
export type FirstUseTipReadResult = 'seen' | 'unseen' | 'unavailable';

const firstUseTipSessionFailures = new Set<string>();
const firstUseTipDeletedKeys = new Set<string>();
const firstUseTipOperations = new Map<string, Promise<unknown>>();

function firstUseTipKey(ownerId: string, screenId: FirstUseTipScreenId): string {
  if (!isUuid(ownerId)) throw new Error('Invalid first-use tip owner');
  return `tassla.first-use-tip.v1.${screenId}.${ownerId.toLowerCase()}`;
}

function queueFirstUseTipOperation<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = firstUseTipOperations.get(key) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  firstUseTipOperations.set(key, current);
  void current.then(() => {
    if (firstUseTipOperations.get(key) === current) firstUseTipOperations.delete(key);
  }, () => {
    if (firstUseTipOperations.get(key) === current) firstUseTipOperations.delete(key);
  });
  return current;
}

export async function readFirstUseTipStatus(ownerId: string, screenId: FirstUseTipScreenId): Promise<FirstUseTipReadResult> {
  let key: string;
  try {
    key = firstUseTipKey(ownerId, screenId);
  } catch {
    return 'unavailable';
  }
  if (firstUseTipDeletedKeys.has(key) || firstUseTipSessionFailures.has(key)) return 'unavailable';
  return queueFirstUseTipOperation(key, async () => {
    if (firstUseTipDeletedKeys.has(key) || firstUseTipSessionFailures.has(key)) return 'unavailable';
    try {
      const value = await SecureStore.getItemAsync(key);
      // A deletion or a prior operation failure while the read was pending
      // must invalidate the result rather than briefly showing the tip again.
      if (firstUseTipDeletedKeys.has(key) || firstUseTipSessionFailures.has(key)) return 'unavailable';
      if (value === null) return 'unseen';
      if (value === 'seen') return 'seen';
    } catch {
      firstUseTipSessionFailures.add(key);
      return 'unavailable';
    }
    firstUseTipSessionFailures.add(key);
    return 'unavailable';
  });
}

export async function markFirstUseTipSeen(ownerId: string, screenId: FirstUseTipScreenId): Promise<boolean> {
  let key: string;
  try {
    key = firstUseTipKey(ownerId, screenId);
  } catch {
    return false;
  }
  if (firstUseTipDeletedKeys.has(key) || firstUseTipSessionFailures.has(key)) return false;
  return queueFirstUseTipOperation(key, async () => {
    if (firstUseTipDeletedKeys.has(key) || firstUseTipSessionFailures.has(key)) return false;
    try {
      await SecureStore.setItemAsync(key, 'seen');
      if (firstUseTipDeletedKeys.has(key) || firstUseTipSessionFailures.has(key)) return false;
      return true;
    } catch {
      firstUseTipSessionFailures.add(key);
      return false;
    }
  });
}

export async function deleteFirstUseTipStatus(ownerId: string): Promise<void> {
  const key = firstUseTipKey(ownerId, 'log');
  firstUseTipDeletedKeys.add(key);
  await queueFirstUseTipOperation(key, async () => {
    await SecureStore.deleteItemAsync(key);
    firstUseTipSessionFailures.delete(key);
  });
}

export async function readNotificationPreferences(ownerId: string): Promise<NotificationPreferences> {
  const raw = await SecureStore.getItemAsync(notificationPreferenceKey(ownerId));
  if (raw === null) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  try {
    const parsed: unknown = JSON.parse(raw);
    return isNotificationPreferences(parsed) ? parsed : { ...DEFAULT_NOTIFICATION_PREFERENCES };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}
export async function writeNotificationPreferences(ownerId: string, value: NotificationPreferences): Promise<void> {
  if (!isNotificationPreferences(value)) throw new Error('Invalid notification preferences');
  await SecureStore.setItemAsync(notificationPreferenceKey(ownerId), JSON.stringify(value));
}


export async function deleteNotificationPreferences(ownerId: string): Promise<void> {
  await SecureStore.deleteItemAsync(notificationPreferenceKey(ownerId));
}
