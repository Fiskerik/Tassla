import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import * as log from '../src/features/puppy-log/log-model.ts';

const source = await readFile(new URL('../src/features/puppy-log/offline-queue-model.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const model = {};
new Function('require', 'exports', code)((name) => { assert.equal(name, './log-model'); return log; }, model);
const scope = {ownerId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',dogId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',generation:'session-1'};
const empty = () => ({version:1,scope:{...scope},revision:0,items:[]});
const op = (n) => ({id:`cccccccc-cccc-4ccc-8ccc-${String(n).padStart(12,'0')}`,dog_id:scope.dogId,event_type:'pee',occurred_at:'2026-11-11T12:00:00.000Z',duration_minutes:null,description:null,accident_kinds:null});
const row = (operation) => ({...operation,occurred_on:null,weight_kg:null});
const value = (result) => { assert.equal(result.ok,true,JSON.stringify(result)); return result.value; };
const refused = (result) => assert.equal(result.ok,false);
const ack = (state, proposal, stored=proposal.next, activeScope=scope) => value(model.acknowledge(state,proposal,stored,activeScope,3));
function queued(...operations) { let s=empty(); for(const operation of operations) { const p=value(model.enqueue(s,scope,3,operation)); s=ack(s,p).snapshot; } return s; }

test('persist exact attempting revision before a single send, and reject stale or forged acknowledgements',()=>{
  const base=queued(op(1)); const p=value(model.beginAttempt(base,scope,3,'lease-1'));
  refused(model.acknowledge(base,p,base,scope,3));
  refused(model.acknowledge(base,p,{...p.next,revision:p.next.revision+1},scope,3));
  refused(model.acknowledge(base,{...p,effect:'confirmed'},p.next,scope,3));
  const confirmed=ack(base,p); assert.equal(confirmed.effect,'send'); assert.deepEqual(confirmed.operation,op(1));
  refused(model.acknowledge(confirmed.snapshot,p,p.next,scope,3));
  refused(model.beginAttempt(confirmed.snapshot,scope,3,'lease-2'));
  refused(model.acknowledge(base,p,p.next,{...scope,generation:'other'},3));
});

test('FIFO, capacity, collision, cancellation and immutable input',()=>{
  const state=queued(op(1),op(2),op(3)); const original=structuredClone(state);
  refused(model.enqueue(state,scope,3,op(4))); refused(model.enqueue(state,scope,4,op(1)));
  const start=value(model.beginAttempt(state,scope,3,'lease')); assert.equal(start.next.items[0].operation.id,op(1).id);
  const attempting=ack(state,start).snapshot; refused(model.cancelHead(attempting,scope,3));
  refused(model.enqueue(attempting,scope,4,op(4))); assert.deepEqual(state,original);
  const cancelled=ack(state,value(model.cancelHead(state,scope,3))).snapshot;
  assert.equal(cancelled.items[0].operation.id,op(2).id);
});

test('crash converts attempting to unknown; absent or different server row never replays',()=>{
  const state=queued(op(1),op(2)); const attempting=ack(state,value(model.beginAttempt(state,scope,3,'old'))).snapshot;
  const newScope={...scope,generation:'session-2'};
  const recovery=value(model.recoverAfterRestart(attempting,newScope,3)); const unknown=ack(attempting,recovery,recovery.next,newScope).snapshot;
  refused(model.resolveAttempt(unknown,scope,3,'old',attempting.revision,op(1).id,'unknown',null));
  assert.equal(unknown.items[0].status,'unknown'); refused(model.beginAttempt(unknown,newScope,3,'new'));
  refused(model.reconcileUnknown(unknown,newScope,3,unknown.revision,op(1).id,null)); refused(model.reconcileUnknown(unknown,newScope,3,unknown.revision,op(1).id,{...row(op(1)),description:'different'}));
  refused(model.resolveAttempt(unknown,scope,3,'old',unknown.revision,op(1).id,'confirmed',row(op(1))));
  const found=value(model.reconcileUnknown(unknown,newScope,3,unknown.revision,op(1).id,row(op(1))));
  refused(model.acknowledge(unknown,found,unknown,newScope,3));
  const removed=ack(unknown,found,found.next,newScope); assert.equal(removed.effect,'confirmed'); assert.equal(removed.snapshot.items[0].operation.id,op(2).id);
});

test('only exact confirmation dequeues after ack; failed/unknown remain and block automatic retry',()=>{
  for (const status of ['unknown','rejected']) {
    const state=queued(op(1)); const attempting=ack(state,value(model.beginAttempt(state,scope,3,'lease'))).snapshot;
    refused(model.resolveAttempt(attempting,scope,3,'lease',attempting.revision-1,op(1).id,'unknown',null));
    refused(model.resolveAttempt(attempting,scope,3,'lease',attempting.revision,op(2).id,'unknown',null));
    refused(model.resolveAttempt(attempting,scope,3,'wrong',attempting.revision,op(1).id,'confirmed',row(op(1))));
    refused(model.resolveAttempt(attempting,scope,3,'lease',attempting.revision,op(1).id,'confirmed',{...row(op(1)),dog_id:scope.ownerId}));
    refused(model.resolveAttempt(attempting,scope,3,'lease',attempting.revision,op(1).id,'confirmed',{...row(op(1)),occurred_at:'2026-11-11T12:00:00.000001+00:00'}));
    const pending=value(model.resolveAttempt(attempting,scope,3,'lease',attempting.revision,op(1).id,status,null));
    const blocked=ack(attempting,pending).snapshot; assert.equal(blocked.items[0].status,status); refused(model.beginAttempt(blocked,scope,3,'again'));
  }
  const state=queued(op(1)); const attempting=ack(state,value(model.beginAttempt(state,scope,3,'lease'))).snapshot;
  const p=value(model.resolveAttempt(attempting,scope,3,'lease',attempting.revision,op(1).id,'confirmed',row(op(1))));
  refused(model.acknowledge(attempting,p,attempting,scope,3));
  const result=ack(attempting,p); assert.equal(result.effect,'confirmed'); assert.equal(result.snapshot.items.length,0);
});

test('invalid snapshots, payloads, scope and revisions fail closed without mutating data',()=>{
  const state=queued(op(1)); const original=structuredClone(state);
  for(const bad of [{...state,version:2},{...state,revision:-1},{...state,items:[...state.items,...state.items]}, {...state,items:[{...state.items[0],status:'attempting',lease:null}]}, {...state,extra:true}]) refused(model.validateSnapshot(bad,scope,3));
  refused(model.validateSnapshot(state,{...scope,dogId:scope.ownerId},3)); refused(model.validateSnapshot(state,scope,0));
  for(const bad of [{...op(2),id:op(2).id.toUpperCase()}, {...op(2),description:'note'}, {...op(2),occurred_at:'bad'}, {...op(2),event_type:'accident'}, {...op(2),dog_id:scope.ownerId}, {...op(2),extra:true}]) refused(model.enqueue(state,scope,3,bad));
  assert.deepEqual(state,original);
});


test('scope property order is irrelevant; restart cannot move between owners or dogs',()=>{
  const state=queued(op(1));
  const reordered={generation:scope.generation,dogId:scope.dogId,ownerId:scope.ownerId};
  assert.equal(model.validateSnapshot(state,reordered,3).ok,true);
  refused(model.recoverAfterRestart(state,{...scope,dogId:scope.ownerId,generation:'new'},3));
  refused(model.recoverAfterRestart(state,{...scope,ownerId:scope.dogId,generation:'new'},3));
  const fresh={...scope,generation:'new'}; const p=value(model.recoverAfterRestart(state,fresh,3));
  const next=ack(state,p,p.next,fresh).snapshot;
  refused(model.beginAttempt(next,scope,3,'old'));
});

test('timestamps accept equal Postgres microsecond formatting and reject sub-millisecond differences',()=>{
  const state=queued(op(1)); const attempting=ack(state,value(model.beginAttempt(state,scope,3,'lease'))).snapshot;
  const match={...row(op(1)),occurred_at:'2026-11-11T12:00:00.000000+00:00'};
  assert.equal(model.resolveAttempt(attempting,scope,3,'lease',attempting.revision,op(1).id,'confirmed',match).ok,true);
  const {weight_kg: _weight, ...incomplete} = match;
  refused(model.resolveAttempt(attempting,scope,3,'lease',attempting.revision,op(1).id,'confirmed',incomplete));
  refused(model.resolveAttempt(attempting,scope,3,'lease',attempting.revision,op(1).id,'confirmed',{...match,weight_kg:2}));
  refused(model.resolveAttempt(attempting,scope,3,'lease',attempting.revision,op(1).id,'confirmed',{...match,occurred_on:'2026-11-11'}));
  refused(model.resolveAttempt(attempting,scope,3,'lease',attempting.revision,op(1).id,'confirmed',{...match,occurred_at:'2026-11-11T12:00:00.000001+00:00'}));
});

test('an old callback cannot alter a later head even if a lease is reused',()=>{
  const state=queued(op(1),op(2)); const first=ack(state,value(model.beginAttempt(state,scope,3,'reused'))).snapshot;
  const done=ack(first,value(model.resolveAttempt(first,scope,3,'reused',first.revision,op(1).id,'confirmed',row(op(1))))).snapshot;
  const second=ack(done,value(model.beginAttempt(done,scope,3,'reused'))).snapshot;
  refused(model.resolveAttempt(second,scope,3,'reused',first.revision,op(1).id,'unknown',null));
  refused(model.resolveAttempt(second,scope,3,'reused',second.revision,op(1).id,'rejected',null));
});

test('ack requires authoritative current state: repeating a stale base cannot be detected without adapter CAS',()=>{
  const base=queued(op(1)), p=value(model.beginAttempt(base,scope,3,'lease'));
  const first=ack(base,p); refused(model.acknowledge(first.snapshot,p,p.next,scope,3));
  // The pure model cannot tell that an adapter has supplied the same obsolete base twice.
  assert.equal(ack(base,p).effect,'send');
});
