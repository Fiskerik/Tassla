import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/training/PublishedTrainingScreen.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/data/workspace-data.ts', import.meta.url), 'utf8');
const model = await readFile(new URL('../src/features/training/training-overview.ts', import.meta.url), 'utf8');

test('Training tabs expose selected state and have their own rendered destinations', () => {
  assert.match(screen, /<Tabs items=\{\['Rekommenderat', 'Alla övningar', 'Mina'\]\}/);
  assert.match(screen, /accessibilityLabel="Träningsvyer"/);
  assert.match(screen, /if \(label === 'Rekommenderat'\) setSelectedView\('recommended'\)/);
  assert.match(screen, /else if \(label === 'Alla övningar'\) setSelectedView\('all'\)/);
  assert.match(screen, /else if \(label === 'Mina'\) setSelectedView\('mine'\)/);
  assert.match(screen, /testID="training-recommended-view"/);
  assert.match(screen, /testID="training-all-view"/);
  assert.match(screen, /testID="training-mine-view"/);
});

test('a recommendation is tied to the exact published age-and-breed-selected version', () => {
  assert.match(workspace, /currentAgeBreedMatch: currentAgeAndBreedIds\.has\(row\.id\)/);
  assert.match(model, /program\.currentAgeBreedMatch === true/);
  assert.match(model, /programStatus\(program\) === 'not_started'/);
  assert.match(screen, /const ageMatchedPrograms = recommendedPrograms\(visiblePrograms\)/);
});

test('continuation is a single exact action for an incomplete saved step', () => {
  assert.match(screen, /nextExercise\?\.kind === 'continue'/);
  assert.match(screen, /setSelection\(\{ programId: continuationProgram\.id, stepId: continuationStep\.id \}\)/);
  assert.match(screen, /exerciseProgressLabel\(continuationProgram\)/);
});

test('paused older versions do not also show an empty-state claim', () => {
  assert.match(screen, /paused\.filter\(\(item\) => item\.title !== null\)\.map\(\(item\)/);
  assert.match(screen, /item\.title\}\{item\.versionNumber === null \? '' : ` · version \$\{item\.versionNumber\}`\} · pausad/);
  assert.match(screen, /training-unavailable-progress/);
  assert.match(screen, /minePrograms\.length === 0 && paused\.length === 0/);
});

test('recommendation photos retain generic assets without temporary badges and unsupported metadata is absent', () => {
  assert.doesNotMatch(screen, /Standardbild|standardBadge/);
  assert.match(screen, /training-hero-shiba-park\.jpg/);
  assert.match(screen, /training-recommendation-puppy-black-tan-park\.jpg/);
  assert.doesNotMatch(screen, /5 min|10 min|Grundträning|Socialisering/);
});


test('journey is the primary progression path and legacy activity marking is disclosed', () => {
  assert.match(screen, /renderJourneyOverview\(openProgram\)/);
  assert.match(screen, /Aktivitetsmarkeringar i programmet/);
  assert.match(screen, /legacyActivityOpen \? selectedProgram\?\.completedStepIds\.includes\(selectedStep\.id\)/);
  assert.match(screen, /progression\.journeys\.find\(\(journey\) => journey\.program_version_id === selectedProgram\.id\)\?\.state === 'paused'/);
  assert.match(screen, /<Progress value=\{program\.steps\.length > 0 \? journeyProgress\.confirmedMilestones \/ program\.steps\.length \* 100 : 0\}/);
  assert.match(screen, /journeyStepProgressLabel\(journeyProgress\.confirmedMilestones, program\.steps\.length\)/);
  assert.match(screen, /journeySessionCountLabel\(journeyProgress\.loggedSessions\)/);
});

test('saved start, next, and back wait for fresh progression props before opening the active step', () => {
  assert.match(screen, /const awaitRefresh = action\.kind === 'start_or_resume' \|\| action\.kind === 'next' \|\| action\.kind === 'back'/);
  assert.match(screen, /Ändringen är sparad\. Hämtar det aktiva steget\./);
  assert.match(screen, /setSelection\(\{ programId: waiting\.programId, stepId: journey\.active_step_id \}\)/);
  assert.match(screen, /onRetryProgression/);
});


test('session feedback is concise and only the latest positive pass offers an explicit milestone confirmation', () => {
  assert.match(screen, /\['worked_as_planned', 'Gick som planerat'/);
  assert.match(screen, /\['practice_more', 'Vi fortsätter öva'/);
  assert.match(screen, /\['paused_early', 'Vi avslutade tidigare'/);
  assert.match(screen, /accessibilityRole="radio"/);
  assert.match(screen, /Spara pass/);
  assert.match(screen, /progressionMessage\?\.programId === program\.id \? <Text accessibilityLiveRegion="polite" style=\{styles\.progressionMessage\}/);
  assert.match(screen, /case 'record_session': return 'Träningspasset är loggat\.'/);
  assert.match(screen, /lastPassWentWell && view\.canConfirmStep/);
  assert.match(screen, /testID="training-milestone-ready"/);
  assert.match(screen, /Bekräfta delmålet om övningens mål känns uppnått/);
  assert.match(screen, /if \(value\) setSuccessMessage\(''\)/);
  assert.match(screen, /selectedStep && !feedbackPickerOpen && !selectedJourneyView\?\.journey \? <View style=\{styles\.legacySection\}/);
  assert.doesNotMatch(screen, /Spara återkopplingen för träningspasset/);
  assert.doesNotMatch(screen, /label="Avbryt"/);
});

test('a journey has no pause or maintenance controls and only paused journeys offer resume', () => {
  assert.match(screen, /view\.canStartOrResume \? <>[\s\S]*?Återupptas vid: \{view\.activeStepTitle\}\.[\s\S]*?<Button label="Fortsätt med nästa övning"/);
  assert.match(screen, /journeyView\?\.journey && !journeyView\.canLogSession \? 'Visa övning' : 'Öva nu'/);
  assert.doesNotMatch(screen, /label="Pausa träningsresan"/);
  assert.doesNotMatch(screen, /label="Sätt träningsresan i underhåll"/);
  assert.doesNotMatch(screen, /label="Pausa"/);
  assert.doesNotMatch(screen, /label="Underhåll"/);
});

test('open feedback has no competing milestone or step navigation action', () => {
  assert.match(screen, /!feedbackPickerOpen \? <View style=\{styles\.journeyActions\}>/);
});

test('confirmed exercise status is concise, confirmation does not duplicate a success toast, and next is primary', () => {
  assert.match(screen, /accessibilityLabel="Delmål markerat som klart"/);
  assert.match(screen, /styles\.confirmedMilestone\}>Klart<\/Text>/);
  assert.match(screen, /accessibilityLabel=\{`Ångra färdigmarkering för \$\{selectedStep\?\.title \?\? stepId\}`\}/);
  assert.match(screen, /styles\.undoLabel\}>Ångra<\/Text>/);
  assert.match(screen, /setSuccessMessage\(action\.kind === 'confirm_step' \? '' : confirmation\)/);
  assert.match(screen, /setSuccessMessage\(action\?\.kind === 'confirm_step' \? '' : progressionRetrySuccessMessage\(action\)\)/);
  assert.match(screen, /journeyActions: \{ flexDirection: 'column', alignItems: 'stretch'/);
  assert.match(screen, /accessibilityLabel="Fortsätt till nästa träningssteg"[\s\S]*?styles\.journeyNextText\}>Nästa<\/Text>/);
  assert.match(screen, /journeyPreviousAction: \{ minHeight: tokens\.size\.touchMin/);
  assert.match(screen, /accessibilityLabel="Backa till föregående träningssteg"[\s\S]*?styles\.journeyPreviousText\}>Föregående<\/Text>/);
  assert.match(screen, /testID="training-exercise-banner"/);
  assert.match(screen, /testID="training-exercise-step-position" style=\{styles\.timelineStatus\}>Steg/);
  assert.match(screen, /label=\{journeyStepProgressLabel\(selectedJourneyData\.milestones\.length, selectedProgram\.steps\.length\)\}/);
  assert.match(screen, /testID="training-ai-origin"/);
  assert.match(screen, /!selectedStep \? <Text style=\{styles\.note\}>Anpassa efter din hund och pausa när det behövs\.<\/Text>/);
  assert.match(screen, /progressionMessage\?\.programId === program\.id \? <Text accessibilityLiveRegion="polite" style=\{styles\.progressionMessage\}/);
});
