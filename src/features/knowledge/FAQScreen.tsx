import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageCard, PrimaryButton } from '../../components/AppPrimitives';
import { SectionHeader, Skeleton, Tabs } from '../../components/ui';
import { MotionPressable } from '../../components/ui/Motion';
import type { PublishedFaq } from '../../data/workspace-data';
import { tokens } from '../../theme/tokens';
import type { ChecklistContext } from './checklist-model';
import { isChecklistContext } from './checklist-model';
import faqBundle from '../../../docs/content/knowledge-faq-v1.json';
import { REVIEW_FAQ } from './review-content';
import { ContentSources } from './ContentSources';

const contextTitles: Record<ChecklistContext, string> = {
  before_homecoming: 'Hemkomst', first_days: 'Första dagarna', by_age: 'Efter ålder',
};
const contexts = Object.keys(contextTitles) as ChecklistContext[];
type FaqDisplayItem = { id: string; context: ChecklistContext; question: string; answer: string; sources: string[] };
type FaqLoadState = 'loading' | 'ready' | 'error';
const reviewFaqIdBySlug: Record<string, string> = {
  'faq-first-night': 'review-v1:faq:first-night',
  'faq-alone-time': 'review-v1:faq:alone-time',
  'faq-child-contact': 'review-v1:faq:child-contact',
  'faq-puppy-course': 'review-v1:faq:course',
};

const reviewFaqs: FaqDisplayItem[] = faqBundle.faqs.flatMap((faq) => {
  const version = faq.versions[0];
  const id = reviewFaqIdBySlug[faq.slug];
  if (!version || !id || !isChecklistContext(version.context)) return [];
  return [{ id, context: version.context, question: version.title, answer: version.body, sources: version.sources }];
});

export function FAQScreen({
  context, reviewEnabled, items, state, onRetry, onOpenSource, sourceMessage = '',
}: {
  context: ChecklistContext;
  reviewEnabled: boolean;
  items: readonly PublishedFaq[];
  state: FaqLoadState;
  onRetry: () => void;
  onOpenSource: (source: string) => void;
  sourceMessage?: string;
}) {
  const [opened, setOpened] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState(context);
  const publishedFaqs: FaqDisplayItem[] = items.map((item) => ({
    id: item.id, context: item.context, question: item.question, answer: item.answer, sources: item.sources,
  }));
  const questions = reviewEnabled ? REVIEW_FAQ.filter((item) => item.context === selectedContext)
      .flatMap((fixture) => reviewFaqs.filter((item) => item.id === fixture.id))
    : publishedFaqs.filter((item) => item.context === selectedContext);
  const activeContext = contextTitles[selectedContext];

  return <View style={styles.container}>
    <SectionHeader title="Vanliga frågor" />
    <Tabs items={contexts.map((value) => contextTitles[value])} active={activeContext} accessibilityLabel="Sammanhang för vanliga frågor" variant="rev02-segmented" scrollable
      onChange={(label) => {
        const value = contexts.find((candidate) => contextTitles[candidate] === label);
        if (value) { setSelectedContext(value); setOpened(null); }
      }} />
    {!reviewEnabled && state === 'loading' ? <Skeleton shape="card" lines={3} /> : null}
    {!reviewEnabled && state === 'error' ? <View style={styles.feedback}>
      <MessageCard tone="error">Frågorna kunde inte hämtas just nu.</MessageCard>
      <PrimaryButton title="Försök igen" onPress={onRetry} />
    </View> : null}
    {((!reviewEnabled && state === 'ready') || reviewEnabled) && questions.length === 0
      ? <View style={styles.empty}><Text style={styles.meta}>Inga frågor publicerade ännu.</Text></View>
      : null}
    {((!reviewEnabled && state === 'ready') || reviewEnabled) ? questions.map((item) => {
      const isOpen = opened === item.id;
      const sources = item.sources;
      return <View key={item.id} style={[styles.card, isOpen && styles.openCard]}>
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={`${item.question}${isOpen ? ', dölj svar' : ', visa svar'}`}
          accessibilityState={{ expanded: isOpen }}
          onPress={() => setOpened((current) => current === item.id ? null : item.id)}
          style={styles.questionHeader}
        >
          <View style={styles.questionIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Ionicons name="help-circle-outline" size={tokens.size.iconSm} color={tokens.colors.destination.knowledge.icon} />
          </View>
          <Text style={styles.question}>{item.question}</Text>
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        </MotionPressable>
        {isOpen ? <View style={styles.answerArea}>
          <Text style={styles.answer}>{item.answer}</Text>
          <ContentSources sources={sources} onOpenSource={onOpenSource} />
        </View> : null}
      </View>;
    }) : null}
    {sourceMessage !== '' && (reviewEnabled || state === 'ready')
      ? <Text accessibilityLiveRegion="polite" style={styles.sourceMessage}>{sourceMessage}</Text>
      : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  feedback: { gap: tokens.spacing.sm },
  empty: { minHeight: tokens.size.touchMin, justifyContent: 'center', padding: tokens.layout.cardPadding, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface },
  card: { alignSelf: 'stretch', borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, overflow: 'hidden' },
  openCard: { borderColor: tokens.colors.destination.knowledge.icon, backgroundColor: tokens.colors.destination.knowledge.surface },
  questionHeader: { minHeight: tokens.size.touchMin, paddingHorizontal: tokens.layout.cardPadding, paddingVertical: tokens.spacing.sm, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  questionIcon: { width: tokens.size.chipMd, height: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.surface, borderRadius: tokens.radius.full },
  question: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  answerArea: { paddingHorizontal: tokens.layout.cardPadding, paddingTop: 0, paddingBottom: tokens.spacing.xs },
  answer: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  sourceMessage: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
