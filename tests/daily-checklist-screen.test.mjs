import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/home/DailyChecklistScreen.tsx', import.meta.url), 'utf8');

test('Checklist shows every activity and keeps loading, read error and empty distinct', () => {
  assert.match(screen, /title="Checklistor"/);
  assert.match(screen, /state === 'loading'/);
  assert.match(screen, /state === 'error'/);
  assert.match(screen, /state === 'ready' && activities\.length === 0/);
  assert.match(screen, /state === 'ready' && activities\.length > 0/);
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

test('Checklist separates routine tap, longpress edit and checkbox actions', () => {
  assert.match(screen, /function openManager\(routineId: string \| null = null, editFocusedRoutine = false, routineItemId: string \| null = null, upcomingOnly = false\)/);
  assert.match(screen, /onOpen=\{item\.kind === 'training'[\s\S]*?openManager\(routineDay\?\.routine_id \?\? null\)/);
  assert.match(screen, /onLongPress=\{item\.kind === 'routine' && routineDay\?\.routine_id[\s\S]*?openManager\(routineDay\.routine_id, true, item\.routineItemId \?\? null\)/);
  assert.match(screen, /accessibilityHint=\{item\.kind === 'routine' && routineDay\?\.routine_id \? 'Håll inne på en rutinpunkt för att öppna redigeringen\.'/);
  assert.match(screen, /editFocusedRoutineOnOpen=\{editFocusedRoutineOnOpen\}/);
  assert.match(screen, /focusRoutineItemId=\{focusRoutineItemId\}/);
  assert.match(screen, /onClose=\{closeManager\}/);
  assert.match(screen, /Håll inne på en rutinpunkt för att öppna redigeringen\./);
});

test('Kommande is read-only, date-grouped and opens exact routine, health and historical training sources', () => {
  assert.match(screen, /CHECKLIST_FILTERS: readonly ChecklistFilter\[\] = \['Idag', 'Denna vecka', 'Alla', 'Kommande'\]/);
  assert.match(screen, /Planerat, inte utfört/);
  assert.match(screen, /Inget planerat den närmaste veckan/);
  assert.match(screen, /item\.planned \? null : onToggle/);
  assert.match(screen, /onOpenUpcomingRoutine\(routineId, activityDate\)/);
  assert.match(screen, /item\.planned && item\.healthPlanId \? \(\) => onOpenPlannedHealth/);
  assert.match(screen, /onOpenHistoricalTrainingStep\?\.\(item\.programId!, item\.stepId!\)/);
  assert.match(screen, /status = pending \? 'Sparar…' : item\.planned \? 'Planerad'/);
});

test('leaving Kommande invalidates an in-flight routine lookup before it can open a stale source', () => {
  assert.match(screen, /const upcomingRoutineRequest = useRef\(0\)/);
  assert.match(screen, /const request = \+\+upcomingRoutineRequest\.current/);
  assert.match(screen, /request !== upcomingRoutineRequest\.current \|\| filter !== 'Kommande'/);
  assert.match(screen, /upcomingRoutineRequest\.current \+= 1;[\s\S]*onChangeFilter\(value\)/);
  assert.match(screen, /useEffect\(\(\) => \(\) => \{ upcomingRoutineRequest\.current \+= 1; \}, \[\]\)/);
});

test('Checklist local date label is calendar-based and does not shift across device timezones', () => {
  assert.match(screen, /Date\.UTC\(Number\(match\[1\]\), Number\(match\[2\]\) - 1, Number\(match\[3\]\), 12\)/);
  assert.match(screen, /timeZone: 'UTC'/);
});
