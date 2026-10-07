import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EMPTY_PLANNED_HEALTH_FEEDBACK,
  feedbackTimeoutMillis,
  initialPlannedHealthStatus,
  reducePlannedHealthFeedback,
  selectPlannedHealthRecovery,
} from '../src/features/health/planned-health-feedback.ts';

const here = dirname(fileURLToPath(import.meta.url));
const screenSource = readFileSync(resolve(here, '../src/features/health/PlannedHealthScreen.tsx'), 'utf8');
const primitivesSource = readFileSync(resolve(here, '../src/components/AppPrimitives.tsx'), 'utf8');
const workspaceSource = readFileSync(resolve(here, '../src/features/home/ProductWorkspace.tsx'), 'utf8');

test('retained status is observed on mount while a later empty-to-same transition is new', () => {
  let previous = initialPlannedHealthStatus('Sparad.');
  assert.equal(previous, 'Sparad.');
  const empty = initialPlannedHealthStatus('');
  assert.notEqual(empty, previous);
  previous = empty;
  assert.notEqual(initialPlannedHealthStatus('Sparad.'), previous);
  assert.match(screenSource, /useRef<string \| null>\(initialPlannedHealthStatus\(statusMessage\)\)/);
});

test('new status becomes active and an empty status clears it', () => {
  const active = reducePlannedHealthFeedback(EMPTY_PLANNED_HEALTH_FEEDBACK, { type: 'status', message: 'Sparad.', infoVisible: false });
  assert.deepEqual(active, { activeMessage: 'Sparad.', queuedMessage: null });
  assert.deepEqual(reducePlannedHealthFeedback(active, { type: 'status', message: '', infoVisible: false }), EMPTY_PLANNED_HEALTH_FEEDBACK);
});

test('new text replaces the active status and restarts its owning state', () => {
  const first = reducePlannedHealthFeedback(EMPTY_PLANNED_HEALTH_FEEDBACK, { type: 'status', message: 'Första.', infoVisible: false });
  assert.deepEqual(reducePlannedHealthFeedback(first, { type: 'status', message: 'Andra.', infoVisible: false }), { activeMessage: 'Andra.', queuedMessage: null });
});

test('status queues while information is visible and is released after close', () => {
  const queued = reducePlannedHealthFeedback(EMPTY_PLANNED_HEALTH_FEEDBACK, { type: 'status', message: 'Sparad.', infoVisible: true });
  assert.deepEqual(queued, { activeMessage: null, queuedMessage: 'Sparad.' });
  assert.deepEqual(reducePlannedHealthFeedback(queued, { type: 'info-closed' }), { activeMessage: 'Sparad.', queuedMessage: null });
});

test('opening information moves visible feedback into the queue and dismiss keeps recovery separate', () => {
  const active = reducePlannedHealthFeedback(EMPTY_PLANNED_HEALTH_FEEDBACK, { type: 'status', message: 'Kontrollera.', infoVisible: false });
  const queued = reducePlannedHealthFeedback(active, { type: 'info-opened' });
  assert.deepEqual(queued, { activeMessage: null, queuedMessage: 'Kontrollera.' });
  assert.deepEqual(reducePlannedHealthFeedback(queued, { type: 'dismiss' }), queued);
});

test('recommended timeout uses positive finite values and a five-second fallback', () => {
  assert.equal(feedbackTimeoutMillis(7500), 7500);
  assert.equal(feedbackTimeoutMillis(undefined), 5000);
  assert.equal(feedbackTimeoutMillis(Number.NaN), 5000);
  assert.equal(feedbackTimeoutMillis(0), 5000);
});

test('recovery priority and source render matrix expose exactly one action per state', () => {
  assert.equal(selectPlannedHealthRecovery({ conflict: true, pending: true, statusError: true, loadError: true }), 'conflict');
  assert.equal(selectPlannedHealthRecovery({ conflict: false, pending: true, statusError: true, loadError: true }), 'pending');
  assert.equal(selectPlannedHealthRecovery({ conflict: false, pending: false, statusError: true, loadError: true }), 'error');
  assert.equal(selectPlannedHealthRecovery({ conflict: false, pending: false, statusError: false, loadError: false }), null);
  assert.equal((screenSource.match(/title="Försök igen"/g) ?? []).length, 1);
  assert.equal((screenSource.match(/title="Kontrollera sparstatus"/g) ?? []).length, 1);
  assert.equal((screenSource.match(/recovery === 'conflict'/g) ?? []).length, 1);
  assert.match(screenSource, /loadState === 'error'/);
  assert.match(screenSource, /pending \|\| statusError/);
  assert.match(screenSource, /feedbackState\.activeMessage !== null && !infoVisible/);
  assert.match(screenSource, /key=\{feedbackState\.activeMessage \?\? 'no-feedback'\}/);
  assert.match(screenSource, /getRecommendedTimeoutMillis\(5000\)/);
  assert.match(screenSource, /normalized === previousStatusMessage\.current/);
  assert.match(screenSource, /dispatchFeedback\(\{ type: 'info-closed' \}\)/);
  assert.doesNotMatch(workspaceSource, /<PlannedHealthScreen\s+key=/);
  assert.match(screenSource, /if \(editingId === null \|\| editingRecord !== null\) return;/);
  assert.match(screenSource, /if \(await onSave[\s\S]*?\) resetForm\(\)/);
  assert.match(screenSource, /if \(await onDelete[\s\S]*?\) resetForm\(\)/);
  assert.match(screenSource, /function acceptConflict\(\)[\s\S]*?resetForm\(\)/);
  assert.match(primitivesSource, /onShow=\{\(\) => focusAccessibilityNode\(headingRef\)\}/);
  assert.match(primitivesSource, /onShown\?\.\(message\)/);
});
