import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const files = await Promise.all([
  readFile(new URL('../src/components/ui/DogMascot.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/ui/Motion.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/puppy-log/LogScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/training/PublishedTrainingScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/ui/index.ts', import.meta.url), 'utf8'),
  readFile(new URL('../assets/images/dog-mascot.png', import.meta.url)),
]);
const [mascot, motion, logScreen, trainingScreen, uiIndex, png] = files;

test('mascot is decorative, one-shot per reaction key and static with reduced motion', () => {
  assert.match(mascot, /useReducedMotionPreference\(\)/);
  assert.match(mascot, /if \(!reactionKey \|\| !motionReady\) return;/);
  assert.doesNotMatch(mascot, /AccessibilityInfo/);
  assert.match(motion, /export function useReducedMotionPreference\(\)/);
  assert.match(motion, /ready: false/);
  assert.match(motion, /receivedChange/);
  assert.match(motion, /if \(active && !receivedChange\) setPreference\(\{ reduced: true, ready: true \}\)/);
  assert.match(mascot, /playedKey\.current === reactionKey/);
  assert.match(mascot, /playedKey\.current = reactionKey/);
  assert.match(mascot, /Animated\.sequence\(\[/);
  assert.match(mascot, /if \(reducedMotion\) \{ scale\.setValue\(1\); return; \}/);
  assert.match(mascot, /accessibilityElementsHidden importantForAccessibility="no-hide-descendants"/);
  assert.doesNotMatch(mascot, /Animated\.loop|Vibration|Haptics/);
  assert.match(uiIndex, /export \{ DogMascot \} from '\.\/DogMascot'/);
});

test('owner decision keeps the mascot out of Logg and Träning while confirmed feedback remains', () => {
  assert.doesNotMatch(logScreen, /DogMascot|dogReaction/);
  assert.doesNotMatch(trainingScreen, /DogMascot|dogReaction/);
  assert.match(logScreen, /const successToast = <Toast visible=\{mutation\?\.status === 'saved'/);
  assert.match(trainingScreen, /<Toast visible=\{Boolean\(successMessage\) && !selectedProgram\} tone="success" confirmed message=\{successMessage\}/);
  assert.match(trainingScreen, /<Toast visible=\{Boolean\(successMessage\) && Boolean\(selectedProgram\)\} tone="success" confirmed message=\{successMessage \|\| undefined\}/);
  assert.match(trainingScreen, /if \(confirmed && confirmed\.programId === selectedProgram\.id && confirmed\.stepId === selectedStep\.id\)/);
});

test('mascot asset is a transparent square PNG within the approved byte budget', async () => {
  const imageStat = await stat(new URL('../assets/images/dog-mascot.png', import.meta.url));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 512);
  assert.equal(png.readUInt32BE(20), 512);
  assert.equal(png[25], 6, 'PNG color type 6 carries RGBA transparency');
  assert.ok(imageStat.size <= 300_000, `asset is ${imageStat.size} bytes`);
});
