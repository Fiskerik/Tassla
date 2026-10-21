import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [workspace, logScreen, primitives, navigation] = await Promise.all([
  readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/puppy-log/LogScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/AppPrimitives.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/home/main-navigation.ts', import.meta.url), 'utf8'),
]);

test('Logga owns the selected date and Overview opens the unmounted Insights route', () => {
  assert.match(workspace, /const \[logSelectedDate, setLogSelectedDate\] = useState\(\(\) => localDate\(\)\)/);
  assert.match(workspace, /setLogSelectedDate\(localDate\(\)\)/);
  assert.match(workspace, /selectedDate=\{logSelectedDate\} onSelectedDateChange=\{setLogSelectedDate\}/);
  assert.match(workspace, /onOpenInsights=\{\(\) => \{ setInsightsRetryRevision\(\(revision\) => revision \+ 1\); setPage\('insights'\); \}\}/);
  assert.match(logScreen, /selectedDate\?: string/);
  assert.match(logScreen, /onSelectedDateChange\?: \(date: string\) => void/);
  assert.match(logScreen, /items=\{\['Idag', 'Översikt'\]\} active="Idag"/);
  assert.match(workspace, /if \(page === 'insights'\) return <InsightsScreen/);
  assert.match(workspace, /onBack=\{\(\) => setPage\('log'\)\}/);
});

test('Insights read refreshes for each route, dog/session, period and timezone, and cancels stale work', () => {
  const readEffectStart = workspace.indexOf("useEffect(() => {\n    if (page !== 'insights') return undefined;");
  const readEffectEnd = workspace.indexOf("  useEffect(() => {", readEffectStart + 12);
  assert.ok(readEffectStart >= 0 && readEffectEnd > readEffectStart);
  const effect = workspace.slice(readEffectStart, readEffectEnd);
  assert.match(effect, /createInsightsRange\(period, new Date\(\), timeZone\)/);
  assert.match(effect, /fetchDogInsightsEvents\(client, dog\.id, range\.startIso, range\.endIso, controller\.signal\)/);
  assert.match(effect, /logLifetime\.current === scope/);
  assert.match(effect, /pageRef\.current === 'insights'/);
  assert.match(effect, /controller\.abort\(\)/);
  assert.match(effect, /\[client, currentLogLifetime, deviceTimeZone, dog\.id, insightsPeriod, insightsRetryRevision, page, serializeEventRead\]/);
  assert.match(effect, /projectInsights\(/);
});

test('Logga and Insights keep separate offsets in one route group; Checklist keeps its reset behavior', () => {
  assert.match(workspace, /visiblePage === 'log' \|\| visiblePage === 'insights' \? 'log-insights-flow'/);
  assert.match(workspace, /scrollResetKey=\{preserveScrollKey === 'home-checklist-flow' \? checklistFilter : undefined\}/);
  assert.match(primitives, /preservedOffsets\.current\.get\(scrollKey\) \?\? 0/);
  assert.match(primitives, /preservedOffsets\.current\.set\(scrollKey, Math\.max\(0, event\.nativeEvent\.contentOffset\.y\)\)/);
  assert.match(primitives, /if \(preserveFlowChanged\) preservedOffsets\.current\.clear\(\)/);
  assert.match(navigation, /if \(page === 'insights'\) return 'log'/);
  assert.match(workspace, /if \(previous === 'insights' && current === 'log'\) return 'backward'/);
});
