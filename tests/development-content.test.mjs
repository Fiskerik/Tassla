import test from 'node:test';
import assert from 'node:assert/strict';
import { developmentPhase, recommendedDevelopmentReading } from '../src/features/home/development-content.ts';

const phases = ['before_homecoming', 'first_days', '8_12_weeks', '3_6_months', '6_12_months', 'over_1_year'].map((phase) => ({ phase }));
test('calendar phase boundaries do not infer homecoming from age or missing dates', () => {
  for (const age of [null, -1, 0, 7, NaN, 8.5]) assert.equal(developmentPhase(phases, age, 'by_age'), null);
  for (const [age, expected] of [[8, '8_12_weeks'], [12, '8_12_weeks'], [13, '3_6_months'], [25, '3_6_months'], [26, '6_12_months'], [51, '6_12_months'], [52, 'over_1_year']]) {
    assert.equal(developmentPhase(phases, age, 'by_age')?.phase, expected);
  }
  assert.equal(developmentPhase(phases, null, 'before_homecoming')?.phase, 'before_homecoming');
  assert.equal(developmentPhase(phases, null, 'first_days')?.phase, 'first_days');
  assert.equal(developmentPhase([], 11, 'by_age'), null);
});
test('only explicitly recommended articles and guides enter development reading', () => {
  const rows = [
    { id: 'a', contentType: 'article', recommended: true }, { id: 'b', contentType: 'guide', recommended: true },
    { id: 'c', contentType: 'article', recommended: false }, { id: 'd', contentType: 'guide' },
    { id: 'e', contentType: 'training_program', recommended: true },
  ];
  assert.deepEqual(recommendedDevelopmentReading(rows).map((item) => item.id), ['a', 'b']);
});
