import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const model = await import('../src/features/training/training-progression.ts');
const screen = await readFile(new URL('../src/features/training/PublishedTrainingScreen.tsx', import.meta.url), 'utf8');
const timelineModel = await readFile(new URL('../src/features/training/training-timeline-model.ts', import.meta.url), 'utf8');

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

test('journey overview shows one active step in a clickable timeline with a face-focused banner', () => {
  assert.match(screen, /testID="training-journey-banner"/);
  assert.match(screen, /buildTrainingTimeline\(/);
  assert.match(screen, /testID="training-journey-timeline"/);
  assert.match(screen, /accessibilityHint="Öppnar övningsinstruktionen\. Kommande steg är endast förhandsvisningar\."/);
  assert.match(screen, /training-timeline-step-\$\{step\.id\}/);
  assert.doesNotMatch(screen, /label="Öva på aktivt steg"/);
});

test('future and historical journey previews hide progression and legacy write controls', () => {
  assert.match(screen, /selectedTimelineReadOnly = Boolean\(selectedTimelineEntry/);
  assert.match(screen, /selectedStep && selectedTimelineReadOnly \? <View style=\{styles\.readOnlyNotice\}/);
  assert.match(screen, /Kommande steg · endast förhandsvisning/);
  assert.match(screen, /Tidigare steg · endast läsning/);
});

test('a confirmed milestone can still be the active step after moving back in a journey', () => {
  assert.match(timelineModel, /step\.id === activeStepId/);
  assert.match(screen, /entry\.milestoneLabel \? <Text style=\{styles\.timelineStatus\}>\{entry\.milestoneLabel\}/);
});
