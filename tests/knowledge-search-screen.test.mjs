import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screenPath = new URL('../src/features/knowledge/KnowledgeScreen.tsx', import.meta.url);
const workspacePath = new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url);

test('search uses only already selected guide and article items in the Knowledge root view', async () => {
  const screen = await readFile(screenPath, 'utf8');
  const workspace = await readFile(workspacePath, 'utf8');
  assert.match(screen, /const visibleItems = items\.filter/);
  assert.match(screen, /items\.filter\(\(item\) => item\.contentType === 'article' \|\| item\.contentType === 'guide'\)/);
  assert.match(screen, /const displayedItems = searchGuideItems\(visibleItems, searchQuery\)/);
  assert.doesNotMatch(screen, /<Tabs|Artiklar/);
  assert.match(workspace, /items=\{visibleGuideContent\}/);
  assert.match(workspace, /onSelectContent=\{\(contentId\) => setKnowledgeFocus/);
  assert.doesNotMatch(screen, /fetch\(/);
  assert.doesNotMatch(screen, /from\(['"]content/);
});

test('active dog is named in search copy and the query is keyed by session and dog', async () => {
  const screen = await readFile(screenPath, 'utf8');
  const workspace = await readFile(workspacePath, 'utf8');
  assert.match(screen, /guideSearchScopeKey\(sessionKey, dogId\)/);
  assert.match(screen, /guideSearchValueForScope\(searchState, searchScopeKey\)/);
  assert.match(screen, /Sök guider för /);
  assert.match(screen, /Visar publicerade guider och artiklar för /);
  assert.match(workspace, /dogName=\{dog\.name\}/);
});

test('scope changes synchronously hide the old query and clear the stored value', async () => {
  const screen = await readFile(screenPath, 'utf8');
  assert.match(screen, /const searchQuery = guideSearchValueForScope\(searchState, searchScopeKey\)/);
  assert.match(screen, /if \(searchState\.scopeKey !== searchScopeKey\) \{\s*setSearchState\(\{ scopeKey: searchScopeKey, value: '' \}\);\s*\}/);
});

test('loading, errors, retries and article open/back remain separate from the search state', async () => {
  const screen = await readFile(screenPath, 'utf8');
  assert.match(screen, /contentState === 'loading'/);
  assert.match(screen, /contentState === 'error'/);
  assert.match(screen, /onPress=\{onRetry\}/);
  assert.match(screen, /function openArticle\(id: string\)/);
  assert.match(screen, /setOpenedId\(null\); onSelectContent\(null\)/);
  assert.doesNotMatch(screen, /function openArticle\([^)]*\)\s*\{[^}]*setSearchState/s);
});

test('empty publication state and zero-match state have distinct copy and a clear action', async () => {
  const screen = await readFile(screenPath, 'utf8');
  assert.match(screen, /Det finns inga publicerade guider eller artiklar för /);
  assert.match(screen, /Inga guider eller artiklar matchar/);
  assert.match(screen, /Rensa sökning/);
  assert.match(screen, /displayedItems\.length === 0/);
});

test('FAQ and Checklist destinations use explicit semantic badges and visible back paths', async () => {
  const screen = await readFile(screenPath, 'utf8');
  assert.match(screen, /KnowledgeIconBadge id=\{CHECKLIST_DESTINATION_ID\}/);
  assert.match(screen, /KnowledgeIconBadge id=\{FAQ_DESTINATION_ID\}/);
  assert.match(screen, /actionLabel="Tillbaka till Kunskap"/);
  assert.match(screen, /actionLabel="Tillbaka till Träning"/);
});
