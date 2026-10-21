import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { createClient } from '@supabase/supabase-js';

const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { fetchDogInsightsEvents } = await import('../src/data/workspace-data.ts');
hooks.deregister();

const baseUrl = 'https://local-test.supabase.invalid';
const dogId = '11111111-1111-4111-8111-111111111111';
const instant = '2026-10-20T10:00:00.123456Z';

function row(number, occurredAt = instant, eventType = number % 2 ? 'pee' : 'poop') {
  return {
    id: `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`,
    event_type: eventType,
    occurred_at: occurredAt,
  };
}

function createTestClient(fetchImpl) {
  return createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetchImpl },
  });
}

async function dispose(client) {
  await client.auth.dispose();
}

test('the actual Supabase query uses the exact projection, dog/type/range filters and tuple cursor across tied timestamps', async () => {
  const firstPage = Array.from({ length: 250 }, (_, index) => row(250 - index));
  const secondPage = [row(0), row(300, '2026-10-19T10:00:00.000000Z')];
  const pages = [firstPage, secondPage];
  const requests = [];
  const client = createTestClient(async (input) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    requests.push(url);
    return new Response(JSON.stringify(pages.shift()), { status: 200, headers: { 'content-type': 'application/json' } });
  });
  try {
    const result = await fetchDogInsightsEvents(client, dogId, '2026-10-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z');
    assert.equal(result.status, 'ready');
    assert.equal(result.events.length, 252);
    const first = requests[0];
    assert.equal(first.pathname, '/rest/v1/dog_events');
    assert.equal(first.searchParams.get('select'), 'id,event_type,occurred_at');
    assert.equal(first.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(first.searchParams.get('event_type'), 'in.(pee,poop)');
    assert.deepEqual(first.searchParams.getAll('occurred_at'), ['lt.2026-11-01T00:00:00.000Z', 'gte.2026-10-01T00:00:00.000Z']);
    assert.match(first.searchParams.get('order'), /^occurred_at\.desc,id\.desc$/);
    assert.equal(first.searchParams.get('limit'), '250');
    assert.equal(first.searchParams.has('offset'), false);
    assert.equal(first.searchParams.has('service_role'), false);
    assert.equal(requests[1].searchParams.get('or'), `(occurred_at.lt.${instant},and(occurred_at.eq.${instant},id.lt.${row(1).id}))`);
    assert.equal(requests[1].searchParams.getAll('occurred_at').includes(`gte.2026-10-01T00:00:00.000Z`), true);
  } finally {
    await dispose(client);
  }
});

test('since-start caps at 10,000 without a sentinel while 9,999 completes', async (t) => {
  for (const total of [9_999, 10_000, 10_001]) {
    await t.test(`${total} available events`, async () => {
      let remaining = total;
      let nextId = total;
      let requests = 0;
      const client = createTestClient(async () => {
        requests += 1;
        const size = Math.min(250, remaining);
        const data = Array.from({ length: size }, () => row(nextId--));
        remaining -= size;
        return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
      });
      try {
        const result = await fetchDogInsightsEvents(client, dogId, null, '2026-11-01T00:00:00.000Z');
        if (total === 9_999) {
          assert.equal(result.status, 'ready');
          assert.equal(result.events.length, 9_999);
          assert.equal(requests, 40);
        } else {
          assert.equal(result.status, 'partial');
          assert.equal(result.partialReason, 'limit');
          assert.equal(result.events.length, 10_000);
          assert.equal(requests, 40);
          assert.equal(remaining, total - 10_000);
        }
      } finally {
        await dispose(client);
      }
    });
  }
});

test('request failure before the first complete page is an error', async () => {
  const client = createTestClient(async () => new Response('synthetic request failure', { status: 400 }));
  try {
    await assert.rejects(fetchDogInsightsEvents(client, dogId, null, '2026-11-01T00:00:00.000Z'));
  } finally {
    await dispose(client);
  }
});

test('transport failure after one complete page yields retryable partial coverage', async () => {
  const pages = [Array.from({ length: 250 }, (_, index) => row(250 - index))];
  let requests = 0;
  const client = createTestClient(async () => {
    requests += 1;
    const page = pages.shift();
    return page
      ? new Response(JSON.stringify(page), { status: 200, headers: { 'content-type': 'application/json' } })
      : new Response('synthetic request failure', { status: 400 });
  });
  try {
    const result = await fetchDogInsightsEvents(client, dogId, null, '2026-11-01T00:00:00.000Z');
    assert.equal(result.status, 'partial');
    assert.equal(result.partialReason, 'read-error');
    assert.equal(result.events.length, 250);
    assert.equal(requests, 2);
  } finally {
    await dispose(client);
  }
});

test('the deadline is cumulative across pages instead of restarting for each request', async () => {
  const firstPage = Array.from({ length: 250 }, (_, index) => row(250 - index));
  let request = 0;
  let now = 10_000;
  const timerDelays = [];
  const client = createTestClient(async () => {
    request += 1;
    if (request === 1) {
      now += 800;
      return new Response(JSON.stringify(firstPage), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
  });
  const originalNow = Date.now;
  const originalSetTimeout = globalThis.setTimeout;
  Date.now = () => now;
  globalThis.setTimeout = ((callback, delay, ...args) => {
    timerDelays.push(delay);
    return originalSetTimeout(callback, delay, ...args);
  });
  try {
    const result = await fetchDogInsightsEvents(client, dogId, null, '2026-11-01T00:00:00.000Z', undefined, 1_000);
    assert.equal(result.status, 'ready');
    assert.equal(request, 2);
    assert.deepEqual(timerDelays.slice(0, 2), [1_000, 200]);
  } finally {
    Date.now = originalNow;
    globalThis.setTimeout = originalSetTimeout;
    await dispose(client);
  }
});

test('timeout before the first page is an error and after a complete page is partial', async (t) => {
  await t.test('before first page', async () => {
    const client = createTestClient(async (_input, init = {}) => await new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')), { once: true });
    }));
    try {
      await assert.rejects(fetchDogInsightsEvents(client, dogId, null, '2026-11-01T00:00:00.000Z', undefined, 25));
    } finally {
      await dispose(client);
    }
  });
  await t.test('after a complete page', async () => {
    let request = 0;
    const firstPage = Array.from({ length: 250 }, (_, index) => row(250 - index));
    const client = createTestClient(async (_input, init = {}) => {
      request += 1;
      if (request === 1) return new Response(JSON.stringify(firstPage), { status: 200, headers: { 'content-type': 'application/json' } });
      return await new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')), { once: true });
      });
    });
    try {
      const result = await fetchDogInsightsEvents(client, dogId, null, '2026-11-01T00:00:00.000Z', undefined, 25);
      assert.equal(result.status, 'partial');
      assert.equal(result.partialReason, 'timeout');
      assert.equal(result.events.length, 250);
      assert.equal(request, 2);
    } finally {
      await dispose(client);
    }
  });
});

test('duplicate and non-progressing rows cannot make traversal report success', async (t) => {
  const first = Array.from({ length: 250 }, (_, index) => row(250 - index));
  for (const [name, second] of [
    ['duplicate id', [row(250)]],
    ['non-progressing tie cursor', [row(1)]],
    ['out-of-order id', [row(2)]],
  ]) {
    await t.test(name, async () => {
      const pages = [first, second];
      const client = createTestClient(async () => new Response(JSON.stringify(pages.shift()), { status: 200, headers: { 'content-type': 'application/json' } }));
      try {
        await assert.rejects(fetchDogInsightsEvents(client, dogId, null, '2026-11-01T00:00:00.000Z'), /cursor did not advance/);
      } finally {
        await dispose(client);
      }
    });
  }
});

test('an aborted active scope rejects instead of returning partial data', async () => {
  let requestStarted;
  const started = new Promise((resolve) => { requestStarted = resolve; });
  const client = createTestClient(async (_input, init = {}) => await new Promise((_resolve, reject) => {
    requestStarted();
    init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  const controller = new AbortController();
  try {
    const read = fetchDogInsightsEvents(client, dogId, null, '2026-11-01T00:00:00.000Z', controller.signal);
    await started;
    controller.abort();
    await assert.rejects(read);
  } finally {
    controller.abort();
    await dispose(client);
  }
});
