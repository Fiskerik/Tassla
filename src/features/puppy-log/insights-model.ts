import type { AccidentKind } from './log-model';

export type InsightsPeriod = 'week' | 'month' | 'since-start';
export type InsightEventType = 'pee' | 'poop' | 'accident';

export interface InsightEvent {
  id: string;
  dog_id: string;
  event_type: InsightEventType;
  occurred_at: string;
  accident_kinds: readonly AccidentKind[] | null;
}

export interface InsightBucket {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  pee: number;
  poop: number;
  hasCountableLog: boolean;
}

export interface InsightPeriodRange {
  startDate: string;
  endDate: string;
  granularity: 'day' | 'month';
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isValidInsightsTimeZone(value: string): boolean {
  if (!value || value.length > 128) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export function insightsLocalDateKey(instant: string, timeZone: string): string | null {
  const timestamp = Date.parse(instant);
  if (!Number.isFinite(timestamp) || !isValidInsightsTimeZone(timeZone)) return null;
  const parts = new Intl.DateTimeFormat('en', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(timestamp));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  const key = part('year') + '-' + part('month') + '-' + part('day');
  return isValidDateKey(key) ? key : null;
}

export function shiftInsightsDate(dateKey: string, days: number): string | null {
  if (!isValidDateKey(dateKey) || !Number.isInteger(days)) return null;
  const date = new Date(dateKey + 'T00:00:00.000Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function monthStart(dateKey: string): string | null {
  if (!isValidDateKey(dateKey)) return null;
  return dateKey.slice(0, 7) + '-01';
}

export function monthEnd(dateKey: string): string | null {
  const start = monthStart(dateKey);
  if (!start) return null;
  const date = new Date(start + 'T00:00:00.000Z');
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}

export function weekStart(dateKey: string): string | null {
  if (!isValidDateKey(dateKey)) return null;
  const weekday = new Date(dateKey + 'T00:00:00.000Z').getUTCDay();
  return shiftInsightsDate(dateKey, -((weekday + 6) % 7));
}

export function getInsightsRange(
  period: InsightsPeriod,
  anchorDate: string,
  todayDate: string,
  firstEventDate?: string | null,
): InsightPeriodRange | null {
  if (!isValidDateKey(anchorDate) || !isValidDateKey(todayDate)) return null;
  if (period === 'week') {
    const startDate = weekStart(anchorDate);
    if (!startDate) return null;
    return { startDate, endDate: shiftInsightsDate(startDate, 6) as string, granularity: 'day' };
  }
  if (period === 'month') {
    const startDate = monthStart(anchorDate);
    const endDate = monthEnd(anchorDate);
    return startDate && endDate ? { startDate, endDate, granularity: 'day' } : null;
  }
  const startDate = firstEventDate && isValidDateKey(firstEventDate) && firstEventDate <= todayDate
    ? firstEventDate : todayDate;
  return { startDate, endDate: todayDate, granularity: 'month' };
}

export function canNavigateInsightsPeriod(
  period: InsightsPeriod,
  direction: 'previous' | 'next',
  anchorDate: string,
  todayDate: string,
): boolean {
  if (period === 'since-start' || !isValidDateKey(anchorDate) || !isValidDateKey(todayDate)) return false;
  if (direction === 'previous') return true;
  const nextAnchor = period === 'week' ? shiftInsightsDate(anchorDate, 7) : shiftMonth(anchorDate, 1);
  if (!nextAnchor) return false;
  const nextStart = period === 'week' ? weekStart(nextAnchor) : monthStart(nextAnchor);
  const todayStart = period === 'week' ? weekStart(todayDate) : monthStart(todayDate);
  return Boolean(nextStart && todayStart && nextStart <= todayStart);
}

export function navigateInsightsAnchor(
  period: InsightsPeriod,
  direction: 'previous' | 'next',
  anchorDate: string,
): string | null {
  if (!isValidDateKey(anchorDate) || period === 'since-start') return null;
  return period === 'week'
    ? shiftInsightsDate(anchorDate, direction === 'previous' ? -7 : 7)
    : shiftMonth(anchorDate, direction === 'previous' ? -1 : 1);
}

export function buildInsightBuckets(
  events: readonly InsightEvent[],
  period: InsightsPeriod,
  anchorDate: string,
  todayDate: string,
  timeZone: string,
): InsightBucket[] {
  if (!isValidInsightsTimeZone(timeZone)) throw new Error('Invalid insights time zone');
  const eventDates = events.map((event) => insightsLocalDateKey(event.occurred_at, timeZone)).filter((key): key is string => key !== null);
  const firstEventDate = eventDates.reduce<string | null>((first, current) => !first || current < first ? current : first, null);
  const range = getInsightsRange(period, anchorDate, todayDate, firstEventDate);
  if (!range) throw new Error('Invalid insights date range');

  const keys = range.granularity === 'day'
    ? enumerateDateKeys(range.startDate, range.endDate)
    : enumerateMonthKeys(range.startDate, range.endDate);
  const bucketMap = new Map<string, InsightBucket>();
  for (const key of keys) {
    const startDate = range.granularity === 'day' ? key : key + '-01';
    const endDate = range.granularity === 'day' ? key : monthEnd(startDate) as string;
    bucketMap.set(key, { key, label: range.granularity === 'day' ? key.slice(8, 10) : key.slice(5, 7),
      startDate, endDate, pee: 0, poop: 0, hasCountableLog: false });
  }

  for (const event of events) {
    const dateKey = insightsLocalDateKey(event.occurred_at, timeZone);
    if (!dateKey || dateKey < range.startDate || dateKey > range.endDate) continue;
    const key = range.granularity === 'day' ? dateKey : dateKey.slice(0, 7);
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    const kinds = event.event_type === 'accident' ? event.accident_kinds ?? [] : [event.event_type];
    if (kinds.includes('pee')) { bucket.pee += 1; bucket.hasCountableLog = true; }
    if (kinds.includes('poop')) { bucket.poop += 1; bucket.hasCountableLog = true; }
  }
  return [...bucketMap.values()];
}

export function formatInsightsRange(
  period: InsightsPeriod,
  range: InsightPeriodRange,
  locale = 'sv-SE',
): string {
  const format = (dateKey: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, options)
    .format(new Date(dateKey + 'T12:00:00.000Z'));
  if (period === 'month') return format(range.startDate, { month: 'long', year: 'numeric' });
  const start = format(range.startDate, { day: 'numeric', month: 'short' });
  const end = format(range.endDate, { day: 'numeric', month: 'short', year: 'numeric' });
  return start + '–' + end;
}

export function formatInsightsDate(dateKey: string, locale = 'sv-SE'): string {
  if (!isValidDateKey(dateKey)) return dateKey;
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(dateKey + 'T12:00:00.000Z'));
}

function enumerateDateKeys(start: string, end: string): string[] {
  const keys: string[] = [];
  for (let current: string | null = start; current && current <= end; current = shiftInsightsDate(current, 1)) keys.push(current);
  return keys;
}

function enumerateMonthKeys(start: string, end: string): string[] {
  const keys: string[] = [];
  let current = monthStart(start);
  const final = monthStart(end);
  while (current && final && current <= final) {
    keys.push(current.slice(0, 7));
    current = shiftMonth(current, 1);
  }
  return keys;
}

function shiftMonth(dateKey: string, months: number): string | null {
  if (!isValidDateKey(dateKey) || !Number.isInteger(months)) return null;
  const date = new Date(dateKey + 'T00:00:00.000Z');
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const targetEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, targetEnd));
  return date.toISOString().slice(0, 10);
}
