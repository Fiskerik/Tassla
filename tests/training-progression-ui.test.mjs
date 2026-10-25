import test from 'node:test';
import assert from 'node:assert/strict';

const model = await import('../src/features/training/training-progression.ts');

test('Home hides journey counts when progression readback is unavailable', () => {
  const summary = {
    journey: { id: 'journey', dog_id: 'dog', program_version_id: 'version', active_step_id: 'step', state: 'active',
      last_operation_id: 'operation', created_at: '2026-10-24T10:00:00Z', updated_at: '2026-10-24T10:00:00Z' },
    programTitle: 'Program', activeStepTitle: 'Step', loggedSessions: 3, confirmedMilestones: 2,
  };
  const pending = { action: { kind: 'record_session', programVersionId: 'version', stepId: 'step', feedback: 'practice_more' },
    operationId: 'operation', status: 'unknown' };

  assert.deepEqual(model.homeTrainingJourneyDisplay(summary, 'error', pending), {
    summary: null, readError: true, pending,
  });
});

test('Home retains exact saved counts and exposes same-operation retry without inventing source text', () => {
  const summary = {
    journey: { id: 'journey', dog_id: 'dog', program_version_id: 'version', active_step_id: 'step', state: 'active',
      last_operation_id: 'operation', created_at: '2026-10-24T10:00:00Z', updated_at: '2026-10-24T10:00:00Z' },
    programTitle: null, activeStepTitle: null, loggedSessions: 1, confirmedMilestones: 0,
  };
  const pending = { action: { kind: 'record_session', programVersionId: 'version', stepId: 'step', feedback: 'practice_more' },
    operationId: 'pending-operation', status: 'unknown' };
  const display = model.homeTrainingJourneyDisplay(summary, 'ready', pending);

  assert.equal(display.summary.loggedSessions, 1);
  assert.equal(display.summary.confirmedMilestones, 0);
  assert.equal(display.summary.activeStepTitle, null);
  assert.equal(display.pending.operationId, 'pending-operation');
});
