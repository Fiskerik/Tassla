import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';

const tsResolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier);
  },
});
const workspaceData = await import('../src/data/workspace-data.ts');
tsResolution.deregister();
const workspaceSource = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const historyScreenSource = await readFile(new URL('../src/features/health/HealthHistoryScreen.tsx', import.meta.url), 'utf8');

const baseUrl = 'https://local-test.supabase.invalid';
const dogId = '11111111-1111-4111-8111-111111111111';
const otherDogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const historyId = '22222222-2222-4222-8222-222222222222';
const actorId = '33333333-3333-4333-8333-333333333333';
const operation = { id: historyId, dog_id: dogId, event_type: 'vaccination', occurred_on: '2026-10-01', description: '  Booster  ' };
const savedRecord = { ...operation, description: 'Booster', actor_id: actorId };

test('health-history date and note validators enforce calendar, future, trim and Unicode boundaries', () => {
  const { isValidHealthHistoryDate, normalizeHealthHistoryDescription } = workspaceData;
  assert.equal(isValidHealthHistoryDate(today()), true);
  assert.equal(isValidHealthHistoryDate('2024-02-29'), true);
  assert.equal(isValidHealthHistoryDate('2025-02-29'), false);
  assert.equal(isValidHealthHistoryDate('2026-04-31'), false);
  assert.equal(isValidHealthHistoryDate('2026-2-03'), false);
  assert.equal(isValidHealthHistoryDate(tomorrow()), false);

  assert.equal(normalizeHealthHistoryDescription('  note  '), 'note');
  assert.equal(normalizeHealthHistoryDescription('   '), null);
  assert.equal(normalizeHealthHistoryDescription(null), null);
  assert.equal(normalizeHealthHistoryDescription('😀'.repeat(500)), '😀'.repeat(500));
  assert.equal(normalizeHealthHistoryDescription('😀'.repeat(501)), undefined);
});

test('invalid dates, types and overlong Unicode notes fail before a Supabase request', async () => {
  const { client, requests } = localClient(() => { throw new Error('invalid input must not reach fetch'); });
  try {
    assert.deepEqual(await workspaceData.insertHealthHistory(client, { ...operation, occurred_on: tomorrow() }), { status: 'failed' });
    assert.deepEqual(await workspaceData.insertHealthHistory(client, { ...operation, occurred_on: '2025-02-29' }), { status: 'failed' });
    assert.deepEqual(await workspaceData.insertHealthHistory(client, { ...operation, event_type: 'weight' }), { status: 'failed' });
    assert.deepEqual(await workspaceData.insertHealthHistory(client, { ...operation, description: '😀'.repeat(501) }), { status: 'failed' });
    assert.deepEqual(await workspaceData.updateHealthHistory(client, dogId, 'vaccination', historyId,
      { occurred_on: today(), description: null }, { occurred_on: tomorrow(), description: null }), { status: 'failed' });
    assert.equal(requests.length, 0);
  } finally {
    await client.auth.dispose();
  }
});

test('history read filters the dog and allowed event types, sorts stably, and parses rows', async () => {
  const rows = [savedRecord, { ...savedRecord, id: '11111111-1111-4111-8111-111111111112', event_type: 'vet_visit', occurred_on: '2026-09-29' }];
  const { client, requests } = localClient(({ method, url }) => {
    assert.equal(method, 'GET');
    assert.equal(url.pathname, '/rest/v1/dog_events');
    assert.equal(url.searchParams.get('select'), 'id,dog_id,actor_id,event_type,occurred_on,description');
    assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.deepEqual(url.searchParams.getAll('event_type'), ['in.(vaccination,vet_visit)']);
    assert.deepEqual(url.searchParams.get('order')?.split(','), ['occurred_on.desc', 'id.desc']);
    return jsonResponse(rows);
  });
  try {
    assert.deepEqual(await workspaceData.fetchHealthHistory(client, dogId), rows);
    assert.equal(requests.length, 1);
  } finally {
    await client.auth.dispose();
  }
});

test('history reads reject a row for another dog or a malformed row', async (t) => {
  await t.test('cross-dog collection result', async () => {
    const { client } = localClient(() => jsonResponse([{ ...savedRecord, dog_id: otherDogId }]));
    try { await assert.rejects(workspaceData.fetchHealthHistory(client, dogId)); }
    finally { await client.auth.dispose(); }
  });
  await t.test('invalid event type in collection result', async () => {
    const { client } = localClient(() => jsonResponse([{ ...savedRecord, event_type: 'weight' }]));
    try { await assert.rejects(workspaceData.fetchHealthHistory(client, dogId)); }
    finally { await client.auth.dispose(); }
  });
});

test('lookup filters by dog, exact history type and id, and validates the returned identity', async (t) => {
  await t.test('matching result', async () => {
    const { client, requests } = localClient(({ method, url }) => {
      assert.equal(method, 'GET');
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(url.searchParams.get('event_type'), 'eq.vaccination');
      assert.equal(url.searchParams.get('id'), `eq.${historyId}`);
      return jsonResponse(savedRecord);
    });
    try {
      assert.deepEqual(await workspaceData.fetchHealthHistoryById(client, dogId, 'vaccination', historyId), savedRecord);
      assert.equal(requests.length, 1);
    } finally { await client.auth.dispose(); }
  });
  await t.test('absent result', async () => {
    const { client } = localClient(() => jsonResponse(null));
    try { assert.equal(await workspaceData.fetchHealthHistoryById(client, dogId, 'vaccination', historyId), null); }
    finally { await client.auth.dispose(); }
  });
  await t.test('response identity mismatch', async () => {
    const { client } = localClient(() => jsonResponse({ ...savedRecord, event_type: 'vet_visit' }));
    try { await assert.rejects(workspaceData.fetchHealthHistoryById(client, dogId, 'vaccination', historyId)); }
    finally { await client.auth.dispose(); }
  });
});

test('insert sends only the allowed payload, normalizes the note, and trusts the validated postimage', async () => {
  const { client, requests } = localClient(({ method, url, body }) => {
    assert.equal(method, 'POST');
    assert.equal(url.pathname, '/rest/v1/dog_events');
    assert.deepEqual(body, { id: historyId, dog_id: dogId, event_type: 'vaccination', occurred_on: '2026-10-01', description: 'Booster' });
    assert.equal(Object.hasOwn(body, 'actor_id'), false);
    return jsonResponse(savedRecord);
  });
  try {
    assert.deepEqual(await workspaceData.insertHealthHistory(client, operation), { status: 'saved', value: savedRecord });
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('empty insert notes are persisted as null', async () => {
  const row = { ...savedRecord, description: null };
  const { client } = localClient(({ method, body }) => {
    assert.equal(method, 'POST');
    assert.equal(body.description, null);
    return jsonResponse(row);
  });
  try {
    assert.deepEqual(await workspaceData.insertHealthHistory(client, { ...operation, description: '  ' }), { status: 'saved', value: row });
  } finally { await client.auth.dispose(); }
});

test('lost insert response reconciles the same stable id and exact values', async (t) => {
  await t.test('matching row is saved without a second insert', async () => {
    let row = null;
    const { client, requests } = localClient(async ({ method, url }) => {
      if (method === 'POST') { row = savedRecord; throw new TypeError('simulated committed write with lost response'); }
      assert.equal(method, 'GET');
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(url.searchParams.get('event_type'), 'eq.vaccination');
      assert.equal(url.searchParams.get('id'), `eq.${historyId}`);
      return jsonResponse(row);
    });
    try {
      assert.deepEqual(await workspaceData.insertHealthHistory(client, operation), { status: 'saved', value: savedRecord });
      assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET']);
    } finally { await client.auth.dispose(); }
  });
  await t.test('absent after ambiguous failure remains unknown', async () => {
    const { client, requests } = localClient(({ method }) => method === 'POST'
      ? Promise.reject(new TypeError('simulated response loss')) : jsonResponse(null));
    try {
      assert.deepEqual(await workspaceData.insertHealthHistory(client, operation), { status: 'unknown' });
      assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET']);
    } finally { await client.auth.dispose(); }
  });
  await t.test('definite database rejection with absent row is failed', async () => {
    const { client } = localClient(({ method }) => method === 'POST'
      ? jsonResponse({ code: '23514', message: 'constraint rejected the row' }, 400) : jsonResponse(null));
    try { assert.deepEqual(await workspaceData.insertHealthHistory(client, operation), { status: 'failed' }); }
    finally { await client.auth.dispose(); }
  });
  await t.test('same id with different persisted values stays unknown', async () => {
    const { client } = localClient(({ method }) => method === 'POST'
      ? Promise.reject(new TypeError('lost response')) : jsonResponse({ ...savedRecord, description: 'Different' }));
    try { assert.deepEqual(await workspaceData.insertHealthHistory(client, operation), { status: 'unknown' }); }
    finally { await client.auth.dispose(); }
  });
});

test('update scopes identity and captured preimage, uses IS NULL for a null note, and sends only changes', async () => {
  const previous = { occurred_on: '2026-09-20', description: null };
  const changes = { occurred_on: '2026-09-25', description: 'Follow-up' };
  const updated = { ...savedRecord, ...changes };
  const { client, requests } = localClient(({ method, url, body }) => {
    assert.equal(method, 'PATCH');
    assert.deepEqual(body, changes);
    assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(url.searchParams.get('event_type'), 'eq.vaccination');
    assert.equal(url.searchParams.get('id'), `eq.${historyId}`);
    assert.equal(url.searchParams.get('occurred_on'), `eq.${previous.occurred_on}`);
    assert.equal(url.searchParams.get('description'), 'is.null');
    assert.equal(Object.hasOwn(body, 'event_type'), false);
    return jsonResponse(updated);
  });
  try {
    assert.deepEqual(await workspaceData.updateHealthHistory(client, dogId, 'vaccination', historyId, previous, changes), { status: 'saved', value: updated });
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('update uses exact equality when the captured note is non-null', async () => {
  const previous = { occurred_on: '2026-09-20', description: 'Original note' };
  const changes = { occurred_on: '2026-09-25', description: null };
  const { client, requests } = localClient(({ method, url }) => {
    assert.equal(method, 'PATCH');
    assert.equal(url.searchParams.get('occurred_on'), `eq.${previous.occurred_on}`);
    assert.equal(url.searchParams.get('description'), `eq.${previous.description}`);
    return jsonResponse({ ...savedRecord, ...changes });
  });
  try {
    assert.deepEqual(await workspaceData.updateHealthHistory(client, dogId, 'vaccination', historyId, previous, changes), {
      status: 'saved', value: { ...savedRecord, ...changes },
    });
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('update reconciliation distinguishes committed, rejected, and conflicting preimages', async (t) => {
  const previous = { occurred_on: '2026-09-20', description: 'Original' };
  const changes = { occurred_on: '2026-09-25', description: null };
  const updated = { ...savedRecord, ...changes };

  await t.test('lost response with requested postimage is saved', async () => {
    const { client, requests } = localClient(({ method }) => method === 'PATCH'
      ? Promise.reject(new TypeError('simulated lost update response')) : jsonResponse(updated));
    try {
      assert.deepEqual(await workspaceData.updateHealthHistory(client, dogId, 'vaccination', historyId, previous, changes), { status: 'saved', value: updated });
      assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
    } finally { await client.auth.dispose(); }
  });

  await t.test('definite rejection with unchanged preimage is failed', async () => {
    const unchanged = { ...savedRecord, ...previous };
    const { client } = localClient(({ method }) => method === 'PATCH'
      ? jsonResponse({ code: '23514', message: 'write rejected' }, 400) : jsonResponse(unchanged));
    try { assert.deepEqual(await workspaceData.updateHealthHistory(client, dogId, 'vaccination', historyId, previous, changes), { status: 'failed' }); }
    finally { await client.auth.dispose(); }
  });

  await t.test('another edit after lost response is unknown and never replayed', async () => {
    const concurrent = { ...savedRecord, occurred_on: '2026-09-22', description: 'Later owner edit' };
    const { client, requests } = localClient(({ method }) => method === 'PATCH'
      ? Promise.reject(new TypeError('lost update response')) : jsonResponse(concurrent));
    try {
      assert.deepEqual(await workspaceData.updateHealthHistory(client, dogId, 'vaccination', historyId, previous, changes), { status: 'unknown' });
      assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
    } finally { await client.auth.dispose(); }
  });

  await t.test('concurrent preimage mismatch returns no updated row without overwriting it', async () => {
    const concurrent = { ...savedRecord, occurred_on: '2026-09-22', description: 'Later owner edit' };
    const { client, requests } = localClient(({ method }) => method === 'PATCH' ? jsonResponse(null) : jsonResponse(concurrent));
    try {
      assert.deepEqual(await workspaceData.updateHealthHistory(client, dogId, 'vaccination', historyId, previous, changes), { status: 'unknown' });
      assert.equal(requests.filter(({ method }) => method === 'PATCH').length, 1);
    } finally { await client.auth.dispose(); }
  });
});

test('delete is conditional on dog, type, id, date and note preimage, including null notes', async () => {
  let exists = true;
  const previous = { occurred_on: '2026-09-20', description: null };
  const { client, requests } = localClient(async ({ method, url }) => {
    assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(url.searchParams.get('event_type'), 'eq.vaccination');
    assert.equal(url.searchParams.get('id'), `eq.${historyId}`);
    if (method === 'DELETE') {
      assert.equal(url.searchParams.get('occurred_on'), `eq.${previous.occurred_on}`);
      assert.equal(url.searchParams.get('description'), 'is.null');
      exists = false;
      throw new TypeError('simulated committed delete with lost response');
    }
    assert.equal(method, 'GET');
    return jsonResponse(exists ? { ...savedRecord, ...previous } : null);
  });
  try {
    assert.deepEqual(await workspaceData.deleteHealthHistory(client, dogId, 'vaccination', historyId, previous), { status: 'saved', value: null });
    assert.deepEqual(requests.map(({ method }) => method), ['DELETE', 'GET']);
  } finally { await client.auth.dispose(); }
});

test('delete only trusts the returned id after it matches or a follow-up proves absence', async (t) => {
  const previous = { occurred_on: '2026-09-20', description: 'Original' };
  await t.test('mismatched delete id requires absence readback before saved', async () => {
    const { client, requests } = localClient(({ method }) => method === 'DELETE'
      ? jsonResponse({ id: '99999999-9999-4999-8999-999999999999' }) : jsonResponse(null));
    try {
      assert.deepEqual(await workspaceData.deleteHealthHistory(client, dogId, 'vaccination', historyId, previous), { status: 'saved', value: null });
      assert.deepEqual(requests.map(({ method }) => method), ['DELETE', 'GET']);
    } finally { await client.auth.dispose(); }
  });
  await t.test('mismatched delete id with target still present remains unknown', async () => {
    const { client, requests } = localClient(({ method }) => method === 'DELETE'
      ? jsonResponse({ id: '99999999-9999-4999-8999-999999999999' }) : jsonResponse({ ...savedRecord, ...previous }));
    try {
      assert.deepEqual(await workspaceData.deleteHealthHistory(client, dogId, 'vaccination', historyId, previous), { status: 'unknown' });
      assert.deepEqual(requests.map(({ method }) => method), ['DELETE', 'GET']);
    } finally { await client.auth.dispose(); }
  });
});

test('delete never treats a changed row as deleted after an ambiguous or rejected write', async (t) => {
  const previous = { occurred_on: '2026-09-20', description: 'Original' };
  const changed = { ...savedRecord, occurred_on: '2026-09-22', description: 'Concurrent edit' };
  await t.test('ambiguous outcome remains unknown', async () => {
    const { client, requests } = localClient(({ method }) => method === 'DELETE'
      ? Promise.reject(new TypeError('lost delete response')) : jsonResponse(changed));
    try {
      assert.deepEqual(await workspaceData.deleteHealthHistory(client, dogId, 'vaccination', historyId, previous), { status: 'unknown' });
      assert.deepEqual(requests.map(({ method }) => method), ['DELETE', 'GET']);
    } finally { await client.auth.dispose(); }
  });
  await t.test('definite rejection with row present is failed', async () => {
    const { client } = localClient(({ method }) => method === 'DELETE'
      ? jsonResponse({ code: '23503', message: 'delete rejected' }, 400) : jsonResponse({ ...savedRecord, ...previous }));
    try { assert.deepEqual(await workspaceData.deleteHealthHistory(client, dogId, 'vaccination', historyId, previous), { status: 'failed' }); }
    finally { await client.auth.dispose(); }
  });
});

test('health-history queries pass an abort signal through the installed Supabase client', async () => {
  const { client, requests } = localClient(({ signal }) => {
    assert.ok(signal instanceof AbortSignal);
    return jsonResponse([]);
  });
  try {
    assert.deepEqual(await workspaceData.fetchHealthHistory(client, dogId), []);
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('health-history data contract leaves the existing weight read and write contract intact', async () => {
  const weight = { id: historyId, dog_id: dogId, actor_id: actorId, occurred_on: today(), weight_kg: 12.345 };
  const { client, requests } = localClient(({ method, url, body }) => {
    assert.equal(url.pathname, '/rest/v1/dog_events');
    if (method === 'GET') {
      assert.equal(url.searchParams.get('event_type'), 'eq.weight');
      return jsonResponse([weight]);
    }
    assert.equal(method, 'POST');
    assert.deepEqual(body, { id: weight.id, dog_id: dogId, event_type: 'weight', occurred_on: weight.occurred_on, weight_kg: 12.345 });
    return jsonResponse(weight);
  });
  try {
    assert.deepEqual(await workspaceData.fetchHealthWeights(client, dogId), [weight]);
    assert.deepEqual(await workspaceData.insertHealthWeight(client, { id: weight.id, dog_id: dogId, occurred_on: weight.occurred_on, weight_kg: weight.weight_kg }), { status: 'saved', value: weight });
    assert.deepEqual(requests.map(({ method }) => method), ['GET', 'POST']);
  } finally { await client.auth.dispose(); }
});

test('actual workspace history handler prevents same-tick duplicate inserts and retains unknown status', async () => {
  const deferred = deferredResult();
  const harness = createHealthHistoryHandlerHarness({
    insertHealthHistory: async (...args) => { harness.calls.insert.push(args); return deferred.promise; },
  });
  const first = harness.handlers.saveHealthHistory(null, 'vaccination', today(), 'Booster');
  assert.equal(harness.calls.insert.length, 1);
  assert.equal(await harness.handlers.saveHealthHistory(null, 'vaccination', today(), 'Booster'), false);
  assert.equal(harness.calls.insert.length, 1);
  deferred.resolve({ status: 'saved', value: savedRecord });
  assert.equal(await first, true);
  assert.deepEqual(harness.state.rows, [savedRecord]);
  assert.equal(harness.state.pendingMutation.current, null);

  const unknownHarness = createHealthHistoryHandlerHarness({
    insertHealthHistory: async (...args) => { unknownHarness.calls.insert.push(args); return { status: 'unknown' }; },
  });
  assert.equal(await unknownHarness.handlers.saveHealthHistory(null, 'vet_visit', today(), ''), false);
  assert.equal(unknownHarness.state.pending, true);
  assert.equal(unknownHarness.state.pendingMutation.current?.operation.id, historyId);
  assert.equal(await unknownHarness.handlers.saveHealthHistory(null, 'vet_visit', today(), 'different'), false);
  assert.equal(unknownHarness.calls.insert.length, 1);
});

test('actual workspace status check does not replay an absent insert after dog/session lifetime changes', async () => {
  const lookup = deferredResult();
  const harness = createHealthHistoryHandlerHarness({
    insertHealthHistory: async (...args) => { harness.calls.insert.push(args); return { status: 'unknown' }; },
    fetchHealthHistoryById: async (...args) => { harness.calls.lookup.push(args); return lookup.promise; },
  });
  assert.equal(await harness.handlers.saveHealthHistory(null, 'vaccination', today(), 'Booster'), false);
  assert.equal(harness.calls.insert.length, 1);

  const retry = harness.handlers.retryHealthHistory();
  assert.equal(harness.calls.lookup.length, 1);
  assert.deepEqual(harness.calls.lookup[0].slice(1), [dogId, 'vaccination', historyId]);
  harness.state.lifetime.current = 'other-dog:other-user';
  lookup.resolve(null);
  await retry;

  assert.equal(harness.calls.insert.length, 1, 'stale status read must not replay the write');
  assert.equal(harness.state.rows.length, 0, 'stale result must not change history rows');
  assert.notEqual(harness.state.pendingMutation.current, null, 'stale operation is not silently cleared');
});

test('actual workspace update conflict can be explicitly resolved before starting a fresh edit', async () => {
  const original = { ...savedRecord, occurred_on: '2026-09-20', description: 'Original' };
  const current = { ...savedRecord, occurred_on: '2026-09-22', description: 'Another edit' };
  const harness = createHealthHistoryHandlerHarness({ rows: [original] });
  harness.dependencies.updateHealthHistory = async (...args) => {
    harness.calls.update.push(args);
    return harness.calls.update.length === 1 ? { status: 'unknown' } : { status: 'saved', value: { ...current, ...args[5] } };
  };
  harness.dependencies.fetchHealthHistoryById = async (...args) => { harness.calls.lookup.push(args); return current; };
  harness.handlers = harness.rebuildHandlers();

  assert.equal(await harness.handlers.saveHealthHistory(historyId, 'vaccination', '2026-09-25', 'My edit'), false);
  assert.equal(harness.state.pending, true);
  await harness.handlers.retryHealthHistory();
  assert.deepEqual(harness.state.conflict, { lifetime: `${dogId}:user-1`, mutationId: historyId, current });
  assert.notEqual(harness.state.pendingMutation.current, null);
  assert.equal(harness.calls.update.length, 1, 'conflict status check must not overwrite the newer row');

  harness.dependencies.healthHistoryConflict = harness.state.conflict;
  harness.handlers = harness.rebuildHandlers();
  harness.handlers.resolveHealthHistoryConflict();
  assert.equal(harness.state.pendingMutation.current, null);
  assert.equal(harness.state.pending, false);
  assert.deepEqual(harness.state.rows, [current]);
  assert.equal(await harness.handlers.saveHealthHistory(historyId, 'vaccination', '2026-09-26', 'Fresh intent'), true);
  assert.equal(harness.calls.update.length, 2);
  assert.deepEqual(harness.calls.update[1].slice(1, 5), [dogId, 'vaccination', historyId, current]);
});

test('actual workspace handler suppresses a pending mutation result after its lifetime changes', async () => {
  const write = deferredResult();
  const harness = createHealthHistoryHandlerHarness({
    insertHealthHistory: async (...args) => { harness.calls.insert.push(args); return write.promise; },
  });
  const save = harness.handlers.saveHealthHistory(null, 'vaccination', today(), 'Booster');
  harness.state.lifetime.current = 'dog-2:user-1';
  write.resolve({ status: 'saved', value: savedRecord });
  assert.equal(await save, false);
  assert.equal(harness.state.rows.length, 0);
  assert.equal(harness.state.pendingMutation.current, null);
});

test('health history editor remounts on saved-record snapshot changes and resets on conflict resolution', async () => {
  const healthScreenSource = await readFile(new URL('../src/features/health/HealthScreen.tsx', import.meta.url), 'utf8');
  assert.match(healthScreenSource, /const historyEditorKey = JSON.stringify\(\[editingId, type, props.historyRecords/);
  assert.match(healthScreenSource, /<HealthHistoryScreen key=\{historyEditorKey\}/);
  assert.match(historyScreenSource, /function resolveConflict\(\) \{\s*resetForm\(\);\s*onResolveConflict\?\.\(\);\s*\}/);
  assert.match(historyScreenSource, /onResolveConflict\?\.\(\)/);
  assert.match(historyScreenSource, /title="Använd aktuell historik och börja om"/);
});

function localClient(handler) {
  const requests = [];
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: async (input, init = {}) => {
        const url = new URL(typeof input === 'string' ? input : input.url);
        const request = {
          method: init.method ?? 'GET',
          url,
          signal: init.signal,
          body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
        };
        requests.push(request);
        return handler(request);
      },
    },
  });
  return { client, requests };
}

function createHealthHistoryHandlerHarness({ rows = [], ...overrides } = {}) {
  const lifetime = { current: `${dogId}:user-1` };
  const state = {
    rows: [...rows],
    pending: false,
    busy: false,
    message: '',
    messageError: false,
    conflict: null,
    pendingMutation: { current: null },
    mutationInFlight: { current: false },
    rowRef: { current: [...rows] },
    lifetime,
    mounted: { current: true },
  };
  const calls = { insert: [], update: [], delete: [], lookup: [] };
  const dependencies = {
    ExpoCrypto: { randomUUID: () => historyId },
    client: {},
    dog: { id: dogId },
    mounted: state.mounted,
    healthHistoryLifetime: lifetime,
    healthHistoryState: 'ready',
    healthHistoryRows: state.rowRef,
    pendingHealthHistoryMutation: state.pendingMutation,
    healthHistoryMutationInFlight: state.mutationInFlight,
    healthHistoryFlightToken: { current: null },
    healthHistoryConflict: state.conflict,
    isValidHealthHistoryDate: workspaceData.isValidHealthHistoryDate,
    normalizeHealthHistoryDescription: workspaceData.normalizeHealthHistoryDescription,
    insertHealthHistory: async (...args) => {
      calls.insert.push(args);
      return { status: 'saved', value: { ...args[1], actor_id: actorId } };
    },
    updateHealthHistory: async (...args) => {
      calls.update.push(args);
      return { status: 'saved', value: { id: args[3], dog_id: dogId, actor_id: actorId, event_type: args[2], ...args[5] } };
    },
    deleteHealthHistory: async (...args) => { calls.delete.push(args); return { status: 'saved', value: null }; },
    fetchHealthHistoryById: async (...args) => { calls.lookup.push(args); return null; },
    setHealthHistoryPending(value) { state.pending = value; },
    setHealthHistoryBusy(value) { state.busy = value; },
    setHealthHistoryMessage(value) { state.message = value; },
    setHealthHistoryMessageError(value) { state.messageError = value; },
    setHealthHistoryConflict(value) { state.conflict = value; },
    setHealthHistory(value) { state.rows = value; },
    setHealthHistoryState(value) { state.loadState = value; },
    reloadHealthHistory: async () => {},
  };
  Object.assign(dependencies, overrides);
  const functionSource = [
    extractFunction(workspaceSource, 'markHealthHistorySaved'),
    extractFunction(workspaceSource, 'runHealthHistoryMutation'),
    extractFunction(workspaceSource, 'saveHealthHistory'),
    extractFunction(workspaceSource, 'removeHealthHistory'),
    extractFunction(workspaceSource, 'resolveHealthHistoryConflict'),
    extractFunction(workspaceSource, 'retryHealthHistory'),
    extractFunction(workspaceSource, 'sameHealthHistory'),
  ].join('\n');
  const compiled = ts.transpileModule(functionSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  const error = compiled.diagnostics?.find((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.equal(error, undefined, error && ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  const makeHandlers = () => {
    const buildHandlers = new Function(
      ...Object.keys(dependencies),
      `${compiled.outputText}\nreturn { saveHealthHistory, removeHealthHistory, resolveHealthHistoryConflict, retryHealthHistory };`,
    );
    return buildHandlers(...Object.values(dependencies));
  };
  return { handlers: makeHandlers(), rebuildHandlers: makeHandlers, calls, state, dependencies };
}

function extractFunction(source, name) {
  let start = source.indexOf(`async function ${name}(`);
  if (start === -1) start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Expected actual ${name} handler in ProductWorkspace`);
  const bodyStart = source.indexOf('{', start);
  assert.notEqual(bodyStart, -1, `Expected ${name} handler body`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = bodyStart; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];
    if (lineComment) { if (current === '\n') lineComment = false; continue; }
    if (blockComment) { if (current === '*' && next === '/') { blockComment = false; index += 1; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (current === '\\') escaped = true;
      else if (current === quote) quote = null;
      continue;
    }
    if (current === '/' && next === '/') { lineComment = true; index += 1; continue; }
    if (current === '/' && next === '*') { blockComment = true; index += 1; continue; }
    if (current === '\'' || current === '"' || current === '`') { quote = current; continue; }
    if (current === '{') depth += 1;
    else if (current === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  assert.fail(`Could not find the end of ${name} handler`);
}

function deferredResult() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function jsonResponse(value, status = 200) {
  return Response.json(value, { status });
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
