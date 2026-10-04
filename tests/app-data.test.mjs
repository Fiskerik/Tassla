import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

test('the installed PostgREST client forwards an abort signal to fetch', async () => {
  let requestSignal;
  const localFetch = (_input, init = {}) => new Promise((_resolve, reject) => {
    requestSignal = init.signal;
    requestSignal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
  });
  const client = createClient('https://example.invalid', 'synthetic-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: localFetch },
  });
  const controller = new AbortController();

  const pending = client.rpc('create_dog', {
    dog_name: 'Synthetic',
    dog_breed_id: 'unknown',
    dog_birth_date: '2026-08-01',
    kennel_code: null,
  }).abortSignal(controller.signal).then((result) => result);
  await new Promise((resolve) => setImmediate(resolve));
  await Promise.resolve();
  assert.ok(requestSignal instanceof AbortSignal, 'RPC fetch receives an abort signal');
  assert.equal(requestSignal.aborted, false);

  controller.abort();

  assert.equal(requestSignal.aborted, true);
  const result = await pending;
  assert.ok(result.error);
  await client.auth.dispose();
});
