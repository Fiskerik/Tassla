import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, IconChip, SectionHeader } from '../../components/ui';
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
    <View style={styles.contexts}>{(Object.keys(contextTitles) as ChecklistContext[]).map((value) => <Button key={value} variant={selectedContext === value ? 'secondary' : 'tertiary'} label={contextTitles[value]} accessibilityLabel={`Frågor: ${contextTitles[value]}`} onPress={() => { setSelectedContext(value); setOpened(null); }} />)}</View>
    {questions.length === 0 ? <Text style={styles.meta}>Inga frågor publicerade ännu.</Text> : questions.map((item) => <Card key={item.id} onPress={() => setOpened((current) => current === item.id ? null : item.id)} accessibilityLabel={`${item.question}${opened === item.id ? ', fäll ihop' : ', visa svar'}`}>
      <View style={styles.questionRow}><IconChip category="sleep" /><Text style={styles.question}>{item.question}</Text></View>
      {reviewEnabled ? <Text style={styles.draft}>Tillfälligt exempel – innehållet är inte sakgranskat</Text> : null}
      {opened === item.id ? <Text style={styles.answer}>{item.answer}</Text> : null}
    </Card>)}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  contexts: { gap: tokens.spacing.xs },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  question: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  answer: { ...tokens.typography.body, color: tokens.colors.textPrimary, marginTop: tokens.spacing.md },
  draft: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
  meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
