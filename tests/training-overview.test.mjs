import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const o = await import('../src/features/training/training-overview.ts');
const screen = readFileSync(path.join(process.cwd(), 'src/features/training/PublishedTrainingScreen.tsx'), 'utf8');
const workspace = readFileSync(path.join(process.cwd(), 'src/features/home/ProductWorkspace.tsx'), 'utf8');
const prog = (id, steps, done = []) => ({ id, steps: steps.map((s) => ({ id: s })), completedStepIds: done });

test('program status follows only current-version completed steps and ignores unknown or duplicate ids', () => {
  assert.equal(o.programStatus(prog('p', ['a', 'b'])), 'not_started');
  assert.equal(o.programStatus(prog('p', ['a', 'b'], ['a'])), 'in_progress');
  assert.equal(o.programStatus(prog('p', ['a', 'b'], ['a', 'b'])), 'complete');
  assert.equal(o.programStatus(prog('p', ['a', 'b'], ['gammal-id'])), 'not_started', 'a stale id from another version is not progress');
  assert.equal(o.completedCount(prog('p', ['a', 'b'], ['a', 'gammal-id'])), 1);
  assert.equal(o.completedCount(prog('p', ['a', 'b'], ['a', 'a'])), 1, 'one current step is counted once');
  assert.equal(o.programStatus(prog('empty', [], ['stale-id'])), 'empty');
  assert.deepEqual(['in_progress', 'not_started', 'empty', 'complete'].map(o.programStatusWord), ['Pågår', 'Ej påbörjad', 'Inga övningar', 'Klar']);
});

test('programs sort in progress first, then not started, then complete, keeping order within a group', () => {
  const list = [prog('done', ['a'], ['a']), prog('new1', ['a']), prog('going1', ['a', 'b'], ['a']), prog('new2', ['a']), prog('going2', ['a', 'b'], ['b'])];
  assert.deepEqual(o.sortPrograms(list).map((p) => p.id), ['going1', 'going2', 'new1', 'new2', 'done']);
  assert.deepEqual(list.map((p) => p.id), ['done', 'new1', 'going1', 'new2', 'going2'], 'input is not mutated');
  assert.deepEqual(o.sortPrograms([prog('done', ['a'], ['a']), prog('empty', []), prog('new', ['a'])]).map((p) => p.id), ['new', 'empty', 'done']);
});

test('all-complete requires at least one step and every listed program to have completed steps', () => {
  assert.equal(o.allProgramsComplete([]), false);
  assert.equal(o.allProgramsComplete([prog('empty', [])]), false);
  assert.equal(o.allProgramsComplete([prog('done', ['a'], ['a'])]), true);
  assert.equal(o.allProgramsComplete([prog('done', ['a'], ['a']), prog('empty', [])]), false);
  assert.equal(o.allProgramsComplete([prog('done', ['a'], ['a']), prog('stale', ['a'], ['old-version-id'])]), false);
});

test('the first incomplete step is current, later steps are upcoming, and completed steps after it stay done', () => {
  assert.deepEqual(o.stepStates(prog('p', ['a', 'b', 'c'], ['a'])), ['done', 'current', 'upcoming']);
  assert.deepEqual(o.stepStates(prog('p', ['a', 'b', 'c'], ['a', 'c'])), ['done', 'current', 'done'], 'unmarking an earlier step does not touch later ones');
  assert.deepEqual(o.stepStates(prog('p', ['a', 'b'], ['a', 'b'])), ['done', 'done']);
  assert.deepEqual(o.stepStates(prog('p', [])), []);
});

test('the next exercise continues a started program before starting a new one', () => {
  const list = [prog('new', ['n1', 'n2']), prog('going', ['g1', 'g2', 'g3'], ['g1', 'g2'])];
  assert.deepEqual(o.pickNextExercise(list), { programId: 'going', stepId: 'g3', number: 3, total: 3, kind: 'continue' });
});

test('Home uses the Training selector when an unstarted program comes first in source order', () => {
  const sourceOrder = [prog('new', ['n1', 'n2']), prog('going', ['g1', 'g2', 'g3'], ['g1'])];
  assert.deepEqual(o.pickNextExercise(sourceOrder), { programId: 'going', stepId: 'g2', number: 2, total: 3, kind: 'continue' });
  assert.match(workspace, /const nextExercise = pickNextExercise\(training\.programs\)/);
  assert.match(workspace, /program\.id === nextExercise\?\.programId/);
  assert.match(workspace, /step\.id === nextExercise\?\.stepId/);
});

test('with nothing started the first program starts at its first exercise', () => {
  assert.deepEqual(o.pickNextExercise([prog('a', ['a1', 'a2']), prog('b', ['b1'])]), { programId: 'a', stepId: 'a1', number: 1, total: 2, kind: 'start' });
});

test('the next exercise is the same step the sheet allows marking (first incomplete)', () => {
  const p = prog('p', ['a', 'b', 'c'], ['a', 'c']);
  assert.equal(o.pickNextExercise([p]).stepId, p.steps.find((s) => !p.completedStepIds.includes(s.id)).id);
});

test('next exercise skips completed and zero-step programs; no next exercise for an empty list or all-complete list', () => {
  assert.equal(o.pickNextExercise([prog('a', ['a1'], ['a1'])]), null);
  assert.equal(o.pickNextExercise([]), null);
  assert.equal(o.pickNextExercise([prog('empty', [])]), null);
  assert.equal(o.pickNextExercise([prog('empty', []), prog('available', ['a1'])]).programId, 'available');
});

test('exercise counts and progress labels use correct Swedish singular, plural, and empty-state copy', () => {
  assert.equal(o.exerciseCountLabel(1), '1 övning');
  assert.equal(o.exerciseCountLabel(5), '5 övningar');
  assert.equal(o.exerciseProgressLabel(prog('one', ['a'], ['a'])), '1 av 1 övning klar');
  assert.equal(o.exerciseProgressLabel(prog('many', ['a', 'b'], ['a'])), '1 av 2 övningar klara');
  assert.equal(o.exerciseProgressLabel(prog('empty', [])), 'Inga övningar');
});

test('the screen no longer has the three overlapping tabs and uses one vocabulary', () => {
  assert.doesNotMatch(screen, /Alla övningar'|Rekommenderat|<Tabs|HeroCard|programCards/);
  assert.doesNotMatch(screen, /steg klara|steg markerade/, 'steps are called exercises in the interface');
  assert.match(screen, /Nästa övning/);
  assert.match(screen, /Era program/);
  assert.match(screen, /label="Öva nu"/);
  assert.match(screen, /Nästa övning: \$\{step\.title\}/, 'the current action has an explicit accessible status');
  assert.match(screen, /Kommande övning: \$\{step\.title\}/, 'upcoming rows have an explicit accessible status');
  assert.match(screen, /Alla övningar är genomförda/);
  assert.match(screen, /Inga övningar tillgängliga ännu/);
});

test('safety-critical behavior is untouched: sheet, guarded completion, confirmed toasts, reset and review text', () => {
  assert.match(screen, /<BottomSheet visible=\{Boolean\(selectedProgram\)\}/);
  assert.match(screen, /disabled=\{Boolean\(busyStepKey\) \|\| nextStep\?\.id !== selectedStep\.id\}/, 'only the next step can be marked');
  assert.match(screen, /Börja med \{nextStep\?\.title\} innan du markerar den här övningen/);
  assert.match(screen, /Alert\.alert\('Börja om\?'/);
  assert.match(screen, /Markeringar i dessa övningsutkast sparas under den här visningen/);
  assert.match(screen, /if \(pending\.current \|\| busyStepKey/);
});

test('every program and exercise is reachable: overview opens a program, a program opens each exercise, sources stay available', () => {
  assert.match(screen, /onPress=\{\(\) => setOpenProgramId\(program\.id\)\}/);
  assert.match(screen, /<AppBar mode="Back" title=\{openProgram\.title\} onAction=\{\(\) => setOpenProgramId\(null\)\}/);
  assert.match(screen, /label="Om programmet och källor"/);
  assert.equal(screen.match(/setSelection\(\{ programId: program\.id, stepId: step\.id \}\)/g)?.length, 2, 'current card and every other row open the exercise');
});

test('progress is only reset from inside a program, behind the existing confirmation', () => {
  assert.equal(screen.match(/label="Börja om"/g)?.length, 1);
  assert.match(screen, /completedCount\(openProgram\) > 0 \? <Button variant="destructive" label="Börja om"/);
  assert.match(screen, /if \(completedCount\(program\) === 0\) return;/, 'a stale-only progress list cannot expose reset confirmation');
  assert.match(screen, /completedCount\(program\) \/ program\.steps\.length \* 100/);
  assert.match(screen, /label=\{exerciseProgressLabel\(openProgram\)\}/, 'a zero-step program does not show a misleading 0 of 0 progress label');
  assert.match(screen, /Övningarna visas här när de är färdiga/);
});
