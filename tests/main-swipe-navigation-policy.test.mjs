import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const read = (file) => readFileSync(path.join(process.cwd(), file), 'utf8');

test('main swipe is enabled only on main tabs and outside knowledge details', () => {
  const workspace = read('src/features/home/ProductWorkspace.tsx');
  assert.match(workspace, /MainSwipeNavigation enabled=\{isMainTabDestination\(page\) && !\(page === 'knowledge' && knowledgeDetailOpen\)\}/);
});

test('only main-tab changes receive the named page transition distance', () => {
  const workspace = read('src/features/home/ProductWorkspace.tsx');
  const tokens = read('src/theme/tokens.ts');
  assert.match(workspace, /const mainTabToMainTab = isMainTabDestination\(previousPage\) && isMainTabDestination\(page\)/);
  assert.match(workspace, /const transitionDistance = mainTabToMainTab \? tokens\.motion\.pageDistance : tokens\.motion\.distance/);
  assert.match(workspace, /<ScreenTransition transitionKey=\{page\} direction=\{transitionDirection\} axis="x" distance=\{transitionDistance\}>/);
  assert.match(tokens, /pageDistance: 28/);
});

test('swipe direction uses the existing next-tab callback and preserves no-wrap behavior', () => {
  const workspace = read('src/features/home/ProductWorkspace.tsx');
  const navigation = read('src/features/home/main-navigation.ts');
  assert.match(workspace, /nextMainTabDestination\(page, direction\)/);
  assert.match(navigation, /MAIN_TAB_DESTINATIONS\[index \+ \(direction === 'left' \? 1 : -1\)\]/);
  assert.match(navigation, /if \(index < 0\) return undefined/);
});
