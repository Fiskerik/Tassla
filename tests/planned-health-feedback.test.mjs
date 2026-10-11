import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
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

test('saved-plan action menu labels and dispatch callbacks match the confirmation flow', () => {
  const buildButtons = compileFunctions(['buildPlannedHealthActionButtons']).buildPlannedHealthActionButtons;
  const calls = [];
  const buttons = buildButtons(() => calls.push('edit'), () => calls.push('delete'));
  assert.deepEqual(buttons.map(({ text }) => text), ['Ändra', 'Ta bort', 'Avbryt']);
  buttons[0].onPress();
  buttons[1].onPress();
  assert.deepEqual(calls, ['edit', 'delete']);
  assert.equal(buttons[2].onPress, undefined, 'cancel closes the native alert without mutation');
  assert.match(screenSource, /accessibilityLabel=\{`Åtgärder för \$\{typeLabel\(record\.event_type\)\} \$\{record\.due_on\}`\}/);
  assert.match(screenSource, /accessibilityState=\{\{ disabled: blocked \}\} disabled=\{blocked\}/);
  assert.match(screenSource, /Alert\.alert\('Åtgärder',[\s\S]*buildPlannedHealthActionButtons/);
  assert.match(screenSource, /\(\) => \{ if \(!blocked\) confirmDelete\(record\); \}/);
  assert.match(screenSource, /Alert\.alert\('Ta bort plan\?'/);
});

test('reminder display omits an unset off reminder and labels any stored time explicitly', () => {
  const createLocalFireTime = (_date, minutes) => ({ status: minutes === 600 ? 'passed-time' : 'scheduled' });
  const fn = compileFunctions(['formatTime', 'reminderLabel'], { createLocalFireTime }).reminderLabel;
  assert.equal(fn(false, '2026-10-12', null), null);
  assert.equal(fn(false, '2026-10-12', 540), 'Påminnelse 09:00 · av');
  assert.equal(fn(true, '2026-10-12', 600), 'Påminnelse 10:00 · påminnelsetiden har passerat');
  assert.equal(fn(true, '2026-10-12', 540), 'Påminnelse 09:00 · schemaläggs bara om enhetens val tillåter det');
  assert.match(screenSource, /Planera vaccinationer och veterinärbesök\./);
  assert.doesNotMatch(screenSource, /Påminnelse av/);
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
  assert.match(screenSource, /feedbackState\.activeMessage\?\.startsWith\('Ändringen är sparad'\)[\s\S]*?!infoVisible/);
  assert.match(screenSource, /timedFeedbackMessage === feedbackState\.activeMessage/);
  assert.doesNotMatch(screenSource, /<Toast\s+key=\{feedbackState\.activeMessage\}/);
  assert.match(screenSource, /getRecommendedTimeoutMillis\(2500\)/);
  assert.match(screenSource, /feedbackTimeoutMillis\(recommended, 2500\)/);
  assert.match(screenSource, /normalized === previousStatusMessage\.current/);
  assert.match(screenSource, /dispatchFeedback\(\{ type: 'info-closed' \}\)/);
  assert.doesNotMatch(workspaceSource, /<PlannedHealthScreen\s+key=/);
  assert.match(screenSource, /if \(editingId === null \|\| editingRecord !== null\) return;/);
  assert.match(screenSource, /if \(await onSave[\s\S]*?\) resetForm\(\)/);
  assert.match(screenSource, /if \(await onDelete[\s\S]*?\) resetForm\(\)/);
  assert.match(screenSource, /function acceptConflict\(\)[\s\S]*?resetForm\(\)/);
  assert.match(primitivesSource, /onShow=\{\(\) => focusAccessibilityNode\(headingRef\)\}/);
  assert.match(primitivesSource, /shownRef\.current\?\.\(message\)/);
});

function compileFunctions(names, dependencies = {}) {
  const sourceFile = ts.createSourceFile('PlannedHealthScreen.tsx', screenSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = sourceFile.statements.filter((statement) => ts.isFunctionDeclaration(statement)
    && names.includes(statement.name?.text));
  assert.equal(declarations.length, names.length, `Expected functions: ${names.join(', ')}`);
  const functions = declarations.map((declaration) => declaration.getText(sourceFile)).join('\n');
  const exports = names.map((name) => `${JSON.stringify(name)}: ${name}`).join(', ');
  const compiled = ts.transpileModule(`${functions}\nmodule.exports = { ${exports} };`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  const module = { exports: {} };
  new Function('module', 'exports', ...Object.keys(dependencies), compiled.outputText)(module, module.exports, ...Object.values(dependencies));
  return module.exports;
}
