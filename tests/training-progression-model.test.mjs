import test from 'node:test';
import assert from 'node:assert/strict';

const model = await import('../src/features/training/training-progression.ts');

const dogId = 'dog-a';
const versionA = 'version-a';
const versionB = 'version-b';
const journeyA = {
  id: 'journey-a', dog_id: dogId, program_version_id: versionA, active_step_id: 'step-a2',
  state: 'active', last_operation_id: 'op-a', created_at: '2026-10-20T12:00:00Z', updated_at: '2026-10-22T12:00:00Z',
};
const journeyB = {
  id: 'journey-b', dog_id: dogId, program_version_id: versionB, active_step_id: 'step-b1',
  state: 'paused', last_operation_id: 'op-b', created_at: '2026-10-21T12:00:00Z', updated_at: '2026-10-23T12:00:00Z',
};

test('summary counts saved sessions and unique confirmed steps only for the selected journey', () => {
  const workspace = {
    journeys: [journeyA, journeyB],
    sessions: [
      { id: 'session-a1', journey_id: 'journey-a', dog_id: dogId, program_version_id: versionA, step_id: 'step-a1', operation_id: 'op-1', feedback: 'worked_as_planned', performed_at: '2026-10-20T12:00:00Z' },
      { id: 'session-a2', journey_id: 'journey-a', dog_id: dogId, program_version_id: versionA, step_id: 'step-a1', operation_id: 'op-2', feedback: 'practice_more', performed_at: '2026-10-21T12:00:00Z' },
      { id: 'session-b1', journey_id: 'journey-b', dog_id: dogId, program_version_id: versionB, step_id: 'step-b1', operation_id: 'op-3', feedback: 'paused_early', performed_at: '2026-10-22T12:00:00Z' },
    ],
    milestones: [
      { id: 'milestone-a1', journey_id: 'journey-a', dog_id: dogId, program_version_id: versionA, step_id: 'step-a1', confirmation_operation_id: 'op-4', confirmed_at: '2026-10-22T12:00:00Z' },
      { id: 'milestone-a1-duplicate-fixture', journey_id: 'journey-a', dog_id: dogId, program_version_id: versionA, step_id: 'step-a1', confirmation_operation_id: 'op-5', confirmed_at: '2026-10-22T12:01:00Z' },
      { id: 'milestone-b1', journey_id: 'journey-b', dog_id: dogId, program_version_id: versionB, step_id: 'step-b1', confirmation_operation_id: 'op-6', confirmed_at: '2026-10-22T12:02:00Z' },
    ],
  };

  const summary = model.latestHomeTrainingSummary(workspace, [
    { id: versionA, title: 'Program A', steps: [{ id: 'step-a1', title: 'Första steget' }, { id: 'step-a2', title: 'Andra steget' }] },
    { id: versionB, title: 'Program B', steps: [{ id: 'step-b1', title: 'Börja lugnt' }] },
  ]);
  assert.equal(summary.journey.id, 'journey-b');
  assert.equal(summary.programTitle, 'Program B');
  assert.equal(summary.activeStepTitle, 'Börja lugnt');
  assert.equal(summary.loggedSessions, 1);
  assert.equal(summary.confirmedMilestones, 1);

  const byProgram = model.progressionForProgram(workspace, versionA);
  assert.equal(byProgram.journey.id, 'journey-a');
  assert.equal(byProgram.sessions.length, 2);
  assert.equal(new Set(byProgram.milestones.map((row) => row.step_id)).size, 1);
});

test('Home tie-breaks journeys deterministically and never invents withdrawn step text', () => {
  const workspace = { journeys: [
    { ...journeyA, updated_at: '2026-10-24T12:00:00Z' },
    { ...journeyB, updated_at: '2026-10-24T12:00:00Z' },
  ], sessions: [], milestones: [] };
  const summary = model.latestHomeTrainingSummary(workspace, []);
  assert.equal(summary.journey.program_version_id, versionA);
  assert.equal(summary.programTitle, null);
  assert.equal(summary.activeStepTitle, null);
  assert.equal(summary.loggedSessions, 0);
  assert.equal(summary.confirmedMilestones, 0);
});

test('operation payload identity and saved readback stay scoped to the exact dog/version', () => {
  const action = { kind: 'record_session', programVersionId: versionA, stepId: 'step-a2', feedback: 'practice_more' };
  assert.equal(model.sameTrainingProgressionAction(action, { ...action }), true);
  assert.equal(model.sameTrainingProgressionAction(action, { ...action, feedback: 'worked_as_planned' }), false);
  assert.equal(model.sameTrainingProgressionAction(action, { ...action, programVersionId: versionB }), false);

  const workspace = { journeys: [journeyA], sessions: [
    { id: 'session-a', journey_id: journeyA.id, dog_id: dogId, program_version_id: versionA, step_id: 'step-a2', operation_id: 'operation-a', feedback: 'practice_more', performed_at: '2026-10-24T12:00:00Z' },
  ], milestones: [] };
  assert.equal(model.operationAppliedToWorkspace(workspace, dogId, action, 'operation-a'), true);
  assert.equal(model.operationAppliedToWorkspace(workspace, 'dog-b', action, 'operation-a'), false);
  assert.equal(model.operationAppliedToWorkspace(workspace, dogId, { ...action, programVersionId: versionB }, 'operation-a'), false);
  assert.equal(model.operationAppliedToWorkspace(workspace, dogId, action, 'another-operation'), false);
});

test('unknown start and milestone reads require the same operation receipt evidence', () => {
  const start = { kind: 'start_or_resume', programVersionId: versionA };
  const emptyJourneyResult = { journeys: [{ ...journeyA, state: 'active' }], sessions: [], milestones: [] };
  assert.equal(model.operationAppliedToWorkspace(emptyJourneyResult, dogId, start, 'another-operation'), false);
  assert.equal(model.operationAppliedToWorkspace(emptyJourneyResult, dogId, start, journeyA.last_operation_id), true);

  const confirm = { kind: 'confirm_step', programVersionId: versionA, stepId: 'step-a1' };
  const milestoneWorkspace = { ...emptyJourneyResult, milestones: [{ id: 'milestone-a', journey_id: journeyA.id, dog_id: dogId,
    program_version_id: versionA, step_id: 'step-a1', confirmation_operation_id: 'confirm-op', confirmed_at: '2026-10-24T12:00:00Z' }] };
  assert.equal(model.operationAppliedToWorkspace(milestoneWorkspace, dogId, confirm, 'another-confirm-op'), false);
  assert.equal(model.operationAppliedToWorkspace(milestoneWorkspace, dogId, confirm, 'confirm-op'), true);
});

test('undo requires its exact operation and cannot hide a newer confirmation', () => {
  const action = { kind: 'undo_step', programVersionId: versionA, stepId: 'step-a2', expectedMilestoneId: 'old-milestone' };
  assert.equal(model.sameTrainingProgressionAction(action, { ...action, expectedMilestoneId: 'new-milestone' }), false);
  const undone = { journeys: [{ ...journeyA, last_operation_id: 'undo-op' }], sessions: [], milestones: [] };
  assert.equal(model.operationAppliedToWorkspace(undone, dogId, action, 'undo-op'), true);
  assert.equal(model.operationAppliedToWorkspace(undone, dogId, action, 'other-op'), false);
  const newer = { ...undone, milestones: [{ id: 'new-milestone', journey_id: journeyA.id, step_id: 'step-a2' }] };
  assert.equal(model.operationAppliedToWorkspace(newer, dogId, action, 'undo-op'), false);
  const receipt = { operation_id: 'undo-op', action: 'undo_step', journey_id: journeyA.id, dog_id: dogId,
    program_version_id: versionA, active_step_id: 'step-a2', state: 'active', session_id: null, milestone_id: 'old-milestone' };
  assert.equal(model.isTrainingProgressionResult(receipt), true);
  assert.equal(model.operationAppearsInReadback(undone, receipt), true);
  assert.equal(model.operationAppearsInReadback(newer, receipt), false);
});

test('a saved session never advances skill; confirmation stays separate and navigation is explicit', () => {
  const steps = [{ id: 'step-1', title: 'Första' }, { id: 'step-2', title: 'Andra' }];
  const session = { id: 'session', journey_id: journeyA.id, dog_id: dogId, program_version_id: versionA,
    step_id: 'step-1', operation_id: 'session-op', feedback: 'worked_as_planned', performed_at: '2026-10-24T12:00:00Z' };
  const practiced = model.trainingProgressionPresentation({ journeys: [{ ...journeyA, active_step_id: 'step-1' }], sessions: [session], milestones: [] }, versionA, steps);
  assert.equal(practiced.activeStepId, 'step-1');
  assert.equal(practiced.currentStepConfirmed, false);
  assert.equal(practiced.canConfirmStep, true);
  assert.equal(practiced.canGoNext, false);

  const milestone = { id: 'milestone', journey_id: journeyA.id, dog_id: dogId, program_version_id: versionA,
    step_id: 'step-1', confirmation_operation_id: 'confirm-op', confirmed_at: '2026-10-24T12:01:00Z' };
  const confirmed = model.trainingProgressionPresentation({ journeys: [{ ...journeyA, active_step_id: 'step-1' }], sessions: [session], milestones: [milestone] }, versionA, steps);
  assert.equal(confirmed.currentStepConfirmed, true);
  assert.equal(confirmed.canGoNext, true);
  assert.equal(confirmed.activeStepId, 'step-1', 'the saved step does not change until the owner separately chooses next');

  const paused = model.trainingProgressionPresentation({ journeys: [{ ...journeyA, state: 'paused', active_step_id: 'step-1' }], sessions: [session], milestones: [milestone] }, versionA, steps);
  assert.equal(paused.stateLabel, 'Pausad');
  assert.equal(paused.canStartOrResume, true);
  assert.equal(paused.canLogSession, false);
  assert.equal(paused.canGoNext, false);

  const legacyMaintenance = model.trainingProgressionPresentation({ journeys: [{ ...journeyA, state: 'maintenance', active_step_id: 'step-1' }], sessions: [], milestones: [] }, versionA, steps);
  assert.equal(legacyMaintenance.stateLabel, 'Pågående');
  assert.equal(legacyMaintenance.canLogSession, true);
});

test('operation result parser rejects unknown server actions and malformed saved results', () => {
  const valid = { operation_id: 'op', action: 'start_or_resume', journey_id: 'journey', dog_id: dogId,
    program_version_id: versionA, active_step_id: 'step-a1', state: 'active', session_id: null, milestone_id: null };
  assert.equal(model.isTrainingProgressionResult(valid), true);
  assert.equal(model.isTrainingProgressionResult({ ...valid, action: 'delete_everything' }), false);
  assert.equal(model.isTrainingProgressionResult({ ...valid, state: 'unknown' }), false);
});
