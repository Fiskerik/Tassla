import test from 'node:test';
import assert from 'node:assert/strict';

const model = await import('../src/features/training/training-timeline-model.ts');

const steps = [
  { id: 'recall', position: 0, title: 'Inkallning', instruction: 'Öva lugnt.' },
  { id: 'handling', position: 1, title: 'Hantering', instruction: 'Låt hunden välja.' },
  { id: 'meetings', position: 2, title: 'Hundmöten', instruction: 'Håll avstånd.' },
];

test('timeline distinguishes confirmed milestone, previous, active and upcoming states', () => {
  const entries = model.buildTrainingTimeline(
    steps,
    'handling',
    { recall: '2026-08-15T12:00:00.000Z' },
    {},
    new Set(),
    new Date('2026-10-26T12:00:00.000Z'),
    'Europe/Stockholm',
  );

  assert.deepEqual(entries.map(({ state }) => state), ['confirmed', 'active', 'upcoming']);
  assert.equal(entries[0].statusLabel, 'Delmål bekräftat · 15 augusti');
  assert.equal(entries[1].statusLabel, 'Aktivt steg');
  assert.equal(entries[2].statusLabel, 'Kommande');
});

test('stale legacy activity on a future step stays upcoming and is labelled separately', () => {
  const entries = model.buildTrainingTimeline(
    steps,
    'handling',
    {},
    { meetings: '2026-10-01T12:00:00.000Z' },
    new Set(['meetings']),
    new Date('2026-10-26T12:00:00.000Z'),
    'Europe/Stockholm',
  );

  assert.equal(entries[2].state, 'upcoming');
  assert.equal(entries[2].statusLabel, 'Kommande');
  assert.equal(entries[2].legacyActivityLabel, 'Aktivitet markerad · 1 oktober');
  assert.doesNotMatch(entries[2].statusLabel, /bekräft|klar/i);
});

test('a saved active position stays actionable after returning to an already confirmed milestone', () => {
  const entries = model.buildTrainingTimeline(
    steps,
    'recall',
    { recall: '2026-08-15T12:00:00.000Z' },
    {},
    new Set(),
    new Date('2026-10-26T12:00:00.000Z'),
    'Europe/Stockholm',
  );

  assert.equal(entries[0].state, 'active');
  assert.equal(entries[0].statusLabel, 'Aktivt steg');
  assert.equal(entries[0].milestoneLabel, 'Delmål bekräftat · 15 augusti');
  assert.equal(entries[1].state, 'upcoming');
});

test('milestone dates use local day and omit the year only within the current local calendar year', () => {
  const now = new Date('2026-12-31T23:30:00.000Z');
  assert.equal(model.formatTrainingTimelineDate('2027-01-01T00:30:00.000Z', now, 'Europe/Stockholm'), '1 januari');
  assert.equal(model.formatTrainingTimelineDate('2025-08-15T01:00:00.000Z', now, 'America/Los_Angeles'), '14 augusti 2025');
  assert.equal(model.formatTrainingTimelineDate('2025-08-15T12:00:00.000Z', now, 'Europe/Stockholm'), '15 augusti 2025');
});

test('missing and invalid timestamps are omitted instead of guessed', () => {
  const now = new Date('2026-10-26T12:00:00.000Z');
  assert.equal(model.formatTrainingTimelineDate(undefined, now, 'Europe/Stockholm'), null);
  assert.equal(model.formatTrainingTimelineDate('not-a-date', now, 'Europe/Stockholm'), null);
  assert.equal(model.formatTrainingTimelineDate('2026-02-31T10:00:00.000Z', now, 'Europe/Stockholm'), null);
  assert.equal(model.formatTrainingTimelineDate('2026-08-15', now, 'not-a-time-zone'), null);
});
