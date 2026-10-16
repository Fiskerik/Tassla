import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const home = await readFile(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const model = await readFile(new URL('../src/features/home/daily-activity-model.ts', import.meta.url), 'utf8');
const item = await readFile(new URL('../src/components/ui/DailyActivityItem.tsx', import.meta.url), 'utf8');
const manager = await readFile(new URL('../src/features/home/DailyActivityManagerSheet.tsx', import.meta.url), 'utf8');
const screen = await readFile(new URL('../src/features/home/DailyChecklistScreen.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');

test('Home derives count and progress from the full daily activity array and shows at most five rows', () => {
  assert.match(home, /summarizeDailyActivityProgress\(dailyActivities\)/);
  assert.match(home, /dailyActivityProgressLabel\(dailyProgress\)/);
  assert.match(home, /max: dailyProgress\.confirmedCount, now: dailyProgress\.completedCount/);
  assert.match(model, /availability !== 'unavailable'/);
  assert.match(home, /dailyActivities\.length > 0/);
  assert.match(home, /dailyActivities\.slice\(0, 5\)/);
  assert.match(home, /dailyActivities\.length > 5/);
  assert.match(home, /Visa alla/);
  assert.match(home, /accessibilityRole="progressbar"/);
  assert.match(home, /progressFill/);
  assert.match(home, /Hantera dagens aktiviteter/);
  assert.match(home, /DailyActivityManagerSheet/);
  assert.match(workspace, /dailyStateLifetime === currentDailyLifetime/);
  assert.match(workspace, /dailySnapshotLifetime === currentDailyLifetime/);
});

test('routine and training rows expose separate accessible actions and truthful state', () => {
  assert.match(home, /onToggle=\{routineDay \? \(\) => item\.routineItemId && onSetRoutineCompletion/);
  assert.match(home, /item\.kind === 'training' \? \(\) => onGo\('training'\)/);
  assert.match(item, /accessibilityRole="checkbox"/);
  assert.match(item, /accessibilityRole="button" accessibilityLabel=\{rowLabel\}/);
  assert.match(item, /Sparar…/);
  assert.match(item, /onRetry/);
  const homeVariant = item.slice(item.indexOf('function HomeDailyActivityItem'), item.indexOf('const styles'));
  assert.doesNotMatch(homeVariant, /<IconChip|list-outline|school-outline/);
  assert.match(homeVariant, /homeTrainingStatusCell/);
  assert.match(homeVariant, /homeTrainingStatusChecked/);
  assert.match(item, /homeTrainingStatus:[^{]*\{[^}]*borderRadius: tokens\.radius\.full/);
  assert.match(workspace, /setRoutineDayCompletion\(client, row, itemId, completed\)/);
  assert.match(workspace, /Ingen ny bock visas/);
  assert.match(manager, /onRemoveRoutineFromDay/);
  assert.match(manager, /onRemoveTrainingFromDay/);
  assert.match(manager, /onCreateRoutine/);
  assert.match(manager, /onUpdateRoutine/);
  assert.match(manager, /onDeleteRoutine/);
  assert.match(manager, /<BottomSheet/);
  assert.match(manager, /useEffect/);
  assert.doesNotMatch(manager, /setCreating/);
  assert.match(manager, /type RoutineDraft/);
  assert.match(manager, /function startCreate\(/);
});

test('training row presents the step title and keeps full program title in detail data', () => {
  assert.match(model, /label: step\.title/);
  assert.match(model, /programTitle: program\.title/);
  assert.match(manager, /item\.programTitle/);
});

test('daily activity derivation excludes unrelated log, guide, health plan and checklist data', () => {
  assert.match(model, /snapshot\.routineDays/);
  assert.match(model, /snapshot\.trainingSelections/);
  assert.doesNotMatch(model, /dog_events|planned_health|content_open/i);
  assert.match(model, /row\.checklist_snapshot/);
  assert.match(model, /programById\.get\(row\.program_version_id\)/);
  assert.match(model, /program\?\.steps\.find/);
});

test('checklist shows all dog-scoped routine templates and preserves selected day snapshots', () => {
  assert.match(screen, /items=\{\['Idag', 'Alla'\]\}/);
  assert.match(screen, /<AppBar mode="Back" variant="compact" title="Checklista" actionLabel="Tillbaka till Hem" onAction=\{onBack\} \/>/);
  assert.match(screen, /scopeContext: \{[^}]*textAlign: 'center'/);
  assert.doesNotMatch(screen, /<PageHeading title="Checklista"/);
  assert.doesNotMatch(screen, /Kommande|Vecka/);
  assert.match(screen, /deriveDailyRoutineTemplateEntries\(\{ routines, routineDays, routineDaySkips, dogId, dateKey \}\)/);
  assert.match(model, /routineDays: readonly DailyRoutineDay\[\]/);
  assert.match(model, /routineDaySkips: readonly DailyRoutineDaySkip\[\]/);
  assert.match(model, /selectedDay\.checklist_snapshot\.map/);
  assert.match(screen, /routineTemplatesWritable/);
  assert.match(screen, /onAddRoutineTemplateToDay/);
  assert.match(screen, /Välj igen idag/);
  assert.match(screen, /Välj för idag/);
  assert.match(screen, /Rutinmallarna kunde inte hämtas\. Ingen lista visas\./);
  assert.match(screen, /Inga rutinmallar än/);
});

test('All-view routine writes require a fresh same-scope snapshot at render and handler time', () => {
  assert.match(model, /export function isDailyActivitySnapshotWritable/);
  assert.match(model, /snapshotScope === expectedScope && ready && !refreshing && !refreshError && !sameScopeReadInFlight/);
  assert.match(model, /export function runDailyActivityActionIfWritable/);
  assert.match(model, /export function runDailyActivityMutationGateway/);
  assert.match(model, /expectedSnapshotVersion !== input\.snapshot\.updatedAt/);
  assert.match(model, /export function isDailyActivityDateCurrent/);
  assert.match(model, /export function scheduleDailyActivitySnapshotExpiry/);
  assert.match(workspace, /const dailyRoutineTemplatesWritable = isDailyActivitySnapshotWritable/);
  assert.match(workspace, /runDailyActivityActionIfWritable/);
  assert.match(workspace, /scheduleDailyActivitySnapshotExpiry/);
  assert.match(workspace, /runDailyActivityMutationGateway\(\{ origin/);
  assert.match(workspace, /isCurrentDate: isDailyActivityDateCurrent\(dailyDateKey, Date\.now\(\), dailyTimeZone\)/);
  assert.match(workspace, /expectedSnapshotVersion,/);
  assert.match(workspace, /pendingDailyRetry\.current\?\.lifetime === scope \? pendingDailyRetry\.current : null/);
  assert.match(workspace, /retryDailyMutation\('all', dailyAllSnapshotVersion\)/);
  assert.match(workspace, /runDailyMutation\(pending\.key, pending\.run, true, pending\.origin, expectedSnapshotVersion\)/);
  assert.match(workspace, /const dailyAllManagerActions = \{/);
  assert.match(workspace, /key=\{currentDailyLifetime\} dogName/);
  assert.match(screen, /onGuardAllAction/);
  assert.match(screen, /managerSession\?\.tab === 'Alla' \? managerSession\.snapshotVersion : routineTemplatesSnapshotVersion/);
  assert.match(screen, /managerStaleLocked/);
  assert.match(manager, /readOnly/);
  assert.match(manager, /onSessionNeedsPreservationChange/);
  assert.match(manager, /Stängning stoppar inte en ändring/);
  assert.match(manager, /Välj för idag/);
  assert.match(manager, /Välj igen idag/);
  assert.match(manager, /Ta bort idag/);
  assert.doesNotMatch(manager, /Ta bort från Hemskärmen|Lägg till på Hemskärmen/);
});
