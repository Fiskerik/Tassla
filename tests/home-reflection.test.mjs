import test from 'node:test';
import assert from 'node:assert/strict';
import { latestHomeReflection, latestTrainingReflection } from '../src/features/home/home-reflection.ts';

const event = (id, dogId, occurredAt, type = 'walk') => ({ id, dogId, occurredAt, type, note: null, origin: 'local-test', accidentKinds: null });

test('reflection chooses the latest past event for the active dog', () => {
  const result = latestHomeReflection([
    event('old', 'dog-a', '2026-08-14T12:00:00', 'food'),
    event('new', 'dog-a', '2026-08-15T12:00:00'),
    event('other', 'dog-b', '2026-08-16T12:00:00'),
    event('future', 'dog-a', '2027-01-01T12:00:00'),
    event('invalid', 'dog-a', 'invalid'),
  ], 'dog-a', new Date('2026-10-26T12:00:00'));
  assert.deepEqual(result, { label: 'Promenad', date: '15 augusti', occurredAt: '2026-08-15T12:00:00' });
});

test('training reflection uses dated, confirmed rows for the active dog and available versions only', () => {
  const now = new Date('2026-10-26T12:00:00Z');
  const workspace = {
    journeys: [{ id: 'journey-a', dog_id: 'dog-a', program_version_id: 'version-a' }, { id: 'journey-b', dog_id: 'dog-b', program_version_id: 'version-a' }],
    sessions: [{ id: 'session', journey_id: 'journey-a', dog_id: 'dog-a', program_version_id: 'version-a', step_id: 'step-1', performed_at: '2026-08-14T12:00:00Z' }],
    milestones: [{ id: 'future', journey_id: 'journey-a', dog_id: 'dog-a', program_version_id: 'version-a', step_id: 'step-1', confirmed_at: '2027-01-01T12:00:00Z' },
      { id: 'other', journey_id: 'journey-b', dog_id: 'dog-b', program_version_id: 'version-a', step_id: 'step-1', confirmed_at: '2026-08-16T12:00:00Z' },
      { id: 'saved', journey_id: 'journey-a', dog_id: 'dog-a', program_version_id: 'version-a', step_id: 'step-1', confirmed_at: '2026-08-15T12:00:00Z' }],
  };
  const programs = [{ id: 'version-a', steps: [{ id: 'step-1', title: 'Kom när du ropar' }] }];
  assert.deepEqual(latestTrainingReflection(workspace, programs, 'dog-a', new Set(), now), {
    label: 'Kom när du ropar', date: '15 augusti', occurredAt: '2026-08-15T12:00:00Z', programVersionId: 'version-a', stepId: 'step-1', journeyId: 'journey-a', rowId: 'saved', kind: 'milestone',
  });
  assert.equal(latestTrainingReflection(workspace, programs, 'dog-a', new Set(['version-a']), now), null);
  assert.equal(latestTrainingReflection(workspace, [], 'dog-a', new Set(), now), null);
});

test('reflection omits missing events and includes an earlier calendar year', () => {
  const now = new Date('2026-10-26T12:00:00');
  assert.equal(latestHomeReflection([], 'dog-a', now), null);
  assert.equal(latestHomeReflection([event('other', 'dog-b', '2026-08-15T12:00:00Z')], 'dog-a', now), null);
  assert.deepEqual(latestHomeReflection([event('old', 'dog-a', '2025-08-15T12:00:00', 'food')], 'dog-a', now), { label: 'Mat', date: '15 augusti 2025', occurredAt: '2025-08-15T12:00:00' });
});

test('a confirmed milestone remains the memory when a newer session exists', () => {
  const workspace = { journeys: [{ id: 'j', dog_id: 'dog', program_version_id: 'p' }],
    sessions: [{ id: 's', journey_id: 'j', dog_id: 'dog', program_version_id: 'p', step_id: 'later', performed_at: '2026-10-25T12:00:00Z' }],
    milestones: [{ id: 'm', journey_id: 'j', dog_id: 'dog', program_version_id: 'p', step_id: 'earlier', confirmed_at: '2026-08-15T12:00:00Z' }] };
  const programs = [{ id: 'p', steps: [{ id: 'earlier', title: 'Inkallning' }, { id: 'later', title: 'Nästa övning' }] }];
  const result = latestTrainingReflection(workspace, programs, 'dog', new Set(), new Date('2026-10-26T12:00:00Z'));
  assert.equal(result.kind, 'milestone'); assert.equal(result.stepId, 'earlier'); assert.equal(result.rowId, 'm');
  assert.equal(latestTrainingReflection(workspace, programs, 'dog', new Set(['p']), new Date('2026-10-26T12:00:00Z')), null);
});

test('training memory rejects orphaned rows and breaks equal-time ties deterministically', () => {
  const time = '2026-10-25T12:00:00Z';
  const row = (id, journey_id, step_id) => ({ id, journey_id, dog_id: 'dog', program_version_id: 'p', step_id, confirmed_at: time });
  const workspace = { journeys: [{ id: 'j', dog_id: 'dog', program_version_id: 'p' }], sessions: [],
    milestones: [row('z', 'j', 'step'), row('orphan', 'missing', 'step'), row('missing-step', 'j', 'missing'), row('a', 'j', 'step')] };
  const programs = [{ id: 'p', steps: [{ id: 'step', title: 'Kontakt' }] }];
  const result = latestTrainingReflection(workspace, programs, 'dog', new Set(), new Date('2026-10-26T12:00:00Z'));
  assert.equal(result.rowId, 'a');
  assert.equal(result.journeyId, 'j');
});
