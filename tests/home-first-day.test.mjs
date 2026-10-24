import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const dailyData = await readFile(new URL('../src/features/home/daily-activity-data.ts', import.meta.url), 'utf8');
const recovery = await readFile(new URL('../src/features/home/daily-activity-recovery.ts', import.meta.url), 'utf8');
const fixture = await readFile(new URL('../tools/visual-check/app.tsx', import.meta.url), 'utf8');

test('one-time routine creation uses the shared production create/scope/day orchestration in both UI entry points', () => {
  const start = workspace.indexOf('async function createRoutineForToday');
  const end = workspace.indexOf('function retryDailyMutation', start);
  assert.ok(start >= 0 && end > start, 'the shared create handler is present before retry handling');
  const handler = workspace.slice(start, end);
  assert.match(handler, /createRoutineAndSelectForToday\(/);
  assert.match(handler, /createRoutine: \(draft\) => runDailyMutation\(`create-routine:\$\{routine\.id\}`/);
  assert.match(handler, /selectRoutineDay: \(day, mutationId\) => runDailyMutation\(`select-routine:\$\{routine\.id\}`/);
  assert.match(handler, /dailyRoutineCreationScopeMatches\(capturedScope,[\s\S]*currentDailyOwnerScopeRef\.current,[\s\S]*currentSelectionKeyRef\.current,[\s\S]*dailyLifetime\.current/);
  assert.match(handler, /createdRoutineDaySelectionRecoveryCopy/);
  assert.match(dailyData, /template\?\.status !== 'saved' \|\| routine\.repeat_unit !== null \|\| !input\.dateKey/);
  assert.match(dailyData, /if \(!input\.isScopeCurrent\(\)\) return \{ template, daySelection: undefined, selection: 'scope-changed' \}/);
  assert.match(dailyData, /checklist_snapshot: template\.value\.checklist\.map/);
  assert.match(dailyData, /const mutationId = input\.createId\(\);[\s\S]*input\.selectRoutineDay\(day, mutationId\)/);
  assert.match(fixture, /createRoutineAndSelectForToday\(/, 'the browser journey runs the same tested create/scope/day sequence');
  assert.match(recovery, /recoveryCopy\?\.failedMessage[\s\S]*recoveryCopy\?\.unknownMessage/);
  assert.match(recovery, /pendingRetry: \{ ownerScope, \.\.\.origin, recoveryCopy/);
  assert.equal((workspace.match(/return createRoutineForToday\(input\);/g) ?? []).length, 2,
    'Home and Checklistor use the same create-and-start-today behavior');
});
