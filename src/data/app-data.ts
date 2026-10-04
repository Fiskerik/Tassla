import type { SupabaseClient } from '@supabase/supabase-js';
import { selectContent } from '../content/select-content';

export interface OwnedDog {
  id: string;
  name: string;
  breed_id: string;
  birth_date: string;
}

export interface BreedOption {
  id: string;
  name: string;
}

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
    return data;
  });
}

export async function fetchBreeds(client: SupabaseClient): Promise<BreedOption[]> {
  const { data, error } = await client.from('breeds').select('id,name').order('name');
  if (error || !data) throw new Error('Could not load breeds');
  return data;
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
