import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';

// Minimal react-native stub: PanResponder.create returns the config as panHandlers, Animated records values and springs.
const reactNativeStub = `
  globalThis.__sheetRn = { springs: [] };
  export class Value { constructor(v) { this.value = v; this.stopped = 0; } setValue(v) { this.value = v; } stopAnimation() { this.stopped += 1; } }
  export const Animated = { Value, spring(v, cfg) { return { start() { globalThis.__sheetRn.springs.push(cfg); v.value = cfg.toValue; }, stop() { cfg.stopped = true; } }; } };
  export const PanResponder = { create(config) { return { panHandlers: config }; } };
`;
const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'react-native') return { url: `data:text/javascript,${encodeURIComponent(reactNativeStub)}`, shortCircuit: true };
    return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier);
  },
});
const rules = await import('../src/components/ui/sheet-dismiss.ts');
const { createSheetDrag, SHEET_CLOSE_DECISION_MS } = await import('../src/components/ui/sheet-drag.ts');
const { Animated } = await import('react-native');
hook.deregister();
const { SHEET_DISMISS_DISTANCE, SHEET_DISMISS_MIN_FLICK_DISTANCE, SHEET_DISMISS_VELOCITY, SHEET_DRAG_START, sheetDragOffset, shouldDismissSheet, shouldStartSheetDrag } = rules;
const read = (file) => readFileSync(path.join(process.cwd(), 'src/components/ui', file), 'utf8');
const sheetSource = read('BottomSheet.tsx');
const dragSource = read('sheet-drag.ts');

test('drag starts only for a clearly vertical downward movement', () => {
  assert.equal(shouldStartSheetDrag(0, SHEET_DRAG_START), false, 'must exceed the start threshold');
  assert.equal(shouldStartSheetDrag(0, SHEET_DRAG_START + 1), true);
  assert.equal(shouldStartSheetDrag(0, -40), false, 'upward movement never starts a drag');
  assert.equal(shouldStartSheetDrag(40, 30), false, 'mostly horizontal movement is left alone');
  assert.equal(shouldStartSheetDrag(-40, 30), false);
  assert.equal(shouldStartSheetDrag(10, 20), true);
});

test('the sheet follows the finger downward and cannot be dragged upward', () => {
  assert.equal(sheetDragOffset(-30), 0);
  assert.equal(sheetDragOffset(0), 0);
  assert.equal(sheetDragOffset(57), 57);
});

test('a long slow drag dismisses on release and a short slow drag springs back', () => {
  assert.equal(shouldDismissSheet(SHEET_DISMISS_DISTANCE, 0), true);
  assert.equal(shouldDismissSheet(SHEET_DISMISS_DISTANCE - 1, 0.1), false);
  assert.equal(shouldDismissSheet(40, 0.1), false);
});

test('a fast flick dismisses, but a twitch or an upward fling does not', () => {
  assert.equal(shouldDismissSheet(SHEET_DISMISS_MIN_FLICK_DISTANCE, SHEET_DISMISS_VELOCITY), true);
  assert.equal(shouldDismissSheet(SHEET_DISMISS_MIN_FLICK_DISTANCE - 1, 3), false, 'too short to count as a flick');
  assert.equal(shouldDismissSheet(SHEET_DISMISS_MIN_FLICK_DISTANCE, SHEET_DISMISS_VELOCITY - 0.01), false, 'too slow to count as a flick');
  assert.equal(shouldDismissSheet(-100, -3), false);
});

test('BottomSheet keeps tap-outside, the close button and the Android back path', () => {
  assert.match(sheetSource, /onRequestClose=\{onRequestClose\}/, 'Modal back handling');
  assert.equal(sheetSource.match(/accessibilityLabel="Stäng" onPress=\{onRequestClose\}/g)?.length, 2, 'tap-outside area and close button');
});

test('BottomSheet swipe-down goes through the parent onRequestClose so existing guards apply', () => {
  assert.match(dragSource, /inputs\.onRequestClose\(\)/);
  assert.match(dragSource, /shouldDismissSheet\(gesture\.dy, gesture\.vy\)/);
  assert.doesNotMatch(sheetSource + dragSource, /setVisible|setSheet|setSelection/, 'the shared sheet must not own open/close state');
});

test('BottomSheet gesture is limited to the handle and heading, outside the scrolling content', () => {
  const dragArea = sheetSource.indexOf('{...drag.panHandlers}');
  const scroll = sheetSource.indexOf('<ScrollView');
  assert.ok(dragArea > 0 && dragArea < scroll, 'pan handlers sit above the scrolling content');
  assert.equal(sheetSource.match(/\{\.\.\.drag\.panHandlers\}/g)?.length, 1, 'only one drag surface');
});

test('the gesture controller stays stable per mount and is cleaned up on unmount', () => {
  assert.match(sheetSource, /useState\(\(\) => createSheetDrag\(translateY\)\)/, 'one controller per mount');
  assert.match(sheetSource, /useLayoutEffect\(\(\) => \{ drag\.update/, 'inputs updated before paint');
  assert.match(sheetSource, /useEffect\(\(\) => \(\) => drag\.dispose\(\), \[drag\]\)/);
});

const gesture = (dy, vy = 0, dx = 0) => ({ dx, dy, vy });
function setup() {
  const translateY = new Animated.Value(0);
  const closes = [];
  const drag = createSheetDrag(translateY);
  const state = { visible: true, onRequestClose: () => closes.push('close') };
  drag.update(state);
  globalThis.__sheetRn.springs.length = 0;
  return { drag, translateY, closes, state, handlers: drag.panHandlers };
}

test('controller: the sheet follows a downward drag and never moves upward', () => {
  const { handlers, translateY } = setup();
  handlers.onPanResponderMove({}, gesture(60));
  assert.equal(translateY.value, 60);
  handlers.onPanResponderMove({}, gesture(-25));
  assert.equal(translateY.value, 0);
});

test('controller: a short drag springs back without closing', () => {
  const { handlers, translateY, closes } = setup();
  handlers.onPanResponderMove({}, gesture(40));
  handlers.onPanResponderRelease({}, gesture(40, 0.1));
  assert.deepEqual(closes, []);
  assert.equal(globalThis.__sheetRn.springs.length, 1);
  assert.equal(translateY.value, 0);
});

test('controller: a long drag asks the parent to close and stays down when the parent closes', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { handlers, translateY, closes, drag, state } = setup();
  handlers.onPanResponderMove({}, gesture(120));
  handlers.onPanResponderRelease({}, gesture(120));
  assert.deepEqual(closes, ['close']);
  drag.update({ ...state, visible: false });
  t.mock.timers.tick(SHEET_CLOSE_DECISION_MS + 1);
  assert.equal(translateY.value, 120, 'the closing modal animation continues from where the finger left the sheet');
  assert.equal(globalThis.__sheetRn.springs.length, 0);
});

test('controller: when the parent refuses to close (busy or locked) the sheet springs back', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { handlers, translateY, closes } = setup();
  handlers.onPanResponderMove({}, gesture(120));
  handlers.onPanResponderRelease({}, gesture(120));
  assert.deepEqual(closes, ['close']);
  t.mock.timers.tick(SHEET_CLOSE_DECISION_MS + 1);
  assert.equal(globalThis.__sheetRn.springs.length, 1);
  assert.equal(translateY.value, 0);
});

test('controller: dispose cancels a pending spring-back', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { handlers, drag } = setup();
  handlers.onPanResponderRelease({}, gesture(120));
  drag.dispose();
  t.mock.timers.tick(SHEET_CLOSE_DECISION_MS + 1);
  assert.equal(globalThis.__sheetRn.springs.length, 0);
});

test('controller: only a vertical downward move claims the touch, so taps and the close button are untouched', () => {
  const { handlers } = setup();
  assert.equal(handlers.onStartShouldSetPanResponder(), false);
  assert.equal(handlers.onMoveShouldSetPanResponder({}, gesture(2)), false);
  assert.equal(handlers.onMoveShouldSetPanResponder({}, gesture(30, 0, 60)), false);
  assert.equal(handlers.onMoveShouldSetPanResponder({}, gesture(30)), true);
});

test('the decorative handle uses theme tokens only', () => {
  assert.doesNotMatch(sheetSource, /#[\da-f]{3,8}\b/i);
});


test('controller: a fresh drag cancels the previous close-decision timer', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { handlers, translateY } = setup();
  handlers.onPanResponderRelease({}, gesture(120));
  handlers.onPanResponderGrant();
  handlers.onPanResponderMove({}, gesture(50));
  t.mock.timers.tick(SHEET_CLOSE_DECISION_MS + 1);
  assert.equal(translateY.value, 50);
  assert.equal(globalThis.__sheetRn.springs.length, 0);
});

test('controller: close and reopen cancel an old decision and reset the position', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { handlers, translateY, drag, state } = setup();
  handlers.onPanResponderMove({}, gesture(120));
  handlers.onPanResponderRelease({}, gesture(120));
  drag.update({ ...state, visible: false });
  drag.update(state);
  assert.equal(translateY.value, 0);
  t.mock.timers.tick(SHEET_CLOSE_DECISION_MS + 1);
  assert.equal(globalThis.__sheetRn.springs.length, 0);
});

test('controller: dispose stops an active spring', () => {
  const { handlers, drag } = setup();
  handlers.onPanResponderRelease({}, gesture(40));
  const spring = globalThis.__sheetRn.springs[0];
  assert.equal(spring.stopped, undefined);
  drag.dispose();
  assert.equal(spring.stopped, true);
});

test('controller: release uses the latest committed close callback', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { handlers, drag, state, closes } = setup();
  const latest = [];
  drag.update({ ...state, onRequestClose: () => latest.push('latest') });
  handlers.onPanResponderRelease({}, gesture(120));
  assert.deepEqual(closes, []);
  assert.deepEqual(latest, ['latest']);
  drag.dispose();
});

test('controller: hidden sheets cannot claim gestures or close again', () => {
  const { handlers, drag, state, closes } = setup();
  drag.update({ ...state, visible: false });
  assert.equal(handlers.onMoveShouldSetPanResponder({}, gesture(40)), false);
  handlers.onPanResponderRelease({}, gesture(120));
  assert.deepEqual(closes, []);
});

test('controller: a cancelled gesture returns to its resting position', () => {
  const { handlers, translateY, closes } = setup();
  handlers.onPanResponderMove({}, gesture(70));
  handlers.onPanResponderTerminate();
  assert.equal(translateY.value, 0);
  assert.deepEqual(closes, []);
});
