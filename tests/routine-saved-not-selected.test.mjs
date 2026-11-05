import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { createRoutineNotSelectedStore, routineTemplateWithUnknownNotice } from '../src/features/home/daily-activity-recovery.ts';

const hook=registerHooks({resolve(specifier, context, next) { return next(specifier.startsWith('.')&&!/\.[a-z0-9]+$/i.test(specifier)?`${specifier}.ts`:specifier,context); }});
const { createRoutineAndSelectForToday, dailyRoutineCreationScopeMatches }=await import('../src/features/home/daily-activity-data.ts');
hook.deregister();
const source=await readFile(new URL('../src/features/home/ProductWorkspace.tsx',import.meta.url),'utf8');
const start=source.indexOf('  async function createRoutineForToday('), end=source.indexOf('  function retryDailyMutation()',start);
const js=ts.transpileModule(source.slice(start,end)+'\nglobalThis.create = createRoutineForToday;', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const input={id:'routine-a',label:'Morgon',checklist:[{id:'i',label:'Mat'}],repeat_unit:null,repeat_interval:null,repeat_weekdays:null};

function harness({createResults=[{status:'saved'}], dayResult={status:'saved'}, mounted=true}={}) {
  const store=createRoutineNotSelectedStore(), calls=[], savedOperations=[];
  let accountValid=true, currentOwner='owner', currentGeneration=4, uuid=0;
  const ctx={session:{user:{id:'owner'}},accountGeneration:4,dog:{id:'dog-a',name:'Doos'},currentDailyOwnerScope:'owner',
    currentSelectionKey:'selection-a',currentDailyLifetime:'day-1',currentDailyOwnerScopeRef:{current:'owner'},currentSelectionKeyRef:{current:'selection-a'},
    dailyLifetime:{current:'day-1'},dailyDateKey:'2026-11-05',dailyTimeZone:'Europe/Stockholm',mounted:{current:mounted},accountDeletionInvalidated:{current:false},client:{},
    ExpoCrypto:{randomUUID:()=>`id-${++uuid}`},routineNotSelectedStore:store,routineTemplateWithUnknownNotice,
    isCurrentAccount:(owner,generation)=>accountValid&&currentOwner===owner&&currentGeneration===generation,
    createRoutineAndSelectForToday,dailyRoutineCreationScopeMatches,createdRoutineDaySelectionRecoveryCopy:{},
    createDailyRoutine:async (_client,routine,zone)=>{
      calls.push({type:'template',routine,zone});
      const outcome=await Promise.resolve(createResults.shift()??{status:'saved'});
      if (outcome instanceof Error) throw outcome;
      return outcome.status==='saved'?{status:'saved',value:{...routine}}:outcome;
    },
    addRoutineToDay:async (_client,row,_skip,mutationId)=>{calls.push({type:'day',row,mutationId});return dayResult;},
    runDailyMutation:async (key,operation)=>{savedOperations.push({key,operation});try{return await operation();}catch{return {status:'unknown'};}},
  };
  vm.runInNewContext(js,ctx);
  return {ctx,store,calls,savedOperations,notice:()=>store.getSnapshot().get(store.sessionKey('owner',4))??[],
    account:(owner,generation)=>{currentOwner=owner;currentGeneration=generation;},invalidate:()=>{accountValid=false;}};
}

test('scope changes after verified template save do not add a day and create one owner/dog/date notice',async()=>{
  const h=harness();h.ctx.dailyLifetime.current='day-2';
  assert.equal((await h.ctx.create(input)).status,'saved');
  assert.deepEqual(h.calls.map(c=>c.type),['template']);
  assert.equal(h.notice().length,1);
  assert.equal(h.notice()[0].dogId,'dog-a');assert.equal(h.notice()[0].dateKey,'2026-11-05');
  assert.equal(h.notice()[0].timeZone,'Europe/Stockholm');
});

test('attempted but unsent day selection gets a notice; sent saved, failed or unknown do not',async()=>{
  for(const [result,expected] of [[undefined,1],[{status:'saved'},0],[{status:'failed'},0],[{status:'unknown'},0]]){
    const h=harness();const original=h.ctx.runDailyMutation;
    h.ctx.runDailyMutation=async (key,op)=>key.startsWith('select-routine:')&&result===undefined?undefined:original(key,op);
    h.ctx.addRoutineToDay=async (...args)=>{h.calls.push({type:'day',row:args[1]});return result;};
    await h.ctx.create(input);
    assert.equal(h.notice().length,expected,JSON.stringify(result));
  }
  const repeated=harness();await repeated.ctx.create({...input,repeat_unit:'day',repeat_interval:1});assert.equal(repeated.notice().length,0);
});

test('unknown or thrown template uses exactly the same saved closure; only verified retry creates a notice',async()=>{
  for(const first of [{status:'unknown'},new Error('timeout')]){
    const h=harness({createResults:[first,{status:'unknown'},{status:'saved'}]});
    assert.equal((await h.ctx.create(input)).status,'unknown');
    const operation=h.savedOperations[0].operation;
    assert.equal((await operation()).status,'unknown');assert.equal(h.notice().length,0);
    assert.equal((await operation()).status,'saved');assert.equal(h.notice().length,1);
    assert.deepEqual(h.calls.map(c=>c.type),['template','template','template']);
    assert.ok(h.calls.every(c=>c.routine.id===input.id));
    const notice=h.notice()[0];h.store.dismiss('owner',4,notice);
    await operation();assert.equal(h.notice().length,0,'dedupe survives dismissal');
  }
  const h=harness({createResults:[{status:'unknown'},{status:'failed'}]});await h.ctx.create(input);await h.savedOperations[0].operation();assert.equal(h.notice().length,0);
});

test('notices survive a dog-keyed unmount but are isolated from session, owner and confirmed deletion',async()=>{
  const h=harness({createResults:[{status:'unknown'},{status:'saved'}]});await h.ctx.create(input);h.ctx.mounted.current=false;
  await h.savedOperations[0].operation();assert.equal(h.notice().length,1);
  assert.equal(h.store.getSnapshot().get(h.store.sessionKey('owner',5)),undefined);
  assert.equal(h.store.getSnapshot().get(h.store.sessionKey('another',4)),undefined);
  h.store.invalidateDog('owner',4,'dog-a');assert.equal(h.notice().length,0);
  const other=harness({createResults:[{status:'unknown'},{status:'saved'}]});await other.ctx.create(input);other.store.invalidateDog('owner',4,'dog-a');
  await other.savedOperations[0].operation();assert.equal(other.notice().length,0);
  const signedOut=harness({createResults:[{status:'unknown'},{status:'saved'}]});await signedOut.ctx.create(input);signedOut.store.clearOwner('owner');
  await signedOut.savedOperations[0].operation();assert.equal(signedOut.notice().length,0);
  const switched=harness({createResults:[{status:'unknown'},{status:'saved'}]});await switched.ctx.create(input);switched.account('owner',5);
  await switched.savedOperations[0].operation();assert.equal(switched.notice().length,0);
});

test('FIFO notices and compare-by-identity dismissal preserve later notices and do not touch pending writes',async()=>{
  const h=harness();h.ctx.dailyLifetime.current='day-2';await h.ctx.create(input);await h.ctx.create({...input,id:'routine-b',label:'Kväll'});
  assert.deepEqual(h.notice().map(n=>n.routineId),['routine-a','routine-b']);
  const first=h.notice()[0], second=h.notice()[1];h.store.dismiss('owner',4,first);h.store.dismiss('owner',4,first);
  assert.equal(h.notice()[0],second);assert.equal(h.savedOperations.length,2);
  h.store.dismiss('owner',4,second);assert.equal(h.notice().length,0);
});

test('a notice failure cannot turn a verified template save into an unknown result',async()=>{
  let calls=0;
  const operation=routineTemplateWithUnknownNotice(async()=>({status:++calls===1?'unknown':'saved'}),()=>{throw new Error('notice error');});
  assert.equal((await operation()).status,'unknown');
  assert.equal((await operation()).status,'saved');
});


test('a delayed template save after A to B survives unmount but never publishes after account change or dog deletion',async()=>{
  for(const scenario of ['dog-switch','account-switch','dog-deleted']){
    let resolve;
    const response=new Promise(r=>{resolve=r;});
    const h=harness({createResults:[response]});
    const work=h.ctx.create(input);
    h.ctx.mounted.current=false;
    h.ctx.currentSelectionKeyRef.current='selection-b';h.ctx.dailyLifetime.current='day-b';
    if(scenario==='account-switch')h.account('other',5);
    if(scenario==='dog-deleted')h.store.invalidateDog('owner',4,'dog-a');
    resolve({status:'saved'});
    assert.equal((await work).status,'saved');
    assert.equal(h.notice().length,scenario==='dog-switch'?1:0,scenario);
    assert.deepEqual(h.calls.map(c=>c.type),['template']);
  }
});

test('notice visibility defers to pending recovery and both confirmed dog-delete paths invalidate the dog',()=>{
  assert.match(source,/!showDailyRecoveryBanner && !pendingDailyWriteForOwner && !dailyBusyKey/);
  assert.equal((source.match(/routineNotSelectedStore\.invalidateDog\(ownerId, accountGeneration, dog\.id\)/g)??[]).length,2);
  assert.match(source,/routineNotSelectedStore\.clearOwner\(ownerId\)/);
  assert.match(source,/routineNotSelectedStore\.clearSession\(ownerId, accountGeneration\)/);
});


test('a delayed old-session signout clears only its own notices and cannot invalidate the new session',()=>{
  const store=createRoutineNotSelectedStore();
  const old=store.capture('owner',4,'dog-a'), newer=store.capture('owner',5,'dog-a');
  const notice=(generation,id)=>({ownerId:'owner',accountGeneration:generation,dogId:'dog-a',dogName:'Doos',routineId:id,routineName:'Morgon',dateKey:'2026-11-05',timeZone:'Europe/Stockholm'});
  store.enqueue(old,notice(4,'old'));store.enqueue(newer,notice(5,'new'));
  store.clearSession('owner',4);
  store.enqueue(old,notice(4,'late-old'));
  store.enqueue(newer,notice(5,'later-new'));
  assert.equal(store.getSnapshot().get(store.sessionKey('owner',4)),undefined);
  assert.deepEqual(store.getSnapshot().get(store.sessionKey('owner',5)).map(n=>n.routineId),['new','later-new']);
});


test('actual notice action refuses stale dog, session, pending work and account deletion',()=>{
  const from=source.indexOf('  function openRoutineNotice('), to=source.indexOf('  function openHomeProgress()',from);
  assert.ok(from>=0&&to>from);
  const compiled=ts.transpileModule(source.slice(from,to)+'\nglobalThis.open = openRoutineNotice;', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const notice={ownerId:'owner',accountGeneration:4,dogId:'dog-a',dogName:'Doos',routineId:'r',routineName:'Morgon',dateKey:'2026-11-05',timeZone:'Europe/Stockholm'};
  let count=0;const pending=new Map();
  const c={session:{user:{id:'owner'}},accountGeneration:4,mounted:{current:true},isCurrentAccount:(owner,generation)=>owner==='owner'&&generation===4,
    accountDeletionInvalidated:{current:false},accountDeleteInFlight:{current:false},accountDeleteBusy:false,accountDeleteStatus:'idle',navigationPageRef:{current:'home'},
    currentSelectionKeyRef:{current:'dog-a'},currentSelectionKey:'dog-a',dog:{id:'dog-a'},ownedDogs:[{id:'dog-a'}],dailyMutationStore:{getSnapshot:()=>pending},
    dailyMutationInFlight:{current:false},currentDailyOwnerScope:'owner',routineNotSelectedSession:'session',routineNotSelectedStore:{getSnapshot:()=>new Map([['session',[notice]]])},
    openHomeChecklist:manager=>{assert.equal(manager,true);count++;}};
  vm.runInNewContext(compiled,c);
  c.open(notice);assert.equal(count,1);
  for(const status of ['unknown','confirmed']){c.accountDeleteStatus=status;c.open(notice);assert.equal(count,1);}
  c.accountDeleteStatus='idle';c.accountDeleteInFlight.current=true;c.open(notice);c.accountDeleteInFlight.current=false;
  c.currentSelectionKeyRef.current='dog-b';c.open(notice);c.currentSelectionKeyRef.current='dog-a';
  c.navigationPageRef.current='profile';c.open(notice);c.navigationPageRef.current='home';
  c.dog={id:'dog-b'};c.open(notice);c.dog={id:'dog-a'};
  c.isCurrentAccount=()=>false;c.open(notice);c.isCurrentAccount=()=>true;
  c.routineNotSelectedStore={getSnapshot:()=>new Map([['session',[{...notice}]]])};c.open(notice);
  c.routineNotSelectedStore={getSnapshot:()=>new Map([['session',[notice]]])};pending.set('owner',{phase:'unknown'});c.open(notice);
  assert.equal(count,1);
});
