import { useEffect, useMemo, useState } from 'react';
import { AppState, Image, ScrollView, StyleSheet, Text, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, IconChip, Skeleton } from '../../components/ui';
import { MotionPressable, useReducedMotion } from '../../components/ui/Motion';
import type { HomeContent, OwnedDog } from '../../data/app-data';
import type { PlannedHealthRecord } from '../../data/workspace-data';
import { formatDogAge } from '../onboarding/dog';
import { summarizePottyRhythm, type LogEvent, type PottyRhythmSummary } from '../puppy-log/log-model';
import { tokens } from '../../theme/tokens';
import { CHECKLIST_DESTINATION_ID, FAQ_DESTINATION_ID } from '../knowledge/review-content';

type CarouselCard = { key: string; title: string; meta: string; image: ImageSourcePropType; onPress: () => void; category?: 'training' | 'sleep' };
type PottyType = PottyRhythmSummary['type'];

const PERSONAL_WINDOW_DISCLOSURE = 'Ungefärligt tidsfönster utifrån dina loggar.';
const POTTY_LABELS: Record<PottyType, string> = { pee: 'Kiss', poop: 'Bajs' };
const ESTIMATED_GUIDANCE: Record<PottyType, { condition: string; text: string; source: string }[]> = {
  pee: [
    {
      condition: 'Ny valp · första veckorna',
      text: 'Efter sömn, mat, lek – varannan timme när valpen är vaken.',
      source: 'Agria',
    },
    {
      condition: 'Frisk, inaktiv vuxen',
      text: 'Kan ofta hålla sig 3–4 tim; aktiva hundar kan behöva rastas oftare.',
      source: 'VCA',
    },
  ],
  poop: [
    {
      condition: 'Valp efter måltid',
      text: 'Kan ofta behöva bajsa cirka 10–20 min efter mat.',
      source: 'AniCura',
    },
    {
      condition: 'De flesta hundar',
      text: 'Bajsar 1–3 gånger om dagen, ofta efter mat.',
      source: 'VCA',
    },
  ],
};

export function HomeCarousel({ dog, pottyEvents, pottyHistoryState, pottyRetrying, onRetryPotty, today, plans, selectedDatePlans, content, contentState, nextStep, onGo, onOpenContent }: {
  dog: OwnedDog;
  pottyEvents: readonly LogEvent[];
  pottyHistoryState: 'loading' | 'ready' | 'error';
  pottyRetrying: boolean;
  onRetryPotty: () => void;
  today: string;
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
  const [now, setNow] = useState(() => new Date());
  const cardWidth = Math.max(tokens.size.touchMin * 5, width - tokens.layout.pageInset * 2 - tokens.spacing.xl * 2);
  const interval = cardWidth + tokens.spacing.md;
  const summaries = useMemo(() => pottyHistoryState === 'ready' ? summarizePottyRhythm(pottyEvents, dog.id, now, today) : [], [dog.id, now, pottyEvents, pottyHistoryState, today]);
  const cards = useMemo(() => buildCards({ dog, today, plans, selectedDatePlans, content, contentState, nextStep, onGo, onOpenContent }), [content, contentState, dog, nextStep, onGo, onOpenContent, plans, selectedDatePlans, today]);

  useEffect(() => {
    const nextWindowEnd = summaries
      .map((summary) => summary.windowEnd ? Date.parse(summary.windowEnd) : Number.POSITIVE_INFINITY)
      .filter((end) => end > now.getTime())
      .sort((left, right) => left - right)[0];
    if (nextWindowEnd === undefined || !Number.isFinite(nextWindowEnd)) return;
    const timer = setTimeout(() => setNow(new Date()), Math.max(0, nextWindowEnd - now.getTime() + 1));
    return () => clearTimeout(timer);
  }, [now, summaries]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => subscription.remove();
  }, []);

  return <View accessibilityLabel="Förslag för dig">
    <Text style={styles.heading} accessibilityRole="header">För dig idag</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content} snapToAlignment="start" snapToInterval={reducedMotion ? undefined : interval} decelerationRate={reducedMotion ? 'normal' : 'fast'} disableIntervalMomentum={reducedMotion} accessibilityLabel="Bläddra mellan dagens förslag">
      <View style={{ width: cardWidth }}>
        <PottySummaryCard dog={dog} summaries={summaries} pottyHistoryState={pottyHistoryState} pottyRetrying={pottyRetrying} onRetryPotty={onRetryPotty} today={today} onOpenLog={() => onGo('log')} />
      </View>
      {cards.map((card) => <View key={card.key} style={{ width: cardWidth }}>
        <Card onPress={card.onPress} accessibilityLabel={`${card.title}. ${card.meta}`}>
          <View style={styles.card}>
            <Image source={card.image} style={styles.image} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <View style={styles.copy}>
              {card.category ? <View style={styles.category}><IconChip category={card.category} /><Text style={styles.meta}>{card.category === 'training' ? 'Checklista' : 'Vanliga frågor'}</Text></View> : null}
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

function PottySummaryCard({ dog, summaries, pottyHistoryState, pottyRetrying, onRetryPotty, today, onOpenLog }: {
  dog: OwnedDog;
  summaries: readonly PottyRhythmSummary[];
  pottyHistoryState: 'loading' | 'ready' | 'error';
  pottyRetrying: boolean;
  onRetryPotty: () => void;
  today: string;
  onOpenLog: () => void;
}) {
  const dateLabel = formatDateLabel(today);
  const accessibilityLabel = pottySummaryAccessibilityLabel(dog.name, today, summaries, pottyHistoryState);
  return <View style={styles.summarySurface}>
    <MotionPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onOpenLog} style={styles.summaryCard}>
      <View style={styles.summaryHeading}>
        <Text style={styles.summaryTitle}>Dagens kiss och bajs</Text>
        <Text style={styles.summaryMeta}>Idag för {dog.name} · {dateLabel}</Text>
      </View>
      {pottyHistoryState === 'loading' ? <>
        {pottyRetrying ? <Text style={styles.summaryMessage}>Laddar översikten…</Text> : null}
        <Skeleton shape="row" lines={2} />
      </> : null}
      {pottyHistoryState === 'error' ? <Text style={styles.summaryMessage}>Vi kunde inte visa översikten just nu.</Text> : null}
      {pottyHistoryState === 'ready' && !dog.id.trim() ? <Text style={styles.summaryMessage}>Hundens logg kunde inte visas.</Text> : null}
      {pottyHistoryState === 'ready' && dog.id.trim() && summaries.length !== 2 ? <Text style={styles.summaryMessage}>Hundens logg kunde inte visas.</Text> : null}
      {pottyHistoryState === 'ready' && summaries.length === 2 ? summaries.map((summary) => <PottyCategorySummary key={summary.type} summary={summary} today={today} />) : null}
    </MotionPressable>
    {pottyHistoryState === 'error' || (pottyHistoryState === 'loading' && pottyRetrying) ? <Button label="Försök igen" accessibilityLabel="Försök igen" variant="tertiary" onPress={onRetryPotty} disabled={pottyRetrying} loading={pottyRetrying} /> : null}
  </View>;
}

function PottyCategorySummary({ summary, today }: { summary: PottyRhythmSummary; today: string }) {
  return <View style={styles.summaryCategory}>
    <View style={styles.categoryHeading}>
      <IconChip category={summary.type} />
      <Text style={styles.categoryTitle}>{POTTY_LABELS[summary.type]}</Text>
    </View>
    <Text style={styles.dailyCount}>{formatDailyCount(summary.todayCount)}</Text>
    <Text style={styles.historyText}>{summary.latestOccurredAt ? formatLatest(summary.latestOccurredAt, today) : 'Inget loggat än'}</Text>
    {summary.mode === 'estimated' ? <>
      <Text style={styles.modeLabel}>Estimerad</Text>
      {ESTIMATED_GUIDANCE[summary.type].map((guidance) => <View key={guidance.condition} style={styles.guidanceRow}>
        <Text style={styles.guidanceCondition}>{guidance.condition} · Källa: {guidance.source}</Text>
        <Text style={styles.guidanceText}>{guidance.text}</Text>
      </View>)}
    </> : <>
      {summary.medianIntervalMinutes !== null ? <Text style={styles.intervalText}>Typiskt intervall mellan loggade händelser: cirka {formatInterval(summary.medianIntervalMinutes)}.</Text> : null}
      {summary.timesVary ? <><Text style={styles.modeLabel}>Rekommenderad</Text><Text style={styles.historyText}>Tiderna varierar.</Text></> : null}
      {summary.windowStart && summary.windowEnd ? <View style={styles.windowGroup}>
        <Text style={styles.modeLabel}>Rekommenderad</Text>
        <Text style={styles.windowTime}>{formatWindow(summary.windowStart, summary.windowEnd, today)}</Text>
        <Text style={styles.disclosure}>{PERSONAL_WINDOW_DISCLOSURE}</Text>
      </View> : null}
      {!summary.timesVary && !summary.windowStart ? <Text style={styles.modeLabel}>Rekommenderad</Text> : null}
    </>}
  </View>;
}

function pottySummaryAccessibilityLabel(dogName: string, today: string, summaries: readonly PottyRhythmSummary[], historyState: 'loading' | 'ready' | 'error'): string {
  const heading = `Dagens kiss och bajs för ${dogName}, ${formatDateLabel(today)}.`;
  if (historyState === 'loading') return `${heading} Laddar översikten.`;
  if (historyState === 'error') return `${heading} Vi kunde inte visa översikten just nu. Öppna Logg för att se händelser.`;
  if (summaries.length !== 2) return `${heading} Hundens logg kunde inte visas.`;
  const categories = summaries.map((summary) => {
    const parts = [POTTY_LABELS[summary.type], formatDailyCount(summary.todayCount)];
    parts.push(summary.latestOccurredAt ? formatLatest(summary.latestOccurredAt, today) : 'Inget loggat än');
    if (summary.mode === 'estimated') {
      parts.push('Estimerad.');
      parts.push(...ESTIMATED_GUIDANCE[summary.type].map((guidance) => `${guidance.condition}. ${guidance.text} Källa: ${guidance.source}.`));
    } else {
      if (summary.medianIntervalMinutes !== null) parts.push(`Typiskt intervall mellan loggade händelser: cirka ${formatInterval(summary.medianIntervalMinutes)}.`);
      if (summary.windowStart && summary.windowEnd) {
        parts.push('Rekommenderad.');
        parts.push(formatWindow(summary.windowStart, summary.windowEnd, today));
        parts.push(PERSONAL_WINDOW_DISCLOSURE);
      } else {
        parts.push('Rekommenderad.');
      }
      if (summary.timesVary) {
        parts.push('Tiderna varierar.');
      }
    }
    return parts.join('. ');
  });
  return [heading, ...categories].join(' ');
}

function formatDailyCount(count: number): string {
  if (count === 0) return 'Inget loggat idag';
  return `${count} ${count === 1 ? 'gång' : 'gånger'} idag`;
}

function formatLatest(value: string, today: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Senaste loggtid saknas';
  const datePart = localDateForDate(date) === today ? 'idag' : formatDateLabel(localDateForDate(date));
  return `Senast loggat ${datePart} kl. ${formatTime(date)}`;
}

function formatInterval(minutes: number): string {
  const rounded = Math.round(minutes);
  const days = Math.floor(rounded / (24 * 60));
  const hours = Math.floor((rounded % (24 * 60)) / 60);
  const remainder = rounded % 60;
  if (days > 0) return `${days} dygn${hours > 0 ? ` ${hours} tim` : ''}${remainder > 0 ? ` ${remainder} min` : ''}`;
  if (hours > 0) return `${hours} tim${remainder > 0 ? ` ${remainder} min` : ''}`;
  return `${remainder} min`;
}

function formatWindow(startValue: string, endValue: string, today: string): string {
  const start = new Date(startValue);
  const end = new Date(endValue);
  const startDate = localDateForDate(start);
  const endDate = localDateForDate(end);
  if (startDate === endDate) return `${startDate === today ? 'Idag' : formatDateLabel(startDate)} ${formatTime(start)}–${formatTime(end)}`;
  return `${formatDateLabel(startDate)} ${formatTime(start)}–${formatDateLabel(endDate)} ${formatTime(end)}`;
}

function localDateForDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function formatTime(value: Date): string {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

function buildCards({ dog, today, plans, selectedDatePlans, content, contentState, nextStep, onGo, onOpenContent }: {
  dog: OwnedDog;
  today: string;
  plans: readonly PlannedHealthRecord[];
  selectedDatePlans: readonly PlannedHealthRecord[];
  content: readonly HomeContent[];
  contentState: 'loading' | 'ready' | 'error';
  nextStep?: string;
  onGo: (page: 'log' | 'training' | 'health' | 'knowledge') => void;
  onOpenContent: (id: string) => void;
}): CarouselCard[] {
  const article = contentState === 'ready' ? content[0] : undefined;
  const reviewTraining = contentState === 'ready' ? content.find((item) => item.contentType === 'training_program' && item.id.startsWith('review-v1:training:')) : undefined;
  const ageLabel = formatDogAge(dog.birth_date, today);
  const upcomingPlan = plans.filter((plan) => plan.due_on >= today).sort((left, right) => left.due_on.localeCompare(right.due_on))[0];
  const cards: CarouselCard[] = [
    { key: 'training', title: nextStep ?? 'Fortsätt träna', meta: `${ageLabel} · ${reviewTraining ? 'Tillfälligt exempel – innehållet är inte sakgranskat' : 'Nästa steg i valpprogrammet'}`, image: require('../../../assets/images/puppy-training.png'), onPress: () => reviewTraining ? onOpenContent(reviewTraining.id) : onGo('training') },
    { key: 'knowledge', title: article?.title ?? 'Kunskap för er', meta: article ? `${ageLabel} · Läs ett tips för er` : contentState === 'error' ? 'Guider och checklistor för er' : `${ageLabel} · Guider och checklistor för er`, image: require('../../../assets/images/puppy-resting-carousel.png'), onPress: () => article ? onOpenContent(article.id) : onGo('knowledge') },
    { key: 'checklists', title: 'Checklistor för valptiden', meta: `${ageLabel} · Se listor för er fas${process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true' ? ' · Tillfälligt exempel' : ''}`, image: require('../../../assets/images/puppy-training.png'), category: 'training', onPress: () => onOpenContent(CHECKLIST_DESTINATION_ID) },
    { key: 'faq', title: 'Vanliga frågor', meta: `Svar sorterade efter fas${process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true' ? ' · Tillfälligt exempel' : ''}`, image: require('../../../assets/images/puppy-resting-carousel.png'), category: 'sleep', onPress: () => onOpenContent(FAQ_DESTINATION_ID) },
  ];
  if (upcomingPlan && !selectedDatePlans.some((plan) => plan.id === upcomingPlan.id)) {
    const details = [`Kommer ${shortDate(upcomingPlan.due_on)}`];
    if (upcomingPlan.due_time) details.push(`Tid ${upcomingPlan.due_time.slice(0, 5)}`);
    if (upcomingPlan.reminder_minutes !== null) details.push(`Påminnelse ${formatMinutes(upcomingPlan.reminder_minutes)}`);
    cards.push({ key: 'health', title: upcomingPlan.description || (upcomingPlan.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök'), meta: details.join(' · '), image: require('../../../assets/images/puppy-water.png'), onPress: () => onGo('health') });
  }
  return cards;
}

function shortDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function formatMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  heading: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginTop: tokens.spacing.xl, marginBottom: tokens.spacing.md },
  content: { gap: tokens.spacing.md, paddingRight: tokens.layout.pageInset },
  summarySurface: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, padding: tokens.layout.cardPadding, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, gap: tokens.spacing.sm },
  summaryCard: { gap: tokens.spacing.md },
  summaryHeading: { gap: tokens.spacing.xs },
  summaryTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  summaryMeta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  summaryCategory: { gap: tokens.spacing.sm, borderTopWidth: tokens.size.stroke, borderColor: tokens.colors.border, paddingTop: tokens.spacing.md },
  categoryHeading: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  categoryTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  dailyCount: { ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: '700' },
  modeLabel: { ...tokens.typography.label, color: tokens.colors.primary },
  historyText: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  intervalText: { ...tokens.typography.caption, color: tokens.colors.textPrimary },
  guidanceRow: { gap: tokens.spacing.xs, borderTopWidth: tokens.size.stroke, borderColor: tokens.colors.border, paddingTop: tokens.spacing.sm },
  guidanceCondition: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  guidanceText: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  guidanceSource: { color: tokens.colors.textPrimary, fontWeight: '700' },
  windowGroup: { gap: tokens.spacing.xs, borderTopWidth: tokens.size.stroke, borderColor: tokens.colors.border, paddingTop: tokens.spacing.sm },
  windowTime: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  disclosure: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  summaryMessage: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  card: { gap: tokens.spacing.md },
  image: { width: '100%', height: tokens.size.quickLogHeight, borderRadius: tokens.radius.md },
  copy: { flex: 1, gap: tokens.spacing.xs },
  category: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  title: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
