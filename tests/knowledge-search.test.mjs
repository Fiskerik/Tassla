import test from 'node:test';
import assert from 'node:assert/strict';
import { searchKnowledgeItems } from '../src/features/knowledge/knowledge-search.ts';

const selectedGuides = [
  { id: 'handling', title: 'Trygg hantering', body: 'Låt valpen själv ta initiativ.' },
  { id: 'alone', title: 'En stund själv', body: 'Träna lugnt i små steg.' },
];

test('search trims and matches case-insensitively in title and body', () => {
  assert.deepEqual(searchKnowledgeItems(selectedGuides, '  TRYGG  '), [selectedGuides[0]]);
  assert.deepEqual(searchKnowledgeItems(selectedGuides, '  SMÅ STEG '), [selectedGuides[1]]);
});

test('search returns only supplied eligible items and never expands its source set', () => {
  const eligible = [selectedGuides[1]];
  assert.deepEqual(searchKnowledgeItems(eligible, 'valpen'), []);
  assert.deepEqual(searchKnowledgeItems(eligible, 'lugn'), [selectedGuides[1]]);
});

test('an empty or whitespace-only query restores the full supplied list', () => {
  assert.deepEqual(searchKnowledgeItems(selectedGuides, ''), selectedGuides);
  assert.deepEqual(searchKnowledgeItems(selectedGuides, '   '), selectedGuides);
});
