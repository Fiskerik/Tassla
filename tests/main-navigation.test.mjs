import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
const navigation = await import('../src/features/home/main-navigation.ts');
hook.deregister();

const { MAIN_TAB_DESTINATIONS, activeMainTabDestination, mainTabTransitionDirection, nextMainTabDestination } = navigation;

test('main tabs keep the approved five-destination order', () => {
  assert.deepEqual(MAIN_TAB_DESTINATIONS, ['home', 'log', 'training', 'knowledge', 'more']);
});

test('next main tab follows order and has no wraparound', () => {
  assert.deepEqual(MAIN_TAB_DESTINATIONS.map((page) => nextMainTabDestination(page, 'left')), ['log', 'training', 'knowledge', 'more', undefined]);
  assert.deepEqual(MAIN_TAB_DESTINATIONS.map((page) => nextMainTabDestination(page, 'right')), [undefined, 'home', 'log', 'training', 'knowledge']);
});

test('auxiliary pages do not enter swipe navigation and use More as active tab', () => {
  const auxiliaryPages = ['health', 'planned-health', 'passport', 'profile', 'notification-settings', 'account-settings', 'beta-info'];
  for (const page of auxiliaryPages) {
    assert.equal(nextMainTabDestination(page, 'left'), undefined);
    assert.equal(nextMainTabDestination(page, 'right'), undefined);
    assert.equal(activeMainTabDestination(page), 'more');
  }
  for (const page of MAIN_TAB_DESTINATIONS) assert.equal(activeMainTabDestination(page), page);
});

test('main tab transitions follow destination order', () => {
  assert.equal(mainTabTransitionDirection('home', 'log'), 'forward');
  assert.equal(mainTabTransitionDirection('home', 'more'), 'forward');
  assert.equal(mainTabTransitionDirection('more', 'knowledge'), 'backward');
  assert.equal(mainTabTransitionDirection('training', 'training'), 'forward');
  assert.equal(mainTabTransitionDirection('planned-health', 'home'), 'forward');
  assert.equal(mainTabTransitionDirection('home', 'account-settings'), 'forward');
});
