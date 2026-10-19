export type LocalMonthRange = { monthKey: string; startIso: string; endIso: string };

export function calendarMarkerScopeKey(scope: string, timeZone: string, monthKey: string): string {
  return `${scope}:${timeZone}:${monthKey}`;
}

export function localMonthRange(monthKey: string): LocalMonthRange {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) throw new Error('Invalid local month');
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new Error('Invalid local month');
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { monthKey, startIso: start.toISOString(), endIso: end.toISOString() };
}

export function localMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function localDateKey(date: Date): string {
  return `${localMonthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
}

export function shiftMonth(monthKey: string, amount: number): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) throw new Error('Invalid local month');
  return localMonthKey(new Date(Number(match[1]), Number(match[2]) - 1 + amount, 1, 12));
}

export function monthCalendarDays(monthKey: string): { dateKey: string | null; day: number | null }[] {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) throw new Error('Invalid local month');
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const first = new Date(year, month, 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0, 12).getDate();
  const cells: { dateKey: string | null; day: number | null }[] = [];
  for (let i = 0; i < offset; i += 1) cells.push({ dateKey: null, day: null });
  for (let day = 1; day <= count; day += 1) {
    cells.push({ dateKey: `${monthKey}-${String(day).padStart(2, '0')}`, day });
  }
  while (cells.length % 7) cells.push({ dateKey: null, day: null });
  return cells;
}

export function localDateKeyForTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid event timestamp');
  return localDateKey(date);
}

export function dedupeLocalDateMarkers(timestamps: readonly string[]): string[] {
  return [...new Set(timestamps.map(localDateKeyForTimestamp))].sort();
}
