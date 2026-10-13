import type { PublishedTrainingProgram, PublishedTrainingStep } from '../../data/workspace-data';
import type { DailyActivitySnapshot, DailyRoutineDay, DailyTrainingSelection } from './daily-activity-data';

export type HomeDailyActivity = {
  id: string;
  label: string;
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
    const routine = routinesById.get(row.routine_id);
    if (row.dog_id !== dogId || row.date_key !== dateKey || !routine) continue;
    activities.push({
      id: `routine:${row.id}`,
      label: routine.label,
      kind: 'routine',
      completed: row.completed_at !== null,
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
