import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { presentTrainingInstruction } from '../src/features/training/training-step-presentation.ts';
import { parseTrainingInstruction } from '../src/features/training/training-instruction.ts';

const bundle = JSON.parse(readFileSync(new URL('../docs/content/mvp-content-bundle-v1.json', import.meta.url), 'utf8'));
const recall = JSON.parse(readFileSync(new URL('../docs/content/recall-program-v1.json', import.meta.url), 'utf8'));
const steps = bundle.items.filter(item => item.content_type === 'training_program').flatMap(item => item.versions[0].training_steps);
const normalized = value => value.replace(/\s+/gu, ' ').trim();

test('all existing plain steps gain goals and numbered instructions without losing any source words or conditions', () => {
  assert.equal(steps.length, 9);
  for (const step of steps) {
    const result = presentTrainingInstruction(step.title, step.instruction);
    assert.ok(result.goal, step.title);
    assert.equal(result.blocks[0].text, 'Steg för steg');
    const list = result.blocks[1];
    assert.equal(list.type, 'ordered');
    assert.ok(list.items.length >= 2);
    assert.equal(normalized(list.items.map(item => item.text).join(' ')), normalized(step.instruction), step.title);
    assert.deepEqual(list.items.map(item => item.number), list.items.map((_, i) => String(i + 1)));
  }
  const touch = steps.find(step => step.title === 'Prova en kort beröring');
  assert.equal(presentTrainingInstruction(touch.title, touch.instruction).clarification, 'Med steg 1 avses övningen Låt hunden välja kontakt.');
  const stop = steps.find(step => step.title === 'Pausa när hunden behöver det');
  const list = presentTrainingInstruction(stop.title, stop.instruction).blocks[1];
  assert.ok(list.items.some(item => item.text.includes('kontakta veterinär först; efter medicinsk bedömning')));
});

test('recall retains complete structured steps, easier/harder adjustments and safety sections', () => {
  for (const step of recall.steps) {
    const result = presentTrainingInstruction(step.title, step.instruction);
    assert.ok(result.goal, step.title);
    const original = parseTrainingInstruction(step.instruction).map(block => block.type === 'heading' && block.text === 'Så gör ni'
      ? { ...block, text: 'Steg för steg' } : block);
    assert.deepEqual(result.blocks, original);
  }
});

test('matching tolerates whitespace only and cannot give revised or unknown content an outdated goal', () => {
  const step = steps[0];
  assert.ok(presentTrainingInstruction(step.title, step.instruction.replaceAll(' ', '\n')).goal);
  for (const [title, instruction] of [[step.title, step.instruction + ' En ny instruktion.'], ['Annat steg', step.instruction], [step.title, step.instruction.toLowerCase()]]) {
    const result = presentTrainingInstruction(title, instruction);
    assert.equal(result.goal, null);
    assert.deepEqual(result.blocks, parseTrainingInstruction(instruction));
  }
});

test('future structured content can supply its own explicit goal without repeating it in the body', () => {
  const result = presentTrainingInstruction('Ny övning', '## Mål\nÖva frivillig kontakt.\n\n## Steg för steg\n1. Börja lugnt.\n2. Pausa vid oro.');
  assert.equal(result.goal, 'Öva frivillig kontakt.');
  assert.deepEqual(result.blocks, [{ type: 'heading', text: 'Steg för steg' }, { type: 'ordered', items: [
    { number: '1', text: 'Börja lugnt.' }, { number: '2', text: 'Pausa vid oro.' },
  ] }]);
});
