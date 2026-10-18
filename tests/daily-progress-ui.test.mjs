import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { usesDailyActivitySnapshotForPage } from '../src/features/home/main-navigation.ts';

const screen = await readFile(new URL('../src/features/home/DailyProgressScreen.tsx', import.meta.url), 'utf8');
const home = await readFile(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const navigation = await readFile(new URL('../src/features/home/main-navigation.ts', import.meta.url), 'utf8');
const model = await readFile(new URL('../src/features/home/daily-activity-model.ts', import.meta.url), 'utf8');
const fixture = await readFile(new URL('../tools/visual-check/app.tsx', import.meta.url), 'utf8');

test('Home opens the separate daily progress route and keeps the checklist entry', () => {
  assert.match(home, /testID="home-open-daily-progress"/);
  assert.match(home, /onGo\('daily-progress'\)/);
  assert.match(home, /Visa dagens checklista/);
  assert.match(workspace, /page === 'daily-progress'/);
  assert.match(workspace, /usesDailyActivitySnapshotForPage\(page\)/);
  assert.match(navigation, /page === 'checklist' \|\| page === 'daily-progress'/);
  assert.match(workspace, /<AppScreen scrollKey=\{page\}/);
});

test('R6 uses the same Home activity snapshot, date, state and write/retry handlers', () => {
  assert.match(workspace, /state=\{dailyStateForView\} refreshing=\{dailyRefreshing\} refreshError=\{dailyRefreshError\} activities=\{dailyActivities\}/);
  assert.match(workspace, /onSetRoutineCompletion=\{dailyManagerActions\.onSetRoutineCompletion\}/);
  assert.match(workspace, /onRetryMutation=\{\(\) => retryDailyMutation\('home'\)\}/);
  assert.match(workspace, /returnPage: 'daily-progress'/);
  assert.match(workspace, /returnPage === 'daily-progress' \? 'daily-progress'/);
});

test('progress ring, count, list and status copy derive from the same confirmed activities', () => {
  assert.match(screen, /const RING_SIZE = 220;/);
  assert.match(screen, /const RING_RADIUS = 100;/);
  assert.match(screen, /import Svg, \{ Circle \} from 'react-native-svg';/);
  assert.match(screen, /const RING_STROKE_WIDTH = 12;/);
  assert.match(screen, /const RING_CIRCUMFERENCE = 2 \* Math\.PI \* RING_RADIUS;/);
  assert.match(screen, /strokeDasharray=\{completedArcDegrees >= 360 \? undefined : \[completedArcLength, RING_CIRCUMFERENCE - completedArcLength\]\}/);
  assert.match(screen, /strokeDasharray=\{\[unknownArcLength, RING_CIRCUMFERENCE - unknownArcLength\]\}/);
  assert.match(screen, /ringSvg: \{ position: 'absolute', left: 0, top: 0 \}/);
  assert.doesNotMatch(screen, /RING_SEGMENT_COUNT|ringSegmentDone|ringSegmentUnknown/);
  assert.match(screen, /dogName \+ ', ' \+ dateLabel \+ ': ' \+ label/);
  assert.doesNotMatch(screen, /<Text style=\{styles\.scope\}/);
  assert.doesNotMatch(screen, /<Card[^>]*>\s*<ProgressRing/);
  assert.match(screen, /style=\{styles\.warmSummarySurface\}/);
  assert.match(screen, /summarizeDailyActivityProgress\(activities\)/);
  assert.match(screen, /dailyActivityProgressLabel\(progress\)/);
  assert.match(screen, /completed \/ confirmed/);
  assert.match(screen, /accessibilityValue=\{hasAccessibleProgressValue \? \{ min: 0, max: confirmed, now: completed \}/);
  assert.match(screen, /accessibilityRole=\{hasAccessibleProgressValue \? 'progressbar'/);
  assert.match(screen, /const unknownArcDegrees = unavailable > 0/);
  assert.match(screen, /const unknownGapDegrees = unavailable > 0/);
  assert.match(screen, /const confirmedArcDegrees = 360 - unknownArcDegrees - unknownGapDegrees/);
  assert.match(screen, /confirmed > 0 && unavailable === 0 && !stale/);
  assert.match(screen, /state === 'loading'/);
  assert.match(screen, /state === 'error'/);
  assert.match(screen, /state === 'ready'/);
  assert.match(screen, /refreshError && state === 'ready'/);
  assert.match(screen, /stale=\{refreshError\}/);
  assert.match(screen, /const completedArcDegrees = stale \? 0/);
  assert.match(screen, /Senast bekräftat/);
  assert.match(screen, /status kan inte bekräftas/i);
  assert.doesNotMatch(screen, /completed_at/);
  assert.match(screen, /styles\.trainingStatusDone/);
  assert.match(screen, /testID="daily-progress-training-status"/);
  assert.match(screen, /trainingStatusDone: \{ borderColor: tokens\.colors\.home\.greenStrong, backgroundColor: tokens\.colors\.home\.greenStrong \}/);
  assert.match(screen, /checkboxTap: \{ width: tokens\.size\.touchMin, minHeight: tokens\.size\.touchMin/);
  assert.match(model, /completedAt: completed \? stamp\?\.completedAt : undefined/);
});

test('synthetic public/review fixture can render and navigate the same R6 screen', () => {
  assert.match(fixture, /DailyProgressScreen/);
  assert.match(fixture, /page==='daily-progress'/);
  assert.match(fixture, /activities=\{visibleRoutineActivities\}/);
  assert.match(fixture, /returnPage:'daily-progress'/);
  assert.match(fixture, /homeScenario==='progress-full'/);
  assert.match(fixture, /homeScenario==='progress-unknown-full'/);
  assert.match(fixture, /homeScenario.startsWith\('progress-'\)/);
});


test('daily snapshot refresh stays active on Home-derived routes', () => {
  for (const page of ['home', 'checklist', 'training', 'daily-progress']) assert.equal(usesDailyActivitySnapshotForPage(page), true);
  for (const page of ['log', 'knowledge', 'more']) assert.equal(usesDailyActivitySnapshotForPage(page), false);
  assert.equal((workspace.match(/usesDailyActivitySnapshotForPage\(page\)/g) ?? []).length, 3);
});
