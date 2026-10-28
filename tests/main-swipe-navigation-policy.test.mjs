import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const read = (file) => readFileSync(path.join(process.cwd(), file), 'utf8');

test('main swipe is enabled only on main tabs and outside knowledge details', () => {
  const workspace = read('src/features/home/ProductWorkspace.tsx');
  assert.match(workspace, /MainSwipeNavigation enabled=\{isMainTabDestination\(page\) && !\(page === 'knowledge' && knowledgeDetailOpen\)\}/);
});

test('only main-tab changes receive the dedicated duration, distance and light fade', () => {
  const workspace = read('src/features/home/ProductWorkspace.tsx');
  const tokens = read('src/theme/tokens.ts');
  assert.match(workspace, /const mainTabToMainTab = isMainTabDestination\(previousPage\) && isMainTabDestination\(page\)/);
  assert.match(workspace, /const transitionDistance = mainTabToMainTab \? tokens\.motion\.mainTabDistance : tokens\.motion\.distance/);
  assert.match(workspace, /const transitionDuration = mainTabToMainTab \? tokens\.motion\.mainTabEnter : tokens\.motion\.enter/);
  assert.match(workspace, /const transitionOpacityFrom = mainTabToMainTab \? tokens\.motion\.mainTabOpacityFrom : 0/);
  assert.match(workspace, /<ScreenTransition transitionKey=\{page\} direction=\{transitionDirection\} axis="x" distance=\{transitionDistance\}[\s\S]*?duration=\{transitionDuration\} opacityFrom=\{transitionOpacityFrom\}>/);
  assert.match(tokens, /mainTabEnter: 300, mainTabDistance: 44, mainTabOpacityFrom: 0\.9/);
  assert.match(tokens, /pageDistance: 28/);
});

test('swipe direction uses the existing next-tab callback and preserves no-wrap behavior', () => {
  const workspace = read('src/features/home/ProductWorkspace.tsx');
  const navigation = read('src/features/home/main-navigation.ts');
  assert.match(workspace, /nextMainTabDestination\(page, direction\)/);
  assert.match(navigation, /MAIN_TAB_DESTINATIONS\[index \+ \(direction === 'left' \? 1 : -1\)\]/);
  assert.match(navigation, /if \(index < 0\) return undefined/);
});
