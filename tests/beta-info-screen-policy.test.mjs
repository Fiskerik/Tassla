import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/account/BetaInfoScreen.tsx', import.meta.url), 'utf8');

test('Beta-info uses cards/captions and a support row', () => {
  assert.match(screen, /<SectionHeader/);
  assert.match(screen, /<Card/);
  assert.match(screen, /<ListRow/);
  assert.match(screen, /<InfoBanner/);
  assert.doesNotMatch(screen, /<PageHeading|<MessageCard|<QuietButton/);
});
