import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';

const resolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const { checklistRangeReadStatus } = await import('../src/features/home/daily-activity-model.ts');
resolution.deregister();
const checklistScreen = await readFile(new URL('../src/features/home/DailyChecklistScreen.tsx', import.meta.url), 'utf8');
const tabsSource = await readFile(new URL('../src/components/ui/Tabs.tsx', import.meta.url), 'utf8');

const requiredSources = ['routineDays', 'routineDaySkips', 'trainingSelections'];

test('Checklist opts into a full-width home-toned segment with explicit web selected state', () => {
  assert.ok(checklistScreen.includes('variant="rev02-segmented" activeTone="home"'));
  assert.ok(tabsSource.includes('aria-selected={selected}'));
  assert.ok(tabsSource.includes("homeSegmentedTabs: { width: '100%', flexGrow: 1 }"));
  assert.ok(tabsSource.includes('homeSegmentedTab: { flex: 1, minWidth: 0 }'));
  assert.ok(tabsSource.includes('backgroundColor: tokens.colors.home.greenStrong'));
  assert.ok(tabsSource.includes('color: tokens.colors.onPrimary'));
});

test('historical checklist is complete only after every saved source is fully read', () => {
  assert.equal(checklistRangeReadStatus(['routines', ...requiredSources], []), 'ready');
});

test('historical checklist stays partial when any saved source fails', () => {
  assert.equal(checklistRangeReadStatus(['routineDaySkips', 'trainingSelections'], ['routineDays']), 'partial');
  assert.equal(checklistRangeReadStatus(['routineDays', 'routineDaySkips'], ['trainingSelections']), 'partial');
});

test('historical checklist reports an error when no required source completed', () => {
  assert.equal(checklistRangeReadStatus([], requiredSources), 'error');
});

test('unresolved or unreadable exact training sources cannot produce a complete empty result', () => {
  assert.equal(checklistRangeReadStatus(requiredSources, ['trainingSources']), 'partial');
  assert.equal(checklistRangeReadStatus(requiredSources, [], 1), 'partial');
});
