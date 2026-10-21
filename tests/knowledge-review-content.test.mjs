import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';

const hook = registerHooks({ resolve(specifier, context, nextResolve) { return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier) ? nextResolve(`${specifier}.ts`, context) : nextResolve(specifier); } });
const review = await import('../src/features/knowledge/review-content.ts');
const { reviewFaqFor } = review;
hook.deregister();

test('FAQ examples are static, phase-scoped, and versioned', () => {
  for (const context of ['before_homecoming', 'first_days', 'by_age']) {
    const entries = reviewFaqFor(context);
    assert.ok(entries.length > 0);
    assert.ok(entries.every((entry) => entry.id.startsWith('review-v1:faq:') && entry.context === context));
  }
  assert.equal(new Set(review.REVIEW_FAQ.map((entry) => entry.id)).size, review.REVIEW_FAQ.length);
});

test('FAQ and checklist controls stay review-only and use only explicit semantic icon mappings', async () => {
  const [faqScreen, checklistScreen, knowledgeScreen, badge] = await Promise.all([
    readFile(new URL('../src/features/knowledge/FAQScreen.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/knowledge/PuppyChecklistScreen.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/knowledge/KnowledgeScreen.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/knowledge/KnowledgeIconBadge.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(faqScreen, /reviewEnabled \? <View style=\{styles\.contexts\}/);
  assert.match(faqScreen, /questions.length === 0 \? <Card>/);
  assert.doesNotMatch(faqScreen, /SectionHeader/, 'FAQ page uses the AppBar title without repeating it in the content');
  assert.match(faqScreen, /KnowledgeIconBadge id=\{item\.id\}/);
  assert.match(checklistScreen, /!reviewEnabled \? <View style=\{styles\.publicEmpty\}>/);
  assert.match(checklistScreen, /KnowledgeIconBadge id=\{template\.phase\}/);
  assert.match(checklistScreen, /KnowledgeIconBadge id=\{item\.key\}/);
  assert.match(knowledgeScreen, /reviewEnabled && tab !== 'FAQ'.*Exempel · ej sakgranskat/);
  assert.doesNotMatch(knowledgeScreen, /Tillfälligt exempel – innehållet är inte sakgranskat\./);
  assert.match(badge, /'review-v1:faq:first-night': 'moon-outline'/);
  assert.match(badge, /'review-v1:destination:checklists': 'list-outline'/);
  assert.doesNotMatch(badge, /play:/);
});

test('each synthetic training program has a matching guide content ID', () => {
  assert.equal(review.REVIEW_TRAINING_PROGRAMS.length, 3);
  for (const program of review.REVIEW_TRAINING_PROGRAMS) {
    assert.ok(program.id.startsWith('review-v1:training:'));
    assert.equal(review.REVIEW_TRAINING_GUIDES.find((guide) => guide.id === program.content_id)?.contentId, program.content_id);
    assert.equal(review.REVIEW_TRAINING_GUIDES.find((guide) => guide.id === program.content_id)?.contentType, 'training_program');
  }
});

test('Home review shortcuts open the same stable Knowledge destinations', async () => {
  const carousel = await readFile(new URL('../src/features/home/HomeCarousel.tsx', import.meta.url), 'utf8');
  const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(workspace, /nextStep=\{visibleTrainingState === 'ready' \? nextStep\?\.title : undefined\}/);
  assert.match(carousel, /if \(nextStep\) cards\.push\(\{ key: 'training', title: nextStep,/);
  assert.doesNotMatch(carousel, /key: 'training', title: 'Fortsätt träna'/);

  assert.match(carousel, /if \(process\.env\.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true'\) cards\.push\(\{ key: 'checklists'/);
  assert.match(carousel, /onOpenContent\(CHECKLIST_DESTINATION_ID\)/);

  const faqCard = carousel.match(/cards\.push\(\{ key: 'faq',[^\n]+/);
  assert.ok(faqCard, 'FAQ card remains unconditionally available');
  assert.match(faqCard[0], /title: 'Vanliga frågor'/);
  assert.match(faqCard[0], /onOpenContent\(FAQ_DESTINATION_ID\)/);
  assert.match(workspace, /knowledgeFocus\.contentId === CHECKLIST_DESTINATION_ID/);
  assert.match(workspace, /knowledgeFocus\.contentId === FAQ_DESTINATION_ID/);
});
