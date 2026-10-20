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
  assert.match(workspace, /onBack=\{\(\) => setPage\('home'\)\}/);
  assert.match(navigation, /page === 'checklist' \|\| page === 'home-training-detail'\) return 'home'/);
  assert.doesNotMatch(navigation, /MAIN_TAB_DESTINATIONS = .*checklist/);
});

test('Training focus is bound to the selected version and step, returns to its source, and refreshes daily scope', () => {
  assert.match(workspace, /activity\.programId === programId && activity\.stepId === stepId/);
  assert.match(workspace, /setHomeTrainingFocus\(\{ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime/);
  assert.match(workspace, /focusStep=\{\{ programId: focus\.programId, stepId: focus\.stepId, returnPage: focus\.returnPage \}\}/);
  assert.match(workspace, /page === 'home' \|\| page === 'checklist' \|\| page === 'home-training-detail'/);
  assert.match(workspace, /const homeChecklistScopeIsCurrent = homeChecklistScope\?\.selectionKey === currentSelectionKey[\s\S]*?const visiblePage: ProductPage = \(page === 'checklist' \|\| page === 'home-training-detail'\) && !homeChecklistScopeIsCurrent \? 'home' : page/);
  assert.match(training, /focusStep\?\.programId/);
  assert.match(training, /focusStep\?\.stepId/);
  assert.match(training, /onCloseStep \?\? onContinue/);
});

test('Checklist preserves its offset while the focused training detail gets a fresh top position', () => {
  assert.match(workspace, /const scrollKey = visiblePage === 'checklist' \? 'home-checklist-flow' : visiblePage/);
  assert.match(workspace, /const preserveScrollKey = visiblePage === 'checklist' \|\| visiblePage === 'home-training-detail' \? 'home-checklist-flow' : undefined/);
  assert.match(workspace, /<AppScreen scrollKey=\{scrollKey\} preserveScrollKey=\{preserveScrollKey\}/);
  assert.match(primitives, /preserveScrollKey\?: string/);
  assert.match(primitives, /const flowActive = Boolean\(preserveScrollKey\)/);
  assert.match(primitives, /preserveFlowActive\.current = flowActive/);
  assert.match(primitives, /flowActive && scrollKey === preserveScrollKey \? preservedOffset\.current : 0/);
  assert.match(primitives, /if \(!flowActive\) preservedOffset\.current = 0/);
  assert.match(primitives, /if \(preserveFlowActive\.current\) preservedOffset\.current = Math\.max\(0, event\.nativeEvent\.contentOffset\.y\)/);
  assert.match(training, /actionLabel=\{focusStep\.returnPage === 'checklist' \? 'Tillbaka till Checklistan'/);
  assert.match(workspace, /setPage\(focus\?\.returnPage \?\? 'home'\)/);
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
