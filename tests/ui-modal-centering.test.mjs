import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [bottomSheet, actionMenu, appPrimitives, dialog, iconPicker, knowledge] = await Promise.all([
  read('src/components/ui/BottomSheet.tsx'),
  read('src/components/ui/ActionMenu.tsx'),
  read('src/components/AppPrimitives.tsx'),
  read('src/components/ui/Dialog.tsx'),
  read('src/features/checklists/ChecklistIconPicker.tsx'),
  read('src/features/knowledge/PuppyChecklistScreen.tsx'),
]);

test('BottomSheet is centered and bounded, with horizontal and vertical gestures on the safe handle', () => {
  assert.match(bottomSheet, /testID="center-modal-bottom-sheet"/);
  assert.match(bottomSheet, /pointerEvents="box-none" style=\{\[styles\.modalFrame/);
  assert.match(bottomSheet, /modalFrame: \{[^}]*alignItems: 'center', justifyContent: 'center'/);
  assert.match(bottomSheet, /sheet: \{[^}]*maxWidth: 560[^}]*maxHeight: '90%'/);
  assert.match(bottomSheet, /animationType=\{reduced \? 'none' : 'fade'\}/);
  assert.match(bottomSheet, /onRequestClose=\{onRequestClose\}/);
  assert.match(bottomSheet, /StyleSheet\.absoluteFill/);
  assert.match(bottomSheet, /\{\.\.\.drag\.panHandlers\}/);
  assert.match(bottomSheet, /ModalSwipeHandle panHandlers=\{swipe\.panHandlers\}/);
  assert.match(bottomSheet, /useModalSwipeDismiss\(visible, onRequestClose, reduced\)/);
});

test('ActionMenu is centered while edit/delete remain separate one-shot menu actions', () => {
  assert.match(actionMenu, /testID="center-modal-action-menu"/);
  assert.match(actionMenu, /pointerEvents="box-none" style=\{styles\.modalFrame\}/);
  assert.match(actionMenu, /modalFrame: \{[^}]*alignItems: 'center', justifyContent: 'center'/);
  assert.equal((actionMenu.match(/onClose\(\); onEdit\(\)/g) ?? []).length, 1);
  assert.equal((actionMenu.match(/onClose\(\); onDelete\(\)/g) ?? []).length, 1);
  assert.match(actionMenu, /accessibilityRole="menu"/);
  assert.match(actionMenu, /accessibilityRole="menuitem" accessibilityLabel=\{`Ändra/);
  assert.match(actionMenu, /accessibilityRole="menuitem" accessibilityLabel=\{`Radera/);
  assert.match(actionMenu, /width: tokens\.size\.touchMin, minHeight: tokens\.size\.touchMin/);
  assert.match(actionMenu, /ModalSwipeHandle panHandlers=\{swipe\.panHandlers\}/);
  assert.match(actionMenu, /animationType=\{reduced \? 'none' : 'fade'\}/);
});

test('TimePicker is centered with reduced-motion-aware fade and bounded scrollable content', () => {
  assert.match(appPrimitives, /testID="center-modal-time-picker"/);
  assert.match(appPrimitives, /paddingTop: Math\.max\(insets\.top, tokens\.spacing\.md\), paddingBottom: Math\.max\(insets\.bottom, tokens\.spacing\.md\)/);
  assert.match(appPrimitives, /animationType=\{reducedMotion \? 'none' : 'fade'\}/);
  assert.match(appPrimitives, /timeModalFrame: \{[^}]*alignItems: 'center', justifyContent: 'center'/);
  assert.match(appPrimitives, /timeModalCard: \{[^}]*maxWidth: 560[^}]*maxHeight: '100%'/);
  assert.match(appPrimitives, /<ScrollView testID="time-picker-options" style=\{styles\.timeModalList\}/);
  assert.match(appPrimitives, /onRequestClose=\{\(\) => setVisible\(false\)\}/);
  assert.match(appPrimitives, /ModalSwipeHandle panHandlers=\{swipe\.panHandlers\}/);
});

test('existing Dialog, InfoModal and date picker retain centered layouts', () => {
  assert.match(dialog, /backdrop: \{[^}]*justifyContent: 'center'/);
  assert.match(appPrimitives, /modalBackdrop: \{[^}]*justifyContent: 'center'/);
  assert.match(appPrimitives, /dateModalBackdrop: \{[^}]*justifyContent: 'center'/);
  assert.match(appPrimitives, /testID="center-modal-info"/);
  assert.match(appPrimitives, /testID="center-modal-date-picker"/);
  assert.match(appPrimitives, /ModalSwipeHandle panHandlers=\{swipe\.panHandlers\}/);
  assert.match(appPrimitives, /<Animated\.View testID="center-modal-info"/);
  assert.match(appPrimitives, /<Animated\.View testID="center-modal-date-picker"/);
  assert.match(dialog, /ModalSwipeHandle panHandlers=\{swipe\.panHandlers\}/);
  assert.match(dialog, /animationType=\{reduced \? 'none' : 'fade'\}/);
});

test('Knowledge icon choices expand in the form flow rather than a positioned popover', () => {
  assert.doesNotMatch(iconPicker, /popover/i);
  assert.doesNotMatch(iconPicker.match(/grid: \{[^}]+\}/)?.[0] ?? '', /position:\s*'absolute'/);
  assert.match(iconPicker, /accessibilityRole="radiogroup"/);
  assert.match(iconPicker, /testID=\{`\$\{testIDPrefix\}-icon-choice-group`\}/);
  assert.match(knowledge, /formFieldStack/);
  assert.match(knowledge, /<ChecklistIconPickerChoices[\s\S]*?onSelect=\{\(icon\) =>/);
  assert.doesNotMatch(knowledge, /<ChecklistIconPicker[^TC]/);
});
