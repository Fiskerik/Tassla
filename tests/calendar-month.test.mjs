import assert from 'node:assert/strict';
import test from 'node:test';
import { shiftCalendarMonth } from '../src/components/calendar-month.ts';

test('calendar month navigation crosses both year boundaries', () => {
  const december = new Date(2026, 11, 1);
  const january = new Date(2027, 0, 1);
  assert.equal(shiftCalendarMonth(december, 1).getTime(), january.getTime());
  assert.equal(shiftCalendarMonth(january, -1).getTime(), december.getTime());
});

test('calendar month navigation always selects the first day', () => {
  const result = shiftCalendarMonth(new Date(2026, 4, 29), 1);
  assert.equal(result.getFullYear(), 2026);
  assert.equal(result.getMonth(), 5);
  assert.equal(result.getDate(), 1);
});
