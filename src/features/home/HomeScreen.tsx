import { Alert, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, DailyActivityItem, DestinationTile, IconChip, ListRow, Skeleton } from '../../components/ui';
import type { IconCategory } from '../../components/ui';
import { MotionPressable } from '../../components/ui/Motion';
import type { HomeContent, OwnedDog } from '../../data/app-data';
import type { HealthHistoryRecord, PlannedHealthRecord } from '../../data/workspace-data';
import type { DailyRoutine, DailyRoutineDay, DailyTrainingSelection } from './daily-activity-data';
import type { HomeDailyActivity } from './daily-activity-model';
import { tokens } from '../../theme/tokens';
import { localDate, formatDogAge } from '../onboarding/dog';
import type { LogEvent } from '../puppy-log/log-model';
import { homeAgeInWeeks, homeTodaySources, homeWeekStrip } from './home-today';
import type { HomeTimelineEntry } from './home-timeline';
import { homeGreetingAt } from './home-greeting';

type Destination = 'log' | 'training' | 'knowledge' | 'health' | 'planned-health';
type LoadState = 'loading' | 'ready' | 'error';
export type HomeDailyTrainingOption = { programId: string; versionId: string; stepId: string; programTitle: string; stepTitle: string };
export type HomeDailyFixtureItem = {
  id: string;
  label: string;
  detail?: string;
  category: IconCategory;
  completed: boolean;
  destination: 'log' | 'training' | 'knowledge';
};

export function HomeScreen({ dog, events, healthHistory = [], plans = [], content, contentState, logState = 'ready', planState = 'ready', trainingState = 'loading', nextStep, reviewTrainingStep = false, dailyFixture, dailyState = 'hidden', dailyDateKey = '', dailyScopeKey, dailyActivities = [], routineTemplates = [], dailyTrainingOptions = [], dailyMutationBusy = false, dailyMutationMessage = '', dailyMutationError = false, onRetryDaily, onCreateRoutine, onUpdateRoutine, onDeleteRoutine, onAddRoutineToDay, onRemoveRoutineFromDay, onSetRoutineCompletion, onAddTrainingToDay, onRemoveTrainingFromDay, onRetryDailyMutation, onGo, onOpenContent, onRetryContent }: {
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
          <Text style={styles.greetingTitle} accessibilityRole="header">{homeGreetingAt(new Date())}</Text>
          <Text style={styles.dogMeta}>{dog.name}{age ? ` · ${ageWeeks} ${ageWeeks === 1 ? 'vecka' : 'veckor'}` : ''}</Text>
        </View>
      </View>
      <View style={styles.dogPortrait} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Image source={require('../../../assets/images/dog-placeholder.png')} style={styles.dogImage} resizeMode="contain" />
      </View>
      {weekStrip.length > 0 ? <View style={styles.weekStrip} accessibilityLabel="Hundens ålder i veckor">
        {weekStrip.map(({ week, current }, index) => <View key={week} style={styles.weekItem} accessible accessibilityRole="text" accessibilityLabel={`${week} ${week === 1 ? 'vecka' : 'veckor'}${current ? ', aktuell ålder' : ''}`}>
          <View style={[styles.weekNumberWrap, current && styles.currentWeekNumberWrap, !current && index >= weekStrip.length - 3 && styles.weekNumberPortraitBacking]}>
            <Text style={[styles.weekNumber, current && styles.currentWeekNumber]}>{week}</Text>
          </View>
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

    <Card accessibilityLabel={dailyFixture ? 'Idag. Dagens syntetiska uppgifter' : 'Idag. Dagens uppgifter, logg, träningssteg och planer'}>
      <View style={styles.todayCardContent}>
      {!dailyFixture ? <Text style={styles.sectionTitle} accessibilityRole="header">Idag</Text> : null}
      {dailyFixture ? <ReviewDailyFixture items={dailyFixture} onGo={onGo} /> : <>
      {dailyState !== 'hidden' ? <DailyActivitiesSection key={dailyScopeKey ?? `${dog.id}:${dailyDateKey}`} state={dailyState} dateKey={dailyDateKey} activities={dailyActivities}
        routines={routineTemplates} trainingOptions={dailyTrainingOptions} busy={dailyMutationBusy}
        message={dailyMutationMessage} messageError={dailyMutationError} onRetry={onRetryDaily}
        onRetryMutation={onRetryDailyMutation} onCreateRoutine={onCreateRoutine} onUpdateRoutine={onUpdateRoutine}
        onDeleteRoutine={onDeleteRoutine} onAddRoutineToDay={onAddRoutineToDay} onRemoveRoutineFromDay={onRemoveRoutineFromDay}
        onSetRoutineCompletion={onSetRoutineCompletion} onAddTrainingToDay={onAddTrainingToDay}
        onRemoveTrainingFromDay={onRemoveTrainingFromDay} onGoTraining={() => onGo('training')} /> : null}
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
      </View></>}
      </View>
    </Card>

    <View style={styles.actionsSection}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Vad vill du göra nu?</Text>
      <View style={styles.actions}>
        <DestinationTile destination="log" compact onPress={() => onGo('log')} />
        <DestinationTile destination="training" compact onPress={() => onGo('training')} />
        <DestinationTile destination="knowledge" compact onPress={() => onGo('knowledge')} />
      </View>
    </View>
  </View>;
}

function DailyActivitiesSection({ state, dateKey, activities, routines, trainingOptions, busy, message, messageError, onRetry, onRetryMutation, onCreateRoutine, onUpdateRoutine, onDeleteRoutine, onAddRoutineToDay, onRemoveRoutineFromDay, onSetRoutineCompletion, onAddTrainingToDay, onRemoveTrainingFromDay, onGoTraining }: {
  state: 'loading' | 'ready' | 'error';
  dateKey: string;
  activities: readonly HomeDailyActivity[];
  routines: readonly DailyRoutine[];
  trainingOptions: readonly HomeDailyTrainingOption[];
  busy: boolean;
  message: string;
  messageError: boolean;
  onRetry?: () => void;
  onRetryMutation?: () => void;
  onCreateRoutine?: (label: string) => void;
  onUpdateRoutine?: (routine: DailyRoutine, label: string) => void;
  onDeleteRoutine?: (routine: DailyRoutine) => void;
  onAddRoutineToDay?: (routine: DailyRoutine) => void;
  onRemoveRoutineFromDay?: (row: DailyRoutineDay) => void;
  onSetRoutineCompletion?: (row: DailyRoutineDay, completed: boolean) => void;
  onAddTrainingToDay?: (option: HomeDailyTrainingOption) => void;
  onRemoveTrainingFromDay?: (row: DailyTrainingSelection) => void;
  onGoTraining: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [showRoutineManager, setShowRoutineManager] = useState(false);
  const [showTrainingOptions, setShowTrainingOptions] = useState(false);
  const [showNewRoutine, setShowNewRoutine] = useState(false);
  const [newRoutineLabel, setNewRoutineLabel] = useState('');
  const completedCount = activities.filter((item) => item.completed).length;
  const shownActivities = showAll ? activities : activities.slice(0, 5);
  const dayRoutines = new Map(activities.filter((item) => item.routineDay)
    .map((item) => [item.routineDay?.routine_id, item.routineDay as DailyRoutineDay]));

  return <View style={styles.dailySection}>
    <View style={styles.fixtureHeading}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Dagens uppgifter</Text>
      {state === 'ready' && activities.length > 0 ? <Text style={styles.fixtureProgress}>{completedCount} av {activities.length} klara</Text> : null}
    </View>
    {state === 'ready' && activities.length > 0 ? <View accessibilityRole="progressbar"
      accessibilityLabel={`${completedCount} av ${activities.length} dagsuppgifter klara`}
      accessibilityValue={{ min: 0, max: activities.length, now: completedCount }} style={styles.dailyProgressTrack}>
      <View style={[styles.dailyProgressFill, { width: `${Math.round(completedCount / activities.length * 100)}%` }]} />
    </View> : null}
    {state === 'loading' ? <Skeleton shape="row" lines={2} /> : null}
    {state === 'error' ? <View style={styles.dailyError}>
      <Text style={styles.emptyText}>Dagens uppgifter kunde inte hämtas. Ingen status räknas just nu.</Text>
      {onRetry ? <Button variant="tertiary" label="Hämta dagens uppgifter igen" accessibilityLabel="Hämta dagens uppgifter igen" onPress={onRetry} /> : null}
    </View> : null}
    {state === 'ready' ? <>
      {activities.length === 0 ? <Text style={styles.emptyText}>Inga uppgifter valda för idag ännu. Lägg till en egen rutin eller ett nästa träningssteg.</Text> : null}
      <View style={styles.fixtureItems}>{shownActivities.map((item) => <DailyActivityItem key={item.id}
        label={item.label} kind={item.kind} category={item.kind === 'training' ? 'training' : undefined}
        accessibilityLabel={item.kind === 'routine' ? `Egen rutin: ${item.label}` : `Träningsuppgift: ${item.label}`}
        completed={item.completed}
        onToggle={item.kind === 'routine' && item.routineDay ? () => onSetRoutineCompletion?.(item.routineDay as DailyRoutineDay, !item.completed) : undefined}
        onOpen={item.kind === 'training' ? onGoTraining : undefined}
        onRemove={item.kind === 'routine' && item.routineDay ? () => onRemoveRoutineFromDay?.(item.routineDay as DailyRoutineDay)
          : item.kind === 'training' && item.trainingSelection ? () => onRemoveTrainingFromDay?.(item.trainingSelection as DailyTrainingSelection) : undefined} />)}</View>
      {activities.length > 5 ? <MotionPressable accessibilityRole="button" accessibilityLabel={showAll ? 'Visa färre uppgifter' : `Visa alla ${activities.length} uppgifter`}
        onPress={() => setShowAll((current) => !current)} style={styles.inlineAction}>
        <Text style={styles.inlineActionText}>{showAll ? 'Visa färre' : 'Visa alla'}</Text>
      </MotionPressable> : null}
    </> : null}
    {message ? <View style={styles.dailyMessage}>
      <Text accessibilityRole={messageError ? 'alert' : undefined} style={[styles.emptyText, messageError && styles.dailyErrorText]}>{message}</Text>
      {onRetryMutation ? <Button variant="tertiary" label="Kontrollera samma ändring igen" accessibilityLabel="Kontrollera samma ändring igen" disabled={busy} onPress={onRetryMutation} /> : null}
    </View> : null}
    {state === 'ready' ? <View style={styles.dailyManager}>
      <View style={styles.dailyManagerHeading}>
        <Text style={styles.groupTitle} accessibilityRole="header">Egna rutiner{routines.length ? ` · ${routines.length}` : ''}</Text>
        <MotionPressable accessibilityRole="button" accessibilityLabel={showRoutineManager ? 'Dölj egna rutiner' : 'Hantera egna rutiner'}
          accessibilityState={{ expanded: showRoutineManager }} onPress={() => setShowRoutineManager((current) => !current)} style={styles.inlineAction}>
          <Text style={styles.inlineActionText}>{showRoutineManager ? 'Dölj' : 'Hantera'}</Text>
        </MotionPressable>
      </View>
      {showRoutineManager ? <>
        {routines.length === 0 ? <Text style={styles.emptyText}>Du har inga egna rutiner ännu.</Text> : routines.map((routine) => <RoutineTemplateRow key={`${routine.id}:${routine.label}`}
          routine={routine} selectedDay={dayRoutines.get(routine.id) ?? null} busy={busy}
          onSave={(label) => onUpdateRoutine?.(routine, label)} onDelete={() => onDeleteRoutine?.(routine)}
          onAdd={() => onAddRoutineToDay?.(routine)} onRemove={() => {
            const row = dayRoutines.get(routine.id);
            if (row) onRemoveRoutineFromDay?.(row);
          }} />)}
        {showNewRoutine ? <View style={styles.routineCreate}>
          <TextInput accessibilityLabel="Namn på egen rutin" placeholder="Namn på rutin" value={newRoutineLabel}
            onChangeText={setNewRoutineLabel} editable={!busy} maxLength={160} returnKeyType="done" style={styles.routineInput} />
          <Button variant="primary" label={routines.some((routine) => routine.label === newRoutineLabel.trim()) ? 'Rutin sparad' : 'Spara rutin'} accessibilityLabel="Spara rutin" disabled={busy || !newRoutineLabel.trim() || routines.some((routine) => routine.label === newRoutineLabel.trim())}
            onPress={() => onCreateRoutine?.(newRoutineLabel.trim())} />
        </View> : null}
        <Button variant="tertiary" label={showNewRoutine ? 'Avbryt' : 'Skapa egen rutin'} accessibilityLabel={showNewRoutine ? 'Avbryt skapa rutin' : 'Skapa egen rutin'} disabled={busy}
          onPress={() => setShowNewRoutine((current) => !current)} />
      </> : null}
      <View style={styles.dailyManagerHeading}>
        <Text style={styles.groupTitle} accessibilityRole="header">Nästa träningssteg</Text>
        {trainingOptions.length > 0 ? <MotionPressable accessibilityRole="button" accessibilityLabel={showTrainingOptions ? 'Dölj träningssteg' : 'Välj träningssteg för idag'}
          accessibilityState={{ expanded: showTrainingOptions }} onPress={() => setShowTrainingOptions((current) => !current)} style={styles.inlineAction}>
          <Text style={styles.inlineActionText}>{showTrainingOptions ? 'Dölj' : 'Välj'}</Text>
        </MotionPressable> : null}
      </View>
      {trainingOptions.length === 0 ? <Text style={styles.emptyText}>Inget nytt nästa steg finns att välja just nu.</Text> : null}
      {showTrainingOptions ? trainingOptions.map((option) => <View key={`${option.versionId}:${option.stepId}`} style={styles.trainingOption}>
        <View style={styles.summaryCopy}><Text style={styles.summaryTitle}>{option.stepTitle}</Text><Text style={styles.summaryMeta}>{option.programTitle}</Text></View>
        <Button variant="tertiary" label="Lägg till" accessibilityLabel={`Lägg till ${option.stepTitle} för idag`} disabled={busy}
          onPress={() => onAddTrainingToDay?.(option)} />
      </View>) : null}
      <Text style={styles.dailySourceNote}>Visa datum: {dateKey}. Rutiner markeras av dig; träningsstatus hämtas från sparad progress. Dagsval upprepas inte automatiskt.</Text>
    </View> : null}
  </View>;
}

function RoutineTemplateRow({ routine, selectedDay, busy, onSave, onDelete, onAdd, onRemove }: {
  routine: DailyRoutine;
  selectedDay: DailyRoutineDay | null;
  busy: boolean;
  onSave: (label: string) => void;
  onDelete: () => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const [label, setLabel] = useState(routine.label);
  return <View style={styles.routineRow}>
    <TextInput accessibilityLabel={`Namn på rutin ${routine.label}`} value={label} onChangeText={setLabel}
      editable={!busy} maxLength={160} style={styles.routineInput} />
    {label.trim() !== routine.label ? <Button variant="tertiary" label="Spara namn" accessibilityLabel={`Spara namn för ${routine.label}`}
      disabled={busy || !label.trim()} onPress={() => onSave(label.trim())} /> : null}
    <Button variant="tertiary" label={selectedDay ? 'Ta bort idag' : 'Lägg till idag'} accessibilityLabel={`${selectedDay ? 'Ta bort' : 'Lägg till'} ${routine.label} ${selectedDay ? 'från' : 'för'} idag`}
      disabled={busy} onPress={selectedDay ? onRemove : onAdd} />
    <Button variant="tertiary" label="Ta bort rutin" accessibilityLabel={`Ta bort rutin ${routine.label}`} disabled={busy}
      onPress={() => Alert.alert('Ta bort rutin?', `”${routine.label}” och dagens val tas bort.`, [
        { text: 'Avbryt', style: 'cancel' }, { text: 'Ta bort', style: 'destructive', onPress: onDelete },
      ])} />
  </View>;
}

function TodayGroup({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <View style={styles.todayGroup}>
    <View style={styles.groupHeading}><Text style={styles.groupTitle} accessibilityRole="header">{title}</Text>{action}</View>
    <View style={styles.groupRows}>{children}</View>
  </View>;
}

function ReviewDailyFixture({ items, onGo }: { items: readonly HomeDailyFixtureItem[]; onGo: (page: Destination) => void }) {
  const [completion, setCompletion] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((item) => [item.id, item.completed])));
  const completedCount = items.filter((item) => completion[item.id] ?? item.completed).length;
  return <View style={styles.fixtureSection}>
    <View style={styles.fixtureHeading}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Dagens uppgifter</Text>
      <Text style={styles.fixtureProgress}>{completedCount} av {items.length}</Text>
    </View>
    <View style={styles.fixtureItems}>{items.map((item) => <DailyActivityItem key={item.id} label={item.label}
      accessibilityLabel={item.detail ? `${item.label}. ${item.detail}` : item.label}
      category={item.category} completed={completion[item.id] ?? item.completed}
      onToggle={() => setCompletion((current) => ({ ...current, [item.id]: !(current[item.id] ?? item.completed) }))}
      onOpen={() => onGo(item.destination)} />)}</View>
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

const dogPortraitSize = tokens.size.quickLogCompactHeight + tokens.size.touchMin;
const dogPortraitHeight = dogPortraitSize + tokens.spacing.xs;

const styles = StyleSheet.create({
  page: { gap: tokens.layout.sectionGap - tokens.spacing.sm, paddingBottom: tokens.spacing.xl },
  identity: { position: 'relative', gap: tokens.spacing.sm },
  greeting: { minHeight: tokens.size.quickLogCompactHeight, flexDirection: 'row', alignItems: 'center' },
  greetingCopy: { flex: 1, gap: tokens.spacing.xs, paddingRight: dogPortraitSize + tokens.spacing.sm },
  greetingTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  dogMeta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  dogPortrait: { position: 'absolute', top: 0, right: 0, width: dogPortraitSize, height: dogPortraitHeight, overflow: 'hidden', borderRadius: tokens.radius.full },
  dogImage: { width: dogPortraitSize, height: dogPortraitHeight, transform: [{ scale: 1.8 }], opacity: 0.7 },
  weekStrip: { position: 'relative', zIndex: 1, flexDirection: 'row', gap: tokens.spacing.xs, alignSelf: 'stretch' },
  weekItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs },
  weekNumberWrap: { alignItems: 'center', justifyContent: 'center' },
  currentWeekNumberWrap: { minWidth: tokens.size.touchMin - tokens.spacing.xs, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.primary },
  weekNumber: { ...tokens.typography.caption, color: tokens.colors.textPrimary },
  weekNumberPortraitBacking: { backgroundColor: tokens.colors.background, borderRadius: tokens.radius.sm, paddingHorizontal: tokens.spacing.xs, paddingVertical: tokens.spacing.xs / 2 },
  currentWeekNumber: { color: tokens.colors.onPrimary, fontWeight: '700' },
  weekDot: { width: tokens.spacing.sm, height: tokens.spacing.sm, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.border },
  currentWeekDot: { backgroundColor: tokens.colors.primary },
  currentCard: { gap: tokens.spacing.sm },
  cardHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  cardHeading: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  body: { ...tokens.typography.body, color: tokens.colors.textPrimary, flexShrink: 1 },
  exampleLabel: { ...tokens.typography.caption, color: tokens.colors.warning },
  sectionTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  fixtureSection: { gap: tokens.layout.headingGap - tokens.spacing.xs },
  fixtureHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  fixtureProgress: { ...tokens.typography.label, color: tokens.colors.textSecondary },
  dailyProgressTrack: { height: tokens.spacing.xs, borderRadius: tokens.radius.full, overflow: 'hidden', backgroundColor: tokens.colors.successSurface },
  dailyProgressFill: { height: '100%', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.success },
  fixtureItems: { gap: tokens.spacing.sm },
  todayCardContent: { gap: tokens.layout.headingGap },
  dailySection: { gap: tokens.spacing.sm, paddingBottom: tokens.spacing.sm, borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  dailySourceNote: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  dailyError: { gap: tokens.spacing.xs },
  dailyMessage: { gap: tokens.spacing.xs, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.selectedSurface },
  dailyErrorText: { color: tokens.colors.danger },
  dailyManager: { gap: tokens.spacing.sm, paddingTop: tokens.spacing.xs },
  dailyManagerHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  routineCreate: { gap: tokens.spacing.xs },
  routineRow: { gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  routineInput: { minHeight: tokens.size.touchMin, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, paddingHorizontal: tokens.spacing.sm, color: tokens.colors.textPrimary, backgroundColor: tokens.colors.surface },
  trainingOption: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.xs },
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
