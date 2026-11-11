import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mergeTrainingReadback, updateTrainingPending } from '../src/features/home/training-readback.ts';
import { trainingProgressionPresentation } from '../src/features/training/training-progression.ts';

const dog = 'dog-a', version = 'version-a';
const journey = { id:'journey', dog_id:dog, program_version_id:version, active_step_id:'step', state:'active', last_operation_id:'op', created_at:'2026-10-24T12:00:00Z', updated_at:'2026-10-24T12:00:00Z' };
const milestone = { id:'m', journey_id:'journey', dog_id:dog, program_version_id:version, step_id:'step', confirmation_operation_id:'op', confirmed_at:'2026-10-24T12:00:00Z' };
const before = { journeys:[journey], sessions:[], milestones:[milestone] };
const afterUndo = { journeys:[journey], sessions:[], milestones:[] };
const steps = [{ id:'step', title:'Övning' }];

test('a verified undo replaces only progression and preserves catalog, legacy data and timestamp', () => {
  const cache = { scope:'account:dog-a', updatedAt:123, value:{ programs:[{ id:version }], paused:['old'], progression:before, progressionState:'ready' } };
  const result = mergeTrainingReadback(cache, 'account:dog-a', dog, afterUndo);
  assert.equal(trainingProgressionPresentation(before,version,steps).allMilestonesConfirmed,true);
  assert.equal(trainingProgressionPresentation(result.value.progression,version,steps).allMilestonesConfirmed,false);
  assert.deepEqual(result.value.programs,cache.value.programs);
  assert.deepEqual(result.value.paused,cache.value.paused);
  assert.equal(result.updatedAt,123);
  assert.equal(cache.value.progression,before);
});

test('cross-scope and foreign-dog snapshots cannot be published', () => {
  const cache = { scope:'account:dog-a', updatedAt:123, value:{ progression:before, progressionState:'ready' } };
  assert.equal(mergeTrainingReadback(cache, 'account:dog-b', dog, afterUndo),null);
  assert.equal(mergeTrainingReadback(null, 'account:dog-a', dog, afterUndo),null);
  assert.equal(mergeTrainingReadback(cache, 'account:dog-a', dog, { ...afterUndo, journeys:[{ ...journey, dog_id:'dog-b' }] }),null);
});

test('old operation completions cannot clear a newer pending request; unknown keeps identity', () => {
  const pending = { key:{ operationId:'new', status:'pending', action:'undo' } };
  assert.equal(updateTrainingPending(pending,'key','old','clear'),pending);
  const unknown = updateTrainingPending(pending,'key','new','unknown');
  assert.deepEqual(unknown.key,{ operationId:'new', status:'unknown', action:'undo' });
  assert.deepEqual(updateTrainingPending(unknown,'key','new','clear'),{});
});

test('workspace publishes the verified readback before clearing pending and invalidates competing reads', async () => {
  const source = await readFile(new URL('../src/features/home/ProductWorkspace.tsx',import.meta.url),'utf8');
  const start=source.indexOf('async function applyProgressionAction('), end=source.indexOf('function retryProgressionOperation',start);
  const body=source.slice(start,end);
  assert.match(body,/const verified = outcome\.value\.workspace/);
  assert.match(body,/trainingGeneration\.current \+= 1;[\s\S]*dailyGeneration\.current \+= 1/);
  assert.ok(body.indexOf('setTraining(updated.value)') < body.indexOf("updateTrainingPending(current, pendingKey, operationId, 'clear')"));
  assert.match(body,/interruptedDaily\?\.scope === activeDailyScope[\s\S]*setDailyState\('error'\)/);
  assert.doesNotMatch(body,/await reloadTraining\(/);
});

// Run the production mutation closure with controllable read and write flights.
test('verified mutation wins over in-flight reads and publishes before pending clears', async () => {
  const h = await mutationHarness({ before, afterUndo, dog });
  const operation = h.context.apply({ programVersionId:version, kind:'undo' });
  assert.equal(h.pending().status,'pending');
  h.resolve({ status:'saved', value:{ workspace:afterUndo } });
  assert.equal(await operation,'saved');
  assert.equal(h.context.trainingSnapshotRef.current.value.progression,afterUndo);
  assert.equal(h.context.dailySnapshotRef.current.training.progression,afterUndo);
  assert.equal(h.context.trainingSnapshotRef.current.updatedAt,123);
  assert.equal(h.context.dailySnapshotRef.current.dailyUpdatedAt,456);
  assert.equal(h.trainingController.signal.aborted,true);
  assert.equal(h.dailyController.signal.aborted,true);
  assert.ok(h.trace.indexOf('training') < h.trace.lastIndexOf('pending'));
  assert.equal(h.pending(),undefined);
});

test('lost daily lease retains the same operation for explicit reconciliation', async () => {
  const h = await mutationHarness({ before, afterUndo, dog });
  const operation = h.context.apply({ programVersionId:version, kind:'undo' });
  h.context.trainingMutationLease.current = null;
  h.context.dailyLifetime.current = 'new-day';
  h.resolve({ status:'saved', value:{ workspace:afterUndo } });
  assert.equal(await operation,'unknown');
  assert.equal(h.pending().operationId,'operation-1');
  assert.equal(h.pending().status,'unknown');
  assert.equal(h.context.trainingSnapshotRef.current.value.progression,before);
  assert.equal(h.dailyController.signal.aborted,false);
});

async function mutationHarness({ before, dog }) {
  const vm = await import('node:vm');
  const ts = (await import('typescript')).default;
  const leaseSource = await readFile(new URL('../src/features/home/home-today.ts', import.meta.url), 'utf8');
  const leaseCode = leaseSource.slice(leaseSource.indexOf('export function createTrainingMutationLease(')).replaceAll('export function ', 'function ');
  const source = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
  const code = source.slice(source.indexOf('  function beginTrainingMutation('), source.indexOf('  function retryProgressionOperation('));
  const js = ts.transpileModule(`${leaseCode}\n${code}\nglobalThis.apply = applyProgressionAction;`, { compilerOptions:{ target:ts.ScriptTarget.ES2022 } }).outputText;
  let resolve;
  const result = new Promise(r => { resolve = r; });
  const trainingController = new AbortController(), dailyController = new AbortController(), trace = [];
  const ctx = {
    mounted:{current:true}, accountDeletionInvalidated:{current:false}, currentSelectionKeyRef:{current:'account:dog-a'},
    currentSelectionKey:'account:dog-a', currentTrainingOwnerDogScope:'account:dog-a', trainingMutationLease:{current:null},
    pendingTrainingProgressions:{}, training:{progressionState:'ready',progression:before},
    trainingSnapshotRef:{current:{scope:'account:dog-a',updatedAt:123,value:{programs:[],paused:[],progression:before,progressionState:'ready'}}},
    dailyLifetime:{current:'day-a'}, dailySnapshotRef:{current:{scope:'day-a',daily:{items:[]},dailyUpdatedAt:456,training:{programs:[],paused:[],progression:before,progressionState:'ready'}}},
    trainingGeneration:{current:0}, dailyGeneration:{current:0}, trainingReadFlight:{current:{controller:trainingController}},
    dailyReadFlight:{current:{scope:'day-a',controller:dailyController}}, dog:{id:dog}, client:{}, ExpoCrypto:{randomUUID:()=> 'operation-1'},
    applyTrainingProgressionOperation:()=>result, mergeTrainingReadback, updateTrainingPending,
    sameTrainingProgressionAction:()=>true, emptyTrainingProgressionWorkspace:()=>({journeys:[],sessions:[],milestones:[]}),
    progressionAnalyticsEvent:()=>null, analyticsService:{track:()=>{}},
  };
  for (const name of ['setTrainingSelectionKey','setTrainingState','setTrainingError','setDailyTrainingSnapshot','setDailyState','setDailyStateLifetime','setDailyRefreshError','setDailyRefreshing','setBusyStepKey']) ctx[name] = () => {};
  ctx.setTraining = value => { trace.push('training'); ctx.training = value; };
  ctx.setPendingTrainingProgressions = fn => { trace.push('pending'); ctx.pendingTrainingProgressions = fn(ctx.pendingTrainingProgressions); };
  vm.runInNewContext(js,ctx);
  return {context:ctx,resolve,trace,trainingController,dailyController,pending:()=>ctx.pendingTrainingProgressions['account:dog-a:version-a']};
}
