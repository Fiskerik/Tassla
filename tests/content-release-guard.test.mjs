import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../tools/check-content-release.cjs', import.meta.url));
for (const [name, channel, flag, succeeds] of [
  ['review channel enables examples', 'review', 'true', true],
  ['public channel disables examples', 'public', 'false', true],
  ['public channel rejects examples', 'public', 'true', false],
  ['public channel rejects a missing flag', 'public', undefined, false],
  ['unknown channel is rejected', 'staging', 'false', false],
]) {
  test(name, () => {
    const directory = mkdtempSync(join(tmpdir(), 'tassla-content-guard-'));
    try {
      const result = spawnSync(process.execPath, [script], { encoding: 'utf8', env: { ...process.env, CM_BUILD_DIR: directory, TASSLA_BUILD_CHANNEL: channel, ...(flag === undefined ? { EXPO_PUBLIC_TASSLA_REVIEW_CONTENT: '' } : { EXPO_PUBLIC_TASSLA_REVIEW_CONTENT: flag }) } });
      assert.equal(result.status === 0, succeeds, result.stderr);
      if (succeeds) {
        const metadata = JSON.parse(readFileSync(join(directory, 'codemagic-logs/content-build-metadata.json'), 'utf8'));
        assert.equal(metadata.channel, channel);
        assert.equal(metadata.reviewContentEnabled, flag === 'true');
      }
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
}
