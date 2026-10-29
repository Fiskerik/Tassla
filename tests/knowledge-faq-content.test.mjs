import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const bundlePath = new URL('../docs/content/knowledge-faq-v1.json', import.meta.url);
const validator = new URL('../tools/validate_knowledge_faq.py', import.meta.url);
const root = new URL('..', import.meta.url);

function validate(...args) {
  return spawnSync('python', ['-X', 'utf8', validator.pathname, ...args], { cwd: root, encoding: 'utf8' });
}

test('FAQ bundle preserves reviewed contexts, neutral copy, source claims, and conditional review metadata', async () => {
  const bundle = JSON.parse(await readFile(bundlePath, 'utf8'));
  assert.equal(bundle.status, 'reviewed');
  assert.equal(bundle.review.dog_expert_status, 'passed_with_conditions');
  assert.deepEqual(bundle.faqs.map((faq) => faq.versions[0].context), ['first_days', 'first_days', 'before_homecoming', 'by_age']);
  assert.ok(bundle.faqs.every((faq) => faq.versions[0].status === 'draft' && faq.versions[0].is_ai_generated));
  for (const faq of bundle.faqs) {
    const { title, body } = faq.versions[0];
    assert.doesNotMatch(`${title} ${body}`, /\b(?:Luna|Nemo|Fisken|den|dess|han|hon|hans|hennes|hen|honom|henne)\b/i);
  }
  const result = validate();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /"faqs": 4/);
  assert.match(result.stdout, /170d70410e1a7bf121fc7ef16c338d4eb79e7f023fd3ba4c3f96cc5661cd3288/);
});

test('changing reviewed FAQ copy invalidates the exact source/content digest', async () => {
  const bundle = JSON.parse(await readFile(bundlePath, 'utf8'));
  bundle.faqs[0].versions[0].body += ' Ändrad text.';
  const directory = await mkdtemp(join(tmpdir(), 'knowledge-faq-'));
  const path = join(directory, 'bundle.json');
  try {
    await writeFile(path, JSON.stringify(bundle), 'utf8');
    const result = validate('--bundle', path);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /review reference digest does not match/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('import and separate publication SQL match the reviewed payload and reject drift', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'knowledge-faq-sql-'));
  const importPath = join(directory, 'import.sql');
  const publishPath = join(directory, 'publish.sql');
  try {
    const importSql = await readFile(new URL('../supabase/content/knowledge-faq-v1.sql', import.meta.url), 'utf8');
    const publishSql = await readFile(new URL('../supabase/content/publish-knowledge-faq-v1.sql', import.meta.url), 'utf8');
    await writeFile(importPath, importSql, 'utf8');
    await writeFile(publishPath, publishSql, 'utf8');
    const valid = validate('--import-sql', importPath, '--publish-sql', publishPath);
    assert.equal(valid.status, 0, valid.stderr || valid.stdout);

    await writeFile(importPath, importSql.replace('Förbered natten med en lugn sovplats', 'Ändrad ogranskad text'), 'utf8');
    const changed = validate('--import-sql', importPath, '--publish-sql', publishPath);
    assert.notEqual(changed.status, 0);
    assert.match(changed.stderr, /payload differs from reviewed JSON/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('FAQ presentation keeps the open card lilac and source links compact, legible and accessible', async () => {
  const screen = await readFile(new URL('../src/features/knowledge/FAQScreen.tsx', import.meta.url), 'utf8');
  const sources = await readFile(new URL('../src/features/knowledge/source-links.ts', import.meta.url), 'utf8');
  assert.match(screen, /'faq-puppy-course': 'review-v1:faq:course'/);
  assert.match(screen, /before_homecoming: 'Hemkomst', first_days: 'Första dagarna', by_age: 'Efter ålder'/);
  assert.match(screen, /accessibilityLabel="Sammanhang för vanliga frågor" variant="rev02-segmented" scrollable/);
  assert.match(screen, /backgroundColor: tokens\.colors\.destination\.knowledge\.surface/);
  const links = await readFile(new URL('../src/features/knowledge/ContentSources.tsx', import.meta.url), 'utf8');
  assert.match(screen, /<ContentSources sources=\{sources\}/);
  assert.match(links, /accessibilityRole="link"/);
  assert.match(links, /metadata\.title/);
  assert.match(links, /metadata\.publisher/);
  assert.match(links, /minHeight: tokens\.size\.touchMin/);
  assert.match(sources, /https:\/\/www\.dogstrust\.org\.uk\/dog-advice\/getting-dog\/dog-ready\/when-you-have-children': 'Getting a dog when you have children'/);
});
