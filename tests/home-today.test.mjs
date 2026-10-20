import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';

const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
const homeToday = await import('../src/features/home/home-today.ts');
hook.deregister();
const routineManagerSource = await readFile(new URL('../src/features/home/DailyActivityManagerSheet.tsx', import.meta.url), 'utf8');

const { homeAgeInWeeks, homeTodaySources, homeWeekStrip } = homeToday;

function dateAfterDays(date, days) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

test('home age handles absent or invalid dates and exact week boundaries', () => {
  const today = '2026-01-01';
  assert.equal(homeAgeInWeeks(null, today), null);
  assert.equal(homeAgeInWeeks(undefined, today), null);
  assert.equal(homeAgeInWeeks('', today), null);
  assert.equal(homeAgeInWeeks('2026-02-30', today), null);
  assert.equal(homeAgeInWeeks('2026-01-02', today), null);
  assert.equal(homeAgeInWeeks('2025-12-25', '2026-02-30'), null);
  assert.equal(homeAgeInWeeks(today, today), 0);
  assert.equal(homeAgeInWeeks(dateAfterDays(today, -6), today), 0);
  assert.equal(homeAgeInWeeks(dateAfterDays(today, -7), today), 1);
  assert.equal(homeAgeInWeeks(dateAfterDays(today, -14), today), 2);
});

test('home week strip includes zero and marks exactly one current week', () => {
  assert.deepEqual(homeWeekStrip(undefined, '2026-01-01'), []);
  assert.deepEqual(homeWeekStrip('2026-02-30', '2026-01-01'), []);
  assert.deepEqual(homeWeekStrip('2025-12-25', '2026-02-30'), []);
  assert.deepEqual(homeWeekStrip('2026-01-01', '2026-01-01'), [
    { week: 0, current: true },
    { week: 1, current: false },
    { week: 2, current: false },
    { week: 3, current: false },
    { week: 4, current: false },
    { week: 5, current: false },
    { week: 6, current: false },
    { week: 7, current: false },
    { week: 8, current: false },
    { week: 9, current: false },
    { week: 10, current: false },
    { week: 11, current: false },
    { week: 12, current: false },
  ]);

  const birthDate = '2026-01-01';
  const currentWeek = 10;
  const strip = homeWeekStrip(birthDate, dateAfterDays(birthDate, currentWeek * 7));
  assert.deepEqual(strip.map(({ week }) => week), Array.from({ length: 23 }, (_, week) => week));
  assert.equal(strip.filter(({ current }) => current).length, 1);
  assert.equal(strip.find(({ current }) => current)?.week, currentWeek);
  for (const week of [0, 1, 10]) {
    const boundaryStrip = homeWeekStrip(birthDate, dateAfterDays(birthDate, week * 7));
    assert.equal(boundaryStrip.filter(({ current }) => current).length, 1);
    assert.equal(boundaryStrip.find(({ current }) => current)?.week, week);
  }
});

test('Home today sources use local-day events and performed health while keeping today plans separate', () => {
  const date = '2026-10-12';
  const events = [
    { id: 'log-yesterday', dogId: 'dog-1', type: 'pee', occurredAt: '2026-10-11T23:59:00', note: null, origin: 'local-test' },
    { id: 'log-morning', dogId: 'dog-1', type: 'food', occurredAt: '2026-10-12T09:15:00', note: 'Åt allt', origin: 'local-test' },
    { id: 'log-tomorrow', dogId: 'dog-1', type: 'walk', occurredAt: '2026-10-13T00:01:00', note: null, origin: 'local-test' },
  ];
  const healthHistory = [
    { id: 'health-yesterday', dog_id: 'dog-1', actor_id: 'owner-1', event_type: 'vaccination', occurred_on: '2026-10-11', occurred_time: '23:00', description: 'I går' },
    { id: 'health-today', dog_id: 'dog-1', actor_id: 'owner-1', event_type: 'vet_visit', occurred_on: date, occurred_time: '11:00', description: 'Besök' },
    { id: 'health-untimed', dog_id: 'dog-1', actor_id: 'owner-1', event_type: 'vaccination', occurred_on: date, occurred_time: null, description: 'Tid saknas' },
    { id: 'health-tomorrow', dog_id: 'dog-1', actor_id: 'owner-1', event_type: 'vet_visit', occurred_on: '2026-10-13', occurred_time: '08:00', description: 'I morgon' },
  ];
  const plans = [
    { id: 'plan-tomorrow', dog_id: 'dog-1', event_type: 'vaccination', due_on: '2026-10-13', due_time: '08:00', description: null, created_at: date, reminder_enabled: false, reminder_minutes: null },
    { id: 'plan-untimed', dog_id: 'dog-1', event_type: 'vet_visit', due_on: date, due_time: null, description: null, created_at: date, reminder_enabled: false, reminder_minutes: null },
    { id: 'plan-today', dog_id: 'dog-1', event_type: 'vaccination', due_on: date, due_time: '10:00', description: null, created_at: date, reminder_enabled: false, reminder_minutes: null },
    { id: 'plan-yesterday', dog_id: 'dog-1', event_type: 'vet_visit', due_on: '2026-10-11', due_time: '10:00', description: null, created_at: date, reminder_enabled: false, reminder_minutes: null },
  ];

  const sources = homeTodaySources(date, events, healthHistory, plans);
  assert.deepEqual(sources.logged.map(({ id, source }) => [id, source]), [
    ['health-today', 'health'],
    ['log-morning', 'log'],
    ['health-untimed', 'health'],
  ]);
  assert.deepEqual(sources.planned.map(({ id }) => id), ['plan-today', 'plan-untimed']);
  assert.ok(sources.planned.every((plan) => !('completed' in plan) && !('completed_at' in plan)));
  assert.ok(sources.logged.every((entry) => !('completed' in entry) && !('completed_at' in entry)));
});

test('routine manager stacks long peer actions at narrow widths or larger text without reducing touch targets', () => {
  assert.match(routineManagerSource, /useWindowDimensions\(\)/);
  assert.match(routineManagerSource, /width < 360 \|\| fontScale >= 1\.25/);
  assert.match(routineManagerSource, /stackRoutineActions && styles\.routineActionsStacked/);
  assert.match(routineManagerSource, /routineActionButtonStacked: \{ flex: 0, flexBasis: 'auto', alignSelf: 'stretch' \}/);
  assert.match(routineManagerSource, /routineActionButton: \{ flex: 1, flexBasis: '45%', minWidth: tokens\.size\.touchMin \}/);
  assert.match(routineManagerSource, /minHeight: tokens\.size\.touchMin/);
  assert.match(routineManagerSource, /accessibilityLabel=\{`\$\{selected \? 'Ta bort' : skippedDay \? 'Lägg tillbaka' : 'Lägg till'\} rutinen/);
});
