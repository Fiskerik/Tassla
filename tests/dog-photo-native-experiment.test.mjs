import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import ts from 'typescript';
const source=await readFile(new URL('../src/features/dog-photo/photo-native-experiment.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const m={};new Function('exports',code)(m);
const fixture=new Uint8Array(await readFile(new URL('../assets/images/dog-welcome.jpg',import.meta.url)));
const photo='cccccccc-cccc-4ccc-8ccc-cccccccccccc', photo2='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
function fake() {
  const calls=[], directories=new Set(['/fake']), files=new Map(), secureValues=new Map(); let hook=null;
  const call=async (kind,args,fn)=>{calls.push({kind,args});if(hook)return hook(kind,args,fn);return fn()};
  const sync=(kind,args,fn)=>{calls.push({kind,args});if(hook)return hook(kind,args,fn);return fn()};
  class Directory {
    constructor(...parts){this.path=parts.map(p=>typeof p==='string'?p:p.path).join('/')}
    create(options){return sync('directoryCreate',[this.path,options],()=>{if(directories.has(this.path)&&!options.idempotent)throw Error('exists');directories.add(this.path)})}
    list(){return sync('directoryList',[this.path],()=>[])}
  }
  class File {
    constructor(...parts){this.path=parts.map(p=>typeof p==='string'?p:p.path).join('/')}
    create(options){return sync('fileCreate',[this.path,options],()=>{if(files.has(this.path))throw Error('exists');files.set(this.path,new Uint8Array())})}
    write(bytes){return sync('fileWrite',[this.path,bytes],()=>{files.set(this.path,Uint8Array.from(bytes))})}
    info(){return sync('fileInfo',[this.path],()=>({exists:files.has(this.path),size:files.get(this.path)?.length}))}
    bytes(){return call('fileBytes',[this.path],()=>{if(!files.has(this.path))throw Error('missing');return Uint8Array.from(files.get(this.path))})}
  }
  const fs={Directory,File,Paths:{document:{path:'/fake'}}};
  const secure={getItemAsync:(...args)=>call('secureGet',args,()=>secureValues.get(args[0])??null),setItemAsync:(...args)=>call('secureSet',args,()=>{secureValues.set(args[0],args[1])})};
  const crypto={CryptoDigestAlgorithm:{SHA256:'SHA-256'},digest:async(_algorithm,data)=>Uint8Array.from(createHash('sha256').update(new Uint8Array(data)).digest()).buffer};
  return {calls,directories,files,secureValues,fs,secure,crypto,set hook(fn){hook=fn},adapter:()=>m.createNativePhotoExperiment(fs,secure,crypto)};
}
const path=(dog=m.FIXTURE_DOGS[0],id=photo)=>`/fake/tassla-synthetic-photo-v1/${m.FIXTURE_OWNER}/${dog}/${id}/image.jpg`;
const manifest=(entries=[])=>JSON.stringify({version:1,ownerId:m.FIXTURE_OWNER,entries});
const entry=(dog=m.FIXTURE_DOGS[0],id=photo)=>({dogId:dog,photoId:id});

test('two instances share fixture manifest operations and use exact SDK option shapes',async()=>{
  const f=fake(), a=f.adapter(),b=f.adapter(); assert.equal(await a.bootstrap(),'observed');
  const first=manifest(),next=manifest([entry()]), final=manifest([entry(),entry(m.FIXTURE_DOGS[1],photo2)]);
  assert.equal(await a.ports.createExclusive(m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo,fixture),'created');
  assert.deepEqual(await a.ports.readPhoto(m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo),fixture);
  assert.equal(await a.ports.compareAndSwapManifest(m.FIXTURE_OWNER,first,next),'written');
  assert.equal(await b.ports.createExclusive(m.FIXTURE_OWNER,m.FIXTURE_DOGS[1],photo2,fixture),'created');
  assert.equal(await b.ports.compareAndSwapManifest(m.FIXTURE_OWNER,next,final),'written');
  assert.equal((await a.ports.readManifest(m.FIXTURE_OWNER)).raw,final);
  for(const call of f.calls.filter(x=>x.kind.startsWith('secure'))) assert.equal(call.args.at(-1),m.FIXTURE_OPTIONS);
  for(const call of f.calls.filter(x=>x.kind==='directoryCreate'&&x.args[0].endsWith(photo))) assert.deepEqual(call.args[1],{intermediates:false,overwrite:false,idempotent:false});
  for(const call of f.calls.filter(x=>x.kind==='fileCreate')) assert.deepEqual(call.args[1],{intermediates:false,overwrite:false});
  assert.ok(f.calls.filter(x=>x.kind==='fileInfo').length);assert.ok(f.files.has(path()));
});

test('only fixed identities and exact fixture bytes can reach file APIs',async()=>{
  const f=fake(), a=f.adapter(), corrupt=fixture.slice();corrupt[100]^=1;
  for(const [owner,dog,id,bytes] of [[photo,m.FIXTURE_DOGS[0],photo,fixture],[m.FIXTURE_OWNER,photo,photo,fixture],[m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],'../bad',fixture],[m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',fixture],[m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo,corrupt],[m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo,fixture.slice(1)]]) {
    await assert.rejects(a.ports.createExclusive(owner,dog,id,bytes));
  }
  assert.equal(f.calls.filter(x=>x.kind==='fileWrite'||x.kind==='directoryCreate').length,0);
  assert.equal((await a.ports.readManifest(photo)).kind,'unknown');
});

test('directory collision fails closed without overwriting the existing file',async()=>{
  const f=fake(), a=f.adapter();await a.ports.createExclusive(m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo,fixture);
  await assert.rejects(a.ports.createExclusive(m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo,fixture));
  assert.deepEqual(f.files.get(path()),fixture);assert.equal(f.calls.filter(x=>x.kind==='fileWrite').length,1);
});

test('unknown, null, locked and corrupt manifest are never treated as absent',async()=>{
  const f=fake(), a=f.adapter(); assert.equal((await a.ports.readManifest(m.FIXTURE_OWNER)).kind,'unknown');
  f.secureValues.set(m.FIXTURE_KEY,'garbage'); assert.equal((await a.ports.readManifest(m.FIXTURE_OWNER)).kind,'unknown');
  assert.equal(await a.bootstrap(),'unknown');
  f.hook=(kind,args,action)=>{if(kind==='secureGet')throw Error('locked');return action()};
  assert.equal((await a.ports.readManifest(m.FIXTURE_OWNER)).kind,'unknown');assert.equal(await a.bootstrap(),'unknown');
});

test('conditional update checks exact prior and treats write-then-throw as unknown',async()=>{
  const f=fake(),a=f.adapter();await a.bootstrap(); const base=manifest(),next=manifest([entry()]);
  assert.equal(await a.ports.compareAndSwapManifest(m.FIXTURE_OWNER,next,base),'conflict');
  f.hook=(kind,args,action)=>{if(kind==='secureSet'){action();throw Error('lost ack')}return action()};
  await assert.rejects(a.ports.compareAndSwapManifest(m.FIXTURE_OWNER,base,next));
  assert.equal(f.secureValues.get(m.FIXTURE_KEY),next);
});

test('info size is bounded before bytes and modified reads are rejected',async()=>{
  for(const size of [undefined,null,NaN,0,m.FIXTURE_BYTES+1]){
    const f=fake(),a=f.adapter();f.hook=(kind,args,action)=>kind==='fileInfo'?{exists:true,size}:action();
    await assert.rejects(a.ports.readPhoto(m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo));
    assert.equal(f.calls.filter(x=>x.kind==='fileBytes').length,0);
  }
  const f=fake(),a=f.adapter();await a.ports.createExclusive(m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo,fixture);
  f.hook=(kind,args,action)=>{if(kind==='fileBytes'){const data=action();data[50]^=1;return data}return action()};
  await assert.rejects(a.ports.readPhoto(m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo));
});

test('aborted file or manifest operations do not claim success',async()=>{
  for(const failure of ['directoryCreate','fileCreate','fileWrite']){
    const f=fake(),a=f.adapter();f.hook=(kind,args,action)=>{if(kind===failure)throw Error('cancelled');return action()};
    await assert.rejects(a.ports.createExclusive(m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo,fixture));
  }
  const f=fake(),a=f.adapter();await a.bootstrap();f.hook=(kind,args,action)=>{if(kind==='secureGet')throw Error('cancelled');return action()};
  await assert.rejects(a.ports.compareAndSwapManifest(m.FIXTURE_OWNER,manifest(),manifest([entry()])));
});


test('same photo identifier may be used for distinct dog-scoped directories',async()=>{
  const f=fake(),a=f.adapter();assert.equal(await a.bootstrap(),'observed');
  await a.ports.createExclusive(m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo,fixture);
  await a.ports.createExclusive(m.FIXTURE_OWNER,m.FIXTURE_DOGS[1],photo,fixture);
  const next=manifest([entry(),entry(m.FIXTURE_DOGS[1],photo)]);
  assert.equal(await a.ports.compareAndSwapManifest(m.FIXTURE_OWNER,manifest(),next),'written');
  assert.equal((await a.ports.readManifest(m.FIXTURE_OWNER)).kind,'value');
  assert.ok(f.files.has(path(m.FIXTURE_DOGS[0],photo)));assert.ok(f.files.has(path(m.FIXTURE_DOGS[1],photo)));
});


test('competing adapter instances serialize same-runtime conditional manifest updates',async()=>{
  const f=fake(),a=f.adapter(),b=f.adapter(); await a.bootstrap();
  const left=manifest([entry()]),right=manifest([entry(m.FIXTURE_DOGS[1],photo2)]);
  const results=await Promise.all([a.ports.compareAndSwapManifest(m.FIXTURE_OWNER,manifest(),left),b.ports.compareAndSwapManifest(m.FIXTURE_OWNER,manifest(),right)]);
  assert.deepEqual(results,['written','conflict']);assert.equal(f.secureValues.get(m.FIXTURE_KEY),left);
});

test('write-then-throw bootstrap and mismatching manifest readback never claim success',async()=>{
  for(const mode of ['throw','mismatch']){
    const f=fake(),a=f.adapter();let wrote=false;
    f.hook=(kind,args,action)=>{if(kind==='secureSet'){action();wrote=true;if(mode==='throw')throw Error('lost');return}if(kind==='secureGet'&&wrote&&mode==='mismatch')return null;return action()};
    assert.equal(await a.bootstrap(),'unknown');
  }
});

test('input mutation after invocation cannot change the validated staged fixture',async()=>{
  const f=fake();let release;const originalDigest=f.crypto.digest;
  f.crypto.digest=async(...args)=>{await new Promise(resolve=>{release=resolve});return originalDigest(...args)};
  const a=f.adapter(), input=fixture.slice();const writing=a.ports.createExclusive(m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo,input);
  while(!release)await new Promise(resolve=>setImmediate(resolve));input.fill(0);release();
  assert.equal(await writing,'created');assert.deepEqual(f.files.get(path()),fixture);
});


test('oversized bytes after a plausible info size are refused before digest or copying',async()=>{
  const f=fake(),a=f.adapter();let digestCalls=0;f.crypto.digest=async()=>{digestCalls++;return new ArrayBuffer(32)};
  f.hook=(kind,args,action)=>{if(kind==='fileInfo')return {exists:true,size:m.FIXTURE_BYTES};if(kind==='fileBytes')return new Uint8Array(m.FIXTURE_BYTES+1);return action()};
  await assert.rejects(a.ports.readPhoto(m.FIXTURE_OWNER,m.FIXTURE_DOGS[0],photo));
  assert.equal(digestCalls,0);
});


test('manifest rejects an arbitrary otherwise valid UUID image identifier',async()=>{
  const f=fake(),a=f.adapter();await a.bootstrap();
  const unsafe=manifest([entry(m.FIXTURE_DOGS[0],'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')]);
  await assert.rejects(a.ports.compareAndSwapManifest(m.FIXTURE_OWNER,manifest(),unsafe));
  f.secureValues.set(m.FIXTURE_KEY,unsafe);assert.equal((await a.ports.readManifest(m.FIXTURE_OWNER)).kind,'unknown');
});

test('actual photo core plus experimental ports over fakes: bootstrap, two dogs and ambiguous manifest recovery',async()=>{
  const coreSource=await readFile(new URL('../src/features/dog-photo/photo-store.ts',import.meta.url),'utf8');
  const coreCode=ts.transpileModule(coreSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const jpeg=await import('../src/features/dog-photo/jpeg-policy.ts');const core={};
  new Function('require','exports',coreCode)((name)=>{assert.equal(name,'./jpeg-policy');return jpeg},core);
  const f=fake(),native=f.adapter();assert.equal(await native.bootstrap(),'observed');
  const limits={maxBytes:200000,maxPixels:2000000,maxDimension:1500};
  const first=core.createPhotoStore(native.ports,limits,()=>photo),second=core.createPhotoStore(native.ports,limits,()=>photo2);
  const a={ownerId:m.FIXTURE_OWNER,dogId:m.FIXTURE_DOGS[0],generation:'fixture-1'};
  const b={...a,dogId:m.FIXTURE_DOGS[1]};
  assert.equal((await first.save(a,fixture,()=>true)).status,'observed');
  assert.equal((await second.save(b,fixture,()=>true)).status,'observed');
  assert.deepEqual((await first.read(a,()=>true)).bytes,fixture);assert.deepEqual((await second.read(b,()=>true)).bytes,fixture);
  let once=true; const replacement=core.createPhotoStore(native.ports,limits,()=>photo2);
  f.hook=(kind,args,action)=>{if(kind==='secureSet'&&once){once=false;action();throw Error('lost ack')}return action()};
  assert.equal((await replacement.save(a,fixture,()=>true)).status,'uncertain');
  assert.equal((await second.save(b,fixture,()=>true)).status,'blocked');
  f.hook=null;assert.equal((await replacement.reconcile(a,()=>true)).status,'reconciled-next');
  assert.deepEqual((await replacement.read(a,()=>true)).bytes,fixture);
});
