import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const resolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const model = await import('../src/features/home/daily-activity-model.ts');
resolution.deregister();
const { localDateKeyAt, dailyActivityScopeKey, isValidDateKey, isTrainingCompletionForDay, nextSelectableTrainingStep, trainingProgressStamp,
  deriveHomeDailyActivities, deriveSavedRangeActivities, checklistFilterRange, addCalendarDays, projectUpcomingRoutineDates } = model;

test('checklist date ranges use local date keys and exact inclusive calendar bounds', () => {
  assert.deepEqual(checklistFilterRange('Denna vecka', '2026-10-18'), { from: '2026-10-12', to: '2026-10-18' });
  assert.deepEqual(checklistFilterRange('Denna vecka', '2027-01-01'), { from: '2026-12-28', to: '2027-01-03' });
  assert.deepEqual(checklistFilterRange('Alla', '2026-03-01'), { from: '2026-01-31', to: '2026-03-01' });
  assert.deepEqual(checklistFilterRange('Kommande', '2026-03-01'), { from: '2026-03-02', to: '2026-03-08' });
  assert.equal(addCalendarDays('2028-02-28', 1), '2028-02-29');
  assert.equal(checklistFilterRange('Alla', '2026-02-30'), null);
});

test('the checklist daily scope rolls over at local midnight and changes the Kommande range', () => {
  const scopeAt = (instant) => dailyActivityScopeKey({ accountId: 'owner-1', accountGeneration: 3, selectionKey: 'owner-1:dog-1',
    instant, timeZone: 'Europe/Stockholm', review: false });
  const justBefore = scopeAt('2026-10-21T21:59:00.000Z');
  const justAfter = scopeAt('2026-10-21T22:01:00.000Z');

  assert.notEqual(justBefore, justAfter);
  assert.equal(localDateKeyAt('2026-10-21T21:59:00.000Z', 'Europe/Stockholm'), '2026-10-21');
  assert.equal(localDateKeyAt('2026-10-21T22:01:00.000Z', 'Europe/Stockholm'), '2026-10-22');
  assert.deepEqual(checklistFilterRange('Kommande', '2026-10-21'), { from: '2026-10-22', to: '2026-10-28' });
  assert.deepEqual(checklistFilterRange('Kommande', '2026-10-22'), { from: '2026-10-23', to: '2026-10-29' });
});

test('upcoming repeat projection honors anchor, weekdays and month-end without creating occurrences', () => {
  const routine = { id: 'monthly', dog_id: 'dog-a', label: 'Månad', checklist: [], checklist_revision: 1,
    legacy_single_item: false, repeat_unit: 'month', repeat_interval: 1, repeat_weekdays: null, repeat_anchor_date: '2026-01-31' };
  const weekly = { ...routine, id: 'weekly', repeat_unit: 'week', repeat_interval: 2, repeat_weekdays: [1, 3], repeat_anchor_date: '2026-10-05' };
  assert.deepEqual(projectUpcomingRoutineDates([routine], '2026-02-25', '2026-03-03').map(({ dateKey }) => dateKey), ['2026-02-28']);
  assert.deepEqual(projectUpcomingRoutineDates([weekly], '2026-10-19', '2026-10-25').map(({ dateKey }) => dateKey), ['2026-10-19', '2026-10-21']);
  assert.deepEqual(projectUpcomingRoutineDates([weekly], '2026-10-04', '2026-10-04'), []);
});

test('daily, weekly, fortnightly and monthly recurrence boundaries remain calendar-date based', () => {
  const base = { id: 'repeat', dog_id: 'dog-a', label: 'Återkomst', checklist: [], checklist_revision: 1,
    legacy_single_item: false, repeat_unit: 'day', repeat_interval: 1, repeat_weekdays: null, repeat_anchor_date: '2026-03-28' };
  const everyOtherDay = { ...base, repeat_interval: 2, repeat_anchor_date: '2026-03-29' };
  const weekly = { ...base, repeat_unit: 'week', repeat_anchor_date: '2026-03-21' };
  const fortnightlyWeekdays = { ...weekly, repeat_interval: 2, repeat_weekdays: [1, 3], repeat_anchor_date: '2026-03-02' };
  const monthly = { ...base, repeat_unit: 'month', repeat_anchor_date: '2026-01-31' };
  const everyOtherMonth = { ...monthly, repeat_interval: 2 };
  const futureAnchor = { ...base, repeat_anchor_date: '2026-04-10' };

  assert.deepEqual(projectUpcomingRoutineDates([base], '2026-03-28', '2026-03-30').map(({ dateKey }) => dateKey), [
    '2026-03-28', '2026-03-29', '2026-03-30',
  ]);
  assert.deepEqual(projectUpcomingRoutineDates([everyOtherDay], '2026-03-28', '2026-04-04').map(({ dateKey }) => dateKey), [
    '2026-03-29', '2026-03-31', '2026-04-02', '2026-04-04',
  ]);
  assert.deepEqual(projectUpcomingRoutineDates([weekly], '2026-03-22', '2026-03-29').map(({ dateKey }) => dateKey), ['2026-03-28']);
  assert.deepEqual(projectUpcomingRoutineDates([fortnightlyWeekdays], '2026-03-08', '2026-03-22').map(({ dateKey }) => dateKey), [
    '2026-03-16', '2026-03-18',
  ]);
  assert.deepEqual(projectUpcomingRoutineDates([monthly], '2026-02-01', '2026-04-30').map(({ dateKey }) => dateKey), [
    '2026-02-28', '2026-03-31', '2026-04-30',
  ]);
  assert.deepEqual(projectUpcomingRoutineDates([everyOtherMonth], '2026-02-01', '2026-05-31').map(({ dateKey }) => dateKey), [
    '2026-03-31', '2026-05-31',
  ]);
  assert.deepEqual(projectUpcomingRoutineDates([futureAnchor], '2026-03-28', '2026-04-09'), []);
  assert.deepEqual(projectUpcomingRoutineDates([base], '2026-10-24', '2026-10-26').map(({ dateKey }) => dateKey), [
    '2026-10-24', '2026-10-25', '2026-10-26',
  ]);
});

test('projects saved training timestamps into the selected IANA local day across UTC boundaries', () => {
  assert.equal(localDateKeyAt('2026-10-13T00:30:00.000Z', 'America/Los_Angeles'), '2026-10-12');
  assert.equal(localDateKeyAt('2026-10-13T00:30:00.000Z', 'Europe/Stockholm'), '2026-10-13');
  assert.equal(localDateKeyAt('not-a-time', 'Europe/Stockholm'), null);
  assert.equal(localDateKeyAt('2026-10-13T00:30:00.000Z', 'local'), null);
  assert.equal(localDateKeyAt('2026-10-13T00:30:00.000Z', 'Unknown/Zone'), null);
});

test('training activity completion is exact to dog, version, step and stored local date', () => {
  const progress = { dogId: 'dog-a', programVersionId: 'version-2', stepId: 'step-1', completedAt: '2026-10-13T00:30:00.000Z' };
  const scope = { dogId: 'dog-a', programVersionId: 'version-2', stepId: 'step-1' };
  assert.equal(isTrainingCompletionForDay(progress, scope, '2026-10-12', 'America/Los_Angeles'), true);
  assert.equal(isTrainingCompletionForDay(progress, scope, '2026-10-13', 'America/Los_Angeles'), false);
  assert.equal(isTrainingCompletionForDay(progress, { ...scope, dogId: 'dog-b' }, '2026-10-12', 'America/Los_Angeles'), false);
  assert.equal(isTrainingCompletionForDay(progress, { ...scope, programVersionId: 'version-1' }, '2026-10-12', 'America/Los_Angeles'), false);
  assert.equal(isTrainingCompletionForDay(progress, { ...scope, stepId: 'step-2' }, '2026-10-12', 'America/Los_Angeles'), false);
  assert.equal(isValidDateKey('2026-02-29'), false);
  assert.equal(isValidDateKey('2028-02-29'), true);
});

test('only the first incomplete ordered training step is selectable', () => {
  const steps = [
    { id: 'step-3', position: 3, title: 'Three', instruction: '' },
    { id: 'step-1', position: 1, title: 'One', instruction: '' },
    { id: 'step-2', position: 2, title: 'Two', instruction: '' },
  ];
  assert.equal(nextSelectableTrainingStep({ steps, completedStepIds: [] })?.id, 'step-1');
  assert.equal(nextSelectableTrainingStep({ steps, completedStepIds: ['step-1'] })?.id, 'step-2');
  assert.equal(nextSelectableTrainingStep({ steps, completedStepIds: ['step-1', 'step-2', 'step-3'] }), null);
});

test('training stamp preserves the original saved completion time and exact version scope', () => {
  const program = { id: 'version-4', completedAtByStepId: { 'step-7': '2026-10-12T22:15:00.000Z' } };
  assert.deepEqual(trainingProgressStamp('dog-9', program, 'step-7'), {
    dogId: 'dog-9', programVersionId: 'version-4', stepId: 'step-7', completedAt: '2026-10-12T22:15:00.000Z',
  });
  assert.equal(trainingProgressStamp('dog-9', program, 'missing'), null);
});

test('daily activities count owner marks and exact saved training source while excluding withdrawn sources', () => {
  const routine = {
    id: 'routine-1',
    dog_id: 'dog-a',
    label: 'Kvällsrutin',
    checklist: [
      { id: 'routine-item-1', label: 'Kissa', icon: 'paw', description: 'Efter måltid' },
      { id: 'routine-item-2', label: 'Fyll på vatten' },
    ],
    checklist_revision: 1,
    legacy_single_item: false,
    repeat_unit: null,
    repeat_interval: null,
    repeat_anchor_date: null,
  };
  const selectedRoutine = {
    id: 'routine-day-1',
    dog_id: 'dog-a',
    routine_id: routine.id,
    date_key: '2026-10-12',
    time_zone: 'America/Los_Angeles',
    routine_label_snapshot: 'Kvällsrutin',
    checklist_snapshot: routine.checklist,
    completed_item_ids: ['routine-item-1'],
    completed_at: null,
    is_recurring_occurrence: false,
    routine_revision_snapshot: 1,
    routine_day_revision: 1,
    last_state_mutation_id: null,
  };
  const selection = { id: 'selection-1', dog_id: 'dog-a', program_version_id: 'version-2', step_id: 'step-1', date_key: '2026-10-12', time_zone: 'America/Los_Angeles' };
  const snapshot = { routines: [routine], routineDays: [selectedRoutine], routineDaySkips: [], trainingSelections: [selection] };
  const activeProgram = { id: 'version-2', title: 'Trygg vardag', steps: [{ id: 'step-1', position: 1, title: 'Sitt lugnt', instruction: '' }], completedStepIds: ['step-1'], completedAtByStepId: { 'step-1': '2026-10-13T00:30:00.000Z' } };
  const derived = deriveHomeDailyActivities(snapshot, [activeProgram], 'dog-a', '2026-10-12');
  assert.deepEqual(derived.map(({ label, routineLabel, kind, completed, programTitle, icon, description }) => ({ label, routineLabel, kind, completed, programTitle, icon, description })), [
    { label: 'Kissa', routineLabel: 'Kvällsrutin', kind: 'routine', completed: true, programTitle: undefined, icon: 'paw', description: 'Efter måltid' },
    { label: 'Fyll på vatten', routineLabel: 'Kvällsrutin', kind: 'routine', completed: false, programTitle: undefined, icon: derived[1].icon, description: undefined },
    { label: 'Sitt lugnt', routineLabel: undefined, kind: 'training', completed: true, programTitle: 'Trygg vardag', icon: undefined, description: undefined },
  ]);
  assert.notEqual(derived[1].icon, 'paw', 'a legacy checklist point receives its own deterministic default icon');
  assert.deepEqual(deriveHomeDailyActivities(snapshot, [], 'dog-a', '2026-10-12').map(({ label, completed }) => [label, completed]), [
    ['Kissa', true], ['Fyll på vatten', false],
  ]);
  assert.deepEqual(deriveHomeDailyActivities(snapshot, [activeProgram], 'dog-b', '2026-10-12'), []);
  assert.deepEqual(deriveHomeDailyActivities(snapshot, [activeProgram], 'dog-a', '2026-10-13'), []);
});

test('saved range activities use exact source metadata and do not invent unresolved training labels', () => {
  const selection = { id: 'selection-1', dog_id: 'dog-a', program_version_id: 'version-2', step_id: 'step-1', date_key: '2026-10-12', time_zone: 'America/Los_Angeles' };
  const snapshot = { routines: [], routineDays: [], routineDaySkips: [], trainingSelections: [selection], completeSources: [], failedSources: [] };
  const sources = new Map([['version-2:step-1', {
    programVersionId: 'version-2', programTitle: 'Trygg vardag', stepId: 'step-1', stepTitle: 'Sitt lugnt',
    completedAt: '2026-10-13T00:30:00.000Z',
  }]]);
  assert.deepEqual(deriveSavedRangeActivities(snapshot, sources, 'dog-a', '2026-10-12', '2026-10-12').map(({ label, completed, programTitle }) => ({ label, completed, programTitle })), [
    { label: 'Sitt lugnt', completed: true, programTitle: 'Trygg vardag' },
  ]);
  assert.deepEqual(deriveSavedRangeActivities(snapshot, new Map(), 'dog-a', '2026-10-12', '2026-10-12'), []);
});
