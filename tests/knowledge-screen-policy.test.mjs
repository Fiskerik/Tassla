import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/knowledge/KnowledgeScreen.tsx', import.meta.url), 'utf8');

test('Kunskap uses published content cards and honest states', () => {
  for (const component of ['Card', 'EmptyState', 'Skeleton', 'InfoBanner']) assert.match(screen, new RegExp(`<${component}[\\s>]`));
  assert.match(screen, /contentState === 'loading'/);
  assert.match(screen, /contentState === 'error'/);
  assert.match(screen, /items\.length === 0/);
  assert.doesNotMatch(screen, /Vardagen med hund, ett ämne i taget/);
  assert.doesNotMatch(screen, /PUBLICERAD GUIDE|<MessageCard|<PrimaryButton|<QuietButton|Luna/);
});
