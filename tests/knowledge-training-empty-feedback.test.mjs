import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [knowledge, training, workspace, profileEditor, profileHeader] = await Promise.all([
  readFile(new URL('../src/features/knowledge/KnowledgeScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/training/PublishedTrainingScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/onboarding/EditDogProfileScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/onboarding/ProfileScreenHeader.tsx', import.meta.url), 'utf8'),
]);

test('Knowledge distinguishes no published guides from a search with no matches and keeps separate destinations', () => {
  assert.ok(knowledge.includes("contentState === 'ready' && displayedItems.length === 0 && !hasSearchQuery && <MessageCard>"));
  assert.ok(knowledge.includes('Inga rekommenderade artiklar för'));
  assert.ok(knowledge.includes("visibleItems.length > 0 && hasSearchQuery && displayedItems.length === 0"));
  assert.ok(knowledge.includes("Card onPress={() => changeTab('Checklistor')} accessibilityLabel=\"Öppna Checklistor\""));
  assert.ok(knowledge.includes("Card onPress={() => changeTab('FAQ')} accessibilityLabel=\"Öppna Vanliga frågor\""));
});

test('FAQ and Checklistor return to the guide view through their compact back actions', () => {
  assert.match(knowledge, /tab === 'FAQ' \? <AppBar[^\n]+variant="compact"/);
  assert.match(knowledge, /tab === 'Checklistor' && !checklistDetailOpen \? <AppBar[^\n]+variant="compact"/);
  assert.match(knowledge, /actionLabel="Tillbaka till guider" onAction=\{\(\) => changeTab\('För dig'\)\}/);
  assert.ok(knowledge.includes("onBack={() => changeTab('För dig')}"));
  assert.ok(knowledge.includes("tab === 'För dig' && !selectedItem ? <View style={styles.shortcuts}>"));
});

test('unknown Training age opens the existing profile editor and returns only after an explicit back or confirmed save', () => {
  assert.ok(training.includes('label="Lägg till födelsedatum"'));
  assert.ok(workspace.includes("onAddBirthDate={() => { setProfileReturnPage('training'); setPage('profile'); }}"));
  assert.ok(workspace.includes('onBack={returnFromProfile} onSave={async (changes, knownBreeds) => {'));
  assert.ok(workspace.includes('const saved = await saveDogProfile(changes, knownBreeds);'));
  assert.ok(workspace.includes("if (saved && profileReturnPage === 'training') returnFromProfile();"));
  assert.ok(workspace.includes("backLabel={profileReturnPage === 'training' ? 'Tillbaka till Träning' : 'Tillbaka till Mer'}"));
  assert.ok(profileEditor.includes("backLabel = 'Tillbaka till Mer'"));
  assert.ok(profileEditor.includes('<ProfileScreenHeader onBack={onBack} backLabel={backLabel}'));
  assert.ok(profileHeader.includes("backLabel = 'Tillbaka till Mer'"));
  assert.ok(profileHeader.includes('accessibilityLabel={backLabel}'));
});

test('a successful age-filtered empty Training selection opens Knowledge with a Training return action', () => {
  assert.ok(training.includes('ageMatchedPrograms.length > 0 ? <View'));
  assert.ok(training.includes('<Button variant="tertiary" label="Öppna Kunskap"'));
  assert.ok(workspace.includes("returnPage: 'training'"));
  assert.ok(workspace.includes("returnToTraining={knowledgeFocus?.selectionKey === currentSelectionKey && knowledgeFocus.returnPage === 'training'}"));
  assert.ok(knowledge.includes('actionLabel="Tillbaka till Träning" onAction={onBack}'));
});

test('Training errors stay retryable and review examples are injected only after a successful empty read', () => {
  assert.ok(training.includes('<Toast visible={Boolean(error) && !selectedProgram} tone="error" message={error || undefined} onRetry={onRetry} />'));
  assert.ok(training.includes('Inga övningar tillgängliga ännu'));
  const fallback = workspace.indexOf('reviewContentEnabled && result.programs.length === 0');
  const readError = workspace.indexOf('}).catch((error: unknown) =>', fallback);
  assert.ok(fallback >= 0 && readError > fallback);
  assert.match(workspace.slice(readError, readError + 800), /setTrainingState\('error'\)/);
  assert.ok(workspace.includes('<PrimaryButton title="Försök igen" onPress={() => { void retryTraining(); }} />'));
});

test('Knowledge and Training hide old content while the active dog or account scope reloads', () => {
  assert.ok(workspace.includes("const visibleContent = contentSelectionKey === currentSelectionKey ? content : [];"));
  assert.ok(workspace.includes("const visibleTrainingState = trainingSelectionKey === currentSelectionKey ? trainingState : 'loading';"));
  assert.ok(knowledge.includes('guideSearchScopeKey(sessionKey, dogId)'));
  assert.match(knowledge, /if \(guideViewState\.scopeKey !== searchScopeKey\) \{\s*setGuideViewState\(\{ scopeKey: searchScopeKey, value: '', showAll: false \}\);/);
});

test('article sources are compact numbered links without a heading or repeated URL copy', async () => {
  assert.match(knowledge, /testID="article-references"/);
  assert.match(knowledge, /\{index \+ 1\}\)/);
  assert.match(knowledge, /accessibilityRole="link"/);
  assert.match(knowledge, /Öppna källa \$\{index \+ 1\}: \$\{new URL\(safeUrl\)\.hostname\}/);
  assert.doesNotMatch(knowledge, /style=\{styles\.sourcesHeading\}/);
  assert.doesNotMatch(knowledge, /Öppna extern källa/);
});
