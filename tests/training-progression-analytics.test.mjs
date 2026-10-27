import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { progressionAnalyticsEvent } = await import('../src/analytics/training-progression-events.ts');
hooks.deregister();

test('training metrics distinguish a new journey and a new milestone from repeat actions', () => {
  const empty = { journeys: [], milestones: [], sessions: [] };
  const start = { kind: 'start_or_resume', programVersionId: 'p' };
  const confirm = { kind: 'confirm_step', programVersionId: 'p', stepId: 's' };
  const active = { ...empty, journeys: [{ id: 'j', dog_id: 'dog', program_version_id: 'p', last_operation_id: 'op' }] };
  const completed = { ...active, milestones: [{ dog_id: 'dog', journey_id: 'j', step_id: 's', confirmation_operation_id: 'op' }] };
  assert.equal(progressionAnalyticsEvent(empty, active, 'dog', start, 'op'), 'training_started');
  assert.equal(progressionAnalyticsEvent(empty, active, 'dog', start, 'other'), null);
  assert.equal(progressionAnalyticsEvent(empty, completed, 'dog', confirm, 'op'), null);
  assert.equal(progressionAnalyticsEvent(active, active, 'dog', start, 'op'), null);
  assert.equal(progressionAnalyticsEvent(active, completed, 'dog', confirm, 'op'), 'training_completed');
  assert.equal(progressionAnalyticsEvent(active, completed, 'dog', confirm, 'other'), null);
  assert.equal(progressionAnalyticsEvent(active, completed, 'dog', { kind: 'record_session', programVersionId: 'p', stepId: 's', feedback: 'practice_more' }, 'op'), null);
  assert.equal(progressionAnalyticsEvent(completed, completed, 'dog', confirm, 'op'), null);
  assert.equal(progressionAnalyticsEvent(active, completed, 'other-dog', confirm, 'op'), null);
});
