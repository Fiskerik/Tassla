import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('shared tabs expose a caller supplied accessible name and selected tab state', async () => {
  const tabs = await source('src/components/ui/Tabs.tsx');
  assert.match(tabs, /accessibilityLabel = 'Avsnitt'/);
  assert.match(tabs, /accessibilityRole="tablist" accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(tabs, /accessibilityRole="tab" accessibilityLabel=\{item\}/);
  assert.match(tabs, /accessibilityState=\{\{ selected \}\}/);
});

test('FAQ uses shared context tabs and keeps questions behind the review gate', async () => {
  const faq = await source('src/features/knowledge/FAQScreen.tsx');
  assert.match(faq, /<Tabs[\s\S]*accessibilityLabel="Sammanhang för vanliga frågor"/);
  assert.match(faq, /reviewEnabled \? REVIEW_FAQ\.filter/);
  assert.doesNotMatch(faq, /Granskningsdata|reviewNote/);
  assert.doesNotMatch(faq, /Tillfälligt exempel|sakgranskat/);
  assert.match(faq, /setSelectedContext\(value\); setOpened\(null\)/);
  assert.doesNotMatch(faq, /<Button/);
});

test('Knowledge uses semantic destination icons and compact detail headers without changing guide identities', async () => {
  const knowledge = await source('src/features/knowledge/KnowledgeScreen.tsx');
  assert.match(knowledge, /name="list-outline"/);
  assert.match(knowledge, /name="help-circle-outline"/);
  assert.doesNotMatch(knowledge, /IconChip category="training"|IconChip category="sleep"/);
  assert.match(knowledge, /selectedItem \? <AppBar[\s\S]*variant="compact"/);
  assert.match(knowledge, /tab === 'FAQ' \? <AppBar[\s\S]*variant="compact"/);
  assert.match(knowledge, /knowledgeImageForGuide\(item\)/);
  assert.doesNotMatch(knowledge, /getGuidePreviewText\(item\.body\)/);
  assert.match(knowledge, /selectedItem\.sources\.length > 0/);
});

test('training reset is presentation-only, exact-program, single-flight and explicitly confirmed', async () => {
  const training = await source('src/features/training/PublishedTrainingScreen.tsx');
  assert.doesNotMatch(training, /Alert\.alert/);
  assert.match(training, /program: PublishedTrainingProgram; fingerprint: string/);
  assert.match(training, /programResetFingerprint\(current\) !== target\.fingerprint/);
  assert.match(training, /if \(!target \|\| resetFlight\.current \|\| busyStepKey\) return/);
  assert.match(training, /onResetProgram\(target\.program\)/);
  assert.match(training, /resetTarget && !focusStep && currentResetProgram/);
  assert.match(training, /if \(resetTarget && !resetTargetIsCurrent\)/);
  assert.match(training, /if \(resetTarget && !resetTargetIsCurrent\) setResetTarget\(null\)/);
  assert.match(training, /resetReviewTrainingProgram\(value, target\.program\.id\)/);
  assert.match(training, /<Dialog visible=\{Boolean\(resetTarget && resetTargetIsCurrent\)\}/);
  assert.match(training, /onRequestClose=\{\(\) => setResetTarget\(null\)\} onConfirm=\{confirmReset\}/);
  assert.match(training, /accessibilityLabel=\{`Börja om med \$\{openProgram\.title\}`\}/);
  assert.match(training, /<Tabs[\s\S]*accessibilityLabel="Träningsvyer"/);
  assert.match(training, /recommendationProgramTitle[\s\S]*recommendationTitle/);
  assert.match(training, /onLayout=\{\(event\) => recordRecommendationCopyHeight\(event\.nativeEvent\.layout\.height\)/);
  assert.match(training, /minHeight: currentRecommendationCopyHeight/);
  assert.match(training, /recommendationProgramTitle: \{ \.\.\.tokens\.typography\.smallCaption/);
  assert.doesNotMatch(training, /Tillfälligt exempel|Syntetisk övning för layoutgranskning/);
});

test('review harness shows only concise review status and no sample filler copy', async () => {
  const harness = await source('tools/visual-check/ui-r02-04-app.tsx');
  assert.doesNotMatch(harness, /Syntetiskt granskningsläge|Syntetisk text för layoutgranskning|Tillfälligt exempel/);
  const verifier = await source('tools/visual-check/verify-ui-r02-04.py');
  assert.match(verifier, /placeholder copy is visible in/);
});

test('reminders keep draft, save and OS permission actions separate and show one information entry', async () => {
  const reminders = await source('src/features/notifications/NotificationSettingsScreen.tsx');
  const save = reminders.match(/async function save\(\) \{[\s\S]*?\n  \}/)?.[0];
  const permission = reminders.match(/async function requestPermission\(\) \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(save);
  assert.ok(permission);
  assert.match(save, /onSave\(\{ version: 1, enabled, trainingEnabled, trainingMinutes: minutes \?\? preferences\.trainingMinutes, routineEnabled, routineMinutes: routineMinutes \?\? preferences\.routineMinutes \?\? 540, phaseEnabled \}\)/);
  assert.doesNotMatch(save, /onRequestPermission/);
  assert.match(permission, /onRequestPermission\(\)/);
  assert.doesNotMatch(permission, /onSave/);
  assert.equal((reminders.match(/Visa information om lokala påminnelser/g) ?? []).length, 1);
  assert.match(reminders, /accessibilityRole="checkbox"[\s\S]*accessibilityState=\{\{ checked: selected/);
  assert.doesNotMatch(reminders, /choiceDetail|detail="Avbokar Tasslas|detail=\{enabled/);
  assert.match(reminders, /Träningspåminnelsen använder tiden du väljer/);
  assert.match(reminders, /Telefonens tillåtelse styr separat/);
  assert.match(reminders, /setTrainingEnabled\(\(value\) => !value\)/);
  assert.match(reminders, /onPress=\{\(\) => \{\s*if \(!enabled && !trainingEnabled\) setEnabled\(true\)/);
});

test('Insights uses the shared period tabs and includes the local today period', async () => {
  const insights = await source('src/features/puppy-log/InsightsScreen.tsx');
  assert.match(insights, /\{ key: 'today', label: 'Idag' \}/);
  assert.match(insights, /\{ key: 'week', label: 'Vecka' \}/);
  assert.match(insights, /\{ key: 'month', label: 'Månad' \}/);
  assert.match(insights, /\{ key: 'since_first_log', label: 'Sedan första loggen' \}/);
  assert.match(insights, /<Tabs[\s\S]*accessibilityLabel="Period för insikter"/);
  assert.match(insights, /onPeriodChange\(selected\.key\)/);
});


test('all shared destructive icon actions are red and preserve explicit labels and state', async () => {
  const button = await source('src/components/ui/Button.tsx');
  assert.match(button, /variant === 'icon' && \(iconName === 'trash-outline' \|\| iconName === 'trash'\)/);
  assert.match(button, /destructiveIcon \? tokens.colors.danger : tokens.colors.primary/);
  assert.match(button, /destructiveIcon: \{ backgroundColor: tokens.colors.surface, borderColor: tokens.colors.danger \}/);
  assert.match(button, /accessibilityRole="button" accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(button, /disabled=\{unavailable\} onPress=\{onPress\}/);
  const account = await source('src/features/account/AccountSettingsScreen.tsx');
  assert.match(account, /variant="icon" iconName="trash-outline" label="Radera konto"/);
  assert.match(account, /onPress=\{confirmDeletion\}/);
  assert.match(account, /text: 'Radera konto', style: 'destructive', onPress: \(\) => \{ void onDeleteAccount\(\); \}/);
  const toast = await source('src/components/ui/Toast.tsx');
  assert.match(toast, /iconName: 'arrow-undo-outline'/);
  assert.match(toast, /onPress: displayContent.onUndo/);
  const menu = await source('src/components/ui/ActionMenu.tsx');
  assert.match(menu, /name="trash-outline"[^>]*color=\{tokens.colors.danger\}/);
  assert.match(menu, /name="create-outline"/);
});

test('navigation names stay single line with full accessible names and nav-only text cap', async () => {
  const nav = await source('src/components/ui/BottomNav.tsx');
  assert.match(nav, /numberOfLines=\{1\} maxFontSizeMultiplier=\{1.4\}/);
  assert.match(nav, /accessibilityRole="tab" accessibilityLabel=\{item.label\}/);
  assert.match(nav, /minWidth: tokens.size.touchMin/);
  assert.match(nav, /key: 'knowledge'[^\n]*labelFlex: 1.3/);
});
