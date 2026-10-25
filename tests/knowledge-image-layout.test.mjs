import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const resolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const { knowledgeImageLayout } = await import('../src/features/knowledge/knowledge-image-layout.ts');
resolution.deregister();

test('focal crop preserves aspect ratio and centers the subject when the frame allows it', () => {
  const crop = knowledgeImageLayout(200, 150, 1.5, 1, { x: 0.66, y: 0.5, zoom: 1.35, aspectRatio: 1.5 });
  assert.ok(crop);
  assert.equal(crop.width / crop.height, 1.5);
  assert.ok(Math.abs(crop.left + 100.475) < 0.001);
  assert.ok(Math.abs(crop.top + 26.25) < 0.001);
  assert.ok(Math.abs(crop.width * 0.66 + crop.left - 100) < 0.001);
  assert.ok(Math.abs(crop.height * 0.5 + crop.top - 75) < 0.001);
});

test('focal crop stays inside the image bounds and rejects empty frames', () => {
  const crop = knowledgeImageLayout(200, 150, 1.5, 1, { x: 0, y: 1, zoom: 1.2, aspectRatio: 1.5 });
  assert.ok(crop);
  assert.equal(crop.left, 0);
  assert.equal(crop.top, 150 - crop.height);
  assert.equal(knowledgeImageLayout(0, 150, 300, 200, { x: 0.5, y: 0.5, zoom: 1 }), null);
});

test('invalid zoom never scales below cover size', () => {
  const crop = knowledgeImageLayout(200, 150, 1.5, 1, { x: 0.5, y: 0.5, zoom: Number.NaN, aspectRatio: 1.5 });
  assert.ok(crop);
  assert.ok(crop.width >= 200);
  assert.ok(crop.height >= 150);
});
