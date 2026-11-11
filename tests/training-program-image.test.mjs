import test from 'node:test';
import assert from 'node:assert/strict';
import { trainingProgramImage } from '../src/features/training/training-program-image.ts';
import { knowledgeImageLayout } from '../src/features/knowledge/knowledge-image-layout.ts';

const programs = [
  ['61000000-0000-4000-8000-000000000009', 'handling', [0.59,0.38,0.71,0.59]],
  ['61000000-0000-4000-8000-000000000010', 'environment', [0.39,0.38,0.62,0.54]],
  ['61000000-0000-4000-8000-000000000011', 'alone', [0.51,0.36,0.82,0.73]],
  ['15711f2f-19e5-51f2-909a-69b300b4ad0f', 'generic', [0.37,0.22,0.66,0.47]],
];

test('published identity and version, not title or ordering, select stable program imagery', () => {
  for (const [content_id,key] of programs) {
    const a=trainingProgramImage({content_id,version:1,title:'before'});
    const b=trainingProgramImage({content_id,version:1,title:'after'});
    assert.equal(a.key,key);
    assert.deepEqual(a,b);
  }
  assert.deepEqual(programs.slice().reverse().map(([id])=>trainingProgramImage({content_id:id,version:1}).key),['generic','alone','environment','handling']);
  assert.equal(trainingProgramImage({content_id:programs[0][0],version:2}).key,'generic');
  assert.equal(trainingProgramImage({content_id:'unknown',version:1}).key,'generic');
});

test('known face bounds fit representative recommendation, overview and modal image frames', () => {
  for (const [content_id,,bounds] of programs) {
    const {focus}=trainingProgramImage({content_id,version:1});
    for (const [width,height] of [[155,116],[327,112],[382,112],[295,112],[350,112]]) {
      const crop=knowledgeImageLayout(width,height,focus.aspectRatio,1,focus);
      const [left,top,right,bottom]=bounds;
      assert.ok(crop.left+left*crop.width >= -1 && crop.left+right*crop.width <= width+1,`${content_id} horizontal ${width}`);
      assert.ok(crop.top+top*crop.height >= -1 && crop.top+bottom*crop.height <= height+1,`${content_id} vertical ${width}`);
    }
  }
});
