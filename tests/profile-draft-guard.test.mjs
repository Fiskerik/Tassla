import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';

const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)
      ? nextResolve(`${specifier}.ts`, context)
      : nextResolve(specifier, context);
  },
});
const draft = await import('../src/features/onboarding/profile-draft.ts');
hook.deregister();
const workspaceSource = readFileSync('src/features/home/ProductWorkspace.tsx', 'utf8');
const screenSource = readFileSync('src/features/onboarding/EditDogProfileScreen.tsx', 'utf8');

const dog = { id: 'dog-1', name: 'Luna', breed_id: 'golden', birth_date: '2025-03-01', age_display_unit: 'months' };
const scope = { ownerId: 'owner-1', accountGeneration: 3, dogId: 'dog-1' };
const linkIntent = { ...scope, attemptedCode: 'ABC123', operationId: 10, status: 'unknown' };
const removeIntent = { ...scope, attemptedCode: null, operationId: 11, status: 'unknown' };

test('profile draft comparison trims canonical fields and returns clean after revert', () => {
  const saved = { name: 'Luna', breedId: 'golden', birthDate: '2025-03-01', ageDisplayUnit: 'months' };
  assert.equal(draft.isDogProfileDraftDirty(dog, saved), false);
  assert.equal(draft.isDogProfileDraftDirty(dog, { ...saved, name: '  Luna  ', birthDate: '2025-03-01 ' }), false);
  assert.equal(draft.isDogProfileDraftDirty(dog, { ...saved, breedId: 'lab' }), true);
  assert.equal(draft.isDogProfileDraftDirty(dog, { ...saved, birthDate: 'not-a-date' }), true);
  assert.equal(draft.isDogProfileDraftDirty(dog, { ...saved, ageDisplayUnit: 'weeks' }), true);
  assert.equal(draft.isDogProfileDraftDirty(dog, { ...saved, name: 'x'.repeat(81) }), true);
});

test('kennel-code comparison normalizes valid values but keeps invalid edits dirty', () => {
  assert.equal(draft.isKennelCodeDraftDirty('ABC123', ' abc123 '), false);
  assert.equal(draft.isKennelCodeDraftDirty(null, ''), false);
  assert.equal(draft.isKennelCodeDraftDirty(null, 'BAD'), true);
  assert.equal(draft.isKennelCodeDraftDirty('ABC123', ''), true);
});

test('parent-owned unknown states are recovery intents, not local dirty drafts', () => {
  assert.equal(draft.isProfileEditorDraftDirty({ profileDirty: false, kennelDirty: false, profilePending: false, hasKennelIntent: true }), false);
  assert.equal(draft.isProfileEditorDraftDirty({ profileDirty: true, kennelDirty: false, profilePending: false, hasKennelIntent: true }), true);
  assert.equal(draft.isProfileEditorDraftDirty({ profileDirty: true, kennelDirty: false, profilePending: true, hasKennelIntent: false }), false);
  assert.equal(draft.isProfileEditorDraftDirty({ profileDirty: false, kennelDirty: true, profilePending: true, hasKennelIntent: false }), true);
  assert.equal(draft.isProfileEditorDraftDirty({ profileDirty: true, kennelDirty: false, profilePending: false, hasKennelIntent: true }), true);
});

test('scoped attribution data is hidden on owner, account-generation, or dog change', () => {
  const record = { scope, value: { code: 'ABC123', name: 'Kennel A' } };
  assert.deepEqual(draft.filterScopedValue(record, scope), record.value);
  assert.equal(draft.filterScopedValue(record, { ...scope, ownerId: 'owner-2' }), null);
  assert.equal(draft.filterScopedValue(record, { ...scope, accountGeneration: 4 }), null);
  assert.equal(draft.filterScopedValue(record, { ...scope, dogId: 'dog-2' }), null);
});

test('unknown link is confirmed only by exact scoped readback match', () => {
  const result = draft.resolveAttributionReadback(linkIntent, linkIntent, scope, { code: 'ABC123', name: 'Kennel A' });
  assert.deepEqual(result, { status: 'confirmed', intent: null, value: { code: 'ABC123', name: 'Kennel A' } });
});

test('unknown link mismatch keeps the intent and exposes actual server state', () => {
  const current = { code: 'XYZ789', name: 'Kennel B' };
  const result = draft.resolveAttributionReadback(linkIntent, linkIntent, scope, current);
  assert.equal(result.status, 'mismatch');
  assert.deepEqual(result.intent, { ...linkIntent, status: 'mismatch' });
  assert.deepEqual(result.value, current);
});

test('unknown removal is a present intent and null readback confirms it exactly', () => {
  assert.equal(removeIntent.attemptedCode, null);
  const result = draft.resolveAttributionReadback(removeIntent, removeIntent, scope, null);
  assert.deepEqual(result, { status: 'confirmed', intent: null, value: null });
  assert.equal(draft.matchesAttributionPostimage(null, { code: 'ABC123', name: 'Kennel A' }), false);
  assert.equal(draft.matchesAttributionPostimage('ABC123', null), false);
});

test('unknown removal mismatch preserves intent when a kennel link still exists', () => {
  const current = { code: 'ABC123', name: 'Kennel A' };
  const result = draft.resolveAttributionReadback(removeIntent, removeIntent, scope, current);
  assert.equal(result.status, 'mismatch');
  assert.deepEqual(result.intent, { ...removeIntent, status: 'mismatch' });
  assert.deepEqual(result.value, current);
});

test('stale owner, account-generation, and dog readbacks cannot resolve current intent', () => {
  for (const staleScope of [
    { ...scope, ownerId: 'owner-2' },
    { ...scope, accountGeneration: 4 },
    { ...scope, dogId: 'dog-2' },
  ]) {
    const staleIntent = { ...staleScope, attemptedCode: 'ABC123', operationId: 10, status: 'unknown' };
    const result = draft.resolveAttributionReadback(staleIntent, staleIntent, scope, { code: 'ABC123', name: 'Kennel A' });
    assert.equal(result.status, 'stale');
    assert.deepEqual(result.intent, staleIntent);
  }
});

test('a superseded readback cannot clear a newer intent in the same scope', () => {
  const newerIntent = { ...scope, attemptedCode: null, operationId: 12, status: 'unknown' };
  const result = draft.resolveAttributionReadback(newerIntent, linkIntent, scope, { code: 'ABC123', name: 'Kennel A' });
  assert.equal(result.status, 'stale');
  assert.deepEqual(result.intent, newerIntent);
});

test('kennel status retry is read-only and use-current cannot write', () => {
  const retryStart = workspaceSource.indexOf('async function retryDogAttribution()');
  const retryEnd = workspaceSource.indexOf('async function saveDogAttribution(', retryStart);
  const useCurrentStart = workspaceSource.indexOf('function acceptCurrentDogAttribution(');
  const useCurrentEnd = workspaceSource.indexOf('async function saveDogAttribution(', useCurrentStart);
  assert.notEqual(retryStart, -1);
  assert.notEqual(retryEnd, -1);
  assert.notEqual(useCurrentStart, -1);
  assert.notEqual(useCurrentEnd, -1);
  const retryPath = workspaceSource.slice(retryStart, retryEnd);
  const useCurrentPath = workspaceSource.slice(useCurrentStart, useCurrentEnd);
  assert.match(retryPath, /fetchOwnedDogAttribution/);
  assert.doesNotMatch(retryPath, /updateOwnedDogAttribution|\.rpc\(|set_owned_dog_attribution/);
  assert.doesNotMatch(useCurrentPath, /updateOwnedDogAttribution|\.rpc\(|set_owned_dog_attribution/);
  assert.match(screenSource, /onAcceptCurrentAttribution\?\.\(attributionIntent\.operationId\)/);
});

test('unknown link and removal copy expose the actual mismatch state and recovery actions', () => {
  assert.match(screenSource, /Vi kunde inte kontrollera om kennelkopplingen sparades\./);
  assert.match(screenSource, /Vi kunde inte kontrollera om kennelkopplingen togs bort\./);
  assert.match(screenSource, /Kopplad till \$\{attribution\.name\}\./);
  assert.match(screenSource, /Ingen kennelkoppling\./);
  assert.ok(screenSource.includes("'Kontrollera igen'"));
  assert.ok(screenSource.includes('label="Använd aktuell koppling"'));
});
