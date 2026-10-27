import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTrainingInstruction, trainingInstructionPreview } from '../src/features/training/training-instruction.ts';

test('structured instructions preserve headings, ordered steps and readable previews', () => {
  const input = 'Öva lugnt.\n\n## Du behöver\nEn belöning.\n\n## Så gör ni\n1. Välj en lugn plats.\n2. Belöna när hunden kommer.';
  assert.deepEqual(parseTrainingInstruction(input), [
    { type: 'paragraph', text: 'Öva lugnt.' },
    { type: 'heading', text: 'Du behöver' },
    { type: 'paragraph', text: 'En belöning.' },
    { type: 'heading', text: 'Så gör ni' },
    { type: 'ordered', items: [{ number: '1', text: 'Välj en lugn plats.' }, { number: '2', text: 'Belöna när hunden kommer.' }] },
  ]);
  assert.equal(trainingInstructionPreview(input), 'Öva lugnt.');
});

test('existing plain text and instructions starting with a numbered list stay readable', () => {
  assert.deepEqual(parseTrainingInstruction('Första raden.\nAndra raden.'), [{ type: 'paragraph', text: 'Första raden.\nAndra raden.' }]);
  assert.equal(trainingInstructionPreview('## Så gör ni\n1. Börja lugnt.'), 'Börja lugnt.');
  assert.equal(trainingInstructionPreview('## Du behöver\nEn belöning.\n\n## Så gör ni\n1. Börja lugnt.'), 'Börja lugnt.');
  assert.deepEqual(parseTrainingInstruction(''), []);
});
