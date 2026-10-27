import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { createClient } from '@supabase/supabase-js';

const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { dogEventCursor, fetchDogEvents } = await import('../src/data/workspace-data.ts');
hooks.deregister();
const dogId = '11111111-1111-4111-8111-111111111111';
const event = (number, occurredAt, dog = dogId) => ({
  id: `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`, dog_id: dog, event_type: 'walk',
  occurred_at: occurredAt, occurred_on: null, weight_kg: null, duration_minutes: null, description: null, accident_kinds: null,
});
function fakeServer(initialRows, afterFirst) {
  let rows = [...initialRows], calls = 0;
  const urls = [];
  const client = createClient('https://local-test.supabase.invalid', 'synthetic-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input) => {
      const url = new URL(typeof input === 'string' ? input : input.url); urls.push(url); calls++;
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(url.searchParams.has('offset'), false);
      const expression = url.searchParams.get('or');
      let time = null, id = null;
      if (expression) {
        const match = /^\(occurred_at\.lt\."([^"]+)",and\(occurred_at\.eq\."([^"]+)",id\.lt\.([^)]+)\)\)$/.exec(expression);
        assert.ok(match); assert.equal(match[1], match[2]); [, time, , id] = match;
      }
      const page = rows.filter((row) => row.dog_id === dogId && (!time || row.occurred_at < time || row.occurred_at === time && row.id < id))
        .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.id.localeCompare(a.id))
        .slice(0, Number(url.searchParams.get('limit')));
      if (calls === 1 && afterFirst) rows = afterFirst(rows);
      return new Response(JSON.stringify(page), { status: 200, headers: { 'content-type': 'application/json' } });
    } },
  });
  return { client, urls };
}

test('new and deleted rows before a cursor do not skip older entries', async () => {
  const original = [event(4, '2026-10-26T11:00:00.000000Z'), event(3, '2026-10-26T10:00:00.000000Z'),
    event(2, '2026-10-26T09:00:00.000000Z'), event(1, '2026-10-26T08:00:00.000000Z')];
  const { client } = fakeServer(original, (rows) => [event(5, '2026-10-26T12:00:00.000000Z'), ...rows.filter((row) => row.id !== original[0].id)]);
  try {
    const first = await fetchDogEvents(client, dogId, null, 2);
    const second = await fetchDogEvents(client, dogId, dogEventCursor(first.at(-1)), 2);
    assert.deepEqual(second.map((item) => item.id), original.slice(2).map((item) => item.id));
    assert.deepEqual(await fetchDogEvents(client, dogId, dogEventCursor(second.at(-1)), 2), []);
  } finally { await client.auth.dispose(); }
});

test('equal timestamps use UUID tie-breaker and preserve microseconds', async () => {
  const stamp = '2026-10-26T10:00:00.123456Z';
  const original = [event(3, stamp), event(2, stamp), event(1, stamp), event(4, '2026-10-26T10:00:00.123455Z')];
  const { client, urls } = fakeServer(original);
  try {
    const first = await fetchDogEvents(client, dogId, null, 2);
    const second = await fetchDogEvents(client, dogId, dogEventCursor(first.at(-1)), 2);
    assert.deepEqual([...first, ...second].map((item) => item.id), original.map((item) => item.id));
    assert.match(urls[1].searchParams.get('or'), /10:00:00\.123456Z/);
  } finally { await client.auth.dispose(); }
});

test('cursor injection and malformed responses fail before a result can be used', async () => {
  const { client, urls } = fakeServer([]);
  try {
    await assert.rejects(fetchDogEvents(client, dogId, { occurredAt: '2026-10-26T10:00:00Z),id.eq.foo', id: event(1, '2026-10-26T10:00:00Z').id }, 2));
    await assert.rejects(fetchDogEvents(client, dogId, { occurredAt: '2026-10-26T10:00:00Z', id: 'x),id.eq.foo' }, 2));
    assert.equal(urls.length, 0);
  } finally { await client.auth.dispose(); }
});

test('a mismatched dog row is rejected and abort reaches the active request', async () => {
  const foreign = event(1, '2026-10-26T10:00:00Z', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  const client = createClient('https://local-test.supabase.invalid', 'synthetic-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async () => new Response(JSON.stringify([foreign]), { status: 200, headers: { 'content-type': 'application/json' } }) },
  });
  try { await assert.rejects(fetchDogEvents(client, dogId, null, 1)); }
  finally { await client.auth.dispose(); }

  let started;
  const waiting = new Promise((resolve) => { started = resolve; });
  let requestSignal;
  const slow = createClient('https://local-test.supabase.invalid', 'synthetic-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (_input, init) => new Promise((_resolve, reject) => {
      requestSignal = init.signal;
      started();
      requestSignal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }) },
  });
  const controller = new AbortController();
  try {
    const pending = fetchDogEvents(slow, dogId, null, 1, undefined, controller.signal);
    await waiting;
    controller.abort();
    await assert.rejects(pending);
    assert.equal(requestSignal.aborted, true);
  } finally { await slow.auth.dispose(); }
});

test('production page merge preserves local edits and deletes and fences stale flights', async () => {
  const { readFile } = await import('node:fs/promises');
  const ts = await import('typescript');
  const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
  const loader = workspace.match(/async function loadMoreEvents\(\) \{[\s\S]*?(?=\n  async function runLogMutation)/)?.[0];
  const merge = workspace.match(/function mergeConfirmedLogRows[\s\S]*?(?=\n\s*function shouldClearDailyMutationFeedback)/)?.[0];
  assert.ok(loader && merge);
  const code = ts.default.transpileModule(`${merge}\n${loader}`, { compilerOptions: { target: ts.default.ScriptTarget.ES2022, module: ts.default.ModuleKind.None } }).outputText;
  const first = event(5, '2026-10-26T12:00:00.000000Z');
  const boundary = event(4, '2026-10-26T11:00:00.123456Z');
  const older = event(3, '2026-10-26T10:00:00.000000Z');
  const rows = { current: [first, boundary] };
  const cursor = { current: dogEventCursor(boundary) };
  const flight = { current: null }, generation = { current: 0 }, lifetime = { current: 'owner:dog' }, hasMore = { current: true };
  const output = { events: null, cursor: null, error: false, more: true, loading: false };
  let resolveFetch, calledCursor;
  const fetcher = async (_client, _dog, value) => { calledCursor = value; return await new Promise((resolve) => { resolveFetch = resolve; }); };
  const names = ['logLifetime', 'logPaginationFlight', 'loadingMore', 'logHasMore', 'logPaginationGeneration', 'mounted', 'setLoadingMore', 'setLoadMoreError', 'serializeEventRead', 'logPageCursor', 'eventRows', 'fetchDogEvents', 'client', 'dog', 'PAGE_SIZE', 'dogEventCursor', 'setLogLoadedThrough', 'setEvents', 'setHasMore'];
  const values = [lifetime, flight, false, hasMore, generation, { current: true }, (value) => { output.loading = value; }, (value) => { output.error = value; }, async (read) => read(), cursor, rows, fetcher, {}, { id: dogId }, 2, dogEventCursor, (value) => { output.cursor = value; }, (value) => { output.events = value; }, (value) => { output.more = value; }];
  const load = new Function(...names, `${code}\nreturn loadMoreEvents;`)(...values);
  const pending = load();
  while (!resolveFetch) await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calledCursor, dogEventCursor(boundary));
  const changed = { ...first, description: 'confirmed change' };
  const added = event(6, '2026-10-26T13:00:00.000000Z');
  rows.current = [added, changed]; // Boundary was deleted while the page was in flight.
  resolveFetch([older]);
  await pending;
  assert.deepEqual(output.events.map((row) => row.id), [added.id, changed.id, older.id]);
  assert.equal(output.events[1], changed);
  assert.deepEqual(output.cursor, dogEventCursor(older));
  assert.equal(output.more, false);
  assert.equal(output.error, false);

  hasMore.current = true; cursor.current = dogEventCursor(boundary); rows.current = [first, boundary];
  output.events = null; output.cursor = null; resolveFetch = null;
  const stale = load();
  while (!resolveFetch) await new Promise((resolve) => setImmediate(resolve));
  generation.current += 1; flight.current.controller.abort(); flight.current = null;
  resolveFetch([older]);
  await stale;
  assert.equal(output.events, null);
  assert.equal(output.cursor, null);

  hasMore.current = true; cursor.current = dogEventCursor(boundary); rows.current = [first, boundary];
  output.events = null; output.cursor = null; output.error = false; resolveFetch = null;
  const repeated = load();
  while (!resolveFetch) await new Promise((resolve) => setImmediate(resolve));
  resolveFetch([boundary]);
  await repeated;
  assert.equal(output.events, null);
  assert.equal(output.cursor, null);
  assert.equal(output.error, true);
  assert.deepEqual(cursor.current, dogEventCursor(boundary));
});

test('a delayed first-page reload keeps an opened or confirmed older event without reviving a deletion', async () => {
  const { readFile } = await import('node:fs/promises');
  const ts = await import('typescript');
  const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
  const loader = workspace.match(/const reloadEvents = useCallback\([\s\S]*?\n  \}, \[client, currentLogLifetime, dog\.id, serializeEventRead\]\);/)?.[0];
  const merge = workspace.match(/function mergeConfirmedLogRows[\s\S]*?(?=\n\s*function shouldClearDailyMutationFeedback)/)?.[0];
  assert.ok(loader && merge);
  const code = ts.default.transpileModule(`${merge}\n${loader}`, { compilerOptions: { target: ts.default.ScriptTarget.ES2022, module: ts.default.ModuleKind.None } }).outputText;
  const all = Array.from({ length: 50 }, (_, index) => event(100 - index, `2026-10-26T10:${String(59 - index).padStart(2, '0')}:00.123456Z`));
  const firstPage = all.slice(0, 40), older = all[45];
  const rows = { current: [...all] }, pins = { current: new Set() }, cursor = { current: null };
  const output = { events: null, through: null, state: null, error: false };
  const flight = { current: null }, logGeneration = { current: 0 }, paginationFlight = { current: null }, paginationGeneration = { current: 0 };
  let resolveFetch, rejectFetch;
  const fetcher = async () => await new Promise((resolve, reject) => { resolveFetch = resolve; rejectFetch = reject; });
  const activeEditor = { current: null };
  const names = ['useCallback', 'currentLogLifetime', 'logReadFlight', 'logReadGeneration', 'logPaginationFlight', 'logPaginationGeneration', 'setLoadingMore', 'setLoadMoreError', 'eventRows', 'logDataLifetimeRef', 'setLogRefreshing', 'setLogRefreshError', 'setLogStateLifetime', 'setLogState', 'mounted', 'logLifetime', 'serializeEventRead', 'fetchDogEvents', 'client', 'dog', 'PAGE_SIZE', 'dogEventCursor', 'logPinnedEventIds', 'logActiveEditorId', 'logPageCursor', 'setLogLoadedThrough', 'setEvents', 'setLogDataLifetime', 'logHasMore', 'setHasMore'];
  const values = [(fn) => fn, 'owner:dog', flight, logGeneration, paginationFlight, paginationGeneration, () => {}, () => {}, rows, { current: 'owner:dog' }, () => {}, (value) => { output.error = value; }, () => {}, (value) => { output.state = value; }, { current: true }, { current: 'owner:dog' }, async (read) => read(), fetcher, {}, { id: dogId }, 40, dogEventCursor, pins, activeEditor, cursor, (value) => { output.through = value; }, (value) => { output.events = value; }, () => {}, { current: false }, () => {}];
  const reload = new Function(...names, `${code}\nreturn reloadEvents;`)(...values);
  const pending = reload('refresh');
  while (!resolveFetch) await new Promise((resolve) => setImmediate(resolve));
  pins.current.add(older.id); // The user opens a later-page event while the first-page read is pending.
  resolveFetch(firstPage);
  assert.equal(await pending, true);
  assert.equal(output.events.length, 41);
  assert.ok(output.events.some((row) => row.id === older.id));
  assert.deepEqual(output.through, dogEventCursor(firstPage.at(-1)));
  assert.equal(pins.current.size, 0);

  activeEditor.current = older.id; resolveFetch = null;
  const secondRefresh = reload('refresh');
  while (!resolveFetch) await new Promise((resolve) => setImmediate(resolve));
  resolveFetch(firstPage);
  assert.equal(await secondRefresh, true);
  assert.ok(output.events.some((row) => row.id === older.id), 'active editor survives a second refresh');

  rows.current = [...all]; pins.current.add(older.id); resolveFetch = null;
  const deletion = reload('refresh');
  while (!resolveFetch) await new Promise((resolve) => setImmediate(resolve));
  rows.current = rows.current.filter((row) => row.id !== older.id);
  resolveFetch(firstPage);
  assert.equal(await deletion, true);
  assert.equal(output.events.some((row) => row.id === older.id), false);

  rows.current = [...all]; pins.current.add(older.id); resolveFetch = null; output.error = false;
  const previousCursor = cursor.current;
  const failed = reload('refresh');
  while (!resolveFetch) await new Promise((resolve) => setImmediate(resolve));
  rejectFetch(new Error('offline'));
  assert.equal(await failed, false);
  assert.equal(output.error, true);
  assert.equal(pins.current.has(older.id), true);
  assert.equal(cursor.current, previousCursor);
  assert.equal(rows.current.length, 50);
});
