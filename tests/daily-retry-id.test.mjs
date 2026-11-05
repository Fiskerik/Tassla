import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const parsed = ts.createSourceFile('ProductWorkspace.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function checklistHandlers() {
  const found = {};
  function visit(node) {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(parsed) === 'DailyChecklistScreen') {
      for (const prop of node.attributes.properties) {
        if (ts.isJsxAttribute(prop) && ['onAddRoutineToDay','onRemoveRoutineFromDay'].includes(prop.name.getText(parsed))) {
          found[prop.name.getText(parsed)] = prop.initializer.expression.getText(parsed);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  assert.ok(found.onAddRoutineToDay && found.onRemoveRoutineFromDay);
  return found;
}

function harness(skipped) {
  const handlers = checklistHandlers();
  const operations=[], calls=[];
  let uuid=0;
  const ctx={
    dailyDateKey:'2026-11-05', dailyTimeZone:'Europe/Stockholm', dog:{id:'dog-a'}, client:{},
    dailySnapshotForView:{routineDaySkips:skipped?[skipped]:[]},
    ExpoCrypto:{randomUUID:()=>`uuid-${++uuid}`},
    runDailyMutation:(key,operation)=>{ operations.push({key,operation}); },
    addRoutineToDay:async (_client,row,skip,mutationId)=>{
      calls.push({kind:'add',row,skip,mutationId});
      return {status:calls.length===1?'unknown':'saved'};
    },
    removeRoutineFromDay:async (_client,row,routine,mutationId)=>{
      calls.push({kind:'remove',row,routine,mutationId});
      return {status:calls.length===1?'unknown':'saved'};
    },
  };
  for (const [name, arrow] of Object.entries(handlers)) {
    const js=ts.transpileModule(`globalThis.${name} = ${arrow};`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
    vm.runInNewContext(js,ctx);
  }
  return {ctx,operations,calls,uuidCount:()=>uuid};
}

const routine={id:'routine',dog_id:'dog-a',label:'Morgon',checklist:[{id:'item',label:'Mat'}],repeat_unit:'day'};
const row={id:'day-row',dog_id:'dog-a',routine_id:'routine',date_key:'2026-11-05',time_zone:'Europe/Stockholm',routine_day_revision:4,is_recurring_occurrence:true};
const skipped={...row,skipped:true};

test('restoring a skipped routine retries the same original ID, dog, date, zone and revision',async()=>{
  const h=harness(skipped);
  h.ctx.onAddRoutineToDay(routine);
  const first=h.operations[0].operation;
  assert.equal((await first()).status,'unknown');
  assert.equal((await first()).status,'saved');
  assert.equal(h.uuidCount(),2);
  assert.deepEqual(h.calls[0],h.calls[1]);
  assert.equal(h.calls[0].mutationId,'uuid-2');
  assert.equal(h.calls[0].row.dog_id,'dog-a');
  assert.equal(h.calls[0].row.date_key,'2026-11-05');
  assert.equal(h.calls[0].row.time_zone,'Europe/Stockholm');
  assert.equal(h.calls[0].skip.routine_day_revision,4);
  h.ctx.onAddRoutineToDay(routine);
  await h.operations[1].operation();
  assert.notEqual(h.calls[2].mutationId,h.calls[0].mutationId);
});

test('removing a recurring occurrence retries its exact operation; a new action gets a new ID',async()=>{
  const h=harness(null);
  h.ctx.onRemoveRoutineFromDay(row,routine);
  const first=h.operations[0].operation;
  assert.equal((await first()).status,'unknown');
  assert.equal((await first()).status,'saved');
  assert.equal(h.uuidCount(),1);
  assert.deepEqual(h.calls[0],h.calls[1]);
  assert.equal(h.calls[0].row.routine_day_revision,4);
  assert.equal(h.calls[0].row.dog_id,'dog-a');
  assert.equal(h.calls[0].row.date_key,'2026-11-05');
  assert.equal(h.calls[0].row.time_zone,'Europe/Stockholm');
  h.ctx.onRemoveRoutineFromDay(row,routine);
  await h.operations[1].operation();
  assert.notEqual(h.calls[2].mutationId,h.calls[0].mutationId);
});

test('new selection without a skip reuses the same captured row ID',async()=>{
  const h=harness(null);
  h.ctx.onAddRoutineToDay(routine);
  await h.operations[0].operation();
  await h.operations[0].operation();
  assert.equal(h.calls[0].row.id,h.calls[1].row.id);
  assert.equal(h.calls[0].skip,null);
});

test('production recovery keeps and retries the same operation closure',()=>{
  assert.match(source,/recoverDailyMutation\(outcome\.status, ownerScope, lifetime, key, operation/);
  assert.match(source,/runDailyMutation\(pending\.key, pending\.run, true, pending\)/);
});
