import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [workspace, primitives] = await Promise.all([
  readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/AppPrimitives.tsx', import.meta.url), 'utf8'),
]);
const navigation = await readFile(new URL('../src/features/home/main-navigation.ts', import.meta.url), 'utf8');
const training = await readFile(new URL('../src/features/training/PublishedTrainingScreen.tsx', import.meta.url), 'utf8');
const plannedHealth = await readFile(new URL('../src/features/health/PlannedHealthScreen.tsx', import.meta.url), 'utf8');

test('Checklist is a Home child route with the existing Home active and no main-tab swipe destination', () => {
  assert.match(workspace, /type ProductPage = 'home' \| 'development' \| 'progress' \| 'checklist'/);
  assert.match(workspace, /if \(page === 'checklist'\) return <DailyChecklistScreen/);
  assert.match(workspace, /onBack=\{\(\) => \{ setHomeChecklistScope\(null\); setPage\('home'\); \}\}/);
  assert.match(navigation, /page === 'development' \|\| page === 'progress' \|\| page === 'checklist' \|\| page === 'home-training-detail'\) return 'home'/);
  assert.doesNotMatch(navigation, /MAIN_TAB_DESTINATIONS = .*checklist/);
});

test('Training focus is bound to the selected version and step, returns to its source, and refreshes daily scope', () => {
  assert.match(workspace, /activity\.programId === programId && activity\.stepId === stepId/);
  assert.match(workspace, /setHomeTrainingFocus\(\{ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime/);
  assert.match(workspace, /focusStep=\{\{ programId: focus\.programId, stepId: focus\.stepId, returnPage: focus\.returnPage \}\}/);
  assert.match(workspace, /const needsDailyRefresh = page === 'home' \|\| page === 'progress' \|\| page === 'training'[\s\S]*page === 'checklist' && checklistFilter === 'Idag'/);
  assert.match(workspace, /page === 'home-training-detail' && !homeTrainingFocus\?\.readOnly/);
  assert.match(workspace, /openHistoricalTrainingStep\(programId: string, stepId: string\)/);
  assert.match(workspace, /fetchExactPublishedTrainingStep\(client, focus\.programId, focus\.stepId, controller\.signal\)/);
  assert.match(workspace, /readOnly: true, dateKey: activity\.dateKey, completed: activity\.completed/);
  assert.match(training, /if \(focusStep\?\.readOnly\) return <View testID="historical-training-step-detail"/);
  assert.match(training, /Endast läsning/);
  assert.match(workspace, /const homeChecklistScopeIsCurrent = homeChecklistScope\?\.selectionKey === currentSelectionKey[\s\S]*?const visiblePage: ProductPage = \(page === 'checklist' \|\| page === 'progress' \|\| page === 'home-training-detail'\) && !homeChecklistScopeIsCurrent/);
  assert.match(training, /focusStep\?\.programId/);
  assert.match(training, /focusStep\?\.stepId/);
  assert.match(training, /onCloseStep \?\? onContinue/);
});

test('Checklist preserves its offset through training and planned-health source routes', () => {
  assert.match(workspace, /const defaultRouteScroll = visiblePage === 'log' \? logViewScrollKeys\(logView\) : productRouteScrollKeys\(visiblePage/);
  assert.match(workspace, /visiblePage === 'planned-health' && visiblePlannedHealthChecklistFocus[\s\S]*?preserveScrollKey: 'home-checklist-flow'/);
  assert.match(workspace, /<AppScreen scrollKey=\{routeScroll\.scrollKey\} preserveScrollKey=\{routeScroll\.preserveScrollKey\} scrollMemoryScope=/);
  assert.match(navigation, /if \(page === 'checklist'\) return \{ scrollKey: 'home-checklist-flow', preserveScrollKey: 'home-checklist-flow' \}/);
  assert.match(navigation, /if \(page === 'home-training-detail'\) return \{ scrollKey: page, preserveScrollKey: 'home-checklist-flow' \}/);
  assert.match(primitives, /preserveScrollKey\?: string/);
  assert.match(primitives, /const preservedOffsets = useRef\(new Map<string, number>\(\)\)/);
  assert.match(primitives, /const flowActive = Boolean\(preserveScrollKey && scrollKey\)/);
  assert.match(primitives, /preserveFlowActive\.current = flowActive/);
  assert.match(primitives, /flowActive && scrollKey === preserveScrollKey \? preservedOffsets\.current\.get\(scrollKey \?\? ''\) \?\? 0 : 0/);
  assert.match(primitives, /if \(!flowActive\) preservedOffsets\.current\.clear\(\)/);
  assert.match(primitives, /preservedOffsets\.current\.set\(scrollKey, Math\.max\(0, event\.nativeEvent\.contentOffset\.y\)\)/);
  assert.match(training, /actionLabel=\{focusStep\.returnPage === 'checklist' \? 'Tillbaka till Checklistan'/);
  assert.match(workspace, /setPage\(focus\?\.returnPage \?\? 'home'\)/);
  assert.match(workspace, /backLabel=\{visiblePlannedHealthChecklistFocus \? 'Checklistan' : 'Hälsa'\}/);
  assert.match(workspace, /setChecklistRangeRetry\(\(value\) => value \+ 1\);[\s\S]*setPage\('checklist'\)/);
  assert.match(plannedHealth, /const focusedChecklistRecord = checklistFocusState === 'ready' \? checklistFocusRecord : null/);
  assert.match(plannedHealth, /loadState === 'ready' && focusedChecklistRecord \? renderRecord\(focusedChecklistRecord, true\) : null/);
  assert.match(plannedHealth, /function renderRecord\(record: PlannedHealthRecord, openedFromChecklist = false\)/);
  assert.ok(plannedHealth.indexOf('renderRecord(focusedChecklistRecord, true)') < plannedHealth.indexOf('style={styles.formCard}'));
  assert.match(plannedHealth, /remainingRecords\.map\(\(record\) => renderRecord\(record\)\)/);
});

test('scope changes invalidate the stored child route so A to B to A cannot revive an old checklist', () => {
  const selectionLifecycle = workspace.slice(
    workspace.indexOf('currentSelectionKeyRef.current = currentSelectionKey;'),
    workspace.indexOf('}, [currentSelectionKey, page, setPage]);'),
  );
  const dailyLifecycle = workspace.slice(
    workspace.indexOf('if (dailyLifetime.current && dailyLifetime.current !== currentDailyLifetime)'),
    workspace.indexOf('}, [currentDailyLifetime, page, setPage]);'),
  );
  assert.match(selectionLifecycle, /setHomeChecklistScope\(null\)/);
  assert.match(selectionLifecycle, /setPage\('home'\)/);
  assert.match(dailyLifecycle, /setHomeChecklistScope\(null\)/);
  assert.match(dailyLifecycle, /setPage\('home'\)/);
  assert.match(workspace, /const visiblePage: ProductPage = \(page === 'checklist' \|\| page === 'progress' \|\| page === 'home-training-detail'\) && !homeChecklistScopeIsCurrent/);

  let page = 'checklist';
  let storedChecklistScope = 'owner:dog-a';
  let priorScope = 'owner:dog-a';
  for (const activeScope of ['owner:dog-b', 'owner:dog-a']) {
    if (priorScope !== activeScope) {
      storedChecklistScope = null;
      if (page === 'checklist' || page === 'home-training-detail') page = 'home';
    }
    priorScope = activeScope;
  }
  const homeChecklistScopeIsCurrent = storedChecklistScope === 'owner:dog-a';
  const visiblePage = (page === 'checklist' || page === 'home-training-detail') && !homeChecklistScopeIsCurrent ? 'home' : page;
  assert.equal(visiblePage, 'home');
  assert.equal(storedChecklistScope, null);
});
