import test from 'node:test';
import assert from 'node:assert/strict';
import { DOG_LIFE_PERIODS, resolveDogLife, addMonthsClamped } from '../src/features/onboarding/life-stages.ts';
import { automaticDogAge } from '../src/features/onboarding/dog.ts';

function anniversary(birth, months) { return addMonthsClamped(birth, months); }
function prior(date) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

test('ten periods cover every boundary once with calendar-month anniversaries', () => {
  const birth = '2024-02-29';
  assert.equal(DOG_LIFE_PERIODS.length, 10);
  const starts = [
    '2024-02-29', '2024-04-25', anniversary(birth, 3), anniversary(birth, 6),
    anniversary(birth, 9), anniversary(birth, 18), anniversary(birth, 36),
    anniversary(birth, 84), anniversary(birth, 120), anniversary(birth, 156),
  ];
  starts.forEach((date, index) => {
    assert.equal(resolveDogLife(birth, date).period.id, DOG_LIFE_PERIODS[index].id);
    if (index > 0) assert.equal(resolveDogLife(birth, prior(date)).period.id, DOG_LIFE_PERIODS[index - 1].id);
  });
});

test('twelve whole weeks remain in homecoming until the third calendar-month anniversary', () => {
  const birth = '2026-01-01';
  const twelveWeeks = '2026-03-26';
  assert.equal(resolveDogLife(birth, twelveWeeks).ageWeeks, 12);
  assert.equal(resolveDogLife(birth, twelveWeeks).period.id, 'homecoming');
  assert.equal(resolveDogLife(birth, '2026-04-01').period.id, 'curious_puppy');
});

test('broad senior and end-of-life phases require individual input', () => {
  const birth = '2013-10-15';
  const today = '2026-10-15';
  assert.equal(resolveDogLife(birth, today).period.id, 'older_years');
  assert.equal(resolveDogLife(birth, today).broadPhase, 'VUXEN');
  assert.equal(resolveDogLife('2020-10-15', today, { seniorConfirmed: true }).broadPhase, 'SENIOR');
  assert.equal(resolveDogLife(birth, today, { seniorFromMonths: 120 }).broadPhase, 'SENIOR');
  assert.equal(resolveDogLife(birth, today, { seniorConfirmed: true }).broadPhase, 'SENIOR');
  assert.equal(resolveDogLife('2026-01-01', today, { endOfLife: true }).broadPhase, 'LIVETS_SLUTSKEDE');
  assert.equal(automaticDogAge(birth, today)?.stage, 'Den äldre hunden');
});

test('milestones remain separate from chronological periods and legacy checklist windows', () => {
  assert.equal(resolveDogLife('2026-10-01', '2026-11-20').legacyChecklistPhase, null);
  assert.equal(resolveDogLife('2026-10-01', '2026-11-26').legacyChecklistPhase, '8_12_weeks');
  assert.equal(resolveDogLife('2026-10-01', '2027-10-01').legacyChecklistPhase, 'over_1_year');
});
