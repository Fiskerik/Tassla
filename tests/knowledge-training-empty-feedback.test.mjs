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

test('Knowledge separates no published articles from no search matches and keeps support destinations visible', () => {
  assert.ok(knowledge.includes('visibleItems.length === 0 && <MessageCard>'));
  assert.ok(knowledge.includes('accessibilityLabel="Öppna Checklistor"'));
  assert.ok(knowledge.includes('accessibilityLabel="Öppna Vanliga frågor"'));
  assert.ok(knowledge.includes("visibleItems.length > 0 && hasSearchQuery && displayedItems.length === 0"));
});

test('Knowledge support screens return to the root, whose existing action returns to Training', () => {
  assert.ok(knowledge.includes('actionLabel="Tillbaka till Kunskap" onAction={() => changeTab(\'För dig\')}'));
  assert.ok(knowledge.includes('actionLabel="Tillbaka till Träning" onAction={onBack}'));
  assert.ok(knowledge.includes("onBack={() => changeTab('För dig')}"));
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
  assert.ok(training.includes('ageWeeks !== null && onOpenKnowledge ? <Button variant="tertiary" label="Öppna Kunskap"'));
  assert.ok(workspace.includes("returnPage: 'training'"));
  assert.ok(workspace.includes("returnToTraining={knowledgeFocus?.selectionKey === currentSelectionKey && knowledgeFocus.returnPage === 'training'}"));
  assert.ok(knowledge.includes('actionLabel="Tillbaka till Träning" onAction={onBack}'));
});

test('Training errors stay retryable and review examples are injected only after a successful empty read', () => {
  assert.ok(training.includes('visiblePrograms.length === 0 ? error'));
  assert.match(training, /visiblePrograms\.length === 0 \? error\s+\? ageWeeks === null \? <View style=\{styles\.ageHint\}>/);
  assert.ok(training.includes('Fler program kommer när de är färdiga att använda.'));
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
  assert.ok(knowledge.includes("setSearchState({ scopeKey: searchScopeKey, value: '' })"));
});
