import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');

test('motion durations live in tokens and stay within the approved range', () => {
  const tokens = read('src/theme/tokens.ts');
  const motionBlock = tokens.match(/motion:\s*\{([^}]+)\}/)?.[1];
  assert.ok(motionBlock, 'motion tokens are present');
  const durations = [...motionBlock.matchAll(/(press|enter|release|progress|toastEnter|toastExit|check):\s*(\d+)/g)].map((match) => Number(match[2]));
  assert.ok(durations.length >= 7);
  for (const duration of durations) assert.ok(duration >= 120 && duration <= 350, `${duration}ms is outside 120–350ms`);
});

test('ScreenTransition skips mount motion and accepts an explicit directional distance', () => {
  const motion = read('src/components/ui/Motion.tsx');
  assert.match(motion, /distance = tokens\.motion\.distance/);
  assert.match(motion, /distance\?: number/);
  assert.match(motion, /const previousTransitionKey = useRef\(transitionKey\)/);
  assert.match(motion, /const keyChanged = previousTransitionKey\.current !== transitionKey/);
  assert.match(motion, /if \(!keyChanged \|\| reduced\) \{ progress\.setValue\(1\); return; \}/);
  assert.match(motion, /progress\.stopAnimation\(\)/);
  assert.match(motion, /outputRange: \[shift, 0\]/);
});

test('animated feedback uses the shared reduced-motion hook and native driver except progress width', () => {
  for (const file of ['Toast.tsx', 'Progress.tsx', 'ChecklistItem.tsx']) {
    const source = read(`src/components/ui/${file}`);
    assert.match(source, /useReducedMotion/);
    assert.match(source, /Animated\./);
  }
  assert.match(read('src/components/ui/Toast.tsx'), /useNativeDriver:\s*true/);
  assert.match(read('src/components/ui/ChecklistItem.tsx'), /useNativeDriver:\s*true/);
  assert.match(read('src/components/ui/Progress.tsx'), /useNativeDriver:\s*false/);
});

test('Toast keeps a hidden mount gap-free, exits before completion callback and hides exiting content from accessibility', () => {
  const source = read('src/components/ui/Toast.tsx');
  assert.match(source, /if \(phase === 'hidden'\) return null/);
  assert.match(source, /if \(phaseInputs\.visible !== visible\) setPhase\(visible \? 'visible' : reduced \? 'hidden' : 'exiting'\)/);
  assert.match(source, /else if \(!visible && reduced\) setPhase\('hidden'\)/);
  assert.match(source, /generation\.current === currentGeneration/);
  assert.match(source, /accessibilityElementsHidden=\{!exposed\}/);
  assert.match(source, /importantForAccessibility=\{exposed \? 'auto' : 'no-hide-descendants'\}/);
  assert.match(source, /const completeExit = useCallback\(\(\) =>/);
  assert.match(source, /if \(!exitPending\.current \|\| exitNotified\.current\) return/);
  assert.match(source, /exitPending\.current = true/);
  assert.match(source, /onExitCompleteRef\.current\?\.\(\)/);
  assert.match(source, /scheduleAutoDismiss\(currentGeneration\)/);
});

test('ChecklistItem only runs confirmed check animation and Progress initializes from its current value', () => {
  const checklist = read('src/components/ui/ChecklistItem.tsx');
  assert.match(checklist, /!previousChecked\.current && checked/);
  assert.match(checklist, /checked && confirmed && awaitingConfirmation\.current/);
  const progress = read('src/components/ui/Progress.tsx');
  assert.match(progress, /new Animated\.Value\(bounded\)/);
  assert.match(progress, /accessibilityValue=\{\{ min: 0, max: 100, now: bounded \}\}/);
});

test('TrainingScreen and ProductWorkspace were not given new animation state', () => {
  const training = read('src/features/training/TrainingScreen.tsx');
  const workspace = read('src/features/home/ProductWorkspace.tsx');
  assert.doesNotMatch(training, /Animated\.Value|useReducedMotion/);
  assert.doesNotMatch(workspace, /Animated\.Value|useReducedMotion/);
});

test('published training only animates the exact identity returned after refreshed readback', () => {
  const workspace = read('src/features/home/ProductWorkspace.tsx');
  const screen = read('src/features/training/PublishedTrainingScreen.tsx');
  const row = read('src/components/ui/ListRow.tsx');
  const log = read('src/features/puppy-log/LogScreen.tsx');
  assert.match(workspace, /const confirmedProgram = refreshed \? refreshed\.programs\.find\(\(item\) => item\.id === program\.id\) : undefined/);
  assert.match(workspace, /confirmedProgram\?\.completedStepIds\.includes\(stepId\)/);
  assert.match(workspace, /return \{ programId: program\.id, stepId \}/);
  assert.match(screen, /confirmed\.programId === selectedProgram\.id && confirmed\.stepId === selectedStep\.id/);
  assert.match(screen, /const key = `\$\{confirmed\.programId\}:\$\{confirmed\.stepId\}:\$\{\+\+animationSequence\.current\}`/);
  assert.match(screen, /setAnimateCompleteTarget\(\{ key, programId: confirmed\.programId, stepId: confirmed\.stepId \}\)/);
  assert.doesNotMatch(screen, /DogMascot|dogReaction/);
  assert.match(screen, /if \(!mounted\.current\) return;/);
  assert.match(screen, /animateCompleteKey=\{animateCompleteTarget\?\.programId === program\.id && animateCompleteTarget\.stepId === step\.id/);
  assert.match(row, /onAnimationStart\?\.\(animateKey\)/);
  assert.match(row, /if \(!reduced\) return;[\s\S]*?progress\.stopAnimation\(\);[\s\S]*?progress\.setValue\(1\)/);
  assert.match(screen, /current\?\.key === key \? null : current/);
  assert.match(log, /consumedEntryAnimationKey === entryTarget\.key \? undefined : entryTarget\.key/);
  assert.match(log, /setConsumedEntryAnimationKey\(key\)/);
  assert.doesNotMatch(log, /ScreenTransition/);
  assert.match(row, /complete \? `\$\{baseLabel\}, Genomförd` : baseLabel/);
  assert.doesNotMatch(row, /selected:\s*complete/);
});

test('log entry does not replay when reduced motion turns on mid-entry and then off', () => {
  const log = read('src/features/puppy-log/LogScreen.tsx');
  const entryTransition = log.match(/function LogEntryTransition\([\s\S]*?(?=\nfunction DeleteExitRow)/)?.[0];
  assert.ok(entryTransition, 'LogEntryTransition is present');
  assert.match(log, /consumedEntryAnimationKey === entryTarget\.key \? undefined : entryTarget\.key/);
  assert.match(entryTransition, /if \(playedKey\.current === transitionKey\)[\s\S]*?if \(reduceMotion\) \{ progress\.stopAnimation\(\); progress\.setValue\(1\); \}/);
  assert.match(entryTransition, /playedKey\.current = transitionKey;[\s\S]*?onAnimationStart\(transitionKey\)/);
  assert.match(entryTransition, /if \(reduceMotion\) \{ progress\.setValue\(1\); return; \}/);
  assert.match(entryTransition, /\[onAnimationStart, progress, reduceMotion, transitionKey\]/);
});

test('Toast callsites use explicit visibility and keep dismissal under the view owner', () => {
  for (const file of [
    'src/features/puppy-log/LogScreen.tsx',
    'src/features/training/PublishedTrainingScreen.tsx',
    'src/features/health/HealthHistoryScreen.tsx',
    'src/features/health/PlannedHealthScreen.tsx',
    'src/features/health/WeightScreen.tsx',
    'src/features/notifications/NotificationSettingsScreen.tsx',
    'src/features/onboarding/EditDogProfileScreen.tsx',
    'src/features/passport/PassportScreen.tsx',
  ]) {
    const source = read(file);
    for (const match of source.matchAll(/<Toast\b([^>]*)/g)) {
      assert.match(match[1], /\bvisible=/, `${file} has a Toast without explicit visibility`);
    }
  }
});
