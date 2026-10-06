import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';

const tsResolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
const workspaceData = await import('../src/data/workspace-data.ts');
tsResolution.deregister();

const baseUrl = 'https://local-test.supabase.invalid';
const dogId = '11111111-1111-4111-8111-111111111111';
const weightId = '22222222-2222-4222-8222-222222222222';
const actorId = '33333333-3333-4333-8333-333333333333';
const operation = { id: weightId, dog_id: dogId, occurred_on: today(), weight_kg: 12.345 };
const savedWeight = { ...operation, actor_id: actorId };
const workspaceSource = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');

test('weight date and kg validators enforce calendar, future and database boundaries', () => {
  const { isValidHealthWeightDate, isValidHealthWeightKg } = workspaceData;
  assert.equal(isValidHealthWeightDate(today()), true);
  assert.equal(isValidHealthWeightDate('2024-02-29'), true);
  assert.equal(isValidHealthWeightDate('2025-02-29'), false);
  assert.equal(isValidHealthWeightDate('2026-04-31'), false);
  assert.equal(isValidHealthWeightDate('2026-2-03'), false);
  assert.equal(isValidHealthWeightDate('not-a-date'), false);
  assert.equal(isValidHealthWeightDate(tomorrow()), false);

  for (const valid of [0.001, 1.001, 1.005, 12.345, 200]) {
    assert.equal(isValidHealthWeightKg(valid), true, `${valid} should be accepted`);
  }
  for (const invalid of [0, -0.001, 200.001, 1.0001, 1.00000000001, Number.NaN, Infinity]) {
    assert.equal(isValidHealthWeightKg(invalid), false, `${invalid} should be rejected`);
  }
});

test('invalid insert and update values fail before the Supabase client sends a request', async () => {
  const { client, requests } = localClient(() => {
    throw new Error('validation should prevent this request');
  });

  try {
    assert.deepEqual(await workspaceData.insertHealthWeight(client, { ...operation, occurred_on: '2025-02-29' }), { status: 'failed' });
    assert.deepEqual(await workspaceData.insertHealthWeight(client, { ...operation, occurred_on: tomorrow() }), { status: 'failed' });
    assert.deepEqual(await workspaceData.insertHealthWeight(client, { ...operation, weight_kg: 1.0001 }), { status: 'failed' });
    assert.deepEqual(await workspaceData.updateHealthWeight(client, dogId, weightId, { occurred_on: '2026-04-31', weight_kg: 12 }), { status: 'failed' });
    assert.deepEqual(await workspaceData.updateHealthWeight(client, dogId, weightId, { occurred_on: today(), weight_kg: 200.001 }), { status: 'failed' });
    assert.equal(requests.length, 0);
  } finally {
    await client.auth.dispose();
  }
});

test('weight history filters the selected dog and weight type, with a stable date and id order', async () => {
  const rows = [savedWeight, { ...savedWeight, id: '11111111-1111-4111-8111-111111111112', occurred_on: '2026-10-04' }];
  const { client, requests } = localClient(({ method, url }) => {
    assert.equal(method, 'GET');
    assert.equal(url.pathname, '/rest/v1/dog_events');
    assert.equal(url.searchParams.get('select'), 'id,dog_id,actor_id,occurred_on,weight_kg');
    assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(url.searchParams.get('event_type'), 'eq.weight');
    assert.deepEqual(url.searchParams.get('order')?.split(','), ['occurred_on.desc', 'id.desc']);
    return jsonResponse(rows);
  });

  try {
    assert.deepEqual(await workspaceData.fetchHealthWeights(client, dogId), rows);
    assert.equal(requests.length, 1);
  } finally {
    await client.auth.dispose();
  }
});

test('weight insert sends only its contract fields and returns a saved row', async () => {
  const { client, requests } = localClient(({ method, url, body }) => {
    assert.equal(method, 'POST');
    assert.equal(url.pathname, '/rest/v1/dog_events');
    assert.deepEqual(body, { ...operation, event_type: 'weight' });
    assert.equal(Object.hasOwn(body, 'actor_id'), false);
    return jsonResponse(savedWeight);
  });

  try {
    assert.deepEqual(await workspaceData.insertHealthWeight(client, operation), { status: 'saved', value: savedWeight });
    assert.equal(requests.length, 1);
  } finally {
    await client.auth.dispose();
  }
});

test('a lost weight insert response reconciles by the same stable UUID and exact values', async () => {
  let row = null;
  const { client, requests } = localClient(async (request) => {
    if (request.method === 'POST') {
      assert.deepEqual(request.body, { ...operation, event_type: 'weight' });
      row = savedWeight;
      throw new TypeError('simulated lost response after commit');
    }
    assert.equal(request.method, 'GET');
    assert.equal(request.url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(request.url.searchParams.get('event_type'), 'eq.weight');
    assert.equal(request.url.searchParams.get('id'), `eq.${weightId}`);
    return jsonResponse(row);
  });

  try {
    assert.deepEqual(await workspaceData.insertHealthWeight(client, operation), { status: 'saved', value: savedWeight });
    assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET']);
    assert.equal(requests.filter(({ method }) => method === 'POST').length, 1);
  } finally {
    await client.auth.dispose();
  }
});

test('an insert rejection is failed, while an ambiguous absent row stays unknown', async (t) => {
  await t.test('database rejection with no reconciled row', async () => {
    const { client, requests } = localClient(({ method }) => method === 'POST'
      ? jsonResponse({ code: '23514', message: 'database constraint rejected the row' }, 400)
      : jsonResponse(null));
    try {
      assert.deepEqual(await workspaceData.insertHealthWeight(client, operation), { status: 'failed' });
      assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET']);
    } finally {
      await client.auth.dispose();
    }
  });

  await t.test('response loss and no row found', async () => {
    const { client, requests } = localClient(({ method }) => {
      if (method === 'POST') throw new TypeError('simulated lost response');
      return jsonResponse(null);
    });
    try {
      assert.deepEqual(await workspaceData.insertHealthWeight(client, operation), { status: 'unknown' });
      assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET']);
    } finally {
      await client.auth.dispose();
    }
  });

  await t.test('the same UUID with different persisted values is not reported as saved', async () => {
    const conflictingRow = { ...savedWeight, weight_kg: 13.5 };
    const { client } = localClient(({ method }) => {
      if (method === 'POST') throw new TypeError('simulated lost response');
      return jsonResponse(conflictingRow);
    });
    try {
      assert.deepEqual(await workspaceData.insertHealthWeight(client, operation), { status: 'unknown' });
    } finally {
      await client.auth.dispose();
    }
  });
});

test('weight update scopes dog, event type and id, and reconciles matching values after response loss', async () => {
  const changes = { occurred_on: today(), weight_kg: 13.005 };
  const updated = { ...savedWeight, ...changes };
  const { client, requests } = localClient(async ({ method, url, body }) => {
    if (method === 'PATCH') {
      assert.deepEqual(body, changes);
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(url.searchParams.get('event_type'), 'eq.weight');
      assert.equal(url.searchParams.get('id'), `eq.${weightId}`);
      throw new TypeError('simulated lost update response');
    }
    assert.equal(method, 'GET');
    return jsonResponse(updated);
  });

  try {
    assert.deepEqual(await workspaceData.updateHealthWeight(client, dogId, weightId, changes), { status: 'saved', value: updated });
    assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
  } finally {
    await client.auth.dispose();
  }
});

test('weight update distinguishes rejected and unknown outcomes', async (t) => {
  await t.test('definite database rejection with unchanged row is failed', async () => {
    const changes = { occurred_on: today(), weight_kg: 14 };
    const { client, requests } = localClient(({ method }) => method === 'PATCH'
      ? jsonResponse({ code: '23514', message: 'database constraint rejected the update' }, 400)
      : jsonResponse(savedWeight));
    try {
      assert.deepEqual(await workspaceData.updateHealthWeight(client, dogId, weightId, changes), { status: 'failed' });
      assert.deepEqual(requests.map(({ method }) => method), ['PATCH', 'GET']);
    } finally {
      await client.auth.dispose();
    }
  });

  await t.test('ambiguous response with values not yet visible is unknown', async () => {
    const changes = { occurred_on: today(), weight_kg: 14 };
    const { client } = localClient(({ method }) => {
      if (method === 'PATCH') throw new TypeError('simulated lost response');
      return jsonResponse(savedWeight);
    });
    try {
      assert.deepEqual(await workspaceData.updateHealthWeight(client, dogId, weightId, changes), { status: 'unknown' });
    } finally {
      await client.auth.dispose();
    }
  });
});

test('weight delete scopes dog, event type and id and confirms absence after a lost response', async () => {
  let rowExists = true;
  const { client, requests } = localClient(async ({ method, url }) => {
    assert.equal(url.pathname, '/rest/v1/dog_events');
    assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
    assert.equal(url.searchParams.get('event_type'), 'eq.weight');
    assert.equal(url.searchParams.get('id'), `eq.${weightId}`);
    if (method === 'DELETE') {
      rowExists = false;
      throw new TypeError('simulated lost delete response after commit');
    }
    assert.equal(method, 'GET');
    return jsonResponse(rowExists ? savedWeight : null);
  });

  try {
    assert.deepEqual(await workspaceData.deleteHealthWeight(client, dogId, weightId), { status: 'saved', value: null });
    assert.deepEqual(requests.map(({ method }) => method), ['DELETE', 'GET']);
  } finally {
    await client.auth.dispose();
  }
});

test('weight delete distinguishes a rejected write from an unresolved write', async (t) => {
  await t.test('definite rejection while the row remains is failed', async () => {
    const { client, requests } = localClient(({ method }) => method === 'DELETE'
      ? jsonResponse({ code: '23503', message: 'database rejected the delete' }, 400)
      : jsonResponse(savedWeight));
    try {
      assert.deepEqual(await workspaceData.deleteHealthWeight(client, dogId, weightId), { status: 'failed' });
      assert.deepEqual(requests.map(({ method }) => method), ['DELETE', 'GET']);
    } finally {
      await client.auth.dispose();
    }
  });

  await t.test('lost response while the row remains is unknown', async () => {
    const { client } = localClient(({ method }) => {
      if (method === 'DELETE') throw new TypeError('simulated lost delete response');
      return jsonResponse(savedWeight);
    });
    try {
      assert.deepEqual(await workspaceData.deleteHealthWeight(client, dogId, weightId), { status: 'unknown' });
    } finally {
      await client.auth.dispose();
    }
  });
});

test('the actual workspace save handler starts once, suppresses a same-tick duplicate and publishes a saved row', async () => {
  const deferred = deferredResult();
  const harness = createHealthHandlerHarness({
    insertHealthWeight: async (...args) => {
      harness.calls.insert.push(args);
      return deferred.promise;
    },
  });

  const first = harness.handlers.saveHealthWeight(null, today(), 12.345);
  assert.equal(harness.calls.insert.length, 1, 'the first save must reach insertHealthWeight');
  const duplicate = await harness.handlers.saveHealthWeight(null, today(), 12.345);
  assert.equal(duplicate, false);
  assert.equal(harness.calls.insert.length, 1, 'the duplicate press must not issue a second insert');

  deferred.resolve({ status: 'saved', value: savedWeight });
  assert.equal(await first, true);
  assert.deepEqual(harness.state.rows, [savedWeight]);
  assert.equal(harness.state.pendingHealthMutation.current, null);
});

test('the actual workspace save handler blocks a new write after an unknown outcome', async () => {
  const harness = createHealthHandlerHarness({
    insertHealthWeight: async (...args) => {
      harness.calls.insert.push(args);
      return { status: 'unknown' };
    },
  });

  assert.equal(await harness.handlers.saveHealthWeight(null, today(), 12.345), false);
  assert.equal(harness.state.healthPending, true);
  assert.equal(harness.state.pendingHealthMutation.current?.operation.id, weightId);
  assert.equal(await harness.handlers.saveHealthWeight(null, today(), 13), false);
  assert.equal(harness.calls.insert.length, 1);
});

test('the actual status-check handler reconciles a saved insert with a read and issues no second write', async () => {
  const reads = [];
  const harness = createHealthHandlerHarness({
    insertHealthWeight: async (...args) => {
      harness.calls.insert.push(args);
      return { status: 'unknown' };
    },
    fetchHealthWeightById: async (...args) => {
      reads.push(args);
      return savedWeight;
    },
  });

  assert.equal(await harness.handlers.saveHealthWeight(null, today(), 12.345), false);
  assert.equal(harness.calls.insert.length, 1);
  await harness.handlers.retryHealthMutation();
  assert.equal(reads.length, 1);
  assert.deepEqual(reads[0].slice(1), [dogId, weightId]);
  assert.equal(harness.calls.insert.length, 1, 'a matching row resolves without replaying the insert');
  assert.deepEqual(harness.state.rows, [savedWeight]);
  assert.equal(harness.state.pendingHealthMutation.current, null);
});

function localClient(handler) {
  const requests = [];
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: async (input, init = {}) => {
        const url = new URL(typeof input === 'string' ? input : input.url);
        const request = {
          method: init.method ?? 'GET',
          url,
          signal: init.signal,
          body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
        };
        requests.push(request);
        return handler(request);
      },
    },
  });
  return { client, requests };
}

function createHealthHandlerHarness(overrides = {}) {
  const state = {
    healthPending: false,
    rows: [],
    healthBusy: false,
    healthMessage: '',
    healthMessageError: false,
    pendingHealthMutation: { current: null },
    healthMutationInFlight: { current: false },
    healthWeightRows: { current: [] },
    mounted: { current: true },
  };
  const calls = { insert: [], update: [], delete: [] };
  const dependencies = {
    ExpoCrypto: { randomUUID: () => weightId },
    client: {},
    dog: { id: dogId },
    healthState: 'ready',
    mounted: state.mounted,
    pendingHealthMutation: state.pendingHealthMutation,
    healthMutationInFlight: state.healthMutationInFlight,
    healthWeightRows: state.healthWeightRows,
    isValidHealthWeightDate: workspaceData.isValidHealthWeightDate,
    isValidHealthWeightKg: workspaceData.isValidHealthWeightKg,
    insertHealthWeight: async (...args) => {
      calls.insert.push(args);
      return { status: 'saved', value: { ...args[1], actor_id: actorId } };
    },
    fetchHealthWeightById: async () => null,
    updateHealthWeight: async (...args) => {
      calls.update.push(args);
      return { status: 'saved', value: { id: args[2], dog_id: dogId, actor_id: actorId, ...args[3] } };
    },
    deleteHealthWeight: async (...args) => {
      calls.delete.push(args);
      return { status: 'saved', value: null };
    },
    setHealthPending(value) { state.healthPending = value; },
    setHealthBusy(value) { state.healthBusy = value; },
    setHealthMessage(value) { state.healthMessage = value; },
    setHealthMessageError(value) { state.healthMessageError = value; },
    setHealthWeights(value) { state.rows = value; },
    reloadHealthWeights: async () => {},
  };
  Object.assign(dependencies, overrides);

  const functionSource = [
    extractFunction(workspaceSource, 'runHealthMutation'),
    extractFunction(workspaceSource, 'markHealthMutationSaved'),
    extractFunction(workspaceSource, 'saveHealthWeight'),
    extractFunction(workspaceSource, 'removeHealthWeight'),
    extractFunction(workspaceSource, 'retryHealthMutation'),
    extractFunction(workspaceSource, 'sameHealthWeight'),
  ].join('\n');
  const compiled = ts.transpileModule(functionSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  const error = compiled.diagnostics?.find((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.equal(error, undefined, error && ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  const buildHandlers = new Function(
    ...Object.keys(dependencies),
    `${compiled.outputText}\nreturn { runHealthMutation, saveHealthWeight, removeHealthWeight, retryHealthMutation };`,
  );
  return { handlers: buildHandlers(...Object.values(dependencies)), calls, state };
}

function extractFunction(source, name) {
  let start = source.indexOf(`async function ${name}(`);
  if (start === -1) start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Expected actual ${name} handler in ProductWorkspace`);
  const bodyStart = source.indexOf('{', start);
  assert.notEqual(bodyStart, -1, `Expected ${name} handler body`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = bodyStart; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (current === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (current === '*' && next === '/') { blockComment = false; index += 1; }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (current === '\\') escaped = true;
      else if (current === quote) quote = null;
      continue;
    }
    if (current === '/' && next === '/') { lineComment = true; index += 1; continue; }
    if (current === '/' && next === '*') { blockComment = true; index += 1; continue; }
    if (current === '\'' || current === '"' || current === '`') { quote = current; continue; }
    if (current === '{') depth += 1;
    else if (current === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  assert.fail(`Could not find the end of ${name} handler`);
}

function deferredResult() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function jsonResponse(value, status = 200) {
  return Response.json(value, { status });
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
