import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const [primitives, workspace, logScreen] = await Promise.all([
  readFile(new URL('../src/components/AppPrimitives.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/puppy-log/LogScreen.tsx', import.meta.url), 'utf8'),
]);

test('native refresh is opt-in and ProductWorkspace opts in only on Home and Log', () => {
  assert.match(primitives, /refreshControl=\{onRefresh \? <RefreshControl/);
  assert.match(primitives, /refreshing=\{refreshing\} onRefresh=\{onRefresh\}/);
  assert.match(workspace, /refreshing=\{page === 'home' \|\| page === 'progress' \? dailyRefreshing : page === 'log' && logView === 'today' \? logRefreshing : page === 'log' && logView === 'overview' \? insightsState\.status === 'loading' : false\}/);
  assert.match(workspace, /page === 'home' \|\| page === 'progress' \? \(\) => \{ void reloadDailyActivity\(true, false\); \} : page === 'log' && logView === 'today' \? \(\) => \{ void reloadEvents\('refresh'\); \} : page === 'log' && logView === 'overview' \? refreshInsights : undefined/);
  assert.match(workspace, /refreshAccessibilityLabel=\{page === 'log' && logView === 'overview' \? 'Uppdatera insikter' : page === 'log' \? 'Uppdatera loggen' : 'Uppdatera Hem'\}/);
});

test('Log reads are scoped to account generation and active dog; old rows are hidden before replacement', () => {
  assert.ok(workspace.includes('const currentLogLifetime'));
  assert.ok(workspace.includes(':' + '$' + '{accountGeneration}:'));
  assert.match(workspace, /logDataLifetime === currentLogLifetime \? events\.map\(toLogEvent\) : \[\]/);
  assert.match(workspace, /eventRows\.current = \[\];\s*setEvents\(\[\]\);\s*logDataLifetimeRef\.current = ''/);
  assert.match(workspace, /setLogStateLifetime\(currentLogLifetime\)/);
});

test('Log refresh joins one scoped read and fences completion, failure and spinner cleanup', () => {
  assert.match(workspace, /if \(existing\?\.scope === scope\)[\s\S]{0,220}return existing\.promise/);
  assert.match(workspace, /logReadGeneration\.current === generation && logLifetime\.current === scope && logReadFlight\.current === flight/);
  assert.match(workspace, /controller\.signal\.aborted \|\| logReadGeneration\.current !== generation[\s\S]{0,150}logLifetime\.current !== scope \|\| logReadFlight\.current !== flight/);
  assert.match(workspace, /\.finally\(\(\) => \{[\s\S]{0,220}logReadGeneration\.current === generation && logLifetime\.current === scope/);
  assert.match(workspace, /if \(logFlight\?\.scope === currentLogLifetime\)[\s\S]{0,160}logFlight\.controller\.abort\(\)/);
});

test('Log pagination aborts on scope change and fences stale completion and spinner cleanup', () => {
  assert.match(workspace, /type LogPaginationFlight = \{ scope: string; generation: number; controller: AbortController \}/);
  assert.match(workspace, /const paginationFlight = logPaginationFlight\.current;\s*if \(paginationFlight\) \{\s*logPaginationGeneration\.current \+= 1;\s*paginationFlight\.controller\.abort\(\);\s*logPaginationFlight\.current = null;/);
  assert.match(workspace, /fetchDogEvents\(client, dog\.id, eventRows\.current\.length, PAGE_SIZE, undefined, controller\.signal\)/);
  assert.match(workspace, /const isCurrent = \(\) => mounted\.current && !controller\.signal\.aborted\s*&& logPaginationGeneration\.current === generation && logLifetime\.current === lifetime\s*&& logPaginationFlight\.current === flight/);
  assert.match(workspace, /if \(logPaginationFlight\.current === flight\) \{\s*logPaginationFlight\.current = null;\s*if \(mounted\.current && !controller\.signal\.aborted && logPaginationGeneration\.current === generation\s*&& logLifetime\.current === lifetime\) setLoadingMore\(false\);/);
  assert.match(workspace, /paginationFlight\?\.scope === currentLogLifetime\)[\s\S]{0,200}paginationFlight\.controller\.abort\(\)/);
});

test('refresh reconciliation preserves confirmed local inserts, updates and deletes during the read', () => {
  const match = workspace.match(/function mergeConfirmedLogRows[\s\S]*?(?=\n\s*function shouldClearDailyMutationFeedback)/);
  assert.ok(match, 'production merge helper is present');
  const compiled = ts.transpileModule(match[0], {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const context = {};
  vm.runInNewContext(compiled + '\nglobalThis.merge = mergeConfirmedLogRows;', context);

  const old = { id: 'old', occurred_at: '2026-10-19T10:00:00Z', description: 'old' };
  const deleted = { id: 'deleted', occurred_at: '2026-10-19T09:00:00Z', description: 'keep out' };
  const updated = { id: 'old', occurred_at: '2026-10-19T11:00:00Z', description: 'confirmed update' };
  const added = { id: 'added', occurred_at: '2026-10-19T12:00:00Z', description: 'confirmed insert' };
  const remote = { id: 'remote', occurred_at: '2026-10-19T10:30:00Z', description: 'new remote row' };
  const merged = context.merge([old, deleted, remote], [old, deleted], [updated, added]);

  assert.deepEqual(Array.from(merged, (row) => row.id), ['added', 'old', 'remote']);
  assert.equal(merged.find((row) => row.id === 'old'), updated);
  assert.equal(merged.find((row) => row.id === 'remote'), remote);
});

test('refresh failure remains distinct from initial failure and offers a same-scope retry', () => {
  assert.match(workspace, /if \(flight\.refreshRequested && hasSnapshot\) \{\s*setLogRefreshError\(true\)/);
  assert.match(logScreen, /Loggen kunde inte uppdateras\. Dina visade händelser är kvar\./);
  assert.match(logScreen, /Försök uppdatera loggen igen/);
  assert.match(logScreen, /refreshError \? <View[\s\S]{0,120}MessageCard tone="error"/);
});

test('daily refresh and retry preserve unresolved same-scope write feedback', () => {
  const match = workspace.match(/function shouldClearDailyMutationFeedback[\s\S]*?\n}/);
  assert.ok(match, 'production feedback policy is present');
  const compiled = ts.transpileModule(match[0], {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const context = {};
  vm.runInNewContext(compiled + '\nglobalThis.shouldClear = shouldClearDailyMutationFeedback;', context);

  assert.equal(context.shouldClear('account:dog:today', 'account:dog:today'), false);
  assert.equal(context.shouldClear('account:dog:today', 'account:other:today'), true);
  assert.equal(context.shouldClear(undefined, 'account:dog:today'), true);

  assert.match(workspace, /dailyMutationForOwner\(dailyMutationStore\.getSnapshot\(\)\.get\(currentDailyOwnerScope\)[\s\S]{0,160}if \(pending && pending\.phase !== 'resolved' && shouldClearDailyMutationFeedback\(pending\.lifetime, scope\)\) \{\s*setDailyMessage\(''\);\s*setDailyMessageError\(false\);/);
  assert.match(workspace, /if \(!retry \|\| \(pending && pending\.phase !== 'resolved' && shouldClearDailyMutationFeedback\(pending\.lifetime, lifetime\)\)\) \{\s*setDailyMessage\(''\);\s*setDailyMessageError\(false\);/);
});
