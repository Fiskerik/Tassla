import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const home = await readFile(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');

test('Hem uses the real dog data and the shared UI components', () => {
  assert.match(home, /<DogCard name=\{dog\.name\} breed=\{dog\.breed_id\}/);
  for (const component of ['ListRow', 'HeroCard', 'EmptyState', 'Skeleton', 'InfoBanner']) assert.match(home, new RegExp(`<${component}[\\s>]`));
  assert.doesNotMatch(home, /Luna/);
  assert.doesNotMatch(home, /ER HUNDRESA|SENASTE I LOGGEN|NÄSTA TRÄNINGSSTEG/);
});

test('Hem covers loading, empty, error and normal content states', () => {
  assert.match(home, /contentState === 'loading'/);
  assert.match(home, /contentState === 'ready' && content\.length === 0/);
  assert.match(home, /contentState === 'error'/);
  assert.match(home, /contentState === 'ready' && content\.slice\(0, 2\)/);
  assert.match(home, /onRetryContent/);
});

test('HomePage is no longer an inline legacy primitive screen', () => {
  assert.match(workspace, /<HomeScreen/);
  assert.doesNotMatch(workspace, /function HomePage/);
  assert.doesNotMatch(workspace, /dog-welcome\.png/);
});
