import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { loadedInsightEvents, insightPeriodLoaded } = await import('../src/features/puppy-log/insights-events.ts');
hooks.deregister();

test('loaded insight events respect timezone, period, observation time and order', () => {
  const data = { timezone: 'Europe/Stockholm', asOf: '2026-10-22T12:00:00Z', periodStartLocal: '2026-10-19', periodEndExclusiveLocal: '2026-10-26' };
  const event = (id, occurredAt) => ({ id, occurredAt });
  const events = [event('before', '2026-10-18T21:59:59Z'), event('edge', '2026-10-18T22:00:00Z'),
    event('recent', '2026-10-22T11:00:00Z'), event('future', '2026-10-22T12:00:01Z'), event('bad', 'invalid')];
  assert.deepEqual(loadedInsightEvents(events, data).map(item => item.id), ['recent', 'edge']);
  assert.deepEqual(loadedInsightEvents(events, data, 1).map(item => item.id), ['recent']);
  assert.deepEqual(loadedInsightEvents(events, { ...data, periodStartLocal: null }), []);
});

test('period completeness requires a prior local day or exhausted pages', () => {
  const data = { timezone: 'Europe/Stockholm', asOf: '2026-10-22T12:00:00Z', periodStartLocal: '2026-10-19', periodEndExclusiveLocal: '2026-10-26' };
  assert.equal(insightPeriodLoaded('2026-10-18T22:00:00Z', data, true), false);
  assert.equal(insightPeriodLoaded('2026-10-18T21:59:59Z', data, true), true);
  assert.equal(insightPeriodLoaded(null, data, true), false);
  assert.equal(insightPeriodLoaded(null, data, false), true);
  assert.equal(insightPeriodLoaded(null, { ...data, periodStartLocal: null }, false), false);
  assert.equal(loadedInsightEvents(Array.from({ length: 12 }, (_, id) => ({ id: String(id), occurredAt: '2026-10-20T08:00:00Z' })), data).length, 12);
});
