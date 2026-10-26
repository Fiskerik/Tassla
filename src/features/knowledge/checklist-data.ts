import type { SupabaseClient } from '@supabase/supabase-js';
import { CHECKLIST_TEMPLATES } from './checklist-content';
import { isChecklistIcon, type ChecklistIcon } from '../checklists/checklist-icons';
import { CHECKLIST_PHASE_ROOTS, CHECKLIST_VERSION, isChecklistContext, normalizeCustomChecklistTitle, type ChecklistContext, type ChecklistCustomItem, type ChecklistPreference, type ChecklistProgress, type ChecklistTemplate, type ChecklistWriteOutcome } from './checklist-model';
import { getContentSourceMetadata } from './source-links';

const deadlineMs = 12_000;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Row = Record<string, unknown>;
function request<T>(run: (signal: AbortSignal) => Promise<T>, parentSignal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (parentSignal?.aborted) abort(); else parentSignal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, deadlineMs);
  return run(controller.signal).finally(() => { clearTimeout(timer); parentSignal?.removeEventListener('abort', abort); });
}
function validProgress(row: Row, dogId: string, templateId: string, templates: readonly ChecklistTemplate[]): row is Row & ChecklistProgress {
  const template = templates.find((entry) => entry.id === templateId);
  return row.dog_id === dogId && row.template_id === templateId && typeof row.item_key === 'string' && Boolean(template?.items.some((item) => item.key === row.item_key));
}
function validCustom(row: Row, dogId: string, templateId: string): row is Row & { id: string; dog_id: string; template_id: string; title: string; completed: boolean; icon: ChecklistIcon | null } {
  return row.dog_id === dogId && row.template_id === templateId && typeof row.id === 'string' && uuidPattern.test(row.id)
    && typeof row.title === 'string' && normalizeCustomChecklistTitle(row.title) === row.title && typeof row.completed === 'boolean'
    && (row.icon === null || isChecklistIcon(row.icon));
}
function custom(row: { id: string; dog_id: string; template_id: string; title: string; completed: boolean; icon: ChecklistIcon | null }): ChecklistCustomItem {
  return { id: row.id, dogId: row.dog_id, templateId: row.template_id, title: row.title, completed: row.completed, icon: row.icon };
}
function exactProgress(row: Row | null, dogId: string, templateId: string, itemKey: string, templates: readonly ChecklistTemplate[]): boolean {
  return row !== null && validProgress(row, dogId, templateId, templates) && row.item_key === itemKey;
}
function exactCustom(row: Row | null, expected: { id: string; dog_id: string; template_id: string; title: string; completed: boolean; icon: ChecklistIcon | null }): boolean {
  return row !== null && validCustom(row, expected.dog_id, expected.template_id) && row.id === expected.id
    && row.title === expected.title && row.completed === expected.completed && row.icon === expected.icon;
}

export interface PublishedChecklistCatalog {
  templates: readonly ChecklistTemplate[];
  versionIds: readonly string[];
}

function sourceUrls(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && new Set(value).size === value.length
    && value.every((source) => typeof source === 'string' && getContentSourceMetadata(source) !== null);
}

/** Read and validate the complete published six-phase catalog through authenticated RLS-scoped tables. */
export async function fetchPublishedChecklistCatalog(client: SupabaseClient, signal?: AbortSignal): Promise<PublishedChecklistCatalog> {
  return request(async (abortSignal) => {
    const rootsResult = await client.from('checklist_templates').select('id,context,content_item_id').abortSignal(abortSignal);
    if (rootsResult.error) throw new Error('Could not load checklist catalog roots');
    const roots = (rootsResult.data ?? []) as Row[];
    if (roots.length === 0) return { templates: [], versionIds: [] };
    if (roots.length !== CHECKLIST_PHASE_ROOTS.length) throw new Error('Published checklist catalog is incomplete');

    const rootById = new Map<string, { contentItemId: string; context: ChecklistContext }>();
    for (const row of roots) {
      const contract = CHECKLIST_PHASE_ROOTS.find((item) => item.id === row.id);
      if (!contract || !isChecklistContext(row.context) || row.context !== contract.context || typeof row.content_item_id !== 'string' || !uuidPattern.test(row.content_item_id)) {
        throw new Error('Published checklist catalog root does not match its stable mapping');
      }
      if (rootById.has(contract.id)) throw new Error('Published checklist catalog contains duplicate roots');
      rootById.set(contract.id, { contentItemId: row.content_item_id, context: row.context });
    }
    if (CHECKLIST_PHASE_ROOTS.some((contract) => !rootById.has(contract.id))) throw new Error('Published checklist catalog is missing a stable root');

    const contentItemIds = [...rootById.values()].map((root) => root.contentItemId);
    if (new Set(contentItemIds).size !== CHECKLIST_PHASE_ROOTS.length) throw new Error('Published checklist roots share a content item mapping');
    const versionsResult = await client.from('content_versions')
      .select('id,content_id,version,title,body,min_age_weeks,max_age_weeks,context,sources,is_ai_generated,status,reviewed_at,review_reference')
      .in('content_id', contentItemIds).eq('status', 'published').abortSignal(abortSignal);
    if (versionsResult.error) throw new Error('Could not load published checklist versions');
    const versions = (versionsResult.data ?? []) as Row[];
    if (versions.length !== CHECKLIST_PHASE_ROOTS.length) throw new Error('Published checklist catalog must contain exactly one version for each phase');

    const versionByTemplate = new Map<string, { id: string; version: number; title: string; body: string; minAgeWeeks: number; maxAgeWeeks: number | null; sources: string[] }>();
    const templateByContentItemId = new Map([...rootById.entries()].map(([templateId, root]) => [root.contentItemId, templateId]));
    for (const row of versions) {
      const templateId = typeof row.content_id === 'string' ? templateByContentItemId.get(row.content_id) : undefined;
      const contract = templateId ? CHECKLIST_PHASE_ROOTS.find((item) => item.id === templateId) : undefined;
      if (!templateId || !contract || row.status !== 'published' || row.context !== contract.context
        || typeof row.id !== 'string' || !uuidPattern.test(row.id) || versionByTemplate.has(templateId)
        || typeof row.version !== 'number' || !Number.isInteger(row.version) || row.version < 1
        || typeof row.title !== 'string' || !row.title.trim() || row.title.length > 160
        || typeof row.body !== 'string' || !row.body.trim()
        || row.min_age_weeks !== contract.minAgeWeeks || row.max_age_weeks !== contract.maxAgeWeeks
        || row.is_ai_generated !== true || typeof row.reviewed_at !== 'string' || !Number.isFinite(Date.parse(row.reviewed_at))
        || typeof row.review_reference !== 'string' || !row.review_reference.trim()
        || !sourceUrls(row.sources)) {
        throw new Error('Published checklist version does not match its stable content contract');
      }
      versionByTemplate.set(templateId, {
        id: row.id, version: row.version, title: row.title, body: row.body,
        minAgeWeeks: row.min_age_weeks as number, maxAgeWeeks: row.max_age_weeks as number | null, sources: row.sources,
      });
    }

    const versionIds = CHECKLIST_PHASE_ROOTS.map((contract) => versionByTemplate.get(contract.id)!.id);
    const childrenResult = await client.from('content_version_checklist_items')
      .select('content_version_id,template_id,item_key,position,title')
      .in('content_version_id', versionIds).abortSignal(abortSignal);
    if (childrenResult.error) throw new Error('Could not load published checklist items');
    const children = (childrenResult.data ?? []) as Row[];
    const expectedPairCount = CHECKLIST_PHASE_ROOTS.reduce((count, contract) => count + contract.itemKeys.length, 0);
    if (children.length !== expectedPairCount) throw new Error('Published checklist catalog has incomplete item rows');

    const templates = CHECKLIST_PHASE_ROOTS.map((contract) => {
      const version = versionByTemplate.get(contract.id)!;
      const rows = children.filter((child) => child.content_version_id === version.id);
      if (rows.length !== contract.itemKeys.length) throw new Error('Published checklist phase has an incomplete item list');
      const items = contract.itemKeys.map((key, index) => {
        const matches = rows.filter((child) => child.item_key === key);
        const row = matches[0];
        if (matches.length !== 1 || row.template_id !== contract.id || row.position !== index + 1
          || typeof row.title !== 'string' || !row.title.trim() || row.title.length > 160) {
          throw new Error('Published checklist item does not match its stable template key');
        }
        return { key, title: row.title };
      });
      if (rows.some((row) => !contract.itemKeys.includes(row.item_key as never))) throw new Error('Published checklist phase contains an unknown item key');
      return {
        id: contract.id, phase: contract.phase, title: version.title, intro: version.body,
        minAgeWeeks: version.minAgeWeeks, maxAgeWeeks: version.maxAgeWeeks, items,
        versionId: version.id, sources: version.sources,
      } satisfies ChecklistTemplate;
    });
    return { templates, versionIds };
  }, signal);
}

export async function fetchChecklistState(client: SupabaseClient, dogId: string, templateId: string, signal?: AbortSignal, templates: readonly ChecklistTemplate[] = CHECKLIST_TEMPLATES) {
  const template = templates.find((entry) => entry.id === templateId);
  if (!template) throw new Error('Unknown checklist template');
  return request(async (abortSignal) => {
    const [progressResult, customResult, preferenceResult] = await Promise.all([
      client.from('dog_checklist_progress').select('dog_id,template_id,item_key').eq('dog_id', dogId).eq('template_id', templateId).abortSignal(abortSignal),
      client.from('dog_checklist_custom_items').select('id,dog_id,template_id,title,completed,icon').eq('dog_id', dogId).eq('template_id', templateId).order('id').abortSignal(abortSignal),
      client.from('dog_checklist_preferences').select('dog_id,context').eq('dog_id', dogId).abortSignal(abortSignal).maybeSingle(),
    ]);
    if (progressResult.error || customResult.error || preferenceResult.error) throw new Error('Could not load checklist');
    const progressRows = (progressResult.data ?? []) as Row[];
    const customRows = (customResult.data ?? []) as Row[];
    if (!progressRows.every((row) => validProgress(row, dogId, templateId, templates)) || !customRows.every((row) => validCustom(row, dogId, templateId))) throw new Error('Checklist response did not match the database contract');
    const preferenceRow = preferenceResult.data as Row | null;
    if (preferenceRow && (preferenceRow.dog_id !== dogId || !isChecklistContext(preferenceRow.context))) throw new Error('Checklist preference did not match the database contract');
    const state: { progress: ChecklistProgress[]; customItems: ChecklistCustomItem[]; preference: ChecklistPreference | null } = {
      progress: progressRows.map((r) => ({ dogId: r.dog_id as string, templateId: r.template_id as string, itemKey: r.item_key as string })),
      customItems: customRows.map((r) => custom(r as never)),
      preference: preferenceRow ? { dogId, context: preferenceRow.context as ChecklistContext } : null,
    };
    return state;
  }, signal);
}

export async function fetchChecklistOverview(client: SupabaseClient, dogId: string, signal?: AbortSignal, templates: readonly ChecklistTemplate[] = CHECKLIST_TEMPLATES) {
  return request(async (abortSignal) => {
    const [progressResult, customResult, preferenceResult] = await Promise.all([
      client.from('dog_checklist_progress').select('dog_id,template_id,item_key').eq('dog_id', dogId).abortSignal(abortSignal),
      client.from('dog_checklist_custom_items').select('dog_id,template_id,completed').eq('dog_id', dogId).abortSignal(abortSignal),
      client.from('dog_checklist_preferences').select('dog_id,context').eq('dog_id', dogId).abortSignal(abortSignal).maybeSingle(),
    ]);
    if (progressResult.error || customResult.error || preferenceResult.error) throw new Error('Could not load checklist');
    const progressRows = (progressResult.data ?? []) as Row[];
    const customRows = (customResult.data ?? []) as Row[];
    if (!progressRows.every((row) => templates.some((template) => validProgress(row, dogId, template.id, templates)))
      || !customRows.every((row) => row.dog_id === dogId && typeof row.template_id === 'string'
        && templates.some((template) => template.id === row.template_id) && typeof row.completed === 'boolean')) {
      throw new Error('Checklist response did not match the database contract');
    }
    const preferenceRow = preferenceResult.data as Row | null;
    if (preferenceRow && (preferenceRow.dog_id !== dogId || !isChecklistContext(preferenceRow.context))) throw new Error('Checklist preference did not match the database contract');
    const summary = Object.fromEntries(templates.map((template) => {
      const done = progressRows.filter((row) => row.template_id === template.id).length + customRows.filter((row) => row.template_id === template.id && row.completed === true).length;
      const total = template.items.length + customRows.filter((row) => row.template_id === template.id).length;
      return [template.id, { done, total }];
    }));
    return { summary, preference: preferenceRow ? { dogId, context: preferenceRow.context as ChecklistContext } : null };
  }, signal);
}

export type ChecklistOverview = Awaited<ReturnType<typeof fetchChecklistOverview>>;
export type ChecklistTemplateState = Awaited<ReturnType<typeof fetchChecklistState>>;
type ChecklistReadCacheEntry = { overview: ChecklistOverview | null; templates: Map<string, ChecklistTemplateState> };
const checklistReadCache = new Map<string, ChecklistReadCacheEntry>();
const maxChecklistReadCacheScopes = 4;

export function checklistReadCacheScope(sessionKey: string, dogId: string, reviewMode: boolean, versionIds: readonly string[] = []) {
  return JSON.stringify([sessionKey, dogId, CHECKLIST_VERSION, reviewMode ? 'review' : 'public', reviewMode ? [] : [...versionIds].sort()]);
}

export function checklistCatalogReadCacheScope(baseScope: string, versionIds: readonly string[]) {
  try {
    const parts = JSON.parse(baseScope) as unknown[];
    if (Array.isArray(parts) && parts.length >= 4) return JSON.stringify([...parts.slice(0, 4), [...versionIds].sort()]);
  } catch { /* Retain a safe, distinct namespace for an unexpected caller key. */ }
  return JSON.stringify([baseScope, CHECKLIST_VERSION, 'public', [...versionIds].sort()]);
}

function sameChecklistOwnerScope(scope: string, baseScope: string): boolean {
  try {
    const candidate = JSON.parse(scope) as unknown[];
    const base = JSON.parse(baseScope) as unknown[];
    return Array.isArray(candidate) && Array.isArray(base) && base.length >= 4
      && base.slice(0, 4).every((part, index) => candidate[index] === part);
  } catch { return scope === baseScope; }
}

function cloneOverview(overview: ChecklistOverview): ChecklistOverview {
  return {
    summary: Object.fromEntries(Object.entries(overview.summary).map(([id, summary]) => [id, { ...summary }])),
    preference: overview.preference ? { ...overview.preference } : null,
  };
}

function cloneTemplateState(state: ChecklistTemplateState): ChecklistTemplateState {
  return {
    progress: state.progress.map((item) => ({ ...item })),
    customItems: state.customItems.map((item) => ({ ...item })),
    preference: state.preference ? { ...state.preference } : null,
  };
}

function touchChecklistReadCache(scope: string, entry: ChecklistReadCacheEntry) {
  checklistReadCache.delete(scope);
  checklistReadCache.set(scope, entry);
  while (checklistReadCache.size > maxChecklistReadCacheScopes) {
    const oldest = checklistReadCache.keys().next().value;
    if (oldest === undefined) return;
    checklistReadCache.delete(oldest);
  }
}

export function checklistOverviewSnapshot(scope: string): ChecklistOverview | null {
  const entry = checklistReadCache.get(scope);
  if (!entry?.overview) return null;
  touchChecklistReadCache(scope, entry);
  return cloneOverview(entry.overview);
}

export function checklistTemplateSnapshot(scope: string, templateId: string): ChecklistTemplateState | null {
  const entry = checklistReadCache.get(scope);
  const state = entry?.templates.get(templateId);
  if (!entry || !state) return null;
  touchChecklistReadCache(scope, entry);
  return cloneTemplateState(state);
}

export function keepChecklistReadCacheForScope(scope: string) {
  for (const cachedScope of checklistReadCache.keys()) {
    if (!sameChecklistOwnerScope(cachedScope, scope)) checklistReadCache.delete(cachedScope);
  }
}

export function clearChecklistReadCache(scope: string) {
  for (const cachedScope of checklistReadCache.keys()) {
    if (sameChecklistOwnerScope(cachedScope, scope)) checklistReadCache.delete(cachedScope);
  }
}

export function cacheChecklistOverview(scope: string, overview: ChecklistOverview) {
  const entry = checklistReadCache.get(scope) ?? { overview: null, templates: new Map<string, ChecklistTemplateState>() };
  entry.overview = cloneOverview(overview);
  touchChecklistReadCache(scope, entry);
}

export function cacheChecklistTemplateState(scope: string, templateId: string, state: ChecklistTemplateState, templates: readonly ChecklistTemplate[] = CHECKLIST_TEMPLATES) {
  const entry = checklistReadCache.get(scope) ?? { overview: null, templates: new Map<string, ChecklistTemplateState>() };
  const snapshot = cloneTemplateState(state);
  entry.templates.set(templateId, snapshot);
  const template = templates.find((item) => item.id === templateId);
  if (entry.overview && template) {
    const total = template.items.length + snapshot.customItems.length;
    const done = snapshot.progress.length + snapshot.customItems.filter((item) => item.completed).length;
    entry.overview = { ...entry.overview, summary: { ...entry.overview.summary, [templateId]: { done, total } } };
  }
  touchChecklistReadCache(scope, entry);
}

export function cacheChecklistPreference(scope: string, preference: ChecklistPreference) {
  const entry = checklistReadCache.get(scope);
  if (!entry) return;
  entry.overview = entry.overview ? { ...entry.overview, preference: { ...preference } } : null;
  for (const [templateId, state] of entry.templates) {
    entry.templates.set(templateId, { ...state, preference: { ...preference } });
  }
  touchChecklistReadCache(scope, entry);
}

export async function setChecklistItem(client: SupabaseClient, dogId: string, templateId: string, itemKey: string, completed: boolean, signal?: AbortSignal, templates: readonly ChecklistTemplate[] = CHECKLIST_TEMPLATES): Promise<ChecklistWriteOutcome<ChecklistProgress | null>> {
  const template = templates.find((entry) => entry.id === templateId);
  if (!template?.items.some((item) => item.key === itemKey)) return { status: 'failed' };
  const tuple = { dog_id: dogId, template_id: templateId, item_key: itemKey };
  return request(async (abortSignal) => {
    try {
      const result = completed
        ? await client.from('dog_checklist_progress').upsert(tuple, { onConflict: 'dog_id,template_id,item_key', ignoreDuplicates: true }).abortSignal(abortSignal)
        : await client.from('dog_checklist_progress').delete().match(tuple).abortSignal(abortSignal);
      if (!result.error) {
        const read = await client.from('dog_checklist_progress').select('dog_id,template_id,item_key').match(tuple).abortSignal(abortSignal).maybeSingle();
        if (!read.error && (completed ? exactProgress(read.data as Row | null, dogId, templateId, itemKey, templates) : read.data === null)) return { status: 'saved', value: completed ? { dogId, templateId, itemKey } : null };
        return { status: read.error ? 'unknown' : 'failed' };
      }
      const read = await client.from('dog_checklist_progress').select('dog_id,template_id,item_key').match(tuple).abortSignal(abortSignal).maybeSingle();
      if (read.error) return { status: 'unknown' };
      if (completed ? exactProgress(read.data as Row | null, dogId, templateId, itemKey, templates) : read.data === null) return { status: 'saved', value: completed ? { dogId, templateId, itemKey } : null };
      return { status: 'failed' };
    } catch { return { status: 'unknown' }; }
  }, signal);
}

export async function setChecklistPreference(client: SupabaseClient, dogId: string, context: ChecklistContext, signal?: AbortSignal): Promise<ChecklistWriteOutcome<ChecklistPreference>> {
  if (!isChecklistContext(context)) return { status: 'failed' };
  return request(async (abortSignal) => {
    try {
      const expected = { dog_id: dogId, context };
      const inserted = await client.from('dog_checklist_preferences').upsert(expected, { onConflict: 'dog_id', ignoreDuplicates: true }).abortSignal(abortSignal);
      if (inserted.error) {
        const read = await client.from('dog_checklist_preferences').select('dog_id,context').eq('dog_id', dogId).abortSignal(abortSignal).maybeSingle();
        if (read.error) return { status: 'unknown' };
        const row = read.data as Row | null;
        if (row?.dog_id === dogId && row.context === context) return { status: 'saved', value: { dogId, context } };
        return { status: 'failed' };
      }
      const updated = await client.from('dog_checklist_preferences').update({ context }).eq('dog_id', dogId).abortSignal(abortSignal);
      if (updated.error) {
        const read = await client.from('dog_checklist_preferences').select('dog_id,context').eq('dog_id', dogId).abortSignal(abortSignal).maybeSingle();
        if (read.error) return { status: 'unknown' };
        const row = read.data as Row | null;
        if (row?.dog_id === dogId && row.context === context) return { status: 'saved', value: { dogId, context } };
        return { status: 'failed' };
      }
      const read = await client.from('dog_checklist_preferences').select('dog_id,context').eq('dog_id', dogId).abortSignal(abortSignal).maybeSingle();
      if (read.error) return { status: 'unknown' };
      const row = read.data as Row | null;
      return row?.dog_id === dogId && row.context === context ? { status: 'saved', value: { dogId, context } } : { status: 'failed' };
    } catch { return { status: 'unknown' }; }
  }, signal);
}

export async function addChecklistCustomItem(client: SupabaseClient, dogId: string, templateId: string, id: string, rawTitle: string, icon: ChecklistIcon | null = null, signal?: AbortSignal, templates: readonly ChecklistTemplate[] = CHECKLIST_TEMPLATES): Promise<ChecklistWriteOutcome<ChecklistCustomItem>> {
  const title = normalizeCustomChecklistTitle(rawTitle);
  if (!title || !uuidPattern.test(id) || (icon !== null && !isChecklistIcon(icon)) || !templates.some((entry) => entry.id === templateId)) return { status: 'failed' };
  const expected = { id, dog_id: dogId, template_id: templateId, title, completed: false, icon };
  return request(async (abortSignal) => {
    try {
      const result = await client.from('dog_checklist_custom_items').insert(expected).abortSignal(abortSignal);
      if (!result.error) {
        const read = await client.from('dog_checklist_custom_items').select('id,dog_id,template_id,title,completed,icon').eq('dog_id', dogId).eq('id', id).abortSignal(abortSignal).maybeSingle();
        return read.error ? { status: 'unknown' } : exactCustom(read.data as Row | null, expected) ? { status: 'saved', value: custom(expected) } : { status: 'failed' };
      }
      const read = await client.from('dog_checklist_custom_items').select('id,dog_id,template_id,title,completed,icon').eq('dog_id', dogId).eq('id', id).abortSignal(abortSignal).maybeSingle();
      return read.error ? { status: 'unknown' } : exactCustom(read.data as Row | null, expected) ? { status: 'saved', value: custom(expected) } : { status: 'failed' };
    } catch { return { status: 'unknown' }; }
  }, signal);
}

export async function updateChecklistCustomItem(client: SupabaseClient, previous: ChecklistCustomItem, changes: Pick<ChecklistCustomItem, 'title' | 'completed'> & { icon?: ChecklistIcon | null }, signal?: AbortSignal, templates: readonly ChecklistTemplate[] = CHECKLIST_TEMPLATES): Promise<ChecklistWriteOutcome<ChecklistCustomItem>> {
  const title = normalizeCustomChecklistTitle(changes.title);
  const icon = changes.icon === undefined ? previous.icon : changes.icon;
  if (!title || !uuidPattern.test(previous.id) || (icon !== null && !isChecklistIcon(icon)) || !templates.some((entry) => entry.id === previous.templateId)) return { status: 'failed' };
  const expected = { id: previous.id, dog_id: previous.dogId, template_id: previous.templateId, title, completed: changes.completed, icon };
  const preimage = { id: previous.id, dog_id: previous.dogId, template_id: previous.templateId, title: previous.title, completed: previous.completed, icon: previous.icon };
  const payload = { title, completed: changes.completed, ...(changes.icon === undefined ? {} : { icon }) };
  return request(async (abortSignal) => {
    try {
      let update = client.from('dog_checklist_custom_items').update(payload).eq('dog_id', previous.dogId).eq('id', previous.id).eq('template_id', previous.templateId).eq('title', previous.title).eq('completed', previous.completed);
      update = previous.icon === null ? update.is('icon', null) : update.eq('icon', previous.icon);
      const result = await update.select('id,dog_id,template_id,title,completed,icon').abortSignal(abortSignal).maybeSingle();
      if (result.data && exactCustom(result.data as Row, expected)) return { status: 'saved', value: custom(expected) };
      if (result.error) {
        const read = await client.from('dog_checklist_custom_items').select('id,dog_id,template_id,title,completed,icon').eq('dog_id', previous.dogId).eq('id', previous.id).abortSignal(abortSignal).maybeSingle();
        if (read.error) return { status: 'unknown' };
        if (exactCustom(read.data as Row | null, expected)) return { status: 'saved', value: custom(expected) };
        if (read.data === null) return { status: 'conflict' };
        if (exactCustom(read.data as Row, preimage)) return { status: 'failed' };
        return { status: 'conflict' };
      }
      return result.data === null ? { status: 'conflict' } : { status: 'failed' };
    } catch { return { status: 'unknown' }; }
  }, signal);
}

export async function deleteChecklistCustomItem(client: SupabaseClient, previous: ChecklistCustomItem, signal?: AbortSignal, templates: readonly ChecklistTemplate[] = CHECKLIST_TEMPLATES): Promise<ChecklistWriteOutcome<null>> {
  if (!uuidPattern.test(previous.id) || !templates.some((entry) => entry.id === previous.templateId)) return { status: 'failed' };
  return request(async (abortSignal) => {
    try {
      let deletion = client.from('dog_checklist_custom_items').delete().eq('dog_id', previous.dogId).eq('id', previous.id).eq('template_id', previous.templateId).eq('title', previous.title).eq('completed', previous.completed);
      deletion = previous.icon === null ? deletion.is('icon', null) : deletion.eq('icon', previous.icon);
      const result = await deletion.select('id').abortSignal(abortSignal).maybeSingle();
      if (result.data?.id === previous.id) return { status: 'saved', value: null };
      const read = await client.from('dog_checklist_custom_items').select('id,dog_id,template_id,title,completed,icon').eq('dog_id', previous.dogId).eq('id', previous.id).abortSignal(abortSignal).maybeSingle();
      if (read.error) return { status: 'unknown' };
      if (read.data === null) return { status: 'saved', value: null };
      const row = read.data as Row;
      return row.template_id === previous.templateId && row.title === previous.title && row.completed === previous.completed && row.icon === previous.icon
        ? { status: result.error ? 'failed' : 'conflict' }
        : { status: 'conflict' };
    } catch { return { status: 'unknown' }; }
  }, signal);
}
