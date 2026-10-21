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

test('a second-page failure discards the unfinished first page for every saved range source', async () => {
  const cases = [
    ['dog_daily_routines', 'routines', (index) => ({
      id: `77777777-7777-4777-8777-${String(index + 1).padStart(12, '0')}`, dog_id: dogId, label: `Rutin ${index}`,
      checklist: [{ id: itemId, label: 'Vatten' }], checklist_revision: 1, legacy_single_item: false,
      repeat_unit: null, repeat_interval: null, repeat_weekdays: null, repeat_anchor_date: null,
    })],
    ['dog_daily_routine_days', 'routineDays', (index) => ({
      id: `44444444-4444-4444-8444-${String(index + 1).padStart(12, '0')}`, dog_id: dogId, routine_id: routineId,
      date_key: dateKey, time_zone: 'Europe/Stockholm', routine_label_snapshot: 'Kvällsrutin',
      checklist_snapshot: [{ id: itemId, label: 'Vatten' }], completed_item_ids: [], completed_at: null,
      is_recurring_occurrence: true, routine_revision_snapshot: 1, routine_day_revision: 1, last_state_mutation_id: null,
    })],
    ['dog_daily_routine_day_skips', 'routineDaySkips', (index) => ({
      day_id: `55555555-5555-4555-8555-${String(index + 1).padStart(12, '0')}`, dog_id: dogId, routine_id: routineId,
      date_key: dateKey, time_zone: 'Europe/Stockholm', routine_label_snapshot: 'Kvällsrutin',
      checklist_snapshot: [{ id: itemId, label: 'Vatten' }], completed_item_ids: [], completed_at: null,
      is_recurring_occurrence: true, routine_revision_snapshot: 1, routine_day_revision: 1, last_state_mutation_id: null,
    })],
    ['dog_daily_training_selections', 'trainingSelections', (index) => ({
      id: `66666666-6666-4666-8666-${String(index + 1).padStart(12, '0')}`, dog_id: dogId,
      program_version_id: '88888888-8888-4888-8888-888888888888', step_id: '99999999-9999-4999-8999-999999999999',
      date_key: dateKey, time_zone: 'Europe/Stockholm',
    })],
  ];
  for (const [table, source, makeRow] of cases) {
    const pageRows = Array.from({ length: 40 }, (_, index) => makeRow(index));
    const client = createClient(`https://${source}.invalid`, 'synthetic-publishable-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: async (input) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith(`/${table}`)) return url.searchParams.has('or')
          ? Response.json({ message: 'second page unavailable' }, { status: 503 })
          : Response.json(pageRows);
        return Response.json([]);
      } },
    });
    try {
      const snapshot = await activity.fetchDailyActivityRangeSnapshot(client, dogId, dateKey, dateKey, true);
      assert.deepEqual(snapshot.failedSources, [source], `${source} should be marked partial after its continuation fails`);
      assert.equal(snapshot[source].length, 0, `${source} must discard page one when page two fails`);
    } finally { await client.auth.dispose(); }
  }
});

test('activity range rejects more than 30 calendar days before making requests', async () => {
  let requestCount = 0;
  const client = createClient('https://range-limit.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async () => { requestCount += 1; return Response.json([]); } },
  });
  try {
    await assert.rejects(activity.fetchDailyActivityRangeSnapshot(client, dogId, '2026-10-01', '2026-10-31', false), /Invalid daily activity range/);
    const valid = await activity.fetchDailyActivityRangeSnapshot(client, dogId, '2026-10-01', '2026-10-30', false);
    assert.equal(valid.failedSources.length, 0);
    assert.equal(requestCount, 3);
  } finally { await client.auth.dispose(); }
});

test('activity range rejects a non-monotonic row within a page as incomplete', async () => {
  const ids = ['99999999-9999-4999-8999-999999999999', '88888888-8888-4888-8888-888888888888'];
  const rows = ids.map((id) => ({
    id, dog_id: dogId, routine_id: routineId, date_key: dateKey, time_zone: 'Europe/Stockholm',
    routine_label_snapshot: 'Kvällsrutin', checklist_snapshot: [{ id: itemId, label: 'Vatten' }],
    completed_item_ids: [], completed_at: null, is_recurring_occurrence: true,
    routine_revision_snapshot: 1, routine_day_revision: 1, last_state_mutation_id: null,
  }));
  const client = createClient('https://range-order.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => new URL(String(input)).pathname.endsWith('/dog_daily_routine_days')
      ? Response.json(rows) : Response.json([]) },
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

test('historical detail loads body and instruction only for the exact published version and step after open', async () => {
  const versionId = '55555555-5555-4555-8555-555555555555';
  const stepId = '66666666-6666-4666-8666-666666666666';
  const requests = [];
  const client = createClient('https://training-detail.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => {
      const url = new URL(String(input));
      const table = url.pathname.split('/').at(-1);
      requests.push({ table, url });
      if (table === 'content_versions') return Response.json({ id: versionId, content_id: '77777777-7777-4777-8777-777777777777',
        version: 3, status: 'published', title: 'Lugn start', body: 'Programbeskrivning', min_age_weeks: 0, max_age_weeks: null,
        sources: [], is_ai_generated: false, content_items: { slug: 'lugn-start', content_type: 'training_program' }, content_breed_targets: [] });
      if (table === 'training_steps') return Response.json({ id: stepId, program_version_id: versionId, position: 2, title: 'Sitt lugnt', instruction: 'Vänta kort.' });
      if (table === 'training_progress') return Response.json({ dog_id: dogId, program_version_id: versionId, step_id: stepId, completed_at: '2026-10-12T08:00:00.000Z' });
      throw new Error(`Unexpected table ${table}`);
    } },
  });
  try {
    const program = await workspace.fetchExactHistoricalTrainingDetail(client, dogId, versionId, stepId);
    assert.equal(program.title, 'Lugn start');
    assert.equal(program.steps.length, 1);
    assert.equal(program.steps[0].instruction, 'Vänta kort.');
    assert.deepEqual(program.completedStepIds, [stepId]);
    assert.equal(requests.length, 3);
    assert.equal(requests[0].url.searchParams.get('id'), `eq.${versionId}`);
    assert.equal(requests[0].url.searchParams.get('status'), 'eq.published');
    assert.match(requests[0].url.searchParams.get('select'), /body/);
    assert.equal(requests[1].url.searchParams.get('program_version_id'), `eq.${versionId}`);
    assert.equal(requests[1].url.searchParams.get('id'), `eq.${stepId}`);
    assert.equal(requests[2].url.searchParams.get('dog_id'), `eq.${dogId}`);
  } finally { await client.auth.dispose(); }
});

test('historical training source lookup limits concurrent exact-source chains to three', async () => {
  const selections = Array.from({ length: 8 }, (_, index) => ({
    programVersionId: `55555555-5555-4555-8555-${String(index + 1).padStart(12, '0')}`,
    stepId: `66666666-6666-4666-8666-${String(index + 1).padStart(12, '0')}`,
  }));
  let inFlight = 0;
  let maxInFlight = 0;
  let requestCount = 0;
  const client = createClient('https://training-concurrency.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => {
      inFlight += 1;
      requestCount += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      try {
        await new Promise((resolve) => setTimeout(resolve, 5));
        const url = new URL(String(input));
        const table = url.pathname.split('/').at(-1);
        if (table === 'content_versions') return Response.json({
          id: url.searchParams.get('id')?.slice(3), status: 'published', title: 'Lugn start', content_items: { content_type: 'training_program' },
        });
        if (table === 'training_steps') return Response.json({
          id: url.searchParams.get('id')?.slice(3), program_version_id: url.searchParams.get('program_version_id')?.slice(3), title: 'Sitt lugnt',
        });
        if (table === 'training_progress') return Response.json({
          dog_id: dogId, program_version_id: url.searchParams.get('program_version_id')?.slice(3),
          step_id: url.searchParams.get('step_id')?.slice(3), completed_at: '2026-10-12T08:00:00.000Z',
        });
        throw new Error(`Unexpected table ${table}`);
      } finally { inFlight -= 1; }
    } },
  });
  try {
    const result = await workspace.fetchExactHistoricalTrainingSources(client, dogId, selections);
    assert.equal(result.sources.size, selections.length);
    assert.equal(requestCount, selections.length * 3);
    assert.equal(maxInFlight, 3);
  } finally { await client.auth.dispose(); }
});

test('exact historical training lookup rejects failures at each published source and progress boundary', async () => {
  const versionId = '55555555-5555-4555-8555-555555555555';
  const stepId = '66666666-6666-4666-8666-666666666666';
  for (const failedTable of ['content_versions', 'training_steps', 'training_progress']) {
    const client = createClient(`https://${failedTable}.invalid`, 'synthetic-publishable-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: async (input) => {
        const url = new URL(String(input)); const table = url.pathname.split('/').at(-1);
        if (table === failedTable) return Response.json({ message: 'source unavailable' }, { status: 503 });
        if (table === 'content_versions') return Response.json({ id: versionId, status: 'published', title: 'Lugn start', content_items: { content_type: 'training_program' } });
        if (table === 'training_steps') return Response.json({ id: stepId, program_version_id: versionId, title: 'Sitt lugnt' });
        if (table === 'training_progress') return Response.json({ dog_id: dogId, program_version_id: versionId, step_id: stepId, completed_at: null });
        throw new Error(`Unexpected table ${table}`);
      } },
    });
    try {
      await assert.rejects(workspace.fetchExactHistoricalTrainingSources(client, dogId, [{ programVersionId: versionId, stepId }]),
        /Could not load exact historical training/);
    } finally { await client.auth.dispose(); }
  }
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
      assert.deepEqual(url.searchParams.getAll('due_on').sort(), ['gte.2026-10-20', 'lte.2026-10-26'].sort());
      return Response.json(url.searchParams.has('or') ? rows.slice(40) : rows.slice(0, 40));
    } },
  });
  try {
    const result = await workspace.fetchPlannedHealthChecklistRange(client, dogId, '2026-10-20', '2026-10-26');
    assert.equal(result.length, 41);
    assert.equal(requests.length, 2);
  } finally { await client.auth.dispose(); }
});

test('planned health range rejects more than seven calendar days before making requests', async () => {
  let requestCount = 0;
  const client = createClient('https://health-limit.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async () => { requestCount += 1; return Response.json([]); } },
  });
  try {
    await assert.rejects(workspace.fetchPlannedHealthChecklistRange(client, dogId, '2026-10-20', '2026-10-27'), /Invalid planned health range/);
    const valid = await workspace.fetchPlannedHealthChecklistRange(client, dogId, '2026-10-20', '2026-10-26');
    assert.deepEqual(valid, []);
    assert.equal(requestCount, 1);
  } finally { await client.auth.dispose(); }
});

test('planned health range rejects a non-monotonic row within a page', async () => {
  const rows = [
    { id: '99999999-9999-4999-8999-999999999999', dog_id: dogId, event_type: 'vaccination', due_on: '2026-10-20' },
    { id: '88888888-8888-4888-8888-888888888888', dog_id: dogId, event_type: 'vaccination', due_on: '2026-10-20' },
  ];
  const client = createClient('https://health-order.supabase.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async () => Response.json(rows) },
  });
  try {
    await assert.rejects(workspace.fetchPlannedHealthChecklistRange(client, dogId, '2026-10-20', '2026-10-26'), /Invalid planned health cursor/);
  } finally { await client.auth.dispose(); }
});

test('planned health range discards page one when the continuation fails', async () => {
  const rows = Array.from({ length: 40 }, (_, index) => ({
    id: `88888888-8888-4888-8888-${String(index + 1).padStart(12, '0')}`, dog_id: dogId, event_type: 'vaccination', due_on: '2026-10-20',
  }));
  let requestCount = 0;
  const client = createClient('https://health-continuation.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => {
      requestCount += 1;
      const url = new URL(String(input));
      return url.searchParams.has('or') ? Response.json({ message: 'second page unavailable' }, { status: 503 }) : Response.json(rows);
    } },
  });
  try {
    await assert.rejects(workspace.fetchPlannedHealthChecklistRange(client, dogId, '2026-10-20', '2026-10-26'), /Could not load planned health checklist rows/);
    assert.equal(requestCount, 2);
  } finally { await client.auth.dispose(); }
});
