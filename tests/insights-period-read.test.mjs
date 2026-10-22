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

const dogId = '11111111-1111-4111-8111-111111111111';
const response = {
  period: 'week', timezone: 'Europe/Stockholm', asOf: '2026-10-22T12:00:00.000Z',
  periodStartLocal: '2026-10-19', periodEndExclusiveLocal: '2026-10-26',
  observedThroughLocal: '2026-10-22', firstLogDay: null, bucket: 'day',
  days: [],
};

function localClient(handler) {
  const requests = [];
  const client = createClient('https://local-test.supabase.invalid', 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      const request = { method: init.method ?? 'GET', url, signal: init.signal, body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined };
      requests.push(request);
      return handler(request);
    } },
  });
  return { client, requests };
}

test('Insights adapter requests exactly one selected period through the existing RPC client', async () => {
  const { client, requests } = localClient((request) => {
    assert.equal(request.method, 'POST');
    assert.equal(request.url.pathname, '/rest/v1/rpc/dog_event_insights');
    assert.deepEqual(request.body, { p_dog_id: dogId, p_period: 'week', p_timezone: 'Europe/Stockholm' });
    return Response.json(response);
  });
  try {
    assert.deepEqual(await workspaceData.fetchDogEventInsights(client, dogId, 'week', 'Europe/Stockholm'), response);
    assert.equal(requests.length, 1, 'there is no prefetch for another period');
    assert.ok(requests[0].signal instanceof AbortSignal);
  } finally {
    await client.auth.dispose();
  }
});

test('Insights adapter rejects RPC failures and empty results without returning stale data', async () => {
  for (const handler of [
    () => Response.json({ code: '42501', message: 'permission denied' }, { status: 403 }),
    () => Response.json(null),
  ]) {
    const { client } = localClient(handler);
    try {
      await assert.rejects(workspaceData.fetchDogEventInsights(client, dogId, 'month', 'UTC'));
    } finally {
      await client.auth.dispose();
    }
  }
});

test('Insights adapter forwards cancellation to the in-flight RPC request', async () => {
  let requestSignal;
  let abortObserved = false;
  const { client } = localClient((request) => {
    requestSignal = request.signal;
    return new Promise((_resolve, reject) => request.signal.addEventListener('abort', () => {
      abortObserved = true;
      reject(new DOMException('aborted', 'AbortError'));
    }, { once: true }));
  });
  const controller = new AbortController();
  try {
    const pending = workspaceData.fetchDogEventInsights(client, dogId, 'since_first_log', 'UTC', controller.signal);
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();
    await assert.rejects(pending);
    assert.ok(requestSignal instanceof AbortSignal);
    assert.equal(requestSignal.aborted, true);
    assert.equal(abortObserved, true);
  } finally {
    await client.auth.dispose();
  }
});
