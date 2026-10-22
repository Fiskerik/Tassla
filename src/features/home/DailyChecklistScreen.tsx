import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppBar } from '../../components/ui/AppBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { IconChip } from '../../components/ui/IconChip';
import { MotionPressable } from '../../components/ui/Motion';
import { Tabs } from '../../components/ui/Tabs';
import { MessageCard } from '../../components/AppPrimitives';
import { Skeleton } from '../../components/ui/Skeleton';
import { tokens } from '../../theme/tokens';
import type { DailyRoutine, DailyRoutineChecklistItem, DailyRoutineCreateInput, DailyRoutineDay, DailyRoutineDaySkip, DailyRoutineRepeatValues, DailyTrainingSelection } from './daily-activity-data';
import type { ChecklistFilter, HomeDailyActivity } from './daily-activity-model';
import type { HomeDailyTrainingOption } from './HomeScreen';
import { DailyActivityManagerSheet } from './DailyActivityManagerSheet';

type WriteStatus = { status: 'saved' | 'failed' | 'unknown' } | void;
type RangeStatus = 'loading' | 'ready' | 'partial' | 'error';

export function DailyChecklistScreen({ dogName, dateKey, state, activities, refreshing, refreshError, mutationBusy, mutationKey, mutationMessage,
  mutationError, onBack, onRetry, onRetryMutation, onOpenTrainingStep, onSetRoutineCompletion, routines, routineDaySkips, trainingOptions,
  onCreateRoutine, onUpdateRoutine, onDeleteRoutine, onAddRoutineToDay, onRemoveRoutineFromDay, onAddTrainingToDay, onRemoveTrainingFromDay,
  onGoTraining, openManagerInitially = false }: {
  dogName: string;
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
  onSetRoutineCompletion?: (row: DailyRoutineDay, itemId: string, completed: boolean) => void;
  routines: readonly DailyRoutine[];
  routineDaySkips: readonly DailyRoutineDaySkip[];
  trainingOptions: readonly HomeDailyTrainingOption[];
  filter: ChecklistFilter;
  onChangeFilter: (filter: ChecklistFilter) => void;
  rangeState: RangeStatus;
  rangeActivities: readonly HomeDailyActivity[];
  onCreateRoutine?: (routine: DailyRoutineCreateInput) => Promise<WriteStatus | void>;
  onUpdateRoutine?: (routine: DailyRoutine, label: string, checklist: DailyRoutineChecklistItem[], repeat: DailyRoutineRepeatValues) => Promise<WriteStatus | void>;
  onDeleteRoutine?: (routine: DailyRoutine) => Promise<WriteStatus | void>;
  onAddRoutineToDay: (routine: DailyRoutine) => void;
  onRemoveRoutineFromDay?: (row: DailyRoutineDay, routine: DailyRoutine) => void;
  onAddTrainingToDay?: (option: HomeDailyTrainingOption) => void;
  onRemoveTrainingFromDay?: (row: DailyTrainingSelection) => void;
  onGoTraining: () => void;
  openManagerInitially?: boolean;
}) {
  const [managerVisible, setManagerVisible] = useState(openManagerInitially);
  const [focusRoutineId, setFocusRoutineId] = useState<string | null>(null);
  const [editFocusedRoutineOnOpen, setEditFocusedRoutineOnOpen] = useState(false);
  const completedCount = activities.filter((activity) => activity.completed).length;
  const dateLabel = checklistDateLabel(dateKey);
  const retry = showingToday ? onRetry : onRetryRange;

  function openManager(routineId: string | null = null, editFocusedRoutine = false) {
    setFocusRoutineId(routineId);
    setEditFocusedRoutineOnOpen(editFocusedRoutine);
    setManagerVisible(true);
  }

  return <View testID="daily-checklist-screen" style={styles.page}>
    <AppBar mode="Back" title="Checklistor" actionLabel="Tillbaka till Hem" onAction={onBack} variant="compact" />
    <View style={styles.heading}>
      <Text style={styles.date}>{dateLabel}</Text>
      <Text style={styles.description}>Dagens aktiviteter för {dogName}</Text>
    </View>

    {refreshError && showingToday && state === 'ready' ? <MessageCard tone="error">Uppdateringen kunde inte hämtas. Du ser senast hämtade uppgifter.</MessageCard> : null}
    {!showingToday && rangeState === 'partial' ? <View style={styles.partialFeedback}>
      <MessageCard tone="error">Några sparade uppgifter kunde inte hämtas.</MessageCard>
      {onRetryRange ? <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta sparade uppgifter igen" onPress={onRetryRange} /> : null}
    </View> : null}
    {visibleState === 'loading' ? <View accessibilityLabel={showingToday ? 'Dagens checklista hämtas' : 'Sparade uppgifter hämtas'} style={styles.stateCard}>
      <Skeleton shape="row" lines={4} />
    </View> : null}
    {visibleState === 'error' ? <Card variant="home"><View style={styles.stateCard}>
      <Text accessibilityRole="header" style={styles.stateTitle}>{showingToday ? 'Checklistan kunde inte hämtas' : 'Sparade uppgifter kunde inte hämtas'}</Text>
      <Text style={styles.body}>Prova att hämta igen.</Text>
      {retry ? <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta checklistan igen" onPress={retry} /> : null}
    </View></Card> : null}
    {visibleState === 'ready' && visibleActivities.length === 0 ? <Card variant="home"><View style={styles.stateCard}>
      <Text accessibilityRole="header" style={styles.stateTitle}>{showingToday ? 'Inga aktiviteter idag' : 'Inga sparade uppgifter i perioden'}</Text>
      {showingToday ? <Text style={styles.body}>Lägg till en rutin eller ett träningssteg.</Text> : null}
      {showingToday && refreshing ? <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel="Dagens checklista uppdateras" size="small" color={tokens.colors.textSecondary} /> : null}
      {showingToday ? <Button variant="tertiary" label="Hantera aktiviteter" accessibilityLabel="Hantera dagens aktiviteter" onPress={() => openManager()} /> : null}
    </View></Card> : null}

    {showingToday && state === 'ready' && activities.length > 0 ? <Card variant="home">
      <View style={styles.summary}>
        <Text accessibilityRole="header" accessibilityLabel={'Idag, ' + dateLabel} style={styles.cardHeading}>Idag</Text>
        <Text style={styles.count}>{completedCount} av {activities.length} klara</Text>
        {refreshing ? <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel="Dagens checklista uppdateras" size="small" color={tokens.colors.textSecondary} /> : null}
      </View>
      <View testID="daily-checklist-progress" accessibilityRole="progressbar"
        accessibilityLabel={completedCount + ' av ' + activities.length + ' dagsuppgifter klara'}
        accessibilityValue={{ min: 0, max: activities.length, now: completedCount }} style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: (Math.round(completedCount / activities.length * 100) + '%') as import('react-native').DimensionValue }]} />
      </View>
      {activities.some((activity) => activity.kind === 'routine')
        ? <Text style={styles.longPressHint}>Håll inne på rutinen för att redigera.</Text>
        : null}
      <View style={styles.rows}>
        {activities.map((item) => {
          const routineDay = item.routineDay;
          const itemMutationKey = routineDay && item.routineItemId ? 'complete-routine:' + routineDay.id + ':' + item.routineItemId : '';
          const itemMutation = Boolean(itemMutationKey && mutationKey === itemMutationKey);
          const readbackError = itemMutation && mutationMessage.startsWith('Ändringen sparades, men dagens lista');
          return <DailyActivityItem key={item.id} variant="home" kind={item.kind} label={item.label} routineLabel={item.routineLabel}
            accessibilityLabel={item.kind === 'routine' ? `Rutin ${item.routineLabel ?? ''}, punkt ${item.label}` : `Träningsuppgift: ${item.label}`}
            accessibilityHint={item.kind === 'routine' && routineDay?.routine_id ? 'Håll inne på rutinen för att redigera.' : undefined}
            completed={item.completed} pending={itemMutation && mutationBusy}
            statusMessage={itemMutation ? mutationMessage : ''} statusError={itemMutation && mutationError}
            onToggle={routineDay ? () => item.routineItemId && onSetRoutineCompletion?.(routineDay, item.routineItemId, !item.completed) : undefined}
            onOpen={item.kind === 'training' && item.programId && item.stepId
              ? () => onOpenTrainingStep?.(item.programId!, item.stepId!, 'checklist')
              : () => openManager(routineDay?.routine_id ?? null)}
            onLongPress={item.kind === 'routine' && routineDay?.routine_id
              ? () => openManager(routineDay.routine_id, true)
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
            statusError={false} />)}
        </View>)}
      </View>
    </Card> : null}

    <DailyActivityManagerSheet key={`${dateKey}:${focusRoutineId ?? 'all'}:${managerVisible}:${editFocusedRoutineOnOpen}`}
      visible={managerVisible} onClose={() => { setManagerVisible(false); setEditFocusedRoutineOnOpen(false); }} focusRoutineId={focusRoutineId}
      editFocusedRoutineOnOpen={editFocusedRoutineOnOpen}
      activities={activities} routines={routines} routineDaySkips={routineDaySkips} trainingOptions={trainingOptions}
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
  onToggle?: () => void;
  onOpen?: () => void;
  onRetry?: () => void;
};

function ChecklistActivityRow({ item, first, accessibilityLabel, completed, pending = false, statusMessage = '', statusError = false, onToggle, onOpen, onRetry }: ChecklistActivityRowProps) {
  const status = pending ? 'Sparar…' : statusMessage;
  const checkedBox = <View accessibilityElementsHidden style={[styles.checkbox, completed && styles.checkboxChecked]}>
    {completed ? <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.onPrimary} /> : null}
  </View>;
  const rowStatus = accessibilityLabel + ', ' + (item.skipped ? 'överhoppad' : completed ? 'klar' : 'inte markerad');
  return <View style={[styles.row, !first && styles.rowDivider]}>
    {onToggle ? <MotionPressable accessibilityRole="checkbox" aria-checked={completed} accessibilityLabel={rowStatus}
      accessibilityState={{ checked: completed, disabled: pending }} disabled={pending} onPress={onToggle}
      style={({ pressed }) => [styles.checkboxTarget, pressed && styles.pressed]}>{checkedBox}</MotionPressable>
      : <View accessibilityElementsHidden style={styles.checkboxTarget}>{checkedBox}</View>}
    <ActivitySourceIcon item={item} />
    {onOpen ? <MotionPressable accessibilityRole="button" accessibilityLabel={item.kind === 'training' ? 'Öppna träningssteget ' + item.label : 'Öppna rutin ' + (item.routineLabel ?? item.label)}
      onPress={onOpen} style={({ pressed }) => [styles.rowContent, pressed && styles.pressed]}>
      <View style={styles.copy}>
        <Text style={styles.rowTitle}>{item.label}</Text>
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
  return <View accessibilityRole="image" accessibilityLabel="Rutin" style={styles.routineIcon}>
    <Ionicons name="list-outline" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden />
  </View>;
}

function activityAccessibilityLabel(item: HomeDailyActivity): string {
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

const CHECKLIST_FILTERS: readonly ChecklistFilter[] = ['Idag', 'Denna vecka', 'Alla'];

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
  progressTrack: { height: tokens.size.progress, borderRadius: tokens.radius.full, overflow: 'hidden', backgroundColor: tokens.colors.home.progressTrack, marginBottom: tokens.spacing.sm },
  progressFill: { height: '100%', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.greenFill },
  rows: { gap: 0 },
  longPressHint: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
