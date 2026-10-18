import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';

const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
const review = await import('../src/features/knowledge/review-content.ts');
const { reviewFaqFor } = review;
const faqSource = await readFile(new URL('../src/features/knowledge/FAQScreen.tsx', import.meta.url), 'utf8');
hook.deregister();

test('FAQ examples are static, phase-scoped, and versioned', () => {
  for (const context of ['before_homecoming', 'first_days', 'by_age']) {
    const entries = reviewFaqFor(context);
    assert.ok(entries.length > 0);
    assert.ok(entries.every((entry) => entry.id.startsWith('review-v1:faq:') && entry.context === context));
  }
  assert.equal(new Set(review.REVIEW_FAQ.map((entry) => entry.id)).size, review.REVIEW_FAQ.length);
});

test('each synthetic training program has a matching guide content ID', () => {
  assert.equal(review.REVIEW_TRAINING_PROGRAMS.length, 3);
  for (const program of review.REVIEW_TRAINING_PROGRAMS) {
    assert.ok(program.id.startsWith('review-v1:training:'));
    assert.equal(review.REVIEW_TRAINING_GUIDES.find((guide) => guide.id === program.content_id)?.contentId, program.content_id);
    assert.equal(review.REVIEW_TRAINING_GUIDES.find((guide) => guide.id === program.content_id)?.contentType, 'training_program');
  }
});

test('Home uses its granted advice selection and a single checklist action for confirmed empty state', async () => {
  const home = await readFile(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
  const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(home, /\bnextStep\b|reviewTrainingStep/);
  assert.doesNotMatch(workspace, /nextStep=\{/);
  assert.match(home, /contentState === 'ready' && adviceSelectionStatus === 'eligible'/);
  assert.match(home, /confirmedEmptyAdvice \? \(\) => onGo\('checklist'\)/);
  assert.match(home, /emptyCardAction/);
  assert.match(home, /!confirmedEmptyAdvice \? <MotionPressable testID="home-open-daily-checklist"/);
  assert.match(workspace, /contentSelectionStatus=\{visibleContentCatalog\?\.homeAdvice\.status\}/);
  assert.match(workspace, /knowledgeFocus\.contentId === CHECKLIST_DESTINATION_ID/);
  assert.match(workspace, /knowledgeFocus\.contentId === FAQ_DESTINATION_ID/);
});


test('public FAQ maps only approved versions and keeps review drafts isolated', () => {
  assert.match(faqSource, /'62000000-0000-4000-8000-000000000004': 'Hur kan jag göra vardaglig hantering trygg och frivillig för valpen\?'/);
  assert.match(faqSource, /'62000000-0000-4000-8000-000000000006': 'Hur kan jag hjälpa valpen att vara själv en liten stund\?'/);
  assert.match(faqSource, /const reviewQuestions = REVIEW_FAQ\.filter/);
  assert.match(faqSource, /reviewEnabled\s*\?\s*<>/);
  assert.match(faqSource, /onOpenDogProfile/);
  assert.match(faqSource, /unknownReason === 'missing_age'/);
  assert.match(faqSource, /Just nu finns inga publicerade frågor för den här vyn/);
  assert.match(faqSource, /getSafeContentSourceUrl\(source\)/);
  assert.match(faqSource, /safeUrl \? <QuietButton title="Öppna extern källa"/);
  assert.match(faqSource, /Tillfälligt exempel – innehållet är inte sakgranskat/);
});
