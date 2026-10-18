import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { createClient } from '@supabase/supabase-js';

const tsResolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
const workspaceData = await import('../src/data/workspace-data.ts');
tsResolution.deregister();

const baseUrl = 'https://local-test.supabase.invalid';
const dogId = '11111111-1111-4111-8111-111111111111';

test('upcoming health plans are dog-scoped, date-filtered before the 40-row cap, minimal and read-only', async () => {
  const rows = [
    { id: '22222222-2222-4222-8222-222222222221', dog_id: dogId, event_type: 'vaccination', due_on: '2026-10-15', due_time: '09:30', description: 'Påfyllnad' },
    { id: '22222222-2222-4222-8222-222222222222', dog_id: dogId, event_type: 'vet_visit', due_on: '2026-10-20', due_time: null, description: null },
  ];
  const { client, requests } = localClient(({ method, url }) => {
    assert.equal(method, 'GET');
    assert.equal(url.pathname, '/rest/v1/dog_health_plans');
    assert.equal(url.searchParams.get('select'), 'id,dog_id,event_type,due_on,due_time,description');
    assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(url.searchParams.get('due_on'), 'gt.2026-10-13');
    assert.equal(url.searchParams.get('limit'), '40');
    const order = url.searchParams.get('order')?.split(',') ?? [];
    assert.deepEqual(order, ['due_on.asc', 'id.asc']);
    return jsonResponse(rows);
  });
  try {
    assert.deepEqual(await workspaceData.fetchUpcomingPlannedHealth(client, dogId, '2026-10-13'), [
      { ...rows[0], due_time: '09:30' }, rows[1],
    ]);
    assert.deepEqual(requests.map(({ method, url }) => [method, url.pathname]), [
      ['GET', '/rest/v1/dog_health_plans'],
    ]);
  } finally { await client.auth.dispose(); }
});

test('upcoming health reader rejects invalid local dates and foreign or non-future rows without extra requests', async () => {
  const { client, requests } = localClient(({ method, url }) => {
    assert.equal(method, 'GET');
    assert.equal(url.pathname, '/rest/v1/dog_health_plans');
    return jsonResponse([{ id: '22222222-2222-4222-8222-222222222222', dog_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      event_type: 'vaccination', due_on: '2026-10-15', due_time: null, description: null }]);
  });
  try {
    await assert.rejects(workspaceData.fetchUpcomingPlannedHealth(client, dogId, '2026-10-13'), /Could not load upcoming planned health/);
    await assert.rejects(workspaceData.fetchUpcomingPlannedHealth(client, dogId, '2026-02-30'), /Invalid upcoming health scope/);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url.pathname, '/rest/v1/dog_health_plans');
  } finally { await client.auth.dispose(); }

  const { client: sameDayClient, requests: sameDayRequests } = localClient(() => jsonResponse([
    { id: '22222222-2222-4222-8222-222222222223', dog_id: dogId, event_type: 'vet_visit', due_on: '2026-10-13', due_time: null, description: null },
  ]));
  try {
    await assert.rejects(workspaceData.fetchUpcomingPlannedHealth(sameDayClient, dogId, '2026-10-13'), /Could not load upcoming planned health/);
    assert.equal(sameDayRequests.length, 1);
  } finally { await sameDayClient.auth.dispose(); }
});

test('dog-event history filters the supported everyday types and has deterministic owner-scoped pagination order', async () => {
  const event = {
    id: '22222222-2222-4222-8222-222222222222',
    dog_id: dogId,
    event_type: 'walk',
    occurred_at: '2026-10-04T10:00:00.000Z',
    occurred_on: null,
    weight_kg: null,
    duration_minutes: 12,
    description: null,
    accident_kinds: null,
  };
  const { client, requests } = localClient(({ method, url }) => {
    assert.equal(method, 'GET');
    assert.equal(url.pathname, '/rest/v1/dog_events');
    assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(url.searchParams.get('event_type'), 'in.(pee,poop,food,sleep,awake,walk,accident,water)');
    const order = url.searchParams.get('order')?.split(',') ?? [];
    assert.ok(order.includes('occurred_at.desc'));
    assert.ok(order.some((value) => /^id\.(asc|desc)$/.test(value)), 'stable event ID tie-breaker is required');
    assert.equal(url.searchParams.get('offset'), '40');
    assert.equal(url.searchParams.get('limit'), '20');
    return jsonResponse([event]);
  });

  try {
    assert.deepEqual(await workspaceData.fetchDogEvents(client, dogId, 40, 20), [event]);
    assert.equal(requests.length, 1);
  } finally {
    await client.auth.dispose();
  }
});

test('recovers an uncertain event update when the server returns an equivalent timestamp format', async () => {
  const changes = {
    event_type: 'walk',
    occurred_at: '2026-10-04T10:00:00.000Z',
    duration_minutes: 15,
    description: 'kort runda',
    accident_kinds: null,
  };
  const serverRow = {
    id: '55555555-5555-4555-8555-555555555555',
    dog_id: dogId,
    event_type: 'walk',
    occurred_at: '2026-10-04T12:00:00+02:00',
    occurred_on: null,
    weight_kg: null,
    duration_minutes: 15,
    description: 'kort runda',
    accident_kinds: null,
  };
  const { client, requests } = localClient(async (request) => {
    if (request.method === 'PATCH') {
      assert.deepEqual(request.body, changes);
      throw new TypeError('simulated lost update response after server commit');
    }
    assert.equal(request.method, 'GET');
    assert.equal(request.url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(request.url.searchParams.get('id'), `eq.${serverRow.id}`);
    return jsonResponse(serverRow);
  });

  try {
    const result = await workspaceData.updateDogEvent(
      client,
      dogId,
      serverRow.id,
      changes,
    );

    assert.deepEqual(result, { status: 'saved', value: serverRow });
    assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
  } finally {
    await client.auth.dispose();
  }
});

test('recovers an event insert after response loss by reading the same stable UUID', async () => {
  const storedEvents = new Map();
  const { client, requests } = localClient(async (request) => {
    if (request.method === 'POST' && request.url.pathname === '/rest/v1/dog_events') {
      const input = request.body;
      assert.deepEqual(input, {
        id: '22222222-2222-4222-8222-222222222222',
        dog_id: dogId,
        event_type: 'pee',
        occurred_at: '2026-10-04T10:00:00.000Z',
        duration_minutes: null,
        description: null,
        accident_kinds: null,
      });
      const saved = { ...input, occurred_on: null, weight_kg: null };
      storedEvents.set(input.id, saved);
      throw new TypeError('simulated lost response after server commit');
    }

    assert.equal(request.method, 'GET');
    assert.equal(request.url.pathname, '/rest/v1/dog_events');
    assert.equal(request.url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(request.url.searchParams.get('id'), 'eq.22222222-2222-4222-8222-222222222222');
    return jsonResponse(storedEvents.get('22222222-2222-4222-8222-222222222222') ?? null);
  });

  try {
    const result = await workspaceData.insertDogEvent(client, {
      id: '22222222-2222-4222-8222-222222222222',
      dog_id: dogId,
      event_type: 'pee',
      occurred_at: '2026-10-04T10:00:00.000Z',
      duration_minutes: null,
      description: null,
      accident_kinds: null,
    });

    assert.equal(result.status, 'saved');
    assert.equal(result.value.id, '22222222-2222-4222-8222-222222222222');
    assert.equal(requests.filter(({ method }) => method === 'POST').length, 1);
    assert.equal(requests.filter(({ method }) => method === 'GET').length, 1);
  } finally {
    await client.auth.dispose();
  }
});

test('does not report an event as saved after a definite database rejection', async () => {
  const { client, requests } = localClient(({ method }) => method === 'POST'
    ? jsonResponse({ code: '23514', message: 'database constraint rejected the row' }, 400)
    : jsonResponse(null));

  try {
    const result = await workspaceData.insertDogEvent(client, {
      id: '44444444-4444-4444-8444-444444444444',
      dog_id: dogId,
      event_type: 'pee',
      occurred_at: '2026-10-04T10:00:00.000Z',
      duration_minutes: null,
      description: null,
      accident_kinds: null,
    });

    assert.deepEqual(result, { status: 'failed' });
    assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET']);
  } finally {
    await client.auth.dispose();
  }
});

test('marks a timed out event insert unknown and forwards the real SDK abort signal', async () => {
  let insertSignal;
  let abortObserved = false;
  const { client, requests } = localClient((request) => {
    if (request.method === 'POST') {
      insertSignal = request.signal;
      return new Promise((_resolve, reject) => {
        insertSignal.addEventListener('abort', () => {
          abortObserved = true;
          reject(new DOMException('aborted', 'AbortError'));
        }, { once: true });
      });
    }
    return jsonResponse(null);
  });

  try {
    const result = await workspaceData.insertDogEvent(client, {
      id: '33333333-3333-4333-8333-333333333333',
      dog_id: dogId,
      event_type: 'walk',
      occurred_at: '2026-10-04T10:00:00.000Z',
      duration_minutes: 12,
      description: null,
      accident_kinds: null,
    }, 15);

    assert.equal(result.status, 'unknown');
    assert.ok(insertSignal instanceof AbortSignal);
    assert.equal(insertSignal.aborted, true);
    assert.equal(abortObserved, true);
    assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET']);
  } finally {
    await client.auth.dispose();
  }
});

test('training hides ungranted current versions and keeps only a safe count for older progress', async () => {
  const oldVersion = versionRow({
    id: '62000000-0000-4000-8000-000000000009',
    contentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    version: 1,
    title: 'SENTINEL: ska inte visas',
  });
  const newVersion = versionRow({
    id: '62000000-0000-4000-8000-000000000001',
    contentId: oldVersion.content_id,
    version: 2,
    title: 'SENTINEL: ny nekad version',
  });
  const finishedStep = {
    dog_id: dogId,
    program_version_id: oldVersion.id,
    step_id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    completed_at: '2026-10-04T10:00:00.000Z',
  };
  const { client, requests } = localClient(async ({ method, url }) => {
    if (url.pathname === '/rest/v1/content_versions') {
      assert.equal(method, 'GET');
      assert.equal(url.searchParams.get('status'), 'eq.published');
      return jsonResponse([oldVersion, newVersion]);
    }
    if (url.pathname === '/rest/v1/training_progress') {
      assert.equal(method, 'GET');
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      return jsonResponse([finishedStep]);
    }
    throw new Error(`Unexpected request ${method} ${url.pathname}`);
  });

  try {
    const result = await workspaceData.fetchTrainingWorkspace(client, {
      id: dogId,
      name: 'Milo',
      breed_id: 'mixed',
      birth_date: '2026-08-01',
    }, 10);

    assert.deepEqual(result.programs, []);
    assert.deepEqual(result.recommendedPrograms, []);
    assert.deepEqual(result.allPrograms, []);
    assert.equal(result.selectionStatus, 'empty');
    assert.equal(result.recommendedSelectionStatus, 'empty');
    assert.equal(result.allSelectionStatus, 'empty');
    assert.deepEqual(result.paused, [{ versionId: oldVersion.id, completedCount: 1 }]);
    assert.equal(JSON.stringify(result).includes('SENTINEL'), false);
    assert.equal(requests.some(({ url }) => url.pathname === '/rest/v1/training_steps'), false);
    assert.ok(requests.every(({ method }) => method === 'GET'));
  } finally {
    await client.auth.dispose();
  }
});

test('training workspace stays empty when there are no published programs', async () => {
  const { client, requests } = localClient(async ({ method, url }) => {
    assert.equal(method, 'GET');
    if (url.pathname === '/rest/v1/content_versions') {
      assert.equal(url.searchParams.get('status'), 'eq.published');
      return jsonResponse([]);
    }
    if (url.pathname === '/rest/v1/training_progress') {
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      return jsonResponse([]);
    }
    throw new Error(`Unexpected request ${url.pathname}`);
  });

  try {
    const result = await workspaceData.fetchTrainingWorkspace(client, {
      id: dogId,
      name: 'Milo',
      breed_id: 'mixed',
      birth_date: '2026-08-01',
    }, 10);
    assert.deepEqual(result, {
      programs: [], recommendedPrograms: [], allPrograms: [], paused: [],
      selectionStatus: 'empty', recommendedSelectionStatus: 'empty', allSelectionStatus: 'empty',
    });
    assert.equal(requests.some(({ url }) => url.pathname === '/rest/v1/training_steps'), false);
  } finally {
    await client.auth.dispose();
  }
});

test('keeps progress for a withdrawn or unavailable published version as paused history', async () => {
  const unavailableVersionId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1';
  const progress = [
    { dog_id: dogId, program_version_id: unavailableVersionId, step_id: 'ffffffff-ffff-4fff-8fff-fffffffffff1', completed_at: '2026-10-04T10:00:00.000Z' },
    { dog_id: dogId, program_version_id: unavailableVersionId, step_id: 'ffffffff-ffff-4fff-8fff-fffffffffff2', completed_at: '2026-10-04T11:00:00.000Z' },
  ];
  const { client, requests } = localClient(({ method, url }) => {
    assert.equal(method, 'GET');
    if (url.pathname === '/rest/v1/content_versions') return jsonResponse([]);
    if (url.pathname === '/rest/v1/training_progress') {
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      return jsonResponse(progress);
    }
    throw new Error(`Unexpected request ${url.pathname}`);
  });

  try {
    const result = await workspaceData.fetchTrainingWorkspace(client, {
      id: dogId,
      name: 'Milo',
      breed_id: 'mixed',
      birth_date: '2026-08-01',
    }, 10);

    assert.deepEqual(result.programs, []);
    assert.deepEqual(result.recommendedPrograms, []);
    assert.deepEqual(result.allPrograms, []);
    assert.equal(result.recommendedSelectionStatus, 'empty');
    assert.equal(result.allSelectionStatus, 'empty');
    assert.deepEqual(result.paused, [{ versionId: unavailableVersionId, completedCount: 2 }]);
    assert.equal(requests.some(({ url }) => url.pathname === '/rest/v1/training_steps'), false);
    assert.equal(requests.some(({ method }) => method === 'DELETE' || method === 'PATCH'), false);
  } finally {
    await client.auth.dispose();
  }
});

test('training progress insert and delete reconcile uncertain outcomes by the full versioned key', async () => {
  const row = {
    dog_id: dogId,
    program_version_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    step_id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  };
  let savedProgress = null;
  const { client, requests } = localClient(async (request) => {
    const { method, url } = request;
    if (url.pathname !== '/rest/v1/training_progress') throw new Error(`Unexpected path ${url.pathname}`);
    if (method === 'POST') {
      assert.deepEqual(request.body, row);
      savedProgress = { ...row, completed_at: '2026-10-04T10:00:00.000Z' };
      throw new TypeError('simulated lost response after server commit');
    }
    assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(url.searchParams.get('program_version_id'), `eq.${row.program_version_id}`);
    assert.equal(url.searchParams.get('step_id'), `eq.${row.step_id}`);
    if (method === 'GET') return jsonResponse(savedProgress);
    if (method === 'DELETE') {
      savedProgress = null;
      throw new TypeError('simulated lost delete response');
    }
    throw new Error(`Unexpected method ${method}`);
  });

  try {
    const inserted = await workspaceData.insertTrainingProgress(client, row);
    assert.equal(inserted.status, 'saved');
    assert.deepEqual(inserted.value, { ...row, completed_at: '2026-10-04T10:00:00.000Z' });
    assert.equal(requests.some(({ method }) => method === 'PATCH'), false);
    assert.equal(requests.filter(({ method }) => method === 'POST').length, 1);

    const deleted = await workspaceData.deleteTrainingProgress(
      client,
      row.dog_id,
      row.program_version_id,
      row.step_id,
    );
    assert.deepEqual(deleted, { status: 'saved', value: null });
    assert.equal(requests.some(({ method }) => method === 'PATCH'), false);
    assert.equal(requests.at(-1).method, 'GET');
  } finally {
    await client.auth.dispose();
  }
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
          headersPrefer: new Headers(init.headers).get('prefer'),
          body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
        };
        requests.push(request);
        return handler(request);
      },
    },
  });
  return { client, requests };
}

function jsonResponse(value, status = 200) {
  return Response.json(value, { status });
}

function versionRow({ id, contentId, version, title }) {
  return {
    id,
    content_id: contentId,
    version,
    status: 'published',
    title,
    body: 'Introduktion, stopp och begränsningar.',
    min_age_weeks: 0,
    max_age_weeks: null,
    sources: ['https://example.test/source'],
    content_items: { slug: 'handling-program', content_type: 'training_program' },
    content_breed_targets: [],
  };
}
test('dog insight page selects only supported fields, exact count, dog scope and stable event order', async () => {
  const row = { id: 'insight-1', dog_id: dogId, event_type: 'pee', occurred_at: '2026-10-18T08:00:00.000Z', accident_kinds: null };
  const { client, requests } = localClient(({ method, url }) => {
    assert.equal(method, 'GET');
    assert.equal(url.pathname, '/rest/v1/dog_events');
    assert.equal(url.searchParams.get('select'), 'id,dog_id,event_type,occurred_at,accident_kinds');
    assert.equal(url.searchParams.get('dog_id'), 'eq.' + dogId);
    assert.equal(url.searchParams.get('event_type'), 'in.(pee,poop,accident)');
    assert.deepEqual(url.searchParams.get('order')?.split(','), ['occurred_at.desc', 'id.desc']);
    assert.equal(url.searchParams.get('offset'), '0');
    assert.equal(url.searchParams.get('limit'), '200');
    assert.ok(requests[0].headersPrefer?.includes('count=exact'));
    return jsonCountResponse([row], 1);
  });
  try {
    const page = await workspaceData.fetchDogInsightEventsPage(client, dogId);
    assert.deepEqual(page, { rows: [row], count: 1, offset: 0 });
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('dog insight reader exhausts pages and validates the stable total count', async () => {
  const rows = [
    { id: 'insight-1', dog_id: dogId, event_type: 'pee', occurred_at: '2026-10-18T08:00:00.000Z', accident_kinds: null },
    { id: 'insight-2', dog_id: dogId, event_type: 'poop', occurred_at: '2026-10-17T08:00:00.000Z', accident_kinds: null },
    { id: 'insight-3', dog_id: dogId, event_type: 'accident', occurred_at: '2026-10-16T08:00:00.000Z', accident_kinds: ['poop'] },
  ];
  const { client, requests } = localClient(({ url }) => {
    const offset = Number(url.searchParams.get('offset'));
    return jsonCountResponse(rows.slice(offset, offset + 2), 3);
  });
  try {
    assert.deepEqual(await workspaceData.fetchAllDogInsightEvents(client, dogId, undefined, 2), rows);
    assert.deepEqual(requests.map(({ url }) => url.searchParams.get('offset')), ['0', '2']);
  } finally { await client.auth.dispose(); }
});

test('dog insight reader rejects count drift, duplicate IDs and incomplete pages', async () => {
  const row = { id: 'insight-1', dog_id: dogId, event_type: 'pee', occurred_at: '2026-10-18T08:00:00.000Z', accident_kinds: null };
  const changed = localClient(({ url }) => Number(url.searchParams.get('offset')) === 0
    ? jsonCountResponse([row, { ...row, id: 'insight-2' }], 3)
    : jsonCountResponse([{ ...row, id: 'insight-3' }], 4));
  try {
    await assert.rejects(workspaceData.fetchAllDogInsightEvents(changed.client, dogId, undefined, 2), /changed while paging/);
  } finally { await changed.client.auth.dispose(); }

  const duplicate = localClient(({ url }) => Number(url.searchParams.get('offset')) === 0
    ? jsonCountResponse([row], 2)
    : jsonCountResponse([row], 2));
  try {
    await assert.rejects(workspaceData.fetchAllDogInsightEvents(duplicate.client, dogId, undefined, 1), /duplicate row/);
  } finally { await duplicate.client.auth.dispose(); }

  const incomplete = localClient(() => jsonCountResponse([], 1));
  try {
    await assert.rejects(workspaceData.fetchAllDogInsightEvents(incomplete.client, dogId, undefined, 1), /incomplete/);
  } finally { await incomplete.client.auth.dispose(); }
});

test('dog insight reader rejects foreign dogs and malformed accident categories', async () => {
  for (const row of [
    { id: 'insight-1', dog_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', event_type: 'pee', occurred_at: '2026-10-18T08:00:00.000Z', accident_kinds: null },
    { id: 'insight-2', dog_id: dogId, event_type: 'accident', occurred_at: '2026-10-18T08:00:00.000Z', accident_kinds: ['food'] },
  ]) {
    const { client } = localClient(() => jsonCountResponse([row], 1));
    try { await assert.rejects(workspaceData.fetchDogInsightEventsPage(client, dogId), /Could not load dog insight events/); }
    finally { await client.auth.dispose(); }
  }
});

test('dog insight page forwards route cancellation to the Supabase request', async () => {
  const controller = new AbortController();
  let observedSignal;
  let started;
  const startedPromise = new Promise((resolve) => { started = resolve; });
  const { client } = localClient(({ signal }) => {
    observedSignal = signal;
    started();
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true }));
  });
  try {
    const pending = workspaceData.fetchDogInsightEventsPage(client, dogId, 0, 200, 5000, controller.signal);
    await startedPromise;
    controller.abort();
    await assert.rejects(pending);
    assert.ok(observedSignal?.aborted);
  } finally { await client.auth.dispose(); }
});

function jsonCountResponse(data, count, status = 200) {
  const contentRange = data.length ? '0-' + (data.length - 1) + '/' + count : '*/' + count;
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'content-range': contentRange } });
}
