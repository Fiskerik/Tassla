import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/home/MoreScreen.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');

test('Mer uses ListRows, IconChips and a tertiary sign-out action', () => {
  assert.match(screen, /<ListRow/);
  assert.match(screen, /variant="tertiary"/);
  assert.match(workspace, /<MoreScreen/);
  assert.doesNotMatch(workspace, /function MorePage|function MenuRow/);
  assert.doesNotMatch(screen, /<PageHeading|<MessageCard|<QuietButton/);
});
