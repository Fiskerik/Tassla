import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const home = await readFile(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const model = await readFile(new URL('../src/features/home/daily-activity-model.ts', import.meta.url), 'utf8');
const item = await readFile(new URL('../src/components/ui/DailyActivityItem.tsx', import.meta.url), 'utf8');
const manager = await readFile(new URL('../src/features/home/DailyActivityManagerSheet.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');

test('Home offers one permanent checklist entry while keeping its compact summary to five rows', () => {
  assert.match(home, /dailyActivities\.filter\(\(item\) => item\.completed\)\.length/);
  assert.match(home, /dailyState === 'ready' && dailyActivities\.length === 0/);
  assert.match(home, /dailySummary/);
  assert.match(home, /dailyActivities\.filter\(\(item\) => item\.completed\)\.length\} av \{dailyActivities\.length\} klara/);
  assert.match(home, /dailyActivities\.slice\(0, 5\)/);
  assert.match(home, /testID="home-open-checklist" accessibilityRole="button" accessibilityLabel="Öppna dagens checklista"/);
  assert.match(home, /<Text style=\{styles\.checklistLinkLabel\}>Checklista<\/Text>/);
  assert.doesNotMatch(home, /Visa alla/);
  assert.match(home, /Hantera dagens aktiviteter/);
  assert.match(home, /DailyActivityManagerSheet/);
  assert.match(workspace, /dailyStateLifetime === currentDailyLifetime/);
  assert.match(workspace, /dailySnapshotLifetime === currentDailyLifetime/);
});

test('routine and training rows expose separate accessible actions and truthful state', () => {
  assert.match(home, /onToggle=\{routineDay \? \(\) => item\.routineItemId && onSetRoutineCompletion/);
  assert.match(home, /item\.kind === 'training'[\s\S]*?onOpenTrainingStep\(item\.programId, item\.stepId, 'home'\)/);
  assert.match(item, /accessibilityRole="checkbox"/);
  assert.equal((item.match(/accessibilityRole="checkbox" aria-checked=\{completed\}/g) ?? []).length, 2, 'both routine checkbox variants expose the checked state to the web accessibility tree');
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
  assert.doesNotMatch(manager, /useEffect|setCreating/);
  assert.match(manager, /type RoutineDraft/);
  assert.match(manager, /function startCreate\(/);
});

test('training row presents the step title and keeps full program title in detail data', () => {
  assert.match(model, /label: step\.title/);
  assert.match(model, /programTitle: program\.title/);
  assert.match(manager, /item\.programTitle/);
});

test('full checklist owns all daily rows and never renders zero-of-zero progress', async () => {
  const screen = await readFile(new URL('../src/features/home/DailyChecklistScreen.tsx', import.meta.url), 'utf8');
  assert.match(screen, /activities\.map\(/);
  assert.match(screen, /visibleState === 'ready' && visibleActivities\.length === 0/);
  assert.match(screen, /showingToday && state === 'ready' && activities\.length > 0/);
  assert.match(screen, /group\.items\.map\(/);
  assert.match(screen, /completedCount\} av \{activities\.length\} klara/);
  assert.match(screen, /testID="daily-checklist-progress"/);
  assert.match(screen, /Inga aktiviteter idag/);
  assert.doesNotMatch(screen, /0 av 0/);
});

test('daily activity derivation excludes unrelated log, guide, health plan and checklist data', () => {
  assert.match(model, /snapshot\.routineDays/);
  assert.match(model, /snapshot\.trainingSelections/);
  assert.doesNotMatch(model, /dog_events|planned_health|content_open/i);
  assert.match(model, /row\.checklist_snapshot/);
  assert.match(model, /programById\.get\(row\.program_version_id\)/);
  assert.match(model, /program\?\.steps\.find/);
});
