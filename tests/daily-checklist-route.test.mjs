import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [workspace, primitives] = await Promise.all([
  readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/AppPrimitives.tsx', import.meta.url), 'utf8'),
]);
const navigation = await readFile(new URL('../src/features/home/main-navigation.ts', import.meta.url), 'utf8');
const training = await readFile(new URL('../src/features/training/PublishedTrainingScreen.tsx', import.meta.url), 'utf8');

test('Checklist is a Home child route with the existing Home active and no main-tab swipe destination', () => {
  assert.match(workspace, /'home' \| 'checklist' \| 'home-training-detail'/);
  assert.match(workspace, /if \(page === 'checklist'\) return <DailyChecklistScreen/);
  assert.match(workspace, /onBack=\{\(\) => navigateMainTab\('home'\)\}/);
  assert.match(navigation, /page === 'checklist' \|\| page === 'home-training-detail'\) return 'home'/);
  assert.doesNotMatch(navigation, /MAIN_TAB_DESTINATIONS = .*checklist/);
});

test('Training focus is bound to the selected version and step, returns to its source, and refreshes daily scope', () => {
  assert.match(workspace, /activity\.programId === programId && activity\.stepId === stepId/);
  assert.match(workspace, /setHomeTrainingFocus\(\{ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime/);
  assert.match(workspace, /focusStep=\{\{ programId: focus\.programId, stepId: focus\.stepId, returnPage: focus\.returnPage \}\}/);
  assert.match(workspace, /page !== 'home' && page !== 'checklist' && page !== 'home-training-detail' && page !== 'training'/);
  assert.match(workspace, /const homeChecklistScopeIsCurrent = homeChecklistScope\?\.selectionKey === currentSelectionKey[\s\S]*?const visiblePage: ProductPage = \(page === 'checklist' \|\| page === 'home-training-detail'\) && !homeChecklistScopeIsCurrent \? 'home' : page/);
  assert.match(training, /focusStep\?\.programId/);
  assert.match(training, /focusStep\?\.stepId/);
  assert.match(training, /onCloseStep \?\? onContinue/);
});

test('Checklist preserves its offset while the focused training detail gets a fresh top position', () => {
  assert.match(workspace, /const scrollKey = visiblePage === 'checklist' \? 'home-checklist-flow' : visiblePage/);
  assert.match(workspace, /const preserveScrollKey = visiblePage === 'checklist' \|\| visiblePage === 'home-training-detail'[\s\S]*?visiblePage === 'planned-health' && previousPage === 'checklist' \? 'home-checklist-flow'[\s\S]*?visiblePage === 'log' \|\| visiblePage === 'insights' \? 'log-insights-flow' : undefined/);
  assert.match(workspace, /<AppScreen scrollKey=\{scrollKey\} preserveScrollKey=\{preserveScrollKey\}[\s\S]*?scrollResetKey=\{preserveScrollKey === 'home-checklist-flow' \? checklistFilter : undefined\}/);
  assert.match(primitives, /preserveScrollKey\?: string/);
  assert.match(primitives, /scrollResetKey\?: string/);
  assert.match(primitives, /const preservedOffsets = useRef\(new Map<string, number>\(\)\)/);
  assert.match(primitives, /resetFlowOffset && scrollKey && scrollKey === preserveScrollKey\) preservedOffsets\.current\.set\(scrollKey, 0\)/);
  assert.match(primitives, /const flowActive = Boolean\(preserveScrollKey\)/);
  assert.match(primitives, /preserveFlowActive\.current = flowActive/);
  assert.match(primitives, /flowActive && scrollKey \? preservedOffsets\.current\.get\(scrollKey\) \?\? 0 : 0/);
  assert.match(primitives, /if \(!flowActive\) preservedOffsets\.current\.clear\(\)/);
  assert.match(primitives, /if \(preserveFlowActive\.current\) preservedOffsets\.current\.set\(scrollKey, Math\.max\(0, event\.nativeEvent\.contentOffset\.y\)\)/);
  assert.match(training, /actionLabel=\{focusStep\.returnPage === 'checklist' \? 'Tillbaka till Checklistan'/);
  assert.match(workspace, /setPage\(focus\?\.returnPage \?\? 'home'\)/);
});

test('Checklist refreshes its local date scope on resume and while open across midnight', () => {
  assert.match(workspace, /page === 'planned-health' && previousPage === 'checklist'/);
  assert.match(workspace, /page !== 'home' && page !== 'checklist' && page !== 'home-training-detail' && page !== 'training' && !checklistHealthChild/);
  assert.match(workspace, /setDailyClock\(new Date\(\)\)[\s\S]*?setDailyResumeRefresh\(\(revision\) => revision \+ 1\)/);
  assert.match(workspace, /\[currentDailyLifetime, dailyResumeRefresh, page, reloadDailyActivity\]/);
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
  assert.match(workspace, /const visiblePage: ProductPage = \(page === 'checklist' \|\| page === 'home-training-detail'\) && !homeChecklistScopeIsCurrent \? 'home' : page/);

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

test('historical training is resolved for the exact saved source, opens read-only and returns to the selected filter', () => {
  assert.match(workspace, /fetchExactHistoricalTrainingDetail\(client, dog\.id, programId, stepId, controller\.signal\)/);
  assert.match(workspace, /readOnly: true/);
  assert.match(workspace, /historicalTrainingDetailState/);
  assert.match(workspace, /onCompleteStep=\{async \(\) => false\}/);
  assert.match(training, /focusStep\.readOnly \? <Text/);
  assert.match(training, /Historisk aktivitet · skrivskyddad/);
  assert.match(workspace, /onBack=\{\(\) => setPage\(previousPage === 'checklist' \? 'checklist' : 'health'\)\}/);
});

test('a saved routine mutation refreshes the active saved-range projection', () => {
  const mutation = workspace.slice(workspace.indexOf('async function runDailyMutation'), workspace.indexOf('function retryDailyMutation'));
  assert.match(mutation, /if \(outcome\.status === 'saved'\)[\s\S]*?await reloadDailyActivity\(true, true\)/);
  assert.match(mutation, /pageRef\.current === 'checklist' && checklistFilterRef\.current !== 'Idag'[\s\S]*?await loadChecklistRange\(checklistFilterRef\.current, true\)/);
});

test('Idag preview and full Kommande reuse the same scoped request and cached result', () => {
  assert.match(workspace, /const upcomingPreviewKey = `\$\{currentDailyLifetime\}:Kommande`/);
  assert.match(workspace, /const key = `\$\{scope\}:\$\{filter\}`/);
  assert.match(workspace, /if \(!force && active\?\.key === key\)[\s\S]*?return active\.promise/);
  assert.match(workspace, /cachedUpcoming\?\.key === key[\s\S]*?setChecklistRangeView\(cachedUpcoming\)/);
  assert.match(workspace, /const requestedFilter = checklistFilter === 'Idag' \? 'Kommande' : checklistFilter/);
  assert.match(workspace, /filter === 'Kommande' \|\| checklistFilterRef\.current === filter/);
  assert.match(workspace, /fetchDailyActivityRangeSnapshot\(client, dog\.id, range\.from, range\.to, filter === 'Kommande', controller\.signal\)/);
  assert.match(workspace, /fetchPlannedHealthChecklistRange\(client, dog\.id, range\.from, range\.to, controller\.signal\)/);
  assert.match(workspace, /dailyActivityScopeKey\(\{ accountId: session\?\.user\.id \?\? null, accountGeneration, selectionKey: currentSelectionKey,[\s\S]*?instant: dailyClock, timeZone: dailyTimeZone, review: reviewContentEnabled \}\)/);
  assert.match(workspace, /checklistRangeGeneration\.current \+= 1;[\s\S]*?checklistRangeFlight\.current\?\.controller\.abort\(\)/);
});
