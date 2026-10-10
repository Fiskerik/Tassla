import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePlannedHealthTime } from '../src/features/health/planned-health-time.ts';

test('planned health reminder time converts valid HH:MM to minutes after midnight', () => {
  assert.equal(parsePlannedHealthTime('00:00'), 0);
  assert.equal(parsePlannedHealthTime('23:59'), 1439);
  assert.equal(parsePlannedHealthTime(' 09:05 '), 545);
});

test('planned health reminder time rejects malformed and out-of-range values', () => {
  for (const value of ['9:05', '09:5', '0905', '09.05', '', '  ', '24:00', '12:60', '99:99']) {
    assert.equal(parsePlannedHealthTime(value), null, value);
  }
});
