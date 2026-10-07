import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import Module, { registerHooks } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';

const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const { createDeleteAccountHandler } = await import('../supabase/functions/delete-account/handler.ts');
hook.deregister();
const authProviderSource = normalizeNewlines(await readFile(new URL('../src/features/account/AuthProvider.tsx', import.meta.url), 'utf8'));

function normalizeNewlines(value) {
  return value.replaceAll('\r\n', '\n');
}

const verifiedId = '11111111-1111-4111-8111-111111111111';
const suppliedOtherId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const bearer = 'synthetic-access-token';

function request(options = {}) {
  const method = options.method ?? 'POST';
  const authorization = Object.hasOwn(options, 'authorization') ? options.authorization : `Bearer ${bearer}`;
  const body = options.body;
  const url = options.url ?? 'https://local.invalid/functions/v1/delete-account';
  return new Request(url, { method, headers: authorization ? { authorization } : {}, ...(body === undefined ? {} : { body }) });
}

test('server handler rejects method, query, body and malformed bearer before any auth or admin call', async () => {
  let authCalls = 0;
  let deleteCalls = 0;
  const handler = createDeleteAccountHandler({
    async getUser() { authCalls++; return { kind: 'verified', userId: verifiedId }; },
    async deleteUser() { deleteCalls++; return 'confirmed'; },
  });
  const cases = [
    [request({ method: 'GET' }), 405],
    [request({ url: 'https://local.invalid/functions/v1/delete-account?user_id=' + suppliedOtherId }), 400],
    [request({ body: JSON.stringify({ userId: suppliedOtherId }) }), 400],
    [request({ authorization: null }), 401],
    [request({ authorization: 'Bearer' }), 401],
    [request({ authorization: `Bearer ${bearer} extra` }), 401],
    [request({ authorization: `Bearer ${'x'.repeat(8193)}` }), 401],
  ];
  for (const [req, status] of cases) assert.equal((await handler(req)).status, status);
  assert.equal(authCalls, 0);
  assert.equal(deleteCalls, 0);
});

test('only the ID returned by online bearer verification reaches one hard admin deletion', async () => {
  const seenTokens = [];
  const deletedIds = [];
  const handler = createDeleteAccountHandler({
    async getUser(token) { seenTokens.push(token); return { kind: 'verified', userId: verifiedId }; },
    async deleteUser(id) { deletedIds.push(id); return 'confirmed'; },
  });
  const response = await handler(request({ body: undefined }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'deleted' });
  assert.deepEqual(seenTokens, [bearer]);
  assert.deepEqual(deletedIds, [verifiedId]);
  assert.equal(deletedIds.includes(suppliedOtherId), false);
});

test('invalid or ambiguous verification prevents deletion; thrown verification is unknown', async (t) => {
  for (const result of [
    { kind: 'unauthorized' },
    { kind: 'unknown' },
    { kind: 'verified', userId: suppliedOtherId + 'not-a-uuid' },
  ]) {
    await t.test(JSON.stringify(result), async () => {
      let deleted = 0;
      const handler = createDeleteAccountHandler({ async getUser() { return result; }, async deleteUser() { deleted++; return 'confirmed'; } });
      const response = await handler(request());
      assert.equal(response.status, result.kind === 'unauthorized' ? 401 : 503);
      assert.equal(deleted, 0);
    });
  }
  const thrown = createDeleteAccountHandler({ async getUser() { throw new Error('synthetic'); }, async deleteUser() { assert.fail('must not delete'); } });
  assert.equal((await thrown(request())).status, 503);
});

test('admin confirmed, definite failed and ambiguous outcomes remain distinct and are never retried', async (t) => {
  for (const [outcome, status, body] of [
    ['confirmed', 200, { status: 'deleted' }],
    ['failed', 409, { status: 'failed' }],
    ['unknown', 503, { status: 'unknown' }],
  ]) {
    await t.test(outcome, async () => {
      let attempts = 0;
      const handler = createDeleteAccountHandler({
        async getUser() { return { kind: 'verified', userId: verifiedId }; },
        async deleteUser(id) { attempts++; assert.equal(id, verifiedId); return outcome; },
      });
      const response = await handler(request());
      assert.equal(response.status, status);
      assert.deepEqual(await response.json(), body);
      assert.equal(attempts, 1);
    });
  }
  const thrown = createDeleteAccountHandler({ async getUser() { return { kind: 'verified', userId: verifiedId }; }, async deleteUser() { throw new Error('synthetic'); } });
  assert.equal((await thrown(request())).status, 503);
});

test('installed Supabase 2.117.2 admin client accepts actual empty-user delete success without ID echo', async () => {
  const requests = [];
  const client = createClient('https://local.invalid', 'synthetic-service-role', {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { fetch: async (input, init = {}) => {
      requests.push({ url: String(input), method: init.method, body: init.body });
      return new Response(JSON.stringify({ user: {} }), { status: 200, headers: { 'content-type': 'application/json' } });
    } },
  });
  try {
    const result = await client.auth.admin.deleteUser(verifiedId, false);
    assert.equal(result.error, null);
    assert.deepEqual(result.data, { user: {} });
    assert.equal(requests.length, 1);
    assert.match(requests[0].url, new RegExp(`/auth/v1/admin/users/${verifiedId}$`));
    assert.equal(requests[0].method, 'DELETE');
    assert.deepEqual(JSON.parse(requests[0].body), { should_soft_delete: false });
  } finally { await client.auth.dispose(); }
});

async function invokeActualEdgeEntry(fetchImpl, incoming = request()) {
  const entryPath = fileURLToPath(new URL('../supabase/functions/delete-account/index.ts', import.meta.url));
  const source = (await readFile(entryPath, 'utf8')).replace('npm:@supabase/supabase-js@2.117.2', '@supabase/supabase-js');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const previousFetch = globalThis.fetch;
  const previousDeno = globalThis.Deno;
  const requests = [];
  let installedHandler;
  globalThis.Deno = {
    env: { get(name) { return name === 'SUPABASE_URL' ? 'https://local.invalid' : name === 'SUPABASE_SERVICE_ROLE_KEY' ? 'synthetic-service-role' : undefined; } },
    serve(handler) { installedHandler = handler; },
  };
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    const headers = new Headers(init.headers);
    requests.push({ url, method: init.method, authorization: headers.get('authorization'), apikey: headers.get('apikey'), body: init.body });
    return fetchImpl(url, init);
  };
  try {
    const virtualModule = new Module(entryPath + '.qa.cjs');
    virtualModule.filename = entryPath + '.qa.cjs';
    virtualModule.paths = Module._nodeModulePaths(dirname(entryPath));
    virtualModule._compile(compiled, virtualModule.filename);
    assert.equal(typeof installedHandler, 'function');
    const response = await installedHandler(incoming);
    return { response, requests };
  } finally {
    globalThis.fetch = previousFetch;
    if (previousDeno === undefined) delete globalThis.Deno; else globalThis.Deno = previousDeno;
  }
}

test('actual edge entry verifies the captured bearer and uses installed SDK hard-delete response shape', async () => {
  const { response, requests } = await invokeActualEdgeEntry(async (url) => {
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: verifiedId, aud: 'authenticated' }), { status: 200, headers: { 'content-type': 'application/json' } });
    if (url.endsWith(`/auth/v1/admin/users/${verifiedId}`)) return new Response(JSON.stringify({ user: {} }), { status: 200, headers: { 'content-type': 'application/json' } });
    return new Response('unexpected route', { status: 500 });
  });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'deleted' });
    assert.equal(requests.length, 2);
    assert.equal(requests[0].method, 'GET');
    assert.equal(requests[0].authorization, `Bearer ${bearer}`);
    assert.equal(requests[1].method, 'DELETE');
    assert.equal(requests[1].url, `https://local.invalid/auth/v1/admin/users/${verifiedId}`);
    assert.equal(requests[1].authorization, 'Bearer synthetic-service-role');
    assert.deepEqual(JSON.parse(requests[1].body), { should_soft_delete: false });
});

test('actual edge entry turns auth rejection and malformed/ambiguous admin replies into safe non-success results', async (t) => {
  await t.test('invalid bearer is rejected before the admin endpoint', async () => {
    const { response, requests } = await invokeActualEdgeEntry(async (url) => new Response(JSON.stringify({ msg: 'invalid token' }), {
      status: url.endsWith('/auth/v1/user') ? 401 : 500, headers: { 'content-type': 'application/json' },
    }));
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { status: 'unauthorized' });
    assert.equal(requests.length, 1);
  });
  await t.test('ambiguous admin server error stays unknown', async () => {
    const { response } = await invokeActualEdgeEntry(async (url) => url.endsWith('/auth/v1/user')
      ? new Response(JSON.stringify({ id: verifiedId, aud: 'authenticated' }), { status: 200, headers: { 'content-type': 'application/json' } })
      : new Response(JSON.stringify({ msg: 'temporary failure' }), { status: 500, headers: { 'content-type': 'application/json' } }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: 'unknown' });
  });
  await t.test('non-empty admin user object is not accepted as deletion proof', async () => {
    const { response } = await invokeActualEdgeEntry(async (url) => url.endsWith('/auth/v1/user')
      ? new Response(JSON.stringify({ id: verifiedId, aud: 'authenticated' }), { status: 200, headers: { 'content-type': 'application/json' } })
      : new Response(JSON.stringify({ user: { id: verifiedId } }), { status: 200, headers: { 'content-type': 'application/json' } }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: 'unknown' });
  });
});

test('edge entry pins server SDK, uses server environment only, and returns no account identifiers', async () => {
  const [entry, config] = await Promise.all([
    readFile(new URL('../supabase/functions/delete-account/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../supabase/config.toml', import.meta.url), 'utf8'),
  ]);
  assert.match(entry, /npm:@supabase\/supabase-js@2\.117\.2/);
  assert.match(entry, /SUPABASE_URL/);
  assert.match(entry, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(entry, /EXPO_PUBLIC|VITE_/);
  assert.match(entry, /admin\.deleteUser\(verifiedUserId, false\)/);
  assert.match(config, /\[functions\.delete-account\][\s\S]*?verify_jwt\s*=\s*true/);
  assert.doesNotMatch(entry, /console\.(log|error|warn)/);
});

async function loadClientDeletionModule(secureStore) {
  const filePath = fileURLToPath(new URL('../src/features/account/account-delete.ts', import.meta.url));
  const source = await readFile(filePath, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const virtualModule = new Module(filePath + '.qa.cjs');
  virtualModule.filename = filePath + '.qa.cjs';
  virtualModule.paths = Module._nodeModulePaths(dirname(filePath));
  const originalLoad = Module._load;
  Module._load = function (specifier, parent, isMain) {
    if (specifier === 'expo-secure-store') return secureStore;
    return originalLoad.call(this, specifier, parent, isMain);
  };
  try { virtualModule._compile(compiled, virtualModule.filename); }
  finally { Module._load = originalLoad; }
  return virtualModule.exports;
}

function memorySecureStore() {
  const values = new Map();
  return {
    values,
    async getItemAsync(key) { return values.get(key) ?? null; },
    async setItemAsync(key, value) { values.set(key, value); },
    async deleteItemAsync(key) { values.delete(key); },
  };
}

function clientWithFetch(fetchImpl) {
  return createClient('https://local.invalid', 'synthetic-anon-key', {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { fetch: fetchImpl },
  });
}

test('client invokes real Supabase Functions API bodyless with captured bearer and clears only captured owner marker after valid receipt', async () => {
  const store = memorySecureStore();
  const accountDelete = await loadClientDeletionModule(store);
  const seen = [];
  const client = clientWithFetch(async (input, init = {}) => {
    seen.push({ url: String(input), method: init.method, authorization: new Headers(init.headers).get('authorization'), body: init.body });
    return new Response(JSON.stringify({ status: 'deleted' }), { status: 200, headers: { 'content-type': 'application/json' } });
  });
  try {
    const result = await accountDelete.requestAccountDeletion(client, { ownerId: verifiedId, accessToken: bearer }, () => true);
    assert.deepEqual(result, { status: 'confirmed' });
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, 'https://local.invalid/functions/v1/delete-account');
    assert.equal(seen[0].method, 'POST');
    assert.equal(seen[0].authorization, `Bearer ${bearer}`);
    assert.equal(seen[0].body, undefined);
    assert.equal(store.values.size, 0);
  } finally { await client.auth.dispose(); }
});

test('unresolved or ambiguous deletion remains blocked from automatic repeat', async (t) => {
  const store = memorySecureStore();
  const accountDelete = await loadClientDeletionModule(store);
  const client = clientWithFetch(async () => new Response(JSON.stringify({ status: 'deleted' }), { status: 200 }));
  const marker = `tassla.account-deletion.v1.${verifiedId}`;
  try {
    store.values.set(marker, 'pending');
    let calls = 0;
    const noRetryClient = clientWithFetch(async () => { calls++; return new Response('{}', { status: 200 }); });
    assert.deepEqual(await accountDelete.requestAccountDeletion(noRetryClient, { ownerId: verifiedId, accessToken: bearer }, () => true), { status: 'unknown' });
    assert.equal(calls, 0);
    assert.equal(await accountDelete.hasUnresolvedAccountDeletion(verifiedId), true);
    await noRetryClient.auth.dispose();
  } finally { await client.auth.dispose(); }

  for (const response of [
    new Response(JSON.stringify({ status: 'deleted', userId: verifiedId }), { status: 200 }),
    new Response('{bad json', { status: 200 }),
  ]) {
    const isolatedStore = memorySecureStore();
    const api = await loadClientDeletionModule(isolatedStore);
    const local = clientWithFetch(async () => response.clone());
    try {
      assert.deepEqual(await api.requestAccountDeletion(local, { ownerId: verifiedId, accessToken: bearer }, () => true), { status: 'unknown' });
      assert.equal(await api.hasUnresolvedAccountDeletion(verifiedId), true);
    } finally { await local.auth.dispose(); }
  }
});

test('pending-marker read/write failures stay unavailable; confirmed server result survives local marker cleanup failure', async (t) => {
  await t.test('SecureStore read failure prevents any server request', async () => {
    const store = { async getItemAsync() { throw new Error('synthetic storage failure'); }, async setItemAsync() { assert.fail(); }, async deleteItemAsync() { assert.fail(); } };
    const api = await loadClientDeletionModule(store);
    let requests = 0;
    const client = clientWithFetch(async () => { requests++; return new Response('{}', { status: 200 }); });
    try {
      assert.deepEqual(await api.requestAccountDeletion(client, { ownerId: verifiedId, accessToken: bearer }, () => true), { status: 'unavailable' });
      assert.equal(await api.readAccountDeletionMarker(verifiedId), 'unavailable');
      assert.equal(requests, 0);
    } finally { await client.auth.dispose(); }
  });
  await t.test('marker write failure prevents any server request', async () => {
    const store = { async getItemAsync() { return null; }, async setItemAsync() { throw new Error('synthetic storage failure'); }, async deleteItemAsync() { assert.fail(); } };
    const api = await loadClientDeletionModule(store);
    let requests = 0;
    const client = clientWithFetch(async () => { requests++; return new Response('{}', { status: 200 }); });
    try {
      assert.deepEqual(await api.requestAccountDeletion(client, { ownerId: verifiedId, accessToken: bearer }, () => true), { status: 'unavailable' });
      assert.equal(requests, 0);
    } finally { await client.auth.dispose(); }
  });
  await t.test('server confirmation remains confirmed even if local marker deletion fails', async () => {
    const stored = new Set();
    const store = { async getItemAsync(key) { return stored.has(key) ? 'pending' : null; }, async setItemAsync(key) { stored.add(key); }, async deleteItemAsync() { throw new Error('synthetic storage failure'); } };
    const api = await loadClientDeletionModule(store);
    const client = clientWithFetch(async () => new Response(JSON.stringify({ status: 'deleted' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    try {
      assert.deepEqual(await api.requestAccountDeletion(client, { ownerId: verifiedId, accessToken: bearer }, () => true), { status: 'confirmed' });
      assert.equal(await api.readAccountDeletionMarker(verifiedId), 'pending');
    } finally { await client.auth.dispose(); }
  });
});

test('definite HTTP rejection clears only captured pending marker; transport and server ambiguity retain it', async (t) => {
  for (const [status, expected] of [[409, 'failed'], [503, 'unknown']]) {
    await t.test(String(status), async () => {
      const store = memorySecureStore();
      const api = await loadClientDeletionModule(store);
      const client = clientWithFetch(async () => new Response(JSON.stringify({ status: status === 409 ? 'failed' : 'unknown' }), { status }));
      try {
        assert.deepEqual(await api.requestAccountDeletion(client, { ownerId: verifiedId, accessToken: bearer }, () => true), { status: expected });
        assert.equal(await api.hasUnresolvedAccountDeletion(verifiedId), status !== 409);
      } finally { await client.auth.dispose(); }
    });
  }
});

test('same-owner token refresh keeps the captured request token, while owner-generation change after await preserves marker', async (t) => {
  await t.test('same owner refresh', async () => {
    const store = memorySecureStore();
    const api = await loadClientDeletionModule(store);
    let session = { ownerId: verifiedId, generation: 4, token: bearer };
    let requestToken;
    const client = clientWithFetch(async (_input, init = {}) => {
      requestToken = new Headers(init.headers).get('authorization');
      session = { ...session, token: 'refreshed-token' };
      return new Response(JSON.stringify({ status: 'deleted' }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    try {
      const result = await api.requestAccountDeletion(client, { ownerId: verifiedId, accessToken: session.token }, () => session.ownerId === verifiedId && session.generation === 4);
      assert.deepEqual(result, { status: 'confirmed' });
      assert.equal(requestToken, `Bearer ${bearer}`);
    } finally { await client.auth.dispose(); }
  });

  await t.test('account changes while request is pending', async () => {
    const store = memorySecureStore();
    const api = await loadClientDeletionModule(store);
    let current = true;
    let resolveResponse;
    const pendingResponse = new Promise((resolve) => { resolveResponse = resolve; });
    const client = clientWithFetch(async () => pendingResponse);
    try {
      const operation = api.requestAccountDeletion(client, { ownerId: verifiedId, accessToken: bearer }, () => current);
      while (store.values.size === 0) await new Promise((resolve) => setImmediate(resolve));
      current = false;
      resolveResponse(new Response(JSON.stringify({ status: 'deleted' }), { status: 200 }));
      assert.deepEqual(await operation, { status: 'unknown' });
      assert.equal(await api.hasUnresolvedAccountDeletion(verifiedId), true);
      assert.equal(store.values.size, 1);
    } finally { await client.auth.dispose(); }
  });
});

test('owner change during the pending-marker write stops before invoking the destructive endpoint', async () => {
  const values = new Map();
  let finishWrite;
  let writeStarted = false;
  const store = {
    async getItemAsync(key) { return values.get(key) ?? null; },
    async setItemAsync(key, value) { writeStarted = true; await new Promise((resolve) => { finishWrite = resolve; }); values.set(key, value); },
    async deleteItemAsync(key) { values.delete(key); },
  };
  const api = await loadClientDeletionModule(store);
  let current = true;
  let requests = 0;
  const client = clientWithFetch(async () => { requests++; return new Response(JSON.stringify({ status: 'deleted' }), { status: 200 }); });
  try {
    const operation = api.requestAccountDeletion(client, { ownerId: verifiedId, accessToken: bearer }, () => current);
    for (let attempt = 0; !writeStarted && attempt < 100; attempt++) await new Promise((resolve) => setImmediate(resolve));
    assert.equal(writeStarted, true);
    current = false;
    finishWrite();
    assert.deepEqual(await operation, { status: 'unavailable' });
    assert.equal(requests, 0);
    assert.equal(values.size, 0, 'cleanup applies only to the captured owner marker');
  } finally { await client.auth.dispose(); }
});

function buildAuthProviderHarness(client) {
  const queueMatch = authProviderSource.match(/const runAuthMutation = useCallback\(<T,>\(operation: \(\) => Promise<T>\): Promise<T> => \{([\s\S]*?)\n  \}, \[\]\);/);
  const adoptMatch = authProviderSource.match(/const adoptOwner = useCallback\(\(ownerId: string \| null, refreshToken: string \| null = null, isNewSignIn = false\) => \{([\s\S]*?)\n  \}, \[\]\);/);
  const eventMatch = authProviderSource.match(/client\.auth\.onAuthStateChange\(\(event, nextSession\) => \{([\s\S]*?)\n    \}\);/);
  const exchangeMatch = authProviderSource.match(/async exchangeAuthCodeForCurrentSession\(code\) \{([\s\S]*?)\n    \},\n    reportDeletedAccountCleanupFailure/);
  const localSignOutMatch = authProviderSource.match(/const signOutCurrentAccountLocally = useCallback\(async \(ownerId: string, generation: number\): Promise<boolean> => \{([\s\S]*?)\n  \}, \[adoptOwner, client, isCurrentAccount, runAuthMutation\]\);/);
  for (const [label, match] of [['auth mutation queue', queueMatch], ['owner adoption', adoptMatch], ['auth listener', eventMatch], ['auth-code exchange', exchangeMatch], ['local sign-out', localSignOutMatch]]) {
    assert.ok(match, `extracts actual AuthProvider ${label}`);
  }

  const currentOwnerId = { current: verifiedId };
  const currentRefreshToken = { current: 'refresh-a' };
  const accountGenerationRef = { current: 1 };
  const authMutationQueue = { current: Promise.resolve() };
  const authAttemptInFlight = { current: false };
  const googleBrowserPending = { current: false };
  const state = { generation: [], session: [], status: [], googlePending: [], warning: [] };
  const runAuthMutation = new Function('authMutationQueue', `return (operation) => {${queueMatch[1]}\n};`)(authMutationQueue);
  const adoptOwner = new Function('currentOwnerId', 'currentRefreshToken', 'accountGenerationRef', 'setAccountGeneration',
    `return (ownerId, refreshToken = null, isNewSignIn = false) => {${adoptMatch[1]}\n};`)(
    currentOwnerId, currentRefreshToken, accountGenerationRef, (value) => state.generation.push(value));
  const setSession = (value) => state.session.push(value);
  const setStatus = (value) => state.status.push(value);
  const setSignOutWarning = (value) => state.warning.push(value);
  const setGooglePending = (value) => state.googlePending.push(value);
  const onAuthStateChange = new Function('adoptOwner', 'setSession', 'setStatus', 'setSignOutWarning', 'googleBrowserPending', 'authAttemptInFlight', 'setGooglePending',
    `let mounted = true; let authEvents = 0; return (event, nextSession) => {${eventMatch[1]}\n};`)(
    adoptOwner, setSession, setStatus, setSignOutWarning, googleBrowserPending, authAttemptInFlight, setGooglePending);
  const exchangeAuthCodeForCurrentSession = new Function('client', 'runAuthMutation', 'accountGenerationRef', 'adoptOwner', 'setAccountGeneration', 'googleBrowserPending', 'authAttemptInFlight', 'setGooglePending',
    `return async function exchangeAuthCodeForCurrentSession(code) {${exchangeMatch[1]}\n};`)(
    client, runAuthMutation, accountGenerationRef, adoptOwner, (value) => state.generation.push(value), googleBrowserPending, authAttemptInFlight, setGooglePending);
  const isCurrentAccount = (ownerId, generation) => currentOwnerId.current?.toLowerCase() === ownerId.toLowerCase() && accountGenerationRef.current === generation;
  const signOutCurrentAccountLocally = new Function('client', 'isCurrentAccount', 'authAttemptInFlight', 'runAuthMutation', 'currentRefreshToken', 'currentOwnerId', 'accountGenerationRef', 'adoptOwner',
    `return async function signOutCurrentAccountLocally(ownerId, generation) {${localSignOutMatch[1]}\n};`)(
    client, isCurrentAccount, authAttemptInFlight, runAuthMutation, currentRefreshToken, currentOwnerId, accountGenerationRef, adoptOwner);
  return { accountGenerationRef, currentOwnerId, currentRefreshToken, state, onAuthStateChange, exchangeAuthCodeForCurrentSession, signOutCurrentAccountLocally };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test('AuthProvider generation changes only for an owner or new same-owner sign-in, not refresh/refocus', async (t) => {
  const client = clientWithFetch(async () => new Response('{}', { status: 200 }));
  const harness = buildAuthProviderHarness(client);
  const session = (id, refreshToken, accessToken = 'token') => ({ user: { id }, refresh_token: refreshToken, access_token: accessToken });
  try {
    harness.onAuthStateChange('TOKEN_REFRESHED', session(verifiedId, 'refresh-a', 'token-refresh'));
    harness.onAuthStateChange('SIGNED_IN', session(verifiedId, 'refresh-a'));
    harness.onAuthStateChange('SIGNED_IN', session(verifiedId, 'refresh-a'));
    assert.equal(harness.accountGenerationRef.current, 1);
    harness.onAuthStateChange('SIGNED_IN', session(verifiedId, 'refresh-new'));
    assert.equal(harness.accountGenerationRef.current, 2);
    harness.onAuthStateChange('SIGNED_IN', session(suppliedOtherId, 'refresh-b'));
    assert.equal(harness.accountGenerationRef.current, 3);
    harness.onAuthStateChange('SIGNED_OUT', null);
    assert.equal(harness.accountGenerationRef.current, 4);
  } finally { await client.auth.dispose(); }
});

test('extracted AuthProvider queue serializes stubbed auth methods in both orders', async (t) => {
  await t.test('stubbed exchange first invalidates the captured old-owner local sign-out', async () => {
    const client = clientWithFetch(async () => new Response('{}', { status: 200 }));
    const exchange = deferred();
    const calls = [];
    let provider;
    client.auth.exchangeCodeForSession = async () => {
      calls.push('exchange-start');
      await exchange.promise;
      provider.onAuthStateChange('SIGNED_IN', { user: { id: verifiedId }, refresh_token: 'refresh-new', access_token: 'new-token' });
      calls.push('exchange-end');
      return { data: { session: { user: { id: verifiedId }, refresh_token: 'refresh-new', access_token: 'new-token' } }, error: null };
    };
    client.auth.getSession = async () => { calls.push('get-session'); return { data: { session: { user: { id: verifiedId }, refresh_token: 'refresh-a' } }, error: null }; };
    client.auth.signOut = async () => { calls.push('local-signout'); return { error: null }; };
    provider = buildAuthProviderHarness(client);
    try {
      const callback = provider.exchangeAuthCodeForCurrentSession('synthetic-code');
      while (!calls.includes('exchange-start')) await new Promise((resolve) => setImmediate(resolve));
      const oldSignOut = provider.signOutCurrentAccountLocally(verifiedId, 1);
      exchange.resolve();
      assert.equal(await callback, true);
      assert.equal(await oldSignOut, false);
      assert.deepEqual(calls, ['exchange-start', 'exchange-end']);
      assert.equal(provider.accountGenerationRef.current, 2);
      assert.equal(provider.currentRefreshToken.current, 'refresh-new');
    } finally { await client.auth.dispose(); }
  });

  await t.test('stubbed local sign-out first completes before queued exchange adopts its new owner', async () => {
    const client = clientWithFetch(async () => new Response('{}', { status: 200 }));
    const sessionRead = deferred();
    const calls = [];
    let provider;
    let reads = 0;
    client.auth.getSession = async () => {
      calls.push('get-session-start');
      const result = reads++ === 0 ? await sessionRead.promise : { data: { session: null }, error: null };
      calls.push('get-session-end');
      return result;
    };
    client.auth.signOut = async (options) => {
      calls.push(`signout:${options?.scope ?? 'default'}`);
      if (options?.scope === 'local') provider.onAuthStateChange('SIGNED_OUT', null);
      return { error: null };
    };
    client.auth.exchangeCodeForSession = async () => {
      calls.push('exchange-start');
      provider.onAuthStateChange('SIGNED_IN', { user: { id: suppliedOtherId }, refresh_token: 'refresh-b', access_token: 'token-b' });
      calls.push('exchange-end');
      return { data: { session: { user: { id: suppliedOtherId }, refresh_token: 'refresh-b', access_token: 'token-b' } }, error: null };
    };
    provider = buildAuthProviderHarness(client);
    try {
      const oldSignOut = provider.signOutCurrentAccountLocally(verifiedId, 1);
      while (!calls.includes('get-session-start')) await new Promise((resolve) => setImmediate(resolve));
      const callback = provider.exchangeAuthCodeForCurrentSession('synthetic-code');
      sessionRead.resolve({ data: { session: { user: { id: verifiedId }, refresh_token: 'refresh-a' } }, error: null });
      assert.equal(await oldSignOut, true);
      assert.equal(await callback, true);
      assert.deepEqual(calls, ['get-session-start', 'get-session-end', 'signout:local', 'get-session-start', 'get-session-end', 'exchange-start', 'exchange-end']);
      assert.equal(provider.currentOwnerId.current, suppliedOtherId);
      assert.equal(provider.accountGenerationRef.current, 3);
    } finally { await client.auth.dispose(); }
  });
});

function sdkSession(ownerId, refreshToken, accessToken) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const jwt = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ aud: 'authenticated', sub: ownerId, exp: now + 3600, iat: now, jti: accessToken })}.c3ludGhldGlj`;
  return { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600,
    refresh_token: refreshToken, user: { id: ownerId, aud: 'authenticated', role: 'authenticated', email: 'synthetic@example.invalid',
      app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: new Date().toISOString() } };
}

async function createRealAuthProviderHarness({ exchangeReply, exchangeGate } = {}) {
  const storageValues = new Map([['qa-account-auth', JSON.stringify(sdkSession(verifiedId, 'refresh-a', 'access-a'))],
    ['qa-account-auth-code-verifier', JSON.stringify('synthetic-code-verifier/')]]);
  const storage = {
    async getItem(key) { return storageValues.get(key) ?? null; },
    async setItem(key, value) { storageValues.set(key, value); },
    async removeItem(key) { storageValues.delete(key); },
  };
  const requests = [];
  const client = createClient('https://local.invalid', 'synthetic-anon-key', {
    auth: { storage, storageKey: 'qa-account-auth', autoRefreshToken: false, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' },
    global: { fetch: async (input, init = {}) => {
      const url = String(input);
      requests.push({ url, method: init.method, body: init.body });
      if (!url.includes('/token?grant_type=pkce')) return new Response('{}', { status: 404 });
      if (exchangeGate) await exchangeGate.promise;
      const reply = typeof exchangeReply === 'function' ? exchangeReply() : exchangeReply;
      if (reply instanceof Response) return reply;
      return new Response(JSON.stringify(reply ?? sdkSession(suppliedOtherId, 'refresh-b', 'access-b')),
        { status: 200, headers: { 'content-type': 'application/json' } });
    } },
  });
  await client.auth.getSession();
  const provider = buildAuthProviderHarness(client);
  const subscription = client.auth.onAuthStateChange((event, session) => provider.onAuthStateChange(event, session));
  await new Promise((resolve) => setImmediate(resolve));
  return { client, provider, requests, storageValues, unsubscribe: () => subscription.data.subscription.unsubscribe() };
}

test('installed Auth SDK callback exchange enters the provider queue, advances same-owner new-login epoch, and preserves captured old session', async () => {
  const exchangeGate = deferred();
  const harness = await createRealAuthProviderHarness({ exchangeGate,
    exchangeReply: () => sdkSession(verifiedId, 'refresh-new', 'access-new') });
  try {
    assert.equal(JSON.parse(harness.storageValues.get('qa-account-auth-code-verifier')), 'synthetic-code-verifier/');
    const exchange = harness.provider.exchangeAuthCodeForCurrentSession('real-sdk-synthetic-code');
    for (let attempt = 0; harness.requests.length === 0 && attempt < 100; attempt++) await new Promise((resolve) => setImmediate(resolve));
    if (harness.requests.length === 0) assert.equal(await exchange, true, 'actual SDK exchange should reach token endpoint or resolve a verified session');
    assert.ok(harness.requests.length > 0, 'installed Auth SDK issued the expected local token-exchange fetch');
    const oldSignOut = harness.provider.signOutCurrentAccountLocally(verifiedId, 1);
    exchangeGate.resolve();
    assert.equal(await exchange, true);
    assert.equal(await oldSignOut, false, 'a response captured against the earlier login cannot sign out its replacement session');
    assert.equal(harness.provider.accountGenerationRef.current, 2);
    assert.equal(harness.provider.currentOwnerId.current, verifiedId);
    assert.equal(harness.provider.currentRefreshToken.current, 'refresh-new');
    assert.equal((await harness.client.auth.getSession()).data.session.refresh_token, 'refresh-new');
    assert.match(harness.requests[0].url, /\/auth\/v1\/token\?grant_type=pkce$/);
    assert.deepEqual(JSON.parse(harness.requests[0].body), { auth_code: 'real-sdk-synthetic-code', code_verifier: 'synthetic-code-verifier' });
  } finally { harness.unsubscribe(); await harness.client.auth.dispose(); }
});

test('installed Auth SDK local sign-out clears a queued stale verifier; a later fresh callback can adopt its owner', async () => {
  const harness = await createRealAuthProviderHarness({ exchangeReply: () => sdkSession(suppliedOtherId, 'refresh-b', 'access-b') });
  try {
    const localSignOut = harness.provider.signOutCurrentAccountLocally(verifiedId, 1);
    const staleExchange = harness.provider.exchangeAuthCodeForCurrentSession('queued-old-code');
    assert.equal(await localSignOut, true);
    assert.equal(await staleExchange, false, 'the SDK removed the verifier when it signed out locally');
    assert.equal(harness.provider.currentOwnerId.current, null);
    assert.equal(harness.provider.accountGenerationRef.current, 2);

    harness.storageValues.set('qa-account-auth-code-verifier', JSON.stringify('new-login-verifier/'));
    const freshExchange = harness.provider.exchangeAuthCodeForCurrentSession('new-owner-code');
    assert.equal(await freshExchange, true);
    assert.equal(harness.provider.currentOwnerId.current, suppliedOtherId);
    assert.equal(harness.provider.currentRefreshToken.current, 'refresh-b');
    assert.equal(harness.provider.accountGenerationRef.current, 3);
    assert.equal((await harness.client.auth.getSession()).data.session.user.id, suppliedOtherId);
  } finally { harness.unsubscribe(); await harness.client.auth.dispose(); }
});

test('failed Auth SDK callback exchange releases provider queue for a later verified callback', async () => {
  let response = new Response(JSON.stringify({ msg: 'synthetic failure', code: 'bad_code' }),
    { status: 400, headers: { 'content-type': 'application/json' } });
  const harness = await createRealAuthProviderHarness({ exchangeReply: () => response });
  try {
    assert.equal(await harness.provider.exchangeAuthCodeForCurrentSession('bad-code'), false);
    assert.equal(harness.provider.currentOwnerId.current, verifiedId);
    harness.storageValues.set('qa-account-auth-code-verifier', JSON.stringify('fresh-verifier/'));
    response = sdkSession(verifiedId, 'refresh-new', 'access-new');
    assert.equal(await harness.provider.exchangeAuthCodeForCurrentSession('good-code'), true);
    assert.equal(harness.provider.currentOwnerId.current, verifiedId);
    assert.equal(harness.provider.currentRefreshToken.current, 'refresh-new');
    assert.equal(harness.provider.accountGenerationRef.current, 2);
  } finally { harness.unsubscribe(); await harness.client.auth.dispose(); }
});

test('synthetic cascade probe checks both owners, current dog-owned tables, failure rollback and final rollback', async () => {
  const sql = await readFile(new URL('../supabase/tests/account-deletion.sql', import.meta.url), 'utf8');
  assert.match(sql, /\nbegin;/i);
  assert.match(sql, /rollback;\s*select 'Account deletion cascade probe passed/i);
  assert.match(sql, /zz_qa_abort_owner_delete/);
  assert.match(sql, /synthetic account deletion rollback probe/);
  const ownerBChecks = {
    dogs: 'owner B dog changed', dog_memberships: 'owner B membership changed', dog_attribution: 'owner B attribution changed',
    dog_events: 'owner B event changed', reminders: 'owner B reminder changed', dog_health_plans: 'owner B health plan changed',
    training_progress: 'owner B training progress changed', product_events: 'owner B product events changed',
  };
  for (const [table, check] of Object.entries(ownerBChecks)) {
    assert.match(sql, new RegExp(`public\\.${table}`), `${table} included in synthetic owner-cascade inventory`);
    assert.match(sql, new RegExp(check), `${table} checks owner B isolation`);
  }
  assert.match(sql, /delete from auth\.users where id='91000000-0000-4000-8000-000000000001'/i);
  assert.match(sql, /keep-b@example\.invalid/);
});

test('callback screen delegates exchange to AuthProvider and confirmed server deletion stays distinct from local cleanup errors', async () => {
  const [callback, workspace] = await Promise.all([
    readFile(new URL('../src/features/account/AuthCallbackScreen.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(callback, /exchangeAuthCodeForCurrentSession\(code\)/);
  assert.doesNotMatch(callback, /client\.auth\.exchangeCodeForSession/);
  assert.match(workspace, /notificationBusy\s*\|\|\s*accountDeleteBusy/);
  assert.match(workspace, /remindersCleaned\s*=\s*await reminderService\.cleanupOwner\(ownerId\)/);
  assert.match(workspace, /catch\s*\{\s*cleanupFailed\s*=\s*true;/);
  assert.match(workspace, /setAccountDeleteStatus\('confirmed'\)/);
  assert.match(workspace, /signOutCurrentAccountLocally\(ownerId, generation\)/);
});
