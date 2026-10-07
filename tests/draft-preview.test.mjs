import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const previewSource = await readFile(new URL('../src/features/knowledge/DraftContentPreview.tsx', import.meta.url), 'utf8');
const developmentSource = await readFile(new URL('../src/features/home/DevelopmentPreview.tsx', import.meta.url), 'utf8');
const workspaceSource = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');

test('draft content preview requires explicit flag and development build', () => {
  assert.match(previewSource, /flag === ['"]true['"]/);
  assert.match(previewSource, /developmentBuild === true/);
  assert.match(previewSource, /typeof __DEV__ !== ['"]undefined['"] && __DEV__ === true/);
  assert.match(previewSource, /Utkast – ej granskat eller publicerat/);
});

test('draft preview is reachable only from the local development preview, never ProductWorkspace', () => {
  assert.match(developmentSource, /DraftContentPreview/);
  assert.match(developmentSource, /DRAFT_PREVIEW_ENABLED/);
  assert.doesNotMatch(workspaceSource, /DraftContentPreview|mvp-content-bundle-v1/);
});
