import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('only a current scoped confirmation event closes the sheet and starts success feedback', async () => {
  const source = await readFile(new URL('../src/features/health/HealthScreen.tsx', import.meta.url), 'utf8');
  const confirmationEffect = source.slice(source.indexOf('useEffect(() => {'), source.indexOf('function requestSheetClose'));
  assert.match(confirmationEffect, /event\.lifetime !== historyLifetime/);
  assert.match(confirmationEffect, /event\.sequence <= consumedConfirmationSequence\.current/);
  assert.match(confirmationEffect, /consumedConfirmationSequence\.current = event\.sequence/);
  assert.match(confirmationEffect, /setSheet\(null\)/);
  assert.match(confirmationEffect, /setToastVisible\(true\)/);
  assert.doesNotMatch(source, /onSave=\{async.*setSheet\(null\)/);
  assert.doesNotMatch(source, /onDelete=\{async.*setSheet\(null\)/);
});

test('sheet close paths share the editor guard and retained feedback sits outside the sheet', async () => {
  const source = await readFile(new URL('../src/features/health/HealthScreen.tsx', import.meta.url), 'utf8');
  const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /function requestSheetClose\(\) \{\s*if \(sheet === 'history' && historyGuard\.current\) \{\s*historyGuard\.current\.requestLeave\(leaveHistoryEditor\)/);
  assert.match(source, /onRequestClose=\{requestSheetClose\}/);
  assert.match(source, /historyReloadWarning = props\.historyMessage\?\.startsWith\('Ändringen är sparad, men historiken kunde inte uppdateras\.'/);
  assert.match(source, /const confirmationToast = <Toast/);
  assert.match(workspace, /key=\{currentHealthHistoryLifetime\}/);
  assert.match(workspace, /historyScope=\{\{ ownerId: session\?\.user\.id \?\? '', accountGeneration, dogId: dog\.id \}\}/);
  assert.match(workspace, /historyConfirmation=\{healthHistoryConfirmation\}/);
});
