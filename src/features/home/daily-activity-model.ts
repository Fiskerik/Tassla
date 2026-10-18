import type { PublishedTrainingProgram, PublishedTrainingStep } from '../../data/workspace-data';
import type { DailyActivitySnapshot, DailyRoutine, DailyRoutineDay, DailyRoutineDaySkip, DailyRoutineSchedule, DailyTrainingSelection, WeeklyActivitySnapshot } from './daily-activity-data';

export type HomeDailyActivity = {
  id: string;
  label: string;
  routineLabel?: string;
  routineItemId?: string;
  kind: 'routine' | 'training';
  completed: boolean;
  completedAt?: string;
  routineDay?: DailyRoutineDay;
  trainingSelection?: DailyTrainingSelection;
  programId?: string;
  stepId?: string;
  programTitle?: string;
  availability?: 'available' | 'unavailable' | 'adult-restricted';
};

export type DailyActivityProgress = {
  completedCount: number;
  confirmedCount: number;
  unavailableCount: number;
};

export type DailyRoutineTemplateEntry = {
  routine: DailyRoutine;
  state: 'selected' | 'skipped' | 'scheduled' | 'not-scheduled';
  selectedDay: DailyRoutineDay | null;
  skippedDay: DailyRoutineDaySkip | null;
  activities: HomeDailyActivity[];
};

export function deriveDailyRoutineTemplateEntries(input: {
  routines: readonly DailyRoutine[];
  routineDays: readonly DailyRoutineDay[];
  routineDaySkips: readonly DailyRoutineDaySkip[];
  dogId: string;
  dateKey: string;
}): DailyRoutineTemplateEntry[] {
  const { routines, routineDays, routineDaySkips, dogId, dateKey } = input;
  if (!dogId || !isValidDateKey(dateKey)) return [];
  const currentRoutines = routines.filter((routine) => routine.dog_id === dogId);
  const routineIds = new Set(currentRoutines.map((routine) => routine.id));
  const selectedByRoutine = new Map<string, DailyRoutineDay>();
  for (const row of routineDays) {
    if (row.dog_id === dogId && row.date_key === dateKey && routineIds.has(row.routine_id) && !selectedByRoutine.has(row.routine_id)) {
      selectedByRoutine.set(row.routine_id, row);
    }
  }
  const skippedByRoutine = new Map<string, DailyRoutineDaySkip>();
  for (const row of routineDaySkips) {
    if (row.dog_id === dogId && row.date_key === dateKey && routineIds.has(row.routine_id) && !skippedByRoutine.has(row.routine_id)) {
      skippedByRoutine.set(row.routine_id, row);
    }
  }
  return currentRoutines.map((routine) => {
    const selectedDay = selectedByRoutine.get(routine.id) ?? null;
    const skippedDay = skippedByRoutine.get(routine.id) ?? null;
    const state = selectedDay ? 'selected' : skippedDay ? 'skipped'
      : isRoutineDueOnDate(routine, dateKey) ? 'scheduled' : 'not-scheduled';
    const activities = selectedDay ? selectedDay.checklist_snapshot.map((item) => ({
      id: `routine:${selectedDay.id}:${item.id}`,
      label: item.label,
      routineLabel: selectedDay.routine_label_snapshot,
      routineItemId: item.id,
      kind: 'routine' as const,
      completed: selectedDay.completed_item_ids.includes(item.id),
      routineDay: selectedDay,
    })) : [];
    return { routine, state, selectedDay, skippedDay, activities };
  });
}

export function isDailyActivitySnapshotWritable(input: {
  snapshotScope: string;
  expectedScope: string;
  updatedAt: number | null | undefined;
  now: number;
  maxAgeMs: number;
  ready: boolean;
  refreshing: boolean;
  refreshError: boolean;
  sameScopeReadInFlight: boolean;
}): boolean {
  const { snapshotScope, expectedScope, updatedAt, now, maxAgeMs, ready, refreshing, refreshError, sameScopeReadInFlight } = input;
  return Boolean(expectedScope && snapshotScope === expectedScope && ready && !refreshing && !refreshError && !sameScopeReadInFlight
    && Number.isFinite(updatedAt) && Number.isFinite(now) && Number.isFinite(maxAgeMs) && maxAgeMs > 0 && now >= (updatedAt ?? Number.POSITIVE_INFINITY)
    && now - (updatedAt ?? now) < maxAgeMs);
}

export function runDailyActivityActionIfWritable<T>(
  input: Parameters<typeof isDailyActivitySnapshotWritable>[0],
  action: () => T,
  onBlocked?: () => void,
): { allowed: true; value: T } | { allowed: false } {
  if (!isDailyActivitySnapshotWritable(input)) {
    onBlocked?.();
    return { allowed: false };
  }
  return { allowed: true, value: action() };
}

export type DailyMutationOrigin = 'home' | 'all';

export function runDailyActivityMutationGateway<T>(input: {
  origin: DailyMutationOrigin;
  snapshot: Parameters<typeof isDailyActivitySnapshotWritable>[0];
  operation: () => T;
  onBlocked?: () => void;
  retryOrigins?: { requested: DailyMutationOrigin; pending: DailyMutationOrigin | null } | null;
  isRetry?: boolean;
  isCurrentDate?: boolean;
  expectedSnapshotVersion?: number | null;
}): { allowed: true; value: T } | { allowed: false } {
  const retryOriginMismatch = Boolean(input.isRetry && (!input.retryOrigins?.pending
    || input.retryOrigins.requested !== input.retryOrigins.pending));
  const staleSession = input.expectedSnapshotVersion !== input.snapshot.updatedAt;
  if (retryOriginMismatch || (input.origin === 'all' && (staleSession || !input.isCurrentDate || !isDailyActivitySnapshotWritable(input.snapshot)))) {
    input.onBlocked?.();
    return { allowed: false };
  }
  return { allowed: true, value: input.operation() };
}

export function isDailyActivityDateCurrent(expectedDateKey: string | null, now: number, timeZone: string): boolean {
  return Boolean(expectedDateKey && Number.isFinite(now) && localDateKeyAt(new Date(now), timeZone) === expectedDateKey);
}

export function dailyActivitySnapshotExpiryDelay(updatedAt: number | null | undefined, now: number, maxAgeMs: number): number | null {
  if (!Number.isFinite(updatedAt) || !Number.isFinite(now) || !Number.isFinite(maxAgeMs) || maxAgeMs <= 0) return null;
  return Math.max(0, (updatedAt as number) + maxAgeMs - now);
}

export function scheduleDailyActivitySnapshotExpiry<Handle>(input: {
  updatedAt: number | null | undefined;
  maxAgeMs: number;
  now: () => number;
  setTimer: (callback: () => void, delayMs: number) => Handle;
  clearTimer: (handle: Handle) => void;
  onExpired: () => void;
}): () => void {
  let timer: Handle | null = null;
  let cancelled = false;
  const check = () => {
    if (cancelled) return;
    const delay = dailyActivitySnapshotExpiryDelay(input.updatedAt, input.now(), input.maxAgeMs);
    if (delay === null || delay === 0) {
      input.onExpired();
      return;
    }
    timer = input.setTimer(check, delay);
  };
  const initialDelay = dailyActivitySnapshotExpiryDelay(input.updatedAt, input.now(), input.maxAgeMs);
  if (initialDelay !== null) timer = input.setTimer(check, initialDelay);
  return () => {
    cancelled = true;
    if (timer !== null) input.clearTimer(timer);
  };
}

export function summarizeDailyActivityProgress(activities: readonly Pick<HomeDailyActivity, 'completed' | 'availability'>[]): DailyActivityProgress {
  const unavailableCount = activities.filter((item) => item.availability === 'unavailable').length;
  const confirmed = activities.filter((item) => item.availability !== 'unavailable');
  return {
    completedCount: confirmed.filter((item) => item.completed).length,
    confirmedCount: confirmed.length,
    unavailableCount,
  };
}

export function dailyActivityProgressLabel(progress: DailyActivityProgress): string {
  const unknownLabel = progress.unavailableCount === 1
    ? '1 status kan inte bekräftas'
    : `${progress.unavailableCount} statusar kan inte bekräftas`;
  if (progress.unavailableCount === 0) return `${progress.completedCount} av ${progress.confirmedCount} klara`;
  if (progress.confirmedCount === 0) return unknownLabel;
  return `${progress.completedCount} av ${progress.confirmedCount} bekräftade klara · ${unknownLabel}`;
}

// No current MVP v2 training version has exact-version approval for adult use.
// Add only version ids that are explicitly approved in the relevance matrix.
export const ADULT_APPROVED_DAILY_TRAINING_VERSION_IDS: readonly string[] = [];

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

export function addDaysToDateKey(dateKey: string, amount: number): string | null {
  if (!isValidDateKey(dateKey) || !Number.isInteger(amount)) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function isoWeekStartForDateKey(dateKey: string): string | null {
  if (!isValidDateKey(dateKey)) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

export function dateKeysForIsoWeek(dateKey: string): string[] | null {
  const weekStart = isoWeekStartForDateKey(dateKey);
  if (!weekStart) return null;
  return Array.from({ length: 7 }, (_, offset) => addDaysToDateKey(weekStart, offset) as string);
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

export function nextRoutineOccurrenceAfterDate(
  routine: Pick<DailyRoutineSchedule, 'repeat_unit' | 'repeat_interval' | 'repeat_weekdays' | 'repeat_anchor_date'>,
  afterDateKey: string,
): string | null {
  if (!isValidDateKey(afterDateKey) || !routine.repeat_unit || !Number.isInteger(routine.repeat_interval)
    || !routine.repeat_interval || routine.repeat_interval < 1 || routine.repeat_interval > 30
    || !routine.repeat_anchor_date || !isValidDateKey(routine.repeat_anchor_date)) return null;
  const searchLimit = routine.repeat_unit === 'day' ? routine.repeat_interval + 1
    : routine.repeat_unit === 'week' ? routine.repeat_interval * 7 + 7
      : routine.repeat_interval * 31 + 31;
  let candidate = addDaysToDateKey(afterDateKey, 1);
  for (let offset = 0; candidate && offset < searchLimit; offset += 1) {
    if (isRoutineDueOnDate(routine, candidate)) return candidate;
    candidate = addDaysToDateKey(candidate, 1);
  }
  return null;
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
  lifeStage: 'VALP' | 'UNGHUND' | 'VUXEN' | null = null,
  adultApprovedVersionIds: readonly string[] = ADULT_APPROVED_DAILY_TRAINING_VERSION_IDS,
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
  const adultApprovedVersions = new Set(adultApprovedVersionIds);
  for (const row of snapshot.trainingSelections) {
    if (row.dog_id !== dogId || row.date_key !== dateKey) continue;
    const program = programById.get(row.program_version_id) ?? { id: '', title: undefined, steps: [], completedAtByStepId: {} };
    const step = program?.steps.find((item) => item.id === row.step_id)
      ?? { id: '', position: 0, title: 'Valt träningssteg kunde inte hämtas', instruction: '' };
    const available = Boolean(program.id && step.id);
    const adultRestricted = lifeStage === 'VUXEN' && !adultApprovedVersions.has(row.program_version_id);
    const stamp = available ? trainingProgressStamp(dogId, program, row.step_id) : null;
    const completed = Boolean(stamp && isTrainingCompletionForDay(stamp, { dogId, programVersionId: row.program_version_id, stepId: row.step_id }, row.date_key, row.time_zone));
    activities.push({
      id: `training:${row.id}`,
      label: step.title,
      kind: 'training',
      completed,
      completedAt: completed ? stamp?.completedAt : undefined,
      trainingSelection: row,
      programId: program.id || undefined,
      stepId: available ? step.id : undefined,
      programTitle: program.title,
      availability: !available ? 'unavailable' : adultRestricted ? 'adult-restricted' : 'available',
    });
  }
  return activities;
}

export type WeeklyActivityRow = {
  id: string;
  label: string;
  routineLabel?: string;
  programTitle?: string;
  kind: 'routine' | 'training' | 'skip';
  status: 'completed' | 'incomplete' | 'unknown' | 'skipped';
  detail?: string;
  openTarget?: { programVersionId: string; stepId: string };
};
export type WeeklyDayProjection = {
  dateKey: string;
  state: 'loading' | 'error' | 'empty' | 'missing' | 'ready';
  rows: WeeklyActivityRow[];
  completedCount: number;
  confirmedCount: number;
  unknownCount: number;
};
export type WeeklyProgressSummary = {
  completedCount: number;
  confirmedCount: number;
  unknownCount: number;
  missingDayCount: number;
  emptyDayCount: number;
};
export type WeeklyActivityProjection = { days: WeeklyDayProjection[]; summary: WeeklyProgressSummary };

export function weeklyActivityLifetimeKey(input: {
  ownerId: string | null;
  accountGeneration: number;
  dogId: string;
  currentDateKey: string | null;
  weekStart: string | null;
  timeZone: string;
  dailySnapshotUpdatedAt: number | null;
  contentMode: 'public' | 'review';
}): string {
  return JSON.stringify([input.ownerId ?? '', input.accountGeneration, input.dogId, input.currentDateKey,
    input.weekStart, input.timeZone, input.dailySnapshotUpdatedAt, input.contentMode]);
}

export function isWeeklyActivityResponseCurrent(
  request: { generation: number; scopeKey: string; aborted: boolean },
  current: { generation: number; scopeKey: string; mounted: boolean },
): boolean {
  return current.mounted && !request.aborted && request.generation === current.generation && request.scopeKey === current.scopeKey;
}

export function projectWeeklyActivity(input: {
  snapshot: WeeklyActivitySnapshot;
  weekStart: string;
  currentDateKey: string;
  dogId: string;
  timeZone: string;
  dailySnapshot: DailyActivitySnapshot | null;
  dailyState: 'loading' | 'ready' | 'error';
  programs: readonly PublishedTrainingProgram[];
  trainingState: 'loading' | 'ready' | 'error';
  lifeStage: 'VALP' | 'UNGHUND' | 'VUXEN' | null;
  adultApprovedVersionIds?: readonly string[];
}): WeeklyActivityProjection {
  const dateKeys = dateKeysForIsoWeek(input.weekStart);
  if (!dateKeys || dateKeys[0] !== input.weekStart || !isValidDateKey(input.currentDateKey)) {
    return { days: [], summary: { completedCount: 0, confirmedCount: 0, unknownCount: 0, missingDayCount: 0, emptyDayCount: 0 } };
  }
  const days = dateKeys.map((dateKey) => projectWeeklyDay(input, dateKey));
  const rows = days.flatMap((day) => day.rows);
  return {
    days,
    summary: {
      completedCount: rows.filter((row) => row.status === 'completed').length,
      confirmedCount: rows.filter((row) => row.status === 'completed' || row.status === 'incomplete').length,
      unknownCount: rows.filter((row) => row.status === 'unknown').length,
      missingDayCount: days.filter((day) => day.state === 'missing').length,
      emptyDayCount: days.filter((day) => day.state === 'empty').length,
    },
  };
}

function projectWeeklyDay(
  input: Parameters<typeof projectWeeklyActivity>[0],
  dateKey: string,
): WeeklyDayProjection {
  if (dateKey === input.currentDateKey) {
    if (input.dailyState === 'loading') return emptyWeeklyDay(dateKey, 'loading');
    if (input.dailyState === 'error' || !input.dailySnapshot) return emptyWeeklyDay(dateKey, 'error');
    const rows: WeeklyActivityRow[] = [];
    for (const day of input.dailySnapshot.routineDays) {
      if (day.dog_id !== input.dogId || day.date_key !== dateKey) continue;
      const timeZoneMismatch = day.time_zone !== input.timeZone;
      for (const item of day.checklist_snapshot) rows.push({
        id: 'routine:' + day.id + ':' + item.id, label: item.label, routineLabel: day.routine_label_snapshot, kind: 'routine',
        status: timeZoneMismatch ? 'unknown' : day.completed_item_ids.includes(item.id) ? 'completed' : 'incomplete',
        detail: timeZoneMismatch ? 'Tidszon skiljer sig — status kan inte bekräftas' : undefined,
      });
    }
    const trainingOnlySnapshot = { ...input.dailySnapshot, routineDays: [], routineDaySkips: [] };
    const todayTraining = deriveHomeDailyActivities(trainingOnlySnapshot, input.programs, input.dogId, dateKey, input.lifeStage,
      input.adultApprovedVersionIds ?? ADULT_APPROVED_DAILY_TRAINING_VERSION_IDS);
    for (const activity of todayTraining) {
      if (activity.kind !== 'training' || !activity.trainingSelection) continue;
      const timeZoneMismatch = activity.trainingSelection.time_zone !== input.timeZone;
      const unavailable = activity.availability !== 'available';
      const status = timeZoneMismatch || unavailable ? 'unknown' : activity.completed ? 'completed' : 'incomplete';
      rows.push({
        id: activity.id, label: activity.label, kind: 'training', status,
        detail: timeZoneMismatch ? 'Tidszon skiljer sig — status kan inte bekräftas'
          : activity.availability === 'adult-restricted' ? 'Inte tillgängligt för vuxna ännu'
            : activity.availability === 'unavailable' ? 'Träningskällan kunde inte hämtas' : undefined,
        ...(activity.programTitle ? { programTitle: activity.programTitle } : {}),
        ...(status !== 'unknown' && activity.programId && activity.stepId
          ? { openTarget: { programVersionId: activity.programId, stepId: activity.stepId } } : {}),
      });
    }
    for (const skipped of input.dailySnapshot.routineDaySkips) {
      if (skipped.dog_id !== input.dogId || skipped.date_key !== dateKey) continue;
      const timeZoneMismatch = skipped.time_zone !== input.timeZone;
      rows.push({
        id: 'skip:' + skipped.day_id, label: skipped.routine_label_snapshot, kind: 'skip',
        status: timeZoneMismatch ? 'unknown' : 'skipped',
        detail: timeZoneMismatch ? 'Överhoppad — tidszon skiljer sig, status kan inte bekräftas' : undefined,
      });
    }
    return summarizeWeeklyDay(dateKey, rows, 'empty');
  }

  const rows: WeeklyActivityRow[] = [];
  const routineDays = input.snapshot.routineDays.filter((row) => row.dog_id === input.dogId && row.date_key === dateKey);
  const selectedRoutineIds = new Set(routineDays.map((row) => row.routine_id));
  for (const day of routineDays) {
    const timeZoneMismatch = day.time_zone !== input.timeZone;
    for (const item of day.checklist_snapshot) rows.push({
      id: 'routine:' + day.id + ':' + item.id, label: item.label, routineLabel: day.routine_label_snapshot, kind: 'routine',
      status: timeZoneMismatch ? 'unknown' : day.completed_item_ids.includes(item.id) ? 'completed' : 'incomplete',
      detail: timeZoneMismatch ? 'Tidszon skiljer sig — status kan inte bekräftas' : undefined,
    });
  }
  for (const skipped of input.snapshot.routineDaySkips) {
    if (skipped.dog_id !== input.dogId || skipped.date_key !== dateKey || selectedRoutineIds.has(skipped.routine_id)) continue;
    const timeZoneMismatch = skipped.time_zone !== input.timeZone;
    rows.push({
      id: 'skip:' + skipped.day_id, label: skipped.routine_label_snapshot, kind: 'skip',
      status: timeZoneMismatch ? 'unknown' : 'skipped',
      detail: timeZoneMismatch ? 'Överhoppad — tidszon skiljer sig, status kan inte bekräftas' : undefined,
    });
  }
  for (const selection of input.snapshot.trainingSelections) {
    if (selection.dog_id !== input.dogId || selection.date_key !== dateKey) continue;
    const program = input.programs.find((item) => item.id === selection.program_version_id);
    const step = program?.steps.find((item) => item.id === selection.step_id);
    const timeZoneMismatch = selection.time_zone !== input.timeZone;
    const adultRestricted = input.lifeStage === 'VUXEN'
      && !(input.adultApprovedVersionIds ?? ADULT_APPROVED_DAILY_TRAINING_VERSION_IDS).includes(selection.program_version_id);
    let status: WeeklyActivityRow['status'] = 'unknown';
    const detail = timeZoneMismatch ? 'Tidszon skiljer sig — status kan inte bekräftas'
      : input.trainingState !== 'ready' ? 'Träningsstatus kunde inte hämtas'
        : adultRestricted ? 'Inte tillgängligt för vuxna ännu'
          : !program || !step ? 'Träningskällan kunde inte hämtas' : undefined;
    if (!timeZoneMismatch && input.trainingState === 'ready' && !adultRestricted && program && step) {
      const stamp = trainingProgressStamp(input.dogId, program, selection.step_id);
      status = stamp && isTrainingCompletionForDay(stamp, {
        dogId: input.dogId, programVersionId: selection.program_version_id, stepId: selection.step_id,
      }, dateKey, selection.time_zone) ? 'completed' : 'incomplete';
    }
    rows.push({
      id: 'training:' + selection.id, label: step?.title ?? 'Valt träningssteg kunde inte hämtas', kind: 'training', status,
      detail,
      ...(program?.title ? { programTitle: program.title } : {}),
    });
  }
  return summarizeWeeklyDay(dateKey, rows, 'missing');
}

function summarizeWeeklyDay(
  dateKey: string,
  rows: WeeklyActivityRow[],
  emptyState: 'empty' | 'missing',
): WeeklyDayProjection {
  if (rows.length === 0) return emptyWeeklyDay(dateKey, emptyState);
  return {
    dateKey, state: 'ready', rows,
    completedCount: rows.filter((row) => row.status === 'completed').length,
    confirmedCount: rows.filter((row) => row.status === 'completed' || row.status === 'incomplete').length,
    unknownCount: rows.filter((row) => row.status === 'unknown').length,
  };
}

function emptyWeeklyDay(dateKey: string, state: WeeklyDayProjection['state']): WeeklyDayProjection {
  return { dateKey, state, rows: [], completedCount: 0, confirmedCount: 0, unknownCount: 0 };
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
