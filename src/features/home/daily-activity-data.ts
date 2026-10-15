import type { SupabaseClient } from '@supabase/supabase-js';
import { withRequestDeadline, type WriteOutcome } from '../../data/workspace-data';
import { isRoutineDueOnDate, isValidDateKey, isValidIanaTimeZone } from './daily-activity-model';

const REQUEST_TIMEOUT_MS = 12_000;
const DAILY_ROUTINE_COLUMNS = 'id,dog_id,label,checklist,checklist_revision,legacy_single_item,repeat_unit,repeat_interval,repeat_weekdays,repeat_anchor_date';
const DAILY_ROUTINE_DAY_COLUMNS = 'id,dog_id,routine_id,date_key,time_zone,routine_label_snapshot,checklist_snapshot,completed_item_ids,completed_at,is_recurring_occurrence,routine_revision_snapshot,routine_day_revision,last_state_mutation_id';
const DAILY_ROUTINE_DAY_SKIP_COLUMNS = 'day_id,dog_id,routine_id,date_key,time_zone,routine_label_snapshot,checklist_snapshot,completed_item_ids,completed_at,is_recurring_occurrence,routine_revision_snapshot,routine_day_revision,last_state_mutation_id';

export type DailyRoutineChecklistItem = { id: string; label: string };
export type DailyRoutineRepeatUnit = 'day' | 'week' | 'month';
export type DailyRoutine = {
  id: string;
  dog_id: string;
  label: string;
  checklist: DailyRoutineChecklistItem[];
  checklist_revision: number;
  legacy_single_item: boolean;
  repeat_unit: DailyRoutineRepeatUnit | null;
  repeat_interval: number | null;
  repeat_weekdays: number[] | null;
  repeat_anchor_date: string | null;
};
export type DailyRoutineDraft = Pick<DailyRoutine, 'id' | 'dog_id' | 'label' | 'checklist' | 'repeat_unit' | 'repeat_interval' | 'repeat_weekdays'>;
export type DailyRoutineCreateInput = Pick<DailyRoutine, 'id' | 'label' | 'checklist' | 'repeat_unit' | 'repeat_interval' | 'repeat_weekdays'>;
export type DailyRoutineDayDraft = Pick<DailyRoutineDay, 'id' | 'dog_id' | 'routine_id' | 'date_key' | 'time_zone'> & {
  routine_label_snapshot: string;
  checklist_snapshot: DailyRoutineChecklistItem[];
};
export type DailyRoutineDay = {
  id: string;
  dog_id: string;
  routine_id: string;
  date_key: string;
  time_zone: string;
  routine_label_snapshot: string;
  checklist_snapshot: DailyRoutineChecklistItem[];
  completed_item_ids: string[];
  completed_at: string | null;
  is_recurring_occurrence: boolean;
  routine_revision_snapshot: number;
  routine_day_revision: number;
  last_state_mutation_id: string | null;
};
export type DailyRoutineDaySkip = Omit<DailyRoutineDay, 'id'> & { day_id: string };
export type DailyRoutineRepeatRule = Pick<DailyRoutine, 'repeat_unit' | 'repeat_interval' | 'repeat_weekdays'>;
export type DailyRoutineSaveInput = Pick<DailyRoutine, 'label' | 'checklist' | 'repeat_unit' | 'repeat_interval' | 'repeat_weekdays'>;
export type DailyRoutineWriteResult = WriteOutcome<DailyRoutine>;
export type DailyRoutineSkipSnapshot = Pick<DailyRoutineDaySkip, 'day_id' | 'routine_day_revision' | 'last_state_mutation_id'>;
export type DailyRoutineDayRevision = Pick<DailyRoutineDay, 'routine_day_revision' | 'last_state_mutation_id'>;
export type DailyRoutineRepeatValues = {
  repeat_unit: DailyRoutineRepeatUnit | null;
  repeat_interval: number | null;
  repeat_weekdays: number[] | null;
};
type RoutineSaveValues = Pick<DailyRoutine, 'label' | 'checklist' | 'repeat_unit' | 'repeat_interval' | 'repeat_weekdays'>;
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
  routineDaySkips: DailyRoutineDaySkip[];
  trainingSelections: DailyTrainingSelection[];
};

export async function fetchDailyActivitySnapshot(
  client: SupabaseClient,
  dogId: string,
  dateKey: string,
  timeZone: string,
  parentSignal?: AbortSignal,
): Promise<DailyActivitySnapshot> {
  if (!dogId || !isValidDateKey(dateKey) || !isValidIanaTimeZone(timeZone)) throw new Error('Invalid daily activity scope');
  const due = await withRequestDeadline(async (signal) => await client.rpc('ensure_due_daily_routine_days', {
    p_dog_id: dogId, p_date_key: dateKey, p_time_zone: timeZone,
  }).abortSignal(signal), REQUEST_TIMEOUT_MS, parentSignal);
  if (due.error) throw new Error('Could not prepare today’s routines');
  const [routines, routineDays, routineDaySkips, trainingSelections] = await Promise.all([
    withRequestDeadline(async (signal) => await client.from('dog_daily_routines')
      .select(DAILY_ROUTINE_COLUMNS).eq('dog_id', dogId).order('label').order('id')
      .retry(false).abortSignal(signal), REQUEST_TIMEOUT_MS, parentSignal),
    withRequestDeadline(async (signal) => await client.from('dog_daily_routine_days')
      .select(DAILY_ROUTINE_DAY_COLUMNS)
      .eq('dog_id', dogId).eq('date_key', dateKey).order('id')
      .retry(false).abortSignal(signal), REQUEST_TIMEOUT_MS, parentSignal),
    withRequestDeadline(async (signal) => await client.from('dog_daily_routine_day_skips')
      .select(DAILY_ROUTINE_DAY_SKIP_COLUMNS)
      .eq('dog_id', dogId).eq('date_key', dateKey).order('day_id')
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
  if (routineDaySkips.error || !Array.isArray(routineDaySkips.data) || !routineDaySkips.data.every((row) => isDailyRoutineDaySkip(row) && row.dog_id === dogId && row.date_key === dateKey)) {
    throw new Error('Could not load skipped routine selections');
  }
  if (trainingSelections.error || !Array.isArray(trainingSelections.data) || !trainingSelections.data.every((row) => isDailyTrainingSelection(row) && row.dog_id === dogId && row.date_key === dateKey)) {
    throw new Error('Could not load daily training selections');
  }
  return {
    routines: routines.data,
    routineDays: routineDays.data,
    routineDaySkips: routineDaySkips.data,
    trainingSelections: trainingSelections.data,
  };
}

export async function createDailyRoutine(
  client: SupabaseClient,
  row: DailyRoutineDraft,
  timeZone: string,
): Promise<WriteOutcome<DailyRoutine>> {
  if (!isDailyRoutineDraft(row) || !isValidIanaTimeZone(timeZone)) return { status: 'failed' };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.rpc('create_daily_routine_v2', {
      p_dog_id: row.dog_id,
      p_routine_id: row.id,
      p_label: row.label,
      p_checklist: row.checklist,
      p_repeat_unit: row.repeat_unit,
      p_repeat_interval: row.repeat_interval,
      p_repeat_weekdays: row.repeat_weekdays,
      p_time_zone: timeZone,
    }).abortSignal(signal), REQUEST_TIMEOUT_MS);
    const rpcRow = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!result.error && isDailyRoutine(rpcRow) && sameRoutineSave(rpcRow, row) && hasValidAnchor(rpcRow)) return { status: 'saved', value: rpcRow };
    failure = result.error ?? new Error('Empty routine create response');
  } catch (error) { failure = error; }
  try {
    const found = await fetchRoutineById(client, row.dog_id, row.id);
    if (found && sameRoutineSave(found, row) && hasValidAnchor(found)) return { status: 'saved', value: found };
    return isDefiniteRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function replaceDailyRoutine(
  client: SupabaseClient,
  routine: DailyRoutine,
  label: string,
  checklist: DailyRoutineChecklistItem[],
  repeat: DailyRoutineRepeatValues,
  timeZone: string,
): Promise<WriteOutcome<DailyRoutine>> {
  const normalized = label.trim();
  if (!isValidRoutineDefinition(normalized, checklist) || !isValidRepeatRule(repeat.repeat_unit, repeat.repeat_interval)
    || !isValidRepeatWeekdays(repeat.repeat_unit, repeat.repeat_weekdays) || !isValidIanaTimeZone(timeZone)) return { status: 'failed' };
  const expectedRevision = routine.checklist_revision;
  const desiredRepeat = normalizeRoutineRepeat(routine, repeat);
  const desired: DailyRoutineSaveInput = { label: normalized, checklist, ...desiredRepeat };
  if (sameRoutineSave(routine, desired)) return { status: 'failed' };
  const sameRepeat = sameRoutineRepeat(routine, desiredRepeat);
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.rpc('replace_daily_routine_v2', {
      p_dog_id: routine.dog_id,
      p_routine_id: routine.id,
      p_expected_revision: expectedRevision,
      p_label: normalized,
      p_checklist: checklist,
      p_repeat_unit: desiredRepeat.repeat_unit,
      p_repeat_interval: desiredRepeat.repeat_interval,
      p_repeat_weekdays: desiredRepeat.repeat_weekdays,
      p_time_zone: timeZone,
    }).abortSignal(signal));
    const rpcRow = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!result.error && isDailyRoutine(rpcRow) && sameRoutineSave(rpcRow, desired) && hasValidAnchor(rpcRow)
      && (!sameRepeat || rpcRow.repeat_anchor_date === routine.repeat_anchor_date)
      && rpcRow.checklist_revision === expectedRevision + 1) {
      return { status: 'saved', value: rpcRow };
    }
    if (!result.error && rpcRow !== null && rpcRow !== undefined) {
      failure = new Error('Routine replacement response did not match the requested revision');
    } else {
      failure = result.error ?? new Error('Empty routine replacement response');
    }
    const found = await fetchRoutineById(client, routine.dog_id, routine.id);
    if (found && sameRoutineSave(found, desired) && hasValidAnchor(found)
      && (!sameRepeat || found.repeat_anchor_date === routine.repeat_anchor_date)
      && found.checklist_revision === expectedRevision + 1) {
      return { status: 'saved', value: found };
    }
  } catch (error) { failure = error; }
  try {
    const found = await fetchRoutineById(client, routine.dog_id, routine.id);
    if (found && sameRoutineSave(found, desired) && hasValidAnchor(found)
      && (!sameRepeat || found.repeat_anchor_date === routine.repeat_anchor_date)
      && found.checklist_revision === expectedRevision + 1) return { status: 'saved', value: found };
    if (found && found.checklist_revision !== expectedRevision) return { status: 'failed' };
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
      .delete().eq('dog_id', row.dog_id).eq('id', row.id).eq('checklist_revision', row.checklist_revision)
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
  row: DailyRoutineDayDraft,
  skipped: DailyRoutineDaySkip | null,
  mutationId: string,
): Promise<WriteOutcome<DailyRoutineDay | DailyRoutineDaySkip>> {
  if (!isDailyRoutineDayDraft(row)) return { status: 'failed' };
  if (skipped) return await setRoutineDaySkipped(client, skipped, false, mutationId);
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_routine_days')
      .insert({ id: row.id, dog_id: row.dog_id, routine_id: row.routine_id, date_key: row.date_key, time_zone: row.time_zone })
      .retry(false).abortSignal(signal).select(DAILY_ROUTINE_DAY_COLUMNS).single());
    if (!result.error && isDailyRoutineDay(result.data) && matchesRoutineDayDraft(result.data, row)) return { status: 'saved', value: result.data };
    failure = result.error ?? new Error('Empty routine selection response');
  } catch (error) { failure = error; }
  try {
    const found = await fetchRoutineDay(client, row.dog_id, row.id, row.routine_id, row.date_key);
    if (found && matchesRoutineDayDraft(found, row)) return { status: 'saved', value: found };
    const logical = await fetchRoutineDayByKey(client, row.dog_id, row.routine_id, row.date_key);
    if (logical && matchesRoutineDayDraft(logical, row, false)) return { status: 'saved', value: logical };
    return isDefiniteRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function removeRoutineFromDay(
  client: SupabaseClient,
  row: DailyRoutineDay,
  routine: DailyRoutine,
  mutationId: string,
): Promise<WriteOutcome<null | DailyRoutineDay | DailyRoutineDaySkip>> {
  if (row.is_recurring_occurrence || isRoutineDueOnDate(routine, row.date_key)) {
    return await setRoutineDaySkipped(client, row, true, mutationId);
  }
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

async function setRoutineDaySkipped(
  client: SupabaseClient,
  row: DailyRoutineDay | DailyRoutineDaySkip,
  skipped: boolean,
  mutationId: string,
): Promise<WriteOutcome<DailyRoutineDay | DailyRoutineDaySkip>> {
  if (!isDailyRoutineDay(row) && !isDailyRoutineDaySkip(row)) return { status: 'failed' };
  if (!isCanonicalUuid(mutationId)) return { status: 'failed' };
  const id = 'id' in row ? row.id : row.day_id;
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.rpc('set_daily_routine_day_skipped', {
      p_dog_id: row.dog_id,
      p_routine_id: row.routine_id,
      p_date_key: row.date_key,
      p_time_zone: row.time_zone,
      p_expected_revision: row.routine_day_revision,
      p_mutation_id: mutationId,
      p_skipped: skipped,
    }).abortSignal(signal), REQUEST_TIMEOUT_MS);
    if (result.error) failure = result.error;
  } catch (error) { failure = error; }

  try {
    const [active, skip] = await Promise.all([
      fetchRoutineDayByKey(client, row.dog_id, row.routine_id, row.date_key),
      fetchRoutineDaySkipByKey(client, row.dog_id, row.routine_id, row.date_key),
    ]);
    if (skipped && !active && skip && isDailyRoutineDaySkip(skip)
      && sameRoutineOccurrence(row, skip) && skip.routine_day_revision === row.routine_day_revision + 1
      && skip.last_state_mutation_id === mutationId && skip.day_id === id) {
      return { status: 'saved', value: skip };
    }
    if (!skipped && !skip && active && isDailyRoutineDay(active)
      && sameRoutineOccurrence(row, active) && active.routine_day_revision === row.routine_day_revision + 1
      && active.last_state_mutation_id === mutationId && active.id === id) {
      return { status: 'saved', value: active };
    }
    if (failure) return isDefiniteRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
    return { status: 'failed' };
  } catch {
    return failure && isDefiniteRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  }
}

export async function setRoutineDayCompletion(
  client: SupabaseClient,
  row: DailyRoutineDay,
  itemId: string,
  completed: boolean,
): Promise<WriteOutcome<DailyRoutineDay>> {
  if (!isDailyRoutineDay(row) || !row.checklist_snapshot.some((item) => item.id === itemId)
    || row.completed_item_ids.includes(itemId) === completed) return { status: 'failed' };
  const expected = row.completed_item_ids;
  const desired = row.checklist_snapshot.map((item) => item.id).filter((id) => id === itemId ? completed : expected.includes(id));
  let failure: unknown = null;
  try {
    const query = client.from('dog_daily_routine_days').update({ completed_item_ids: desired })
      .eq('dog_id', row.dog_id).eq('id', row.id).eq('routine_id', row.routine_id).eq('date_key', row.date_key)
      .eq('completed_item_ids', expected);
    const result = await withRequestDeadline(async (signal) => await query.retry(false).abortSignal(signal)
      .select(DAILY_ROUTINE_DAY_COLUMNS).maybeSingle());
    if (!result.error && isDailyRoutineDay(result.data) && sameRoutineDayDefinition(result.data, row)
      && sameStringArray(result.data.completed_item_ids, desired)) {
      return { status: 'saved', value: result.data };
    }
    if (!result.error && result.data === null) {
      const current = await fetchRoutineDay(client, row.dog_id, row.id, row.routine_id, row.date_key);
      if (current && sameRoutineDayDefinition(current, row) && sameStringArray(current.completed_item_ids, desired)) return { status: 'saved', value: current };
    }
    failure = result.error ?? new Error('Routine completion changed before save');
  } catch (error) { failure = error; }
  try {
    const current = await fetchRoutineDay(client, row.dog_id, row.id, row.routine_id, row.date_key);
    if (current && sameRoutineDayDefinition(current, row) && sameStringArray(current.completed_item_ids, desired)) return { status: 'saved', value: current };
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
    .select(DAILY_ROUTINE_COLUMNS).eq('dog_id', dogId).eq('id', id).retry(false).abortSignal(signal).maybeSingle());
  if (result.error) throw new Error('Could not confirm routine status');
  if (result.data === null) return null;
  if (!isDailyRoutine(result.data)) throw new Error('Routine response did not match the database contract');
  return result.data;
}

async function fetchRoutineDay(client: SupabaseClient, dogId: string, id: string, routineId: string, dateKey: string): Promise<DailyRoutineDay | null> {
  const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_routine_days')
    .select(DAILY_ROUTINE_DAY_COLUMNS).eq('dog_id', dogId).eq('id', id)
    .eq('routine_id', routineId).eq('date_key', dateKey).retry(false).abortSignal(signal).maybeSingle());
  if (result.error) throw new Error('Could not confirm daily routine status');
  if (result.data === null) return null;
  if (!isDailyRoutineDay(result.data)) throw new Error('Daily routine response did not match the database contract');
  return result.data;
}

async function fetchRoutineDayByKey(client: SupabaseClient, dogId: string, routineId: string, dateKey: string): Promise<DailyRoutineDay | null> {
  const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_routine_days')
    .select(DAILY_ROUTINE_DAY_COLUMNS).eq('dog_id', dogId)
    .eq('routine_id', routineId).eq('date_key', dateKey).retry(false).abortSignal(signal).maybeSingle());
  if (result.error) throw new Error('Could not confirm daily routine status');
  if (result.data === null) return null;
  if (!isDailyRoutineDay(result.data)) throw new Error('Daily routine response did not match the database contract');
  return result.data;
}

async function fetchRoutineDaySkipByKey(client: SupabaseClient, dogId: string, routineId: string, dateKey: string): Promise<DailyRoutineDaySkip | null> {
  const result = await withRequestDeadline(async (signal) => await client.from('dog_daily_routine_day_skips')
    .select(DAILY_ROUTINE_DAY_SKIP_COLUMNS).eq('dog_id', dogId)
    .eq('routine_id', routineId).eq('date_key', dateKey).retry(false).abortSignal(signal).maybeSingle());
  if (result.error) throw new Error('Could not confirm skipped routine status');
  if (result.data === null) return null;
  if (!isDailyRoutineDaySkip(result.data)) throw new Error('Skipped routine response did not match the database contract');
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
  return isCanonicalUuid(row.id) && isCanonicalUuid(row.dog_id) && typeof row.label === 'string'
    && row.label.trim() === row.label && Array.from(row.label).length > 0 && Array.from(row.label).length <= 160
    && isValidRoutineChecklist(row.checklist) && Number.isInteger(row.checklist_revision) && Number(row.checklist_revision) >= 1
    && typeof row.legacy_single_item === 'boolean'
    && isValidStoredRepeatRule(row.repeat_unit, row.repeat_interval, row.repeat_weekdays, row.repeat_anchor_date);
}

function isDailyRoutineDraft(value: unknown): value is DailyRoutineDraft {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return isCanonicalUuid(row.id) && isCanonicalUuid(row.dog_id) && typeof row.label === 'string'
    && isValidRoutineDefinition(row.label, row.checklist)
    && isValidRepeatRule(row.repeat_unit as DailyRoutineRepeatUnit | null, row.repeat_interval as number | null)
    && isValidRepeatWeekdays(row.repeat_unit as DailyRoutineRepeatUnit | null, row.repeat_weekdays);
}

function isValidRoutineDefinition(label: string, checklist: unknown): checklist is DailyRoutineChecklistItem[] {
  return typeof label === 'string' && label.trim() === label && Array.from(label).length > 0 && Array.from(label).length <= 160
    && isValidRoutineChecklist(checklist);
}

function isValidRoutineChecklist(value: unknown): value is DailyRoutineChecklistItem[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50) return false;
  const seen = new Set<string>();
  return value.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const row = item as Record<string, unknown>;
    if (Object.keys(row).sort().join(',') !== 'id,label' || !isCanonicalUuid(row.id)
      || typeof row.label !== 'string' || row.label.trim() !== row.label
      || Array.from(row.label).length < 1 || Array.from(row.label).length > 160 || seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function isDailyRoutineDayDraft(value: unknown): value is DailyRoutineDayDraft {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return isCanonicalUuid(row.id) && isCanonicalUuid(row.dog_id) && isCanonicalUuid(row.routine_id)
    && typeof row.date_key === 'string' && isValidDateKey(row.date_key) && typeof row.time_zone === 'string'
    && isValidIanaTimeZone(row.time_zone) && typeof row.routine_label_snapshot === 'string'
    && row.routine_label_snapshot.trim() === row.routine_label_snapshot && row.routine_label_snapshot.length > 0
    && isValidRoutineChecklist(row.checklist_snapshot);
}

function isDailyRoutineDay(value: unknown): value is DailyRoutineDay {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  if (!isCanonicalUuid(row.id) || !isCanonicalUuid(row.dog_id) || !isCanonicalUuid(row.routine_id)
    || typeof row.date_key !== 'string' || !isValidDateKey(row.date_key) || typeof row.time_zone !== 'string'
    || !isValidIanaTimeZone(row.time_zone) || typeof row.routine_label_snapshot !== 'string'
    || row.routine_label_snapshot.trim() !== row.routine_label_snapshot || row.routine_label_snapshot.length < 1
    || !isValidRoutineChecklist(row.checklist_snapshot) || !Array.isArray(row.completed_item_ids)
    || !row.completed_item_ids.every(isCanonicalUuid) || typeof row.is_recurring_occurrence !== 'boolean'
    || !Number.isInteger(row.routine_revision_snapshot) || Number(row.routine_revision_snapshot) < 1
    || !Number.isInteger(row.routine_day_revision) || Number(row.routine_day_revision) < 1
    || !(row.last_state_mutation_id === null || isCanonicalUuid(row.last_state_mutation_id))) return false;
  const snapshotIds = row.checklist_snapshot.map((item) => item.id);
  const completed = row.completed_item_ids as string[];
  const canonicalCompleted = snapshotIds.filter((id) => completed.includes(id));
  return completed.length === canonicalCompleted.length && sameStringArray(completed, canonicalCompleted)
    && (row.completed_at === null || typeof row.completed_at === 'string' && Number.isFinite(Date.parse(row.completed_at)))
    && (row.completed_at !== null) === (completed.length === snapshotIds.length);
}

function isDailyRoutineDaySkip(value: unknown): value is DailyRoutineDaySkip {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  if (!isCanonicalUuid(row.day_id)) return false;
  return isDailyRoutineDay({ ...row, id: row.day_id });
}

function isValidRepeatRule(unit: DailyRoutineRepeatUnit | null, interval: number | null): boolean {
  if (unit === null) return interval === null;
  return (unit === 'day' || unit === 'week' || unit === 'month')
    && Number.isInteger(interval) && Number(interval) >= 1 && Number(interval) <= 30;
}

function isValidStoredRepeatRule(unit: unknown, interval: unknown, weekdays: unknown, anchor: unknown): boolean {
  if (unit === null) return interval === null && weekdays === null && anchor === null;
  return (unit === 'day' || unit === 'week' || unit === 'month')
    && Number.isInteger(interval) && Number(interval) >= 1 && Number(interval) <= 30
    && isValidRepeatWeekdays(unit, weekdays)
    && typeof anchor === 'string' && isValidDateKey(anchor);
}

function hasValidAnchor(routine: DailyRoutine): boolean {
  return routine.repeat_unit === null ? routine.repeat_interval === null && routine.repeat_weekdays === null && routine.repeat_anchor_date === null
    : routine.repeat_interval !== null && isValidRepeatWeekdays(routine.repeat_unit, routine.repeat_weekdays)
      && routine.repeat_anchor_date !== null && isValidDateKey(routine.repeat_anchor_date);
}

function isDailyTrainingSelection(value: unknown): value is DailyTrainingSelection {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.dog_id === 'string' && typeof row.program_version_id === 'string'
    && typeof row.step_id === 'string' && typeof row.date_key === 'string' && isValidDateKey(row.date_key)
    && typeof row.time_zone === 'string' && isValidIanaTimeZone(row.time_zone);
}

function sameRoutineSave(left: RoutineSaveValues & Partial<Pick<DailyRoutine, 'id' | 'dog_id'>>, right: RoutineSaveValues & Partial<Pick<DailyRoutine, 'id' | 'dog_id'>>): boolean {
  return (!left.id || !right.id || left.id === right.id) && (!left.dog_id || !right.dog_id || left.dog_id === right.dog_id)
    && left.label === right.label && sameChecklist(left.checklist, right.checklist)
    && left.repeat_unit === right.repeat_unit && left.repeat_interval === right.repeat_interval
    && sameWeekdaySet(left.repeat_weekdays, right.repeat_weekdays);
}

function isValidRepeatWeekdays(unit: DailyRoutineRepeatUnit | null, value: unknown): value is number[] | null {
  if (value === null) return true;
  return unit === 'week' && Array.isArray(value) && value.length >= 1 && value.length <= 7
    && value.every((day, index) => Number.isInteger(day) && day >= 1 && day <= 7 && (index === 0 || day > value[index - 1]));
}

function sameWeekdaySet(left: readonly number[] | null, right: readonly number[] | null): boolean {
  return left === null ? right === null : right !== null && left.length === right.length && left.every((day, index) => day === right[index]);
}

function sameRoutineRepeat(left: DailyRoutine, right: DailyRoutineRepeatValues): boolean {
  if (left.repeat_unit !== right.repeat_unit || left.repeat_interval !== right.repeat_interval) return false;
  if (sameWeekdaySet(left.repeat_weekdays, right.repeat_weekdays)) return true;
  if (left.repeat_unit !== 'week' || left.repeat_weekdays !== null || !left.repeat_anchor_date || !right.repeat_weekdays) return false;
  const legacyWeekday = isoWeekdayForDateKey(left.repeat_anchor_date);
  return right.repeat_weekdays.length === 1 && right.repeat_weekdays[0] === legacyWeekday;
}

function normalizeRoutineRepeat(routine: DailyRoutine, repeat: DailyRoutineRepeatValues): DailyRoutineRepeatValues {
  if (routine.repeat_unit === 'week' && repeat.repeat_unit === 'week' && routine.repeat_weekdays === null
    && routine.repeat_anchor_date && repeat.repeat_weekdays) {
    const legacyWeekday = isoWeekdayForDateKey(routine.repeat_anchor_date);
    if (repeat.repeat_weekdays.length === 1 && repeat.repeat_weekdays[0] === legacyWeekday) {
      return { ...repeat, repeat_weekdays: null };
    }
  }
  return { ...repeat, repeat_weekdays: repeat.repeat_weekdays === null ? null : [...repeat.repeat_weekdays] };
}

function isoWeekdayForDateKey(dateKey: string): number {
  const day = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

function matchesRoutineDayDraft(left: DailyRoutineDay, right: DailyRoutineDayDraft, includeId = true): boolean {
  return (!includeId || left.id === right.id) && left.dog_id === right.dog_id && left.routine_id === right.routine_id
    && left.date_key === right.date_key && left.time_zone === right.time_zone
    && left.routine_label_snapshot === right.routine_label_snapshot && sameChecklist(left.checklist_snapshot, right.checklist_snapshot)
    && left.completed_item_ids.length === 0 && left.completed_at === null;
}

function sameRoutineDayDefinition(left: DailyRoutineDay, right: DailyRoutineDay): boolean {
  return left.id === right.id && left.dog_id === right.dog_id && left.routine_id === right.routine_id
    && left.date_key === right.date_key && left.time_zone === right.time_zone
    && left.routine_label_snapshot === right.routine_label_snapshot && sameChecklist(left.checklist_snapshot, right.checklist_snapshot);
}

function sameRoutineOccurrence(left: DailyRoutineDay | DailyRoutineDaySkip, right: DailyRoutineDay | DailyRoutineDaySkip): boolean {
  const leftId = 'id' in left ? left.id : left.day_id;
  const rightId = 'id' in right ? right.id : right.day_id;
  return leftId === rightId && left.dog_id === right.dog_id && left.routine_id === right.routine_id
    && left.date_key === right.date_key && left.time_zone === right.time_zone
    && left.routine_label_snapshot === right.routine_label_snapshot && sameChecklist(left.checklist_snapshot, right.checklist_snapshot)
    && sameStringArray(left.completed_item_ids, right.completed_item_ids) && left.completed_at === right.completed_at
    && left.is_recurring_occurrence === right.is_recurring_occurrence
    && left.routine_revision_snapshot === right.routine_revision_snapshot;
}

function sameChecklist(left: readonly DailyRoutineChecklistItem[], right: readonly DailyRoutineChecklistItem[]): boolean {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id && item.label === right[index]?.label);
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function isCanonicalUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
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
