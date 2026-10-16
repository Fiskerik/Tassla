import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isDirtyHealthHistoryDraft } from '../src/features/health/health-history-draft.ts';

const baseline = { type: 'vaccination', date: '2026-10-01', time: '', note: 'Booster' };

test('health-history draft starts clean and reverting every field restores clean state', () => {
  assert.equal(isDirtyHealthHistoryDraft(baseline, { ...baseline }), false);
  for (const field of ['type', 'date', 'time', 'note']) {
    const changed = { ...baseline, [field]: field === 'type' ? 'vet_visit' : 'changed' };
    assert.equal(isDirtyHealthHistoryDraft(baseline, changed), true, `${field} marks the draft dirty`);
    assert.equal(isDirtyHealthHistoryDraft(baseline, { ...changed, [field]: baseline[field] }), false, `${field} can be reverted`);
  }
});

test('invalid changed input remains dirty because comparison is independent of validation', () => {
  assert.equal(isDirtyHealthHistoryDraft(baseline, { ...baseline, date: 'not-a-date' }), true);
  assert.equal(isDirtyHealthHistoryDraft(baseline, { ...baseline, time: '25:99' }), true);
});

test('screen wiring keeps the opening record immutable and shares one scoped leave guard', async () => {
  const source = await readFile(new URL('../src/features/health/HealthHistoryScreen.tsx', import.meta.url), 'utf8');
  const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /const \[opening\] = useState\(\(\) =>/);
  assert.match(source, /isDirtyHealthHistoryDraft\(opening\.draft, \{ type, date, time, note \}\)/);
  assert.match(source, /registerEditorLeaveGuard\(editorOwnerToken\.current/);
  assert.match(source, /registerSheetLeaveGuard\(editorOwnerToken\.current/);
  assert.match(source, /'Lämna utan att spara'/);
  assert.match(source, /flightInProgress\.current = true;\s*setFlight\(true\);\s*try \{/);
  assert.match(source, /finally \{\s*flightInProgress\.current = false;/);
  assert.match(source, /onSave\?\.\(editingId, type, date, occurredTime, normalized \?\? '', opening\.record\)/);
  assert.match(source, /onDelete\?\.\(record\.id, opening\.record\)/);
  assert.match(source, /osparade ändringar i rättningen kastas bort/);
  assert.match(workspace, /JSON\.stringify\(\[session\?\.user\.id \?\? '', accountGeneration, dog\.id\]\)/);
  assert.match(workspace, /const previous = openingRecord;/);
  assert.match(workspace, /setHealthHistoryConfirmation\(\{ lifetime, sequence, kind: mutation\.kind, targetId: mutationId \}\)/);
});
