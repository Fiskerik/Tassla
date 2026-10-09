import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/training/PublishedTrainingScreen.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');

test('Träning uses the target components and state contract', () => {
  for (const component of ['HeroCard', 'Progress', 'ChecklistItem', 'EmptyState', 'Skeleton', 'InfoBanner']) assert.match(screen, new RegExp(`<${component}[\\s>]`));
  assert.match(screen, /loadState === 'loading'/);
  assert.match(screen, /programs\.length === 0/);
  assert.match(screen, /onRetry/);
  assert.match(workspace, /<PublishedTrainingScreen loadState=\{visibleTrainingState\}/);
  assert.doesNotMatch(screen, /<MessageCard|<PrimaryButton|<QuietButton|VECKANS FOKUS|STEG/);
});
