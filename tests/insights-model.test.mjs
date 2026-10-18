import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(specifier + '.ts', context);
    return nextResolve(specifier, context);
  },
});
const model = await import('../src/features/puppy-log/insights-model.ts');
hook.deregister();

const event = (id, occurredAt, eventType, accidentKinds = null) => ({
  id, dog_id: 'dog-1', occurred_at: occurredAt, event_type: eventType, accident_kinds: accidentKinds,
});

test('week range is Monday through Sunday and date shift crosses month/year boundaries', () => {
  assert.deepEqual(model.getInsightsRange('week', '2026-01-01', '2026-01-01'), {
    startDate: '2025-12-29', endDate: '2026-01-04', granularity: 'day',
  });
  assert.equal(model.shiftInsightsDate('2026-03-01', -1), '2026-02-28');
});

test('month range includes leap day and exact month end', () => {
  assert.deepEqual(model.getInsightsRange('month', '2024-02-15', '2024-02-29'), {
    startDate: '2024-02-01', endDate: '2024-02-29', granularity: 'day',
  });
});

test('since-start begins at the earliest local date and groups by month', () => {
  assert.deepEqual(model.getInsightsRange('since-start', '2026-10-18', '2026-10-18', '2026-01-31'), {
    startDate: '2026-01-31', endDate: '2026-10-18', granularity: 'month',
  });
  const buckets = model.buildInsightBuckets([
    event('a', '2026-01-31T23:59:00.000Z', 'pee'),
    event('b', '2026-02-01T00:01:00.000Z', 'poop'),
  ], 'since-start', '2026-10-18', '2026-10-18', 'UTC');
  assert.deepEqual(buckets.map((item) => item.key), ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
});

test('day buckets preserve unlogged gaps instead of emitting false zeroes', () => {
  const buckets = model.buildInsightBuckets([event('a', '2026-10-12T12:00:00.000Z', 'pee')],
    'week', '2026-10-12', '2026-10-18', 'UTC');
  assert.equal(buckets.length, 7);
  assert.deepEqual(buckets[0], {
    key: '2026-10-12', label: '12', startDate: '2026-10-12', endDate: '2026-10-12',
    pee: 1, poop: 0, hasCountableLog: true,
  });
  assert.equal(buckets[1].hasCountableLog, false);
});

test('a selected week with only older history stays uncounted and shows seven gaps', () => {
  const buckets = model.buildInsightBuckets([event('older', '2026-01-31T10:00:00.000Z', 'pee')],
    'week', '2026-10-18', '2026-10-18', 'UTC');
  assert.equal(buckets.length, 7);
  assert.ok(buckets.every((bucket) => !bucket.hasCountableLog && bucket.pee === 0 && bucket.poop === 0));
});

test('local day buckets remain stable across spring-forward and fall-back DST changes', () => {
  const spring = model.buildInsightBuckets([
    event('spring-before-midnight', '2026-03-28T22:59:00.000Z', 'pee'),
    event('spring-after-midnight', '2026-03-28T23:00:00.000Z', 'poop'),
    event('spring-before-clock-jump', '2026-03-29T00:30:00.000Z', 'pee'),
    event('spring-after-clock-jump', '2026-03-29T01:30:00.000Z', 'pee'),
  ], 'week', '2026-03-29', '2026-03-29', 'Europe/Stockholm');
  assert.equal(spring.find((bucket) => bucket.key === '2026-03-28')?.pee, 1);
  assert.equal(spring.find((bucket) => bucket.key === '2026-03-28')?.poop, 0);
  assert.equal(spring.find((bucket) => bucket.key === '2026-03-29')?.pee, 2);
  assert.equal(spring.find((bucket) => bucket.key === '2026-03-29')?.poop, 1);

  const fall = model.buildInsightBuckets([
    event('fall-first-0230', '2026-10-25T00:30:00.000Z', 'pee'),
    event('fall-second-0230', '2026-10-25T01:30:00.000Z', 'poop'),
  ], 'week', '2026-10-25', '2026-10-25', 'Europe/Stockholm');
  assert.equal(fall.find((bucket) => bucket.key === '2026-10-25')?.pee, 1);
  assert.equal(fall.find((bucket) => bucket.key === '2026-10-25')?.poop, 1);
});

test('typed accidents count only explicitly selected canonical kinds; legacy unknown remains uncounted', () => {
  const buckets = model.buildInsightBuckets([
    event('typed', '2026-10-12T12:00:00.000Z', 'accident', ['pee', 'poop']),
    event('legacy', '2026-10-12T13:00:00.000Z', 'accident', null),
  ], 'week', '2026-10-12', '2026-10-18', 'UTC');
  assert.equal(buckets[0].pee, 1);
  assert.equal(buckets[0].poop, 1);
  assert.equal(buckets[0].hasCountableLog, true);
  assert.equal(buckets[1].hasCountableLog, false);
});

test('local date grouping uses the selected IANA zone across a UTC day boundary', () => {
  assert.equal(model.insightsLocalDateKey('2026-10-18T00:15:00.000Z', 'America/Los_Angeles'), '2026-10-17');
  assert.equal(model.insightsLocalDateKey('2026-10-18T00:15:00.000Z', 'Europe/Stockholm'), '2026-10-18');
});

test('invalid timezone and invalid date keys are rejected', () => {
  assert.equal(model.isValidInsightsTimeZone('Not/AZone'), false);
  assert.equal(model.isValidDateKey('2026-02-30'), false);
  assert.throws(() => model.buildInsightBuckets([], 'week', '2026-10-12', '2026-10-18', 'Not/AZone'), /Invalid insights time zone/);
});

test('future periods cannot be selected, while older periods remain reachable', () => {
  assert.equal(model.canNavigateInsightsPeriod('week', 'next', '2026-10-12', '2026-10-18'), false);
  assert.equal(model.canNavigateInsightsPeriod('week', 'previous', '2026-10-12', '2026-10-18'), true);
  assert.equal(model.canNavigateInsightsPeriod('month', 'next', '2026-10-01', '2026-10-18'), false);
  assert.equal(model.canNavigateInsightsPeriod('month', 'previous', '2026-10-01', '2026-10-18'), true);
  assert.equal(model.canNavigateInsightsPeriod('since-start', 'previous', '2026-10-18', '2026-10-18'), false);
});

test('since-start before any event has no fake history bucket', () => {
  assert.deepEqual(model.getInsightsRange('since-start', '2026-10-18', '2026-10-18', null), {
    startDate: '2026-10-18', endDate: '2026-10-18', granularity: 'month',
  });
});

test('week range formatting is human-readable without changing its machine keys', () => {
  const range = model.getInsightsRange('week', '2026-10-14', '2026-10-18');
  assert.equal(model.formatInsightsRange('week', range, 'en-US'), 'Oct 12–Oct 18, 2026');
});
