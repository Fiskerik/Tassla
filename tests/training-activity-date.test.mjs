import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { registerHooks } from 'node:module';

const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const workspaceData = await import('../src/data/workspace-data.ts');
const activityModel = await import('../src/features/home/daily-activity-model.ts');
hook.deregister();

const baseUrl = 'https://local-test.supabase.invalid';
const dog = { id: '11111111-1111-4111-8111-111111111111', name: 'Milo', breed_id: 'mixed', birth_date: '2026-08-01' };
const versionId = '22222222-2222-4222-8222-222222222222';
const stepId = '33333333-3333-4333-8333-333333333333';
const completionAt = '2026-10-13T00:30:00.000Z';

test('workspace saved progress projects into the selected local activity day without a duplicate completion field', async () => {
  const { client, requests } = localClient(({ url }) => {
    if (url.pathname === '/rest/v1/content_versions') return jsonResponse([{
      id: versionId, content_id: '44444444-4444-4444-8444-444444444444', version: 1, status: 'published',
      title: 'Lugn vardag', body: 'Synthetic only.', min_age_weeks: 0, max_age_weeks: null, sources: ['synthetic test'], is_ai_generated: true,
      content_items: { slug: 'lugn-vardag', content_type: 'training_program' }, content_breed_targets: [],
    }]);
    if (url.pathname === '/rest/v1/training_progress') return jsonResponse([{
      dog_id: dog.id, program_version_id: versionId, step_id: stepId, completed_at: completionAt,
    }]);
    if (url.pathname === '/rest/v1/training_steps') return jsonResponse([{
      id: stepId, program_version_id: versionId, position: 1, title: 'Stanna lugnt', instruction: 'Synthetic only.',
    }]);
    throw new Error(`Unexpected request ${url.pathname}`);
  });
  try {
    const workspace = await workspaceData.fetchTrainingWorkspace(client, dog, 10);
    const program = workspace.programs[0];
    assert.equal(program.currentAgeBreedMatch, true);
    assert.deepEqual(program.completedStepIds, [stepId]);
    assert.deepEqual(program.completedAtByStepId, { [stepId]: completionAt });
    const stamp = activityModel.trainingProgressStamp(dog.id, program, stepId);
    assert.ok(stamp);
    assert.equal(activityModel.isTrainingCompletionForDay(stamp, {
      dogId: dog.id, programVersionId: versionId, stepId,
    }, '2026-10-12', 'America/Los_Angeles'), true);
    assert.equal(activityModel.isTrainingCompletionForDay(stamp, {
      dogId: dog.id, programVersionId: versionId, stepId,
    }, '2026-10-13', 'America/Los_Angeles'), false);
    assert.ok(requests.every(({ method }) => method === 'GET'));
  } finally { await client.auth.dispose(); }
});

function localClient(handler) {
  const requests = [];
  const client = createClient(baseUrl, 'synthetic-publishable-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      const request = { method: init.method ?? 'GET', url };
      requests.push(request);
      return handler(request);
    } },
  });
  return { client, requests };
}

function jsonResponse(value, status = 200) { return Response.json(value, { status }); }
