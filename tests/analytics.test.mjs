import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ANALYTICS_EVENT_TYPES } from '../src/analytics/analytics-model.ts';
import { createAnalyticsService, createSyntheticAnalyticsAdapter } from '../src/analytics/analytics-service.ts';

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

test('production adapter requires server consent and sends only an allowlisted event type', async () => {
  const calls = [];
  let consent = false;
  const service = createAnalyticsService(async (name, args) => {
    calls.push({ name, args });
    if (name === 'get_beta_metrics_consent') return { data: consent, error: null };
    if (name === 'set_beta_metrics_consent') {
      consent = args.p_enabled;
      return { data: true, error: null };
    }
    if (name === 'record_product_event') return { data: 'synthetic-event-id', error: null };
    return { data: null, error: new Error('unknown rpc') };
  });

  assert.equal(await service.track('home_viewed'), false);
  assert.equal(await service.getConsent(), false);
  assert.equal(await service.track('home_viewed'), false);
  assert.equal(await service.setConsent(true), true);
  assert.equal(await service.track('first_log'), true);
  assert.deepEqual(calls.at(-1), { name: 'record_product_event', args: { p_event_type: 'first_log' } });
  assert.equal(await service.setConsent(false), true);
  assert.equal(await service.track('meaningful_return'), false);
});

test('workspace renews its cached analytics consent when account scope changes', async () => {
  const source = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /const analyticsService = useMemo\(\(\) => createAnalyticsService\([\s\S]*?isCurrentAccount\(analyticsOwnerId, accountGeneration\)[\s\S]*?\}\), \[client, analyticsOwnerId, accountGeneration, isCurrentAccount\]\)/);
  assert.match(source, /completeRoutineAndMeasure[\s\S]*?isCurrentAccount\(ownerId, generation\)[\s\S]*?track\('routine_completed'\)/);
});

test('production adapter fails open when RPC rejects or returns an error', async () => {
  const service = createAnalyticsService(async (name) => {
    if (name === 'get_beta_metrics_consent') return { data: true, error: null };
    if (name === 'record_product_event') throw new Error('offline');
    return { data: null, error: new Error('database unavailable') };
  });

  assert.equal(await service.getConsent(), true);
  assert.equal(await service.track('home_viewed'), false);
  assert.equal(await service.setConsent(false), false);
  assert.equal(await service.track('not_allowed'), false);
});

test('an old consent read cannot overwrite a newer opt-in or withdrawal', async () => {
  const reads = [];
  const calls = [];
  const service = createAnalyticsService(async (name, args) => {
    calls.push({ name, args });
    if (name === 'get_beta_metrics_consent') return new Promise((resolve) => reads.push(resolve));
    if (name === 'set_beta_metrics_consent') return { data: true, error: null };
    return { data: 'synthetic-event-id', error: null };
  });
  const staleOff = service.getConsent();
  assert.equal(await service.setConsent(true), true);
  reads.shift()({ data: false, error: null });
  assert.equal(await staleOff, null);
  assert.equal(await service.track('onboarding_opened'), true);
  const staleOn = service.getConsent();
  assert.equal(await service.setConsent(false), true);
  reads.shift()({ data: true, error: null });
  assert.equal(await staleOn, null);
  const before = calls.length;
  assert.equal(await service.track('onboarding_opened'), false);
  assert.equal(calls.length, before);
});
