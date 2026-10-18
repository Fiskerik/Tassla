import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/AppPrimitives.tsx', import.meta.url), 'utf8');
const appScreen = source.slice(source.indexOf('export function AppScreen'), source.indexOf('export function PageHeading'));

test('AppScreen keys the native scroller per route and restores that route offset', () => {
  assert.match(appScreen, /const routeKey = scrollKey \?\? 'default'/);
  assert.match(appScreen, /<ScrollView key=\{routeKey\}/);
  assert.match(appScreen, /scrollOffsets\.current\.get\(routeKey\) \?\? 0/);
  assert.match(appScreen, /\}, \[routeKey\]\)/);
});

test('stale route scroll events cannot overwrite another route offset', () => {
  assert.match(appScreen, /useLayoutEffect\(\(\) => \{\s*activeScrollKey\.current = routeKey/);
  assert.match(appScreen, /if \(activeScrollKey\.current !== routeKey\) return/);
  assert.match(appScreen, /scrollOffsets\.current\.set\(routeKey, event\.nativeEvent\.contentOffset\.y\)/);
});

test('same-key rerenders keep the existing scroller instance', () => {
  assert.match(appScreen, /<ScrollView key=\{routeKey\}/);
  assert.doesNotMatch(appScreen, /key=\{[^}]*Date\.now|key=\{[^}]*Math\.random/);
});
