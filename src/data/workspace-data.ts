import type { SupabaseClient } from '@supabase/supabase-js';
import { selectContent } from '../content/select-content';
import { LOG_EVENT_TYPES, type LogEventType } from '../features/puppy-log/log-model';
import type { OwnedDog } from './app-data';

export const WORKSPACE_PAGE_SIZE = 40;
const DEFAULT_REQUEST_TIMEOUT_MS = 12_000;
const EVENT_COLUMNS = 'id,dog_id,event_type,occurred_at,occurred_on,weight_kg,duration_minutes,description';
const HEALTH_WEIGHT_COLUMNS = 'id,dog_id,actor_id,occurred_on,weight_kg';
const HEALTH_HISTORY_COLUMNS = 'id,dog_id,actor_id,event_type,occurred_on,description';
const PLANNED_HEALTH_COLUMNS = 'id,dog_id,event_type,due_on,description,created_at';

export interface DogEventRecord {
  id: string;
  dog_id: string;
  event_type: LogEventType;
  occurred_at: string;
  occurred_on: string | null;
  weight_kg: number | null;
  duration_minutes: number | null;
  description: string | null;
}

export interface DogEventOperation {
  id: string;
  dog_id: string;
  event_type: LogEventType;
  occurred_at: string;
  duration_minutes: number | null;
  description: string | null;
}

export interface DogEventChanges {
  event_type: LogEventType;
  occurred_at: string;
  duration_minutes: number | null;
  description: string | null;
}

export interface HealthWeightRecord {
  id: string;
  dog_id: string;
  actor_id: string;
  occurred_on: string;
  weight_kg: number;
}

export interface HealthWeightOperation {
  id: string;
  dog_id: string;
  occurred_on: string;
  weight_kg: number;
}

export interface HealthWeightChanges {
  occurred_on: string;
  weight_kg: number;
}

export type HealthHistoryType = 'vaccination' | 'vet_visit';

export interface HealthHistoryRecord {
  id: string;
  dog_id: string;
  actor_id: string;
  event_type: HealthHistoryType;
  occurred_on: string;
  description: string | null;
}

export interface HealthHistoryOperation {
  id: string;
  dog_id: string;
  event_type: HealthHistoryType;
  occurred_on: string;
  description: string | null;
}

export interface HealthHistoryChanges {
  occurred_on: string;
  description: string | null;
}

export type PlannedHealthType = 'vaccination' | 'vet_visit';

export interface PlannedHealthRecord {
  id: string;
  dog_id: string;
  event_type: PlannedHealthType;
  due_on: string;
  description: string | null;
  created_at: string;
}

export interface PlannedHealthOperation {
  id: string;
  dog_id: string;
  event_type: PlannedHealthType;
  due_on: string;
  description: string | null;
  local_today: string;
}

export interface PlannedHealthChanges {
  due_on: string;
  description: string | null;
}

export type WriteOutcome<T> = { status: 'saved'; value: T } | { status: 'failed' | 'unknown' };

export interface PublishedTrainingStep {
  id: string;
  position: number;
  title: string;
  instruction: string;
}

export interface PublishedTrainingProgram {
  id: string;
  content_id: string;
  version: number;
  title: string;
  body: string;
  sources: string[];
  steps: PublishedTrainingStep[];
  completedStepIds: string[];
}

export interface PausedTrainingProgress {
  versionId: string;
  completedCount: number;
}

interface PublishedVersionRow {
  id: string;
  content_id: string;
  version: number;
  title: string;
  body: string;
  min_age_weeks: number;
  max_age_weeks: number | null;
  sources: string[];
  content_items: { content_type: string };
  content_breed_targets: { breed_id: string }[];
}

interface ProgressRow {
  dog_id: string;
  program_version_id: string;
  step_id: string;
  completed_at: string;
}

interface TrainingStepRow {
  id: string;
  program_version_id: string;
  position: number;
  title: string;
  instruction: string;
}

export async function withRequestDeadline<T>(
  request: (signal: AbortSignal) => Promise<T>,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  parentSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  if (parentSignal?.aborted) controller.abort();
  else parentSignal?.addEventListener('abort', forwardAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  try {
    return await request(controller.signal);
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener('abort', forwardAbort);
  }
}

export async function fetchDogEvents(
  client: SupabaseClient,
  dogId: string,
  offset = 0,
  limit = WORKSPACE_PAGE_SIZE,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  parentSignal?: AbortSignal,
): Promise<DogEventRecord[]> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('dog_events')
      .select(EVENT_COLUMNS)
      .eq('dog_id', dogId)
      .in('event_type', [...LOG_EVENT_TYPES])
      .order('occurred_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1)
      .abortSignal(signal);
    if (error || !Array.isArray(data) || !data.every(isDogEventRecord)) throw new Error('Could not load dog events');
    return data;
  }, timeoutMs, parentSignal);
}

export async function fetchDogEventById(
  client: SupabaseClient,
  dogId: string,
  id: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<DogEventRecord | null> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('dog_events')
      .select(EVENT_COLUMNS)
      .eq('dog_id', dogId)
      .eq('id', id)
      .abortSignal(signal)
      .maybeSingle();
    if (error) throw new Error('Could not check dog event status');
    if (data === null) return null;
    if (!isDogEventRecord(data)) throw new Error('Dog event response did not match the database contract');
    return data;
  }, timeoutMs);
}

export async function insertDogEvent(
  client: SupabaseClient,
  operation: DogEventOperation,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<DogEventRecord>> {
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_events')
      .insert(operation)
      .abortSignal(signal)
      .select(EVENT_COLUMNS)
      .single(), timeoutMs);
    if (!result.error && isDogEventRecord(result.data)) return { status: 'saved', value: result.data };
    failure = result.error ?? new Error('Empty insert response');
  } catch (error) {
    failure = error;
  }

  try {
    const found = await fetchDogEventById(client, operation.dog_id, operation.id, timeoutMs);
    if (found) return { status: 'saved', value: found };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
}

export async function updateDogEvent(
  client: SupabaseClient,
  dogId: string,
  id: string,
  changes: DogEventChanges,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<DogEventRecord>> {
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_events')
      .update(changes)
      .eq('dog_id', dogId)
      .eq('id', id)
      .abortSignal(signal)
      .select(EVENT_COLUMNS)
      .maybeSingle(), timeoutMs);
    if (!result.error && isDogEventRecord(result.data)) return { status: 'saved', value: result.data };
    failure = result.error ?? new Error('Empty update response');
  } catch (error) {
    failure = error;
  }

  try {
    const found = await fetchDogEventById(client, dogId, id, timeoutMs);
    if (found && matchesChanges(found, changes)) return { status: 'saved', value: found };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
}

export async function deleteDogEvent(
  client: SupabaseClient,
  dogId: string,
  id: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<null>> {
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_events')
      .delete()
      .eq('dog_id', dogId)
      .eq('id', id)
      .abortSignal(signal)
      .select('id')
      .maybeSingle(), timeoutMs);
    if (!result.error && result.data && typeof result.data.id === 'string') return { status: 'saved', value: null };
    if (!result.error && result.data === null) {
      const stillThere = await fetchDogEventById(client, dogId, id, timeoutMs);
      return stillThere ? { status: 'unknown' } : { status: 'saved', value: null };
    }
    failure = result.error ?? new Error('Empty delete response');
  } catch (error) {
    failure = error;
  }

  try {
    const found = await fetchDogEventById(client, dogId, id, timeoutMs);
    if (!found) return { status: 'saved', value: null };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
}

export function isValidHealthWeightDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return false;
  const today = new Date();
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return value <= todayText;
}

export function isValidHealthWeightKg(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= 200
    && Number(value.toFixed(3)) === value;
}

export async function fetchHealthWeights(
  client: SupabaseClient,
  dogId: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  parentSignal?: AbortSignal,
): Promise<HealthWeightRecord[]> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('dog_events')
      .select(HEALTH_WEIGHT_COLUMNS)
      .eq('dog_id', dogId)
      .eq('event_type', 'weight')
      .order('occurred_on', { ascending: false })
      .order('id', { ascending: false })
      .abortSignal(signal);
    if (error || !Array.isArray(data) || !data.every(isHealthWeightRecord)) throw new Error('Could not load health weights');
    return data;
  }, timeoutMs, parentSignal);
}

export async function fetchHealthWeightById(
  client: SupabaseClient,
  dogId: string,
  id: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<HealthWeightRecord | null> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('dog_events')
      .select(HEALTH_WEIGHT_COLUMNS)
      .eq('dog_id', dogId)
      .eq('event_type', 'weight')
      .eq('id', id)
      .abortSignal(signal)
      .maybeSingle();
    if (error) throw new Error('Could not check health weight status');
    if (data === null) return null;
    if (!isHealthWeightRecord(data)) throw new Error('Health weight response did not match the database contract');
    return data;
  }, timeoutMs);
}

export async function insertHealthWeight(
  client: SupabaseClient,
  operation: HealthWeightOperation,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<HealthWeightRecord>> {
  if (!isValidHealthWeightDate(operation.occurred_on) || !isValidHealthWeightKg(operation.weight_kg)) return { status: 'failed' };
  const payload = {
    id: operation.id,
    dog_id: operation.dog_id,
    event_type: 'weight' as const,
    occurred_on: operation.occurred_on,
    weight_kg: operation.weight_kg,
  };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_events')
      .insert(payload)
      .abortSignal(signal)
      .select(HEALTH_WEIGHT_COLUMNS)
      .single(), timeoutMs);
    if (!result.error && isHealthWeightRecord(result.data) && matchesHealthWeight(result.data, operation)) return { status: 'saved', value: result.data };
    failure = result.error ?? new Error('Empty health weight insert response');
  } catch (error) {
    failure = error;
  }

  try {
    const found = await fetchHealthWeightById(client, operation.dog_id, operation.id, timeoutMs);
    if (found && matchesHealthWeight(found, operation)) return { status: 'saved', value: found };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
}

export async function updateHealthWeight(
  client: SupabaseClient,
  dogId: string,
  id: string,
  changes: HealthWeightChanges,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<HealthWeightRecord>> {
  if (!isValidHealthWeightDate(changes.occurred_on) || !isValidHealthWeightKg(changes.weight_kg)) return { status: 'failed' };
  const payload = { occurred_on: changes.occurred_on, weight_kg: changes.weight_kg };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_events')
      .update(payload)
      .eq('dog_id', dogId)
      .eq('event_type', 'weight')
      .eq('id', id)
      .abortSignal(signal)
      .select(HEALTH_WEIGHT_COLUMNS)
      .maybeSingle(), timeoutMs);
    if (!result.error && isHealthWeightRecord(result.data) && matchesHealthWeight(result.data, { id, dog_id: dogId, ...changes })) return { status: 'saved', value: result.data };
    failure = result.error ?? new Error('Empty health weight update response');
  } catch (error) {
    failure = error;
  }

  try {
    const found = await fetchHealthWeightById(client, dogId, id, timeoutMs);
    if (found && matchesHealthWeight(found, { id, dog_id: dogId, ...changes })) return { status: 'saved', value: found };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
}

export async function deleteHealthWeight(
  client: SupabaseClient,
  dogId: string,
  id: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<null>> {
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_events')
      .delete()
      .eq('dog_id', dogId)
      .eq('event_type', 'weight')
      .eq('id', id)
      .abortSignal(signal)
      .select('id')
      .maybeSingle(), timeoutMs);
    if (!result.error && result.data && typeof result.data.id === 'string') return { status: 'saved', value: null };
    if (!result.error && result.data === null) {
      const stillThere = await fetchHealthWeightById(client, dogId, id, timeoutMs);
      return stillThere ? { status: 'unknown' } : { status: 'saved', value: null };
    }
    failure = result.error ?? new Error('Empty health weight delete response');
  } catch (error) {
    failure = error;
  }

  try {
    const found = await fetchHealthWeightById(client, dogId, id, timeoutMs);
    if (!found) return { status: 'saved', value: null };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
}

export function isValidHealthHistoryDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return false;
  const today = new Date();
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return value <= todayText;
}

export function normalizeHealthHistoryDescription(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (Array.from(trimmed).length > 500) return undefined;
  return trimmed || null;
}

export async function fetchHealthHistory(
  client: SupabaseClient,
  dogId: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  parentSignal?: AbortSignal,
): Promise<HealthHistoryRecord[]> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('dog_events')
      .select(HEALTH_HISTORY_COLUMNS)
      .eq('dog_id', dogId)
      .in('event_type', ['vaccination', 'vet_visit'])
      .order('occurred_on', { ascending: false })
      .order('id', { ascending: false })
      .abortSignal(signal);
    if (error || !Array.isArray(data) || !data.every(isHealthHistoryRecord)
      || data.some((row) => row.dog_id !== dogId)) throw new Error('Could not load health history');
    return data;
  }, timeoutMs, parentSignal);
}

export async function fetchHealthHistoryById(
  client: SupabaseClient,
  dogId: string,
  eventType: HealthHistoryType,
  id: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<HealthHistoryRecord | null> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('dog_events')
      .select(HEALTH_HISTORY_COLUMNS)
      .eq('dog_id', dogId)
      .eq('event_type', eventType)
      .eq('id', id)
      .abortSignal(signal)
      .maybeSingle();
    if (error) throw new Error('Could not check health history status');
    if (data === null) return null;
    if (!isHealthHistoryRecord(data) || data.dog_id !== dogId || data.event_type !== eventType || data.id !== id) {
      throw new Error('Health history response did not match the database contract');
    }
    return data;
  }, timeoutMs);
}

export async function insertHealthHistory(
  client: SupabaseClient,
  operation: HealthHistoryOperation,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<HealthHistoryRecord>> {
  const description = normalizeHealthHistoryDescription(operation.description);
  if (!isValidHealthHistoryDate(operation.occurred_on) || description === undefined
    || !isHealthHistoryType(operation.event_type)) return { status: 'failed' };
  const normalized = { ...operation, description };
  const payload = {
    id: operation.id,
    dog_id: operation.dog_id,
    event_type: operation.event_type,
    occurred_on: operation.occurred_on,
    description,
  };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_events')
      .insert(payload).abortSignal(signal).select(HEALTH_HISTORY_COLUMNS).single(), timeoutMs);
    if (!result.error && isHealthHistoryRecord(result.data) && matchesHealthHistory(result.data, normalized)) {
      return { status: 'saved', value: result.data };
    }
    failure = result.error ?? new Error('Empty health history insert response');
  } catch (error) { failure = error; }
  try {
    const found = await fetchHealthHistoryById(client, operation.dog_id, operation.event_type, operation.id, timeoutMs);
    if (found && matchesHealthHistory(found, normalized)) return { status: 'saved', value: found };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function updateHealthHistory(
  client: SupabaseClient,
  dogId: string,
  eventType: HealthHistoryType,
  id: string,
  previous: Pick<HealthHistoryRecord, 'occurred_on' | 'description'>,
  changes: HealthHistoryChanges,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<HealthHistoryRecord>> {
  const description = normalizeHealthHistoryDescription(changes.description);
  if (!isValidHealthHistoryDate(changes.occurred_on) || description === undefined || !isHealthHistoryType(eventType)) return { status: 'failed' };
  const normalizedChanges = { ...changes, description };
  const payload = { occurred_on: changes.occurred_on, description };
  let failure: unknown = null;
  try {
    let query = client.from('dog_events').update(payload)
      .eq('dog_id', dogId).eq('event_type', eventType).eq('id', id)
      .eq('occurred_on', previous.occurred_on);
    query = previous.description === null ? query.is('description', null) : query.eq('description', previous.description);
    const result = await withRequestDeadline(async (signal) => await query.abortSignal(signal)
      .select(HEALTH_HISTORY_COLUMNS).maybeSingle(), timeoutMs);
    if (!result.error && isHealthHistoryRecord(result.data) && matchesHealthHistory(result.data, { id, dog_id: dogId, event_type: eventType, ...normalizedChanges })) {
      return { status: 'saved', value: result.data };
    }
    failure = result.error ?? new Error('Empty health history update response');
  } catch (error) { failure = error; }
  try {
    const found = await fetchHealthHistoryById(client, dogId, eventType, id, timeoutMs);
    if (found && matchesHealthHistory(found, { id, dog_id: dogId, event_type: eventType, ...normalizedChanges })) return { status: 'saved', value: found };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function deleteHealthHistory(
  client: SupabaseClient,
  dogId: string,
  eventType: HealthHistoryType,
  id: string,
  previous: Pick<HealthHistoryRecord, 'occurred_on' | 'description'>,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<null>> {
  let failure: unknown = null;
  try {
    let query = client.from('dog_events').delete()
      .eq('dog_id', dogId).eq('event_type', eventType).eq('id', id)
      .eq('occurred_on', previous.occurred_on);
    query = previous.description === null ? query.is('description', null) : query.eq('description', previous.description);
    const result = await withRequestDeadline(async (signal) => await query.abortSignal(signal).select('id').maybeSingle(), timeoutMs);
    if (!result.error && result.data && result.data.id === id) return { status: 'saved', value: null };
    if (!result.error && result.data === null) {
      const current = await fetchHealthHistoryById(client, dogId, eventType, id, timeoutMs);
      return current ? { status: 'unknown' } : { status: 'saved', value: null };
    }
    failure = result.error ?? new Error('Empty health history delete response');
  } catch (error) { failure = error; }
  try {
    const found = await fetchHealthHistoryById(client, dogId, eventType, id, timeoutMs);
    if (!found) return { status: 'saved', value: null };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export function isValidPlannedHealthDate(value: string, localToday: string): boolean {
  return isCalendarDate(value) && isCalendarDate(localToday) && value >= localToday;
}

export function normalizePlannedHealthDescription(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (Array.from(trimmed).length > 500) return undefined;
  return trimmed || null;
}

export async function fetchPlannedHealth(
  client: SupabaseClient,
  dogId: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  parentSignal?: AbortSignal,
): Promise<PlannedHealthRecord[]> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('dog_health_plans')
      .select(PLANNED_HEALTH_COLUMNS)
      .eq('dog_id', dogId)
      .order('due_on', { ascending: true })
      .order('id', { ascending: true })
      .limit(WORKSPACE_PAGE_SIZE)
      .abortSignal(signal);
    if (error || !Array.isArray(data) || !data.every(isPlannedHealthRecord)
      || data.some((row) => row.dog_id !== dogId)) throw new Error('Could not load planned health');
    return data;
  }, timeoutMs, parentSignal);
}

export async function fetchPlannedHealthById(
  client: SupabaseClient,
  dogId: string,
  id: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<PlannedHealthRecord | null> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('dog_health_plans')
      .select(PLANNED_HEALTH_COLUMNS).eq('dog_id', dogId).eq('id', id)
      .abortSignal(signal).maybeSingle();
    if (error) throw new Error('Could not check planned health status');
    if (data === null) return null;
    if (!isPlannedHealthRecord(data) || data.dog_id !== dogId || data.id !== id) {
      throw new Error('Planned health response did not match the database contract');
    }
    return data;
  }, timeoutMs);
}

export async function insertPlannedHealth(
  client: SupabaseClient,
  operation: PlannedHealthOperation,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<PlannedHealthRecord>> {
  const description = normalizePlannedHealthDescription(operation.description);
  if (!isPlannedHealthType(operation.event_type) || !isValidPlannedHealthDate(operation.due_on, operation.local_today)
    || description === undefined) return { status: 'failed' };
  const expected = { ...operation, description };
  const payload = { id: operation.id, dog_id: operation.dog_id, event_type: operation.event_type, due_on: operation.due_on, description };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_health_plans')
      .insert(payload).abortSignal(signal).select(PLANNED_HEALTH_COLUMNS).single(), timeoutMs);
    if (!result.error && isPlannedHealthRecord(result.data) && matchesPlannedHealth(result.data, expected)) {
      return { status: 'saved', value: result.data };
    }
    failure = result.error ?? new Error('Empty planned health insert response');
  } catch (error) { failure = error; }
  try {
    const found = await fetchPlannedHealthById(client, operation.dog_id, operation.id, timeoutMs);
    if (found && matchesPlannedHealth(found, expected)) return { status: 'saved', value: found };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function updatePlannedHealth(
  client: SupabaseClient,
  dogId: string,
  id: string,
  previous: Pick<PlannedHealthRecord, 'event_type' | 'due_on' | 'description'>,
  changes: PlannedHealthChanges,
  localToday: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<PlannedHealthRecord>> {
  const description = normalizePlannedHealthDescription(changes.description);
  const allowedDate = changes.due_on === previous.due_on || isValidPlannedHealthDate(changes.due_on, localToday);
  if (!isPlannedHealthType(previous.event_type) || !isCalendarDate(localToday) || !allowedDate || description === undefined) {
    return { status: 'failed' };
  }
  const normalizedChanges = { due_on: changes.due_on, description };
  let failure: unknown = null;
  try {
    let query = client.from('dog_health_plans').update(normalizedChanges)
      .eq('dog_id', dogId).eq('id', id).eq('event_type', previous.event_type).eq('due_on', previous.due_on);
    query = previous.description === null ? query.is('description', null) : query.eq('description', previous.description);
    const result = await withRequestDeadline(async (signal) => await query.abortSignal(signal)
      .select(PLANNED_HEALTH_COLUMNS).maybeSingle(), timeoutMs);
    if (!result.error && isPlannedHealthRecord(result.data)
      && matchesPlannedHealth(result.data, { id, dog_id: dogId, event_type: previous.event_type, ...normalizedChanges })) {
      return { status: 'saved', value: result.data };
    }
    failure = result.error ?? new Error('Empty planned health update response');
  } catch (error) { failure = error; }
  try {
    const found = await fetchPlannedHealthById(client, dogId, id, timeoutMs);
    if (found && matchesPlannedHealth(found, { id, dog_id: dogId, event_type: previous.event_type, ...normalizedChanges })) return { status: 'saved', value: found };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function deletePlannedHealth(
  client: SupabaseClient,
  dogId: string,
  id: string,
  previous: Pick<PlannedHealthRecord, 'event_type' | 'due_on' | 'description'>,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<null>> {
  let failure: unknown = null;
  try {
    let query = client.from('dog_health_plans').delete()
      .eq('dog_id', dogId).eq('id', id).eq('event_type', previous.event_type).eq('due_on', previous.due_on);
    query = previous.description === null ? query.is('description', null) : query.eq('description', previous.description);
    const result = await withRequestDeadline(async (signal) => await query.abortSignal(signal).select('id').maybeSingle(), timeoutMs);
    if (!result.error && result.data?.id === id) return { status: 'saved', value: null };
    if (!result.error && result.data === null) {
      const current = await fetchPlannedHealthById(client, dogId, id, timeoutMs);
      return current ? { status: 'unknown' } : { status: 'saved', value: null };
    }
    failure = result.error ?? new Error('Empty planned health delete response');
  } catch (error) { failure = error; }
  try {
    const found = await fetchPlannedHealthById(client, dogId, id, timeoutMs);
    if (!found) return { status: 'saved', value: null };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch { return { status: 'unknown' }; }
}

export async function fetchPublishedContentVersions(
  client: SupabaseClient,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  parentSignal?: AbortSignal,
): Promise<PublishedVersionRow[]> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('content_versions')
      .select('id,content_id,version,title,body,min_age_weeks,max_age_weeks,sources,content_items!inner(content_type),content_breed_targets(breed_id)')
      .eq('status', 'published')
      .abortSignal(signal);
    const rows: unknown = data;
    if (error || !Array.isArray(rows) || !rows.every(isPublishedVersionRow)) throw new Error('Could not load published content');
    return rows as PublishedVersionRow[];
  }, timeoutMs, parentSignal);
}

export async function fetchHomeContent(
  client: SupabaseClient,
  dog: OwnedDog,
  ageWeeks: number,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  parentSignal?: AbortSignal,
): Promise<{ id: string; title: string; body: string; contentType: 'article' | 'guide' | 'checklist' | 'training_program' }[]> {
  const rows = await fetchPublishedContentVersions(client, timeoutMs, parentSignal);
  const selected = selectContent(rows.map((item) => ({
    id: item.id,
    contentId: item.content_id,
    version: item.version,
    status: 'published' as const,
    minAgeWeeks: item.min_age_weeks,
    maxAgeWeeks: item.max_age_weeks,
    breedIds: item.content_breed_targets.map((target) => target.breed_id),
  })), ageWeeks, dog.breed_id);
  const byId = new Map(rows.map((item) => [item.id, item]));
  return selected.flatMap(({ id }) => {
    const row = byId.get(id);
    const contentType = row?.content_items.content_type;
    if (!row || !isDisplayableContentType(contentType)) return [];
    return [{ id: row.id, title: row.title, body: row.body, contentType }];
  });
}

export async function fetchTrainingWorkspace(
  client: SupabaseClient,
  dog: OwnedDog,
  ageWeeks: number,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  parentSignal?: AbortSignal,
): Promise<{ programs: PublishedTrainingProgram[]; paused: PausedTrainingProgress[] }> {
  const [versions, progress] = await Promise.all([
    fetchPublishedContentVersions(client, timeoutMs, parentSignal),
    fetchTrainingProgress(client, dog.id, timeoutMs, parentSignal),
  ]);
  const publishedPrograms = versions.filter((row) => row.content_items.content_type === 'training_program');
  const inProgressVersionIds = new Set(progress.map((item) => item.program_version_id));
  const resumable = publishedPrograms.filter((row) => inProgressVersionIds.has(row.id)
    && (row.content_breed_targets.length === 0 || row.content_breed_targets.some((target) => target.breed_id === dog.breed_id)));
  const current = selectContent(publishedPrograms.map((row) => ({
    id: row.id,
    contentId: row.content_id,
    version: row.version,
    status: 'published' as const,
    minAgeWeeks: row.min_age_weeks,
    maxAgeWeeks: row.max_age_weeks,
    breedIds: row.content_breed_targets.map((target) => target.breed_id),
  })), ageWeeks, dog.breed_id);
  const selectedByContent = new Map<string, PublishedVersionRow>();
  for (const version of current) {
    const row = publishedPrograms.find((item) => item.id === version.id);
    if (row) selectedByContent.set(row.content_id, row);
  }
  const progressedByContent = new Map<string, PublishedVersionRow>();
  for (const row of resumable) {
    const progressed = progressedByContent.get(row.content_id);
    if (!progressed || row.version > progressed.version) progressedByContent.set(row.content_id, row);
  }
  for (const [contentId, row] of progressedByContent) selectedByContent.set(contentId, row);
  const selectedRows = [...selectedByContent.values()];
  const activeVersionIds = selectedRows.map((item) => item.id);
  const steps = activeVersionIds.length ? await fetchTrainingSteps(client, activeVersionIds, timeoutMs, parentSignal) : [];
  const programs = selectedRows.map((row) => ({
    id: row.id,
    content_id: row.content_id,
    version: row.version,
    title: row.title,
    body: row.body,
    sources: row.sources,
    steps: steps.filter((step) => step.program_version_id === row.id).sort((left, right) => left.position - right.position),
    completedStepIds: progress.filter((item) => item.program_version_id === row.id).map((item) => item.step_id),
  }));
  const activeIds = new Set(activeVersionIds);
  const pausedByVersion = new Map<string, Set<string>>();
  for (const item of progress) {
    if (activeIds.has(item.program_version_id)) continue;
    const completed = pausedByVersion.get(item.program_version_id) ?? new Set<string>();
    completed.add(item.step_id);
    pausedByVersion.set(item.program_version_id, completed);
  }
  return {
    programs,
    paused: [...pausedByVersion].map(([versionId, completed]) => ({ versionId, completedCount: completed.size })),
  };
}

export async function insertTrainingProgress(
  client: SupabaseClient,
  row: { dog_id: string; program_version_id: string; step_id: string },
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<ProgressRow>> {
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('training_progress')
      .insert(row)
      .abortSignal(signal)
      .select('dog_id,program_version_id,step_id,completed_at')
      .single(), timeoutMs);
    if (!result.error && isProgressRow(result.data)) return { status: 'saved', value: result.data };
    failure = result.error ?? new Error('Empty progress response');
  } catch (error) {
    failure = error;
  }
  try {
    const found = await fetchTrainingProgressRow(client, row.dog_id, row.program_version_id, row.step_id, timeoutMs);
    if (found) return { status: 'saved', value: found };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
}

export async function deleteTrainingProgress(
  client: SupabaseClient,
  dogId: string,
  programVersionId: string,
  stepId: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<null>> {
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('training_progress')
      .delete()
      .eq('dog_id', dogId)
      .eq('program_version_id', programVersionId)
      .eq('step_id', stepId)
      .abortSignal(signal)
      .select('step_id')
      .maybeSingle(), timeoutMs);
    if (!result.error && result.data) return { status: 'saved', value: null };
    if (!result.error && !result.data) {
      const found = await fetchTrainingProgressRow(client, dogId, programVersionId, stepId, timeoutMs);
      return found ? { status: 'unknown' } : { status: 'saved', value: null };
    }
    failure = result.error ?? new Error('Empty progress delete response');
  } catch (error) {
    failure = error;
  }
  try {
    const found = await fetchTrainingProgressRow(client, dogId, programVersionId, stepId, timeoutMs);
    if (!found) return { status: 'saved', value: null };
    return isDefiniteClientRejection(failure) ? { status: 'failed' } : { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
}

async function fetchTrainingProgress(
  client: SupabaseClient,
  dogId: string,
  timeoutMs: number,
  parentSignal?: AbortSignal,
): Promise<ProgressRow[]> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('training_progress')
      .select('dog_id,program_version_id,step_id,completed_at')
      .eq('dog_id', dogId)
      .abortSignal(signal);
    if (error || !Array.isArray(data) || !data.every(isProgressRow)) throw new Error('Could not load training progress');
    return data;
  }, timeoutMs, parentSignal);
}

async function fetchTrainingProgressRow(client: SupabaseClient, dogId: string, versionId: string, stepId: string, timeoutMs: number): Promise<ProgressRow | null> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('training_progress')
      .select('dog_id,program_version_id,step_id,completed_at')
      .eq('dog_id', dogId)
      .eq('program_version_id', versionId)
      .eq('step_id', stepId)
      .abortSignal(signal)
      .maybeSingle();
    if (error) throw new Error('Could not check training progress');
    if (data === null) return null;
    if (!isProgressRow(data)) throw new Error('Training progress response did not match the database contract');
    return data;
  }, timeoutMs);
}

async function fetchTrainingSteps(client: SupabaseClient, versionIds: string[], timeoutMs: number, parentSignal?: AbortSignal): Promise<TrainingStepRow[]> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('training_steps')
      .select('id,program_version_id,position,title,instruction')
      .in('program_version_id', versionIds)
      .order('position', { ascending: true })
      .abortSignal(signal);
    if (error || !Array.isArray(data) || !data.every(isTrainingStepRow)) throw new Error('Could not load published training steps');
    return data;
  }, timeoutMs, parentSignal);
}

function isDogEventRecord(value: unknown): value is DogEventRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.dog_id === 'string'
    && typeof row.event_type === 'string' && LOG_EVENT_TYPES.includes(row.event_type as LogEventType)
    && typeof row.occurred_at === 'string' && Number.isFinite(Date.parse(row.occurred_at))
    && (row.occurred_on === null || typeof row.occurred_on === 'string')
    && (row.weight_kg === null || typeof row.weight_kg === 'number')
    && (row.duration_minutes === null || typeof row.duration_minutes === 'number')
    && (row.description === null || typeof row.description === 'string' && Array.from(row.description).length <= 500);
}

function isHealthWeightRecord(value: unknown): value is HealthWeightRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.dog_id === 'string' && typeof row.actor_id === 'string'
    && typeof row.occurred_on === 'string' && isValidHealthWeightDate(row.occurred_on)
    && typeof row.weight_kg === 'number' && isValidHealthWeightKg(row.weight_kg);
}

function isHealthHistoryType(value: unknown): value is HealthHistoryType {
  return value === 'vaccination' || value === 'vet_visit';
}

function isHealthHistoryRecord(value: unknown): value is HealthHistoryRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.dog_id === 'string' && typeof row.actor_id === 'string'
    && isHealthHistoryType(row.event_type) && typeof row.occurred_on === 'string'
    && isValidHealthHistoryDate(row.occurred_on)
    && (row.description === null || typeof row.description === 'string' && Array.from(row.description).length <= 500);
}

function isPlannedHealthType(value: unknown): value is PlannedHealthType {
  return value === 'vaccination' || value === 'vet_visit';
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isPlannedHealthRecord(value: unknown): value is PlannedHealthRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.dog_id === 'string'
    && isPlannedHealthType(row.event_type) && typeof row.due_on === 'string' && isCalendarDate(row.due_on)
    && (row.description === null || typeof row.description === 'string' && Array.from(row.description).length <= 500)
    && typeof row.created_at === 'string' && Number.isFinite(Date.parse(row.created_at));
}

function isPublishedVersionRow(value: unknown): value is PublishedVersionRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  const parent = row.content_items;
  const targets = row.content_breed_targets;
  return typeof row.id === 'string' && typeof row.content_id === 'string'
    && typeof row.version === 'number' && typeof row.title === 'string' && typeof row.body === 'string'
    && typeof row.min_age_weeks === 'number'
    && (typeof row.max_age_weeks === 'number' || row.max_age_weeks === null)
    && Array.isArray(row.sources) && row.sources.every((source) => typeof source === 'string')
    && Boolean(parent) && typeof parent === 'object' && !Array.isArray(parent)
    && typeof (parent as Record<string, unknown>).content_type === 'string'
    && Array.isArray(targets) && targets.every((target) => Boolean(target) && typeof target === 'object'
      && typeof (target as Record<string, unknown>).breed_id === 'string');
}

function isProgressRow(value: unknown): value is ProgressRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.dog_id === 'string' && typeof row.program_version_id === 'string'
    && typeof row.step_id === 'string' && typeof row.completed_at === 'string';
}

function isTrainingStepRow(value: unknown): value is TrainingStepRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.program_version_id === 'string'
    && typeof row.position === 'number' && typeof row.title === 'string' && typeof row.instruction === 'string';
}

function isDisplayableContentType(value: string | undefined): value is 'article' | 'guide' | 'checklist' | 'training_program' {
  return value === 'article' || value === 'guide' || value === 'checklist' || value === 'training_program';
}

function matchesChanges(event: DogEventRecord, changes: DogEventChanges): boolean {
  return event.event_type === changes.event_type && Date.parse(event.occurred_at) === Date.parse(changes.occurred_at)
    && event.duration_minutes === changes.duration_minutes && event.description === changes.description;
}

function matchesHealthWeight(
  record: HealthWeightRecord,
  expected: Pick<HealthWeightOperation, 'id' | 'dog_id' | 'occurred_on' | 'weight_kg'>,
): boolean {
  return record.id === expected.id && record.dog_id === expected.dog_id
    && record.occurred_on === expected.occurred_on && record.weight_kg === expected.weight_kg;
}

function matchesHealthHistory(
  record: HealthHistoryRecord,
  expected: Pick<HealthHistoryOperation, 'id' | 'dog_id' | 'event_type' | 'occurred_on' | 'description'>,
): boolean {
  return record.id === expected.id && record.dog_id === expected.dog_id && record.event_type === expected.event_type
    && record.occurred_on === expected.occurred_on && record.description === expected.description;
}

function matchesPlannedHealth(
  record: PlannedHealthRecord,
  expected: Pick<PlannedHealthOperation, 'id' | 'dog_id' | 'event_type' | 'due_on' | 'description'>,
): boolean {
  return record.id === expected.id && record.dog_id === expected.dog_id && record.event_type === expected.event_type
    && record.due_on === expected.due_on && record.description === expected.description;
}

function isDefiniteClientRejection(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as Record<string, unknown>;
  if (typeof record.status === 'number' && record.status >= 400 && record.status < 500) return true;
  return typeof record.code === 'string' && (/^[0-9A-Z]{5}$/.test(record.code) || /^PGRST\d{3}$/.test(record.code));
}
