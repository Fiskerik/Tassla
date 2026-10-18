import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { filterBreedOptions, sortBreedOptions } from '../src/features/onboarding/breed-picker-model.ts';

const breeds = [
  { id: 'fci-1', name: 'Zebra Dog' },
  { id: 'fci-2', name: 'Älghund' },
  { id: 'unknown', name: 'Okänd ras' },
  { id: 'mixed', name: 'Blandras' },
  { id: 'fci-3', name: 'Airedale Terrier' },
  { id: 'fci-4', name: 'Cão da Serra de Aires' },
];

const profileSource = readFileSync('src/features/onboarding/ProfileScreen.tsx', 'utf8');
const editorSource = readFileSync('src/features/onboarding/EditDogProfileScreen.tsx', 'utf8');
const pickerSource = readFileSync('src/features/onboarding/SearchableBreedPicker.tsx', 'utf8');
const appDataSource = readFileSync('src/data/app-data.ts', 'utf8');
const catalogBytes = readFileSync('supabase/data/fci-breeds-2026-10.csv');
const catalog = catalogBytes.toString('utf8').trim().split(/\r?\n/).slice(1);
const catalogLicense = readFileSync('supabase/data/fci-breeds-MIT-LICENSE.txt', 'utf8');
const migration = readFileSync('supabase/migrations/202610180001_fci_breed_catalog.sql', 'utf8');

test('sorts Blandras first and the remaining names in Swedish alphabetical order', () => {
  assert.deepEqual(
    sortBreedOptions(breeds).map(({ name }) => name),
    ['Blandras', 'Airedale Terrier', 'Cão da Serra de Aires', 'Okänd ras', 'Zebra Dog', 'Älghund'],
  );
});

test('search ignores case, accents, leading and trailing whitespace', () => {
  assert.deepEqual(filterBreedOptions(breeds, '  CAO  ').map(({ id }) => id), ['fci-4']);
  assert.deepEqual(filterBreedOptions(breeds, 'aIreS').map(({ id }) => id), ['fci-4']);
});

test('picker presents one selected value and a virtualized searchable catalog with recovery actions', () => {
  assert.match(pickerSource, /<FlatList/);
  assert.doesNotMatch(pickerSource, /<ScrollView/);
  assert.match(pickerSource, /Rensa sökning/);
  assert.match(pickerSource, /Ingen träff i FCI-listan/);
  assert.match(pickerSource, /FCI-listan innehåller inte alla raser/);
  assert.match(pickerSource, /fallbackOptions\.map/);
  assert.match(pickerSource, /Okänd ras|unknown/);
  assert.match(pickerSource, /Blandras|mixed/);
  assert.match(pickerSource, /onShow={focusSearch}/);
  assert.match(pickerSource, /setAccessibilityFocus\(node\)/);
  assert.match(pickerSource, /accessibilityState=\{\{ selected \}\}/);
});

test('new registration defaults to an existing breed id and requires it to be present in the loaded catalog', () => {
  assert.match(profileSource, /useState\('mixed'\)/);
  assert.match(profileSource, /breeds\.some\(\(breed\) => breed\.id === breedId\)/);
  assert.match(profileSource, /<SearchableBreedPicker/);
  assert.match(profileSource, /onChange=\{\(id\) => \{ setBreedId\(id\); markEdited\(\); \}\}/);
  assert.match(appDataSource, /dog_breed_id: input\.breedId/);
  assert.match(profileSource, /breedId, birthDate/);
});

test('profile editor starts with the saved breed and submits only a catalog id', () => {
  assert.match(editorSource, /useState\(dog\.breed_id\)/);
  assert.match(editorSource, /valueLabelFallback=\{currentBreed\}/);
  assert.match(editorSource, /<SearchableBreedPicker/);
  assert.match(editorSource, /breed_id: breedId/);
  assert.match(editorSource, /await onSave\(changes, breeds\)/);
  assert.match(editorSource, /breeds\.some\(\(breed\) => breed\.id === breedId\)/);
});

test('the pinned FCI snapshot and additive migration contain 360 unique catalog ids', () => {
  assert.equal(catalog.length, 360);
  assert.equal(createHash('sha256').update(catalogBytes).digest('hex').toUpperCase(), 'F7623A7D42D7329AE61B7A8CD31E47348C8B7B1383944D66B08B4CBC1E10F84B');
  assert.match(catalogLicense, /MIT License/);
  assert.match(catalogLicense, /Pavel Ivashkov/);
  const ids = catalog.map((row) => row.split(',')[0]);
  assert.equal(new Set(ids).size, 360);
  assert.ok(ids.every((id) => /^\d+$/.test(id)));
  const insertedIds = [...migration.matchAll(/\('fci-(\d+)'/g)].map((match) => match[1]);
  assert.equal(insertedIds.length, 360);
  assert.equal(new Set(insertedIds).size, 360);
  assert.deepEqual([...insertedIds].sort(), [...ids].sort());
  assert.match(migration, /insert into public\.breeds \(id, name\)/i);
  assert.doesNotMatch(migration, /on conflict|do update|create table|alter table|grant |create policy/i);
});