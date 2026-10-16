import type { NotificationPreferences } from '../../notifications/notification-model';

export type ReminderPreferencesDraft = {
  enabled: boolean;
  trainingEnabled: boolean;
  trainingTime: string;
};

export function formatReminderTime(minutes: number): string {
  return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
}

export function isReminderPreferencesDraftDirty(
  saved: NotificationPreferences,
  draft: ReminderPreferencesDraft,
): boolean {
  return draft.enabled !== saved.enabled
    || draft.trainingEnabled !== saved.trainingEnabled
    || draft.trainingTime !== formatReminderTime(saved.trainingMinutes);
}

export function parseReminderTime(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}
