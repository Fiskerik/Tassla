import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const model = await import('../src/features/puppy-log/insights-model.ts');
hooks.deregister();

test('a result is current only for the same owner, session, dog, period, date, mutation and flight', () => {
  const original = { ownerId: 'owner-a', accountGeneration: 2, dogId: 'dog-a', timezone: 'Europe/Stockholm', period: 'month', localDateAnchor: '2026-10-22', logMutationGeneration: 4, requestGeneration: 6, flightId: 'flight-a' };
  assert.equal(model.insightsRequestIsCurrent(original, original), true);
  for (const [field, value] of [
    ['ownerId', 'owner-b'], ['accountGeneration', 3], ['dogId', 'dog-b'], ['timezone', 'UTC'],
    ['period', 'week'], ['localDateAnchor', '2026-10-23'], ['logMutationGeneration', 5],
    ['requestGeneration', 7], ['flightId', 'flight-b'],
  ]) assert.equal(model.insightsRequestIsCurrent(original, { ...original, [field]: value }), false, field);
  assert.equal(model.insightsRequestIsCurrent(null, original), false);
});

test('invalid time zones are rejected before an Insights request can be treated as ready', () => {
  assert.equal(model.isValidInsightTimeZone('Europe/Stockholm'), true);
  assert.equal(model.isValidInsightTimeZone('UTC'), true);
  assert.equal(model.isValidInsightTimeZone('Not/A_Timezone'), false);
});
