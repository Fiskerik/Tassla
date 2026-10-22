import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const home = await readFile(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const model = await readFile(new URL('../src/features/home/daily-activity-model.ts', import.meta.url), 'utf8');
const item = await readFile(new URL('../src/components/ui/DailyActivityItem.tsx', import.meta.url), 'utf8');
const manager = await readFile(new URL('../src/features/home/DailyActivityManagerSheet.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');

test('Home offers one permanent checklist entry while keeping its compact summary to five rows', () => {
  assert.match(home, /selectDailyProgress\(dailyActivities, dailyState === 'hidden' \? 'unknown' : dailyState\)/);
  assert.match(home, /dailyHeading/);
  assert.match(home, /<ProgressControl coverage=\{checklistCoverage\} completed=\{checklistCompleted\} total=\{checklistTotal\} onPress=\{onOpenProgress\} \/>/);
  assert.match(home, /accessibilityLabel=\{complete \? `\$\{completed\} av \$\{total\} dagsuppgifter klara\. Se dagens framsteg`/);
  assert.match(home, /accessibilityLabel=\{`\$\{dailyProgress\.completedCount\} av \$\{dailyProgress\.totalCount\} dagsuppgifter klara`\}/);
  assert.match(home, /dailyProgress\.activities\.slice\(0, 5\)/);
  assert.equal((home.match(/testID="home-open-checklist"/g) ?? []).length, 1, 'the Home card exposes one full-checklist control');
  assert.match(home, /accessibilityLabel="Öppna Checklistor"/);
  assert.match(home, /checklistInline/);
  const heading = home.slice(home.indexOf('<View style={styles.dailyHeading}'), home.indexOf('{dailyRefreshError'));
  assert.doesNotMatch(heading, /Hantera|Checklista|Visa alla/);
  const checklistControl = home.slice(home.indexOf('function ChecklistControl'), home.indexOf('function ProgressControl'));
  assert.match(checklistControl, /accessibilityLabel="Öppna Checklistor"[\s\S]*?testID="home-open-checklist-chevron" name="chevron-forward"/);
  assert.doesNotMatch(checklistControl, /<Text/);
  assert.match(home, /dailyProgress\.coverage === 'empty'/);
  assert.match(home, /dailyProgress\.coverage === 'unknown' \|\| dailyProgress\.coverage === 'partial'/);
  assert.match(home, /Dagens uppgifter är inte tillgängliga ännu\./);
  const emptyState = home.slice(home.indexOf("dailyProgress.coverage === 'empty'"), home.indexOf("dailyProgress.coverage === 'complete'", home.indexOf("dailyProgress.coverage === 'empty'")));
  assert.doesNotMatch(emptyState, /<Button|Hantera dagens aktiviteter/, 'the empty summary does not duplicate the direct manager action');
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
  assert.match(manager, /editFocusedRoutineOnOpen/);
  assert.match(manager, /startEdit\(focusedRoutine\)/);
  assert.match(manager, /type RoutineDraft/);
  assert.match(manager, /function startCreate\(/);
});

test('routine home and delete actions are icon-only and confirm before removal', () => {
  const routineRow = manager.slice(manager.indexOf('function RoutineTemplateRow'), manager.indexOf('function ActionButton'));
  const actions = routineRow.slice(routineRow.indexOf('<View style={styles.routineActions}>'));
  assert.match(actions, /<IconOnlyButton icon=\{selected \? 'remove-outline' : 'add-outline'\}/);
  assert.match(actions, /accessibilityLabel=\{`\$\{selected \? 'Ta bort' : skippedDay \? 'Lägg tillbaka' : 'Lägg till'\} rutinen/);
  assert.match(actions, /Alert\.alert\('Ta bort från Hemskärmen\?'/);
  assert.match(actions, /\{ text: 'Avbryt', style: 'cancel' \}, \{ text: 'Ta bort', onPress: onRemove \}/);
  assert.match(actions, /<IconOnlyButton icon="trash-outline" accessibilityLabel=\{`Ta bort rutin/);
  assert.match(actions, /Alert\.alert\('Ta bort rutin\?'/);
  assert.match(actions, /style: 'destructive', onPress: \(\) => \{ void onDelete\(\); \}/);
  assert.doesNotMatch(actions, /<ActionButton|<Text/);
  assert.match(manager, /iconOnlyButton: \{ width: tokens\.size\.touchMin, minHeight: tokens\.size\.touchMin/);
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
  assert.match(screen, /title="Checklistor"/);
  assert.match(screen, /Håll inne på rutinen för att redigera\./);
  assert.match(screen, /accessibilityHint=\{item\.kind === 'routine'[\s\S]*?Håll inne på rutinen för att redigera\./);
  assert.match(screen, /onLongPress=\{item\.kind === 'routine'[\s\S]*?openManager\(routineDay\.routine_id, true\)/);
  assert.match(screen, /Inga aktiviteter idag/);
  assert.doesNotMatch(screen, /0 av 0/);
});

test('routine detail adds a long-press action while training rows stay navigation-only', () => {
  const trainingStart = item.indexOf("if (kind === 'training')");
  const routineStart = item.indexOf('return <View style={styles.homeRowWrap}>', trainingStart + 1);
  const routineItem = item.slice(routineStart, item.indexOf('const styles'));
  assert.match(routineItem, /accessibilityHint=\{accessibilityHint\}/);
  assert.match(routineItem, /onPress=\{onOpen\} onLongPress=\{onLongPress\}/);
  const trainingRow = item.slice(trainingStart, routineStart);
  assert.doesNotMatch(trainingRow, /onLongPress/);
  assert.match(manager, /accessibilityLabel=\{`Redigera rutin \$\{routine\.label\}`\}/);
});

test('daily activity derivation excludes unrelated log, guide, health plan and checklist data', () => {
  assert.match(model, /snapshot\.routineDays/);
  assert.match(model, /snapshot\.trainingSelections/);
  assert.doesNotMatch(model, /dog_events|planned_health|content_open/i);
  assert.match(model, /row\.checklist_snapshot/);
  assert.match(model, /programById\.get\(row\.program_version_id\)/);
  assert.match(model, /program\?\.steps\.find/);
});
