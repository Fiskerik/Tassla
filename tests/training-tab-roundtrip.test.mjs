import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workspace = readFileSync('src/features/home/ProductWorkspace.tsx', 'utf8');
const harness = readFileSync('tools/visual-check/app.tsx', 'utf8');
const trainingScreen = readFileSync('src/features/training/PublishedTrainingScreen.tsx', 'utf8');

test('Home derives its next training title from the shared Training selector', () => {
  assert.match(workspace, /const nextExercise = pickNextExercise\(training\.programs\)/);
  assert.match(workspace, /const nextProgram = training\.programs\.find\(\(program\) => program\.id === nextExercise\?\.programId\)/);
  assert.match(workspace, /const nextStep = nextProgram\?\.steps\.find\(\(step\) => step\.id === nextExercise\?\.stepId\)/);
  assert.match(workspace, /nextStep=\{visibleTrainingState === 'ready' \? nextStep\?\.title : undefined\}/);
});

test('the public fixture keeps a synthetic training program and progress state while tabs unmount screens', () => {
  assert.match(harness, /scenario==='home-ordering'/);
  assert.match(harness, /pickNextExercise\(trainingPrograms\)/);
  assert.match(harness, /setTrainingPrograms\(current=>current\.map/);
  assert.match(harness, /const main=page==='insights'\?'log':\['home','log','training','knowledge'\]\.includes\(page\)\?page/);
  assert.match(harness, /<BottomNav active=\{main\} onChange=\{go\}/);
});

test('the training redesign omits the removed overlapping filters', () => {
  assert.doesNotMatch(trainingScreen, /Mina|Rekommenderat|<Tabs/);
});
