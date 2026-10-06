import * as SecureStore from 'expo-secure-store';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  isNotificationPreferences,
  notificationPreferenceKey,
  type NotificationPreferences,
} from './notification-model';

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

