import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card } from '../../components/ui';
import { useReducedMotion } from '../../components/ui/Motion';
import type { HomeContent, OwnedDog } from '../../data/app-data';
import type { PlannedHealthRecord } from '../../data/workspace-data';
import { formatDogAge, localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';

type CarouselCard = { key: string; title: string; meta: string; image: ImageSourcePropType; onPress: () => void };

export function HomeCarousel({ dog, plans, selectedDatePlans, content, contentState, nextStep, onGo, onOpenContent }: {
  dog: OwnedDog;
  plans: readonly PlannedHealthRecord[];
  selectedDatePlans: readonly PlannedHealthRecord[];
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
  const cards = useMemo(() => buildCards({ dog, plans, selectedDatePlans, content, contentState, nextStep, onGo, onOpenContent }), [content, contentState, dog, nextStep, onGo, onOpenContent, plans, selectedDatePlans]);

  return <View accessibilityLabel="Förslag för dig">
    <Text style={styles.heading} accessibilityRole="header">För dig idag</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content} snapToAlignment="start" snapToInterval={reducedMotion ? undefined : interval} decelerationRate={reducedMotion ? 'normal' : 'fast'} disableIntervalMomentum={reducedMotion} accessibilityLabel="Bläddra mellan dagens förslag">
      {cards.map((card) => <View key={card.key} style={{ width: cardWidth }}>
        <Card onPress={card.onPress} accessibilityLabel={`${card.title}. ${card.meta}`}>
          <View style={styles.card}>
            <Image source={card.image} style={styles.image} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
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

function buildCards({ dog, plans, selectedDatePlans, content, contentState, nextStep, onGo, onOpenContent }: {
  dog: OwnedDog;
  plans: readonly PlannedHealthRecord[];
  selectedDatePlans: readonly PlannedHealthRecord[];
  content: readonly HomeContent[];
  contentState: 'loading' | 'ready' | 'error';
  nextStep?: string;
  onGo: (page: 'log' | 'training' | 'health' | 'knowledge') => void;
  onOpenContent: (id: string) => void;
}): CarouselCard[] {
  const article = contentState === 'ready' ? content[0] : undefined;
  const ageLabel = formatDogAge(dog.birth_date, localDate());
  const upcomingPlan = plans.filter((plan) => plan.due_on >= localDate()).sort((left, right) => left.due_on.localeCompare(right.due_on))[0];
  const cards: CarouselCard[] = [
    { key: 'training', title: nextStep ?? 'Fortsätt träna', meta: `${ageLabel} · Nästa steg i valpprogrammet`, image: require('../../../assets/images/puppy-training.png'), onPress: () => onGo('training') },
    { key: 'knowledge', title: article?.title ?? 'Kunskap för er', meta: article ? `${ageLabel} · Läs ett tips för er` : contentState === 'error' ? 'Guider och checklistor för er' : `${ageLabel} · Guider och checklistor för er`, image: require('../../../assets/images/puppy-resting-carousel.png'), onPress: () => article ? onOpenContent(article.id) : onGo('knowledge') },
  ];
  if (upcomingPlan && !selectedDatePlans.some((plan) => plan.id === upcomingPlan.id)) cards.push({ key: 'health', title: upcomingPlan.description || (upcomingPlan.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök'), meta: `Kommer ${shortDate(upcomingPlan.due_on)}`, image: require('../../../assets/images/puppy-water.png'), onPress: () => onGo('health') });
  return cards;
}

function shortDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  heading: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginTop: tokens.spacing.xl, marginBottom: tokens.spacing.md },
  content: { gap: tokens.spacing.md, paddingRight: tokens.layout.pageInset },
  card: { gap: tokens.spacing.md },
  image: { width: '100%', height: tokens.size.quickLogHeight, borderRadius: tokens.radius.md },
  copy: { flex: 1, gap: tokens.spacing.xs },
  title: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
