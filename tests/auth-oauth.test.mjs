import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash, randomFillSync } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import {
  AUTH_CALLBACK_URL,
  isTrustedGoogleOAuthUrl,
  shouldExchangeAuthCode,
} from '../src/data/auth-callback.ts';
import {
  createPkceWebCryptoAdapter,
  installPkceWebCrypto,
  verifyPkceWebCrypto,
} from '../src/data/pkce-crypto.ts';

const projectUrl = 'https://tassla-test.supabase.co';
const validChallenge = createHash('sha256').update('synthetic-verifier').digest('base64url');

function authorizeUrl(overrides = {}) {
  const url = new URL('/auth/v1/authorize', projectUrl);
  url.searchParams.set('provider', 'google');
  url.searchParams.set('redirect_to', AUTH_CALLBACK_URL);
  url.searchParams.set('code_challenge', validChallenge);
  url.searchParams.set('code_challenge_method', 's256');
  for (const [key, value] of Object.entries(overrides)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

test('trusts only the configured HTTPS Supabase Google authorization URL', () => {
  assert.equal(isTrustedGoogleOAuthUrl(authorizeUrl(), projectUrl), true);

  const invalidUrls = [
    'http://tassla-test.supabase.co/auth/v1/authorize?provider=google&redirect_to=tassla%3A%2F%2Fauth%2Fcallback',
    authorizeUrl().replace('tassla-test.supabase.co', 'attacker.supabase.co'),
    authorizeUrl().replace('/auth/v1/authorize', '/auth/v1/authorize/'),
    authorizeUrl().replace('provider=google', 'provider=github'),
    authorizeUrl().replace('redirect_to=tassla%3A%2F%2Fauth%2Fcallback', 'redirect_to=https%3A%2F%2Fattacker.example'),
    `${authorizeUrl()}&provider=google`,
    `${authorizeUrl()}&redirect_to=tassla%3A%2F%2Fauth%2Fcallback`,
    authorizeUrl({ code_challenge: '' }),
    authorizeUrl({ code_challenge: 'not-a-base64url-challenge' }),
    authorizeUrl({ code_challenge_method: 'plain' }),
    `${authorizeUrl()}&code_challenge=${validChallenge}`,
    `${authorizeUrl()}&code_challenge_method=s256`,
    authorizeUrl().replace('https://', 'https://user@'),
    authorizeUrl().replace('https://', 'https://user:secret@'),
    authorizeUrl().replace('supabase.co/', 'supabase.co:8443/'),
    `${authorizeUrl()}#external`,
    'not a URL',
  ];

  for (const value of invalidUrls) {
    assert.equal(isTrustedGoogleOAuthUrl(value, projectUrl), false, value);
  }

  for (const invalidProject of [
    'http://tassla-test.supabase.co',
    'https://user@tassla-test.supabase.co',
    'https://tassla-test.supabase.co:8443',
    'https://tassla-test.supabase.co/project-path',
    'not a URL',
  ]) {
    assert.equal(isTrustedGoogleOAuthUrl(authorizeUrl(), invalidProject), false, invalidProject);
  }
});

test('callback exchange policy blocks in-flight, failed and exchanged codes but allows a new retry code', () => {
  assert.equal(shouldExchangeAuthCode(null, null, null, null), false);
  assert.equal(shouldExchangeAuthCode('', null, null, null), false);
  assert.equal(shouldExchangeAuthCode('first-code', 'first-code', null, null), false);
  assert.equal(shouldExchangeAuthCode('new-code', 'first-code', null, null), false);
  assert.equal(shouldExchangeAuthCode('first-code', null, 'first-code', null), false);
  assert.equal(shouldExchangeAuthCode('first-code', null, null, 'first-code'), false);
  assert.equal(shouldExchangeAuthCode('new-code', null, 'first-code', null), true);
  assert.equal(shouldExchangeAuthCode('new-code', null, null, 'first-code'), true);
  assert.equal(shouldExchangeAuthCode('first-code', null, null, null), true);
});

test('PKCE WebCrypto adapter delegates secure randomness and SHA-256 and preflight rejects unavailable crypto', async () => {
  const calls = [];
  const adapter = createPkceWebCryptoAdapter(localCryptoProvider(calls));
  const random = new Uint32Array(4);

  assert.equal(adapter.getRandomValues(random), random);
  assert.ok(random.some((value) => value !== 0));
  assert.deepEqual(calls, ['random:Uint32Array']);

  const digest = await adapter.subtle.digest('SHA-256', new TextEncoder().encode('Tassla'));
  assert.equal(Buffer.from(digest).toString('hex'), createHash('sha256').update('Tassla').digest('hex'));
  assert.deepEqual(calls, ['random:Uint32Array', 'digest:SHA-256']);
  await verifyPkceWebCrypto({ crypto: adapter });

  await assert.rejects(verifyPkceWebCrypto({ crypto: undefined }), /cryptography is unavailable/);
  await assert.rejects(verifyPkceWebCrypto({ crypto: createPkceWebCryptoAdapter({
    getRandomValues(array) { return array; },
    async digest() { return new ArrayBuffer(8); },
  }) }), /cryptography is unavailable/);
});

test('installed Supabase SDK makes an S256 PKCE URL using the installed adapter without Node WebCrypto or network', async () => {
  const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  const calls = [];
  let client;
  try {
    delete globalThis.crypto;
    assert.equal(globalThis.crypto, undefined);
    installPkceWebCrypto(globalThis, localCryptoProvider(calls));
    await verifyPkceWebCrypto();

    const storage = new MemoryAuthStorage();
    const unexpectedFetch = async () => {
      throw new Error('OAuth setup must not make a network request');
    };
    client = createClient(projectUrl, 'synthetic-publishable-key', {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: 'pkce',
        persistSession: true,
        storage,
        storageKey: 'qa-auth',
      },
      global: { fetch: unexpectedFetch },
    });

    const result = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: AUTH_CALLBACK_URL, skipBrowserRedirect: true },
    });

    assert.equal(result.error, null);
    const url = new URL(result.data.url);
    assert.equal(url.origin, projectUrl);
    assert.equal(url.pathname, '/auth/v1/authorize');
    assert.equal(url.searchParams.get('provider'), 'google');
    assert.equal(url.searchParams.get('redirect_to'), AUTH_CALLBACK_URL);
    assert.equal(url.searchParams.has('skip_http_redirect'), false);
    assert.equal(url.searchParams.get('code_challenge_method'), 's256');
    assert.equal(isTrustedGoogleOAuthUrl(result.data.url, projectUrl), true);

    const challenge = url.searchParams.get('code_challenge');
    const flowIds = JSON.parse(storage.values.get('qa-auth-flows-code-verifier'));
    assert.ok(challenge);
    assert.ok(Array.isArray(flowIds) && flowIds.length === 1);
    const verifier = JSON.parse(storage.values.get(`qa-auth-flow-${flowIds[0]}-code-verifier`));
    assert.equal(typeof verifier, 'string');
    assert.equal(createHash('sha256').update(verifier).digest('base64url'), challenge);
    assert.ok(calls.some((call) => call === 'random:Uint32Array'));
    assert.ok(calls.includes('digest:SHA-256'));
  } finally {
    if (client) await client.auth.dispose();
    if (cryptoDescriptor) Object.defineProperty(globalThis, 'crypto', cryptoDescriptor);
    else delete globalThis.crypto;
  }
});

function localCryptoProvider(calls = []) {
  return {
    getRandomValues(array) {
      calls.push(`random:${array.constructor.name}`);
      randomFillSync(array);
      return array;
    },
    async digest(algorithm, data) {
      calls.push(`digest:${algorithm}`);
      const bytes = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
      const digest = createHash('sha256').update(bytes).digest();
      return digest.buffer.slice(digest.byteOffset, digest.byteOffset + digest.byteLength);
    },
  };
}

class MemoryAuthStorage {
  values = new Map();

  async getItem(key) {
    return this.values.get(key) ?? null;
  }

  async setItem(key, value) {
    this.values.set(key, value);
  }

  async removeItem(key) {
    this.values.delete(key);
  }
}
