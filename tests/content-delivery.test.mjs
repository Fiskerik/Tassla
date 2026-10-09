import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';

const tsResolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const workspaceData = await import('../src/data/workspace-data.ts');
const appData = await import('../src/data/app-data.ts');
const sourceLinks = await import('../src/features/knowledge/source-links.ts');
const guideBody = await import('../src/features/knowledge/guide-body.ts');
tsResolution.deregister();
const workspaceSource = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const knowledgeSource = await readFile(new URL('../src/features/knowledge/KnowledgeScreen.tsx', import.meta.url), 'utf8');

const baseUrl = 'https://local-test.supabase.invalid';
const dog = { id: '11111111-1111-4111-8111-111111111111', name: 'Nala', breed_id: 'beagle', birth_date: '2026-10-01' };
const rows = [
  contentRow({ slug: 'daily-log-routines', contentType: 'article', minAge: 0, versionId: '62000000-0000-4000-8000-000000000003', sourceUrls: ['https://example.org/guide', 'repo://src/app.ts'] }),
  contentRow({ slug: 'before-homecoming', contentType: 'checklist', minAge: 0, versionId: '62000000-0000-4000-8000-000000000001' }),
  contentRow({ slug: 'handling-program', contentType: 'training_program', minAge: 0, versionId: '62000000-0000-4000-8000-000000000009' }),
  contentRow({ slug: 'first-week', contentType: 'article', minAge: 8, versionId: '62000000-0000-4000-8000-000000000002' }),
];

test('actual published loader sends a published-only metadata query and returns the same selected version identity and sources', async () => {
  const { client, requests } = localClient(() => jsonResponse(rows));
  try {
    const home = await workspaceData.fetchHomeContent(client, dog, 0);
    assert.equal(requests.length, 1);
    const request = requests[0];
    assert.equal(request.method, 'GET');
    assert.equal(request.url.searchParams.get('status'), 'eq.published');
    const columns = request.url.searchParams.get('select');
    assert.match(columns, /(^|,)status(,|$)/);
    assert.match(columns, /content_items!inner\(slug,content_type\)/);
    assert.match(columns, /sources/);
    assert.deepEqual(home.map(({ id }) => id), ['62000000-0000-4000-8000-000000000003', '62000000-0000-4000-8000-000000000009']);
    assert.deepEqual(home[0], {
      id: '62000000-0000-4000-8000-000000000003',
      contentId: '61000000-0000-4000-8000-000000000003',
      version: 1,
      title: 'Daily log guide',
      body: 'Record what you choose; this is not clinical advice.',
      contentType: 'article',
      sources: ['https://example.org/guide', 'repo://src/app.ts'],
    });
    const guideItems = evaluateActualGuideFilter(home);
    assert.deepEqual(guideItems.map(({ id }) => id), ['62000000-0000-4000-8000-000000000003']);
  } finally { await client.auth.dispose(); }
});

test('age zero excludes onboarding-only and future age advice from actual selection', async () => {
  const { client } = localClient(() => jsonResponse(rows));
  try {
    const home = await workspaceData.fetchHomeContent(client, dog, 0);
    assert.equal(home.some(({ contentId }) => contentId === '61000000-0000-4000-8000-000000000001'), false);
    assert.equal(home.some(({ contentId }) => contentId === '61000000-0000-4000-8000-000000000002'), false);
  } finally { await client.auth.dispose(); }
});

test('actual workspace loader fails closed for missing or malformed slug metadata', async (t) => {
  for (const [label, slug] of [['missing', undefined], ['malformed', 'not a slug']]) {
    await t.test(label, async () => {
      const invalid = contentRow({ slug: 'valid-placeholder', contentType: 'article', minAge: 0,
        versionId: '62000000-0000-4000-8000-000000000099', contentId: '61000000-0000-4000-8000-000000000099' });
      if (slug === undefined) delete invalid.content_items.slug;
      else invalid.content_items.slug = slug;
      const { client } = localClient(() => jsonResponse([invalid]));
      try { await assert.rejects(workspaceData.fetchHomeContent(client, dog, 0), /Could not load published content/); }
      finally { await client.auth.dispose(); }
    });
  }
});

test('actual workspace and legacy loaders fail closed if the SDK returns a draft despite the published filter', async () => {
  const draft = { ...rows[0], status: 'draft' };
  for (const loader of [workspaceData.fetchHomeContent, appData.fetchHomeContent]) {
    const { client, requests } = localClient(() => jsonResponse([draft]));
    try {
      await assert.rejects(loader(client, dog, 0), /[Pp]ublished content/);
      assert.equal(requests[0].url.searchParams.get('status'), 'eq.published');
    } finally { await client.auth.dispose(); }
  }
});

test('legacy app-data loader carries version/source metadata and never returns onboarding-only rows', async () => {
  const { client } = localClient(() => jsonResponse(rows));
  try {
    const home = await appData.fetchHomeContent(client, dog, 0);
    assert.deepEqual(home.map(({ id }) => id), ['62000000-0000-4000-8000-000000000003', '62000000-0000-4000-8000-000000000009']);
    assert.deepEqual(home[0].sources, ['https://example.org/guide', 'repo://src/app.ts']);
    assert.equal(home[0].contentId, '61000000-0000-4000-8000-000000000003');
    assert.equal(home[0].version, 1);
  } finally { await client.auth.dispose(); }
});

test('source link helper allows only normalized public HTTPS URLs', () => {
  assert.equal(sourceLinks.getSafeContentSourceUrl('https://example.org/a%20b'), 'https://example.org/a%20b');
  for (const value of [
    'javascript:alert(1)', 'file:///etc/passwd', 'repo://src/app.ts', 'http://example.org',
    'https://user:secret@example.org/path', 'https://', 'not a URL', ' https://example.org',
  ]) assert.equal(sourceLinks.getSafeContentSourceUrl(value), null, `${value} must remain plain text`);
});

test('actual Knowledge source handler opens only user-requested HTTPS and reports rejected opens', async () => {
  const body = extractFunction(knowledgeSource, 'openSource');
  const compiled = ts.transpileModule(body, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } });
  const calls = [];
  const messages = [];
  const Linking = { openURL: async (url) => { calls.push(url); if (url.includes('/unavailable')) throw new Error('blocked'); } };
  const openSource = new Function('Linking', 'getSafeContentSourceUrl', 'setSourceMessage', `${compiled.outputText}\nreturn openSource;`)(
    Linking, sourceLinks.getSafeContentSourceUrl, (message) => messages.push(message));

  await openSource('repo://src/app.ts');
  await openSource('javascript:alert(1)');
  assert.deepEqual(calls, []);
  await openSource('https://example.org/guide');
  await openSource('https://example.org/unavailable');
  assert.deepEqual(calls, ['https://example.org/guide', 'https://example.org/unavailable']);
  assert.deepEqual(messages, ['Källan öppnades.', 'Källan kunde inte öppnas just nu. Du kan försöka igen.']);
  assert.match(knowledgeSource, /safeUrl\s*&&\s*<Button[\s\S]*?onPress=\{\(\) => \{ void openSource\(source\); \}\}/);
});

test('actual screen states separate loading, error with retry, and ready-empty', () => {
  assert.match(knowledgeSource, /contentState === 'loading'[\s\S]*?<Skeleton/);
  assert.match(knowledgeSource, /contentState === 'error'[\s\S]*?<InfoBanner[\s\S]*?<Button label="Försök igen"/);
  assert.match(knowledgeSource, /contentState === 'ready' && items\.length === 0/);
});

test('guide-body helper renders supported headings and lists as plain text and produces a compact plain preview', () => {
  const body = '## Before you begin\n\nStart with a calm place.\n\n- Let the dog choose to approach.\n- Stop if the dog seems worried.\n\n### Remember\n\nKeep it short.';
  assert.deepEqual(guideBody.parseGuideBody(body), [
    { type: 'heading', level: 2, text: 'Before you begin' },
    { type: 'paragraph', text: 'Start with a calm place.' },
    { type: 'list', items: ['Let the dog choose to approach.', 'Stop if the dog seems worried.'] },
    { type: 'heading', level: 3, text: 'Remember' },
    { type: 'paragraph', text: 'Keep it short.' },
  ]);
  const preview = guideBody.getGuidePreviewText(body, 20);
  assert.equal(preview, 'Start with a calm p…');
  assert.doesNotMatch(preview, /[#*-]/);
  assert.ok(Array.from(guideBody.getGuidePreviewText('😀'.repeat(40), 12)).length <= 12);
  assert.match(knowledgeSource, /parseGuideBody\(selectedItem\.body\)\.map/);
  assert.match(workspaceSource, /getGuidePreviewText\(item\.body\)/);
});

test('Home opens the exact fetched version and Knowledge resolves that exact row without a reload', () => {
  const body = workspaceSource.match(/onOpenContent=\{\(contentId\) => \{([\s\S]*?)\}\}/)?.[1];
  assert.ok(body, 'expected Home open handler');
  assert.doesNotMatch(body, /fetchHomeContent|retryContent/);
  const selectedVersion = {
    id: '62000000-0000-4000-8000-000000000003', contentId: '61000000-0000-4000-8000-000000000003',
    version: 1, title: 'Guide', body: 'Content', contentType: 'article', sources: ['https://example.org/guide'],
  };
  let focus;
  let page;
  const onOpenContent = new Function('setKnowledgeFocus', 'router', 'currentSelectionKey',
    `return (contentId) => {${body}}`)((value) => { focus = value; }, { push: (value) => { page = value; } }, 'dog-age-breed-generation');
  onOpenContent(selectedVersion.id);
  assert.deepEqual(focus, { selectionKey: 'dog-age-breed-generation', contentId: selectedVersion.id, returnPage: 'home' });
  assert.equal(page, '/knowledge');

  const selectionExpression = knowledgeSource.match(/const selectedItem = ([^;]+);/)?.[1];
  assert.ok(selectionExpression, 'expected Knowledge exact version selection');
  const selected = new Function('items', 'focusedContentId', `return ${selectionExpression};`)([selectedVersion], focus.contentId);
  assert.equal(selected, selectedVersion);
  assert.match(knowledgeSource, /onPress=\{\(\) => \{ setSourceMessage\(''\); onSelectContent\(item\.id\); \}\}/);
});

function contentRow({ slug, contentType, minAge, versionId, sourceUrls = [], contentId = versionId.replace(/^62/, '61') }) {
  return {
    id: versionId, content_id: contentId, version: 1, title: slug === 'daily-log-routines' ? 'Daily log guide' : slug,
    body: slug === 'daily-log-routines' ? 'Record what you choose; this is not clinical advice.' : 'Content body.',
    min_age_weeks: minAge, max_age_weeks: null, status: 'published', sources: sourceUrls,
    content_items: { slug, content_type: contentType }, content_breed_targets: [],
  };
}

function localClient(handler) {
  const requests = [];
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      requests.push({ method: init.method ?? 'GET', url, signal: init.signal });
      return handler({ method: init.method ?? 'GET', url });
    } },
  });
  return { client, requests };
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}

function evaluateActualGuideFilter(content) {
  const expression = workspaceSource.match(/const visibleGuideContent = ([^;]+);/)?.[1];
  assert.ok(expression, 'expected actual workspace to exclude training programs from guides');
  return new Function('visibleContent', `return ${expression};`)(content);
}

function extractFunction(source, name) {
  const start = source.indexOf(`async function ${name}(`);
  assert.notEqual(start, -1, `expected actual ${name} handler`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = bodyStart; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  assert.fail(`unterminated handler ${name}`);
}
