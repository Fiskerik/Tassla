import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { automaticDogAge } from '../src/features/onboarding/dog.ts';
import { developmentTitle } from '../src/features/home/development-title.ts';

const developmentScreen = readFileSync(new URL('../src/features/home/DevelopmentScreen.tsx', import.meta.url), 'utf8');

test('development title does not duplicate a trailing s in the dog name', () => {
  assert.equal(developmentTitle('Doos'), 'Doos utveckling');
  assert.equal(developmentTitle('Luna'), 'Lunas utveckling');
});

test('development uses the chronological age and broad phase from the dog profile dates', () => {
  assert.deepEqual(automaticDogAge('2026-01-01', '2026-03-19'), {
    unit: 'weeks', unitLabel: 'veckor', value: 11, label: '11 veckor', stage: 'VALP',
  });
  assert.deepEqual(automaticDogAge('2026-01-01', '2026-07-01'), {
    unit: 'months', unitLabel: 'månader', value: 6, label: '6 månader', stage: 'UNGHUND',
  });
  assert.deepEqual(automaticDogAge('2026-01-01', '2028-01-01'), {
    unit: 'years', unitLabel: 'år', value: 2, label: '2 år', stage: 'VUXEN',
  });
});

test('missing, invalid and future birth dates do not produce a development age', () => {
  assert.equal(automaticDogAge(null, '2026-03-19'), null);
  assert.equal(automaticDogAge('2026-02-30', '2026-03-19'), null);
  assert.equal(automaticDogAge('2026-03-20', '2026-03-19'), null);
});

test('development groups milestone links and opts into the shared screen-title role', () => {
  assert.match(developmentScreen, /titleVariant="screen"/);
  assert.match(developmentScreen, /testID="development-age-journey"/);
  assert.match(developmentScreen, /testID="development-milestones"/);
  assert.match(developmentScreen, /Nästa milstolpar/);
  assert.match(developmentScreen, /Öppna källa \$\{index \+ 1\}: \$\{milestone\.title\}/);
  assert.match(developmentScreen, /accessibilityElementsHidden>\{index \+ 1\}\)/);
  assert.doesNotMatch(developmentScreen, /Läs källan/);
});
