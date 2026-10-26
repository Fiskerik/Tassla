import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppBar } from '../../components/ui/AppBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DailyActivityItem } from '../../components/ui/DailyActivityItem';
import { IconChip } from '../../components/ui/IconChip';
import { ThemedIcon } from '../../components/ui/ThemedIcon';
import { MotionPressable } from '../../components/ui/Motion';
import { Tabs } from '../../components/ui/Tabs';
import { MessageCard } from '../../components/AppPrimitives';
import { Skeleton } from '../../components/ui/Skeleton';
import { tokens } from '../../theme/tokens';
import type { DailyRoutine, DailyRoutineChecklistItem, DailyRoutineCreateInput, DailyRoutineDay, DailyRoutineDaySkip, DailyRoutineRepeatValues, DailyRoutineWriteResult, DailyTrainingSelection } from './daily-activity-data';
import type { ChecklistFilter, HomeDailyActivity } from './daily-activity-model';
import { dailyRoutineChecklistIconTone } from './daily-routine-checklist-icons';
import type { HomeDailyTrainingOption } from './HomeScreen';
import { DailyActivityManagerSheet } from './DailyActivityManagerSheet';
import type { RoutineDraft, RoutineDraftConflict, RoutineDraftRecovery } from './daily-activity-recovery';

type WriteStatus = { status: 'saved' | 'failed' | 'unknown' } | void;
type RangeStatus = 'loading' | 'ready' | 'partial' | 'error';

export function DailyChecklistScreen({ dateKey, state, activities, refreshing, refreshError, mutationBusy, mutationKey, mutationMessage,
  mutationError, onBack, onRetry, onRetryRange, onRetryMutation, onOpenTrainingStep, onSetRoutineCompletion, routines, routineDaySkips, trainingOptions,
  onCreateRoutine, onUpdateRoutine, onDeleteRoutine, onAddRoutineToDay, onRemoveRoutineFromDay, onAddTrainingToDay, onRemoveTrainingFromDay,
  onGoTraining, filter, onChangeFilter, rangeState, rangeActivities, upcomingRoutines = [], onOpenHistoricalTrainingStep,
  onOpenUpcomingRoutine, onOpenPlannedHealth, openManagerInitially = false, dailyScopeKey, routineRecovery = null, onRoutineRecoveryChange }: {
  dateKey: string;
  state: 'loading' | 'ready' | 'error';
  activities: readonly HomeDailyActivity[];
  refreshing: boolean;
  refreshError: boolean;
  mutationBusy: boolean;
  mutationKey: string;
  mutationMessage: string;
  mutationError: boolean;
  onBack: () => void;
  onRetry?: () => void;
  onRetryRange?: () => void;
  onRetryMutation?: () => void;
  onOpenTrainingStep?: (programId: string, stepId: string, returnPage: 'checklist') => void;
  onOpenHistoricalTrainingStep?: (programId: string, stepId: string) => void;
  onOpenUpcomingRoutine?: (routineId: string, dateKey: string) => Promise<{ status: 'ready'; routine: DailyRoutine } | { status: 'missing' } | { status: 'error' }>;
  onOpenPlannedHealth?: (planId: string) => void;
  onSetRoutineCompletion?: (row: DailyRoutineDay, itemId: string, completed: boolean) => void;
  routines: readonly DailyRoutine[];
  routineDaySkips: readonly DailyRoutineDaySkip[];
  trainingOptions: readonly HomeDailyTrainingOption[];
  filter: ChecklistFilter;
  onChangeFilter: (filter: ChecklistFilter) => void;
  rangeState: RangeStatus;
  rangeActivities: readonly HomeDailyActivity[];
  upcomingRoutines?: readonly DailyRoutine[];
  onCreateRoutine?: (routine: DailyRoutineCreateInput) => Promise<WriteStatus | void>;
  onUpdateRoutine?: (routine: DailyRoutine, label: string, checklist: DailyRoutineChecklistItem[], repeat: DailyRoutineRepeatValues) => Promise<DailyRoutineWriteResult | void>;
  onDeleteRoutine?: (routine: DailyRoutine) => Promise<WriteStatus | void>;
  onAddRoutineToDay: (routine: DailyRoutine) => void;
  onRemoveRoutineFromDay?: (row: DailyRoutineDay, routine: DailyRoutine) => void;
  onAddTrainingToDay?: (option: HomeDailyTrainingOption) => void;
  onRemoveTrainingFromDay?: (row: DailyTrainingSelection) => void;
  onGoTraining: () => void;
  openManagerInitially?: boolean;
  dailyScopeKey?: string;
  routineRecovery?: RoutineDraftRecovery | null;
  onRoutineRecoveryChange?: (draft: RoutineDraft | null, conflict: RoutineDraftConflict | null) => void;
}) {
  const [managerVisible, setManagerVisible] = useState(() => openManagerInitially || Boolean(routineRecovery?.draft));
  const [focusRoutineId, setFocusRoutineId] = useState<string | null>(() => routineRecovery?.draft.routineId ?? null);
  const [focusRoutineItemId, setFocusRoutineItemId] = useState<string | null>(null);
  const [editFocusedRoutineOnOpen, setEditFocusedRoutineOnOpen] = useState(false);
  const [routineOnlyContext, setRoutineOnlyContext] = useState(false);
  const [focusedUpcomingRoutine, setFocusedUpcomingRoutine] = useState<DailyRoutine | null>(null);
  const [routineSourceMessage, setRoutineSourceMessage] = useState('');
  const [routineSourceRetryId, setRoutineSourceRetryId] = useState<{ routineId: string; dateKey: string } | null>(null);
  const [routineSourceLoadingId, setRoutineSourceLoadingId] = useState<string | null>(null);
  const upcomingRoutineRequest = useRef(0);
  const showingToday = filter === 'Idag';
  const showingUpcoming = filter === 'Kommande';
  const visibleState = showingToday ? state : rangeState;
  const visibleActivities = showingToday ? activities : rangeActivities;
  const completedCount = visibleActivities.filter((activity) => activity.completed && !activity.skipped).length;
  const isLoading = showingToday ? state === 'loading' : rangeState === 'loading';
  const hasError = showingToday ? state === 'error' : rangeState === 'error';
  const isTodayEmpty = state === 'ready' && activities.length === 0;
  const isEmpty = showingToday ? isTodayEmpty : visibleState === 'ready' && visibleActivities.length === 0;
  const dateLabel = checklistDateLabel(dateKey);
  const retry = showingToday ? onRetry : onRetryRange;

  useEffect(() => () => { upcomingRoutineRequest.current += 1; }, []);

  function openManager(routineId: string | null = null, editFocusedRoutine = false, routineItemId: string | null = null, upcomingOnly = false) {
    setFocusRoutineId(routineId);
    setFocusRoutineItemId(routineItemId);
    setEditFocusedRoutineOnOpen(editFocusedRoutine);
    setRoutineOnlyContext(upcomingOnly);
    setManagerVisible(true);
  }

  function closeManager() {
    setManagerVisible(false);
    setFocusRoutineId(null);
    setFocusRoutineItemId(null);
    setEditFocusedRoutineOnOpen(false);
    setRoutineOnlyContext(false);
    setFocusedUpcomingRoutine(null);
  }

  async function openUpcomingRoutine(routineId: string, activityDate: string) {
    if (!onOpenUpcomingRoutine || routineSourceLoadingId) return;
    const request = ++upcomingRoutineRequest.current;
    setRoutineSourceMessage('');
    setRoutineSourceRetryId(null);
    setRoutineSourceLoadingId(routineId);
    try {
      const result = await onOpenUpcomingRoutine(routineId, activityDate);
      if (request !== upcomingRoutineRequest.current || filter !== 'Kommande') return;
      if (result.status === 'ready') {
        setFocusedUpcomingRoutine(result.routine);
        openManager(result.routine.id, false, null, true);
      } else if (result.status === 'missing') {
        setRoutineSourceMessage('Rutinen har ändrats eller tagits bort. Listan har uppdaterats.');
      } else {
        setRoutineSourceMessage('Rutinen kunde inte hämtas. Försök igen.');
        setRoutineSourceRetryId({ routineId, dateKey: activityDate });
      }
    } catch {
      if (request === upcomingRoutineRequest.current && filter === 'Kommande') {
        setRoutineSourceMessage('Rutinen kunde inte hämtas. Försök igen.');
        setRoutineSourceRetryId({ routineId, dateKey: activityDate });
      }
    } finally {
      if (request === upcomingRoutineRequest.current) setRoutineSourceLoadingId(null);
    }
  }

  return <View testID="daily-checklist-screen" style={styles.page}>
    <AppBar mode="Back" title="Checklistor" actionLabel="Tillbaka till Hem" onAction={onBack} variant="compact" />
    <Tabs items={CHECKLIST_FILTERS} active={filter} variant="rev02-segmented" activeTone="home" layout="horizontal-scroll" onChange={(value) => {
      if (isChecklistFilter(value)) {
        upcomingRoutineRequest.current += 1;
        setRoutineSourceLoadingId(null);
        setRoutineSourceMessage('');
        setRoutineSourceRetryId(null);
        onChangeFilter(value);
      }
    }} />
    {filter === 'Alla' ? <Text accessibilityRole="text" style={styles.rangeContext}>Senaste 30 dagarna</Text> : null}
    {showingUpcoming ? <Text accessibilityRole="text" style={styles.rangeContext}>Planerat, inte utfört</Text> : null}
    {routineSourceMessage ? <View style={styles.partialFeedback}>
      <MessageCard tone={routineSourceRetryId ? 'error' : 'neutral'}>{routineSourceMessage}</MessageCard>
      {routineSourceRetryId && onOpenUpcomingRoutine ? <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta rutinen igen" disabled={Boolean(routineSourceLoadingId)}
        onPress={() => { void openUpcomingRoutine(routineSourceRetryId.routineId, routineSourceRetryId.dateKey); }} /> : null}
    </View> : null}
    {refreshError && showingToday && state === 'ready' ? <MessageCard tone="error">Uppdateringen kunde inte hämtas. Du ser senast hämtade uppgifter.</MessageCard> : null}
    {!showingToday && rangeState === 'partial' ? <View style={styles.partialFeedback}>
      <MessageCard tone="error">{showingUpcoming ? 'Några planerade aktiviteter kunde inte hämtas.' : 'Några sparade uppgifter kunde inte hämtas.'}</MessageCard>
      {onRetryRange ? <Button variant="tertiary" label="Försök igen" accessibilityLabel={showingUpcoming ? 'Hämta planerade aktiviteter igen' : 'Hämta sparade uppgifter igen'} onPress={onRetryRange} /> : null}
    </View> : null}
    {isLoading ? <View accessibilityLabel={showingToday ? 'Dagens checklista hämtas' : showingUpcoming ? 'Planerade aktiviteter hämtas' : 'Sparade uppgifter hämtas'} style={styles.stateCard}>
      <Skeleton shape="row" lines={4} />
    </View> : null}
    {hasError ? <Card variant="home"><View style={styles.stateCard}>
      <Text accessibilityRole="header" style={styles.stateTitle}>{showingToday ? 'Checklistan kunde inte hämtas' : showingUpcoming ? 'Planerade aktiviteter kunde inte hämtas' : 'Sparade uppgifter kunde inte hämtas'}</Text>
      <Text style={styles.body}>Prova att hämta igen.</Text>
      {retry ? <Button variant="tertiary" label="Försök igen" accessibilityLabel={showingToday ? 'Hämta checklistan igen' : showingUpcoming ? 'Hämta planerade aktiviteter igen' : 'Hämta sparade uppgifter igen'} onPress={retry} /> : null}
    </View></Card> : null}
    {isEmpty ? <Card variant="home"><View style={styles.stateCard}>
      <Text accessibilityRole="header" style={styles.stateTitle}>{showingToday ? 'Inga aktiviteter idag' : showingUpcoming ? 'Inget planerat den närmaste veckan' : 'Inga sparade uppgifter i perioden'}</Text>
      {showingToday ? <Text style={styles.body}>Lägg till en rutin eller ett träningssteg.</Text> : null}
      {showingToday && refreshing ? <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel="Dagens checklista uppdateras" size="small" color={tokens.colors.textSecondary} /> : null}
      {showingToday ? <Button variant="tertiary" label="Hantera aktiviteter" accessibilityLabel="Hantera dagens aktiviteter" onPress={() => openManager()} /> : null}
    </View></Card> : null}

    {showingToday && state === 'ready' && activities.length > 0 ? <Card variant="home">
      <View style={styles.summary}>
        <Text accessibilityRole="header" accessibilityLabel={'Idag, ' + dateLabel} style={styles.cardHeading}>Idag</Text>
        <Text style={styles.count}>{completedCount} av {activities.length} klara</Text>
        {refreshing ? <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel="Dagens checklista uppdateras" size="small" color={tokens.colors.textSecondary} /> : null}
        <MotionPressable accessibilityRole="button" accessibilityLabel="Hantera rutiner och aktiviteter" onPress={() => openManager()}
          style={({ pressed }) => [styles.manageAction, pressed && styles.pressed]}>
          <Ionicons name="settings-outline" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden />
          <Text style={styles.manageActionLabel}>Hantera</Text>
        </MotionPressable>
      </View>
      <View testID="daily-checklist-progress" accessibilityRole="progressbar"
        accessibilityLabel={completedCount + ' av ' + activities.length + ' dagsuppgifter klara'}
        accessibilityValue={{ min: 0, max: activities.length, now: completedCount }} style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: (Math.round(completedCount / activities.length * 100) + '%') as import('react-native').DimensionValue }]} />
      </View>
      <View style={styles.rows}>
        {activities.map((item) => {
          const routineDay = item.routineDay;
          const itemMutationKey = routineDay && item.routineItemId ? 'complete-routine:' + routineDay.id + ':' + item.routineItemId : '';
          const itemMutation = Boolean(itemMutationKey && mutationKey === itemMutationKey);
          const readbackError = itemMutation && mutationMessage.startsWith('Ändringen sparades, men dagens lista');
          return <DailyActivityItem key={item.id} variant="home" kind={item.kind} label={item.label} routineLabel={item.routineLabel}
            icon={item.icon} showRoutineIcon={item.kind === 'routine'}
            accessibilityLabel={item.kind === 'routine' ? `Rutin ${item.routineLabel ?? ''}, punkt ${item.label}` : `Träningsuppgift: ${item.label}`}
            accessibilityHint={item.kind === 'routine' && routineDay?.routine_id ? 'Håll inne på en rutinpunkt för att öppna redigeringen.' : undefined}
            completed={item.completed} pending={itemMutation && mutationBusy}
            statusMessage={itemMutation ? mutationMessage : ''} statusError={itemMutation && mutationError}
            onToggle={routineDay ? () => item.routineItemId && onSetRoutineCompletion?.(routineDay, item.routineItemId, !item.completed) : undefined}
            onOpen={item.kind === 'training' && item.programId && item.stepId
              ? () => onOpenTrainingStep?.(item.programId!, item.stepId!, 'checklist')
              : () => openManager(routineDay?.routine_id ?? null)}
            onLongPress={item.kind === 'routine' && routineDay?.routine_id
              ? () => openManager(routineDay.routine_id, true, item.routineItemId ?? null)
              : undefined}
            onRetry={itemMutation ? (onRetryMutation ?? (readbackError ? onRetry : undefined)) : undefined} />;
        })}
      </View>
    </Card> : null}

    {!showingToday && (rangeState === 'ready' || rangeState === 'partial') && rangeActivities.length > 0 ? <Card variant="home">
      <View style={styles.activityList}>
        {groupActivitiesByDate(rangeActivities).map((group, groupIndex) => <View key={group.dateKey}>
          <Text accessibilityRole="header" style={[styles.dateGroupHeading, groupIndex > 0 && styles.laterDateGroup]}>{rangeDateLabel(group.dateKey, dateKey)}</Text>
          {group.items.map((item, index) => <ChecklistActivityRow key={item.id} item={item}
            first={groupIndex === 0 && index === 0} accessibilityLabel={activityAccessibilityLabel(item)}
            completed={item.completed} statusMessage={item.skipped ? 'Överhoppad' : ''}
            statusError={false}
            disabled={Boolean(routineSourceLoadingId)}
            onOpen={item.planned && item.routineId && item.dateKey ? () => { void openUpcomingRoutine(item.routineId!, item.dateKey!); }
              : item.planned && item.healthPlanId ? () => onOpenPlannedHealth?.(item.healthPlanId!)
                : item.kind === 'training' && item.programId && item.stepId ? () => onOpenHistoricalTrainingStep?.(item.programId!, item.stepId!) : undefined} />)}
        </View>)}
      </View>
    </Card> : null}

    <DailyActivityManagerSheet key={`${dateKey}:${focusRoutineId ?? 'all'}:${focusRoutineItemId ?? 'all-items'}:${managerVisible}:${editFocusedRoutineOnOpen}:${routineOnlyContext}`}
      visible={managerVisible} onClose={closeManager} focusRoutineId={focusRoutineId} focusRoutineItemId={focusRoutineItemId}
      dailyScopeKey={dailyScopeKey} routineRecovery={routineRecovery} onRoutineRecoveryChange={onRoutineRecoveryChange}
      editFocusedRoutineOnOpen={editFocusedRoutineOnOpen} upcomingRoutineOnly={routineOnlyContext}
      activities={activities} routines={routineOnlyContext && focusedUpcomingRoutine ? [focusedUpcomingRoutine] : showingUpcoming ? upcomingRoutines : routines}
      routineDaySkips={routineDaySkips} trainingOptions={trainingOptions}
      busy={mutationBusy} mutationMessage={mutationMessage} mutationError={mutationError} onRetryMutation={onRetryMutation}
      onCreateRoutine={onCreateRoutine} onUpdateRoutine={onUpdateRoutine} onDeleteRoutine={onDeleteRoutine}
      onAddRoutineToDay={onAddRoutineToDay} onRemoveRoutineFromDay={onRemoveRoutineFromDay}
      onAddTrainingToDay={onAddTrainingToDay} onRemoveTrainingFromDay={onRemoveTrainingFromDay} onGoTraining={onGoTraining} />
  </View>;
}

type ChecklistActivityRowProps = {
  item: HomeDailyActivity;
  first: boolean;
  accessibilityLabel: string;
  completed: boolean;
  pending?: boolean;
  statusMessage?: string;
  statusError?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  onRetry?: () => void;
};

function ChecklistActivityRow({ item, first, accessibilityLabel, completed, pending = false, statusMessage = '', statusError = false, disabled = false, onToggle, onOpen, onRetry }: ChecklistActivityRowProps) {
  const status = pending ? 'Sparar…' : item.planned ? 'Planerad' : statusMessage;
  const checkedBox = <View accessibilityElementsHidden style={[styles.checkbox, completed && styles.checkboxChecked]}>
    {completed ? <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.onPrimary} /> : null}
  </View>;
  const rowStatus = item.planned ? accessibilityLabel + ', planerad'
    : accessibilityLabel + ', ' + (item.skipped ? 'överhoppad' : completed ? 'klar' : 'inte markerad');
  return <View style={[styles.row, !first && styles.rowDivider]}>
    {item.planned ? null : onToggle ? <MotionPressable accessibilityRole="checkbox" aria-checked={completed} accessibilityLabel={rowStatus}
      accessibilityState={{ checked: completed, disabled: pending }} disabled={pending} onPress={onToggle}
      style={({ pressed }) => [styles.checkboxTarget, pressed && styles.pressed]}>{checkedBox}</MotionPressable>
      : <View accessibilityElementsHidden style={styles.checkboxTarget}>{checkedBox}</View>}
    <ActivitySourceIcon item={item} />
    {onOpen ? <MotionPressable accessibilityRole="button" accessibilityLabel={item.planned
      ? item.healthPlanId ? `Öppna planerad ${item.label.toLocaleLowerCase('sv-SE')} ${item.dateKey ?? ''}` : `Öppna planerad rutin ${item.routineLabel ?? item.label} ${item.dateKey ?? ''}`
      : item.kind === 'training' ? 'Öppna sparat träningssteg ' + item.label : 'Öppna rutin ' + (item.routineLabel ?? item.label)}
      accessibilityState={{ disabled }} disabled={disabled} onPress={onOpen} style={({ pressed }) => [styles.rowContent, pressed && styles.pressed, disabled && styles.disabled]}>
      <View style={styles.copy}>
        <Text style={styles.rowTitle}>{item.label}</Text>
        {item.planned && item.repeatSummary ? <Text style={styles.rowDetail}>{item.repeatSummary}</Text> : null}
        {item.kind === 'training' && item.programTitle ? <Text style={styles.rowDetail}>{item.programTitle}</Text> : null}
        {status ? <Text accessibilityRole={statusError ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[styles.rowStatus, statusError && styles.errorText]}>{status}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden />
    </MotionPressable> : <View accessible accessibilityRole="text" accessibilityLabel={rowStatus + (status ? ', ' + status : '')} style={styles.rowContent}>
      <View style={styles.copy}>
        <Text style={styles.rowTitle}>{item.label}</Text>
        {item.kind === 'training' && item.programTitle ? <Text style={styles.rowDetail}>{item.programTitle}</Text> : null}
        {status ? <Text accessibilityRole={statusError ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[styles.rowStatus, statusError && styles.errorText]}>{status}</Text> : null}
      </View>
    </View>}
    {statusMessage && onRetry ? <Button variant="tertiary" label="Försök igen" accessibilityLabel={'Kontrollera ändringen för ' + item.label + ' igen'} disabled={pending} onPress={onRetry} /> : null}
  </View>;
}

function ActivitySourceIcon({ item }: { item: HomeDailyActivity }) {
  if (item.kind === 'training') return <IconChip category="training" size="medium" />;
  if (item.healthType === 'vaccination') return <IconChip category="vaccination" size="medium" />;
  if (item.healthType === 'vet_visit') return <IconChip category="veterinary" size="medium" />;
  if (item.planned && item.routineId) return <View accessibilityRole="image" accessibilityLabel="Återkommande rutin" style={styles.routineIcon}>
    <Ionicons name="repeat-outline" size={tokens.size.iconMd} color={tokens.colors.home.textMuted} accessibilityElementsHidden />
  </View>;
  const icon = item.icon ?? 'list-outline';
  return <View accessibilityRole="image" accessibilityLabel="Rutin" style={styles.routineIcon}>
    <ThemedIcon name={icon} tone={dailyRoutineChecklistIconTone(icon)} size="small" testID={`checklist-icon-${item.id}`} />
  </View>;
}

function activityAccessibilityLabel(item: HomeDailyActivity): string {
  if (item.planned) {
    const source = item.healthPlanId ? 'Hälsa' : 'Återkommande rutin';
    return `${source}: ${item.label}, ${item.dateKey ? checklistDateLabel(item.dateKey) : ''}, planerad`;
  }
  const source = item.kind === 'training' ? 'Träning: ' + (item.programTitle ?? 'sparat träningssteg') : 'Rutin: ' + (item.routineLabel ?? item.label);
  return source + ', ' + item.label + (item.skipped ? ', överhoppad' : item.completed ? ', klar' : ', inte markerad');
}

function groupActivitiesByDate(activities: readonly HomeDailyActivity[]): { dateKey: string; items: HomeDailyActivity[] }[] {
  const grouped = new Map<string, HomeDailyActivity[]>();
  for (const item of activities) {
    if (!item.dateKey) continue;
    const items = grouped.get(item.dateKey) ?? [];
    items.push(item);
    grouped.set(item.dateKey, items);
  }
  return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([dateKey, items]) => ({ dateKey, items }));
}

function rangeDateLabel(dateKey: string, today: string): string {
  if (dateKey === today) return 'Idag';
  const yesterday = addCalendarDaysSafe(today, -1);
  if (dateKey === yesterday) return 'Igår';
  return checklistDateLabel(dateKey).replace(/^\p{Ll}/u, (first) => first.toLocaleUpperCase('sv-SE'));
}

function addCalendarDaysSafe(dateKey: string, amount: number): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + amount));
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

function isChecklistFilter(value: string): value is ChecklistFilter {
  return value === 'Idag' || value === 'Denna vecka' || value === 'Alla' || value === 'Kommande';
}

const CHECKLIST_FILTERS: readonly ChecklistFilter[] = ['Idag', 'Denna vecka', 'Alla', 'Kommande'];

export function checklistDateLabel(dateKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return 'Idag';
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  if (!Number.isFinite(date.getTime())) return 'Idag';
  return new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);
}

const styles = StyleSheet.create({
  page: { gap: tokens.spacing.md, paddingBottom: tokens.spacing.xl },
  rangeContext: { ...tokens.typography.caption, color: tokens.colors.home.textMuted, marginTop: -tokens.spacing.sm },
  stateCard: { gap: tokens.spacing.sm, paddingVertical: tokens.spacing.md },
  partialFeedback: { gap: tokens.spacing.xs },
  stateTitle: { ...tokens.typography.label, color: tokens.colors.home.text },
  body: { ...tokens.typography.body, color: tokens.colors.home.textMuted },
  summary: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, marginBottom: tokens.spacing.sm },
  cardHeading: { ...tokens.typography.caption, color: tokens.colors.home.text, fontWeight: '700', flex: 1 },
  count: { ...tokens.typography.caption, color: tokens.colors.home.text, fontWeight: '700', flexShrink: 0 },
  manageAction: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs / 2, paddingHorizontal: tokens.spacing.xs, borderRadius: tokens.radius.sm },
  manageActionLabel: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
  progressTrack: { height: tokens.size.progress, borderRadius: tokens.radius.full, overflow: 'hidden', backgroundColor: tokens.colors.home.progressTrack, marginBottom: tokens.spacing.sm },
  progressFill: { height: '100%', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.greenFill },
  activityList: { gap: 0 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  rowDivider: { borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  checkboxTarget: { width: tokens.size.touchMin, minHeight: 64, alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: tokens.size.homeCheckbox, height: tokens.size.homeCheckbox, borderWidth: 1, borderColor: tokens.colors.home.textMuted, borderRadius: tokens.spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.card },
  checkboxChecked: { borderColor: tokens.colors.home.greenStrong, backgroundColor: tokens.colors.home.greenStrong },
  routineIcon: { width: tokens.size.chipMd, minHeight: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full },
  rowContent: { flex: 1, minWidth: 0, minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm, paddingRight: tokens.spacing.xs },
  copy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs / 2 },
  rowTitle: { ...tokens.typography.caption, color: tokens.colors.home.text, fontWeight: '500', flexShrink: 1 },
  rowDetail: { ...tokens.typography.caption, color: tokens.colors.home.textMuted, flexShrink: 1 },
  rowStatus: { ...tokens.typography.caption, color: tokens.colors.home.textMuted, flexShrink: 1 },
  dateGroupHeading: { ...tokens.typography.caption, color: tokens.colors.home.text, fontWeight: '700', paddingTop: tokens.spacing.sm, paddingBottom: tokens.spacing.xs },
  laterDateGroup: { borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, marginTop: tokens.spacing.sm },
  errorText: { color: tokens.colors.danger },
  disabled: { opacity: 0.65 },
  rows: { gap: 0 },
});

