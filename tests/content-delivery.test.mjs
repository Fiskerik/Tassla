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
const contentSelector = await import('../src/content/select-content.ts');
const sourceLinks = await import('../src/features/knowledge/source-links.ts');
const guideBody = await import('../src/features/knowledge/guide-body.ts');
tsResolution.deregister();
const workspaceSource = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const workspaceDataSource = await readFile(new URL('../src/data/workspace-data.ts', import.meta.url), 'utf8');
const knowledgeSource = await readFile(new URL('../src/features/knowledge/KnowledgeScreen.tsx', import.meta.url), 'utf8');
const trainingScreenSource = await readFile(new URL('../src/features/training/PublishedTrainingScreen.tsx', import.meta.url), 'utf8');
const homeScreenSource = await readFile(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const logScreenSource = await readFile(new URL('../src/features/puppy-log/LogScreen.tsx', import.meta.url), 'utf8');
const healthScreenSource = await readFile(new URL('../src/features/health/HealthScreen.tsx', import.meta.url), 'utf8');
const weightScreenSource = await readFile(new URL('../src/features/health/WeightScreen.tsx', import.meta.url), 'utf8');

const baseUrl = 'https://local-test.supabase.invalid';
const dog = { id: '11111111-1111-4111-8111-111111111111', name: 'Nala', breed_id: 'beagle', birth_date: '2026-10-01' };
const rows = [
  contentRow({ slug: 'daily-log-routines', contentType: 'article', minAge: 0, versionId: '62000000-0000-4000-8000-000000000003', sourceUrls: ['https://example.org/guide', 'repo://src/app.ts'] }),
  contentRow({ slug: 'before-homecoming', contentType: 'checklist', minAge: 0, versionId: '62000000-0000-4000-8000-000000000001' }),
  contentRow({ slug: 'handling-program', contentType: 'training_program', minAge: 0, versionId: '62000000-0000-4000-8000-000000000009' }),
  contentRow({ slug: 'first-week', contentType: 'article', minAge: 8, versionId: '62000000-0000-4000-8000-000000000002' }),
  contentRow({ slug: 'handling-guide', contentType: 'guide', minAge: 13, maxAge: 16, versionId: '62000000-0000-4000-8000-000000000004', sourceUrls: ['https://example.org/handling'] }),
  contentRow({ slug: 'being-alone-guide', contentType: 'guide', minAge: 27, maxAge: 52, versionId: '62000000-0000-4000-8000-000000000006', sourceUrls: ['https://example.org/alone'] }),
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
    assert.equal(home.status, 'empty');
    assert.deepEqual(home.items, []);
  } finally { await client.auth.dispose(); }
});

test('content catalog returns separate fail-closed selections for each surface', async () => {
  const { client } = localClient(() => jsonResponse(rows));
  try {
    const catalog = await workspaceData.fetchContentSurfaceCatalog(client, dog, 0);
    assert.equal(catalog.homeAdvice.status, 'empty');
    assert.equal(catalog.knowledgeForYou.status, 'empty');
    assert.equal(catalog.knowledgeArticles.status, 'empty');
    assert.equal(catalog.knowledgeFaq.status, 'empty');
    assert.equal(catalog.trainingRecommended.status, 'empty');
    assert.equal(catalog.trainingAll.status, 'empty');
    assert.equal(catalog.logHelp.status, 'eligible');
    assert.deepEqual(catalog.logHelp.items.map(({ id }) => id), ['62000000-0000-4000-8000-000000000003']);
    assert.equal(catalog.weightHelp.status, 'empty');
    assert.equal(catalog.healthHelp.status, 'empty');
  } finally { await client.auth.dispose(); }
});

test('FAQ catalog selects the exact published version for the matching age window', async () => {
  const { client } = localClient(() => jsonResponse(rows));
  try {
    const puppyFaq = await workspaceData.fetchContentSurfaceCatalog(client, dog, 14);
    assert.equal(puppyFaq.knowledgeFaq.status, 'eligible');
    assert.deepEqual(puppyFaq.knowledgeFaq.items.map(({ id }) => id), ['62000000-0000-4000-8000-000000000004']);
    assert.deepEqual(puppyFaq.knowledgeFaq.items[0].sources, ['https://example.org/handling']);
    assert.equal(puppyFaq.knowledgeForYou.status, 'eligible');
    assert.equal(puppyFaq.knowledgeArticles.status, 'eligible');
    assert.deepEqual(puppyFaq.knowledgeForYou.items.map(({ id }) => id), ['62000000-0000-4000-8000-000000000004']);
    assert.deepEqual(puppyFaq.knowledgeArticles.items.map(({ id }) => id), ['62000000-0000-4000-8000-000000000004']);

    const olderPuppyFaq = await workspaceData.fetchContentSurfaceCatalog(client, dog, 40);
    assert.equal(olderPuppyFaq.knowledgeFaq.status, 'eligible');
    assert.deepEqual(olderPuppyFaq.knowledgeFaq.items.map(({ id }) => id), ['62000000-0000-4000-8000-000000000006']);
    assert.deepEqual(olderPuppyFaq.knowledgeFaq.items[0].sources, ['https://example.org/alone']);
    assert.deepEqual(olderPuppyFaq.knowledgeForYou.items.map(({ id }) => id), ['62000000-0000-4000-8000-000000000006']);
    assert.deepEqual(olderPuppyFaq.knowledgeArticles.items.map(({ id }) => id), ['62000000-0000-4000-8000-000000000006']);
  } finally { await client.auth.dispose(); }
});

test('Knowledge and FAQ grants, priorities, age windows, and fail-closed outcomes match the approved contract', () => {
  const { selectContentForSurface, getContentPolicy } = contentSelector;
  const handlingId = '62000000-0000-4000-8000-000000000004';
  const aloneId = '62000000-0000-4000-8000-000000000006';
  const firstWeekId = '62000000-0000-4000-8000-000000000002';
  const surfaces = ['knowledge_faq', 'knowledge_for_you', 'knowledge_articles'];
  const expectedGrants = (priority) => surfaces.map((surface) => ({
    surface, context: 'dog_advice', audience: 'dog_owner', need: null, priority, ageAgnostic: false,
  }));
  assert.deepEqual(getContentPolicy(handlingId)?.grants, expectedGrants(1));
  assert.deepEqual(getContentPolicy(aloneId)?.grants, expectedGrants(2));
  const knownIds = Array.from({ length: 11 }, (_, index) => `62000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
  for (const surface of surfaces) {
    assert.deepEqual(knownIds.filter((id) => getContentPolicy(id)?.grants.some((grant) => grant.surface === surface)), [handlingId, aloneId]);
  }

  const candidate = (id, contentId = id, version = 1, minAgeWeeks = 0, maxAgeWeeks = null, breedIds = []) => ({
    id, contentId, version, status: 'published', minAgeWeeks, maxAgeWeeks, breedIds,
  });
  const request = { surface: 'knowledge_faq', context: 'dog_advice', audience: 'dog_owner', need: null, dogId: dog.id, breedId: 'beagle', ageWeeks: 14 };
  const ordered = selectContentForSurface([
    candidate(aloneId, 'alone-content', 1, 27, 52), candidate(handlingId, 'handling-content', 1, 13, 16),
  ], request);
  assert.equal(ordered.status, 'eligible');
  assert.deepEqual(ordered.items.map(({ id }) => id), [handlingId]);

  for (const surface of ['knowledge_for_you', 'knowledge_articles']) {
    const surfaceRequest = { ...request, surface };
    const versions = [candidate(handlingId, 'handling-content', 1, 13, 16), candidate(aloneId, 'alone-content', 1, 27, 52)];
    for (const ageWeeks of [13, 16]) {
      const selection = selectContentForSurface(versions, { ...surfaceRequest, ageWeeks });
      assert.equal(selection.status, 'eligible');
      assert.deepEqual(selection.items.map(({ id }) => id), [handlingId]);
    }
    for (const ageWeeks of [27, 52]) {
      const selection = selectContentForSurface(versions, { ...surfaceRequest, ageWeeks });
      assert.equal(selection.status, 'eligible');
      assert.deepEqual(selection.items.map(({ id }) => id), [aloneId]);
    }
    for (const ageWeeks of [8, 12, 17, 26, 53]) {
      assert.equal(selectContentForSurface(versions, { ...surfaceRequest, ageWeeks }).status, 'empty');
    }
    assert.deepEqual(selectContentForSurface(versions, { ...surfaceRequest, ageWeeks: null }),
      { status: 'unknown', reason: 'missing_age', items: [] });
    assert.equal(selectContentForSurface([candidate(firstWeekId, 'first-week-content', 1, 8, 12)], { ...surfaceRequest, ageWeeks: 10 }).status, 'empty');
  }

  assert.deepEqual(selectContentForSurface([candidate(handlingId)], { ...request, ageWeeks: null }),
    { status: 'unknown', reason: 'missing_age', items: [] });
  assert.deepEqual(selectContentForSurface([candidate(handlingId)], { ...request, dogId: 'not-a-uuid' }),
    { status: 'unknown', reason: 'invalid_request', items: [] });
  assert.deepEqual(selectContentForSurface([candidate('62000000-0000-4000-8000-000000000099')], request),
    { status: 'unknown', reason: 'unmapped_version', items: [] });
  assert.equal(selectContentForSurface([candidate(handlingId)], { ...request, surface: 'knowledge_articles' }).status, 'eligible');
  assert.equal(selectContentForSurface([candidate(handlingId, handlingId, 1, 13, 16)], { ...request, ageWeeks: 17 }).status, 'empty');
  assert.equal(selectContentForSurface([candidate(handlingId, handlingId, 1, 13, 16, ['other-breed'])], request).status, 'empty');
  assert.equal(selectContentForSurface([
    candidate(handlingId, 'handling-content', 1, 13, 16),
    candidate('62000000-0000-4000-8000-000000000005', 'handling-content', 2, 13, 16),
  ], request).status, 'empty');
});

test('surface selector requires exact known version grants and never falls back from a newer denied version', () => {
  const { selectContentForSurface, getContentPolicy } = contentSelector;
  const candidate = (id, contentId = 'content-a', version = 1, minAgeWeeks = 0, maxAgeWeeks = null, breedIds = []) => ({
    id, contentId, version, status: 'published', minAgeWeeks, maxAgeWeeks, breedIds,
  });
  const request = { surface: 'log_help', context: 'log_routines', audience: 'dog_owner', dogId: dog.id, breedId: 'beagle', ageWeeks: null, need: null };
  const eligible = selectContentForSurface([candidate('62000000-0000-4000-8000-000000000003')], request);
  assert.equal(eligible.status, 'eligible');
  assert.equal(eligible.items[0].id, '62000000-0000-4000-8000-000000000003');

  const mismatched = selectContentForSurface([candidate('62000000-0000-4000-8000-000000000003')], { ...request, surface: 'weight_help', context: 'weight_recording' });
  assert.equal(mismatched.status, 'empty');
  const latestDenied = selectContentForSurface([
    candidate('62000000-0000-4000-8000-000000000003', 'content-a', 1),
    candidate('62000000-0000-4000-8000-000000000001', 'content-a', 2),
  ], request);
  assert.equal(latestDenied.status, 'empty');
  const futureUnknown = selectContentForSurface([candidate('62000000-0000-4000-8000-000000000099')], request);
  assert.deepEqual(futureUnknown, { status: 'unknown', reason: 'unmapped_version', items: [] });

  const dogAdvice = { ...request, surface: 'home_advice', context: 'dog_advice', ageWeeks: 0 };
  assert.equal(selectContentForSurface([candidate('62000000-0000-4000-8000-000000000003')], dogAdvice).status, 'empty');
  assert.deepEqual(selectContentForSurface([candidate('62000000-0000-4000-8000-000000000003')], { ...dogAdvice, ageWeeks: null }),
    { status: 'unknown', reason: 'missing_age', items: [] });
  assert.deepEqual(selectContentForSurface([candidate('62000000-0000-4000-8000-000000000003')], { ...request, context: 'health_recording' }),
    { status: 'unknown', reason: 'invalid_request', items: [] });
  for (const malformed of [
    { ...request, dogId: undefined },
    { ...request, dogId: null },
    { ...request, dogId: 42 },
    { ...request, dogId: 'not-a-uuid' },
    { ...request, breedId: undefined },
    { ...request, breedId: null },
    { ...request, breedId: {} },
    { ...request, breedId: '!!!' },
    { ...request, breedId: '   ' },
    { ...request, breedId: ' beagle ' },
    null,
  ]) {
    assert.deepEqual(selectContentForSurface([candidate('62000000-0000-4000-8000-000000000003')], malformed),
      { status: 'unknown', reason: 'invalid_request', items: [] });
  }
  assert.equal(selectContentForSurface([candidate('62000000-0000-4000-8000-000000000003', 'content-a', 1, 0, 5, ['other'])], request).status, 'empty');

  const known = Array.from({ length: 11 }, (_, index) => `62000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
  assert.deepEqual(known.filter((id) => getContentPolicy(id)?.grants.length), [
    '62000000-0000-4000-8000-000000000003',
    '62000000-0000-4000-8000-000000000004',
    '62000000-0000-4000-8000-000000000006',
    '62000000-0000-4000-8000-000000000007',
    '62000000-0000-4000-8000-000000000008',
  ]);
});

test('Home and Knowledge render selector-specific empty/unknown states without first-item recommendations', () => {
  assert.match(workspaceSource, /fetchContentSurfaceCatalog\(client, dog, age/);
  assert.match(workspaceSource, /visibleContentCatalog\?\.homeAdvice\.status/);
  assert.match(workspaceSource, /visibleContentCatalog\?\.knowledgeForYou\.status/);
  assert.match(workspaceSource, /visibleContentCatalog\?\.knowledgeArticles\.status/);
  assert.match(homeScreenSource, /Det finns inget publicerat råd för den här vyn just nu\./);
  assert.match(homeScreenSource, /contentUnknownReason === 'missing_age' \? 'Redigera hundprofil'/);
  assert.match(knowledgeSource, /Det finns inga publicerade guider som passar hundens profil i den här vyn just nu\./);
  assert.match(knowledgeSource, /Det finns inga publicerade artiklar som passar hundens profil i den här vyn just nu\./);
  assert.match(knowledgeSource, /Öppna dagens checklista/);
  assert.match(knowledgeSource, /Öppna checklistor/);
  assert.match(workspaceSource, /onOpenTodayChecklist=\{openTodayChecklist\}/);
  assert.match(workspaceSource, /recommendedPrograms=\{training\.recommendedPrograms\} allPrograms=\{training\.allPrograms\}/);
  assert.match(workspaceDataSource, /selectionFor\('training_recommended'\)/);
  assert.match(workspaceDataSource, /selectionFor\('training_all'\)/);
  assert.match(workspaceDataSource, /recommendedRows = rowsFor\(recommendedSelection\)/);
  assert.match(workspaceDataSource, /allRows = rowsFor\(allSelection\)/);
  assert.match(trainingScreenSource, /visibleRecommendedPrograms/);
  assert.match(trainingScreenSource, /visibleAllPrograms/);
  assert.doesNotMatch(knowledgeSource, /REKOMMENDERAT FÖR ER/);
  assert.doesNotMatch(workspaceSource, /HomeCarousel/);
  assert.doesNotMatch(homeScreenSource, /HomeCarousel/);
});

test('contextual function help opens only grant-selected versions and returns to the source context', () => {
  assert.match(workspaceSource, /logHelpContent = visibleFeatureHelp\.find\(\(item\) => item\.id === '62000000-0000-4000-8000-000000000003'/);
  assert.match(workspaceSource, /weightHelpContent = visibleFeatureHelp\.find\(\(item\) => item\.id === '62000000-0000-4000-8000-000000000007'/);
  assert.match(workspaceSource, /healthHelpContent = visibleFeatureHelp\.find\(\(item\) => item\.id === '62000000-0000-4000-8000-000000000008'/);
  assert.match(logScreenSource, /!editingEvent && !addEventVisible && !accidentDraft && !duplicate/);
  assert.match(logScreenSource, /onSelectedDateChange\?\.\(value\)/);
  assert.match(workspaceSource, /selectedDateValue=\{logSelectedDate\}/);
  assert.match(healthScreenSource, /tab === 'Översikt' && !sheet && props\.onOpenHistoryHelp/);
  assert.match(weightScreenSource, /!editingId && !addDraftDirty && onOpenHelp/);
  assert.match(workspaceSource, /initialTab=\{healthActiveTab as/);
  assert.match(knowledgeSource, /contextualHelpReturn \? contextualReturnLabel/);
});

test('age zero excludes onboarding-only and future age advice from actual selection', async () => {
  const { client } = localClient(() => jsonResponse(rows));
  try {
    const home = await workspaceData.fetchHomeContent(client, dog, 0);
    assert.equal(home.status, 'empty');
    assert.deepEqual(home.items, []);
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
  assert.deepEqual(messages, ['', '', '', 'Källan öppnades.', '', 'Källan kunde inte öppnas just nu. Du kan försöka igen.']);
  assert.match(knowledgeSource, /safeUrl\s*&&\s*<QuietButton[\s\S]*?onPress=\{\(\) => \{ void openSource\(source\); \}\}/);
});

test('actual screen states separate loading, error with retry, and ready-empty', () => {
  assert.match(knowledgeSource, /contentState === 'loading' && <Skeleton/);
  assert.match(knowledgeSource, /contentState === 'error' && <>[\s\S]*?<PrimaryButton title="Försök igen" onPress=\{onRetry\}/);
  assert.match(knowledgeSource, /contentState === 'ready' && visibleItems\.length === 0/);
});

test('Knowledge search stays on the loaded eligible set and has distinct exact empty-state copy', async () => {
  assert.match(knowledgeSource, /Sökningen gäller bara publicerat innehåll som redan valts för den här fliken och hundens profil\./);
  assert.match(knowledgeSource, /Inga guider på den här fliken matchar sökningen\./);
  assert.match(knowledgeSource, /Inga artiklar på den här fliken matchar sökningen\./);
  assert.match(knowledgeSource, /QuietButton title="Rensa sökning"/);
  assert.match(knowledgeSource, /searchKnowledgeItems\(visibleItems, searchText\)/);
  assert.doesNotMatch(knowledgeSource, /fetchContent|createClient|\.from\(/);
  const media = await readFile(new URL('../src/features/knowledge/knowledge-content-media.ts', import.meta.url), 'utf8');
  assert.match(media, /000000000004': require\('\.\.\/\.\.\/\.\.\/assets\/images\/puppy-training\.png'\)/);
  assert.match(media, /000000000006': require\('\.\.\/\.\.\/\.\.\/assets\/images\/puppy-resting-carousel\.png'\)/);
  assert.match(media, /KNOWLEDGE_CONTENT_IMAGES\[contentVersionId\] \?\? null/);
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
  assert.doesNotMatch(knowledgeSource, /REKOMMENDERAT FÖR ER/);
  assert.match(knowledgeSource, /filteredItems\.slice\(1\)/);
  assert.match(knowledgeSource, /getKnowledgeContentImage\(item\.id\)/);
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
  let detailOpen = true;
  const onOpenContent = new Function('setKnowledgeDetailOpen', 'setKnowledgeFocus', 'setPage', 'currentSelectionKey',
    `return (contentId) => {${body}}`)((value) => { detailOpen = value; }, (value) => { focus = value; }, (value) => { page = value; }, 'dog-age-breed-generation');
  onOpenContent(selectedVersion.id);
  assert.equal(detailOpen, false);
  assert.deepEqual(focus, { selectionKey: 'dog-age-breed-generation', contentId: selectedVersion.id, returnPage: 'home' });
  assert.equal(page, 'knowledge');

  const selectionExpression = knowledgeSource.match(/const selectedItem = ([^;]+);/)?.[1];
  assert.ok(selectionExpression, 'expected Knowledge exact version selection');
  const selected = new Function('items', 'openedId', `return ${selectionExpression};`)([selectedVersion], focus.contentId);
  assert.equal(selected, selectedVersion);
  assert.match(knowledgeSource, /setOpenedId\(id\); setSourceMessage\(''\); onSelectContent\(id\)/);
});

function contentRow({ slug, contentType, minAge, maxAge = null, versionId, sourceUrls = [], contentId = versionId.replace(/^62/, '61') }) {
  return {
    id: versionId, content_id: contentId, version: 1, title: slug === 'daily-log-routines' ? 'Daily log guide' : slug,
    body: slug === 'daily-log-routines' ? 'Record what you choose; this is not clinical advice.' : 'Content body.',
    min_age_weeks: minAge, max_age_weeks: maxAge, status: 'published', sources: sourceUrls,
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
