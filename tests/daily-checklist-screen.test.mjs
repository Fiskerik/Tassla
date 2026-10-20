import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/home/DailyChecklistScreen.tsx', import.meta.url), 'utf8');

test('Checklist shows every activity and keeps loading, read error and empty distinct', () => {
  assert.match(screen, /state === 'loading'/);
  assert.match(screen, /state === 'error'/);
  assert.match(screen, /state === 'ready' && activities\.length === 0/);
  assert.match(screen, /state === 'ready' && activities\.length > 0/);
  assert.match(screen, /activities\.map\(/);
  assert.match(screen, /Dagens checklista kunde inte hämtas/);
  assert.match(screen, /Inga aktiviteter idag/);
  const emptyState = screen.slice(screen.indexOf("state === 'ready' && activities.length === 0"), screen.indexOf("state === 'ready' && activities.length > 0"));
  assert.doesNotMatch(emptyState, /0 av 0|daily-checklist-progress|progressTrack|completedCount/);
});

test('Checklist count and progress use confirmed activity state only', () => {
  assert.match(screen, /const completedCount = activities\.filter\(\(activity\) => activity\.completed\)\.length/);
  assert.match(screen, /completedCount\} av \{activities\.length\} klara/);
  assert.match(screen, /accessibilityValue=\{\{ min: 0, max: activities\.length, now: completedCount \}\}/);
  assert.match(screen, /onToggle=\{routineDay \? \(\) => item\.routineItemId && onSetRoutineCompletion/);
  assert.match(screen, /onOpenTrainingStep\?\.\(item\.programId!, item\.stepId!, 'checklist'\)/);
});

test('Checklist local date label is calendar-based and does not shift across device timezones', () => {
  assert.match(screen, /Date\.UTC\(Number\(match\[1\]\), Number\(match\[2\]\) - 1, Number\(match\[3\]\), 12\)/);
  assert.match(screen, /timeZone: 'UTC'/);
});
