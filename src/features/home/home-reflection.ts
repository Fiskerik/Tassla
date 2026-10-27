import { LOG_EVENT_LABELS, type LogEvent } from '../puppy-log/log-model.ts';

/** Pick only a confirmed, non-future event belonging to the current dog. */
export function latestHomeReflection(events: readonly LogEvent[], dogId: string, now = new Date()): { label: string; date: string } | null {
  const nowTime = now.getTime();
  if (!Number.isFinite(nowTime)) return null;
  const latest = events
    .filter((event) => event.dogId === dogId && Number.isFinite(Date.parse(event.occurredAt)) && Date.parse(event.occurredAt) <= nowTime)
    .reduce<LogEvent | null>((current, event) => !current || Date.parse(event.occurredAt) > Date.parse(current.occurredAt) ? event : current, null);
  if (!latest) return null;
  const eventDate = new Date(latest.occurredAt);
  const date = new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric', month: 'long', ...(eventDate.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(eventDate);
  return { label: LOG_EVENT_LABELS[latest.type], date };
}
