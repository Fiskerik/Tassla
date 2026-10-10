import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync('src/features/onboarding/ProfileScreen.tsx', 'utf8');
const editScreen = readFileSync('src/features/onboarding/EditDogProfileScreen.tsx', 'utf8');

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
