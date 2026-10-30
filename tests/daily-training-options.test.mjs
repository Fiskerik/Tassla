import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const resolution = registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { buildDailyTrainingOptions } = await import('../src/features/home/daily-training-options.ts');
resolution.deregister();
const program = { id: 'version-a', content_id: 'program-a', version: 1, title: 'Trygg kontakt', body: '', sources: [], completedStepIds: [], currentAgeBreedMatch: true,
  steps: [1, 2, 3].map((position) => ({ id: `step-${position}`, position, title: `Steg ${position}`, instruction: '' })) };
const journey = { id: 'journey-a', dog_id: 'dog-a', program_version_id: 'version-a', active_step_id: 'step-2', state: 'active', updated_at: '2026-10-30T08:00:00Z' };
const snapshot = (journeys = [journey]) => ({ journeys, sessions: [], milestones: [] });
const choose = (programs = [program], progression = snapshot(), state = 'ready', selections = []) => buildDailyTrainingOptions('dog-a', programs, progression, state, selections);

test('daily choice follows the actual saved journey rather than the older first unmarked activity', () => {
  assert.equal(choose()[0].stepId, 'step-2');
  assert.equal(choose()[0].source, 'journey');
  assert.equal(choose()[0].stepNumber, 2);
  assert.equal(choose([{ ...program, completedStepIds: ['step-2'], currentAgeBreedMatch: false }])[0].stepId, 'step-2');
});

test('paused or broken journeys and uncertain progression never guess a legacy step', () => {
  assert.deepEqual(choose([program], snapshot([{ ...journey, state: 'paused' }])), []);
  assert.deepEqual(choose([program], snapshot([{ ...journey, active_step_id: 'missing' }])), []);
  assert.deepEqual(choose([program], snapshot(), 'error'), []);
  assert.equal(choose([program], snapshot([{ ...journey, state: 'maintenance' }]))[0].stepId, 'step-2');
});

test('selection and journey scope are exact to dog, version and step', () => {
  assert.deepEqual(choose([program], snapshot(), 'ready', [{ dog_id: 'dog-a', program_version_id: 'version-a', step_id: 'step-2' }]), []);
  assert.equal(choose([program], snapshot(), 'ready', [{ dog_id: 'dog-b', program_version_id: 'version-a', step_id: 'step-2' }])[0].stepId, 'step-2');
  assert.equal(choose([program], snapshot([{ ...journey, dog_id: 'dog-b' }]))[0].stepId, 'step-1');
  assert.equal(choose([program], snapshot([{ ...journey, program_version_id: 'other-version' }]))[0].stepId, 'step-1');
});

test('fallback uses existing eligibility and completion rules, and active alternatives take priority', () => {
  const other = { ...program, id: 'version-b', content_id: 'program-b', title: 'Nästa program' };
  assert.equal(choose([program, other]).length, 1);
  assert.equal(choose([program, other])[0].versionId, 'version-a');
  assert.equal(choose([{ ...program, completedStepIds: ['step-1'] }], snapshot([]))[0].stepId, 'step-2');
  assert.deepEqual(choose([{ ...program, currentAgeBreedMatch: false }], snapshot([])), []);
  assert.deepEqual(choose([{ ...program, completedStepIds: ['step-1', 'step-2', 'step-3'] }], snapshot([])), []);
  assert.deepEqual(choose([{ ...program, id: 'review-v1:training:a' }]), []);
  assert.deepEqual(program.completedStepIds, []);
  assert.deepEqual(program.steps.map((step) => step.id), ['step-1', 'step-2', 'step-3']);
});

test('legacy fallback uses the highest resumed version rather than a newer unstarted one', () => {
  const older = { ...program, currentAgeBreedMatch: false, completedStepIds: ['step-1'] };
  const newer = { ...program, id: 'version-new', version: 2 };
  assert.equal(choose([older, newer], snapshot([]))[0].versionId, 'version-a');
  assert.equal(choose([older, { ...newer, completedStepIds: ['step-1'] }], snapshot([]))[0].versionId, 'version-new');
});
