import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterBreedsByQuery,
  findUnknownBreed,
  normalizeBreedSearchText,
} from '../src/features/onboarding/breed-search.ts';

const catalog = [
  { id: 'lab', name: 'Labrador retriever' },
  { id: 'golden', name: 'Golden retriever' },
  { id: 'lab-mix', name: 'Labradorblandning' },
  { id: 'unknown', name: 'Okänd ras' },
];

test('breed search normalizes Unicode, outer whitespace, and Swedish case', () => {
  assert.equal(normalizeBreedSearchText('  LABRADOR Retriever  '), 'labrador retriever');
  assert.equal(normalizeBreedSearchText('  Cafe\u0301  '), normalizeBreedSearchText('CAFÉ'));
});

test('breed search filters names locally without changing catalog order', () => {
  const filtered = filterBreedsByQuery(catalog, ' LAB ');
  assert.deepEqual(filtered.map(({ id }) => id), ['lab', 'lab-mix']);
  assert.strictEqual(filterBreedsByQuery(catalog, '   '), catalog);
  assert.deepEqual(filterBreedsByQuery(catalog, 'no-such-breed'), []);
});

test('unknown breed fallback returns only an existing catalog object', () => {
  assert.strictEqual(findUnknownBreed(catalog), catalog[3]);
  assert.equal(findUnknownBreed(catalog.slice(0, 3)), undefined);
  assert.equal(findUnknownBreed([{ id: 'unknown', name: 'Okänd Ras ' }]).id, 'unknown');
});
