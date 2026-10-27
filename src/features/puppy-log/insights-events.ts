import type { LogEvent } from './log-model';
import { localDateAtTimeZone, type DogEventInsights } from './insights-model';

/** Select only already-loaded events observed within the insights response's period. */
export function loadedInsightEvents(events: readonly LogEvent[], data: DogEventInsights, limit = Infinity): LogEvent[] {
  if (!data.periodStartLocal || !data.periodEndExclusiveLocal) return [];
  const asOf = Date.parse(data.asOf);
  if (!Number.isFinite(asOf)) return [];
  return events.filter((event) => {
    const time = Date.parse(event.occurredAt);
    if (!Number.isFinite(time) || time > asOf) return false;
    const date = localDateAtTimeZone(new Date(time), data.timezone);
    return date >= data.periodStartLocal! && date < data.periodEndExclusiveLocal!;
  }).sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || a.id.localeCompare(b.id)).slice(0, limit);
}

/** A descending page has crossed the period boundary, or the server has no further pages. */
export function insightPeriodLoaded(events: readonly LogEvent[], data: DogEventInsights, hasMore: boolean): boolean {
  if (!data.periodStartLocal || !data.periodEndExclusiveLocal || !Number.isFinite(Date.parse(data.asOf))) return false;
  if (!hasMore) return true;
  return events.some((event) => {
    const time = Date.parse(event.occurredAt);
    return Number.isFinite(time) && localDateAtTimeZone(new Date(time), data.timezone) < data.periodStartLocal!;
  });
}
