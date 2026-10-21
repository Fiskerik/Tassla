import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync('src/features/onboarding/ProfileScreen.tsx', 'utf8');
const editScreen = readFileSync('src/features/onboarding/EditDogProfileScreen.tsx', 'utf8');
const picker = readFileSync('src/features/onboarding/SearchableBreedPicker.tsx', 'utf8');

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

test('profile creation stacks its intro at narrow widths and lets long selectable text shrink-wrap safely', () => {
  assert.match(screen, /useWindowDimensions/);
  assert.match(screen, /const stackIntro = width < 360/);
  assert.match(screen, /stackIntro && styles\.introCardStacked/);
  assert.match(screen, /introCopy: \{ flex: 1, minWidth: 0 \}/);
  assert.match(picker, /breedText: \{[^}]*flex: 1, minWidth: 0/);
  assert.match(screen, /sourceChoiceText: \{[^}]*flex: 1, minWidth: 0/);
  assert.match(screen, /<PrimaryButton title=\{busy \? 'Sparar…'/);
  assert.match(screen, /<QuietButton title="Avbryt" disabled=\{busy\} onPress=\{onCancel\}/);
});

test('create and add profile require explicit selection from the fetched breed catalog', () => {
  assert.match(screen, /const \[breedId, setBreedId\] = useState\(''\)/);
  assert.doesNotMatch(screen, /setBreedId\(\(current\) => current \|\| options\[0\]/);
  assert.match(screen, /breeds\.some\(\(breed\) => breed\.id === breedId\)/);
  assert.match(screen, /<SearchableBreedPicker breeds=\{breeds\} selectedId=\{breedId\}/);
  assert.match(screen, /onSelect=\{\(id\) => \{ setBreedId\(id\); markEdited\(\); \}\}/);
  assert.match(picker, /function selectBreed\(breed: BreedOption\)[\s\S]*?onSelect\(breed\.id\)/);
  assert.match(picker, /onChangeText=\{setQuery\}/);
  assert.doesNotMatch(picker, /onSelect\(query\)/);
});

test('shared picker owns catalog row styling and only offers a real unknown catalog entry', () => {
  assert.match(picker, /breedText: \{[^}]*flex: 1, minWidth: 0/);
  assert.match(picker, /filteredBreeds\.length === 0 && query\.trim\(\) \? findUnknownBreed\(breeds\)/);
  assert.match(picker, /accessibilityLabel="Välj Okänd ras"[^>]*onPress=\{\(\) => selectBreed\(unknownBreed\)\}/);
  assert.match(picker, /accessibilityRole="radio"[\s\S]*?aria-checked=\{selected\}/);
});

test('dog profile picker and editor reflow at narrow widths without changing callbacks', () => {
  assert.match(editScreen, /const stackProfileLayout = width < 360/);
  assert.match(editScreen, /stackProfileLayout && styles\.heroCardStacked/);
  assert.match(editScreen, /selected && stackProfileLayout \? <Text style=\{styles\.dogProfileActive\}>Aktiv/);
  assert.match(editScreen, /selected && !stackProfileLayout \? <Text style=\{styles\.dogProfileActive\}>Aktiv/);
  assert.match(editScreen, /accessibilityState=\{\{ selected, disabled: dogManagementBlocked \|\| !onSelectDog \}\}/);
  assert.match(editScreen, /onPress=\{\(\) => onSelectDog\?\.\(ownedDog\.id\)\}/);
  assert.match(editScreen, /<PrimaryButton title=\{busy \? 'Sparar…' : statusError/);
});
