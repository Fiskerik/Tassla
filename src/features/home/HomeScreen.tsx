import { Image, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, IconChip, ListRow, QuickLogTile, Skeleton } from '../../components/ui';
import type { IconCategory } from '../../components/ui';
import { MotionPressable } from '../../components/ui/Motion';
import type { HomeContent, OwnedDog } from '../../data/app-data';
import type { HealthHistoryRecord, PlannedHealthRecord } from '../../data/workspace-data';
import { tokens } from '../../theme/tokens';
import { localDate, formatDogAge } from '../onboarding/dog';
import type { LogEvent } from '../puppy-log/log-model';
import { homeAgeInWeeks, homeTodaySources, homeWeekStrip } from './home-today';
import type { HomeTimelineEntry } from './home-timeline';

type Destination = 'log' | 'training' | 'knowledge' | 'health' | 'planned-health';
type LoadState = 'loading' | 'ready' | 'error';

export function HomeScreen({ dog, breed = '', events, healthHistory = [], plans = [], content, contentState, logState = 'ready', planState = 'ready', trainingState = 'loading', nextStep, reviewTrainingStep = false, onGo, onOpenContent, onRetryContent }: {
  dog: OwnedDog;
  breed?: string;
  events: readonly LogEvent[];
  healthHistory?: readonly HealthHistoryRecord[];
  healthHistoryState?: LoadState;
  plans?: readonly PlannedHealthRecord[];
  content: readonly HomeContent[];
  contentState: LoadState;
  logState?: LoadState;
  planState?: LoadState;
  trainingState?: LoadState;
  nextStep?: string;
  reviewTrainingStep?: boolean;
  onGo: (page: Destination) => void;
  onOpenContent: (id: string) => void;
  onRetryContent: () => void;
}) {
  const today = localDate();
  const ageWeeks = homeAgeInWeeks(dog.birth_date, today);
  const age = ageWeeks === null ? null : formatDogAge(dog.birth_date, today);
  const weekStrip = homeWeekStrip(dog.birth_date, today);
  const todaySources = homeTodaySources(today, events, healthHistory, plans);
  const latestLog = logState === 'ready' ? todaySources.logged.find((entry) => entry.source === 'log') : undefined;
  const relevantContent = contentState === 'ready'
    ? content.find((item) => item.contentType !== 'training_program')
    : undefined;
  const preview = relevantContent ? previewText(relevantContent.body) : '';

  return <View style={styles.page}>
    <View style={styles.identity}>
      <View style={styles.greeting}>
        <View style={styles.greetingCopy}>
          <Text style={styles.greetingTitle} accessibilityRole="header">God morgon! ☀️</Text>
          <Text style={styles.dogMeta}>{dog.name}{age ? ` · ${ageWeeks} ${ageWeeks === 1 ? 'vecka' : 'veckor'}` : ''}{breed ? ` · ${breed}` : ''}</Text>
        </View>
        <Image source={require('../../../assets/images/dog-placeholder.png')} style={styles.dogImage} resizeMode="contain" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </View>
      {weekStrip.length > 0 ? <View style={styles.weekStrip} accessibilityLabel="Hundens ålder i veckor">
        {weekStrip.map(({ week, current }) => <View key={week} style={styles.weekItem} accessible accessibilityRole="text" accessibilityLabel={`${week} ${week === 1 ? 'vecka' : 'veckor'}${current ? ', aktuell ålder' : ''}`}>
          <Text style={[styles.weekNumber, current && styles.currentWeekNumber]}>{week}</Text>
          <View style={[styles.weekDot, current && styles.currentWeekDot]} />
        </View>)}
      </View> : null}
    </View>

    <Card onPress={relevantContent ? () => onOpenContent(relevantContent.id) : nextStep && trainingState === 'ready' ? () => onGo('training') : undefined}
      accessibilityLabel={`Just nu med ${dog.name}${relevantContent ? `: ${relevantContent.title}` : nextStep && trainingState === 'ready' ? `: ${nextStep}` : ''}`}>
      <View style={styles.currentCard}>
        <View style={styles.cardHeadingRow}>
          <Ionicons name="bulb" size={tokens.size.iconMd} color={tokens.colors.warning} accessibilityElementsHidden />
          <Text style={styles.cardHeading}>Just nu med {dog.name}</Text>
        </View>
        {contentState === 'loading' ? <Skeleton shape="line" lines={2} /> : null}
        {contentState === 'error' ? <Text style={styles.body}>Kunskapen kunde inte hämtas just nu. Öppna Kunskap för att försöka igen.</Text> : null}
        {relevantContent ? <Text numberOfLines={2} style={styles.body}>{preview}</Text> : null}
        {!relevantContent && contentState === 'ready' && trainingState === 'loading' ? <Skeleton shape="line" lines={2} /> : null}
        {!relevantContent && contentState === 'ready' && trainingState === 'error' ? <Text style={styles.body}>Träningen kunde inte hämtas just nu.</Text> : null}
        {!relevantContent && contentState === 'ready' && trainingState === 'ready' && nextStep ? <>
          <Text numberOfLines={2} style={styles.body}>{nextStep}</Text>
          {reviewTrainingStep ? <Text style={styles.exampleLabel}>Tillfälligt exempel – innehållet är inte sakgranskat</Text> : null}
        </> : null}
        {!relevantContent && contentState === 'ready' && trainingState === 'ready' && !nextStep ? <Text style={styles.body}>Inget nytt innehåll att visa just nu.</Text> : null}
        {contentState === 'error' ? <Button variant="tertiary" label="Hämta guider igen" accessibilityLabel="Hämta guider igen" onPress={onRetryContent} /> : null}
      </View>
    </Card>

    <Card accessibilityLabel="Idag. Dagens logg, träningssteg och planer">
      <View style={styles.todayCardContent}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Idag</Text>
      <View style={styles.todayGroups}>
      <TodayGroup title="Loggat idag" action={<MotionPressable accessibilityRole="button" accessibilityLabel="Visa dagens logg" onPress={() => onGo('log')} style={styles.inlineAction}><Text style={styles.inlineActionText}>Visa dagens logg</Text></MotionPressable>}>
        {logState === 'loading' ? <Skeleton shape="row" lines={1} /> : null}
        {logState === 'error' ? <ListRow category="pee" title="Loggen kunde inte hämtas" meta="Öppna Logg för att försöka igen" onPress={() => onGo('log')} /> : null}
        {logState === 'ready' && !latestLog ? <Text style={styles.emptyText}>Inget loggat idag.</Text> : null}
        {latestLog ? <LoggedTodayRow entry={latestLog} onPress={() => onGo('log')} /> : null}
      </TodayGroup>
      <TodayGroup title="Nästa träningssteg">
        {trainingState === 'loading' ? <Skeleton shape="row" lines={1} /> : null}
        {trainingState === 'error' ? <ListRow category="training" title="Träningen kunde inte hämtas" meta="Öppna Träning för att försöka igen" onPress={() => onGo('training')} /> : null}
        {trainingState === 'ready' && nextStep ? <TodaySummaryRow category="training" title={nextStep} meta={reviewTrainingStep ? 'Tillfälligt exempel – innehållet är inte sakgranskat' : undefined} onPress={() => onGo('training')} /> : null}
        {trainingState === 'ready' && !nextStep ? <Text style={styles.emptyText}>Inget nästa steg tillgängligt just nu.</Text> : null}
      </TodayGroup>
      <TodayGroup title="Planerat idag">
        {planState === 'loading' ? <Skeleton shape="row" lines={1} /> : null}
        {planState === 'error' ? <ListRow category="vaccination" title="Planerna kunde inte hämtas" onPress={() => onGo('planned-health')} /> : null}
        {planState === 'ready' && todaySources.planned.length === 0 ? <Text style={styles.emptyText}>Inget planerat idag.</Text> : null}
        {planState === 'ready' ? todaySources.planned.map((plan) => <TodaySummaryRow key={plan.id}
          category={plan.event_type === 'vaccination' ? 'vaccination' : 'veterinary'}
          title={plan.description || (plan.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök')}
          time={plan.due_time?.slice(0, 5)} onPress={() => onGo('planned-health')} />) : null}
      </TodayGroup>
      </View>
      </View>
    </Card>

    <View style={styles.actionsSection}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Vad vill du göra nu?</Text>
      <View style={styles.actions}>
        <QuickLogTile label="Logga" category="pee" compact onPress={() => onGo('log')} />
        <QuickLogTile label="Träna" category="training" compact onPress={() => onGo('training')} />
        <QuickLogTile label="Kunskap" category="awake" compact onPress={() => onGo('knowledge')} />
      </View>
    </View>
  </View>;
}

function TodayGroup({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <View style={styles.todayGroup}>
    <View style={styles.groupHeading}><Text style={styles.groupTitle} accessibilityRole="header">{title}</Text>{action}</View>
    <View style={styles.groupRows}>{children}</View>
  </View>;
}

function LoggedTodayRow({ entry, onPress }: { entry: HomeTimelineEntry; onPress: () => void }) {
  return <TodaySummaryRow category={entry.category} title={entry.title} time={entry.time ?? undefined} onPress={onPress} />;
}

function TodaySummaryRow({ category, title, time, meta, onPress }: {
  category: IconCategory;
  title: string;
  time?: string;
  meta?: string;
  onPress: () => void;
}) {
  const label = [time, title, meta].filter(Boolean).join(', ');
  return <MotionPressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => [styles.summaryRow, pressed && styles.summaryRowPressed]}>
    <IconChip category={category} size="medium" />
    <View style={styles.summaryCopy}>
      <Text style={styles.summaryTitle}>{time ? <><Text style={styles.summaryTime}>{time} </Text>{title}</> : title}</Text>
      {meta ? <Text style={styles.summaryMeta}>{meta}</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
  </MotionPressable>;
}

function previewText(body: string): string {
  const paragraph = body.split(/\n\s*\n/).find((part) => part.trim() && !/^\s*#{1,6}\s/.test(part));
  const text = (paragraph ?? body).replace(/^\s*[-*]\s+/gm, '').trim();
  return text.length > 150 ? `${text.slice(0, 147).trimEnd()}…` : text;
}

const styles = StyleSheet.create({
  page: { gap: tokens.layout.sectionGap, paddingBottom: tokens.spacing.xl },
  identity: { gap: tokens.spacing.sm },
  greeting: { minHeight: tokens.size.quickLogCompactHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  greetingCopy: { flex: 1, gap: tokens.spacing.xs },
  greetingTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  dogMeta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  dogImage: { width: tokens.size.quickLogCompactHeight, height: tokens.size.quickLogCompactHeight },
  weekStrip: { flexDirection: 'row', gap: tokens.spacing.xs, alignSelf: 'stretch', marginBottom: tokens.spacing.sm },
  weekItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs },
  weekNumber: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  currentWeekNumber: { minWidth: tokens.size.touchMin - tokens.spacing.xs, minHeight: tokens.size.touchMin, textAlign: 'center', textAlignVertical: 'center', borderRadius: tokens.radius.full, overflow: 'hidden', backgroundColor: tokens.colors.primary, color: tokens.colors.onPrimary, fontWeight: '700' },
  weekDot: { width: tokens.spacing.sm, height: tokens.spacing.sm, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.border },
  currentWeekDot: { backgroundColor: tokens.colors.primary },
  currentCard: { gap: tokens.spacing.sm },
  cardHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  cardHeading: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  body: { ...tokens.typography.body, color: tokens.colors.textPrimary, flexShrink: 1 },
  exampleLabel: { ...tokens.typography.caption, color: tokens.colors.warning },
  sectionTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  todayCardContent: { gap: tokens.layout.headingGap },
  todayGroups: { gap: tokens.layout.listGap },
  todayGroup: { gap: tokens.spacing.xs },
  groupHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  groupTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  inlineAction: { minHeight: tokens.size.touchMin, justifyContent: 'center', paddingHorizontal: tokens.spacing.xs },
  inlineActionText: { ...tokens.typography.caption, color: tokens.colors.primary, textDecorationLine: 'underline' },
  groupRows: { gap: tokens.layout.listGap },
  summaryRow: { minHeight: tokens.size.touchMin, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.xs, borderRadius: tokens.radius.md },
  summaryRowPressed: { backgroundColor: tokens.colors.selectedSurface },
  summaryCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  summaryTitle: { ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: '700', flexShrink: 1 },
  summaryTime: { ...tokens.typography.caption, color: tokens.colors.textSecondary, fontWeight: '400' },
  summaryMeta: { ...tokens.typography.caption, color: tokens.colors.warning, flexShrink: 1 },
  emptyText: { ...tokens.typography.caption, color: tokens.colors.textSecondary, paddingVertical: tokens.spacing.sm },
  actionsSection: { gap: tokens.layout.headingGap },
  actions: { flexDirection: 'row', gap: tokens.spacing.sm },
});
