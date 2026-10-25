import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';

const resolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const recovery = await import('../src/features/home/daily-activity-recovery.ts');
resolution.deregister();

const home = await readFile(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const model = await readFile(new URL('../src/features/home/daily-activity-model.ts', import.meta.url), 'utf8');
const item = await readFile(new URL('../src/components/ui/DailyActivityItem.tsx', import.meta.url), 'utf8');
const manager = await readFile(new URL('../src/features/home/DailyActivityManagerSheet.tsx', import.meta.url), 'utf8');
const iconPicker = await readFile(new URL('../src/features/checklists/ChecklistIconPicker.tsx', import.meta.url), 'utf8');
const checklistIconModel = await readFile(new URL('../src/features/checklists/checklist-icons.ts', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const appFlow = await readFile(new URL('../src/features/home/AppFlow.tsx', import.meta.url), 'utf8');
const dailyData = await readFile(new URL('../src/features/home/daily-activity-data.ts', import.meta.url), 'utf8');
const dailyChecklist = await readFile(new URL('../src/features/home/DailyChecklistScreen.tsx', import.meta.url), 'utf8');
const tabs = await readFile(new URL('../src/components/ui/Tabs.tsx', import.meta.url), 'utf8');
const routineIcons = await readFile(new URL('../src/features/home/daily-routine-checklist-icons.ts', import.meta.url), 'utf8');
const iconMigration = await readFile(new URL('../supabase/migrations/202610220001_daily_routine_checklist_icons.sql', import.meta.url), 'utf8');
const recoverySource = await readFile(new URL('../src/features/home/daily-activity-recovery.ts', import.meta.url), 'utf8');

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
  assert.match(homeVariant, /showRoutineIcon && icon/);
  assert.match(dailyChecklist, /showRoutineIcon=\{item\.kind === 'routine'\}/);
  assert.match(homeVariant, /homeTrainingStatusCell/);
  assert.match(homeVariant, /homeTrainingStatusChecked/);
  assert.match(item, /testID="daily-training-status-checkbox"/);
  assert.match(item, /homeTrainingStatus:[^{]*\{[^}]*width: tokens\.size\.homeCheckbox \+ tokens\.spacing\.sm,[^}]*height: tokens\.size\.homeCheckbox \+ tokens\.spacing\.sm,[^}]*borderRadius: tokens\.radius\.full/);
  assert.match(item, /name="checkmark" size=\{tokens\.size\.iconMd \+ tokens\.spacing\.xs\}/);
  assert.match(item, /testID="daily-training-status-checkmark"/);
  assert.match(workspace, /setRoutineDayCompletion\(client, row, itemId, completed\)/);
  assert.match(recoverySource, /Ingen ny bock visas/);
  assert.match(manager, /onRemoveRoutineFromDay/);
  assert.match(manager, /onRemoveTrainingFromDay/);
  assert.match(manager, /onCreateRoutine/);
  assert.match(manager, /onUpdateRoutine/);
  assert.match(manager, /onDeleteRoutine/);
  assert.match(manager, /<BottomSheet/);
  assert.match(manager, /editFocusedRoutineOnOpen/);
  assert.match(manager, /startEdit\(focusedRoutine, focusRoutineItemId\)/);
  assert.match(manager, /useState<RoutineDraft \| null>/);
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

test('routine checklist icons are selectable, saved in the model, and shown on Checklistor', () => {
  assert.match(manager, /<ChecklistIconPickerTrigger value=\{item\.icon \?\? null\}/);
  assert.match(manager, /<ChecklistIconPickerChoices value=\{item\.icon \?\? null\}/);
  assert.match(iconPicker, /accessibilityRole="radiogroup" accessibilityLabel=/);
  assert.doesNotMatch(iconPicker, /<Text/);
  assert.match(iconPicker, /styles\.choiceSelected/);
  assert.match(iconPicker, /name="checkmark-circle"/);
  assert.match(iconPicker, /accessibilityRole="radio" accessibilityLabel=\{CHECKLIST_ICON_LABELS\[icon\]\}/);
  assert.match(checklistIconModel, /export const CHECKLIST_ICONS = \[/);
  assert.match(manager, /sameChecklist[\s\S]*?item\.icon === right\[index\]\?\.icon/);
  assert.match(manager, /dailyRoutineChecklistDisplayIcon\(item\)/);
  assert.match(manager, /setIconPickerItemId\(focusItemId && checklist\.some\(\(item\) => item\.id === focusItemId\) \? focusItemId : null\)/);
  assert.match(manager, /startEdit\(focusedRoutine, focusRoutineItemId\)/);
  assert.match(dailyChecklist, /routineLabel=\{item\.routineLabel\}[\s\S]*?icon=\{item\.icon\} showRoutineIcon=\{item\.kind === 'routine'\}/);
  assert.match(dailyChecklist, /const icon = item\.icon \?\? 'list-outline';/);
  assert.match(routineIcons, /'water-outline'/);
  assert.match(iconMigration, /create or replace function private\.valid_daily_routine_checklist/);
  assert.match(iconMigration, /v_item ->> 'icon' not in/);
  assert.match(iconMigration, /'water-outline'/);
  const homeRoutineRow = home.slice(home.indexOf('return <DailyActivityItem key={item.id} variant="home" kind={item.kind}'), home.indexOf('onRetry={itemMutation'));
  assert.doesNotMatch(homeRoutineRow, /icon=\{item\.icon\}/, 'the compact Home rows remain icon-free');
});

test('opening a routine focuses its own editor and keeps manage-all as a named compact action', () => {
  assert.match(manager, /const focusedRoutineOnly = Boolean\(focusRoutineId\)/);
  assert.match(manager, /const visibleRoutines = upcomingRoutineOnly \|\| focusedRoutineOnly \? routines\.filter\(\(routine\) => routine\.id === focusRoutineId\) : routines/);
  assert.match(manager, /!upcomingRoutineOnly && !focusedRoutineOnly \? <View style=\{styles\.section\}>/);
  assert.match(dailyChecklist, /accessibilityLabel="Hantera rutiner och aktiviteter" onPress=\{\(\) => openManager\(\)\}/);
  const manageActionStart = dailyChecklist.indexOf('accessibilityLabel="Hantera rutiner och aktiviteter"');
  const manageActionEnd = dailyChecklist.indexOf('</MotionPressable>', manageActionStart);
  assert.ok(manageActionStart >= 0 && manageActionEnd > manageActionStart, 'the gear action remains present');
  assert.doesNotMatch(dailyChecklist.slice(manageActionStart, manageActionEnd), /<Text/, 'the compact gear action has no visible label');
  assert.match(dailyChecklist, /manageAction: \{ minWidth: tokens\.size\.touchMin, minHeight: tokens\.size\.touchMin/);
  assert.match(dailyChecklist, /<Tabs items=\{CHECKLIST_FILTERS\} active=\{filter\} variant="rev02-segmented" activeTone="home" scrollable accessibilityLabel="Filtrera checklistor"/);
  assert.match(tabs, /const homeGrid = homeSegmented && !scrollable/);
  assert.match(tabs, /scrollableTab: \{ flexGrow: 0, flexShrink: 0, flexBasis: 'auto', minWidth: tokens\.size\.touchMin/);
  assert.match(tabs, /scrollableLabel: \{ \.\.\.tokens\.typography\.smallCaption \}/);
  assert.match(tabs, /onContentSizeChange=\{scrollable \? \(\) => setScrollLayoutRevision/);
  assert.match(workspace, /confirmLabel="Lämna utan att spara" cancelLabel="Fortsätt redigera"/);
  assert.match(workspace, /Ändringarna i Hundprofilen är inte sparade\. Om du lämnar nu går de förlorade\./);
  assert.match(manager, /<Dialog visible=\{showDiscardConfirmation\} title="Kasta ändringar\?"/);
  assert.doesNotMatch(manager, /ChecklistIconPickerTrigger[\s\S]{0,300}popover/);
  const createForm = manager.slice(manager.indexOf('function CreateRoutineForm'), manager.indexOf('function RepeatRuleControls'));
  assert.doesNotMatch(createForm, /label="Avbryt"/);
  const editForm = manager.slice(manager.indexOf('function RoutineTemplateRow'), manager.indexOf('function ActionButton'));
  assert.doesNotMatch(editForm, /label="Avbryt"/);
});

test('routine write failures unlock the editor while unknown writes retain exact retry and conflicts require explicit replacement', () => {
  const mutation = workspace.slice(workspace.indexOf('async function runDailyMutation'), workspace.indexOf('function retryDailyMutation'));
  assert.match(mutation, /recoverDailyMutation\(outcome\.status, ownerScope, lifetime, key, operation,/);
  assert.match(workspace, /dailyMutationBlocksAccountDeletion\(dailyMutationInFlight\.current,[\s\S]*dailyMutationForOwner\(dailyMutationStore\.getSnapshot\(\)\.get\(currentDailyOwnerScope\)[\s\S]*currentDailyOwnerScope\)/);
  assert.match(workspace, /dailyMutationForOwner\(dailyMutationStore\.getSnapshot\(\)\.get\(currentDailyOwnerScope\)[\s\S]*runDailyMutation\(pending\.key, pending\.run, true, pending\)/);
  const lifetimeEffect = workspace.slice(workspace.indexOf('if (dailyLifetime.current && dailyLifetime.current !== currentDailyLifetime)'), workspace.indexOf('dailyLifetime.current = currentDailyLifetime'));
  assert.match(lifetimeEffect, /clearDailyMutationForLifetimeChange\(\)[\s\S]*setDailyMessage\(clearedMutation\.message\)/);
  assert.doesNotMatch(lifetimeEffect, /pendingDailyWrites\.current\.(?:clear|delete)/, 'view-scope changes clear feedback without discarding owner-scoped unresolved writes');
  assert.match(mutation, /dailyMutationOwnerGeneration = dailyMutationStore\.ownerGeneration\(ownerScope\)/);
  assert.match(mutation, /updatePendingDailyWrite\(ownerScope, inFlightMutation, dailyMutationOwnerGeneration\)[\s\S]*recoverDailyMutation\(outcome\.status, ownerScope, lifetime, key, operation,/);
  assert.match(mutation, /ownerStillCurrent = currentDailyOwnerScopeRef\.current === ownerScope[\s\S]*dailyMutationStore\.ownerGeneration\(ownerScope\) === dailyMutationOwnerGeneration/);
  assert.match(mutation, /if \(!mounted\.current \|\| !ownerStillCurrent \|\| !lifetimeStillCurrent\)[\s\S]*resolvedDailyMutation\(inFlightMutation, outcome\.status\)[\s\S]*updatePendingDailyWrite\(ownerScope, staleResolution, dailyMutationOwnerGeneration\)[\s\S]*setDailyMessageIsGlobal\(true\)/);
  assert.match(workspace, /useSyncExternalStore\([\s\S]*dailyMutationStore\.getSnapshot\(\)\.get\(currentDailyOwnerScope\)/);
  assert.match(recoverySource, /export const dailyMutationStore = createDailyMutationStore\(\)/);
  assert.match(recoverySource, /export const routineDraftStore = createRoutineDraftStore\(\)/);
  assert.match(workspace, /routineDraftStore\.get\(currentDailyOwnerScope, dog\.id, currentDailyLifetime\)/);
  assert.match(home, /routineRecovery=\{routineRecovery\} onRoutineRecoveryChange=\{onRoutineRecoveryChange\}/);
  assert.match(dailyChecklist, /routineRecovery=\{routineRecovery\} onRoutineRecoveryChange=\{onRoutineRecoveryChange\}/);
  assert.match(appFlow, /return <ProductWorkspace[\s\S]*key=\{activeDog\.id\}/);
  assert.match(workspace, /showDailyRecoveryBanner[\s\S]*<MessageCard tone=\{dailyRecoveryBannerError \? 'error' : 'neutral'\}>\{dailyRecoveryBannerMessage\}<\/MessageCard>[\s\S]*<PrimaryButton title=\{dailyMutationIsBusy \? 'Kontrollerar ändringen…' : 'Kontrollera samma ändring igen'\}[\s\S]*onPress=\{retryDailyMutation\}/);
  assert.match(workspace, /dailyMutationIsBusy = Boolean\(dailyBusyKey\) \|\| pendingDailyWriteForOwner\?\.phase === 'in-flight'/);
  assert.match(workspace, /pendingDailyWriteForOwner\.phase === 'in-flight'\) && !dailyBusyKey/);
  assert.match(workspace, /if \(result\.localSessionCleared && ownerId\) \{\s*dailyMutationStore\.clearOwner\(ownerId\)/);
  assert.match(workspace, /serverConfirmed = true;[\s\S]{0,180}dailyMutationStore\.clearOwner\(ownerId\)/);
  assert.match(recoverySource, /ownerGeneration\(ownerScope: string\) \{[\s\S]{0,80}return ownerGenerations\.get\(ownerScope\)/);
  assert.match(recoverySource, /update\(ownerScope: string, pending: PendingDailyMutation \| null, expectedOwnerGeneration\?: number\)[\s\S]*expectedOwnerGeneration !== \(ownerGenerations\.get\(ownerScope\) \?\? 0\)/);
  assert.match(recoverySource, /clearOwner\(ownerScope: string\) \{[\s\S]{0,100}ownerGenerations\.set\(ownerScope, \(ownerGenerations\.get\(ownerScope\) \?\? 0\) \+ 1\)/);
  assert.doesNotMatch(mutation, /Rutinen har ändrats sedan du öppnade den/);

  assert.match(manager, /\[routineConflict, setRoutineConflictState\] = useState<RoutineDraftConflict \| null>/);
  assert.match(manager, /routineConflictForDraft\(draft, routineConflict, dailyScopeKey \?\? ''\)/);
  assert.match(manager, /routineDraftAfterWrite\(recoveryState\.current\.draft, submissionId, result\?\.status\)/);
  assert.match(manager, /routineEditDraftFromConflict\(draft, routineConflict, dailyScopeKey \?\? ''/);
  assert.match(manager, /Ersätt utkastet med senaste versionen/);
  assert.match(manager, /const showMutationMessage = Boolean\(conflictForDraft\) \|\| Boolean\(mutationMessage\)/);
  assert.match(manager, /const visibleMutationMessage = conflictForDraft[\s\S]*routineConflictMessage/);
  assert.match(manager, /\{conflictForDraft \? <Button[\s\S]*Ersätt utkastet med senaste versionen/);
  assert.match(manager, /<Button variant="tertiary" label="Ersätt utkastet med senaste versionen"[\s\S]*onPress=\{replaceDraftWithLatestRoutine\}/);
  assert.match(manager, /routineEditDraftFromConflict\(draft, routineConflict, dailyScopeKey \?\? ''/);
  assert.match(manager, /fieldsDisabled=\{unresolvedMutation \|\| savingDraft \|\| showDiscardConfirmation \|\| Boolean\(conflictForDraft\)\}/);
  assert.match(manager, /savingDraft \|\| conflictForDraft\) return;/);
  assert.match(recoverySource, /sourceRoutine: latest/);
  assert.match(manager, /sourceRoutine: routine/);
  assert.match(recoverySource, /conflict\.scopeKey !== scopeKey/);
  assert.match(dailyData, /result\.data\.dog_id !== dogId \|\| result\.data\.id !== id/);
});

test('daily recovery transitions preserve the routine draft and exact unknown operation', async () => {
  const mutationSource = workspace.slice(workspace.indexOf('async function runDailyMutation'), workspace.indexOf('function retryDailyMutation'));
  const conflictBranch = mutationSource.indexOf("outcome.status === 'conflict' && key.startsWith('update-routine:')");
  const conflictStoreWrite = mutationSource.indexOf('routineDraftStore.update(ownerScope, origin.dogId, lifetime, draft, conflict', conflictBranch);
  const conflictRefresh = mutationSource.indexOf('void reloadDailyActivity(true, true)', conflictStoreWrite);
  assert.ok(conflictBranch >= 0 && conflictStoreWrite > conflictBranch && conflictRefresh > conflictStoreWrite,
    'the latest routine conflict is persisted before its background refresh can finish');
  assert.match(mutationSource.slice(conflictStoreWrite, conflictRefresh), /routineDraftStore\.update\(ownerScope, origin\.dogId, lifetime, draft, conflict, routineDraftOwnerGeneration\)/);
  assert.match(manager, /useEffect\(\(\) => \{\s*mounted\.current = true;\s*return \(\) => \{ mounted\.current = false; \};\s*\}, \[\]\)/);
  assert.match(manager, /const result = submittedDraft\.mode === 'create'[\s\S]*?if \(!mounted\.current\) return;\s*setDraft\(routineDraftAfterWrite/);
  assert.match(manager, /finally \{\s*if \(mounted\.current\) setSavingDraft\(false\);\s*\}/);

  const operationCalls = [];
  const operation = async () => { operationCalls.push('retry'); return { status: 'unknown' }; };
  const ownerScope = 'account-1';
  const lifetime = 'account:dog:day';
  const failed = recovery.recoverDailyMutation('failed', ownerScope, lifetime, 'update:routine', operation);
  assert.equal(failed.pendingRetry, null);
  assert.equal(failed.message, 'Ändringen sparades inte. Försök igen.');
  assert.equal(failed.error, true);

  const unknown = recovery.recoverDailyMutation('unknown', ownerScope, lifetime, 'update:routine', operation);
  assert.equal(unknown.pendingRetry.phase, 'unknown');
  assert.strictEqual(unknown.pendingRetry.run, operation);
  assert.strictEqual(recovery.dailyMutationRetryForLifetime(unknown.pendingRetry, lifetime), unknown.pendingRetry);
  assert.equal(recovery.dailyMutationRetryForLifetime(unknown.pendingRetry, 'other-scope'), null);
  await recovery.dailyMutationRetryForLifetime(unknown.pendingRetry, lifetime).run();
  assert.deepEqual(operationCalls, ['retry']);

  const staleDraft = {
    mode: 'edit', submissionId: 'submission-1', routineId: 'routine-1', baseRevision: 1,
    sourceRoutine: { id: 'routine-1', dog_id: 'dog-1', label: 'Morgon', checklist_revision: 1, legacy_single_item: false,
      checklist: [{ id: 'item-1', label: 'Kissa', icon: 'water-outline' }, { id: 'item-2', label: 'Promenad', icon: 'walk-outline' }],
      repeat_unit: null, repeat_interval: null, repeat_weekdays: null, repeat_anchor_date: null }, initialLabel: 'Morgon', initialChecklist: [
      { id: 'item-1', label: 'Kissa', icon: 'water-outline' }, { id: 'item-2', label: 'Promenad', icon: 'walk-outline' },
    ], initialRepeat: { repeat_unit: null, repeat_interval: null, repeat_weekdays: null }, anchorDate: '2026-10-21', newAnchorDate: '2026-10-21',
    label: 'Morgon uppdaterad', checklist: [
      { id: 'item-2', label: 'Promenad', icon: 'walk-outline' }, { id: 'item-1', label: 'Kissa', icon: 'heart-outline' },
    ], repeat: { repeat_unit: null, repeat_interval: null, repeat_weekdays: null },
  };
  assert.strictEqual(recovery.routineDraftAfterWrite(staleDraft, staleDraft.submissionId, 'failed'), staleDraft);
  assert.strictEqual(recovery.routineDraftAfterWrite(staleDraft, staleDraft.submissionId, 'unknown'), staleDraft);
  assert.deepEqual(staleDraft.checklist.map(({ label, icon }) => [label, icon]), [
    ['Promenad', 'walk-outline'], ['Kissa', 'heart-outline'],
  ]);

  const latest = {
    id: 'routine-1', dog_id: 'dog-1', label: 'Morgon senast', checklist_revision: 3,
    checklist: [{ id: 'item-3', label: 'Drick', icon: 'water-outline' }], repeat_unit: 'week',
    repeat_interval: 1, repeat_weekdays: [1], repeat_anchor_date: '2026-10-19',
  };
  const conflict = recovery.routineConflictAfterWrite(staleDraft, { status: 'conflict', value: latest }, lifetime);
  assert.strictEqual(recovery.routineDraftAfterWrite(staleDraft, staleDraft.submissionId, 'conflict'), staleDraft);
  assert.strictEqual(recovery.routineConflictForDraft(staleDraft, conflict, lifetime), conflict);
  assert.equal(recovery.routineConflictForDraft(staleDraft, conflict, 'other-scope'), null);
  assert.equal(recovery.routineConflictMessage, 'Rutinen har ändrats sedan du öppnade den. Ladda den senaste versionen för att fortsätta. Dina osparade ändringar ersätts.');

  const routineDrafts = recovery.createRoutineDraftStore();
  routineDrafts.update(ownerScope, 'dog-1', lifetime, staleDraft, conflict);
  let finishRefresh;
  let refreshFinished = false;
  const backgroundRefresh = new Promise((resolve) => {
    finishRefresh = () => { refreshFinished = true; resolve(); };
  });
  void backgroundRefresh;
  assert.equal(routineDrafts.get(ownerScope, 'dog-2', lifetime), null, 'dog B cannot hydrate dog A’s draft or conflict');
  const restored = routineDrafts.get(ownerScope, 'dog-1', lifetime);
  assert.equal(restored.draft.label, 'Morgon uppdaterad');
  assert.equal(restored.draft.submissionId, 'submission-1');
  assert.deepEqual(restored.draft.checklist.map(({ id, icon }) => [id, icon]), [
    ['item-2', 'walk-outline'], ['item-1', 'heart-outline'],
  ], 'the exact text order and selected icons survive the dog A → B → A remount');
  assert.strictEqual(recovery.routineConflictForDraft(restored.draft, restored.conflict, lifetime).latest, restored.conflict.latest);
  restored.draft.checklist[0].label = 'mutation outside the store';
  assert.equal(routineDrafts.get(ownerScope, 'dog-1', lifetime).draft.checklist[0].label, 'Promenad',
    'restoring a draft returns a deep copy rather than a mutable store reference');

  const replacement = recovery.routineEditDraftFromConflict(staleDraft, conflict, lifetime, 'submission-2', '2026-10-22');
  assert.equal(replacement.submissionId, 'submission-2');
  assert.equal(replacement.routineId, latest.id);
  assert.equal(replacement.baseRevision, 3);
  assert.strictEqual(replacement.sourceRoutine, latest);
  assert.deepEqual(replacement.checklist, latest.checklist);
  assert.deepEqual(replacement.repeat, { repeat_unit: 'week', repeat_interval: 1, repeat_weekdays: [1] });
  assert.strictEqual(staleDraft.checklist[1].icon, 'heart-outline', 'the stale draft remains unchanged until the replacement action is explicitly invoked');
  routineDrafts.update(ownerScope, 'dog-1', lifetime, replacement, null);
  assert.equal(routineDrafts.get(ownerScope, 'dog-1', lifetime).draft.submissionId, 'submission-2', 'conflict replacement survives the remount only after explicit confirmation');
  assert.equal(routineDrafts.get(ownerScope, 'dog-1', lifetime).conflict, null);
  assert.equal(refreshFinished, false, 'the user can act on the stored conflict without waiting for its refresh');
  finishRefresh();
  await backgroundRefresh;
  assert.equal(routineDrafts.get(ownerScope, 'dog-1', lifetime).draft.submissionId, 'submission-2', 'a late refresh cannot overwrite the replacement draft');
});

test('saved routine templates keep day-selection failure copy and exact retry metadata', () => {
  const copy = recovery.createdRoutineDaySelectionRecoveryCopy;
  const ownerScope = 'account-1';
  const lifetime = 'account-1:dog-1:2026-10-24';
  const operation = async () => ({ status: 'unknown' });
  const origin = { dogId: 'dog-1', dogName: 'Luna', actionLabel: 'Lägga till rutin på Hemskärmen' };

  const failed = recovery.recoverDailyMutation('failed', ownerScope, lifetime, 'select-routine:routine-1', operation, origin, copy);
  assert.equal(failed.message, copy.failedMessage);
  assert.equal(failed.error, true);

  const unknown = recovery.recoverDailyMutation('unknown', ownerScope, lifetime, 'select-routine:routine-1', operation, origin, copy);
  assert.equal(unknown.message, copy.unknownMessage);
  assert.strictEqual(unknown.pendingRetry.run, operation);
  assert.strictEqual(unknown.pendingRetry.recoveryCopy, copy);

  const retried = recovery.recoverDailyMutation('unknown', ownerScope, lifetime, unknown.pendingRetry.key,
    unknown.pendingRetry.run, unknown.pendingRetry, unknown.pendingRetry.recoveryCopy);
  assert.equal(retried.message, copy.unknownMessage);
  assert.strictEqual(retried.pendingRetry.run, operation);
  assert.strictEqual(retried.pendingRetry.recoveryCopy, copy);
});

test('daily recovery clears write locks only after a definitive result and guards account deletion', () => {
  const operation = async () => ({ status: 'failed' });
  const ownerScope = 'account-1';
  const otherOwnerScope = 'account-2';
  const lifetime = 'account:dog:day';
  const unknown = recovery.recoverDailyMutation('unknown', ownerScope, lifetime, 'update:routine', operation);
  const failed = recovery.recoverDailyMutation('failed', ownerScope, lifetime, 'update:routine', operation);
  const conflict = recovery.recoverDailyMutation('conflict', ownerScope, lifetime, 'update:routine', operation);
  assert.equal(recovery.dailyMutationBlocksAccountDeletion(true, null, ownerScope), true, 'an in-flight write blocks deletion');
  assert.equal(recovery.dailyMutationBlocksAccountDeletion(false, unknown.pendingRetry, ownerScope), true, 'an unknown write blocks deletion while exact retry remains pending');
  assert.equal(recovery.dailyMutationBlocksAccountDeletion(true, conflict.pendingRetry, ownerScope), true, 'conflict reconciliation remains locked during reload');
  assert.equal(recovery.dailyMutationBlocksAccountDeletion(false, failed.pendingRetry, ownerScope), false, 'definitive failure releases the daily-write gate');
  assert.equal(recovery.dailyMutationBlocksAccountDeletion(false, conflict.pendingRetry, ownerScope), false, 'readback-resolved conflict releases the gate even while the local stale draft stays visible');
  const changedLifetime = recovery.clearDailyMutationForLifetimeChange();
  assert.equal(changedLifetime.message, '');
  assert.equal(changedLifetime.error, false);
  const scopedPending = recovery.dailyMutationForOwner(unknown.pendingRetry, ownerScope);
  assert.strictEqual(scopedPending, unknown.pendingRetry, 'a dog/day view change retains the unresolved write for the same account');
  assert.equal(recovery.dailyMutationRetryForLifetime(scopedPending, 'account:other-dog:other-day'), null, 'the old-scope retry does not appear in another day');
  assert.equal(recovery.dailyMutationBlocksAccountDeletion(false, scopedPending, ownerScope), true, 'the same owner remains blocked from account deletion across dog/day changes');
  assert.equal(recovery.dailyMutationForOwner(scopedPending, otherOwnerScope), null, 'an unrelated signed-in owner cannot see the previous owner’s write');
  assert.equal(recovery.dailyMutationBlocksAccountDeletion(false, scopedPending, otherOwnerScope), false, 'another owner is not blocked by this unresolved write');
  assert.equal(recovery.canStartDailyMutation(scopedPending, ownerScope), false, 'dog B cannot start or overwrite a daily write while dog A is unknown');
  assert.equal(recovery.canStartDailyMutation(scopedPending, otherOwnerScope), true, 'another authenticated owner has an independent write scope');
  const resolved = recovery.resolvedDailyMutation({ ...scopedPending, phase: 'in-flight', dogId: 'dog-1', dogName: 'Luna', actionLabel: 'Ändra rutin' }, 'conflict');
  assert.equal(recovery.dailyMutationBlocksAccountDeletion(false, resolved, ownerScope), false, 'a readback-resolved conflict does not block account deletion');
  assert.equal(resolved.notice.error, true);
  assert.match(resolved.notice.message, /Ändra rutin för Luna/);
  assert.equal(Object.hasOwn(resolved, 'run'), false, 'resolved feedback does not retain the retry closure or its captured routine payload');
  assert.deepEqual(Object.keys(resolved).sort(), ['notice', 'ownerScope', 'phase'], 'resolved feedback retains only its owner and minimal display notice');
  assert.equal(recovery.canStartDailyMutation(resolved, ownerScope), true, 'a resolved notice can be dismissed or replaced by a new write');
  assert.equal(resolved.run, undefined, 'resolved feedback cannot be replayed');
  const routineDrafts = recovery.createRoutineDraftStore();
  const generation = routineDrafts.ownerGeneration(ownerScope);
  routineDrafts.update(ownerScope, 'dog-1', lifetime, { mode: 'create', submissionId: 'draft', routineId: null, baseRevision: null,
    sourceRoutine: null, initialLabel: '', initialChecklist: [{ id: 'one', label: '' }], initialRepeat: { repeat_unit: null, repeat_interval: null, repeat_weekdays: null },
    anchorDate: '2026-10-22', newAnchorDate: '2026-10-22', label: '', checklist: [{ id: 'one', label: '' }], repeat: { repeat_unit: null, repeat_interval: null, repeat_weekdays: null } }, null, generation);
  routineDrafts.clearOwner(ownerScope);
  assert.equal(routineDrafts.get(ownerScope, 'dog-1', lifetime), null, 'account cleanup removes owner-scoped draft recovery');
  const lateDraft = { mode: 'create', submissionId: 'late', routineId: null, baseRevision: null, sourceRoutine: null,
    initialLabel: '', initialChecklist: [{ id: 'late-item', label: '' }], initialRepeat: { repeat_unit: null, repeat_interval: null, repeat_weekdays: null },
    anchorDate: '2026-10-22', newAnchorDate: '2026-10-22', label: 'late', checklist: [{ id: 'late-item', label: 'late' }],
    repeat: { repeat_unit: null, repeat_interval: null, repeat_weekdays: null } };
  routineDrafts.update(ownerScope, 'dog-1', lifetime, lateDraft, null, generation);
  assert.equal(routineDrafts.get(ownerScope, 'dog-1', lifetime), null, 'a completion from the signed-out generation cannot repopulate the cleared draft');
});

test('unknown writes survive dog-keyed workspace remounts and remain owner-scoped', () => {
  const store = recovery.createDailyMutationStore();
  const ownerScope = 'account-remount';
  const otherOwnerScope = 'other-account';
  const lifetime = `${ownerScope}:dog-a:today`;
  let calls = 0;
  const operation = async () => { calls += 1; return { status: 'unknown' }; };
  const active = { ownerScope, lifetime, key: 'update:routine-a', run: operation, phase: 'in-flight' };
  const firstGeneration = store.ownerGeneration(ownerScope);
  store.update(ownerScope, active, firstGeneration);
  store.clearOwner(ownerScope);
  store.update(ownerScope, active, firstGeneration);
  assert.equal(store.getSnapshot().has(ownerScope), false, 'a mutation callback from the cleared sign-out generation cannot restore its pending write');
  assert.ok(store.ownerGeneration(ownerScope) > firstGeneration, 'owner cleanup advances the generation fence');
  store.update(ownerScope, active);

  const dogAUnmounted = store.getSnapshot();
  const dogBWorkspaceSnapshot = store.getSnapshot();
  assert.strictEqual(dogBWorkspaceSnapshot.get(ownerScope), active, 'switching dogs keeps the in-flight barrier above the keyed workspace');
  assert.equal(recovery.dailyMutationBlocksAccountDeletion(false, dogBWorkspaceSnapshot.get(ownerScope), ownerScope), true);

  const unknown = recovery.recoverDailyMutation('unknown', ownerScope, lifetime, 'update:routine-a', operation);
  store.update(ownerScope, unknown.pendingRetry);
  const dogARemountedSnapshot = store.getSnapshot();
  const pending = dogARemountedSnapshot.get(ownerScope);
  assert.notStrictEqual(dogARemountedSnapshot, dogAUnmounted, 'store publishes a new immutable snapshot to remounted workspaces');
  assert.strictEqual(pending.run, operation, 'the remounted workspace receives the exact original retry closure');
  assert.equal(pending.lifetime, lifetime, 'retry keeps the original dog/day lifetime');
  assert.equal(pending.phase, 'unknown');
  assert.equal(recovery.dailyMutationBlocksAccountDeletion(false, pending, ownerScope), true);
  assert.equal(recovery.dailyMutationBlocksAccountDeletion(false, pending, otherOwnerScope), false);

  store.update(ownerScope, null);
  assert.equal(recovery.dailyMutationBlocksAccountDeletion(false, store.getSnapshot().get(ownerScope) ?? null, ownerScope), false);
  assert.equal(calls, 0, 'storing the retry does not execute it a second time');
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
  assert.match(screen, /Håll inne på en rutinpunkt för att öppna redigeringen\./);
  assert.match(screen, /accessibilityHint=\{item\.kind === 'routine'[\s\S]*?Håll inne på en rutinpunkt för att öppna redigeringen\./);
  assert.match(screen, /onLongPress=\{item\.kind === 'routine'[\s\S]*?openManager\(routineDay\.routine_id, true, item\.routineItemId \?\? null\)/);
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
