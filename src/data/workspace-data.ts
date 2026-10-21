import type { SupabaseClient } from '@supabase/supabase-js';
import { selectContent } from '../content/select-content';
import { isCanonicalAccidentKinds, LOG_EVENT_TYPES, type AccidentKind, type LogEventType } from '../features/puppy-log/log-model';
import { dedupeLocalDateMarkers, localMonthRange } from '../features/puppy-log/log-calendar-model';
import type { InsightsEvent, InsightsPartialReason } from '../features/puppy-log/insights-model';
import type { HomeContent, OwnedDog } from './app-data';

export const WORKSPACE_PAGE_SIZE = 40;
const DEFAULT_REQUEST_TIMEOUT_MS = 12_000;
const INSIGHTS_PAGE_SIZE = 250;
const INSIGHTS_SINCE_START_LIMIT = 10_000;

export type WorkspaceSnapshotReadDecision = 'cache' | 'join' | 'request';

export function workspaceSnapshotReadDecision(input: {
  scope: string;
  cacheScope?: string | null;
  cachedAt?: number | null;
  inFlightScope?: string | null;
  now: number;
  maxAgeMs: number;
  cacheValid?: boolean;
  force?: boolean;
  supersede?: boolean;
}): WorkspaceSnapshotReadDecision {
  const cacheIsFresh = input.cacheValid !== false && input.cacheScope === input.scope
    && typeof input.cachedAt === 'number' && input.now >= input.cachedAt
    && input.now - input.cachedAt < input.maxAgeMs;
  if (!input.force && cacheIsFresh) return 'cache';
  if (input.inFlightScope === input.scope && !input.supersede) return 'join';
  return 'request';
}

const EVENT_COLUMNS = 'id,dog_id,event_type,occurred_at,occurred_on,weight_kg,duration_minutes,description,accident_kinds';
const HEALTH_WEIGHT_COLUMNS = 'id,dog_id,actor_id,occurred_on,weight_kg';
const HEALTH_HISTORY_COLUMNS = 'id,dog_id,actor_id,event_type,occurred_on,occurred_time,description';
const HEALTH_HISTORY_LEGACY_COLUMNS = 'id,dog_id,actor_id,event_type,occurred_on,description';
const PLANNED_HEALTH_COLUMNS = 'id,dog_id,event_type,due_on,due_time,description,created_at,reminder_enabled,reminder_minutes';

export interface DogEventRecord {
  id: string;
  dog_id: string;
  event_type: LogEventType;
  occurred_at: string;
  occurred_on: string | null;
  weight_kg: number | null;
  duration_minutes: number | null;
  description: string | null;
  accident_kinds: AccidentKind[] | null;
}

export interface DogEventOperation {
  id: string;
  dog_id: string;
  event_type: LogEventType;
  occurred_at: string;
  duration_minutes: number | null;
  description: string | null;
  accident_kinds: AccidentKind[] | null;
}

export interface DogEventChanges {
  event_type: LogEventType;
  occurred_at: string;
  duration_minutes: number | null;
  description: string | null;
  accident_kinds: AccidentKind[] | null;
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
  occurred_time: string | null;
  description: string | null;
}

export interface HealthHistoryOperation {
  id: string;
  dog_id: string;
  event_type: HealthHistoryType;
  occurred_on: string;
  occurred_time: string | null;
  description: string | null;
}

export interface HealthHistoryChanges {
  occurred_on: string;
  occurred_time: string | null;
  description: string | null;
}

export type PlannedHealthType = 'vaccination' | 'vet_visit';

export interface PlannedHealthRecord {
  id: string;
  dog_id: string;
  event_type: PlannedHealthType;
  due_on: string;
  due_time: string | null;
  description: string | null;
  created_at: string;
  reminder_enabled: boolean;
  reminder_minutes: number | null;
}

export interface PlannedHealthChecklistRow { id: string; dog_id: string; event_type: PlannedHealthType; due_on: string; }

export type HistoricalTrainingSelectionKey = { programVersionId: string; stepId: string };
export type HistoricalTrainingSource = {
  programVersionId: string;
  programTitle: string;
  stepId: string;
  stepTitle: string;
  completedAt: string | null;
};
export type HistoricalTrainingSources = { sources: Map<string, HistoricalTrainingSource>; unresolvedKeys: string[] };

export async function fetchExactHistoricalTrainingDetail(
  client: SupabaseClient, dogId: string, programVersionId: string, stepId: string, parentSignal?: AbortSignal,
): Promise<PublishedTrainingProgram | null> {
  if (!isCanonicalUuid(dogId) || !isCanonicalUuid(programVersionId) || !isCanonicalUuid(stepId)) {
    throw new Error('Invalid exact historical training detail scope');
  }
  const versionResult = await withRequestDeadline(async (signal) => await client.from('content_versions')
    .select('id,content_id,version,status,title,body,min_age_weeks,max_age_weeks,sources,is_ai_generated,content_items!inner(slug,content_type),content_breed_targets(breed_id)')
    .eq('id', programVersionId).eq('status', 'published').abortSignal(signal).maybeSingle(), DEFAULT_REQUEST_TIMEOUT_MS, parentSignal);
  if (parentSignal?.aborted) throw new Error('Historical training detail aborted');
  if (versionResult.error) throw new Error('Could not load exact historical training detail');
  if (versionResult.data === null) return null;
  if (!isPublishedVersionRow(versionResult.data) || versionResult.data.id !== programVersionId
    || versionResult.data.content_items.content_type !== 'training_program') return null;

  const stepResult = await withRequestDeadline(async (signal) => await client.from('training_steps')
    .select('id,program_version_id,position,title,instruction').eq('program_version_id', programVersionId).eq('id', stepId)
    .abortSignal(signal).maybeSingle(), DEFAULT_REQUEST_TIMEOUT_MS, parentSignal);
  if (parentSignal?.aborted) throw new Error('Historical training detail aborted');
  if (stepResult.error) throw new Error('Could not load exact historical training step detail');
  if (stepResult.data === null) return null;
  if (!isTrainingStepRow(stepResult.data) || stepResult.data.id !== stepId || stepResult.data.program_version_id !== programVersionId) return null;

  const progressResult = await withRequestDeadline(async (signal) => await client.from('training_progress')
    .select('dog_id,program_version_id,step_id,completed_at').eq('dog_id', dogId).eq('program_version_id', programVersionId)
    .eq('step_id', stepId).abortSignal(signal).maybeSingle(), DEFAULT_REQUEST_TIMEOUT_MS, parentSignal);
  if (parentSignal?.aborted) throw new Error('Historical training detail aborted');
  if (progressResult.error || progressResult.data !== null && (!isProgressRow(progressResult.data)
    || progressResult.data.dog_id !== dogId || progressResult.data.program_version_id !== programVersionId
    || progressResult.data.step_id !== stepId)) throw new Error('Could not load exact historical training progress');

  return {
    id: versionResult.data.id,
    content_id: versionResult.data.content_id,
    version: versionResult.data.version,
    title: versionResult.data.title,
    body: versionResult.data.body,
    sources: versionResult.data.sources,
    is_ai_generated: versionResult.data.is_ai_generated,
    steps: [stepResult.data],
    completedStepIds: progressResult.data ? [stepId] : [],
    completedAtByStepId: progressResult.data ? { [stepId]: progressResult.data.completed_at } : {},
  };
}

export async function fetchExactHistoricalTrainingSources(
  client: SupabaseClient, dogId: string, selections: readonly HistoricalTrainingSelectionKey[], parentSignal?: AbortSignal,
): Promise<HistoricalTrainingSources> {
  if (parentSignal?.aborted) throw new Error('Historical training lookup aborted');
  const unique = [...new Map(selections.map((item) => [`${item.programVersionId}:${item.stepId}`, item])).values()];
  const results = await mapWithConcurrency(unique, 3, async ({ programVersionId, stepId }) => {
    const versionResult = await withRequestDeadline(async (signal) => await client.from('content_versions')
      .select('id,status,title,content_items!inner(content_type)')
      .eq('id', programVersionId).eq('status', 'published').abortSignal(signal).maybeSingle(), DEFAULT_REQUEST_TIMEOUT_MS, parentSignal);
    if (parentSignal?.aborted) throw new Error('Historical training lookup aborted');
    const version = versionResult.data;
    if (versionResult.error) throw new Error('Could not load exact historical training source');
    if (version === null) return [`${programVersionId}:${stepId}`, null] as const;
    if (!version || typeof version !== 'object' || !('id' in version) || !('status' in version) || !('title' in version)
      || !('content_items' in version) || typeof version.id !== 'string' || typeof version.status !== 'string'
      || typeof version.title !== 'string' || !version.content_items || typeof version.content_items !== 'object'
      || !('content_type' in version.content_items) || typeof version.content_items.content_type !== 'string') {
      throw new Error('Invalid exact historical training source');
    }
    if (version.id !== programVersionId || version.status !== 'published' || version.content_items.content_type !== 'training_program') {
      return [`${programVersionId}:${stepId}`, null] as const;
    }
    const stepResult = await withRequestDeadline(async (signal) => await client.from('training_steps')
      .select('id,program_version_id,title').eq('program_version_id', programVersionId).eq('id', stepId)
      .abortSignal(signal).maybeSingle(), DEFAULT_REQUEST_TIMEOUT_MS, parentSignal);
    if (parentSignal?.aborted) throw new Error('Historical training lookup aborted');
    if (stepResult.error) throw new Error('Could not load exact historical training step');
    if (stepResult.data === null) return [`${programVersionId}:${stepId}`, null] as const;
    if (!stepResult.data || typeof stepResult.data !== 'object' || !('id' in stepResult.data)
      || !('program_version_id' in stepResult.data) || !('title' in stepResult.data)
      || typeof stepResult.data.id !== 'string' || typeof stepResult.data.program_version_id !== 'string'
      || typeof stepResult.data.title !== 'string') throw new Error('Invalid exact historical training step');
    if (stepResult.data.id !== stepId || stepResult.data.program_version_id !== programVersionId) return [`${programVersionId}:${stepId}`, null] as const;
    const progressResult = await withRequestDeadline(async (signal) => await client.from('training_progress')
      .select('dog_id,program_version_id,step_id,completed_at').eq('dog_id', dogId).eq('program_version_id', programVersionId)
      .eq('step_id', stepId).abortSignal(signal).maybeSingle(), DEFAULT_REQUEST_TIMEOUT_MS, parentSignal);
    if (parentSignal?.aborted) throw new Error('Historical training lookup aborted');
    if (progressResult.error || progressResult.data !== null && (!isProgressRow(progressResult.data)
      || progressResult.data.dog_id !== dogId || progressResult.data.program_version_id !== programVersionId || progressResult.data.step_id !== stepId)) {
      throw new Error('Could not load exact historical training progress');
    }
    const completedAt = progressResult.data?.completed_at ?? null;
    return [`${programVersionId}:${stepId}`, {
      programVersionId, programTitle: version.title, stepId, stepTitle: stepResult.data.title, completedAt,
    }] as const;
  });
  const sources = new Map<string, HistoricalTrainingSource>();
  const unresolvedKeys: string[] = [];
  for (const [key, value] of results) {
    if (value) sources.set(key, value);
    else unresolvedKeys.push(key);
  }
  return { sources, unresolvedKeys };
}

export async function fetchPlannedHealthChecklistRange(
  client: SupabaseClient, dogId: string, from: string, to: string, parentSignal?: AbortSignal,
): Promise<PlannedHealthChecklistRow[]> {
  if (!dogId || !isCalendarDate(from) || !isCalendarDate(to) || from > to || calendarDayCount(from, to) > 7) {
    throw new Error('Invalid planned health range');
  }
  const rows: PlannedHealthChecklistRow[] = []; const seenIds = new Set<string>(); let dueOn: string | null = null; let id: string | null = null;
  while (true) {
    if (parentSignal?.aborted) throw new Error('Planned health range aborted');
    const page = await withRequestDeadline(async (signal) => {
      let query: any = client.from('dog_health_plans').select('id,dog_id,event_type,due_on').eq('dog_id', dogId)
        .gte('due_on', from).lte('due_on', to);
      if (id) query = query.or(`due_on.gt.${dueOn},and(due_on.eq.${dueOn},id.gt.${id})`);
      return await query.order('due_on', { ascending: true }).order('id', { ascending: true }).limit(WORKSPACE_PAGE_SIZE).retry(false).abortSignal(signal);
    }, DEFAULT_REQUEST_TIMEOUT_MS, parentSignal);
    if (parentSignal?.aborted) throw new Error('Planned health range aborted');
    if (page.error || !Array.isArray(page.data) || !page.data.every((value: unknown) => {
      if (!value || typeof value !== 'object') return false;
      const row = value as Record<string, unknown>;
      return typeof row.id === 'string' && row.dog_id === dogId && isPlannedHealthType(row.event_type)
        && typeof row.due_on === 'string' && isCalendarDate(row.due_on) && row.due_on >= from && row.due_on <= to;
    })) throw new Error('Could not load planned health checklist rows');
    if (!page.data.length) break;
    let previousDueOn = dueOn;
    let previousId = id;
    for (const row of page.data as PlannedHealthChecklistRow[]) {
      if (seenIds.has(row.id) || previousId && (row.due_on < previousDueOn! || row.due_on === previousDueOn && row.id <= previousId)) {
        throw new Error('Invalid planned health cursor');
      }
      seenIds.add(row.id);
      rows.push(row);
      previousDueOn = row.due_on;
      previousId = row.id;
    }
    const last = page.data.at(-1) as PlannedHealthChecklistRow;
    dueOn = last.due_on; id = last.id;
    if (page.data.length < WORKSPACE_PAGE_SIZE) break;
  }
  return rows;
}

async function mapWithConcurrency<T, R>(items: readonly T[], concurrency: number, map: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  let failure: unknown;
  let failed = false;
  const workerCount = Math.min(items.length, Math.max(1, Math.floor(concurrency)));
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (true) {
      if (failed) return;
      const index = nextIndex++;
      if (index >= items.length) return;
      try { results[index] = await map(items[index], index); }
      catch (error) { failed = true; failure ??= error; return; }
    }
  }));
  if (failed) throw failure;
  return results;
}

function calendarDayCount(from: string, to: string): number {
  return (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86_400_000 + 1;
}

export interface PlannedHealthOperation {
  id: string;
  dog_id: string;
  event_type: PlannedHealthType;
  due_on: string;
  due_time: string | null;
  description: string | null;
  local_today: string;
  reminder_enabled: boolean;
  reminder_minutes: number | null;
}

export interface PlannedHealthChanges {
  due_on: string;
  due_time: string | null;
  description: string | null;
  reminder_enabled: boolean;
  reminder_minutes: number | null;
}

export const PLANNED_REMINDER_PAGE_SIZE = 40;
export interface PlannedReminderSelection { records: PlannedHealthRecord[]; overCap: boolean; }

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
  is_ai_generated: boolean;
  steps: PublishedTrainingStep[];
  completedStepIds: string[];
  completedAtByStepId: Record<string, string>;
}

export interface PausedTrainingProgress {
  versionId: string;
  completedCount: number;
}

interface PublishedVersionRow {
  id: string;
  content_id: string;
  version: number;
  status: string;
  title: string;
  body: string;
  min_age_weeks: number;
  max_age_weeks: number | null;
  sources: string[];
  is_ai_generated: boolean;
  content_items: { slug: string; content_type: string };
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

export async function fetchDogLogMonthMarkers(
  client: SupabaseClient,
  dogId: string,
  monthKey: string,
  parentSignal?: AbortSignal,
  pageSize = WORKSPACE_PAGE_SIZE,
): Promise<string[]> {
  const { startIso, endIso } = localMonthRange(monthKey);
  const timestamps: string[] = [];
  let cursor: string | null = null;
  while (true) {
    const rows = await withRequestDeadline(async (signal) => {
      let query = client.from('dog_events')
        .select('occurred_at')
        .eq('dog_id', dogId)
        .in('event_type', [...LOG_EVENT_TYPES])
        .gte('occurred_at', startIso)
        .lt('occurred_at', endIso);
      if (cursor !== null) query = query.lt('occurred_at', cursor);
      const { data, error } = await query
        .order('occurred_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(pageSize)
        .abortSignal(signal);
      if (error || !Array.isArray(data) || !data.every((row) => typeof row?.occurred_at === 'string')) {
        throw new Error('Could not load log calendar markers');
      }
      return data as { occurred_at: string }[];
    }, DEFAULT_REQUEST_TIMEOUT_MS, parentSignal);
    timestamps.push(...rows.map((row) => row.occurred_at));
    if (rows.length < pageSize) break;
    const lastTimestamp = rows[rows.length - 1]?.occurred_at;
    if (!lastTimestamp || lastTimestamp === cursor) break;
    cursor = lastTimestamp;
  }
  return dedupeLocalDateMarkers(timestamps);
}

export type DogInsightsReadResult = {
  events: InsightsEvent[];
  status: 'ready' | 'partial';
  partialReason?: InsightsPartialReason;
};

export async function fetchDogInsightsEvents(
  client: SupabaseClient,
  dogId: string,
  startIso: string | null,
  endIso: string,
  parentSignal?: AbortSignal,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<DogInsightsReadResult> {
  if (!dogId || !Number.isFinite(Date.parse(endIso)) || startIso !== null && !Number.isFinite(Date.parse(startIso))) {
    throw new Error('Invalid Insights query range');
  }
  const deadline = Date.now() + Math.max(1, timeoutMs);
  const events: InsightsEvent[] = [];
  const seenIds = new Set<string>();
  let cursor: InsightsEvent | null = null;

  while (true) {
    if (parentSignal?.aborted) throw new Error('Insights read cancelled');
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      if (events.length) return { events, status: 'partial', partialReason: 'timeout' };
      throw new Error('Insights request timed out');
    }

    let page: InsightsEvent[];
    try {
      page = await withRequestDeadline(async (signal) => {
        let query = client.from('dog_events')
          .select('id,event_type,occurred_at')
          .eq('dog_id', dogId)
          .in('event_type', ['pee', 'poop'])
          .lt('occurred_at', endIso);
        if (startIso) query = query.gte('occurred_at', startIso);
        if (cursor) query = query.or(`occurred_at.lt.${cursor.occurred_at},and(occurred_at.eq.${cursor.occurred_at},id.lt.${cursor.id})`);
        const { data, error } = await query
          .order('occurred_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(INSIGHTS_PAGE_SIZE)
          .abortSignal(signal);
        if (error) throw new Error('Could not load Insights events');
        if (!Array.isArray(data) || data.length > INSIGHTS_PAGE_SIZE || !data.every(isInsightsEvent)) throw new Error('Insights response did not match the query contract');
        return data;
      }, remaining, parentSignal);
    } catch (error) {
      if (parentSignal?.aborted) throw error;
      if (events.length) {
        return { events, status: 'partial', partialReason: Date.now() >= deadline ? 'timeout' : 'read-error' };
      }
      throw error;
    }

    validateInsightsPage(page, cursor, seenIds);
    events.push(...page);
    if (page.length < INSIGHTS_PAGE_SIZE) return { events, status: 'ready' };
    cursor = page.at(-1)!;
    if (startIso === null && events.length >= INSIGHTS_SINCE_START_LIMIT) {
      return { events, status: 'partial', partialReason: 'limit' };
    }
  }
}

function isInsightsEvent(value: unknown): value is InsightsEvent {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id)
    && (row.event_type === 'pee' || row.event_type === 'poop')
    && typeof row.occurred_at === 'string' && insightsTimestampOrder(row.occurred_at) !== null;
}

function validateInsightsPage(page: readonly InsightsEvent[], cursor: InsightsEvent | null, seenIds: Set<string>): void {
  let previous = cursor;
  for (const event of page) {
    if (seenIds.has(event.id) || previous && compareInsightsTuple(previous, event) <= 0) {
      throw new Error('Insights page cursor did not advance');
    }
    seenIds.add(event.id);
    previous = event;
  }
}

function compareInsightsTuple(left: InsightsEvent, right: InsightsEvent): number {
  const leftTime = insightsTimestampOrder(left.occurred_at)!;
  const rightTime = insightsTimestampOrder(right.occurred_at)!;
  if (leftTime !== rightTime) return leftTime > rightTime ? 1 : -1;
  return left.id.localeCompare(right.id);
}

function insightsTimestampOrder(value: string): bigint | null {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  const second = Date.parse(`${match[1]}${match[3]}`);
  if (!Number.isFinite(second)) return null;
  const fraction = BigInt((match[2] ?? '').padEnd(9, '0'));
  return BigInt(second) * 1_000_000n + fraction;
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
  if (!isValidDogEventKinds(operation.event_type, operation.accident_kinds)) return { status: 'failed' };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_events')
      .insert(operation)
      .abortSignal(signal)
      .select(EVENT_COLUMNS)
      .single(), timeoutMs);
    if (!result.error && isDogEventRecord(result.data) && matchesDogEventOperation(result.data, operation)) {
      return { status: 'saved', value: result.data };
    }
    failure = result.error ?? new Error('Empty insert response');
  } catch (error) {
    failure = error;
  }

  try {
    const found = await fetchDogEventById(client, operation.dog_id, operation.id, timeoutMs);
    if (found && matchesDogEventOperation(found, operation)) return { status: 'saved', value: found };
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
  if (!isValidDogEventKinds(changes.event_type, changes.accident_kinds, true)) return { status: 'failed' };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_events')
      .update(changes)
      .eq('dog_id', dogId)
      .eq('id', id)
      .abortSignal(signal)
      .select(EVENT_COLUMNS)
      .maybeSingle(), timeoutMs);
    if (!result.error && isDogEventRecord(result.data) && result.data.id === id && result.data.dog_id === dogId
      && matchesChanges(result.data, changes)) return { status: 'saved', value: result.data };
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

export function normalizeHealthHistoryTime(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const match = /^(?:([01]\d|2[0-3]):([0-5]\d))(?:\:00)?$/.exec(value);
  return match ? `${match[1]}:${match[2]}` : undefined;
}

export function normalizePlannedHealthTime(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const match = /^(?:([01]\d|2[0-3]):([0-5]\d))(?:\:00)?$/.exec(value);
  return match ? `${match[1]}:${match[2]}` : undefined;
}

export function isValidHealthHistoryTime(value: string | null): boolean {
  return value === null || typeof value === 'string' && normalizeHealthHistoryTime(value) === value;
}

export async function fetchHealthHistory(
  client: SupabaseClient,
  dogId: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  parentSignal?: AbortSignal,
): Promise<HealthHistoryRecord[]> {
  return withRequestDeadline(async (signal) => {
    const makeQuery = (columns: string) => client.from('dog_events')
      .select(columns).eq('dog_id', dogId).in('event_type', ['vaccination', 'vet_visit'])
      .order('occurred_on', { ascending: false }).order('id', { ascending: false }).abortSignal(signal);
    let { data, error } = await makeQuery(HEALTH_HISTORY_COLUMNS);
    let responseData: unknown = data;
    if (error && isMissingOccurredTimeColumn(error)) {
      const legacy = await makeQuery(HEALTH_HISTORY_LEGACY_COLUMNS);
      responseData = Array.isArray(legacy.data)
        ? (legacy.data as unknown as Record<string, unknown>[]).map((row) => ({ ...row, occurred_time: null }))
        : legacy.data;
      error = legacy.error;
    }
    if (error || !Array.isArray(responseData)) throw new Error('Could not load health history');
    const rows = responseData.map(normalizeHealthHistoryRecord);
    if (rows.some((row) => row === null || row.dog_id !== dogId)) throw new Error('Could not load health history');
    return rows as HealthHistoryRecord[];
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
    const row = normalizeHealthHistoryRecord(data);
    if (!row || row.dog_id !== dogId || row.event_type !== eventType || row.id !== id) {
      throw new Error('Health history response did not match the database contract');
    }
    return row;
  }, timeoutMs);
}

export async function insertHealthHistory(
  client: SupabaseClient,
  operation: HealthHistoryOperation,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<HealthHistoryRecord>> {
  const description = normalizeHealthHistoryDescription(operation.description);
  if (!isValidHealthHistoryDate(operation.occurred_on) || !isValidHealthHistoryTime(operation.occurred_time) || description === undefined
    || !isHealthHistoryType(operation.event_type)) return { status: 'failed' };
  const normalized = { ...operation, description };
  const payload = {
    id: operation.id,
    dog_id: operation.dog_id,
    event_type: operation.event_type,
    occurred_on: operation.occurred_on,
    occurred_time: operation.occurred_time,
    description,
  };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_events')
      .insert(payload).abortSignal(signal).select(HEALTH_HISTORY_COLUMNS).single(), timeoutMs);
    const row = result.error ? null : normalizeHealthHistoryRecord(result.data);
    if (!result.error && row && matchesHealthHistory(row, normalized)) {
      return { status: 'saved', value: row };
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
  previous: Pick<HealthHistoryRecord, 'occurred_on' | 'occurred_time' | 'description'>,
  changes: HealthHistoryChanges,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<HealthHistoryRecord>> {
  const description = normalizeHealthHistoryDescription(changes.description);
  if (!isValidHealthHistoryDate(changes.occurred_on) || !isValidHealthHistoryTime(changes.occurred_time) || description === undefined || !isHealthHistoryType(eventType)) return { status: 'failed' };
  const normalizedChanges = { ...changes, description };
  const payload = { occurred_on: changes.occurred_on, occurred_time: changes.occurred_time, description };
  let failure: unknown = null;
  try {
    let query = client.from('dog_events').update(payload)
      .eq('dog_id', dogId).eq('event_type', eventType).eq('id', id)
      .eq('occurred_on', previous.occurred_on);
    query = previous.occurred_time === null ? query.is('occurred_time', null) : query.eq('occurred_time', `${previous.occurred_time}:00`);
    query = previous.description === null ? query.is('description', null) : query.eq('description', previous.description);
    const result = await withRequestDeadline(async (signal) => await query.abortSignal(signal)
      .select(HEALTH_HISTORY_COLUMNS).maybeSingle(), timeoutMs);
    const row = result.error ? null : normalizeHealthHistoryRecord(result.data);
    if (!result.error && row && matchesHealthHistory(row, { id, dog_id: dogId, event_type: eventType, ...normalizedChanges })) {
      return { status: 'saved', value: row };
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
  previous: Pick<HealthHistoryRecord, 'occurred_on' | 'occurred_time' | 'description'>,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<null>> {
  let failure: unknown = null;
  try {
    let query = client.from('dog_events').delete()
      .eq('dog_id', dogId).eq('event_type', eventType).eq('id', id)
      .eq('occurred_on', previous.occurred_on);
    query = previous.occurred_time === null ? query.is('occurred_time', null) : query.eq('occurred_time', `${previous.occurred_time}:00`);
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
    return data.map(canonicalPlannedHealthRecord);
  }, timeoutMs, parentSignal);
}

export async function fetchFuturePlannedHealthReminders(
  client: SupabaseClient, dogId: string, localToday: string,
  isFutureFireTime: (record: PlannedHealthRecord) => boolean, isCurrent: () => boolean,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<PlannedReminderSelection | null> {
  if (!isCalendarDate(localToday)) throw new Error('Invalid local date for planned reminders');
  const candidates = new Map<string, PlannedHealthRecord>();
  for (let offset = 0; ; offset += PLANNED_REMINDER_PAGE_SIZE) {
    if (!isCurrent()) return null;
    const page = await withRequestDeadline(async (signal) => {
      const { data, error } = await client.from('dog_health_plans')
        .select(PLANNED_HEALTH_COLUMNS).eq('dog_id', dogId).eq('reminder_enabled', true)
        .gte('due_on', localToday).order('due_on', { ascending: true })
        .order('reminder_minutes', { ascending: true }).order('id', { ascending: true })
        .range(offset, offset + PLANNED_REMINDER_PAGE_SIZE - 1).abortSignal(signal);
      if (error || !Array.isArray(data) || !data.every(isPlannedHealthRecord)
        || data.some((row) => row.dog_id !== dogId || !row.reminder_enabled || row.due_on < localToday)) {
        throw new Error('Could not load planned reminders');
      }
      return data.map(canonicalPlannedHealthRecord);
    }, timeoutMs);
    if (!isCurrent()) return null;
    for (const record of page) if (!candidates.has(record.id) && isFutureFireTime(record)) candidates.set(record.id, record);
    if (candidates.size > PLANNED_REMINDER_PAGE_SIZE || page.length < PLANNED_REMINDER_PAGE_SIZE) break;
  }
  const sorted = [...candidates.values()].sort((left, right) => left.due_on.localeCompare(right.due_on)
    || (left.reminder_minutes ?? 0) - (right.reminder_minutes ?? 0) || left.id.localeCompare(right.id));
  return { records: sorted.slice(0, PLANNED_REMINDER_PAGE_SIZE), overCap: sorted.length > PLANNED_REMINDER_PAGE_SIZE };
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
    return canonicalPlannedHealthRecord(data);
  }, timeoutMs);
}

export async function insertPlannedHealth(
  client: SupabaseClient,
  operation: PlannedHealthOperation,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<PlannedHealthRecord>> {
  const description = normalizePlannedHealthDescription(operation.description);
  if (!isPlannedHealthType(operation.event_type) || !isValidPlannedHealthDate(operation.due_on, operation.local_today)
    || normalizePlannedHealthTime(operation.due_time) === undefined || description === undefined || typeof operation.reminder_enabled !== 'boolean'
    || !isValidReminderMinutes(operation.reminder_minutes) || operation.reminder_enabled && operation.reminder_minutes === null) return { status: 'failed' };
  const due_time = normalizePlannedHealthTime(operation.due_time) ?? null;
  const expected = { ...operation, due_time, description };
  const payload = { id: operation.id, dog_id: operation.dog_id, event_type: operation.event_type, due_on: operation.due_on, due_time, description, reminder_enabled: operation.reminder_enabled, reminder_minutes: operation.reminder_minutes };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dog_health_plans')
      .insert(payload).abortSignal(signal).select(PLANNED_HEALTH_COLUMNS).single(), timeoutMs);
    if (!result.error && isPlannedHealthRecord(result.data)) {
      const record = canonicalPlannedHealthRecord(result.data);
      if (matchesPlannedHealth(record, expected)) return { status: 'saved', value: record };
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
  previous: Pick<PlannedHealthRecord, 'event_type' | 'due_on' | 'due_time' | 'description' | 'reminder_enabled' | 'reminder_minutes'>,
  changes: PlannedHealthChanges,
  localToday: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<PlannedHealthRecord>> {
  const description = normalizePlannedHealthDescription(changes.description);
  const allowedDate = changes.due_on === previous.due_on || isValidPlannedHealthDate(changes.due_on, localToday);
  if (!isPlannedHealthType(previous.event_type) || !isCalendarDate(localToday) || !allowedDate || description === undefined) {
    return { status: 'failed' };
  }
  if (normalizePlannedHealthTime(changes.due_time) === undefined || typeof changes.reminder_enabled !== 'boolean' || !isValidReminderMinutes(changes.reminder_minutes)
    || changes.reminder_enabled && changes.reminder_minutes === null) return { status: 'failed' };
  const normalizedChanges = { due_on: changes.due_on, due_time: normalizePlannedHealthTime(changes.due_time) ?? null, description, reminder_enabled: changes.reminder_enabled, reminder_minutes: changes.reminder_minutes };
  let failure: unknown = null;
  try {
    let query = client.from('dog_health_plans').update(normalizedChanges)
      .eq('dog_id', dogId).eq('id', id).eq('event_type', previous.event_type).eq('due_on', previous.due_on);
    query = previous.description === null ? query.is('description', null) : query.eq('description', previous.description);
    query = query.eq('reminder_enabled', previous.reminder_enabled);
    query = previous.reminder_minutes === null ? query.is('reminder_minutes', null) : query.eq('reminder_minutes', previous.reminder_minutes);
    const priorDueTime = normalizePlannedHealthTime(previous.due_time);
    query = priorDueTime === null ? query.is('due_time', null) : query.eq('due_time', `${priorDueTime}:00`);
    const result = await withRequestDeadline(async (signal) => await query.abortSignal(signal)
      .select(PLANNED_HEALTH_COLUMNS).maybeSingle(), timeoutMs);
    if (!result.error && isPlannedHealthRecord(result.data)) {
      const record = canonicalPlannedHealthRecord(result.data);
      if (matchesPlannedHealth(record, { id, dog_id: dogId, event_type: previous.event_type, ...normalizedChanges })) {
        return { status: 'saved', value: record };
      }
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
  previous: Pick<PlannedHealthRecord, 'event_type' | 'due_on' | 'due_time' | 'description' | 'reminder_enabled' | 'reminder_minutes'>,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<WriteOutcome<null>> {
  let failure: unknown = null;
  try {
    let query = client.from('dog_health_plans').delete()
      .eq('dog_id', dogId).eq('id', id).eq('event_type', previous.event_type).eq('due_on', previous.due_on);
    query = previous.description === null ? query.is('description', null) : query.eq('description', previous.description);
    query = query.eq('reminder_enabled', previous.reminder_enabled);
    query = previous.reminder_minutes === null ? query.is('reminder_minutes', null) : query.eq('reminder_minutes', previous.reminder_minutes);
    const priorDueTime = normalizePlannedHealthTime(previous.due_time);
    query = priorDueTime === null ? query.is('due_time', null) : query.eq('due_time', `${priorDueTime}:00`);
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
      .select('id,content_id,version,status,title,body,min_age_weeks,max_age_weeks,sources,is_ai_generated,content_items!inner(slug,content_type),content_breed_targets(breed_id)')
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
  ageWeeks: number | null,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  parentSignal?: AbortSignal,
): Promise<HomeContent[]> {
  const rows = await fetchPublishedContentVersions(client, timeoutMs, parentSignal);
  const selectableRows = rows.filter((item) => item.content_items.slug !== 'before-homecoming');
  const selected = selectContent(selectableRows.map((item) => ({
    id: item.id,
    contentId: item.content_id,
    version: item.version,
    status: 'published' as const,
    minAgeWeeks: item.min_age_weeks,
    maxAgeWeeks: item.max_age_weeks,
    breedIds: item.content_breed_targets.map((target) => target.breed_id),
  })), ageWeeks, dog.breed_id);
  const byId = new Map(selectableRows.map((item) => [item.id, item]));
  return selected.flatMap(({ id }) => {
    const row = byId.get(id);
    const contentType = row?.content_items.content_type;
    if (!row || !isDisplayableContentType(contentType)) return [];
    return [{ id: row.id, contentId: row.content_id, version: row.version, title: row.title, body: row.body, contentType, sources: row.sources, isAiGenerated: row.is_ai_generated }];
  });
}

export async function fetchTrainingWorkspace(
  client: SupabaseClient,
  dog: OwnedDog,
  ageWeeks: number | null,
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
  const current = ageWeeks === null ? [] : selectContent(publishedPrograms.map((row) => ({
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
    is_ai_generated: row.is_ai_generated,
    steps: steps.filter((step) => step.program_version_id === row.id).sort((left, right) => left.position - right.position),
    completedStepIds: progress.filter((item) => item.program_version_id === row.id).map((item) => item.step_id),
    completedAtByStepId: Object.fromEntries(progress
      .filter((item) => item.program_version_id === row.id)
      .map((item) => [item.step_id, item.completed_at])),
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
    && (row.description === null || typeof row.description === 'string' && Array.from(row.description).length <= 500)
    && isValidDogEventKinds(row.event_type as LogEventType, row.accident_kinds, true);
}

function isValidDogEventKinds(type: LogEventType, value: unknown, allowLegacyUnknown = false): value is AccidentKind[] | null {
  if (type === 'accident') return value === null ? allowLegacyUnknown : isCanonicalAccidentKinds(value);
  return value === null;
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

function normalizeHealthHistoryRecord(value: unknown): HealthHistoryRecord | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const occurredTime = normalizeHealthHistoryTime(row.occurred_time);
  if (typeof row.id !== 'string' || typeof row.dog_id !== 'string' || typeof row.actor_id !== 'string'
    || !isHealthHistoryType(row.event_type) || typeof row.occurred_on !== 'string'
    || !isValidHealthHistoryDate(row.occurred_on) || occurredTime === undefined
    || (row.description !== null && (typeof row.description !== 'string' || Array.from(row.description).length > 500))) return null;
  return { id: row.id, dog_id: row.dog_id, actor_id: row.actor_id, event_type: row.event_type,
    occurred_on: row.occurred_on, occurred_time: occurredTime, description: row.description };
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

function isValidReminderMinutes(value: unknown): value is number | null {
  return value === null || typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1439;
}

function isMissingOccurredTimeColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const row = error as Record<string, unknown>;
  const code = row.code;
  const message = typeof row.message === 'string' ? row.message : '';
  return (code === '42703' || code === 'PGRST204') && /occurred_time/.test(message)
    && (code !== '42703' || /dog_events|column/i.test(message));
}

function isPlannedHealthRecord(value: unknown): value is PlannedHealthRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.dog_id === 'string'
    && isPlannedHealthType(row.event_type) && typeof row.due_on === 'string' && isCalendarDate(row.due_on)
    && (row.description === null || typeof row.description === 'string' && Array.from(row.description).length <= 500)
    && typeof row.created_at === 'string' && Number.isFinite(Date.parse(row.created_at))
    && normalizePlannedHealthTime(row.due_time) !== undefined
    && typeof row.reminder_enabled === 'boolean' && isValidReminderMinutes(row.reminder_minutes)
    && (!row.reminder_enabled || row.reminder_minutes !== null);
}

function canonicalPlannedHealthRecord(value: unknown): PlannedHealthRecord {
  const row = value as PlannedHealthRecord;
  return { ...row, due_time: normalizePlannedHealthTime(row.due_time) ?? null };
}

function isPublishedVersionRow(value: unknown): value is PublishedVersionRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  const parent = row.content_items;
  const targets = row.content_breed_targets;
  return typeof row.id === 'string' && typeof row.content_id === 'string'
    && typeof row.version === 'number' && row.status === 'published' && typeof row.title === 'string' && typeof row.body === 'string'
    && typeof row.min_age_weeks === 'number'
    && (typeof row.max_age_weeks === 'number' || row.max_age_weeks === null)
    && typeof row.is_ai_generated === 'boolean'
    && Array.isArray(row.sources) && row.sources.every((source) => typeof source === 'string')
    && Boolean(parent) && typeof parent === 'object' && !Array.isArray(parent)
    && typeof (parent as Record<string, unknown>).slug === 'string'
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test((parent as Record<string, unknown>).slug as string)
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

function isCanonicalUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
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
    && event.duration_minutes === changes.duration_minutes && event.description === changes.description
    && sameAccidentKinds(event.accident_kinds, changes.accident_kinds);
}

export function matchesDogEventOperation(event: DogEventRecord, operation: DogEventOperation): boolean {
  return event.id === operation.id && event.dog_id === operation.dog_id && event.event_type === operation.event_type
    && Date.parse(event.occurred_at) === Date.parse(operation.occurred_at)
    && event.duration_minutes === operation.duration_minutes && event.description === operation.description
    && sameAccidentKinds(event.accident_kinds, operation.accident_kinds);
}

function sameAccidentKinds(left: readonly AccidentKind[] | null, right: readonly AccidentKind[] | null): boolean {
  return left === null ? right === null : right !== null && left.length === right.length
    && left.every((kind, index) => kind === right[index]);
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
  expected: Pick<HealthHistoryOperation, 'id' | 'dog_id' | 'event_type' | 'occurred_on' | 'occurred_time' | 'description'>,
): boolean {
  return record.id === expected.id && record.dog_id === expected.dog_id && record.event_type === expected.event_type
    && record.occurred_on === expected.occurred_on && record.occurred_time === expected.occurred_time && record.description === expected.description;
}

function matchesPlannedHealth(
  record: PlannedHealthRecord,
  expected: Pick<PlannedHealthOperation, 'id' | 'dog_id' | 'event_type' | 'due_on' | 'due_time' | 'description' | 'reminder_enabled' | 'reminder_minutes'>,
): boolean {
  return record.id === expected.id && record.dog_id === expected.dog_id && record.event_type === expected.event_type
    && record.due_on === expected.due_on && normalizePlannedHealthTime(record.due_time) === expected.due_time && record.description === expected.description
    && record.reminder_enabled === expected.reminder_enabled && record.reminder_minutes === expected.reminder_minutes;
}

function isDefiniteClientRejection(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as Record<string, unknown>;
  if (typeof record.status === 'number' && record.status >= 400 && record.status < 500) return true;
  return typeof record.code === 'string' && (/^[0-9A-Z]{5}$/.test(record.code) || /^PGRST\d{3}$/.test(record.code));
}
