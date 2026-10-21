export type InsightsPeriod = 'Vecka' | 'Månad' | 'Sedan start';
export type InsightsPartialReason = 'timeout' | 'read-error' | 'limit';

export type InsightsEvent = {
  id: string;
  event_type: 'pee' | 'poop';
  occurred_at: string;
};

export type InsightsRange = {
  period: InsightsPeriod;
  startDate: string | null;
  endDate: string;
  startIso: string | null;
  endIso: string;
};

export type InsightsBucket = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  pee: number;
  poop: number;
  partial: boolean;
};

export type InsightsProjection = {
  period: InsightsPeriod;
  buckets: InsightsBucket[];
  peeTotal: number;
  poopTotal: number;
  coverageStartDate: string | null;
  coverageEndDate: string | null;
  status: 'ready' | 'partial';
  partialReason?: InsightsPartialReason;
  bucketUnit: 'day' | 'week' | 'month' | 'year';
};

const DAY_LABELS = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
const MONTH_LABELS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

export function isValidInsightsTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function localInsightsDate(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    calendar: 'iso8601',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function createInsightsRange(period: InsightsPeriod, now: Date, timeZone: string): InsightsRange {
  if (!Number.isFinite(now.getTime()) || !isValidInsightsTimeZone(timeZone)) throw new Error('Invalid Insights date or time zone');
  const today = localInsightsDate(now, timeZone);
  let startDate: string | null = null;
  if (period === 'Vecka') startDate = mondayOf(today);
  if (period === 'Månad') startDate = `${today.slice(0, 7)}-01`;
  const endDate = period === 'Vecka'
    ? addDays(startDate!, 7)
    : period === 'Månad'
      ? addMonths(startDate!, 1)
      : addDays(today, 1);
  return {
    period,
    startDate,
    endDate,
    startIso: startDate ? zonedMidnightIso(startDate, timeZone) : null,
    endIso: zonedMidnightIso(endDate, timeZone),
  };
}

export function projectInsights(
  input: {
    events: readonly InsightsEvent[];
    range: InsightsRange;
    timeZone: string;
    status: 'ready' | 'partial';
    partialReason?: InsightsPartialReason;
  },
): InsightsProjection {
  if (!isValidInsightsTimeZone(input.timeZone)) throw new Error('Invalid Insights time zone');
  const filtered = input.events.filter((event) => {
    const time = Date.parse(event.occurred_at);
    return Number.isFinite(time)
      && (event.event_type === 'pee' || event.event_type === 'poop')
      && (!input.range.startIso || time >= Date.parse(input.range.startIso))
      && time < Date.parse(input.range.endIso);
  });
  const counts = new Map<string, { pee: number; poop: number }>();
  for (const event of filtered) {
    const day = localInsightsDate(new Date(event.occurred_at), input.timeZone);
    const key = input.range.period === 'Vecka' ? day
      : input.range.period === 'Månad' ? mondayOf(day)
        : day.slice(0, 7);
    const row = counts.get(key) ?? { pee: 0, poop: 0 };
    row[event.event_type] += 1;
    counts.set(key, row);
  }

  const eventDates = filtered.map((event) => localInsightsDate(new Date(event.occurred_at), input.timeZone)).sort();
  const actualStart = eventDates[0] ?? null;
  const actualEnd = eventDates.at(-1) ?? null;
  const coverageStartDate = input.range.period === 'Sedan start' ? actualStart : input.range.startDate;
  const coverageEndDate = input.status === 'partial'
    ? actualEnd
    : addDays(input.range.endDate, -1);

  let bucketUnit: InsightsProjection['bucketUnit'] = input.range.period === 'Vecka' ? 'day'
    : input.range.period === 'Månad' ? 'week' : 'month';
  const yearBucketThreshold = addYears(addDays(input.range.endDate, -1), -2);
  if (input.range.period === 'Sedan start' && actualStart && actualStart < yearBucketThreshold) bucketUnit = 'year';

  const bucketDates = getBucketDates(input.range, actualStart, actualEnd, input.status, bucketUnit);
  const oldestBucketKey = bucketDates[0]?.key ?? null;
  const buckets = bucketDates.map(({ key, startDate, endDate, label }) => {
    const tally = counts.get(key) ?? { pee: 0, poop: 0 };
    return {
      key,
      label,
      startDate,
      endDate,
      pee: tally.pee,
      poop: tally.poop,
      partial: input.status === 'partial' && key === oldestBucketKey,
    };
  });

  return {
    period: input.range.period,
    buckets,
    peeTotal: filtered.filter((event) => event.event_type === 'pee').length,
    poopTotal: filtered.filter((event) => event.event_type === 'poop').length,
    coverageStartDate,
    coverageEndDate,
    status: input.status,
    partialReason: input.partialReason,
    bucketUnit,
  };
}

function getBucketDates(
  range: InsightsRange,
  actualStart: string | null,
  actualEnd: string | null,
  status: 'ready' | 'partial',
  unit: InsightsProjection['bucketUnit'],
): { key: string; startDate: string; endDate: string; label: string }[] {
  if (range.period === 'Vecka') {
    return eachDate(range.startDate!, range.endDate).map((date) => ({
      key: date,
      startDate: date,
      endDate: addDays(date, 1),
      label: DAY_LABELS[dayOfWeek(date)],
    }));
  }
  if (range.period === 'Månad') {
    const dates = eachDate(range.startDate!, range.endDate);
    const grouped = new Map<string, string[]>();
    for (const date of dates) {
      const key = mondayOf(date);
      grouped.set(key, [...(grouped.get(key) ?? []), date]);
    }
    return [...grouped.entries()].map(([key, days]) => {
      const first = days[0];
      const last = days.at(-1)!;
      const firstDay = Number(first.slice(8, 10));
      const lastDay = Number(last.slice(8, 10));
      return { key, startDate: first, endDate: addDays(last, 1), label: firstDay === lastDay ? `${firstDay}` : `${firstDay}–${lastDay}` };
    });
  }
  if (!actualStart || !actualEnd) return [];
  const start = actualStart;
  const end = addDays(status === 'partial' ? actualEnd : addDays(range.endDate, -1), 1);
  const keys = new Set<string>();
  for (const date of eachDate(start, end)) keys.add(unit === 'year' ? date.slice(0, 4) : date.slice(0, 7));
  return [...keys].map((key) => {
    const startDate = unit === 'year' ? `${key}-01-01` : `${key}-01`;
    const nextDate = unit === 'year' ? `${Number(key) + 1}-01-01` : addMonths(startDate, 1);
    return { key, startDate, endDate: nextDate, label: unit === 'year' ? key : formatMonth(key) };
  });
}

function zonedMidnightIso(dateKey: string, timeZone: string): string {
  const target = parseDateKey(dateKey);
  const targetTime = Date.UTC(target.year, target.month - 1, target.day);
  let low = targetTime - 36 * 60 * 60 * 1000;
  let high = targetTime + 36 * 60 * 60 * 1000;
  if (localInsightsDate(new Date(low), timeZone) >= dateKey || localInsightsDate(new Date(high), timeZone) < dateKey) {
    throw new Error('Could not resolve local Insights day boundary');
  }
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (localInsightsDate(new Date(middle), timeZone) < dateKey) low = middle;
    else high = middle;
  }
  if (localInsightsDate(new Date(high), timeZone) !== dateKey) throw new Error('Local Insights date does not exist in this time zone');
  return new Date(high).toISOString();
}

function parseDateKey(value: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error('Invalid Insights date');
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.toISOString().slice(0, 10) !== value) throw new Error('Invalid Insights date');
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function addDays(dateKey: string, amount: number): string {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
}

function addMonths(dateKey: string, amount: number): string {
  const { year, month } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1 + amount, 1)).toISOString().slice(0, 10);
}

function addYears(dateKey: string, amount: number): string {
  const { year, month, day } = parseDateKey(dateKey);
  const target = new Date(Date.UTC(year + amount, month - 1, day));
  if (target.getUTCMonth() !== month - 1) target.setUTCDate(0);
  return target.toISOString().slice(0, 10);
}

function mondayOf(dateKey: string): string {
  const weekday = dayOfWeek(dateKey);
  return addDays(dateKey, -((weekday + 6) % 7));
}

function dayOfWeek(dateKey: string): number {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function eachDate(start: string, end: string): string[] {
  const result: string[] = [];
  for (let date = start; date < end; date = addDays(date, 1)) result.push(date);
  return result;
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return `${MONTH_LABELS[month - 1]} ${year}`;
}
