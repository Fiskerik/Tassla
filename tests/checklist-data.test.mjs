import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
const data = await import('../src/features/knowledge/checklist-data.ts');
const { getContentSourceMetadata } = await import('../src/features/knowledge/source-links.ts');
hook.deregister();
const dogId = '11111111-1111-4111-8111-111111111111';
const otherDogId = '99999999-9999-4999-8999-999999999999';
const templateId = 'review-v1:before-homecoming';
const customId = '33333333-3333-4333-8333-333333333333';
const baseUrl = 'https://local-checklists.supabase.invalid';
const iconMigration = await readFile(new URL('../supabase/migrations/202610230001_checklist_custom_item_icons.sql', import.meta.url), 'utf8');
const iconProbe = await readFile(new URL('../supabase/tests/checklist-custom-item-icons.sql', import.meta.url), 'utf8');
const phaseBundle = JSON.parse(await readFile(new URL('../docs/content/knowledge-phase-checklists-v1.json', import.meta.url), 'utf8'));

function localClient(handler) {
  const requests = [];
  const client = createClient(baseUrl, 'synthetic-publishable-key', { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: async (input, init = {}) => {
    if (init.signal?.aborted) throw new DOMException('aborted', 'AbortError');
    const url = new URL(typeof input === 'string' ? input : input.url);
    const request = { method: init.method ?? 'GET', url, signal: init.signal, body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined };
    requests.push(request);
    return handler(request);
  } } });
  return { client, requests };
}
const json = (value, status = 200) => Response.json(value, { status });
const progressRow = (dog = dogId) => ({ dog_id: dog, template_id: templateId, item_key: 'safe-space' });
const customRow = (values = {}) => ({ id: customId, dog_id: dogId, template_id: templateId, title: 'Extra vila', completed: false, icon: null, ...values });

function publishedPhaseFixture(bundle = phaseBundle) {
  const sourceById = new Map(bundle.sources.map((source) => [source.id, source.url]));
  const roots = bundle.templates.map((template, index) => ({
    id: template.template_id,
    context: template.context,
    content_item_id: `55000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  }));
  const versions = bundle.templates.map((template, index) => ({
    id: template.version_id,
    content_id: roots[index].content_item_id,
    version: template.version,
    title: template.title,
    body: template.body,
    min_age_weeks: template.min_age_weeks,
    max_age_weeks: template.max_age_weeks,
    context: template.context,
    sources: template.sources.map((sourceId) => sourceById.get(sourceId)),
    is_ai_generated: true,
    status: 'published',
    reviewed_at: '2026-10-26T00:00:00.000Z',
    review_reference: 'docs/content/knowledge-phase-checklists-review-v1.md',
  }));
  const items = bundle.templates.flatMap((template, index) => template.items.map((item) => ({
    content_version_id: template.version_id,
    template_id: template.template_id,
    item_key: item.key,
    position: item.position,
    title: item.title,
  })));
  return { roots, versions, items };
}

function catalogClient(fixture, mutate = () => {}, ownerHandler = () => json([])) {
  const { client, requests } = localClient((request) => {
    const table = request.url.pathname.split('/').at(-1);
    if (table?.startsWith('dog_checklist_')) return ownerHandler(request);
    if (table === 'checklist_templates') return json(fixture.roots);
    if (table === 'content_versions') {
      assert.equal(request.url.searchParams.get('status'), 'eq.published');
      return json(fixture.versions);
    }
    if (table === 'content_version_checklist_items') return json(fixture.items);
    return json([]);
  });
  mutate(fixture);
  return { client, requests };
}

test('standard checkbox is idempotent and confirms exact dog/template/item after upsert', async () => {
  let stored = null;
  const { client, requests } = localClient((request) => {
    if (request.method === 'POST') { stored = request.body; return json([]); }
    assert.equal(request.url.pathname, '/rest/v1/dog_checklist_progress');
    assert.equal(request.url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(request.url.searchParams.get('template_id'), `eq.${templateId}`);
    assert.equal(request.url.searchParams.get('item_key'), 'eq.safe-space');
    return json(stored ? [stored] : []);
  });
  try {
    assert.deepEqual(await data.setChecklistItem(client, dogId, templateId, 'safe-space', true), { status: 'saved', value: { dogId, templateId, itemKey: 'safe-space' } });
    assert.equal(requests[0].url.searchParams.get('on_conflict'), 'dog_id,template_id,item_key');
    assert.equal(requests.length, 2);
  } finally { await client.auth.dispose(); }
});

test('custom item icon migration matches the shared 20-icon allowlist and has an owner probe', async () => {
  const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
  const icons = await import('../src/features/checklists/checklist-icons.ts');
  hook.deregister();
  const match = iconMigration.match(/icon is null or icon in \(([\s\S]*?)\n\s*\)\n\s*\);/);
  assert.ok(match, 'nullable column has a CHECK allowlist');
  assert.deepEqual([...match[1].matchAll(/'([^']+)'/g)].map(([, icon]) => icon), [...icons.CHECKLIST_ICONS]);
  assert.match(iconMigration, /grant insert \(id, dog_id, template_id, title, completed, icon\).*to authenticated/s);
  assert.match(iconMigration, /grant update \(title, completed, icon\).*to authenticated/s);
  assert.match(iconProbe, /legacy update changed persisted icon/);
  assert.match(iconProbe, /second owner changed another dog icon/);
  assert.match(iconProbe, /invalid icon value was accepted/);
});

test('lost custom insert response keeps UUID and exact readback can confirm it', async () => {
  let stored = null;
  const { client, requests } = localClient((request) => {
    if (request.method === 'POST') { stored = request.body; throw new TypeError('simulated lost response'); }
    assert.equal(request.url.pathname, '/rest/v1/dog_checklist_custom_items');
    assert.equal(request.url.searchParams.get('id'), `eq.${customId}`);
    return json(stored ? [stored] : []);
  });
  try {
    const result = await data.addChecklistCustomItem(client, dogId, templateId, customId, '  Extra vila  ', 'water-outline');
    assert.deepEqual(result, { status: 'saved', value: { id: customId, dogId, templateId, title: 'Extra vila', completed: false, icon: 'water-outline' } });
    assert.equal(requests[0].body.id, customId);
    assert.equal(requests[0].body.icon, 'water-outline');
    assert.equal(requests[1].url.searchParams.get('dog_id'), `eq.${dogId}`);
  } finally { await client.auth.dispose(); }
});

test('unreadable postimage is unknown and does not trigger another insert', async () => {
  const { client, requests } = localClient((request) => {
    if (request.method === 'POST') throw new TypeError('insert response lost');
    return json({ message: 'readback unavailable' }, 400);
  });
  try {
    assert.deepEqual(await data.addChecklistCustomItem(client, dogId, templateId, customId, 'Extra vila'), { status: 'unknown' });
    assert.equal(requests.filter((request) => request.method === 'POST').length, 1);
    assert.equal(requests.filter((request) => request.method === 'GET').length, 1);
  } finally { await client.auth.dispose(); }
});

test('custom delete replay confirms absence after the first delete response is lost', async () => {
  let stored = customRow();
  let deleted = false;
  const { client, requests } = localClient((request) => {
    if (request.method === 'DELETE') { stored = null; deleted = true; throw new TypeError('simulated lost response'); }
    assert.equal(request.url.searchParams.get('dog_id'), `eq.${dogId}`);
    return json(stored ? [stored] : []);
  });
  try {
    assert.deepEqual(await data.deleteChecklistCustomItem(client, { id: customId, dogId, templateId, title: 'Extra vila', completed: false, icon: null }), { status: 'saved', value: null });
    assert.equal(deleted, true);
    assert.equal(requests[0].url.searchParams.get('title'), 'eq.Extra vila');
    assert.equal(requests[1].method, 'GET');
  } finally { await client.auth.dispose(); }
});

test('custom edits use old-value CAS and preserve an explicit conflict', async () => {
  const { client, requests } = localClient((request) => {
    assert.equal(request.url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(request.url.searchParams.get('template_id'), `eq.${templateId}`);
    assert.equal(request.url.searchParams.get('title'), 'eq.Extra vila');
    assert.equal(request.url.searchParams.get('completed'), 'eq.false');
    assert.deepEqual(request.body, { title: 'Nytt namn', completed: true });
    return json([]);
  });
  try {
    const result = await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: 'Extra vila', completed: false, icon: null }, { title: 'Nytt namn', completed: true });
    assert.deepEqual(result, { status: 'conflict' });
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('rejected custom edit with an unchanged exact preimage is retryable, not a conflict', async () => {
  const previous = customRow();
  const { client, requests } = localClient((request) => {
    if (request.method === 'PATCH') return json({ message: 'write rejected before mutation' }, 400);
    assert.equal(request.method, 'GET');
    assert.equal(request.url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(request.url.searchParams.get('id'), `eq.${customId}`);
    return json([previous]);
  });
  try {
    const result = await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: previous.title, completed: previous.completed, icon: previous.icon }, { title: 'Nytt namn', completed: true });
    assert.deepEqual(result, { status: 'failed' });
    assert.equal(requests.length, 2);
    assert.equal(requests[0].method, 'PATCH');
    assert.equal(requests[1].method, 'GET');
  } finally { await client.auth.dispose(); }
});

test('rejected custom edit with unreadable preimage remains unknown', async () => {
  const { client, requests } = localClient((request) => request.method === 'PATCH'
    ? json({ message: 'write rejected' }, 400)
    : json({ message: 'readback unavailable' }, 400));
  try {
    const result = await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: 'Extra vila', completed: false, icon: null }, { title: 'Nytt namn', completed: true });
    assert.deepEqual(result, { status: 'unknown' });
    assert.deepEqual(requests.map((request) => request.method), ['PATCH', 'GET']);
  } finally { await client.auth.dispose(); }
});

test('rejected custom edit whose target disappeared is a conflict', async () => {
  const { client, requests } = localClient((request) => request.method === 'PATCH'
    ? json({ message: 'write target disappeared' }, 400)
    : json([]));
  try {
    const result = await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: 'Extra vila', completed: false, icon: null }, { title: 'Nytt namn', completed: true });
    assert.deepEqual(result, { status: 'conflict' });
    assert.deepEqual(requests.map((request) => request.method), ['PATCH', 'GET']);
  } finally { await client.auth.dispose(); }
});

test('rejected custom edit with exact postimage is confirmed saved', async () => {
  const { client, requests } = localClient((request) => request.method === 'PATCH'
    ? json({ message: 'write response failed' }, 400)
    : json([customRow({ title: 'Nytt namn', completed: true })]));
  try {
    const result = await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: 'Extra vila', completed: false, icon: null }, { title: 'Nytt namn', completed: true });
    assert.deepEqual(result, { status: 'saved', value: { id: customId, dogId, templateId, title: 'Nytt namn', completed: true, icon: null } });
    assert.deepEqual(requests.map((request) => request.method), ['PATCH', 'GET']);
  } finally { await client.auth.dispose(); }
});

test('rejected custom edit with a divergent readback is a conflict', async () => {
  const { client, requests } = localClient((request) => request.method === 'PATCH'
    ? json({ message: 'write response failed' }, 400)
    : json([customRow({ title: 'Ändrad på annan enhet', completed: false })]));
  try {
    const result = await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: 'Extra vila', completed: false, icon: null }, { title: 'Nytt namn', completed: true });
    assert.deepEqual(result, { status: 'conflict' });
    assert.deepEqual(requests.map((request) => request.method), ['PATCH', 'GET']);
  } finally { await client.auth.dispose(); }
});

test('selected icon updates use icon-aware CAS and return the exact saved value', async () => {
  const previous = customRow({ icon: 'water-outline' });
  const updated = { ...previous, icon: 'walk-outline' };
  const { client, requests } = localClient((request) => {
    if (request.method === 'PATCH') { assert.equal(request.url.searchParams.get('icon'), 'eq.water-outline'); assert.deepEqual(request.body, { title: previous.title, completed: false, icon: 'walk-outline' }); return json([updated]); }
    return json([updated]);
  });
  try {
    assert.deepEqual(await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: previous.title, completed: false, icon: 'water-outline' }, { title: previous.title, completed: false, icon: 'walk-outline' }), {
      status: 'saved', value: { id: customId, dogId, templateId, title: previous.title, completed: false, icon: 'walk-outline' },
    });
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('completion-only update preserves a saved icon and omits it from the patch body', async () => {
  const previous = customRow({ icon: 'water-outline' });
  const updated = { ...previous, completed: true };
  const { client, requests } = localClient((request) => {
    assert.equal(request.url.searchParams.get('icon'), 'eq.water-outline');
    if (request.method === 'PATCH') { assert.deepEqual(request.body, { title: previous.title, completed: true }); return json([updated]); }
    return json([updated]);
  });
  try {
    assert.deepEqual(await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: previous.title, completed: false, icon: previous.icon }, { title: previous.title, completed: true }), {
      status: 'saved', value: { id: customId, dogId, templateId, title: previous.title, completed: true, icon: 'water-outline' },
    });
    assert.equal(requests.length, 1);
  } finally { await client.auth.dispose(); }
});

test('icon reads accept null legacy values and reject unknown persisted values', async () => {
  const legacy = localClient((request) => request.url.pathname.endsWith('dog_checklist_custom_items') ? json([customRow({ icon: null })]) : json([]));
  const invalid = localClient((request) => request.url.pathname.endsWith('dog_checklist_custom_items') ? json([customRow({ icon: 'not-an-ionicon' })]) : json([]));
  try {
    const loaded = await data.fetchChecklistState(legacy.client, dogId, templateId);
    assert.equal(loaded.customItems[0].icon, null);
    await assert.rejects(data.fetchChecklistState(invalid.client, dogId, templateId), /database contract/);
  } finally { await legacy.client.auth.dispose(); await invalid.client.auth.dispose(); }
});

test('invalid server rows and pre-aborted sessions never enter checklist state', async () => {
  const { client } = localClient(() => json([progressRow(otherDogId)]));
  try {
    await assert.rejects(data.fetchChecklistState(client, dogId, templateId), /database contract/);
    const controller = new AbortController(); controller.abort();
    assert.deepEqual(await data.setChecklistItem(client, dogId, templateId, 'safe-space', true, controller.signal), { status: 'unknown' });
  } finally { await client.auth.dispose(); }
});

test('an in-flight session abort makes the mutation unknown without replaying it', async () => {
  let requestSignal;
  let abortObserved = false;
  const { client, requests } = localClient((request) => {
    if (request.method === 'POST') {
      requestSignal = request.signal;
      return new Promise((_resolve, reject) => requestSignal.addEventListener('abort', () => {
        abortObserved = true;
        reject(new DOMException('aborted', 'AbortError'));
      }, { once: true }));
    }
    return json([]);
  });
  try {
    const session = new AbortController();
    const pending = data.setChecklistItem(client, dogId, templateId, 'safe-space', true, session.signal);
    await new Promise((resolve) => setTimeout(resolve, 0));
    session.abort();
    assert.deepEqual(await pending, { status: 'unknown' });
    assert.ok(requestSignal instanceof AbortSignal);
    assert.equal(abortObserved, true);
    assert.equal(requests.filter((request) => request.method === 'POST').length, 1);
  } finally { await client.auth.dispose(); }
});

test('overview transfers only custom completion metadata and rejects a foreign dog row', async () => {
  const { client, requests } = localClient((request) => request.url.pathname.endsWith('dog_checklist_custom_items')
    ? json([{ dog_id: dogId, template_id: templateId, completed: true }])
    : request.url.pathname.endsWith('dog_checklist_preferences') ? json([]) : json([]));
  try {
    const overview = await data.fetchChecklistOverview(client, dogId);
    assert.deepEqual(overview.summary[templateId], { done: 1, total: 4 });
    const customQuery = requests.find((request) => request.url.pathname.endsWith('dog_checklist_custom_items'));
    assert.equal(customQuery.url.searchParams.get('select'), 'dog_id,template_id,completed');
    assert.equal(customQuery.url.searchParams.has('title'), false);
  } finally { await client.auth.dispose(); }
});

test('dog context preference updates only context after insert and reads the committed value', async () => {
  let stored = null;
  const { client, requests } = localClient((request) => {
    if (request.method === 'POST') { stored = request.body; return json([]); }
    if (request.method === 'PATCH') { stored = { ...stored, ...request.body }; return json([]); }
    return json(stored ? [stored] : []);
  });
  try {
    assert.deepEqual(await data.setChecklistPreference(client, dogId, 'first_days'), { status: 'saved', value: { dogId, context: 'first_days' } });
    assert.deepEqual(requests[1].body, { context: 'first_days' });
    assert.equal(requests[1].url.searchParams.get('dog_id'), `eq.${dogId}`);
  } finally { await client.auth.dispose(); }
});

test('published phase catalog follows the three RLS-scoped reads and preserves stable IDs and item keys', async () => {
  const fixture = publishedPhaseFixture();
  const { client, requests } = catalogClient(fixture);
  try {
    const catalog = await data.fetchPublishedChecklistCatalog(client);
    assert.deepEqual(requests.map((request) => request.url.pathname.split('/').at(-1)), [
      'checklist_templates', 'content_versions', 'content_version_checklist_items',
    ]);
    assert.deepEqual(catalog.templates.map((template) => template.id), phaseBundle.templates.map((template) => template.template_id));
    assert.deepEqual(catalog.templates.flatMap((template) => template.items.map((item) => [template.id, item.key])),
      phaseBundle.templates.flatMap((template) => template.items.map((item) => [template.template_id, item.key])));
    assert.deepEqual(catalog.versionIds, phaseBundle.templates.map((template) => template.version_id));
    assert.equal(catalog.templates[0].sources[0], phaseBundle.sources[0].url);
  } finally { await client.auth.dispose(); }
});

test('an empty published catalog is honest and a partial or malformed catalog never becomes a fallback', async () => {
  const empty = catalogClient({ roots: [], versions: [], items: [] });
  const partialRootFixture = publishedPhaseFixture();
  partialRootFixture.roots.pop();
  const partial = catalogClient(partialRootFixture);
  const malformedFixture = publishedPhaseFixture();
  malformedFixture.items[0] = { ...malformedFixture.items[0], item_key: 'unknown-key' };
  const malformed = catalogClient(malformedFixture);
  try {
    assert.deepEqual(await data.fetchPublishedChecklistCatalog(empty.client), { templates: [], versionIds: [] });
    assert.equal(empty.requests.length, 1);
    await assert.rejects(data.fetchPublishedChecklistCatalog(partial.client), /incomplete/);
    await assert.rejects(data.fetchPublishedChecklistCatalog(malformed.client), /stable template key/);
  } finally {
    await empty.client.auth.dispose(); await partial.client.auth.dispose(); await malformed.client.auth.dispose();
  }
});

test('published source links and phase metadata are validated before templates enter runtime state', async () => {
  const invalidSource = publishedPhaseFixture();
  invalidSource.versions[0] = { ...invalidSource.versions[0], sources: ['javascript:alert(1)'] };
  const unreviewedSource = publishedPhaseFixture();
  unreviewedSource.versions[0] = { ...unreviewedSource.versions[0], sources: ['https://example.com/unreviewed'] };
  const invalidAge = publishedPhaseFixture();
  invalidAge.versions[2] = { ...invalidAge.versions[2], min_age_weeks: 7 };
  const sourceClient = catalogClient(invalidSource);
  const unreviewedClient = catalogClient(unreviewedSource);
  const ageClient = catalogClient(invalidAge);
  try {
    await assert.rejects(data.fetchPublishedChecklistCatalog(sourceClient.client), /stable content contract/);
    await assert.rejects(data.fetchPublishedChecklistCatalog(unreviewedClient.client), /stable content contract/);
    await assert.rejects(data.fetchPublishedChecklistCatalog(ageClient.client), /stable content contract/);
  } finally { await sourceClient.client.auth.dispose(); await unreviewedClient.client.auth.dispose(); await ageClient.client.auth.dispose(); }
});

test('every reviewed source resolves to its metadata title and publisher; unknown URLs fail closed', () => {
  for (const source of phaseBundle.sources) {
    const metadata = getContentSourceMetadata(source.url);
    assert.ok(metadata, `${source.url} has display metadata`);
    assert.equal(metadata.title, source.title);
    assert.ok(metadata.publisher);
  }
  assert.equal(getContentSourceMetadata('https://example.com/unreviewed'), null);
});

test('public progress reads and writes use the published stable template and key set', async () => {
  const fixture = publishedPhaseFixture();
  let stored = null;
  const ownerRequests = [];
  const { client } = catalogClient(fixture, () => {}, (request) => {
    ownerRequests.push(request);
    const table = request.url.pathname.split('/').at(-1);
    if (table === 'dog_checklist_progress' && request.method === 'POST') { stored = request.body; return json([]); }
    if (table === 'dog_checklist_progress') return json(stored ? [stored] : []);
    if (table === 'dog_checklist_preferences') return json([]);
    return json([]);
  });
  try {
    const catalog = await data.fetchPublishedChecklistCatalog(client);
    const phase = catalog.templates[0];
    assert.deepEqual(await data.setChecklistItem(client, dogId, phase.id, 'safe-space', true, undefined, catalog.templates), {
      status: 'saved', value: { dogId, templateId: phase.id, itemKey: 'safe-space' },
    });
    const loaded = await data.fetchChecklistState(client, dogId, phase.id, undefined, catalog.templates);
    assert.deepEqual(loaded.progress, [{ dogId, templateId: phase.id, itemKey: 'safe-space' }]);
    assert.deepEqual(ownerRequests.filter((request) => request.url.pathname.endsWith('/dog_checklist_progress')).map((request) => request.method), ['POST', 'GET', 'GET']);
    assert.deepEqual(stored, { dog_id: dogId, template_id: phase.id, item_key: 'safe-space' });
  } finally { await client.auth.dispose(); }
});

test('published-version cache keys vary by catalog version and remain separate from review, session and dog scopes', () => {
  const base = data.checklistReadCacheScope('session-a', dogId, false);
  const first = data.checklistCatalogReadCacheScope(base, ['version-b', 'version-a']);
  const sameSet = data.checklistCatalogReadCacheScope(base, ['version-a', 'version-b']);
  const next = data.checklistCatalogReadCacheScope(base, ['version-a', 'version-c']);
  assert.equal(first, sameSet);
  assert.notEqual(first, next);
  assert.notEqual(first, data.checklistReadCacheScope('session-a', dogId, true));
  assert.notEqual(first, data.checklistCatalogReadCacheScope(data.checklistReadCacheScope('session-b', dogId, false), ['version-a', 'version-b']));
  assert.notEqual(first, data.checklistCatalogReadCacheScope(data.checklistReadCacheScope('session-a', otherDogId, false), ['version-a', 'version-b']));
});
