import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import * as model from '../src/features/puppy-log/log-model.ts';

const source = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const merge = source.match(/function mergeConfirmedLogRows[\s\S]*?(?=\n\s*function shouldClearDailyMutationFeedback)/)[0];
const loader = source.match(/const reloadEvents = useCallback\([\s\S]*?\n  \}, \[client, currentLogLifetime, dog\.id, serializeEventRead\]\);/)[0];
const mutation = source.slice(source.indexOf('  function releaseConfirmedInsertFlight'), source.indexOf('  function addEvent('));
const retry = source.slice(source.indexOf('  async function retryLogMutation()'), source.indexOf('  async function markHealthMutationSaved('));
const code = ts.transpileModule(`${merge}\n${loader}\n${mutation}\n${retry}`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; };
const tick = () => new Promise((resolve) => setImmediate(resolve));
function harness() {
  const ref = (current) => ({current});
  const read = [], writes = [], lookups = [], output = { busy:false, rows:[], mutation:null };
  const refs = { mounted:ref(true), accountDeleteInFlight:ref(false), accountDeletionInvalidated:ref(false), logLifetime:ref('owner:dog'), logReadFlight:ref(null), logReadGeneration:ref(0), logPaginationFlight:ref(null), logPaginationGeneration:ref(0), eventRows:ref([]), logDataLifetimeRef:ref('owner:dog'), logPinnedEventIds:ref(new Set()), logActiveEditorId:ref(null), logPageCursor:ref(null), logHasMore:ref(false), pendingLogMutation:ref(null), logMutationFlight:ref(null) };
  let token=0;
  const env = { ...model, ...refs, useCallback:(fn)=>fn, currentLogLifetime:'owner:dog', setLoadingMore:()=>{}, setLoadMoreError:()=>{}, setLogRefreshing:()=>{}, setLogRefreshError:()=>{}, setLogStateLifetime:()=>{}, setLogState:()=>{}, setLogLoadedThrough:()=>{}, setEvents:(x)=>{output.rows=x}, setLogDataLifetime:()=>{}, setHasMore:()=>{}, setLogBusy:(x)=>{output.busy=x}, setQuickLogMutation:(x)=>{output.mutation=x}, serializeEventRead:(fn)=>fn(), fetchDogEvents:()=>{const d=deferred();read.push(d);return d.promise}, client:{}, dog:{id:'dog'}, PAGE_SIZE:40, dogEventCursor:(row)=>({id:row.id,occurredAt:row.occurred_at}), invalidateInsightsForLogMutation:()=>{}, ExpoCrypto:{randomUUID:()=>String(++token)}, insertDogEvent:async(_client,operation)=>{const d=deferred();writes.push({operation,...d});return d.promise}, updateDogEvent:()=>{}, deleteDogEvent:async()=>({status:'saved',value:null}), logState:'ready', analyticsService:{track:()=>Promise.resolve()}, fetchDogEventById:()=>{const d=deferred();lookups.push(d);return d.promise}, matchesDogEventOperation:(row,operation)=>row.id===operation.id&&row.dog_id===operation.dog_id&&row.event_type===operation.event_type&&row.occurred_at===operation.occurred_at&&row.duration_minutes===operation.duration_minutes&&row.description===operation.description, toLogEvent:(row)=>row, toQuickLogMutationView:(m,status)=>({id:m.operation?.id??m.id,status,kind:m.kind}) };
  const names=Object.keys(env); const factory=new Function(...names, `${code}\nreturn {runLogMutation,reloadEvents,retryLogMutation};`);
  return { ...refs, ...factory(...names.map((key)=>env[key])), read, writes, lookups, output };
}
const op = (id) => ({kind:'insert', lifetime:'owner:dog', operation:{id,dog_id:'dog',event_type:'food',occurred_at:`2026-11-11T12:00:0${id}Z`,duration_minutes:null,description:null,accident_kinds:null}});
const saved = (operation) => ({status:'saved',value:{id:operation.id,dog_id:operation.dog_id,event_type:operation.event_type,occurred_at:operation.occurred_at,duration_minutes:operation.duration_minutes,description:operation.description,accident_kinds:operation.accident_kinds}});

test('confirmed insert releases only its flight and stale read preserves both inserts; follow-up reads again', async()=>{
  const h=harness(), a=op('1'), b=op('2'); h.pendingLogMutation.current=a;
  const first=h.runLogMutation(a); h.writes[0].resolve(saved(a.operation)); await tick();
  assert.equal(h.logMutationFlight.current,null); assert.equal(h.output.busy,false); assert.equal(h.read.length,1);
  h.pendingLogMutation.current=b; const second=h.runLogMutation(b); const token=h.logMutationFlight.current.token;
  h.writes[1].resolve(saved(b.operation)); await tick(); assert.equal(h.read.length,1);
  h.read[0].resolve([saved(a.operation).value]); await tick(); assert.deepEqual(h.output.rows.map(x=>x.id).sort(),['1','2']);
  assert.equal(h.read.length,2); h.read[1].resolve([saved(a.operation).value,saved(b.operation).value]);
  await Promise.all([first,second]); assert.deepEqual(h.output.rows.map(x=>x.id).sort(),['1','2']); assert.equal(h.logMutationFlight.current,null); assert.ok(token);
});

test('an earlier failed read cannot clear a later in-flight write', async()=>{
  const h=harness(), a=op('1'), b=op('2'); h.pendingLogMutation.current=a; const first=h.runLogMutation(a);
  h.writes[0].resolve(saved(a.operation)); await tick(); h.pendingLogMutation.current=b; const second=h.runLogMutation(b);
  const token=h.logMutationFlight.current.token; h.read[0].reject(Error('offline')); await first;
  assert.equal(h.logMutationFlight.current.token,token); assert.equal(h.output.busy,true);
  h.writes[1].resolve({status:'unknown'}); await tick();
  assert.equal(h.logMutationFlight.current.token,token); assert.equal(h.output.busy,true);
  h.lookups[0].resolve(null); await second;
  assert.equal(h.output.mutation,null); assert.equal(h.pendingLogMutation.current,null);
});

test('late read cannot republish after lifetime change or account deletion', async()=>{
  for (const mode of ['scope','unmount','delete-start','deleted']) {
    const h=harness(); const p=h.reloadEvents(); await tick();
    if(mode==='scope') h.logLifetime.current='other:dog';
    if(mode==='unmount') h.mounted.current=false;
    if(mode==='delete-start') h.accountDeleteInFlight.current=true;
    if(mode==='deleted') h.accountDeletionInvalidated.current=true;
    h.read[0].resolve([{id:'old',occurred_at:'2026-11-11T00:00:00Z'}]); assert.equal(await p,false); assert.deepEqual(h.output.rows,[]);
  }
});

test('a confirmed undo during an older read cannot be resurrected', async()=>{
  const h=harness(), a=op('1'); const read=h.reloadEvents(); await tick();
  h.pendingLogMutation.current=a; const insert=h.runLogMutation(a); h.writes[0].resolve(saved(a.operation)); await tick();
  const undo={kind:'undo',id:'1',lifetime:'owner:dog'}; h.pendingLogMutation.current=undo; const deleted=h.runLogMutation(undo); await tick();
  h.read[0].resolve([saved(a.operation).value]); await tick(); assert.deepEqual(h.output.rows,[]);
  assert.equal(h.read.length,2); h.read[1].resolve([]); await Promise.all([read,insert,deleted]); assert.deepEqual(h.output.rows,[]);
});


test('retry finding the same confirmed row releases before readback', async()=>{
  const h=harness(), a=op('1'); h.pendingLogMutation.current=a;
  const retry=h.retryLogMutation(); h.lookups[0].resolve(saved(a.operation).value); await tick();
  assert.equal(h.logMutationFlight.current,null); assert.equal(h.output.busy,false); assert.equal(h.output.rows[0].id,'1');
  h.read[0].resolve([saved(a.operation).value]); assert.equal(await retry,true);
});

test('failed and unknown inserts are checked once automatically and never leave the log blocked', async()=>{
  for (const status of ['failed','unknown']) {
    const h=harness(), a=op('1'); h.pendingLogMutation.current=a; const write=h.runLogMutation(a);
    h.writes[0].resolve({status}); await tick();
    assert.equal(h.writes.length,1); assert.equal(h.lookups.length,1);
    assert.equal(h.output.mutation.status,'pending');
    assert.equal(model.canStartLogMutation(Boolean(h.pendingLogMutation.current),Boolean(h.logMutationFlight.current)),false);
    h.lookups[0].resolve(null); assert.equal(await write,false);
    assert.equal(h.pendingLogMutation.current,null); assert.equal(h.output.mutation,null);
    assert.equal(h.logMutationFlight.current,null); assert.equal(h.output.busy,false);
    assert.equal(model.canStartLogMutation(Boolean(h.pendingLogMutation.current),Boolean(h.logMutationFlight.current)),true);
    assert.equal(h.read.length,1);
  }
});

test('uncertain insert readback confirms a full matching row without another insert', async()=>{
  const h=harness(), a=op('1'); h.pendingLogMutation.current=a; const write=h.runLogMutation(a);
  h.writes[0].resolve({status:'unknown'}); await tick();
  h.lookups[0].resolve(saved(a.operation).value);
  assert.equal(await write,true);
  assert.equal(h.writes.length,1); assert.equal(h.pendingLogMutation.current,null);
  assert.equal(h.output.mutation.status,'saved'); assert.equal(h.output.rows[0].id,'1');
});

test('automatic insert readback cannot publish after the dog lifetime changes', async()=>{
  const h=harness(), a=op('1'); h.pendingLogMutation.current=a; const write=h.runLogMutation(a);
  h.writes[0].resolve({status:'unknown'}); await tick();
  h.logLifetime.current='owner:another-dog';
  h.lookups[0].resolve(saved(a.operation).value);
  assert.equal(await write,false);
  assert.equal(h.writes.length,1);
  assert.deepEqual(h.output.rows,[]);
});

test('the real account deletion guard blocks both kinds of active log read', async()=>{
  const start=source.indexOf('  async function handleAccountDeletion():');
  const stop=source.indexOf('    accountDeleteInFlight.current = true;',start);
  const guard=source.slice(start,stop)+'    return { status: "guard-passed" };\n  }';
  const js=ts.transpileModule(guard,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  const empty={current:null}, ref=(value)=>({current:value});
  const env={session:{user:{id:'owner'},access_token:'token'},accountGeneration:1,accountDeleteInFlight:ref(false),accountDeleteBusy:false,accountDeletionInvalidated:ref(false),accountDeleteStatus:'idle',mounted:ref(true),isCurrentAccount:()=>true,pendingLogMutation:empty,pendingHealthMutation:ref(new Map()),pendingHealthHistoryMutation:empty,pendingPlannedHealthMutation:empty,pendingProfileMutation:empty,logMutationFlight:empty,logReadFlight:ref(null),logPaginationFlight:ref(null),healthMutationInFlight:empty,healthHistoryMutationInFlight:empty,plannedHealthMutationInFlight:empty,profileMutationInFlight:empty,trainingMutationLease:empty,dailyMutationBlocksAccountDeletion:()=>false,dailyMutationInFlight:empty,dailyMutationForOwner:()=>null,dailyMutationStore:{getSnapshot:()=>new Map()},currentDailyOwnerScope:'owner',notificationBusy:false,attributionBusy:false,setAccountDeleteStatus:()=>{}};
  const names=Object.keys(env), run=new Function(...names,`${js}\nreturn handleAccountDeletion;`)(...names.map(key=>env[key]));
  for(const name of ['logReadFlight','logPaginationFlight']) {
    env[name].current={scope:'owner:dog'};
    assert.equal((await run()).status,'failed');
    env[name].current=null;
  }
  assert.equal((await run()).status,'guard-passed');
});

test('automatic insert readback never confirms a missing, changed or unreadable row', async()=>{
  for (const status of ['failed','unknown']) {
    for (const result of ['missing','changed','error']) {
      const h=harness(), a=op('1'); h.pendingLogMutation.current=a; const write=h.runLogMutation(a);
      h.writes[0].resolve({status}); await tick();
      if (result==='error') h.lookups[0].reject(Error('offline'));
      else h.lookups[0].resolve(result==='missing' ? null : {...saved(a.operation).value,event_type:'water'});
      assert.equal(await write,false);
      assert.equal(h.writes.length,1);
      assert.equal(h.output.mutation,null);
      assert.equal(h.pendingLogMutation.current,null);
      assert.equal(h.logMutationFlight.current,null);
    }
  }
});

test('legacy insert lookup with absent or changed row never replays and releases the log', async()=>{
  for (const result of ['missing','changed','error']) {
    const h=harness(), a=op('1'); h.pendingLogMutation.current=a;
    h.output.mutation={id:a.operation.id,kind:'add',status:'unsure'};
    const retry=h.retryLogMutation();
    if (result==='error') h.lookups[0].reject(Error('offline'));
    else h.lookups[0].resolve(result==='missing' ? null : {...saved(a.operation).value,event_type:'water'});
    assert.equal(await retry,false);
    assert.equal(h.writes.length,0);
    assert.equal(h.output.mutation,null);
    assert.equal(h.pendingLogMutation.current,null);
    assert.equal(h.logMutationFlight.current,null);
    assert.equal(h.output.busy,false);
    assert.equal(h.read.length,1);
  }
});

test('insert status checks are single-flight and ignore responses after a dog switch', async()=>{
  const h=harness(), a=op('1'); h.pendingLogMutation.current=a;
  const retry=h.retryLogMutation();
  assert.equal(await h.retryLogMutation(),false);
  assert.equal(h.lookups.length,1);
  h.logLifetime.current='owner:other-dog';
  h.lookups[0].resolve(saved(a.operation).value);
  assert.equal(await retry,false);
  assert.equal(h.writes.length,0);
  assert.deepEqual(h.output.rows,[]);
});

test('rapid presses and duplicate confirmation retain the existing guard',()=>{
  const base={blocked:false,force:false,lastSubmitAt:10000,recentDuplicate:false};
  assert.equal(model.decideQuickLogPress({...base,timestamp:11999}),'blocked');
  assert.equal(model.decideQuickLogPress({...base,timestamp:12000}),'submit');
  assert.equal(model.decideQuickLogPress({...base,timestamp:12000,recentDuplicate:true}),'confirm-duplicate');
  assert.equal(model.decideQuickLogPress({...base,timestamp:12000,blocked:true}),'blocked');
});

test('undo only targets the current confirmed insert and respects a later flight', async()=>{
  const start=source.indexOf('  async function undoQuickLog('), stop=source.indexOf('  function cancelLogMutation()',start);
  const js=ts.transpileModule(source.slice(start,stop),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  const calls=[], pending={current:null}, flight={current:null};
  const run=new Function('quickLogMutation','pendingLogMutation','logMutationFlight','deleteEvent',`${js}\nreturn undoQuickLog;`)(
    {kind:'add',id:'new',status:'saved'},pending,flight,async(...args)=>{calls.push(args)});
  await run('old'); assert.deepEqual(calls,[]);
  flight.current={token:'new'}; await run('new'); assert.deepEqual(calls,[]);
  flight.current=null; await run('new'); assert.deepEqual(calls,[['new','undo']]);
});
