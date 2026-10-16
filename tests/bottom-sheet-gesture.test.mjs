import test from 'node:test';
import assert from 'node:assert/strict';
import { createBottomSheetDragSession, getBottomSheetDragOffset, shouldClaimBottomSheetDismissGesture, shouldDismissBottomSheet } from '../src/components/ui/bottom-sheet-gesture.ts';

test('claims only deliberate downward dominant movement after the intent distance', () => {
  assert.equal(shouldClaimBottomSheetDismissGesture(0, 7, 8), false);
  assert.equal(shouldClaimBottomSheetDismissGesture(0, 8, 8), true);
  assert.equal(shouldClaimBottomSheetDismissGesture(8, 8, 8), false);
  assert.equal(shouldClaimBottomSheetDismissGesture(9, 8, 8), false);
  assert.equal(shouldClaimBottomSheetDismissGesture(0, -20, 8), false);
});

test('dismissal requires the full downward distance; velocity does not participate', () => {
  assert.equal(shouldDismissBottomSheet(-120, 120), false);
  assert.equal(shouldDismissBottomSheet(119, 120), false);
  assert.equal(shouldDismissBottomSheet(120, 120), true);
  assert.equal(shouldDismissBottomSheet(121, 120), true);
});

test('a delayed animation read uses the latest drag delta without moving above its sampled offset', () => {
  const session = createBottomSheetDragSession();
  const appliedOffsets = [];
  const sessionId = session.begin();
  let postGrantDistance = 0;
  const delayedAnimationRead = (currentOffset) => {
    if (!session.isCurrent(sessionId)) return;
    appliedOffsets.push(getBottomSheetDragOffset(currentOffset, 8, postGrantDistance));
  };

  postGrantDistance = -20;
  delayedAnimationRead(42);
  postGrantDistance = -5;
  delayedAnimationRead(42);
  assert.deepEqual(appliedOffsets, [42, 45]);
  assert.equal(getBottomSheetDragOffset(80, 30, -20), 90);

  session.invalidate();
  delayedAnimationRead(42);
  assert.deepEqual(appliedOffsets, [42, 45]);
});

test('late animation callbacks are invalidated by replacement, release, and effect teardown', () => {
  const session = createBottomSheetDragSession();
  const appliedOffsets = [];
  const applyAnimationRead = (sessionId, offset) => {
    if (!session.isCurrent(sessionId)) return;
    appliedOffsets.push(offset);
  };

  const first = session.begin();
  assert.equal(session.isCurrent(first), true);
  applyAnimationRead(first, 14);
  assert.deepEqual(appliedOffsets, [14]);

  const replacement = session.begin();
  assert.equal(session.isCurrent(first), false);
  assert.equal(session.isCurrent(replacement), true);
  applyAnimationRead(first, 90);
  applyAnimationRead(replacement, 32);
  assert.deepEqual(appliedOffsets, [14, 32]);

  session.invalidate();
  assert.equal(session.isCurrent(replacement), false);
  applyAnimationRead(replacement, 75);
  assert.deepEqual(appliedOffsets, [14, 32]);

  const afterCleanup = session.begin();
  assert.equal(session.isCurrent(afterCleanup), true);
  session.invalidate();
  assert.equal(session.isCurrent(afterCleanup), false);
  applyAnimationRead(afterCleanup, 100);
  assert.deepEqual(appliedOffsets, [14, 32]);
});
