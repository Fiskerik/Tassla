import test from 'node:test';
import assert from 'node:assert/strict';
import { formatReminderTime, isReminderPreferencesDraftDirty, parseReminderTime } from '../src/features/notifications/reminder-preferences-draft.ts';

const saved = { version: 1, enabled: false, trainingEnabled: false, trainingMinutes: 510 };
const cleanDraft = { enabled: false, trainingEnabled: false, trainingTime: '08:30' };

test('saved reminder fields are clean and can be reverted independently', () => {
  assert.equal(isReminderPreferencesDraftDirty(saved, cleanDraft), false);
  assert.equal(isReminderPreferencesDraftDirty(saved, { ...cleanDraft, enabled: true }), true);
  assert.equal(isReminderPreferencesDraftDirty(saved, { ...cleanDraft, trainingEnabled: true }), true);
  assert.equal(isReminderPreferencesDraftDirty(saved, { ...cleanDraft, trainingTime: '08:31' }), true);
  assert.equal(isReminderPreferencesDraftDirty(saved, cleanDraft), false);
});

test('invalid edited time remains dirty while the canonical saved time stays clean', () => {
  assert.equal(formatReminderTime(510), '08:30');
  assert.equal(isReminderPreferencesDraftDirty(saved, { ...cleanDraft, trainingTime: '25:90' }), true);
  assert.equal(isReminderPreferencesDraftDirty(saved, { ...cleanDraft, trainingTime: '08:30' }), false);
});

test('reminder time parser accepts only valid local HH:mm values', () => {
  assert.equal(parseReminderTime('00:00'), 0);
  assert.equal(parseReminderTime('23:59'), 1439);
  assert.equal(parseReminderTime(' 08:30 '), 510);
  for (const invalid of ['24:00', '12:60', '8:30', '', '09:3x']) {
    assert.equal(parseReminderTime(invalid), null, invalid);
  }
});
