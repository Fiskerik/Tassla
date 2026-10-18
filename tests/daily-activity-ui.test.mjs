import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const home = await readFile(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const model = await readFile(new URL('../src/features/home/daily-activity-model.ts', import.meta.url), 'utf8');
const item = await readFile(new URL('../src/components/ui/DailyActivityItem.tsx', import.meta.url), 'utf8');
const manager = await readFile(new URL('../src/features/home/DailyActivityManagerSheet.tsx', import.meta.url), 'utf8');
const screen = await readFile(new URL('../src/features/home/DailyChecklistScreen.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const verifier = await readFile(new URL('../tools/visual-check/verify.py', import.meta.url), 'utf8');

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
  assert.match(home, /onOpenTrainingTarget\?\.\(item\.programId, item\.stepId, item\.id\)/);
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

test('Home opens only the exact current training target and returns to its origin', () => {
  assert.match(home, /item\.availability === 'available' && item\.programId && item\.stepId/);
  assert.match(workspace, /trainingEntry\.returnPage/);
  assert.match(workspace, /activity\?\.availability === 'available'/);
  assert.match(workspace, /activity\.programId === programVersionId && activity\.stepId === stepId/);
  assert.match(workspace, /returnPage: 'home'/);
  assert.match(workspace, /returnPage: 'checklist'/);
  assert.match(workspace, /backLabel=\{backLabel\} onBackToChecklist=\{backToOrigin\}/);
  assert.match(home, /trainingTargetFeedback\?\.activityId === item\.id/);
  assert.match(workspace, /Uppgiften har ändrats\. Öppna dagens checklista för att se det aktuella valet\./);
});

test('training row presents the step title and keeps full program title in detail data', () => {
  assert.match(model, /label: step\.title/);
  assert.match(model, /programTitle: program\.title/);
  assert.match(manager, /item\.programTitle/);
});

test('an unavailable daily training choice stays unknown and can be removed without revealing denied program content', () => {
  assert.match(model, /title: 'Valt träningssteg kunde inte hämtas'/);
  assert.match(model, /availability: !available \? 'unavailable'/);
  assert.match(manager, /Ta bort idag/);
  assert.match(manager, /onRemoveTrainingFromDay\?\.\(item\.trainingSelection\)/);
  assert.match(workspace, /removeTrainingSelection\(client, row\)/);
  assert.match(workspace, /Uppgiften har ändrats\. Öppna dagens checklista/);
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
  assert.match(screen, /items=\{showUpcomingTab \? \['Idag', 'Denna vecka', 'Alla', 'Kommande'\] : \['Idag', 'Denna vecka', 'Alla'\]\}/);
  assert.match(screen, /<AppBar mode="Back" variant="compact" title="Checklista" actionLabel="Tillbaka till Hem" onAction=\{onBack\} \/>/);
  assert.match(screen, /scopeContext: \{[^}]*textAlign: 'center'/);
  assert.doesNotMatch(screen, /<PageHeading title="Checklista"/);
  assert.match(screen, /Kommande/);
  assert.match(screen, /Denna vecka/);
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

test('weekly view keeps all seven dates, current-day authority and historical rows read-only', () => {
  const weeklyStart = screen.indexOf("{activeTab === 'Denna vecka' ? <View style={styles.weekView}>");
  const weeklyEnd = screen.indexOf("{activeTab === 'Alla' && state === 'ready' && templateEntries.length === 0", weeklyStart);
  const weeklyView = screen.slice(weeklyStart, weeklyEnd);
  assert.match(screen, /weekDateKeys\.map/);
  assert.match(screen, /accessibilityState=\{\{ selected \}\}/);
  assert.match(screen, /weekSelectedDateKey === weekCurrentDateKey/);
  assert.match(screen, /Ingen sparad dagslista/);
  assert.match(screen, /Veckans rådata används inte för idag/);
  assert.match(model, /Tidszon skiljer sig/);
  assert.match(weeklyView, /accessibilityRole=\{canOpen \? undefined : 'summary'\}/);
  assert.match(weeklyView, /accessibilityRole="button"/);
  assert.match(weeklyView, /canOpen = Boolean\(row\.openTarget && weekSelectedDateKey === weekCurrentDateKey\)/);
  assert.match(weeklyView, /row\.programTitle \? <Text style=\{styles\.status\}>\{row\.programTitle\}<\/Text>/);
  assert.doesNotMatch(weeklyView, /onSetRoutineCompletion|onRemoveRoutineFromDay|onAddRoutineToDay/);
  assert.match(workspace, /fetchWeeklyActivitySnapshot\(client, dog\.id, dailyWeekStart, controller\.signal\)/);
  assert.match(workspace, /const responseIsCurrent = \(\) => isWeeklyActivityResponseCurrent/);
  assert.match(workspace, /weeklyActivityLifetimeKey\(\{ ownerId: session\?\.user\.id/);
  assert.match(workspace, /const weeklyRequestScope = JSON\.stringify\(\[weeklyLifetime, page, weeklyRetryToken\]\)/);
  assert.match(workspace, /setWeeklySnapshotLifetime\(weeklyLifetime\)/);
  assert.match(workspace, /weeklySnapshotLifetime === weeklyLifetime/);
  assert.match(workspace, /weeklyStateLifetime === weeklyRequestScope/);
  assert.match(workspace, /isWeeklyActivityResponseCurrent\(/);
  assert.match(workspace, /dailySnapshotLifetime === currentDailyLifetime && dailyLifetime\.current === currentDailyLifetime/);
  assert.match(workspace, /returnPage: 'week'/);
  assert.match(workspace, /Tillbaka till veckans dag/);
  assert.match(workspace, /weekDateKeys=\{dailyWeekDates\}/);
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
  assert.match(workspace, /key=\{checklistUiScopeKey\} dogName/);
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

test('R3c routine-template refresh has one owner per route, covers confirmed retries, and fences scope lifetime', () => {
  const mutationStart = workspace.indexOf('async function runDailyMutation<');
  const mutationEnd = workspace.indexOf('\n  function retryDailyMutation', mutationStart);
  const mutation = workspace.slice(mutationStart, mutationEnd);
  assert.notEqual(mutationStart, -1, 'ProductWorkspace mutation handler must remain inspectable');
  assert.notEqual(mutationEnd, -1, 'mutation block must have a stable end marker');
  assert.match(mutation, /const upcomingRoutineScopeAtMutation = upcomingScopeKey/);
  assert.match(mutation, /const upcomingRoutineScopeGenerationAtMutation = upcomingScopeGenerationForRender/);
  assert.ok(mutation.includes('const isRoutineTemplateMutation = /^(create|update|delete)-routine:/.test(key);'));

  const ownerMatch = mutation.match(/const parentOwnsRoutineTemplateRefresh = ([^;]+);/);
  assert.ok(ownerMatch, 'parent refresh ownership must be explicit');
  const parentOwnsRefresh = new Function('isRoutineTemplateMutation', 'origin', 'retry', `return ${ownerMatch[1]};`);
  assert.equal(parentOwnsRefresh(true, 'home', false), true, 'Home parent owns initial saved writes');
  assert.equal(parentOwnsRefresh(true, 'home', true), true, 'Home parent owns saved retries');
  assert.equal(parentOwnsRefresh(true, 'all', false), false, 'Checklist wrapper owns initial saved writes');
  assert.equal(parentOwnsRefresh(true, 'all', true), true, 'parent owns a confirmed Checklist retry');
  assert.equal(parentOwnsRefresh(false, 'all', true), false, 'unrelated writes never refresh upcoming routines');

  const savedStart = mutation.indexOf("if (outcome.status === 'saved')");
  const unknownStart = mutation.indexOf("} else if (outcome.status === 'unknown')", savedStart);
  const saved = mutation.slice(savedStart, unknownStart);
  const unresolved = mutation.slice(unknownStart);
  assert.ok(savedStart >= 0 && unknownStart > savedStart);
  const dailyReload = saved.indexOf('await reloadDailyActivity(true, true)');
  const upcomingRefresh = saved.indexOf('if (parentOwnsRoutineTemplateRefresh && mounted.current');
  const dailyReloadFailureFeedback = saved.indexOf('if (!refreshed && mounted.current');
  assert.ok(dailyReload >= 0 && upcomingRefresh > dailyReload, 'parent refresh follows the existing awaited daily reload');
  assert.ok(dailyReloadFailureFeedback > upcomingRefresh, 'same-scope upcoming refresh also runs when daily reload returns false');
  assert.match(saved, /dailyLifetime\.current === lifetime/);
  assert.match(saved, /currentSelectionKeyRef\.current === currentSelectionKey/);
  assert.match(saved, /upcomingScopeRef\.current === upcomingRoutineScopeAtMutation/);
  assert.match(saved, /upcomingScopeGeneration\.current === upcomingRoutineScopeGenerationAtMutation/);
  assert.match(saved, /setUpcomingRoutineSnapshot\(/);
  assert.match(saved, /setUpcomingRoutineRetryToken\(\(token\) => token \+ 1\)/);
  assert.doesNotMatch(saved, /setUpcomingHealthRetryToken/);
  assert.doesNotMatch(unresolved, /setUpcomingRoutineSnapshot|setUpcomingRoutineRetryToken/,
    'failed and unknown outcomes must not trigger an upcoming refresh');

  const savedWrappers = [...screen.matchAll(/if \(result\?\.status === 'saved'\) onRetryUpcomingRoutines\(\)/g)];
  assert.equal(savedWrappers.length, 3, 'Checklist create/update/delete wrappers each refresh once only after saved');
  const callbackStart = workspace.indexOf('onRetryUpcomingRoutines={() => {');
  const callbackEnd = workspace.indexOf('}}', callbackStart);
  const callback = workspace.slice(callbackStart, callbackEnd);
  assert.match(callback, /mounted\.current && upcomingScopeRef\.current === upcomingScopeKey/);
  assert.match(callback, /upcomingScopeGeneration\.current === upcomingScopeGenerationForRender/);
  assert.match(callback, /if \(!callbackIsCurrent\) return/);

  const renderGenerationStart = workspace.indexOf('const [upcomingScopeGenerationForRender, setUpcomingScopeGenerationForRender] = useState(0);');
  const upcomingScopeStart = workspace.indexOf('const upcomingScopeKey = JSON.stringify(');
  const scopeUnavailableStart = workspace.indexOf('const upcomingScopeUnavailable', upcomingScopeStart);
  assert.ok(renderGenerationStart > upcomingScopeStart && scopeUnavailableStart > renderGenerationStart, 'render generation is sourced from React state');
  assert.doesNotMatch(workspace.slice(upcomingScopeStart, scopeUnavailableStart), /\.current/, 'render scope derivation must not read refs');

  const scopeEffectStart = workspace.indexOf('useLayoutEffect(() => {\n    if (upcomingScopeRef.current === upcomingScopeKey) return;');
  const scopeEffectEnd = workspace.indexOf('}, [upcomingScopeKey]);', scopeEffectStart);
  assert.ok(scopeEffectStart >= 0 && scopeEffectEnd > scopeEffectStart, 'scope generation effect must have a stable boundary');
  const scopeEffectBody = workspace.slice(scopeEffectStart + 'useLayoutEffect(() => {'.length, scopeEffectEnd);
  assert.match(scopeEffectBody, /upcomingScopeRef\.current = upcomingScopeKey/);
  assert.match(scopeEffectBody, /upcomingScopeGeneration\.current \+= 1/);
  assert.match(scopeEffectBody, /setUpcomingScopeGenerationForRender\(\(generation\) => generation \+ 1\)/);
  const commitScope = new Function('upcomingScopeKey', 'upcomingScopeRef', 'upcomingScopeGeneration', 'upcomingPlanReadGeneration', 'setUpcomingScopeGenerationForRender', scopeEffectBody);
  const scopeRef = { current: 'A' }; const scopeGeneration = { current: 0 }; const planGeneration = { current: 0 }; let renderGeneration = 0;
  const setRenderGeneration = (update) => { renderGeneration = update(renderGeneration); };
  const commit = (key) => commitScope(key, scopeRef, scopeGeneration, planGeneration, setRenderGeneration);
  commit('A');
  assert.equal(scopeGeneration.current, 0, 'initial scope keeps its initial generation');
  assert.equal(renderGeneration, 0, 'initial rendered generation matches the scope ref');
  commit('A');
  assert.equal(renderGeneration, 0, 'unchanged scope and StrictMode replay are idempotent');
  commit('B');
  assert.equal(scopeGeneration.current, 1, 'A→B advances the monotonic ref once');
  assert.equal(renderGeneration, 1, 'A→B advances captured state with the ref');
  commit('A');
  assert.equal(scopeGeneration.current, 2, 'A→B→A has a new lifetime even though its key is reused');
  assert.equal(renderGeneration, 2, 'A→B→A captured state remains synchronized with the ref');

  const isTemplateMutation = /^(create|update|delete)-routine:/;
  for (const key of ['create-routine:one', 'update-routine:one', 'delete-routine:one']) {
    assert.equal(isTemplateMutation.test(key), true, `${key} is a routine-template write`);
  }
  for (const key of ['select-routine:one', 'remove-routine:one', 'complete-routine:one:item',
    'select-training:program:step', 'remove-training:selection']) {
    assert.equal(isTemplateMutation.test(key), false, `${key} must not refresh the upcoming routine source`);
  }
});

test('R3c visual verifier validates a local origin before launch and blocks every other origin', () => {
  const validation = verifier.indexOf("if scope=='r3c-upcoming':");
  const launch = verifier.indexOf('with sync_playwright() as p:');
  assert.ok(validation >= 0 && launch > validation, 'R3c URL validation runs before Playwright can launch');
  const preflight = verifier.slice(validation, launch);
  assert.match(preflight, /parsed\.scheme!='http'/);
  assert.match(preflight, /127\.0\.0\.1','localhost','::1/);
  assert.match(preflight, /port is None/);
  assert.match(preflight, /parsed\.username is not None/);
  assert.match(preflight, /parsed\.password is not None/);
  assert.match(preflight, /parsed\.query or parsed\.fragment/);

  const route = verifier.indexOf("page.route('**/*',guard_r3c_request)");
  const firstNavigation = verifier.indexOf("page.goto(f'{ui_base}?screen={screen}{extra}')");
  assert.ok(route >= 0 && firstNavigation > route, 'exact-origin request guard is installed before the first navigation');
  const guardedRoute = verifier.slice(verifier.indexOf('def guard_r3c_request'), firstNavigation);
  assert.match(guardedRoute, /r3c_origin_for_request\(request_url\)==r3c_allowed_origin/);
  assert.match(guardedRoute, /errors\.append\(/);
  assert.match(guardedRoute, /route\.abort\(\)/);
  assert.match(guardedRoute, /route\.continue_\(\)/);
  assert.match(verifier, /blockedNetworkRequests':\[\]/);
  const normalizedVerifier = verifier.replace(/\r\n/g, '\n');
  const largeTextStart = normalizedVerifier.indexOf("open_upcoming('ready')\n  scaled=");
  const largeTextEnd = normalizedVerifier.indexOf("passed('140% text proxy scrolls active Kommande fully", largeTextStart);
  const largeTextScenario = normalizedVerifier.slice(largeTextStart, largeTextEnd);
  assert.ok(largeTextStart >= 0 && largeTextEnd > largeTextStart);
  assert.match(largeTextScenario, /get_by_role\('tablist',name='Avsnitt'/);
  assert.match(largeTextScenario, /list\.scrollLeft/);
  assert.match(largeTextScenario, /textRange\.getBoundingClientRect/);
  assert.match(largeTextScenario, /active Kommande tab must be fully visible/);
});


test('Panel 4 groups daily rows, classifies routine icons, and previews only confirmed upcoming rows for Idag', () => {
  assert.match(screen, /import \{ routineIconCategory, selectUpcomingWeekPreview \} from '\.\/checklist-presentation'/);
  assert.match(screen, /selectUpcomingWeekPreview\(upcomingRows, dateKey, weekDateKeys\[6\] \?\? dateKey\)/);
  assert.match(screen, /activeTab === 'Idag' && upcomingHealthState === 'ready' && upcomingRoutineState === 'ready' && upcomingPreview\.total > 0/);
  assert.match(screen, /title="Kommande i veckan"/);
  assert.match(screen, /upcomingPreview\.rows\.map/);
  assert.match(screen, /upcomingPreview\.hasMore \? <Button[^>]+label="Visa alla kommande"/);
  assert.match(screen, /onPress=\{\(\) => changeTab\('Kommande'\)\}/);
  assert.match(screen, /style=\{styles\.activityList\}/);
  assert.match(screen, /styles\.activityDivider/);
  assert.match(screen, /category=\{routineIconCategory\(item\.label\)\}/);
});

test('routine item opening is a compact, separate, accurately named chevron action with decorative category icon', () => {
  assert.match(item, /accessibilityElementsHidden importantForAccessibility="no-hide-descendants"/);
  assert.match(item, /category \? <IconChip category=\{category\} size="medium" \/> : <View style=\{styles\.neutralIcon\}/);
  assert.match(item, /accessibilityLabel=\{routineLabel \? `Hantera rutin \$\{routineLabel\}, punkt \$\{label\}`/);
  assert.match(item, /width: tokens\.size\.touchMin, minWidth: tokens\.size\.touchMin, minHeight: tokens\.size\.touchMin/);
  assert.doesNotMatch(item.slice(0, item.indexOf('function HomeDailyActivityItem')), /<Text style=\{styles\.openLabel\}>Visa<\/Text>/);
});

test('Panel 4 tab wrapping is opt-in and preserves accessible selected state', () => {
  const tabs = readFile(new URL('../src/components/ui/Tabs.tsx', import.meta.url), 'utf8');
  return tabs.then((source) => {
    assert.match(source, /'rev02-segmented-wrap'/);
    assert.match(source, /if \(wrapped\) return <HorizontalGestureRegion><View accessibilityRole="tablist"/);
    assert.match(source, /flexWrap: 'wrap'/);
    assert.match(source, /accessibilityRole="tab" accessibilityLabel=\{item\} accessibilityState=\{\{ selected \}\} aria-selected=\{selected\}/);
    assert.match(source, /event\.key !== ' ' && event\.key !== 'Spacebar'[\s\S]*?event\.preventDefault\(\);[\s\S]*?onChange\(item\)/);
    assert.match(screen, /variant="rev02-segmented-wrap"/);
  });
});
