import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screen = await readFile(new URL('../src/features/notifications/NotificationSettingsScreen.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const primitives = await readFile(new URL('../src/components/AppPrimitives.tsx', import.meta.url), 'utf8');

test('reminder editor registers an owner-token guard and Android-only local back handler', () => {
  assert.match(screen, /registerEditorLeaveGuard\(editorOwnerToken\.current/);
  assert.match(screen, /Platform\.OS !== 'android'/);
  assert.match(screen, /BackHandler\.addEventListener\('hardwareBackPress'/);
  assert.match(screen, /return \(\) => subscription\.remove\(\)/);
});

test('readiness busy is independent from the header leave guard and synchronous save flight', () => {
  const leaveGuard = screen.match(/const requestLeave = useCallback\(\(commit: \(\) => void\) => \{([\s\S]*?)\n  \}, \[\]\);/);
  assert.ok(leaveGuard, 'leave guard callback exists');
  assert.match(leaveGuard[1], /saveInFlightRef\.current/);
  assert.doesNotMatch(leaveGuard[1], /\bbusy\b/);
  assert.match(screen, /disabled=\{saveInFlight\} onBack=\{requestBack\}/);
  assert.match(screen, /saveInFlightRef\.current = true;[\s\S]*?await onSave\(/);
  assert.match(screen, /finally \{\s*saveInFlightRef\.current = false;/);
  assert.match(screen, /loading=\{saveInFlight\} disabled=\{busy \|\| saveInFlight\}/);
});

test('workspace remount scope includes owner, account generation, dog and saved snapshot', () => {
  assert.match(workspace, /key=\{JSON\.stringify\(\[session\?\.user\.id \?\? 'signed-out', accountGeneration, dog\.id, notificationPreferences\]\)\}/);
  assert.match(workspace, /registerEditorLeaveGuard=\{registerEditorLeaveGuard\} onBack=\{\(\) => setPage\('more'\)\} preferences=\{notificationPreferences\}/);
  assert.match(workspace, /busy=\{notificationBusy \|\| !notificationPreferencesReady\}/);
});

test('child InfoModal and time picker retain their own Android close callbacks', () => {
  assert.match(screen, /<InfoModal visible=\{infoVisible\}[\s\S]*?onClose=\{\(\) => setInfoVisible\(false\)\}/);
  assert.match(primitives, /<Modal[\s\S]*?onRequestClose=\{onClose\}/);
  assert.match(primitives, /<Modal visible=\{visible\}[\s\S]*?onRequestClose=\{\(\) => setVisible\(false\)\}/);
});
