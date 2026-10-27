import test from 'node:test';
import assert from 'node:assert/strict';
import { latestHomeReflection } from '../src/features/home/home-reflection.ts';

const event = (id, dogId, occurredAt, type = 'walk') => ({ id, dogId, occurredAt, type, note: null, origin: 'local-test', accidentKinds: null });

test('reflection chooses the latest past event for the active dog', () => {
  const result = latestHomeReflection([
    event('old', 'dog-a', '2026-08-14T12:00:00', 'food'),
    event('new', 'dog-a', '2026-08-15T12:00:00'),
    event('other', 'dog-b', '2026-08-16T12:00:00'),
    event('future', 'dog-a', '2027-01-01T12:00:00'),
    event('invalid', 'dog-a', 'invalid'),
  ], 'dog-a', new Date('2026-10-26T12:00:00'));
  assert.deepEqual(result, { label: 'Promenad', date: '15 augusti' });
});

test('reflection omits missing events and includes an earlier calendar year', () => {
  const now = new Date('2026-10-26T12:00:00');
  assert.equal(latestHomeReflection([], 'dog-a', now), null);
  assert.equal(latestHomeReflection([event('other', 'dog-b', '2026-08-15T12:00:00Z')], 'dog-a', now), null);
  assert.deepEqual(latestHomeReflection([event('old', 'dog-a', '2025-08-15T12:00:00', 'food')], 'dog-a', now), { label: 'Mat', date: '15 augusti 2025' });
});
