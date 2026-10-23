import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const o = await import('../src/features/training/training-overview.ts');
const screen = readFileSync(path.join(process.cwd(), 'src/features/training/PublishedTrainingScreen.tsx'), 'utf8');
const prog = (id, steps, done = [], currentAgeBreedMatch = false) => ({ id, steps: steps.map((s) => ({ id: s })), completedStepIds: done, currentAgeBreedMatch });

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

test('recommendations contain only exact age/breed-selected versions with a real next exercise', () => {
  const list = [prog('resumable-old-version', ['a', 'b'], ['a'], false), prog('current', ['a', 'b'], [], true), prog('complete', ['a'], ['a'], true), prog('empty', [], [], true)];
  assert.deepEqual(o.recommendedPrograms(list), [list[1]], 'completed, empty, and resumable-but-not-current versions are omitted');
});

test('Mina contains only versions with valid confirmed progress', () => {
  const list = [prog('new', ['a']), prog('mine', ['a', 'b'], ['a']), prog('stale', ['a'], ['old-version-id']), prog('complete', ['a'], ['a'])];
  assert.deepEqual(o.programsWithProgress(list).map((program) => program.id), ['mine', 'complete']);
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

test('the screen presents the three target views with distinct, honest source semantics', () => {
  assert.match(screen, /Rekommenderat/);
  assert.match(screen, /Alla övningar/);
  assert.match(screen, /Mina/);
  assert.match(screen, /currentAgeBreedMatch/);
  assert.match(screen, /Fortsätt där ni var/);
  assert.match(screen, /Standardbild/);
  assert.doesNotMatch(screen, /5 min|10 min|Grundträning|Socialisering/,
    'the workspace has no reviewed duration or topic metadata');
  assert.doesNotMatch(screen, /steg klara|steg markerade/, 'steps are called exercises in the interface');
  assert.match(screen, /Alla övningar/);
  assert.match(screen, /Mina program/);
  assert.match(screen, /label="Öva nu"/);
  assert.match(screen, /Nästa övning: \$\{step\.title\}/, 'the current action has an explicit accessible status');
  assert.match(screen, /Kommande övning: \$\{step\.title\}/, 'upcoming rows have an explicit accessible status');
  assert.match(screen, /Ni har gått igenom allt just nu/);
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
  assert.equal(screen.match(/setSelection\(\{ programId: program\.id, stepId: step\.id \}\)/g)?.length, 3,
    'recommendation card, current exercise card, and upcoming rows open their exact exercise');
});

test('recommendation card opens its exact next exercise and full list remains separately reachable', () => {
  assert.match(screen, /setSelection\(\{ programId: program\.id, stepId: step\.id \}\)/);
  assert.match(screen, /setSelectedView\('all'\)/);
  assert.match(screen, /nextExercise\?\.kind === 'continue'/);
});

test('progress is only reset from inside a program, behind the existing confirmation', () => {
  assert.equal(screen.match(/label="Börja om"/g)?.length, 1);
  assert.match(screen, /completedCount\(openProgram\) > 0 \? <Button variant="destructive" label="Börja om"/);
  assert.match(screen, /if \(completedCount\(program\) === 0\) return;/, 'a stale-only progress list cannot expose reset confirmation');
  assert.match(screen, /completedCount\(program\) \/ program\.steps\.length \* 100/);
  assert.match(screen, /label=\{exerciseProgressLabel\(openProgram\)\}/, 'a zero-step program does not show a misleading 0 of 0 progress label');
  assert.match(screen, /Övningarna visas här när de är färdiga/);
});
