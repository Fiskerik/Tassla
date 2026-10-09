import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/account/AccountSettingsScreen.tsx', import.meta.url), 'utf8');

test('Konto uses list rows, Dialog for deletion and truthful status', () => {
  assert.match(screen, /<ListRow/);
  assert.match(screen, /<Dialog/);
  assert.match(screen, /variant="destructive"/);
  assert.match(screen, /markerState !== 'clear'/);
  assert.doesNotMatch(screen, /<PageHeading|<MessageCard|<QuietButton|function DestructiveButton/);
});
