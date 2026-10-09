import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, IconChip, type IconCategory } from '../../components/ui';
import { useReducedMotion } from '../../components/ui/Motion';
import type { HomeContent, OwnedDog } from '../../data/app-data';
import type { PlannedHealthRecord } from '../../data/workspace-data';
import { formatDogAge, localDate } from '../onboarding/dog';
import { LOG_EVENT_LABELS, localDateTimeParts, type LogEvent } from '../puppy-log/log-model';
import { tokens } from '../../theme/tokens';

type CarouselCard = {
  key: string;
  title: string;
  meta: string;
  category: IconCategory;
  onPress: () => void;
};

export function HomeCarousel({ dog, events, plans, content, contentState, nextStep, onGo, onOpenContent }: {
  dog: OwnedDog;
  events: readonly LogEvent[];
  plans: readonly PlannedHealthRecord[];
  content: readonly HomeContent[];
  contentState: 'loading' | 'ready' | 'error';
  nextStep?: string;
  onGo: (page: 'log' | 'training' | 'health' | 'knowledge') => void;
  onOpenContent: (id: string) => void;
}) {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const cardWidth = Math.max(tokens.size.touchMin * 5, width - tokens.layout.pageInset * 2 - tokens.spacing.xl * 2);
  const interval = cardWidth + tokens.spacing.md;
  const cards = useMemo(() => buildCards({ dog, events, plans, content, contentState, nextStep, onGo, onOpenContent }), [content, contentState, dog, events, nextStep, onGo, onOpenContent, plans]);

  return <View accessibilityLabel="Snabblänkar från Hem">
    <Text style={styles.heading} accessibilityRole="header">För dig idag</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      snapToAlignment="start"
      snapToInterval={reducedMotion ? undefined : interval}
      decelerationRate={reducedMotion ? 'normal' : 'fast'}
      disableIntervalMomentum={reducedMotion}
      accessibilityLabel="Bläddra mellan kort för dagens genvägar"
    >
      {cards.map((card) => <View key={card.key} style={{ width: cardWidth }}>
        <Card onPress={card.onPress} accessibilityLabel={`${card.title}. ${card.meta}`}>
          <View style={styles.card}>
            <IconChip category={card.category} size="large" />
            <View style={styles.copy}>
              <Text style={styles.title}>{card.title}</Text>
              <Text style={styles.meta}>{card.meta}</Text>
            </View>
            <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden />
          </View>
        </Card>
      </View>)}
    </ScrollView>
  </View>;
}

function buildCards({ dog, events, plans, content, contentState, nextStep, onGo, onOpenContent }: {
  dog: OwnedDog;
  events: readonly LogEvent[];
  plans: readonly PlannedHealthRecord[];
  content: readonly HomeContent[];
  contentState: 'loading' | 'ready' | 'error';
  nextStep?: string;
  onGo: (page: 'log' | 'training' | 'health' | 'knowledge') => void;
  onOpenContent: (id: string) => void;
}): CarouselCard[] {
  const latestEvent = events[0];
  const firstContent = content[0];
  const ageLabel = formatDogAge(dog.birth_date, localDate());
  const upcomingPlan = plans
    .filter((plan) => plan.due_on >= localDate())
    .sort((left, right) => left.due_on.localeCompare(right.due_on))[0];
  const cards: CarouselCard[] = [
    { key: 'training', title: nextStep ?? 'Fortsätt med träningen', meta: nextStep ? `${ageLabel} · Nästa steg i valpprogrammet` : `${ageLabel} · Se dagens övningar`, category: 'training', onPress: () => onGo('training') },
    { key: 'log', title: latestEvent ? 'Senaste Valplogg-händelser' : 'Börja med valploggen', meta: latestEvent ? `${LOG_EVENT_LABELS[latestEvent.type]} · ${localDateTimeParts(latestEvent.occurredAt).time}${events.length > 1 ? ` · ${events.length} senaste` : ''}` : 'Logga en liten stund från dagen', category: latestEvent?.type ?? 'food', onPress: () => onGo('log') },
    { key: 'knowledge', title: firstContent?.title ?? `Kunskap för ${dog.name}`, meta: firstContent ? `${ageLabel} · Läs ett tips för er` : contentState === 'error' ? 'Öppna guider och checklistor' : `${ageLabel} · Guider och checklistor för er`, category: 'sleep', onPress: () => firstContent ? onOpenContent(firstContent.id) : onGo('knowledge') },
  ];
  if (upcomingPlan) cards.push({ key: 'health', title: upcomingPlan.description || (upcomingPlan.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök'), meta: `Kommer ${shortDate(upcomingPlan.due_on)}`, category: upcomingPlan.event_type === 'vaccination' ? 'vaccination' : 'veterinary', onPress: () => onGo('health') });
  cards.push({ key: 'quick-log', title: 'Logga nu', meta: 'Kiss, mat, promenad eller vila', category: 'food', onPress: () => onGo('log') });
  return cards;
}

function shortDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  heading: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginTop: tokens.spacing.xl, marginBottom: tokens.spacing.md },
  content: { gap: tokens.spacing.md, paddingRight: tokens.layout.pageInset },
  card: { minHeight: tokens.size.quickLogHeight, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  copy: { flex: 1, gap: tokens.spacing.xs },
  title: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
