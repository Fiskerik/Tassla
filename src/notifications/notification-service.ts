import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PlannedHealthRecord } from '../data/workspace-data';
import {
  GENERIC_REMINDER_BODY,
  GENERIC_REMINDER_TITLE,
  MAX_HEALTH_REMINDERS,
  REMINDER_FEATURE,
  createNextTrainingFireTime,
  createLocalFireTime,
  isNotificationPreferences,
  isUuid,
  parseReminderPayload,
  planReminderPayload,
  reminderLogicalKey,
  trainingReminderPayload,
  type NotificationPreferences,
  type ReminderPayload,
} from './notification-model';
import { readNotificationPreferences, writeNotificationPreferences } from './notification-storage';

const CHANNEL_ID = 'tassla-reminders-v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export interface NativeReminderRequest {
  identifier?: string;
  content: { title?: string | null; body?: string | null; data?: Record<string, unknown> };
  trigger: Notifications.NotificationTriggerInput;
}
export interface NativeReminderAdapter {
  getAllScheduledNotificationsAsync(): Promise<Notifications.NotificationRequest[]>;
  scheduleNotificationAsync(request: NativeReminderRequest): Promise<string>;
  cancelScheduledNotificationAsync(identifier: string): Promise<void>;
  getPermissionsAsync(): Promise<Notifications.NotificationPermissionsStatus>;
  requestPermissionsAsync(): Promise<Notifications.NotificationPermissionsStatus>;
  setNotificationChannelAsync(id: string, channel: Notifications.NotificationChannelInput): Promise<Notifications.NotificationChannel | null>;
}
export const expoReminderAdapter: NativeReminderAdapter = {
  getAllScheduledNotificationsAsync: () => Notifications.getAllScheduledNotificationsAsync(),
  scheduleNotificationAsync: (request) => Notifications.scheduleNotificationAsync(request),
  cancelScheduledNotificationAsync: (identifier) => Notifications.cancelScheduledNotificationAsync(identifier),
  getPermissionsAsync: () => Notifications.getPermissionsAsync(),
  requestPermissionsAsync: () => Notifications.requestPermissionsAsync(),
  setNotificationChannelAsync: (id, channel) => Notifications.setNotificationChannelAsync(id, channel),
};

export type ReminderStatus = 'off' | 'permission-denied' | 'scheduled' | 'over-cap' | 'failed' | 'unknown';
export interface ReminderReconcileResult {
  status: ReminderStatus;
  scheduledCount: number;
  overCap: boolean;
  timezone: string;
}
export interface ReminderContext {
  ownerId: string;
  dogId: string;
  generation: number;
}
export interface ReminderReconcileInput extends ReminderContext {
  preferences: NotificationPreferences;
  plans: readonly PlannedHealthRecord[];
  now: Date;
  overCap?: boolean;
  blockedPlanIds?: ReadonlySet<string>;
}

function isGranted(permission: Notifications.NotificationPermissionsStatus): boolean {
  return permission.status === 'granted'
    || permission.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
    || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    || permission.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL;
}
function hasInstalledTriggerShape(request: Notifications.NotificationRequest, fireAt: Date): boolean {
  const trigger: unknown = request.trigger;
  if (!trigger || typeof trigger !== 'object' || !('type' in trigger) || !('repeats' in trigger) || trigger.repeats !== false) return false;
  if (trigger.type === 'date' && 'value' in trigger && typeof trigger.value === 'number') {
    return trigger.value === fireAt.getTime();
  }
  if (trigger.type !== 'calendar' || !('dateComponents' in trigger) || !trigger.dateComponents
    || typeof trigger.dateComponents !== 'object') return false;
  const components = trigger.dateComponents as Record<string, unknown>;
  const allowedKeys = new Set(['calendar', 'timeZone', 'year', 'month', 'day', 'hour', 'minute', 'second', 'isLeapMonth', 'isRepeatedDay']);
  if (Object.keys(components).some((key) => !allowedKeys.has(key))
    || (components.isLeapMonth !== undefined && components.isLeapMonth !== false)
    || (components.isRepeatedDay !== undefined && components.isRepeatedDay !== false)) return false;
  const zone = components.timeZone;
  return components.calendar === 'iso8601' && (zone === 'UTC' || zone === 'GMT')
    && components.year === fireAt.getUTCFullYear() && components.month === fireAt.getUTCMonth() + 1
    && components.day === fireAt.getUTCDate() && components.hour === fireAt.getUTCHours()
    && components.minute === fireAt.getUTCMinutes() && components.second === fireAt.getUTCSeconds();
}
function nativeTrigger(fireAt: Date): Notifications.NotificationTriggerInput {
  if (Platform.OS === 'ios') return {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR, repeats: false, timezone: 'UTC',
    year: fireAt.getUTCFullYear(), month: fireAt.getUTCMonth() + 1, day: fireAt.getUTCDate(),
    hour: fireAt.getUTCHours(), minute: fireAt.getUTCMinutes(), second: fireAt.getUTCSeconds(),
  };
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt, channelId: CHANNEL_ID };
}

function asData(payload: ReminderPayload): Record<string, unknown> {
  return payload.target === 'health'
    ? { feature: REMINDER_FEATURE, ownerId: payload.ownerId, dogId: payload.dogId, target: 'health', planId: payload.planId }
    : { feature: REMINDER_FEATURE, ownerId: payload.ownerId, dogId: payload.dogId, target: 'training' };
}
function isOwnedBy(request: Notifications.NotificationRequest, ownerId: string): ReminderPayload | null {
  const payload = parseReminderPayload(request.content.data);
  return payload && payload.ownerId.toLowerCase() === ownerId.toLowerCase() ? payload : null;
}
function exactRequest(request: Notifications.NotificationRequest, key: string, payload: ReminderPayload, fireAt: Date): boolean {
  return request.identifier === key && reminderLogicalKey(payload) === key
    && request.content.title === GENERIC_REMINDER_TITLE && request.content.body === GENERIC_REMINDER_BODY
    && hasInstalledTriggerShape(request, fireAt)
    && JSON.stringify(parseReminderPayload(request.content.data)) === JSON.stringify(payload);
}

export class ReminderService {
  private generation = 0;
  private active: { ownerId: string; dogId: string } | null = null;
  private tail: Promise<void> = Promise.resolve();

  constructor(private readonly native: NativeReminderAdapter = expoReminderAdapter) {}

  setActiveContext(ownerId: string | null, dogId: string | null): ReminderContext | null {
    this.generation += 1;
    if (!ownerId || !dogId || !isUuid(ownerId) || !isUuid(dogId)) {
      this.active = null;
      return null;
    }
    this.active = { ownerId: ownerId.toLowerCase(), dogId: dogId.toLowerCase() };
    return { ...this.active, generation: this.generation };
  }

  isCurrent(context: ReminderContext): boolean {
    return this.generation === context.generation && this.active?.ownerId === context.ownerId.toLowerCase()
      && this.active.dogId === context.dogId.toLowerCase();
  }

  async readPermission(context: ReminderContext): Promise<'granted' | 'denied' | 'unknown'> {
    if (!this.isCurrent(context)) return 'unknown';
    try {
      const permission = await this.native.getPermissionsAsync();
      if (!this.isCurrent(context)) return 'unknown';
      return isGranted(permission) ? 'granted' : 'denied';
    } catch { return 'unknown'; }
  }

  loadPreferences(ownerId: string): Promise<NotificationPreferences> {
    return readNotificationPreferences(ownerId);
  }

  savePreferences(ownerId: string, value: NotificationPreferences): Promise<void> {
    return writeNotificationPreferences(ownerId, value);
  }

  async requestPermission(context: ReminderContext): Promise<'granted' | 'denied' | 'unknown'> {
    if (!this.isCurrent(context)) return 'unknown';
    if (Platform.OS === 'android') {
      await this.native.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Påminnelser från Tassla',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      if (!this.isCurrent(context)) return 'unknown';
    }
    const current = await this.native.getPermissionsAsync();
    if (!this.isCurrent(context)) return 'unknown';
    if (isGranted(current)) return 'granted';
    if (!this.isCurrent(context)) return 'unknown';
    const requested = await this.native.requestPermissionsAsync();
    if (!this.isCurrent(context)) return 'unknown';
    return isGranted(requested) ? 'granted' : 'denied';
  }

  reconcile(input: ReminderReconcileInput): Promise<ReminderReconcileResult> {
    return this.serial(async () => await this.reconcileSerial(input));
  }

  cleanupOwner(ownerId: string): Promise<boolean> {
    const owner = ownerId.toLowerCase();
    return this.serial(async () => {
      try {
        const requests = await this.native.getAllScheduledNotificationsAsync();
        for (const request of requests) {
          const payload = isOwnedBy(request, owner);
          if (!payload) continue;
          if (payload.ownerId.toLowerCase() !== owner) continue;
          await this.native.cancelScheduledNotificationAsync(request.identifier);
        }
        return true;
      } catch {
        return false;
      }
    });
  }

  private async reconcileSerial(input: ReminderReconcileInput): Promise<ReminderReconcileResult> {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
    const current = () => this.isCurrent(input);
    if (!isUuid(input.ownerId) || !isUuid(input.dogId) || !current() || !isNotificationPreferences(input.preferences)) {
      return { status: 'unknown', scheduledCount: 0, overCap: false, timezone };
    }
    let requests: Notifications.NotificationRequest[];
    try {
      requests = await this.native.getAllScheduledNotificationsAsync();
    } catch {
      return { status: 'failed', scheduledCount: 0, overCap: false, timezone };
    }
    if (!current()) return { status: 'unknown', scheduledCount: 0, overCap: false, timezone };
    let permission: Notifications.NotificationPermissionsStatus | null;
    try { permission = await this.native.getPermissionsAsync(); } catch {
      return { status: 'failed', scheduledCount: 0, overCap: false, timezone };
    }
    if (!current()) return { status: 'unknown', scheduledCount: 0, overCap: false, timezone };
    const permissionGranted = isGranted(permission);
    if (permissionGranted && Platform.OS === 'android') {
      if (!current()) return { status: 'unknown', scheduledCount: 0, overCap: false, timezone };
      try { await this.native.setNotificationChannelAsync(CHANNEL_ID, { name: 'Påminnelser från Tassla', importance: Notifications.AndroidImportance.DEFAULT }); } catch {
        return { status: 'failed', scheduledCount: 0, overCap: false, timezone };
      }
      if (!current()) return { status: 'unknown', scheduledCount: 0, overCap: false, timezone };
    }
    const desired = new Map<string, { payload: ReminderPayload; fireAt: Date }>();
    let overCap = input.overCap ?? false;
    if (input.preferences.enabled && permissionGranted) {
      const ordered = [...input.plans].filter((record) => record.dog_id.toLowerCase() === input.dogId.toLowerCase()
        && record.reminder_enabled && record.reminder_minutes !== null)
        .sort((a, b) => a.due_on.localeCompare(b.due_on) || (a.reminder_minutes ?? 0) - (b.reminder_minutes ?? 0) || a.id.localeCompare(b.id));
      for (const record of ordered) {
        if (input.blockedPlanIds?.has(record.id)) continue;
        if (!current()) return { status: 'unknown', scheduledCount: 0, overCap, timezone };
        if (!isUuid(record.id)) continue;
        const local = createLocalFireTime(record.due_on, record.reminder_minutes!, input.now);
        if (local.status !== 'scheduled') continue;
        const payload = planReminderPayload(input.ownerId, input.dogId, record.id);
        const key = payload && reminderLogicalKey(payload);
        if (payload && key) desired.set(key, { payload, fireAt: local.date });
      }
      if (desired.size > MAX_HEALTH_REMINDERS) overCap = true;
      while (desired.size > MAX_HEALTH_REMINDERS) desired.delete([...desired.keys()].at(-1)!);
      if (input.preferences.trainingEnabled) {
        const local = createNextTrainingFireTime(input.preferences.trainingMinutes, input.now);
        const payload = trainingReminderPayload(input.ownerId, input.dogId);
        const key = payload && reminderLogicalKey(payload);
        if (local.status === 'scheduled' && payload && key) desired.set(key, { payload, fireAt: local.date });
      }
    }

    let scheduledCount = 0;
    let hasFailure = false;
    const ownRequests = requests.filter((request) => isOwnedBy(request, input.ownerId));
    const retained = new Set<string>();
    const failedCancelKeys = new Set<string>();

    for (const request of ownRequests) {
      const payload = isOwnedBy(request, input.ownerId);
      const key = payload && reminderLogicalKey(payload);
      if (!payload || !key) continue;
      const wanted = desired.get(key);
      if (wanted && exactRequest(request, key, wanted.payload, wanted.fireAt) && !retained.has(key)) {
        retained.add(key);
        scheduledCount += 1;
        continue;
      }
      if (!current()) return { status: 'unknown', scheduledCount, overCap, timezone };
      try {
        await this.native.cancelScheduledNotificationAsync(request.identifier);
        if (!current()) return { status: 'unknown', scheduledCount, overCap, timezone };
      } catch {
        hasFailure = true;
        failedCancelKeys.add(key);
      }
    }

    for (const [key, wanted] of desired) {
      if (retained.has(key)) continue;
      if (failedCancelKeys.has(key)) continue;
      if (!current()) return { status: 'unknown', scheduledCount, overCap, timezone };
      try {
        const identifier = await this.native.scheduleNotificationAsync({
          identifier: key,
          content: { title: GENERIC_REMINDER_TITLE, body: GENERIC_REMINDER_BODY, data: asData(wanted.payload) },
          trigger: nativeTrigger(wanted.fireAt),
        });
        if (!current()) {
          await this.native.cancelScheduledNotificationAsync(identifier).catch(() => undefined);
          return { status: 'unknown', scheduledCount, overCap, timezone };
        }
        scheduledCount += 1;
      } catch {
        hasFailure = true;
      }
    }
    const status: ReminderStatus = hasFailure ? 'failed'
      : (input.blockedPlanIds?.size ?? 0) > 0 ? 'unknown'
        : !input.preferences.enabled ? 'off'
          : !permissionGranted ? 'permission-denied'
            : overCap ? 'over-cap' : 'scheduled';
    return { status, scheduledCount, overCap, timezone };
  }

  private serial<T>(work: () => Promise<T>): Promise<T> {
    const current = this.tail.then(work, work);
    this.tail = current.then(() => undefined, () => undefined);
    return current;
  }
}

export const reminderService = new ReminderService();
