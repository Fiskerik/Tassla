import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLogEventFocus } from '../src/features/puppy-log/log-event-focus.ts';

const focus = { requestId: 1, eventId: 'a', dogId: 'dog-a', available: true };
const events = [
  { id: 'a', dogId: 'dog-a', type: 'food', occurredAt: '2026-10-24T23:30:00Z', note: 'Rätt', origin: 'local-test', accidentKinds: null },
  { id: 'b', dogId: 'dog-a', type: 'food', occurredAt: '2026-10-24T23:30:00Z', note: 'Annan', origin: 'local-test', accidentKinds: null },
];

test('focus resolves the exact event, even among equal-type and equal-time events', () => {
  assert.deepEqual(resolveLogEventFocus(focus, null, events, false), { kind: 'open', event: events[0] });
  assert.deepEqual(resolveLogEventFocus(focus, null, [...events].reverse(), false), { kind: 'open', event: events[0] });
});

test('replayed requests, another dog and missing or unavailable snapshots do not open an event', () => {
  assert.deepEqual(resolveLogEventFocus(focus, 1, events, false), { kind: 'ignored' });
  assert.deepEqual(resolveLogEventFocus(focus, 2, events, false), { kind: 'ignored' });
  assert.deepEqual(resolveLogEventFocus({ ...focus, dogId: 'dog-b' }, null, events, false), { kind: 'missing' });
  assert.deepEqual(resolveLogEventFocus({ ...focus, eventId: 'missing' }, null, events, false), { kind: 'missing' });
  assert.deepEqual(resolveLogEventFocus({ ...focus, available: false }, null, events, false), { kind: 'missing' });
});

test('an ongoing editor, recovery or mutation blocks the request without changing its inputs', () => {
  const before = structuredClone(events);
  assert.deepEqual(resolveLogEventFocus(focus, null, events, true), { kind: 'blocked' });
  assert.deepEqual(events, before);
  assert.deepEqual(focus, { requestId: 1, eventId: 'a', dogId: 'dog-a', available: true });
});
