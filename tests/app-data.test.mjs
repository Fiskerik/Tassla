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
const { createDog, fetchBreeds, ownedDogAttributionMatches } = await import('../src/data/app-data.ts');
tsResolution.deregister();

const projectUrl = 'https://local-test.supabase.invalid';

test('the installed PostgREST client forwards an abort signal to the create_dog RPC fetch', async () => {
  let requestSignal;
  const client = createClient(projectUrl, 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (_input, init = {}) => new Promise((_resolve, reject) => {
        requestSignal = init.signal;
        requestSignal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
      }),
    },
  });
  const controller = new AbortController();

  const pending = client.rpc('create_dog', {
    dog_name: 'Synthetic',
    dog_breed_id: 'unknown',
    dog_birth_date: '2026-08-01',
    kennel_code: null,
  }).abortSignal(controller.signal).then((result) => result);

  try {
    await new Promise((resolve) => setImmediate(resolve));
    await Promise.resolve();
    assert.ok(requestSignal instanceof AbortSignal);
    assert.equal(requestSignal.aborted, false);

    controller.abort();

    assert.equal(requestSignal.aborted, true);
    assert.ok((await pending).error);
  } finally {
    await client.auth.dispose();
  }
});

test('loads breeds through the installed Supabase client and requests a stable name order', async () => {
  const breeds = [{ id: 'beagle', name: 'Beagle' }, { id: 'mixed', name: 'Blandras' }];
  const { client, requests } = localClient((request) => {
    assert.equal(request.method, 'GET');
    assert.equal(request.url.pathname, '/rest/v1/breeds');
    assert.equal(request.url.searchParams.get('select'), 'id,name');
    assert.equal(request.url.searchParams.get('order'), 'name.asc');
    assert.ok(request.signal instanceof AbortSignal);
    return Response.json(breeds);
  });

  try {
    assert.deepEqual(await fetchBreeds(client), breeds);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].signal.aborted, false);
  } finally {
    await client.auth.dispose();
  }
});

test('fails the breed request at its 12-second deadline and aborts the real SDK fetch', async (t) => {
  let requestSignal;
  let abortObserved = false;
  const { client, requests } = localClient((request) => {
    requestSignal = request.signal;
    return new Promise((_resolve, reject) => {
      requestSignal.addEventListener('abort', () => {
        abortObserved = true;
        reject(new DOMException('aborted', 'AbortError'));
      }, { once: true });
    });
  });

  t.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const pending = fetchBreeds(client);
    await new Promise((resolve) => setImmediate(resolve));
    assert.ok(requestSignal instanceof AbortSignal, 'the installed SDK fetch receives the production deadline signal');
    assert.equal(requestSignal.aborted, false);
    assert.equal(requests.length, 1);

    t.mock.timers.tick(11_999);
    assert.equal(requestSignal.aborted, false, 'the request remains active before the deadline');
    t.mock.timers.tick(1);

    await assert.rejects(pending, { message: 'Could not load breeds' });
    assert.equal(requestSignal.aborted, true);
    assert.equal(abortObserved, true);
    assert.equal(requests.length, 1);
  } finally {
    t.mock.timers.reset();
    await client.auth.dispose();
  }
});

test('createDog forwards the optional normalized kennel code and returns the created id', async () => {
  const { client, requests } = localClient((request) => Response.json('33000000-0000-4000-8000-000000000001'));
  try {
    assert.equal(await createDog(client, { name: ' Nala ', breedId: 'beagle', birthDate: '2026-02-01', kennelCode: ' kennel-42 ' }), '33000000-0000-4000-8000-000000000001');
    assert.equal(requests[0].url.pathname, '/rest/v1/rpc/create_dog');
    assert.deepEqual(requests[0].body, { dog_name: 'Nala', dog_breed_id: 'beagle', dog_birth_date: '2026-02-01', kennel_code: 'KENNEL-42' });
  } finally { await client.auth.dispose(); }
});

test('attribution readback calls only the owner-scoped boolean RPC', async () => {
  const { client, requests } = localClient((request) => Response.json(true));
  try {
    assert.equal(await ownedDogAttributionMatches(client, '33000000-0000-4000-8000-000000000001', 'KENNEL-42'), true);
    assert.equal(requests[0].url.pathname, '/rest/v1/rpc/owned_dog_attribution_matches');
    assert.deepEqual(requests[0].body, { requested_dog_id: '33000000-0000-4000-8000-000000000001', requested_kennel_code: 'KENNEL-42' });
  } finally { await client.auth.dispose(); }
});

function localClient(handler) {
  const requests = [];
  const client = createClient(projectUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: async (input, init = {}) => {
        const url = new URL(typeof input === 'string' ? input : input.url);
        const request = {
          method: init.method ?? 'GET',
          url,
          signal: init.signal,
          body: init.body ? JSON.parse(String(init.body)) : undefined,
        };
        requests.push(request);
        return handler(request);
      },
    },
  });
  return { client, requests };
}
