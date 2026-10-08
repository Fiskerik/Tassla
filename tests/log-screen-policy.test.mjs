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
  assert.match(appBar, /mode !== 'Title'/);
  assert.match(screen, /\(\['pee', 'poop'\] as const\)/);
  assert.match(screen, /\(\['food', 'sleep'\] as const\)/);
  assert.match(screen, /title="Fler loggtyper"/);
  assert.match(screen, /\(\['walk', 'awake'\] as const\)/);
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
  assert.match(screen, /onUndo=\{mutation\.kind === 'add'[\s\S]*?onUndo\?\.\(mutation\.id\)/);
  assert.match(workspace, /setQuickLogMutation\(toQuickLogMutationView\(mutation, 'saved'\)\)/);
  assert.match(workspace, /pendingLogMutation\.current = mutation/);
  assert.match(workspace, /checkInsertRetryOperation\(mutation\.operation, \(id\) => fetchDogEventById\(client, dog\.id, id\)\)/);
});

test('quick log hides sparse patterns and keeps edit/delete inside the row editor', () => {
  assert.match(screen, /summarizePottyPatterns\(events\)\.filter\(\(item\) => item\.count >= 2\)/);
  assert.match(screen, /onPress=\{\(\) => setEditingId\(event\.id\)\}/);
  assert.match(screen, /QuietButton title="Radera"/);
  assert.doesNotMatch(screen, /SPARAD|ActionFeedbackModal/);
});

test('legacy row editing and deletion remain reachable from workspace and preview', () => {
  assert.match(screen, /onPress=\{\(\) => setEditingId\(event\.id\)\}/);
  assert.match(screen, /function LogEventEditor/);
  assert.match(screen, /onUpdate\?:/);
  assert.match(screen, /onDelete\?:/);
  assert.match(workspace, /onUpdate=\{updateEvent\} onDelete=\{\(id\) => deleteEvent\(id\)\}/);
  assert.match(screen, /LOG_EVENT_TYPES\.map/);
  assert.match(screen, /DatePickerField/);
  assert.match(screen, /TimePickerField/);
  assert.match(screen, /Anteckning \(valfri\)/);
  assert.match(listRow, /\{time \? <Text style=\{styles\.time\}>\{time\}<\/Text> : null\}\s*<IconChip/);
  assert.match(screen, /tryck för att ändra/);
});

test('pending mutations show once on their row, success toast expires, and partial paging offers retry', () => {
  assert.match(screen, /kind: 'add' \| 'update' \| 'delete' \| 'undo'/);
  assert.match(screen, /mutation\?\.kind === 'add' && mutation\.status === 'pending'/);
  assert.match(screen, /rowPending = mutation\?\.id === event\.id && mutation\.status === 'pending'/);
  assert.match(screen, /rowPending \? ', sparar' : ''/);
  assert.doesNotMatch(screen, /status === 'pending' && <Toast/);
  assert.match(screen, /setTimeout\(\(\) => setDismissedMutationKey\(mutationKey\), 2500\)/);
  assert.match(screen, /mutation\.mutationId/);
  assert.match(workspace, /current\.kind !== 'add' \|\| current\.id !== id/);
  assert.match(screen, /loadMoreError \? <Toast tone="error" message="Äldre poster kunde inte hämtas" onRetry=\{onLoadMore\}/);
  assert.match(workspace, /logLifetime\.current !== lifetime/);
  assert.match(toast, /withCancel: \{ flexDirection: 'column'/);
  assert.match(toast, /tone: 'uncertain'; message\?: string; onRetry: \(\) => void/);
});

test('duplicate dialog uses the approved full copy', () => {
  assert.match(screen, /title="Du har redan loggat det här\. Lägga till ändå\?"/);
});

test('quick add labels, rapid-tap guard, retry propagation and Swedish decimal format stay explicit', () => {
  assert.equal((screen.match(/accessibilityLabel=\{`Logga \$\{LOG_EVENT_LABELS\[type\]\.toLocaleLowerCase\('sv-SE'\)\}`\}/g) ?? []).length, 3);
  assert.match(screen, /const lastSubmitAt = useRef<number \| null>\(null\)/);
  assert.match(screen, /lastSubmitAt\.current = timestamp/);
  assert.match(workspace, /onRetry=\{retryLogMutation\}/);
  assert.match(workspace, /const logLifetime = useRef\(''\)/);
  assert.match(workspace, /const isCurrent = \(\) => isLogMutationLifetimeCurrent\(lifetime, logLifetime\.current, mounted\.current\)/);
  assert.match(screen, /title="Avbryt" disabled=\{saving \|\| disabled\}/);
  assert.match(screen, /DatePickerField label="Datum" disabled=\{disabled\}/);
  assert.match(screen, /TimePickerField label="Tid" disabled=\{disabled\}/);
  assert.match(workspace, /setQuickLogMutation\(toQuickLogMutationView\(mutation, 'pending'\)\);[\s\S]*?checkInsertRetryOperation/);
  assert.match(workspace, /finishLogMutationFlight\(logMutationFlight\.current, flightToken\)/);
  assert.match(screen, /toLocaleString\('sv-SE'\)/);
});
