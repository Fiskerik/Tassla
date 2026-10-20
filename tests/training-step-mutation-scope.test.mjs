import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';

const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
const scope = await import('../src/features/home/home-today.ts');
hook.deregister();
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const { acquireTrainingMutationLease, createTrainingMutationLease, ownsTrainingMutationLease, releaseTrainingMutationLease } = scope;

test('a callback captured for dog A cannot acquire dog B mutation scope after a dog switch', () => {
  const expectedCallbackScope = 'owner:dog-a';
  const activeScope = 'owner:dog-b';
  let active = null;
  let writeCount = 0;

  const lease = acquireTrainingMutationLease(active, expectedCallbackScope, activeScope, false);
  if (lease) {
    active = lease;
    writeCount += 1;
  }

  assert.equal(lease, null);
  assert.equal(active, null);
  assert.equal(writeCount, 0);
  assert.match(workspace, /beginTrainingMutation\(key, currentSelectionKey\)/);
  assert.match(workspace, /acquireTrainingMutationLease\(trainingMutationLease\.current, expectedScope, scope, accountDeletionInvalidated\.current\)/);
});

test('confirmed account deletion blocks a completion callback before it can write', () => {
  const lease = createTrainingMutationLease('owner:dog-a');
  let active = lease;
  let writeCount = 0;
  if (ownsTrainingMutationLease(active, lease, 'owner:dog-a', true)) writeCount += 1;
  assert.equal(acquireTrainingMutationLease(null, 'owner:dog-a', 'owner:dog-a', true), null);
  assert.equal(writeCount, 0);
  assert.match(workspace, /acquireTrainingMutationLease\(trainingMutationLease\.current, expectedScope, scope, accountDeletionInvalidated\.current\)/);
  const confirmed = workspace.indexOf('accountDeletionInvalidated.current = true;');
  assert.ok(confirmed >= 0);
  assert.match(workspace.slice(workspace.indexOf('async function completeStep'), workspace.indexOf('async function unmarkStep')),
    /beginTrainingMutation\(key, currentSelectionKey\)[\s\S]*?await insertTrainingProgress[\s\S]*?if \(!isTrainingMutationCurrent\(lease\)\) return false/);
});

test('late old-scope finally cannot clear or block the new scope mutation lease', async () => {
  const oldLease = createTrainingMutationLease('owner:dog-a');
  let active = oldLease;
  let resolveOld;
  const oldMutation = new Promise((resolve) => {
    resolveOld = () => {
      active = releaseTrainingMutationLease(active, oldLease);
      resolve();
    };
  });

  active = null; // scope change invalidates the old owner while its write is unresolved
  const newLease = createTrainingMutationLease('owner:dog-b');
  active = newLease;
  let newBusyKey = 'dog-b:step-1';
  resolveOld();
  await oldMutation;

  assert.equal(active, newLease);
  assert.equal(newBusyKey, 'dog-b:step-1');
  assert.equal(ownsTrainingMutationLease(active, newLease, 'owner:dog-b', false), true);
  assert.equal(ownsTrainingMutationLease(active, oldLease, 'owner:dog-a', false), false);
  assert.match(workspace, /const ownsLock = trainingMutationLease\.current === lease/);
  assert.match(workspace, /trainingMutationLease\.current = releaseTrainingMutationLease\(trainingMutationLease\.current, lease\)/);
});

test('every awaited completion, undo and reset checks current scope before publishing follow-up state', () => {
  const complete = workspace.slice(workspace.indexOf('async function completeStep'), workspace.indexOf('async function unmarkStep'));
  const unmark = workspace.slice(workspace.indexOf('async function unmarkStep'), workspace.indexOf('async function resetProgram'));
  const reset = workspace.slice(workspace.indexOf('async function resetProgram'), workspace.indexOf('async function runDailyMutation'));
  for (const body of [complete, unmark, reset]) {
    assert.match(body, /finally \{\s*finishTrainingMutation\(lease\)/);
    assert.doesNotMatch(body, /trainingMutationInFlight\.current = false/);
  }
  assert.match(complete, /await insertTrainingProgress[\s\S]*?if \(!isTrainingMutationCurrent\(lease\)\) return false[\s\S]*?await reloadTraining[\s\S]*?if \(!isTrainingMutationCurrent\(lease\)\) return false/);
  assert.match(unmark, /await deleteTrainingProgress[\s\S]*?if \(!isTrainingMutationCurrent\(lease\)\) return false[\s\S]*?await reloadTraining[\s\S]*?if \(!isTrainingMutationCurrent\(lease\)\) return false/);
  assert.match(reset, /await deleteTrainingProgress[\s\S]*?if \(!isTrainingMutationCurrent\(lease\)\) return[\s\S]*?await reloadTraining[\s\S]*?if \(!isTrainingMutationCurrent\(lease\)\) return/);
});
