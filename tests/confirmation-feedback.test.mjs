import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Module from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { createConfirmationIntent } from '../src/feedback/confirmation-intent.ts';

test('hydration and unarmed completion never request confirmation feedback', () => {
  const intent = createConfirmationIntent();
  assert.equal(intent.consume('dog-a:day-a:item-a', true, true), false);
  assert.equal(intent.consume('dog-a:day-a:item-a', false, true), false);
  intent.request(undefined, true);
  assert.equal(intent.consume(undefined, true, true), false);
});

test('pending, failed and unknown keep intent until the exact check is confirmed once', () => {
  const intent = createConfirmationIntent();
  intent.request('a', true);
  for (let i = 0; i < 3; i++) {
    assert.equal(intent.consume('a', false, false), false);
    assert.equal(intent.consume('a', true, false), false);
  }
  assert.equal(intent.consume('a', true, true), true);
  assert.equal(intent.consume('a', true, true), false);
  intent.request('a', false);
  assert.equal(intent.consume('a', true, true), false);
});

test('object, day, dog, template changes and unmount discard the former intent', () => {
  for (const other of ['dog-b:day-a:template-a:item-a', 'dog-a:day-b:template-a:item-a', 'dog-a:day-a:template-b:item-a', 'dog-a:day-a:template-a:item-b']) {
    const intent = createConfirmationIntent();
    intent.request('dog-a:day-a:template-a:item-a', true);
    assert.equal(intent.consume(other, true, true), false);
    assert.equal(intent.consume('dog-a:day-a:template-a:item-a', true, true), false);
  }
  const intent = createConfirmationIntent();
  intent.request('a', true); intent.reset();
  assert.equal(intent.consume('a', true, true), false);
});

async function loadAdapter(platform, selectionAsync) {
  const path = fileURLToPath(new URL('../src/feedback/confirmation-haptics.ts', import.meta.url));
  const compiled = ts.transpileModule(await readFile(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const target = new Module(path + '.test.cjs'); target.filename = path; target.paths = Module._nodeModulePaths(dirname(path));
  const original = Module._load;
  Module._load = function (specifier, parent, main) {
    if (specifier === 'react-native') return { Platform: { OS: platform } };
    if (specifier === 'expo-haptics') return { selectionAsync };
    return original.call(this, specifier, parent, main);
  };
  try { target._compile(compiled, path); } finally { Module._load = original; }
  return target.exports.playConfirmationHaptic;
}

test('installed Expo57 module has the real declared selection API and native entry points', async () => {
  const pkg = JSON.parse(await readFile(new URL('../node_modules/expo-haptics/package.json', import.meta.url), 'utf8'));
  assert.match(pkg.version, /^57\./);
  const declaration = await readFile(new URL('../node_modules/expo-haptics/build/Haptics.d.ts', import.meta.url), 'utf8');
  assert.match(declaration, /selectionAsync\(\): Promise<void>/);
  for (const path of ['ios/HapticsModule.swift', 'android/src/main/java/expo/modules/haptics/HapticsModule.kt']) {
    assert.match(await readFile(new URL('../node_modules/expo-haptics/' + path, import.meta.url), 'utf8'), /selectionAsync/);
  }
});

test('adapter requests one zero-payload native tick and ignores web, stale/reduced and SDK failures', async () => {
  for (const platform of ['ios', 'android', 'web']) {
    const calls = [];
    const play = await loadAdapter(platform, (...args) => { calls.push(args); return Promise.resolve(); });
    assert.equal(await play(() => true), platform !== 'web');
    assert.deepEqual(calls, platform === 'web' ? [] : [[]]);
    assert.equal(await play(() => false), false);
    assert.equal(calls.length, platform === 'web' ? 0 : 1);
  }
  for (const action of [() => { throw new Error('synthetic unavailable'); }, () => Promise.reject(new Error('synthetic rejected'))]) {
    assert.equal(await (await loadAdapter('ios', action))(() => true), false);
  }
});

test('a confirmation consumed while effects are disabled never plays later', async () => {
  const intent = createConfirmationIntent(); let count = 0;
  const play = await loadAdapter('ios', () => { count++; return Promise.resolve(); });
  intent.request('a', true);
  if (intent.consume('a', true, true)) await play(() => false);
  assert.equal(intent.consume('a', true, true), false);
  assert.equal(count, 0);
});
