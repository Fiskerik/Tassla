import type { HealthHistoryRecord } from '../../data/workspace-data';
import { LOG_EVENT_LABELS, localDateTimeParts, type LogEvent } from '../puppy-log/log-model';

export type HomeTimelineEntry = {
  id: string;
  source: 'log' | 'health';
  title: string;
  category: LogEvent['type'] | 'vaccination' | 'veterinary';
  time: string | null;
  detail: string | null;
  sortTime: string | null;
};

export function homeTimelineForDate(
  selectedDate: string,
  events: readonly LogEvent[],
  healthHistory: readonly HealthHistoryRecord[],
): HomeTimelineEntry[] {
  const entries: HomeTimelineEntry[] = [];
  for (const event of events) {
    const parts = localDateTimeParts(event.occurredAt);
    if (parts.date !== selectedDate) continue;
    const value = new Date(event.occurredAt);
    entries.push({
      id: event.id,
      source: 'log',
      title: LOG_EVENT_LABELS[event.type],
      category: event.type,
      time: parts.time,
      detail: event.note,
      sortTime: `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}.${String(value.getMilliseconds()).padStart(3, '0')}`,
    });
  }
  for (const record of healthHistory) {
    if (record.occurred_on !== selectedDate) continue;
    entries.push({
      id: record.id,
      source: 'health',
      title: record.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök',
      category: record.event_type === 'vaccination' ? 'vaccination' : 'veterinary',
      time: record.occurred_time,
      detail: record.description,
      sortTime: record.occurred_time === null ? null : `${record.occurred_time}:00.000`,
    });
  }
  return entries.sort((left, right) => {
    if (left.sortTime === null) return right.sortTime === null ? right.id.localeCompare(left.id) : 1;
    if (right.sortTime === null) return -1;
    return right.sortTime.localeCompare(left.sortTime) || right.id.localeCompare(left.id);
  });
}

function pad(value: number): string { return String(value).padStart(2, '0'); }
