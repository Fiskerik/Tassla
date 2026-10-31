import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('image delivery uses the installed Expo API without changing focal geometry', () => {
  const pkg = JSON.parse(read('node_modules/expo-image/package.json'));
  assert.equal(pkg.version, '57.0.5');
  const declarations = read('node_modules/expo-image/build/Image.types.d.ts');
  for (const prop of ['contentFit', 'recyclingKey', 'cachePolicy', 'transition']) assert.match(declarations, new RegExp(prop + '\\?'));
  const adapter = read('src/components/ui/EditorialImage.tsx');
  assert.match(adapter, /key=\{identity\} source=\{source\} recyclingKey=\{identity\}/);
  assert.match(adapter, /resizeMode === 'stretch' \? 'fill' : resizeMode/);
  assert.match(adapter, /transition=\{0\}/);
  assert.match(adapter, /accessible = false, accessibilityLabel = ''/);
  assert.match(adapter, /accessible=\{accessible\} accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(read('src/features/knowledge/KnowledgeImage.tsx'), /knowledgeImageLayout\(frame.width, frame.height, focus.aspectRatio, 1, focus\)/);
});

test('all six optimized photos retain their proportions with a measured byte reduction', () => {
  const measurements = JSON.parse(read('docs/design/evidence/image-delivery-01/asset-measurements.json'));
  assert.equal(measurements.length, 6);
  for (const row of measurements) {
    const asset = readFileSync(new URL('../assets/images/' + row.name + '.jpg', import.meta.url));
    assert.equal(asset.length, row.bytes);
    assert.equal(asset[0], 0xff); assert.equal(asset[1], 0xd8);
    assert.ok(row.bytes < row.original_bytes / 5);
    assert.equal(row.dimensions[0] / row.dimensions[1], row.original_dimensions[0] / row.original_dimensions[1]);
    assert.equal(existsSync(new URL('../assets/images/' + row.name + '.png', import.meta.url)), false);
  }
});
