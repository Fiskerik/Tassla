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

test('public Home has no daily fixture; local completion is mounted only with a fixture', () => {
  assert.match(home, /dailyFixture\s*\?\s*<ReviewDailyFixture/);
  assert.match(home, /function ReviewDailyFixture[\s\S]*?useState/);
  assert.doesNotMatch(workspace, /dailyFixture|ReviewDailyFixture/);
  assert.match(harness, /reviewFixtureEnabled&&homeScenario==='ready'\?homeReviewFixture:undefined/);
  assert.match(harness, /SYNTETISKT GRANSKNINGSLÄGE/);
  assert.match(harness, /reviewBanner[\s\S]*?<AppScreen/);
  assert.match(harness, /reviewBanner:\{[^}]*minHeight:tokens\.spacing\.xxl/);
  assert.match(harness, /homeReviewFixture(?::[^=]+)?=\[[\s\S]*?completed:true[\s\S]*?completed:false/);
  assert.match(home, /!dailyFixture\s*\?\s*<Text[^>]*>Idag<\/Text>\s*:\s*null/);
  assert.match(home, /fixtureItems:\s*\{\s*gap:\s*tokens\.spacing\.sm\s*\}/);
  assert.match(home, /fixtureSection:\s*\{\s*gap:\s*tokens\.layout\.headingGap\s*-\s*tokens\.spacing\.xs\s*\}/);
});

test('Home review activity toggles locally and detail action routes separately', () => {
  assert.match(activityItem, /accessibilityRole="checkbox"/);
  assert.match(activityItem, /onPress=\{\(\) => onToggle\?\.\(\)\}/);
  assert.match(activityItem, /accessibilityRole="button" accessibilityLabel=\{`Visa detaljer:/);
  assert.match(activityItem, /minHeight: tokens\.size\.touchMin/);
  assert.match(home, /onOpen=\{\(\) => onGo\(item\.destination\)\}/);
  assert.doesNotMatch(activityItem, /AsyncStorage|SecureStore|supabase|fetch\(/i);
});

test('destination tiles use navigation icons and real Home callbacks, not activity categories', () => {
  assert.match(destinationTile, /log: \{ label: 'Logga', icon: 'create-outline'/);
  assert.match(destinationTile, /training: \{ label: 'Träna', icon: 'school-outline'/);
  assert.match(destinationTile, /knowledge: \{ label: 'Kunskap', icon: 'book-outline'/);
  assert.match(home, /DestinationTile destination="log" compact onPress=\{\(\) => onGo\('log'\)\}/);
  assert.match(home, /DestinationTile destination="training" compact onPress=\{\(\) => onGo\('training'\)\}/);
  assert.match(home, /DestinationTile destination="knowledge" compact onPress=\{\(\) => onGo\('knowledge'\)\}/);
  assert.match(gallery, /<DailyActivityItem/);
  assert.match(gallery, /<DestinationTile destination="knowledge"/);
});

test('Home portrait matches reference space without adding identity flow height', () => {
  assert.match(home, /style=\{styles\.dogMeta\}>\{dog\.name\}\{age \?/);
  assert.match(home, /const dogPortraitSize = tokens\.size\.quickLogCompactHeight \+ tokens\.size\.touchMin/);
  assert.match(home, /dogPortrait: \{ position: 'absolute', top: 0, right: 0, width: dogPortraitSize, height: dogPortraitHeight, overflow: 'hidden', borderRadius: tokens\.radius\.full \}/);
  assert.match(home, /dogImage: \{ width: dogPortraitSize, height: dogPortraitHeight, transform: \[\{ scale: 1\.8 \}\], opacity: 0\.7 \}/);
  assert.match(home, /weekNumber: \{ \.\.\.tokens\.typography\.caption, color: tokens\.colors\.textPrimary \}/);
  assert.match(home, /<View style=\{\[styles\.weekNumberWrap, current && styles\.currentWeekNumberWrap, !current && index >= weekStrip\.length - 3 && styles\.weekNumberPortraitBacking\]\}>/);
  assert.match(home, /weekNumberPortraitBacking: \{ backgroundColor: tokens\.colors\.background, borderRadius: tokens\.radius\.sm/);
  assert.match(home, /weekStrip: \{ position: 'relative', zIndex: 1/);
  assert.match(home, /dog-placeholder\.png/);
  assert.match(home, /<View style=\{styles\.dogPortrait\} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">/);
});
