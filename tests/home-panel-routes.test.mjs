import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { activeMainTabDestination, productRouteScrollKeys } from '../src/features/home/main-navigation.ts';

const workspaceSource = readFileSync(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');

test('Home, Development, Progress and Checklist each preserve their own flow offset', () => {
  assert.deepEqual(productRouteScrollKeys('home'), { scrollKey: 'home-detail-flow', preserveScrollKey: 'home-detail-flow' });
  assert.deepEqual(productRouteScrollKeys('development'), { scrollKey: 'home-development-flow', preserveScrollKey: 'home-development-flow' });
  assert.deepEqual(productRouteScrollKeys('progress'), { scrollKey: 'home-progress-flow', preserveScrollKey: 'home-progress-flow' });
  assert.deepEqual(productRouteScrollKeys('checklist'), { scrollKey: 'home-checklist-flow', preserveScrollKey: 'home-checklist-flow' });
});

test('a Development guide keeps the Development parent and ordinary Knowledge stays independent', () => {
  assert.deepEqual(productRouteScrollKeys('knowledge', 'development'), {
    scrollKey: 'home-development-guide-detail', preserveScrollKey: 'home-development-flow',
  });
  assert.deepEqual(productRouteScrollKeys('knowledge'), { scrollKey: 'knowledge' });
  assert.deepEqual(productRouteScrollKeys('knowledge', 'more'), { scrollKey: 'knowledge' });
});

test('Home child routes keep Home selected in the main navigation', () => {
  for (const route of ['home', 'development', 'progress', 'checklist', 'home-training-detail']) {
    assert.equal(activeMainTabDestination(route), 'home', route);
  }
  assert.equal(activeMainTabDestination('knowledge'), 'knowledge');
});

test('ProductWorkspace scroll scope changes with owner generation, dog identity and review context', () => {
  assert.match(workspaceSource, /const currentSelectionKey = `\$\{session\?\.user\.id \?\? 'signed-out'\}:\$\{accountGeneration\}:\$\{dog\.id\}:\$\{dog\.breed_id\}:\$\{dog\.birth_date\}:\$\{age \?\? 'unknown-age'\}:\$\{reviewContentEnabled \? 'review' : 'public'\}`/);
  assert.match(workspaceSource, /scrollMemoryScope=\{`\$\{currentSelectionKey\}:\$\{currentDailyLifetime\}`\}/);
});
