import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/home/DailyChecklistScreen.tsx', import.meta.url), 'utf8');

test('Checklist shows every activity and keeps loading, read error and empty distinct', () => {
  assert.match(screen, /activeState === 'loading'/);
  assert.match(screen, /activeState === 'error'/);
  assert.match(screen, /state === 'ready' && activities\.length === 0/);
  assert.match(screen, /state === 'ready' && activities\.length > 0/);
  assert.match(screen, /checklistActivities\.map\(renderTodayActivity\)/);
  assert.match(screen, /trainingActivities\.map\(renderTodayActivity\)/);
  assert.match(screen, /Dagens checklista kunde inte hämtas/);
  assert.match(screen, /Inga aktiviteter idag/);
  const emptyState = screen.slice(screen.indexOf("state === 'ready' && activities.length === 0"), screen.indexOf("state === 'ready' && activities.length > 0"));
  assert.doesNotMatch(emptyState, /0 av 0|daily-checklist-progress|progressTrack|completedCount/);
});

test('Checklist and training are separate sections with independent routine-only count and progress', () => {
  assert.match(screen, /const checklistActivities = activities\.filter\(\(activity\) => activity\.kind === 'routine'\)/);
  assert.match(screen, /const trainingActivities = activities\.filter\(\(activity\) => activity\.kind === 'training'\)/);
  assert.match(screen, /const completedCount = checklistActivities\.filter\(\(activity\) => activity\.completed\)\.length/);
  assert.match(screen, /Idag · \$\{completedCount\} av \$\{checklistActivities\.length\} klara/);
  assert.match(screen, /accessibilityLabel=\{`\$\{completedCount\} av \$\{checklistActivities\.length\} checklistepunkter klara`\}/);
  assert.match(screen, /accessibilityValue=\{\{ min: 0, max: checklistActivities\.length, now: completedCount \}\}/);
  assert.match(screen, /accessibilityLabel="Dagens checklista"/);
  assert.match(screen, /accessibilityLabel="Träningsprogram"/);
  assert.match(screen, /checklistActivities\.length > 0 \? <>/);
  assert.match(screen, /checklistActivities\.length > 0 \? `Idag · \$\{completedCount\} av \$\{checklistActivities\.length\} klara` : 'Idag'/);
  assert.match(screen, /onToggle=\{routineDay \? \(\) => item\.routineItemId && onSetRoutineCompletion/);
  assert.match(screen, /onOpenTrainingStep\?\.\(item\.programId!, item\.stepId!, 'checklist', true\)/);
  const trainingRender = screen.slice(screen.indexOf('function renderTodayActivity'), screen.indexOf('return <View testID="daily-checklist-screen"'));
  assert.match(trainingRender, /item\.kind === 'training' && item\.programId && item\.stepId/);
  assert.match(trainingRender, /onToggle=\{routineDay \?/);
});

test('Checklist detail rows carry item icon and optional copy, with long-press limited to today routines', () => {
  const todayRender = screen.slice(screen.indexOf('function renderTodayActivity'), screen.indexOf('return <View testID="daily-checklist-screen"'));
  assert.match(todayRender, /presentation="detail"/);
  assert.match(todayRender, /icon=\{item\.icon\} description=\{item\.description\}/);
  assert.match(todayRender, /onLongPress=\{item\.kind === 'routine' && routineDay && item\.routineItemId[\s\S]*?openManager\(routineDay\.routine_id, false, item\.routineItemId/);
  const rangeRender = screen.slice(screen.indexOf("filter !== 'Idag' && rangeState === 'ready' && activities.length > 0"), screen.indexOf('<DailyActivityManagerSheet'));
  assert.match(rangeRender, /presentation="detail"[\s\S]*?readOnly/);
  assert.doesNotMatch(rangeRender, /onLongPress|focusChecklistItemId/);
  assert.match(screen, /focusChecklistItemId=\{focusChecklistItemId\}/);
});

test('range filters group read-only activity, distinguish partial reads and exclude daily progress controls', () => {
  assert.match(screen, /const filterTabs = filter === 'Idag' \? \['Idag', 'Denna vecka', 'Alla'\] : \['Idag', 'Denna vecka', 'Alla', 'Kommande'\]/);
  assert.match(screen, /variant="rev02-segmented-strong"/);
  assert.match(screen, /Senaste 30 dagarna/);
  assert.match(screen, /Planerat, inte utfört/);
  assert.match(screen, /rangeFailedSources\.length > 0/);
  assert.match(screen, /checklistDateLabel\(groupDate\)/);
  assert.match(screen, /readOnly statusLabel/);
  const rangeRows = screen.slice(screen.indexOf("filter !== 'Idag' && rangeState === 'ready' && activities.length > 0"), screen.indexOf('<DailyActivityManagerSheet'));
  assert.doesNotMatch(rangeRows, /daily-checklist-progress|completedCount|progressTrack|accessibilityRole="checkbox"/);
});

test('Idag separates a compact upcoming preview from the four-scope Kommande view', () => {
  const previewStart = screen.indexOf('filter === \'Idag\' ? <Card variant="home" accessibilityLabel="Kommande, 7 dagar">');
  const previewEnd = screen.indexOf('<DailyActivityManagerSheet', previewStart);
  assert.notEqual(previewStart, -1);
  assert.notEqual(previewEnd, -1);
  const preview = screen.slice(previewStart, previewEnd);
  assert.ok(previewStart < screen.indexOf('accessibilityLabel="Träningsprogram"'), 'the upcoming card appears before same-day training so it is visible in the reference composition');
  assert.match(preview, /<View style=\{styles\.previewHeading\}>[\s\S]*?<Text style=\{styles\.previewTitle\} accessibilityRole="header">Kommande, 7 dagar<\/Text>[\s\S]*?<Button variant="tertiary" label="Visa alla" accessibilityLabel="Visa alla kommande aktiviteter"/);
  assert.match(screen, /previewHeading: \{[^}]*flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'/);
  assert.match(preview, /upcomingPreviewState === 'idle' \|\| upcomingPreviewState === 'loading'/);
  assert.match(preview, /upcomingPreviewState === 'error'/);
  assert.match(preview, /upcomingPreviewFailedSources\.length > 0/);
  assert.match(screen, /const visiblePreviewActivities = upcomingPreviewFailedSources\.length > 0 \? previewActivities\.slice\(0, 1\) : previewActivities/);
  assert.match(preview, /visiblePreviewActivities\.map/);
  assert.match(preview, /Inget planerat de närmaste sju dagarna/);
  assert.match(screen, /const previewActivities = upcomingPreviewActivities\.filter\(\(activity\) => activity\.planned[\s\S]*?activity\.kind === 'routine' \|\| activity\.kind === 'health'\)\)\.slice\(0, 3\)/);
  assert.match(preview, /testID=\{`upcoming-preview-row-\$\{item\.id\}`\}/);
  assert.match(preview, /presentation="preview"[\s\S]*?detail=\{checklistDateLabel\(item\.dateKey \?\? dateKey\)\}[\s\S]*?statusLabel="Planerad" readOnly/);
  assert.match(screen, /activity\.planned[\s\S]*?activity\.kind === 'routine' \|\| activity\.kind === 'health'/);
  assert.match(preview, /category=\{item\.kind === 'health' \? item\.healthType === 'vet_visit' \? 'veterinary' : 'vaccination' : undefined\}/);
  assert.doesNotMatch(preview, /accessibilityRole="checkbox"|onToggle|daily-checklist-progress|completedCount/);
  assert.match(screen, /onRetryUpcomingPreview\?: \(\) => void/);
  assert.match(preview, /onRetryUpcomingPreview \?/);
});

test('Checklist local date label is calendar-based and does not shift across device timezones', () => {
  assert.match(screen, /Date\.UTC\(Number\(match\[1\]\), Number\(match\[2\]\) - 1, Number\(match\[3\]\), 12\)/);
  assert.match(screen, /timeZone: 'UTC'/);
});
