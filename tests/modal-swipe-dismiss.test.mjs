import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';

const reactNativeStub = `
  globalThis.__modalRn = { springs: [] };
  export class Value { constructor(v) { this.value = v; this.stopped = 0; } setValue(v) { this.value = v; } stopAnimation() { this.stopped += 1; } interpolate(config) { return { config }; } }
  export const Animated = { Value, createAnimatedComponent(component) { return component; }, spring(v, cfg) { return { start(done) { globalThis.__modalRn.springs.push(cfg); v.value = cfg.toValue; done?.(); }, stop() { cfg.stopped = true; } }; }, timing(v, cfg) { return { start(done) { v.value = cfg.toValue; done?.(); }, stop() {} }; } };
  export const PanResponder = { create(config) { return { panHandlers: config }; } };
  export const StyleSheet = { create(value) { return value; } };
  export const View = () => null;
  export const Pressable = () => null;
  export const Easing = { cubic: {}, out(value) { return value; } };
  export const AccessibilityInfo = { addEventListener() { return { remove() {} }; }, isReduceMotionEnabled() { return Promise.resolve(false); } };
  export const Platform = { select(values) { return values.default; } };
`;
const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'react-native') return { url: `data:text/javascript,${encodeURIComponent(reactNativeStub)}`, shortCircuit: true };
    return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier);
  },
});
const dismiss = await import('../src/components/ui/modal-swipe-dismiss.ts');
const { Animated } = await import('react-native');
hook.deregister();

const read = (file) => readFileSync(path.join(process.cwd(), file), 'utf8');
const gesture = (dx, dy = 0, vx = 0) => ({ dx, dy, vx });

function setup(overrides = {}) {
  const translateX = new Animated.Value(0);
  const closes = [];
  const controller = dismiss.createModalSwipeDismiss(translateX);
  const state = { enabled: true, reduced: false, onRequestClose: () => closes.push('close'), ...overrides };
  controller.update(state);
  globalThis.__modalRn.springs.length = 0;
  return { controller, translateX, closes, state, handlers: controller.panHandlers };
}

test('horizontal modal intent requires a clear horizontal axis and ignores tap, vertical, and diagonal movement', () => {
  assert.equal(dismiss.shouldClaimModalSwipe(dismiss.MODAL_SWIPE_START - 1, 0), false);
  assert.equal(dismiss.shouldClaimModalSwipe(dismiss.MODAL_SWIPE_START, 0), true);
  assert.equal(dismiss.shouldClaimModalSwipe(44, 40), false);
  assert.equal(dismiss.shouldClaimModalSwipe(-60, 70), false);
  assert.equal(dismiss.shouldClaimModalSwipe(80, -20), true);
});

test('modal dismissal requires distance or a directional flick and clamps direct manipulation', () => {
  assert.equal(dismiss.shouldDismissModalSwipe(dismiss.MODAL_SWIPE_DISTANCE, 0), true);
  assert.equal(dismiss.shouldDismissModalSwipe(dismiss.MODAL_SWIPE_DISTANCE - 1, 0.1), false);
  assert.equal(dismiss.shouldDismissModalSwipe(dismiss.MODAL_SWIPE_MIN_FLICK_DISTANCE, dismiss.MODAL_SWIPE_VELOCITY), true);
  assert.equal(dismiss.shouldDismissModalSwipe(-30, 1), false, 'a reverse flick does not complete the drag');
  assert.equal(dismiss.modalSwipeOffset(80), 80);
  assert.equal(dismiss.modalSwipeOffset(500), 144);
  assert.equal(dismiss.modalSwipeOffset(-500), -144);
});

test('controller follows the finger, springs a short drag back, and closes only after a completed gesture', () => {
  const { handlers, translateX, closes } = setup();
  assert.equal(handlers.onStartShouldSetPanResponder(), false);
  handlers.onPanResponderMove({}, gesture(-56));
  assert.equal(translateX.value, -56);
  handlers.onPanResponderRelease({}, gesture(-56));
  assert.deepEqual(closes, []);
  assert.equal(globalThis.__modalRn.springs.length, 1);
  handlers.onPanResponderMove({}, gesture(100));
  handlers.onPanResponderRelease({}, gesture(100));
  assert.deepEqual(closes, ['close']);
});

test('a guard refusal returns the modal to center, while parent dismissal cancels the return', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const refused = setup();
  refused.handlers.onPanResponderMove({}, gesture(100));
  refused.handlers.onPanResponderRelease({}, gesture(100));
  t.mock.timers.tick(dismiss.MODAL_CLOSE_DECISION_MS + 1);
  assert.equal(refused.translateX.value, 0);
  assert.equal(globalThis.__modalRn.springs.length, 1);

  const closing = setup();
  closing.handlers.onPanResponderMove({}, gesture(-120));
  closing.handlers.onPanResponderRelease({}, gesture(-120));
  closing.controller.update({ ...closing.state, enabled: false });
  t.mock.timers.tick(dismiss.MODAL_CLOSE_DECISION_MS + 1);
  assert.equal(globalThis.__modalRn.springs.length, 0, 'a closing modal does not spring back');
});

test('reduced motion snaps directly back and disabled modals cannot claim or invoke close', () => {
  const reduced = setup({ reduced: true });
  reduced.handlers.onPanResponderMove({}, gesture(42));
  reduced.handlers.onPanResponderRelease({}, gesture(42));
  assert.equal(reduced.translateX.value, 0);
  assert.equal(globalThis.__modalRn.springs.length, 0);

  const disabled = setup({ enabled: false });
  assert.equal(disabled.handlers.onMoveShouldSetPanResponder({}, gesture(100)), false);
  disabled.handlers.onPanResponderRelease({}, gesture(120));
  assert.deepEqual(disabled.closes, []);
});

test('each owned modal exposes only a dedicated handle and reuses its existing close guard', () => {
  for (const file of ['src/components/ui/BottomSheet.tsx', 'src/components/ui/Dialog.tsx', 'src/components/ui/ActionMenu.tsx']) {
    const source = read(file);
    assert.match(source, /ModalSwipeHandle panHandlers=\{swipe\.panHandlers\}/, file);
    assert.match(source, /useModalSwipeDismiss\(visible, on(?:RequestClose|Close), reduced\)/, file);
  }
  const app = read('src/components/AppPrimitives.tsx');
  assert.equal((app.match(/ModalSwipeHandle panHandlers=\{swipe\.panHandlers\}/g) ?? []).length, 3, 'InfoModal, DatePicker and TimePicker');
  const feedbackModal = app.slice(app.indexOf('export function ActionFeedbackModal'), app.indexOf('export function DatePickerField'));
  assert.doesNotMatch(feedbackModal, /ModalSwipeHandle/);
  const helper = read('src/components/ui/modal-swipe-dismiss.ts');
  assert.match(helper, /inputs\.onRequestClose\(\)/);
  assert.match(helper, /minHeight: tokens\.size\.touchMin/);
  assert.match(helper, /testID: 'modal-swipe-dismiss-handle'/);
  assert.match(helper, /importantForAccessibility: 'no-hide-descendants'/);
});
