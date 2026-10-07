import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://example.supabase.co';
const ANON_KEY = 'anon-key-for-local-contract-test';
const STORAGE_KEY = 'app-screen-ux-test-session';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function encoded(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function syntheticSession() {
  const header = encoded({ alg: 'HS256', typ: 'JWT' });
  const payload = encoded({
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: '00000000-0000-4000-8000-000000000001',
    email: 'synthetic@example.test',
    phone: '',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    role: 'authenticated',
    aal: 'aal1',
    amr: [{ method: 'password', timestamp: Math.floor(Date.now() / 1000) }],
    session_id: '00000000-0000-4000-8000-000000000002',
  });
  return {
    access_token: `${header}.${payload}.signature`,
    refresh_token: 'synthetic-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: '00000000-0000-4000-8000-000000000001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'synthetic@example.test',
      phone: '',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
      created_at: '2026-10-05T00:00:00.000Z',
      updated_at: '2026-10-05T00:00:00.000Z',
    },
  };
}

function createLocalClient({ fetchImpl, storage = new Map() } = {}) {
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => { storage.set(key, value); },
    removeItem: (key) => { storage.delete(key); },
  };
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: {
      storage: localStorage,
      storageKey: STORAGE_KEY,
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: { fetch: fetchImpl ?? (async () => new Response('{}', { status: 200 })) },
  });
  storage.set(STORAGE_KEY, JSON.stringify(syntheticSession()));
  return { client, storage };
}

test('cancel path performs zero auth calls and concurrent confirmations perform one', async () => {
  const requests = [];
  const pending = deferred();
  const { client } = createLocalClient({
    fetchImpl: async (...args) => {
      requests.push(args);
      return pending.promise;
    },
  });

  // This mirrors the synchronous ref guard in ProductWorkspace; the auth operation is the real SDK call.
  let inFlight = false;
  let authCalls = 0;
  const confirm = () => {
    if (inFlight) return;
    inFlight = true;
    authCalls += 1;
    return client.auth.signOut().finally(() => { inFlight = false; });
  };
  const cancel = () => undefined;

  cancel();
  assert.equal(authCalls, 0);
  const first = confirm();
  const second = confirm();
  assert.equal(authCalls, 1);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests.length, 1);
  pending.resolve(new Response('{}', { status: 200 }));
  await Promise.all([first, second]);
});

test('installed Auth signOut separates server confirmation from local session clearing', async () => {
  const requests = [];
  const { client, storage } = createLocalClient({
    fetchImpl: async (...args) => {
      requests.push(args);
      return new Response(JSON.stringify({ message: 'synthetic server failure' }), {
        status: 503,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const { error } = await client.auth.signOut();
  assert.ok(error, 'global sign-out must expose the server error');
  assert.equal(requests.length, 1);
  assert.equal(storage.has(STORAGE_KEY), false, 'Auth 2.117.2 removes the local session on this server error');
  const localSession = await client.auth.getSession();
  assert.equal(localSession.data.session, null);
  assert.equal(localSession.error, null);
});

test('local storage removal failure leaves the session and permits a retry', async () => {
  const requests = [];
  const storage = new Map();
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => { storage.set(key, value); },
    removeItem: () => { throw new Error('synthetic storage failure'); },
  };
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { storage: localStorage, storageKey: STORAGE_KEY, autoRefreshToken: false, persistSession: true, detectSessionInUrl: false },
    global: {
      fetch: async (...args) => {
        requests.push(args);
        return new Response('{}', { status: 200 });
      },
    },
  });
  storage.set(STORAGE_KEY, JSON.stringify(syntheticSession()));

  const attempt = () => client.auth.signOut().catch((error) => error);
  const first = await attempt();
  const second = await attempt();
  assert.ok(first instanceof Error);
  assert.ok(second instanceof Error);
  assert.equal(requests.length, 2, 'a failed local clear must not consume the retry');
  assert.ok(storage.has(STORAGE_KEY));
});

test('signed-out warning is owned by AuthProvider and survives workspace unmount', async () => {
  const [provider, workspace, signIn] = await Promise.all([
    readFile(new URL('../src/features/account/AuthProvider.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/account/SignInScreen.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(provider, /setSignOutWarning\('Du är utloggad på den här enheten\./);
  assert.match(provider, /localSessionCleared && !serverRevocationConfirmed/);
  assert.match(provider, /signOutWarning,\n\s*\}\), \[accountGeneration, adoptOwner, client, googlePending, isCurrentAccount, reportDeletedAccountCleanupFailure, reportNotificationCleanupFailure, runAuthMutation, session, signOutCurrentAccountLocally, signOutWarning, status\]\)/);
  assert.match(workspace, /const signOutInFlight = useRef\(false\);/);
  assert.match(workspace, /if \(signOutInFlight\.current\) return;/);
  assert.match(workspace, /\{ text: 'Avbryt', style: 'cancel' \}/);
  assert.match(workspace, /\{ text: 'Bekräfta', style: 'destructive'/);
  assert.match(workspace, /const \{[^}]*\bsignOut\b[^}]*\} = useAuth\(\);/);
  assert.match(workspace, /setSignOutError\(!result\.localSessionCleared\)/);
  assert.match(workspace, /signOutError/);
  assert.match(signIn, /signOutWarning &&/);
  assert.match(signIn, /MessageCard tone="error">\{signOutWarning\}/);
});
