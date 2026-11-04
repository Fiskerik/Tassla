import test from 'node:test';
import assert from 'node:assert/strict';
import { createDailyRingMotionIntent } from '../src/features/home/daily-ring-motion.ts';

const initial = () => ({ scope: 'owner:dog:day', complete: true, activities: [{ id: 'a', completed: false }, { id: 'b', completed: false }], mutationKey: '', busy: false, error: false, refreshing: false, reduced: false });
const pending = (state, changes = {}) => ({ ...state, mutationKey: 'complete:a', busy: true, ...changes });
const saved = (state, changes = {}) => ({ ...state, mutationKey: 'complete:a', busy: false, activities: [{ id: 'a', completed: true }, { id: 'b', completed: false }], ...changes });

test('only a matching user request followed by pending and confirmed readback animates', () => {
  const intent = createDailyRingMotionIntent(), state = initial();
  assert.equal(intent.observe(saved(state)), null);
  intent.request(state, 'a', 'complete:a', true);
  assert.equal(intent.observe(pending(state)), null);
  assert.deepEqual(intent.observe(saved(state)), { from: 0, to: 0.5 });
  assert.equal(intent.observe(saved(state)), null);
});

test('failure, unknown, scope changes or another activity permanently discard the intent', () => {
  for (const change of [
    { error: true }, { scope: 'owner:other-dog:day' }, { complete: false },
    { activities: [{ id: 'a', completed: false }, { id: 'b', completed: true }] },
    { activities: [{ id: 'a', completed: false }] },
    { mutationKey: 'complete:b', busy: true },
  ]) {
    const intent = createDailyRingMotionIntent(), state = initial();
    intent.request(state, 'a', 'complete:a', true);
    intent.observe(pending(state, change));
    assert.equal(intent.observe(saved(state)), null);
  }
});

test('undo, busy presses, unobserved pending and reduced motion never animate later', () => {
  for (const mode of ['undo', 'busy', 'no-pending', 'reduced', 'retry']) {
    const intent = createDailyRingMotionIntent(), state = initial();
    intent.request(mode === 'busy' ? pending(state) : state, 'a', 'complete:a', mode !== 'undo');
    if (mode !== 'no-pending') intent.observe(pending(state));
    if (mode === 'retry') intent.observe({ ...state, mutationKey: 'complete:a', error: true });
    assert.equal(intent.observe(saved(state, { reduced: mode === 'reduced' })), null);
    assert.equal(intent.observe(saved(state)), null);
  }
});

test('a second press discards the first intent and changing two completion states is not confirmation', () => {
  const intent = createDailyRingMotionIntent(), state = initial();
  intent.request(state, 'a', 'complete:a', true);
  intent.request(pending(state), 'b', 'complete:b', true);
  assert.equal(intent.observe(saved(state)), null);
  const withDone = { ...state, activities: [{ id: 'a', completed: false }, { id: 'b', completed: true }] };
  intent.request(withDone, 'a', 'complete:a', true);
  intent.observe(pending(withDone));
  assert.equal(intent.observe(saved(withDone)), null);
});
