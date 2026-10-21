import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync('src/features/puppy-log/LogScreen.tsx', 'utf8');
const workspace = readFileSync('src/features/home/ProductWorkspace.tsx', 'utf8');
const quickTile = readFileSync('src/components/ui/QuickLogTile.tsx', 'utf8');
const listRow = readFileSync('src/components/ui/ListRow.tsx', 'utf8');
const toast = readFileSync('src/components/ui/Toast.tsx', 'utf8');

test('quick log keeps its date navigator and one-tap controls in a compact horizontal strip', () => {
  assert.match(screen, /<Text accessibilityRole="header" style=\{styles\.pageTitle\}>Logga<\/Text>/);
  assert.match(screen, /<View style=\{styles\.dateNavigator\}>/);
  assert.match(screen, /accessibilityLabel="Visa föregående dag"/);
  assert.match(screen, /DEFAULT_QUICK_LOG_LAYOUT/);
  assert.match(screen, /layout\.primary/);
  assert.match(screen, /layout\.more/);
  assert.match(screen, /label="Olycka"|LOG_EVENT_LABELS/);
  assert.match(screen, /onLongPress=\{\(\) => \{ firstUseTip\.dismiss\(\); startLayoutEdit\(\); \}\}/);
  assert.match(screen, /accessibilityLabel="Fler loggtyper"/);
  assert.match(screen, /const renderQuickStrip = \(types: readonly QuickLogLayoutType\[\]\) => <ScrollView[\s\S]*?horizontal[\s\S]*?contentContainerStyle=\{styles\.quickActionStrip\}/);
  assert.match(screen, /quickActionItem: \{ width: 128, flexShrink: 0 \}/);
  assert.match(screen, /moreActionItem: \{ width: 96 \}/);
  assert.doesNotMatch(screen, /<SectionHeader title="Snabb logg"|<SectionHeader title=\{selectedDate === todayDate \? 'Dagens logg'/);
  assert.match(screen, /LayoutAnimation\.configureNext/);
  assert.doesNotMatch(screen, /<BottomSheet[^>]*title="Fler loggtyper"/);
  assert.match(screen, /title="Lägg till händelse"[\s\S]*?accessibilityLabel="Fler loggtyper"/);
  assert.match(screen, /label="Fler"[\s\S]*?icon=\{/);
  assert.match(quickTile, /icon\?: ReactNode/);
  assert.match(screen, /<QuickLogTile/);
  assert.match(screen, /!layoutEditing && moreVisible \? renderQuickStrip\(layout\.more\) : null/);
  assert.match(screen, /<ListRow/);
});

test('quick log has truthful loading, empty, failure, mutation and confirmed undo states', () => {
  for (const copy of ['Loggen kunde inte hämtas.', 'Försök igen', 'Inga händelser den här dagen', 'Tryck på Lägg till händelse nedan för fler val, eller välj en ruta ovan för att logga idag.', 'Sparar…', 'Kunde inte spara']) {
    assert.ok(screen.includes(copy), `missing state copy: ${copy}`);
  }
  assert.match(screen, /mutation\?\.status === 'unsure'/);
  assert.match(screen, /mutation\?\.status === 'saved'/);
  assert.match(screen, /onUndo=\{mutation\?\.status === 'saved' && mutation\.kind === 'add'[\s\S]*?onUndo\?\.\(mutation\.id\)/);
  assert.match(workspace, /setQuickLogMutation\(toQuickLogMutationView\(mutation, 'saved'\)\)/);
  assert.match(workspace, /pendingLogMutation\.current = mutation/);
  assert.match(workspace, /const retryCheck = await checkInsertRetryOperation\(mutation\.operation, async \(id\) =>/);
});

test('delete snapshot replaces its source row and exits only after a token-matched saved result', () => {
  assert.match(screen, /events\.filter\(\(event\) => event\.id !== deleteSnapshot\.event\.id\), deleteSnapshot\.event/);
  assert.match(screen, /setDeleteSnapshot\(\{ token, event, phase: 'pending' \}\)/);
  assert.match(screen, /if \(saved === true\)[\s\S]*?phase: 'exiting'/);
  assert.match(screen, /if \(saved !== false\)[\s\S]*?setEditingId\(null\)/);
  assert.match(screen, /current\?\.token === token \? null : current/);
  assert.match(screen, /accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none"/);
  assert.match(screen, /handledEntryMutationKey\.current === key/);
  assert.match(screen, /handledEntryMutationKey\.current = key/);
});

test('quick log hides sparse patterns and keeps edit/delete inside the row editor', () => {
  assert.match(screen, /summarizePottyPatterns\(events\)\.filter\(\(item\) => item\.count >= 2\)/);
  assert.match(screen, /onPress=\{deleting \? undefined : \(\) => \{ firstUseTip\.dismiss\(\); editorSubmitRef\.current = null; setEditorActionState\(\{ canSave: false, saving: false \}\); setEditingId\(event\.id\); \}\}/);
  assert.match(screen, /<Button variant="destructive" label="Radera"/);
  assert.doesNotMatch(screen, /SPARAD|ActionFeedbackModal/);
});

test('legacy row editing and deletion remain reachable from workspace and preview', () => {
  assert.match(screen, /onPress=\{deleting \? undefined : \(\) => \{ firstUseTip\.dismiss\(\); editorSubmitRef\.current = null; setEditorActionState\(\{ canSave: false, saving: false \}\); setEditingId\(event\.id\); \}\}/);
  assert.match(screen, /function LogEventEditor/);
  assert.match(screen, /onUpdate\?:/);
  assert.match(screen, /onDelete\?:/);
  assert.match(workspace, /onUpdate=\{updateEvent\} onDelete=\{\(id\) => deleteEvent\(id\)\}/);
  assert.match(screen, /LOG_ENTRY_TYPES\.map/);
  assert.match(screen, /DatePickerField/);
  assert.match(screen, /TimePickerField/);
  assert.match(screen, /Anteckning \(valfri\)/);
  assert.match(listRow, /const content = isLogTimeline \? <>[\s\S]*?<View style=\{styles\.logTimeColumn\}>\{time \? <Text style=\{styles\.logTime\}>\{time\}<\/Text> : null\}<\/View>[\s\S]*?<IconChip category=\{category\} variant="rev02-log"[\s\S]*?<View style=\{styles\.copy\}><View style=\{styles\.headline\}>\{titleText\}<\/View>/);
  assert.match(screen, /tryck för att ändra/);
});

test('pending mutations show once on their row, success toast expires, and partial paging offers retry', () => {
  assert.match(screen, /kind: 'add' \| 'update' \| 'delete' \| 'undo'/);
  assert.match(screen, /mutation\?\.kind === 'add' && mutation\.status === 'pending'/);
  assert.match(screen, /rowPending = mutation\?\.id === event\.id && mutation\.status === 'pending'/);
  assert.match(screen, /rowPending \? ', sparar' : ''/);
  assert.doesNotMatch(screen, /status === 'pending' && <Toast/);
  assert.match(screen, /onAutoDismiss=\{\(\) => setDismissedMutationKey\(successMutationKey\)\}/);
  assert.match(screen, /mutation\.mutationId/);
  assert.match(workspace, /current\.kind !== 'add' \|\| current\.id !== id/);
  assert.match(screen, /<Toast visible=\{loadMoreError\} tone="error" message="Äldre poster kunde inte hämtas" onRetry=\{onLoadMore \? \(\) => \{ firstUseTip\.dismiss\(\); return onLoadMore\(\); \} : undefined\}/);
  assert.match(workspace, /logLifetime\.current !== lifetime/);
  assert.match(toast, /withCancel: \{ flexDirection: 'column'/);
  assert.match(toast, /tone: 'uncertain'; onRetry: \(\) => void/);
});

test('duplicate dialog uses the approved full copy', () => {
  assert.match(screen, /title="Du har redan loggat det här\. Lägga till ändå\?"/);
});

test('quick add labels, rapid-tap guard, retry propagation and Swedish decimal format stay explicit', () => {
  assert.equal((screen.match(/accessibilityLabel=\{`Logga \$\{LOG_EVENT_LABELS\[type\]\.toLocaleLowerCase\('sv-SE'\)\}`\}/g) ?? []).length, 1);
  assert.match(screen, /const lastSubmitAt = useRef<number \| null>\(null\)/);
  assert.match(screen, /lastSubmitAt\.current = timestamp/);
  assert.match(workspace, /onRetry=\{retryLogMutation\}/);
  assert.match(workspace, /const logLifetime = useRef\(''\)/);
  assert.match(workspace, /const isCurrent = \(\) => isLogMutationLifetimeCurrent\(lifetime, logLifetime\.current, mounted\.current\)/);
  assert.match(screen, /label="Avbryt"[\s\S]*?disabled=\{saving \|\| disabled\}/);
  assert.match(screen, /DatePickerField label="Datum" disabled=\{disabled\}/);
  assert.match(screen, /TimePickerField label="Tid" disabled=\{disabled\}/);
  assert.match(workspace, /setQuickLogMutation\(toQuickLogMutationView\(mutation, 'pending'\)\);[\s\S]*?checkInsertRetryOperation/);
  assert.match(workspace, /finishLogMutationFlight\(logMutationFlight\.current, flightToken\)/);
  assert.match(screen, /toLocaleString\('sv-SE'\)/);
});
