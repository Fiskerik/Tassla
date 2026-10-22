import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { registerHooks } from 'node:module';

const resolution = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier);
} });
const activity = await import('../src/features/home/daily-activity-data.ts');
const workspace = await import('../src/data/workspace-data.ts');
resolution.deregister();

const dogId = '11111111-1111-4111-8111-111111111111';
const dateKey = '2026-10-12';
const routineId = '22222222-2222-4222-8222-222222222222';
const itemId = '33333333-3333-4333-8333-333333333333';

test('range reader paginates saved routine days with dog/date scope and never prepares occurrences', async () => {
  const rows = Array.from({ length: 41 }, (_, index) => ({
    id: `44444444-4444-4444-8444-${String(index + 1).padStart(12, '0')}`,
    dog_id: dogId, routine_id: routineId, date_key: dateKey, time_zone: 'Europe/Stockholm',
    routine_label_snapshot: 'Kvällsrutin', checklist_snapshot: [{ id: itemId, label: 'Vatten' }],
    completed_item_ids: [], completed_at: null, is_recurring_occurrence: true,
    routine_revision_snapshot: 1, routine_day_revision: 1, last_state_mutation_id: null,
  }));
  const requests = [];
  const client = createClient('https://range-test.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(String(input)); requests.push({ url, method: init.method ?? 'GET' });
      const table = url.pathname.split('/').at(-1);
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      if (table !== 'dog_daily_routine_days') return Response.json([]);
      assert.deepEqual(url.searchParams.getAll('date_key').sort(), [`gte.${dateKey}`, `lte.${dateKey}`].sort());
      const cursor = url.searchParams.get('or');
      return Response.json(cursor ? rows.slice(40) : rows.slice(0, 40));
    } },
  });
  try {
    const snapshot = await activity.fetchDailyActivityRangeSnapshot(client, dogId, dateKey, dateKey, false);
    assert.equal(snapshot.routineDays.length, 41);
    assert.deepEqual(snapshot.completeSources, ['routineDays', 'routineDaySkips', 'trainingSelections']);
    assert.deepEqual(snapshot.failedSources, []);
    assert.equal(requests.filter(({ url }) => url.pathname.endsWith('/dog_daily_routine_days')).length, 2);
    assert.ok(requests.every(({ method }) => method === 'GET'));
    assert.ok(requests.every(({ url }) => !url.pathname.includes('/rpc/')));
  } finally { await client.auth.dispose(); }
});

test('range reader reports a failed required source without presenting a complete snapshot', async () => {
  const client = createClient('https://range-error.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/dog_daily_routine_days')) return Response.json({ message: 'offline' }, { status: 503 });
      return Response.json([]);
    } },
  });
  try {
    const snapshot = await activity.fetchDailyActivityRangeSnapshot(client, dogId, dateKey, dateKey, false);
    assert.deepEqual(snapshot.failedSources, ['routineDays']);
    assert.deepEqual(snapshot.routineDays, []);
  } finally { await client.auth.dispose(); }
});

test('historical training lookup reads only the exact published version, selected step and dog progress', async () => {
  const versionId = '55555555-5555-4555-8555-555555555555';
  const stepId = '66666666-6666-4666-8666-666666666666';
  const seen = [];
  const client = createClient('https://training-test.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => {
      const url = new URL(String(input)); const table = url.pathname.split('/').at(-1); seen.push({ table, url });
      if (table === 'content_versions') return Response.json({ id: versionId, status: 'published', title: 'Lugn start', content_items: { content_type: 'training_program' } });
      if (table === 'training_steps') return Response.json({ id: stepId, program_version_id: versionId, title: 'Sitt lugnt' });
      if (table === 'training_progress') return Response.json({ dog_id: dogId, program_version_id: versionId, step_id: stepId, completed_at: '2026-10-12T08:00:00.000Z' });
      throw new Error(`Unexpected table ${table}`);
    } },
  });
  try {
    const result = await workspace.fetchExactHistoricalTrainingSources(client, dogId, [{ programVersionId: versionId, stepId }]);
    assert.deepEqual(result.sources.get(`${versionId}:${stepId}`), {
      programVersionId: versionId, programTitle: 'Lugn start', stepId, stepTitle: 'Sitt lugnt',
      completedAt: '2026-10-12T08:00:00.000Z',
    });
    assert.deepEqual(result.unresolvedKeys, []);
    assert.equal(seen.length, 3);
    assert.equal(seen[0].url.searchParams.get('id'), `eq.${versionId}`);
    assert.equal(seen[0].url.searchParams.get('status'), 'eq.published');
    assert.equal(seen[0].url.searchParams.get('select'), 'id,status,title,content_items!inner(content_type)');
    assert.equal(seen[1].url.searchParams.get('id'), `eq.${stepId}`);
    assert.equal(seen[1].url.searchParams.get('program_version_id'), `eq.${versionId}`);
    assert.equal(seen[1].url.searchParams.get('select'), 'id,program_version_id,title');
    assert.equal(seen[2].url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(seen[2].url.searchParams.get('step_id'), `eq.${stepId}`);
  } finally { await client.auth.dispose(); }
});

test('range reader treats owner scope abort as cancellation instead of partial data', async () => {
  const controller = new AbortController();
  controller.abort();
  const client = createClient('https://abort-test.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async () => { throw new Error('An aborted request must not fetch'); } },
  });
  try {
    await assert.rejects(activity.fetchDailyActivityRangeSnapshot(client, dogId, dateKey, dateKey, false, controller.signal), /aborted/i);
  } finally { await client.auth.dispose(); }
});

test('upcoming routine template reads are paginated, dog-scoped and read-only', async () => {
  const routines = Array.from({ length: 41 }, (_, index) => ({
    id: `77777777-7777-4777-8777-${String(index + 1).padStart(12, '0')}`,
    dog_id: dogId, label: `Rutin ${index + 1}`, checklist: [{ id: itemId, label: 'Promenad' }], checklist_revision: 1,
    legacy_single_item: false, repeat_unit: 'day', repeat_interval: 1, repeat_weekdays: null, repeat_anchor_date: dateKey,
  }));
  const requests = [];
  const client = createClient('https://upcoming-routines.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(String(input)); requests.push({ url, method: init.method ?? 'GET' });
      assert.equal(url.pathname, '/rest/v1/dog_daily_routines');
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(url.searchParams.get('select'), 'id,dog_id,label,checklist,checklist_revision,legacy_single_item,repeat_unit,repeat_interval,repeat_weekdays,repeat_anchor_date');
      return Response.json(url.searchParams.has('id') ? routines.slice(0, 1) : url.searchParams.has('or') ? routines.slice(40) : routines.slice(0, 40));
    } },
  });
  try {
    const result = await activity.fetchDailyRoutineTemplates(client, dogId);
    assert.equal(result.length, 41);
    const exact = await activity.fetchDailyRoutineTemplateById(client, dogId, routines[0].id);
    assert.equal(exact.id, routines[0].id);
    assert.equal(requests.length, 3);
    assert.ok(requests.every(({ method }) => method === 'GET'));
    assert.ok(requests.every(({ url }) => !url.pathname.includes('/rpc/')));
    assert.equal(requests[2].url.searchParams.get('id'), `eq.${routines[0].id}`);
  } finally { await client.auth.dispose(); }
});

test('historical step detail reads only the exact published source and selected step body', async () => {
  const versionId = '55555555-5555-4555-8555-555555555555';
  const stepId = '66666666-6666-4666-8666-666666666666';
  const seen = [];
  const client = createClient('https://training-detail-test.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => {
      const url = new URL(String(input)); const table = url.pathname.split('/').at(-1); seen.push({ table, url });
      if (table === 'content_versions') return Response.json({ id: versionId, status: 'published', title: 'Trygg vardag', sources: ['Veterinärförbundet'], is_ai_generated: false, content_items: { content_type: 'training_program' } });
      if (table === 'training_steps') return Response.json({ id: stepId, program_version_id: versionId, title: 'Sitt lugnt', instruction: 'Vänta in hundens lugn.' });
      throw new Error(`Unexpected table ${table}`);
    } },
  });
  try {
    const result = await workspace.fetchExactPublishedTrainingStep(client, versionId, stepId);
    assert.deepEqual(result, { programVersionId: versionId, programTitle: 'Trygg vardag', stepId, stepTitle: 'Sitt lugnt',
      instruction: 'Vänta in hundens lugn.', sources: ['Veterinärförbundet'], isAiGenerated: false });
    assert.equal(seen.length, 2);
    assert.equal(seen[0].url.searchParams.get('id'), `eq.${versionId}`);
    assert.equal(seen[0].url.searchParams.get('status'), 'eq.published');
    assert.equal(seen[1].url.searchParams.get('id'), `eq.${stepId}`);
    assert.equal(seen[1].url.searchParams.get('program_version_id'), `eq.${versionId}`);
    assert.equal(seen[1].url.searchParams.get('select'), 'id,program_version_id,title,instruction');
  } finally { await client.auth.dispose(); }
});

test('planned health range is dog-scoped, minimal, bounded and paginated', async () => {
  const rows = Array.from({ length: 41 }, (_, index) => ({ id: `88888888-8888-4888-8888-${String(index + 1).padStart(12, '0')}`, dog_id: dogId, event_type: 'vaccination', due_on: '2026-10-20' }));
  const requests = [];
  const client = createClient('https://health-test.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => {
      const url = new URL(String(input)); requests.push(url);
      assert.equal(url.pathname, '/rest/v1/dog_health_plans');
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(url.searchParams.get('select'), 'id,dog_id,event_type,due_on');
      assert.deepEqual(url.searchParams.getAll('due_on').sort(), ['gte.2026-10-20', 'lte.2026-10-27'].sort());
      return Response.json(url.searchParams.has('or') ? rows.slice(40) : rows.slice(0, 40));
    } },
  });
  try {
    const result = await workspace.fetchPlannedHealthChecklistRange(client, dogId, '2026-10-20', '2026-10-27');
    assert.equal(result.length, 41);
    assert.equal(requests.length, 2);
  } finally { await client.auth.dispose(); }
});
