import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier, context); } });
const model = await import('../src/features/knowledge/checklist-model.ts');
const content = await import('../src/features/knowledge/checklist-content.ts');
hook.deregister();

test('checklist catalogue has stable review-v1 IDs and item keys across all phases', () => {
  assert.equal(content.CHECKLIST_TEMPLATES.length, 6);
  assert.ok(content.CHECKLIST_TEMPLATES.every((template) => template.id.startsWith('review-v1:') && template.items.length > 0));
  assert.equal(new Set(content.CHECKLIST_TEMPLATES.flatMap((template) => template.items.map((item) => `${template.id}:${item.key}`))).size, 18);
});

test('explicit owner context wins; age selection has clear phase boundaries', () => {
  assert.equal(model.chooseChecklistPhase(40, 'before_homecoming'), 'before_homecoming');
  assert.equal(model.chooseChecklistPhase(40, 'first_days'), 'first_days');
  assert.equal(model.chooseChecklistPhase(7, 'by_age'), null);
  assert.equal(model.chooseChecklistPhase(8, 'by_age'), '8_12_weeks');
  assert.equal(model.chooseChecklistPhase(13, 'by_age'), '3_6_months');
  assert.equal(model.chooseChecklistPhase(26, 'by_age'), '6_12_months');
  assert.equal(model.chooseChecklistPhase(52, 'by_age'), 'over_1_year');
});

test('custom titles use trimmed Unicode code points and progress counts only current items', () => {
  assert.equal(model.normalizeCustomChecklistTitle(`  ${'🐶'.repeat(160)}  `), '🐶'.repeat(160));
  assert.equal(model.normalizeCustomChecklistTitle('🐶'.repeat(161)), null);
  assert.equal(model.normalizeCustomChecklistTitle('  '), null);
  assert.equal(model.checklistPercent(2, 3), 67);
  assert.equal(model.checklistPercent(1, 0), 0);
  assert.equal(model.checklistPercent(99, 2), 100);
});
