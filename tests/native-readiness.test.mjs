import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Module from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { createStartupSplash } from '../src/startup/startup-splash.ts';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

async function loadWakeController() {
  const path = fileURLToPath(new URL('../src/features/training/exercise-keep-awake.ts', import.meta.url));
  const code = ts.transpileModule(await readFile(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const target = new Module(path + '.test.cjs'); target.filename = path; target.paths = Module._nodeModulePaths(dirname(path));
  const original = Module._load;
  Module._load = function (specifier, parent, main) {
    if (specifier === 'react-native') return { AppState: {}, Platform: { OS: 'ios' } };
    if (specifier === 'expo-keep-awake') return {};
    return original.call(this, specifier, parent, main);
  };
  try { target._compile(code, path); } finally { Module._load = original; }
  return target.exports;
}

test('splash releases once at first layout, and the watchdog covers a missing layout', async () => {
  let hidden = 0;
  const api = { preventAutoHideAsync: () => Promise.resolve(true), hideAsync: async () => { hidden++; } };
  const release = createStartupSplash(api, 15);
  await tick(); release(); release(); await new Promise((r) => setTimeout(r, 25));
  assert.equal(hidden, 1);
  createStartupSplash(api, 10); await new Promise((r) => setTimeout(r, 25));
  assert.equal(hidden, 2);
});

test('late splash prevention and native failures never leave a rejected promise', async () => {
  const waiting = deferred(); let hidden = 0;
  const release = createStartupSplash({ preventAutoHideAsync: () => waiting.promise, hideAsync: async () => { hidden++; } }, 100);
  release(); assert.equal(hidden, 1); waiting.resolve(true); await tick(); assert.equal(hidden, 2);
  createStartupSplash({ preventAutoHideAsync: () => { throw new Error('unavailable'); }, hideAsync: () => Promise.reject(Error('unavailable')) }, 5);
  await new Promise((r) => setTimeout(r, 15));
});

test('only an actually displayed instruction qualifies to keep the screen awake', async () => {
  const { hasVisibleExerciseInstruction: visible, shouldKeepExerciseAwake: awake } = await loadWakeController();
  const normal = { historical: false, historicalReady: false, program: true, step: true, focused: false, selected: true, waiting: false };
  assert.equal(visible(normal), true);
  for (const change of [{ program: false }, { step: false }, { selected: false }, { waiting: true }]) assert.equal(visible({ ...normal, ...change }), false);
  assert.equal(visible({ ...normal, focused: true, selected: false, waiting: true }), true);
  assert.equal(visible({ ...normal, historical: true, historicalReady: false }), false);
  assert.equal(visible({ ...normal, historical: true, historicalReady: true }), true);
  assert.equal(awake(true, 'active', 'ios'), true);
  assert.equal(awake(true, 'background', 'ios'), false);
  assert.equal(awake(true, 'inactive', 'ios'), false);
  assert.equal(awake(false, 'active', 'ios'), false);
  assert.equal(awake(true, 'active', 'web'), false);
});

test('late activation after close is released using its own tag without releasing a new view', async () => {
  const { beginExerciseWakeLock } = await loadWakeController();
  const first = deferred(), second = deferred(), released = [];
  const api = { activateKeepAwakeAsync: (tag) => tag === 'old' ? first.promise : second.promise,
    deactivateKeepAwake: async (tag) => { released.push(tag); } };
  const closeOld = beginExerciseWakeLock(api, 'old'); closeOld(); closeOld();
  const closeNew = beginExerciseWakeLock(api, 'new'); first.resolve(); await tick();
  assert.deepEqual(released, ['old', 'old']);
  second.resolve(); await tick(); assert.deepEqual(released, ['old', 'old']);
  closeNew(); assert.deepEqual(released, ['old', 'old', 'new']);
  const closeFailed = beginExerciseWakeLock({ activateKeepAwakeAsync: () => { throw Error('unavailable'); }, deactivateKeepAwake: () => Promise.reject(Error('unavailable')) }, 'failed');
  closeFailed(); await tick();
});

test('installed Expo packages provide the real declared native APIs and splash plugin', async () => {
  const splash = await readFile(new URL('../node_modules/expo-splash-screen/build/SplashScreen.d.ts', import.meta.url), 'utf8');
  const awake = await readFile(new URL('../node_modules/expo-keep-awake/build/index.d.ts', import.meta.url), 'utf8');
  assert.match(splash, /preventAutoHideAsync\(\): Promise<boolean>/);
  assert.match(splash, /hideAsync\(\): Promise<void>/);
  assert.match(splash, /setOptions\(options: SplashScreenOptions\): void/);
  assert.match(awake, /activateKeepAwakeAsync\(tag\?: string\): Promise<void>/);
  assert.match(awake, /deactivateKeepAwake\(tag\?: string\): Promise<void>/);
  const config = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8'));
  const plugin = config.expo.plugins.find((entry) => Array.isArray(entry) && entry[0] === 'expo-splash-screen');
  assert.equal(plugin[1].backgroundColor, '#F7F1E7');
  assert.equal(plugin[1].image, './assets/images/tassla-icon.png');
  assert.match(await readFile(new URL('../app/_layout.tsx', import.meta.url), 'utf8'), /setOptions\(\{ duration: 0, fade: false \}\)/);
});
