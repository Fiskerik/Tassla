import type { AgeDisplayUnit } from '../../data/app-data';

export interface Dog {
  id: string;
  name: string;
  breedId: string;
  birthDate: string;
  ageDisplayUnit?: AgeDisplayUnit;
}

const DAY_MS = 86_400_000;

export type AutomaticDogAgeUnit = 'weeks' | 'months' | 'years';
export type ApproximateDogLifeStage = 'VALP' | 'UNGHUND' | 'VUXEN';

export interface AutomaticDogAge {
  unit: AutomaticDogAgeUnit;
  unitLabel: 'veckor' | 'månader' | 'år';
  value: number;
  label: string;
  stage: ApproximateDogLifeStage;
}

export function ageInWeeks(birthDate: string, today: string): number {
  const birth = parseDate(birthDate);
  const current = parseDate(today);
  if (birth > current) throw new Error('Birth date cannot be in the future');
  return Math.floor((current - birth) / (7 * 86_400_000));
}

export function formatDogAge(birthDate: string, today: string, unit: AgeDisplayUnit = 'weeks'): string {
  const birth = parseDate(birthDate);
  const current = parseDate(today);
  if (birth > current) throw new Error('Birth date cannot be in the future');

  if (unit === 'weeks') return formatWeeks(fullWeeks(birth, current));

  const months = fullCalendarMonths(birthDate, today);
  if (unit === 'months') {
    const remainingWeeks = fullWeeks(parseDate(addMonthsClamped(birthDate, months)), current);
    if (months === 0) return formatWeeks(remainingWeeks);
    return [formatCount(months, 'månad', 'månader'), remainingWeeks > 0 ? formatWeeks(remainingWeeks) : '']
      .filter(Boolean).join(' ');
  }

  const years = fullCalendarYears(birthDate, today);
  const remainingMonths = months - years * 12;
  if (years === 0) {
    if (remainingMonths > 0) return formatCount(remainingMonths, 'månad', 'månader');
    return formatWeeks(fullWeeks(birth, current));
  }
  const yearLabel = formatCount(years, 'år', 'år');
  return [yearLabel, remainingMonths > 0 ? `${remainingMonths} mån` : ''].filter(Boolean).join(' ');
}

/** Home's automatic age display. Life stages are broad product labels, not veterinary classifications. */
export function automaticDogAge(birthDate: string | null | undefined, today: string): AutomaticDogAge | null {
  if (!birthDate) return null;
  try {
    const birth = parseDate(birthDate);
    const current = parseDate(today);
    if (birth > current) return null;

    const elapsedDays = (current - birth) / DAY_MS;
    const months = fullCalendarMonths(birthDate, today);
    const stage: ApproximateDogLifeStage = months < 6 ? 'VALP' : months < 24 ? 'UNGHUND' : 'VUXEN';
    if (elapsedDays <= 20 * 7) {
      const value = fullWeeks(birth, current);
      return { unit: 'weeks', unitLabel: 'veckor', value, label: formatWeeks(value), stage };
    }

    const firstBirthday = parseDate(addMonthsClamped(birthDate, 12));
    if (current <= firstBirthday) {
      return { unit: 'months', unitLabel: 'månader', value: months, label: formatCount(months, 'månad', 'månader'), stage };
    }

    const years = fullCalendarYears(birthDate, today);
    return { unit: 'years', unitLabel: 'år', value: years, label: formatCount(years, 'år', 'år'), stage };
  } catch {
    return null;
  }
}

export function localDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Expected YYYY-MM-DD');
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) {
    throw new Error('Invalid calendar date');
  }
  return time;
}

function fullWeeks(start: number, end: number): number {
  return Math.floor((end - start) / (7 * DAY_MS));
}

function fullCalendarMonths(start: string, end: string): number {
  const startDate = new Date(parseDate(start));
  const endDate = new Date(parseDate(end));
  let months = (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12
    + endDate.getUTCMonth() - startDate.getUTCMonth();
  if (parseDate(addMonthsClamped(start, months)) > parseDate(end)) months -= 1;
  return months;
}

function fullCalendarYears(start: string, end: string): number {
  const startDate = new Date(parseDate(start));
  const endDate = new Date(parseDate(end));
  let years = endDate.getUTCFullYear() - startDate.getUTCFullYear();
  if (parseDate(addMonthsClamped(start, years * 12)) > parseDate(end)) years -= 1;
  return years;
}

export function addMonthsClamped(date: string, monthOffset: number): string {
  const original = new Date(parseDate(date));
  const monthIndex = original.getUTCFullYear() * 12 + original.getUTCMonth() + monthOffset;
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex - year * 12;
  const day = Math.min(original.getUTCDate(), daysInMonth(year, month));
  return `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, zeroBasedMonth: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, zeroBasedMonth + 1, 0);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCDate();
}

function formatWeeks(value: number): string {
  return formatCount(value, 'vecka', 'veckor');
}

function formatCount(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}
