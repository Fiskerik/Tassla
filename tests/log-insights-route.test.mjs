import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const navigation = await import('../src/features/home/main-navigation.ts');
hooks.deregister();

test('Logga Today and Insights use separate scroll surfaces while preserving the Today offset', () => {
  assert.deepEqual(navigation.logViewScrollKeys('today'), { scrollKey: 'log', preserveScrollKey: 'log' });
  assert.deepEqual(navigation.logViewScrollKeys('overview'), { scrollKey: 'log-insights-flow', preserveScrollKey: 'log' });
});

test('Profile origin is returned only while selection, account generation and dog still match', () => {
  const origin = { kind: 'profile', selectionKey: 'owner:4:dog:a', accountGeneration: 4, dogId: 'dog-a', profileReturnPage: 'training' };
  assert.equal(navigation.profileInsightsOriginMatches(origin, 'owner:4:dog:a', 4, 'dog-a'), true);
  assert.equal(navigation.profileInsightsOriginMatches(origin, 'owner:4:dog:b', 4, 'dog-a'), false);
  assert.equal(navigation.profileInsightsOriginMatches(origin, 'owner:5:dog:a', 5, 'dog-a'), false);
  assert.equal(navigation.profileInsightsOriginMatches({ kind: 'log' }, 'owner:4:dog:a', 4, 'dog-a'), false);
});
