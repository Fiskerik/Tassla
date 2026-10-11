import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

test('shared time modal commits only a valid temporary choice and leaves cancel paths untouched', async () => {
  const source = await readFile(new URL('../src/components/AppPrimitives.tsx', import.meta.url), 'utf8');
  const picker = source.slice(source.indexOf('export function TimePickerField'), source.indexOf('\nfunction parseDateValue'));
  assert.match(picker, /setDraft\(value\); setVisible\(true\)/);
  assert.match(picker, /onChangeText=\{setDraft\}/);
  assert.match(picker, /accessibilityState=\{\{ selected: draft === time \}\}/);
  assert.match(picker, /accessibilityLabel="Bekräfta tid"/);
  assert.match(picker, /disabled=\{!validDraft\}/);
  assert.match(picker, /onRequestClose=\{\(\) => setVisible\(false\)\}/);
  assert.match(picker, /onPress=\{\(\) => setVisible\(false\)\}/);
  assert.match(picker, /animationType=\{reducedMotion \? 'none' : 'slide'\}/);
});
