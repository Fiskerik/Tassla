import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync('src/features/onboarding/ProfileScreen.tsx', 'utf8');
const editScreen = readFileSync('src/features/onboarding/EditDogProfileScreen.tsx', 'utf8');
const profilePickerHarness = readFileSync('tools/visual-check/vision-r02-home-panels-app.tsx', 'utf8');

test('kennel referral is optional during onboarding and attribution is checked only when selected', () => {
  assert.doesNotMatch(screen, /referralReady/);
  assert.match(screen, /Kennelkod \(valfritt\)/);
  assert.match(screen, /!sourceSelected \|\| Boolean\(normalizeKennelCode\(kennelCode\)\)/);
  assert.match(screen, /referralCode !== null && !await ownedDogAttributionMatches/);
});

test('profile editing exposes a later optional kennel connection', () => {
  assert.match(editScreen, /Kennelkoppling \(valfri\)/);
  assert.match(editScreen, /onSaveAttribution\?:/);
  assert.match(editScreen, /Ta bort kennelkoppling/);
  assert.match(editScreen, /Kennelkopplingen kunde inte hämtas/);
});

test('profile creation stacks its intro and lets long selectable text shrink-wrap safely', () => {
  assert.match(screen, /useWindowDimensions/);
  assert.match(screen, /const stackIntro = width < 360 \|\| fontScale >= 1\.25/);
  assert.match(screen, /stackIntro && styles\.introCardStacked/);
  assert.match(screen, /introCopy: \{ flex: 1, minWidth: 0 \}/);
  assert.match(screen, /<BreedPickerField[\s\S]*?label="Ras"[\s\S]*?onChange=/);
  assert.doesNotMatch(screen, /setBreedId\(\(current\) => current \|\| options\[0\]/);
  assert.doesNotMatch(screen, /breeds\.map\(/);
  assert.match(screen, /sourceChoiceText: \{[^}]*flex: 1, minWidth: 0/);
  assert.match(screen, /<PrimaryButton title=\{busy \? 'Sparar…'/);
  assert.match(screen, /<QuietButton title="Avbryt" disabled=\{busy\} onPress=\{onCancel\}/);
});

test('dog profile picker and editor reflow at the same breakpoint without changing callbacks or target size', () => {
  assert.match(editScreen, /const stackProfileLayout = width < 360 \|\| fontScale >= 1\.25/);
  assert.match(editScreen, /<BreedPickerField[\s\S]*?label="Ras"[\s\S]*?onChange=/);
  assert.doesNotMatch(editScreen, /breeds\.map\(/);
  assert.match(editScreen, /const mayKeepMissingSavedBreed = breedId === dog\.breed_id/);
  assert.match(editScreen, /const canSaveBreed = breedState === 'ready' && \(selectedBreedExists \|\| mayKeepMissingSavedBreed\)/);
  assert.match(editScreen, /Ras saknas i listan/);
  assert.match(editScreen, /stackProfileLayout && styles\.heroCardStacked/);
  assert.match(editScreen, /selected && stackProfileLayout \? <Text style=\{styles\.dogProfileActive\}>Aktiv/);
  assert.match(editScreen, /selected && !stackProfileLayout \? <Text style=\{styles\.dogProfileActive\}>Aktiv/);
  assert.match(editScreen, /accessibilityState=\{\{ selected, disabled: dogManagementBlocked \|\| !onSelectDog \}\}/);
  assert.match(editScreen, /onPress=\{\(\) => onSelectDog\?\.\(ownedDog\.id\)\}/);
  assert.match(editScreen, /dogProfileRow: \{ minHeight: tokens\.size\.touchMin \+ tokens\.spacing\.sm/);
  assert.match(editScreen, /<PrimaryButton title=\{busy \? 'Sparar…' : statusError/);
});

test('breed picker keeps the searchable list outside BottomSheet ScrollView only for its own route', () => {
  const picker = readFileSync('src/features/onboarding/BreedPickerField.tsx', 'utf8');
  const sheet = readFileSync('src/components/ui/BottomSheet.tsx', 'utf8');
  assert.match(picker, /scrollContent=\{false\}/);
  assert.match(picker, /<FlatList[\s\S]*?data=\{filteredBreeds\}/);
  assert.match(picker, /accessibilityLabel="Sök hundras"/);
  assert.match(picker, /accessibilityLabel="Rensa sökning"/);
  assert.match(picker, /aria-checked=\{selected\}/);
  assert.match(picker, /unknownBreed = breeds\.find\(\(breed\) => breed\.id === 'unknown'\)/);
  assert.match(picker, /label="Välj Okänd ras"/);
  assert.match(sheet, /scrollContent = true/);
  assert.match(sheet, /scrollContent\s*\?\s*<ScrollView/);
  assert.match(sheet, /: <View style=\{styles\.childScrollBody\}>\{children\}<\/View>/);
  assert.match(profilePickerHarness, /const profileCreateFixture = params\.get\('screen'\) === 'profile-create'/);
  assert.match(profilePickerHarness, /profileBreedScenario === 'retry'/);
  assert.match(profilePickerHarness, /if \(profileCreateFixture\) \{[\s\S]*?<ProfileScreen/);
});
