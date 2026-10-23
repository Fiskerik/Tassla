import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync('src/features/onboarding/ProfileScreen.tsx', 'utf8');
const editScreen = readFileSync('src/features/onboarding/EditDogProfileScreen.tsx', 'utf8');
const profilePickerHarness = readFileSync('tools/visual-check/vision-r02-home-panels-app.tsx', 'utf8');

test('kennel referral is optional during onboarding and attribution is checked only when selected', () => {
  assert.doesNotMatch(screen, /referralReady/);
  assert.match(screen, /Kennelkod <Text style=\{styles\.optionalLabel\}>· valfritt/);
  assert.match(screen, /!sourceSelected \|\| Boolean\(normalizeKennelCode\(kennelCode\)\)/);
  assert.match(screen, /referralCode !== null && !await ownedDogAttributionMatches/);
  assert.match(screen, /Kod inläst · inte kopplad/);
  assert.match(screen, /Koppla koden till min profil/);
  assert.match(screen, /<DatePickerField label="Födelsedatum"/);
});

test('profile editing exposes a later optional kennel connection', () => {
  assert.match(editScreen, /Kennelkoppling <Text style=\{styles\.attributionOptional\}>· valfri/);
  assert.match(editScreen, /onSaveAttribution\?:/);
  assert.match(editScreen, /Ta bort kennelkoppling/);
  assert.match(editScreen, /Kennelkopplingen kunde inte hämtas/);
  assert.match(editScreen, /const showAttributionDetails = attributionExpanded \|\| attributionState === 'error'/);
});

test('profile creation puts fields first and keeps optional kennel details compact', () => {
  assert.doesNotMatch(screen, /useWindowDimensions|introCard/);
  assert.match(screen, /<Text accessibilityRole="header" style=\{styles\.screenTitle\}>/);
  assert.match(screen, /<BreedPickerField[\s\S]*?label="Ras"[\s\S]*?onChange=/);
  assert.doesNotMatch(screen, /setBreedId\(\(current\) => current \|\| options\[0\]/);
  assert.doesNotMatch(screen, /breeds\.map\(/);
  assert.match(screen, /sourceChoiceText: \{[^}]*flex: 1, minWidth: 0/);
  assert.match(screen, /accessibilityState=\{\{ expanded: sourceExpanded \}\}/);
  assert.match(screen, /sourceExpanded \|\| sourceNeedsAttention/);
  assert.match(screen, /<PrimaryButton title=\{busy \? 'Sparar…'/);
  assert.match(screen, /<Dialog visible=\{exitDialog\}/);
  assert.match(screen, /cancelLabel=\{mode === 'add' \? 'Fortsätt redigera' : 'Stanna kvar'\}/);
  assert.match(screen, /BackHandler\.addEventListener\('hardwareBackPress'/);
  assert.match(screen, /recoveryCheckInFlight\.current = true/);
  assert.match(screen, /profileRecoveryRequestMatches\(validRecoverySnapshot, ownerId, accountGeneration, requestId\)/);
  assert.match(screen, /Vi kunde inte kontrollera den säkra återställningen\. Ingen ny begäran skickas innan kontrollen lyckas\./);
  assert.match(screen, /if \(dog\.name !== desired\.name[\s\S]*?setResolvedShouldClearReferral\(false\)/);
  assert.match(screen, /if \(sourceProblem !== null\)[\s\S]*?setResolvedShouldClearReferral\(true\)/);
});

test('profile editor reuses the home dog switcher and reports local dirty state synchronously', () => {
  assert.match(editScreen, /<BreedPickerField[\s\S]*?label="Ras"[\s\S]*?onChange=/);
  assert.doesNotMatch(editScreen, /breeds\.map\(/);
  assert.match(editScreen, /<DogProfileSwitcherSheet visible=\{dogSwitcherVisible\}/);
  assert.doesNotMatch(editScreen, /ownedDogs\.map\(/);
  assert.match(editScreen, /<Pressable accessibilityRole="button" accessibilityLabel=\{`Byt hund\. Aktiv hund:/);
  assert.match(editScreen, /onExitStateChange/);
  assert.match(editScreen, /reportExitState\(value\.trim\(\) !== dog\.name/);
  assert.match(editScreen, /<DatePickerField label="Födelsedatum"/);
  assert.doesNotMatch(editScreen, /heroCard|profileNote|dogProfilesList/);
  assert.match(editScreen, /const mayKeepMissingSavedBreed = breedId === dog\.breed_id/);
  assert.match(editScreen, /const canSaveBreed = breedState === 'ready' && \(selectedBreedExists \|\| mayKeepMissingSavedBreed\)/);
  assert.match(editScreen, /Ras saknas i listan/);
  assert.match(editScreen, /const dogManagementBlocked = blocked \|\| Boolean\(conflict\) \|\| attributionBusy \|\| attributionWriteUnresolved/);
  assert.match(editScreen, /<PrimaryButton title=\{busy \? 'Sparar…' : statusError/);
});

test('profile exit routing uses one scope-aware guard for tab, return, dog switch, and Add Dog', () => {
  const workspace = readFileSync('src/features/home/ProductWorkspace.tsx', 'utf8');
  const flow = readFileSync('src/features/home/AppFlow.tsx', 'utf8');
  assert.match(workspace, /decideProfileExit\(profileExitSnapshot\.current, currentProfileExitScope/);
  assert.match(workspace, /attributionMutationInFlight\.current = true/);
  assert.match(workspace, /BackHandler\.addEventListener\('hardwareBackPress'/);
  assert.match(workspace, /onSelectDog=\{\(dogId\) => requestProfileExitRef\.current\(\{ kind: 'switchDog'/);
  assert.match(workspace, /onAddDog=\{\(\) => requestProfileExitRef\.current\(\{ kind: 'addDog' \}\)\}/);
  assert.match(flow, /pendingAddRecoverySnapshot/);
  assert.match(flow, /entryPoint=\{addEntryPoint\} recoverySnapshot=\{pendingAddRecoverySnapshot\}/);
  assert.match(flow, /result\.kind === 'resume' \? result\.snapshot\.entryPoint/);
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
