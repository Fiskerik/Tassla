export type InsightsPeriod = 'today' | 'week' | 'month' | 'since_first_log';
export type InsightsBucket = 'day' | 'month';

export interface DogEventInsightDay {
  date: string;
  peeCount: number;
  poopCount: number;
  unclassifiedAccidentCount: number;
  sleepCount: number;
  awakeCount: number;
}

export interface DogEventInsights {
  period: InsightsPeriod;
  timezone: string;
  asOf: string;
  periodStartLocal: string | null;
  periodEndExclusiveLocal: string | null;
  observedThroughLocal: string;
  firstLogDay: string | null;
  bucket: InsightsBucket;
  days: readonly DogEventInsightDay[];
}

export interface InsightsRequestScope {
  ownerId: string;
  accountGeneration: number;
  dogId: string;
  timezone: string;
  period: InsightsPeriod;
  localDateAnchor: string;
  logMutationGeneration: number;
  requestGeneration: number;
  flightId: string;
}

const responseKeys = [
  'period', 'timezone', 'asOf', 'periodStartLocal', 'periodEndExclusiveLocal',
  'observedThroughLocal', 'firstLogDay', 'bucket', 'days',
] as const;
const dayKeys = ['date', 'peeCount', 'poopCount', 'unclassifiedAccidentCount', 'sleepCount', 'awakeCount'] as const;
const periods: readonly InsightsPeriod[] = ['today', 'week', 'month', 'since_first_log'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === [...expected].sort()[index]);
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isMonthKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5));
  return month >= 1 && month <= 12;
}

export function isValidInsightTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function localDateAtTimeZone(instant: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}`;
}

function addMonths(monthKey: string, months: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1 + months, 1));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthOrdinal(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return year * 12 + month - 1;
}

function expectedBucketDates(period: InsightsPeriod, start: string, through: string): string[] {
  const values: string[] = [];
  for (let current = start; current <= through; current = addDays(current, 1)) values.push(current);
  return values;
}

export function parseDogEventInsights(value: unknown, expectedPeriod: InsightsPeriod, expectedTimezone: string): DogEventInsights {
  if (!periods.includes(expectedPeriod) || !isValidInsightTimeZone(expectedTimezone) || !isRecord(value) || !hasExactKeys(value, responseKeys)) {
    throw new Error('Invalid Insights response');
  }
  if (value.period !== expectedPeriod || value.timezone !== expectedTimezone
    || typeof value.asOf !== 'string' || !Number.isFinite(Date.parse(value.asOf))
    || !isDateKey(value.observedThroughLocal)
    || value.bucket !== (expectedPeriod === 'since_first_log' ? 'month' : 'day')
    || !Array.isArray(value.days)) throw new Error('Invalid Insights metadata');
  const expectedBucket: InsightsBucket = expectedPeriod === 'since_first_log' ? 'month' : 'day';
  if (value.bucket !== expectedBucket) throw new Error('Invalid Insights bucket type');

  const asOfDate = localDateAtTimeZone(new Date(value.asOf), expectedTimezone);
  if (asOfDate !== value.observedThroughLocal) throw new Error('Invalid Insights observation date');

  const days: DogEventInsightDay[] = [];
  for (const entry of value.days) {
    if (!isRecord(entry) || !hasExactKeys(entry, dayKeys)) throw new Error('Invalid Insights bucket');
    const expectedDate = expectedPeriod === 'since_first_log' ? isMonthKey(entry.date) : isDateKey(entry.date);
    if (!expectedDate || !Number.isSafeInteger(entry.peeCount) || (entry.peeCount as number) < 0
      || !Number.isSafeInteger(entry.poopCount) || (entry.poopCount as number) < 0
      || !Number.isSafeInteger(entry.unclassifiedAccidentCount) || (entry.unclassifiedAccidentCount as number) < 0
      || !Number.isSafeInteger(entry.sleepCount) || (entry.sleepCount as number) < 0
      || !Number.isSafeInteger(entry.awakeCount) || (entry.awakeCount as number) < 0) {
      throw new Error('Invalid Insights counts');
    }
    days.push({
      date: entry.date as string,
      peeCount: entry.peeCount as number,
      poopCount: entry.poopCount as number,
      unclassifiedAccidentCount: entry.unclassifiedAccidentCount as number,
      sleepCount: entry.sleepCount as number,
      awakeCount: entry.awakeCount as number,
    });
  }

  for (let index = 1; index < days.length; index += 1) {
    if (days[index - 1].date >= days[index].date) throw new Error('Unordered Insights buckets');
  }

  let start: string | null;
  let end: string | null;
  let firstLog: string | null;
  if (expectedPeriod === 'since_first_log') {
    firstLog = value.firstLogDay === null ? null : isDateKey(value.firstLogDay) ? value.firstLogDay : null;
    if (value.firstLogDay !== null && firstLog === null) throw new Error('Invalid first log date');
    start = value.periodStartLocal === null ? null : isDateKey(value.periodStartLocal) ? value.periodStartLocal : null;
    end = value.periodEndExclusiveLocal === null ? null : isDateKey(value.periodEndExclusiveLocal) ? value.periodEndExclusiveLocal : null;
    if (days.length === 0) {
      if (firstLog !== null || value.periodStartLocal !== null || value.periodEndExclusiveLocal !== null) throw new Error('Invalid empty Insights period');
    } else {
      if (firstLog === null || start !== firstLog || end !== addDays(value.observedThroughLocal, 1)
        || days[0].date !== firstLog.slice(0, 7)
        || days[days.length - 1].date !== value.observedThroughLocal.slice(0, 7)) throw new Error('Invalid history range');
      for (const day of days) {
        if (monthOrdinal(day.date) < monthOrdinal(firstLog.slice(0, 7))
          || monthOrdinal(day.date) > monthOrdinal(value.observedThroughLocal.slice(0, 7))) throw new Error('History bucket outside period');
      }
    }
  } else {
    if (value.firstLogDay !== null || !isDateKey(value.periodStartLocal) || !isDateKey(value.periodEndExclusiveLocal)) {
      throw new Error('Invalid calendar period bounds');
    }
    firstLog = null;
    start = value.periodStartLocal;
    end = value.periodEndExclusiveLocal;
    const dateParts = value.observedThroughLocal.split('-').map(Number);
    const expectedStart = expectedPeriod === 'today' ? value.observedThroughLocal : expectedPeriod === 'week'
      ? addDays(value.observedThroughLocal, -((new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])).getUTCDay() + 6) % 7))
      : `${value.observedThroughLocal.slice(0, 7)}-01`;
    const expectedEnd = expectedPeriod === 'today' ? addDays(expectedStart, 1) : expectedPeriod === 'week'
      ? addDays(expectedStart, 7)
      : `${addMonths(value.observedThroughLocal.slice(0, 7), 1)}-01`;
    if (start !== expectedStart || end !== expectedEnd
      || days.map((day) => day.date).join('|') !== expectedBucketDates(expectedPeriod, start, value.observedThroughLocal).join('|')) {
      throw new Error('Invalid daily Insights buckets');
    }
  }

  return {
    period: expectedPeriod,
    timezone: expectedTimezone,
    asOf: value.asOf,
    periodStartLocal: start,
    periodEndExclusiveLocal: end,
    observedThroughLocal: value.observedThroughLocal,
    firstLogDay: firstLog,
    bucket: expectedBucket,
    days,
  };
}

export function insightsRequestScopeKey(scope: InsightsRequestScope): string {
  return JSON.stringify([
    scope.ownerId, scope.accountGeneration, scope.dogId, scope.timezone, scope.period,
    scope.localDateAnchor, scope.logMutationGeneration, scope.requestGeneration, scope.flightId,
  ]);
}

export function insightsRequestIsCurrent(current: InsightsRequestScope | null, expected: InsightsRequestScope): boolean {
  return current !== null && insightsRequestScopeKey(current) === insightsRequestScopeKey(expected);
}

export function shiftLocalDateKey(dateKey: string, amount: number): string {
  return addDays(dateKey, amount);
}

export function shiftLocalMonthKey(monthKey: string, amount: number): string {
  return addMonths(monthKey, amount);
}

export function formatInsightsDate(dateKey: string, includeYear = false): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const monthName = new Intl.DateTimeFormat('sv-SE', { month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, day, 12))).replace('.', '');
  return includeYear ? `${day} ${monthName} ${year}` : `${day} ${monthName}`;
}

export function formatInsightsMonth(monthKey: string, includeYear = false): string {
  const [year, month] = monthKey.split('-').map(Number);
  const monthName = new Intl.DateTimeFormat('sv-SE', { month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1, 12)));
  return includeYear ? `${monthName} ${year}` : monthName;
}

export function formatInsightsMonthTick(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('sv-SE', { month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1, 12))).replace('.', '');
}

export function insightsDateRange(data: DogEventInsights): string {
  if (data.period === 'since_first_log') {
    return data.firstLogDay ? `Från första registreringen ${formatInsightsDate(data.firstLogDay, true)}` : '';
  }
  if (!data.periodStartLocal) return '';
  if (data.period === 'today') return formatInsightsDate(data.periodStartLocal, true);
  return `${formatInsightsDate(data.periodStartLocal)}–${formatInsightsDate(data.observedThroughLocal, data.periodStartLocal.slice(0, 4) !== data.observedThroughLocal.slice(0, 4))}`;
}

export function insightVisibleTotals(days: readonly DogEventInsightDay[]) {
  return days.reduce((total, day) => ({
    pee: total.pee + day.peeCount,
    poop: total.poop + day.poopCount,
    accident: total.accident + day.unclassifiedAccidentCount,
    sleep: total.sleep + day.sleepCount,
    awake: total.awake + day.awakeCount,
  }), { pee: 0, poop: 0, accident: 0, sleep: 0, awake: 0 });
}

export function historyMonthEntries(data: DogEventInsights): readonly ({ kind: 'month'; item: DogEventInsightDay } | { kind: 'gap'; startMonth: string; endMonth: string; count: number })[] {
  if (data.period !== 'since_first_log') return data.days.map((item) => ({ kind: 'month' as const, item }));
  const byMonth = new Map(data.days.map((item) => [item.date, item]));
  if (!data.firstLogDay) return [];
  const output: ({ kind: 'month'; item: DogEventInsightDay } | { kind: 'gap'; startMonth: string; endMonth: string; count: number })[] = [];
  for (let month = data.firstLogDay.slice(0, 7); month <= data.observedThroughLocal.slice(0, 7);) {
    const item = byMonth.get(month);
    if (item) {
      output.push({ kind: 'month', item });
      month = addMonths(month, 1);
      continue;
    }
    const gapStart = month;
    while (month <= data.observedThroughLocal.slice(0, 7) && !byMonth.has(month)) month = addMonths(month, 1);
    const count = monthOrdinal(month) - monthOrdinal(gapStart);
    output.push({ kind: 'gap', startMonth: gapStart, endMonth: addMonths(month, -1), count });
  }
  return output;
}
