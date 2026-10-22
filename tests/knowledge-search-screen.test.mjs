import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screenPath = new URL('../src/features/knowledge/KnowledgeScreen.tsx', import.meta.url);
const workspacePath = new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url);
const imageAssignmentPath = new URL('../src/features/knowledge/editorial-image-assignment.ts', import.meta.url);
const homeCarouselPath = new URL('../src/features/home/HomeCarousel.tsx', import.meta.url);

test('Knowledge cards and search contain only already selected article and guide records', async () => {
  const screen = await readFile(screenPath, 'utf8');
  const workspace = await readFile(workspacePath, 'utf8');
  assert.match(screen, /items\s*\.filter\(\(item\) => item\.contentType === 'article' \|\| item\.contentType === 'guide'\)/);
  assert.match(screen, /\.sort\(compareGuideTitle\)/);
  assert.match(screen, /const displayedItems = searchGuideItems\(visibleItems, searchQuery\)/);
  assert.match(workspace, /items=\{visibleGuideContent\}/);
  assert.match(workspace, /onSelectContent=\{\(contentId\) => setKnowledgeFocus/);
  assert.doesNotMatch(screen, /fetch\(/);
  assert.doesNotMatch(screen, /from\(['"]content/);
});

test('active dog is named in search copy and query state is scoped by session and dog', async () => {
  const screen = await readFile(screenPath, 'utf8');
  const workspace = await readFile(workspacePath, 'utf8');
  assert.match(screen, /guideSearchScopeKey\(sessionKey, dogId\)/);
  assert.match(screen, /guideSearchValueForScope\(guideViewState, searchScopeKey\)/);
  assert.match(screen, /accessibilityLabel=\{`Sök i guider för \$\{dogLabel\}`\}/);
  assert.match(screen, /placeholder=\{`Sök bland guider för \$\{dogLabel\}`\}/);
  assert.doesNotMatch(screen, /searchHelp/);
  assert.match(workspace, /dogName=\{dog\.name\}/);
});

test('guide metadata comes from published fields and secondary destinations stay compact and labeled', async () => {
  const screen = await readFile(screenPath, 'utf8');
  assert.match(screen, /readingMinutes\(item\.body\)/);
  assert.match(screen, /item\.contentType === 'guide' \? 'Guide' : 'Artikel'/);
  assert.match(screen, /featuredImage: \{ width: '100%', height: 136 \}/);
  assert.match(screen, /smallImage: \{ width: '100%', height: 44 \}/);
  assert.match(screen, /accessibilityLabel="Öppna Checklistor"/);
  assert.match(screen, /accessibilityLabel="Öppna Vanliga frågor"/);
  assert.match(screen, /categoryLink: \{ flexDirection: 'column', alignItems: 'center'/);
});

test('scope changes clear the prior query and expanded guide view', async () => {
  const screen = await readFile(screenPath, 'utf8');
  assert.match(screen, /const searchQuery = guideSearchValueForScope\(guideViewState, searchScopeKey\)/);
  assert.match(screen, /if \(guideViewState\.scopeKey !== searchScopeKey\) \{\s*setGuideViewState\(\{ scopeKey: searchScopeKey, value: '', showAll: false \}\);\s*\}/);
});

test('Visa alla expands the same Swedish title-sorted view; search reaches every match without recommendation claims', async () => {
  const screen = await readFile(screenPath, 'utf8');
  assert.match(screen, /function compareGuideTitle\(left: HomeContent, right: HomeContent\)/);
  assert.match(screen, /localeCompare\(right\.title, 'sv-SE'\)/);
  assert.match(screen, /const cardItems = hasSearchQuery \|\| showAllGuides \? displayedItems : displayedItems\.slice\(0, 3\)/);
  assert.match(screen, /cardItems\.slice\(1\)\.map\(\(item\) => renderGuideCard\(item, false\)\)/);
  assert.match(screen, /const hasMoreGuides = !hasSearchQuery && !showAllGuides && visibleItems\.length > 3/);
  assert.match(screen, /title="Visa alla"/);
  assert.match(screen, /displayedItems\.length === 1 \? '1 träff' : `\$\{displayedItems\.length\} träffar`/);
  assert.doesNotMatch(screen, /REKOMMENDERAT FÖR ER|REKOMMENDERAD/);
});

test('published guide versions use the six explicit images and unknown items have no Knowledge image', async () => {
  const assignment = await readFile(imageAssignmentPath, 'utf8');
  const screen = await readFile(screenPath, 'utf8');
  const carousel = await readFile(homeCarouselPath, 'utf8');
  const manifest = assignment.match(/const KNOWLEDGE_IMAGE_BY_GUIDE_VERSION = new Map<[\s\S]*?\n\]\);/);
  assert.ok(manifest, 'explicit Knowledge manifest exists');
  const entries = [...manifest[0].matchAll(/\['([^']+)', require\('\.\.\/\.\.\/\.\.\/assets\/images\/([^']+)'\)\]/g)];
  assert.deepEqual(Object.fromEntries(entries.map(([, identity, image]) => [identity, image])), {
    '61000000-0000-4000-8000-000000000002:1': 'knowledge-card-puppy-sheltie-window.jpg',
    '61000000-0000-4000-8000-000000000003:1': 'knowledge-card-puppy-cocker-coast.jpg',
    '61000000-0000-4000-8000-000000000004:1': 'knowledge-guide-handling.jpg',
    '61000000-0000-4000-8000-000000000006:1': 'puppy-resting-carousel.png',
    '61000000-0000-4000-8000-000000000007:1': 'knowledge-guide-weight.jpg',
    '61000000-0000-4000-8000-000000000008:1': 'knowledge-guide-vet.jpg',
  });
  const nullableLookup = assignment.match(/export function knowledgeImageForGuide[\s\S]*?\n\}/);
  assert.ok(nullableLookup);
  assert.match(nullableLookup[0], /KNOWLEDGE_IMAGE_BY_GUIDE_VERSION\.get/);
  assert.match(nullableLookup[0], /return null/);
  assert.doesNotMatch(nullableLookup[0], /EDITORIAL_IMAGES|REVIEW_IMAGE_BY_GUIDE_VERSION|hash/);
  for (const identity of [
    'review-v1:training:trygg-start:1',
    'review-v1:training:kontakt:1',
    'review-v1:training:vardagsro:1',
  ]) assert.ok(assignment.includes(`'${identity}'`), `legacy HomeCarousel mapping retains ${identity}`);
  assert.match(assignment, /export function editorialImageForGuide[\s\S]*ImageSourcePropType/);
  assert.match(carousel, /editorialImageForGuide\(article\)/);
  assert.match(screen, /const image = knowledgeImageForGuide\(item\)/);
  assert.match(screen, /\{image \? <Image source=\{image\}[\s\S]*?: null\}/);
});

test('loading, errors, no published guides and zero matches stay distinct; guide detail keeps the loaded ID', async () => {
  const screen = await readFile(screenPath, 'utf8');
  assert.match(screen, /contentState === 'loading'/);
  assert.match(screen, /contentState === 'error'/);
  assert.match(screen, /onPress=\{onRetry\}/);
  assert.match(screen, /items\.find\(\(item\) => item\.id === openedId\)/);
  assert.match(screen, /function openArticle\(id: string\)/);
  assert.match(screen, /setOpenedId\(null\); onSelectContent\(null\)/);
  assert.doesNotMatch(screen, /function openArticle\([^)]*\)\s*\{[^}]*setGuideViewState/s);
  assert.match(screen, /Inga guider är publicerade för \{dogLabel\} ännu/);
  assert.match(screen, /Inga guider matchar/);
  assert.match(screen, /Rensa sökning/);
  assert.match(screen, /displayedItems\.length === 0/);
  assert.match(screen, /changeTab\('Checklistor'\)/);
  assert.match(screen, /changeTab\('FAQ'\)/);
});
