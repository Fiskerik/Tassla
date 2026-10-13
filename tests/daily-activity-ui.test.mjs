import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const home = await readFile(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const model = await readFile(new URL('../src/features/home/daily-activity-model.ts', import.meta.url), 'utf8');
const item = await readFile(new URL('../src/components/ui/DailyActivityItem.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');

test('Home derives full list and confirmed ratio from one daily activity array with a five-row presentation cap', () => {
  assert.match(home, /activities\.filter\(\(item\) => item\.completed\)\.length/);
  assert.match(home, /activities\.length > 0 \? <Text[^>]*>\{completedCount\} av \{activities\.length\} klara/);
  assert.match(home, /activities\.slice\(0, 5\)/);
  assert.match(home, /activities\.length > 5/);
  assert.match(home, /Visa alla/);
  assert.match(home, /activities\.length === 0 \? <Text/);
  assert.match(home, /accessibilityRole="progressbar"/);
  assert.match(home, /dailyProgressFill/);
  assert.match(home, /Hantera egna rutiner/);
  assert.match(home, /Välj träningssteg för idag/);
  assert.match(home, /DailyActivitiesSection key=\{dailyScopeKey \?\? `\$\{dog\.id\}:\$\{dailyDateKey\}`\}/);
  assert.match(workspace, /dailyStateLifetime === currentDailyLifetime/);
  assert.match(workspace, /dailySnapshotLifetime === currentDailyLifetime/);
});

test('only owner routines can toggle locally displayed completion; training completion opens saved training flow', () => {
  assert.match(home, /item\.kind === 'routine' && item\.routineDay \? \(\) => onSetRoutineCompletion/);
  assert.match(home, /item\.kind === 'training' \? onGoTraining/);
  assert.match(home, /onRemoveTrainingFromDay/);
  assert.match(item, /accessibilityRole="checkbox"/);
  assert.match(item, /accessibilityState=\{\{ checked: completed, disabled: !onToggle \}\}/);
  assert.match(workspace, /setRoutineDayCompletion\(client, row, completed\)/);
  assert.match(workspace, /status === 'unknown'[\s\S]*?Ingen ny bock visas/);
});

test('activity derivation excludes unrelated log, guide, health plan and checklist data', () => {
  assert.match(model, /snapshot\.routineDays/);
  assert.match(model, /snapshot\.trainingSelections/);
  assert.doesNotMatch(model, /dog_events|planned_health|checklist|content_open/i);
  assert.match(model, /programById\.get\(row\.program_version_id\)/);
  assert.match(model, /program\?\.steps\.find/);
});
