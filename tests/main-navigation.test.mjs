import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
const navigation = await import('../src/features/home/main-navigation.ts');
hook.deregister();

const { MAIN_TAB_DESTINATIONS, isMainTabDestination, activeMainTabDestination, mainTabTransitionDirection, nextMainTabDestination, requestMainTabNavigation } = navigation;

test('main tabs keep the approved five-destination order', () => {
  assert.deepEqual(MAIN_TAB_DESTINATIONS, ['home', 'log', 'training', 'knowledge', 'more']);
});

test('next main tab follows order and has no wraparound', () => {
  assert.deepEqual(MAIN_TAB_DESTINATIONS.map((page) => nextMainTabDestination(page, 'left')), ['log', 'training', 'knowledge', 'more', undefined]);
  assert.deepEqual(MAIN_TAB_DESTINATIONS.map((page) => nextMainTabDestination(page, 'right')), [undefined, 'home', 'log', 'training', 'knowledge']);
});

test('auxiliary pages do not enter swipe navigation; checklist keeps Home selected', () => {
  const auxiliaryPages = ['health', 'planned-health', 'passport', 'profile', 'notification-settings', 'account-settings', 'beta-info', 'checklist'];
  for (const page of auxiliaryPages) {
    assert.equal(nextMainTabDestination(page, 'left'), undefined);
    assert.equal(nextMainTabDestination(page, 'right'), undefined);
    assert.equal(activeMainTabDestination(page), page === 'checklist' ? 'home' : 'more');
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


test('requesting the current tab is a no-op before guard and context changes', () => {
  const calls = [];
  const result = requestMainTabNavigation('log', 'log', () => calls.push('guard'), (destination) => calls.push(`commit:${destination}`));
  assert.equal(result, 'same');
  assert.deepEqual(calls, []);
});

test('navigation requests the editor guard before committing destination side effects', () => {
  const calls = [];
  let confirmLeave;
  const result = requestMainTabNavigation('log', 'training', (commit) => { calls.push('guard'); confirmLeave = commit; }, (destination) => { calls.push(`context:${destination}`); calls.push(`page:${destination}`); });
  assert.equal(result, 'requested');
  assert.deepEqual(calls, ['guard']);
  confirmLeave();
  assert.deepEqual(calls, ['guard', 'context:training', 'page:training']);
});

test('stay and locked guards leave parent destination/context untouched', () => {
  for (const guardMode of ['stay', 'locked']) {
    const calls = [];
    requestMainTabNavigation('log', 'knowledge', () => { calls.push(`guard:${guardMode}`); }, (destination) => calls.push(`commit:${destination}`));
    assert.deepEqual(calls, [`guard:${guardMode}`]);
  }
});

test('the first destination stays authoritative while a discard alert is open', () => {
  let alertOpen = false;
  let firstCommit;
  const commits = [];
  const requestLeave = (commit) => { if (alertOpen) return; alertOpen = true; firstCommit = commit; };
  requestMainTabNavigation('log', 'training', requestLeave, (destination) => commits.push(destination));
  requestMainTabNavigation('log', 'more', requestLeave, (destination) => commits.push(destination));
  firstCommit();
  assert.deepEqual(commits, ['training']);
});

test('insights detail stays under the Logg tab without becoming a swipe destination', () => {
  assert.equal(activeMainTabDestination('insights'), 'log');
  assert.equal(isMainTabDestination('insights'), false);
  assert.equal(nextMainTabDestination('insights', 'left'), undefined);
  const calls = [];
  requestMainTabNavigation('insights', 'log', () => calls.push('guard'), destination => calls.push(destination));
  assert.deepEqual(calls, ['guard']);
});
