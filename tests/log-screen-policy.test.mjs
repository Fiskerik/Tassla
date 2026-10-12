import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync('src/features/puppy-log/LogScreen.tsx', 'utf8');
const workspace = readFileSync('src/features/home/ProductWorkspace.tsx', 'utf8');
const appBar = readFileSync('src/components/ui/AppBar.tsx', 'utf8');
const quickTile = readFileSync('src/components/ui/QuickLogTile.tsx', 'utf8');
const listRow = readFileSync('src/components/ui/ListRow.tsx', 'utf8');
const toast = readFileSync('src/components/ui/Toast.tsx', 'utf8');

test('quick log uses shared controls and keeps the approved two by two plus more layout', () => {
  assert.match(screen, /<AppBar mode="Title" title="Logga"/);
  assert.match(appBar, /'Home' \| 'Back' \| 'Close' \| 'Title'/);
  assert.match(appBar, /mode === 'Back' \? control\('chevron-back'/);
  assert.match(appBar, /mode === 'Close' \? control\('close'/);
  assert.match(screen, /DEFAULT_QUICK_LOG_LAYOUT/);
  assert.match(screen, /layout\.primary/);
  assert.match(screen, /layout\.more/);
  assert.match(screen, /label="Olycka"|LOG_EVENT_LABELS/);
  assert.match(screen, /onLongPress=\{\(\) => \{ firstUseTip\.dismiss\(\); startLayoutEdit\(\); \}\}/);
  assert.match(screen, /accessibilityLabel="Fler loggtyper"/);
  assert.match(screen, /LayoutAnimation\.configureNext/);
  assert.doesNotMatch(screen, /<BottomSheet[\s\S]*?Fler loggtyper/);
  assert.match(screen, /label="Fler"[\s\S]*?icon=\{/);
  assert.match(quickTile, /icon\?: ReactNode/);
  assert.match(screen, /<QuickLogTile/);
  assert.match(screen, /<ListRow/);
});

test('quick log has truthful loading, empty, failure, mutation and confirmed undo states', () => {
  for (const copy of ['Loggen kunde inte hämtas.', 'Försök igen', 'Inget loggat än idag', 'Tryck på en ruta ovan för att lägga till dagens första händelse.', 'Sparar…', 'Kunde inte spara']) {
    assert.ok(screen.includes(copy), `missing state copy: ${copy}`);
  }
  assert.match(screen, /mutation\?\.status === 'unsure'/);
  assert.match(screen, /mutation\?\.status === 'saved'/);
  assert.match(screen, /onUndo=\{mutation\?\.status === 'saved' && mutation\.kind === 'add'[\s\S]*?onUndo\?\.\(mutation\.id\)/);
  assert.match(workspace, /setQuickLogMutation\(toQuickLogMutationView\(mutation, 'saved'\)\)/);
  assert.match(workspace, /pendingLogMutation\.current = mutation/);
  assert.match(workspace, /checkInsertRetryOperation\(mutation\.operation, \(id\) => fetchDogEventById\(client, dog\.id, id\)\)/);
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
  assert.match(screen, /onPress=\{deleting \? undefined : \(\) => \{ firstUseTip\.dismiss\(\); setEditingId\(event\.id\); \}\}/);
  assert.match(screen, /<Button variant="destructive" label="Radera"/);
  assert.doesNotMatch(screen, /SPARAD|ActionFeedbackModal/);
});

test('latest patterns stay collapsed until requested and have no toggle without data', () => {
  assert.match(screen, /patterns\.length > 0 \? <LatestPatternSummary key=\{`\$\{events\.find\(\(event\) => event\.dogId\)\?\.dogId \?\? 'none'\}:available`\}/);
  assert.match(screen, /function LatestPatternSummary\(/);
  assert.match(screen, /const \[visible, setVisible\] = useState\(false\)/);
  assert.match(screen, /label=\{visible \? 'Dölj dina senaste mönster' : 'Visa dina senaste mönster'\}/);
  assert.match(screen, /visible \? <Card accessibilityLabel="Dina senaste mönster för Kiss och Bajs">/);
  assert.match(screen, /setVisible\(\(current\) => !current\)/);
});

test('legacy row editing and deletion remain reachable from workspace and preview', () => {
  assert.match(screen, /onPress=\{deleting \? undefined : \(\) => \{ firstUseTip\.dismiss\(\); setEditingId\(event\.id\); \}\}/);
  assert.match(screen, /function LogEventEditor/);
  assert.match(screen, /onUpdate\?:/);
  assert.match(screen, /onDelete\?:/);
  assert.match(workspace, /onUpdate=\{updateEvent\} onDelete=\{\(id\) => deleteEvent\(id\)\}/);
  assert.match(screen, /LOG_ENTRY_TYPES\.map/);
  assert.match(screen, /DatePickerField/);
  assert.match(screen, /TimePickerField/);
  assert.match(screen, /Anteckning \(valfri\)/);
  assert.match(listRow, /<IconChip[\s\S]*?\{time \? <Text style=\{styles\.time\}>\{time\}<\/Text> : null\}<Text style=\{styles\.title\}>/);
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

test('optional detail sheets follow confirmed quick adds and settle without adding a required step', () => {
  assert.match(screen, /const detailSheet = useMemo\(\(\) => \{[\s\S]*?mutation\?\.kind === 'add' && mutation\.status === 'saved' && mutation\.detailsHandled !== true/);
  assert.match(screen, /events\.some\(\(event\) => event\.id === mutation\.id\)/);
  assert.match(screen, /dismissedDetailsMutationKey !== addKey/);
  assert.match(screen, /mutation\?\.kind === 'update' && mutation\.source === 'quick-add-details'/);
  assert.match(screen, /onUpdate\?\.\(detailSheet\.id, changes, 'quick-add-details'\)/);
  assert.match(screen, /onQuickDetailsSettled\?\.\(detailSheet\.id\)/);
  assert.match(screen, /label="Hoppa över"[\s\S]*?onPress=\{onSkip\}/);
  assert.match(screen, /setUndoDetailsSheet\(detailSheet\)/);
  assert.match(workspace, /detailsHandled: true/);
});

test('detail entry and row copy use the dog local history and the shared log model', () => {
  assert.match(screen, /events\.filter\(\(event\) => event\.dogId === dogId && event\.type === 'food' && event\.foodType\?\.trim\(\)\)/);
  assert.match(screen, /Dina tidigare fodertyper/);
  assert.match(screen, /formatLogEventDetails\(event\)/);
  assert.match(screen, /CheckboxCard label="Kiss"/);
  assert.match(screen, /CheckboxCard label="Bajs"/);
  assert.match(screen, /accessibilityRole="radiogroup" accessibilityLabel="Enhet"/);
  assert.match(screen, /Du kan ange högst 2 000 g per loggpost\./);
  assert.match(screen, /Fodertypen får innehålla högst 60 tecken\./);
});

test('workspace updates preserve untouched fields and serialize quick-add undo after detail writes', () => {
  assert.match(workspace, /accidentKind: row\.accident_kind, amount: row\.amount, amountUnit: row\.amount_unit, foodType: row\.food_type/);
  assert.match(workspace, /description: changes\.note === undefined \? previous\.description : changes\.note\?\.trim\(\) \|\| null/);
  assert.match(workspace, /if \(typeChanged \|\| changes\.amount !== undefined\)/);
  assert.match(workspace, /undoAfterDetailPatch\.current = id/);
  assert.match(workspace, /if \(shouldUndoQuickAdd && isCurrent\(\)\) void deleteEvent\(mutation\.id, 'undo'\)/);
  assert.match(workspace, /if \(mutation\?\.kind === 'update' && mutation\.source === 'quick-add-details' && undoAfterDetailPatch\.current === mutation\.id\) return false/);
});

test('quick-add detail update stays pending through readback so Undo can queue during reload', () => {
  const mutationStart = workspace.indexOf('async function runLogMutation(');
  const mutationEnd = workspace.indexOf('\n  function addEvent', mutationStart);
  const mutationSource = workspace.slice(mutationStart, mutationEnd);
  const savedBranchStart = mutationSource.indexOf("if (outcome.status === 'saved') {");
  const savedBranchEnd = mutationSource.indexOf("const presentationStatus =", savedBranchStart);
  const savedBranch = mutationSource.slice(savedBranchStart, savedBranchEnd);
  const reloadPosition = savedBranch.indexOf('await reloadEvents()');
  const clearPosition = savedBranch.indexOf('pendingLogMutation.current === mutation) pendingLogMutation.current = null');
  assert.match(savedBranch, /const deferQuickDetailsClearUntilReload = mutation\.kind === 'update' && mutation\.source === 'quick-add-details'/);
  assert.ok(reloadPosition >= 0, 'saved writes reload the event list');
  assert.ok(clearPosition > reloadPosition, 'the pending detail update stays available to Undo until readback finishes');
  assert.match(workspace, /undoAfterDetailPatch\.current = id;\s+if \(logMutationFlight\.current\) return/);
});
