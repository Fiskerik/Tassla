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
const routine = { id: '22222222-2222-4222-8222-222222222222', dog_id: dogId, label: 'Morgonrunda' };
const routineDay = { id: '33333333-3333-4333-8333-333333333333', dog_id: dogId, routine_id: routine.id, date_key: dateKey, time_zone: 'Europe/Stockholm', completed_at: null };
const trainingSelection = { id: '44444444-4444-4444-8444-444444444444', dog_id: dogId, program_version_id: '55555555-5555-4555-8555-555555555555', step_id: '66666666-6666-4666-8666-666666666666', date_key: dateKey, time_zone: 'Europe/Stockholm' };

test('daily activity snapshot rejects partial responses and enforces requested dog/date scope', async () => {
  const { client, requests } = localClient(({ url }) => {
    if (url.pathname.endsWith('/dog_daily_routines')) return jsonResponse([routine]);
    if (url.pathname.endsWith('/dog_daily_routine_days')) return jsonResponse([routineDay]);
    if (url.pathname.endsWith('/dog_daily_training_selections')) return jsonResponse([trainingSelection]);
    throw new Error(`Unexpected request ${url.pathname}`);
  });
  try {
    assert.deepEqual(await data.fetchDailyActivitySnapshot(client, dogId, dateKey), {
      routines: [routine], routineDays: [routineDay], trainingSelections: [trainingSelection],
    });
    assert.equal(requests.length, 3);
    assert.ok(requests.every(({ url }) => url.searchParams.get('dog_id') === `eq.${dogId}`));
    assert.ok(requests.filter(({ url }) => !url.pathname.endsWith('/dog_daily_routines')).every(({ url }) => url.searchParams.get('date_key') === `eq.${dateKey}`));
  } finally { await client.auth.dispose(); }

  const { client: foreignClient } = localClient(({ url }) => url.pathname.endsWith('/dog_daily_routines')
    ? jsonResponse([routine])
    : jsonResponse([{ ...routineDay, dog_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }]));
  try {
    await assert.rejects(data.fetchDailyActivitySnapshot(foreignClient, dogId, dateKey), /Could not load daily routine selections/);
  } finally { await foreignClient.auth.dispose(); }
});

test('routine create recovers a lost response only after exact owner/id/label readback', async () => {
  const { client, requests } = localClient(async ({ method, url, body }) => {
    if (method === 'POST') {
      assert.equal(url.pathname, '/rest/v1/dog_daily_routines');
      assert.deepEqual(body, routine);
      throw new TypeError('simulated lost response after server commit');
    }
    assert.equal(method, 'GET');
    return jsonResponse(routine);
  });
  try {
    assert.deepEqual(await data.createDailyRoutine(client, routine), { status: 'saved', value: routine });
    assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET']);
  } finally { await client.auth.dispose(); }

  const { client: mismatchClient } = localClient(({ method }) => method === 'POST'
    ? jsonResponse({ code: '23505', message: 'duplicate key' }, 409)
    : jsonResponse({ ...routine, label: 'Annan rutin' }));
  try {
    assert.deepEqual(await data.createDailyRoutine(mismatchClient, routine), { status: 'failed' });
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

test('routine completion becomes checked only from a server-confirmed timestamp', async () => {
  const saved = { ...routineDay, completed_at: '2026-10-13T08:15:00.000Z' };
  const { client, requests } = localClient(({ method, url, body }) => {
    assert.equal(method, 'PATCH');
    assert.equal(url.searchParams.get('completed_at'), 'is.null');
    assert.ok(Number.isFinite(Date.parse(body.completed_at)));
    return jsonResponse({ ...saved, completed_at: body.completed_at });
  });
  try {
    const result = await data.setRoutineDayCompletion(client, routineDay, true);
    assert.equal(result.status, 'saved');
    if (result.status === 'saved') {
      assert.deepEqual(result.value, { ...saved, completed_at: result.value.completed_at });
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
    assert.deepEqual(await data.setRoutineDayCompletion(client, routineDay, true), { status: 'unknown' });
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
