import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const bundlePath = new URL('../docs/content/knowledge-phase-checklists-v1.json', import.meta.url);
const validator = new URL('../tools/validate_knowledge_catalog.py', import.meta.url);
const root = new URL('..', import.meta.url);

function validate(path) {
  return spawnSync('python', ['-X', 'utf8', validator.pathname, path], {
    cwd: root,
    encoding: 'utf8',
  });
}

test('reviewed phase catalog preserves six contexts and all eighteen stable item keys', async () => {
  const bundle = JSON.parse(await readFile(bundlePath, 'utf8'));
  assert.deepEqual(bundle.templates.map((template) => template.template_id), [
    'review-v1:before-homecoming', 'review-v1:first-days', 'review-v1:8-12-weeks',
    'review-v1:3-6-months', 'review-v1:6-12-months', 'review-v1:over-1-year',
  ]);
  assert.deepEqual(bundle.templates.map((template) => template.items.map((item) => item.key)), [
    ['safe-space', 'supplies', 'vet-contact'], ['quiet-start', 'routine', 'rest'], ['name', 'handling', 'alone'],
    ['recall', 'settle', 'walks'], ['review', 'focus', 'breaks'], ['enjoy', 'adapt', 'play'],
  ]);
  assert.equal(bundle.templates.length, 6);
  assert.equal(bundle.templates.reduce((count, template) => count + template.items.length, 0), 18);
  assert.ok(bundle.templates.every((template) => template.status === 'draft' && template.is_ai_generated));

  const result = validate(bundlePath.pathname);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /6 phases, 18 items, 7 sources/);
});

test('changing reviewed copy invalidates the exact content/source review fingerprint', async () => {
  const bundle = JSON.parse(await readFile(bundlePath, 'utf8'));
  bundle.templates[0].items[0].title = 'Annan formulering';
  const directory = await mkdtemp(join(tmpdir(), 'knowledge-catalog-'));
  const path = join(directory, 'bundle.json');
  try {
    await writeFile(path, JSON.stringify(bundle), 'utf8');
    const result = validate(path);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SHA-256 does not match/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('both SQL payloads match the reviewed JSON and a modified generated row is rejected', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'knowledge-sql-parity-'));
  const importPath = join(directory, 'import.sql');
  const publishPath = join(directory, 'publish.sql');
  try {
    const importSql = await readFile(new URL('../supabase/content/knowledge-phase-checklists-v1.sql', import.meta.url), 'utf8');
    const publishSql = await readFile(new URL('../supabase/content/publish-knowledge-phase-checklists-v1.sql', import.meta.url), 'utf8');
    await writeFile(importPath, importSql, 'utf8');
    await writeFile(publishPath, publishSql, 'utf8');
    const valid = spawnSync('python', ['-X', 'utf8', validator.pathname, bundlePath.pathname, '--import-sql', importPath, '--publish-sql', publishPath], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(valid.status, 0, valid.stderr || valid.stdout);

    await writeFile(importPath, importSql.replace('Ordna en lugn, ostörd viloplats.', 'Ändrad och ogranskad text.'), 'utf8');
    const changed = spawnSync('python', ['-X', 'utf8', validator.pathname, bundlePath.pathname, '--import-sql', importPath, '--publish-sql', publishPath], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.notEqual(changed.status, 0);
    assert.match(changed.stderr, /embedded SQL rows differ from the reviewed JSON payload/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
