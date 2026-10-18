import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const rules = await import('../src/components/ui/main-swipe-rules.ts');
const {
  MAIN_SWIPE_CLAIM_DISTANCE,
  MAIN_SWIPE_COMMIT_DISTANCE,
  MAIN_SWIPE_FLICK_VELOCITY,
  MAIN_SWIPE_HORIZONTAL_RATIO,
  MAIN_SWIPE_MIN_FLICK_DISTANCE,
  mainSwipeDirection,
  shouldClaimMainSwipe,
} = rules;
const read = (file) => readFileSync(path.join(process.cwd(), file), 'utf8');

test('claims early only when horizontal movement clearly dominates', () => {
  assert.ok(MAIN_SWIPE_CLAIM_DISTANCE < 20);
  assert.equal(shouldClaimMainSwipe(MAIN_SWIPE_CLAIM_DISTANCE, 0), false);
  assert.equal(shouldClaimMainSwipe(MAIN_SWIPE_CLAIM_DISTANCE + 1, 0), true);
  assert.equal(shouldClaimMainSwipe(-14, 3), true);
  assert.equal(shouldClaimMainSwipe(30, 20), false);
  assert.equal(shouldClaimMainSwipe(30, 15), false, 'ratio must be strictly greater than two');
  assert.equal(shouldClaimMainSwipe(0, 40), false);
  assert.equal(MAIN_SWIPE_HORIZONTAL_RATIO, 2);
});

test('left moves forward and right moves backward after a long swipe', () => {
  assert.equal(mainSwipeDirection(-MAIN_SWIPE_COMMIT_DISTANCE, 0, 0), 'left');
  assert.equal(mainSwipeDirection(MAIN_SWIPE_COMMIT_DISTANCE, 0, 0), 'right');
});

test('a short slow drag does nothing, while a same-direction fast flick changes tab', () => {
  assert.equal(mainSwipeDirection(-(MAIN_SWIPE_COMMIT_DISTANCE - 1), 0, -0.1), null);
  assert.equal(mainSwipeDirection(-MAIN_SWIPE_MIN_FLICK_DISTANCE, 0, -MAIN_SWIPE_FLICK_VELOCITY), 'left');
  assert.equal(mainSwipeDirection(MAIN_SWIPE_MIN_FLICK_DISTANCE, 0, MAIN_SWIPE_FLICK_VELOCITY), 'right');
  assert.equal(mainSwipeDirection(-(MAIN_SWIPE_MIN_FLICK_DISTANCE - 1), 0, -3), null);
  assert.equal(mainSwipeDirection(-30, 0, 0.5), null, 'a flick in the opposite direction is ignored');
});

test('vertical-dominant release does not change tab', () => {
  assert.equal(mainSwipeDirection(-60, 70, -1), null);
});

test('the responder captures early, keeps child exclusions, and fills the page surface', () => {
  const source = read('src/components/ui/MainSwipeNavigation.tsx');
  assert.match(source, /onMoveShouldSetPanResponderCapture/);
  assert.match(source, /onPanResponderTerminationRequest: \(_, gesture\) => !shouldClaimMainSwipe\(gesture\.dx, gesture\.dy\)/,
    'yield an already captured touch if later movement is no longer clearly horizontal');
  assert.match(source, /surface: \{ flexGrow: 1 \}/);
  assert.match(source, /shouldClaimMainSwipe/);
  assert.match(source, /mainSwipeDirection\(gesture\.dx, gesture\.dy, gesture\.vx\)/);
  assert.match(source, /!excluded/);
  assert.match(source, /onTouchCancel=\{finish\}/);
});

test('the shared page ScrollView locks its direction', () => {
  assert.match(read('src/components/AppPrimitives.tsx'), /<ScrollView ref=\{scroll\}[^>]*directionalLockEnabled/);
});
