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
const appData = await import('../src/data/app-data.ts');
const dogModel = await import('../src/features/onboarding/dog.ts');
tsResolution.deregister();
const productWorkspaceSource = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const profileEditorSource = await readFile(new URL('../src/features/onboarding/EditDogProfileScreen.tsx', import.meta.url), 'utf8');

const projectUrl = 'https://local-test.supabase.invalid';
const dogId = '11111111-1111-4111-8111-111111111111';
const otherDogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const profile = { id: dogId, name: 'Nala', breed_id: 'beagle', birth_date: '2026-02-01' };
const desired = { id: dogId, name: 'Nala Rose', breed_id: 'mixed', birth_date: '2026-02-15' };
const breeds = [{ id: 'beagle', name: 'Beagle' }, { id: 'mixed', name: 'Blandras' }];
const changes = { name: '  Nala Rose  ', breed_id: 'mixed', birth_date: '2026-02-15' };

test('profile editor hides an obsolete saved message after edits but keeps pending and error status visible', () => {
  const draftDiffersSource = profileEditorSource.match(/const draftDiffers = ([^;]+);/)?.[1];
  const statusVisibleSource = profileEditorSource.match(/const showStatusMessage = ([^;]+);/)?.[1];
  assert.ok(draftDiffersSource, 'expected the editor draft comparison');
  assert.ok(statusVisibleSource, 'expected the editor status visibility rule');
  const evaluate = (draft, statusMessage, statusError, pending, busy) => {
    const draftDiffers = new Function('name', 'dog', 'breedId', 'birthDate', `return ${draftDiffersSource};`)(draft.name, profile, draft.breedId, draft.birthDate);
    const showStatusMessage = new Function('statusMessage', 'statusError', 'pending', 'busy', 'draftDiffers', `return ${statusVisibleSource};`)(statusMessage, statusError, pending, busy, draftDiffers);
    return { draftDiffers, showStatusMessage };
  };
  const savedMessage = evaluate({ name: 'Nala', breedId: 'beagle', birthDate: profile.birth_date }, 'Profilen sparades.', false, false, false);
  assert.deepEqual(savedMessage, { draftDiffers: false, showStatusMessage: true });
  const editedAfterSave = evaluate({ name: 'Nala ny', breedId: 'beagle', birthDate: profile.birth_date }, 'Profilen sparades.', false, false, false);
  assert.deepEqual(editedAfterSave, { draftDiffers: true, showStatusMessage: false });
  assert.equal(evaluate({ name: 'Nala ny', breedId: 'beagle', birthDate: profile.birth_date }, 'Ändringen väntar.', false, true, false).showStatusMessage, true);
  assert.equal(evaluate({ name: 'Nala ny', breedId: 'beagle', birthDate: profile.birth_date }, 'Sparningen misslyckades.', true, false, false).showStatusMessage, true);
});

test('profile validators trim names, count Unicode code points, and validate local calendar dates', () => {
  assert.equal(appData.normalizeDogProfileName('  Nala  '), 'Nala');
  assert.equal(appData.normalizeDogProfileName('   '), undefined);
  assert.equal(appData.normalizeDogProfileName('😀'.repeat(80)), '😀'.repeat(80));
  assert.equal(appData.normalizeDogProfileName('😀'.repeat(81)), undefined);

  assert.equal(appData.isValidDogBirthDate('2024-02-29'), true);
  assert.equal(appData.isValidDogBirthDate('2025-02-29'), false);
  assert.equal(appData.isValidDogBirthDate('2026-04-31'), false);
  assert.equal(appData.isValidDogBirthDate('2026-2-03'), false);
  assert.equal(appData.isValidDogBirthDate(today()), true);
  assert.equal(appData.isValidDogBirthDate(tomorrow()), false);
});

test('invalid name, date, or unknown breed fails before the SDK request', async () => {
  const { client, requests } = localClient(() => { throw new Error('validation must prevent a request'); });
  try {
    for (const invalid of [
      { ...changes, name: ' '.repeat(3) },
      { ...changes, name: 'x'.repeat(81) },
      { ...changes, name: '😀'.repeat(81) },
      { ...changes, birth_date: '2025-02-29' },
      { ...changes, birth_date: tomorrow() },
      { ...changes, breed_id: 'not-in-the-current-breed-list' },
    ]) {
      assert.deepEqual(await appData.updateOwnedDog(client, dogId, profile, invalid, breeds), { status: 'failed' });
    }
    assert.equal(requests.length, 0);
  } finally { await client.auth.dispose(); }
});

test('update filters the exact dog and all three captured preimage fields and sends only allowed values', async () => {
  const { client, requests } = localClient(({ method, url, body }) => {
    assert.equal(method, 'PATCH');
    assert.equal(url.pathname, '/rest/v1/dogs');
    assert.equal(url.searchParams.get('id'), `eq.${dogId}`);
    assert.equal(url.searchParams.get('name'), `eq.${profile.name}`);
    assert.equal(url.searchParams.get('breed_id'), `eq.${profile.breed_id}`);
    assert.equal(url.searchParams.get('birth_date'), `eq.${profile.birth_date}`);
    assert.deepEqual(body, { name: 'Nala Rose', breed_id: 'mixed', birth_date: '2026-02-15' });
    assert.equal(Object.hasOwn(body, 'id'), false);
    assert.equal(Object.hasOwn(body, 'actor_id'), false);
    return jsonResponse(desired);
  });
  try {
    assert.deepEqual(await appData.updateOwnedDog(client, dogId, profile, changes, breeds), { status: 'saved', value: desired });
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('returned update row must match exact dog id and requested profile before saved is reported', async (t) => {
  await t.test('mismatched id is reconciled by exact id lookup and not accepted from the update response', async () => {
    const { client, requests } = localClient(({ method }) => method === 'PATCH'
      ? jsonResponse({ ...desired, id: otherDogId }) : jsonResponse(profile));
    try {
      assert.deepEqual(await appData.updateOwnedDog(client, dogId, profile, changes, breeds), { status: 'unknown' });
      assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
      assert.equal(requests[1].url.searchParams.get('id'), `eq.${dogId}`);
    } finally { await client.auth.dispose(); }
  });
  await t.test('exact desired row found after lost response is saved', async () => {
    const { client, requests } = localClient(({ method, url }) => {
      if (method === 'PATCH') throw new TypeError('simulated committed update with lost response');
      assert.equal(url.pathname, '/rest/v1/dogs');
      assert.equal(url.searchParams.get('id'), `eq.${dogId}`);
      return jsonResponse(desired);
    });
    try {
      assert.deepEqual(await appData.updateOwnedDog(client, dogId, profile, changes, breeds), { status: 'saved', value: desired });
      assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
    } finally { await client.auth.dispose(); }
  });
  await t.test('requested profile with different dog id never counts as saved', async () => {
    const { client } = localClient(({ method }) => method === 'PATCH'
      ? jsonResponse({ ...desired, id: otherDogId }) : jsonResponse({ ...desired, id: otherDogId }));
    try { assert.deepEqual(await appData.updateOwnedDog(client, dogId, profile, changes, breeds), { status: 'unknown' }); }
    finally { await client.auth.dispose(); }
  });
});

test('lost and rejected updates reconcile safely against the desired row and captured preimage', async (t) => {
  await t.test('definite rejection with unchanged profile is failed', async () => {
    const { client, requests } = localClient(({ method }) => method === 'PATCH'
      ? jsonResponse({ code: '23514', message: 'update rejected' }, 400) : jsonResponse(profile));
    try {
      assert.deepEqual(await appData.updateOwnedDog(client, dogId, profile, changes, breeds), { status: 'failed' });
      assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
    } finally { await client.auth.dispose(); }
  });
  await t.test('conflicting concurrent profile is unknown and not overwritten', async () => {
    const concurrent = { ...profile, name: 'Nala Updated Elsewhere' };
    const { client, requests } = localClient(({ method }) => method === 'PATCH'
      ? Promise.reject(new TypeError('ambiguous network loss')) : jsonResponse(concurrent));
    try {
      assert.deepEqual(await appData.updateOwnedDog(client, dogId, profile, changes, breeds), { status: 'unknown' });
      assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
    } finally { await client.auth.dispose(); }
  });
  await t.test('a zero-row conditional update cannot claim saved without exact desired readback', async () => {
    const { client, requests } = localClient(({ method }) => method === 'PATCH'
      ? jsonResponse(null) : jsonResponse(profile));
    try {
      assert.deepEqual(await appData.updateOwnedDog(client, dogId, profile, changes, breeds), { status: 'unknown' });
      assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
    } finally { await client.auth.dispose(); }
  });
  await t.test('absent profile after ambiguous response remains unknown', async () => {
    const { client, requests } = localClient(({ method }) => method === 'PATCH'
      ? Promise.reject(new TypeError('ambiguous transport failure')) : jsonResponse(null));
    try {
      assert.deepEqual(await appData.updateOwnedDog(client, dogId, profile, changes, breeds), { status: 'unknown' });
      assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
    } finally { await client.auth.dispose(); }
  });
});

test('profile update deadline aborts the installed SDK request and reports unresolved write as unknown', async (t) => {
  let updateSignal;
  let abortObserved = false;
  const { client, requests } = localClient((request) => {
    if (request.method === 'PATCH') {
      updateSignal = request.signal;
      return new Promise((_resolve, reject) => updateSignal.addEventListener('abort', () => {
        abortObserved = true;
        reject(new DOMException('aborted', 'AbortError'));
      }, { once: true }));
    }
    return jsonResponse(profile);
  });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const pending = appData.updateOwnedDog(client, dogId, profile, changes, breeds);
    await new Promise((resolve) => setImmediate(resolve));
    assert.ok(updateSignal instanceof AbortSignal);
    assert.equal(updateSignal.aborted, false);
    assert.equal(requests.length, 1);
    t.mock.timers.tick(11_999);
    assert.equal(updateSignal.aborted, false);
    t.mock.timers.tick(1);
    assert.deepEqual(await pending, { status: 'unknown' });
    assert.equal(updateSignal.aborted, true);
    assert.equal(abortObserved, true);
    assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
  } finally {
    t.mock.timers.reset();
    await client.auth.dispose();
  }
});

test('fetchOwnedDogById is exact-id scoped and validates the returned id', async (t) => {
  await t.test('matching dog row', async () => {
    const { client, requests } = localClient(({ method, url }) => {
      assert.equal(method, 'GET');
      assert.equal(url.searchParams.get('select'), 'id,name,breed_id,birth_date');
      assert.equal(url.searchParams.get('id'), `eq.${dogId}`);
      return jsonResponse(profile);
    });
    try {
      assert.deepEqual(await appData.fetchOwnedDogById(client, dogId), profile);
      assert.equal(requests.length, 1);
    } finally { await client.auth.dispose(); }
  });
  await t.test('wrong id response is rejected', async () => {
    const { client } = localClient(() => jsonResponse({ ...profile, id: otherDogId }));
    try { await assert.rejects(appData.fetchOwnedDogById(client, dogId)); }
    finally { await client.auth.dispose(); }
  });
  await t.test('not found', async () => {
    const { client } = localClient(() => jsonResponse(null));
    try { assert.equal(await appData.fetchOwnedDogById(client, dogId), null); }
    finally { await client.auth.dispose(); }
  });
});

test('profile editing leaves the existing createDog RPC contract unchanged', async () => {
  const { client, requests } = localClient(({ method, url, body }) => {
    assert.equal(method, 'POST');
    assert.equal(url.pathname, '/rest/v1/rpc/create_dog');
    assert.deepEqual(body, { dog_name: 'Nala', dog_breed_id: 'beagle', dog_birth_date: '2026-02-01', kennel_code: null });
    return jsonResponse(null);
  });
  try {
    await appData.createDog(client, { name: ' Nala ', breedId: 'beagle', birthDate: profile.birth_date });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].url.pathname, '/rest/v1/rpc/create_dog');
  } finally { await client.auth.dispose(); }
});

test('actual workspace profile handler blocks duplicates and keeps unknown intent across navigation', async () => {
  const deferred = deferredResult();
  const harness = createProfileHandlerHarness({
    updateOwnedDog: async (...args) => { harness.calls.update.push(args); return deferred.promise; },
  });
  const saving = harness.handlers.saveDogProfile({ name: 'Nala Rose', breed_id: 'mixed', birth_date: '2026-02-15' }, breeds);
  assert.equal(harness.calls.update.length, 1);
  assert.equal(await harness.handlers.saveDogProfile({ name: 'Other', breed_id: 'mixed', birth_date: '2026-02-15' }, breeds), false);
  assert.equal(harness.calls.update.length, 1, 'same-tick duplicate intent must not send another write');
  deferred.resolve({ status: 'saved', value: desired });
  assert.equal(await saving, true);
  assert.deepEqual(harness.state.updatedDogs, [desired]);

  const unknownHarness = createProfileHandlerHarness({
    updateOwnedDog: async (...args) => { unknownHarness.calls.update.push(args); return { status: 'unknown' }; },
  });
  assert.equal(await unknownHarness.handlers.saveDogProfile(changes, breeds), false);
  const pending = unknownHarness.state.pendingMutation.current;
  assert.ok(pending);
  unknownHarness.state.page = 'more';
  unknownHarness.handlers = unknownHarness.rebuildHandlers();
  assert.equal(unknownHarness.state.pendingMutation.current, pending, 'navigation does not discard workspace-owned intent');
  assert.equal(await unknownHarness.handlers.saveDogProfile({ ...changes, name: 'Edited while unknown' }, breeds), false);
  assert.equal(unknownHarness.calls.update.length, 1);
});

test('actual workspace profile status check safely replays only the same intent after exact preimage readback', async () => {
  const harness = createProfileHandlerHarness({
    updateOwnedDog: async (...args) => {
      harness.calls.update.push(args);
      return harness.calls.update.length === 1 ? { status: 'unknown' } : { status: 'saved', value: desired };
    },
    fetchOwnedDogById: async (...args) => { harness.calls.lookup.push(args); return profile; },
  });
  assert.equal(await harness.handlers.saveDogProfile(changes, breeds), false);
  const pendingBefore = harness.state.pendingMutation.current;
  assert.equal(await harness.handlers.retryProfileStatus(), undefined);
  assert.deepEqual(harness.calls.lookup[0].slice(1), [dogId]);
  assert.equal(harness.calls.update.length, 2, 'unchanged preimage permits retry of the captured intent');
  assert.deepEqual(harness.calls.update[1].slice(1), [dogId, profile, { ...changes, name: 'Nala Rose' }, breeds]);
  assert.deepEqual(harness.state.updatedDogs, [desired]);
  assert.equal(harness.state.pendingMutation.current, null);
  assert.notEqual(pendingBefore, null);
});

test('actual workspace conflict retains pending intent until explicit acceptance of current profile', async () => {
  const concurrent = { ...profile, name: 'Nala Updated Elsewhere' };
  const harness = createProfileHandlerHarness({
    updateOwnedDog: async (...args) => { harness.calls.update.push(args); return { status: 'unknown' }; },
    fetchOwnedDogById: async (...args) => { harness.calls.lookup.push(args); return concurrent; },
  });
  assert.equal(await harness.handlers.saveDogProfile(changes, breeds), false);
  await harness.handlers.retryProfileStatus();
  assert.deepEqual(harness.state.conflict, concurrent);
  assert.ok(harness.state.pendingMutation.current);
  assert.deepEqual(harness.state.updatedDogs, [], 'newer profile is not applied until the owner chooses it');

  harness.dependencies.profileConflict = harness.state.conflict;
  harness.handlers = harness.rebuildHandlers();
  await harness.handlers.acceptCurrentProfile();
  assert.deepEqual(harness.state.updatedDogs, [concurrent]);
  assert.equal(harness.state.pendingMutation.current, null);
  assert.equal(harness.state.pending, false);
  assert.equal(harness.calls.update.length, 1, 'accepting current data does not replay stale changes');
});

test('actual workspace suppresses profile replay and owner callback after a lifetime change during lookup or update', async (t) => {
  await t.test('late status lookup cannot replay against an obsolete user/dog', async () => {
    const lookup = deferredResult();
    const harness = createProfileHandlerHarness({
      updateOwnedDog: async (...args) => { harness.calls.update.push(args); return { status: 'unknown' }; },
      fetchOwnedDogById: async (...args) => { harness.calls.lookup.push(args); return lookup.promise; },
    });
    assert.equal(await harness.handlers.saveDogProfile(changes, breeds), false);
    const status = harness.handlers.retryProfileStatus();
    harness.state.lifetime.current = 'new-dog:new-user';
    lookup.resolve(profile);
    await status;
    assert.equal(harness.calls.update.length, 1, 'stale lookup must not replay');
    assert.deepEqual(harness.state.updatedDogs, [], 'stale lookup must not notify AppFlow');
  });

  await t.test('late write result cannot update the dog owned by AppFlow', async () => {
    const update = deferredResult();
    const harness = createProfileHandlerHarness({
      updateOwnedDog: async (...args) => { harness.calls.update.push(args); return update.promise; },
    });
    const saving = harness.handlers.saveDogProfile(changes, breeds);
    harness.state.lifetime.current = 'new-dog:new-user';
    update.resolve({ status: 'saved', value: desired });
    assert.equal(await saving, false);
    assert.deepEqual(harness.state.updatedDogs, []);
    assert.equal(harness.state.pendingMutation.current, null);
  });
});

test('derived content and training return to loading on age/breed changes and ignore old generations', async () => {
  const firstDog = profile;
  const firstAge = dogModel.ageInWeeks(firstDog.birth_date, dogModel.localDate());
  const firstKey = `${firstDog.id}:${firstDog.breed_id}:${firstAge}`;
  const state = { content: ['old content'], contentKey: firstKey, contentState: 'ready', training: { programs: ['old'], paused: [] }, trainingKey: firstKey, trainingError: '', trainingState: 'ready' };
  const generations = { content: { current: 0 }, training: { current: 0 } };
  const requests = { content: [], training: [] };
  const firstContent = deferredResult();
  const firstTraining = deferredResult();
  const secondContent = deferredResult();
  const secondTraining = deferredResult();
  const first = buildDerivedEffect({ state, generations, dog: firstDog, age: firstAge, selectionKey: firstKey,
    homeResult: firstContent.promise, trainingResult: firstTraining.promise, requests });
  const cleanupFirst = first();
  assert.equal(state.contentKey, firstKey);
  assert.equal(state.trainingKey, firstKey);

  const updatedDog = { ...profile, breed_id: 'mixed', birth_date: '2026-08-01' };
  const updatedAge = dogModel.ageInWeeks(updatedDog.birth_date, dogModel.localDate());
  const updatedKey = `${updatedDog.id}:${updatedDog.breed_id}:${updatedAge}`;
  assert.notEqual(updatedKey, firstKey);
  cleanupFirst();
  const visibleForUpdatedProfile = () => ({
    content: state.contentKey === updatedKey ? state.content : [],
    contentState: state.contentKey === updatedKey ? state.contentState : 'loading',
    training: state.trainingKey === updatedKey ? state.training : { programs: [], paused: [] },
    trainingState: state.trainingKey === updatedKey ? state.trainingState : 'loading',
  });
  assert.deepEqual(visibleForUpdatedProfile(), { content: [], contentState: 'loading', training: { programs: [], paused: [] }, trainingState: 'loading' });
  const second = buildDerivedEffect({ state, generations, dog: updatedDog, age: updatedAge, selectionKey: updatedKey,
    homeResult: secondContent.promise, trainingResult: secondTraining.promise, requests });
  const cleanupSecond = second();
  assert.equal(requests.content.length, 2);
  assert.deepEqual(requests.content.map(({ dog, age }) => [dog.breed_id, dog.birth_date, age]), [
    [firstDog.breed_id, firstDog.birth_date, firstAge], [updatedDog.breed_id, updatedDog.birth_date, updatedAge],
  ]);
  assert.equal(visibleForUpdatedProfile().contentState, 'loading');
  assert.equal(visibleForUpdatedProfile().trainingState, 'loading');

  firstContent.resolve([{ id: 'old', title: 'Old', body: 'Old body', contentType: 'guide' }]);
  firstTraining.resolve({ programs: [{ id: 'old-program' }], paused: [] });
  await flushMicrotasks();
  assert.deepEqual(state.content, ['old content'], 'late first-generation content cannot replace the previous generation');
  assert.deepEqual(state.training.programs, ['old'], 'late first-generation training cannot replace the previous generation');
  assert.deepEqual(visibleForUpdatedProfile().content, [], 'old profile content remains hidden');
  assert.equal(visibleForUpdatedProfile().contentState, 'loading');

  secondContent.resolve([{ id: 'new', title: 'New', body: 'New body', contentType: 'guide' }]);
  secondTraining.resolve({ programs: [{ id: 'new-program' }], paused: [] });
  await flushMicrotasks();
  assert.deepEqual(visibleForUpdatedProfile().content.map(({ id }) => id), ['new']);
  assert.equal(state.contentKey, updatedKey);
  assert.equal(state.contentState, 'ready');
  assert.deepEqual(visibleForUpdatedProfile().training.programs.map(({ id }) => id), ['new-program']);
  assert.equal(state.trainingKey, updatedKey);
  assert.equal(state.trainingState, 'ready');
  cleanupSecond();
});

test('failed derived reads clear stale selections and expose error states for the current profile', async () => {
  const state = { content: ['old content'], contentKey: 'old', contentState: 'ready', training: { programs: ['old'], paused: [] }, trainingKey: 'old', trainingError: '', trainingState: 'ready' };
  const dog = { ...profile, breed_id: 'mixed', birth_date: '2026-08-01' };
  const age = dogModel.ageInWeeks(dog.birth_date, dogModel.localDate());
  const selectionKey = `${dog.id}:${dog.breed_id}:${age}`;
  const run = buildDerivedEffect({ state, generations: { content: { current: 0 }, training: { current: 0 } }, dog, age,
    selectionKey, homeResult: Promise.reject(new Error('content fetch failed')),
    trainingResult: Promise.reject(new Error('training fetch failed')), requests: { content: [], training: [] } });
  const cleanup = run();
  await flushMicrotasks();
  assert.deepEqual(state.content, []);
  assert.equal(state.contentKey, selectionKey);
  assert.equal(state.contentState, 'error');
  assert.deepEqual(state.training, { programs: [], paused: [] });
  assert.equal(state.trainingKey, selectionKey);
  assert.equal(state.trainingState, 'error');
  assert.match(state.trainingError, /could not be fetched|kunde inte hämtas/i);
  cleanup();
});

function localClient(handler) {
  const requests = [];
  const client = createClient(projectUrl, 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init = {}) => {
        const url = new URL(typeof input === 'string' ? input : input.url);
        const request = { method: init.method ?? 'GET', url, signal: init.signal,
          body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined };
        requests.push(request);
        return handler(request);
      },
    },
  });
  return { client, requests };
}

function createProfileHandlerHarness(overrides = {}) {
  const lifetime = { current: `${dogId}:user-1` };
  const state = {
    dog: profile,
    lifetime,
    page: 'profile',
    busy: false,
    pending: false,
    message: '',
    messageError: false,
    conflict: null,
    updatedDogs: [],
    pendingMutation: { current: null },
    mutationInFlight: { current: false },
    mounted: { current: true },
  };
  const calls = { update: [], lookup: [] };
  const dependencies = {
    client: {},
    dog: profile,
    onDogUpdated: (value) => state.updatedDogs.push(value),
    mounted: state.mounted,
    profileLifetime: lifetime,
    pendingProfileMutation: state.pendingMutation,
    profileMutationInFlight: state.mutationInFlight,
    profileConflict: state.conflict,
    updateOwnedDog: async (...args) => {
      calls.update.push(args);
      return { status: 'saved', value: { id: args[1], ...args[3], name: args[3].name.trim() } };
    },
    fetchOwnedDogById: async (...args) => { calls.lookup.push(args); return null; },
    setProfileBusy(value) { state.busy = value; },
    setProfilePending(value) { state.pending = value; },
    setProfileMessage(value) { state.message = value; },
    setProfileMessageError(value) { state.messageError = value; },
    setProfileConflict(value) { state.conflict = value; },
  };
  Object.assign(dependencies, overrides);
  const functionSource = [
    extractFunction(productWorkspaceSource, 'markProfileSaved'),
    extractFunction(productWorkspaceSource, 'runProfileMutation'),
    extractFunction(productWorkspaceSource, 'saveDogProfile'),
    extractFunction(productWorkspaceSource, 'retryProfileStatus'),
    extractFunction(productWorkspaceSource, 'acceptCurrentProfile'),
    extractFunction(productWorkspaceSource, 'sameOwnedDogProfile'),
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
      `${compiled.outputText}\nreturn { saveDogProfile, retryProfileStatus, acceptCurrentProfile };`,
    );
    return buildHandlers(...Object.values(dependencies));
  };
  return { handlers: makeHandlers(), rebuildHandlers: makeHandlers, calls, state, dependencies };
}

function buildDerivedEffect({ state, generations, dog, age, selectionKey, homeResult, trainingResult, requests }) {
  state.selectionKeyRef ??= { current: selectionKey };
  const marker = productWorkspaceSource.indexOf('const generation = ++contentGeneration.current;');
  assert.notEqual(marker, -1, 'expected the current derived-content generation effect');
  const start = productWorkspaceSource.lastIndexOf('useEffect(() => {', marker);
  assert.notEqual(start, -1);
  const arrow = productWorkspaceSource.indexOf('=>', start);
  const bodyStart = productWorkspaceSource.indexOf('{', arrow);
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let bodyEnd = -1;
  for (let index = bodyStart; index < productWorkspaceSource.length; index += 1) {
    const current = productWorkspaceSource[index];
    const next = productWorkspaceSource[index + 1];
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
      if (depth === 0) { bodyEnd = index; break; }
    }
  }
  assert.notEqual(bodyEnd, -1);
  const callEnd = productWorkspaceSource.indexOf(');', bodyEnd);
  assert.notEqual(callEnd, -1);
  const hookSource = productWorkspaceSource.slice(start, callEnd + 2);
  assert.match(hookSource, /\}, \[age, client, currentSelectionKey, dog\]\);/);
  const compiled = ts.transpileModule(hookSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  const error = compiled.diagnostics?.find((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.equal(error, undefined, error && ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  const dependencies = {
    useEffect(callback) { return callback(); },
    contentGeneration: generations.content,
    trainingGeneration: generations.training,
    currentSelectionKey: selectionKey,
    currentSelectionKeyRef: state.selectionKeyRef,
    dog,
    age,
    client: {},
    mounted: { current: true },
    fetchHomeContent: async (...args) => { requests.content.push({ dog: args[1], age: args[2], signal: args[4] }); return homeResult; },
    fetchTrainingWorkspace: async (...args) => { requests.training.push({ dog: args[1], age: args[2], signal: args[4] }); return trainingResult; },
    setContent(value) { state.content = value; },
    setContentSelectionKey(value) { state.contentKey = value; },
    setContentState(value) { state.contentState = value; },
    setTraining(value) { state.training = value; },
    setTrainingSelectionKey(value) { state.trainingKey = value; },
    setTrainingError(value) { state.trainingError = value; },
    setTrainingState(value) { state.trainingState = value; },
  };
  const build = new Function(...Object.keys(dependencies), compiled.outputText);
  let cleanup;
  const bound = { ...dependencies, useEffect(callback) { cleanup = callback(); } };
  const run = () => {
    bound.currentSelectionKeyRef.current = selectionKey;
    build(...Object.keys(dependencies).map((key) => bound[key]));
    return cleanup;
  };
  return run;
}

async function flushMicrotasks() {
  await new Promise((resolve) => setImmediate(resolve));
  await Promise.resolve();
}

function extractFunction(source, name) {
  let start = source.indexOf(`async function ${name}(`);
  if (start === -1) start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Expected actual ${name} handler in ProductWorkspace`);
  const bodyStart = source.indexOf('{', start);
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

function jsonResponse(value, status = 200) { return Response.json(value, { status }); }

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
