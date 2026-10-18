import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync('src/features/puppy-log/LogScreen.tsx', 'utf8');
const workspace = readFileSync('src/features/home/ProductWorkspace.tsx', 'utf8');
const quickTile = readFileSync('src/components/ui/QuickLogTile.tsx', 'utf8');
const listRow = readFileSync('src/components/ui/ListRow.tsx', 'utf8');
const toast = readFileSync('src/components/ui/Toast.tsx', 'utf8');
const insights = readFileSync('src/features/puppy-log/InsightsScreen.tsx', 'utf8');

test('quick log uses the approved page heading, date navigator, two column grid and more tile', () => {
  assert.match(screen, /<Text accessibilityRole="header" style=\{styles\.pageTitle\}>Logga<\/Text>/);
  assert.match(screen, /<View style=\{styles\.dateNavigator\}>/);
  assert.match(screen, /accessibilityLabel="Visa föregående dag"/);
  assert.match(screen, /DEFAULT_QUICK_LOG_LAYOUT/);
  assert.match(screen, /layout\.primary/);
  assert.match(screen, /layout\.more/);
  assert.match(screen, /label="Olycka"|LOG_EVENT_LABELS/);
  assert.match(screen, /onLongPress=\{\(\) => \{ firstUseTip\.dismiss\(\); startLayoutEdit\(\); \}\}/);
  assert.match(screen, /accessibilityLabel="Fler loggtyper"/);
  assert.match(screen, /LayoutAnimation\.configureNext/);
  assert.doesNotMatch(screen, /<BottomSheet[^>]*title="Fler loggtyper"/);
  assert.match(screen, /title="Lägg till händelse"[\s\S]*?accessibilityLabel="Fler loggtyper"/);
  assert.match(screen, /label="Fler"[\s\S]*?icon=\{/);
  assert.match(quickTile, /icon\?: ReactNode/);
  assert.match(screen, /<QuickLogTile/);
  assert.match(screen, /<ListRow/);
});

test('quick log has truthful loading, empty, failure, mutation and confirmed undo states', () => {
  for (const copy of ['Loggen kunde inte hämtas.', 'Försök igen', 'Inga händelser den här dagen', 'Välj en annan dag eller tryck på en ruta ovan för att logga en händelse idag.', 'Sparar…', 'Kunde inte spara']) {
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
  assert.match(screen, /if \(reduceMotion\) \{ onFinished\(token\); return; \}/);
  assert.match(screen, /handledEntryMutationKey\.current === key/);
  assert.match(screen, /handledEntryMutationKey\.current = key/);
});

test('quick log hides sparse patterns and keeps edit/delete inside the row editor', () => {
  assert.match(screen, /summarizePottyPatterns\(events\)\.filter\(\(item\) => item\.count >= 2\)/);
  assert.match(screen, /onPress=\{deleting \? undefined : \(\) => \{ firstUseTip\.dismiss\(\); editorSubmitRef\.current = null; setEditorActionState\(\{ canSave: false, saving: false, dirty: false \}\); setEditingId\(event\.id\); \}\}/);
  assert.match(screen, /<Button variant="destructive" label="Radera"/);
  assert.doesNotMatch(screen, /SPARAD|ActionFeedbackModal/);
});

test('legacy row editing and deletion remain reachable from workspace and preview', () => {
  assert.match(screen, /onPress=\{deleting \? undefined : \(\) => \{ firstUseTip\.dismiss\(\); editorSubmitRef\.current = null; setEditorActionState\(\{ canSave: false, saving: false, dirty: false \}\); setEditingId\(event\.id\); \}\}/);
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

test('insights omit zero-count bars and disclose an empty selected period', () => {
  assert.match(insights, /bucket\.pee > 0 \? <View testID=\{`insights-pee-bar-\$\{bucket\.key\}`\}/);
  assert.match(insights, /bucket\.poop > 0 \? <View testID=\{`insights-poop-bar-\$\{bucket\.key\}`\}/);
  assert.ok(insights.includes('Ingen räknad logg i perioden'));
  assert.ok(insights.includes('insights-empty-period'));
  assert.match(insights, /periodHasCountableEvents = buckets\.some\(\(bucket\) => bucket\.hasCountableLog\)/);
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


test('log editor protects dirty drafts and keeps pending, failed, and unsure outcomes distinct', () => {
  assert.match(screen, /isLogEventDraftDirty\(event, \{ type, date, time, note, accidentKinds \}\)/);
  assert.match(screen, /registerEditorLeaveGuard\(editorOwnerToken\.current/);
  assert.match(screen, /const requestEditorLeave = useCallback\(\(commit: \(\) => void\): boolean/);
  assert.match(screen, /if \(leaveAlertOpen\.current \|\| editLocked\) return false;/);
  assert.match(screen, /commit\(\);\s*return true;/);
  assert.match(screen, /\], \{ cancelable: true, onDismiss: \(\) => \{ leaveAlertOpen\.current = false; \} \}\);\s*return false;/);
  assert.match(screen, /Alert\.alert\('Osparade ändringar', 'Vill du lämna utan att spara\?'/);
  assert.match(screen, /Ändringen sparas\. Vänta tills resultatet har bekräftats innan du lämnar\./);
  assert.match(screen, /Ändringen sparades inte\. Försök igen eller fortsätt redigera\./);
  assert.match(screen, /cancelLabel="Fortsätt redigera"/);
  assert.match(screen, /Vi kunde inte kontrollera om ändringen sparades\. Kontrollera status innan du lämnar\./);
  const editSheet = screen.slice(screen.indexOf('{editingEvent ? <BottomSheet'), screen.indexOf('</BottomSheet>', screen.indexOf('{editingEvent ? <BottomSheet')));
  assert.match(editSheet, /dragToDismiss/);
  assert.match(editSheet, /onCancel=\{onCancel \? \(\) => \{ firstUseTip\.dismiss\(\); onCancel\(\); \} : undefined\}/);
});

test('Logg exposes the approved insights entry and preserves the editor leave guard', () => {
  assert.match(screen, /label="Översikt" accessibilityLabel="Öppna insikter för Kiss och Bajs"/);
  assert.match(workspace, /onOpenInsights=\{\(\) => \{ const guard = editorLeaveGuard\.current; if \(guard\) guard\.requestLeave\(\(\) => setPage\('insights'\)\); else setPage\('insights'\); \}\}/);
});

test('R7 keeps period, coverage, empty and retry states visible with a readable count alternative', () => {
  for (const copy of ['Vecka', 'Månad', 'Sedan start', 'Ej loggat', 'Tidszon:', 'Ingen historik ännu', 'Ingen delvis graf visas.', 'Siffror']) assert.ok(insights.includes(copy), 'missing insights UI contract: ' + copy);
  assert.match(insights, /accessibilityLabel="Föregående period"/);
  assert.match(insights, /accessibilityLabel="Nästa period"/);
  assert.match(insights, /accessibilityRole="tab"/);
  assert.match(insights, /state === 'ready' && validTimeZone && events\.length > 0 && range/);
  assert.match(insights, /state === 'error' \|\| !validTimeZone/);
});
