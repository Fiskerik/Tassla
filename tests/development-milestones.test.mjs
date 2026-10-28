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
  const expected = {
    'new-experiences': { icon: 'globe-outline', tone: 'veterinary', source: 'https://www.dogstrust.org.uk/dog-advice/puppy/puppy-socialisation-introduction' },
    teething: { icon: 'medical-outline', tone: 'walk', source: 'https://vcahospitals.com/know-your-pet/retained-deciduous-teeth-baby-teeth-in-dogs' },
    adolescence: { icon: 'paw', tone: 'training', source: 'https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/puppies-dogs/adolescent-dogs' },
  };
  for (const item of generalDevelopmentMilestones(11)) {
    assert.equal(new URL(item.sourceUrl).protocol, 'https:');
    assert.deepEqual({ icon: item.icon, tone: item.tone, source: item.sourceUrl }, expected[item.id]);
  }
});
