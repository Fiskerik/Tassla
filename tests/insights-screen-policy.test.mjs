import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/puppy-log/InsightsScreen.tsx', import.meta.url), 'utf8');

test('Insights presents the approved periods, truthful totals and category chart from one projection', () => {
  assert.match(screen, /<AppBar mode="Back" title="Insikter" onAction=\{onBack\} \/>/);
  assert.match(screen, /items=\{\['Vecka', 'Månad', 'Sedan start'\]\}/);
  assert.match(screen, /accessibilityRole="header" style=\{styles\.heading\}>Kiss &amp; bajs/);
  assert.match(screen, /<InsightsChart projection=\{projection\} \/>/);
  assert.match(screen, /projection\.peeTotal/);
  assert.match(screen, /projection\.poopTotal/);
  assert.match(screen, /tokens\.colors\.home\.greenFill/);
  assert.match(screen, /tokens\.primitives\.brown700/);
  assert.match(screen, /bucket\.pee/);
  assert.match(screen, /bucket\.poop/);
  assert.match(screen, /Hela perioden/);
});

test('loading, failure, empty and partial states remain distinct; capped partial has no retry', () => {
  assert.match(screen, /status === 'loading'/);
  assert.match(screen, /status === 'error'/);
  assert.match(screen, /status === 'ready' && projection\.peeTotal \+ projection\.poopTotal === 0/);
  assert.match(screen, /status === 'partial'/);
  assert.match(screen, /Äldre loggar kan saknas/);
  assert.match(screen, /projection\.partialReason !== 'limit' \? <PrimaryButton title="Försök igen"/);
  assert.match(screen, /if \(projection\.partialReason === 'limit'\) return 'Äldre loggar kan saknas/);
});

test('sleep copy does not infer duration from point events', () => {
  assert.match(screen, /Tidsintervall för sömnlogg saknas ännu/);
  assert.doesNotMatch(screen, /sömnduration|normal sömn|sov i \d/i);
});
