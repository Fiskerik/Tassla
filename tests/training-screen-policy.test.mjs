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

test('recommendation photos retain generic assets without temporary badges and unsupported metadata is absent', () => {
  assert.doesNotMatch(screen, /Standardbild|standardBadge/);
  assert.match(screen, /training-hero-shiba-park\.jpg/);
  assert.match(screen, /training-recommendation-puppy-black-tan-park\.jpg/);
  assert.doesNotMatch(screen, /5 min|10 min|Grundträning|Socialisering/);
});


test('journey is the primary progression path and legacy activity marking is disclosed', () => {
  assert.match(screen, /renderJourneyOverview\(openProgram\)/);
  assert.match(screen, /Aktivitetsmarkeringar i programmet/);
  assert.match(screen, /legacyActivityOpen \? selectedProgram\?\.completedStepIds\.includes\(selectedStep\.id\)/);
  assert.match(screen, /progression\.journeys\.find\(\(journey\) => journey\.program_version_id === selectedProgram\.id\)\?\.state === 'paused'/);
  assert.match(screen, /journeyProgress \? <Text style=\{styles\.stepMeta\}>\{progressLabel\}<\/Text> : <Progress/);
});

test('saved start, next, and back wait for fresh progression props before opening the active step', () => {
  assert.match(screen, /const awaitRefresh = action\.kind === 'start_or_resume' \|\| action\.kind === 'next' \|\| action\.kind === 'back'/);
  assert.match(screen, /Ändringen är sparad\. Hämtar det aktiva steget\./);
  assert.match(screen, /setSelection\(\{ programId: waiting\.programId, stepId: journey\.active_step_id \}\)/);
  assert.match(screen, /onRetryProgression/);
});


test('open feedback has no competing milestone or step navigation action', () => {
  assert.match(screen, /!feedbackPickerOpen && view\.canConfirmStep/);
  assert.match(screen, /!feedbackPickerOpen \? <View style=\{styles\.journeyActions\}>/);
  assert.match(screen, /Spara återkopplingen för träningspasset/);
});
