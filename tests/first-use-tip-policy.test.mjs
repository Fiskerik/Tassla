import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/notifications/notification-storage.ts', import.meta.url), 'utf8');
const screenSource = await readFile(new URL('../src/features/puppy-log/LogScreen.tsx', import.meta.url), 'utf8');
const componentSource = await readFile(new URL('../src/components/ui/FirstUseTip.tsx', import.meta.url), 'utf8');
const validA = '11111111-1111-4111-8111-111111111111';
const validB = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

async function loadStorage(secureStore) {
  const filePath = fileURLToPath(new URL('../src/notifications/notification-storage.ts', import.meta.url));
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const virtualModule = new Module(filePath + '.first-use.qa.cjs');
  virtualModule.filename = filePath + '.first-use.qa.cjs';
  virtualModule.paths = Module._nodeModulePaths(dirname(filePath));
  const originalLoad = Module._load;
  Module._load = function (specifier, parent, isMain) {
    if (specifier === 'expo-secure-store') return secureStore;
    if (specifier === './notification-model') return { isUuid: (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value), DEFAULT_NOTIFICATION_PREFERENCES: {}, isNotificationPreferences: () => true, notificationPreferenceKey: () => '' };
    return originalLoad.call(this, specifier, parent, isMain);
  };
  try { virtualModule._compile(compiled, virtualModule.filename); }
  finally { Module._load = originalLoad; }
  return virtualModule.exports;
}

async function loadHookHarness(storage) {
  const filePath = fileURLToPath(new URL('../src/components/ui/FirstUseTip.tsx', import.meta.url));
  const compiled = ts.transpileModule(await readFile(filePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  const virtualModule = new Module(filePath + '.first-use-hook.qa.cjs');
  virtualModule.filename = filePath + '.first-use-hook.qa.cjs';
  virtualModule.paths = Module._nodeModulePaths(dirname(filePath));
  const state = [];
  const effects = [];
  const setters = [];
  let cursor = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], (next) => { setters.push(index); state[index] = typeof next === 'function' ? next(state[index]) : next; }];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = effects[index];
      if (previous && deps && previous.deps && deps.length === previous.deps.length && deps.every((item, i) => Object.is(item, previous.deps[i]))) return;
      previous?.cleanup?.();
      effects[index] = { deps, cleanup: effect() };
    },
    useCallback(callback) { cursor++; return callback; },
    createElement() { return null; },
  };
  const originalLoad = Module._load;
  Module._load = function (specifier, parent, isMain) {
    if (specifier === 'react') return react;
    if (specifier === 'react-native') return { StyleSheet: { create: (value) => value }, Text: 'Text', View: 'View' };
    if (specifier === '../../notifications/notification-model') return { isUuid: (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) };
    if (specifier === '../../notifications/notification-storage') return storage;
    if (specifier === '../../theme/tokens') return { tokens: { spacing: { sm: 8, xs: 4 }, size: { stroke: 1 }, radius: { md: 8 }, colors: { border: '#000', surface: '#fff', textPrimary: '#000' }, typography: { body: {} } } };
    if (specifier === './Button') return { Button: () => null };
    return originalLoad.call(this, specifier, parent, isMain);
  };
  try { virtualModule._compile(compiled, virtualModule.filename); }
  finally { Module._load = originalLoad; }
  return {
    render(ownerId, screenId = 'log', enabled = true) { cursor = 0; return virtualModule.exports.useFirstUseTip(ownerId, screenId, enabled); },
    unmount() { for (const item of effects) { item?.cleanup?.(); } },
    setters,
  };
}

test('first-use tip storage isolates owner keys and accepts only the seen marker', async () => {
  const values = new Map();
  const calls = [];
  const storage = await loadStorage({
    async getItemAsync(key) { calls.push(['get', key]); return values.get(key) ?? null; },
    async setItemAsync(key, value) { calls.push(['set', key, value]); values.set(key, value); },
    async deleteItemAsync(key) { calls.push(['delete', key]); values.delete(key); },
  });
  assert.equal(await storage.readFirstUseTipStatus(validA, 'log'), 'unseen');
  assert.equal(await storage.markFirstUseTipSeen(validA, 'log'), true);
  assert.equal(await storage.readFirstUseTipStatus(validA, 'log'), 'seen');
  assert.equal(await storage.readFirstUseTipStatus(validB, 'log'), 'unseen');
  assert.deepEqual([...values.keys()], [`tassla.first-use-tip.v1.log.${validA}`]);
  assert.equal(await storage.markFirstUseTipSeen('bad-owner', 'log'), false);
  assert.equal(await storage.readFirstUseTipStatus('bad-owner', 'log'), 'unavailable');
  assert.equal(calls.some(([, key]) => key.endsWith('bad-owner')), false);
});

test('read and write failures suppress storage access for the same owner until deletion cleanup succeeds', async () => {
  let reads = 0;
  let writes = 0;
  let deletes = 0;
  const storage = await loadStorage({
    async getItemAsync() { reads++; throw new Error('synthetic read failure'); },
    async setItemAsync() { writes++; throw new Error('synthetic write failure'); },
    async deleteItemAsync() { deletes++; },
  });
  assert.equal(await storage.readFirstUseTipStatus(validA, 'log'), 'unavailable');
  assert.equal(await storage.readFirstUseTipStatus(validA, 'log'), 'unavailable');
  assert.equal(reads, 1);
  assert.equal(await storage.markFirstUseTipSeen(validB, 'log'), false);
  assert.equal(await storage.markFirstUseTipSeen(validB, 'log'), false);
  assert.equal(writes, 1);
  await storage.deleteFirstUseTipStatus(validA);
  await storage.deleteFirstUseTipStatus(validB);
  assert.equal(deletes, 2);
  assert.equal(await storage.readFirstUseTipStatus(validA, 'log'), 'unavailable');
  assert.equal(reads, 1, 'a deleted owner stays unavailable for the remainder of this process');
});

test('a failed queued write blocks later reads even after an earlier read succeeds', async () => {
  let resolveRead;
  const storage = await loadStorage({
    getItemAsync() { return new Promise((resolve) => { resolveRead = resolve; }); },
    async setItemAsync() { throw new Error('synthetic write failure'); },
    async deleteItemAsync() {},
  });
  const pendingRead = storage.readFirstUseTipStatus(validA, 'log');
  await new Promise((resolve) => setImmediate(resolve));
  const pendingWrite = storage.markFirstUseTipSeen(validA, 'log');
  resolveRead(null);
  assert.equal(await pendingRead, 'unseen');
  assert.equal(await pendingWrite, false);
  assert.equal(await storage.readFirstUseTipStatus(validA, 'log'), 'unavailable');
});

test('a remount read waits for an in-flight dismiss write and stays suppressed if that write fails', async () => {
  let finishWrite;
  let reads = 0;
  const storage = await loadStorage({
    async getItemAsync() { reads++; return null; },
    setItemAsync() { return new Promise((_, reject) => { finishWrite = reject; }); },
    async deleteItemAsync() {},
  });
  const pendingWrite = storage.markFirstUseTipSeen(validA, 'log');
  await new Promise((resolve) => setImmediate(resolve));
  const remountRead = storage.readFirstUseTipStatus(validA, 'log');
  finishWrite(new Error('synthetic write failure'));
  assert.equal(await pendingWrite, false);
  assert.equal(await remountRead, 'unavailable');
  assert.equal(reads, 0, 'queued read observes the write failure barrier before touching SecureStore');
});

test('hook ignores owner and unmount stale reads, while a late dismiss write cannot hide the next owner tip', async () => {
  let resolveA;
  let resolveB;
  let resolveWrite;
  const storage = {
    readFirstUseTipStatus(ownerId) {
      return new Promise((resolve) => {
        if (ownerId === validA) resolveA = resolve;
        else resolveB = resolve;
      });
    },
    markFirstUseTipSeen() { return new Promise((resolve) => { resolveWrite = resolve; }); },
  };
  const hook = await loadHookHarness(storage);
  hook.render(validA);
  hook.render(validB);
  resolveA('unseen');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(hook.render(validB).visible, false, 'owner A response cannot resolve owner B UI');
  resolveB('unseen');
  await new Promise((resolve) => setImmediate(resolve));
  const ownerBTip = hook.render(validB);
  assert.equal(ownerBTip.visible, true);
  ownerBTip.dismiss();
  assert.equal(hook.render(validB).visible, false, 'dismiss hides immediately before SecureStore completes');
  hook.render(validA);
  resolveA('unseen');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(hook.render(validA).visible, true, 'owner B dismissal does not affect owner A');
  const beforeUnmountSetters = hook.setters.length;
  hook.unmount();
  resolveWrite(true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(hook.setters.length, beforeUnmountSetters, 'unmounted effect cannot apply a late state update');
  assert.equal(hook.render(validA).visible, true, 'a late write result cannot overwrite the next owner state');

  let resolveAfterUnmount;
  const unmountHook = await loadHookHarness({ readFirstUseTipStatus: () => new Promise((resolve) => { resolveAfterUnmount = resolve; }), markFirstUseTipSeen: async () => true });
  unmountHook.render(validA);
  const before = unmountHook.setters.length;
  unmountHook.unmount();
  resolveAfterUnmount('unseen');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(unmountHook.setters.length, before, 'stale read after unmount cannot update state');
});

test('confirmed deletion serializes after an in-flight dismiss write and cannot resurrect its key', async () => {
  let finishWrite;
  const values = new Map();
  const calls = [];
  const key = `tassla.first-use-tip.v1.log.${validA}`;
  const storage = await loadStorage({
    async getItemAsync(value) { return values.get(value) ?? null; },
    async setItemAsync(value, item) {
      calls.push('write-start');
      await new Promise((resolve) => { finishWrite = resolve; });
      values.set(value, item);
      calls.push('write-finish');
    },
    async deleteItemAsync(value) { calls.push('delete'); values.delete(value); },
  });
  const pendingWrite = storage.markFirstUseTipSeen(validA, 'log');
  await new Promise((resolve) => setImmediate(resolve));
  const pendingDeletion = storage.deleteFirstUseTipStatus(validA);
  assert.deepEqual(calls, ['write-start']);
  finishWrite();
  assert.equal(await pendingWrite, false);
  await pendingDeletion;
  assert.deepEqual(calls, ['write-start', 'write-finish', 'delete']);
  assert.equal(values.has(key), false);
  assert.equal(await storage.markFirstUseTipSeen(validA, 'log'), false);
});

test('LogScreen ties tip visibility to a ready cloud log and dismisses only on explicit control activation', () => {
  assert.match(screenSource, /useFirstUseTip\(layoutOwnerId, 'log', mode === 'cloud' && !loading && !loadError\)/);
  assert.match(screenSource, /firstUseTip\.visible \? <FirstUseTip text="Tryck på Fler för fler loggtyper\."/);
  assert.match(screenSource, /onPress=\{\(event\) => \{ firstUseTip\.dismiss\(\); selectType/);
  assert.match(screenSource, /onLongPress=\{\(\) => \{ firstUseTip\.dismiss\(\); startLayoutEdit/);
  assert.match(componentSource, /accessibilityLabel="Stäng tipset"/);
  assert.match(componentSource, /setDismissedOwnerId\(normalizedOwnerId\)/);
  assert.match(componentSource, /if \(!active\) return;/);
  assert.match(componentSource, /return \(\) => \{ active = false; \};/);
  assert.doesNotMatch(screenSource, /onScroll=\{[^}]*firstUseTip\.dismiss/);
});
