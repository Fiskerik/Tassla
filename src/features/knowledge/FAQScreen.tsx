import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, SectionHeader } from '../../components/ui';
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
  return <View style={styles.container}>
    <SectionHeader title="Vanliga frågor" />
    <View style={styles.contexts}>{(Object.keys(contextTitles) as ChecklistContext[]).map((value) => <View key={value} style={styles.contextButton}><Button variant={selectedContext === value ? 'secondary' : 'tertiary'} label={contextTitles[value]} accessibilityLabel={`Frågor: ${contextTitles[value]}`} onPress={() => { setSelectedContext(value); setOpened(null); }} /></View>)}</View>
    {questions.length === 0 ? <Card><Text style={styles.meta}>Inga frågor publicerade ännu.</Text></Card> : questions.map((item) => {
      const isOpen = opened === item.id;
      return <Card key={item.id} selected={isOpen} onPress={() => setOpened((current) => current === item.id ? null : item.id)} accessibilityLabel={`${item.question}${isOpen ? ', fäll ihop' : ', visa svar'}`}>
        <View style={styles.questionRow}>
          <View style={styles.questionIcon}><Ionicons name="help-circle-outline" size={tokens.size.iconSm} color={tokens.colors.destination.knowledge.icon} /></View>
          <Text style={styles.question}>{item.question}</Text>
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        </View>
        {reviewEnabled ? <Text style={styles.draft}>Tillfälligt exempel – innehållet är inte sakgranskat</Text> : null}
        {isOpen ? <Text style={styles.answer}>{item.answer}</Text> : null}
      </Card>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  contexts: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs, marginBottom: tokens.spacing.sm },
  contextButton: { flexGrow: 1, flexBasis: '45%' },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  questionIcon: { width: tokens.size.chipMd, height: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.destination.knowledge.surface, borderRadius: tokens.radius.full },
  question: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  answer: { ...tokens.typography.body, color: tokens.colors.textPrimary, marginTop: tokens.spacing.md },
  draft: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
  meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
