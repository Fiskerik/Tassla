import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/202610250002_dog_profile_deletion.sql', 'utf8');
const probe = readFileSync('supabase/tests/dog-profile-deletion.sql', 'utf8');
const editScreen = readFileSync('src/features/onboarding/EditDogProfileScreen.tsx', 'utf8');
const workspace = readFileSync('src/features/home/ProductWorkspace.tsx', 'utf8');
const appFlow = readFileSync('src/features/home/AppFlow.tsx', 'utf8');
const profileScreen = readFileSync('src/features/onboarding/ProfileScreen.tsx', 'utf8');

function retiredRequestRecoveryAction(dependencies) {
  const match = profileScreen.match(/async function clearRetiredCreationRequest\(\) \{[\s\S]*?\n  \}/);
  assert.ok(match, 'the explicit retired-request recovery action exists');
  return new Function('dependencies', `with (dependencies) { return (${match[0]}); }`)(dependencies);
}

function sourceFunction(source, expression, replacements, dependencies) {
  const match = source.match(expression);
  assert.ok(match, 'the production callback exists in source');
  const functionSource = replacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), match[0]);
  return new Function('dependencies', `with (dependencies) { return (${functionSource}); }`)(dependencies);
}

test('dog deletion RPC is owner-derived, locked, narrow, and has no direct table-delete grant', () => {
  assert.match(migration, /create function public\.delete_owned_dog_profile\(requested_dog_id uuid\)[\s\S]*?security definer set search_path = ''/i);
  assert.match(migration, /current_user_id := auth\.uid\(\)/);
  assert.match(migration, /from auth\.users where id = current_user_id for no key update/i);
  assert.match(migration, /from public\.dogs d where d\.id = requested_dog_id for update/i);
  assert.match(migration, /recheck after waiting[\s\S]*?delete from public\.dogs d where d\.id = requested_dog_id/i);
  assert.match(migration, /revoke all on function public\.delete_owned_dog_profile\(uuid\) from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.delete_owned_dog_profile\(uuid\) to authenticated/i);
  assert.doesNotMatch(migration, /grant\s+delete\s+on\s+(?:table\s+)?public\.(?:dogs|dog_memberships)/i);
  assert.match(probe, /has_function_privilege\('authenticated',[\s\S]*?'EXECUTE'\)/);
  assert.match(probe, /has_function_privilege\('service_role',[\s\S]*?'EXECUTE'\)/);
  assert.match(probe, /has_table_privilege\('authenticated', 'public\.dogs', 'DELETE'\)/);
  assert.match(probe, /Foreign-owner and unknown IDs have the same false result/i);
});

test('deleted create receipts retain only a nullable dog reference and stale paths fail closed', () => {
  assert.match(migration, /alter column dog_id drop not null/i);
  assert.match(migration, /references public\.dogs\(id\) on delete set null/i);
  assert.match(migration, /if existing_dog_id is null then\s+raise exception 'Dog creation request has been retired' using errcode = 'PT001'/i);
  assert.match(probe, /dog create receipt was not retained as a minimal tombstone/i);
  assert.match(probe, /stale idempotency request recreated deleted dog A1/i);
  assert.match(probe, /legacy fixed-ID create recreated deleted dog A2/i);
  assert.match(probe, /fresh create request did not create a replacement dog/i);
  assert.match(probe, /full account deletion retained dog creation tombstones/i);
});

test('profile UI confirms dog-only deletion and exposes a read-only status check after uncertainty', () => {
  assert.match(editScreen, /Radera hundprofil/);
  assert.match(editScreen, /title=\{`Radera \$\{dog\.name\}\?`\}/);
  assert.match(editScreen, /Det går inte att ångra/);
  assert.match(editScreen, /Tassla-kontot och din inloggning finns kvar/);
  assert.match(editScreen, /Övriga hundprofiler och Tassla-kontot finns kvar/);
  assert.match(editScreen, /onCheckDogDeletionStatus/);
  assert.match(editScreen, /Kontrollera om hundprofilen har raderats/);
  assert.match(workspace, /checkOwnedDogDeletionStatus\(client, dog\.id, isCurrentOwner\)/);
  assert.match(workspace, /deleteOwnedDogProfile\(client, dog\.id, isCurrentOwner\)/);
  assert.match(editScreen, /dogDeletionInFlight\.current/);
});

test('AppFlow fences stale delete responses by dog selection and refreshes the owner list', () => {
  assert.match(appFlow, /dogSelectionGenerationRef/);
  assert.match(appFlow, /selectionGeneration === dogSelectionGenerationRef\.current && activeDogIdRef\.current === deletedDogId/);
  assert.match(appFlow, /const latestDogs = await fetchOwnedDogs\(client\)/);
  assert.match(appFlow, /mode=\{dogs\.length > 0 \? 'add' : 'initial'\}/);
});

test('a confirmed delete reaches AppFlow after the dog-keyed workspace unmounts', async () => {
  const dogId = '93000000-0000-4000-8000-000000000001';
  const currentDog = { id: '93000000-0000-4000-8000-000000000002', name: 'Bosse' };
  const ownerId = '91000000-0000-4000-8000-000000000001';
  const rootState = {
    dogSelectionGenerationRef: { current: 8 },
    activeDogIdRef: { current: currentDog.id },
    dogsRef: { current: [{ id: dogId }, currentDog] },
    dogs: [{ id: dogId }, currentDog], state: 'ready', refreshed: 0, selected: [],
  };
  let mounted = false;
  let reconcilePromise;
  const ownerIsCurrent = (candidate, generation) => candidate === ownerId && generation === 4;
  const refreshCurrentOwnerDogs = async () => { rootState.refreshed += 1; return [currentDog]; };
  const reconcileAtRoot = sourceFunction(
    appFlow,
    /async function handleDogDeleted\(deletedDogId: string,[\s\S]*?\n  \}/,
    [[/\(deletedDogId: string, selectionGeneration: number, remainingDogs: OwnedDog\[\] \| null\)/,
      '(deletedDogId, selectionGeneration, remainingDogs)']],
    {
      ownerId, accountGeneration: 4, client: {}, isCurrentAccount: ownerIsCurrent,
      dogSelectionGenerationRef: rootState.dogSelectionGenerationRef,
      activeDogIdRef: rootState.activeDogIdRef, dogsRef: rootState.dogsRef,
      setDogs(value) { rootState.dogs = value; },
      setState(value) { rootState.state = value; },
      selectDog(value) { rootState.activeDogIdRef.current = value; rootState.selected.push(value); },
      fetchOwnedDogs: refreshCurrentOwnerDogs,
    },
  );
  const removeFromUnmountedWorkspace = sourceFunction(
    workspace,
    /async function removeDogProfile\(\): Promise<OwnedDogDeletionOutcome> \{[\s\S]*?\n  \}/,
    [[/async function removeDogProfile\(\): Promise<OwnedDogDeletionOutcome>/, 'async function removeDogProfile()'],
      [/let outcome: OwnedDogDeletionOutcome;/, 'let outcome;']],
    {
      session: { user: { id: ownerId } }, accountGeneration: 4, client: {}, dog: { id: dogId },
      dogSelectionGeneration: 7, mounted: { current: mounted }, profileLifetime: { current: 2 },
      isCurrentAccount: ownerIsCurrent,
      deleteOwnedDogProfile: async (_client, requestedDogId, isCurrentOwner) => {
        assert.equal(requestedDogId, dogId);
        mounted = false;
        assert.equal(isCurrentOwner(), true, 'same-account deletion survives the old dog workspace unmount');
        return { status: 'deleted', ownedDogs: null };
      },
      onDogDeleted: (...args) => { reconcilePromise = reconcileAtRoot(...args); },
    },
  );

  const outcome = await removeFromUnmountedWorkspace();
  await reconcilePromise;
  assert.equal(outcome.status, 'deleted');
  assert.equal(rootState.refreshed, 1, 'a stale dog-selection generation refreshes the owner list');
  assert.deepEqual(rootState.dogs.map((dog) => dog.id), [currentDog.id]);
  assert.equal(rootState.activeDogIdRef.current, currentDog.id, 'the currently selected dog remains active');
  assert.deepEqual(rootState.selected, []);
  assert.equal(rootState.state, 'ready');
});

test('confirmed absence readback after workspace unmount reconciles at AppFlow too', async () => {
  const dogId = '93000000-0000-4000-8000-000000000001';
  const ownerId = '91000000-0000-4000-8000-000000000001';
  let mounted = true;
  let callbackCount = 0;
  const checkStatus = sourceFunction(
    workspace,
    /async function readDogDeletionStatus\(\): Promise<OwnedDogDeletionOutcome> \{[\s\S]*?\n  \}/,
    [[/async function readDogDeletionStatus\(\): Promise<OwnedDogDeletionOutcome>/, 'async function readDogDeletionStatus()'],
      [/let outcome: OwnedDogDeletionOutcome;/, 'let outcome;']],
    {
      session: { user: { id: ownerId } }, accountGeneration: 4, client: {}, dog: { id: dogId },
      dogSelectionGeneration: 3, mounted: { current: mounted }, profileLifetime: { current: 2 },
      isCurrentAccount: (candidate, generation) => candidate === ownerId && generation === 4,
      checkOwnedDogDeletionStatus: async (_client, requestedDogId, isCurrentOwner) => {
        assert.equal(requestedDogId, dogId);
        mounted = false;
        assert.equal(isCurrentOwner(), true, 'owner-scoped absence remains valid after dog workspace unmount');
        return { status: 'deleted', ownedDogs: [] };
      },
      onDogDeleted() { callbackCount += 1; },
    },
  );

  const outcome = await checkStatus();
  assert.equal(outcome.status, 'deleted');
  assert.equal(callbackCount, 1, 'confirmed absence reaches the root reconciliation callback');
});

test('a confirmed response cannot update AppFlow after the account generation changes', async () => {
  const dogId = '93000000-0000-4000-8000-000000000001';
  const ownerId = '91000000-0000-4000-8000-000000000001';
  let generation = 4;
  let callbackCount = 0;
  const remove = sourceFunction(
    workspace,
    /async function removeDogProfile\(\): Promise<OwnedDogDeletionOutcome> \{[\s\S]*?\n  \}/,
    [[/async function removeDogProfile\(\): Promise<OwnedDogDeletionOutcome>/, 'async function removeDogProfile()'],
      [/let outcome: OwnedDogDeletionOutcome;/, 'let outcome;']],
    {
      session: { user: { id: ownerId } }, accountGeneration: 4, client: {}, dog: { id: dogId },
      dogSelectionGeneration: 3, mounted: { current: false }, profileLifetime: { current: 2 },
      isCurrentAccount: (candidate, capturedGeneration) => candidate === ownerId && generation === capturedGeneration,
      deleteOwnedDogProfile: async (_client, _requestedDogId, isCurrentOwner) => {
        generation = 5;
        assert.equal(isCurrentOwner(), false);
        return { status: 'deleted', ownedDogs: [] };
      },
      onDogDeleted() { callbackCount += 1; },
    },
  );

  const outcome = await remove();
  assert.equal(outcome.status, 'deleted', 'the caller can retain the server result for its obsolete screen');
  assert.equal(callbackCount, 0, 'a different account generation cannot receive a stale dog callback');
});

test('confirmed last-dog removal leaves AppFlow ready with the initial profile route', async () => {
  const dogId = '93000000-0000-4000-8000-000000000001';
  const ownerId = '91000000-0000-4000-8000-000000000001';
  const rootState = {
    dogSelectionGenerationRef: { current: 2 }, activeDogIdRef: { current: dogId },
    dogsRef: { current: [{ id: dogId }] }, dogs: [{ id: dogId }], state: 'ready',
  };
  const handleDelete = sourceFunction(
    appFlow,
    /async function handleDogDeleted\(deletedDogId: string,[\s\S]*?\n  \}/,
    [[/\(deletedDogId: string, selectionGeneration: number, remainingDogs: OwnedDog\[\] \| null\)/,
      '(deletedDogId, selectionGeneration, remainingDogs)']],
    {
      ownerId, accountGeneration: 4, client: {}, isCurrentAccount: () => true,
      dogSelectionGenerationRef: rootState.dogSelectionGenerationRef,
      activeDogIdRef: rootState.activeDogIdRef, dogsRef: rootState.dogsRef,
      setDogs(value) { rootState.dogs = value; },
      setState(value) { rootState.state = value; },
      selectDog(value) { rootState.activeDogIdRef.current = value; },
      fetchOwnedDogs: async () => { throw new Error('the current selection should use confirmed readback'); },
    },
  );

  await handleDelete(dogId, 2, []);
  assert.deepEqual(rootState.dogs, []);
  assert.equal(rootState.activeDogIdRef.current, null);
  assert.equal(rootState.state, 'ready');
  assert.match(appFlow, /state === 'ready' && \(dogs\.length === 0 \|\| addingDog\)\) return <ProfileScreen/);
  assert.match(appFlow, /mode=\{dogs\.length > 0 \? 'add' : 'initial'\}/);
});

test('only the typed retired create result offers explicit exact-key recovery', () => {
  assert.match(profileScreen, /error instanceof RetiredDogCreationRequestError[\s\S]*?'retiredRequest'/);
  assert.match(profileScreen, /clearDogCreationRequest\(ownerId, resolvedRequestId\)/);
  assert.match(profileScreen, /Fortsätt med en ny begäran/);
  assert.match(profileScreen, /current === 'unknown' \|\| current === 'sourceUnconfirmed' \|\| current === 'retiredRequest'/);
  assert.match(profileScreen, /uppgifterna du fyllt i finns kvar/i);
});

test('retired-request recovery clears only the captured owner/request key and preserves the form draft', async () => {
  const calls = [];
  const state = { saveState: 'retiredRequest', resolvedRequestId: '44000000-0000-4000-8000-000000000001', busy: false,
    operationInFlight: { current: false }, retiredRequestResetFailed: false, draft: { name: 'Nala utkast', breedId: 'beagle' },
    resolvedDog: null, resolvedShouldClearReferral: false, recoveryMismatch: false, snapshotClearCalls: 0 };
  const action = retiredRequestRecoveryAction({
    get saveState() { return state.saveState; },
    get resolvedRequestId() { return state.resolvedRequestId; },
    get busy() { return state.busy; },
    operationInFlight: state.operationInFlight,
    setBusy(value) { state.busy = value; },
    setRetiredRequestResetFailed(value) { state.retiredRequestResetFailed = value; },
    ownerId: '91000000-0000-4000-8000-000000000001',
    clearDogCreationRequest: async (...args) => { calls.push(args); },
    isCurrentAccount: () => true,
    accountGeneration: 4,
    setResolvedRequestId(value) { state.resolvedRequestId = value; },
    setResolvedDog(value) { state.resolvedDog = value; },
    setResolvedShouldClearReferral(value) { state.resolvedShouldClearReferral = value; },
    setSaveState(value) { state.saveState = value; },
    setRecoveryMismatch(value) { state.recoveryMismatch = value; },
    onClearRecoverySnapshot() { state.snapshotClearCalls += 1; },
  });

  await action();
  assert.deepEqual(calls, [['91000000-0000-4000-8000-000000000001', '44000000-0000-4000-8000-000000000001']]);
  assert.equal(state.saveState, 'idle', 'the next separate submit can request a fresh UUID');
  assert.equal(state.resolvedRequestId, null);
  assert.deepEqual(state.draft, { name: 'Nala utkast', breedId: 'beagle' }, 'the entered fields are untouched');
  assert.equal(state.retiredRequestResetFailed, false);
  assert.equal(state.snapshotClearCalls, 1);
});

test('generic unknown create status cannot clear the stored request key', async () => {
  let clearCalls = 0;
  const action = retiredRequestRecoveryAction({
    saveState: 'unknown', resolvedRequestId: '44000000-0000-4000-8000-000000000001', busy: false,
    operationInFlight: { current: false }, setBusy() {}, setRetiredRequestResetFailed() {}, ownerId: '91000000-0000-4000-8000-000000000001',
    clearDogCreationRequest: async () => { clearCalls += 1; }, isCurrentAccount: () => true, accountGeneration: 4,
    setResolvedRequestId() {}, setResolvedDog() {}, setResolvedShouldClearReferral() {}, setSaveState() {}, setRecoveryMismatch() {},
    onClearRecoverySnapshot() {},
  });
  await action();
  assert.equal(clearCalls, 0);
});
