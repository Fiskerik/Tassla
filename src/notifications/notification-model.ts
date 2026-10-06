import type { PlannedHealthRecord } from '../data/workspace-data';

export const REMINDER_FEATURE = 'tassla-reminders-v1' as const;
export const MAX_HEALTH_REMINDERS = 40;
export const MAX_TRAINING_REMINDERS = 1;
export const GENERIC_REMINDER_TITLE = 'En påminnelse från Tassla';
export const GENERIC_REMINDER_BODY = 'Öppna Tassla för att se din påminnelse.';

export interface NotificationPreferences {
  version: 1;
  enabled: boolean;
  trainingEnabled: boolean;
  trainingMinutes: number;
}
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  version: 1, enabled: false, trainingEnabled: false, trainingMinutes: 9 * 60,
};
export type ReminderTarget = 'health' | 'training';
export interface ReminderPayload {
  feature: typeof REMINDER_FEATURE;
  ownerId: string;
  dogId: string;
  target: ReminderTarget;
  planId?: string;
}
export type LocalFireTime =
  | { status: 'scheduled'; date: Date }
  | { status: 'passed-time' }
  | { status: 'unrepresentable' };

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
export function isReminderMinutes(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1439;
}
export function isNotificationPreferences(value: unknown): value is NotificationPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return Object.keys(row).sort().join(',') === 'enabled,trainingEnabled,trainingMinutes,version'
    && row.version === 1 && typeof row.enabled === 'boolean' && typeof row.trainingEnabled === 'boolean'
    && isReminderMinutes(row.trainingMinutes);
}
export function notificationPreferenceKey(ownerId: string): string {
  if (!isUuid(ownerId)) throw new Error('Invalid notification owner');
  return 'tassla.notifications.v1.' + ownerId.toLowerCase();
}
export function reminderLogicalKey(payload: ReminderPayload): string | null {
  if (payload.feature !== REMINDER_FEATURE || !isUuid(payload.ownerId) || !isUuid(payload.dogId)) return null;
  if (payload.target === 'health' && isUuid(payload.planId)) {
    return REMINDER_FEATURE + ':health:' + payload.ownerId.toLowerCase() + ':' + payload.dogId.toLowerCase() + ':' + payload.planId.toLowerCase();
  }
  if (payload.target === 'training' && payload.planId === undefined) {
    return REMINDER_FEATURE + ':training:' + payload.ownerId.toLowerCase() + ':' + payload.dogId.toLowerCase();
  }
  return null;
}
export function parseReminderPayload(value: unknown): ReminderPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const keys = Object.keys(row).sort().join(',');
  if (row.feature !== REMINDER_FEATURE || !isUuid(row.ownerId) || !isUuid(row.dogId)) return null;
  if (row.target === 'health' && keys === 'dogId,feature,ownerId,planId,target' && isUuid(row.planId)) {
    return { feature: REMINDER_FEATURE, ownerId: row.ownerId, dogId: row.dogId, target: 'health', planId: row.planId };
  }
  if (row.target === 'training' && keys === 'dogId,feature,ownerId,target') {
    return { feature: REMINDER_FEATURE, ownerId: row.ownerId, dogId: row.dogId, target: 'training' };
  }
  return null;
}
export function createLocalFireTime(dueOn: string, minutes: number, now = new Date()): LocalFireTime {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueOn) || !isReminderMinutes(minutes)) return { status: 'unrepresentable' };
  const [year, month, day] = dueOn.split('-').map(Number);
  const hour = Math.floor(minutes / 60), minute = minutes % 60;
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day
    || date.getHours() !== hour || date.getMinutes() !== minute) return { status: 'unrepresentable' };
  return date.getTime() <= now.getTime() ? { status: 'passed-time' } : { status: 'scheduled', date };
}
export function createNextTrainingFireTime(minutes: number, now = new Date()): LocalFireTime {
  if (!isReminderMinutes(minutes)) return { status: 'unrepresentable' };
  const toLocalDate = (date: Date) => date.getFullYear().toString().padStart(4, '0') + '-'
    + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
  const today = createLocalFireTime(toLocalDate(now), minutes, now);
  if (today.status === 'scheduled') return today;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return createLocalFireTime(toLocalDate(tomorrow), minutes, now);
}
export function planReminderPayload(ownerId: string, dogId: string, planId: string): ReminderPayload | null {
  const payload: ReminderPayload = { feature: REMINDER_FEATURE, ownerId, dogId, target: 'health', planId };
  return reminderLogicalKey(payload) ? payload : null;
}
export function trainingReminderPayload(ownerId: string, dogId: string): ReminderPayload | null {
  const payload: ReminderPayload = { feature: REMINDER_FEATURE, ownerId, dogId, target: 'training' };
  return reminderLogicalKey(payload) ? payload : null;
}
export function futureFireTimeForPlan(record: PlannedHealthRecord, now = new Date()): LocalFireTime {
  if (!record.reminder_enabled || record.reminder_minutes === null) return { status: 'unrepresentable' };
  return createLocalFireTime(record.due_on, record.reminder_minutes, now);
}
