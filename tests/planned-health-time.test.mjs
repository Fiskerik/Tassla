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
  assert.match(picker, /animationType=\{reducedMotion \? 'none' : 'fade'\}/);
  assert.match(picker, /testID="center-modal-time-picker"/);
  assert.match(picker, /paddingTop: Math\.max\(insets\.top, tokens\.spacing\.md\), paddingBottom: Math\.max\(insets\.bottom, tokens\.spacing\.md\)/);
});


test('date and time triggers use labeled icon controls without changing the field values', async () => {
  const source = await readFile(new URL('../src/components/AppPrimitives.tsx', import.meta.url), 'utf8');
  const datePicker = source.slice(source.indexOf('export function DatePickerField'), source.indexOf('export function TimePickerField'));
  const timePicker = source.slice(source.indexOf('export function TimePickerField'), source.indexOf('\nfunction parseDateValue'));
  assert.match(datePicker, /accessibilityLabel={`Öppna kalender för \$\{label\}`}/);
  assert.match(datePicker, /name="calendar-outline"/);
  assert.match(datePicker, /value=\{value\}/);
  assert.match(timePicker, /accessibilityLabel={`Öppna tidsväljare för \$\{label\}`}/);
  assert.match(timePicker, /name="time-outline"/);
  assert.match(timePicker, /value=\{value\}/);
});

test('calendar month controls are labeled icon buttons and date layout fits seven 44pt cells at 375pt', async () => {
  const source = await readFile(new URL('../src/components/AppPrimitives.tsx', import.meta.url), 'utf8');
  const tokens = await readFile(new URL('../src/theme/tokens.ts', import.meta.url), 'utf8');
  assert.match(source, /variant="icon" label="Föregående månad" accessibilityLabel={`Visa månaden före \$\{monthLabel\}`}/);
  assert.match(source, /variant="icon" label="Nästa månad" accessibilityLabel={`Visa månaden efter \$\{monthLabel\}`}/);
  assert.match(source, /setMonth\(\(currentMonth\) => shiftCalendarMonth\(currentMonth, -1\)\)/);
  assert.match(source, /setMonth\(\(currentMonth\) => shiftCalendarMonth\(currentMonth, 1\)\)/);
  assert.match(source, /<View style=\{styles\.dateModalBackdrop\}><Animated\.View testID="center-modal-date-picker" style=\{\[styles\.dateModalCard, \{ transform: \[\{ translateX: swipe\.translateX \}\] \}\]\}>/);
  assert.match(source, /<ModalSwipeHandle panHandlers=\{swipe\.panHandlers\} \/>/);
  assert.match(source, /dateModalBackdrop: \{[^}]*justifyContent: 'center'/);
  assert.match(source, /dateModalBackdrop: \{[^}]*paddingHorizontal: tokens\.spacing\.sm/s);
  assert.match(source, /dateModalCard: \{[^}]*padding: tokens\.spacing\.sm/s);
  assert.match(source, /calendarDay: \{ width: tokens\.size\.touchMin, height: tokens\.size\.touchMin/s);
  const spacing = Number(tokens.match(/spacing: \{[^}]*sm: (\d+)/s)?.[1]);
  const touchMin = Number(tokens.match(/touchMin: (\d+)/)?.[1]);
  const gridWidth = 375 - 4 * spacing;
  assert.equal(spacing, 8);
  assert.equal(touchMin, 44);
  assert.equal(gridWidth, 343);
  assert.ok(gridWidth >= 7 * touchMin);
});
