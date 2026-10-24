import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/training/PublishedTrainingScreen.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/data/workspace-data.ts', import.meta.url), 'utf8');
const model = await readFile(new URL('../src/features/training/training-overview.ts', import.meta.url), 'utf8');

test('Training tabs expose selected state and have their own rendered destinations', () => {
  assert.match(screen, /<Tabs items=\{\['Rekommenderat', 'Alla övningar', 'Mina'\]\}/);
  assert.match(screen, /accessibilityLabel="Träningsvyer"/);
  assert.match(screen, /if \(label === 'Rekommenderat'\) setSelectedView\('recommended'\)/);
  assert.match(screen, /else if \(label === 'Alla övningar'\) setSelectedView\('all'\)/);
  assert.match(screen, /else if \(label === 'Mina'\) setSelectedView\('mine'\)/);
  assert.match(screen, /testID="training-recommended-view"/);
  assert.match(screen, /testID="training-all-view"/);
  assert.match(screen, /testID="training-mine-view"/);
});

test('a recommendation is tied to the exact published age-and-breed-selected version', () => {
  assert.match(workspace, /currentAgeBreedMatch: currentAgeAndBreedIds\.has\(row\.id\)/);
  assert.match(model, /program\.currentAgeBreedMatch === true/);
  assert.match(model, /programStatus\(program\) === 'not_started'/);
  assert.match(screen, /const ageMatchedPrograms = recommendedPrograms\(visiblePrograms\)/);
});

test('continuation is a single exact action for an incomplete saved step', () => {
  assert.match(screen, /nextExercise\?\.kind === 'continue'/);
  assert.match(screen, /setSelection\(\{ programId: continuationProgram\.id, stepId: continuationStep\.id \}\)/);
  assert.match(screen, /exerciseProgressLabel\(continuationProgram\)/);
});

test('paused older versions do not also show an empty-state claim', () => {
  assert.match(screen, /paused\.filter\(\(item\) => item\.title !== null\)\.map\(\(item\)/);
  assert.match(screen, /item\.title\}\{item\.versionNumber === null \? '' : ` · version \$\{item\.versionNumber\}`\} · pausad/);
  assert.match(screen, /training-unavailable-progress/);
  assert.match(screen, /minePrograms\.length === 0 && paused\.length === 0/);
});

test('recommendation photos are visibly generic and unsupported metadata is absent', () => {
  assert.match(screen, /Standardbild/);
  assert.match(screen, /training-hero-shiba-park\.jpg/);
  assert.match(screen, /training-recommendation-puppy-black-tan-park\.jpg/);
  assert.doesNotMatch(screen, /5 min|10 min|Grundträning|Socialisering/);
});
