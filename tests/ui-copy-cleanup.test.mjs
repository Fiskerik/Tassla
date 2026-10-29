import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const screens = [
  'home/HomeScreen', 'home/DevelopmentScreen', 'home/DailyProgressScreen', 'home/DevelopmentPreview',
  'training/PublishedTrainingScreen', 'training/TrainingScreen', 'knowledge/KnowledgeScreen',
  'knowledge/FAQScreen', 'knowledge/PuppyChecklistScreen', 'account/AuthCallbackView',
];

test('user-facing screens contain no temporary test, review or standard-image labels or empty marker styles', () => {
  for (const screen of screens) {
    const source = read(`src/features/${screen}.tsx`);
    assert.doesNotMatch(source, /Granskningsdata|Granskningsinnehåll|Standardbild|testläget|Visuell grund|styles\.(?:previewTag|reviewNotice|reviewStatus|reviewInfoDetail|standardBadge)/, screen);
  }
});

test('removing labels does not remove FAQ content, publication gates or actual mutation status', () => {
  const faq = read('src/features/knowledge/FAQScreen.tsx');
  assert.match(faq, /reviewEnabled \? REVIEW_FAQ\.filter/);
  assert.match(faq, /Inga frågor publicerade ännu/);
  const checklist = read('src/features/knowledge/PuppyChecklistScreen.tsx');
  assert.match(checklist, /EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true'/);
  assert.match(checklist, /loadedCatalog = reviewEnabled\s*\?/);
  assert.doesNotMatch(checklist, /reviewInfoOpen|Visa information om checklistorna/);
  assert.match(checklist, /Det gick inte att kontrollera om ändringen sparades/);
  const training = read('src/features/training/PublishedTrainingScreen.tsx');
  assert.match(training, /completeTrainingStepForMode/);
  assert.match(training, /resetReviewTrainingProgram/);
  assert.match(read('src/features/knowledge/DraftContentPreview.tsx'), /Utkast – ej granskat eller publicerat/);
});

test('visual fixtures record provenance outside the app and add no banner height', () => {
  for (const file of ['app.tsx', 'ui-r02-04-app.tsx', 'vision-r02-home-panels-app.tsx']) {
    const source = read(`tools/visual-check/${file}`);
    assert.doesNotMatch(source, /Granskningsdata|testID="review-banner"|styles\.fixtureStatus|styles\.reviewBanner/, file);
  }
});
