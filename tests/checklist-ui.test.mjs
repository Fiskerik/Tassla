import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';

const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
const { classifyPendingChecklistOperation, checklistMemoryScope, freezePendingChecklistMemory, keepChecklistMemoryForScope, updateChecklistMemory } = await import('../src/features/knowledge/checklist-intent.ts');
hook.deregister();

const screen = await readFile(new URL('../src/features/knowledge/PuppyChecklistScreen.tsx', import.meta.url), 'utf8');
const knowledge = await readFile(new URL('../src/features/knowledge/KnowledgeScreen.tsx', import.meta.url), 'utf8');

test('checklist review content is gated before any account read or write', () => {
  assert.match(screen, /if \(reviewEnabled && active\) void load\(templateId\);\s*else setState\('ready'\)/);
  assert.match(screen, /if \(!reviewEnabled \|\|/);
  assert.match(knowledge, /\["För dig", "Artiklar", "Checklistor", "FAQ"\]/);
});

test('navigation invalidates and aborts the current read/write before changing checklist view', () => {
  const invalidation = screen.indexOf('function leaveChecklist');
  assert.ok(invalidation >= 0);
  assert.ok(screen.indexOf('invalidateCurrentView();', invalidation) < screen.indexOf('setTemplateId(null)', invalidation));
  assert.match(screen, /writeControllerRef\.current\?\.abort\(\)/);
  assert.match(knowledge, /checklistInvalidate\.current\?\.\(\)/);
  assert.match(knowledge, /sessionKey.*dogId/);
});

test('screen feedback reflects only confirmed state and review drafts identify themselves', () => {
  assert.match(screen, /if \(result\.status === 'saved'\)/);
  assert.match(screen, /Exemplen tas bort eller skrivs om före lansering\./);
  assert.match(screen, /label="Kontrollera"/);
  assert.ok(screen.includes('label={`${done} av ${total} genomförda`}'));
  assert.match(screen, /label=\{form \? form\.id \? 'Fortsätt redigera punkt' : 'Fortsätt med egen punkt' : 'Lägg till egen punkt'\}/);
  assert.match(screen, /<Button label="Spara"/);
});

test('pending status reconciliation classifies exact postimages before replay', () => {
  const previous = { id: '33333333-3333-4333-8333-333333333333', dogId: 'dog-a', templateId: 'review-v1:before-homecoming', title: 'Old', completed: false };
  const updated = { ...previous, title: 'New', completed: true };
  const state = (customItems = [], progress = [], preference = null) => ({ customItems, progress, preference });
  assert.equal(classifyPendingChecklistOperation({ kind: 'preference', context: 'first_days' }, state([], [], 'first_days')), 'saved');
  assert.equal(classifyPendingChecklistOperation({ kind: 'preference', context: 'first_days' }, state([], [], 'by_age')), 'retry');
  assert.equal(classifyPendingChecklistOperation({ kind: 'preset', templateId: previous.templateId, itemKey: 'safe-space', completed: true }, state([], [{ dogId: 'dog-a', templateId: previous.templateId, itemKey: 'safe-space' }])), 'saved');
  assert.equal(classifyPendingChecklistOperation({ kind: 'preset', templateId: previous.templateId, itemKey: 'safe-space', completed: true }, state()), 'retry');
  const add = { kind: 'add', templateId: previous.templateId, id: previous.id, title: 'New' };
  const added = { ...previous, title: 'New' };
  assert.equal(classifyPendingChecklistOperation(add, state([added])), 'saved');
  assert.equal(classifyPendingChecklistOperation(add, state()), 'retry');
  assert.equal(classifyPendingChecklistOperation(add, state([{ ...added, title: 'Other' }])), 'conflict');
  const update = { kind: 'update', previous, changes: { title: 'New', completed: true } };
  assert.equal(classifyPendingChecklistOperation(update, state([updated])), 'saved');
  assert.equal(classifyPendingChecklistOperation(update, state([previous])), 'retry');
  assert.equal(classifyPendingChecklistOperation(update, state([{ ...previous, title: 'Remote edit' }])), 'conflict');
  const remove = { kind: 'delete', previous };
  assert.equal(classifyPendingChecklistOperation(remove, state()), 'saved');
  assert.equal(classifyPendingChecklistOperation(remove, state([previous])), 'retry');
  assert.equal(classifyPendingChecklistOperation(remove, state([{ ...previous, title: 'Remote edit' }])), 'conflict');
});

test('unmount persists the frozen intent and normalized form draft for scoped remount recovery', async () => {
  assert.match(screen, /pendingChangeRef\.current\?\.\(freezePendingChecklistMemory\(writeIntent\.current, formRef\.current\)\)/);
  assert.match(screen, /pendingState\?\.uncertain \? 'Det gick inte att kontrollera om ändringen sparades\.'/);
  assert.match(screen, /changes: \{ title: normalizedTitle, completed: form\.completed \}/);
  assert.match(screen, /id: form\.requestId, title: normalizedTitle/);
  assert.match(screen, /customItems\.some\(\(item\) => item\.id === result\.value\.id\)/);
  assert.match(screen, /classifyPendingChecklistOperation\(operation, \{ \.\.\.loaded, preference: loaded\.preference\?\.context \?\? null \}\)/);
  const scopeA = checklistMemoryScope('owner-a', 4, 'dog-a');
  const scopeB = checklistMemoryScope('owner-a', 4, 'dog-b');
  const operation = { kind: 'add', templateId: 'review-v1:before-homecoming', id: '33333333-3333-4333-8333-333333333333', title: 'Normaliserad titel' };
  const draft = { id: null, requestId: operation.id, title: ' Normaliserad titel ', completed: false };
  const snapshot = freezePendingChecklistMemory(operation, draft);
  operation.title = 'Changed after request';
  draft.requestId = 'changed';
  assert.equal(snapshot.operation.title, 'Normaliserad titel');
  assert.equal(snapshot.draft.requestId, '33333333-3333-4333-8333-333333333333');
  const memory = updateChecklistMemory(null, scopeA, snapshot);
  assert.equal(keepChecklistMemoryForScope(memory, scopeA)?.state.operation.id, snapshot.operation.id);
  assert.equal(keepChecklistMemoryForScope(memory, scopeB), null);
  assert.equal(updateChecklistMemory(memory, scopeB, null), null);
});
