import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/passport/PassportScreen.tsx', import.meta.url), 'utf8');

test('Tassla-pass uses the approved dog card, info sections and one share primary', () => {
  for (const component of ['DogCard', 'Card', 'EmptyState', 'InfoBanner', 'Skeleton']) assert.match(screen, new RegExp(`<${component}[\\s>]`));
  assert.match(screen, /Dela som PDF/);
  assert.doesNotMatch(screen, /<PageHeading|<MessageCard|<PrimaryButton|<QuietButton|Luna/);
});
