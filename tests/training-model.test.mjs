import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TRAINING_NOTICE,
  TRAINING_PROGRAMS,
  TRAINING_PROGRESS_CAVEAT,
  completeNextStep,
  getCompletedStepIds,
  resetProgramProgress,
} from '../src/features/training/training-model.ts';

const trainingCopy = readFileSync(new URL('../docs/tasks/dev/app-02-content.md', import.meta.url), 'utf8');

function completion(dogId, programId, programVersion, stepId) {
  return { dogId, programId, programVersion, stepId };
}

test('preview programs have stable identities and match the reviewed local training copy', () => {
  assert.equal(TRAINING_PROGRAMS.length, 2);
  assert.ok(trainingCopy.includes(TRAINING_NOTICE));
  assert.ok(trainingCopy.includes(TRAINING_PROGRESS_CAVEAT));

  for (const program of TRAINING_PROGRAMS) {
    assert.ok(program.id.length > 0);
    assert.ok(Number.isInteger(program.version) && program.version > 0);
    assert.equal(program.steps.length, 3);
    assert.ok(trainingCopy.includes(program.title));
    assert.ok(trainingCopy.includes(program.introduction));
    assert.ok(trainingCopy.includes(program.stopText));
    assert.ok(trainingCopy.includes(program.sourceTitle));
    assert.ok(trainingCopy.includes(program.sourceUrl));
    assert.ok(program.limitation.length > 0);

    const stepIds = new Set();
    for (const step of program.steps) {
      assert.ok(!stepIds.has(step.id), `${program.id} repeats step ID ${step.id}`);
      stepIds.add(step.id);
      assert.ok(trainingCopy.includes(step.title));
      assert.ok(trainingCopy.includes(step.body));
    }
  }

  const puppyProgram = TRAINING_PROGRAMS.find(({ id }) => id === 'new-at-home');
  assert.ok(puppyProgram?.audience?.includes('valpar'));
  assert.ok(puppyProgram?.audience?.includes('vuxna hundars rädsla'));
  for (const caveat of ['hemmiljö', 'vård', 'vaccinationsråd', 'Sverige']) {
    assert.ok(puppyProgram?.limitation.includes(caveat));
    assert.ok(trainingCopy.includes(caveat));
  }
  const contactProgram = TRAINING_PROGRAMS.find(({ id }) => id === 'gentle-contact');
  assert.ok(contactProgram?.limitation.includes('inte ett komplett hanteringsprogram'));
  assert.ok(contactProgram?.limitation.includes('Ingen diagnos eller behandling'));
  assert.ok(trainingCopy.includes('inte ett komplett hanteringsprogram'));
  assert.ok(trainingCopy.includes('Ingen diagnos eller behandling'));
});

test('completed steps are isolated by dog, program, and exact version', () => {
  const completions = [
    completion('dog-a', 'gentle-contact', 1, 'contact-choose'),
    completion('dog-a', 'gentle-contact', 2, 'contact-reward'),
    completion('dog-a', 'new-at-home', 1, 'new-start'),
    completion('dog-b', 'gentle-contact', 1, 'contact-reward'),
  ];
  const before = structuredClone(completions);

  assert.deepEqual(getCompletedStepIds(completions, 'dog-a', 'gentle-contact', 1), ['contact-choose']);
  assert.deepEqual(getCompletedStepIds(completions, 'dog-a', 'gentle-contact', 2), ['contact-reward']);
  assert.deepEqual(getCompletedStepIds(completions, 'dog-a', 'new-at-home', 1), ['new-start']);
  assert.deepEqual(getCompletedStepIds(completions, 'dog-b', 'gentle-contact', 1), ['contact-reward']);
  assert.deepEqual(getCompletedStepIds(completions, 'unknown', 'gentle-contact', 1), []);
  assert.deepEqual(completions, before);
});

test('only the next ordered step completes and duplicate or out-of-order actions are idempotent', () => {
  const ids = ['contact-choose', 'contact-reward', 'contact-pause'];
  const start = [];
  assert.deepEqual(completeNextStep(start, 'dog-a', 'gentle-contact', 1, ids[1], ids), []);

  const first = completeNextStep(start, 'dog-a', 'gentle-contact', 1, ids[0], ids);
  assert.deepEqual(first, [completion('dog-a', 'gentle-contact', 1, ids[0])]);
  assert.deepEqual(start, []);
  assert.deepEqual(completeNextStep(first, 'dog-a', 'gentle-contact', 1, ids[0], ids), first);
  assert.deepEqual(completeNextStep(first, 'dog-a', 'gentle-contact', 1, 'not-a-step', ids), first);

  const second = completeNextStep(first, 'dog-a', 'gentle-contact', 1, ids[1], ids);
  assert.deepEqual(getCompletedStepIds(second, 'dog-a', 'gentle-contact', 1), ids.slice(0, 2));
  const finished = completeNextStep(second, 'dog-a', 'gentle-contact', 1, ids[2], ids);
  assert.deepEqual(getCompletedStepIds(finished, 'dog-a', 'gentle-contact', 1), ids);
  assert.deepEqual(completeNextStep(finished, 'dog-a', 'gentle-contact', 1, ids[2], ids), finished);
});

test('invalid identity, version, and duplicate step order do not change progress', () => {
  const existing = [completion('dog-a', 'gentle-contact', 1, 'contact-choose')];
  const cases = [
    ['', 'gentle-contact', 1, 'contact-reward', ['contact-choose', 'contact-reward']],
    ['dog-a', ' ', 1, 'contact-reward', ['contact-choose', 'contact-reward']],
    ['dog-a', 'gentle-contact', 0, 'contact-reward', ['contact-choose', 'contact-reward']],
    ['dog-a', 'gentle-contact', 1.5, 'contact-reward', ['contact-choose', 'contact-reward']],
    ['dog-a', 'gentle-contact', 1, 'contact-reward', ['contact-choose', 'contact-reward', 'contact-reward']],
    ['dog-a', 'gentle-contact', 1, 'contact-reward', []],
  ];

  for (const [dogId, programId, version, stepId, orderedIds] of cases) {
    const result = completeNextStep(existing, dogId, programId, version, stepId, orderedIds);
    assert.deepEqual(result, existing);
    assert.notEqual(result, existing);
  }
  assert.deepEqual(existing, [completion('dog-a', 'gentle-contact', 1, 'contact-choose')]);
});

test('reset removes only one dog-program-version and leaves other progress intact', () => {
  const existing = [
    completion('dog-a', 'gentle-contact', 1, 'contact-choose'),
    completion('dog-a', 'gentle-contact', 2, 'contact-choose'),
    completion('dog-a', 'new-at-home', 1, 'new-start'),
    completion('dog-b', 'gentle-contact', 1, 'contact-reward'),
  ];
  const reset = resetProgramProgress(existing, 'dog-a', 'gentle-contact', 1);
  assert.deepEqual(reset, existing.filter((item) => !(item.dogId === 'dog-a' && item.programId === 'gentle-contact' && item.programVersion === 1)));
  assert.equal(existing.length, 4);
  assert.notEqual(reset, existing);
  assert.deepEqual(resetProgramProgress(reset, 'missing', 'gentle-contact', 1), reset);
});
