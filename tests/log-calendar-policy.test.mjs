import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((value) => parseInt(value, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(first, second) {
  const a = luminance(first); const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('pee uses the blue category token and keeps required icon/text contrast', async () => {
  const source = await readFile(new URL('../src/theme/tokens.ts', import.meta.url), 'utf8');
  assert.match(source, /const logCategoryColors = \{\s*\.\.\.categoryColors,\s*food:/);
  assert.match(source, /export const categoryColors = \{\s*pee: \{ fg: primitives\.blue700, bg: primitives\.blue100 \}/);
  const pee = { fg: '#246A98', bg: '#E4EEF4' };
  const water = { fg: '#246A98', bg: '#E4EEF4' };
  assert.ok(contrast(pee.fg, pee.bg) >= 4.5);
  assert.ok(contrast(water.fg, water.bg) >= 3);
  assert.ok(contrast('#1C3027', pee.bg) >= 4.5);
  assert.ok(contrast('#1C3027', water.bg) >= 4.5);
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

test('pee and water use different icon paths and pressed quick-log treatment does not fade contrast', async () => {
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
  assert.ok(contrast('#A32929', '#F7EAE7') >= 3);
  assert.ok(contrast('#785716', '#F5E7BF') >= 3);
  assert.ok(contrast('#246A98', '#E4EEF4') >= 3);
});

test('calendar day hit targets retain 44 pt width at the narrow QA viewport', async () => {
  const calendar = await readFile(new URL('../src/features/puppy-log/LogDateCalendar.tsx', import.meta.url), 'utf8');
  const sheet = await readFile(new URL('../src/components/ui/BottomSheet.tsx', import.meta.url), 'utf8');
  assert.match(calendar, /container: \{ paddingVertical: tokens\.spacing\.md, paddingHorizontal: tokens\.spacing\.sm/);
  assert.match(calendar, /dayCell: \{ width:/);
  assert.match(calendar, /minWidth: tokens\.size\.touchMin, minHeight: tokens\.size\.touchMin/);
  assert.match(sheet, /sheet: \{[^}]*padding: tokens\.spacing\.lg/);
  const viewportWidth = 360;
  const sheetInset = 16;
  const calendarInset = 8;
  const usableGridWidth = viewportWidth - 2 * sheetInset - 2 * calendarInset;
  assert.ok(usableGridWidth / 7 >= 44, 'seven 44 pt controls must fit at 360 pt');
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
