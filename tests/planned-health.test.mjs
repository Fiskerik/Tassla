import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';

const tsResolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const data = await import('../src/data/workspace-data.ts');
tsResolution.deregister();
const workspaceSource = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const healthScreenSource = await readFile(new URL('../src/features/health/HealthScreen.tsx', import.meta.url), 'utf8');

const baseUrl = 'https://local-test.supabase.invalid';
const dogId = '11111111-1111-4111-8111-111111111111';
const otherDogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const planId = '22222222-2222-4222-8222-222222222222';
const today = localDate();
const tomorrow = addDays(today, 1);
const yesterday = addDays(today, -1);
const plan = { id: planId, dog_id: dogId, event_type: 'vaccination', due_on: tomorrow,
  description: 'Booster', created_at: '2026-10-06T10:00:00Z', reminder_enabled: false, reminder_minutes: null };
const operation = { id: planId, dog_id: dogId, event_type: 'vaccination', due_on: tomorrow,
  description: '  Booster  ', local_today: today, reminder_enabled: false, reminder_minutes: null };

test('planned health dates use the captured local calendar day; notes trim and count Unicode code points', () => {
  assert.equal(data.isValidPlannedHealthDate(today, today), true);
  assert.equal(data.isValidPlannedHealthDate(tomorrow, today), true);
  assert.equal(data.isValidPlannedHealthDate(yesterday, today), false);
  assert.equal(data.isValidPlannedHealthDate('2025-02-29', today), false);
  assert.equal(data.isValidPlannedHealthDate(today, 'invalid'), false);
  assert.equal(data.normalizePlannedHealthDescription('  note  '), 'note');
  assert.equal(data.normalizePlannedHealthDescription('   '), null);
  assert.equal(data.normalizePlannedHealthDescription('😀'.repeat(500)), '😀'.repeat(500));
  assert.equal(data.normalizePlannedHealthDescription('😀'.repeat(501)), undefined);
});

test('invalid planned-health input fails before a request; performed history remains separate', async () => {
  const { client, requests } = localClient(() => { throw new Error('invalid planned data must not reach fetch'); });
  try {
    assert.deepEqual(await data.insertPlannedHealth(client, { ...operation, due_on: yesterday }), { status: 'failed' });
    assert.deepEqual(await data.insertPlannedHealth(client, { ...operation, event_type: 'weight' }), { status: 'failed' });
    assert.deepEqual(await data.insertPlannedHealth(client, { ...operation, description: '😀'.repeat(501) }), { status: 'failed' });
    assert.deepEqual(await data.updatePlannedHealth(client, dogId, planId,
      { event_type: 'vaccination', due_on: tomorrow, description: 'Booster' },
      { due_on: yesterday, description: 'Change' }, today), { status: 'failed' });
    assert.equal(requests.length, 0);
  } finally { await client.auth.dispose(); }
});

test('overdue plans remain editable without changing date, but cannot be moved to another past date', async (t) => {
  const prior = { event_type: 'vet_visit', due_on: yesterday, description: 'Original', reminder_enabled: false, reminder_minutes: null };
  await t.test('note-only correction preserves overdue date and filters its captured preimage', async () => {
    const updated = { ...plan, event_type: 'vet_visit', due_on: yesterday, description: 'Corrected' };
    const { client, requests } = localClient(({ method, url, body }) => {
      assert.equal(method, 'PATCH');
      assert.equal(body.due_on, yesterday);
      assert.equal(body.description, 'Corrected');
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(url.searchParams.get('id'), `eq.${planId}`);
      assert.equal(url.searchParams.get('event_type'), 'eq.vet_visit');
      assert.equal(url.searchParams.get('due_on'), `eq.${yesterday}`);
      assert.equal(url.searchParams.get('description'), 'eq.Original');
      return jsonResponse(updated);
    });
    try {
      assert.deepEqual(await data.updatePlannedHealth(client, dogId, planId, prior,
        { due_on: yesterday, description: ' Corrected ', reminder_enabled: false, reminder_minutes: null }, today), { status: 'saved', value: updated });
      assert.equal(requests.length, 1);
    } finally { await client.auth.dispose(); }
  });
  await t.test('changing an overdue date to another past date is rejected before fetch', async () => {
    const { client, requests } = localClient(() => { throw new Error('past replacement must not reach fetch'); });
    try {
      assert.deepEqual(await data.updatePlannedHealth(client, dogId, planId, prior,
        { due_on: addDays(yesterday, -1), description: 'Corrected', reminder_enabled: false, reminder_minutes: null }, today), { status: 'failed' });
      assert.equal(requests.length, 0);
    } finally { await client.auth.dispose(); }
  });
});

test('planned list is dog-scoped, ascending due date then id, and never reads completed events', async () => {
  const rows = [{ ...plan, due_on: today }, { ...plan, id: otherDogId, due_on: tomorrow }];
  const { client, requests } = localClient(({ method, url }) => {
    assert.equal(method, 'GET');
    assert.equal(url.pathname, '/rest/v1/dog_health_plans');
    assert.equal(url.searchParams.get('select'), 'id,dog_id,event_type,due_on,description,created_at,reminder_enabled,reminder_minutes');
    assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.deepEqual(url.searchParams.get('order')?.split(','), ['due_on.asc', 'id.asc']);
    assert.equal(url.searchParams.get('limit'), '40');
    return jsonResponse(rows.map((row) => ({ ...row, dog_id: dogId })));
  });
  try {
    const actual = await data.fetchPlannedHealth(client, dogId);
    assert.equal(actual.length, 2);
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('planned reminder mutations validate and condition on the captured reminder choice', async (t) => {
  const enabled = { ...plan, reminder_enabled: true, reminder_minutes: 540 };
  await t.test('insert sends enabled choice and rejects an enabled null time', async () => {
    const { client, requests } = localClient(({ method, body }) => {
      assert.equal(method, 'POST');
      assert.deepEqual(body, { id: planId, dog_id: dogId, event_type: 'vaccination', due_on: tomorrow,
        description: 'Booster', reminder_enabled: true, reminder_minutes: 540 });
      return jsonResponse(enabled);
    });
    try {
      assert.deepEqual(await data.insertPlannedHealth(client, { ...operation, reminder_enabled: true, reminder_minutes: 540 }),
        { status: 'saved', value: enabled });
      assert.equal(requests.length, 1);
      assert.deepEqual(await data.insertPlannedHealth(client, { ...operation, reminder_enabled: true, reminder_minutes: null }), { status: 'failed' });
      assert.equal(requests.length, 1);
    } finally { await client.auth.dispose(); }
  });
  await t.test('update filters old choice and writes new choice', async () => {
    const previous = { event_type: 'vaccination', due_on: tomorrow, description: 'Booster', reminder_enabled: false, reminder_minutes: null };
    const { client, requests } = localClient(({ method, url, body }) => {
      assert.equal(method, 'PATCH');
      assert.equal(url.searchParams.get('reminder_enabled'), 'eq.false');
      assert.equal(url.searchParams.get('reminder_minutes'), 'is.null');
      assert.deepEqual(body, { due_on: tomorrow, description: 'Booster', reminder_enabled: true, reminder_minutes: 540 });
      return jsonResponse(enabled);
    });
    try {
      assert.deepEqual(await data.updatePlannedHealth(client, dogId, planId, previous,
        { due_on: tomorrow, description: 'Booster', reminder_enabled: true, reminder_minutes: 540 }, today),
      { status: 'saved', value: enabled });
      assert.equal(requests.length, 1);
    } finally { await client.auth.dispose(); }
  });
});

test('future reminder selection paginates, filters before its 40-item cap, and reports a 41st valid candidate', async () => {
  const earlier = Array.from({ length: 40 }, (_, index) => ({ ...plan,
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    due_on: today, reminder_enabled: true, reminder_minutes: index }));
  const next = Array.from({ length: 41 }, (_, index) => ({ ...plan,
    id: `10000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    due_on: tomorrow, reminder_enabled: true, reminder_minutes: index }));
  const pages = [earlier, next.slice(0, 40), next.slice(40)];
  const { client, requests } = localClient(() => {
    return jsonResponse(pages[requests.length - 1]);
  });
  try {
    const result = await data.fetchFuturePlannedHealthReminders(client, dogId, today,
      (record) => record.due_on > today, () => true);
    for (const [index, request] of requests.entries()) {
      assert.equal(request.method, 'GET');
      assert.equal(request.url.pathname, '/rest/v1/dog_health_plans');
      assert.equal(request.url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(request.url.searchParams.get('reminder_enabled'), 'eq.true');
      assert.equal(request.url.searchParams.get('due_on'), `gte.${today}`);
      assert.deepEqual(request.url.searchParams.get('order')?.split(','), ['due_on.asc', 'reminder_minutes.asc', 'id.asc']);
      assert.equal(request.url.searchParams.get('offset'), String(index * 40));
      assert.equal(request.url.searchParams.get('limit'), '40');
    }
    assert.deepEqual(result.records.map((record) => record.id), next.slice(0, 40).map((record) => record.id));
    assert.equal(result.overCap, true);
    assert.equal(requests.length, 3);
  } finally { await client.auth.dispose(); }
});

test('future reminder selection stops after a session becomes stale during an awaited page', async () => {
  let current = true;
  let finishFetch;
  const { client, requests } = localClient(() => new Promise((resolve) => { finishFetch = resolve; }));
  try {
    const selection = data.fetchFuturePlannedHealthReminders(client, dogId, today, () => true, () => current);
    while (!finishFetch) await new Promise((resolve) => setImmediate(resolve));
    current = false;
    finishFetch(jsonResponse([]));
    assert.equal(await selection, null);
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('planned reads reject cross-dog rows and exact lookup validates id/type', async (t) => {
  await t.test('collection cross-dog response', async () => {
    const { client } = localClient(() => jsonResponse([{ ...plan, dog_id: otherDogId }]));
    try { await assert.rejects(data.fetchPlannedHealth(client, dogId)); }
    finally { await client.auth.dispose(); }
  });
  await t.test('exact lookup identity response', async () => {
    const { client, requests } = localClient(({ url }) => {
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(url.searchParams.get('id'), `eq.${planId}`);
      return jsonResponse(plan);
    });
    try {
      assert.deepEqual(await data.fetchPlannedHealthById(client, dogId, planId), plan);
      assert.equal(requests.length, 1);
    } finally { await client.auth.dispose(); }
  });
  await t.test('wrong identity rejected', async () => {
    const { client } = localClient(() => jsonResponse({ ...plan, id: otherDogId }));
    try { await assert.rejects(data.fetchPlannedHealthById(client, dogId, planId)); }
    finally { await client.auth.dispose(); }
  });
});

test('insert sends only stable plan fields and excludes localToday and actor identity', async () => {
  const expected = { id: planId, dog_id: dogId, event_type: 'vaccination', due_on: tomorrow, description: 'Booster', reminder_enabled: false, reminder_minutes: null };
  const { client, requests } = localClient(({ method, url, body }) => {
    assert.equal(method, 'POST');
    assert.equal(url.pathname, '/rest/v1/dog_health_plans');
    assert.deepEqual(body, expected);
    assert.equal(Object.hasOwn(body, 'local_today'), false);
    assert.equal(Object.hasOwn(body, 'actor_id'), false);
    return jsonResponse(plan);
  });
  try {
    assert.deepEqual(await data.insertPlannedHealth(client, operation), { status: 'saved', value: plan });
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('insert reconciles uncertain outcome by stable UUID and exact postimage', async (t) => {
  await t.test('committed write with lost response is saved after exact readback', async () => {
    let row = null;
    const { client, requests } = localClient(async ({ method, url }) => {
      if (method === 'POST') { row = plan; throw new TypeError('simulated lost response'); }
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(url.searchParams.get('id'), `eq.${planId}`);
      return jsonResponse(row);
    });
    try {
      assert.deepEqual(await data.insertPlannedHealth(client, operation), { status: 'saved', value: plan });
      assert.deepEqual(requests.map((request) => request.method), ['POST', 'GET']);
    } finally { await client.auth.dispose(); }
  });
  await t.test('mismatched persisted plan remains unknown', async () => {
    const { client } = localClient(({ method }) => method === 'POST'
      ? Promise.reject(new TypeError('lost')) : jsonResponse({ ...plan, description: 'Other' }));
    try { assert.deepEqual(await data.insertPlannedHealth(client, operation), { status: 'unknown' }); }
    finally { await client.auth.dispose(); }
  });
  await t.test('definite constraint rejection reconciles absent row to failed', async () => {
    const { client } = localClient(({ method }) => method === 'POST'
      ? jsonResponse({ code: '23514', message: 'rejected' }, 400) : jsonResponse(null));
    try { assert.deepEqual(await data.insertPlannedHealth(client, operation), { status: 'failed' }); }
    finally { await client.auth.dispose(); }
  });
});

test('update is type-immutable, conditionally filters the exact date/note preimage and sends no identity fields', async () => {
  const prior = { event_type: 'vaccination', due_on: today, description: null, reminder_enabled: false, reminder_minutes: null };
  const updated = { ...plan, due_on: tomorrow, description: 'Updated' };
  const { client, requests } = localClient(({ method, url, body }) => {
    assert.equal(method, 'PATCH');
    assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(url.searchParams.get('id'), `eq.${planId}`);
    assert.equal(url.searchParams.get('event_type'), 'eq.vaccination');
    assert.equal(url.searchParams.get('due_on'), `eq.${today}`);
    assert.equal(url.searchParams.get('description'), 'is.null');
    assert.deepEqual(body, { due_on: tomorrow, description: 'Updated', reminder_enabled: false, reminder_minutes: null });
    assert.equal(url.searchParams.get('reminder_enabled'), 'eq.false');
    assert.equal(url.searchParams.get('reminder_minutes'), 'is.null');
    for (const field of ['id', 'dog_id', 'event_type', 'created_at']) assert.equal(Object.hasOwn(body, field), false);
    return jsonResponse(updated);
  });
  try {
    assert.deepEqual(await data.updatePlannedHealth(client, dogId, planId, prior,
      { due_on: tomorrow, description: ' Updated ', reminder_enabled: false, reminder_minutes: null }, today), { status: 'saved', value: updated });
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('update conflict is not overwritten and outcome is reconciled with the exact current record', async (t) => {
  const prior = { event_type: 'vaccination', due_on: today, description: 'Original', reminder_enabled: false, reminder_minutes: null };
  const current = { ...plan, due_on: tomorrow, description: 'Concurrent edit' };
  await t.test('ambiguous conflict remains unknown', async () => {
    const { client, requests } = localClient(({ method }) => method === 'PATCH'
      ? Promise.reject(new TypeError('lost response')) : jsonResponse(current));
    try {
      assert.deepEqual(await data.updatePlannedHealth(client, dogId, planId, prior,
        { due_on: tomorrow, description: 'Mine', reminder_enabled: false, reminder_minutes: null }, today), { status: 'unknown' });
      assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
    } finally { await client.auth.dispose(); }
  });
  await t.test('definite rejection with unchanged row is failed', async () => {
    const unchanged = { ...plan, due_on: today, description: 'Original' };
    const { client } = localClient(({ method }) => method === 'PATCH'
      ? jsonResponse({ code: '23514', message: 'rejected' }, 400) : jsonResponse(unchanged));
    try {
      assert.deepEqual(await data.updatePlannedHealth(client, dogId, planId, prior,
        { due_on: tomorrow, description: 'Mine', reminder_enabled: false, reminder_minutes: null }, today), { status: 'failed' });
    } finally { await client.auth.dispose(); }
  });
});

test('delete scopes dog, id, type and full preimage; ambiguity requires independent absence readback', async (t) => {
  const prior = { event_type: 'vaccination', due_on: tomorrow, description: 'Booster', reminder_enabled: false, reminder_minutes: null };
  await t.test('exact id confirms deletion', async () => {
    const { client, requests } = localClient(({ method, url }) => {
      assert.equal(method, 'DELETE');
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(url.searchParams.get('id'), `eq.${planId}`);
      assert.equal(url.searchParams.get('event_type'), 'eq.vaccination');
      assert.equal(url.searchParams.get('due_on'), `eq.${tomorrow}`);
      assert.equal(url.searchParams.get('description'), 'eq.Booster');
      return jsonResponse({ id: planId });
    });
    try {
      assert.deepEqual(await data.deletePlannedHealth(client, dogId, planId, prior), { status: 'saved', value: null });
      assert.equal(requests.length, 1);
    } finally { await client.auth.dispose(); }
  });
  await t.test('lost response and still-present row is unknown', async () => {
    const { client, requests } = localClient(({ method }) => method === 'DELETE'
      ? Promise.reject(new TypeError('lost')) : jsonResponse(plan));
    try {
      assert.deepEqual(await data.deletePlannedHealth(client, dogId, planId, prior), { status: 'unknown' });
      assert.deepEqual(requests.map(({ method }) => method), ['DELETE', 'GET']);
    } finally { await client.auth.dispose(); }
  });
  await t.test('mismatched delete id is not trusted while target remains', async () => {
    const { client } = localClient(({ method }) => method === 'DELETE'
      ? jsonResponse({ id: otherDogId }) : jsonResponse(plan));
    try { assert.deepEqual(await data.deletePlannedHealth(client, dogId, planId, prior), { status: 'unknown' }); }
    finally { await client.auth.dispose(); }
  });
});

test('planned-health migration declares isolated completed-history semantics and narrow RLS/grants', async () => {
  const migration = await readFile(new URL('../supabase/migrations/202610060001_planned_health.sql', import.meta.url), 'utf8');
  assert.match(migration, /create table public\.dog_health_plans\s*\([\s\S]*?id uuid primary key[\s\S]*?dog_id uuid not null references public\.dogs\(id\) on delete cascade[\s\S]*?event_type text not null check \(event_type in \('vaccination','vet_visit'\)\)[\s\S]*?due_on date not null[\s\S]*?description text check \(description is null or char_length\(description\) <= 500\)[\s\S]*?created_at timestamptz not null default now\(\)/i);
  assert.match(migration, /create index dog_health_plans_due on public\.dog_health_plans\(dog_id, due_on, id\)/i);
  assert.match(migration, /alter table public\.dog_health_plans enable row level security/i);
  assert.match(migration, /revoke all on table public\.dog_health_plans from public, anon, authenticated/i);
  assert.match(migration, /grant select, delete on public\.dog_health_plans to authenticated/i);
  assert.match(migration, /grant insert\(id, dog_id, event_type, due_on, description\) on public\.dog_health_plans to authenticated/i);
  assert.match(migration, /grant update\(due_on, description\) on public\.dog_health_plans to authenticated/i);
  assert.match(migration, /grant all on table public\.dog_health_plans to service_role/i);
  assert.doesNotMatch(migration, /grant\s+all\s+on\s+table\s+public\.dog_health_plans\s+to\s+authenticated/i);
  assert.doesNotMatch(migration, /current_date|create policy[^;]*(?:dog_events|reminders)/i);
  assert.match(migration, /create policy dog_health_plans_read on public\.dog_health_plans for select to authenticated\s+using \(private\.owns_dog\(dog_id\)\)/i);
  assert.match(migration, /create policy dog_health_plans_insert on public\.dog_health_plans for insert to authenticated\s+with check \(private\.owns_dog\(dog_id\)\)/i);
  assert.match(migration, /create policy dog_health_plans_update on public\.dog_health_plans for update to authenticated\s+using \(private\.owns_dog\(dog_id\)\) with check \(private\.owns_dog\(dog_id\)\)/i);
  assert.match(migration, /create policy dog_health_plans_delete on public\.dog_health_plans for delete to authenticated\s+using \(private\.owns_dog\(dog_id\)\)/i);
});

test('synthetic planned-health SQL probe contains two-owner RLS checks and always rolls back', async () => {
  const probe = await readFile(new URL('../supabase/tests/planned-health.sql', import.meta.url), 'utf8');
  assert.match(probe, /\bbegin;/i);
  assert.match(probe, /planned-owner-a@example\.invalid/);
  assert.match(probe, /planned-owner-b@example\.invalid/);
  assert.match(probe, /Other owner read a planned record/);
  assert.match(probe, /Other owner updated a planned record/);
  assert.match(probe, /Other owner deleted a planned record/);
  assert.match(probe, /Other owner inserted a plan for another dog/);
  assert.match(probe, /Anonymous read was granted/);
  assert.match(probe, /Anonymous insert was granted/);
  assert.match(probe, /Anonymous update was granted/);
  assert.match(probe, /Anonymous delete was granted/);
  assert.match(probe, /immutable event_type/);
  assert.match(probe, /overdue plan could not be corrected/i);
  assert.match(probe, /performed separately/i);
  assert.match(probe, /rollback;\s*$/i);
});

test('actual workspace blocks duplicate plan writes and preserves pending intent for status recovery', async () => {
  const deferred = deferredResult();
  const harness = createPlannedHealthHandlerHarness({
    insertPlannedHealth: async (...args) => { harness.calls.insert.push(args); return deferred.promise; },
  });
  const first = harness.handlers.savePlannedHealth(null, 'vaccination', tomorrow, 'Booster');
  assert.equal(harness.calls.insert.length, 1);
  assert.equal(await harness.handlers.savePlannedHealth(null, 'vaccination', tomorrow, 'Booster'), false);
  assert.equal(harness.calls.insert.length, 1);
  deferred.resolve({ status: 'unknown' });
  assert.equal(await first, false);
  assert.equal(harness.state.pending, true);
  const intent = harness.state.pendingMutation.current;
  assert.ok(intent);
  assert.equal(intent.kind, 'insert');
  assert.deepEqual(intent.operation, { id: planId, dog_id: dogId, event_type: 'vaccination', due_on: tomorrow,
    description: 'Booster', local_today: today, reminder_enabled: false, reminder_minutes: null });
  harness.state.page = 'health';
  assert.equal(await harness.handlers.savePlannedHealth(null, 'vet_visit', tomorrow, ''), false,
    'leaving the planned-health page does not clear or replace unresolved intent');
  assert.equal(harness.state.pendingMutation.current, intent);
});

test('actual workspace status retry replays only the exact pending plan after absent lookup', async () => {
  const harness = createPlannedHealthHandlerHarness({
    insertPlannedHealth: async (...args) => { harness.calls.insert.push(args); return harness.calls.insert.length === 1 ? { status: 'unknown' } : { status: 'saved', value: plan }; },
    fetchPlannedHealthById: async (...args) => { harness.calls.lookup.push(args); return null; },
  });
  assert.equal(await harness.handlers.savePlannedHealth(null, 'vaccination', tomorrow, 'Booster'), false);
  const intent = harness.state.pendingMutation.current;
  await harness.handlers.retryPlannedHealth();
  assert.deepEqual(harness.calls.lookup[0].slice(1), [dogId, planId]);
  assert.equal(harness.calls.insert.length, 2);
  assert.deepEqual(harness.calls.insert[1][1], intent.operation);
  assert.equal(harness.state.pending, false);
  assert.deepEqual(harness.state.rows, [plan]);
});

test('actual workspace uses exact captured preimage on update/delete and never auto-overwrites concurrent edits', async () => {
  const overdue = { ...plan, due_on: yesterday, event_type: 'vet_visit', description: null };
  const current = { ...overdue, description: 'Concurrent' };
  const harness = createPlannedHealthHandlerHarness({ rows: [overdue],
    updatePlannedHealth: async (...args) => { harness.calls.update.push(args); return { status: 'unknown' }; },
    deletePlannedHealth: async (...args) => { harness.calls.delete.push(args); return { status: 'unknown' }; },
    fetchPlannedHealthById: async (...args) => { harness.calls.lookup.push(args); return current; },
  });
  assert.equal(await harness.handlers.savePlannedHealth(planId, 'vaccination', yesterday, 'Wrong type'), false);
  assert.equal(harness.calls.update.length, 0, 'event type cannot be changed through the edit callback');
  assert.equal(await harness.handlers.savePlannedHealth(planId, 'vet_visit', addDays(yesterday, -1), 'Past replacement'), false);
  assert.equal(harness.calls.update.length, 0, 'a new past date cannot be accepted for an overdue plan');
  assert.equal(await harness.handlers.savePlannedHealth(planId, 'vet_visit', yesterday, 'Corrected'), false);
  assert.deepEqual(harness.calls.update[0].slice(1), [dogId, planId, overdue,
    { due_on: yesterday, description: 'Corrected', reminder_enabled: false, reminder_minutes: null }, today]);
  assert.equal(harness.state.pending, true);
  await harness.handlers.retryPlannedHealth();
  assert.equal(harness.calls.update.length, 1, 'status check must not overwrite a later owner edit');
  assert.deepEqual(harness.state.conflict?.current, current);
  assert.notEqual(harness.state.pendingMutation.current, null);
  harness.dependencies.plannedHealthConflict = harness.state.conflict;
  harness.handlers = harness.rebuild();
  await harness.handlers.resolvePlannedHealthConflict();
  assert.equal(harness.state.pendingMutation.current, null);
  assert.deepEqual(harness.state.rows, [current]);
  assert.equal(await harness.handlers.savePlannedHealth(planId, 'vet_visit', yesterday, 'Fresh change'), false);
  assert.equal(harness.calls.update.length, 2, 'a new write is possible only after explicit current-plan acceptance');
  assert.deepEqual(harness.calls.update[1].slice(1, 4), [dogId, planId, current]);

  const deleteHarness = createPlannedHealthHandlerHarness({ rows: [overdue],
    deletePlannedHealth: async (...args) => { deleteHarness.calls.delete.push(args); return { status: 'unknown' }; },
    fetchPlannedHealthById: async () => current,
  });
  assert.equal(await deleteHarness.handlers.removePlannedHealth(planId), false);
  assert.deepEqual(deleteHarness.calls.delete[0].slice(1), [dogId, planId, overdue]);
  await deleteHarness.handlers.retryPlannedHealth();
  assert.equal(deleteHarness.calls.delete.length, 1);
  assert.deepEqual(deleteHarness.state.conflict?.current, current);
});

test('actual workspace status retry retains localToday captured with the plan intent', async () => {
  const previous = { ...plan, due_on: today, description: 'Original' };
  const targetDate = tomorrow;
  let dateReads = 0;
  const harness = createPlannedHealthHandlerHarness({ rows: [previous],
    localDate: () => { dateReads += 1; return dateReads === 1 ? today : addDays(tomorrow, 1); },
    updatePlannedHealth: async (...args) => {
      harness.calls.update.push(args);
      return harness.calls.update.length === 1 ? { status: 'unknown' } : { status: 'saved', value: { ...previous, due_on: targetDate, description: 'Changed' } };
    },
    fetchPlannedHealthById: async () => previous,
  });
  assert.equal(await harness.handlers.savePlannedHealth(planId, 'vaccination', targetDate, 'Changed'), false);
  await harness.handlers.retryPlannedHealth();
  assert.equal(harness.calls.update.length, 2);
  assert.deepEqual(harness.calls.update.map((args) => args[5]), [today, today]);
  assert.equal(harness.state.pending, false);
});

test('actual workspace lifetime change suppresses delayed status replay and keeps pending intent', async () => {
  const lookup = deferredResult();
  const harness = createPlannedHealthHandlerHarness({
    insertPlannedHealth: async (...args) => { harness.calls.insert.push(args); return { status: 'unknown' }; },
    fetchPlannedHealthById: async (...args) => { harness.calls.lookup.push(args); return lookup.promise; },
  });
  await harness.handlers.savePlannedHealth(null, 'vaccination', tomorrow, 'Booster');
  const intent = harness.state.pendingMutation.current;
  const retry = harness.handlers.retryPlannedHealth();
  harness.state.lifetime.current = 'other-dog:other-user';
  lookup.resolve(null);
  await retry;
  assert.equal(harness.calls.insert.length, 1, 'late lookup cannot replay against a new dog/session');
  assert.equal(harness.state.pendingMutation.current, intent);
});

test('planned health is linked from the health workspace and remains a separate screen/contract', async () => {
  assert.match(healthScreenSource, /onOpenPlannedHealth/);
  assert.match(healthScreenSource, /title="Planerade hälsohändelser"/);
  assert.match(workspaceSource, /<PlannedHealthScreen/);
  assert.match(workspaceSource, /fetchHealthHistory\(client, dog\.id/);
  assert.match(workspaceSource, /fetchPlannedHealth\(client, dog\.id/);
});

function createPlannedHealthHandlerHarness({ rows = [], ...overrides } = {}) {
  const lifetime = { current: `${dogId}:user-1` };
  const state = { rows: [...rows], page: 'planned-health', pending: false, busy: false, message: '',
    messageError: false, conflict: null, pendingMutation: { current: null }, inFlight: { current: false },
    flightToken: { current: null }, rowRef: { current: [...rows] }, lifetime, mounted: { current: true },
    loadState: 'ready' };
  const calls = { insert: [], update: [], delete: [], lookup: [], reload: [] };
  const dependencies = {
    ExpoCrypto: { randomUUID: () => planId },
    client: {}, dog: { id: dogId }, mounted: state.mounted,
    plannedHealthLifetime: lifetime, plannedHealthState: state.loadState,
    plannedHealthRows: state.rowRef,
    pendingPlannedHealthMutation: state.pendingMutation,
    plannedHealthMutationInFlight: state.inFlight,
    plannedHealthFlightToken: state.flightToken,
    plannedHealthConflict: state.conflict,
    localDate,
    isValidPlannedHealthDate: data.isValidPlannedHealthDate,
    normalizePlannedHealthDescription: data.normalizePlannedHealthDescription,
    insertPlannedHealth: async (...args) => { calls.insert.push(args); return { status: 'saved', value: { ...args[1], local_today: undefined, created_at: '2026-10-06T10:00:00Z' } }; },
    updatePlannedHealth: async (...args) => { calls.update.push(args); return { status: 'saved', value: { id: args[2], dog_id: dogId, event_type: args[3].event_type, ...args[5], created_at: '2026-10-06T10:00:00Z' } }; },
    deletePlannedHealth: async (...args) => { calls.delete.push(args); return { status: 'saved', value: null }; },
    fetchPlannedHealthById: async (...args) => { calls.lookup.push(args); return null; },
    fetchPlannedHealth: async (...args) => { calls.reload.push(args); return state.rowRef.current; },
    serializePlannedHealthRead: async (read) => read(),
    reloadPlannedHealth: async () => {},
    setPlannedHealthPending(value) { state.pending = value; },
    setPlannedHealthBusy(value) { state.busy = value; },
    setPlannedHealthMessage(value) { state.message = value; },
    setPlannedHealthMessageError(value) { state.messageError = value; },
    setPlannedHealthConflict(value) { state.conflict = value; },
    setPlannedHealth(value) { state.rows = value; state.rowRef.current = value; },
    setPlannedHealthState(value) { state.loadState = value; },
  };
  Object.assign(dependencies, overrides);
  const functionSource = [
    extractFunction(workspaceSource, 'markPlannedHealthSaved'),
    extractFunction(workspaceSource, 'runPlannedHealthMutation'),
    extractFunction(workspaceSource, 'savePlannedHealth'),
    extractFunction(workspaceSource, 'removePlannedHealth'),
    extractFunction(workspaceSource, 'resolvePlannedHealthConflict'),
    extractFunction(workspaceSource, 'retryPlannedHealth'),
    extractFunction(workspaceSource, 'samePlannedHealth'),
    extractFunction(workspaceSource, 'samePlannedHealthSnapshot'),
  ].join('\n');
  const compiled = ts.transpileModule(functionSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true,
  });
  const error = compiled.diagnostics?.find((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.equal(error, undefined, error && ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  const build = new Function(...Object.keys(dependencies),
    `${compiled.outputText}\nreturn { savePlannedHealth, removePlannedHealth, retryPlannedHealth, resolvePlannedHealthConflict };`);
  const rebuild = () => build(...Object.values(dependencies));
  return { handlers: rebuild(), rebuild, dependencies, calls, state };
}

function extractFunction(source, name) {
  let start = source.indexOf(`async function ${name}(`);
  if (start === -1) start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Expected actual ${name} workspace handler`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = bodyStart; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  assert.fail(`Unterminated handler ${name}`);
}

function deferredResult() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function localClient(handler) {
  const requests = [];
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      const request = { method: init.method ?? 'GET', url, signal: init.signal, headers: new Headers(init.headers),
        body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined };
      requests.push(request);
      return handler(request);
    } },
  });
  return { client, requests };
}

function jsonResponse(value, status = 200) {
  return new Response(value === null ? null : JSON.stringify(value), {
    status, headers: { 'Content-Type': 'application/json', ...(status >= 400 ? { 'Content-Range': '*/0' } : {}) },
  });
}

function addDays(value, days) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
