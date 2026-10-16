import test from 'node:test';
import assert from 'node:assert/strict';
import { localDateKeyAt, isValidDateKey, isTrainingCompletionForDay, nextSelectableTrainingStep, trainingProgressStamp, deriveHomeDailyActivities, deriveDailyRoutineTemplateEntries, isDailyActivityDateCurrent, isDailyActivitySnapshotWritable, runDailyActivityActionIfWritable, runDailyActivityMutationGateway, dailyActivitySnapshotExpiryDelay, scheduleDailyActivitySnapshotExpiry, summarizeDailyActivityProgress, dailyActivityProgressLabel } from '../src/features/home/daily-activity-model.ts';

test('confirmed daily progress excludes unavailable sources and reports unknown status separately', () => {
  const summary = summarizeDailyActivityProgress([
    { completed: true },
    { completed: false },
    { completed: true, availability: 'adult-restricted' },
    { completed: false, availability: 'unavailable' },
  ]);
  assert.deepEqual(summary, { completedCount: 2, confirmedCount: 3, unavailableCount: 1 });
  assert.equal(dailyActivityProgressLabel(summary), '2 av 3 bekräftade klara · 1 status kan inte bekräftas');
  assert.equal(dailyActivityProgressLabel(summarizeDailyActivityProgress([{ completed: false, availability: 'unavailable' }])),'1 status kan inte bekräftas');
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
    checklist: [{ id: 'routine-item-1', label: 'Kissa' }, { id: 'routine-item-2', label: 'Fyll på vatten' }],
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
  assert.deepEqual(deriveHomeDailyActivities(snapshot, [activeProgram], 'dog-a', '2026-10-12').map(({ label, routineLabel, kind, completed, programTitle }) => ({ label, routineLabel, kind, completed, programTitle })), [
    { label: 'Kissa', routineLabel: 'Kvällsrutin', kind: 'routine', completed: true, programTitle: undefined },
    { label: 'Fyll på vatten', routineLabel: 'Kvällsrutin', kind: 'routine', completed: false, programTitle: undefined },
    { label: 'Sitt lugnt', routineLabel: undefined, kind: 'training', completed: true, programTitle: 'Trygg vardag' },
  ]);
  assert.deepEqual(deriveHomeDailyActivities(snapshot, [], 'dog-a', '2026-10-12').map(({ label, completed, availability }) => [label, completed, availability]), [
    ['Kissa', true, undefined], ['Fyll på vatten', false, undefined], ['Valt träningssteg kunde inte hämtas', false, 'unavailable'],
  ]);
  assert.deepEqual(deriveHomeDailyActivities(snapshot, [activeProgram], 'dog-b', '2026-10-12'), []);
  assert.deepEqual(deriveHomeDailyActivities(snapshot, [activeProgram], 'dog-a', '2026-10-13'), []);
});

test('all routine templates retain dog/date scope and use the selected day snapshot before schedule state', () => {
  const dateKey = '2026-10-13';
  const makeRoutine = (id, dogId, repeatWeekdays = [2]) => ({
    id, dog_id: dogId, label: id, checklist: [{ id: `${id}-current`, label: 'Ny mallrad' }], checklist_revision: 2,
    legacy_single_item: false, repeat_unit: 'week', repeat_interval: 1, repeat_weekdays: repeatWeekdays, repeat_anchor_date: '2026-10-12',
  });
  const selected = makeRoutine('selected', 'dog-a');
  const skipped = makeRoutine('skipped', 'dog-a', [1]);
  const scheduled = makeRoutine('scheduled', 'dog-a');
  const notScheduled = makeRoutine('not-scheduled', 'dog-a', [1]);
  const foreign = makeRoutine('foreign', 'dog-b');
  const selectedDay = {
    id: 'day-selected', dog_id: 'dog-a', routine_id: selected.id, date_key: dateKey, time_zone: 'Europe/Stockholm',
    routine_label_snapshot: 'Sparat namn', checklist_snapshot: [{ id: 'old-item', label: 'Sparad dagsrad' }], completed_item_ids: ['old-item'],
    completed_at: null, is_recurring_occurrence: true, routine_revision_snapshot: 1, routine_day_revision: 2, last_state_mutation_id: null,
  };
  const foreignDay = { ...selectedDay, id: 'day-foreign', dog_id: 'dog-b', routine_id: foreign.id };
  const otherDateDay = { ...selectedDay, id: 'day-other-date', date_key: '2026-10-12' };
  const selectedSkip = { ...selectedDay, day_id: 'skip-selected', routine_id: selected.id };
  const skip = { ...selectedDay, day_id: 'skip-skipped', routine_id: skipped.id };
  const foreignSkip = { ...skip, dog_id: 'dog-b', day_id: 'skip-foreign', routine_id: foreign.id };

  const entries = deriveDailyRoutineTemplateEntries({
    routines: [selected, skipped, scheduled, notScheduled, foreign],
    routineDays: [selectedDay, foreignDay, otherDateDay], routineDaySkips: [selectedSkip, skip, foreignSkip], dogId: 'dog-a', dateKey,
  });
  assert.deepEqual(entries.map((entry) => [entry.routine.id, entry.state]), [
    ['selected', 'selected'], ['skipped', 'skipped'], ['scheduled', 'scheduled'], ['not-scheduled', 'not-scheduled'],
  ]);
  assert.equal(entries[0].activities[0].label, 'Sparad dagsrad');
  assert.equal(entries[0].activities[0].completed, true);
  assert.equal(entries[0].activities[0].routineDay.id, 'day-selected');
  assert.deepEqual(entries[1].activities, []);
  assert.deepEqual(deriveDailyRoutineTemplateEntries({ routines: [selected], routineDays: [selectedDay], routineDaySkips: [], dogId: 'dog-a', dateKey: '2026-10-20' }), [
    { routine: selected, state: 'scheduled', selectedDay: null, skippedDay: null, activities: [] },
  ]);
  assert.deepEqual(deriveDailyRoutineTemplateEntries({ routines: [selected], routineDays: [], routineDaySkips: [], dogId: 'dog-b', dateKey }), []);
});

test('routine-template mutations require a current ready snapshot with no refresh or same-scope read in flight', () => {
  const base = { snapshotScope: 'account:dog:2026-10-13', expectedScope: 'account:dog:2026-10-13', updatedAt: 100_000, now: 159_999,
    maxAgeMs: 60_000, ready: true, refreshing: false, refreshError: false, sameScopeReadInFlight: false };
  assert.equal(isDailyActivitySnapshotWritable(base), true);
  assert.equal(isDailyActivitySnapshotWritable({ ...base, now: 160_000 }), false);
  assert.equal(isDailyActivitySnapshotWritable({ ...base, now: 99_999 }), false);
  assert.equal(isDailyActivitySnapshotWritable({ ...base, now: 100_000 }), true);
  assert.equal(isDailyActivitySnapshotWritable({ ...base, snapshotScope: 'other-dog' }), false);
  assert.equal(isDailyActivitySnapshotWritable({ ...base, ready: false }), false);
  assert.equal(isDailyActivitySnapshotWritable({ ...base, refreshing: true }), false);
  assert.equal(isDailyActivitySnapshotWritable({ ...base, refreshError: true }), false);
  assert.equal(isDailyActivitySnapshotWritable({ ...base, sameScopeReadInFlight: true }), false);
  assert.equal(isDailyActivitySnapshotWritable({ ...base, updatedAt: undefined }), false);
  assert.equal(isDailyActivitySnapshotWritable({ ...base, updatedAt: Number.POSITIVE_INFINITY }), false);
});

test('the event-time freshness guard rejects expired callbacks and schedules exact expiry safely', () => {
  const base = { snapshotScope: 'account:dog:2026-10-13', expectedScope: 'account:dog:2026-10-13', updatedAt: 100_000,
    maxAgeMs: 60_000, ready: true, refreshing: false, refreshError: false, sameScopeReadInFlight: false };
  let actionCalls = 0;
  let blockedCalls = 0;
  const fresh = runDailyActivityActionIfWritable({ ...base, now: 159_999 }, () => { actionCalls += 1; return 'write'; }, () => { blockedCalls += 1; });
  assert.deepEqual(fresh, { allowed: true, value: 'write' });
  const expired = runDailyActivityActionIfWritable({ ...base, now: 160_000 }, () => { actionCalls += 1; }, () => { blockedCalls += 1; });
  assert.deepEqual(expired, { allowed: false });
  const clockRolledBack = runDailyActivityActionIfWritable({ ...base, now: 99_999 }, () => { actionCalls += 1; }, () => { blockedCalls += 1; });
  assert.deepEqual(clockRolledBack, { allowed: false });
  assert.equal(actionCalls, 1);
  assert.equal(blockedCalls, 2);
  assert.equal(dailyActivitySnapshotExpiryDelay(100_000, 159_999, 60_000), 1);
  assert.equal(dailyActivitySnapshotExpiryDelay(100_000, 160_000, 60_000), 0);
  assert.equal(dailyActivitySnapshotExpiryDelay(null, 159_999, 60_000), null);
  assert.equal(dailyActivitySnapshotExpiryDelay(100_000, 159_999, 0), null);
});

test('the mutation gateway blocks every All-origin write category before the operation and retains origin on retry', () => {
  const base = { snapshotScope: 'account:dog:2026-10-13', expectedScope: 'account:dog:2026-10-13', updatedAt: 100_000, now: 159_999,
    maxAgeMs: 60_000, ready: true, refreshing: false, refreshError: false, sameScopeReadInFlight: false };
  const categories = ['completion', 'restore', 'remove', 'create', 'update', 'delete', 'delayed-delete-confirmation', 'retry'];
  let operationCalls = 0;
  let blockedCalls = 0;
  for (const category of categories) {
    const result = runDailyActivityMutationGateway({ origin: 'all', snapshot: { ...base, now: 160_000 }, isCurrentDate: true,
      isRetry: category === 'retry', retryOrigins: category === 'retry' ? { requested: 'all', pending: 'all' } : null,
      expectedSnapshotVersion: 100_000,
      operation: () => { operationCalls += 1; return category; }, onBlocked: () => { blockedCalls += 1; } });
    assert.deepEqual(result, { allowed: false }, category);
  }
  assert.equal(operationCalls, 0);
  assert.equal(blockedCalls, categories.length);

  const allowed = runDailyActivityMutationGateway({ origin: 'all', snapshot: base, isCurrentDate: true, expectedSnapshotVersion: 100_000,
    operation: () => { operationCalls += 1; return 'saved'; } });
  assert.deepEqual(allowed, { allowed: true, value: 'saved' });
  assert.equal(operationCalls, 1);

  assert.equal(runDailyActivityMutationGateway({ origin: 'all', snapshot: base, isCurrentDate: true, expectedSnapshotVersion: 100_000, isRetry: true,
    retryOrigins: { requested: 'all', pending: 'home' }, operation: () => { operationCalls += 1; } }).allowed, false);
  assert.equal(runDailyActivityMutationGateway({ origin: 'all', snapshot: base, isCurrentDate: false, expectedSnapshotVersion: 100_000,
    operation: () => { operationCalls += 1; } }).allowed, false);
  for (const snapshot of [
    { ...base, snapshotScope: 'other-dog' }, { ...base, refreshing: true }, { ...base, refreshError: true },
    { ...base, sameScopeReadInFlight: true }, { ...base, now: 99_999 }, { ...base, updatedAt: 160_000 },
  ]) {
    assert.equal(runDailyActivityMutationGateway({ origin: 'all', snapshot, isCurrentDate: true, expectedSnapshotVersion: 100_000,
      operation: () => { operationCalls += 1; } }).allowed, false);
  }
  assert.equal(runDailyActivityMutationGateway({ origin: 'all', snapshot: base, isCurrentDate: true, expectedSnapshotVersion: 99_999,
    operation: () => { operationCalls += 1; } }).allowed, false);

  const home = runDailyActivityMutationGateway({ origin: 'home', snapshot: { ...base, now: 160_000 }, isCurrentDate: false,
    operation: () => { operationCalls += 1; return 'home behavior retained'; } });
  assert.deepEqual(home, { allowed: true, value: 'home behavior retained' });
});

test('the All-origin date gate rejects the prior day immediately across local midnight', () => {
  const stockholm = 'Europe/Stockholm';
  const justBeforeMidnight = Date.parse('2026-10-16T21:59:59.999Z');
  const midnight = Date.parse('2026-10-16T22:00:00.000Z');
  assert.equal(localDateKeyAt(justBeforeMidnight, stockholm), '2026-10-16');
  assert.equal(localDateKeyAt(midnight, stockholm), '2026-10-17');
  assert.equal(isDailyActivityDateCurrent('2026-10-16', justBeforeMidnight, stockholm), true);
  assert.equal(isDailyActivityDateCurrent('2026-10-16', midnight, stockholm), false);
  assert.equal(isDailyActivityDateCurrent('2026-10-17', midnight, stockholm), true);
  assert.equal(isDailyActivityDateCurrent('2026-10-17', Number.NaN, stockholm), false);
});

test('snapshot expiry timer reschedules early delivery and cleans up on scope change', () => {
  let now = 159_998;
  let nextId = 0;
  const timers = new Map();
  let expired = 0;
  let cleared = 0;
  const cancel = scheduleDailyActivitySnapshotExpiry({ updatedAt: 100_000, maxAgeMs: 60_000, now: () => now,
    setTimer(callback, delay) { const id = ++nextId; timers.set(id, { callback, delay }); return id; },
    clearTimer(id) { cleared += 1; timers.delete(id); },
    onExpired() { expired += 1; },
  });
  assert.deepEqual([...timers.values()].map(({ delay }) => delay), [2]);
  const first = timers.get(1);
  timers.delete(1);
  now = 159_999;
  first.callback();
  assert.equal(expired, 0);
  assert.deepEqual([...timers.values()].map(({ delay }) => delay), [1]);
  const second = timers.get(2);
  timers.delete(2);
  now = 160_000;
  second.callback();
  assert.equal(expired, 1);
  cancel();
  assert.equal(cleared, 1);

  let cancelledCallback;
  const cancelPending = scheduleDailyActivitySnapshotExpiry({ updatedAt: 200_000, maxAgeMs: 60_000, now: () => 200_000,
    setTimer(callback) { cancelledCallback = callback; return 3; }, clearTimer() { cleared += 1; }, onExpired() { expired += 1; } });
  cancelPending();
  cancelledCallback();
  assert.equal(expired, 1);
  assert.equal(cleared, 2);
});

test('daily training selection preserves exact source failures and fails closed for adults', () => {
  const ids = ['program...0009', 'program...0010', 'program...0011'];
  const selections = ids.map((program_version_id, index) => ({
    id: `selection-${index}`, dog_id: 'dog-a', program_version_id, step_id: 'step-1', date_key: '2026-10-12', time_zone: 'Europe/Stockholm',
  }));
  const snapshot = { routines: [], routineDays: [], routineDaySkips: [], trainingSelections: selections };
  const programs = ids.map((id) => ({ id, title: id, steps: [{ id: 'step-1', position: 1, title: 'Öva lugnt', instruction: '' }], completedStepIds: [], completedAtByStepId: {} }));

  const puppy = deriveHomeDailyActivities(snapshot, programs, 'dog-a', '2026-10-12', 'VALP');
  assert.deepEqual(puppy.map(({ programId, stepId, availability, completed }) => [programId, stepId, availability, completed]),
    ids.map((id) => [id, 'step-1', 'available', false]));

  const adult = deriveHomeDailyActivities(snapshot, programs, 'dog-a', '2026-10-12', 'VUXEN');
  assert.deepEqual(adult.map(({ availability, completed }) => [availability, completed]), ids.map(() => ['adult-restricted', false]));
  const previouslyCompleted = programs.map((program, index) => index === 0
    ? { ...program, completedStepIds: ['step-1'], completedAtByStepId: { 'step-1': '2026-10-12T08:00:00.000Z' } }
    : program);
  const adultWithConfirmedProgress = deriveHomeDailyActivities(snapshot, previouslyCompleted, 'dog-a', '2026-10-12', 'VUXEN');
  assert.deepEqual(adultWithConfirmedProgress.map(({ availability, completed }) => [availability, completed]), [
    ['adult-restricted', true], ['adult-restricted', false], ['adult-restricted', false],
  ]);

  const stale = deriveHomeDailyActivities(snapshot, programs.slice(0, 2), 'dog-a', '2026-10-12', 'VALP');
  assert.deepEqual(stale.map(({ availability, programId, stepId }) => [availability, programId, stepId]), [
    ['available', ids[0], 'step-1'], ['available', ids[1], 'step-1'], ['unavailable', undefined, undefined],
  ]);
});
