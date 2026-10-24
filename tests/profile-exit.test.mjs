import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const { decideProfileExit, profileExitScopeKey, profileRecoveryRequestMatches } = await import('../src/features/onboarding/profile-exit.ts');
hooks.deregister();

const scope = { ownerId: 'owner-a', accountGeneration: 3, dogId: 'dog-a' };
const clean = { scope, profileDirty: false, kennelDirty: false };
const noLocks = {
  profileBusy: false,
  profilePending: false,
  profileConflict: false,
  attributionBusy: false,
  attributionUnresolved: false,
};

test('profile exit accepts only current owner/account/dog scope', () => {
  assert.equal(profileExitScopeKey(scope), 'owner-a:3:dog-a');
  assert.deepEqual(decideProfileExit(clean, scope, noLocks), { kind: 'allow' });
  assert.deepEqual(decideProfileExit(clean, { ...scope, dogId: 'dog-b' }, noLocks), { kind: 'block', reason: 'snapshot-unavailable' });
  assert.deepEqual(decideProfileExit(clean, { ...scope, accountGeneration: 4 }, noLocks), { kind: 'block', reason: 'snapshot-unavailable' });
  assert.deepEqual(decideProfileExit(clean, { ...scope, ownerId: 'owner-b' }, noLocks), { kind: 'block', reason: 'snapshot-unavailable' });
});

test('only local dirty fields require discard confirmation', () => {
  assert.deepEqual(decideProfileExit({ ...clean, profileDirty: true }, scope, noLocks), { kind: 'confirm-discard' });
  assert.deepEqual(decideProfileExit({ ...clean, kennelDirty: true }, scope, noLocks), { kind: 'confirm-discard' });
});

test('busy, pending, conflict and attribution recovery block before dirty confirmation', () => {
  for (const reason of ['profileBusy', 'profilePending', 'profileConflict', 'attributionBusy', 'attributionUnresolved']) {
    assert.deepEqual(decideProfileExit({ ...clean, profileDirty: true }, scope, { ...noLocks, [reason]: true }), { kind: 'block', reason });
  }
  assert.deepEqual(decideProfileExit(clean, scope, noLocks), { kind: 'allow' });
});

test('missing child snapshot blocks instead of assuming clean', () => {
  assert.deepEqual(decideProfileExit(null, scope, noLocks), { kind: 'block', reason: 'snapshot-unavailable' });
});

test('recovery actions restore only when owner, generation and secure request ID all match', () => {
  const recovery = { ownerId: 'owner-a', accountGeneration: 3, resolvedRequestId: 'request-a' };
  assert.equal(profileRecoveryRequestMatches(recovery, 'owner-a', 3, 'request-a'), true);
  assert.equal(profileRecoveryRequestMatches(recovery, 'owner-a', 3, 'request-b'), false);
  assert.equal(profileRecoveryRequestMatches(recovery, 'owner-a', 4, 'request-a'), false);
  assert.equal(profileRecoveryRequestMatches(recovery, 'owner-b', 3, 'request-a'), false);
  assert.equal(profileRecoveryRequestMatches({ ...recovery, resolvedRequestId: null }, 'owner-a', 3, null), true);
  assert.equal(profileRecoveryRequestMatches({ ...recovery, resolvedRequestId: null }, 'owner-a', 3, 'request-a'), false);
});
