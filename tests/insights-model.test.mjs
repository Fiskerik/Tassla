import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const model = await import('../src/features/puppy-log/insights-model.ts');
hooks.deregister();

function daily(date, overrides = {}) {
  return { date, peeCount: 0, poopCount: 0, unclassifiedAccidentCount: 0, sleepCount: 0, awakeCount: 0, ...overrides };
}

function weeklyResponse(overrides = {}) {
  return {
    period: 'week', timezone: 'Europe/Stockholm', asOf: '2026-10-22T12:00:00.000Z',
    periodStartLocal: '2026-10-19', periodEndExclusiveLocal: '2026-10-26',
    observedThroughLocal: '2026-10-22', firstLogDay: null, bucket: 'day',
    days: [daily('2026-10-19'), daily('2026-10-20'), daily('2026-10-21'), daily('2026-10-22', { peeCount: 2 })],
    ...overrides,
  };
}

test('strict parser accepts a local week with only observed dates and exact JSON keys', () => {
  const parsed = model.parseDogEventInsights(weeklyResponse(), 'week', 'Europe/Stockholm');
  assert.equal(parsed.days.length, 4);
  assert.equal(parsed.days.at(-1).peeCount, 2);
  assert.equal(parsed.periodEndExclusiveLocal, '2026-10-26');
  assert.equal(model.insightsDateRange(parsed), '19 okt–22 okt');
  assert.deepEqual(model.insightVisibleTotals(parsed.days), { pee: 2, poop: 0, accident: 0, sleep: 0, awake: 0 });
});

test('today uses exactly the observed local date and its next-day exclusive bound', () => {
  const response = weeklyResponse({ period: 'today', periodStartLocal: '2026-10-22', periodEndExclusiveLocal: '2026-10-23', days: [daily('2026-10-22', { peeCount: 2 })] });
  const parsed = model.parseDogEventInsights(response, 'today', 'Europe/Stockholm');
  assert.equal(model.insightsDateRange(parsed), '22 okt 2026');
  assert.equal(parsed.days[0].peeCount, 2);
  assert.throws(() => model.parseDogEventInsights({ ...response, periodStartLocal: '2026-10-21' }, 'today', 'Europe/Stockholm'));
  assert.throws(() => model.parseDogEventInsights({ ...response, periodEndExclusiveLocal: '2026-10-24' }, 'today', 'Europe/Stockholm'));
  assert.throws(() => model.parseDogEventInsights({ ...response, days: [] }, 'today', 'Europe/Stockholm'));
});

test('parser rejects extra fields, malformed dates, gaps, unordered buckets and unsafe counts', () => {
  assert.throws(() => model.parseDogEventInsights({ ...weeklyResponse(), rawEventIds: [] }, 'week', 'Europe/Stockholm'));
  assert.throws(() => model.parseDogEventInsights(weeklyResponse({ observedThroughLocal: '2026-02-30' }), 'week', 'Europe/Stockholm'));
  assert.throws(() => model.parseDogEventInsights(weeklyResponse({ days: [daily('2026-10-19'), daily('2026-10-21'), daily('2026-10-22')] }), 'week', 'Europe/Stockholm'));
  assert.throws(() => model.parseDogEventInsights(weeklyResponse({ days: [daily('2026-10-19'), daily('2026-10-20'), daily('2026-10-21'), daily('2026-10-22', { peeCount: Number.MAX_SAFE_INTEGER + 1 })] }), 'week', 'Europe/Stockholm'));
  assert.throws(() => model.parseDogEventInsights(weeklyResponse({ days: [daily('2026-10-20'), daily('2026-10-19'), daily('2026-10-21'), daily('2026-10-22')] }), 'week', 'Europe/Stockholm'));
});

test('parser validates all-history nullability and sparse monthly ordering', () => {
  const base = {
    period: 'since_first_log', timezone: 'UTC', asOf: '2026-10-22T12:00:00.000Z',
    periodStartLocal: '2025-08-03', periodEndExclusiveLocal: '2026-10-23',
    observedThroughLocal: '2026-10-22', firstLogDay: '2025-08-03', bucket: 'month',
    days: [
      { date: '2025-08', peeCount: 0, poopCount: 0, unclassifiedAccidentCount: 0, sleepCount: 0, awakeCount: 0 },
      { date: '2025-11', peeCount: 1, poopCount: 0, unclassifiedAccidentCount: 0, sleepCount: 0, awakeCount: 0 },
      { date: '2026-10', peeCount: 0, poopCount: 0, unclassifiedAccidentCount: 0, sleepCount: 0, awakeCount: 0 },
    ],
  };
  const parsed = model.parseDogEventInsights(base, 'since_first_log', 'UTC');
  assert.deepEqual(model.historyMonthEntries(parsed).map((entry) => entry.kind === 'gap' ? `gap:${entry.count}` : entry.item.date), [
    '2025-08', 'gap:2', '2025-11', 'gap:10', '2026-10',
  ]);
  assert.throws(() => model.parseDogEventInsights({ ...base, firstLogDay: null }, 'since_first_log', 'UTC'));
  assert.throws(() => model.parseDogEventInsights({ ...base, periodStartLocal: 'not-a-date' }, 'since_first_log', 'UTC'));
  assert.throws(() => model.parseDogEventInsights({ ...base, days: [base.days[1], base.days[0], base.days[2]] }, 'since_first_log', 'UTC'));
});

test('empty all-history must use three explicit null bounds', () => {
  const empty = {
    period: 'since_first_log', timezone: 'UTC', asOf: '2026-10-22T12:00:00.000Z',
    periodStartLocal: null, periodEndExclusiveLocal: null, observedThroughLocal: '2026-10-22',
    firstLogDay: null, bucket: 'month', days: [],
  };
  assert.deepEqual(model.parseDogEventInsights(empty, 'since_first_log', 'UTC').days, []);
  assert.throws(() => model.parseDogEventInsights({ ...empty, periodStartLocal: 'garbage' }, 'since_first_log', 'UTC'));
  assert.throws(() => model.parseDogEventInsights({ ...empty, periodEndExclusiveLocal: '2026-10-23' }, 'since_first_log', 'UTC'));
});

test('scope identity fences account, dog, timezone, period, local date, mutation, request and flight', () => {
  const scope = { ownerId: 'owner-a', accountGeneration: 3, dogId: 'dog-a', timezone: 'Europe/Stockholm', period: 'week', localDateAnchor: '2026-10-22', logMutationGeneration: 4, requestGeneration: 5, flightId: 'flight-a' };
  assert.equal(model.insightsRequestIsCurrent(scope, scope), true);
  for (const field of Object.keys(scope)) {
    const changed = { ...scope, [field]: `${scope[field]}-changed` };
    assert.equal(model.insightsRequestIsCurrent(scope, changed), false, field);
  }
  assert.equal(model.insightsRequestIsCurrent(null, scope), false);
});

test('date formatting and local date conversion do not drift over a DST boundary', () => {
  assert.equal(model.localDateAtTimeZone(new Date('2026-10-25T00:30:00.000Z'), 'Europe/Stockholm'), '2026-10-25');
  assert.equal(model.formatInsightsDate('2026-10-22'), '22 okt');
  assert.equal(model.formatInsightsMonth('2026-10'), 'oktober');
  assert.equal(model.formatInsightsMonthTick('2026-10'), 'okt');
  assert.equal(model.shiftLocalDateKey('2026-12-31', 1), '2027-01-01');
  assert.equal(model.shiftLocalMonthKey('2026-12', 1), '2027-01');
});
