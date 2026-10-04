import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_CALLBACK_URL, readAuthCode } from '../src/data/auth-callback.ts';
import { createChunkedStorage } from '../src/data/chunked-storage.ts';

test('accepts only the configured callback with one non-empty code', () => {
  assert.equal(AUTH_CALLBACK_URL, 'tassla://auth/callback');
  assert.equal(readAuthCode('tassla://auth/callback?code=pkce-code'), 'pkce-code');

  for (const url of [
    'https://auth/callback?code=x',
    'tassla://other/callback?code=x',
    'tassla://auth/other?code=x',
    'tassla://auth/callback',
    'tassla://auth/callback?code=',
    'tassla://auth/callback?code=x&code=y',
    'tassla://auth/callback?code=x&state=y',
    'tassla://user@auth/callback?code=x',
    'tassla://auth:123/callback?code=x',
    'tassla://auth/callback?code=x#fragment',
    'not a URL',
  ]) {
    assert.equal(readAuthCode(url), null, url);
  }
});

test('chunks values by UTF-8 byte size and reconstructs Unicode exactly', async () => {
  const store = new MemoryStore();
  const storage = createChunkedStorage(store);
  const key = 'session';
  const value = `${'a'.repeat(1498)}é🐶${'å'.repeat(800)}`;

  await storage.setItem(key, value);

  const chunks = [...store.values.entries()]
    .filter(([name]) => name.startsWith(`${key}.chunk.a.`))
    .sort(([left], [right]) => Number(left.split('.').at(-1)) - Number(right.split('.').at(-1)))
    .map(([, chunk]) => chunk);
  const byteLength = (chunk) => new TextEncoder().encode(chunk).length;
  assert.equal(byteLength(chunks[0]), 1500);
  assert.ok(chunks.every((chunk) => byteLength(chunk) <= 1500));
  assert.equal(await storage.getItem(key), value);
});

test('keeps the previous value and removes the incomplete slot after a failed write', async () => {
  const store = new MemoryStore();
  const storage = createChunkedStorage(store);
  await storage.setItem('session', 'previous');
  store.failNextSetFor = 'session.chunk.b.1';

  await assert.rejects(storage.setItem('session', 'new'.repeat(700)), /simulated storage failure/);

  assert.equal(await storage.getItem('session'), 'previous');
  assert.equal(store.values.get('session.index'), 'v1|a|1');
  assert.equal([...store.values.keys()].some((name) => name.startsWith('session.chunk.b.')), false);
});

test('keeps the previous value when committing the new marker fails', async () => {
  const store = new MemoryStore();
  const storage = createChunkedStorage(store);
  await storage.setItem('session', 'previous');
  store.failNextSetFor = 'session.index';

  await assert.rejects(storage.setItem('session', 'replacement'), /simulated storage failure/);

  assert.equal(await storage.getItem('session'), 'previous');
  assert.equal(store.values.get('session.index'), 'v1|a|1');
  assert.equal([...store.values.keys()].some((name) => name.startsWith('session.chunk.b.')), false);
});

test('clears both chunk slots on removal and rejects a malformed marker', async () => {
  const store = new MemoryStore();
  const storage = createChunkedStorage(store);
  await storage.setItem('session', 'first');
  await storage.setItem('session', 'second');
  await storage.removeItem('session');

  assert.equal(await storage.getItem('session'), null);
  assert.equal([...store.values.keys()].some((name) => name.startsWith('session.chunk.')), false);

  store.values.set('broken.index', 'v1|c|1');
  await assert.rejects(storage.getItem('broken'), /storage is incomplete/);
});

test('can finish removal after an earlier partial deletion left a hole', async () => {
  const store = new MemoryStore();
  const storage = createChunkedStorage(store);
  await storage.setItem('session', 'x'.repeat(2000));
  store.failNextDeleteFor = 'session.chunk.a.1';

  await assert.rejects(storage.removeItem('session'), /simulated storage failure/);
  await storage.removeItem('session');

  assert.equal(await storage.getItem('session'), null);
  assert.equal([...store.values.keys()].some((name) => name.startsWith('session.chunk.')), false);
});

class MemoryStore {
  values = new Map();
  failNextSetFor = null;
  failNextDeleteFor = null;

  async getItemAsync(key) {
    return this.values.get(key) ?? null;
  }

  async setItemAsync(key, value) {
    if (this.failNextSetFor === key) {
      this.failNextSetFor = null;
      throw new Error('simulated storage failure');
    }
    this.values.set(key, value);
  }

  async deleteItemAsync(key) {
    if (this.failNextDeleteFor === key) {
      this.failNextDeleteFor = null;
      throw new Error('simulated storage failure');
    }
    this.values.delete(key);
  }
}
