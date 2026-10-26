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
const { checkOwnedDogDeletionStatus, createDog, deleteOwnedDogProfile, fetchBreeds, fetchOwnedDogAttribution, ownedDogAttributionMatches, RetiredDogCreationRequestError, updateOwnedDogAttribution } = await import('../src/data/app-data.ts');
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

test('createDog uses the idempotent RPC, normalizes the optional kennel code, and returns the created id', async () => {
  const { client, requests } = localClient((request) => Response.json('33000000-0000-4000-8000-000000000001'));
  const requestId = '44000000-0000-4000-8000-000000000001';
  try {
    assert.equal(await createDog(client, { name: ' Nala ', breedId: 'beagle', birthDate: '2026-02-01', kennelCode: ' kennel-42 ' }, requestId), '33000000-0000-4000-8000-000000000001');
    assert.equal(requests[0].url.pathname, '/rest/v1/rpc/create_dog_with_homecoming');
    assert.deepEqual(requests[0].body, { dog_name: 'Nala', dog_breed_id: 'beagle', dog_birth_date: '2026-02-01', kennel_code: 'KENNEL-42', request_id: requestId, expected_homecoming_date: null, dog_sex: null });
  } finally { await client.auth.dispose(); }
});

test('dog deletion calls the owner-derived RPC once and reconciles a confirmed delete with the owner dog list', async () => {
  const dogId = '33000000-0000-4000-8000-000000000001';
  const remainingDog = { id: '33000000-0000-4000-8000-000000000002', name: 'Bosse', breed_id: 'beagle', birth_date: '2020-02-01', age_display_unit: 'years' };
  const { client, requests } = localClient((request) => request.url.pathname.endsWith('/delete_owned_dog_profile')
    ? Response.json(true)
    : Response.json([remainingDog]));
  try {
    assert.deepEqual(await deleteOwnedDogProfile(client, dogId), { status: 'deleted', ownedDogs: [remainingDog] });
    assert.equal(requests.length, 2);
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].url.pathname, '/rest/v1/rpc/delete_owned_dog_profile');
    assert.deepEqual(requests[0].body, { requested_dog_id: dogId });
    assert.equal(requests[1].method, 'GET');
    assert.equal(requests[1].url.pathname, '/rest/v1/dogs');
    assert.equal(requests[1].url.searchParams.has('user_id'), false, 'ownership is derived by RLS, not a client-supplied owner');
  } finally { await client.auth.dispose(); }
});

test('dog deletion never repeats an ambiguous RPC and distinguishes present from unconfirmed status', async () => {
  const dogId = '33000000-0000-4000-8000-000000000001';
  const dog = { id: dogId, name: 'Nala', breed_id: 'beagle', birth_date: '2020-02-01', age_display_unit: 'years' };
  const { client, requests } = localClient((request) => request.url.pathname.endsWith('/delete_owned_dog_profile')
    ? Response.json({ code: 'XX000', message: 'synthetic timeout' }, { status: 500 })
    : Response.json([dog]));
  try {
    assert.deepEqual(await deleteOwnedDogProfile(client, dogId), { status: 'unknown', ownedDogs: [dog] });
    assert.equal(requests.filter((request) => request.url.pathname.endsWith('/delete_owned_dog_profile')).length, 1);
    assert.deepEqual(await checkOwnedDogDeletionStatus(client, dogId), { status: 'present', ownedDogs: [dog] });
    assert.equal(requests.length, 3);
    assert.equal(requests[2].url.pathname, '/rest/v1/dogs');
  } finally { await client.auth.dispose(); }
});

test('a clean false delete result reconciles to absent only when the owner list confirms it', async () => {
  const dogId = '33000000-0000-4000-8000-000000000001';
  const { client, requests } = localClient((request) => request.url.pathname.endsWith('/delete_owned_dog_profile')
    ? Response.json(false)
    : Response.json([]));
  try {
    assert.deepEqual(await deleteOwnedDogProfile(client, dogId), { status: 'deleted', ownedDogs: [] });
    assert.equal(requests.filter((request) => request.url.pathname.endsWith('/delete_owned_dog_profile')).length, 1);
  } finally { await client.auth.dispose(); }
});

test('dog deletion readback stops when the captured owner/dog scope changes', async () => {
  const dogId = '33000000-0000-4000-8000-000000000001';
  let current = true;
  const { client, requests } = localClient((request) => request.url.pathname.endsWith('/delete_owned_dog_profile')
    ? Response.json({ code: 'XX000', message: 'synthetic ambiguous failure' }, { status: 500 })
    : Response.json([]));
  try {
    assert.deepEqual(await deleteOwnedDogProfile(client, dogId, () => {
      if (requests.some((request) => request.url.pathname.endsWith('/delete_owned_dog_profile'))) current = false;
      return current;
    }), { status: 'unknown', ownedDogs: null });
    assert.equal(requests.length, 1, 'a stale scope does not start a list read under a different account');
  } finally { await client.auth.dispose(); }
});

test('only the exact retired-create receipt result gets the recoverable typed outcome', async () => {
  const requestId = '44000000-0000-4000-8000-000000000001';
  const retiredClient = localClient(() => Response.json({ code: 'PT001', message: 'Dog creation request has been retired' }, { status: 400 }));
  const unrelatedClient = localClient(() => Response.json({ code: 'PT001', message: 'Different server error' }, { status: 400 }));
  try {
    await assert.rejects(createDog(retiredClient.client, { name: 'Nala', breedId: 'beagle', birthDate: '2020-02-01' }, requestId), RetiredDogCreationRequestError);
    await assert.rejects(createDog(unrelatedClient.client, { name: 'Nala', breedId: 'beagle', birthDate: '2020-02-01' }, requestId), { message: 'Could not create the dog profile' });
  } finally {
    await retiredClient.client.auth.dispose();
    await unrelatedClient.client.auth.dispose();
  }
});

test('invalid dog IDs do not send an RPC or list request', async () => {
  const { client, requests } = localClient(() => Response.json(true));
  try {
    assert.deepEqual(await deleteOwnedDogProfile(client, 'not-a-uuid'), { status: 'unknown', ownedDogs: null });
    assert.deepEqual(requests, []);
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

test('profile attribution can be read, saved, and removed independently of dog profile fields', async () => {
  const dogId = '33000000-0000-4000-8000-000000000001';
  const { client, requests } = localClient((request) => {
    if (request.url.pathname.endsWith('/owned_dog_attribution_details')) return Response.json([{ code: 'KENNEL-42', name: 'Kennel 42' }]);
    return Response.json(true);
  });
  try {
    assert.deepEqual(await fetchOwnedDogAttribution(client, dogId), { code: 'KENNEL-42', name: 'Kennel 42' });
    assert.deepEqual(await updateOwnedDogAttribution(client, dogId, ' kennel-42 '), { status: 'saved', value: { code: 'KENNEL-42', name: 'Kennel 42' } });
    assert.deepEqual(await updateOwnedDogAttribution(client, dogId, null), { status: 'saved', value: { code: 'KENNEL-42', name: 'Kennel 42' } });
    assert.equal(requests[0].url.pathname, '/rest/v1/rpc/owned_dog_attribution_details');
    assert.equal(requests[1].url.pathname, '/rest/v1/rpc/set_owned_dog_attribution');
    assert.deepEqual(requests[1].body, { requested_dog_id: dogId, requested_kennel_code: 'KENNEL-42' });
    assert.deepEqual(requests[2].body, { requested_dog_id: dogId });
    assert.equal(requests[3].url.pathname, '/rest/v1/rpc/set_owned_dog_attribution');
    assert.deepEqual(requests[3].body, { requested_dog_id: dogId, requested_kennel_code: null });
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
