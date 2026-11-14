import test from 'node:test';
import assert from 'node:assert/strict';
import { createSyntheticStore, SYNTHETIC_KEY, SYNTHETIC_OPTIONS } from '../src/features/puppy-log/offline-store-experiment.ts';

const snapshot=(revision,items=['a'],scope='fixture-a')=>({version:1,scope,revision,items});
const live=()=>true;
function fake() {
  let raw=null, hook=null; const calls=[];
  return {calls, get raw(){return raw}, set raw(value){raw=value}, set hook(value){hook=value},
    async getItemAsync(key,options){calls.push(['get',key,options]); if(hook) return hook('get',raw); return raw},
    async setItemAsync(key,value,options){calls.push(['set',key,options]); if(hook) return hook('set',value,(v)=>{raw=v}); raw=value},
    async deleteItemAsync(key,options){calls.push(['delete',key,options]); if(hook) return hook('delete',null,(v)=>{raw=v}); raw=null},
  };
}
const opts=(f)=>{for(const [,key,options] of f.calls){assert.equal(key,SYNTHETIC_KEY);assert.equal(options,SYNTHETIC_OPTIONS)}};

test('two clients serialize read/compare/write/readback; loser cannot overwrite',async()=>{
  const f=fake(), first=createSyntheticStore(f,200), second=createSyntheticStore(f,200);
  const [a,b]=await Promise.all([first.commit('fixture-a',null,snapshot(1),live),second.commit('fixture-a',null,snapshot(2),live)]);
  assert.equal(a.status,'observed'); assert.equal(b.status,'conflict'); assert.equal((await second.read('fixture-a',live)).value.revision,1); opts(f);
});

test('invalid, oversized, corrupt and foreign values are never overwritten',async()=>{
  const f=fake(), store=createSyntheticStore(f,100);
  assert.equal((await store.commit('fixture-a',null,{...snapshot(1),version:2},live)).status,'invalid');
  assert.equal((await createSyntheticStore(f,5).commit('fixture-a',null,snapshot(1),live)).status,'invalid');
  f.raw='{"version":2}'; assert.equal((await store.commit('fixture-a',f.raw,snapshot(1),live)).status,'corrupt');
  f.raw=JSON.stringify(snapshot(1,['a'],'fixture-b')); assert.equal((await store.read('fixture-a',live)).status,'scope-mismatch');
  assert.equal((await store.commit('fixture-a',f.raw,snapshot(2),live)).status,'scope-mismatch');
  assert.equal(f.calls.filter(([kind])=>kind==='set').length,0);
});

test('a write that mutates then throws is uncertain and blocks retry until explicit read and rehandling',async()=>{
  const f=fake(), a=createSyntheticStore(f,200), b=createSyntheticStore(f,200); let thrown=false;
  f.hook=(kind,value,mutate)=>{if(kind==='set'&&!thrown){mutate(value);thrown=true;throw Error('lost result')} if(kind==='get')return f.raw};
  assert.equal((await a.commit('fixture-a',null,snapshot(1),live)).status,'uncertain');
  const observed=await b.read('fixture-a',live); assert.equal(observed.status,'value');
  assert.equal((await b.commit('fixture-a',observed.raw,snapshot(2),live)).status,'blocked');
  assert.equal((await b.resolveUncertain('fixture-b',observed,live)).status,'invalid');
  f.raw=null; assert.equal((await b.resolveUncertain('fixture-a',observed,live)).status,'conflict');
  f.raw=observed.raw; assert.equal((await b.resolveUncertain('fixture-a',observed,live)).status,'observed');
  f.hook=null; assert.equal((await b.commit('fixture-a',observed.raw,snapshot(2),live)).status,'observed'); opts(f);
});

test('readback mismatch, thrown readback and delete failure remain uncertain until rehandled',async()=>{
  for(const mode of ['mismatch','readback-error','delete-error']) {
    const f=fake(), store=createSyntheticStore(f,200); let gets=0;
    if(mode==='delete-error') f.raw=JSON.stringify(snapshot(1));
    f.hook=(kind,value,mutate)=>{
      if(kind==='get'){gets++;if(mode==='readback-error'&&gets===2)throw Error('read');if(mode==='mismatch'&&gets===2)return null;return f.raw}
      if(kind==='set'){mutate(value);return}
      if(kind==='delete'){mutate(null);throw Error('lost delete')}
    };
    const result=mode==='delete-error'?await store.clear('fixture-a',f.raw,live):await store.commit('fixture-a',null,snapshot(1),live);
    assert.equal(result.status,'uncertain'); assert.equal((await store.commit('fixture-a',f.raw,snapshot(2),live)).status,'blocked');
    f.hook=null; const seen=await store.read('fixture-a',live); assert.ok(seen.status==='value'||seen.status==='absent');
    assert.equal((await store.resolveUncertain('fixture-a',seen,live)).status,'observed');
  }
});

test('stale scope before write is stopped; stale after write becomes uncertain',async()=>{
  const f=fake(), store=createSyntheticStore(f,200); let current=false;
  assert.equal((await store.commit('fixture-a',null,snapshot(1),()=>current)).status,'stale');
  current=true; f.hook=(kind,value,mutate)=>{if(kind==='get')return f.raw;if(kind==='set'){mutate(value);current=false}};
  assert.equal((await store.commit('fixture-a',null,snapshot(1),()=>current)).status,'uncertain');
  current=true; f.hook=null; const observed=await store.read('fixture-a',()=>current);
  assert.equal((await store.resolveUncertain('fixture-a',observed,()=>current)).status,'observed');
});

test('delete readback is an observation, and a later simulated rollback can restore old data',async()=>{
  const f=fake(), store=createSyntheticStore(f,200); f.raw=JSON.stringify(snapshot(1)); const old=f.raw;
  assert.equal((await store.clear('fixture-a',old,live)).status,'observed');
  assert.equal((await store.read('fixture-a',live)).status,'absent');
  f.raw=old; assert.equal((await store.read('fixture-a',live)).status,'value'); opts(f);
});

test('read failure is distinct from absent and causes no mutation',async()=>{
  const f=fake(), store=createSyntheticStore(f,200); f.hook=()=>{throw Error('unavailable')};
  assert.equal((await store.read('fixture-a',live)).status,'api-error');
  assert.equal((await store.commit('fixture-a',null,snapshot(1),live)).status,'api-error');
  assert.equal(f.calls.filter(([kind])=>kind==='set').length,0);
});

test('successful immediate write readback does not prove survival of rollback',async()=>{
  const f=fake(), store=createSyntheticStore(f,200);
  assert.equal((await store.commit('fixture-a',null,snapshot(1),live)).status,'observed');
  f.raw=null; assert.equal((await store.read('fixture-a',live)).status,'absent');
});


test('commit requires initial revision one and exactly one increment',async()=>{
  const f=fake(), store=createSyntheticStore(f,200);
  for(const revision of [0,2]) assert.equal((await store.commit('fixture-a',null,snapshot(revision),live)).status,'invalid');
  assert.equal((await store.commit('fixture-a',null,snapshot(1),live)).status,'observed');
  const raw=f.raw;
  for(const revision of [0,1,3]) assert.equal((await store.commit('fixture-a',raw,snapshot(revision),live)).status,'invalid');
  assert.equal(f.raw,raw);
  assert.equal((await store.commit('fixture-a',raw,snapshot(2),live)).status,'observed');
});


test('invalid capacity or scope cannot be mistaken for an observed absence',async()=>{
  const f=fake();
  assert.equal((await createSyntheticStore(f,0).read('fixture-a',live)).status,'invalid');
  assert.equal((await createSyntheticStore(f,200).read('invalid',live)).status,'invalid');
  assert.equal(f.calls.length,0);
});


test('captures nested caller data before waiting on an asynchronous read',async()=>{
  const f=fake(), store=createSyntheticStore(f,200); let release;
  f.hook=(kind,value,mutate)=>{if(kind==='get'&&!release)return new Promise(resolve=>{release=resolve});if(kind==='get')return f.raw;if(kind==='set')mutate(value)};
  const input=snapshot(1,['a']); const commit=store.commit('fixture-a',null,input,live);
  while(!release) await new Promise(resolve=>setImmediate(resolve));
  input.items[0]='b'; input.scope='fixture-b'; release(null);
  assert.equal((await commit).status,'observed');
  assert.deepEqual(JSON.parse(f.raw),snapshot(1,['a']));
});

test('uncertainty cannot be cleared by guessing or by an independent backing adapter',async()=>{
  const f=fake(), other=fake(), a=createSyntheticStore(f,200), b=createSyntheticStore(other,200);
  f.hook=(kind,value,mutate)=>{if(kind==='get')return f.raw;if(kind==='set'){mutate(value);throw Error('lost')}};
  assert.equal((await a.commit('fixture-a',null,snapshot(1),live)).status,'uncertain');
  assert.equal((await a.resolveUncertain('fixture-a',{status:'absent',raw:null},live)).status,'invalid');
  const unrelated=await b.read('fixture-a',live);
  assert.equal((await b.resolveUncertain('fixture-a',unrelated,live)).status,'invalid');
  assert.equal((await b.commit('fixture-a',null,snapshot(1),live)).status,'blocked');
  f.hook=null; const observed=await a.read('fixture-a',live);
  assert.equal((await a.resolveUncertain('fixture-a',observed,live)).status,'observed');
});

test('clear and recreate can repeat an old raw snapshot: ABA needs a durable generation or tombstone',async()=>{
  const f=fake(), store=createSyntheticStore(f,200);
  assert.equal((await store.commit('fixture-a',null,snapshot(1),live)).status,'observed'); const old=f.raw;
  assert.equal((await store.clear('fixture-a',old,live)).status,'observed');
  assert.equal((await store.commit('fixture-a',null,snapshot(1),live)).status,'observed');
  assert.equal(f.raw,old);
  assert.equal((await store.commit('fixture-a',old,snapshot(2),live)).status,'observed');
});


test('captures caller data before a queued commit begins',async()=>{
  const f=fake(), store=createSyntheticStore(f,200); let release;
  f.hook=(kind,value,mutate)=>{if(kind==='get'&&!release)return new Promise(resolve=>{release=resolve});if(kind==='get')return f.raw;if(kind==='set')mutate(value)};
  const blocking=store.read('fixture-a',live); while(!release) await new Promise(resolve=>setImmediate(resolve));
  const input=snapshot(1,['a']); const queued=store.commit('fixture-a',null,input,live);
  input.items[0]='c'; input.scope='fixture-b'; release(null); await blocking;
  assert.equal((await queued).status,'observed'); assert.deepEqual(JSON.parse(f.raw),snapshot(1,['a']));
});
