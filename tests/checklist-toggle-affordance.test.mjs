import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../src/components/ui/ChecklistItem.tsx', import.meta.url), 'utf8');
const knowledge = await readFile(new URL('../src/features/knowledge/PuppyChecklistScreen.tsx', import.meta.url), 'utf8');
const home = await readFile(new URL('../src/features/home/DailyChecklistScreen.tsx', import.meta.url), 'utf8');
const tokens = await readFile(new URL('../src/theme/tokens.ts', import.meta.url), 'utf8');

test('Knowledge phase checklists opt into the prominent circular completion marker', () => {
  assert.match(knowledge, /ChecklistItem variant="grouped" completionShape="circle" label=\{item\.title\} checked=\{progress\.has\(item\.key\)\}/);
  assert.match(knowledge, /ChecklistItem variant="grouped" completionShape="circle" label=\{item\.title\} checked=\{item\.completed\}/);
  assert.match(component, /completionShape\?: ChecklistCompletionShape/);
  assert.match(component, /const markShape = completionShape \?\? \(variant === 'grouped' \? 'square' : 'circle'\)/);
  assert.match(component, /markShape === 'square' \? checked \? 'checkbox' : 'square-outline' : checked \? 'checkmark-circle' : 'ellipse-outline'/);
  assert.match(component, /completionShape === 'circle' \? tokens\.size\.iconLg : tokens\.size\.iconMd/);
  assert.match(tokens, /iconMd: 24, iconLg: 28/);
});

test('unmodified grouped rows keep their square default and the accessible checkbox contract', () => {
  assert.match(component, /variant === 'grouped' \? 'square' : 'circle'/);
  assert.match(component, /accessibilityRole="checkbox"/);
  assert.match(component, /accessibilityState=\{\{ checked, disabled, busy: pending \}\}/);
  assert.match(component, /aria-checked=\{checked\} aria-busy=\{pending\}/);
  assert.match(component, /checked \? tokens\.colors\.success : tokens\.colors\.textSecondary/);
  assert.match(home, /accessibilityRole="checkbox"/);
  assert.match(home, /tokens\.size\.homeCheckbox/);
  assert.doesNotMatch(home, /completionShape="circle"/);
});
