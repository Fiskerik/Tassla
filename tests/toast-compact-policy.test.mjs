import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');
const toast = read('src/components/ui/Toast.tsx');
const logScreen = read('src/features/puppy-log/LogScreen.tsx').replace(/\r\n?/g, '\n');

test('only confirmed success receives the decorative green check and compact success styles', () => {
  assert.match(toast, /effectiveTone = tone === 'success' && !confirmed \? 'uncertain' : tone/);
  assert.match(toast, /displayContent\.tone === 'success' \? <Ionicons name="checkmark-circle"[^>]*color=\{tokens\.colors\.success\} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"/);
  assert.match(toast, /success: \{ paddingVertical: tokens\.spacing\.xs, paddingHorizontal: tokens\.spacing\.sm, gap: tokens\.spacing\.xs, backgroundColor: tokens\.colors\.successSurface, borderColor: tokens\.colors\.success \}/);
  assert.match(toast, /successMessage: \{ \.\.\.tokens\.typography\.caption/);
  assert.match(toast, /accessibilityRole=\{exposed \? 'alert' : undefined\} accessibilityLabel=\{exposed \? displayContent\.message : undefined\}/);
});
test('success keeps undo and errors keep retry and cancel semantics', () => {
  assert.match(toast, /displayContent\.tone === 'success' && displayContent\.onUndo \? \{ label: 'Ångra'/);
  assert.match(toast, /displayContent\.tone === 'error' \|\| displayContent\.tone === 'uncertain'\) \? \{ label: 'Försök igen'/);
  assert.match(toast, /displayContent\.tone === 'error' && displayContent\.onCancel \? <Button variant="secondary" label="Avbryt"/);
});

test('all visible and exiting toasts use the shared tokenized vertical margin and hidden toast returns no layout node', () => {
  assert.match(toast, /if \(phase === 'hidden'\) return null/);
  assert.match(toast, /marginVertical: tokens\.spacing\.md/);
});

test('LogScreen puts every confirmed mutation result after the normal grid and before Fler', () => {
  const gridEnd = logScreen.indexOf('</View>\n      {successToast}');
  const feedback = logScreen.indexOf('{successToast}', gridEnd);
  const more = logScreen.indexOf('label="Fler"', feedback);
  assert.ok(gridEnd >= 0 && feedback > gridEnd && more > feedback, 'confirmation follows the primary grid and precedes Fler');
  const expandedTiles = logScreen.indexOf('{!layoutEditing && moreVisible ? <View style={styles.grid} accessibilityLabel="Fler loggtyper"', more);
  assert.ok(expandedTiles > more, 'expanded quick-log choices follow the success feedback');
  assert.match(logScreen.slice(logScreen.indexOf('const successToast ='), logScreen.indexOf('\n  return <View', logScreen.indexOf('const successToast ='))), /visible=\{mutation\?\.status === 'saved'/);
  assert.match(logScreen, /mutation\.kind === 'add' \? `\$\{LOG_EVENT_LABELS\[mutation\.type\]\} loggat` : mutation\.kind === 'update' \? 'Ändring sparad' : 'Händelsen är raderad'/);
  assert.doesNotMatch(logScreen, /DogMascot|dogReaction/);
  assert.match(logScreen, /const undoableQuickLogId = mutation\?\.status === 'saved' && mutation\.kind === 'add' && onUndo !== undefined \? mutation\.id : undefined;/);
  assert.match(logScreen, /onUndo=\{undoableQuickLogId !== undefined \? \(\) => \{ firstUseTip\.dismiss\(\); onUndo\?\.\(undoableQuickLogId\); \} : undefined\}/);
  assert.match(logScreen, /autoDismissMs=\{undoableQuickLogId !== undefined && screenReaderEnabled !== false \? undefined : 2500\}/);
  assert.match(logScreen, /onAutoDismiss=\{\(\) => setDismissedMutationKey\(successMutationKey\)\}/);
});

test('selecting a quick log while Fler is expanded collapses Fler before the saved feedback appears', () => {
  const selectStart = logScreen.indexOf('function selectType(');
  const selectEnd = logScreen.indexOf('\n  function toggleMore()', selectStart);
  const selection = logScreen.slice(selectStart, selectEnd);
  assert.match(selection, /setMoreVisible\(false\)/);
  assert.match(selection, /onAdd\(type\)/);
  assert.match(logScreen, /!layoutEditing && moreVisible \? <View style=\{styles\.grid\} accessibilityLabel="Fler loggtyper"/);
});
