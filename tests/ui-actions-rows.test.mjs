import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manager = await readFile(new URL('../src/features/home/DailyActivityManagerSheet.tsx', import.meta.url), 'utf8');
const log = await readFile(new URL('../src/features/puppy-log/LogScreen.tsx', import.meta.url), 'utf8');
const checklist = await readFile(new URL('../src/features/knowledge/PuppyChecklistScreen.tsx', import.meta.url), 'utf8');
const button = await readFile(new URL('../src/components/ui/Button.tsx', import.meta.url), 'utf8');
const sheet = await readFile(new URL('../src/components/ui/BottomSheet.tsx', import.meta.url), 'utf8');

test('routine edit is an accessible icon-only control and weekday targets stay one row and scrollable', () => {
  assert.match(manager, /IconOnlyButton icon="create-outline" accessibilityLabel=\{`Redigera rutin \$\{routine\.label\}`\}/);
  assert.doesNotMatch(manager, /ActionButton icon="create-outline" label="Redigera"/);
  assert.match(manager, /const weekdayShortNames = \['Må', 'Ti', 'On', 'To', 'Fr', 'Lö', 'Sö'\]/);
  assert.match(manager, /<ScrollView horizontal showsHorizontalScrollIndicator=\{false\} contentContainerStyle=\{styles\.weekdayChoices\}>/);
  assert.match(manager, /accessibilityRole="checkbox" accessibilityLabel=\{name\}/);
  assert.match(manager, /weekdayChoices: \{ flexDirection: 'row', flexWrap: 'nowrap'/);
  assert.match(manager, /weekdayButton: \{ flexShrink: 0, minWidth: tokens\.size\.touchMin, minHeight: tokens\.size\.touchMin/);
  assert.doesNotMatch(manager, /weekdayButton: \{[^}]*flexBasis/);
});

test('log editor exposes a selected category icon trigger and icon/name radio choices', () => {
  const editor = log.slice(log.indexOf('function LogEventEditor'), log.indexOf('function formatInterval'));
  assert.match(editor, /const \[type, setType\] = useState\(event\.type\)/);
  assert.match(editor, /const \[typePickerOpen, setTypePickerOpen\] = useState\(false\)/);
  assert.match(editor, /accessibilityLabel=\{`Händelsetyp: \$\{LOG_EVENT_LABELS\[type\]\}`\}/);
  assert.match(editor, /accessibilityState=\{\{ disabled, expanded: typePickerOpen \}\} aria-expanded=\{typePickerOpen\}/);
  assert.match(editor, /<IconChip category=\{type\} size="medium" variant="rev02-log" \/>/);
  assert.match(editor, /name="chevron-down"/);
  assert.match(editor, /\{LOG_ENTRY_TYPES\.map\(\(option\) =>/);
  assert.match(editor, /<IconChip category=\{option\} size="medium" variant="rev02-log" \/>/);
  assert.match(editor, /accessibilityRole="radio" accessibilityLabel=\{LOG_EVENT_LABELS\[option\]\}/);
  assert.match(editor, /aria-checked=\{selected\}/);
  assert.match(editor, /\{LOG_EVENT_LABELS\[option\]\}/);
  assert.match(editor, /changeType\(option\); setTypePickerOpen\(false\)/);
  assert.match(sheet, /<ScrollView[^>]*style=\{\[styles\.scroll, keyboardAware && styles\.keyboardAwareScroll\]\}[^>]*>\{children\}<\/ScrollView>/);
  assert.match(sheet, /\{footer \? <View style=\{styles\.footer\}>\{footer\}<\/View> : null\}/);
  assert.match(editor, /legacyUnknownAccident/);
  assert.match(editor, /<DatePickerField label="Datum"/);
  assert.match(editor, /<TimePickerField label="Tid"/);
  assert.match(editor, /<Button variant="destructive" label="Radera"/);
  assert.match(editor, /<Button variant="secondary" label="Avbryt"/);
});

test('checklist own-item edit uses the real shared icon-only button with its full label', () => {
  assert.match(checklist, /<Button variant="icon" label="Ändra" iconName="create-outline" accessibilityLabel=\{`Ändra \$\{item\.title\}`\}/);
  assert.match(button, /variant === 'icon' \? <Ionicons name=\{iconName\}[^:]*: <Text[^>]*>\{label\}<\/Text>/);
  assert.match(button, /width: tokens\.size\.touchMin, height: tokens\.size\.touchMin, minHeight: tokens\.size\.touchMin/);
});
