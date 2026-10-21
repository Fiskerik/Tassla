import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui';
import { KnowledgeIconBadge } from './KnowledgeIconBadge';
import { REVIEW_FAQ } from './review-content';
import type { ChecklistContext } from './checklist-model';
import { tokens } from '../../theme/tokens';

const contextTitles: Record<ChecklistContext, string> = {
  before_homecoming: 'Före hemkomst', first_days: 'Första dagarna hemma', by_age: 'Efter ålder',
};

export function FAQScreen({ context, reviewEnabled }: { context: ChecklistContext; reviewEnabled: boolean }) {
  const [opened, setOpened] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState(context);
  const questions = reviewEnabled ? REVIEW_FAQ.filter((item) => item.context === selectedContext) : [];
  const contextIconIds: Record<ChecklistContext, string> = { before_homecoming: 'before_homecoming', first_days: 'first_days', by_age: 'by_age' };
  return <View style={styles.container}>
    {reviewEnabled ? <View style={styles.contexts}>{(Object.keys(contextTitles) as ChecklistContext[]).map((value) => <Card key={value} selected={selectedContext === value} onPress={() => { setSelectedContext(value); setOpened(null); }} accessibilityLabel={`Frågor: ${contextTitles[value]}${selectedContext === value ? ', valt' : ''}`}>
      <View style={styles.contextRow}><KnowledgeIconBadge id={contextIconIds[value]} /><Text style={styles.contextLabel}>{contextTitles[value]}</Text>{selectedContext === value ? <Ionicons name="checkmark-circle" size={tokens.size.iconSm} color={tokens.colors.destination.knowledge.icon} /> : null}</View>
    </Card>)}</View> : null}
    {questions.length === 0 ? <Card><View style={styles.emptyRow}><KnowledgeIconBadge id="review-v1:destination:faq" /><Text style={styles.meta}>Inga frågor publicerade ännu.</Text></View></Card> : questions.map((item) => {
      const isOpen = opened === item.id;
      return <Card key={item.id} selected={isOpen} onPress={() => setOpened((current) => current === item.id ? null : item.id)} accessibilityLabel={`${item.question}${isOpen ? ', fäll ihop' : ', visa svar'}`}>
        <View style={styles.questionRow}>
          <KnowledgeIconBadge id={item.id} />
          <Text style={styles.question}>{item.question}</Text>
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        </View>
        {reviewEnabled ? <Text style={styles.draft}>Tillfälligt exempel – innehållet är inte sakgranskat</Text> : null}
        {isOpen ? <View style={styles.answerSurface}><Text style={styles.answer}>{item.answer}</Text></View> : null}
      </Card>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  contexts: { gap: tokens.spacing.xs, marginBottom: tokens.spacing.sm },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  contextLabel: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  questionIcon: { width: tokens.size.chipMd, height: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.destination.knowledge.surface, borderRadius: tokens.radius.full },
  question: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  answerSurface: { marginTop: tokens.spacing.md, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.destination.knowledge.surface, padding: tokens.spacing.md },
  answer: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  draft: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
  meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
