import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';

const tsResolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const data = await import('../src/data/workspace-data.ts');
const model = await import('../src/notifications/notification-model.ts');
tsResolution.deregister();

const serviceSource = await readFile(new URL('../src/notifications/notification-service.ts', import.meta.url), 'utf8');
const storageSource = await readFile(new URL('../src/notifications/notification-storage.ts', import.meta.url), 'utf8');
const workspaceSource = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const authProviderSource = await readFile(new URL('../src/features/account/AuthProvider.tsx', import.meta.url), 'utf8');

const baseUrl = 'https://local-test.supabase.invalid';
const dogId = '11111111-1111-4111-8111-111111111111';
const otherDogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const today = '2026-10-06';
const tomorrow = '2026-10-07';

test('future reminder selection filters past times today before counting its 40-row cap and paginates to a valid 41st', async () => {
  const makeRow = (index, dueOn, minutes) => ({ id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    dog_id: dogId, event_type: 'vaccination', due_on: dueOn, description: null, created_at: '2026-10-01T00:00:00Z',
    reminder_enabled: true, reminder_minutes: minutes });
  const pages = [
    Array.from({ length: 40 }, (_, index) => makeRow(index, today, 1 + index)),
    Array.from({ length: 40 }, (_, index) => makeRow(40 + index, tomorrow, index)),
    [makeRow(80, tomorrow, 40)],
  ];
  const { client, requests } = localClient(() => {
    return jsonResponse(pages[requests.length - 1]);
  });
  try {
    const selected = await data.fetchFuturePlannedHealthReminders(client, dogId, today,
      (record) => record.due_on > today || record.reminder_minutes >= 600, () => true);
    assert.equal(requests.length, 3, JSON.stringify(requests.map(({ url, headers }) => ({ query: url.search, headers: [...headers] }))));
    for (const [index, request] of requests.entries()) {
      assert.equal(request.method, 'GET');
      assert.equal(request.url.pathname, '/rest/v1/dog_health_plans');
      assert.equal(request.url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(request.url.searchParams.get('reminder_enabled'), 'eq.true');
      assert.equal(request.url.searchParams.get('due_on'), `gte.${today}`);
      assert.deepEqual(request.url.searchParams.get('order')?.split(','), ['due_on.asc', 'reminder_minutes.asc', 'id.asc']);
      assert.equal(request.url.searchParams.get('offset'), String(index * 40));
      assert.equal(request.url.searchParams.get('limit'), '40');
    }
    assert.deepEqual(selected.records.map(({ id }) => id), pages[1].map(({ id }) => id));
    assert.equal(selected.overCap, true);
    assert.equal(requests.length, 3, 'past-today rows do not consume the cap, so pagination continues through the 41st valid fire time');
  } finally { await client.auth.dispose(); }
});

test('future reminder selection returns null when its captured account lifetime changes after a page request', async () => {
  let current = true;
  let finishFetch;
  const { client, requests } = localClient(() => new Promise((resolve) => { finishFetch = resolve; }));
  try {
    const selectionPromise = data.fetchFuturePlannedHealthReminders(client, dogId, today, () => true, () => current);
    while (!finishFetch) await new Promise((resolve) => setImmediate(resolve));
    current = false;
    finishFetch(jsonResponse([]));
    assert.equal(await selectionPromise, null);
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('future reminder selection checks an already-stale lifetime before any server query', async () => {
  const { client, requests } = localClient(() => { throw new Error('stale context must not query the server'); });
  try {
    assert.equal(await data.fetchFuturePlannedHealthReminders(client, dogId, today, () => true, () => false), null);
    assert.equal(requests.length, 0);
  } finally { await client.auth.dispose(); }
});

test('future reminder reads reject cross-dog rows and invalid reminder metadata', async (t) => {
  const valid = { id: '22222222-2222-4222-8222-222222222222', dog_id: dogId, event_type: 'vet_visit', due_on: tomorrow,
    description: null, created_at: '2026-10-01T00:00:00Z', reminder_enabled: true, reminder_minutes: 600 };
  await t.test('cross-dog row', async () => {
    const { client } = localClient(() => jsonResponse([{ ...valid, dog_id: otherDogId }]));
    try { await assert.rejects(data.fetchFuturePlannedHealthReminders(client, dogId, today, () => true, () => true)); }
    finally { await client.auth.dispose(); }
  });
  await t.test('enabled row without a time', async () => {
    const { client } = localClient(() => jsonResponse([{ ...valid, reminder_minutes: null }]));
    try { await assert.rejects(data.fetchFuturePlannedHealthReminders(client, dogId, today, () => true, () => true)); }
    finally { await client.auth.dispose(); }
  });
});

test('local fire time rejects the Stockholm spring gap and chooses the earlier fall-fold instant', async () => {
  const source = `import { createLocalFireTime } from ${JSON.stringify(new URL('../src/notifications/notification-model.ts', import.meta.url).href)};
    const gap = createLocalFireTime('2026-03-29', 150, new Date('2026-01-01T00:00:00Z'));
    const fold = createLocalFireTime('2026-10-25', 150, new Date('2026-01-01T00:00:00Z'));
    process.stdout.write(JSON.stringify({ gap: gap.status, fold: fold.status, instant: fold.date?.toISOString() }));`;
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', source], {
    encoding: 'utf8', env: { ...process.env, TZ: 'Europe/Stockholm' },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { gap: 'unrepresentable', fold: 'scheduled', instant: '2026-10-25T00:30:00.000Z' });
});

test('notification preference validation is closed, bounded, and keyed per owner', () => {
  const firstOwner = '11111111-1111-4111-8111-111111111111';
  const secondOwner = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const prefs = { version: 1, enabled: false, trainingEnabled: true, trainingMinutes: 615 };
  assert.equal(model.isNotificationPreferences(prefs), true);
  assert.equal(model.isNotificationPreferences({ ...prefs, trainingMinutes: 1440 }), false);
  assert.equal(model.isNotificationPreferences({ ...prefs, extra: true }), false);
  assert.notEqual(model.notificationPreferenceKey(firstOwner), model.notificationPreferenceKey(secondOwner));
  assert.equal(model.notificationPreferenceKey(firstOwner), 'tassla.notifications.v1.' + firstOwner);
});

test('preference storage reads and writes each owner key independently and defaults malformed data off', async () => {
  const values = new Map();
  const calls = [];
  const storage = buildStorageHarness({
    async getItemAsync(key) { calls.push(['get', key]); return values.get(key) ?? null; },
    async setItemAsync(key, value) { calls.push(['set', key]); values.set(key, value); },
  });
  const ownerA = '11111111-1111-4111-8111-111111111111';
  const ownerB = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const preferenceA = { version: 1, enabled: false, trainingEnabled: true, trainingMinutes: 615 };
  try {
    await storage.writeNotificationPreferences(ownerA, preferenceA);
    assert.deepEqual(await storage.readNotificationPreferences(ownerA), preferenceA);
    assert.deepEqual(await storage.readNotificationPreferences(ownerB), model.DEFAULT_NOTIFICATION_PREFERENCES);
    values.set(model.notificationPreferenceKey(ownerB), '{broken');
    assert.deepEqual(await storage.readNotificationPreferences(ownerB), model.DEFAULT_NOTIFICATION_PREFERENCES);
    values.set(model.notificationPreferenceKey(ownerB), JSON.stringify({ ...preferenceA, unrecognized: 'must not be trusted' }));
    assert.deepEqual(await storage.readNotificationPreferences(ownerB), model.DEFAULT_NOTIFICATION_PREFERENCES);
    assert.ok(calls.some(([kind, key]) => kind === 'set' && key === model.notificationPreferenceKey(ownerA)));
    assert.ok(calls.some(([kind, key]) => kind === 'get' && key === model.notificationPreferenceKey(ownerB)));
  } finally { storage.dispose(); }
});

test('master notifications off retains the separately selected training reminder preference and leaves plan fields alone', async () => {
  const { ReminderService } = buildServiceHarness();
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const plan = plannedReminder('22222222-2222-4222-8222-222222222222', dogId, '2026-10-07', 480);
  const originalPlan = structuredClone(plan);
  const scheduled = [];
  const service = new ReminderService(fakeAdapter({ scheduled }));
  const context = service.setActiveContext(ownerId, dogId);
  const prefs = { version: 1, enabled: false, trainingEnabled: true, trainingMinutes: 615 };
  const result = await service.reconcile({ ...context, preferences: prefs, plans: [plan], now: new Date('2026-10-06T12:00:00Z') });
  assert.equal(result.status, 'off');
  assert.equal(result.scheduledCount, 0);
  assert.equal(scheduled.length, 0);
  assert.deepEqual(prefs, { version: 1, enabled: false, trainingEnabled: true, trainingMinutes: 615 });
  assert.deepEqual(plan, originalPlan);
});

test('master-off cleanup does not depend on permission reads and cancels only this owner’s app requests', async () => {
  const { ReminderService } = buildServiceHarness('ios');
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const foreignOwner = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const planId = '22222222-2222-4222-8222-222222222222';
  const planPayload = model.planReminderPayload(ownerId, dogId, planId);
  const trainingPayload = model.trainingReminderPayload(ownerId, dogId);
  const fireAt = new Date('2026-10-07T08:00:00Z');
  const ownedPlan = notificationRequest(model.reminderLogicalKey(planPayload), planPayload, fireAt, model.reminderLogicalKey(planPayload), 'ios');
  const ownedTraining = notificationRequest(model.reminderLogicalKey(trainingPayload), trainingPayload, fireAt, model.reminderLogicalKey(trainingPayload), 'ios');
  const foreign = notificationRequest('other-owner', model.trainingReminderPayload(foreignOwner, dogId), fireAt, 'other-owner', 'ios');
  const cancelled = [];
  const scheduled = [];
  let permissionCalls = 0;
  const service = new ReminderService(fakeAdapter({ requests: [ownedPlan, ownedTraining, foreign], cancelled, scheduled,
    getPermissionsAsync: async () => { permissionCalls += 1; throw new Error('permission API unavailable'); } }));
  const context = service.setActiveContext(ownerId, dogId);
  const preferences = { version: 1, enabled: false, trainingEnabled: true, trainingMinutes: 615 };
  const result = await service.reconcile({ ...context, preferences,
    plans: [plannedReminder(planId, dogId, '2026-10-07', 480)], now: new Date('2026-10-06T08:00:00Z') });
  assert.equal(result.status, 'off');
  assert.equal(permissionCalls, 0);
  assert.deepEqual(cancelled, [ownedPlan.identifier, ownedTraining.identifier]);
  assert.deepEqual(scheduled, []);
  assert.equal(preferences.trainingEnabled, true);
});

test('native reminder reconciliation preserves foreign requests, deduplicates owned reminders and uses generic content', async () => {
  const { ReminderService } = buildServiceHarness();
  const scheduled = [];
  const cancelled = [];
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const planId = '22222222-2222-4222-8222-222222222222';
  const key = model.reminderLogicalKey(model.planReminderPayload(ownerId, dogId, planId));
  const fireAt = model.createLocalFireTime('2026-10-07', 8 * 60, new Date('2026-10-06T12:00:00.000Z')).date;
  const existing = notificationRequest(key, model.planReminderPayload(ownerId, dogId, planId), fireAt, key, 'ios');
  const duplicate = { ...existing, identifier: 'duplicate-id' };
  const foreign = notificationRequest('foreign', model.planReminderPayload('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', dogId, planId), fireAt, 'foreign', 'ios');
  const adapter = fakeAdapter({ requests: [existing, duplicate, foreign], scheduled, cancelled });
  const service = new ReminderService(adapter);
  const context = service.setActiveContext(ownerId, dogId);
  const plan = plannedReminder(planId, dogId, '2026-10-07', 8 * 60);
  const result = await service.reconcile({ ...context, preferences: { version: 1, enabled: true, trainingEnabled: false, trainingMinutes: 540 },
    plans: [plan], now: new Date('2026-10-06T12:00:00.000Z') });
  assert.equal(result.status, 'scheduled');
  assert.equal(result.scheduledCount, 1);
  assert.deepEqual(cancelled, ['duplicate-id']);
  assert.equal(scheduled.length, 0);
  assert.equal(adapter.requests.includes(foreign), true);
});

test('installed iOS UTC calendar trigger shape remains idempotent as the clock advances', async () => {
  const { ReminderService } = buildServiceHarness('ios');
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const planId = '22222222-2222-4222-8222-222222222222';
  const payload = model.planReminderPayload(ownerId, dogId, planId);
  const key = model.reminderLogicalKey(payload);
  const fireAt = model.createLocalFireTime('2026-10-07', 480, new Date('2026-10-06T08:00:00Z')).date;
  const request = notificationRequest(key, payload, fireAt, key, 'ios');
  const cancelled = [];
  const scheduled = [];
  const service = new ReminderService(fakeAdapter({ requests: [request], cancelled, scheduled }));
  const context = service.setActiveContext(ownerId, dogId);
  const preferences = { version: 1, enabled: true, trainingEnabled: false, trainingMinutes: 540 };
  const plan = plannedReminder(planId, dogId, '2026-10-07', 480);
  const first = await service.reconcile({ ...context, preferences, plans: [plan], now: new Date('2026-10-06T08:00:00Z') });
  const second = await service.reconcile({ ...context, preferences, plans: [plan], now: new Date('2026-10-06T10:30:00Z') });
  assert.equal(first.scheduledCount, 1);
  assert.equal(second.scheduledCount, 1);
  assert.deepEqual(cancelled, []);
  assert.deepEqual(scheduled, []);
  assert.equal(request.trigger.type, 'calendar');
  assert.equal(request.trigger.repeats, false);
  assert.equal(request.trigger.dateComponents.timeZone, 'UTC');
});

test('installed Android date trigger shape retains the exact intended epoch time', async () => {
  const { ReminderService } = buildServiceHarness('android');
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const planId = '22222222-2222-4222-8222-222222222222';
  const payload = model.planReminderPayload(ownerId, dogId, planId);
  const key = model.reminderLogicalKey(payload);
  const fireAt = model.createLocalFireTime('2026-10-07', 480, new Date('2026-10-06T08:00:00Z')).date;
  const request = notificationRequest(key, payload, fireAt, key, 'android');
  const cancelled = [];
  const scheduled = [];
  const service = new ReminderService(fakeAdapter({ requests: [request], cancelled, scheduled }));
  const context = service.setActiveContext(ownerId, dogId);
  const result = await service.reconcile({ ...context, preferences: { version: 1, enabled: true, trainingEnabled: false, trainingMinutes: 540 },
    plans: [plannedReminder(planId, dogId, '2026-10-07', 480)], now: new Date('2026-10-06T08:00:00Z') });
  assert.equal(result.scheduledCount, 1);
  assert.deepEqual(cancelled, []);
  assert.deepEqual(scheduled, []);
  assert.equal(request.trigger.type, 'date');
  assert.equal(request.trigger.value, fireAt.getTime());
  assert.equal(request.trigger.repeats, false);
});

test('native trigger with an altered time zone, tuple, repetition or unknown shape is replaced', async (t) => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const planId = '22222222-2222-4222-8222-222222222222';
  const payload = model.planReminderPayload(ownerId, dogId, planId);
  const key = model.reminderLogicalKey(payload);
  const fireAt = model.createLocalFireTime('2026-10-07', 480, new Date('2026-10-06T08:00:00Z')).date;
  const valid = notificationRequest(key, payload, fireAt, key, 'ios');
  const invalid = [
    ['wrong time zone', { ...valid, trigger: { ...valid.trigger, dateComponents: { ...valid.trigger.dateComponents, timeZone: 'Europe/Stockholm' } } }],
    ['changed component', { ...valid, trigger: { ...valid.trigger, dateComponents: { ...valid.trigger.dateComponents, hour: valid.trigger.dateComponents.hour + 1 } } }],
    ['extra weekday component', { ...valid, trigger: { ...valid.trigger, dateComponents: { ...valid.trigger.dateComponents, weekday: 3 } } }],
    ['leap-month marker', { ...valid, trigger: { ...valid.trigger, dateComponents: { ...valid.trigger.dateComponents, isLeapMonth: true } } }],
    ['repeated-day marker', { ...valid, trigger: { ...valid.trigger, dateComponents: { ...valid.trigger.dateComponents, isRepeatedDay: true } } }],
    ['repeats', { ...valid, trigger: { ...valid.trigger, repeats: true } }],
    ['missing time zone', { ...valid, trigger: { ...valid.trigger, dateComponents: { ...valid.trigger.dateComponents, timeZone: undefined } } }],
    ['unknown trigger shape', { ...valid, trigger: { type: 'unknown' } }],
  ];
  for (const [label, request] of invalid) await t.test(label, async () => {
    const { ReminderService } = buildServiceHarness('ios');
    const cancelled = [];
    const scheduled = [];
    const service = new ReminderService(fakeAdapter({ requests: [request], cancelled, scheduled }));
    const context = service.setActiveContext(ownerId, dogId);
    const result = await service.reconcile({ ...context,
      preferences: { version: 1, enabled: true, trainingEnabled: false, trainingMinutes: 540 },
      plans: [plannedReminder(planId, dogId, '2026-10-07', 480)], now: new Date('2026-10-06T08:00:00Z') });
    assert.equal(result.scheduledCount, 1);
    assert.deepEqual(cancelled, [key]);
    assert.equal(scheduled.length, 1);
  });
});

test('returned notification with non-generic copy is replaced even when id, payload, and fire time match', async () => {
  const { ReminderService } = buildServiceHarness('ios');
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const planId = '22222222-2222-4222-8222-222222222222';
  const payload = model.planReminderPayload(ownerId, dogId, planId);
  const key = model.reminderLogicalKey(payload);
  const fireAt = model.createLocalFireTime('2026-10-07', 480, new Date('2026-10-06T08:00:00Z')).date;
  const unsafe = { ...notificationRequest(key, payload, fireAt, key, 'ios'), content: {
    title: 'Veterinärbesök för hunden', body: 'Uppföljning av vaccination', data: payload,
  } };
  const cancelled = [];
  const scheduled = [];
  const service = new ReminderService(fakeAdapter({ requests: [unsafe], cancelled, scheduled }));
  const context = service.setActiveContext(ownerId, dogId);
  await service.reconcile({ ...context, preferences: { version: 1, enabled: true, trainingEnabled: false, trainingMinutes: 540 },
    plans: [plannedReminder(planId, dogId, '2026-10-07', 480)], now: new Date('2026-10-06T08:00:00Z') });
  assert.deepEqual(cancelled, [key]);
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].content.title, model.GENERIC_REMINDER_TITLE);
  assert.equal(scheduled[0].content.body, model.GENERIC_REMINDER_BODY);
});

test('failed cancellation of a stale owned reminder blocks replacement for that logical item', async () => {
  const { ReminderService } = buildServiceHarness();
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const planId = '22222222-2222-4222-8222-222222222222';
  const payload = model.planReminderPayload(ownerId, dogId, planId);
  const wantedKey = model.reminderLogicalKey(payload);
  const stale = notificationRequest(wantedKey, payload, new Date('2026-10-07T07:00:00.000Z'), wantedKey, 'ios');
  const scheduled = [];
  const adapter = fakeAdapter({ requests: [stale], scheduled, cancelError: new Error('native cancel failed') });
  const service = new ReminderService(adapter);
  const context = service.setActiveContext(ownerId, dogId);
  const result = await service.reconcile({ ...context, preferences: { version: 1, enabled: true, trainingEnabled: false, trainingMinutes: 540 },
    plans: [plannedReminder(planId, dogId, '2026-10-07', 8 * 60)], now: new Date('2026-10-06T12:00:00Z') });
  assert.equal(result.status, 'failed');
  assert.equal(scheduled.length, 0);
});

test('new native requests contain generic copy and only the whitelisted reminder identity', async () => {
  const { ReminderService } = buildServiceHarness();
  const scheduled = [];
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const planId = '22222222-2222-4222-8222-222222222222';
  const service = new ReminderService(fakeAdapter({ scheduled }));
  const context = service.setActiveContext(ownerId, dogId);
  const result = await service.reconcile({ ...context, preferences: { version: 1, enabled: true, trainingEnabled: false, trainingMinutes: 540 },
    plans: [plannedReminder(planId, dogId, '2026-10-07', 8 * 60)], now: new Date('2026-10-06T12:00:00Z') });
  assert.equal(result.scheduledCount, 1);
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].content.title, model.GENERIC_REMINDER_TITLE);
  assert.equal(scheduled[0].content.body, model.GENERIC_REMINDER_BODY);
  assert.deepEqual(scheduled[0].content.data, { feature: model.REMINDER_FEATURE, ownerId, dogId, target: 'health', planId });
  assert.equal(scheduled[0].trigger.type, 'calendar');
  assert.equal(scheduled[0].trigger.timezone, 'UTC');
  assert.equal(scheduled[0].trigger.repeats, false);
  assert.equal(JSON.stringify(scheduled[0]).includes('Booster'), false);
});

test('owner cleanup cancels only valid app-owned requests for that owner', async () => {
  const { ReminderService } = buildServiceHarness();
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const planId = '22222222-2222-4222-8222-222222222222';
  const foreignOwner = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const validOwned = notificationRequest('own', model.planReminderPayload(ownerId, dogId, planId), new Date(), 'own', 'ios');
  const validForeign = notificationRequest('foreign-owner', model.planReminderPayload(foreignOwner, dogId, planId), new Date(), 'foreign-owner', 'ios');
  const unrelated = { identifier: 'unrelated', content: { data: { feature: 'another-app' } }, trigger: null };
  const cancelled = [];
  const service = new ReminderService(fakeAdapter({ requests: [validOwned, validForeign, unrelated], cancelled }));
  assert.equal(await service.cleanupOwner(ownerId), true);
  assert.deepEqual(cancelled, ['own']);
});

test('actual logout cleanup tracks failure and clears it after a successful owner cleanup retry', async () => {
  const { ReminderService } = buildServiceHarness();
  const ownerId = '11111111-1111-4111-8111-111111111111';
  let shouldFail = true;
  const service = new ReminderService(fakeAdapter({
    getAllScheduledNotificationsAsync: async () => {
      if (shouldFail) throw new Error('native store unavailable');
      return [];
    },
  }));
  assert.equal(await service.cleanupOwner(ownerId), false);
  assert.equal(service.hasCleanupFailure(ownerId), true);
  shouldFail = false;
  assert.equal(await service.cleanupOwner(ownerId), true);
  assert.equal(service.hasCleanupFailure(ownerId), false);
});

test('actual AuthProvider cleanup warning ignores an older owner after an account switch', () => {
  const match = authProviderSource.match(/const reportNotificationCleanupFailure = useCallback\(\(ownerId: string\) => \{([\s\S]*?)\n  \}, \[\]\);/);
  assert.ok(match, 'extracts the actual stable AuthProvider failure callback');
  const source = ts.transpileModule(`function reportNotificationCleanupFailure(ownerId) {${match[1]}\n}`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const warnings = [];
  const load = new Function('currentOwnerId', 'setSignOutWarning', `${source}\nreturn reportNotificationCleanupFailure;`);
  const report = load({ current: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }, (warning) => warnings.push(warning));
  report('11111111-1111-4111-8111-111111111111');
  assert.deepEqual(warnings, [], 'an old owner cleanup result cannot overwrite the new owner state');
  report('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /egna lokala påminnelser/i);
});

test('reminder generation is checked after awaited cancellation before scheduling a replacement', async () => {
  const { ReminderService } = buildServiceHarness();
  let finishCancel;
  const effects = [];
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const planId = '22222222-2222-4222-8222-222222222222';
  const payload = model.planReminderPayload(ownerId, dogId, planId);
  const key = model.reminderLogicalKey(payload);
  const adapter = fakeAdapter({ requests: [notificationRequest(key, payload, new Date('2026-10-07T07:00:00Z'), key, 'ios')],
    cancelScheduledNotificationAsync: (identifier) => new Promise((resolve) => { effects.push(['cancel-start', identifier]); finishCancel = resolve; }),
    scheduleNotificationAsync: async (request) => { effects.push(['schedule', request]); return 'new-id'; },
  });
  const service = new ReminderService(adapter);
  const context = service.setActiveContext(ownerId, dogId);
  const promise = service.reconcile({ ...context, preferences: { version: 1, enabled: true, trainingEnabled: false, trainingMinutes: 540 },
    plans: [plannedReminder(planId, dogId, '2026-10-07', 480)], now: new Date('2026-10-06T12:00:00Z') });
  while (!finishCancel) await new Promise((resolve) => setImmediate(resolve));
  service.setActiveContext(ownerId, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  finishCancel();
  assert.equal((await promise).status, 'unknown');
  assert.deepEqual(effects, [['cancel-start', key]]);
});

test('reminder generation is checked after awaited schedule and cancels only the returned request', async () => {
  const { ReminderService } = buildServiceHarness();
  let finishSchedule;
  const effects = [];
  const adapter = fakeAdapter({
    getAllScheduledNotificationsAsync: async () => [],
    scheduleNotificationAsync: (request) => new Promise((resolve) => { effects.push(['schedule', request]); finishSchedule = resolve; }),
    cancelScheduledNotificationAsync: async (identifier) => { effects.push(['cancel', identifier]); },
  });
  const service = new ReminderService(adapter);
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const context = service.setActiveContext(ownerId, dogId);
  const promise = service.reconcile({ ...context, preferences: { version: 1, enabled: true, trainingEnabled: false, trainingMinutes: 540 },
    plans: [plannedReminder('22222222-2222-4222-8222-222222222222', dogId, '2026-10-07', 480)], now: new Date('2026-10-06T12:00:00Z') });
  while (!finishSchedule) await new Promise((resolve) => setImmediate(resolve));
  service.setActiveContext(ownerId, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  finishSchedule('created-after-context-change');
  assert.equal((await promise).status, 'unknown');
  assert.equal(effects[0][0], 'schedule');
  assert.deepEqual(effects.slice(1), [['cancel', 'created-after-context-change']]);
});

test('permission flow stops before prompting when the active context changes after permission lookup', async () => {
  const { ReminderService } = buildServiceHarness();
  let finishPermissionLookup;
  let prompted = false;
  const service = new ReminderService(fakeAdapter({
    getPermissionsAsync: () => new Promise((resolve) => { finishPermissionLookup = resolve; }),
    requestPermissionsAsync: async () => { prompted = true; return { status: 'granted', granted: true }; },
  }));
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const context = service.setActiveContext(ownerId, dogId);
  const promise = service.requestPermission(context);
  while (!finishPermissionLookup) await new Promise((resolve) => setImmediate(resolve));
  service.setActiveContext(ownerId, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  finishPermissionLookup({ status: 'undetermined', granted: false, canAskAgain: true, expires: 'never' });
  assert.equal(await promise, 'unknown');
  assert.equal(prompted, false, 'permission prompts stay behind an explicit, still-current owner action');
});

test('permission flow ignores a prompt result after the owner context changes', async () => {
  const { ReminderService } = buildServiceHarness();
  let finishPrompt;
  const service = new ReminderService(fakeAdapter({
    getPermissionsAsync: async () => ({ status: 'denied', granted: false, canAskAgain: true, expires: 'never' }),
    requestPermissionsAsync: () => new Promise((resolve) => { finishPrompt = resolve; }),
  }));
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const context = service.setActiveContext(ownerId, dogId);
  const promise = service.requestPermission(context);
  while (!finishPrompt) await new Promise((resolve) => setImmediate(resolve));
  service.setActiveContext(ownerId, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  finishPrompt({ status: 'granted', granted: true, canAskAgain: true, expires: 'never' });
  assert.equal(await promise, 'unknown');
});

test('reminder generation is checked after the awaited native list before effects', async () => {
  const { ReminderService } = buildServiceHarness();
  let finishList;
  const effects = [];
  const adapter = fakeAdapter({
    getAllScheduledNotificationsAsync: () => new Promise((resolve) => { finishList = resolve; }),
    scheduleNotificationAsync: async (request) => { effects.push(['schedule', request]); return 'new-id'; },
    cancelScheduledNotificationAsync: async (identifier) => { effects.push(['cancel', identifier]); },
  });
  const service = new ReminderService(adapter);
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const context = service.setActiveContext(ownerId, dogId);
  const promise = service.reconcile({ ...context, preferences: { version: 1, enabled: true, trainingEnabled: false, trainingMinutes: 540 },
    plans: [plannedReminder('22222222-2222-4222-8222-222222222222', dogId, '2026-10-07', 480)], now: new Date('2026-10-06T12:00:00Z') });
  while (!finishList) await new Promise((resolve) => setImmediate(resolve));
  service.setActiveContext(ownerId, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  finishList([]);
  assert.equal((await promise).status, 'unknown');
  assert.deepEqual(effects, []);
});

test('actual notification response handler routes only current owner/dog payloads to their allowed screens', async (t) => {
  await t.test('health tap verifies exact planned row and clears only its matching last response', async () => {
    const ownerId = '11111111-1111-4111-8111-111111111111';
    const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const planId = '22222222-2222-4222-8222-222222222222';
    const payload = model.planReminderPayload(ownerId, dogId, planId);
    const response = nativeResponse('health-tap', payload);
    const harness = buildTapHandlerHarness({ context: { ownerId, dogId, generation: 1 }, current: true,
      response, lastResponse: response, plan: { id: planId, dog_id: dogId } });
    await harness.handle(response);
    await harness.handle(response);
    assert.deepEqual(harness.pages, ['planned-health']);
    assert.deepEqual(harness.lookups, [[{}, dogId, planId]]);
    assert.equal(harness.clears, 1, 'the same identifier/date delivery is handled once');
  });
  await t.test('training tap routes directly after owner/dog/action validation', async () => {
    const ownerId = '11111111-1111-4111-8111-111111111111';
    const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const response = nativeResponse('training-tap', model.trainingReminderPayload(ownerId, dogId));
    const harness = buildTapHandlerHarness({ context: { ownerId, dogId, generation: 1 }, current: true, response, lastResponse: response });
    await harness.handle(response);
    assert.deepEqual(harness.pages, ['training']);
    assert.deepEqual(harness.lookups, []);
    assert.equal(harness.clears, 1);
  });
  await t.test('same identifier with a new delivery date routes again and only the matching delivery is cleared', async () => {
    const ownerId = '11111111-1111-4111-8111-111111111111';
    const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const payload = model.trainingReminderPayload(ownerId, dogId);
    const original = nativeResponse('daily-training', payload, undefined, new Date('2026-10-06T09:00:00Z'));
    const later = nativeResponse('daily-training', payload, undefined, new Date('2026-10-07T09:00:00Z'));
    const harness = buildTapHandlerHarness({ context: { ownerId, dogId, generation: 1 }, current: true, response: original, lastResponse: later });
    await harness.handle(original);
    assert.deepEqual(harness.pages, ['training']);
    assert.equal(harness.clears, 0, 'a different delivery date is not cleared');
    harness.setLastResponse(later);
    await harness.handle(later);
    assert.deepEqual(harness.pages, ['training', 'training']);
    assert.equal(harness.clears, 1);
  });
  await t.test('foreign, malformed and non-default taps do not look up or navigate', async () => {
    const ownerId = '11111111-1111-4111-8111-111111111111';
    const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const valid = model.trainingReminderPayload(ownerId, dogId);
    for (const response of [
      nativeResponse('wrong-owner', model.trainingReminderPayload('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', dogId)),
      nativeResponse('wrong-dog', model.trainingReminderPayload(ownerId, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')),
      nativeResponse('malformed', { ...valid, extra: 'unexpected' }),
      nativeResponse('different-action', valid, 'SNOOZE'),
      nativeResponse('invalid-date', valid, undefined, Number.NaN),
    ]) {
      const harness = buildTapHandlerHarness({ context: { ownerId, dogId, generation: 1 }, current: true, response, lastResponse: response });
      await harness.handle(response);
      assert.deepEqual(harness.pages, []);
      assert.deepEqual(harness.lookups, []);
      assert.equal(harness.clears, 0);
    }
  });
  await t.test('stale lookup does not navigate or clear, and repeated taps do not duplicate the read', async () => {
    const ownerId = '11111111-1111-4111-8111-111111111111';
    const dogId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const planId = '22222222-2222-4222-8222-222222222222';
    const response = nativeResponse('delayed-health', model.planReminderPayload(ownerId, dogId, planId));
    let finishLookup;
    const harness = buildTapHandlerHarness({ context: { ownerId, dogId, generation: 1 }, current: true, response, lastResponse: response,
      fetchPlan: () => new Promise((resolve) => { finishLookup = resolve; }) });
    const first = harness.handle(response);
    while (!finishLookup) await new Promise((resolve) => setImmediate(resolve));
    await harness.handle(response);
    harness.setCurrent(false);
    finishLookup({ id: planId, dog_id: dogId });
    await first;
    assert.deepEqual(harness.pages, []);
    assert.equal(harness.lookups.length, 1);
    assert.equal(harness.clears, 0);
  });
});

test('actual response-listener effect handles the cold-start response and removes its live listener', async () => {
  const match = workspaceSource.match(/useEffect\(\(\) => \{\s*let active = true;\s*const subscription = Notifications\.addNotificationResponseReceivedListener\(([\s\S]*?)\n  \}, \[handleNotificationResponse\]\);/);
  assert.ok(match, 'extracts the actual listener/cold-start effect');
  const effectSource = workspaceSource.slice(match.index, match.index + match[0].length)
    .replace(/^useEffect\(\(\) => \{/, 'function registerResponseListener() {')
    .replace(/\n  \}, \[handleNotificationResponse\]\);$/, '\n}');
  const code = ts.transpileModule(effectSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  const received = [];
  let liveListener;
  let removed = 0;
  const cold = nativeResponse('cold-start', model.trainingReminderPayload('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'));
  const Notifications = {
    addNotificationResponseReceivedListener(listener) { liveListener = listener; return { remove() { removed += 1; } }; },
    async getLastNotificationResponseAsync() { return cold; },
  };
  const load = new Function('Notifications', 'handleNotificationResponse', `${code}\nreturn registerResponseListener;`);
  const cleanup = load(Notifications, async (response) => { received.push(response); })();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(received, [cold]);
  const live = nativeResponse('live', model.trainingReminderPayload('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'));
  liveListener(live);
  assert.deepEqual(received, [cold, live]);
  cleanup();
  assert.equal(removed, 1);
  liveListener(nativeResponse('after-unmount', live.notification.request.content.data));
  assert.deepEqual(received, [cold, live]);
});

test('reminder migration and synthetic SQL probe guard the reminder columns without claiming a live RLS run', async () => {
  const migration = await readFile(new URL('../supabase/migrations/202610060002_plan_reminders.sql', import.meta.url), 'utf8');
  const probe = await readFile(new URL('../supabase/tests/plan-reminders.sql', import.meta.url), 'utf8');
  assert.match(migration, /reminder_enabled boolean not null default false/i);
  assert.match(migration, /reminder_minutes between 0 and 1439/i);
  assert.match(migration, /not reminder_enabled or reminder_minutes is not null/i);
  assert.match(migration, /grant insert\(reminder_enabled, reminder_minutes\).*authenticated/i);
  assert.match(migration, /grant update\(reminder_enabled, reminder_minutes\).*authenticated/i);
  assert.match(probe, /synthetic users and dogs only/i);
  assert.match(probe, /Other owner read a reminder choice/i);
  assert.match(probe, /Other owner updated another owner reminder choice/i);
  assert.match(probe, /Enabled reminder accepted a missing time/i);
  assert.match(probe, /rollback;\s*$/i);
});

function localClient(handler) {
  const requests = [];
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      const request = { method: init.method ?? 'GET', url, signal: init.signal, headers: new Headers(init.headers),
        body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined };
      requests.push(request);
      return handler(request);
    } },
  });
  return { client, requests };
}

function jsonResponse(value, status = 200) {
  return new Response(value === null ? null : JSON.stringify(value), {
    status, headers: { 'Content-Type': 'application/json', ...(status >= 400 ? { 'Content-Range': '*/0' } : {}) },
  });
}

function buildStorageHarness(secureStore) {
  const importsRemoved = storageSource.replace(/import[\s\S]*?from ['"][^'"]+['"];\r?\n/g, '');
  const code = ts.transpileModule(importsRemoved.replaceAll('export async function', 'async function'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const load = new Function('SecureStore', 'DEFAULT_NOTIFICATION_PREFERENCES', 'isNotificationPreferences', 'notificationPreferenceKey',
    `${code}\nreturn { readNotificationPreferences, writeNotificationPreferences };`);
  return { ...load(secureStore, model.DEFAULT_NOTIFICATION_PREFERENCES, model.isNotificationPreferences, model.notificationPreferenceKey), dispose() {} };
}

function buildServiceHarness(platformOS = 'ios') {
  const importsRemoved = serviceSource.replace(/import[\s\S]*?from ['"][^'"]+['"];\r?\n/g, '')
    .replaceAll('export const reminderService = new ReminderService();', '')
    .replace(/\bexport\s+/g, '');
  const code = ts.transpileModule(importsRemoved, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const names = [
    'Notifications', 'Platform', 'DEFAULT_NOTIFICATION_PREFERENCES', 'GENERIC_REMINDER_BODY', 'GENERIC_REMINDER_TITLE',
    'MAX_HEALTH_REMINDERS', 'REMINDER_FEATURE', 'createNextTrainingFireTime', 'createLocalFireTime',
    'isNotificationPreferences', 'isReminderMinutes', 'isUuid', 'parseReminderPayload', 'planReminderPayload',
    'reminderLogicalKey', 'trainingReminderPayload', 'readNotificationPreferences', 'writeNotificationPreferences',
  ];
  const values = [{ SchedulableTriggerInputTypes: { DATE: 'date', CALENDAR: 'calendar' }, AndroidImportance: { DEFAULT: 3 }, IosAuthorizationStatus: {
    AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4,
  }, setNotificationHandler() {} }, { OS: platformOS }, model.DEFAULT_NOTIFICATION_PREFERENCES, model.GENERIC_REMINDER_BODY,
  model.GENERIC_REMINDER_TITLE, model.MAX_HEALTH_REMINDERS, model.REMINDER_FEATURE, model.createNextTrainingFireTime,
  model.createLocalFireTime, model.isNotificationPreferences, model.isReminderMinutes, model.isUuid, model.parseReminderPayload,
  model.planReminderPayload, model.reminderLogicalKey, model.trainingReminderPayload, async () => ({ ...model.DEFAULT_NOTIFICATION_PREFERENCES }), async () => {}];
  const load = new Function(...names, `${code}\nreturn { ReminderService };`);
  return load(...values);
}

function buildTapHandlerHarness({ context, current, response, lastResponse, plan, fetchPlan } = {}) {
  const match = workspaceSource.match(/const handleNotificationResponse = useCallback\(async \(response: Notifications\.NotificationResponse\) => \{([\s\S]*?)\n  \}, \[client\]\);/);
  assert.ok(match, 'extracts the actual notification response handler');
  const code = ts.transpileModule(`async function handleNotificationResponse(response) {${match[1]}\n}`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const pages = [];
  const lookups = [];
  let clears = 0;
  let isCurrent = current;
  const identifiers = [
    'Notifications', 'notificationContextRef', 'reminderService', 'parseReminderPayload', 'handledNotificationResponses',
    'setPage', 'fetchPlannedHealthById', 'client',
  ];
  let currentLastResponse = lastResponse;
  const dependencies = [
    { DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT', async getLastNotificationResponseAsync() { return currentLastResponse; }, async clearLastNotificationResponseAsync() { clears += 1; } },
    { current: context },
    { isCurrent() { return isCurrent; } },
    model.parseReminderPayload,
    { current: new Set() },
    (page) => pages.push(page),
    async (...args) => { lookups.push(args); return fetchPlan ? await fetchPlan(...args) : plan ?? null; },
    {},
  ];
  const load = new Function(...identifiers, `${code}\nreturn { handleNotificationResponse };`);
  return { handle: load(...dependencies).handleNotificationResponse, pages, lookups, get clears() { return clears; },
    setCurrent(value) { isCurrent = value; }, setLastResponse(value) { currentLastResponse = value; } };
}

function nativeResponse(identifier, payload, actionIdentifier = 'expo.modules.notifications.actions.DEFAULT', date = new Date('2026-10-06T12:00:00Z')) {
  return { actionIdentifier, notification: { date: date instanceof Date ? date.getTime() : date, request: { identifier, content: { data: payload } } } };
}

function fakeAdapter({ requests = [], scheduled = [], cancelled = [], cancelError, getAllScheduledNotificationsAsync,
  scheduleNotificationAsync, cancelScheduledNotificationAsync, getPermissionsAsync, requestPermissionsAsync } = {}) {
  return {
    requests,
    getAllScheduledNotificationsAsync: getAllScheduledNotificationsAsync ?? (async () => requests),
    scheduleNotificationAsync: scheduleNotificationAsync ?? (async (request) => { scheduled.push(request); return request.identifier ?? `scheduled-${scheduled.length}`; }),
    cancelScheduledNotificationAsync: cancelScheduledNotificationAsync ?? (async (identifier) => {
      cancelled.push(identifier);
      if (cancelError) throw cancelError;
    }),
    getPermissionsAsync: getPermissionsAsync ?? (async () => ({ status: 'granted', granted: true, canAskAgain: true, expires: 'never' })),
    requestPermissionsAsync: requestPermissionsAsync ?? (async () => ({ status: 'granted', granted: true, canAskAgain: true, expires: 'never' })),
    setNotificationChannelAsync: async () => null,
  };
}

function plannedReminder(id, dogId, due_on, reminder_minutes) {
  return { id, dog_id: dogId, event_type: 'vaccination', due_on, description: null,
    created_at: '2026-10-01T00:00:00Z', reminder_enabled: true, reminder_minutes };
}

function notificationRequest(identifier, payload, date, overrideIdentifier = identifier, platform = 'android') {
  return { identifier: overrideIdentifier, content: { title: model.GENERIC_REMINDER_TITLE,
    body: model.GENERIC_REMINDER_BODY, data: payload }, trigger: platform === 'ios'
      ? { type: 'calendar', repeats: false, dateComponents: { calendar: 'iso8601', timeZone: 'UTC', year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour: date.getUTCHours(), minute: date.getUTCMinutes(), second: date.getUTCSeconds() } }
      : { type: 'date', value: date.getTime(), repeats: false } };
}
