import type { SupabaseClient } from '@supabase/supabase-js';
import { withRequestDeadline, type WriteOutcome } from '../../data/workspace-data';
import { isValidDateKey, isValidIanaTimeZone } from './daily-activity-model';

const REQUEST_TIMEOUT_MS = 12_000;

export type DailyRoutine = { id: string; dog_id: string; label: string };
export type DailyRoutineDay = {
  id: string;
  dog_id: string;
  routine_id: string;
  date_key: string;
  time_zone: string;
  completed_at: string | null;
};
export type DailyTrainingSelection = {
  id: string;
  dog_id: string;
  program_version_id: string;
  step_id: string;
  date_key: string;
  time_zone: string;
};
export type DailyActivitySnapshot = {
  routines: DailyRoutine[];
  routineDays: DailyRoutineDay[];
  trainingSelections: DailyTrainingSelection[];
};

export async function fetchDailyActivitySnapshot(
  client: SupabaseClient,
  dogId: string,
  dateKey: string,
  parentSignal?: AbortSignal,
): Promise<DailyActivitySnapshot> {
  if (!dogId || !isValidDateKey(dateKey)) throw new Error('Invalid daily activity scope');
  const [routines, routineDays, trainingSelections] = await Promise.all([
    withRequestDeadline(async (signal) => await client.from('dog_daily_routines')
      .select('id,dog_id,label').eq('dog_id', dogId).order('label').order('id')
      .retry(false).abortSignal(signal), REQUEST_TIMEOUT_MS, parentSignal),
    withRequestDeadline(async (signal) => await client.from('dog_daily_routine_days')
      .select('id,dog_id,routine_id,date_key,time_zone,completed_at')
      .eq('dog_id', dogId).eq('date_key', dateKey).order('id')
      .retry(false).abortSignal(signal), REQUEST_TIMEOUT_MS, parentSignal),
    withRequestDeadline(async (signal) => await client.from('dog_daily_training_selections')
      .select('id,dog_id,program_version_id,step_id,date_key,time_zone')
      .eq('dog_id', dogId).eq('date_key', dateKey).order('id')
      .retry(false).abortSignal(signal), REQUEST_TIMEOUT_MS, parentSignal),
  ]);
  if (routines.error || !Array.isArray(routines.data) || !routines.data.every((row) => isDailyRoutine(row) && row.dog_id === dogId)) {
    throw new Error('Could not load routine templates');
  }
  if (routineDays.error || !Array.isArray(routineDays.data) || !routineDays.data.every((row) => isDailyRoutineDay(row) && row.dog_id === dogId && row.date_key === dateKey)) {
    throw new Error('Could not load daily routine selections');
  }
  if (trainingSelections.error || !Array.isArray(trainingSelections.data) || !trainingSelections.data.every((row) => isDailyTrainingSelection(row) && row.dog_id === dogId && row.date_key === dateKey)) {
    throw new Error('Could not load daily training selections');
  }
  return {
    routines: routines.data,
    routineDays: routineDays.data,
    trainingSelections: trainingSelections.data,
  };
}

export async function createDailyRoutine(
  client: SupabaseClient,
  row: DailyRoutine,
): Promise<WriteOutcome<DailyRoutine>> {
  if (!isDailyRoutine(row) || !row.label.trim() || row.label.trim() !== row.label) return { status: 'failed' };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_routines')
      .insert(row).retry(false).abortSignal(signal).select('id,dog_id,label').single());
    if (!result.error && isDailyRoutine(result.data) && sameRoutine(result.data, row)) return { status: 'saved', value: result.data };
    failure = result.error ?? new Error('Empty routine create response');
  } catch (error) { failure = error; }
  try {
    const found = await fetchRoutineById(client, row.dog_id, row.id);
    if (found && sameRoutine(found, row)) return { status: 'saved', value: found };
    return isDefiniteRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function updateDailyRoutineLabel(
  client: SupabaseClient,
  dogId: string,
  routineId: string,
  expectedLabel: string,
  label: string,
): Promise<WriteOutcome<DailyRoutine>> {
  const normalized = label.trim();
  if (!normalized || Array.from(normalized).length > 160 || normalized === expectedLabel) return { status: 'failed' };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_routines')
      .update({ label: normalized }).eq('dog_id', dogId).eq('id', routineId).eq('label', expectedLabel)
      .retry(false).abortSignal(signal).select('id,dog_id,label').maybeSingle());
    if (!result.error && isDailyRoutine(result.data) && sameRoutine(result.data, { id: routineId, dog_id: dogId, label: normalized })) {
      return { status: 'saved', value: result.data };
    }
    failure = result.error ?? new Error('Routine label changed before save');
  } catch (error) { failure = error; }
  try {
    const found = await fetchRoutineById(client, dogId, routineId);
    if (found && found.label === normalized) return { status: 'saved', value: found };
    return isDefiniteRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function deleteDailyRoutine(
  client: SupabaseClient,
  row: DailyRoutine,
): Promise<WriteOutcome<null>> {
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_routines')
      .delete().eq('dog_id', row.dog_id).eq('id', row.id).eq('label', row.label)
      .retry(false).abortSignal(signal).select('id').maybeSingle());
    if (!result.error && result.data?.id === row.id) return { status: 'saved', value: null };
    if (!result.error && result.data === null) {
      const current = await fetchRoutineById(client, row.dog_id, row.id);
      return current ? { status: 'unknown' } : { status: 'saved', value: null };
    }
    failure = result.error ?? new Error('Empty routine delete response');
  } catch (error) { failure = error; }
  try {
    const current = await fetchRoutineById(client, row.dog_id, row.id);
    if (!current) return { status: 'saved', value: null };
    return isDefiniteRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function addRoutineToDay(
  client: SupabaseClient,
  row: DailyRoutineDay,
): Promise<WriteOutcome<DailyRoutineDay>> {
  if (!isDailyRoutineDay(row) || row.completed_at !== null || !isValidIanaTimeZone(row.time_zone)) return { status: 'failed' };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_routine_days')
      .insert({ id: row.id, dog_id: row.dog_id, routine_id: row.routine_id, date_key: row.date_key, time_zone: row.time_zone })
      .retry(false).abortSignal(signal).select('id,dog_id,routine_id,date_key,time_zone,completed_at').single());
    if (!result.error && isDailyRoutineDay(result.data) && sameRoutineDay(result.data, row)) return { status: 'saved', value: result.data };
    failure = result.error ?? new Error('Empty routine selection response');
  } catch (error) { failure = error; }
  try {
    const found = await fetchRoutineDay(client, row.dog_id, row.id, row.routine_id, row.date_key);
    if (found && sameRoutineDay(found, row)) return { status: 'saved', value: found };
    const logical = await fetchRoutineDayByKey(client, row.dog_id, row.routine_id, row.date_key);
    if (logical && sameRoutineDay(logical, row, false)) return { status: 'saved', value: logical };
    return isDefiniteRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function removeRoutineFromDay(
  client: SupabaseClient,
  row: DailyRoutineDay,
): Promise<WriteOutcome<null>> {
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_routine_days')
      .delete().eq('dog_id', row.dog_id).eq('id', row.id).eq('routine_id', row.routine_id).eq('date_key', row.date_key)
      .retry(false).abortSignal(signal).select('id').maybeSingle());
    if (!result.error && result.data?.id === row.id) return { status: 'saved', value: null };
    if (!result.error && result.data === null) {
      const current = await fetchRoutineDay(client, row.dog_id, row.id, row.routine_id, row.date_key);
      return current ? { status: 'unknown' } : { status: 'saved', value: null };
    }
    failure = result.error ?? new Error('Empty routine selection delete response');
  } catch (error) { failure = error; }
  try {
    const current = await fetchRoutineDay(client, row.dog_id, row.id, row.routine_id, row.date_key);
    if (!current) return { status: 'saved', value: null };
    return isDefiniteRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function setRoutineDayCompletion(
  client: SupabaseClient,
  row: DailyRoutineDay,
  completed: boolean,
): Promise<WriteOutcome<DailyRoutineDay>> {
  if (completed && row.completed_at !== null || !completed && row.completed_at === null) return { status: 'failed' };
  const expected = row.completed_at;
  let failure: unknown = null;
  try {
    let query = client.from('dog_daily_routine_days').update({ completed_at: completed ? new Date().toISOString() : null })
      .eq('dog_id', row.dog_id).eq('id', row.id).eq('date_key', row.date_key);
    query = expected === null ? query.is('completed_at', null) : query.eq('completed_at', expected);
    const result = await withRequestDeadline(async (signal) => await query.retry(false).abortSignal(signal)
      .select('id,dog_id,routine_id,date_key,time_zone,completed_at').maybeSingle());
    if (!result.error && isDailyRoutineDay(result.data) && result.data.completed_at !== expected && Boolean(result.data.completed_at) === completed) {
      return { status: 'saved', value: result.data };
    }
    if (!result.error && result.data === null) {
      const current = await fetchRoutineDay(client, row.dog_id, row.id, row.routine_id, row.date_key);
      if (current && Boolean(current.completed_at) === completed) return { status: 'saved', value: current };
    }
    failure = result.error ?? new Error('Routine completion changed before save');
  } catch (error) { failure = error; }
  try {
    const current = await fetchRoutineDay(client, row.dog_id, row.id, row.routine_id, row.date_key);
    if (current && Boolean(current.completed_at) === completed) return { status: 'saved', value: current };
    return isDefiniteRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function addTrainingSelection(
  client: SupabaseClient,
  row: DailyTrainingSelection,
): Promise<WriteOutcome<DailyTrainingSelection>> {
  if (!isDailyTrainingSelection(row) || !isValidIanaTimeZone(row.time_zone)) return { status: 'failed' };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_training_selections')
      .insert(row).retry(false).abortSignal(signal).select('id,dog_id,program_version_id,step_id,date_key,time_zone').single());
    if (!result.error && isDailyTrainingSelection(result.data) && sameTrainingSelection(result.data, row)) return { status: 'saved', value: result.data };
    failure = result.error ?? new Error('Empty training selection response');
  } catch (error) { failure = error; }
  try {
    const found = await fetchTrainingSelection(client, row.dog_id, row.id, row.program_version_id, row.step_id, row.date_key);
    if (found && sameTrainingSelection(found, row)) return { status: 'saved', value: found };
    const logical = await fetchTrainingSelectionByKey(client, row.dog_id, row.program_version_id, row.step_id, row.date_key);
    if (logical && sameTrainingSelection(logical, row, false)) return { status: 'saved', value: logical };
    return isDefiniteRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function removeTrainingSelection(
  client: SupabaseClient,
  row: DailyTrainingSelection,
): Promise<WriteOutcome<null>> {
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_training_selections')
      .delete().eq('dog_id', row.dog_id).eq('id', row.id).eq('program_version_id', row.program_version_id)
      .eq('step_id', row.step_id).eq('date_key', row.date_key).retry(false).abortSignal(signal).select('id').maybeSingle());
    if (!result.error && result.data?.id === row.id) return { status: 'saved', value: null };
    if (!result.error && result.data === null) {
      const current = await fetchTrainingSelection(client, row.dog_id, row.id, row.program_version_id, row.step_id, row.date_key);
      return current ? { status: 'unknown' } : { status: 'saved', value: null };
    }
    failure = result.error ?? new Error('Empty training selection delete response');
  } catch (error) { failure = error; }
  try {
    const current = await fetchTrainingSelection(client, row.dog_id, row.id, row.program_version_id, row.step_id, row.date_key);
    if (!current) return { status: 'saved', value: null };
    return isDefiniteRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

async function fetchRoutineById(client: SupabaseClient, dogId: string, id: string): Promise<DailyRoutine | null> {
  const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_routines')
    .select('id,dog_id,label').eq('dog_id', dogId).eq('id', id).retry(false).abortSignal(signal).maybeSingle());
  if (result.error) throw new Error('Could not confirm routine status');
  if (result.data === null) return null;
  if (!isDailyRoutine(result.data)) throw new Error('Routine response did not match the database contract');
  return result.data;
}

async function fetchRoutineDay(client: SupabaseClient, dogId: string, id: string, routineId: string, dateKey: string): Promise<DailyRoutineDay | null> {
  const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_routine_days')
    .select('id,dog_id,routine_id,date_key,time_zone,completed_at').eq('dog_id', dogId).eq('id', id)
    .eq('routine_id', routineId).eq('date_key', dateKey).retry(false).abortSignal(signal).maybeSingle());
  if (result.error) throw new Error('Could not confirm daily routine status');
  if (result.data === null) return null;
  if (!isDailyRoutineDay(result.data)) throw new Error('Daily routine response did not match the database contract');
  return result.data;
}

async function fetchRoutineDayByKey(client: SupabaseClient, dogId: string, routineId: string, dateKey: string): Promise<DailyRoutineDay | null> {
  const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_routine_days')
    .select('id,dog_id,routine_id,date_key,time_zone,completed_at').eq('dog_id', dogId)
    .eq('routine_id', routineId).eq('date_key', dateKey).retry(false).abortSignal(signal).maybeSingle());
  if (result.error) throw new Error('Could not confirm daily routine status');
  if (result.data === null) return null;
  if (!isDailyRoutineDay(result.data)) throw new Error('Daily routine response did not match the database contract');
  return result.data;
}

async function fetchTrainingSelection(client: SupabaseClient, dogId: string, id: string, versionId: string, stepId: string, dateKey: string): Promise<DailyTrainingSelection | null> {
  const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_training_selections')
    .select('id,dog_id,program_version_id,step_id,date_key,time_zone').eq('dog_id', dogId).eq('id', id)
    .eq('program_version_id', versionId).eq('step_id', stepId).eq('date_key', dateKey).retry(false).abortSignal(signal).maybeSingle());
  if (result.error) throw new Error('Could not confirm training selection status');
  if (result.data === null) return null;
  if (!isDailyTrainingSelection(result.data)) throw new Error('Training selection response did not match the database contract');
  return result.data;
}

async function fetchTrainingSelectionByKey(client: SupabaseClient, dogId: string, versionId: string, stepId: string, dateKey: string): Promise<DailyTrainingSelection | null> {
  const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_training_selections')
    .select('id,dog_id,program_version_id,step_id,date_key,time_zone').eq('dog_id', dogId)
    .eq('program_version_id', versionId).eq('step_id', stepId).eq('date_key', dateKey).retry(false).abortSignal(signal).maybeSingle());
  if (result.error) throw new Error('Could not confirm training selection status');
  if (result.data === null) return null;
  if (!isDailyTrainingSelection(result.data)) throw new Error('Training selection response did not match the database contract');
  return result.data;
}

function isDailyRoutine(value: unknown): value is DailyRoutine {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.dog_id === 'string' && typeof row.label === 'string'
    && row.label.trim().length > 0 && Array.from(row.label).length <= 160;
}

function isDailyRoutineDay(value: unknown): value is DailyRoutineDay {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.dog_id === 'string' && typeof row.routine_id === 'string'
    && typeof row.date_key === 'string' && isValidDateKey(row.date_key) && typeof row.time_zone === 'string'
    && isValidIanaTimeZone(row.time_zone) && (row.completed_at === null || typeof row.completed_at === 'string' && Number.isFinite(Date.parse(row.completed_at)));
}

function isDailyTrainingSelection(value: unknown): value is DailyTrainingSelection {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.dog_id === 'string' && typeof row.program_version_id === 'string'
    && typeof row.step_id === 'string' && typeof row.date_key === 'string' && isValidDateKey(row.date_key)
    && typeof row.time_zone === 'string' && isValidIanaTimeZone(row.time_zone);
}

function sameRoutine(left: DailyRoutine, right: DailyRoutine): boolean {
  return left.id === right.id && left.dog_id === right.dog_id && left.label === right.label;
}

function sameRoutineDay(left: DailyRoutineDay, right: DailyRoutineDay, includeId = true): boolean {
  return (!includeId || left.id === right.id) && left.dog_id === right.dog_id && left.routine_id === right.routine_id
    && left.date_key === right.date_key && left.time_zone === right.time_zone;
}

function sameTrainingSelection(left: DailyTrainingSelection, right: DailyTrainingSelection, includeId = true): boolean {
  return (!includeId || left.id === right.id) && left.dog_id === right.dog_id
    && left.program_version_id === right.program_version_id && left.step_id === right.step_id
    && left.date_key === right.date_key && left.time_zone === right.time_zone;
}

function isDefiniteRejection(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const row = error as Record<string, unknown>;
  if (typeof row.status === 'number' && row.status >= 400 && row.status < 500) return true;
  return typeof row.code === 'string' && (/^[0-9A-Z]{5}$/.test(row.code) || /^PGRST\d{3}$/.test(row.code));
}
