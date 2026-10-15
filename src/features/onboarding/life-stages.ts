/** Chronological editorial periods. Starts are inclusive; the next start is exclusive. */
export const DOG_LIFE_PERIODS = [
  { id: 'first_weeks', title: 'Den första tiden', ageLabel: '0–8 veckor' },
  { id: 'homecoming', title: 'Valpen flyttar hem', ageLabel: '8–12 veckor' },
  { id: 'curious_puppy', title: 'Den nyfikna valpen', ageLabel: '3–6 månader' },
  { id: 'approaching_adolescence', title: 'På väg mot tonåren', ageLabel: '6–9 månader' },
  { id: 'adolescent', title: 'Unghunden', ageLabel: '9–18 månader' },
  { id: 'young_adult', title: 'Den unga vuxna hunden', ageLabel: '1,5–3 år' },
  { id: 'adult', title: 'Den vuxna hunden', ageLabel: '3–7 år' },
  { id: 'mature', title: 'Den mogna hunden', ageLabel: '7–10 år' },
  { id: 'senior_years', title: 'Seniorhunden', ageLabel: '10–13 år' },
  { id: 'older_years', title: 'Den äldre hunden', ageLabel: '13+ år' },
] as const;

export type DogLifePeriodId = typeof DOG_LIFE_PERIODS[number]['id'];
export type DogBroadPhase = 'VALP' | 'UNGHUND' | 'VUXEN' | 'SENIOR' | 'LIVETS_SLUTSKEDE';
export type DogLifeMilestone = 'before_homecoming' | 'homecoming' | 'first_days_home';
export type LegacyChecklistPhase = '8_12_weeks' | '3_6_months' | '6_12_months' | 'over_1_year';

export interface DogLifeAssessment {
  /** An individually assessed onset, informed by breed and size; never inferred from age alone. */
  seniorFromMonths?: number | null;
  /** An explicit individual assessment; independent of chronological age. */
  seniorConfirmed?: boolean;
  /** An explicit care context, independent of chronological age. */
  endOfLife?: boolean;
}

export interface ResolvedDogLife {
  ageWeeks: number;
  completedMonths: number;
  period: typeof DOG_LIFE_PERIODS[number];
  /** Null means adult/senior classification needs individual context. */
  broadPhase: DogBroadPhase | null;
  legacyChecklistPhase: LegacyChecklistPhase | null;
}

const DAY_MS = 86_400_000;

export function resolveDogLife(birthDate: string, today: string, assessment: DogLifeAssessment = {}): ResolvedDogLife {
  const birth = parseCalendarDate(birthDate);
  const current = parseCalendarDate(today);
  if (current < birth) throw new Error('Birth date cannot be in the future');
  const ageWeeks = Math.floor((current - birth) / (7 * DAY_MS));
  const completedMonths = fullCalendarMonths(birthDate, today);
  const periodIndex = ageWeeks < 8 ? 0 : completedMonths < 3 ? 1 : completedMonths < 6 ? 2
    : completedMonths < 9 ? 3 : completedMonths < 18 ? 4 : completedMonths < 36 ? 5
      : completedMonths < 84 ? 6 : completedMonths < 120 ? 7 : completedMonths < 156 ? 8 : 9;
  const seniorFromMonths = assessment.seniorFromMonths;
  if (seniorFromMonths != null && (!Number.isInteger(seniorFromMonths) || seniorFromMonths < 0)) {
    throw new Error('Invalid senior assessment');
  }
  const senior = assessment.seniorConfirmed === true
    || (seniorFromMonths != null && completedMonths >= seniorFromMonths);
  const broadPhase: DogBroadPhase | null = assessment.endOfLife ? 'LIVETS_SLUTSKEDE'
    : senior ? 'SENIOR' : completedMonths < 6 ? 'VALP'
      : completedMonths < 18 ? 'UNGHUND' : completedMonths < 84 ? 'VUXEN' : null;
  return { ageWeeks, completedMonths, period: DOG_LIFE_PERIODS[periodIndex], broadPhase,
    legacyChecklistPhase: legacyChecklistPhaseForAgeWeeks(ageWeeks) };
}

/** Translation for persisted review-v1 checklist IDs; these windows are inclusive whole weeks. */
export function legacyChecklistPhaseForAgeWeeks(ageWeeks: number): LegacyChecklistPhase | null {
  if (!Number.isInteger(ageWeeks) || ageWeeks < 0) throw new Error('Invalid age');
  if (ageWeeks < 8) return null;
  if (ageWeeks < 13) return '8_12_weeks';
  if (ageWeeks < 26) return '3_6_months';
  if (ageWeeks < 52) return '6_12_months';
  return 'over_1_year';
}

export function parseCalendarDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Expected YYYY-MM-DD');
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) {
    throw new Error('Invalid calendar date');
  }
  return time;
}

export function fullCalendarMonths(start: string, end: string): number {
  const startDate = new Date(parseCalendarDate(start));
  const endDate = new Date(parseCalendarDate(end));
  let months = (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12
    + endDate.getUTCMonth() - startDate.getUTCMonth();
  if (parseCalendarDate(addMonthsClamped(start, months)) > parseCalendarDate(end)) months -= 1;
  return months;
}

export function addMonthsClamped(date: string, monthOffset: number): string {
  const original = new Date(parseCalendarDate(date));
  const monthIndex = original.getUTCFullYear() * 12 + original.getUTCMonth() + monthOffset;
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex - year * 12;
  const day = Math.min(original.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
  return `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
