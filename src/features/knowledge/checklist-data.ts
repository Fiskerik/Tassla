import type { SupabaseClient } from '@supabase/supabase-js';
import { CHECKLIST_TEMPLATES } from './checklist-content';
import { isChecklistContext, normalizeCustomChecklistTitle, type ChecklistContext, type ChecklistCustomItem, type ChecklistPreference, type ChecklistProgress, type ChecklistWriteOutcome } from './checklist-model';

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
function validProgress(row: Row, dogId: string, templateId: string): row is Row & ChecklistProgress {
  const template = CHECKLIST_TEMPLATES.find((entry) => entry.id === templateId);
  return row.dog_id === dogId && row.template_id === templateId && typeof row.item_key === 'string' && Boolean(template?.items.some((item) => item.key === row.item_key));
}
function validCustom(row: Row, dogId: string, templateId: string): row is Row & { id: string; dog_id: string; template_id: string; title: string; completed: boolean } {
  return row.dog_id === dogId && row.template_id === templateId && typeof row.id === 'string' && uuidPattern.test(row.id) && typeof row.title === 'string' && normalizeCustomChecklistTitle(row.title) === row.title && typeof row.completed === 'boolean';
}
function custom(row: { id: string; dog_id: string; template_id: string; title: string; completed: boolean }): ChecklistCustomItem {
  return { id: row.id, dogId: row.dog_id, templateId: row.template_id, title: row.title, completed: row.completed };
}
function exactProgress(row: Row | null, dogId: string, templateId: string, itemKey: string): boolean {
  return row !== null && validProgress(row, dogId, templateId) && row.item_key === itemKey;
}
function exactCustom(row: Row | null, expected: { id: string; dog_id: string; template_id: string; title: string; completed: boolean }): boolean {
  return row !== null && validCustom(row, expected.dog_id, expected.template_id) && row.id === expected.id && row.title === expected.title && row.completed === expected.completed;
}

export async function fetchChecklistState(client: SupabaseClient, dogId: string, templateId: string, signal?: AbortSignal) {
  const template = CHECKLIST_TEMPLATES.find((entry) => entry.id === templateId);
  if (!template) throw new Error('Unknown checklist template');
  return request(async (abortSignal) => {
    const [progressResult, customResult, preferenceResult] = await Promise.all([
      client.from('dog_checklist_progress').select('dog_id,template_id,item_key').eq('dog_id', dogId).eq('template_id', templateId).abortSignal(abortSignal),
      client.from('dog_checklist_custom_items').select('id,dog_id,template_id,title,completed').eq('dog_id', dogId).eq('template_id', templateId).order('id').abortSignal(abortSignal),
      client.from('dog_checklist_preferences').select('dog_id,context').eq('dog_id', dogId).abortSignal(abortSignal).maybeSingle(),
    ]);
    if (progressResult.error || customResult.error || preferenceResult.error) throw new Error('Could not load checklist');
    const progressRows = (progressResult.data ?? []) as Row[];
    const customRows = (customResult.data ?? []) as Row[];
    if (!progressRows.every((row) => validProgress(row, dogId, templateId)) || !customRows.every((row) => validCustom(row, dogId, templateId))) throw new Error('Checklist response did not match the database contract');
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

export async function fetchChecklistOverview(client: SupabaseClient, dogId: string, signal?: AbortSignal) {
  return request(async (abortSignal) => {
    const [progressResult, customResult, preferenceResult] = await Promise.all([
      client.from('dog_checklist_progress').select('dog_id,template_id,item_key').eq('dog_id', dogId).abortSignal(abortSignal),
      client.from('dog_checklist_custom_items').select('dog_id,template_id,completed').eq('dog_id', dogId).abortSignal(abortSignal),
      client.from('dog_checklist_preferences').select('dog_id,context').eq('dog_id', dogId).abortSignal(abortSignal).maybeSingle(),
    ]);
    if (progressResult.error || customResult.error || preferenceResult.error) throw new Error('Could not load checklist');
    const progressRows = (progressResult.data ?? []) as Row[];
    const customRows = (customResult.data ?? []) as Row[];
    if (!progressRows.every((row) => CHECKLIST_TEMPLATES.some((template) => validProgress(row, dogId, template.id)))
      || !customRows.every((row) => row.dog_id === dogId && typeof row.template_id === 'string'
        && CHECKLIST_TEMPLATES.some((template) => template.id === row.template_id) && typeof row.completed === 'boolean')) {
      throw new Error('Checklist response did not match the database contract');
    }
    const preferenceRow = preferenceResult.data as Row | null;
    if (preferenceRow && (preferenceRow.dog_id !== dogId || !isChecklistContext(preferenceRow.context))) throw new Error('Checklist preference did not match the database contract');
    const summary = Object.fromEntries(CHECKLIST_TEMPLATES.map((template) => {
      const done = progressRows.filter((row) => row.template_id === template.id).length + customRows.filter((row) => row.template_id === template.id && row.completed === true).length;
      const total = template.items.length + customRows.filter((row) => row.template_id === template.id).length;
      return [template.id, { done, total }];
    }));
    return { summary, preference: preferenceRow ? { dogId, context: preferenceRow.context as ChecklistContext } : null };
  }, signal);
}

export async function setChecklistItem(client: SupabaseClient, dogId: string, templateId: string, itemKey: string, completed: boolean, signal?: AbortSignal): Promise<ChecklistWriteOutcome<ChecklistProgress | null>> {
  const template = CHECKLIST_TEMPLATES.find((entry) => entry.id === templateId);
  if (!template?.items.some((item) => item.key === itemKey)) return { status: 'failed' };
  const tuple = { dog_id: dogId, template_id: templateId, item_key: itemKey };
  return request(async (abortSignal) => {
    try {
      const result = completed
        ? await client.from('dog_checklist_progress').upsert(tuple, { onConflict: 'dog_id,template_id,item_key', ignoreDuplicates: true }).abortSignal(abortSignal)
        : await client.from('dog_checklist_progress').delete().match(tuple).abortSignal(abortSignal);
      if (!result.error) {
        const read = await client.from('dog_checklist_progress').select('dog_id,template_id,item_key').match(tuple).abortSignal(abortSignal).maybeSingle();
        if (!read.error && (completed ? exactProgress(read.data as Row | null, dogId, templateId, itemKey) : read.data === null)) return { status: 'saved', value: completed ? { dogId, templateId, itemKey } : null };
        return { status: read.error ? 'unknown' : 'failed' };
      }
      const read = await client.from('dog_checklist_progress').select('dog_id,template_id,item_key').match(tuple).abortSignal(abortSignal).maybeSingle();
      if (read.error) return { status: 'unknown' };
      if (completed ? exactProgress(read.data as Row | null, dogId, templateId, itemKey) : read.data === null) return { status: 'saved', value: completed ? { dogId, templateId, itemKey } : null };
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

export async function addChecklistCustomItem(client: SupabaseClient, dogId: string, templateId: string, id: string, rawTitle: string, signal?: AbortSignal): Promise<ChecklistWriteOutcome<ChecklistCustomItem>> {
  const title = normalizeCustomChecklistTitle(rawTitle);
  if (!title || !uuidPattern.test(id) || !CHECKLIST_TEMPLATES.some((entry) => entry.id === templateId)) return { status: 'failed' };
  const expected = { id, dog_id: dogId, template_id: templateId, title, completed: false };
  return request(async (abortSignal) => {
    try {
      const result = await client.from('dog_checklist_custom_items').insert(expected).abortSignal(abortSignal);
      if (!result.error) {
        const read = await client.from('dog_checklist_custom_items').select('id,dog_id,template_id,title,completed').eq('dog_id', dogId).eq('id', id).abortSignal(abortSignal).maybeSingle();
        return read.error ? { status: 'unknown' } : exactCustom(read.data as Row | null, expected) ? { status: 'saved', value: custom(expected) } : { status: 'failed' };
      }
      const read = await client.from('dog_checklist_custom_items').select('id,dog_id,template_id,title,completed').eq('dog_id', dogId).eq('id', id).abortSignal(abortSignal).maybeSingle();
      return read.error ? { status: 'unknown' } : exactCustom(read.data as Row | null, expected) ? { status: 'saved', value: custom(expected) } : { status: 'failed' };
    } catch { return { status: 'unknown' }; }
  }, signal);
}

export async function updateChecklistCustomItem(client: SupabaseClient, previous: ChecklistCustomItem, changes: Pick<ChecklistCustomItem, 'title' | 'completed'>, signal?: AbortSignal): Promise<ChecklistWriteOutcome<ChecklistCustomItem>> {
  const title = normalizeCustomChecklistTitle(changes.title);
  if (!title || !uuidPattern.test(previous.id) || !CHECKLIST_TEMPLATES.some((entry) => entry.id === previous.templateId)) return { status: 'failed' };
  const expected = { id: previous.id, dog_id: previous.dogId, template_id: previous.templateId, title, completed: changes.completed };
  const preimage = { id: previous.id, dog_id: previous.dogId, template_id: previous.templateId, title: previous.title, completed: previous.completed };
  return request(async (abortSignal) => {
    try {
      const result = await client.from('dog_checklist_custom_items').update({ title, completed: changes.completed }).eq('dog_id', previous.dogId).eq('id', previous.id).eq('template_id', previous.templateId).eq('title', previous.title).eq('completed', previous.completed).select('id,dog_id,template_id,title,completed').abortSignal(abortSignal).maybeSingle();
      if (result.data && exactCustom(result.data as Row, expected)) return { status: 'saved', value: custom(expected) };
      if (result.error) {
        const read = await client.from('dog_checklist_custom_items').select('id,dog_id,template_id,title,completed').eq('dog_id', previous.dogId).eq('id', previous.id).abortSignal(abortSignal).maybeSingle();
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

export async function deleteChecklistCustomItem(client: SupabaseClient, previous: ChecklistCustomItem, signal?: AbortSignal): Promise<ChecklistWriteOutcome<null>> {
  if (!uuidPattern.test(previous.id)) return { status: 'failed' };
  return request(async (abortSignal) => {
    try {
      const result = await client.from('dog_checklist_custom_items').delete().eq('dog_id', previous.dogId).eq('id', previous.id).eq('template_id', previous.templateId).eq('title', previous.title).eq('completed', previous.completed).select('id').abortSignal(abortSignal).maybeSingle();
      if (result.data?.id === previous.id) return { status: 'saved', value: null };
      const read = await client.from('dog_checklist_custom_items').select('id,dog_id,template_id,title,completed').eq('dog_id', previous.dogId).eq('id', previous.id).abortSignal(abortSignal).maybeSingle();
      if (read.error) return { status: 'unknown' };
      if (read.data === null) return { status: 'saved', value: null };
      const row = read.data as Row;
      return row.template_id === previous.templateId && row.title === previous.title && row.completed === previous.completed
        ? { status: result.error ? 'failed' : 'conflict' }
        : { status: 'conflict' };
    } catch { return { status: 'unknown' }; }
  }, signal);
}
