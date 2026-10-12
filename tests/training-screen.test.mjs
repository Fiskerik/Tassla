import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [screen, workspace, dataTests] = await Promise.all([
  readFile(new URL('../src/features/training/PublishedTrainingScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8'),
  readFile(new URL('./workspace-data.test.mjs', import.meta.url), 'utf8'),
]);

test('programs are image cards, selection focuses the active program, and checklist rows stay distinct', () => {
  assert.match(screen, /<SectionHeader title="Övningar" \/>/);
  assert.match(screen, /<SectionHeader title="Fler program" \/>/);
  assert.match(screen, /styles\.programGrid/);
  assert.match(screen, /function ProgramCard/);
  assert.match(screen, /<Text style=\{styles\.programLabel\}>Program<\/Text>/);
  assert.match(screen, /setProgramId\(program\.id\); onFocusProgram\(\);/);
  assert.match(workspace, /<AppScreen scrollKey=\{page === 'training' \? `\$\{page\}:\$\{trainingFocusGeneration\}` : page\}/);
  assert.match(workspace, /onFocusProgram=\{\(\) => setTrainingFocusGeneration/);
});

test('confirmed completion uses reduced-motion-aware, nonblocking confetti without a success toast', () => {
  assert.doesNotMatch(screen, /<Toast visible=\{saved\}[^>]*Övningen är genomförd/);
  assert.match(screen, /if \(!reducedMotion\) setCelebrationKey\(key\)/);
  assert.match(screen, /<ConfettiBurst eventKey=\{celebrationKey\} reducedMotion=\{reducedMotion\}/);
  assert.match(screen, /tokens\.motion\.check/);
  assert.match(screen, /pointerEvents="none" accessibilityElementsHidden/);
  assert.match(screen, /return null;/);
});

test('undo keeps completion until a current, full-scope delete is confirmed and reread', () => {
  assert.match(screen, /label="Markera som ej genomförd" accessibilityLabel="Markera som ej genomförd"/);
  assert.match(workspace, /async function undoTrainingStep/);
  assert.match(workspace, /deleteTrainingProgress\(client, dogId, program\.id, stepId\)/);
  assert.match(workspace, /isCurrentAccount\(ownerId, generation\)[\s\S]*?currentSelectionKeyRef\.current === selectionKey/);
  assert.match(workspace, /const refreshed = await reloadTraining\(\)/);
  assert.match(workspace, /const confirmedAbsent = confirmedProgram !== undefined && !confirmedProgram\.completedStepIds\.includes\(stepId\)/);
  assert.match(workspace, /if \(outcome\.status === 'saved' && confirmedAbsent\) return true/);
  assert.match(workspace, /if \(outcome\.status === 'unknown' && confirmedAbsent\) return true/);
  assert.match(workspace, /trainingMutationInFlight\.current\) return false/);
  assert.match(dataTests, /training progress insert and delete reconcile uncertain outcomes by the full versioned key/);
  assert.match(dataTests, /training progress delete stays unresolved when the full-key readback still finds the completion/);
  assert.match(screen, /if \(reviewMode && isReviewTrainingProgram\(program\.id\)\)/);
  assert.match(screen, /undoReviewTrainingStep\(current, program\.id, stepId\)/);
});
