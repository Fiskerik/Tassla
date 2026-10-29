import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { registerHooks } from 'node:module';

const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const workspaceData = await import('../src/data/workspace-data.ts');
hook.deregister();

const baseUrl = 'https://local-test.supabase.invalid';
const dogId = '11111111-1111-4111-8111-111111111111';
const otherDogId = '22222222-2222-4222-8222-222222222222';
const versionId = '33333333-3333-4333-8333-333333333333';
const stepId = '44444444-4444-4444-8444-444444444444';
const operationId = '55555555-5555-4555-8555-555555555555';
const journeyId = '66666666-6666-4666-8666-666666666666';
const sessionId = '77777777-7777-4777-8777-777777777777';
const progressionMigration = await readFile(new URL('../supabase/migrations/202610240001_training_progression.sql', import.meta.url), 'utf8');

test('uncertain milestone undo retries the identical expected confirmation and preserves newer data', async () => {
  const milestoneId = '88888888-8888-4888-8888-888888888888';
  const state = {
    journeys: [{ id: journeyId, dog_id: dogId, program_version_id: versionId, active_step_id: stepId,
      state: 'active', last_operation_id: '99999999-9999-4999-8999-999999999999', created_at: '2026-10-24T10:00:00.000Z', updated_at: '2026-10-24T10:02:00.000Z' }],
    sessions: [], milestones: [{ id: milestoneId, journey_id: journeyId, dog_id: dogId, program_version_id: versionId,
      step_id: stepId, confirmation_operation_id: '99999999-9999-4999-8999-999999999999', confirmed_at: '2026-10-24T10:02:00.000Z' }],
  };
  const bodies = [];
  const { client } = createTestClient(async (request) => {
    if (request.url.pathname === '/rest/v1/rpc/undo_training_milestone') {
      bodies.push(request.body);
      if (bodies.length === 1) throw new TypeError('timeout before commit');
      state.journeys[0].last_operation_id = operationId;
      state.milestones = [];
      throw new TypeError('lost response after commit');
    }
    const table = request.url.pathname.split('/').at(-1);
    if (table.startsWith('training_')) return jsonResponse(state[table.replace('training_', '')]);
    throw new Error(`Unexpected request ${request.url.pathname}`);
  });
  try {
    const action = { kind: 'undo_step', programVersionId: versionId, stepId, expectedMilestoneId: milestoneId };
    assert.equal((await workspaceData.applyTrainingProgressionOperation(client, dogId, operationId, action)).status, 'unknown');
    assert.equal((await workspaceData.applyTrainingProgressionOperation(client, dogId, operationId, action)).status, 'saved');
    assert.deepEqual(bodies[0], { p_dog_id: dogId, p_program_version_id: versionId, p_operation_id: operationId,
      p_step_id: stepId, p_expected_milestone_id: milestoneId });
    assert.deepEqual(bodies[1], bodies[0]);
  } finally { await client.auth.dispose(); }
});

test('uncertain progression retries keep the same operation and confirm exact dog-scoped readback', async () => {
  const state = { journeys: [], sessions: [], milestones: [] };
  const requests = [];
  let rpcCount = 0;
  const { client } = createTestClient(async (request) => {
    requests.push(request);
    if (request.url.pathname === '/rest/v1/rpc/apply_training_operation') {
      rpcCount += 1;
      assert.equal(request.method, 'POST');
      assert.deepEqual(request.body, {
        p_dog_id: dogId,
        p_program_version_id: versionId,
        p_operation_id: operationId,
        p_action: 'record_session',
        p_step_id: stepId,
        p_feedback: 'practice_more',
      });
      if (rpcCount === 1) throw new TypeError('simulated request timeout before commit');
      state.journeys = [{ id: journeyId, dog_id: dogId, program_version_id: versionId, active_step_id: stepId,
        state: 'active', last_operation_id: operationId, created_at: '2026-10-24T10:00:00.000Z', updated_at: '2026-10-24T10:02:00.000Z' }];
      state.sessions = [{ id: sessionId, journey_id: journeyId, dog_id: dogId, program_version_id: versionId,
        step_id: stepId, operation_id: operationId, feedback: 'practice_more', performed_at: '2026-10-24T10:02:00.000Z' }];
      throw new TypeError('simulated lost response after commit');
    }
    const table = request.url.pathname.split('/').at(-1);
    if (table === 'training_journeys' || table === 'training_sessions' || table === 'training_milestones') {
      assert.equal(request.method, 'GET');
      assert.equal(request.url.searchParams.get('dog_id'), `eq.${dogId}`);
      return jsonResponse(state[table.replace('training_', '')] ?? []);
    }
    throw new Error(`Unexpected request ${request.method} ${request.url.pathname}`);
  });

  try {
    const action = { kind: 'record_session', programVersionId: versionId, stepId, feedback: 'practice_more' };
    const first = await workspaceData.applyTrainingProgressionOperation(client, dogId, operationId, action);
    assert.equal(first.status, 'unknown', 'no readback means the operation must remain uncertain');

    const second = await workspaceData.applyTrainingProgressionOperation(client, dogId, operationId, action);
    assert.equal(second.status, 'saved', 'the exact stored session proves the retry committed');
    assert.equal(second.value.workspace.sessions[0].operation_id, operationId);
    assert.equal(rpcCount, 2);
    const rpcBodies = requests.filter((request) => request.url.pathname === '/rest/v1/rpc/apply_training_operation').map((request) => request.body);
    assert.deepEqual(rpcBodies[0], rpcBodies[1], 'recovery must retry the same operation and payload');
  } finally {
    await client.auth.dispose();
  }
});

test('progression reads reject rows that escape the requested dog scope', async () => {
  const { client } = createTestClient(({ url }) => {
    const table = url.pathname.split('/').at(-1);
    if (table === 'training_journeys') return jsonResponse([{ id: journeyId, dog_id: otherDogId, program_version_id: versionId,
      active_step_id: stepId, state: 'active', last_operation_id: operationId, created_at: '2026-10-24T10:00:00.000Z', updated_at: '2026-10-24T10:02:00.000Z' }]);
    if (table === 'training_sessions' || table === 'training_milestones') return jsonResponse([]);
    throw new Error(`Unexpected request ${url.pathname}`);
  });

  try {
    await assert.rejects(workspaceData.fetchTrainingProgressionWorkspace(client, dogId), /another dog scope/);
  } finally {
    await client.auth.dispose();
  }
});

test('progression reads page the complete saved-session history with a stable timestamp and id order', async () => {
  const timestamp = '2026-10-24T10:00:00.000Z';
  const sessions = Array.from({ length: 45 }, (_, index) => ({
    id: `80000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    journey_id: journeyId,
    dog_id: dogId,
    program_version_id: versionId,
    step_id: stepId,
    operation_id: `90000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    feedback: 'practice_more',
    performed_at: timestamp,
  }));
  const sessionRequests = [];
  const { client } = createTestClient(({ url }) => {
    const table = url.pathname.split('/').at(-1);
    if (table === 'training_journeys' || table === 'training_milestones') return jsonResponse([]);
    if (table === 'training_sessions') {
      assert.equal(url.searchParams.get('dog_id'), `eq.${dogId}`);
      assert.equal(url.searchParams.get('order'), 'performed_at.asc,id.asc');
      const offset = Number(url.searchParams.get('offset') ?? 0);
      const limit = Number(url.searchParams.get('limit') ?? 40);
      sessionRequests.push({ offset, limit });
      return jsonResponse(sessions.slice(offset, offset + limit));
    }
    throw new Error(`Unexpected request ${url.pathname}`);
  });

  try {
    const workspace = await workspaceData.fetchTrainingProgressionWorkspace(client, dogId);
    assert.equal(workspace.sessions.length, 45, 'saved passes beyond the first REST page remain countable');
    assert.deepEqual(sessionRequests.map(({ offset }) => offset), [0, 40]);
    assert.equal(new Set(workspace.sessions.map((row) => row.id)).size, 45);
  } finally {
    await client.auth.dispose();
  }
});

test('new progression writes lock the publication row before validating it', () => {
  const statusCheck = progressionMigration.indexOf('select v.status, i.content_type into v_version_status, v_content_type');
  const lock = progressionMigration.indexOf('for share of v;', statusCheck);
  const publishedGuard = progressionMigration.indexOf("if v_version_status is distinct from 'published'", statusCheck);
  const firstWrite = progressionMigration.indexOf("if p_action = 'start_or_resume' then", publishedGuard);
  assert.ok(statusCheck >= 0 && lock > statusCheck && publishedGuard > lock && firstWrite > publishedGuard,
    'publication validation holds a conflicting row lock before any progression write');
});

function createTestClient(handler) {
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      const request = { method: init.method ?? 'GET', url, signal: init.signal,
        body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined };
      return handler(request);
    } },
  });
  return { client };
}

function jsonResponse(value, status = 200) {
  return Response.json(value, { status });
}
