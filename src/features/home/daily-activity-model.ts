import type { PublishedTrainingProgram, PublishedTrainingStep } from '../../data/workspace-data';
import type { DailyActivitySnapshot, DailyRoutine, DailyRoutineDay, DailyTrainingSelection } from './daily-activity-data';

export type HomeDailyActivity = {
  id: string;
  label: string;
  routineLabel?: string;
  routineItemId?: string;
  kind: 'routine' | 'training';
  completed: boolean;
  routineDay?: DailyRoutineDay;
  trainingSelection?: DailyTrainingSelection;
  programId?: string;
  stepId?: string;
  programTitle?: string;
};

export type TrainingProgressStamp = {
  dogId: string;
  programVersionId: string;
  stepId: string;
  completedAt: string;
};

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
      routineLabel: row.routine_label_snapshot,
      routineItemId: item.id,
      kind: 'routine',
      completed: row.completed_item_ids.includes(item.id),
      routineDay: row,
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
    });
  }
  return activities;
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
