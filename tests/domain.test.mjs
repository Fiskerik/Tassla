import test from 'node:test';
import assert from 'node:assert/strict';
import { ageInWeeks, automaticDogAge, formatDogAge, resolveDogAgePeriod } from '../src/features/onboarding/dog.ts';
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

test('editorial age periods have continuous boundaries, including the approximate 12-week to 3-month seam', () => {
  const birth = '2025-01-31';
  const addDays = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
  const period = (date) => resolveDogAgePeriod(birth, date)?.id;

  assert.equal(period(birth), '0-8-weeks');
  assert.equal(period(addDays(birth, 55)), '0-8-weeks', 'day before 8 weeks');
  assert.equal(period(addDays(birth, 56)), '8-12-weeks', '8-week boundary');
  assert.equal(period(addDays(birth, 57)), '8-12-weeks', 'day after 8 weeks');
  assert.equal(period(addDays(birth, 83)), '8-12-weeks', 'day before literal 12 weeks');
  assert.equal(period(addDays(birth, 84)), '8-12-weeks', 'literal 12-week day stays in the approximate label');
  assert.equal(period(addDays(birth, 85)), '8-12-weeks', 'day after literal 12 weeks');
  assert.equal(period('2025-04-29'), '8-12-weeks');
  assert.equal(period('2025-04-30'), '3-6-months', 'Jan 31 plus three clamped calendar months is Apr 30');
  assert.equal(period('2025-05-01'), '3-6-months');
});

test('editorial age periods switch on inclusive clamped calendar-month and year boundaries', () => {
  const birth = '2025-01-31';
  const period = (date) => resolveDogAgePeriod(birth, date)?.id;
  const boundaries = [
    ['2025-07-30', '2025-07-31', '3-6-months', '6-12-months'],
    ['2026-01-30', '2026-01-31', '6-12-months', '1-2-years'],
    ['2027-01-30', '2027-01-31', '1-2-years', '2-4-years'],
    ['2029-01-30', '2029-01-31', '2-4-years', '4-6-years'],
    ['2031-01-30', '2031-01-31', '4-6-years', '6-8-years'],
    ['2033-01-30', '2033-01-31', '6-8-years', '8-10-years'],
    ['2035-01-30', '2035-01-31', '8-10-years', '10-plus-years'],
  ];
  for (const [before, on, expectedBefore, expectedOn] of boundaries) {
    assert.equal(period(before), expectedBefore, `day before ${on}`);
    assert.equal(period(on), expectedOn, `boundary day ${on}`);
    assert.equal(period(new Date(Date.parse(`${on}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)), expectedOn, `day after ${on}`);
  }
  assert.equal(period('2045-01-31'), '10-plus-years');
});

test('editorial age periods clamp leap-day birthdays to the last valid February day', () => {
  const birth = '2024-02-29';
  assert.equal(resolveDogAgePeriod(birth, '2025-02-27')?.id, '6-12-months');
  assert.equal(resolveDogAgePeriod(birth, '2025-02-28')?.id, '1-2-years');
  assert.equal(resolveDogAgePeriod(birth, '2025-03-01')?.id, '1-2-years');
});

test('period resolver treats missing, invalid and future birth dates as unknown', () => {
  assert.equal(resolveDogAgePeriod(null, '2026-10-17'), null);
  assert.equal(resolveDogAgePeriod('2026-02-30', '2026-10-17'), null);
  assert.equal(resolveDogAgePeriod('2026-10-18', '2026-10-17'), null);
  assert.equal(resolveDogAgePeriod('2026-01-01', 'invalid'), null);
});

test('period changes with age while existing three broad stages keep their 6/24-month boundaries', () => {
  const birth = '2025-01-31';
  assert.equal(resolveDogAgePeriod(birth, '2025-03-28')?.id, '8-12-weeks');
  assert.equal(resolveDogAgePeriod(birth, '2025-07-31')?.id, '6-12-months');
  assert.equal(resolveDogAgePeriod(birth, '2028-01-31')?.id, '2-4-years');

  assert.equal(automaticDogAge(birth, '2025-07-30')?.stage, 'VALP');
  assert.equal(automaticDogAge(birth, '2025-07-31')?.stage, 'UNGHUND');
  assert.equal(automaticDogAge(birth, '2027-01-30')?.stage, 'UNGHUND');
  assert.equal(automaticDogAge(birth, '2027-01-31')?.stage, 'VUXEN');
});

test('formats dog age in the selected display unit using calendar months and years', () => {
  assert.equal(formatDogAge('2026-10-09', '2026-10-09', 'weeks'), '0 veckor');
  assert.equal(formatDogAge('2026-02-09', '2026-10-09', 'months'), '8 månader');
  assert.equal(formatDogAge('2025-10-09', '2026-10-09', 'years'), '1 år');
  assert.equal(formatDogAge('2025-07-09', '2026-10-09', 'years'), '1 år 3 mån');
  assert.equal(formatDogAge('2026-02-09', '2026-10-08', 'months'), '7 månader 4 veckor');
  assert.equal(formatDogAge('2025-07-09', '2026-10-16', 'months'), '15 månader 1 vecka');
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
