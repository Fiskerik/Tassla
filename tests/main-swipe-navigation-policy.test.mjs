import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const read = (file) => readFileSync(path.join(process.cwd(), file), 'utf8');

test('main swipe is enabled only on main tabs and outside knowledge details', () => {
  const workspace = read('src/features/home/ProductWorkspace.tsx');
  assert.match(workspace, /MainSwipeNavigation enabled=\{isMainTabDestination\(page\) && !\(page === 'knowledge' && knowledgeDetailOpen\)\}/);
});

test('swipe direction uses the existing next-tab callback and preserves no-wrap behavior', () => {
  const workspace = read('src/features/home/ProductWorkspace.tsx');
  const navigation = read('src/features/home/main-navigation.ts');
  assert.match(workspace, /nextMainTabDestination\(page, direction\)/);
  assert.match(navigation, /MAIN_TAB_DESTINATIONS\[index \+ \(direction === 'left' \? 1 : -1\)\]/);
  assert.match(navigation, /if \(index < 0\) return undefined/);
});
