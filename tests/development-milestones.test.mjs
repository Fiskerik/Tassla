import test from 'node:test';
import assert from 'node:assert/strict';
import { generalDevelopmentMilestones } from '../src/features/home/development-milestones.ts';

test('temporary guidance is age-scoped, non-prescriptive and linked to sources', () => {
  assert.deepEqual(generalDevelopmentMilestones(null), []);
  assert.deepEqual(generalDevelopmentMilestones(-1), []);
  assert.deepEqual(generalDevelopmentMilestones(11).map(item => item.id), ['new-experiences', 'teething', 'adolescence']);
  assert.deepEqual(generalDevelopmentMilestones(20).map(item => item.id), ['teething', 'adolescence']);
  assert.deepEqual(generalDevelopmentMilestones(52).map(item => item.id), ['adolescence']);
  assert.deepEqual(generalDevelopmentMilestones(105), []);
  for (const item of generalDevelopmentMilestones(11)) assert.equal(new URL(item.sourceUrl).protocol, 'https:');
});
