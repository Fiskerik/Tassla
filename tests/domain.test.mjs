import test from 'node:test';
import assert from 'node:assert/strict';
import { ageInWeeks, formatDogAge } from '../src/features/onboarding/dog.ts';
import { selectContent } from '../src/content/select-content.ts';

test('age uses calendar weeks across leap days and daylight saving boundaries', () => {
  assert.equal(ageInWeeks('2024-02-29', '2024-03-07'), 1);
  assert.equal(ageInWeeks('2026-03-22', '2026-03-29'), 1);
  assert.equal(ageInWeeks('2026-10-01', '2026-10-07'), 0);
});
test('rejects future births, malformed dates and impossible calendar days', () => {
  for (const date of ['2026-10-05', '2026-02-30', '2025-02-29', 'invalid']) {
    assert.throws(() => ageInWeeks(date, '2026-10-04'));
  }
});
test('formats dog age as completed calendar months and years', () => {
  assert.equal(formatDogAge('2026-10-09', '2026-10-09'), '0 mån');
  assert.equal(formatDogAge('2026-02-09', '2026-10-09'), '8 mån');
  assert.equal(formatDogAge('2025-10-09', '2026-10-09'), '1 år 0 mån');
  assert.equal(formatDogAge('2025-07-09', '2026-10-09'), '1 år 3 mån');
  assert.equal(formatDogAge('2026-02-09', '2026-10-08'), '7 mån');
});
test('content matches age and breed, deduplicates versions without changing progression', () => {
  const base = {contentId:'one', status:'published', minAgeWeeks:8, maxAgeWeeks:12, breedIds:[]};
  const input = [
    {...base,id:'older',version:1}, {...base,id:'newer',version:2},
    {...base,id:'other-breed',contentId:'two',version:1,breedIds:['breed-b']},
    {...base,id:'future',contentId:'three',version:1,minAgeWeeks:20,maxAgeWeeks:null},
  ];
  assert.deepEqual(selectContent(input, 11, 'breed-a').map(x => x.id), ['newer']);
  assert.equal(input.length,4);
  assert.deepEqual(selectContent(input,13,'breed-a'),[]);
});
