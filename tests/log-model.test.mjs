import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOG_EVENT_TYPES,
  addLogEvent,
  createLogEvent,
  createSampleLogEvents,
  deleteLogEvent,
  groupLogEventsByLocalDate,
  localDateTimeParts,
  parseLocalDateTime,
  summarizePottyPatterns,
  updateLogEvent,
} from '../src/features/puppy-log/log-model.ts';

const fixedNow = new Date('2026-10-04T12:00:00.000Z');

function event(overrides = {}, now = fixedNow) {
  return createLogEvent({
    id: 'event-1',
    dogId: 'synthetic-dog-1',
    type: 'pee',
    occurredAt: '2026-10-04T11:00:00.000Z',
    ...overrides,
  }, now);
}

test('log events accept all six domain types and preserve a canonical event', () => {
  assert.deepEqual(LOG_EVENT_TYPES, ['pee', 'poop', 'food', 'sleep', 'awake', 'walk']);
  for (const type of LOG_EVENT_TYPES) {
    assert.equal(event({ type }).type, type);
  }
  assert.throws(() => event({ type: 'nap' }), /Unknown log event type/);
  assert.throws(() => event({ id: '  ' }), /IDs are required/);
  assert.throws(() => event({ dogId: '' }), /IDs are required/);
  assert.throws(() => event({ occurredAt: '2026-10-04T11:00:00Z' }), /canonical ISO timestamp/);
  assert.throws(() => event({ occurredAt: '2026-10-04T12:00:00.001Z' }), /future/);
});

test('potty summaries are retrospective, separate by type, and use median adjacent intervals', () => {
  const events = [
    event({ id: 'pee-1', type: 'pee', occurredAt: '2026-10-01T08:00:00.000Z' }, new Date('2026-10-02T12:00:00.000Z')),
    event({ id: 'pee-2', type: 'pee', occurredAt: '2026-10-01T10:00:00.000Z' }, new Date('2026-10-02T12:00:00.000Z')),
    event({ id: 'pee-3', type: 'pee', occurredAt: '2026-10-01T15:00:00.000Z' }, new Date('2026-10-02T12:00:00.000Z')),
    event({ id: 'poop-1', type: 'poop', occurredAt: '2026-10-01T09:00:00.000Z' }, new Date('2026-10-02T12:00:00.000Z')),
  ];
  assert.deepEqual(summarizePottyPatterns(events), [
    { type: 'pee', count: 3, medianIntervalMinutes: 210 },
    { type: 'poop', count: 1, medianIntervalMinutes: null },
  ]);
});

test('notes are trimmed, empty notes become null, and the 500 Unicode code-point limit is exact', () => {
  assert.equal(event({ note: '  ute efter maten  ' }).note, 'ute efter maten');
  assert.equal(event({ note: '   ' }).note, null);
  assert.equal(event({ note: '🐕'.repeat(500) }).note?.length, 1000);
  assert.throws(() => event({ note: '🐕'.repeat(501) }), /500 characters or fewer/);
});

test('sample events have stable IDs and dog identity and are returned newest first', () => {
  const first = createSampleLogEvents('synthetic-dog-1', fixedNow);
  const second = createSampleLogEvents('synthetic-dog-1', fixedNow);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map(({ id }) => id), [
    'synthetic-dog-1-example-4',
    'synthetic-dog-1-example-3',
    'synthetic-dog-1-example-2',
    'synthetic-dog-1-example-1',
  ]);
  assert.ok(first.every(({ dogId, origin }) => dogId === 'synthetic-dog-1' && origin === 'example'));
  assert.deepEqual(first.map(({ occurredAt }) => occurredAt), [...first].map(({ occurredAt }) => occurredAt).sort().reverse());
});

test('add, update, and delete are immutable, preserve ownership, and reject duplicate IDs', () => {
  const original = [event()];
  const second = event({ id: 'event-2', occurredAt: '2026-10-04T10:00:00.000Z' });
  const added = addLogEvent(original, second);
  assert.notEqual(added, original);
  assert.equal(original.length, 1);
  assert.deepEqual(addLogEvent(added, event({ id: 'event-2', type: 'food' })), added);

  const updated = updateLogEvent(added, 'event-2', {
    type: 'walk',
    occurredAt: '2026-10-04T11:30:00.000Z',
    note: '  kort runda  ',
    dogId: 'other-dog',
    id: 'replacement-id',
  }, fixedNow);
  assert.deepEqual(updated[0], event({
    id: 'event-2',
    type: 'walk',
    occurredAt: '2026-10-04T11:30:00.000Z',
    note: 'kort runda',
  }));
  assert.equal(updated[0].origin, 'local-test');
  assert.equal(updated[0].dogId, 'synthetic-dog-1');
  assert.equal(added[1].occurredAt, '2026-10-04T10:00:00.000Z');
  assert.deepEqual(updateLogEvent(added, 'missing', { type: 'food' }, fixedNow), added);
  assert.deepEqual(deleteLogEvent(added, 'event-2'), [added[0]]);
  assert.deepEqual(deleteLogEvent(added, 'missing'), added);
  assert.equal(added.length, 2);
  assert.throws(() => updateLogEvent(added, 'event-2', { occurredAt: '2026-10-04T12:00:00.001Z' }, fixedNow), /future/);
});

test('local date-time parsing validates calendar dates, clock bounds, and future timestamps', () => {
  const localNow = new Date(2026, 9, 4, 12, 0, 0, 0);
  const accepted = parseLocalDateTime('2024-02-29', '08:05', localNow);
  assert.equal(accepted, new Date(2024, 1, 29, 8, 5).toISOString());
  assert.equal(parseLocalDateTime('2026-10-04', '12:00', localNow), localNow.toISOString());
  for (const [date, time] of [
    ['2026-02-29', '12:00'],
    ['2026-04-31', '12:00'],
    ['2026-10-04', '24:00'],
    ['2026-10-04', '12:60'],
    ['2026-10-04', '12:01'],
    ['04-10-2026', '12:00'],
    ['2026-10-04', '12:00:00'],
  ]) {
    assert.equal(parseLocalDateTime(date, time, localNow), null, `${date} ${time}`);
  }
});

const isStockholm = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Stockholm';
test('local date-time parsing rejects the nonexistent Stockholm spring-forward time', { skip: !isStockholm }, () => {
  assert.equal(parseLocalDateTime('2026-03-29', '02:30', new Date(2027, 0, 1)), null);
});

test('local parts and history groups use the device local calendar date and newest-first order', () => {
  const older = new Date(2026, 9, 3, 23, 59, 0, 0);
  const newer = new Date(2026, 9, 4, 0, 1, 0, 0);
  const tiedAt = new Date(2026, 9, 4, 12, 0, 0, 0).toISOString();
  const groupNow = new Date(2026, 9, 5, 12, 0, 0, 0);
  const sameTimeA = event({ id: 'tie-a', occurredAt: tiedAt }, groupNow);
  const sameTimeB = event({ id: 'tie-b', occurredAt: tiedAt }, groupNow);
  const input = [
    event({ id: 'older', occurredAt: older.toISOString() }, groupNow),
    event({ id: 'newer', occurredAt: newer.toISOString() }, groupNow),
    sameTimeA,
    sameTimeB,
  ];
  const originalOrder = input.map(({ id }) => id);
  assert.deepEqual(localDateTimeParts(older.toISOString()), {
    date: '2026-10-03',
    time: '23:59',
  });

  const groups = groupLogEventsByLocalDate(input);
  assert.deepEqual(groups.map(({ date }) => date), ['2026-10-04', '2026-10-03']);
  assert.deepEqual(groups[0].events.map(({ id }) => id), ['tie-b', 'tie-a', 'newer']);
  assert.deepEqual(groups[1].events.map(({ id }) => id), ['older']);
  assert.deepEqual(input.map(({ id }) => id), originalOrder);
  assert.throws(() => localDateTimeParts('invalid'), /Invalid event timestamp/);
});
