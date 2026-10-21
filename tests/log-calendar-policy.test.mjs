import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('pee uses the Logga amber token without changing Home category colors', async () => {
  const source = await readFile(new URL('../src/theme/tokens.ts', import.meta.url), 'utf8');
  assert.match(source, /const logCategoryColors = \{\s*\.\.\.categoryColors,\s*pee: \{ fg: primitives\.amber700, bg: primitives\.amber100 \}/);
  assert.match(source, /export const categoryColors = \{\s*pee: \{ fg: primitives\.blue700, bg: primitives\.blue100 \}/);
});

test('calendar exposes day and status semantics and keeps day selection available on marker failure', async () => {
  const source = await readFile(new URL('../src/features/puppy-log/LogDateCalendar.tsx', import.meta.url), 'utf8');
  assert.match(source, /accessibilityLabel=\{state\}/);
  assert.match(source, /hasLogs \? 'har loggar'/);
  assert.match(source, /accessibilityState=\{\{ selected, disabled \}\}/);
  assert.match(source, /accessibilityState=\{\{ busy: status === 'loading' \}\}/);
  assert.match(source, /Loggdagar kunde inte hämtas/);
  assert.match(source, /Försök hämta loggdagar igen/);
  assert.match(source, /Inga loggar den här månaden/);
  assert.match(source, /onPress=\{\(\) => onSelectDate\(dateKey\)\}/);
  assert.match(source, /disabled=\{nextDisabled\}/);
});

test('pee and water use different icon paths and log presses remain visibly distinct', async () => {
  const icon = await readFile(new URL('../src/components/ui/IconChip.tsx', import.meta.url), 'utf8');
  const tile = await readFile(new URL('../src/components/ui/QuickLogTile.tsx', import.meta.url), 'utf8');
  const listRow = await readFile(new URL('../src/components/ui/ListRow.tsx', import.meta.url), 'utf8');
  assert.match(icon, /category === 'pee' && variant === 'rev02-log' \? <PeeIcon/);
  assert.match(icon, /water: 'water-outline'/);
  assert.match(icon, /peeGround: \{ borderBottomWidth: tokens\.size\.stroke \* 2/);
  assert.match(tile, /logPressed: \{ borderWidth: 2, borderColor: tokens\.colors\.primary \}/);
  assert.doesNotMatch(tile, /logPressed: \{ opacity:/);
  assert.match(listRow, /logTimelinePressed: \{ backgroundColor: tokens\.colors\.selectedSurface \}/);
  assert.match(listRow, /pressed: \{ backgroundColor: tokens\.colors\.selectedSurface \}/);
  assert.doesNotMatch(listRow, /logTimelinePressed: \{ opacity:/);
});

test('calendar request lifecycle guards stale scope and refreshes an open calendar after confirmed mutations', async () => {
  const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
  const logScreen = await readFile(new URL('../src/features/puppy-log/LogScreen.tsx', import.meta.url), 'utf8');
  const loadStart = workspace.indexOf('const loadLogCalendarMarkers = useCallback');
  const cancelStart = workspace.indexOf('const cancelLogCalendarRead = useCallback', loadStart);
  assert.ok(loadStart >= 0 && cancelStart > loadStart);
  const loader = workspace.slice(loadStart, cancelStart);
  assert.match(loader, /active\?\.controller\.abort\(\)/);
  assert.match(loader, /logCalendarGeneration\.current \+= 1/);
  assert.match(loader, /logLifetime\.current !== scope/);
  assert.match(loader, /logCalendarGeneration\.current !== generation/);
  assert.match(loader, /logCalendarFlight\.current !== flight/);
  const cancelEnd = workspace.indexOf('const reloadEvents = useCallback', cancelStart);
  const cancel = workspace.slice(cancelStart, cancelEnd);
  assert.match(cancel, /logCalendarFlight\.current\?\.controller\.abort\(\)/);
  assert.match(cancel, /logCalendarGeneration\.current \+= 1/);
  assert.match(logScreen, /const mutationKey = mutation\?\.status === 'saved'/);
  assert.match(logScreen, /if \(!calendarOpen \|\| !mutationKey \|\| refreshedCalendarMutation\.current === mutationKey\) return/);
  assert.match(logScreen, /onLoadCalendarMonth\?\.\(calendarMonth\)/);
  assert.match(logScreen, /setCalendarOpen\(false\);\s*onCancelCalendarRead\?\.\(\)/);
  assert.match(logScreen, /useEffect\(\(\) => \(\) => onCancelCalendarRead\?\.\(\)/);
});
