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
  assert.match(carousel, /onOpenContent\(CHECKLIST_DESTINATION_ID\)/);
  assert.match(carousel, /onOpenContent\(FAQ_DESTINATION_ID\)/);
  assert.match(workspace, /knowledgeFocus\.contentId === CHECKLIST_DESTINATION_ID/);
  assert.match(workspace, /knowledgeFocus\.contentId === FAQ_DESTINATION_ID/);
});

test('carousel article origin and internal back action stay separate from the Knowledge return page', async () => {
  const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
  const screen = await readFile(new URL('../src/features/knowledge/KnowledgeScreen.tsx', import.meta.url), 'utf8');
  assert.match(workspace, /returnPage: 'home', origin: 'home-carousel'/);
  assert.match(workspace, /returnPage: 'more', origin: null/);
  assert.match(workspace, /focusedContentOrigin=\{knowledgeFocus\?\.selectionKey === currentSelectionKey \? knowledgeFocus\.origin : null\}/);
  assert.match(workspace, /focusScopeKey=\{currentSelectionKey\}/);
  assert.match(screen, /actionLabel=\{selectedItem \? articleOrigin === 'home-carousel' \? 'Tillbaka' : 'Tillbaka till guider'/);
  assert.match(screen, /selectedItem \? articleOrigin === 'home-carousel' \? onBack/);
  assert.match(screen, /lastFocusScope\.current !== focusScopeKey \|\| focusedContentId === null/);
  assert.match(screen, /setOpenedId\(focusedContentId\)/);
  assert.match(screen, /onSelectContent\(id, 'knowledge-list'\)/);
});
