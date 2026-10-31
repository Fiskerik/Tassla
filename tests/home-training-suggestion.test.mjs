import test from 'node:test';
import assert from 'node:assert/strict';
import { selectNextHomeTraining } from '../src/features/home/home-training-suggestion.ts';

const program = (id, match, completed, steps) => ({ id, title: id, currentAgeBreedMatch: match, completedStepIds: completed, steps: steps.map((step) => ({ id: step, title: step })) });

test('suggestion uses an age-matched program and its first available step', () => {
  const result = selectNextHomeTraining([
    program('wrong-age', false, [], ['wrong']),
    program('done', true, ['finished'], ['finished']),
    program('relevant', true, ['first'], ['first', 'second']),
  ]);
  assert.deepEqual(result, { programId: 'relevant', programTitle: 'relevant', stepId: 'second', stepTitle: 'second' });
});

test('suggestion is absent when there is no matched, available step', () => {
  assert.equal(selectNextHomeTraining([program('unknown', undefined, [], ['step']), program('done', true, ['a'], ['a'])]), null);
});

test('paused or uncertain versions are never suggested as the next exercise', () => {
  const programs = [program('paused', true, [], ['a']), program('pending', true, [], ['b']), program('available', true, [], ['c'])];
  assert.equal(selectNextHomeTraining(programs, new Set(['paused', 'pending']))?.stepId, 'c');
  assert.equal(selectNextHomeTraining(programs, new Set(['paused', 'pending', 'available'])), null);
});
