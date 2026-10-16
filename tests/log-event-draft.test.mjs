import test from 'node:test';
import assert from 'node:assert/strict';
import { createLogEvent, isLogEventDraftDirty, localDateTimeParts } from '../src/features/puppy-log/log-model.ts';

function event(overrides = {}) {
  return createLogEvent({
    id: 'event-1',
    dogId: 'dog-1',
    type: 'pee',
    occurredAt: '2026-10-11T04:50:59.000Z',
    note: null,
    ...overrides,
  }, new Date('2026-10-12T00:00:00.000Z'));
}

function draftFrom(source, overrides = {}) {
  const parts = localDateTimeParts(source.occurredAt);
  return {
    type: source.type,
    date: parts.date,
    time: parts.time,
    note: source.note ?? '',
    accidentKinds: source.accidentKinds ?? [],
    ...overrides,
  };
}

test('dirty comparison uses the displayed local date and minute and treats null note as empty', () => {
  const source = event();
  assert.equal(isLogEventDraftDirty(source, draftFrom(source)), false);
  assert.equal(isLogEventDraftDirty(source, draftFrom(source, { time: '05:00' })), true);
  assert.equal(isLogEventDraftDirty(source, draftFrom(source, { date: '2026-10-12' })), true);
});

test('dirty comparison detects type and note changes, then returns clean when values are restored', () => {
  const source = event();
  const changed = draftFrom(source, { type: 'poop', note: 'Ändrad' });
  assert.equal(isLogEventDraftDirty(source, changed), true);
  assert.equal(isLogEventDraftDirty(source, draftFrom(source)), false);
});

test('accident kinds compare in canonical order and detect a real selection change', () => {
  const source = event({ type: 'accident', accidentKinds: ['pee', 'poop'] });
  assert.equal(isLogEventDraftDirty(source, draftFrom(source, { accidentKinds: ['poop', 'pee'] })), false);
  assert.equal(isLogEventDraftDirty(source, draftFrom(source, { accidentKinds: ['pee'] })), true);
});

test('legacy accidentKinds null is equivalent to the empty accident selection', () => {
  const source = event({ type: 'accident', accidentKinds: null });
  assert.equal(isLogEventDraftDirty(source, draftFrom(source, { accidentKinds: [] })), false);
  assert.equal(isLogEventDraftDirty(source, draftFrom(source, { accidentKinds: ['pee'] })), true);
});

test('changing away from accident ignores accident-only fields', () => {
  const source = event({ type: 'accident', accidentKinds: ['pee'] });
  assert.equal(isLogEventDraftDirty(source, draftFrom(source, { type: 'pee', accidentKinds: [] })), true);
  const nonAccident = event({ type: 'pee', accidentKinds: null });
  assert.equal(isLogEventDraftDirty(nonAccident, draftFrom(nonAccident, { accidentKinds: ['pee'] })), false);
});
