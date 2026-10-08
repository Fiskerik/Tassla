import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { isDevPreviewEnabled } from '../src/features/account/preview-policy.ts';

const require = createRequire(import.meta.url);
const { buildExpoCommand, buildPreviewEnvironment } = require('../tools/start-preview.cjs');

test('preview requires the exact flag and a development build', () => {
  for (const flag of [undefined, '', 'TRUE', 'True', '1', 'true ', ' true', 'false']) {
    assert.equal(isDevPreviewEnabled(flag, true), false, String(flag));
  }
  assert.equal(isDevPreviewEnabled('true', false), false);
  assert.equal(isDevPreviewEnabled('true', true), true);
});

test('component gallery is reachable only from the dev-gated preview menu', () => {
  const preview = readFileSync(path.join(process.cwd(), 'src/features/home/DevelopmentPreview.tsx'), 'utf8');
  const appFlow = readFileSync(path.join(process.cwd(), 'src/features/home/AppFlow.tsx'), 'utf8');
  assert.match(preview, /typeof __DEV__ !== 'undefined' && __DEV__ === true \? \(\) => setScreen\('components'\)/);
  assert.match(preview, /case 'components':[\s\S]*?<ComponentGalleryScreen/);
  assert.doesNotMatch(appFlow, /ComponentGalleryScreen|setScreen\('components'\)/);
  assert.equal(isDevPreviewEnabled('true', false), false);
});

test('preview script resolves the installed Expo CLI and forwards arguments without launching it', () => {
  const root = process.cwd();
  const { command, args } = buildExpoCommand(root, ['--port', '0']);

  assert.equal(command, process.execPath);
  assert.equal(args[1], 'start');
  assert.deepEqual(args.slice(2), ['--port', '0']);
  assert.ok(path.isAbsolute(args[0]));
  assert.ok(existsSync(args[0]), `installed Expo CLI exists at ${args[0]}`);

  const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(packageJson.scripts['start:preview'], 'node tools/start-preview.cjs');
});

test('preview environment changes only the child environment object', () => {
  const parentEnvironment = {
    PATH: 'synthetic-path',
    EXPO_PUBLIC_DEV_PREVIEW: 'false',
    EXPO_PUBLIC_SUPABASE_URL: 'https://example.invalid',
  };
  const childEnvironment = buildPreviewEnvironment(parentEnvironment);

  assert.notEqual(childEnvironment, parentEnvironment);
  assert.equal(childEnvironment.EXPO_PUBLIC_DEV_PREVIEW, 'true');
  assert.equal(parentEnvironment.EXPO_PUBLIC_DEV_PREVIEW, 'false');
  assert.deepEqual(
    Object.fromEntries(Object.entries(childEnvironment).filter(([key]) => key !== 'EXPO_PUBLIC_DEV_PREVIEW')),
    Object.fromEntries(Object.entries(parentEnvironment).filter(([key]) => key !== 'EXPO_PUBLIC_DEV_PREVIEW')),
  );
});
