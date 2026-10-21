import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { AppBar } from '../../components/ui/AppBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DailyActivityItem } from '../../components/ui/DailyActivityItem';
import { MessageCard } from '../../components/AppPrimitives';
import { Skeleton } from '../../components/ui/Skeleton';
import { tokens } from '../../theme/tokens';
import type { DailyRoutine, DailyRoutineChecklistItem, DailyRoutineCreateInput, DailyRoutineDay, DailyRoutineDaySkip, DailyRoutineRepeatValues, DailyTrainingSelection } from './daily-activity-data';
import type { ChecklistFilter, HomeDailyActivity } from './daily-activity-model';
import type { HomeDailyTrainingOption } from './HomeScreen';
import { DailyActivityManagerSheet } from './DailyActivityManagerSheet';
import { Tabs } from '../../components/ui/Tabs';

type WriteStatus = { status: 'saved' | 'failed' | 'unknown' } | void;

export function DailyChecklistScreen({ dateKey, filter, onChangeFilter, state, rangeState, rangeFailedSources = [], activities, todayActivities = activities,
  upcomingPreviewState, upcomingPreviewActivities = [], upcomingPreviewFailedSources = [],
  refreshing, refreshError, mutationBusy, mutationKey, mutationMessage,
  mutationError, onBack, onRetry, onRetryMutation, onOpenTrainingStep, onSetRoutineCompletion, routines, routineDaySkips, trainingOptions,
  onCreateRoutine, onUpdateRoutine, onDeleteRoutine, onAddRoutineToDay, onRemoveRoutineFromDay, onAddTrainingToDay, onRemoveTrainingFromDay,
  onRetryRange, onRetryUpcomingPreview, onOpenPlannedRoutine, onOpenPlannedHealth, onGoTraining }: {
  dateKey: string;
  filter: ChecklistFilter;
  onChangeFilter: (filter: ChecklistFilter) => void;
  state: 'loading' | 'ready' | 'error';
  rangeState: 'idle' | 'loading' | 'ready' | 'error';
  rangeFailedSources?: readonly string[];
  upcomingPreviewState: 'idle' | 'loading' | 'ready' | 'error';
  upcomingPreviewActivities?: readonly HomeDailyActivity[];
  upcomingPreviewFailedSources?: readonly string[];
  activities: readonly HomeDailyActivity[];
  todayActivities?: readonly HomeDailyActivity[];
  refreshing: boolean;
  refreshError: boolean;
  mutationBusy: boolean;
  mutationKey: string;
  mutationMessage: string;
  mutationError: boolean;
  onBack: () => void;
  onRetry?: () => void;
  onRetryMutation?: () => void;
  onOpenTrainingStep?: (programId: string, stepId: string, returnPage: 'checklist', readOnly?: boolean) => void;
  onSetRoutineCompletion?: (row: DailyRoutineDay, itemId: string, completed: boolean) => void;
  routines: readonly DailyRoutine[];
  routineDaySkips: readonly DailyRoutineDaySkip[];
  trainingOptions: readonly HomeDailyTrainingOption[];
  onCreateRoutine?: (routine: DailyRoutineCreateInput) => Promise<WriteStatus | void>;
  onUpdateRoutine?: (routine: DailyRoutine, label: string, checklist: DailyRoutineChecklistItem[], repeat: DailyRoutineRepeatValues) => Promise<WriteStatus | void>;
  onDeleteRoutine?: (routine: DailyRoutine) => Promise<WriteStatus | void>;
  onAddRoutineToDay: (routine: DailyRoutine) => void;
  onRemoveRoutineFromDay?: (row: DailyRoutineDay, routine: DailyRoutine) => void;
  onAddTrainingToDay?: (option: HomeDailyTrainingOption) => void;
  onRemoveTrainingFromDay?: (row: DailyTrainingSelection) => void;
  onRetryRange?: () => void;
  onRetryUpcomingPreview?: () => void;
  onOpenPlannedRoutine?: (routineId: string) => boolean;
  onOpenPlannedHealth?: (activity: HomeDailyActivity) => void;
  onGoTraining: () => void;
}) {
  const [managerVisible, setManagerVisible] = useState(false);
  const [focusRoutineId, setFocusRoutineId] = useState<string | null>(null);
  const [focusChecklistItemId, setFocusChecklistItemId] = useState<string | null>(null);
  const [plannedRoutineContext, setPlannedRoutineContext] = useState(false);
  const checklistActivities = activities.filter((activity) => activity.kind === 'routine');
  const trainingActivities = activities.filter((activity) => activity.kind === 'training');
  const otherActivities = activities.filter((activity) => activity.kind === 'health');
  const completedCount = checklistActivities.filter((activity) => activity.completed).length;
  const filterTabs = filter === 'Idag' ? ['Idag', 'Denna vecka', 'Alla'] : ['Idag', 'Denna vecka', 'Alla', 'Kommande'];
  const previewActivities = upcomingPreviewActivities.filter((activity) => activity.planned
    && (activity.kind === 'routine' || activity.kind === 'health')).slice(0, 3);
  const visiblePreviewActivities = upcomingPreviewFailedSources.length > 0 ? previewActivities.slice(0, 1) : previewActivities;

  function openManager(routineId: string | null = null, planned = false, checklistItemId: string | null = null) {
    setFocusRoutineId(routineId);
    setFocusChecklistItemId(checklistItemId);
    setPlannedRoutineContext(planned);
    setManagerVisible(true);
  }

  const groupedActivities = new Map<string, HomeDailyActivity[]>();
  for (const activity of activities) {
    const key = activity.dateKey ?? dateKey;
    groupedActivities.set(key, [...(groupedActivities.get(key) ?? []), activity]);
  }
  const activeState = filter === 'Idag' ? state : rangeState === 'idle' ? 'loading' : rangeState;

  function renderTodayActivity(item: HomeDailyActivity) {
    const routineDay = item.routineDay;
    const itemMutationKey = routineDay && item.routineItemId ? `complete-routine:${routineDay.id}:${item.routineItemId}` : '';
    const itemMutation = Boolean(itemMutationKey && mutationKey === itemMutationKey);
    const readbackError = itemMutation && mutationMessage.startsWith('Ändringen sparades, men dagens lista');
    return <DailyActivityItem key={item.id} variant="home" presentation="detail" kind={item.kind} label={item.label} routineLabel={item.routineLabel}
      icon={item.icon} description={item.description} detail={item.kind === 'training' ? item.programTitle : undefined}
      accessibilityLabel={item.kind === 'training' ? `Träningsuppgift: ${item.label}` : item.kind === 'health' ? `${item.label}, planerad` : `Rutin ${item.routineLabel ?? ''}, punkt ${item.label}`}
      completed={item.completed} pending={itemMutation && mutationBusy}
      statusMessage={itemMutation ? mutationMessage : ''} statusError={itemMutation && mutationError}
      statusLabel={item.skipped ? 'Överhoppad' : item.planned ? 'Planerad' : undefined}
      readOnly={false}
      onToggle={routineDay ? () => item.routineItemId && onSetRoutineCompletion?.(routineDay, item.routineItemId, !item.completed) : undefined}
      onOpen={item.kind === 'training' && item.programId && item.stepId
        ? () => onOpenTrainingStep?.(item.programId!, item.stepId!, 'checklist')
        : item.kind === 'health' ? () => onOpenPlannedHealth?.(item)
          : () => openManager(routineDay?.routine_id ?? null)}
      onLongPress={item.kind === 'routine' && routineDay && item.routineItemId
        ? () => openManager(routineDay.routine_id, false, item.routineItemId ?? null) : undefined}
      onRetry={itemMutation ? (onRetryMutation ?? (readbackError ? onRetry : undefined)) : undefined} />;
  }

  return <View testID="daily-checklist-screen" style={styles.page}>
    <AppBar mode="Back" title="Checklista" actionLabel="Tillbaka till Hem" onAction={onBack} variant="compact" />
    <Tabs items={filterTabs} active={filter} onChange={(value) => onChangeFilter(value as ChecklistFilter)} variant="rev02-segmented-strong" />
    {filter === 'Alla' ? <Text style={styles.periodHint}>Senaste 30 dagarna</Text>
      : filter === 'Kommande' ? <Text style={styles.periodHint}>Planerat, inte utfört</Text> : null}

    {filter === 'Idag' && refreshError && state === 'ready' ? <MessageCard tone="error">Uppdateringen kunde inte hämtas. Du ser senast hämtade uppgifter.</MessageCard> : null}
    {activeState === 'loading' ? <View accessibilityLabel="Checklistan hämtas" style={styles.stateCard}>
      <Skeleton shape="row" lines={4} />
    </View> : null}
    {activeState === 'error' ? <Card><View style={styles.stateCard}>
      <Text style={styles.stateTitle}>{filter === 'Idag' ? 'Dagens checklista kunde inte hämtas' : 'Checklistan kunde inte hämtas'}</Text>
      <Text style={styles.body}>Ingen aktivitet visas som komplett förrän den har lästs in.</Text>
      {filter === 'Idag' ? onRetry ? <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta dagens checklista igen" onPress={onRetry} /> : null
        : onRetryRange ? <Button variant="tertiary" label="Försök igen" accessibilityLabel={`Hämta filtret ${filter} igen`} onPress={onRetryRange} /> : null}
    </View></Card> : null}
    {filter === 'Idag' && state === 'ready' && activities.length === 0 ? <Card><View style={styles.stateCard}>
      <Text style={styles.stateTitle}>Inga aktiviteter idag</Text>
      <Text style={styles.body}>Lägg till en rutin eller välj ett träningssteg när det passar er.</Text>
      {refreshing ? <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel="Dagens checklista uppdateras" size="small" color={tokens.colors.textSecondary} /> : null}
      <Button variant="tertiary" label="Hantera aktiviteter" accessibilityLabel="Hantera dagens aktiviteter" onPress={() => openManager()} />
    </View></Card> : null}
    {filter === 'Idag' && state === 'ready' && activities.length > 0 ? <Card variant="home" accessibilityLabel="Dagens checklista">
      <View style={styles.summary}>
        <Text testID="daily-checklist-count" style={styles.count}>
          {checklistActivities.length > 0 ? `Idag · ${completedCount} av ${checklistActivities.length} klara` : 'Idag'}
        </Text>
        {refreshing ? <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel="Dagens checklista uppdateras" size="small" color={tokens.colors.textSecondary} /> : null}
        <Button variant="tertiary" label="Hantera" accessibilityLabel="Hantera dagens aktiviteter" onPress={() => openManager()} />
      </View>
      {checklistActivities.length > 0 ? <>
        <View testID="daily-checklist-progress" accessibilityRole="progressbar"
          accessibilityLabel={`${completedCount} av ${checklistActivities.length} checklistepunkter klara`}
          accessibilityValue={{ min: 0, max: checklistActivities.length, now: completedCount }} style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(completedCount / checklistActivities.length * 100)}%` }]} />
        </View>
        <View style={styles.rows}>{checklistActivities.map(renderTodayActivity)}</View>
      </> : null}
    </Card> : null}

    {filter !== 'Idag' && rangeState === 'ready' && rangeFailedSources.length > 0 ? <MessageCard tone="error">
      En del av listan kunde inte hämtas. Det som visas är inte hela perioden.
      {onRetryRange ? <Button variant="tertiary" label="Försök igen" accessibilityLabel={`Läs in hela filtret ${filter} igen`} onPress={onRetryRange} /> : null}
    </MessageCard> : null}
    {filter !== 'Idag' && rangeState === 'ready' && rangeFailedSources.length === 0 && activities.length === 0 ? <Card><View style={styles.stateCard}>
      <Text style={styles.stateTitle}>{filter === 'Kommande' ? 'Inget planerat' : 'Inga sparade aktiviteter'}</Text>
      {filter !== 'Kommande' ? <Text style={styles.body}>Det finns inget sparat i den här perioden.</Text> : null}
    </View></Card> : null}
    {filter !== 'Idag' && rangeState === 'ready' && activities.length > 0 ? <View style={styles.rangeRows}>
      {[...groupedActivities.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([groupDate, items]) => <View key={groupDate} style={styles.dateGroup}>
        <Text style={styles.groupDate} accessibilityRole="header">{checklistDateLabel(groupDate)}</Text>
        <View style={styles.rows}>{items.map((item) => {
          const openTraining = item.kind === 'training' && item.programId && item.stepId
            ? () => onOpenTrainingStep?.(item.programId!, item.stepId!, 'checklist', true) : undefined;
          const openRoutine = item.planned && item.kind === 'routine' && item.routineId ? () => {
            if (onOpenPlannedRoutine?.(item.routineId!) !== false) openManager(item.routineId!, true);
          } : undefined;
          const openHealth = item.kind === 'health' ? () => onOpenPlannedHealth?.(item) : undefined;
          return <DailyActivityItem key={item.id} variant="home" presentation="detail" kind={item.kind} label={item.label} routineLabel={item.routineLabel}
            icon={item.icon} description={item.description} detail={item.kind === 'training' ? item.programTitle : undefined}
            category={item.kind === 'health' ? item.healthType === 'vet_visit' ? 'veterinary' : 'vaccination' : undefined}
            accessibilityLabel={item.kind === 'training' ? `Sparat träningssteg: ${item.label}, ${item.completed ? 'klart' : 'inte markerat'}`
              : item.kind === 'health' ? `${item.label}, planerad ${checklistDateLabel(groupDate)}` : `${item.skipped ? 'Överhoppad rutin' : item.planned ? 'Planerad rutin' : 'Sparad rutin'}: ${item.label}`}
            completed={item.completed} readOnly statusLabel={item.skipped ? 'Överhoppad' : item.planned ? 'Planerad' : item.completed ? 'Klar' : 'Inte markerad'}
            onOpen={openTraining ?? openRoutine ?? openHealth} />;
        })}</View>
      </View>)}
    </View> : null}

    {filter === 'Idag' ? <Card variant="home" accessibilityLabel="Kommande, 7 dagar">
      <View style={styles.previewHeading}>
        <Text style={styles.previewTitle} accessibilityRole="header">Kommande, 7 dagar</Text>
        <Button variant="tertiary" label="Visa alla" accessibilityLabel="Visa alla kommande aktiviteter" onPress={() => onChangeFilter('Kommande')} />
      </View>
      {upcomingPreviewState === 'idle' || upcomingPreviewState === 'loading' ? <View accessibilityLabel="Kommande aktiviteter hämtas" style={styles.previewState}>
        <Skeleton shape="row" lines={2} />
      </View> : upcomingPreviewState === 'error' ? <View style={styles.previewState}>
        <Text style={styles.body}>Kommande aktiviteter kunde inte hämtas.</Text>
        {onRetryUpcomingPreview ? <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta kommande aktiviteter igen" onPress={onRetryUpcomingPreview} /> : null}
      </View> : upcomingPreviewFailedSources.length > 0 ? <View style={styles.previewState}>
        <Text style={styles.body}>En del av listan kunde inte hämtas.</Text>
        {onRetryUpcomingPreview ? <Button variant="tertiary" label="Försök igen" accessibilityLabel="Läs in hela listan med kommande aktiviteter igen" onPress={onRetryUpcomingPreview} /> : null}
        {visiblePreviewActivities.map((item) => <DailyActivityItem key={item.id} testID={`upcoming-preview-row-${item.id}`} variant="home" presentation="preview" kind={item.kind} label={item.label}
          icon={item.icon} category={item.kind === 'health' ? item.healthType === 'vet_visit' ? 'veterinary' : 'vaccination' : undefined}
          detail={checklistDateLabel(item.dateKey ?? dateKey)} completed={false} statusLabel="Planerad" readOnly />)}
      </View> : previewActivities.length === 0 ? <View style={styles.previewState}>
        <Text style={styles.body}>Inget planerat de närmaste sju dagarna.</Text>
      </View> : <View style={styles.previewRows}>
        {visiblePreviewActivities.map((item) => <DailyActivityItem key={item.id} testID={`upcoming-preview-row-${item.id}`} variant="home" presentation="preview" kind={item.kind} label={item.label}
          icon={item.icon} category={item.kind === 'health' ? item.healthType === 'vet_visit' ? 'veterinary' : 'vaccination' : undefined}
          detail={checklistDateLabel(item.dateKey ?? dateKey)} completed={false} statusLabel="Planerad" readOnly />)}
      </View>}
    </Card> : null}

    {filter === 'Idag' && state === 'ready' && activities.length > 0 && trainingActivities.length > 0 ? <Card variant="home" accessibilityLabel="Träningsprogram">
      <View style={styles.sectionHeading}>
        <Ionicons name="school-outline" size={tokens.size.iconMd} color={tokens.colors.home.textMuted} accessibilityElementsHidden />
        <Text style={[styles.sectionTitle, styles.flexTitle]} accessibilityRole="header">Träningsprogram</Text>
      </View>
      <View style={styles.rows}>{trainingActivities.map(renderTodayActivity)}</View>
    </Card> : null}
    {filter === 'Idag' && state === 'ready' && activities.length > 0 && otherActivities.length > 0 ? <Card variant="home" accessibilityLabel="Planerade hälsoaktiviteter">
      <Text style={styles.sectionTitle} accessibilityRole="header">Planerade hälsoaktiviteter</Text>
      <View style={styles.rows}>{otherActivities.map(renderTodayActivity)}</View>
    </Card> : null}

    <DailyActivityManagerSheet key={`${dateKey}:${focusRoutineId ?? 'all'}:${focusChecklistItemId ?? 'no-item'}:${plannedRoutineContext ? 'planned' : 'today'}:${managerVisible}`}
      visible={managerVisible} onClose={() => { setManagerVisible(false); setPlannedRoutineContext(false); setFocusChecklistItemId(null); }} focusRoutineId={focusRoutineId}
      focusChecklistItemId={focusChecklistItemId} plannedRoutineContext={plannedRoutineContext}
      activities={todayActivities} routines={routines} routineDaySkips={routineDaySkips} trainingOptions={trainingOptions}
      busy={mutationBusy} mutationMessage={mutationMessage} mutationError={mutationError} onRetryMutation={onRetryMutation}
      onCreateRoutine={onCreateRoutine} onUpdateRoutine={onUpdateRoutine} onDeleteRoutine={onDeleteRoutine}
      onAddRoutineToDay={onAddRoutineToDay} onRemoveRoutineFromDay={onRemoveRoutineFromDay}
      onAddTrainingToDay={onAddTrainingToDay} onRemoveTrainingFromDay={onRemoveTrainingFromDay} onGoTraining={onGoTraining} />
  </View>;
}

export function checklistDateLabel(dateKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return 'Idag';
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  if (!Number.isFinite(date.getTime())) return 'Idag';
  return new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);
}

const styles = StyleSheet.create({
  page: { gap: tokens.spacing.md, paddingBottom: tokens.spacing.xl },
  periodHint: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  stateCard: { gap: tokens.spacing.sm, paddingVertical: tokens.spacing.md },
  stateTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  body: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  summary: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  count: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  sectionHeading: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  sectionTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  previewTitle: { ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: '700' },
  previewHeading: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.xs },
  flexTitle: { flex: 1 },
  progressTrack: { height: tokens.size.progress, borderRadius: tokens.radius.full, overflow: 'hidden', backgroundColor: tokens.colors.home.progressTrack },
  progressFill: { height: '100%', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.greenFill },
  rows: { gap: 0 },
  previewState: { gap: tokens.spacing.sm, paddingTop: tokens.spacing.xs },
  previewRows: { paddingTop: tokens.spacing.xs },
  rangeRows: { gap: tokens.spacing.lg },
  dateGroup: { gap: tokens.spacing.xs },
  groupDate: { ...tokens.typography.label, color: tokens.colors.textPrimary },
});
