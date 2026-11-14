import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectProcessedJpeg } from '../src/features/dog-photo/jpeg-policy.ts';

const limits = {maxBytes:20000,maxPixels:1_000_000,maxDimension:1000};
const segment = (marker, payload) => [255,marker, (payload.length+2)>>8, (payload.length+2)&255, ...payload];
const jfif = () => segment(0xe0,[0x4a,0x46,0x49,0x46,0,1,2,0,0,1,0,1,0,0]);
const dqt = () => segment(0xdb,[0,...Array(64).fill(1)]);
const dht = () => segment(0xc4,[0,1,...Array(15).fill(0),0,0x10,1,...Array(15).fill(0),0]);
const sof = (marker=0xc0,width=64,height=48) => segment(marker,[8,height>>8,height&255,width>>8,width&255,1,1,0x11,0]);
const sos = (ss=0,se=63,ah=0) => segment(0xda,[1,1,0,ss,se,ah]);
const dri = () => segment(0xdd,[0,1]);
const wrap = (...parts) => Uint8Array.from([255,0xd8,...parts.flat(),255,0xd9]);
const baseline = () => wrap(jfif(),dqt(),dht(),sof(),sos(),[0x11,0xff,0x00,0x22]);
const progressive = () => wrap(dqt(),dht(),sof(0xc2),dri(),sos(0,0),[0x11,0xff,0xd0,0x12],sos(1,63),[0x22]);
const accept = (bytes, custom=limits) => assert.equal(inspectProcessedJpeg(bytes,custom).ok,true);
const deny = (bytes, custom=limits) => assert.equal(inspectProcessedJpeg(bytes,custom).ok,false);

test('accepts bounded baseline and progressive structures with stuffing and ordered restart',()=>{
  assert.deepEqual(inspectProcessedJpeg(baseline(),limits),{ok:true,width:64,height:48}); accept(progressive());
});

test('rejects EXIF/GPS, XMP, ICC, unknown application segments and comments before or between scans',()=>{
  for (const marker of [0xe1,0xe2,0xed,0xef,0xfe]) {
    const metadata=segment(marker,[0x45,0x78,0x69,0x66,0,0,0x47,0x50,0x53]);
    deny(wrap(metadata,dqt(),dht(),sof(),sos(),[1]));
    deny(wrap(dqt(),dht(),sof(0xc2),sos(0,0),[1],metadata,sos(1,63),[2]));
  }
});

test('only one minimal thumbnail-free JFIF header is allowed',()=>{
  const thumbnail=segment(0xe0,[0x4a,0x46,0x49,0x46,0,1,2,0,0,1,0,1,1,1,0,0,0]);
  const extra=segment(0xe0,[0x4a,0x46,0x49,0x46,0,1,2,0,0,1,0,1,0,0,0]);
  for(const app of [thumbnail,extra,segment(0xe0,[0,0]),[...jfif(),...jfif()]]) deny(wrap(app,dqt(),dht(),sof(),sos(),[1]));
});

test('rejects bad envelopes, lengths, unsupported markers, extra frames and trailers',()=>{
  const valid=baseline(); deny(valid.slice(0,-1)); deny(Uint8Array.from([...valid,0])); deny(valid.slice(2));
  deny(wrap([255,0xdb,0,1],sof(),sos(),[1])); deny(wrap([255,0xdb,0,100,1]));
  deny(wrap(dqt(),dht(),sof(),sof(),sos(),[1])); deny(wrap(dqt(),dht(),sof(0xc1),sos(),[1]));
  deny(wrap(dqt(),dht(),sof(),[255,0xdc,0,4,0,1],sos(),[1]));
  deny(wrap(dqt(),dht(),sof(),[255,0,1],sos(),[1]));
  deny(wrap(dqt(),dht(),sof(),[255,0xd0],sos(),[1]));
});

test('rejects bad scan, restart and stuffing boundaries',()=>{
  deny(wrap(dqt(),dht(),sof(),sos(),[]));
  deny(wrap(dqt(),dht(),sof(),sos(),[1,255,0xd0,2]));
  deny(wrap(dqt(),dht(),sof(),dri(),sos(),[1,255,0xd1,2]));
  deny(wrap(dqt(),dht(),sof(),sos(),[1,255,255,0,2]));
  deny(wrap(dqt(),dht(),sof(),sos(1,63),[1]));
  deny(wrap(dqt(),dht(),sof(0xc2),sos(0,1),[1]));
  deny(wrap(dqt(),dht(),sof(),segment(0xda,[1,2,0,0,63,0]),[1]));
});

test('enforces byte, pixel, dimension, component and explicit resource bounds',()=>{
  deny(baseline(),{...limits,maxBytes:50}); deny(wrap(dqt(),dht(),sof(0xc0,1001,1),sos(),[1]));
  deny(wrap(dqt(),dht(),sof(0xc0,1000,1000),sos(),[1]),{...limits,maxPixels:999_999});
  deny(wrap(dqt(),dht(),sof(0xc0,0,48),sos(),[1]));
  deny(wrap(dqt(),dht(),segment(0xc0,[8,0,1,0,1,1,1,0,0]),sos(),[1]));
  deny(wrap(dqt(),dht(),sof(0xc2),...Array.from({length:65},()=>[...sos(0,0),1])));
  deny(baseline(),{...limits,maxBytes:Infinity});
});

test('rejects malformed table declarations and truncated segment data',()=>{
  deny(wrap(segment(0xdb,[0,...Array(63).fill(1)]),dht(),sof(),sos(),[1]));
  deny(wrap(segment(0xdb,[0,...Array(64).fill(0)]),dht(),sof(),sos(),[1]));
  deny(wrap(dqt(),segment(0xc4,[0,3,...Array(15).fill(0),0,1,2]),sof(),sos(),[1]));
  deny(wrap(dqt(),segment(0xc4,[0,1,...Array(15).fill(0),0]),sof(),sos(),[1]));
  deny(wrap(dqt(),segment(0xc4,[0,...Array(16).fill(0)]),sof(),sos(),[1]));
  const valid=baseline(); for(let i=0;i<valid.length;i++) deny(valid.slice(0,i));
});

test('bounded adversarial inputs do not throw or loop',()=>{
  let seed=37;
  for(let i=0;i<3000;i++) {
    seed=(seed*1664525+1013904223)>>>0; const size=seed%160;
    const data=Uint8Array.from({length:size},()=>{seed=(seed*1664525+1013904223)>>>0;return seed>>>24});
    if (data.length >= 2) { data[0]=255; data[1]=0xd8; }
    assert.doesNotThrow(()=>inspectProcessedJpeg(data,limits));
  }
  const original=baseline();
  for(let i=0;i<original.length;i++) { const altered=original.slice(); altered[i] ^= 255; assert.doesNotThrow(()=>inspectProcessedJpeg(altered,limits)); }
  assert.doesNotThrow(()=>inspectProcessedJpeg(null,limits));
});

test('existing synthetic repository JPEG assets pass screening at explicit bounds',async()=>{
  const { readFile } = await import('node:fs/promises');
  for (const name of ['dog-resting.jpg','dog-welcome.jpg']) {
    const bytes=await readFile(new URL(`../assets/images/${name}`,import.meta.url));
    assert.deepEqual(inspectProcessedJpeg(bytes,{maxBytes:1_000_000,maxPixels:10_000_000,maxDimension:4000}),{ok:true,width:1200,height:800});
  }
});


test('structural acceptance does not establish that entropy data decodes',()=>{
  // One byte is deliberately insufficient evidence of a complete 64x48 JPEG scan.
  accept(wrap(dqt(),dht(),sof(),sos(),[0]));
});
