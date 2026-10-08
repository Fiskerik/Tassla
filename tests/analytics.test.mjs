import test from 'node:test';
import assert from 'node:assert/strict';
import { ANALYTICS_EVENT_TYPES } from '../src/analytics/analytics-model.ts';
import { createSyntheticAnalyticsAdapter } from '../src/analytics/analytics-service.ts';

test('synthetic metrics are off by default and require explicit opt-in gates', () => {
  const adapter = createSyntheticAnalyticsAdapter();
  adapter.track('home_viewed');
  assert.deepEqual(adapter.getEvents(), []);

  const noConsent = createSyntheticAnalyticsAdapter({ enabled: true });
  noConsent.track('home_viewed');
  assert.deepEqual(noConsent.getEvents(), []);

  const disabled = createSyntheticAnalyticsAdapter({ consentGranted: true });
  disabled.track('home_viewed');
  assert.deepEqual(disabled.getEvents(), []);
});

test('synthetic adapter stores only allowlisted event types and timestamps in memory', () => {
  const adapter = createSyntheticAnalyticsAdapter({
    enabled: true,
    consentGranted: true,
    now: () => new Date('2026-10-08T12:00:00.000Z'),
  });

  for (const eventType of ANALYTICS_EVENT_TYPES) adapter.track(eventType);
  adapter.track('dog_weight_changed');
  assert.deepEqual(adapter.getEvents(), ANALYTICS_EVENT_TYPES.map((eventType) => ({
    eventType,
    occurredAt: '2026-10-08T12:00:00.000Z',
  })));
});

test('synthetic events can be cleared and returned values cannot mutate the store', () => {
  const adapter = createSyntheticAnalyticsAdapter({ enabled: true, consentGranted: true });
  adapter.track('training_started');
  const copy = adapter.getEvents();
  copy.length = 0;
  assert.equal(adapter.getEvents().length, 1);

  adapter.clear();
  assert.deepEqual(adapter.getEvents(), []);
});
