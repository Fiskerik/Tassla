import test from 'node:test';
import assert from 'node:assert/strict';
import { createInsightsRange, projectInsights } from '../src/features/puppy-log/insights-model.ts';

const timeZone = 'Europe/Stockholm';

test('week, month and since-start use local half-open boundaries at exact Instants', () => {
  const now = new Date('2026-10-22T10:00:00.000Z');
  const week = createInsightsRange('Vecka', now, timeZone);
  const month = createInsightsRange('Månad', now, timeZone);
  const all = createInsightsRange('Sedan start', now, timeZone);
  assert.deepEqual([week.startDate, week.endDate, week.startIso, week.endIso], [
    '2026-10-19', '2026-10-26', '2026-10-18T22:00:00.000Z', '2026-10-25T23:00:00.000Z',
  ]);
  assert.deepEqual([month.startDate, month.endDate, month.startIso, month.endIso], [
    '2026-10-01', '2026-11-01', '2026-09-30T22:00:00.000Z', '2026-10-31T23:00:00.000Z',
  ]);
  assert.deepEqual([all.startDate, all.endDate, all.startIso, all.endIso], [
    null, '2026-10-23', null, '2026-10-22T22:00:00.000Z',
  ]);
});

test('spring and fall weeks preserve local midnight across daylight-saving changes', () => {
  const spring = createInsightsRange('Vecka', new Date('2026-03-26T12:00:00Z'), timeZone);
  const fall = createInsightsRange('Vecka', new Date('2026-10-22T12:00:00Z'), timeZone);
  assert.deepEqual([spring.startIso, spring.endIso, Date.parse(spring.endIso) - Date.parse(spring.startIso)], [
    '2026-03-22T23:00:00.000Z', '2026-03-29T22:00:00.000Z', 167 * 60 * 60 * 1000,
  ]);
  assert.deepEqual([fall.startIso, fall.endIso, Date.parse(fall.endIso) - Date.parse(fall.startIso)], [
    '2026-10-18T22:00:00.000Z', '2026-10-25T23:00:00.000Z', 169 * 60 * 60 * 1000,
  ]);
});

test('events exactly on start are included and events exactly on end are excluded', () => {
  const range = createInsightsRange('Vecka', new Date('2026-10-22T10:00:00Z'), timeZone);
  const events = [
    { id: 'before', event_type: 'pee', occurred_at: '2026-10-18T21:59:59.999Z' },
    { id: 'at-start', event_type: 'pee', occurred_at: range.startIso },
    { id: 'inside', event_type: 'poop', occurred_at: '2026-10-23T00:00:00.000Z' },
    { id: 'at-end', event_type: 'poop', occurred_at: range.endIso },
    { id: 'other-type', event_type: 'accident', occurred_at: '2026-10-23T00:00:00.000Z' },
  ];
  const model = projectInsights({ events, range, timeZone, status: 'ready' });
  assert.equal(model.peeTotal, 1);
  assert.equal(model.poopTotal, 1);
  assert.equal(model.buckets.reduce((sum, bucket) => sum + bucket.pee + bucket.poop, 0), 2);
  assert.deepEqual(model.buckets.map((bucket) => bucket.label), ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']);
});

test('month buckets follow calendar weeks and keep actual month edges', () => {
  const range = createInsightsRange('Månad', new Date('2026-10-22T10:00:00Z'), timeZone);
  const events = [
    { id: 'sun', event_type: 'pee', occurred_at: '2026-10-04T10:00:00Z' },
    { id: 'mon', event_type: 'poop', occurred_at: '2026-10-05T10:00:00Z' },
    { id: 'last', event_type: 'pee', occurred_at: '2026-10-31T12:00:00Z' },
  ];
  const model = projectInsights({ events, range, timeZone, status: 'ready' });
  assert.equal(model.bucketUnit, 'week');
  assert.equal(model.buckets.length, 5);
  assert.deepEqual(model.buckets[0], {
    key: '2026-09-28', label: '1–4', startDate: '2026-10-01', endDate: '2026-10-05', pee: 1, poop: 0, partial: false,
  });
  assert.equal(model.buckets.reduce((sum, bucket) => sum + bucket.pee + bucket.poop, 0), 3);
});

test('since-start switches from month to year only when covered data is older than two years', () => {
  const range = createInsightsRange('Sedan start', new Date('2026-10-22T10:00:00Z'), timeZone);
  const atBoundary = projectInsights({
    range, timeZone, status: 'ready', events: [{ id: 'at-two-years', event_type: 'pee', occurred_at: '2024-10-23T10:00:00Z' }],
  });
  const beyondBoundary = projectInsights({
    range, timeZone, status: 'ready', events: [{ id: 'over-two-years', event_type: 'pee', occurred_at: '2024-10-21T10:00:00Z' }],
  });
  assert.equal(atBoundary.bucketUnit, 'month');
  assert.equal(beyondBoundary.bucketUnit, 'year');
});

test('partial reads report actual coverage and mark the oldest loaded bucket partial', () => {
  const range = createInsightsRange('Sedan start', new Date('2026-10-22T10:00:00Z'), timeZone);
  const model = projectInsights({
    range,
    timeZone,
    status: 'partial',
    partialReason: 'limit',
    events: [
      { id: 'new', event_type: 'poop', occurred_at: '2026-10-21T10:00:00Z' },
      { id: 'old', event_type: 'pee', occurred_at: '2024-10-22T10:00:00Z' },
    ],
  });
  assert.deepEqual([model.coverageStartDate, model.coverageEndDate], ['2024-10-22', '2026-10-21']);
  assert.equal(model.buckets[0].partial, true);
  assert.ok(model.buckets.slice(1).every((bucket) => !bucket.partial));
  assert.equal(model.partialReason, 'limit');
});

test('an empty since-start history does not fabricate coverage buckets', () => {
  const range = createInsightsRange('Sedan start', new Date('2026-10-22T10:00:00Z'), timeZone);
  const model = projectInsights({ events: [], range, timeZone, status: 'ready' });
  assert.deepEqual(model.buckets, []);
  assert.equal(model.coverageStartDate, null);
  assert.equal(model.coverageEndDate, '2026-10-22');
});
