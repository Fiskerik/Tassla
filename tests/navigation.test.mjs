import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workspace = readFileSync('src/features/home/ProductWorkspace.tsx', 'utf8');
const context = readFileSync('src/features/home/workspace-context.tsx', 'utf8');
const shell = readFileSync('src/features/home/WorkspaceRouteScreen.tsx', 'utf8');
const layout = readFileSync('app/(workspace)/_layout.tsx', 'utf8');
const primitives = readFileSync('src/components/AppPrimitives.tsx', 'utf8');

test('workspace uses a persistent context instead of page-state remounting', () => {
  assert.match(context, /createContext/);
  assert.match(workspace, /<WorkspaceContext\.Provider/);
  assert.match(workspace, /router\.replace\('\/training'/);
  assert.match(workspace, /router\.replace\('\/planned-health'/);
  assert.doesNotMatch(workspace, /useState<ProductPage>/);
  assert.doesNotMatch(workspace, /<AppScreen key=\{page\}/);
  assert.doesNotMatch(workspace, /BottomNavigation/);
});

test('native route shell has stable tabs, pushed routes and reduced-motion gestures', () => {
  assert.match(shell, /<BottomNav active=\{tab\}/);
  assert.match(shell, /router\.replace\(`\/\$\{destination\}`/);
  assert.match(shell, /router\.push\('\/notifications'/);
  assert.match(layout, /animation: reduceMotion \? 'none' : 'slide_from_right'/);
  assert.match(layout, /gestureEnabled: true/);
  assert.match(layout, /fullScreenGestureEnabled: true/);
  for (const route of ['home', 'log', 'training', 'health', 'more', 'knowledge', 'passport', 'profile', 'notifications', 'account', 'beta-info', 'planned-health']) {
    assert.ok(readFileSync(`app/(workspace)/${route}.tsx`, 'utf8').includes('WorkspaceRouteScreen'), `missing route ${route}`);
  }
});

test('global AppScreen brand block is removed while AppBar remains the brand owner', () => {
  assert.doesNotMatch(primitives, /brandMark/);
  assert.match(readFileSync('src/components/ui/AppBar.tsx', 'utf8'), /mode === 'Home' \? <Text style=\{styles\.brand\}>Tassla/);
});
