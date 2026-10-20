import type { HomeTimelineEntry } from './home-timeline';
import { ageInWeeks, automaticDogAge, type AutomaticDogAgeUnit } from '../onboarding/dog';
import type { HealthHistoryRecord, PlannedHealthRecord } from '../../data/workspace-data';
import type { LogEvent } from '../puppy-log/log-model';
import { homeTimelineForDate } from './home-timeline';

export type HomeAgeMarker = { value: number; current: boolean };
export type HomeWeek = { week: number; current: boolean };

export function homeAgeInWeeks(birthDate: string | null | undefined, today: string): number | null {
  if (!birthDate) return null;
  try {
    return ageInWeeks(birthDate, today);
  } catch {
    return null;
  }
}

/** Retained for compatibility with older non-Home consumers; HomeScreen uses homeAgeStrip. */
export function homeWeekStrip(birthDate: string | null | undefined, today: string): HomeWeek[] {
  const currentWeek = homeAgeInWeeks(birthDate, today);
  if (currentWeek === null) return [];
  return Array.from({ length: currentWeek + 13 }, (_, week) => ({ week, current: week === currentWeek }));
}

export function homeAgeStrip(birthDate: string | null | undefined, today: string): { unit: AutomaticDogAgeUnit; markers: HomeAgeMarker[] } | null {
  const age = automaticDogAge(birthDate, today);
  if (!age) return null;
  const first = age.unit === 'years' ? 1 : 0;
  const last = age.unit === 'weeks' ? 20 : age.unit === 'months' ? 12 : age.value + 3;
  return {
    unit: age.unit,
    markers: Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => {
      const value = first + index;
      return { value, current: value === age.value };
    }),
  };
}

export function homeAgeMarkerLabel(value: number, unit: AutomaticDogAgeUnit): string {
  const singular = unit === 'weeks' ? 'vecka' : unit === 'months' ? 'månad' : 'år';
  const plural = unit === 'weeks' ? 'veckor' : unit === 'months' ? 'månader' : 'år';
  return `${value} ${value === 1 ? singular : plural}`;
}

export type HomeTodaySources = {
  logged: HomeTimelineEntry[];
  planned: PlannedHealthRecord[];
};

export function homeTodaySources(
  date: string,
  events: readonly LogEvent[],
  healthHistory: readonly HealthHistoryRecord[],
  plans: readonly PlannedHealthRecord[],
): HomeTodaySources {
  return {
    logged: homeTimelineForDate(date, events, healthHistory),
    planned: plans.filter((plan) => plan.due_on === date).slice().sort((left, right) => {
      const timeOrder = (left.due_time ?? '99:99').localeCompare(right.due_time ?? '99:99');
      return timeOrder || left.id.localeCompare(right.id);
    }),
  };
}

export type TrainingMutationLease = Readonly<{ scope: string; token: object }>;

export function createTrainingMutationLease(scope: string): TrainingMutationLease {
  return { scope, token: {} };
}

export function acquireTrainingMutationLease(
  active: TrainingMutationLease | null,
  expectedScope: string | null,
  currentScope: string,
  accountDeletionInvalidated: boolean,
): TrainingMutationLease | null {
  if (!expectedScope || expectedScope !== currentScope || accountDeletionInvalidated || active) return null;
  return createTrainingMutationLease(currentScope);
}

export function ownsTrainingMutationLease(
  active: TrainingMutationLease | null,
  expected: TrainingMutationLease,
  currentScope: string,
  accountDeletionInvalidated: boolean,
): boolean {
  return active === expected && expected.scope === currentScope && !accountDeletionInvalidated;
}

export function releaseTrainingMutationLease(
  active: TrainingMutationLease | null,
  expected: TrainingMutationLease,
): TrainingMutationLease | null {
  return active === expected ? null : active;
}
