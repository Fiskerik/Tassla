import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import * as jpeg from '../src/features/dog-photo/jpeg-policy.ts';
const source=await readFile(new URL('../src/features/dog-photo/photo-store.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const model={}; new Function('require','exports',code)((name)=>{assert.equal(name,'./jpeg-policy');return jpeg},model);
const image=new Uint8Array(await readFile(new URL('../assets/images/dog-welcome.jpg',import.meta.url)));
const limits={maxBytes:200000,maxPixels:2000000,maxDimension:1500};
const id=(n)=>`aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12,'0')}`;
const context=(n=1,dog=2)=>({ownerId:id(n),dogId:id(dog),generation:'g1'});
const live=()=>true;
function fake() {
  const manifests=new Map(), files=new Map(), calls=[]; let hook=null;
  const call=async (kind,args,action)=>{calls.push({kind,args}); if(hook)return hook(kind,args,action);return action()};
  return {manifests,files,calls,set hook(fn){hook=fn},
    readManifest(owner){return call('readManifest',[owner],()=>manifests.has(owner)?{kind:'value',raw:manifests.get(owner)}:{kind:'absent'})},
    compareAndSwapManifest(owner,expected,next){return call('cas',[owner,expected,next],()=>{const before=manifests.get(owner)??null;if(before!==expected)return 'conflict';manifests.set(owner,next);return 'written'})},
    createExclusive(owner,dog,photo,bytes){return call('create',[owner,dog,photo,bytes],()=>{const key=owner+dog+photo;if(files.has(key))return 'exists';files.set(key,Uint8Array.from(bytes));return 'created'})},
    readPhoto(owner,dog,photo){return call('readPhoto',[owner,dog,photo],()=>{const row=files.get(owner+dog+photo);if(!row)throw Error('missing');return Uint8Array.from(row)})},
  };
}
const store=(ports,photoId)=>model.createPhotoStore(ports,limits,()=>photoId);
const parse=(ports,owner)=>JSON.parse(ports.manifests.get(owner));

test('captures bytes and scope before asynchronous work and stores the exact validated copy',async()=>{
  const f=fake(), s=context(), bytes=image.slice(), original=image.slice(); let release;
  f.hook=(kind,args,action)=>kind==='readManifest'&&!release?new Promise(resolve=>{release=()=>resolve(action())}):action();
  const write=store(f,id(10)).save(s,bytes,live); while(!release)await new Promise(resolve=>setImmediate(resolve));
  bytes.fill(0); s.ownerId=id(9); s.dogId=id(8); release();
  assert.equal((await write).status,'observed'); assert.deepEqual(f.files.get(id(1)+id(2)+id(10)),original);
  assert.equal(parse(f,id(1)).entries[0].dogId,id(2)); assert.equal(f.manifests.has(id(9)),false);
  const result=await store(f,id(11)).read(context(),live); assert.equal(result.status,'observed'); assert.deepEqual(result.bytes,original);
});

test('invalid bytes, unsafe IDs, corrupt/unknown manifests and collisions never replace old pointer',async()=>{
  const f=fake(), s=context(11,12); const first=store(f,id(13)); assert.equal((await first.save(s,image,live)).status,'observed'); const before=f.manifests.get(s.ownerId);
  assert.equal((await store(f,'../bad').save(s,image,live)).status,'invalid');
  assert.equal((await store(f,id(14)).save(s,new Uint8Array([1,2]),live)).status,'invalid');
  assert.equal((await store(f,id(13)).save(s,image,live)).status,'conflict');
  f.manifests.set(s.ownerId,'{"version":1,"ownerId":"wrong","entries":[]}');
  assert.equal((await store(f,id(14)).save(s,image,live)).status,'error');
  f.hook=(kind,args,action)=>kind==='readManifest'?{kind:'unknown'}:action();
  assert.equal((await store(f,id(14)).save(s,image,live)).status,'error');
  f.hook=null; f.manifests.set(s.ownerId,before); assert.equal((await first.read(s,live)).status,'observed');
});

test('full manifest and exclusive collision leave existing files and manifest intact',async()=>{
  const f=fake(), s=context(21,99); const entries=Array.from({length:32},(_,i)=>({dogId:id(100+i),photoId:id(200+i)}));
  const before=JSON.stringify({version:1,ownerId:s.ownerId,entries}); f.manifests.set(s.ownerId,before);
  assert.equal((await store(f,id(300)).save(s,image,live)).status,'invalid'); assert.equal(f.manifests.get(s.ownerId),before);
  const other=context(22,23); f.files.set(other.ownerId+other.dogId+id(24),Uint8Array.of(1));
  assert.equal((await store(f,id(24)).save(other,image,live)).status,'conflict'); assert.equal(f.manifests.has(other.ownerId),false);
});

test('file write/read errors and changed copies never advance the pointer',async()=>{
  for(const mode of ['create-throw','read-throw','changed']){
    const f=fake(), s=context(30+mode.length,2); f.hook=(kind,args,action)=>{
      if(kind==='create'&&mode==='create-throw'){action();throw Error('after create')}
      if(kind==='readPhoto'&&mode==='read-throw')throw Error('read');
      if(kind==='readPhoto'&&mode==='changed')return Uint8Array.of(1);
      return action();};
    assert.equal((await store(f,id(40)).save(s,image,live)).status,'uncertain'); assert.equal(f.manifests.has(s.ownerId),false);
  }
});

test('same-owner instances serialize changes for different dogs',async()=>{
  const f=fake(), a=context(51,52), b=context(51,53);
  const [one,two]=await Promise.all([store(f,id(54)).save(a,image,live),store(f,id(55)).save(b,image,live)]);
  assert.equal(one.status,'observed');assert.equal(two.status,'observed');
  assert.deepEqual(parse(f,a.ownerId).entries.map((entry)=>entry.dogId),[a.dogId,b.dogId]);
});

test('scope changes at each async stage cannot redirect calls to a new owner',async()=>{
  for(const stage of ['readManifest','create','readPhoto','cas']){
    const f=fake(), s=context(60+stage.length,2); let active=true;
    f.hook=(kind,args,action)=>{const result=action();if(kind===stage)active=false;return result};
    const one=store(f,id(70)); const result=await one.save(s,image,()=>active);
    assert.equal(result.status,stage==='cas'?'uncertain':'stale');
    assert.ok(f.calls.every((call)=>call.args[0]===s.ownerId));
    assert.ok(f.calls.filter((call)=>call.kind==='create'||call.kind==='readPhoto').every((call)=>call.args[1]===s.dogId));
    if(stage==='cas'){active=true;f.hook=null;assert.equal((await one.reconcile({...s,generation:'g2'},()=>active)).status,'reconciled-next')}
    else assert.equal(f.manifests.has(s.ownerId),false);
  }
});

test('ambiguous manifest write blocks other mutations until explicit same-backend reconciliation, preserving copies',async()=>{
  const f=fake(), s=context(81,82), first=store(f,id(83)); assert.equal((await first.save(s,image,live)).status,'observed');
  const before=f.manifests.get(s.ownerId); let once=true;
  f.hook=(kind,args,action)=>{if(kind==='cas'&&once){once=false;action();throw Error('ack lost')}return action()};
  const second=store(f,id(84)); assert.equal((await second.save(s,image,live)).status,'uncertain');
  assert.equal((await first.save(s,image,live)).status,'blocked');
  assert.equal((await store(fake(),id(85)).reconcile(s,live)).status,'blocked');
  assert.equal(f.files.has(s.ownerId+s.dogId+id(83)),true);assert.equal(f.files.has(s.ownerId+s.dogId+id(84)),true);
  f.hook=null; f.manifests.set(s.ownerId,before); // Simulated rollback after an ambiguous write.
  assert.equal((await second.reconcile(s,live)).status,'reconciled-previous');
  assert.equal(parse(f,s.ownerId).entries[0].photoId,id(83));
  assert.equal(f.files.has(s.ownerId+s.dogId+id(84)),true);
});

test('manifest readback mismatch and corrupt manifest never silently select an empty photo',async()=>{
  const f=fake(), s=context(91,92); let cas=false;
  f.hook=(kind,args,action)=>{if(kind==='cas'){cas=true;return action()}if(kind==='readManifest'&&cas)return {kind:'value',raw:'broken'};return action()};
  const writer=store(f,id(93)); assert.equal((await writer.save(s,image,live)).status,'uncertain');
  assert.equal((await writer.read(s,live)).status,'blocked');
  assert.equal((await writer.reconcile(s,live)).status,'conflict');
  f.hook=null; assert.equal((await writer.reconcile(s,live)).status,'reconciled-next');
});

test('manifest CAS conflict preserves the pointer and leaves staged bytes untouched',async()=>{
  const f=fake(), s=context(101,102), writer=store(f,id(103));
  f.hook=(kind,args,action)=>kind==='cas'?'conflict':action();
  assert.equal((await writer.save(s,image,live)).status,'conflict');
  assert.equal(f.manifests.has(s.ownerId),false); assert.equal(f.files.has(s.ownerId+s.dogId+id(103)),true);
});

test('scope change after manifest write and during verification blocks that owner but not another',async()=>{
  const f=fake(), s=context(111,112), writer=store(f,id(113)); let reads=0, active=true;
  f.hook=(kind,args,action)=>{const result=action();if(kind==='readManifest'&&++reads===2)active=false;return result};
  assert.equal((await writer.save(s,image,()=>active)).status,'uncertain');
  assert.equal((await writer.read(s,()=>active)).status,'blocked');
  f.hook=null;
  const other=context(114,115); assert.equal((await store(f,id(116)).save(other,image,live)).status,'observed');
  active=true; assert.equal((await writer.reconcile({...s,generation:'g2'},()=>active)).status,'reconciled-next');
});

test('manifest version, duplicate identifiers and untrusted paths are rejected',async()=>{
  const f=fake(), s=context(121,122), writer=store(f,id(123));
  for(const manifest of [
    {version:2,ownerId:s.ownerId,entries:[]},
    {version:1,ownerId:s.ownerId,entries:[{dogId:s.dogId,photoId:'../secret'}]},
    {version:1,ownerId:s.ownerId,entries:[{dogId:s.dogId,photoId:id(123)},{dogId:s.dogId,photoId:id(124)}]},
    {version:1,ownerId:s.ownerId,entries:[],extra:true},
  ]) {
    const raw=JSON.stringify(manifest);f.manifests.set(s.ownerId,raw);
    assert.equal((await writer.read(s,live)).status,'error');
    assert.equal((await writer.save(s,image,live)).status,'error'); assert.equal(f.manifests.get(s.ownerId),raw);
  }
});

test('later corrupt photo bytes are refused instead of shown',async()=>{
  const f=fake(), s=context(131,132), writer=store(f,id(133));
  assert.equal((await writer.save(s,image,live)).status,'observed'); f.files.set(s.ownerId+s.dogId+id(133),Uint8Array.of(1,2));
  assert.equal((await writer.read(s,live)).status,'error');
});


test('uncertain staging blocks retries until the same file is explicitly observed',async()=>{
  const f=fake(), s=context(151,152), writer=store(f,id(153));
  f.hook=(kind,args,action)=>{if(kind==='create'){action();throw Error('lost response')}return action()};
  assert.equal((await writer.save(s,image,live)).status,'uncertain');
  f.hook=null; assert.equal((await store(f,id(154)).save(s,image,live)).status,'blocked');
  assert.equal((await store(fake(),id(155)).reconcile(s,live)).status,'blocked');
  assert.equal((await writer.reconcile(s,live)).status,'staging-observed');
  assert.equal(f.manifests.has(s.ownerId),false);
});


test('same photo identifier is scoped separately by owner and dog',async()=>{
  const f=fake(), a=context(171,172), b=context(171,173), c=context(174,172), photo=id(175);
  assert.equal((await store(f,photo).save(a,image,live)).status,'observed');
  assert.equal((await store(f,photo).save(b,image,live)).status,'observed');
  assert.equal((await store(f,photo).save(c,image,live)).status,'observed');
  const entries=parse(f,a.ownerId).entries;
  assert.deepEqual(entries.map(row=>row.dogId),[a.dogId,b.dogId]);
  const reads=f.calls.filter(call=>call.kind==='readPhoto');
  assert.ok(reads.some(call=>call.args[0]===a.ownerId&&call.args[1]===a.dogId&&call.args[2]===photo));
  assert.ok(reads.some(call=>call.args[0]===b.ownerId&&call.args[1]===b.dogId&&call.args[2]===photo));
  assert.ok(reads.some(call=>call.args[0]===c.ownerId&&call.args[1]===c.dogId&&call.args[2]===photo));
  f.files.set(a.ownerId+a.dogId+photo,Uint8Array.of(1,2));
  assert.equal((await store(f,photo).read(a,live)).status,'error');
  assert.equal((await store(f,photo).read(b,live)).status,'observed');
  assert.equal((await store(f,photo).read(c,live)).status,'observed');
});


test('invalid owner or dog identifiers never invoke a storage port',async()=>{
  for(const invalid of ['../escape','', 'AAAAAAAA-AAAA-4AAA-8AAA-000000000001']) {
    for(const field of ['ownerId','dogId']) {
      const f=fake(), scope={...context(181,182),[field]:invalid};
      assert.equal((await store(f,id(183)).save(scope,image,live)).status,'invalid');
      assert.equal((await store(f,id(184)).read(scope,live)).status,'invalid');
      assert.equal(f.calls.length,0);
    }
  }
});

test('a different dog cannot reconcile another dog’s uncertain staging',async()=>{
  const f=fake(), a=context(191,192), b=context(191,193), writer=store(f,id(194));
  f.hook=(kind,args,action)=>{if(kind==='create'){action();throw Error('lost response')}return action()};
  assert.equal((await writer.save(a,image,live)).status,'uncertain');
  f.hook=null; assert.equal((await writer.reconcile(b,live)).status,'blocked');
  assert.equal((await writer.save(b,image,live)).status,'blocked');
  assert.equal((await writer.reconcile(a,live)).status,'staging-observed');
});
