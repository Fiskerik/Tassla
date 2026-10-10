export const LOG_EVENT_TYPES = ['pee', 'poop', 'food', 'sleep', 'awake', 'walk', 'accident', 'water'] as const;
export const LOG_ENTRY_TYPES = ['pee', 'poop', 'food', 'sleep', 'walk', 'accident', 'water'] as const;
export type LogEventType = typeof LOG_EVENT_TYPES[number];
export type LogEventOrigin = 'example' | 'local-test';

export const LOG_EVENT_LABELS: Record<LogEventType, string> = {
  pee: 'Kiss',
  poop: 'Bajs',
  food: 'Mat',
  sleep: 'Sömn',
  awake: 'Vaken',
  walk: 'Promenad',
  accident: 'Olycka',
  water: 'Vatten',
};

export interface LogEvent {
  id: string;
  dogId: string;
  type: LogEventType;
  occurredAt: string;
  note: string | null;
  origin: LogEventOrigin;
}

export interface CreateLogEventInput {
  id: string;
  dogId: string;
  type: LogEventType;
  occurredAt: string;
  note?: string | null;
  origin?: LogEventOrigin;
}

export interface LogEventChanges {
  type?: LogEventType;
  occurredAt?: string;
  note?: string | null;
}

export interface PottyPatternSummary {
  type: 'pee' | 'poop';
  count: number;
  medianIntervalMinutes: number | null;
}

export type QuickLogPressDecision = 'blocked' | 'confirm-duplicate' | 'submit';

export function decideQuickLogPress({ blocked, force, lastSubmitAt, timestamp, recentDuplicate }: {
  blocked: boolean;
  force: boolean;
  lastSubmitAt: number | null;
  timestamp: number;
  recentDuplicate: boolean;
}): QuickLogPressDecision {
  if (blocked) return 'blocked';
  if (!force && lastSubmitAt !== null && timestamp - lastSubmitAt < 2000) return 'blocked';
  if (!force && recentDuplicate) return 'confirm-duplicate';
  return 'submit';
}

export function canStartLogMutation(hasPendingIntent: boolean, inFlight: boolean): boolean {
  return !hasPendingIntent && !inFlight;
}

export interface LogMutationFlight {
  token: string;
  lifetime: string;
}

export function startLogMutationFlight(current: LogMutationFlight | null, lifetime: string, token: string): LogMutationFlight | null {
  return current ? null : { token, lifetime };
}

export function finishLogMutationFlight(current: LogMutationFlight | null, token: string): LogMutationFlight | null {
  return current?.token === token ? null : current;
}

export function retainLogMutationFlightForLifetime(current: LogMutationFlight | null, lifetime: string): LogMutationFlight | null {
  return current?.lifetime === lifetime ? current : null;
}

export function isLogMutationLifetimeCurrent(expected: string, current: string, mounted: boolean): boolean {
  return mounted && expected === current;
}

export function logMutationStatusForWriteOutcome(status: 'saved' | 'failed' | 'unknown'): 'saved' | 'failed' | 'unsure' {
  return status === 'unknown' ? 'unsure' : status;
}

export async function checkInsertRetryOperation<Operation extends { id: string }, Row>(
  operation: Operation,
  readById: (id: string) => Promise<Row | null>,
): Promise<{ operation: Operation; found: Row | null }> {
  return { operation, found: await readById(operation.id) };
}

export function hasRecentCategoryLog(events: readonly LogEvent[], type: LogEventType, now = Date.now(), windowMs = 2 * 60_000): boolean {
  return events.some((event) => {
    const timestamp = Date.parse(event.occurredAt);
    return event.type === type && Number.isFinite(timestamp) && timestamp <= now && timestamp >= now - windowMs;
  });
}

/** Retrospective owner-entered history only; this never predicts or recommends an outing. */
export function summarizePottyPatterns(events: readonly LogEvent[]): PottyPatternSummary[] {
  return (['pee', 'poop'] as const).map((type) => {
    const timestamps = events.filter((event) => event.type === type)
      .map((event) => Date.parse(event.occurredAt)).filter(Number.isFinite).sort((a, b) => a - b);
    const intervals = timestamps.slice(1).map((timestamp, index) => (timestamp - timestamps[index]) / 60000).filter((minutes) => minutes > 0 && Number.isFinite(minutes));
    const middle = Math.floor(intervals.length / 2);
    const medianIntervalMinutes = intervals.length === 0 ? null : intervals.length % 2 === 1
      ? intervals[middle] : (intervals[middle - 1] + intervals[middle]) / 2;
    return { type, count: timestamps.length, medianIntervalMinutes };
  });
}

export function createLogEvent(input: CreateLogEventInput, now = new Date()): LogEvent {
  if (!input.id.trim() || !input.dogId.trim()) throw new Error('Event and dog IDs are required');
  if (!LOG_EVENT_TYPES.includes(input.type)) throw new Error('Unknown log event type');
  const timestamp = Date.parse(input.occurredAt);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== input.occurredAt) {
    throw new Error('Expected a canonical ISO timestamp');
  }
  if (!Number.isFinite(now.getTime()) || timestamp > now.getTime()) throw new Error('Event time cannot be in the future');

  const note = input.note?.trim() || null;
  if (note && Array.from(note).length > 500) throw new Error('Note must be 500 characters or fewer');
  return {
    id: input.id,
    dogId: input.dogId,
    type: input.type,
    occurredAt: input.occurredAt,
    note,
    origin: input.origin ?? 'local-test',
  };
}

export function createSampleLogEvents(dogId: string, now = new Date()): LogEvent[] {
  const examples: { type: LogEventType; hoursAgo: number; note: string | null }[] = [
    { type: 'food', hoursAgo: 5, note: null },
    { type: 'pee', hoursAgo: 4, note: null },
    { type: 'poop', hoursAgo: 2, note: null },
    { type: 'walk', hoursAgo: 1, note: null },
  ];
  return examples.map((example, index) => createLogEvent({
    id: `${dogId}-example-${index + 1}`,
    dogId,
    type: example.type,
    occurredAt: new Date(now.getTime() - example.hoursAgo * 60 * 60 * 1000).toISOString(),
    note: example.note,
    origin: 'example',
  }, now)).sort(newestFirst);
}

export function addLogEvent(events: readonly LogEvent[], event: LogEvent): LogEvent[] {
  if (events.some((existing) => existing.id === event.id)) return [...events];
  return [...events, event].sort(newestFirst);
}

export function updateLogEvent(
  events: readonly LogEvent[],
  id: string,
  changes: LogEventChanges,
  now = new Date(),
): LogEvent[] {
  const current = events.find((event) => event.id === id);
  if (!current) return [...events];
  const updated = createLogEvent({
    ...current,
    ...changes,
    id: current.id,
    dogId: current.dogId,
    origin: current.origin,
  }, now);
  return events.map((event) => event.id === id ? updated : event).sort(newestFirst);
}

export function deleteLogEvent(events: readonly LogEvent[], id: string): LogEvent[] {
  return events.filter((event) => event.id !== id);
}

export function parseLocalDateTime(dateValue: string, timeValue: string, now = new Date()): string | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue.trim());
  if (!dateMatch || !timeMatch) return null;

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  const localTime = new Date(0);
  localTime.setFullYear(year, month - 1, day);
  localTime.setHours(hour, minute, 0, 0);
  if (
    localTime.getFullYear() !== year || localTime.getMonth() !== month - 1 || localTime.getDate() !== day ||
    localTime.getHours() !== hour || localTime.getMinutes() !== minute || localTime.getTime() > now.getTime()
  ) return null;
  return localTime.toISOString();
}

export function localDateTimeParts(occurredAt: string): { date: string; time: string } {
  const value = new Date(occurredAt);
  if (!Number.isFinite(value.getTime())) throw new Error('Invalid event timestamp');
  return { date: localDate(value), time: localTime(value) };
}

export function groupLogEventsByLocalDate(events: readonly LogEvent[]): { date: string; events: LogEvent[] }[] {
  const groups = new Map<string, LogEvent[]>();
  for (const event of [...events].sort(newestFirst)) {
    const date = localDate(new Date(event.occurredAt));
    const group = groups.get(date) ?? [];
    group.push(event);
    groups.set(date, group);
  }
  return [...groups].map(([date, groupedEvents]) => ({ date, events: groupedEvents }));
}

function localDate(value: Date): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function localTime(value: Date): string {
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function newestFirst(left: LogEvent, right: LogEvent): number {
  return right.occurredAt.localeCompare(left.occurredAt) || right.id.localeCompare(left.id);
}
