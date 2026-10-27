import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseTrainingInstruction } from '../src/features/training/training-instruction.ts';

const draft = JSON.parse(readFileSync(new URL('../docs/content/recall-program-v1.json', import.meta.url), 'utf8'));

test('recall draft keeps all six ordered steps and per-step safety instructions', () => {
  assert.equal(draft.status, 'draft');
  assert.equal(draft.is_ai_generated, true);
  assert.equal(draft.review.human_review, 'not-recorded');
  assert.equal(draft.steps.length, 6);
  assert.equal(new Set(draft.steps.map(step => step.id)).size, 6);
  assert.deepEqual(draft.steps.map(step => step.position), [1, 2, 3, 4, 5, 6]);
  for (const [index, step] of draft.steps.entries()) {
    const blocks = parseTrainingInstruction(step.instruction);
    assert.deepEqual(blocks.filter(block => block.type === 'heading').map(block => block.text), [
      'Du behöver', 'Så gör ni', 'Gör det lättare', 'Gör det svårare', 'Trygg träning',
    ]);
    assert.ok(blocks.some(block => block.type === 'ordered' && block.items.length > 0));
    const safetyIndex = blocks.findIndex(block => block.type === 'heading' && block.text === 'Trygg träning');
    const safety = blocks[safetyIndex + 1];
    assert.equal(safety.type, 'paragraph');
    assert.match(safety.text, /pausa/i);
    assert.match(safety.text, /utan att jaga/i);
    if (index >= 3) assert.match(safety.text, /långlinan under uppsikt.*dra inte/i);
  }
  assert.ok(draft.sources.length >= 3);
  for (const source of draft.sources) assert.equal(new URL(source).protocol, 'https:');
});

test('the release migration and draft import are generated from the reviewed source', () => {
  const python = process.env.TASSLA_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  const result = spawnSync(python, ['tools/generate_recall_draft.py', '--check'], { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stderr || result.stdout || String(result.error));
});
