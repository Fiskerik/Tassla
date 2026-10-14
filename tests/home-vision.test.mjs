import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');
const home = source('../src/features/home/HomeScreen.tsx');
const workspace = source('../src/features/home/ProductWorkspace.tsx');
const harness = source('../tools/visual-check/app.tsx');
const activityItem = source('../src/components/ui/DailyActivityItem.tsx');
const destinationTile = source('../src/components/ui/DestinationTile.tsx');
const gallery = source('../src/components/ui/ComponentGalleryScreen.tsx');
const tokens = source('../src/theme/tokens.ts');
const manager = source('../src/features/home/DailyActivityManagerSheet.tsx');

test('Home follows the rev02 content order without duplicate Today groups', () => {
  assert.match(home, /homeGreetingAt\(new Date\(\)\)/);
  assert.match(home, /Just nu med \{dog\.name\}/);
  assert.match(home, /Dagens att göra/);
  assert.match(home, /dailyActivities\.slice\(0, 5\)/);
  assert.match(home, /DestinationTile destination="log" compact variant="home"/);
  assert.match(home, /DestinationTile destination="training" compact variant="home"/);
  assert.match(home, /DestinationTile destination="knowledge" compact variant="home"/);
  for (const removedHeading of ['Idag', 'Loggat idag', 'Nästa träningssteg', 'Planerat idag', 'Vad vill du göra nu?']) {
    if (removedHeading === 'Vad vill du göra nu?') assert.match(home, /Vad vill du göra nu\?/);
    else assert.doesNotMatch(home, new RegExp(`>${removedHeading}<`));
  }
  assert.doesNotMatch(workspace, /dailyFixture|ReviewDailyFixture/);
  assert.match(gallery, /<DailyActivityItem/);
  assert.match(gallery, /<DestinationTile destination="knowledge"/);
});

test('public and review Home share a generic portrait without attaching the dog identity', () => {
  assert.match(home, /source=\{require\('\.\.\/\.\.\/\.\.\/assets\/images\/home-dog-portrait-placeholder\.png'\)\}/);
  assert.doesNotMatch(home, /review-puppy-portrait|dog-mascot\.png/);
  assert.match(home, /accessibilityRole="text" accessibilityLabel="Standardbild"/);
  assert.match(home, /homeAgeDecorationOpacity\(portraitFrame\.left, portraitFrame\.right, markerCenter\)/);
  assert.match(home, /const fadeStart = left - 16/);
  assert.match(home, /const z = \(markerCenter - fadeStart\) \/ \(right - fadeStart\)/);
  assert.match(home, /return 0\.78/);
  assert.match(home, /return 0\.56/);
  assert.match(home, /return 0\.38/);
  assert.match(home, /weekStrip: \{ position: 'relative', zIndex: 2/);
  assert.match(home, /dogPortrait: \{ position: 'absolute'.*zIndex: 1/);
  assert.match(home, /styles\.weekNumberBacked/);
  assert.match(home, /rgba\(245, 240, 232, \$\{washOpacity\}\)/);
  assert.match(home, /dailyFixture\s*\?\s*<ReviewDailyFixture/);
  assert.match(harness, /reviewFixtureEnabled&&homeScenario==='ready'\?homeReviewFixture:undefined/);
  assert.match(harness, /testID="review-banner"/);
  assert.match(harness, /testID="review-app-viewport"/);
  assert.match(harness, /AI-GENERERAD STANDARDBILD/);
  assert.match(harness, /Syntetiskt granskningsläge\. AI-genererad standardbild\./);
  assert.match(harness, /appViewport:\{flex:1,minHeight:0\}/);
  assert.match(harness, /height:tokens\.spacing\.xxl,minHeight:tokens\.spacing\.xxl/);
});

test('Home routines use a checkbox, training rows open training, and the manager preserves actions in a BottomSheet', () => {
  assert.match(activityItem, /accessibilityRole="checkbox"/);
  assert.match(activityItem, /accessibilityRole="button" accessibilityLabel=\{rowLabel\}/);
  const homeVariant = activityItem.slice(activityItem.indexOf('function HomeDailyActivityItem'), activityItem.indexOf('const styles'));
  assert.doesNotMatch(homeVariant, /Ta bort|>Visa</);
  assert.doesNotMatch(homeVariant, /<IconChip|list-outline|school-outline/);
  assert.match(homeVariant, /homeTrainingStatusCell/);
  assert.match(homeVariant, /homeTrainingStatusChecked/);
  assert.match(home, /onToggle=\{routineDay \? \(\) => item\.routineItemId && onSetRoutineCompletion/);
  assert.match(home, /item\.kind === 'training' \? \(\) => onGo\('training'\)/);
  for (const action of ['onCreateRoutine', 'onUpdateRoutine', 'onDeleteRoutine', 'onAddRoutineToDay', 'onRemoveRoutineFromDay', 'onAddTrainingToDay', 'onRemoveTrainingFromDay']) {
    assert.match(manager, new RegExp(action));
  }
  assert.match(manager, /<BottomSheet/);
  assert.match(home, /dailyMutationKey/);
});

test('rev02 uses tokenized warm and blue green purple Home surfaces with opt-in component variants', () => {
  for (const color of ['#F5F0E8', '#FFFCF7', '#35875A', '#217448', '#E9F0FB', '#E8F2E7', '#F1EAF7']) assert.ok(tokens.includes(color));
  assert.match(activityItem, /variant === 'home'/);
  assert.match(destinationTile, /variant === 'home'/);
  assert.match(home, /variant="home"/);
});

test('destination tiles route to existing Home destinations and gallery keeps defaults available', () => {
  assert.match(destinationTile, /log: \{ label: 'Logga', icon: 'paw-outline'/);
  assert.match(destinationTile, /training: \{ label: 'Träna', icon: 'school-outline'/);
  assert.match(destinationTile, /knowledge: \{ label: 'Kunskap', icon: 'book-outline'/);
  assert.match(home, /onPress=\{\(\) => onGo\('log'\)\}/);
  assert.match(home, /onPress=\{\(\) => onGo\('training'\)\}/);
  assert.match(home, /onPress=\{\(\) => onGo\('knowledge'\)\}/);
});
