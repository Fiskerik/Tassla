import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const inventory = JSON.parse(readFileSync(new URL('../docs/design/evidence/knowledge-image-focus-2026-10-25/image-focus-inventory.json', import.meta.url), 'utf8'));
const bundle = JSON.parse(readFileSync(new URL('../docs/content/mvp-content-bundle-v1.json', import.meta.url), 'utf8'));
const driveArticles = JSON.parse(readFileSync(new URL('../docs/content/artiklar/drive-articles-v1.json', import.meta.url), 'utf8'));
const imageAssignmentSource = readFileSync(new URL('../src/features/knowledge/editorial-image-assignment.ts', import.meta.url), 'utf8');
const { knowledgeImageLayout } = await import('../src/features/knowledge/knowledge-image-layout.ts');

function sourceMapKeys(name) {
  const start = imageAssignmentSource.indexOf(`const ${name} = new Map`);
  assert.notEqual(start, -1, `missing source map ${name}`);
  const entriesStart = imageAssignmentSource.indexOf('[', start);
  const entriesEnd = imageAssignmentSource.indexOf('\n]);', entriesStart);
  assert.ok(entriesStart > start && entriesEnd > entriesStart, `could not read source map ${name}`);
  const keys = [...imageAssignmentSource.slice(entriesStart, entriesEnd).matchAll(/\[\s*'([^']+)'\s*,/g)]
    .map(([, key]) => key);
  assert.ok(keys.length > 0, `source map ${name} must contain mapping keys`);
  return keys;
}

test('inventory covers every locally published article version and local slug fixture', () => {
  const publishedArticleVersions = bundle.items
    .filter((item) => item.content_type === 'article')
    .flatMap((item) => item.versions.filter((version) => version.status === 'published')
      .map((version) => `${item.id}:${version.version}`))
    .sort();
  assert.deepEqual(publishedArticleVersions, [...inventory.catalog_snapshot.published_article_versions].sort());

  const inventorySlugs = new Set(inventory.mappings.map((item) => item.slug).filter(Boolean));
  for (const article of driveArticles) assert.ok(inventorySlugs.has(article.slug), `missing restored article slug ${article.slug}`);
});

test('inventory covers every explicit product image/focus mapping and source asset', () => {
  const inventoryIdentities = new Set(inventory.mappings.map((item) => `${item.contentId}:${item.version}`));
  for (const mapName of ['KNOWLEDGE_IMAGE_BY_GUIDE_VERSION', 'GUIDE_IMAGE_FOCUS_BY_VERSION', 'REVIEW_IMAGE_BY_GUIDE_VERSION']) {
    for (const identity of sourceMapKeys(mapName)) {
      assert.ok(inventoryIdentities.has(identity), `inventory misses ${mapName} identity ${identity}`);
    }
  }

  const sourceAssets = new Set([...imageAssignmentSource.matchAll(/assets\/images\/([^']+)'/g)].map(([, asset]) => asset));
  assert.deepEqual(sourceAssets, new Set(Object.keys(inventory.assets)), 'inventory must cover each referenced image asset');
});

test('each image focus keeps the full observed dog face inside 16:9 and 4:3 crops', () => {
  for (const [asset, metadata] of Object.entries(inventory.assets)) {
    const dimensions = inventory.source_dimensions[asset];
    assert.ok(dimensions, `missing inspected source dimensions for ${asset}`);
    assert.equal(dimensions[0] / dimensions[1], metadata.focus.aspectRatio, `${asset} aspect ratio changed`);
    assert.ok(existsSync(resolve('assets/images', asset)), `missing source asset ${asset}`);

    const [faceLeft, faceTop, faceRight, faceBottom] = metadata.face_box;
    assert.ok(faceLeft >= 0 && faceTop >= 0 && faceRight <= 1 && faceBottom <= 1, `${asset} face box is outside the image`);
    for (const frameAspectRatio of [16 / 9, 4 / 3]) {
      const layout = knowledgeImageLayout(frameAspectRatio, 1, dimensions[0], dimensions[1], metadata.focus);
      assert.ok(layout, `no crop layout for ${asset} at ${frameAspectRatio}`);
      const crop = {
        left: -layout.left / layout.width,
        top: -layout.top / layout.height,
        right: (frameAspectRatio - layout.left) / layout.width,
        bottom: (1 - layout.top) / layout.height,
      };
      assert.ok(faceLeft >= crop.left - 0.005 && faceTop >= crop.top - 0.005
        && faceRight <= crop.right + 0.005 && faceBottom <= crop.bottom + 0.005,
      `${asset} clips the face at ${frameAspectRatio}:1; crop=${JSON.stringify(crop)}, face=${metadata.face_box}`);
    }
  }
});

test('every known mapping has a unique identity and references one of the audited dog images', () => {
  const keys = inventory.mappings.map((item) => item.key);
  assert.equal(new Set(keys).size, keys.length, 'mapping keys must be unique');
  for (const mapping of inventory.mappings) {
    assert.ok(mapping.contentId && Number.isInteger(mapping.version) && mapping.version > 0, `invalid identity: ${mapping.key}`);
    assert.ok(inventory.assets[mapping.asset], `mapping ${mapping.key} uses an unaudited source`);
  }
  assert.deepEqual(new Set(inventory.mappings.map((item) => item.asset)), new Set(Object.keys(inventory.assets)));
});
