import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, DailyActivityItem, DestinationTile, Skeleton } from '../../components/ui';
import { HorizontalGestureRegion } from '../../components/ui/MainSwipeNavigation';
import { MotionPressable } from '../../components/ui/Motion';
import type { HomeContent, OwnedDog } from '../../data/app-data';
import type { HealthHistoryRecord, PlannedHealthRecord } from '../../data/workspace-data';
import type { DailyRoutine, DailyRoutineChecklistItem, DailyRoutineCreateInput, DailyRoutineDay, DailyRoutineDaySkip, DailyRoutineRepeatValues, DailyRoutineWriteResult, DailyTrainingSelection } from './daily-activity-data';
import { selectDailyProgress, type DailyProgressCoverage, type HomeDailyActivity } from './daily-activity-model';
import { tokens } from '../../theme/tokens';
import { automaticDogAge, localDate } from '../onboarding/dog';
import type { LogEvent } from '../puppy-log/log-model';
import { homeAgeMarkerLabel, homeAgeStrip } from './home-today';
import { homeGreetingAt } from './home-greeting';
import { DailyActivityManagerSheet } from './DailyActivityManagerSheet';
import { DogProfileSwitcherSheet } from './DogProfileSwitcherSheet';
import type { RoutineDraft, RoutineDraftConflict, RoutineDraftRecovery } from './daily-activity-recovery';

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
  routineLabel?: string;
};

export function HomeScreen({ dog, breed, content, contentState, trainingState = 'loading', nextStep, reviewTrainingStep = false, today: todayValue,
  ownedDogs = [dog], onSelectDog, onAddDog, openDogSwitcherInitially = false, onDogSwitcherInitiallyOpened,
  dailyFixture, dailyState = 'hidden', dailyDateKey = '', dailyScopeKey, dailyActivities = [], routineTemplates = [], routineDaySkips = [], dailyTrainingOptions = [],
  dailyRefreshing = false, dailyRefreshError = false,
  dailyMutationBusy = false, dailyMutationKey = '', dailyMutationMessage = '', dailyMutationError = false, onRetryDaily,
  routineRecovery = null, onRoutineRecoveryChange,
  onOpenChecklist, onOpenProgress, onOpenTrainingStep, onOpenDevelopment,
  onCreateRoutine, onUpdateRoutine, onDeleteRoutine, onAddRoutineToDay, onRemoveRoutineFromDay,
  onSetRoutineCompletion, onAddTrainingToDay, onRemoveTrainingFromDay, onRetryDailyMutation, onGo, onOpenContent, onRetryContent }: {
  dog: OwnedDog;
  ownedDogs?: readonly OwnedDog[];
  onSelectDog?: (dogId: string) => void;
  onAddDog?: () => void;
  openDogSwitcherInitially?: boolean;
  onDogSwitcherInitiallyOpened?: () => void;
  breed?: string;
  today?: string;
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
  dailyState?: 'hidden' | 'loading' | 'ready' | 'partial' | 'error';
  dailyRefreshing?: boolean;
  dailyRefreshError?: boolean;
  dailyDateKey?: string;
  dailyScopeKey?: string;
  dailyActivities?: readonly HomeDailyActivity[];
  routineTemplates?: readonly DailyRoutine[];
  routineDaySkips?: readonly DailyRoutineDaySkip[];
  dailyTrainingOptions?: readonly HomeDailyTrainingOption[];
  dailyMutationBusy?: boolean;
  dailyMutationKey?: string;
  dailyMutationMessage?: string;
  dailyMutationError?: boolean;
  onOpenChecklist?: () => void;
  onOpenProgress?: () => void;
  onOpenDevelopment?: () => void;
  onOpenTrainingStep?: (programId: string, stepId: string, returnPage: 'home' | 'checklist') => void;
  onRetryDaily?: () => void;
  onCreateRoutine?: (routine: DailyRoutineCreateInput) => Promise<{ status: 'saved' | 'failed' | 'unknown' } | void>;
  onUpdateRoutine?: (routine: DailyRoutine, label: string, checklist: DailyRoutineChecklistItem[], repeat: DailyRoutineRepeatValues) => Promise<DailyRoutineWriteResult | void>;
  onDeleteRoutine?: (routine: DailyRoutine) => Promise<{ status: 'saved' | 'failed' | 'unknown' } | void>;
  onAddRoutineToDay?: (routine: DailyRoutine) => void;
  onRemoveRoutineFromDay?: (row: DailyRoutineDay, routine: DailyRoutine) => void;
  onSetRoutineCompletion?: (row: DailyRoutineDay, itemId: string, completed: boolean) => void;
  onAddTrainingToDay?: (option: HomeDailyTrainingOption) => void;
  onRemoveTrainingFromDay?: (row: DailyTrainingSelection) => void;
  onRetryDailyMutation?: () => void;
  routineRecovery?: RoutineDraftRecovery | null;
  onRoutineRecoveryChange?: (draft: RoutineDraft | null, conflict: RoutineDraftConflict | null) => void;
  onGo: (page: Destination) => void;
  onOpenContent: (id: string) => void;
  onRetryContent: () => void;
}) {
  const [managerVisible, setManagerVisible] = useState(() => Boolean(routineRecovery?.draft));
  const [focusRoutineId, setFocusRoutineId] = useState<string | null>(() => routineRecovery?.draft.routineId ?? null);
  const [reviewCompletion, setReviewCompletion] = useState<Record<string, boolean>>(() => Object.fromEntries((dailyFixture ?? []).map((item) => [item.id, item.completed])));
  const [portraitFrame, setPortraitFrame] = useState<{ left: number; right: number } | null>(null);
  const [dogSwitcherVisible, setDogSwitcherVisible] = useState(openDogSwitcherInitially);
  const today = todayValue ?? localDate();
  const age = automaticDogAge(dog.birth_date, today);
  const breedLabel = breed?.trim() || dog.breed_id;
  const relevantContent = contentState === 'ready'
    ? content.find((item) => item.contentType !== 'training_program')
    : undefined;
  const preview = relevantContent ? previewText(relevantContent.body) : '';
  const pageLabel = dailyFixture ? 'Hem. Syntetiskt granskningsläge.' : 'Hem';
  const dailyProgress = selectDailyProgress(dailyActivities, dailyState === 'hidden' ? 'unknown' : dailyState);
  const fixtureProgress = dailyFixture
    ? selectDailyProgress(dailyFixture.map((item) => ({ ...item, completed: reviewCompletion[item.id] ?? item.completed })), 'ready')
    : undefined;
  const checklistCoverage = fixtureProgress?.coverage ?? dailyProgress.coverage;
  const checklistTotal = fixtureProgress?.totalCount ?? dailyProgress.totalCount;
  const checklistCompleted = fixtureProgress?.completedCount ?? dailyProgress.completedCount;

  useEffect(() => {
    if (openDogSwitcherInitially) onDogSwitcherInitiallyOpened?.();
  }, [onDogSwitcherInitiallyOpened, openDogSwitcherInitially]);

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
          <Text style={styles.dogMeta}>{dog.name}{age ? ` · ${age.label}` : ` · ${breedLabel}`}</Text>
          {age ? <MotionPressable accessibilityRole="button" accessibilityLabel={`Visa utveckling för ${dog.name}`}
            accessibilityHint="Öppnar ålder och ungefärlig utvecklingsfas."
            onPress={onOpenDevelopment} style={({ pressed }) => [styles.dogPhaseAction, pressed && styles.headingPressed]}>
            <Text style={styles.dogPhase}>Ungefärlig fas: {age.stage}</Text>
            <Ionicons name="chevron-forward" size={tokens.size.iconSm - tokens.spacing.xs} color={tokens.colors.home.textMuted} accessibilityElementsHidden />
          </MotionPressable> : null}
        </View>
      </View>
      <MotionPressable style={({ pressed }) => [styles.dogPortrait, pressed && styles.portraitPressed]}
        accessibilityRole="button" accessibilityLabel={`Byt hund. ${dog.name} är vald`}
        accessibilityHint="Visar dina hundprofiler och möjligheten att lägga till en hund"
        onPress={() => setDogSwitcherVisible(true)} testID="home-dog-portrait"
        onLayout={(event) => {
          const { x, width } = event.nativeEvent.layout;
          setPortraitFrame((current) => current?.left === x && current.right === x + width ? current : { left: x, right: x + width });
        }}>
        <View style={styles.portraitPhotoClip}>
          <Image source={require('../../../assets/images/home-dog-portrait-placeholder.png')}
            style={styles.dogImage} resizeMode="cover" accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
        </View>
        <Text accessible={false} testID="home-portrait-standard-label" style={styles.portraitLabel}>Standardbild</Text>
      </MotionPressable>
      {age ? <HomeAgeStrip key={`${dog.id}:${age.unit}`} birthDate={dog.birth_date} today={today} unit={age.unit} portraitFrame={portraitFrame} /> : null}
    </View>

    <Card variant="home" onPress={relevantContent ? () => onOpenContent(relevantContent.id) : nextStep && trainingState === 'ready' ? () => onGo('training') : undefined}
      accessibilityLabel={`Just nu med ${dog.name}${age ? `, ${age.label}` : ''}${relevantContent ? `: ${relevantContent.title}` : nextStep && trainingState === 'ready' ? `: ${nextStep}` : ''}`}>
      <View style={styles.currentCard}>
        <View style={styles.cardHeadingRow}>
          <Ionicons name="bulb" size={tokens.size.iconSm} color={tokens.colors.home.bulb} accessibilityElementsHidden />
          <Text style={styles.cardHeading}>Just nu med {dog.name}{age ? ` · ${age.label}` : ''}</Text>
          {relevantContent || (nextStep && trainingState === 'ready') ? <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden /> : null}
        </View>
        {contentState === 'loading' ? <Skeleton shape="line" lines={2} /> : null}
        {contentState === 'error' ? <Text style={styles.body}>Artiklarna kunde inte hämtas just nu.</Text> : null}
        {relevantContent ? <Text numberOfLines={3} style={styles.body}>{preview}</Text> : null}
        {!relevantContent && contentState === 'ready' && trainingState === 'loading' ? <Skeleton shape="line" lines={2} /> : null}
        {!relevantContent && contentState === 'ready' && trainingState === 'error' ? <Text style={styles.body}>Träningen kunde inte hämtas just nu. Öppna Träna för att försöka igen.</Text> : null}
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
        <View style={styles.dailyHeading}>
          <Text style={styles.dailyTitle} accessibilityRole="header">Dagens att göra</Text>
          <ProgressControl coverage={checklistCoverage} completed={checklistCompleted} total={checklistTotal} onPress={onOpenProgress} />
          <ChecklistControl onPress={onOpenChecklist} />
        </View>
        {dailyRefreshError && dailyState === 'ready' ? <View style={styles.dailyRefreshError} accessibilityLiveRegion="polite">
          <Text style={styles.emptyText}>Uppdateringen kunde inte hämtas. Du ser senast hämtade uppgifter.</Text>
          {onRetryDaily ? <Button variant="tertiary" label="Försök igen" accessibilityLabel="Försök uppdatera dagens uppgifter igen" onPress={onRetryDaily} /> : null}
        </View> : null}
        {dailyFixture ? <>
          <ReviewDailyFixture items={dailyFixture} completion={reviewCompletion} refreshing={dailyRefreshing} onCompletionChange={setReviewCompletion} onGo={onGo} onOpenRoutine={(routineId) => openManager(routineId)} />
        </> : dailyState === 'loading' ? <>
          <Skeleton shape="row" lines={2} />
        </> : dailyState === 'error' ? <>
          <View style={styles.dailyState}>
            <Text style={styles.emptyText}>Dagens uppgifter kunde inte hämtas. Ingen status räknas just nu.</Text>
            {onRetryDaily ? <Button variant="tertiary" label="Hämta dagens uppgifter igen" accessibilityLabel="Hämta dagens uppgifter igen" onPress={onRetryDaily} /> : null}
          </View>
        </> : dailyProgress.coverage === 'unknown' || dailyProgress.coverage === 'partial' ? <>
          <View style={styles.dailyState}>
              <Text style={styles.emptyText}>Dagens uppgifter är inte tillgängliga ännu.</Text>
              {onRetryDaily ? <Button variant="tertiary" label="Hämta dagens uppgifter" accessibilityLabel="Hämta dagens uppgifter" onPress={onRetryDaily} /> : null}
          </View>
        </> : dailyProgress.coverage === 'empty' ? <>
          <View style={styles.dailyState}>
              {dailyRefreshing ? <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel="Dagens uppgifter uppdateras" size="small" color={tokens.colors.home.textMuted} /> : null}
              <Text style={styles.emptyText}>Skapa en rutin eller välj ett träningssteg att ha med idag.</Text>
          </View>
        </> : dailyProgress.coverage === 'complete' ? <>
          <View accessibilityRole="progressbar" accessibilityLabel={`${dailyProgress.completedCount} av ${dailyProgress.totalCount} dagsuppgifter klara`}
            accessibilityValue={{ min: 0, max: dailyProgress.totalCount, now: dailyProgress.completedCount }} style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(dailyProgress.completedCount / dailyProgress.totalCount * 100)}%` }]} />
          </View>
          {dailyRefreshing ? <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel="Dagens uppgifter uppdateras" size="small" color={tokens.colors.home.textMuted} /> : null}
          <View style={styles.dailyList}>
                {dailyProgress.activities.slice(0, 5).map((item) => {
                  const routineDay = item.routineDay;
                  const itemMutationKey = routineDay && item.routineItemId ? `complete-routine:${routineDay.id}:${item.routineItemId}` : '';
                  const itemMutation = Boolean(itemMutationKey && dailyMutationKey === itemMutationKey);
                  const isReadbackError = itemMutation && dailyMutationMessage.startsWith('Ändringen sparades, men dagens lista');
                  return <DailyActivityItem key={item.id} variant="home" kind={item.kind} label={item.label} routineLabel={item.routineLabel}
                    accessibilityLabel={item.kind === 'routine' ? `Rutin ${item.routineLabel ?? ''}, punkt ${item.label}` : `Träningsuppgift: ${item.label}`}
                    completed={item.completed} pending={itemMutation && dailyMutationBusy}
                    statusMessage={itemMutation ? dailyMutationMessage : ''} statusError={itemMutation && dailyMutationError}
                    onToggle={routineDay ? () => item.routineItemId && onSetRoutineCompletion?.(routineDay, item.routineItemId, !item.completed) : undefined}
                    onOpen={item.kind === 'training'
                      ? () => item.programId && item.stepId && onOpenTrainingStep
                        ? onOpenTrainingStep(item.programId, item.stepId, 'home')
                        : onGo('training')
                      : () => openManager(routineDay?.routine_id ?? null)}
                    onRetry={itemMutation ? (onRetryDailyMutation ?? (isReadbackError ? onRetryDaily : undefined)) : undefined} />;
                })}
          </View>
        </> : null}
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

    <DailyActivityManagerSheet key={`${dailyScopeKey ?? ''}:${dailyDateKey}:${focusRoutineId ?? 'all'}:${managerVisible}`}
      visible={managerVisible} dailyScopeKey={dailyScopeKey} onClose={() => setManagerVisible(false)} focusRoutineId={focusRoutineId}
      routineRecovery={routineRecovery} onRoutineRecoveryChange={onRoutineRecoveryChange}
      activities={dailyActivities} routines={routineTemplates} routineDaySkips={routineDaySkips} trainingOptions={dailyTrainingOptions}
      busy={dailyMutationBusy} mutationMessage={dailyMutationMessage} mutationError={dailyMutationError}
      onRetryMutation={onRetryDailyMutation} onCreateRoutine={onCreateRoutine} onUpdateRoutine={onUpdateRoutine}
      onDeleteRoutine={onDeleteRoutine} onAddRoutineToDay={onAddRoutineToDay} onRemoveRoutineFromDay={onRemoveRoutineFromDay}
      onAddTrainingToDay={onAddTrainingToDay} onRemoveTrainingFromDay={onRemoveTrainingFromDay} onGoTraining={() => onGo('training')} />
    <DogProfileSwitcherSheet visible={dogSwitcherVisible} dogs={ownedDogs} activeDogId={dog.id}
      onRequestClose={() => setDogSwitcherVisible(false)}
      onSelectDog={(dogId) => { setDogSwitcherVisible(false); onSelectDog?.(dogId); }}
      onAddDog={() => { setDogSwitcherVisible(false); onAddDog?.(); }} />
  </View>;
}

function ReviewDailyFixture({ items, completion, refreshing, onCompletionChange, onGo, onOpenRoutine }: { items: readonly HomeDailyFixtureItem[]; completion: Readonly<Record<string, boolean>>; refreshing: boolean; onCompletionChange: (update: (current: Record<string, boolean>) => Record<string, boolean>) => void; onGo: (page: Destination) => void; onOpenRoutine: (routineId?: string | null) => void }) {
  const fixtureActivities = items.map((item) => ({ ...item, completed: completion[item.id] ?? item.completed }));
  const progress = selectDailyProgress(fixtureActivities, 'ready');
  if (progress.coverage === 'empty') return <View style={styles.dailyState}><Text style={styles.emptyText}>Skapa en rutin eller välj ett träningssteg att ha med idag.</Text></View>;
  return <View style={styles.dailyList}>
    {refreshing ? <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel="Dagens uppgifter uppdateras" size="small" color={tokens.colors.home.textMuted} /> : null}
    <View accessibilityRole="progressbar" accessibilityLabel={`${progress.completedCount} av ${progress.totalCount} dagsuppgifter klara`}
      accessibilityValue={{ min: 0, max: progress.totalCount, now: progress.completedCount }} style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(progress.completedCount / progress.totalCount * 100)}%` }]} />
    </View>
    <View style={styles.activityRows}>{items.map((item) => <DailyActivityItem key={item.id} variant="home"
      kind={item.kind ?? 'routine'} label={item.label} accessibilityLabel={item.label}
      completed={completion[item.id] ?? item.completed}
      onToggle={item.kind === 'training' ? undefined : () => onCompletionChange((current) => ({ ...current, [item.id]: !(current[item.id] ?? item.completed) }))}
      routineLabel={item.routineLabel}
      onOpen={() => item.kind === 'training' ? onGo('training') : onOpenRoutine(item.routineId)} />)}</View>
  </View>;
}

function ChecklistControl({ onPress }: { onPress?: () => void }) {
  return <MotionPressable testID="home-open-checklist" accessibilityRole="button" accessibilityLabel="Öppna Checklistor"
    accessibilityHint="Visar hela dagens checklista."
    onPress={onPress} style={({ pressed }) => [styles.checklistInline, pressed && styles.headingPressed]}>
    <Ionicons testID="home-open-checklist-chevron" name="chevron-forward" size={tokens.size.iconSm - tokens.spacing.xs}
      color={tokens.colors.primary} accessibilityElementsHidden />
  </MotionPressable>;
}

function ProgressControl({ coverage, completed, total, onPress }: {
  coverage: DailyProgressCoverage;
  completed: number;
  total: number;
  onPress?: () => void;
}) {
  const complete = coverage === 'complete';
  if (!onPress) return complete ? <Text accessibilityLabel={`${completed} av ${total} klara`} style={styles.dailyCount}>{completed}/{total}</Text> : null;
  return <MotionPressable testID="home-open-progress" accessibilityRole="button"
    accessibilityLabel={complete ? `${completed} av ${total} dagsuppgifter klara. Se dagens framsteg` : 'Se dagens framsteg'}
    accessibilityHint="Visar dagens sammanställning och hela aktivitetslistan."
    onPress={onPress} style={({ pressed }) => [styles.progressControl, pressed && styles.headingPressed]}>
    <Ionicons name="stats-chart-outline" size={tokens.spacing.md} color={tokens.colors.home.greenStrong} accessibilityElementsHidden />
    <Text style={styles.progressControlText}>{complete ? `${completed}/${total} · Framsteg` : 'Se framsteg'}</Text>
  </MotionPressable>;
}

function previewText(body: string): string {
  const paragraph = body.split(/\n\s*\n/).find((part) => part.trim() && !/^\s*#{1,6}\s/.test(part));
  const text = (paragraph ?? body).replace(/^\s*[-*]\s+/gm, '').trim();
  return text.length > 150 ? `${text.slice(0, 147).trimEnd()}…` : text;
}

function HomeAgeStrip({ birthDate, today, unit, portraitFrame }: {
  birthDate: string | null;
  today: string;
  unit: 'weeks' | 'months' | 'years';
  portraitFrame: { left: number; right: number } | null;
}) {
  const [viewport, setViewport] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [scrollOffset, setScrollOffset] = useState<number | null>(null);
  const ageStrip = useMemo(() => homeAgeStrip(birthDate, today), [birthDate, today]);
  const markers = ageStrip?.unit === unit ? ageStrip.markers : [];
  const currentIndex = markers.findIndex((marker) => marker.current);
  const initialScrollIndex = Math.max(0, currentIndex - 3);
  const cellWidth = viewport.width > 0
    ? Math.max(0, (viewport.width - WEEK_GAP * (VISIBLE_AGE_COUNT - 1)) / VISIBLE_AGE_COUNT)
    : 0;
  const itemExtent = cellWidth + WEEK_GAP;
  const initialOffset = initialScrollIndex * itemExtent;
  const fadeOffset = scrollOffset ?? initialOffset;

  function renderAge({ item, index }: { item: (typeof markers)[number]; index: number }) {
    const markerCenter = viewport.left + index * itemExtent + cellWidth / 2 - fadeOffset;
    const fadeOpacity = !item.current && portraitFrame
      ? homeAgeDecorationOpacity(portraitFrame.left, portraitFrame.right, markerCenter)
      : null;
    const washOpacity = fadeOpacity === null ? null : 1 - fadeOpacity;
    const valueLabel = homeAgeMarkerLabel(item.value, unit);
    const legacyWeekTestId = unit === 'weeks' ? item.value : null;
    return <View style={[styles.weekItem, { width: cellWidth }]} testID={legacyWeekTestId === null ? `home-age-${unit}-${item.value}` : `home-week-${legacyWeekTestId}`}
      accessible accessibilityRole="text" accessibilityLabel={`${valueLabel}${item.current ? ', aktuell ålder' : ''}`}>
      {washOpacity !== null ? <View pointerEvents="none" testID={legacyWeekTestId === null ? `home-age-wash-${unit}-${item.value}` : `home-week-wash-${legacyWeekTestId}`}
        style={[StyleSheet.absoluteFill, styles.weekWash, { backgroundColor: `rgba(245, 240, 232, ${washOpacity})` }]} /> : null}
      <View testID={legacyWeekTestId === null ? `home-age-number-${unit}-${item.value}` : `home-week-number-${legacyWeekTestId}`} style={[styles.weekNumberWrap, fadeOpacity !== null && styles.weekNumberBacked, item.current && styles.currentWeekNumberWrap]}>
        <Text testID={legacyWeekTestId === null ? `home-age-glyph-${unit}-${item.value}` : `home-week-glyph-${legacyWeekTestId}`} style={[styles.weekNumber, item.current && styles.currentWeekNumber]}>{item.value}</Text>
      </View>
      <View testID={legacyWeekTestId === null ? `home-age-dot-${unit}-${item.value}` : `home-week-dot-${legacyWeekTestId}`} style={[styles.weekDot, item.current && styles.currentWeekDot, fadeOpacity !== null && { opacity: fadeOpacity }]} />
    </View>;
  }

  function onViewportLayout(event: { nativeEvent: { layout: { x: number; width: number } } }) {
    const { x, width } = event.nativeEvent.layout;
    setViewport((current) => current.left === x && current.width === width ? current : { left: x, width });
  }

  return <HorizontalGestureRegion>
    <View style={styles.weekStrip} testID="home-week-strip" onLayout={onViewportLayout}>
      {viewport.width > 0 && markers.length > 0 ? <FlatList
        style={StyleSheet.absoluteFill}
        data={markers}
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialScrollIndex}
        getItemLayout={(_, index) => ({ length: itemExtent, offset: itemExtent * index, index })}
        keyExtractor={(item) => `${unit}-${item.value}`}
        renderItem={renderAge}
        ItemSeparatorComponent={AgeSeparator}
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

function AgeSeparator() {
  return <View style={styles.weekSeparator} />;
}

const portraitSize = tokens.size.heroHeight * 0.56;
const VISIBLE_AGE_COUNT = 7;
const WEEK_GAP = tokens.spacing.xs;

function homeAgeDecorationOpacity(left: number, right: number, markerCenter: number): number | null {
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
  dogPhaseAction: { minHeight: tokens.size.touchMin, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, marginVertical: -tokens.spacing.xs / 2, paddingHorizontal: tokens.spacing.xs, marginLeft: -tokens.spacing.xs, borderRadius: tokens.radius.sm },
  dogPhase: { ...tokens.typography.caption, color: tokens.colors.home.textMuted },
  dogPortrait: { position: 'absolute', top: 0, right: 0, zIndex: 1, width: portraitSize, height: portraitSize, borderRadius: tokens.radius.full },
  portraitPressed: { opacity: 0.84, transform: [{ scale: 0.98 }] },
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
  currentCard: { gap: 0 },
  cardHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  cardHeading: { ...tokens.typography.label, color: tokens.colors.home.text, flex: 1 },
  body: { ...tokens.typography.caption, color: tokens.colors.home.text, flexShrink: 1 },
  exampleLabel: { ...tokens.typography.caption, color: tokens.colors.warning },
  dailyCardContent: { gap: tokens.spacing.xs },
  dailyHeading: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs / 2 },
  dailyTitle: { ...tokens.typography.label, color: tokens.colors.home.text, flex: 1 },
  dailyCount: { ...tokens.typography.caption, color: tokens.colors.home.textMuted, flexShrink: 0 },
  progressControl: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs / 2, paddingHorizontal: tokens.spacing.xs, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.selectedSurface, flexShrink: 0 },
  progressControlText: { ...tokens.typography.smallCaption, color: tokens.colors.home.greenStrong, fontWeight: '700' },
  checklistInline: { width: tokens.size.touchMin, height: tokens.size.touchMin, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.sm },
  headingPressed: { backgroundColor: tokens.colors.selectedSurface },
  dailyList: { gap: tokens.spacing.xs },
  progressTrack: { height: tokens.size.progress, borderRadius: tokens.radius.full, overflow: 'hidden', backgroundColor: tokens.colors.home.progressTrack },
  progressFill: { height: '100%', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.greenFill },
  activityRows: { gap: 0 },
  dailyState: { gap: tokens.spacing.xs },
  dailyRefreshError: { gap: tokens.spacing.xs },
  emptyText: { ...tokens.typography.caption, color: tokens.colors.home.textMuted, paddingVertical: tokens.spacing.xs },
  actionsSection: { gap: tokens.spacing.xs },
  actionsHeading: { ...tokens.typography.caption, fontWeight: '700', color: tokens.colors.home.text },
  actions: { flexDirection: 'row', gap: tokens.spacing.sm },
});
