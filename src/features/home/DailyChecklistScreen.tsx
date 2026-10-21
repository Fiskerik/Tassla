import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { AppBar } from '../../components/ui/AppBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DailyActivityItem } from '../../components/ui/DailyActivityItem';
import { MessageCard } from '../../components/AppPrimitives';
import { Skeleton } from '../../components/ui/Skeleton';
import { tokens } from '../../theme/tokens';
import type { DailyRoutine, DailyRoutineChecklistItem, DailyRoutineCreateInput, DailyRoutineDay, DailyRoutineDaySkip, DailyRoutineRepeatValues, DailyTrainingSelection } from './daily-activity-data';
import type { HomeDailyActivity } from './daily-activity-model';
import type { HomeDailyTrainingOption } from './HomeScreen';
import { DailyActivityManagerSheet } from './DailyActivityManagerSheet';

type WriteStatus = { status: 'saved' | 'failed' | 'unknown' } | void;

export function DailyChecklistScreen({ dogName, dateKey, state, activities, refreshing, refreshError, mutationBusy, mutationKey, mutationMessage,
  mutationError, onBack, onRetry, onRetryMutation, onOpenTrainingStep, onSetRoutineCompletion, routines, routineDaySkips, trainingOptions,
  onCreateRoutine, onUpdateRoutine, onDeleteRoutine, onAddRoutineToDay, onRemoveRoutineFromDay, onAddTrainingToDay, onRemoveTrainingFromDay,
  onGoTraining }: {
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
  onRetryMutation?: () => void;
  onOpenTrainingStep?: (programId: string, stepId: string, returnPage: 'checklist') => void;
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
  onGoTraining: () => void;
}) {
  const [managerVisible, setManagerVisible] = useState(false);
  const [focusRoutineId, setFocusRoutineId] = useState<string | null>(null);
  const [editFocusedRoutineOnOpen, setEditFocusedRoutineOnOpen] = useState(false);
  const completedCount = activities.filter((activity) => activity.completed).length;
  const dateLabel = checklistDateLabel(dateKey);

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

    {refreshError && state === 'ready' ? <MessageCard tone="error">Uppdateringen kunde inte hämtas. Du ser senast hämtade uppgifter.</MessageCard> : null}
    {state === 'loading' ? <View accessibilityLabel="Dagens checklista hämtas" style={styles.stateCard}>
      <Skeleton shape="row" lines={4} />
    </View> : null}
    {state === 'error' ? <Card><View style={styles.stateCard}>
      <Text style={styles.stateTitle}>Dagens checklista kunde inte hämtas</Text>
      <Text style={styles.body}>Ingen aktivitet räknas som klar förrän listan har lästs in.</Text>
      {onRetry ? <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta dagens checklista igen" onPress={onRetry} /> : null}
    </View></Card> : null}
    {state === 'ready' && activities.length === 0 ? <Card><View style={styles.stateCard}>
      <Text style={styles.stateTitle}>Inga aktiviteter idag</Text>
      <Text style={styles.body}>Lägg till en rutin eller välj ett träningssteg när det passar er.</Text>
      {refreshing ? <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel="Dagens checklista uppdateras" size="small" color={tokens.colors.textSecondary} /> : null}
      <Button variant="tertiary" label="Hantera aktiviteter" accessibilityLabel="Hantera dagens aktiviteter" onPress={() => openManager()} />
    </View></Card> : null}
    {state === 'ready' && activities.length > 0 ? <>
      <View style={styles.summary}>
        <Text style={styles.count}>{completedCount} av {activities.length} klara</Text>
        {refreshing ? <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel="Dagens checklista uppdateras" size="small" color={tokens.colors.textSecondary} /> : null}
        <Button variant="tertiary" label="Hantera" accessibilityLabel="Hantera dagens aktiviteter" onPress={() => openManager()} />
      </View>
      <View testID="daily-checklist-progress" accessibilityRole="progressbar"
        accessibilityLabel={`${completedCount} av ${activities.length} dagsuppgifter klara`}
        accessibilityValue={{ min: 0, max: activities.length, now: completedCount }} style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(completedCount / activities.length * 100)}%` }]} />
      </View>
      {activities.some((activity) => activity.kind === 'routine')
        ? <Text style={styles.longPressHint}>Håll inne på rutinen för att redigera.</Text>
        : null}
      <View style={styles.rows}>
        {activities.map((item) => {
          const routineDay = item.routineDay;
          const itemMutationKey = routineDay && item.routineItemId ? `complete-routine:${routineDay.id}:${item.routineItemId}` : '';
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
    </> : null}

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

export function checklistDateLabel(dateKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return 'Idag';
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  if (!Number.isFinite(date.getTime())) return 'Idag';
  return new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);
}

const styles = StyleSheet.create({
  page: { gap: tokens.spacing.md, paddingBottom: tokens.spacing.xl },
  heading: { gap: tokens.spacing.xs },
  date: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  description: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  stateCard: { gap: tokens.spacing.sm, paddingVertical: tokens.spacing.md },
  stateTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  body: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  summary: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  count: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  progressTrack: { height: tokens.size.progress, borderRadius: tokens.radius.full, overflow: 'hidden', backgroundColor: tokens.colors.home.progressTrack },
  progressFill: { height: '100%', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.greenFill },
  rows: { gap: 0 },
  longPressHint: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
