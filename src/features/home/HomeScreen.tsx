import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, DailyActivityItem, DestinationTile, Skeleton } from '../../components/ui';
import { HorizontalGestureRegion } from '../../components/ui/MainSwipeNavigation';
import { MotionPressable } from '../../components/ui/Motion';
import type { HomeContent, OwnedDog } from '../../data/app-data';
import type { HealthHistoryRecord, PlannedHealthRecord } from '../../data/workspace-data';
import type { DailyRoutine, DailyRoutineDay, DailyTrainingSelection } from './daily-activity-data';
import type { HomeDailyActivity } from './daily-activity-model';
import { tokens } from '../../theme/tokens';
import { localDate, formatDogAge } from '../onboarding/dog';
import type { LogEvent } from '../puppy-log/log-model';
import { homeAgeInWeeks, homeWeekStrip } from './home-today';
import { homeGreetingAt } from './home-greeting';
import { DailyActivityManagerSheet } from './DailyActivityManagerSheet';

type Destination = 'log' | 'training' | 'knowledge' | 'health' | 'planned-health';
type LoadState = 'loading' | 'ready' | 'error';
export type HomeDailyTrainingOption = { programId: string; versionId: string; stepId: string; programTitle: string; stepTitle: string };
export type HomeDailyFixtureItem = {
  id: string;
  label: string;
  detail?: string;
  category: import('../../components/ui').IconCategory;
  completed: boolean;
  destination: 'log' | 'training' | 'knowledge';
  kind?: 'routine' | 'training';
  routineId?: string;
};

export function HomeScreen({ dog, breed, content, contentState, trainingState = 'loading', nextStep, reviewTrainingStep = false,
  dailyFixture, dailyState = 'hidden', dailyDateKey = '', dailyScopeKey, dailyActivities = [], routineTemplates = [], dailyTrainingOptions = [],
  dailyMutationBusy = false, dailyMutationKey = '', dailyMutationMessage = '', dailyMutationError = false, onRetryDaily,
  onCreateRoutine, onUpdateRoutine, onDeleteRoutine, onAddRoutineToDay, onRemoveRoutineFromDay,
  onSetRoutineCompletion, onAddTrainingToDay, onRemoveTrainingFromDay, onRetryDailyMutation, onGo, onOpenContent, onRetryContent }: {
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
  dailyFixture?: readonly HomeDailyFixtureItem[];
  dailyState?: 'hidden' | 'loading' | 'ready' | 'error';
  dailyDateKey?: string;
  dailyScopeKey?: string;
  dailyActivities?: readonly HomeDailyActivity[];
  routineTemplates?: readonly DailyRoutine[];
  dailyTrainingOptions?: readonly HomeDailyTrainingOption[];
  dailyMutationBusy?: boolean;
  dailyMutationKey?: string;
  dailyMutationMessage?: string;
  dailyMutationError?: boolean;
  onRetryDaily?: () => void;
  onCreateRoutine?: (label: string) => void;
  onUpdateRoutine?: (routine: DailyRoutine, label: string) => void;
  onDeleteRoutine?: (routine: DailyRoutine) => void;
  onAddRoutineToDay?: (routine: DailyRoutine) => void;
  onRemoveRoutineFromDay?: (row: DailyRoutineDay) => void;
  onSetRoutineCompletion?: (row: DailyRoutineDay, completed: boolean) => void;
  onAddTrainingToDay?: (option: HomeDailyTrainingOption) => void;
  onRemoveTrainingFromDay?: (row: DailyTrainingSelection) => void;
  onRetryDailyMutation?: () => void;
  onGo: (page: Destination) => void;
  onOpenContent: (id: string) => void;
  onRetryContent: () => void;
}) {
  const [managerVisible, setManagerVisible] = useState(false);
  const [focusRoutineId, setFocusRoutineId] = useState<string | null>(null);
  const [reviewCompletion, setReviewCompletion] = useState<Record<string, boolean>>(() => Object.fromEntries((dailyFixture ?? []).map((item) => [item.id, item.completed])));
  const [portraitFrame, setPortraitFrame] = useState<{ left: number; right: number } | null>(null);
  const today = localDate();
  const ageWeeks = homeAgeInWeeks(dog.birth_date, today);
  const age = ageWeeks === null ? null : formatDogAge(dog.birth_date, today, dog.age_display_unit);
  const breedLabel = breed?.trim() || dog.breed_id;
  const relevantContent = contentState === 'ready'
    ? content.find((item) => item.contentType !== 'training_program')
    : undefined;
  const preview = relevantContent ? previewText(relevantContent.body) : '';
  const pageLabel = dailyFixture ? 'Hem. Syntetiskt granskningsläge.' : 'Hem';

  function openManager(routineId: string | null = null) {
    setFocusRoutineId(routineId);
    setManagerVisible(true);
  }

  return <View style={styles.page} accessibilityLabel={pageLabel}>
    <View style={styles.identity}>
      <View style={styles.greeting}>
        <View style={styles.greetingCopy}>
          <View style={styles.greetingTitleRow}>
            <Text style={styles.greetingTitle} accessibilityRole="header">{homeGreetingAt(new Date())}</Text>
            <Ionicons name="sunny" size={tokens.size.iconSm} color={tokens.colors.home.sun} accessibilityElementsHidden />
          </View>
          <Text style={styles.dogMeta}>{dog.name} | {breedLabel}</Text>
          {age ? <Text style={styles.dogAge}>{age}</Text> : null}
        </View>
      </View>
      <View style={styles.dogPortrait} pointerEvents="none" testID="home-dog-portrait"
        onLayout={(event) => {
          const { x, width } = event.nativeEvent.layout;
          setPortraitFrame((current) => current?.left === x && current.right === x + width ? current : { left: x, right: x + width });
        }}>
        <View style={styles.portraitPhotoClip}>
          <Image source={require('../../../assets/images/home-dog-portrait-placeholder.png')}
            style={styles.dogImage} resizeMode="cover" accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
        </View>
        <Text accessible accessibilityRole="text" accessibilityLabel="Standardbild" testID="home-portrait-standard-label" style={styles.portraitLabel}>Standardbild</Text>
      </View>
      {ageWeeks !== null ? <HomeWeekStrip key={dog.id} birthDate={dog.birth_date} today={today} currentWeek={ageWeeks} portraitFrame={portraitFrame} /> : null}
    </View>

    <Card variant="home" onPress={relevantContent ? () => onOpenContent(relevantContent.id) : nextStep && trainingState === 'ready' ? () => onGo('training') : undefined}
      accessibilityLabel={`Just nu med ${dog.name}${relevantContent ? `: ${relevantContent.title}` : nextStep && trainingState === 'ready' ? `: ${nextStep}` : ''}`}>
      <View style={styles.currentCard}>
        <View style={styles.cardHeadingRow}>
          <Ionicons name="bulb" size={tokens.size.iconSm} color={tokens.colors.home.bulb} accessibilityElementsHidden />
          <Text style={styles.cardHeading}>Just nu med {dog.name}</Text>
          {relevantContent || (nextStep && trainingState === 'ready') ? <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden /> : null}
        </View>
        {contentState === 'loading' ? <Skeleton shape="line" lines={2} /> : null}
        {contentState === 'error' ? <Text style={styles.body}>Kunskapen kunde inte hämtas just nu. Öppna Kunskap för att försöka igen.</Text> : null}
        {relevantContent ? <Text numberOfLines={3} style={styles.body}>{preview}</Text> : null}
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

    <Card variant="home" accessibilityLabel="Dagens att göra">
      <View style={styles.dailyCardContent}>
        <MotionPressable accessibilityRole="button" accessibilityLabel="Visa och hantera dagens uppgifter"
          onPress={() => openManager()} style={({ pressed }) => [styles.dailyHeading, pressed && styles.headingPressed]}>
          <Text style={styles.dailyTitle} accessibilityRole="header">Dagens att göra</Text>
          {dailyFixture ? <Text style={styles.dailyCount}>{dailyFixture.filter((item) => reviewCompletion[item.id] ?? item.completed).length} av {dailyFixture.length} klara</Text> : dailyState === 'ready' && dailyActivities.length > 0
            ? <Text style={styles.dailyCount}>{dailyActivities.filter((item) => item.completed).length} av {dailyActivities.length} klara</Text>
            : null}
          <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden />
        </MotionPressable>
        {dailyFixture ? <ReviewDailyFixture items={dailyFixture} completion={reviewCompletion} onCompletionChange={setReviewCompletion} onGo={onGo} onOpenRoutine={(routineId) => openManager(routineId)} /> : dailyState === 'loading' ? <Skeleton shape="row" lines={2} />
          : dailyState === 'error' ? <View style={styles.dailyState}>
            <Text style={styles.emptyText}>Dagens uppgifter kunde inte hämtas. Ingen status räknas just nu.</Text>
            {onRetryDaily ? <Button variant="tertiary" label="Hämta dagens uppgifter igen" accessibilityLabel="Hämta dagens uppgifter igen" onPress={onRetryDaily} /> : null}
          </View>
            : dailyState === 'ready' && dailyActivities.length === 0 ? <View style={styles.dailyState}>
              <Text style={styles.emptyText}>Välj rutiner eller ett träningssteg att ha med idag.</Text>
              <Button variant="tertiary" label="Välj dagens aktiviteter" accessibilityLabel="Välj dagens aktiviteter" onPress={() => openManager()} />
            </View>
              : dailyState === 'ready' ? <View style={styles.dailyList}>
                <View accessibilityRole="progressbar" accessibilityLabel={`${dailyActivities.filter((item) => item.completed).length} av ${dailyActivities.length} dagsuppgifter klara`}
                  accessibilityValue={{ min: 0, max: dailyActivities.length, now: dailyActivities.filter((item) => item.completed).length }} style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.round(dailyActivities.filter((item) => item.completed).length / dailyActivities.length * 100)}%` }]} />
                </View>
                {dailyActivities.slice(0, 5).map((item) => {
                  const routineDay = item.routineDay;
                  const itemMutationKey = routineDay ? `complete-routine:${routineDay.id}` : '';
                  const itemMutation = Boolean(itemMutationKey && dailyMutationKey === itemMutationKey);
                  const isReadbackError = itemMutation && dailyMutationMessage.startsWith('Ändringen sparades, men dagens lista');
                  return <DailyActivityItem key={item.id} variant="home" kind={item.kind} label={item.label}
                    accessibilityLabel={item.kind === 'routine' ? `Egen rutin: ${item.label}` : `Träningsuppgift: ${item.label}`}
                    completed={item.completed} pending={itemMutation && dailyMutationBusy}
                    statusMessage={itemMutation ? dailyMutationMessage : ''} statusError={itemMutation && dailyMutationError}
                    onToggle={routineDay ? () => onSetRoutineCompletion?.(routineDay, !item.completed) : undefined}
                    onOpen={item.kind === 'training' ? () => onGo('training') : () => openManager(routineDay?.routine_id ?? null)}
                    onRetry={itemMutation ? (onRetryDailyMutation ?? (isReadbackError ? onRetryDaily : undefined)) : undefined} />;
                })}
                {dailyActivities.length > 5 ? <MotionPressable accessibilityRole="button" accessibilityLabel={`Visa alla ${dailyActivities.length} uppgifter`}
                  onPress={() => openManager()} style={({ pressed }) => [styles.showAll, pressed && styles.headingPressed]}>
                  <Text style={styles.showAllText}>Visa alla</Text>
                  <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden />
                </MotionPressable> : null}
              </View> : null}
      </View>
    </Card>

    <View style={styles.actionsSection}>
      <Text style={styles.actionsHeading} accessibilityRole="header">Vad vill du göra nu?</Text>
      <View style={styles.actions}>
        <DestinationTile destination="log" compact variant="home" onPress={() => onGo('log')} />
        <DestinationTile destination="training" compact variant="home" onPress={() => onGo('training')} />
        <DestinationTile destination="knowledge" compact variant="home" onPress={() => onGo('knowledge')} />
      </View>
    </View>

    <DailyActivityManagerSheet visible={managerVisible} onClose={() => setManagerVisible(false)} focusRoutineId={focusRoutineId}
      dateKey={dailyDateKey} activities={dailyActivities} routines={routineTemplates} trainingOptions={dailyTrainingOptions}
      busy={dailyMutationBusy} mutationMessage={dailyMutationMessage} mutationError={dailyMutationError}
      onRetryMutation={onRetryDailyMutation} onCreateRoutine={onCreateRoutine} onUpdateRoutine={onUpdateRoutine}
      onDeleteRoutine={onDeleteRoutine} onAddRoutineToDay={onAddRoutineToDay} onRemoveRoutineFromDay={onRemoveRoutineFromDay}
      onAddTrainingToDay={onAddTrainingToDay} onRemoveTrainingFromDay={onRemoveTrainingFromDay} onGoTraining={() => onGo('training')} />
  </View>;
}

function ReviewDailyFixture({ items, completion, onCompletionChange, onGo, onOpenRoutine }: { items: readonly HomeDailyFixtureItem[]; completion: Readonly<Record<string, boolean>>; onCompletionChange: (update: (current: Record<string, boolean>) => Record<string, boolean>) => void; onGo: (page: Destination) => void; onOpenRoutine: (routineId?: string | null) => void }) {
  const completed = items.filter((item) => completion[item.id] ?? item.completed).length;
  return <View style={styles.dailyList}>
    <View accessibilityRole="progressbar" accessibilityLabel={`${completed} av ${items.length} dagsuppgifter klara`}
      accessibilityValue={{ min: 0, max: items.length, now: completed }} style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(completed / items.length * 100)}%` }]} />
    </View>
    <View style={styles.activityRows}>{items.map((item) => <DailyActivityItem key={item.id} variant="home"
      kind={item.kind ?? 'routine'} label={item.label} accessibilityLabel={item.label}
      completed={completion[item.id] ?? item.completed}
      onToggle={item.kind === 'training' ? undefined : () => onCompletionChange((current) => ({ ...current, [item.id]: !(current[item.id] ?? item.completed) }))}
      onOpen={() => item.kind === 'training' ? onGo('training') : onOpenRoutine(item.routineId)} />)}</View>
  </View>;
}

function previewText(body: string): string {
  const paragraph = body.split(/\n\s*\n/).find((part) => part.trim() && !/^\s*#{1,6}\s/.test(part));
  const text = (paragraph ?? body).replace(/^\s*[-*]\s+/gm, '').trim();
  return text.length > 150 ? `${text.slice(0, 147).trimEnd()}…` : text;
}

function HomeWeekStrip({ birthDate, today, currentWeek, portraitFrame }: {
  birthDate: string | null;
  today: string;
  currentWeek: number;
  portraitFrame: { left: number; right: number } | null;
}) {
  const [viewport, setViewport] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [scrollOffset, setScrollOffset] = useState<number | null>(null);
  const weeks = useMemo(() => homeWeekStrip(birthDate, today), [birthDate, today]);
  const initialScrollIndex = Math.max(0, currentWeek - 3);
  const cellWidth = viewport.width > 0
    ? Math.max(0, (viewport.width - WEEK_GAP * (VISIBLE_WEEK_COUNT - 1)) / VISIBLE_WEEK_COUNT)
    : 0;
  const itemExtent = cellWidth + WEEK_GAP;
  const initialOffset = initialScrollIndex * itemExtent;
  const fadeOffset = scrollOffset ?? initialOffset;

  function renderWeek({ item, index }: { item: (typeof weeks)[number]; index: number }) {
    const markerCenter = viewport.left + index * itemExtent + cellWidth / 2 - fadeOffset;
    const fadeOpacity = !item.current && portraitFrame
      ? homeWeekDecorationOpacity(portraitFrame.left, portraitFrame.right, markerCenter)
      : null;
    const washOpacity = fadeOpacity === null ? null : 1 - fadeOpacity;
    return <View style={[styles.weekItem, { width: cellWidth }]} testID={`home-week-${item.week}`}
      accessible accessibilityRole="text" accessibilityLabel={`${item.week} ${item.week === 1 ? 'vecka' : 'veckor'}${item.current ? ', aktuell ålder' : ''}`}>
      {washOpacity !== null ? <View pointerEvents="none" testID={`home-week-wash-${item.week}`}
        style={[StyleSheet.absoluteFill, styles.weekWash, { backgroundColor: `rgba(245, 240, 232, ${washOpacity})` }]} /> : null}
      <View testID={`home-week-number-${item.week}`} style={[styles.weekNumberWrap, fadeOpacity !== null && styles.weekNumberBacked, item.current && styles.currentWeekNumberWrap]}>
        <Text testID={`home-week-glyph-${item.week}`} style={[styles.weekNumber, item.current && styles.currentWeekNumber]}>{item.week}</Text>
      </View>
      <View testID={`home-week-dot-${item.week}`} style={[styles.weekDot, item.current && styles.currentWeekDot, fadeOpacity !== null && { opacity: fadeOpacity }]} />
    </View>;
  }

  function onViewportLayout(event: { nativeEvent: { layout: { x: number; width: number } } }) {
    const { x, width } = event.nativeEvent.layout;
    setViewport((current) => current.left === x && current.width === width ? current : { left: x, width });
  }

  return <HorizontalGestureRegion>
    <View style={styles.weekStrip} testID="home-week-strip" accessibilityLabel="Hundens ålder i veckor" onLayout={onViewportLayout}>
      {viewport.width > 0 ? <FlatList
        style={StyleSheet.absoluteFill}
        data={weeks}
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialScrollIndex}
        getItemLayout={(_, index) => ({ length: itemExtent, offset: itemExtent * index, index })}
        keyExtractor={(item) => String(item.week)}
        renderItem={renderWeek}
        ItemSeparatorComponent={WeekSeparator}
        extraData={{ scrollOffset, portraitFrame }}
        scrollEventThrottle={16}
        onScroll={(event) => {
          const nextOffset = event.nativeEvent.contentOffset.x;
          setScrollOffset((current) => current !== null && Math.abs(current - nextOffset) < 0.5 ? current : nextOffset);
        }}
      /> : null}
    </View>
  </HorizontalGestureRegion>;
}

function WeekSeparator() {
  return <View style={styles.weekSeparator} />;
}

const portraitSize = tokens.size.heroHeight * 0.56;
const VISIBLE_WEEK_COUNT = 7;
const WEEK_GAP = tokens.spacing.xs;

function homeWeekDecorationOpacity(left: number, right: number, markerCenter: number): number | null {
  const fadeStart = left - 16;
  if (markerCenter < fadeStart || markerCenter > right) return null;
  const z = (markerCenter - fadeStart) / (right - fadeStart);
  if (z < 1 / 3) return 0.78;
  if (z < 2 / 3) return 0.56;
  return 0.38;
}

const styles = StyleSheet.create({
  page: { gap: tokens.spacing.md, paddingBottom: tokens.spacing.lg, marginHorizontal: -tokens.layout.pageInset, paddingHorizontal: tokens.layout.pageInset, backgroundColor: tokens.colors.home.canvas },
  identity: { position: 'relative', gap: tokens.spacing.sm, minHeight: 118 },
  greeting: { minHeight: tokens.size.quickLogCompactHeight, flexDirection: 'row', alignItems: 'center' },
  greetingCopy: { flex: 1, gap: tokens.spacing.xs, paddingRight: portraitSize + tokens.spacing.sm },
  greetingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  greetingTitle: { ...tokens.typography.heading, color: tokens.colors.home.text, fontWeight: '600' },
  dogMeta: { ...tokens.typography.caption, color: tokens.colors.home.text, fontWeight: '700' },
  dogAge: { ...tokens.typography.caption, color: tokens.colors.home.textMuted },
  dogPortrait: { position: 'absolute', top: 0, right: 0, zIndex: 1, width: portraitSize, height: portraitSize },
  portraitPhotoClip: { width: portraitSize, height: portraitSize, overflow: 'hidden', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.canvas },
  dogImage: { width: portraitSize, height: portraitSize, transform: [{ scale: 1.08 }] },
  portraitLabel: { position: 'absolute', top: tokens.spacing.sm, right: tokens.spacing.xs, borderRadius: tokens.radius.sm, paddingHorizontal: tokens.spacing.xs, paddingVertical: 2, backgroundColor: tokens.colors.home.card, color: tokens.colors.home.text, fontSize: tokens.typography.caption.fontSize - tokens.spacing.xs, lineHeight: tokens.typography.caption.fontSize, fontWeight: '700' },
  weekStrip: { position: 'relative', zIndex: 2, alignSelf: 'stretch', height: tokens.size.touchMin },
  weekItem: { position: 'relative', height: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs / 2 },
  weekSeparator: { width: WEEK_GAP },
  weekWash: { borderRadius: tokens.radius.md },
  weekNumberWrap: { width: tokens.size.chipMd, height: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full },
  weekNumberBacked: { backgroundColor: tokens.colors.home.canvas },
  currentWeekNumberWrap: { backgroundColor: tokens.colors.home.greenStrong },
  weekNumber: { ...tokens.typography.caption, color: tokens.colors.home.textMuted },
  currentWeekNumber: { color: tokens.colors.onPrimary, fontWeight: '700' },
  weekDot: { width: tokens.spacing.xs + 1, height: tokens.spacing.xs + 1, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.border },
  currentWeekDot: { backgroundColor: tokens.colors.home.greenStrong },
  currentCard: { gap: tokens.spacing.sm },
  cardHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  cardHeading: { ...tokens.typography.label, color: tokens.colors.home.text, flex: 1 },
  body: { ...tokens.typography.caption, color: tokens.colors.home.text, flexShrink: 1 },
  exampleLabel: { ...tokens.typography.caption, color: tokens.colors.warning },
  dailyCardContent: { gap: tokens.spacing.xs },
  dailyHeading: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  dailyTitle: { ...tokens.typography.label, color: tokens.colors.home.text, flex: 1 },
  dailyCount: { ...tokens.typography.caption, color: tokens.colors.home.textMuted },
  headingPressed: { backgroundColor: tokens.colors.selectedSurface },
  dailyList: { gap: tokens.spacing.xs },
  progressTrack: { height: tokens.size.progress, borderRadius: tokens.radius.full, overflow: 'hidden', backgroundColor: tokens.colors.home.progressTrack },
  progressFill: { height: '100%', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.greenFill },
  activityRows: { gap: 0 },
  dailyState: { gap: tokens.spacing.xs },
  emptyText: { ...tokens.typography.caption, color: tokens.colors.home.textMuted, paddingVertical: tokens.spacing.xs },
  showAll: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs },
  showAllText: { ...tokens.typography.caption, color: tokens.colors.primary, textDecorationLine: 'underline' },
  actionsSection: { gap: tokens.spacing.xs },
  actionsHeading: { ...tokens.typography.caption, fontWeight: '700', color: tokens.colors.home.text },
  actions: { flexDirection: 'row', gap: tokens.spacing.sm },
});
