import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';

const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
const { classifyPendingChecklistOperation, checklistMemoryScope, freezePendingChecklistMemory, keepChecklistMemoryForScope, updateChecklistMemory } = await import('../src/features/knowledge/checklist-intent.ts');
hook.deregister();

const screen = await readFile(new URL('../src/features/knowledge/PuppyChecklistScreen.tsx', import.meta.url), 'utf8');
const knowledge = await readFile(new URL('../src/features/knowledge/KnowledgeScreen.tsx', import.meta.url), 'utf8');
const checklistItem = await readFile(new URL('../src/components/ui/ChecklistItem.tsx', import.meta.url), 'utf8');
const picker = await readFile(new URL('../src/features/checklists/ChecklistIconPicker.tsx', import.meta.url), 'utf8');
const iconModel = await readFile(new URL('../src/features/checklists/checklist-icons.ts', import.meta.url), 'utf8');

test('public checklist actions require the complete published catalog while review fixtures stay explicit', () => {
  assert.match(screen, /if \(active\) void load\(templateId\)/);
  assert.match(screen, /fetchPublishedChecklistCatalog\(client, controller\.signal\)/);
  assert.match(screen, /if \(!catalogReady \|\| pending\.current/);
  assert.match(screen, /!reviewEnabled && state === 'ready' && !catalogReady/);
  assert.doesNotMatch(screen, /if \(!reviewEnabled \|\|/);
  assert.match(screen, /checklistCatalogReadCacheScope\(cacheScope, loadedCatalog\.versionIds\)/);
  assert.match(screen, /sourceLinks\.map/);
  assert.match(screen, /getContentSourceMetadata\(source\)/);
  assert.match(screen, /accessibilityLabel=\{`Öppna referens \$\{referenceNumber\}: \$\{metadata\.title\} \(\$\{metadata\.publisher\}\)`\}/);
  assert.match(screen, /<Text style=\{styles\.referenceNumber\}>\{referenceNumber\}\)<\/Text>/);
  assert.doesNotMatch(screen, /<Text[^>]*>Referenser<\/Text>/);
  assert.match(screen, /referenceNumber: \{ \.\.\.tokens\.typography\.smallCaption/);
  assert.match(screen, /minWidth: tokens\.size\.touchMin, minHeight: tokens\.size\.touchMin/);
  assert.match(screen, /referenceLink: \{ minWidth: tokens\.size\.touchMin, minHeight: tokens\.size\.touchMin, alignItems: 'center', justifyContent: 'center' \}/);
  assert.match(screen, /checklistPhaseVisualFor\(activeTemplate\.phase\)/);
  assert.match(knowledge, /CHECKLIST_DESTINATION_ID/);
  assert.match(knowledge, /FAQ_DESTINATION_ID/);
  assert.match(knowledge, /onPress=\{\(\) => changeTab\('Checklistor'\)\}/);
  assert.match(knowledge, /onPress=\{\(\) => changeTab\('FAQ'\)\}/);
});

test('every review template point has a verified Ionicons glyph and custom or unknown points stay neutral', async () => {
  const templateContent = await readFile(new URL('../src/features/knowledge/checklist-content.ts', import.meta.url), 'utf8');
  const iconMapSource = screen.match(/const CHECKLIST_ITEM_ICONS: Record<string, ComponentProps<typeof Ionicons>\['name'\]> = \{([\s\S]*?)\n\};/);
  assert.ok(iconMapSource, 'explicit review item icon map exists');
  const entries = [...iconMapSource[1].matchAll(/^\s*(?:'([^']+)'|([\w-]+)):\s*'([\w-]+)',?\s*$/gm)];
  const iconByKey = Object.fromEntries(entries.map(([, quotedKey, plainKey, icon]) => [quotedKey ?? plainKey, icon]));
  const templateKeys = [...templateContent.matchAll(/row\('([^']+)'/g)].map(([, key]) => key);
  assert.deepEqual(Object.keys(iconByKey).sort(), [...templateKeys].sort());

  const vectorPackage = JSON.parse(await readFile(new URL('../node_modules/@expo/vector-icons/package.json', import.meta.url), 'utf8'));
  const ioniconGlyphs = JSON.parse(await readFile(new URL('../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json', import.meta.url), 'utf8'));
  assert.equal(vectorPackage.version, '15.0.2');
  for (const icon of Object.values(iconByKey)) assert.ok(Object.hasOwn(ioniconGlyphs, icon), `${icon} exists in @expo/vector-icons 15.0.2`);

  assert.match(screen, /CHECKLIST_ITEM_ICONS\[item\.key\] \?\? 'list-outline'/);
  assert.match(screen, /leadingIcon=\{item\.icon \?\? 'list-outline'\}/);
  assert.match(screen, /leadingIconTone=\{checklistIconTone\(item\.icon \?\? 'list-outline'\)\}/);
  assert.match(picker, /accessibilityRole="radio" accessibilityLabel=\{CHECKLIST_ICON_LABELS\[icon\]\}/);
  assert.match(iconModel, /export const CHECKLIST_ICONS = \[/);
  assert.match(checklistItem, /leadingIcon\?: ChecklistIcon/);
  assert.match(checklistItem, /\{leadingIcon \? leadingIconTone \? <ThemedIcon name=\{leadingIcon\}/);
});

test('navigation invalidates and aborts the current read/write before changing checklist view', () => {
  const invalidation = screen.indexOf('function leaveChecklistNow');
  assert.ok(invalidation >= 0);
  assert.ok(screen.indexOf('invalidateCurrentView();', invalidation) < screen.indexOf('setTemplateId(null)', invalidation));
  assert.match(screen, /writeControllerRef\.current\?\.abort\(\)/);
  assert.match(knowledge, /checklistInvalidate\.current\?\.\(\)/);
  assert.match(knowledge, /sessionKey.*dogId/);
});

test('screen feedback reflects only confirmed state and review drafts identify themselves', () => {
  assert.match(screen, /if \(result\.status === 'saved'\)/);
  assert.doesNotMatch(screen, /Checklistornas innehåll granskas före publicering\.|reviewInfoOpen|reviewInfoDetail/);
  assert.doesNotMatch(screen, /Exemplen tas bort eller skrivs om före lansering\./);
  assert.match(screen, /label="Kontrollera"/);
  assert.ok(screen.includes('label={`${done} av ${total} genomförda`}'));
  assert.match(screen, /label=\{form \? form\.id \? 'Fortsätt redigera punkt' : 'Fortsätt med egen punkt' : 'Lägg till egen punkt'\}/);
  assert.match(screen, /<Button label="Spara"/);
});

test('pending status reconciliation classifies exact postimages before replay', () => {
  const previous = { id: '33333333-3333-4333-8333-333333333333', dogId: 'dog-a', templateId: 'review-v1:before-homecoming', title: 'Old', completed: false, icon: null };
  const updated = { ...previous, title: 'New', completed: true };
  const state = (customItems = [], progress = [], preference = null) => ({ customItems, progress, preference });
  assert.equal(classifyPendingChecklistOperation({ kind: 'preference', context: 'first_days' }, state([], [], 'first_days')), 'saved');
  assert.equal(classifyPendingChecklistOperation({ kind: 'preference', context: 'first_days' }, state([], [], 'by_age')), 'retry');
  assert.equal(classifyPendingChecklistOperation({ kind: 'preset', templateId: previous.templateId, itemKey: 'safe-space', completed: true }, state([], [{ dogId: 'dog-a', templateId: previous.templateId, itemKey: 'safe-space' }])), 'saved');
  assert.equal(classifyPendingChecklistOperation({ kind: 'preset', templateId: previous.templateId, itemKey: 'safe-space', completed: true }, state()), 'retry');
  const add = { kind: 'add', templateId: previous.templateId, id: previous.id, title: 'New', icon: null };
  const added = { ...previous, title: 'New' };
  assert.equal(classifyPendingChecklistOperation(add, state([added])), 'saved');
  assert.equal(classifyPendingChecklistOperation(add, state()), 'retry');
  assert.equal(classifyPendingChecklistOperation(add, state([{ ...added, title: 'Other' }])), 'conflict');
  const update = { kind: 'update', previous, changes: { title: 'New', completed: true, icon: null } };
  assert.equal(classifyPendingChecklistOperation(update, state([updated])), 'saved');
  assert.equal(classifyPendingChecklistOperation(update, state([previous])), 'retry');
  assert.equal(classifyPendingChecklistOperation(update, state([{ ...previous, title: 'Remote edit' }])), 'conflict');
  const remove = { kind: 'delete', previous };
  assert.equal(classifyPendingChecklistOperation(remove, state()), 'saved');
  assert.equal(classifyPendingChecklistOperation(remove, state([previous])), 'retry');
  assert.equal(classifyPendingChecklistOperation(remove, state([{ ...previous, title: 'Remote edit' }])), 'conflict');
});

test('unmount persists the frozen intent and normalized form draft for scoped remount recovery', async () => {
  assert.match(screen, /pendingChangeRef\.current\?\.\(freezePendingChecklistMemory\(writeIntent\.current, formRef\.current\)\)/);
  assert.match(screen, /pendingState\?\.uncertain \? 'Det gick inte att kontrollera om ändringen sparades\.'/);
  assert.match(screen, /changes: \{ title: normalizedTitle, completed: form\.completed, icon: form\.icon \}/);
  assert.match(screen, /id: form\.requestId, title: normalizedTitle, icon: form\.icon/);
  assert.match(screen, /customItems\.some\(\(item\) => item\.id === result\.value\.id\)/);
  assert.match(screen, /classifyPendingChecklistOperation\(operation, \{ \.\.\.loaded, preference: loaded\.preference\?\.context \?\? null \}\)/);
  const scopeA = checklistMemoryScope('owner-a', 4, 'dog-a');
  const scopeB = checklistMemoryScope('owner-a', 4, 'dog-b');
  const operation = { kind: 'add', templateId: 'review-v1:before-homecoming', id: '33333333-3333-4333-8333-333333333333', title: 'Normaliserad titel', icon: 'water-outline' };
  const draft = { id: null, requestId: operation.id, title: ' Normaliserad titel ', completed: false, icon: 'water-outline' };
  const snapshot = freezePendingChecklistMemory(operation, draft);
  operation.title = 'Changed after request';
  draft.requestId = 'changed';
  assert.equal(snapshot.operation.title, 'Normaliserad titel');
  assert.equal(snapshot.draft.requestId, '33333333-3333-4333-8333-333333333333');
  const memory = updateChecklistMemory(null, scopeA, snapshot);
  assert.equal(keepChecklistMemoryForScope(memory, scopeA)?.state.operation.id, snapshot.operation.id);
  assert.equal(keepChecklistMemoryForScope(memory, scopeB), null);
  assert.equal(updateChecklistMemory(memory, scopeB, null), null);
});
