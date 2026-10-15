import type { AgeDisplayUnit } from '../../data/app-data';
import { addMonthsClamped, fullCalendarMonths, parseCalendarDate as parseDate, resolveDogLife, type DogLifeAssessment } from './life-stages.ts';

export interface Dog {
  id: string;
  name: string;
  breedId: string;
  birthDate: string;
  ageDisplayUnit?: AgeDisplayUnit;
  seniorConfirmed?: boolean;
  endOfLife?: boolean;
}

const DAY_MS = 86_400_000;

export type AutomaticDogAgeUnit = 'weeks' | 'months' | 'years';
export type ApproximateDogLifeStage = ReturnType<typeof resolveDogLife>['period']['title'];

export interface AutomaticDogAge {
  unit: AutomaticDogAgeUnit;
  unitLabel: 'veckor' | 'månader' | 'år';
  value: number;
  label: string;
  stage: ApproximateDogLifeStage;
  broadPhase: ReturnType<typeof resolveDogLife>['broadPhase'];
}

export function ageInWeeks(birthDate: string, today: string): number {
  return resolveDogLife(birthDate, today).ageWeeks;
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

/** Home's automatic age display with a chronological editorial period. */
export function automaticDogAge(birthDate: string | null | undefined, today: string, assessment: DogLifeAssessment = {}): AutomaticDogAge | null {
  if (!birthDate) return null;
  try {
    const birth = parseDate(birthDate);
    const current = parseDate(today);
    if (birth > current) return null;

    const elapsedDays = (current - birth) / DAY_MS;
    const life = resolveDogLife(birthDate, today, assessment);
    const months = life.completedMonths;
    const stage: ApproximateDogLifeStage = life.period.title;
    const broadPhase = life.broadPhase;
    if (elapsedDays <= 20 * 7) {
      const value = fullWeeks(birth, current);
      return { unit: 'weeks', unitLabel: 'veckor', value, label: formatWeeks(value), stage, broadPhase };
    }

    const firstBirthday = parseDate(addMonthsClamped(birthDate, 12));
    if (current <= firstBirthday) {
      return { unit: 'months', unitLabel: 'månader', value: months, label: formatCount(months, 'månad', 'månader'), stage, broadPhase };
    }

    const years = fullCalendarYears(birthDate, today);
    return { unit: 'years', unitLabel: 'år', value: years, label: formatCount(years, 'år', 'år'), stage, broadPhase };
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

function fullWeeks(start: number, end: number): number {
  return Math.floor((end - start) / (7 * DAY_MS));
}

function fullCalendarYears(start: string, end: string): number {
  const startDate = new Date(parseDate(start));
  const endDate = new Date(parseDate(end));
  let years = endDate.getUTCFullYear() - startDate.getUTCFullYear();
  if (parseDate(addMonthsClamped(start, years * 12)) > parseDate(end)) years -= 1;
  return years;
}


function formatWeeks(value: number): string {
  return formatCount(value, 'vecka', 'veckor');
}

function formatCount(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}
