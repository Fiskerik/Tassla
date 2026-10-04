import type { SupabaseClient } from '@supabase/supabase-js';
import { selectContent } from '../content/select-content';
import { LOG_EVENT_TYPES, type LogEventType } from '../features/puppy-log/log-model';
import type { OwnedDog } from './app-data';

export const WORKSPACE_PAGE_SIZE = 40;
const DEFAULT_REQUEST_TIMEOUT_MS = 12_000;
const EVENT_COLUMNS = 'id,dog_id,event_type,occurred_at,occurred_on,weight_kg,duration_minutes,description';

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

function isDefiniteClientRejection(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as Record<string, unknown>;
  if (typeof record.status === 'number' && record.status >= 400 && record.status < 500) return true;
  return typeof record.code === 'string' && (/^[0-9A-Z]{5}$/.test(record.code) || /^PGRST\d{3}$/.test(record.code));
}
