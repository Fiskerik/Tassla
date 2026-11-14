import test from 'node:test';
import assert from 'node:assert/strict';
import { unresolvedInsertForDay } from '../src/features/puppy-log/log-pending-row.ts';

const mutation = { kind: 'add', status: 'pending', id: 'one', occurredAt: '2026-11-11T12:00:00Z' };
const localDate = (date) => date.slice(0, 10);
const row = (value, day = '2026-11-11', ids = []) => unresolvedInsertForDay(value, day, ids, localDate);

test('insert is visible only on its day while the first write is pending', () => {
  assert.equal(row(mutation), mutation);
  const unsure = { ...mutation, status: 'unsure' };
  assert.equal(row(unsure), null);
  assert.equal(row(unsure, '2026-11-10'), null);
  assert.equal(row(mutation, '2026-11-11', ['one']), null);
  for (const status of ['failed', 'saved']) assert.equal(row({ ...mutation, status }), null);
  assert.equal(row({ ...mutation, kind: 'update' }), null);
  assert.equal(row(null), null);
});
