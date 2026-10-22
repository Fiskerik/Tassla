import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFile } from 'node:fs/promises';

const resolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const { dailyProgressRingFill } = await import('../src/features/home/daily-activity-model.ts');
resolution.deregister();

const screen = await readFile(new URL('../src/features/home/DailyProgressScreen.tsx', import.meta.url), 'utf8');

test('progress ring fills monotonically through the half-way point and closes cleanly', () => {
  const cases = [
    [0, 5, 0, 0, 0],
    [1, 100, 0.01, 1, 0.2],
    [49, 100, 0.49, 58, 0.8],
    [50, 100, 0.5, 60, 0],
    [51, 100, 0.51, 61, 0.2],
    [99, 100, 0.99, 118, 0.8],
    [100, 100, 1, 120, 0],
  ];
  let previous = 0;
  for (const [completed, total, fraction, completeSegments, partialSegment] of cases) {
    const fill = dailyProgressRingFill(completed, total);
    assert.equal(fill.fraction, fraction, `${completed}/${total} fraction`);
    assert.equal(fill.completeSegments, completeSegments, `${completed}/${total} complete segments`);
    assert.ok(Math.abs(fill.partialSegment - partialSegment) < 1e-9, `${completed}/${total} partial segment`);
    const progress = fill.completeSegments + fill.partialSegment;
    assert.ok(progress >= previous, `${completed}/${total} cannot move backwards`);
    previous = progress;
  }
});

test('invalid ring inputs remain empty rather than producing NaN layout values', () => {
  for (const fill of [
    dailyProgressRingFill(0, 0),
    dailyProgressRingFill(2, -1),
    dailyProgressRingFill(Number.NaN, 5),
    dailyProgressRingFill(2, 5, 0),
  ]) {
    assert.deepEqual(fill, { fraction: 0, completeSegments: 0, partialSegment: 0 });
  }
});

test('ring and full list render from the same complete daily selector', () => {
  assert.match(screen, /const progress = selectDailyProgress\(activities, state\)/);
  assert.match(screen, /const readyWithActivities = progress\.coverage === 'complete'/);
  assert.match(screen, /<ProgressRing completed=\{progress\.completedCount\} total=\{progress\.totalCount\}/);
  assert.match(screen, /progress\.activities\.map\(/);
  assert.match(screen, /dailyProgressRingFill\(completed, total, segmentCount\)/);
  assert.match(screen, /testID="daily-progress-ring-segment"/);
  assert.doesNotMatch(screen, /revealY|ringHalfClip|Math\.cos\(fraction/);
});

test('loading, unknown, partial, error and empty states never present a 0/0 ring', () => {
  assert.match(screen, /progress\.coverage === 'loading'/);
  assert.match(screen, /progress\.coverage === 'error'/);
  assert.match(screen, /progress\.coverage === 'unknown' \|\| progress\.coverage === 'partial'/);
  assert.match(screen, /progress\.coverage === 'empty'/);
  assert.match(screen, /progress\.coverage === 'complete'/);
  assert.match(screen, /Hantera dagens aktiviteter/);
  assert.doesNotMatch(screen, /0 av 0|0\/0/);
});

test('completion note is factual and appears only when every selected activity is complete', () => {
  assert.match(screen, /progress\.completedCount === progress\.totalCount \? <View testID="daily-progress-complete-note"/);
  assert.match(screen, /{progress\.totalCount} \{progress\.totalCount === 1 \? 'aktivitet markerad' : 'aktiviteter markerade'\} som klara idag\./);
  assert.doesNotMatch(screen, /tryggare|bättre|duktig|weeklyGoal|veckans mål/i);
});

test('activities retain their real action source and no completion time is made up', () => {
  assert.match(screen, /onToggle=\{routineDay && item\.routineItemId \? \(\) => onSetRoutineCompletion/);
  assert.match(screen, /onOpen=\{item\.kind === 'training' && item\.programId && item\.stepId/);
  assert.match(screen, /onOpenTrainingStep\(item\.programId!, item\.stepId!\)/);
  assert.doesNotMatch(screen, /completedAt|completed_at|Veckans mål|format\(.*time/i);
});

test('training returns to Progress after opening the exact selected step', async () => {
  const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(workspace, /onOpenTrainingStep=\{\(programId, stepId\) => openHomeTrainingStep\(programId, stepId, 'progress'\)\}/);
  assert.match(workspace, /focus\.returnPage === 'progress' \? 'Tillbaka till Dagens framsteg'/);
});

test('progress portrait is the panel-specific standard image and ring has a useful size', async () => {
  const tokens = await readFile(new URL('../src/theme/tokens.ts', import.meta.url), 'utf8');
  assert.match(screen, /daily-progress-hero-puppy-terrier\.jpg/);
  assert.match(tokens, /homeProgressRingDiameter: 248, homeProgressRingStroke: 12/);
});
