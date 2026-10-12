import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';

const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
const state = await import('../src/features/training/review-training-state.ts');
hook.deregister();

test('review completion and reset remain local, unique, and scoped by synthetic ID', () => {
  const programId = 'review-v1:training:contact';
  const once = state.completeReviewTrainingStep({}, programId, 'review-v1:training:contact:one');
  const twice = state.completeReviewTrainingStep(once, programId, 'review-v1:training:contact:one');
  assert.deepEqual(twice[programId], ['review-v1:training:contact:one']);
  assert.deepEqual(state.resetReviewTrainingProgram(twice, programId)[programId], []);
  assert.equal(state.isReviewTrainingProgram(programId), true);
  assert.equal(state.isReviewTrainingProgram('published-program-id'), false);
});

test('review undo removes only the selected synthetic step without changing other steps or programs', () => {
  const programId = 'review-v1:training:contact';
  const otherProgramId = 'review-v1:training:calm';
  const current = {
    [programId]: ['one', 'two'],
    [otherProgramId]: ['other'],
  };
  const result = state.undoReviewTrainingStep(current, programId, 'one');
  assert.deepEqual(result[programId], ['two']);
  assert.deepEqual(result[otherProgramId], ['other']);
  assert.deepEqual(current[programId], ['one', 'two']);
});

test('review completion does not invoke the cloud progression callback', async () => {
  let cloudCalls = 0;
  let localCalls = 0;
  const result = await state.completeTrainingStepForMode(
    'review-v1:training:contact', true,
    () => { localCalls += 1; },
    async () => { cloudCalls += 1; return true; },
  );
  assert.deepEqual(result, { kind: 'review' });
  assert.equal(localCalls, 1);
  assert.equal(cloudCalls, 0);
  const published = await state.completeTrainingStepForMode('published-id', true, () => { localCalls += 100; }, async () => { cloudCalls += 1; return 'confirmed'; });
  assert.deepEqual(published, { kind: 'published', value: 'confirmed' });
  assert.equal(cloudCalls, 1);
  assert.equal(localCalls, 1);
});

test('review-mode handler returns before cloud progression callback and labels temporary state', async () => {
  const screen = await readFile(new URL('../src/features/training/PublishedTrainingScreen.tsx', import.meta.url), 'utf8');
  const localBranch = screen.indexOf('completeTrainingStepForMode(');
  const cloudCall = screen.indexOf('() => onCompleteStep(selectedProgram, selectedStep.id)');
  assert.ok(localBranch >= 0 && cloudCall >= 0);
  assert.match(screen, /completeTrainingStepForMode\(/);
  assert.match(screen, /Markeringar i dessa övningsutkast sparas under den här visningen/);
  const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(workspace, /reviewMode=\{reviewContentEnabled && training\.programs\.some\(\(program\) => program\.id\.startsWith\('review-v1:training:'\)\)\}/);
  assert.match(workspace, /Publicerat träningsinnehåll kunde inte hämtas\. Inga exempelprogram visas\./);
});
