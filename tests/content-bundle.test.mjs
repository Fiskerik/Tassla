import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { registerHooks } from 'node:module';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const tsResolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const { selectContent } = await import('../src/content/select-content.ts');
tsResolution.deregister();

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bundlePath = join(root, 'docs', 'content', 'mvp-content-bundle-v1.json');
const validatorPath = join(root, 'tools', 'validate_content_bundle.py');
const sourcePreparationPath = 'docs/content/mvp-source-preparation.md';
const canonical = JSON.parse(readFileSync(bundlePath, 'utf8'));
const slugById = new Map(canonical.items.map(({ id, slug }) => [id, slug]));

test('approved content bundle validates with the standard-library Python CLI', () => {
  const result = runValidator();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /11 content items, 11 versions, 9 training steps, 12 sources/);
  assert.match(result.stdout, /does not verify source support or the authenticity of recorded approval/i);
});

test('publication check accepts only the approved runtime versions and leaves onboarding content draft', () => {
  const result = runValidator({ publicationCheck: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const onboarding = canonical.items.find(({ slug }) => slug === 'before-homecoming');
  assert.equal(onboarding.versions[0].status, 'draft');
  assert.ok(canonical.items.filter(({ slug }) => slug !== 'before-homecoming')
    .every(({ versions }) => versions.every(({ status }) => status === 'published')));
});

test('fixed eleven content identities retain exact slug, reserved id, type and onboarding context', () => {
  assert.deepEqual(canonical.items.map(({ slug }) => slug).sort(), [
    'before-homecoming', 'first-week', 'daily-log-routines', 'handling-guide', 'environment-checklist',
    'being-alone-guide', 'weight-history-guide', 'health-records-guide', 'handling-program',
    'environment-program', 'being-alone-program',
  ].sort());
  assert.equal(canonical.items.find(({ slug }) => slug === 'before-homecoming')?.context, 'onboarding-only');
  assert.equal(canonical.items.filter(({ context }) => context !== undefined).length, 1);
  assert.deepEqual(new Map(canonical.items.map(({ slug, content_type }) => [slug, content_type])), new Map([
    ['before-homecoming', 'checklist'], ['first-week', 'article'], ['daily-log-routines', 'article'],
    ['handling-guide', 'article'], ['environment-checklist', 'checklist'], ['being-alone-guide', 'article'],
    ['weight-history-guide', 'article'], ['health-records-guide', 'article'], ['handling-program', 'training_program'],
    ['environment-program', 'training_program'], ['being-alone-program', 'training_program'],
  ]));
  assert.ok(canonical.items.every(({ versions }) => versions.length === 1 && versions[0].version === 1));
});

test('canonical bundle carries the exact reviewed v4 editorial age windows', () => {
  const expected = new Map([
    ['before-homecoming', [0, 0]], ['first-week', [8, 12]], ['daily-log-routines', [0, null]],
    ['handling-guide', [13, 16]], ['environment-checklist', [17, 26]], ['being-alone-guide', [27, 52]],
    ['weight-history-guide', [0, null]], ['health-records-guide', [0, null]],
    ['handling-program', [8, null]], ['environment-program', [8, null]], ['being-alone-program', [8, null]],
  ]);
  for (const item of canonical.items) {
    const version = item.versions[0];
    assert.deepEqual([version.min_age_weeks, version.max_age_weeks], expected.get(item.slug), item.slug);
  }
  assert.match(canonical.items.find(({ slug }) => slug === 'first-week').versions[0].body,
    /Om valpen nyligen har flyttat hem/i, 'age cannot prove the owner has just brought the puppy home');
});

test('actual selector applies inclusive bundle windows with app guides and programs as fallbacks', () => {
  // These in-memory records model versions after the independent publication gate; the canonical bundle remains draft.
  const ordinary = selectorRows(canonical.items.filter(({ slug }) => slug !== 'before-homecoming'));
  const slugsFor = (age) => new Set(selectContent(ordinary, age, 'unknown').map(({ contentId }) => slugById.get(contentId)));
  const appGuides = ['daily-log-routines', 'weight-history-guide', 'health-records-guide'];
  const programs = ['handling-program', 'environment-program', 'being-alone-program'];
  assert.deepEqual([...slugsFor(0)].sort(), appGuides.slice().sort());
  assert.deepEqual([...slugsFor(7)].sort(), appGuides.slice().sort(), 'below 8 weeks only app guides remain');
  assert.deepEqual([...slugsFor(8)].sort(), [...appGuides, 'first-week', ...programs].sort());
  assert.deepEqual([...slugsFor(12)].sort(), [...appGuides, 'first-week', ...programs].sort());
  assert.deepEqual([...slugsFor(13)].sort(), [...appGuides, 'handling-guide', ...programs].sort());
  assert.deepEqual([...slugsFor(16)].sort(), [...appGuides, 'handling-guide', ...programs].sort());
  assert.deepEqual([...slugsFor(17)].sort(), [...appGuides, 'environment-checklist', ...programs].sort());
  assert.deepEqual([...slugsFor(26)].sort(), [...appGuides, 'environment-checklist', ...programs].sort());
  assert.deepEqual([...slugsFor(27)].sort(), [...appGuides, 'being-alone-guide', ...programs].sort());
  assert.deepEqual([...slugsFor(52)].sort(), [...appGuides, 'being-alone-guide', ...programs].sort());
  assert.deepEqual([...slugsFor(53)].sort(), [...appGuides, ...programs].sort(), 'older dogs keep app guides and programs');
});

test('onboarding-only before-homecoming is a separate record, filtered before ordinary selection', () => {
  const onboarding = canonical.items.find(({ slug }) => slug === 'before-homecoming');
  assert.equal(onboarding.context, 'onboarding-only');
  assert.equal(onboarding.versions[0].status, 'draft');
  assert.deepEqual([onboarding.versions[0].min_age_weeks, onboarding.versions[0].max_age_weeks], [0, 0]);
  const selected = selectContent(selectorRows(canonical.items), 0, 'unknown');
  assert.equal(selected.some(({ contentId }) => contentId === onboarding.id), false,
    'draft onboarding content is filtered out by the real published-only selector');
});

test('validator rejects open-schema fields, a missing item, and duplicate slugs', async (t) => {
  await t.test('unknown root field', async () => {
    const bundle = cloneCanonical();
    bundle.unreviewed_override = true;
    assertInvalid(bundle, /root fields must be exactly/);
  });
  await t.test('missing required item', async () => {
    const bundle = cloneCanonical();
    bundle.items.pop();
    assertInvalid(bundle, /exactly 11 entries/);
  });
  await t.test('body_claim_refs is a required version field', async () => {
    const bundle = cloneCanonical();
    delete bundle.items[0].versions[0].body_claim_refs;
    assertInvalid(bundle, /fields must be exactly.*body_claim_refs/);
  });
  await t.test('duplicate item slug', async () => {
    const bundle = cloneCanonical();
    bundle.items[1].slug = bundle.items[0].slug;
    bundle.items[1].context = 'onboarding-only';
    assertInvalid(bundle, /duplicate slug/);
  });
});

test('validator rejects reserved identity/type/context collisions and wrong onboarding context', async (t) => {
  await t.test('wrong reserved UUID', async () => {
    const bundle = cloneCanonical();
    bundle.items[0].id = '61000000-0000-4000-8000-000000000099';
    assertInvalid(bundle, /reserved id/);
  });
  await t.test('wrong immutable item type', async () => {
    const bundle = cloneCanonical();
    bundle.items.find(({ slug }) => slug === 'being-alone-guide').content_type = 'training_program';
    assertInvalid(bundle, /approved type/);
  });
  await t.test('pre-homecoming context mismatch', async () => {
    const bundle = cloneCanonical();
    bundle.items.find(({ slug }) => slug === 'before-homecoming').context = 'age-zero';
    assertInvalid(bundle, /context must be 'onboarding-only'/);
  });
  await t.test('other item cannot claim onboarding context', async () => {
    const bundle = cloneCanonical();
    bundle.items.find(({ slug }) => slug === 'first-week').context = 'onboarding-only';
    assertInvalid(bundle, /fields must be exactly/);
  });
});

test('validator rejects duplicate UUIDs, versions, and training step identities', async (t) => {
  await t.test('duplicate UUID across content items', async () => {
    const bundle = cloneCanonical();
    bundle.items[1].id = bundle.items[0].id;
    assertInvalid(bundle, /duplicate UUID/);
  });
  await t.test('duplicate version UUID across item versions', async () => {
    const bundle = cloneCanonical();
    const item = bundle.items[1];
    item.versions.push({ ...item.versions[0], version: 2 });
    assertInvalid(bundle, /duplicate UUID/);
  });
  await t.test('duplicate training step UUID', async () => {
    const bundle = cloneCanonical();
    const version = bundle.items.find(({ slug }) => slug === 'handling-program').versions[0];
    version.training_steps[1].id = version.training_steps[0].id;
    assertInvalid(bundle, /duplicate UUID/);
  });
  await t.test('duplicate step key', async () => {
    const bundle = cloneCanonical();
    const steps = bundle.items.find(({ slug }) => slug === 'handling-program').versions[0].training_steps;
    steps[1].step_key = steps[0].step_key;
    assertInvalid(bundle, /duplicate step_key/);
  });
});

test('validator rejects unsupported claim/source references and duplicate claim identifiers', async (t) => {
  await t.test('unknown source reference', async () => {
    const bundle = cloneCanonical();
    firstSourcedClaim(bundle).source_refs = ['no-such-source'];
    assertInvalid(bundle, /source_refs must contain unique source ids/);
  });
  await t.test('duplicate source ID', async () => {
    const bundle = cloneCanonical();
    bundle.sources[1].id = bundle.sources[0].id;
    assertInvalid(bundle, /duplicate source id/);
  });
  await t.test('invalid source URL scheme', async () => {
    const bundle = cloneCanonical();
    bundle.sources[0].url = 'http://example.invalid/source';
    assertInvalid(bundle, /must be HTTPS or repo/);
  });
  await t.test('unsafe repository source path', async () => {
    const bundle = cloneCanonical();
    const repoSource = bundle.sources.find(({ url }) => url.startsWith('repo://'));
    repoSource.url = 'repo://../AGENTS.md';
    assertInvalid(bundle, /safe repository-relative path/);
  });
  await t.test('duplicate claim ID within a version', async () => {
    const bundle = cloneCanonical();
    const claims = bundle.items[0].versions[0].claim_trace;
    claims[1].claim_id = claims[0].claim_id;
    assertInvalid(bundle, /duplicate claim_id/);
  });
});

test('validator requires explicit unique local claim mappings for every body and step', async (t) => {
  await t.test('canonical body and step mappings are non-empty, unique, and local', () => {
    for (const item of canonical.items) {
      for (const version of item.versions) {
        const ids = new Set(version.claim_trace.map(({ claim_id }) => claim_id));
        assert.ok(version.body_claim_refs.length > 0, `${item.slug} body must be mapped`);
        assert.equal(new Set(version.body_claim_refs).size, version.body_claim_refs.length, `${item.slug} body refs must be unique`);
        for (const ref of version.body_claim_refs) assert.ok(ids.has(ref), `${item.slug} body ref must be local`);
        for (const step of version.training_steps) {
          assert.ok(step.claim_refs.length > 0, `${item.slug}/${step.step_key} must be mapped`);
          assert.equal(new Set(step.claim_refs).size, step.claim_refs.length, `${item.slug}/${step.step_key} refs must be unique`);
          for (const ref of step.claim_refs) assert.ok(ids.has(ref), `${item.slug}/${step.step_key} ref must be local`);
        }
      }
    }
  });
  await t.test('empty body mapping', async () => {
    const bundle = cloneCanonical();
    bundle.items[0].versions[0].body_claim_refs = [];
    assertInvalid(bundle, /body_claim_refs must be a non-empty array/);
  });
  await t.test('dangling body mapping', async () => {
    const bundle = cloneCanonical();
    bundle.items[0].versions[0].body_claim_refs = ['missing-claim'];
    assertInvalid(bundle, /body_claim_refs must reference claim_trace ids/);
  });
  await t.test('duplicate body mapping', async () => {
    const bundle = cloneCanonical();
    const version = bundle.items[0].versions[0];
    version.body_claim_refs = [version.body_claim_refs[0], version.body_claim_refs[0]];
    assertInvalid(bundle, /body_claim_refs must not contain duplicates/);
  });
  await t.test('empty training step mapping', async () => {
    const bundle = cloneCanonical();
    const step = bundle.items.find(({ slug }) => slug === 'handling-program').versions[0].training_steps[0];
    step.claim_refs = [];
    assertInvalid(bundle, /claim_refs must be a non-empty list referencing claim_trace ids/);
  });
});

test('validator enforces age bounds, closed review fields and claim shapes', async (t) => {
  await t.test('impossible age window', async () => {
    const bundle = cloneCanonical();
    const version = bundle.items[1].versions[0];
    version.max_age_weeks = version.min_age_weeks - 1;
    assertInvalid(bundle, /max_age_weeks must be null or an integer/);
  });
  await t.test('negative minimum age', async () => {
    const bundle = cloneCanonical();
    bundle.items[1].versions[0].min_age_weeks = -1;
    assertInvalid(bundle, /min_age_weeks must be a non-negative integer/);
  });
  await t.test('valid-shaped but non-approved editorial window is rejected', async () => {
    const bundle = cloneCanonical();
    const version = bundle.items.find(({ slug }) => slug === 'handling-guide').versions[0];
    version.max_age_weeks = 52;
    assertInvalid(bundle, /age window must be 13\.\.16 for handling-guide/);
  });
  await t.test('missing review gate', async () => {
    const bundle = cloneCanonical();
    delete bundle.items[0].versions[0].review.human_reviewer;
    assertInvalid(bundle, /review fields must be exactly/);
  });
  await t.test('pending gate cannot carry evidence', async () => {
    const bundle = cloneCanonical();
    bundle.items[0].versions[0].review.human_reviewer.evidence = [
      { reference: sourcePreparationPath, reviewed_on: '2026-10-06' },
    ];
    assertInvalid(bundle, /evidence must be empty unless the gate is approved/);
  });
  await t.test('malformed claim shape', async () => {
    const bundle = cloneCanonical();
    firstSourcedClaim(bundle).unsupported = true;
    assertInvalid(bundle, /must match the sourced-claim or unverified-claim shape/);
  });
});

test('validator resolves step claims and verifies explicit unverified traces', async (t) => {
  await t.test('dangling training step claim reference', async () => {
    const bundle = cloneCanonical();
    const step = bundle.items.find(({ slug }) => slug === 'handling-program').versions[0].training_steps[0];
    step.claim_refs = ['missing-claim'];
    assertInvalid(bundle, /claim_refs must be a non-empty list referencing claim_trace ids/);
  });
  await t.test('draft accepts explicit unverified app behavior with repository evidence', async () => {
    const bundle = cloneCanonical();
    const claim = firstSourcedClaim(bundle);
    delete claim.source_refs;
    claim.unverified = { reason: 'app_behavior', evidence_refs: [sourcePreparationPath] };
    const result = runValidator({ bundle });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
  await t.test('publication check rejects an unverified claim even with complete draft shape', async () => {
    const bundle = cloneCanonical();
    const claim = bundle.items.find(({ slug }) => slug === 'first-week').versions[0].claim_trace.find((entry) => Array.isArray(entry.source_refs));
    delete claim.source_refs;
    claim.unverified = { reason: 'needs_source', evidence_refs: [] };
    const result = runValidator({ bundle, publicationCheck: true });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /contains an unverified claim/);
  });
});

test('publication check rejects missing, malformed, or unsupported review evidence', async (t) => {
  await t.test('published version with pending evidence is rejected', () => {
    const bundle = cloneCanonical();
    const gate = bundle.items.find(({ slug }) => slug === 'first-week').versions[0].review.human_reviewer;
    gate.status = 'pending';
    gate.evidence = [];
    const result = runValidator({ bundle, publicationCheck: true });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not approved with evidence/);
  });
  await t.test('approved gate without evidence is invalid in draft and publication modes', async () => {
    const bundle = cloneCanonical();
    bundle.items[0].versions[0].review.dog_expert.status = 'approved';
    assertInvalid(bundle, /marked approved without evidence/);
  });
  await t.test('approved evidence must point to an existing repository file', async () => {
    const bundle = cloneCanonical();
    const gate = bundle.items[0].versions[0].review.human_reviewer;
    gate.status = 'approved';
    gate.evidence = [{ reference: 'docs/content/no-review-evidence.md', reviewed_on: '2026-10-06' }];
    assertInvalid(bundle, /does not exist/);
  });
  await t.test('approved evidence requires a real calendar date', async () => {
    const bundle = cloneCanonical();
    const gate = bundle.items[0].versions[0].review.human_reviewer;
    gate.status = 'approved';
    gate.evidence = [{ reference: sourcePreparationPath, reviewed_on: '2026-02-30' }];
    assertInvalid(bundle, /real calendar date/);
  });
});

test('draft SQL import is transactional, exact-idempotent, and cannot manufacture publication evidence', async () => {
  const sqlPath = join(root, 'supabase', 'content', 'mvp-content-v1.sql');
  const sql = normalizeNewlines(readFileSync(sqlPath, 'utf8'));
  assert.match(sql, /^-- Generated from docs\/content\/mvp-content-bundle-v1\.json; draft rows only\.[\s\S]*?\bbegin;/i);
  assert.match(sql, /\bcommit;\s*$/i);
  const itemInserts = [...sql.matchAll(/insert into public\.content_items\s*\(([^)]*)\)\s*values[\s\S]*?on conflict \(id\) do nothing/gi)];
  const versionInserts = [...sql.matchAll(/insert into public\.content_versions\s*\(([^)]*)\)\s*values[\s\S]*?on conflict \(id\) do nothing/gi)];
  const stepInserts = [...sql.matchAll(/insert into public\.training_steps\s*\(([^)]*)\)\s*values[\s\S]*?on conflict \(id\) do nothing/gi)];
  assert.equal(itemInserts.length, 11);
  assert.equal(versionInserts.length, 11);
  assert.equal(stepInserts.length, 9);
  for (const [, columns] of versionInserts) {
    assert.match(columns, /\bstatus\b/i);
    assert.doesNotMatch(columns, /reviewed_at|review_reference|published_at/i);
  }
  assert.doesNotMatch(sql, /\bupdate\s+public\.(?:content_items|content_versions|training_steps)\b/i);
  assert.doesNotMatch(sql, /status\s*=\s*'published'|status\s*,[^)]*published_at/i);
  assert.match(sql, /content version mismatch:/i);
  assert.match(sql, /reviewed_at is null and review_reference is null and published_at is null/i);
  assert.match(sql, /breed target count mismatch:/i);
  for (const item of canonical.items) {
    for (const version of item.versions) {
      assert.match(sql, new RegExp(`content_version_id='${version.id}'::uuid\\) <> ${version.breed_targets.length} then raise exception 'breed target count mismatch:`));
    }
  }
  assert.match(sql, /training step mismatch:/i);
  assert.match(sql, /content item mismatch:/i);
  assert.equal((sql.match(/on conflict \(id\) do nothing/ig) ?? []).length, 31);
  // Static inspection only: no SQL is executed and deployed idempotence remains unverified.
});

test('draft SQL literals preserve every canonical item, version body/source set and training step', async () => {
  const sql = normalizeNewlines(readFileSync(join(root, 'supabase', 'content', 'mvp-content-v1.sql'), 'utf8'));
  for (const item of canonical.items) {
    const itemInsert = `insert into public.content_items(id, slug, content_type) values ('${item.id}'::uuid, '${sqlLiteral(item.slug)}', '${sqlLiteral(item.content_type)}') on conflict (id) do nothing;`;
    assert.ok(sql.includes(itemInsert), `missing exact content_items row for ${item.slug}`);
    for (const version of item.versions) {
      const marker = `'${version.id}'::uuid`;
      const idIndex = sql.indexOf(marker);
      assert.notEqual(idIndex, -1, `missing content version ID ${version.id}`);
      const statementStart = sql.lastIndexOf('insert into public.content_versions', idIndex);
      const statementEnd = sql.indexOf('on conflict (id) do nothing;', idIndex);
      assert.ok(statementStart !== -1 && statementEnd > idIndex, `missing bounded insert statement for ${item.slug}`);
      const statement = sql.slice(statementStart, statementEnd);
      assert.ok(statement.includes(`'${sqlLiteral(version.title)}'`), `title mismatch for ${item.slug}`);
      assert.ok(statement.includes(`'${sqlLiteral(version.body)}'`), `body mismatch for ${item.slug}`);
      assert.ok(statement.includes(`, ${version.min_age_weeks}, ${version.max_age_weeks === null ? 'null' : version.max_age_weeks}, 'draft',`),
        `age/status mismatch for ${item.slug}`);
      const sourceArray = statement.match(/ARRAY\[((?:'[^']*'(?:,\s*)?)*)\]::text\[\]/i)?.[1] ?? '';
      const actualUrls = [...sourceArray.matchAll(/'([^']*)'/g)].map(([, value]) => value).sort();
      const sourceUrls = [...new Set(version.claim_trace.flatMap((claim) => claim.source_refs ?? [])
        .map((id) => canonical.sources.find((source) => source.id === id)?.url)
        .filter((url) => url?.startsWith('https://') || url?.startsWith('repo://')))].sort();
      assert.deepEqual(actualUrls, sourceUrls, `source URL set mismatch for ${item.slug}`);
      for (const step of version.training_steps) {
        const stepRow = `('${step.id}'::uuid, '${version.id}'::uuid, '${sqlLiteral(step.step_key)}', ${step.position}, '${sqlLiteral(step.title)}', '${sqlLiteral(step.instruction)}')`;
        assert.ok(sql.includes(stepRow), `missing exact training step ${item.slug}/${step.step_key}`);
      }
    }
  }
});

test('approved publish SQL promotes exactly the ten runtime versions and keeps onboarding-only content hidden', () => {
  const sql = normalizeNewlines(readFileSync(join(root, 'supabase', 'content', 'publish-mvp-content-v1.sql'), 'utf8'));
  const approvedIds = canonical.items.filter(({ slug }) => slug !== 'before-homecoming')
    .map(({ versions }) => versions[0].id);
  const updates = [...sql.matchAll(/where id='([0-9a-f-]+)'::uuid and status='draft'/g)].map(([, id]) => id);
  assert.deepEqual(updates.sort(), approvedIds.sort());
  assert.match(sql, /review_reference='docs\/content\/mvp-content-approval-v1\.md'/);
  assert.match(sql, /approved content publication mismatch/);
  assert.match(sql, /onboarding-only content must remain draft/);
  assert.doesNotMatch(sql, /62000000-0000-4000-8000-000000000001'::uuid and status='draft'/);
});

function runValidator({ bundle, publicationCheck = false } = {}) {
  const args = [validatorPath];
  let temporaryDirectory;
  if (bundle) {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'tassla-content-bundle-'));
    const fixturePath = join(temporaryDirectory, 'fixture.json');
    writeFileSync(fixturePath, JSON.stringify(bundle), 'utf8');
    args.push(fixturePath);
  }
  if (publicationCheck) args.push('--publication-check');
  try {
    return spawnSync(pythonExecutable(), args, { cwd: root, encoding: 'utf8', timeout: 30_000 });
  } finally {
    if (temporaryDirectory && isAbsolute(temporaryDirectory)) rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function pythonExecutable() {
  const candidates = [
    process.env.TASSLA_PYTHON,
    process.env.PYTHON,
    process.env.PYTHON_EXECUTABLE,
    process.platform === 'win32' ? join(homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'python', 'python.exe') : null,
    process.platform === 'win32' ? 'python' : 'python3',
  ].filter(Boolean);
  return candidates.find((candidate) => !candidate.includes('/') && !candidate.includes('\\') || existsSync(candidate)) ?? candidates.at(-1);
}

function cloneCanonical() {
  return structuredClone(canonical);
}

function sqlLiteral(value) {
  return value.replaceAll("'", "''");
}

function normalizeNewlines(value) {
  return value.replaceAll('\r\n', '\n');
}

function selectorRows(items) {
  return items.flatMap((item) => item.versions.map((version) => ({
    id: version.id,
    contentId: item.id,
    version: version.version,
    status: version.status,
    minAgeWeeks: version.min_age_weeks,
    maxAgeWeeks: version.max_age_weeks,
    breedIds: version.breed_targets,
  })));
}

function firstSourcedClaim(bundle) {
  for (const item of bundle.items.filter(({ slug }) => slug !== 'before-homecoming')) {
    for (const version of item.versions) {
      const claim = version.claim_trace.find((entry) => Array.isArray(entry.source_refs));
      if (claim) return claim;
    }
  }
  assert.fail('Canonical bundle must include a source-backed claim');
}

function assertInvalid(bundle, expectedMessage) {
  const result = runValidator({ bundle });
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, expectedMessage);
}
