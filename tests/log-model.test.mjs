import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOG_EVENT_TYPES,
  LOG_ENTRY_TYPES,
  addLogEvent,
  canStartLogMutation,
  checkInsertRetryOperation,
  createLogEvent,
  createSampleLogEvents,
  decideQuickLogPress,
  deleteLogEvent,
  finishLogMutationFlight,
  groupLogEventsByLocalDate,
  hasRecentCategoryLog,
  isLogMutationLifetimeCurrent,
  localDateTimeParts,
  logMutationStatusForWriteOutcome,
  parseLocalDateTime,
  retainLogMutationFlightForLifetime,
  summarizePottyPatterns,
  startLogMutationFlight,
  updateLogEvent,
} from '../src/features/puppy-log/log-model.ts';
import { DEFAULT_QUICK_LOG_LAYOUT, moveQuickLogType, normalizeQuickLogLayout } from '../src/features/puppy-log/quick-log-layout.ts';

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

test('log events accept legacy and current domain types and preserve a canonical event', () => {
  assert.deepEqual(LOG_EVENT_TYPES, ['pee', 'poop', 'food', 'sleep', 'awake', 'walk', 'accident', 'water']);
  assert.deepEqual(LOG_ENTRY_TYPES, ['pee', 'poop', 'food', 'sleep', 'walk', 'accident', 'water']);
  for (const type of LOG_EVENT_TYPES) {
    assert.equal(event({ type }).type, type);
  }
  assert.throws(() => event({ type: 'nap' }), /Unknown log event type/);
  assert.throws(() => event({ id: '  ' }), /IDs are required/);
  assert.throws(() => event({ dogId: '' }), /IDs are required/);
  assert.throws(() => event({ occurredAt: '2026-10-04T11:00:00Z' }), /canonical ISO timestamp/);
  assert.throws(() => event({ occurredAt: '2026-10-04T12:00:00.001Z' }), /future/);
});

test('quick-log layout keeps four compact defaults and moves types between groups', () => {
  assert.deepEqual(DEFAULT_QUICK_LOG_LAYOUT, {
    primary: ['pee', 'poop', 'food', 'sleep'],
    more: ['walk', 'accident', 'water'],
  });
  assert.deepEqual(moveQuickLogType(DEFAULT_QUICK_LOG_LAYOUT, 'water', 'primary'), {
    primary: ['pee', 'poop', 'food', 'water'],
    more: ['walk', 'accident', 'sleep'],
  });
  assert.deepEqual(moveQuickLogType(DEFAULT_QUICK_LOG_LAYOUT, 'sleep', 'more'), {
    primary: ['pee', 'poop', 'food'],
    more: ['walk', 'accident', 'water', 'sleep'],
  });
  assert.deepEqual(normalizeQuickLogLayout({ primary: ['pee', 'pee', 'unknown'], more: ['water'] }), {
    primary: ['pee'],
    more: ['water', 'poop', 'food', 'sleep', 'walk', 'accident'],
  });
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

test('quick-log duplicate protection uses an inclusive two-minute window and ignores future or other categories', () => {
  const now = Date.parse('2026-10-04T12:00:00.000Z');
  const events = [
    event({ id: 'at-boundary', occurredAt: '2026-10-04T11:58:00.000Z' }),
    event({ id: 'future', occurredAt: '2026-10-04T12:00:01.000Z' }, new Date('2026-10-04T12:01:00.000Z')),
    event({ id: 'other-category', type: 'food', occurredAt: '2026-10-04T11:59:00.000Z' }),
  ];
  assert.equal(hasRecentCategoryLog(events, 'pee', now), true);
  assert.equal(hasRecentCategoryLog([events[1]], 'pee', now), false);
  assert.equal(hasRecentCategoryLog([events[2]], 'pee', now), false);
  assert.equal(hasRecentCategoryLog([event({ occurredAt: '2026-10-04T11:57:59.999Z' })], 'pee', now), false);
});

test('quick-log press policy blocks rapid taps and pending writes but permits one explicit duplicate override', () => {
  const base = { blocked: false, force: false, lastSubmitAt: null, timestamp: 10_000, recentDuplicate: false };
  assert.equal(decideQuickLogPress(base), 'submit');
  assert.equal(decideQuickLogPress({ ...base, lastSubmitAt: 9_999 }), 'blocked');
  assert.equal(decideQuickLogPress({ ...base, lastSubmitAt: 8_000 }), 'submit');
  assert.equal(decideQuickLogPress({ ...base, blocked: true }), 'blocked');
  assert.equal(decideQuickLogPress({ ...base, recentDuplicate: true }), 'confirm-duplicate');
  assert.equal(decideQuickLogPress({ ...base, force: true, recentDuplicate: true }), 'submit');

  let writes = 0;
  for (const decision of [
    decideQuickLogPress(base),
    decideQuickLogPress({ ...base, lastSubmitAt: 10_000, timestamp: 10_100 }),
  ]) if (decision === 'submit') writes += 1;
  assert.equal(writes, 1, 'a rapid second press must not create another write');

  writes = 0;
  for (const decision of [
    decideQuickLogPress({ ...base, recentDuplicate: true }),
    decideQuickLogPress({ ...base, force: true, recentDuplicate: true }),
  ]) if (decision === 'submit') writes += 1;
  assert.equal(writes, 1, 'duplicate confirmation override must create exactly one write');
});

test('mutation policy preserves insert identity across readback retry and maps truthful states', async () => {
  const operation = { id: 'same-client-uuid', event_type: 'pee' };
  const readIds = [];
  const missing = await checkInsertRetryOperation(operation, async (id) => { readIds.push(id); return null; });
  assert.equal(missing.operation, operation);
  assert.equal(missing.operation.id, 'same-client-uuid');
  assert.deepEqual(readIds, ['same-client-uuid']);
  assert.equal(missing.found, null);

  const savedRow = { id: operation.id, event_type: operation.event_type };
  const found = await checkInsertRetryOperation(operation, async () => savedRow);
  assert.equal(found.operation, operation);
  assert.equal(found.found, savedRow);
  assert.equal(logMutationStatusForWriteOutcome('saved'), 'saved');
  assert.equal(logMutationStatusForWriteOutcome('failed'), 'failed');
  assert.equal(logMutationStatusForWriteOutcome('unknown'), 'unsure');
});

test('single-flight and lifetime policies block unresolved writes and stale responses', () => {
  assert.equal(canStartLogMutation(false, false), true);
  assert.equal(canStartLogMutation(true, false), false);
  assert.equal(canStartLogMutation(false, true), false);
  assert.equal(canStartLogMutation(true, true), false);
  assert.equal(isLogMutationLifetimeCurrent('dog-a:owner-a', 'dog-a:owner-a', true), true);
  assert.equal(isLogMutationLifetimeCurrent('dog-a:owner-a', 'dog-b:owner-a', true), false);
  assert.equal(isLogMutationLifetimeCurrent('dog-a:owner-a', 'dog-a:owner-a', false), false);

  const oldFlight = startLogMutationFlight(null, 'dog-a:owner-a', 'flight-a');
  assert.deepEqual(oldFlight, { token: 'flight-a', lifetime: 'dog-a:owner-a' });
  assert.equal(startLogMutationFlight(oldFlight, 'dog-a:owner-a', 'duplicate-flight'), null);
  assert.equal(retainLogMutationFlightForLifetime(oldFlight, 'dog-a:owner-a'), oldFlight);
  const releasedForLifetimeChange = retainLogMutationFlightForLifetime(oldFlight, 'dog-b:owner-a');
  assert.equal(releasedForLifetimeChange, null);
  const newFlight = startLogMutationFlight(releasedForLifetimeChange, 'dog-b:owner-a', 'flight-b');
  assert.deepEqual(newFlight, { token: 'flight-b', lifetime: 'dog-b:owner-a' });
  assert.equal(finishLogMutationFlight(newFlight, 'flight-a'), newFlight, 'stale finally must not clear the new lifetime flight');
  assert.equal(finishLogMutationFlight(newFlight, 'flight-b'), null, 'only the owning flight may clear itself');
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
