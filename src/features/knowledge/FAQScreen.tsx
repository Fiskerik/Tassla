import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { HomeContent } from '../../data/app-data';
import { MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { Button, Card, SectionHeader, Skeleton } from '../../components/ui';
import { MotionPressable } from '../../components/ui/Motion';
import { tokens } from '../../theme/tokens';
import { getSafeContentSourceUrl } from './source-links';
import { parseGuideBody } from './guide-body';
import { REVIEW_FAQ } from './review-content';
import type { ChecklistContext } from './checklist-model';

type FAQSelectionStatus = 'eligible' | 'empty' | 'unknown';
type FAQUnknownReason = 'missing_age' | 'invalid_request' | 'unmapped_version';

const contextTitles: Record<ChecklistContext, string> = {
  before_homecoming: 'Före hemkomst', first_days: 'Första dagarna hemma', by_age: 'Efter ålder',
};

const publicQuestions: Readonly<Record<string, string>> = {
  '62000000-0000-4000-8000-000000000004': 'Hur kan jag göra vardaglig hantering trygg och frivillig för valpen?',
  '62000000-0000-4000-8000-000000000006': 'Hur kan jag hjälpa valpen att vara själv en liten stund?',
};

export function FAQScreen({
  context,
  reviewEnabled,
  loading = false,
  error = false,
  publicItems = [],
  selectionStatus = 'unknown',
  unknownReason,
  onRetry = () => undefined,
  onOpenDogProfile,
  onOpenSource = () => undefined,
  sourceMessage = '',
}: {
  context: ChecklistContext;
  reviewEnabled: boolean;
  loading?: boolean;
  error?: boolean;
  publicItems?: readonly HomeContent[];
  selectionStatus?: FAQSelectionStatus;
  unknownReason?: FAQUnknownReason;
  onRetry?: () => void;
  onOpenDogProfile?: () => void;
  onOpenSource?: (source: string) => void;
  sourceMessage?: string;
}) {
  const [opened, setOpened] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState(context);
  const reviewQuestions = REVIEW_FAQ.filter((item) => item.context === selectedContext);
  const publicFaqs = publicItems.flatMap((item) => publicQuestions[item.id]
    ? [{ id: item.id, question: publicQuestions[item.id], answer: item.body, sources: item.sources }]
    : []);

  return <View style={styles.container}>
    <SectionHeader title="Vanliga frågor" />
    {reviewEnabled ? <>
      <View style={styles.contexts}>{(Object.keys(contextTitles) as ChecklistContext[]).map((value) => <View key={value} style={styles.contextButton}><Button variant={selectedContext === value ? 'secondary' : 'tertiary'} label={contextTitles[value]} accessibilityLabel={`Frågor: ${contextTitles[value]}`} onPress={() => { setSelectedContext(value); setOpened(null); }} /></View>)}</View>
      {reviewQuestions.length === 0 ? <Card><Text style={styles.meta}>Inga frågor publicerade ännu.</Text></Card> : reviewQuestions.map((item) => {
        const isOpen = opened === item.id;
        return <Card key={item.id} selected={isOpen} onPress={() => setOpened((current) => current === item.id ? null : item.id)} accessibilityLabel={`${item.question}${isOpen ? ', fäll ihop' : ', visa svar'}`}>
          <View style={styles.questionRow}>
            <View style={styles.questionIcon}><Ionicons name="help-circle-outline" size={tokens.size.iconSm} color={tokens.colors.destination.knowledge.icon} /></View>
            <Text style={styles.question}>{item.question}</Text>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
          </View>
          <Text style={styles.draft}>Tillfälligt exempel – innehållet är inte sakgranskat</Text>
          {isOpen ? <Text style={styles.answer}>{item.answer}</Text> : null}
        </Card>;
      })}
    </> : <>
      {loading ? <Skeleton shape="card" lines={4} /> : null}
      {error ? <>
        <MessageCard tone="error">Frågorna kunde inte hämtas just nu. Försök igen.</MessageCard>
        <PrimaryButton title="Försök igen" onPress={onRetry} />
      </> : null}
      {!loading && !error && selectionStatus === 'unknown' ? <>
        {unknownReason === 'missing_age'
          ? <MessageCard>Lägg till födelsedatum för åldersbaserade frågor.</MessageCard>
          : <MessageCard>Vi kan inte välja frågor för den här vyn just nu.</MessageCard>}
        {unknownReason === 'missing_age' && onOpenDogProfile
          ? <PrimaryButton title="Redigera hundprofil" onPress={onOpenDogProfile} /> : null}
      </> : null}
      {!loading && !error && selectionStatus === 'empty' ? <Card><Text style={styles.meta}>Just nu finns inga publicerade frågor för den här vyn</Text></Card> : null}
      {!loading && !error && selectionStatus === 'eligible' && publicFaqs.length === 0
        ? <Card><Text style={styles.meta}>Just nu finns inga publicerade frågor för den här vyn</Text></Card> : null}
      {!loading && !error && selectionStatus === 'eligible' ? publicFaqs.map((item) => {
        const isOpen = opened === item.id;
        return <Card key={item.id} selected={isOpen}>
          <MotionPressable accessibilityRole="button" accessibilityLabel={`${item.question}${isOpen ? ', fäll ihop' : ', visa svar'}`} onPress={() => setOpened((current) => current === item.id ? null : item.id)} style={styles.questionRow}>
            <View style={styles.questionIcon}><Ionicons name="help-circle-outline" size={tokens.size.iconSm} color={tokens.colors.destination.knowledge.icon} /></View>
            <Text style={styles.question}>{item.question}</Text>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
          </MotionPressable>
          {isOpen ? <>
            <View style={styles.answerBody}>
              {parseGuideBody(item.answer).map((block, index) => {
                if (block.type === 'heading') return <Text key={`${item.id}:heading:${index}`} accessibilityRole="header" style={block.level === 2 ? styles.bodyHeading : styles.bodySubheading}>{block.text}</Text>;
                if (block.type === 'list') return <View key={`${item.id}:list:${index}`} style={styles.bodyList}>
                  {block.items.map((entry, entryIndex) => <Text key={`${item.id}:list:${index}:${entryIndex}`} style={styles.bodyListItem}>• {entry}</Text>)}
                </View>;
                return <Text key={`${item.id}:paragraph:${index}`} style={styles.bodyParagraph}>{block.text}</Text>;
              })}
            </View>
            <Text style={styles.sourcesHeading} accessibilityRole="header">Källor</Text>
            {item.sources.length === 0 ? <Text style={styles.meta}>Ingen källhänvisning är angiven för den här texten.</Text> : item.sources.map((source, index) => {
              const safeUrl = getSafeContentSourceUrl(source);
              return <View key={`${item.id}:${index}`} style={styles.sourceRow}>
                <Ionicons name={safeUrl ? 'link-outline' : 'document-text-outline'} size={tokens.size.iconSm} color={tokens.colors.primary} />
                <View style={styles.sourceCopy}>
                  <Text style={styles.meta}>{source}</Text>
                  {safeUrl ? <QuietButton title="Öppna extern källa" onPress={() => onOpenSource(source)} /> : null}
                </View>
              </View>;
            })}
            {sourceMessage !== '' ? <MessageCard>{sourceMessage}</MessageCard> : null}
          </> : null}
        </Card>;
      }) : null}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  contexts: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs, marginBottom: tokens.spacing.sm },
  contextButton: { flexGrow: 0, flexShrink: 0, flexBasis: '45%' },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  questionIcon: { width: tokens.size.chipMd, height: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.destination.knowledge.surface, borderRadius: tokens.radius.full },
  question: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  answer: { ...tokens.typography.body, color: tokens.colors.textPrimary, marginTop: tokens.spacing.md },
  answerBody: { marginTop: tokens.spacing.md },
  bodyHeading: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginTop: tokens.spacing.md },
  bodySubheading: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginTop: tokens.spacing.md },
  bodyParagraph: { ...tokens.typography.body, color: tokens.colors.textPrimary, marginTop: tokens.spacing.sm },
  bodyList: { marginTop: tokens.spacing.sm },
  bodyListItem: { ...tokens.typography.body, color: tokens.colors.textPrimary, marginTop: tokens.spacing.sm },
  draft: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
  sourcesHeading: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginTop: tokens.spacing.lg },
  sourceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.spacing.sm, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, paddingVertical: tokens.spacing.md },
  sourceCopy: { flex: 1, gap: tokens.spacing.xs },
  meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
