import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { createClient } from '@supabase/supabase-js';
const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
const data = await import('../src/features/knowledge/checklist-data.ts');
hook.deregister();
const dogId = '11111111-1111-4111-8111-111111111111';
const otherDogId = '99999999-9999-4999-8999-999999999999';
const templateId = 'review-v1:before-homecoming';
const customId = '33333333-3333-4333-8333-333333333333';
const baseUrl = 'https://local-checklists.supabase.invalid';

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
const customRow = (values = {}) => ({ id: customId, dog_id: dogId, template_id: templateId, title: 'Extra vila', completed: false, ...values });

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

test('lost custom insert response keeps UUID and exact readback can confirm it', async () => {
  let stored = null;
  const { client, requests } = localClient((request) => {
    if (request.method === 'POST') { stored = request.body; throw new TypeError('simulated lost response'); }
    assert.equal(request.url.pathname, '/rest/v1/dog_checklist_custom_items');
    assert.equal(request.url.searchParams.get('id'), `eq.${customId}`);
    return json(stored ? [stored] : []);
  });
  try {
    const result = await data.addChecklistCustomItem(client, dogId, templateId, customId, '  Extra vila  ');
    assert.deepEqual(result, { status: 'saved', value: { id: customId, dogId, templateId, title: 'Extra vila', completed: false } });
    assert.equal(requests[0].body.id, customId);
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
    assert.deepEqual(await data.deleteChecklistCustomItem(client, { id: customId, dogId, templateId, title: 'Extra vila', completed: false }), { status: 'saved', value: null });
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
    const result = await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: 'Extra vila', completed: false }, { title: 'Nytt namn', completed: true });
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
    const result = await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: previous.title, completed: previous.completed }, { title: 'Nytt namn', completed: true });
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
    const result = await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: 'Extra vila', completed: false }, { title: 'Nytt namn', completed: true });
    assert.deepEqual(result, { status: 'unknown' });
    assert.deepEqual(requests.map((request) => request.method), ['PATCH', 'GET']);
  } finally { await client.auth.dispose(); }
});

test('rejected custom edit whose target disappeared is a conflict', async () => {
  const { client, requests } = localClient((request) => request.method === 'PATCH'
    ? json({ message: 'write target disappeared' }, 400)
    : json([]));
  try {
    const result = await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: 'Extra vila', completed: false }, { title: 'Nytt namn', completed: true });
    assert.deepEqual(result, { status: 'conflict' });
    assert.deepEqual(requests.map((request) => request.method), ['PATCH', 'GET']);
  } finally { await client.auth.dispose(); }
});

test('rejected custom edit with exact postimage is confirmed saved', async () => {
  const { client, requests } = localClient((request) => request.method === 'PATCH'
    ? json({ message: 'write response failed' }, 400)
    : json([customRow({ title: 'Nytt namn', completed: true })]));
  try {
    const result = await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: 'Extra vila', completed: false }, { title: 'Nytt namn', completed: true });
    assert.deepEqual(result, { status: 'saved', value: { id: customId, dogId, templateId, title: 'Nytt namn', completed: true } });
    assert.deepEqual(requests.map((request) => request.method), ['PATCH', 'GET']);
  } finally { await client.auth.dispose(); }
});

test('rejected custom edit with a divergent readback is a conflict', async () => {
  const { client, requests } = localClient((request) => request.method === 'PATCH'
    ? json({ message: 'write response failed' }, 400)
    : json([customRow({ title: 'Ändrad på annan enhet', completed: false })]));
  try {
    const result = await data.updateChecklistCustomItem(client, { id: customId, dogId, templateId, title: 'Extra vila', completed: false }, { title: 'Nytt namn', completed: true });
    assert.deepEqual(result, { status: 'conflict' });
    assert.deepEqual(requests.map((request) => request.method), ['PATCH', 'GET']);
  } finally { await client.auth.dispose(); }
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
