import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { createClient } from '@supabase/supabase-js';

const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const workspaceData = await import('../src/data/workspace-data.ts');
hooks.deregister();

const baseUrl = 'https://local-test.supabase.invalid';
const dogId = '11111111-1111-4111-8111-111111111111';

test('month marker query is active-dog scoped and timestamp-only with complete raw timestamp keyset traversal', async () => {
  const pages = [
    [{ occurred_at: '2026-10-30T10:00:00.123456Z' }, { occurred_at: '2026-10-20T10:00:00.000000Z' }],
    [{ occurred_at: '2026-10-19T10:00:00.000000Z' }, { occurred_at: '2026-10-01T10:00:00.000000Z' }],
    [],
  ];
  const requests = [];
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      requests.push(url);
      return new Response(JSON.stringify(pages.shift()), { status: 200, headers: { 'content-type': 'application/json' } });
    } },
  });
  const previous = process.env.TZ;
  process.env.TZ = 'Europe/Stockholm';
  try {
    const markers = await workspaceData.fetchDogLogMonthMarkers(client, dogId, '2026-10', undefined, 2);
    assert.deepEqual(markers, ['2026-10-01', '2026-10-19', '2026-10-20', '2026-10-30']);
    assert.equal(requests.length, 3);
    const first = requests[0];
    assert.equal(first.pathname, '/rest/v1/dog_events');
    assert.equal(first.searchParams.get('select'), 'occurred_at');
    assert.equal(first.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(first.searchParams.get('event_type'), 'in.(pee,poop,food,sleep,awake,walk,accident,water)');
    assert.deepEqual(first.searchParams.getAll('occurred_at'), ['gte.2026-09-30T22:00:00.000Z', 'lt.2026-10-31T23:00:00.000Z']);
    assert.match(first.searchParams.get('order'), /^occurred_at\.desc,id\.desc$/);
    assert.deepEqual(requests[1].searchParams.getAll('occurred_at'), ['gte.2026-09-30T22:00:00.000Z', 'lt.2026-10-31T23:00:00.000Z', 'lt.2026-10-20T10:00:00.000000Z']);
    assert.equal([...requests[1].searchParams.keys()].some((key) => key === 'offset'), false);
    assert.equal(first.searchParams.has('service_role'), false);
  } finally {
    await client.auth.dispose();
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('a timestamp-only cursor at an equal-timestamp page boundary preserves that local-day marker', async () => {
  const repeated = '2026-10-30T10:00:00.123456Z';
  const pages = [
    [{ occurred_at: repeated }, { occurred_at: repeated }],
    [{ occurred_at: '2026-10-29T10:00:00.000000Z' }, { occurred_at: '2026-10-01T10:00:00.000000Z' }],
    [],
  ];
  const requests = [];
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      requests.push(url);
      return new Response(JSON.stringify(pages.shift()), { status: 200, headers: { 'content-type': 'application/json' } });
    } },
  });
  const previous = process.env.TZ;
  process.env.TZ = 'Europe/Stockholm';
  try {
    const markers = await workspaceData.fetchDogLogMonthMarkers(client, dogId, '2026-10', undefined, 2);
    assert.deepEqual(markers, ['2026-10-01', '2026-10-29', '2026-10-30']);
    assert.equal(requests[1].searchParams.getAll('occurred_at').slice(-1)[0], 'lt.' + repeated);
    assert.equal(requests.length, 3);
  } finally {
    await client.auth.dispose();
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('a raw microsecond timestamp is preserved as the page cursor', async () => {
  const precise = '2026-10-30T10:00:00.123456Z';
  const pages = [[{ occurred_at: precise }], []];
  const requests = [];
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      requests.push(url);
      return new Response(JSON.stringify(pages.shift()), { status: 200, headers: { 'content-type': 'application/json' } });
    } },
  });
  try {
    await workspaceData.fetchDogLogMonthMarkers(client, dogId, '2026-10', undefined, 1);
    assert.equal(requests[1].searchParams.getAll('occurred_at').slice(-1)[0], 'lt.' + precise);
  } finally {
    await client.auth.dispose();
  }
});

test('an in-flight page read observes cancellation from its parent scope', async () => {
  let markStarted;
  const started = new Promise((resolve) => { markStarted = resolve; });
  let requestSignal;
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (_input, init = {}) => await new Promise((_resolve, reject) => {
      requestSignal = init.signal;
      markStarted();
      if (requestSignal?.aborted) reject(new DOMException('Aborted', 'AbortError'));
      else requestSignal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }) },
  });
  const controller = new AbortController();
  try {
    const pending = workspaceData.fetchDogLogMonthMarkers(client, dogId, '2026-10', controller.signal, 1);
    await started;
    controller.abort();
    await assert.rejects(pending);
    assert.equal(requestSignal?.aborted, true);
  } finally {
    await client.auth.dispose();
  }
});

test('a change older than the current cursor is included in the ongoing traversal', async () => {
  let rows = ['2026-10-30T10:00:00.000000Z', '2026-10-01T10:00:00.000000Z'];
  let requestCount = 0;
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      requestCount += 1;
      const cursor = url.searchParams.getAll('occurred_at').filter((filter) => filter.startsWith('lt.')).slice(-1)[0];
      const cursorValue = cursor?.slice(3);
      const matching = rows.filter((value) => !cursorValue || value < cursorValue).sort().reverse();
      const page = matching.slice(0, 1).map((occurred_at) => ({ occurred_at }));
      if (requestCount === 1) rows = ['2026-10-29T10:00:00.000000Z', ...rows];
      return new Response(JSON.stringify(page), { status: 200, headers: { 'content-type': 'application/json' } });
    } },
  });
  try {
    const markers = await workspaceData.fetchDogLogMonthMarkers(client, dogId, '2026-10', undefined, 1);
    assert.deepEqual(markers, ['2026-10-01', '2026-10-29', '2026-10-30']);
    assert.equal(requestCount, 4);
  } finally {
    await client.auth.dispose();
  }
});
test('a new traversal sees a change that arrived before the prior timestamp cursor', async () => {
  let rows = ['2026-10-30T10:00:00.000000Z', '2026-10-01T10:00:00.000000Z'];
  let requestCount = 0;
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      requestCount += 1;
      const cursor = url.searchParams.getAll('occurred_at').filter((filter) => filter.startsWith('lt.')).slice(-1)[0];
      const cursorValue = cursor?.slice(3);
      const matching = rows.filter((value) => !cursorValue || value < cursorValue).sort().reverse();
      const page = matching.slice(0, 1).map((occurred_at) => ({ occurred_at }));
      if (requestCount === 1) rows = ['2026-10-31T10:00:00.000000Z', ...rows];
      return new Response(JSON.stringify(page), { status: 200, headers: { 'content-type': 'application/json' } });
    } },
  });
  try {
    const firstTraversal = await workspaceData.fetchDogLogMonthMarkers(client, dogId, '2026-10', undefined, 1);
    assert.deepEqual(firstTraversal, ['2026-10-01', '2026-10-30']);
    const refreshedTraversal = await workspaceData.fetchDogLogMonthMarkers(client, dogId, '2026-10', undefined, 1);
    assert.deepEqual(refreshedTraversal, ['2026-10-01', '2026-10-30', '2026-10-31']);
  } finally {
    await client.auth.dispose();
  }
});
test('month marker query never returns partial markers after a page error or abort', async () => {
  let requests = 0;
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async () => {
      requests += 1;
      return requests === 1
        ? new Response(JSON.stringify([{ occurred_at: '2026-10-30T10:00:00.000Z' }]), { status: 200, headers: { 'content-type': 'application/json' } })
        : new Response(JSON.stringify({ message: 'synthetic query failure' }), { status: 500, headers: { 'content-type': 'application/json' } });
    } },
  });
  try {
    await assert.rejects(workspaceData.fetchDogLogMonthMarkers(client, dogId, '2026-10', undefined, 1));
    assert.equal(requests, 2);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(workspaceData.fetchDogLogMonthMarkers(client, dogId, '2026-10', controller.signal, 1));
  } finally {
    await client.auth.dispose();
  }
});
