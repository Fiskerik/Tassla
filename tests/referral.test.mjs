import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPendingReferral,
  KENNEL_REFERRAL_TTL_MS,
  normalizeKennelCode,
  parseKennelJoinUrl,
  parsePendingReferral,
  clearPendingReferral,
  PENDING_REFERRAL_KEY,
  readPendingReferral,
  savePendingReferral,
} from '../src/onboarding-referral/referral-model.ts';

test('kennel code normalizes and enforces the closed code format', () => {
  assert.equal(normalizeKennelCode(' kennel-42 '), 'KENNEL-42');
  for (const value of ['', 'ABC', 'A'.repeat(41), 'KENNEL 42', 'ÄKENNEL']) {
    assert.equal(normalizeKennelCode(value), null);
  }
});

test('join parser accepts only the exact custom-scheme route and one code', () => {
  assert.equal(parseKennelJoinUrl('tassla://join?code=KENNEL-42'), 'KENNEL-42');
  for (const value of [
    'https://join?code=KENNEL-42',
    'tassla://auth/callback?code=KENNEL-42',
    'tassla://join/path?code=KENNEL-42',
    'tassla://user@join?code=KENNEL-42',
    'tassla://join?code=KENNEL-42&code=OTHER-42',
    'tassla://join?code=KENNEL-42&next=https%3A%2F%2Fexample.com',
    'tassla://join?code=KENNEL-42#fragment',
    'tassla://join?code=bad%20code',
  ]) assert.equal(parseKennelJoinUrl(value), null, value);
});

test('pending referral accepts only code and captured time within seven days', () => {
  const now = 1_800_000_000_000;
  assert.deepEqual(createPendingReferral(' kennel-42 ', now), { code: 'KENNEL-42', capturedAt: now });
  assert.deepEqual(parsePendingReferral(JSON.stringify({ code: 'KENNEL-42', capturedAt: now }), now), {
    code: 'KENNEL-42', capturedAt: now,
  });
  for (const value of [
    JSON.stringify({ code: 'KENNEL-42', capturedAt: now - KENNEL_REFERRAL_TTL_MS - 1 }),
    JSON.stringify({ code: 'KENNEL-42', capturedAt: now + 1 }),
    JSON.stringify({ code: 'KENNEL-42', capturedAt: now, ownerId: 'owner' }),
    '{broken',
  ]) assert.equal(parsePendingReferral(value, now), null);
});

test('storage keeps only a pending code, clears invalid/expired state and supports opt-out', async () => {
  let value = null;
  const calls = [];
  const storage = {
    async getItemAsync(key) { calls.push(['get', key]); return value; },
    async setItemAsync(key, next) { calls.push(['set', key]); value = next; },
    async deleteItemAsync(key) { calls.push(['delete', key]); value = null; },
  };
  const now = 1_800_000_000_000;
  assert.equal(await savePendingReferral(storage, 'KENNEL-42', now), true);
  assert.equal(calls[0][1], PENDING_REFERRAL_KEY);
  assert.deepEqual(JSON.parse(value), { code: 'KENNEL-42', capturedAt: now });
  assert.deepEqual(await readPendingReferral(storage, now), { code: 'KENNEL-42', capturedAt: now });
  assert.equal(await readPendingReferral(storage, now + KENNEL_REFERRAL_TTL_MS + 1), null);
  assert.equal(value, null);
  assert.equal(await savePendingReferral(storage, 'bad code', now), false);
  await savePendingReferral(storage, 'KENNEL-42', now);
  await clearPendingReferral(storage);
  assert.equal(value, null);
});
