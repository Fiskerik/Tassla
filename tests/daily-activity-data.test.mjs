import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { registerHooks } from 'node:module';

const resolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const data = await import('../src/features/home/daily-activity-data.ts');
resolution.deregister();

const baseUrl = 'https://local-test.supabase.invalid';
const dogId = '11111111-1111-4111-8111-111111111111';
const dateKey = '2026-10-13';
const checklist = [{ id: '77777777-7777-4777-8777-777777777777', label: 'Morgonrunda' }];
const routine = {
  id: '22222222-2222-4222-8222-222222222222',
  dog_id: dogId,
  label: 'Morgonrunda',
  checklist,
  checklist_revision: 1,
  legacy_single_item: false,
  repeat_unit: null,
  repeat_interval: null,
  repeat_weekdays: null,
  repeat_anchor_date: null,
};
const routineDraft = {
  id: routine.id,
  dog_id: dogId,
  label: routine.label,
  checklist,
  repeat_unit: null,
  repeat_interval: null,
  repeat_weekdays: null,
};
const routineDay = {
  id: '33333333-3333-4333-8333-333333333333',
  dog_id: dogId,
  routine_id: routine.id,
  date_key: dateKey,
  time_zone: 'Europe/Stockholm',
  routine_label_snapshot: routine.label,
  checklist_snapshot: checklist,
  completed_item_ids: [],
  completed_at: null,
  is_recurring_occurrence: false,
  routine_revision_snapshot: 1,
  routine_day_revision: 1,
  last_state_mutation_id: null,
};
const trainingSelection = { id: '44444444-4444-4444-8444-444444444444', dog_id: dogId, program_version_id: '55555555-5555-4555-8555-555555555555', step_id: '66666666-6666-4666-8666-666666666666', date_key: dateKey, time_zone: 'Europe/Stockholm' };

test('daily activity snapshot rejects partial responses and enforces requested dog/date scope', async () => {
  const { client, requests } = localClient(({ url }) => {
    if (url.pathname.endsWith('/rpc/ensure_due_daily_routine_days')) return jsonResponse([]);
    if (url.pathname.endsWith('/dog_daily_routines')) return jsonResponse([routine]);
    if (url.pathname.endsWith('/dog_daily_routine_days')) return jsonResponse([routineDay]);
    if (url.pathname.endsWith('/dog_daily_routine_day_skips')) return jsonResponse([]);
    if (url.pathname.endsWith('/dog_daily_training_selections')) return jsonResponse([trainingSelection]);
    throw new Error('Unexpected request ' + url.pathname);
  });
  try {
    assert.deepEqual(await data.fetchDailyActivitySnapshot(client, dogId, dateKey, 'Europe/Stockholm'), {
      routines: [routine], routineDays: [routineDay], routineDaySkips: [], trainingSelections: [trainingSelection],
    });
    assert.equal(requests.length, 5);
    const prepare = requests[0];
    assert.equal(prepare.url.pathname, '/rest/v1/rpc/ensure_due_daily_routine_days');
    assert.deepEqual(prepare.body, { p_dog_id: dogId, p_date_key: dateKey, p_time_zone: 'Europe/Stockholm' });
    const reads = requests.slice(1);
    assert.ok(reads.every(({ url }) => url.searchParams.get('dog_id') === 'eq.' + dogId));
    assert.ok(reads.filter(({ url }) => !url.pathname.endsWith('/dog_daily_routines')).every(({ url }) => url.searchParams.get('date_key') === 'eq.' + dateKey));
  } finally { await client.auth.dispose(); }

  const { client: foreignClient } = localClient(({ url }) => {
    if (url.pathname.endsWith('/rpc/ensure_due_daily_routine_days')) return jsonResponse([]);
    if (url.pathname.endsWith('/dog_daily_routines')) return jsonResponse([routine]);
    if (url.pathname.endsWith('/dog_daily_routine_days')) return jsonResponse([{ ...routineDay, dog_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }]);
    return jsonResponse([]);
  });
  try {
    await assert.rejects(data.fetchDailyActivitySnapshot(foreignClient, dogId, dateKey, 'Europe/Stockholm'), /Could not load daily routine selections/);
  } finally { await foreignClient.auth.dispose(); }
});

test('selected routine icons survive template and day-snapshot reads while unknown icons are rejected', async () => {
  const iconChecklist = [{ ...checklist[0], icon: 'water-outline' }];
  const iconRoutine = { ...routine, checklist: iconChecklist };
  const iconDay = { ...routineDay, checklist_snapshot: iconChecklist };
  const { client } = localClient(({ url }) => {
    if (url.pathname.endsWith('/rpc/ensure_due_daily_routine_days')) return jsonResponse([]);
    if (url.pathname.endsWith('/dog_daily_routines')) return jsonResponse([iconRoutine]);
    if (url.pathname.endsWith('/dog_daily_routine_days')) return jsonResponse([iconDay]);
    if (url.pathname.endsWith('/dog_daily_routine_day_skips')) return jsonResponse([]);
    if (url.pathname.endsWith('/dog_daily_training_selections')) return jsonResponse([]);
    throw new Error('Unexpected request ' + url.pathname);
  });
  try {
    const snapshot = await data.fetchDailyActivitySnapshot(client, dogId, dateKey, 'Europe/Stockholm');
    assert.deepEqual(snapshot.routines[0].checklist, iconChecklist);
    assert.deepEqual(snapshot.routineDays[0].checklist_snapshot, iconChecklist);
  } finally { await client.auth.dispose(); }

  for (const invalidItem of [
    { ...checklist[0], icon: 'unknown-icon' },
    { ...checklist[0], icon: null },
    { ...checklist[0], icon: 'water-outline', extra: true },
  ]) {
    const invalidIconRoutine = { ...routine, checklist: [invalidItem] };
    const { client: invalidClient } = localClient(({ url }) => {
      if (url.pathname.endsWith('/rpc/ensure_due_daily_routine_days')) return jsonResponse([]);
      if (url.pathname.endsWith('/dog_daily_routines')) return jsonResponse([invalidIconRoutine]);
      if (url.pathname.endsWith('/dog_daily_routine_days')) return jsonResponse([routineDay]);
      if (url.pathname.endsWith('/dog_daily_routine_day_skips')) return jsonResponse([]);
      if (url.pathname.endsWith('/dog_daily_training_selections')) return jsonResponse([]);
      throw new Error('Unexpected request ' + url.pathname);
    });
    try {
      await assert.rejects(data.fetchDailyActivitySnapshot(invalidClient, dogId, dateKey, 'Europe/Stockholm'), /Could not load routine templates/);
    } finally { await invalidClient.auth.dispose(); }
  }
});

test('routine creation persists and reads back a selected checklist icon', async () => {
  const iconChecklist = [{ ...checklist[0], icon: 'water-outline' }];
  const iconRoutine = { ...routine, checklist: iconChecklist };
  const iconDraft = { ...routineDraft, checklist: iconChecklist };
  const { client, requests } = localClient(async ({ method, url, body }) => {
    if (method === 'POST' && url.pathname.endsWith('/rpc/create_daily_routine_v2')) {
      assert.deepEqual(body.p_checklist, iconChecklist);
      throw new TypeError('simulated lost response after server commit');
    }
    assert.equal(method, 'GET');
    assert.equal(url.pathname, '/rest/v1/dog_daily_routines');
    return jsonResponse(iconRoutine);
  });
  try {
    const result = await data.createDailyRoutine(client, iconDraft, 'Europe/Stockholm');
    assert.deepEqual(result, { status: 'saved', value: iconRoutine });
    assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET']);
  } finally { await client.auth.dispose(); }
});

test('routine replacement persists and reads back a selected checklist icon at the next revision', async () => {
  const iconChecklist = [{ ...checklist[0], icon: 'water-outline' }];
  const updatedRoutine = { ...routine, checklist: iconChecklist, checklist_revision: 2 };
  const repeat = { repeat_unit: null, repeat_interval: null, repeat_weekdays: null };
  const { client, requests } = localClient(({ method, url, body }) => {
    assert.equal(method, 'POST');
    assert.equal(url.pathname, '/rest/v1/rpc/replace_daily_routine_v2');
    assert.equal(body.p_expected_revision, routine.checklist_revision);
    assert.deepEqual(body.p_checklist, iconChecklist);
    return jsonResponse(updatedRoutine);
  });
  try {
    const result = await data.replaceDailyRoutine(client, routine, routine.label, iconChecklist, repeat, 'Europe/Stockholm');
    assert.deepEqual(result, { status: 'saved', value: updatedRoutine });
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('routine replacement distinguishes a verified newer revision from an ordinary rejection', async () => {
  const repeat = { repeat_unit: null, repeat_interval: null, repeat_weekdays: null };
  const latest = { ...routine, label: 'Uppdaterad rutin', checklist_revision: 2 };
  const conflict = await localClient(({ method, url }) => method === 'POST'
    ? jsonResponse({ code: '40001', message: 'Routine changed before replacement' }, 409)
    : url.pathname.endsWith('/dog_daily_routines') ? jsonResponse(latest) : jsonResponse([]));
  try {
    assert.deepEqual(await data.replaceDailyRoutine(conflict.client, routine, 'Mitt utkast', checklist, repeat, 'Europe/Stockholm'), {
      status: 'conflict', value: latest,
    });
    assert.equal(conflict.requests.length, 2);
    assert.equal(conflict.requests[1].url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(conflict.requests[1].url.searchParams.get('id'), `eq.${routine.id}`);
  } finally { await conflict.client.auth.dispose(); }

  const rejected = await localClient(({ method, url }) => method === 'POST'
    ? jsonResponse({ code: '42501', message: 'Routine update denied' }, 403)
    : url.pathname.endsWith('/dog_daily_routines') ? jsonResponse(routine) : jsonResponse([]));
  try {
    assert.deepEqual(await data.replaceDailyRoutine(rejected.client, routine, 'Mitt utkast', checklist, repeat, 'Europe/Stockholm'), { status: 'failed' });
  } finally { await rejected.client.auth.dispose(); }
});

test('routine replacement keeps a class 08 connection error unresolved after stale readback', async () => {
  const repeat = { repeat_unit: null, repeat_interval: null, repeat_weekdays: null };
  const { client, requests } = localClient(({ method, url }) => method === 'POST'
    ? jsonResponse({ code: '08006', message: 'connection failure during write' }, 503)
    : url.pathname.endsWith('/dog_daily_routines') ? jsonResponse(routine) : jsonResponse([]));
  try {
    assert.deepEqual(await data.replaceDailyRoutine(client, routine, 'Mitt utkast', checklist, repeat, 'Europe/Stockholm'), { status: 'unknown' });
    assert.equal(requests.length, 2);
  } finally { await client.auth.dispose(); }
});

test('routine conflict readback rejects rows outside the exact dog and routine scope', async () => {
  const repeat = { repeat_unit: null, repeat_interval: null, repeat_weekdays: null };
  for (const foreignRow of [
    { ...routine, id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', checklist_revision: 2 },
    { ...routine, dog_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', checklist_revision: 2 },
  ]) {
    const { client } = localClient(({ method, url }) => method === 'POST'
      ? jsonResponse({ code: '40001', message: 'Routine changed before replacement' }, 409)
      : url.pathname.endsWith('/dog_daily_routines') ? jsonResponse(foreignRow) : jsonResponse([]));
    try {
      assert.deepEqual(await data.replaceDailyRoutine(client, routine, 'Mitt utkast', checklist, repeat, 'Europe/Stockholm'), { status: 'unknown' });
    } finally { await client.auth.dispose(); }
  }
});

test('routine create recovers a lost response only after exact owner/id/label readback', async () => {
  const { client, requests } = localClient(async ({ method, url, body }) => {
    if (method === 'POST' && url.pathname === '/rest/v1/rpc/create_daily_routine_v2') {
      assert.deepEqual(body, {
        p_dog_id: dogId,
        p_routine_id: routine.id,
        p_label: routine.label,
        p_checklist: checklist,
        p_repeat_unit: null,
        p_repeat_interval: null,
        p_repeat_weekdays: null,
        p_time_zone: 'Europe/Stockholm',
      });
      throw new TypeError('simulated lost response after server commit');
    }
    assert.equal(method, 'GET');
    assert.equal(url.pathname, '/rest/v1/dog_daily_routines');
    return jsonResponse(routine);
  });
  try {
    assert.deepEqual(await data.createDailyRoutine(client, routineDraft, 'Europe/Stockholm'), { status: 'saved', value: routine });
    assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET']);
  } finally { await client.auth.dispose(); }

  const { client: mismatchClient } = localClient(({ method, url }) => method === 'POST'
    ? jsonResponse({ code: '23505', message: 'duplicate key' }, 409)
    : url.pathname.endsWith('/dog_daily_routines')
      ? jsonResponse({ ...routine, label: 'Annan rutin' })
      : jsonResponse([]));
  try {
    assert.deepEqual(await data.createDailyRoutine(mismatchClient, routineDraft, 'Europe/Stockholm'), { status: 'failed' });
  } finally { await mismatchClient.auth.dispose(); }
});

test('daily training retry reconciles the existing logical key when its stable UUID is unknown', async () => {
  const existing = { ...trainingSelection, id: '77777777-7777-4777-8777-777777777777' };
  const { client, requests } = localClient(({ method, url }) => {
    if (method === 'POST') return jsonResponse({ code: '23505', message: 'duplicate logical key' }, 409);
    assert.equal(method, 'GET');
    if (url.searchParams.get('id') === `eq.${trainingSelection.id}`) return jsonResponse([]);
    return jsonResponse(existing);
  });
  try {
    assert.deepEqual(await data.addTrainingSelection(client, trainingSelection), { status: 'saved', value: existing });
    assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET', 'GET']);
  } finally { await client.auth.dispose(); }
});

test('adding a new routine to today confirms the exact dog, routine, day and checklist snapshot', async () => {
  const dayDraft = {
    id: routineDay.id,
    dog_id: dogId,
    routine_id: routine.id,
    date_key: dateKey,
    time_zone: 'Europe/Stockholm',
    routine_label_snapshot: routine.label,
    checklist_snapshot: checklist,
  };
  const mutationId = '88888888-8888-4888-8888-888888888888';
  const { client, requests } = localClient(({ method, url, body }) => {
    assert.equal(method, 'POST');
    assert.equal(url.pathname, '/rest/v1/dog_daily_routine_days');
    assert.equal(url.searchParams.get('select'), 'id,dog_id,routine_id,date_key,time_zone,routine_label_snapshot,checklist_snapshot,completed_item_ids,completed_at,is_recurring_occurrence,routine_revision_snapshot,routine_day_revision,last_state_mutation_id');
    assert.deepEqual(body, { id: dayDraft.id, dog_id: dogId, routine_id: routine.id, date_key: dateKey, time_zone: 'Europe/Stockholm' });
    return jsonResponse(routineDay);
  });
  try {
    assert.deepEqual(await data.addRoutineToDay(client, dayDraft, null, mutationId), { status: 'saved', value: routineDay });
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }

  const { client: failedClient } = localClient(({ method }) => method === 'POST'
    ? jsonResponse({ code: '42501', message: 'selection denied' }, 403)
    : jsonResponse([]));
  try {
    assert.deepEqual(await data.addRoutineToDay(failedClient, dayDraft, null, mutationId), { status: 'failed' });
  } finally { await failedClient.auth.dispose(); }

  const { client: unknownClient } = localClient(({ method }) => {
    if (method === 'POST') throw new TypeError('connection lost during selection');
    return jsonResponse([]);
  });
  try {
    assert.deepEqual(await data.addRoutineToDay(unknownClient, dayDraft, null, mutationId), { status: 'unknown' });
  } finally { await unknownClient.auth.dispose(); }
});

test('the production routine/day orchestrator performs two ordered writes and preserves their separate outcomes', async () => {
  const savedRoutine = { ...routine, repeat_anchor_date: null };
  const ids = [routineDay.id, '88888888-8888-4888-8888-888888888888'];
  const calls = [];
  const result = await data.createRoutineAndSelectForToday({
    routine: { ...routineDraft, dog_id: dogId },
    dateKey,
    timeZone: 'Europe/Stockholm',
    createId: () => ids.shift(),
    isScopeCurrent: () => true,
    createRoutine: async (draft) => {
      calls.push('create');
      assert.deepEqual(draft, { ...routineDraft, dog_id: dogId });
      return { status: 'saved', value: savedRoutine };
    },
    selectRoutineDay: async (day, mutationId) => {
      calls.push('select');
      assert.deepEqual(day, {
        id: routineDay.id, dog_id: dogId, routine_id: routine.id, date_key: dateKey,
        time_zone: 'Europe/Stockholm', routine_label_snapshot: routine.label, checklist_snapshot: checklist,
      });
      assert.equal(mutationId, '88888888-8888-4888-8888-888888888888');
      return { status: 'saved', value: routineDay };
    },
  });
  assert.deepEqual(calls, ['create', 'select']);
  assert.equal(result.template.status, 'saved');
  assert.equal(result.daySelection.status, 'saved');
  assert.equal(result.selection, 'attempted');

  for (const status of ['failed', 'unknown']) {
    const partial = await data.createRoutineAndSelectForToday({
      routine: { ...routineDraft, dog_id: dogId }, dateKey, timeZone: 'Europe/Stockholm',
      createId: () => routineDay.id, isScopeCurrent: () => true,
      createRoutine: async () => ({ status: 'saved', value: savedRoutine }),
      selectRoutineDay: async () => ({ status }),
    });
    assert.equal(partial.template.status, 'saved', 'the routine template stays confirmed independently');
    assert.equal(partial.daySelection.status, status);
  }
});

test('routine/day orchestration stops before selection when the captured owner, dog or day scope changes', async () => {
  const capturedScope = { ownerScope: 'owner-a', selectionKey: 'owner-a:dog-a', lifetime: 'owner-a:dog-a:2026-10-13' };
  const currentScope = { ...capturedScope };
  const savedRoutine = { ...routine, repeat_anchor_date: null };
  let selectionCalls = 0;
  const result = await data.createRoutineAndSelectForToday({
    routine: { ...routineDraft, dog_id: dogId }, dateKey, timeZone: 'Europe/Stockholm',
    createId: () => routineDay.id,
    isScopeCurrent: () => data.dailyRoutineCreationScopeMatches(capturedScope, currentScope),
    createRoutine: async () => {
      currentScope.selectionKey = 'owner-a:dog-b';
      return { status: 'saved', value: savedRoutine };
    },
    selectRoutineDay: async () => { selectionCalls += 1; return { status: 'saved', value: routineDay }; },
  });
  assert.equal(result.template.status, 'saved');
  assert.equal(result.selection, 'scope-changed');
  assert.equal(result.daySelection, undefined);
  assert.equal(selectionCalls, 0);

  for (const changedKey of ['ownerScope', 'selectionKey', 'lifetime']) {
    const nextScope = { ...capturedScope, [changedKey]: `changed-${changedKey}` };
    assert.equal(data.dailyRoutineCreationScopeMatches(capturedScope, nextScope), false, `${changedKey} is part of the captured scope`);
  }
});

test('routine completion becomes checked only from a server-confirmed timestamp', async () => {
  const itemId = checklist[0].id;
  const saved = { ...routineDay, completed_item_ids: [itemId], completed_at: '2026-10-13T08:15:00.000Z', routine_day_revision: 2 };
  const { client, requests } = localClient(({ method, url, body }) => {
    assert.equal(method, 'PATCH');
    assert.deepEqual(body, { completed_item_ids: [itemId] });
    assert.equal(url.searchParams.get('completed_at'), null);
    return jsonResponse(saved);
  });
  try {
    const result = await data.setRoutineDayCompletion(client, routineDay, itemId, true);
    assert.equal(result.status, 'saved');
    if (result.status === 'saved') {
      assert.deepEqual(result.value, saved);
      assert.ok(Number.isFinite(Date.parse(result.value.completed_at ?? '')));
    }
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('routine completion does not claim success when the write and readback are unknown', async () => {
  const { client, requests } = localClient(() => {
    return jsonResponse({ code: 'gateway_timeout', message: 'status unavailable' }, 503);
  });
  try {
    assert.deepEqual(await data.setRoutineDayCompletion(client, routineDay, checklist[0].id, true), { status: 'unknown' });
    assert.equal(requests.length, 2);
  } finally { await client.auth.dispose(); }
});

function localClient(handler) {
  const requests = [];
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      const request = {
        method: init.method ?? 'GET', url, signal: init.signal,
        body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
      };
      requests.push(request);
      return handler(request);
    } },
  });
  return { client, requests };
}

function jsonResponse(value, status = 200) { return Response.json(value, { status }); }
