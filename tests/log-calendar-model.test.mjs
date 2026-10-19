import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const model = await import('../src/features/puppy-log/log-calendar-model.ts');
hooks.deregister();

test('calendar grid is Monday-first and spans leap days and year boundaries', () => {
  const february = model.monthCalendarDays('2024-02');
  assert.equal(february[0].dateKey, null);
  assert.equal(february.find((cell) => cell.day === 1).dateKey, '2024-02-01');
  assert.ok(february.some((cell) => cell.dateKey === '2024-02-29'));
  assert.equal(model.shiftMonth('2025-01', -1), '2024-12');
  assert.equal(model.shiftMonth('2025-12', 1), '2026-01');
  assert.ok(model.monthCalendarDays('2026-10').length % 7 === 0);
});

test('calendar month range uses local half-open boundaries across DST', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'Europe/Stockholm';
  try {
    const march = model.localMonthRange('2026-03');
    const april = model.localMonthRange('2026-04');
    assert.equal(march.startIso, '2026-02-28T23:00:00.000Z');
    assert.equal(march.endIso, '2026-03-31T22:00:00.000Z');
    assert.equal(april.startIso, march.endIso);
    assert.throws(() => model.localMonthRange('2026-13'));
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('markers deduplicate timestamps by local calendar day', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'Europe/Stockholm';
  try {
    assert.deepEqual(model.dedupeLocalDateMarkers([
      '2026-10-04T00:30:00.000Z',
      '2026-10-04T00:30:00.000Z',
      '2026-10-04T22:30:00.000Z',
      '2026-10-03T22:30:00.000Z',
    ]), ['2026-10-04', '2026-10-05']);
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('calendar marker identity changes for account/dog lifetime, timezone, and month', () => {
  const base = model.calendarMarkerScopeKey('user-a:3:dog-a', 'Europe/Stockholm', '2026-10');
  assert.notEqual(base, model.calendarMarkerScopeKey('user-b:3:dog-a', 'Europe/Stockholm', '2026-10'));
  assert.notEqual(base, model.calendarMarkerScopeKey('user-a:3:dog-b', 'Europe/Stockholm', '2026-10'));
  assert.notEqual(base, model.calendarMarkerScopeKey('user-a:3:dog-a', 'UTC', '2026-10'));
  assert.notEqual(base, model.calendarMarkerScopeKey('user-a:3:dog-a', 'Europe/Stockholm', '2026-11'));
});
