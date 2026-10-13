import type { HomeTimelineEntry } from './home-timeline';
import { ageInWeeks } from '../onboarding/dog';
import type { HealthHistoryRecord, PlannedHealthRecord } from '../../data/workspace-data';
import type { LogEvent } from '../puppy-log/log-model';
import { homeTimelineForDate } from './home-timeline';

export type HomeWeek = { week: number; current: boolean };

export function homeAgeInWeeks(birthDate: string | null | undefined, today: string): number | null {
  if (!birthDate) return null;
  try {
    return ageInWeeks(birthDate, today);
  } catch {
    return null;
  }
}

export function homeWeekStrip(birthDate: string | null | undefined, today: string): HomeWeek[] {
  const currentWeek = homeAgeInWeeks(birthDate, today);
  if (currentWeek === null) return [];
  return Array.from({ length: currentWeek + 13 }, (_, week) => {
    return { week, current: week === currentWeek };
  });
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
