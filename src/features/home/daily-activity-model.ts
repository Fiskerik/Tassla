import type { HistoricalTrainingSource, PublishedTrainingProgram, PublishedTrainingStep } from '../../data/workspace-data';
import type { DailyActivityRangeSnapshot, DailyActivitySnapshot, DailyRoutine, DailyRoutineDay, DailyRoutineDaySkip, DailyTrainingSelection } from './daily-activity-data';
import { dailyRoutineChecklistDisplayIcon, type DailyRoutineChecklistDisplayIcon } from './daily-routine-checklist-icons';

export type HomeDailyActivity = {
  id: string;
  label: string;
  routineLabel?: string;
  routineItemId?: string;
  icon?: DailyRoutineChecklistDisplayIcon;
  kind: 'routine' | 'training';
  completed: boolean;
  routineDay?: DailyRoutineDay;
  trainingSelection?: DailyTrainingSelection;
  programId?: string;
  stepId?: string;
  programTitle?: string;
  dateKey?: string;
  skipped?: boolean;
  routineDaySkip?: DailyRoutineDaySkip;
  healthType?: 'vaccination' | 'vet_visit';
};

export type TrainingProgressStamp = {
  dogId: string;
  programVersionId: string;
  stepId: string;
  completedAt: string;
};

export type DailyProgressCoverage = 'complete' | 'empty' | 'loading' | 'unknown' | 'partial' | 'error';
export type DailyProgressSourceState = 'ready' | 'loading' | 'unknown' | 'partial' | 'error';
export type DailyProgressSelection<T extends Pick<HomeDailyActivity, 'completed'>> = {
  activities: readonly T[];
  completedCount: number;
  totalCount: number;
  coverage: DailyProgressCoverage;
};

/** Selects the single scope-current daily result shared by Home and Daily Progress. */
export function selectDailyProgress<T extends Pick<HomeDailyActivity, 'completed'>>(
  activities: readonly T[],
  state: DailyProgressSourceState,
): DailyProgressSelection<T> {
  const coverage: DailyProgressCoverage = state === 'ready'
    ? activities.length === 0 ? 'empty' : 'complete'
    : state;
  return {
    activities,
    completedCount: activities.reduce((count, activity) => count + Number(activity.completed), 0),
    totalCount: activities.length,
    coverage,
  };
}

export function localDateKeyAt(instant: string | Date, timeZone: string): string | null {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (!Number.isFinite(date.getTime()) || !isValidIanaTimeZone(timeZone)) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
    if (!value.year || !value.month || !value.day) return null;
    return `${value.year.padStart(4, '0')}-${value.month.padStart(2, '0')}-${value.day.padStart(2, '0')}`;
  } catch {
    return null;
  }
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isRoutineDueOnDate(routine: Pick<DailyRoutine, 'repeat_unit' | 'repeat_interval' | 'repeat_weekdays' | 'repeat_anchor_date'>, dateKey: string): boolean {
  const { repeat_unit: unit, repeat_interval: interval, repeat_weekdays: weekdays, repeat_anchor_date: anchor } = routine;
  if (!unit || !interval || !anchor || !isValidDateKey(dateKey) || !isValidDateKey(anchor) || dateKey < anchor) return false;
  const [anchorYear, anchorMonth, anchorDay] = anchor.split('-').map(Number);
  const [year, month, day] = dateKey.split('-').map(Number);
  if (unit === 'day') {
    const elapsedDays = (Date.UTC(year, month - 1, day) - Date.UTC(anchorYear, anchorMonth - 1, anchorDay)) / 86_400_000;
    return Number.isInteger(elapsedDays) && elapsedDays % interval === 0;
  }
  if (unit === 'week') {
    const elapsedDays = (Date.UTC(year, month - 1, day) - Date.UTC(anchorYear, anchorMonth - 1, anchorDay)) / 86_400_000;
    if (!Number.isInteger(elapsedDays)) return false;
    if (weekdays === null) return elapsedDays % (interval * 7) === 0;
    const anchorWeekStart = Date.UTC(anchorYear, anchorMonth - 1, anchorDay) - (isoWeekdayForDateKey(anchor) - 1) * 86_400_000;
    const dateWeekStart = Date.UTC(year, month - 1, day) - (isoWeekdayForDateKey(dateKey) - 1) * 86_400_000;
    const elapsedWeeks = (dateWeekStart - anchorWeekStart) / (7 * 86_400_000);
    return Number.isInteger(elapsedWeeks) && elapsedWeeks % interval === 0 && weekdays.includes(isoWeekdayForDateKey(dateKey));
  }
  if (unit === 'month') {
    const monthsElapsed = (year - anchorYear) * 12 + month - anchorMonth;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return monthsElapsed >= 0 && monthsElapsed % interval === 0 && day === Math.min(anchorDay, lastDay);
  }
  return false;
}

export function dailyRoutineRepeatSummary(routine: Pick<DailyRoutine, 'repeat_unit' | 'repeat_interval' | 'repeat_weekdays' | 'repeat_anchor_date'>): string {
  const { repeat_unit: unit, repeat_interval: interval } = routine;
  if (!unit || !interval) return 'Aldrig';
  const cadence = unit === 'day' && interval === 1 ? 'Dagligen'
    : interval === 1 ? unit === 'week' ? 'Varje vecka' : 'Varje månad'
      : interval === 2 ? unit === 'day' ? 'Varannan dag' : unit === 'week' ? 'Varannan vecka' : 'Varannan månad'
        : `Med ${interval} ${unit === 'day' ? 'dagar' : unit === 'week' ? 'veckor' : 'månader'} mellanrum`;
  const weekdays = routine.repeat_weekdays ?? (unit === 'week' && routine.repeat_anchor_date ? [isoWeekdayForDateKey(routine.repeat_anchor_date)] : null);
  return unit === 'week' && weekdays ? `${cadence} · ${weekdays.map((day) => WEEKDAY_SHORT_NAMES[day - 1]).join(', ')}` : cadence;
}

const WEEKDAY_SHORT_NAMES = ['mån', 'tis', 'ons', 'tors', 'fre', 'lör', 'sön'];

export function isoWeekdayForDateKey(dateKey: string): number {
  const day = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

export type ChecklistFilter = 'Idag' | 'Denna vecka' | 'Alla' | 'Kommande';
export type ChecklistRangeStatus = 'ready' | 'partial' | 'error';

const CHECKLIST_RANGE_SOURCES = ['routineDays', 'routineDaySkips', 'trainingSelections'] as const;

export function checklistRangeReadStatus(completeSources: readonly string[], failedSources: readonly string[], unresolvedSourceCount = 0): ChecklistRangeStatus {
  const complete = new Set(completeSources);
  const completedRequiredCount = CHECKLIST_RANGE_SOURCES.filter((source) => complete.has(source)).length;
  const hasRequiredFailure = failedSources.some((source) => source === 'trainingSources' || CHECKLIST_RANGE_SOURCES.includes(source as typeof CHECKLIST_RANGE_SOURCES[number]));
  if (!hasRequiredFailure && unresolvedSourceCount === 0 && completedRequiredCount === CHECKLIST_RANGE_SOURCES.length) return 'ready';
  return completedRequiredCount === 0 ? 'error' : 'partial';
}

export function addCalendarDays(dateKey: string, amount: number): string | null {
  if (!isValidDateKey(dateKey) || !Number.isInteger(amount)) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

export function checklistFilterRange(filter: Exclude<ChecklistFilter, 'Idag'>, today: string): { from: string; to: string } | null {
  if (!isValidDateKey(today)) return null;
  if (filter === 'Kommande') {
    const from = addCalendarDays(today, 1); const to = addCalendarDays(today, 7);
    return from && to ? { from, to } : null;
  }
  if (filter === 'Alla') {
    const from = addCalendarDays(today, -29);
    return from ? { from, to: today } : null;
  }
  const monday = addCalendarDays(today, -(isoWeekdayForDateKey(today) - 1));
  const sunday = monday && addCalendarDays(monday, 6);
  return monday && sunday ? { from: monday, to: sunday } : null;
}

export function isTrainingCompletionForDay(
  progress: TrainingProgressStamp,
  scope: { dogId: string; programVersionId: string; stepId: string },
  dateKey: string,
  timeZone: string,
): boolean {
  return isValidDateKey(dateKey)
    && progress.dogId === scope.dogId
    && progress.programVersionId === scope.programVersionId
    && progress.stepId === scope.stepId
    && localDateKeyAt(progress.completedAt, timeZone) === dateKey;
}

export function nextSelectableTrainingStep(program: Pick<PublishedTrainingProgram, 'steps' | 'completedStepIds'>): PublishedTrainingStep | null {
  const completed = new Set(program.completedStepIds);
  return [...program.steps].sort((left, right) => left.position - right.position)
    .find((step) => !completed.has(step.id)) ?? null;
}

export function trainingProgressStamp(
  dogId: string,
  program: Pick<PublishedTrainingProgram, 'id' | 'completedAtByStepId'>,
  stepId: string,
): TrainingProgressStamp | null {
  const completedAt = program.completedAtByStepId[stepId];
  if (!completedAt) return null;
  return { dogId, programVersionId: program.id, stepId, completedAt };
}

export function deriveHomeDailyActivities(
  snapshot: DailyActivitySnapshot,
  programs: readonly PublishedTrainingProgram[],
  dogId: string,
  dateKey: string,
): HomeDailyActivity[] {
  if (!isValidDateKey(dateKey)) return [];
  const routinesById = new Map(snapshot.routines.filter((routine) => routine.dog_id === dogId).map((routine) => [routine.id, routine]));
  const activities: HomeDailyActivity[] = [];
  for (const row of snapshot.routineDays) {
    if (row.dog_id !== dogId || row.date_key !== dateKey || !routinesById.has(row.routine_id)) continue;
    for (const item of row.checklist_snapshot) activities.push({
      id: `routine:${row.id}:${item.id}`,
      label: item.label,
      icon: dailyRoutineChecklistDisplayIcon(item),
      routineLabel: row.routine_label_snapshot,
      routineItemId: item.id,
      kind: 'routine',
      completed: row.completed_item_ids.includes(item.id),
      routineDay: row,
      dateKey,
    });
  }
  const programById = new Map(programs.map((program) => [program.id, program]));
  for (const row of snapshot.trainingSelections) {
    if (row.dog_id !== dogId || row.date_key !== dateKey) continue;
    const program = programById.get(row.program_version_id);
    const step = program?.steps.find((item) => item.id === row.step_id);
    if (!program || !step) continue;
    const stamp = trainingProgressStamp(dogId, program, row.step_id);
    activities.push({
      id: `training:${row.id}`,
      label: step.title,
      kind: 'training',
      completed: stamp ? isTrainingCompletionForDay(stamp, {
        dogId,
        programVersionId: row.program_version_id,
        stepId: row.step_id,
      }, row.date_key, row.time_zone) : false,
      trainingSelection: row,
      programId: program.id,
      stepId: step.id,
      programTitle: program.title,
      dateKey,
    });
  }
  return activities;
}

export function deriveSavedRangeActivities(
  snapshot: DailyActivityRangeSnapshot,
  trainingSources: ReadonlyMap<string, HistoricalTrainingSource>,
  dogId: string,
  from: string,
  to: string,
): HomeDailyActivity[] {
  const result: HomeDailyActivity[] = [];
  for (const row of snapshot.routineDays) {
    if (row.dog_id !== dogId || row.date_key < from || row.date_key > to) continue;
    for (const item of row.checklist_snapshot) result.push({ id: `routine:${row.id}:${item.id}`, label: item.label, icon: dailyRoutineChecklistDisplayIcon(item),
      routineLabel: row.routine_label_snapshot, routineItemId: item.id, kind: 'routine',
      completed: row.completed_item_ids.includes(item.id), routineDay: row, dateKey: row.date_key });
  }
  for (const row of snapshot.routineDaySkips) {
    if (row.dog_id !== dogId || row.date_key < from || row.date_key > to) continue;
    result.push({ id: `skip:${row.day_id}`, label: row.routine_label_snapshot, routineLabel: row.routine_label_snapshot,
      kind: 'routine', completed: false, dateKey: row.date_key, skipped: true, routineDaySkip: row });
  }
  for (const row of snapshot.trainingSelections) {
    if (row.dog_id !== dogId || row.date_key < from || row.date_key > to) continue;
    const source = trainingSources.get(`${row.program_version_id}:${row.step_id}`);
    if (!source) continue;
    const stamp = source.completedAt ? {
      dogId, programVersionId: source.programVersionId, stepId: source.stepId, completedAt: source.completedAt,
    } : null;
    result.push({ id: `training:${row.id}`, label: source.stepTitle, kind: 'training',
      completed: stamp ? isTrainingCompletionForDay(stamp, { dogId, programVersionId: row.program_version_id, stepId: row.step_id }, row.date_key, row.time_zone) : false,
      trainingSelection: row, programId: source.programVersionId, stepId: source.stepId, programTitle: source.programTitle, dateKey: row.date_key });
  }
  return result.sort((a, b) => (a.dateKey ?? '').localeCompare(b.dateKey ?? '') || a.id.localeCompare(b.id));
}

export function projectUpcomingRoutineDates(routines: readonly DailyRoutine[], from: string, to: string): { routine: DailyRoutine; dateKey: string }[] {
  if (!isValidDateKey(from) || !isValidDateKey(to) || from > to) return [];
  const result: { routine: DailyRoutine; dateKey: string }[] = [];
  let cursor: string | null = from;
  while (cursor && cursor <= to) {
    for (const routine of routines) if (routine.repeat_unit && isRoutineDueOnDate(routine, cursor)) result.push({ routine, dateKey: cursor });
    cursor = addCalendarDays(cursor, 1);
  }
  return result;
}

export function isValidIanaTimeZone(value: string): boolean {
  if (!value || value === 'local') return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
