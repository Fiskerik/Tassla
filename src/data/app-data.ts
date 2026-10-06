import type { SupabaseClient } from '@supabase/supabase-js';
import { selectContent } from '../content/select-content';

export interface OwnedDog {
  id: string;
  name: string;
  breed_id: string;
  birth_date: string;
}

export interface OwnedDogProfileChanges {
  name: string;
  breed_id: string;
  birth_date: string;
}

export interface BreedOption {
  id: string;
  name: string;
}

export type DogProfileWriteOutcome = { status: 'saved'; value: OwnedDog } | { status: 'failed' | 'unknown' };

export interface HomeContent {
  id: string;
  title: string;
  body: string;
  contentType: 'article' | 'guide' | 'checklist' | 'training_program';
}

const DOG_REQUEST_DEADLINE_MS = 12_000;

interface ContentVersionRow {
  id: string;
  content_id: string;
  version: number;
  title: string;
  body: string;
  min_age_weeks: number;
  max_age_weeks: number | null;
  content_items: { content_type: string };
  content_breed_targets: { breed_id: string }[];
}

export async function fetchOwnedDog(client: SupabaseClient): Promise<OwnedDog | null> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client
      .from('dogs')
      .select('id,name,breed_id,birth_date')
      .abortSignal(signal)
      .maybeSingle();
    if (error) throw new Error('Could not load the dog profile');
    if (data === null) return null;
    if (!isOwnedDog(data)) throw new Error('Dog profile response did not match the database contract');
    return data;
  });
}

export async function fetchOwnedDogById(client: SupabaseClient, dogId: string): Promise<OwnedDog | null> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('dogs')
      .select('id,name,breed_id,birth_date')
      .eq('id', dogId)
      .abortSignal(signal)
      .maybeSingle();
    if (error) throw new Error('Could not check dog profile status');
    if (data === null) return null;
    if (!isOwnedDog(data) || data.id !== dogId) throw new Error('Dog profile status did not match the database contract');
    return data;
  });
}

export function normalizeDogProfileName(value: string): string | undefined {
  const normalized = value.trim();
  const length = Array.from(normalized).length;
  return length >= 1 && length <= 80 ? normalized : undefined;
}

export function isValidDogBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) return false;
  const today = new Date();
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return value <= todayText;
}

export async function updateOwnedDog(
  client: SupabaseClient,
  dogId: string,
  previous: OwnedDog,
  changes: OwnedDogProfileChanges,
  knownBreeds: readonly BreedOption[],
): Promise<DogProfileWriteOutcome> {
  const name = normalizeDogProfileName(changes.name);
  if (previous.id !== dogId || !name || !isValidDogBirthDate(changes.birth_date)
    || !knownBreeds.some((breed) => breed.id === changes.breed_id)) {
    return { status: 'failed' };
  }
  const desired = { id: dogId, name, breed_id: changes.breed_id, birth_date: changes.birth_date };
  let failure: unknown = null;
  try {
    const result = await withRequestDeadline(async (signal) => await client.from('dogs')
      .update({ name, breed_id: changes.breed_id, birth_date: changes.birth_date })
      .eq('id', dogId)
      .eq('name', previous.name)
      .eq('breed_id', previous.breed_id)
      .eq('birth_date', previous.birth_date)
      .abortSignal(signal)
      .select('id,name,breed_id,birth_date')
      .maybeSingle());
    if (!result.error && isOwnedDog(result.data) && matchesDogProfile(result.data, desired)) {
      return { status: 'saved', value: result.data };
    }
    failure = result.error ?? new Error('Dog profile update did not return the requested profile');
  } catch (error) {
    failure = error;
  }

  try {
    const current = await fetchOwnedDogById(client, dogId);
    if (current && matchesDogProfile(current, desired)) return { status: 'saved', value: current };
    if (current && matchesDogProfile(current, previous) && isDefiniteClientRejection(failure)) return { status: 'failed' };
    return { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
}

export async function fetchBreeds(client: SupabaseClient): Promise<BreedOption[]> {
  return withRequestDeadline(async (signal) => {
    const { data, error } = await client.from('breeds')
      .select('id,name')
      .order('name')
      .abortSignal(signal);
    if (error || !data) throw new Error('Could not load breeds');
    return data;
  });
}

export async function createDog(
  client: SupabaseClient,
  input: { name: string; breedId: string; birthDate: string },
): Promise<void> {
  await withRequestDeadline(async (signal) => {
    const { error } = await client.rpc('create_dog', {
      dog_name: input.name.trim(),
      dog_breed_id: input.breedId,
      dog_birth_date: input.birthDate,
      kennel_code: null,
    }).abortSignal(signal);
    if (error) throw new Error('Could not create the dog profile');
  });
}

async function withRequestDeadline<T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOG_REQUEST_DEADLINE_MS);
  try {
    return await request(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

function isOwnedDog(value: unknown): value is OwnedDog {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && row.id.length > 0
    && typeof row.name === 'string' && normalizeDogProfileName(row.name) === row.name
    && typeof row.breed_id === 'string' && row.breed_id.length > 0
    && typeof row.birth_date === 'string' && isValidDogBirthDate(row.birth_date);
}

function matchesDogProfile(current: OwnedDog, expected: OwnedDogProfileChanges & Pick<OwnedDog, 'id'>): boolean {
  return current.id === expected.id && current.name === expected.name
    && current.breed_id === expected.breed_id && current.birth_date === expected.birth_date;
}

function isDefiniteClientRejection(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as Record<string, unknown>;
  if (typeof record.status === 'number' && record.status >= 400 && record.status < 500) return true;
  return typeof record.code === 'string' && (/^[0-9A-Z]{5}$/.test(record.code) || /^PGRST\d{3}$/.test(record.code));
}

export async function fetchHomeContent(client: SupabaseClient, dog: OwnedDog, ageWeeks: number): Promise<HomeContent[]> {
  const { data, error } = await client
    .from('content_versions')
    .select('id,content_id,version,title,body,min_age_weeks,max_age_weeks,content_items!inner(content_type),content_breed_targets(breed_id)')
    .eq('status', 'published')
    .lte('min_age_weeks', ageWeeks)
    .or(`max_age_weeks.is.null,max_age_weeks.gte.${ageWeeks}`);
  if (error || !data) throw new Error('Could not load published content');

  const rows: unknown = data;
  if (!Array.isArray(rows) || !rows.every(isContentVersionRow)) {
    throw new Error('Published content response did not match the database contract');
  }

  const versions = rows.map((item) => ({
    id: item.id,
    contentId: item.content_id,
    version: item.version,
    status: 'published' as const,
    minAgeWeeks: item.min_age_weeks,
    maxAgeWeeks: item.max_age_weeks,
    breedIds: item.content_breed_targets.map((target) => target.breed_id),
  }));
  const selected = selectContent(versions, ageWeeks, dog.breed_id);
  const byId = new Map(rows.map((item) => [item.id, item]));

  return selected.flatMap((version) => {
    const item = byId.get(version.id);
    const contentType = item?.content_items.content_type;
    if (!item || !contentType || !isContentType(contentType)) return [];
    return [{ id: item.id, title: item.title, body: item.body, contentType }];
  });
}

function isContentVersionRow(value: unknown): value is ContentVersionRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  const parent = row.content_items;
  const targets = row.content_breed_targets;
  return typeof row.id === 'string'
    && typeof row.content_id === 'string'
    && typeof row.version === 'number'
    && typeof row.title === 'string'
    && typeof row.body === 'string'
    && typeof row.min_age_weeks === 'number'
    && (typeof row.max_age_weeks === 'number' || row.max_age_weeks === null)
    && !!parent && typeof parent === 'object' && !Array.isArray(parent)
    && typeof (parent as Record<string, unknown>).content_type === 'string'
    && Array.isArray(targets)
    && targets.every((target) => !!target && typeof target === 'object'
      && typeof (target as Record<string, unknown>).breed_id === 'string');
}

function isContentType(value: string): value is HomeContent['contentType'] {
  return value === 'article' || value === 'guide' || value === 'checklist' || value === 'training_program';
}
