import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/home/DailyChecklistScreen.tsx', import.meta.url), 'utf8');

test('Checklist shows every activity and keeps loading, read error and empty distinct', () => {
  assert.match(screen, /visibleState === 'loading'/);
  assert.match(screen, /visibleState === 'error'/);
  assert.match(screen, /visibleState === 'ready' && visibleActivities\.length === 0/);
  assert.match(screen, /showingToday && state === 'ready' && activities\.length > 0/);
  assert.match(screen, /activities\.map\(/);
  assert.match(screen, /groupActivitiesByDate\(rangeActivities\)\.map\(/);
  assert.match(screen, /Checklistan kunde inte hämtas/);
  assert.match(screen, /Inga aktiviteter idag/);
  const emptyState = screen.slice(screen.indexOf("visibleState === 'ready' && visibleActivities.length === 0"), screen.indexOf("showingToday && state === 'ready' && activities.length > 0"));
  assert.doesNotMatch(emptyState, /0 av 0|daily-checklist-progress|progressTrack|completedCount/);
});

test('Checklist count and progress use confirmed, non-skipped activity state only', () => {
  assert.match(screen, /const completedCount = visibleActivities\.filter\(\(activity\) => activity\.completed && !activity\.skipped\)\.length/);
  assert.match(screen, /completedCount\} av \{activities\.length\} klara/);
  assert.match(screen, /accessibilityValue=\{\{ min: 0, max: activities\.length, now: completedCount \}\}/);
  assert.match(screen, /onToggle=\{routineDay \? \(\) => item\.routineItemId && onSetRoutineCompletion/);
  assert.match(screen, /onOpenTrainingStep\?\.\(item\.programId!, item\.stepId!, 'checklist'\)/);
});

test('Checklist local date label is calendar-based and does not shift across device timezones', () => {
  assert.match(screen, /Date\.UTC\(Number\(match\[1\]\), Number\(match\[2\]\) - 1, Number\(match\[3\]\), 12\)/);
  assert.match(screen, /timeZone: 'UTC'/);
});
