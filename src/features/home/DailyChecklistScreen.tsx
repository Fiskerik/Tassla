import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppBar, DailyActivityItem, Button, IconChip, ListRow, SectionHeader, Skeleton, Tabs } from '../../components/ui';
import { MessageCard } from '../../components/AppPrimitives';
import type { DailyRoutine, DailyRoutineChecklistItem, DailyRoutineCreateInput, DailyRoutineDay, DailyRoutineDaySkip, DailyRoutineRepeatValues, DailyRoutineSchedule, DailyTrainingSelection } from './daily-activity-data';
import { dailyActivityProgressLabel, deriveDailyRoutineTemplateEntries, dailyRoutineRepeatSummary, isoWeekdayForDateKey, nextRoutineOccurrenceAfterDate, summarizeDailyActivityProgress, type DailyRoutineTemplateEntry, type HomeDailyActivity, type WeeklyActivityProjection } from './daily-activity-model';
import type { UpcomingPlannedHealthRecord } from '../../data/workspace-data';
import type { HomeDailyTrainingOption } from './HomeScreen';
import { DailyActivityManagerSheet } from './DailyActivityManagerSheet';
import { tokens } from '../../theme/tokens';
import { routineIconCategory, selectUpcomingWeekPreview } from './checklist-presentation';

type ActionResult = { status: 'saved' | 'failed' | 'unknown' } | void;
type ChecklistTab = 'Idag' | 'Denna vecka' | 'Alla' | 'Kommande';
const WEEKDAY_SHORT_LABELS = ['mån', 'tis', 'ons', 'tors', 'fre', 'lör', 'sön'];
const WEEKDAY_LONG_LABELS = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'];
const MONTH_SHORT_LABELS = ['jan', 'feb', 'mars', 'apr', 'maj', 'juni', 'juli', 'aug', 'sep', 'okt', 'nov', 'dec'];

function formatUpcomingDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-');
  return `${Number(day)} ${MONTH_SHORT_LABELS[Number(month) - 1] ?? ''} ${year}`;
}

function formatWeekday(dateKey: string): string {
  return WEEKDAY_LONG_LABELS[isoWeekdayForDateKey(dateKey) - 1] ?? '';
}

function formatWeekRange(dateKeys: readonly string[]): string {
  if (dateKeys.length !== 7) return '';
  const first = dateKeys[0].split('-').map(Number);
  const last = dateKeys[6].split('-').map(Number);
  const firstMonth = MONTH_SHORT_LABELS[first[1] - 1] ?? '';
  const lastMonth = MONTH_SHORT_LABELS[last[1] - 1] ?? '';
  const firstLabel = first[1] === last[1] ? String(first[2])
    : String(first[2]) + ' ' + firstMonth;
  return firstLabel + '–' + String(last[2]) + ' ' + lastMonth + ' ' + String(last[0]);
}

export function DailyChecklistScreen({ dogName, dateKey, dogId, scopeKey, initialTab, onActiveTabChange, weekDateKeys, weekState, weekProjection, weekCurrentDateKey, weekSelectedDateKey, onSelectWeekDate, onRetryWeek, onOpenWeekTrainingTarget, upcomingHealthPlans, upcomingHealthState, upcomingRoutineSchedules, upcomingRoutineState, openingUpcomingPlanId, upcomingPlanOpenError, onRetryUpcomingHealth, onRetryUpcomingRoutines, onOpenUpcomingPlan, state, refreshing, refreshError, activities, routines, routineDays, routineDaySkips,
  routineTemplatesWritable, routineTemplatesSnapshotVersion, trainingOptions, mutationBusy, mutationKey, mutationMessage, mutationError, onRetry, onRetryMutation, onSetRoutineCompletion,
  onCreateRoutine, onUpdateRoutine, onDeleteRoutine, onAddRoutineToDay, onAddRoutineTemplateToDay, onRemoveRoutineFromDay,
  onAddTrainingToDay, onRemoveTrainingFromDay, onOpenTrainingTarget, onGoTraining, onBack, onGuardAllAction }: {
  dogName: string;
  dogId: string;
  initialTab: ChecklistTab;
  onActiveTabChange: (tab: ChecklistTab) => void;
  weekDateKeys: readonly string[];
  weekState: 'loading' | 'ready' | 'error';
  weekProjection: WeeklyActivityProjection | null;
  weekCurrentDateKey: string | null;
  weekSelectedDateKey: string | null;
  onSelectWeekDate: (dateKey: string) => void;
  onRetryWeek: () => void;
  onOpenWeekTrainingTarget: (programVersionId: string, stepId: string) => void;
  upcomingHealthPlans: readonly UpcomingPlannedHealthRecord[];
  upcomingHealthState: 'loading' | 'ready' | 'error';
  upcomingRoutineSchedules: readonly DailyRoutineSchedule[];
  upcomingRoutineState: 'loading' | 'ready' | 'error';
  openingUpcomingPlanId: string | null;
  upcomingPlanOpenError: string;
  onRetryUpcomingHealth: () => void;
  onRetryUpcomingRoutines: () => void;
  onOpenUpcomingPlan: (planId: string) => void;
  scopeKey: string;
  dateKey: string;
  state: 'loading' | 'ready' | 'error';
  refreshing: boolean;
  refreshError: boolean;
  activities: readonly HomeDailyActivity[];
  routines: readonly DailyRoutine[];
  routineDays: readonly DailyRoutineDay[];
  routineDaySkips: readonly DailyRoutineDaySkip[];
  routineTemplatesWritable: boolean;
  routineTemplatesSnapshotVersion: number | null;
  trainingOptions: readonly HomeDailyTrainingOption[];
  mutationBusy: boolean;
  mutationKey: string;
  mutationMessage: string;
  mutationError: boolean;
  onRetry: () => void;
  onRetryMutation?: () => void;
  onSetRoutineCompletion: (row: DailyRoutineDay, itemId: string, completed: boolean) => void;
  onCreateRoutine?: (routine: DailyRoutineCreateInput) => Promise<ActionResult>;
  onUpdateRoutine?: (routine: DailyRoutine, label: string, checklist: DailyRoutineChecklistItem[], repeat: DailyRoutineRepeatValues) => Promise<ActionResult>;
  onDeleteRoutine?: (routine: DailyRoutine) => Promise<ActionResult>;
  onAddRoutineToDay?: (routine: DailyRoutine) => void;
  onAddRoutineTemplateToDay?: (routine: DailyRoutine) => void;
  onRemoveRoutineFromDay?: (row: DailyRoutineDay, routine: DailyRoutine) => void;
  onAddTrainingToDay?: (option: HomeDailyTrainingOption) => void;
  onRemoveTrainingFromDay?: (row: DailyTrainingSelection) => void;
  onOpenTrainingTarget: (programVersionId: string, stepId: string) => void;
  onGoTraining: () => void;
  onBack: () => void;
  onGuardAllAction?: (expectedSnapshotVersion?: number | null) => boolean;
}) {
  const [managerSession, setManagerSession] = useState<{ tab: ChecklistTab; dateKey: string; scopeKey: string; snapshotVersion: number | null } | null>(null);
  const [managerSessionNeedsPreservation, setManagerSessionNeedsPreservation] = useState(false);
  const [managerStaleLocked, setManagerStaleLocked] = useState(false);
  const [focusRoutineId, setFocusRoutineId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ChecklistTab>(initialTab);
  const progressLabel = dailyActivityProgressLabel(summarizeDailyActivityProgress(activities));
  const selectedWeekDay = weekProjection?.days.find((day) => day.dateKey === weekSelectedDateKey) ?? null;
  const templateEntries = deriveDailyRoutineTemplateEntries({ routines, routineDays, routineDaySkips, dogId, dateKey });
  const upcomingRows = useMemo(() => {
    const healthRows = upcomingHealthPlans.map((record) => ({
      id: record.id,
      kind: 'health' as const,
      dateKey: record.due_on,
      label: record.description || (record.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök'),
      category: record.event_type === 'vaccination' ? 'vaccination' as const : 'veterinary' as const,
      time: record.due_time?.slice(0, 5) ?? undefined,
      meta: record.description ? `${formatUpcomingDate(record.due_on)} · ${record.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök'}` : formatUpcomingDate(record.due_on),
      planId: record.id,
    }));
    const routineRows = upcomingRoutineSchedules.flatMap((routine) => {
      const nextDate = nextRoutineOccurrenceAfterDate(routine, dateKey);
      return nextDate ? [{ id: routine.id, kind: 'routine' as const, dateKey: nextDate, label: routine.label,
        category: 'walk' as const, time: undefined, meta: `Rutin · ${formatUpcomingDate(nextDate)}`, routineId: routine.id }] : [];
    });
    return [...healthRows, ...routineRows].sort((left, right) => left.dateKey.localeCompare(right.dateKey)
      || (left.kind === right.kind ? 0 : left.kind === 'health' ? -1 : 1)
      || left.label.localeCompare(right.label, 'sv') || left.id.localeCompare(right.id));
  }, [dateKey, upcomingHealthPlans, upcomingRoutineSchedules]);
  const upcomingPreview = useMemo(() => selectUpcomingWeekPreview(upcomingRows, dateKey, weekDateKeys[6] ?? dateKey), [upcomingRows, dateKey, weekDateKeys]);
  const showUpcomingTab = activeTab === 'Kommande' || upcomingHealthState !== 'ready' || upcomingRoutineState !== 'ready' || upcomingRows.length > 0;
  const canWriteTemplates = state === 'ready' && routineTemplatesWritable;
  const managerBlocked = (activeTab === 'Alla' || activeTab === 'Kommande') && !canWriteTemplates;
  const managerVisible = Boolean(managerSession && managerSession.tab === activeTab && managerSession.dateKey === dateKey && managerSession.scopeKey === scopeKey);
  const managerReadOnly = Boolean((managerSession?.tab === 'Alla' || managerSession?.tab === 'Kommande')
    && (managerStaleLocked || !canWriteTemplates || managerSession.snapshotVersion !== routineTemplatesSnapshotVersion));

  const handleManagerSessionNeedsPreservation = useCallback((needsPreservation: boolean) => {
    setManagerSessionNeedsPreservation(needsPreservation);
  }, []);

  useEffect(() => {
    if ((managerSession?.tab !== 'Alla' && managerSession?.tab !== 'Kommande') || managerStaleLocked) return;
    const freshnessLost = !canWriteTemplates || managerSession.snapshotVersion !== routineTemplatesSnapshotVersion;
    if (!freshnessLost) return;
    const transition = setTimeout(() => {
      if (managerSessionNeedsPreservation || mutationBusy || mutationError) setManagerStaleLocked(true);
      else {
        setManagerSession(null);
        setManagerStaleLocked(false);
        setFocusRoutineId(null);
      }
    }, 0);
    return () => clearTimeout(transition);
  }, [canWriteTemplates, managerSession, managerSessionNeedsPreservation, managerStaleLocked, mutationBusy, mutationError, routineTemplatesSnapshotVersion]);

  function allowManagerMutation() {
    const needsTemplateGate = activeTab === 'Alla' || activeTab === 'Kommande'
      || managerSession?.tab === 'Alla' || managerSession?.tab === 'Kommande';
    if (!needsTemplateGate) return true;
    if (managerStaleLocked) return false;
    const expectedVersion = managerSession?.tab === 'Alla' ? managerSession.snapshotVersion : routineTemplatesSnapshotVersion;
    return (onGuardAllAction ?? (() => canWriteTemplates))(expectedVersion);
  }

  function openManager(routineId: string | null = null) {
    if ((activeTab === 'Alla' || activeTab === 'Kommande')
      && !(onGuardAllAction ?? (() => canWriteTemplates))(routineTemplatesSnapshotVersion)) return;
    setFocusRoutineId(routineId);
    setManagerSession({ tab: activeTab, dateKey, scopeKey, snapshotVersion: routineTemplatesSnapshotVersion });
    setManagerSessionNeedsPreservation(false);
    setManagerStaleLocked(false);
  }

  const managerCreateRoutine = onCreateRoutine ? async (routine: DailyRoutineCreateInput): Promise<ActionResult> => {
    if (!allowManagerMutation()) return { status: 'failed' };
    const result = await onCreateRoutine(routine);
    if (result?.status === 'saved') onRetryUpcomingRoutines();
    return result;
  } : undefined;
  const managerUpdateRoutine = onUpdateRoutine ? async (routine: DailyRoutine, label: string, checklist: DailyRoutineChecklistItem[], repeat: DailyRoutineRepeatValues): Promise<ActionResult> => {
    if (!allowManagerMutation()) return { status: 'failed' };
    const result = await onUpdateRoutine(routine, label, checklist, repeat);
    if (result?.status === 'saved') onRetryUpcomingRoutines();
    return result;
  } : undefined;
  const managerDeleteRoutine = onDeleteRoutine ? async (routine: DailyRoutine): Promise<ActionResult> => {
    if (!allowManagerMutation()) return { status: 'failed' };
    const result = await onDeleteRoutine(routine);
    if (result?.status === 'saved') onRetryUpcomingRoutines();
    return result;
  } : undefined;
  const managerAddRoutine = (routine: DailyRoutine) => {
    if (!allowManagerMutation()) return;
    if (activeTab === 'Alla') (onAddRoutineTemplateToDay ?? onAddRoutineToDay)?.(routine);
    else onAddRoutineToDay?.(routine);
  };
  const managerRemoveRoutine = (row: DailyRoutineDay, routine: DailyRoutine) => {
    if (allowManagerMutation()) onRemoveRoutineFromDay?.(row, routine);
  };
  const managerSetRoutineCompletion = (row: DailyRoutineDay, itemId: string, completed: boolean) => {
    if (allowManagerMutation()) onSetRoutineCompletion(row, itemId, completed);
  };
  const managerAddTraining = (option: HomeDailyTrainingOption) => {
    if (allowManagerMutation()) onAddTrainingToDay?.(option);
  };
  const managerRemoveTraining = (row: DailyTrainingSelection) => {
    if (allowManagerMutation()) onRemoveTrainingFromDay?.(row);
  };
  const guardedRetryMutation = () => {
    if (allowManagerMutation()) onRetryMutation?.();
  };
  const changeTab = (tab: ChecklistTab) => {
    setManagerSession(null); setManagerSessionNeedsPreservation(false); setManagerStaleLocked(false); setActiveTab(tab); onActiveTabChange(tab);
  };

  return <View style={styles.screen}>
    <AppBar mode="Back" variant="compact" title="Checklista" actionLabel="Tillbaka till Hem" onAction={onBack} />
    <Text style={styles.scopeContext} accessibilityRole="text">{dogName} · {activeTab === 'Denna vecka' ? formatWeekRange(weekDateKeys) : dateKey}</Text>
    <Tabs items={showUpcomingTab ? ['Idag', 'Denna vecka', 'Alla', 'Kommande'] : ['Idag', 'Denna vecka', 'Alla']} active={activeTab}
      onChange={(tab) => changeTab(tab as ChecklistTab)} variant="rev02-segmented-wrap" />
    <View style={styles.actions}>
      <Text style={styles.progress} accessibilityRole="text">
        {activeTab === 'Alla'
          ? state === 'ready' ? `${templateEntries.length} ${templateEntries.length === 1 ? 'rutinmall' : 'rutinmallar'}` : 'Rutinmallar'
          : activeTab === 'Kommande' ? `${upcomingRows.length} kommande aktiviteter`
            : activeTab === 'Denna vecka' ? 'Veckans sparade aktiviteter' : state === 'ready' ? progressLabel : 'Dagens checklista'}
      </Text>
      {refreshing && activeTab !== 'Denna vecka' && activeTab !== 'Kommande' ? <Text style={styles.status}>Uppdaterar…</Text> : null}
      {activeTab !== 'Denna vecka' && activeTab !== 'Kommande' ? <Button variant="tertiary" label="Hantera rutiner" accessibilityLabel="Hantera rutiner och dagens aktiviteter"
        disabled={managerBlocked} onPress={() => openManager()} /> : null}
    </View>
    {activeTab !== 'Denna vecka' && refreshError && state === 'ready' ? <View style={styles.stateMessage}>
      <MessageCard tone="error">{activeTab === 'Alla'
        ? 'Uppdateringen misslyckades. Visade rutinmallar är senast bekräftade och skrivskyddade.'
        : 'Uppdateringen misslyckades. Visade uppgifter är senast bekräftade.'}</MessageCard>
      <Button variant="tertiary" label="Försök igen" accessibilityLabel="Försök uppdatera dagens checklista igen" onPress={onRetry} />
    </View> : null}
    {activeTab === 'Alla' && state === 'ready' && !canWriteTemplates && !refreshError ? <View style={styles.stateMessage}>
      <Text style={styles.status}>{refreshing ? 'Rutinmallarna är skrivskyddade medan listan uppdateras.' : 'Uppdatera listan innan du ändrar rutinmallarna.'}</Text>
      {!refreshing ? <Button variant="tertiary" label="Uppdatera listan" accessibilityLabel="Uppdatera rutinmallarna innan ändring" onPress={onRetry} /> : null}
    </View> : null}
    {activeTab !== 'Denna vecka' && state === 'loading' ? <View style={styles.loading} accessibilityLabel={activeTab === 'Alla' ? 'Laddar rutinmallar' : 'Laddar dagens checklista'}><Skeleton shape="row" lines={2} /><Skeleton shape="row" lines={2} /></View> : null}
    {activeTab !== 'Denna vecka' && state === 'error' ? <View style={styles.stateMessage}>
      <MessageCard tone="error">{activeTab === 'Alla' ? 'Rutinmallarna kunde inte hämtas. Ingen lista visas.' : 'Dagens checklista kunde inte hämtas. Ingen status räknas just nu.'}</MessageCard>
      <Button variant="tertiary" label="Hämta igen" accessibilityLabel={activeTab === 'Alla' ? 'Hämta rutinmallarna igen' : 'Hämta dagens checklista igen'} onPress={onRetry} />
    </View> : null}

    {activeTab === 'Idag' && state === 'ready' && activities.length === 0 ? <View style={styles.empty}>
      <SectionHeader title="Inget valt för idag" />
      <Text style={styles.body}>Välj en rutin eller ett träningssteg för att lägga till det i dagens checklista.</Text>
      <Button label="Välj dagens aktiviteter" accessibilityLabel="Välj dagens aktiviteter" onPress={() => openManager()} />
    </View> : null}
    {activeTab === 'Idag' && state === 'ready' && activities.length > 0 ? <View style={styles.activityList}>
      {activities.map((item, index) => {
        const row = item.routineDay;
        const activityRowStyle = [styles.activityRow, index < activities.length - 1 && styles.activityDivider];
        const itemMutationKey = row && item.routineItemId ? `complete-routine:${row.id}:${item.routineItemId}` : '';
        const itemMutation = Boolean(itemMutationKey && mutationKey === itemMutationKey);
        const detail = item.availability === 'adult-restricted' ? 'Inte tillgängligt för vuxna ännu'
          : item.availability === 'unavailable' ? 'Källan kunde inte hämtas' : item.kind === 'training' ? item.programTitle : item.routineLabel;
        if (item.kind === 'training') {
          const completionStatus = item.availability === 'unavailable' ? 'status kan inte bekräftas'
            : item.completed ? 'genomförd' : 'inte genomförd';
          return <View key={item.id} style={activityRowStyle}><View style={styles.trainingRow}
            accessibilityLabel={`Träningsuppgift: ${item.label}, ${completionStatus}${detail ? `, ${detail}` : ''}`}>
            <IconChip category="training" />
            <View style={styles.trainingCopy}>
              <Text style={styles.body}>{item.label}</Text>
              {detail ? <Text style={styles.status}>{detail}</Text> : null}
              <Text style={styles.status}>{item.availability === 'unavailable' ? 'Status kan inte bekräftas'
                : item.completed ? 'Genomförd' : 'Inte genomförd'}</Text>
            </View>
            {item.availability === 'available' && item.programId && item.stepId
              ? <Button variant="tertiary" label="Öppna" accessibilityLabel={`Öppna träningssteget ${item.label}`} onPress={() => onOpenTrainingTarget(item.programId as string, item.stepId as string)} />
              : null}
          </View></View>;
        }
        return <View key={item.id} style={activityRowStyle}><DailyActivityItem kind={item.kind} category={routineIconCategory(item.label)} label={item.label}
          detail={detail} routineLabel={item.routineLabel} completed={item.completed}
          accessibilityLabel={`Rutinpunkt: ${item.routineLabel ?? ''}, ${item.label}`}
          onToggle={row && item.routineItemId ? () => onSetRoutineCompletion(row, item.routineItemId as string, !item.completed) : undefined}
          onOpen={() => openManager(row?.routine_id ?? null)} pending={itemMutation && mutationBusy}
          statusMessage={itemMutation ? mutationMessage : ''} statusError={itemMutation && mutationError}
          onRetry={itemMutation ? onRetryMutation : undefined} /></View>;
      })}
    </View> : null}
    {activeTab === 'Idag' && upcomingHealthState === 'ready' && upcomingRoutineState === 'ready' && upcomingPreview.total > 0 ? <View style={styles.weekPreview} testID="checklist-week-preview">
      <SectionHeader title="Kommande i veckan" />
      <View style={styles.upcomingRows}>
        {upcomingPreview.rows.map((row) => row.kind === 'health'
          ? <ListRow key={`health:${row.id}`} category={row.category} title={row.label} meta={row.meta} time={row.time}
            accessibilityLabel={`Öppna ${row.label}, ${row.meta}${row.time ? `, klockan ${row.time}` : ''}`}
            disabled={Boolean(openingUpcomingPlanId)} onPress={() => onOpenUpcomingPlan(row.planId)} />
          : <ListRow key={`routine:${row.id}`} category={row.category} title={row.label} meta={row.meta}
            accessibilityLabel={`Hantera rutinen ${row.label}, nästa gång ${formatUpcomingDate(row.dateKey)}`}
            disabled={managerBlocked} onPress={() => openManager(row.routineId)} />)}
      </View>
      {upcomingPreview.hasMore ? <Button variant="tertiary" label="Visa alla kommande" accessibilityLabel="Visa alla kommande aktiviteter" onPress={() => changeTab('Kommande')} /> : null}
    </View> : null}

    {activeTab === 'Denna vecka' ? <View style={styles.weekView}>
      <View style={styles.weekSelector} accessibilityLabel="Veckans dagar">
        {weekDateKeys.map((dayDateKey) => {
          const selected = dayDateKey === weekSelectedDateKey;
          const today = dayDateKey === weekCurrentDateKey;
          const dayNumber = String(Number(dayDateKey.slice(-2)));
          const weekdayLabel = WEEKDAY_SHORT_LABELS[isoWeekdayForDateKey(dayDateKey) - 1] ?? '';
          return <Pressable key={dayDateKey} accessibilityRole="button" accessibilityState={{ selected }}
            accessibilityLabel={formatWeekday(dayDateKey) + ' ' + dayNumber + (today ? ', idag' : '')}
            onPress={() => onSelectWeekDate(dayDateKey)}
            style={({ pressed }) => [styles.weekDateButton, selected && styles.weekDateSelected, pressed && styles.weekDatePressed]}>
            <Text style={[styles.weekDateWeekday, selected && styles.weekDateTextSelected]}>{weekdayLabel}</Text>
            <Text style={[styles.weekDateNumber, selected && styles.weekDateTextSelected]}>{dayNumber}</Text>
            {today ? <Text style={[styles.weekDateToday, selected && styles.weekDateTextSelected]}>Idag</Text> : null}
          </Pressable>;
        })}
      </View>
      {weekState === 'loading' ? <View style={styles.loading} accessibilityLabel="Laddar veckans sparade aktiviteter"><Skeleton shape="row" lines={2} /><Skeleton shape="row" lines={2} /></View> : null}
      {weekState === 'error' ? <View style={styles.stateMessage}>
        <MessageCard tone="error">Veckans sparade aktiviteter kunde inte hämtas. Ingen veckostatus räknas just nu.</MessageCard>
        <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta veckans sparade aktiviteter igen" onPress={onRetryWeek} />
      </View> : null}
      {weekState === 'ready' && weekProjection && selectedWeekDay ? <>
        <View style={styles.weekSummary}>
          <Text style={styles.progress}>{weekProjection.summary.completedCount} av {weekProjection.summary.confirmedCount} bekräftade klara den här veckan</Text>
          {weekProjection.summary.unknownCount > 0 ? <Text style={styles.status}>{weekProjection.summary.unknownCount} statusar kan inte bekräftas</Text> : null}
          {weekProjection.summary.missingDayCount > 0 || weekProjection.summary.emptyDayCount > 0
            ? <Text style={styles.status}>{weekProjection.summary.missingDayCount} dagar utan sparad lista · {weekProjection.summary.emptyDayCount} bekräftat tomma</Text> : null}
          <Text style={styles.status}>{selectedWeekDay.completedCount} av {selectedWeekDay.confirmedCount} bekräftade klara {weekSelectedDateKey === weekCurrentDateKey ? 'idag' : 'den här dagen'}</Text>
        </View>
        {selectedWeekDay.state === 'loading' ? <View style={styles.loading} accessibilityLabel="Laddar dagens bekräftade checklista"><Skeleton shape="row" lines={2} /></View> : null}
        {selectedWeekDay.state === 'error' ? <View style={styles.stateMessage}>
          <MessageCard tone="error">Dagens checklista kunde inte hämtas. Veckans rådata används inte för idag.</MessageCard>
          <Button variant="tertiary" label="Hämta dagens checklista igen" accessibilityLabel="Hämta dagens checklista igen" onPress={onRetry} />
        </View> : null}
        {selectedWeekDay.state === 'missing' ? <View style={styles.empty}>
          <SectionHeader title="Ingen sparad dagslista" />
          <Text style={styles.body}>Det finns ingen sparad checklista för den här dagen.</Text>
        </View> : null}
        {selectedWeekDay.state === 'empty' ? <View style={styles.empty}>
          <SectionHeader title={weekSelectedDateKey === weekCurrentDateKey ? 'Inget valt för idag' : 'Inget valt för den här dagen'} />
          <Text style={styles.body}>Den bekräftade dagslistan innehåller inga valda aktiviteter.</Text>
        </View> : null}
        {selectedWeekDay.state === 'ready' ? <View style={styles.weekRows}>
          {selectedWeekDay.rows.map((row) => {
            const statusText = row.status === 'completed' ? 'Genomförd' : row.status === 'incomplete' ? 'Inte genomförd'
              : row.status === 'skipped' ? 'Överhoppad' : 'Status kan inte bekräftas';
            const detail = row.detail ?? statusText;
            const canOpen = Boolean(row.openTarget && weekSelectedDateKey === weekCurrentDateKey);
            return <View key={row.id} accessibilityRole={canOpen ? undefined : 'summary'} style={styles.weekRow} accessibilityLabel={(row.kind === 'training' ? 'Träning: ' : row.kind === 'skip' ? 'Överhoppad rutin: ' : 'Rutin: ')
              + row.label + ', ' + detail}>
              <IconChip category={row.kind === 'training' ? 'training' : 'walk'} />
              <View style={styles.weekRowCopy}>
                {row.routineLabel ? <Text style={styles.status}>{row.routineLabel}</Text> : null}
                {row.programTitle ? <Text style={styles.status}>{row.programTitle}</Text> : null}
                <Text style={styles.body}>{row.label}</Text>
                <Text style={styles.status}>{detail}</Text>
              </View>
              {canOpen && row.openTarget ? <Button variant="tertiary" label="Öppna"
                accessibilityLabel={'Öppna träningssteget ' + row.label}
                onPress={() => onOpenWeekTrainingTarget(row.openTarget!.programVersionId, row.openTarget!.stepId)} /> : null}
            </View>;
          })}
        </View> : null}
      </> : null}
    </View> : null}

    {activeTab === 'Kommande' ? <View style={styles.upcomingView}>
      {upcomingHealthState !== 'ready' || upcomingRoutineState !== 'ready' ? <MessageCard>
        Listan kan vara ofullständig medan aktiviteter hämtas eller en källa inte kan läsas.
      </MessageCard> : null}
      {openingUpcomingPlanId ? <Text style={styles.status} accessibilityRole="text">Hämtar den valda hälsohändelsen…</Text> : null}
      {upcomingPlanOpenError ? <MessageCard tone="error">{upcomingPlanOpenError} Tryck på planen igen för att kontrollera den på nytt.</MessageCard> : null}
      {upcomingHealthState === 'loading' ? <View style={styles.loading} accessibilityLabel="Laddar kommande hälsohändelser"><Skeleton shape="row" lines={2} /></View> : null}
      {upcomingRoutineState === 'loading' ? <View style={styles.loading} accessibilityLabel="Laddar kommande rutiner"><Skeleton shape="row" lines={2} /></View> : null}
      {upcomingHealthState === 'error' ? <View style={styles.stateMessage}>
        <MessageCard tone="error">Kommande hälsohändelser kunde inte hämtas.</MessageCard>
        <Button variant="tertiary" label="Hämta hälsohändelser igen" accessibilityLabel="Försök hämta kommande hälsohändelser igen" onPress={onRetryUpcomingHealth} />
      </View> : null}
      {upcomingRoutineState === 'error' ? <View style={styles.stateMessage}>
        <MessageCard tone="error">Kommande rutiner kunde inte hämtas.</MessageCard>
        <Button variant="tertiary" label="Hämta rutiner igen" accessibilityLabel="Försök hämta kommande rutiner igen" onPress={onRetryUpcomingRoutines} />
      </View> : null}
      {upcomingRows.length > 0 ? <View style={styles.upcomingRows}>
        {upcomingRows.map((row) => row.kind === 'health'
          ? <ListRow key={`health:${row.id}`} category={row.category} title={row.label} meta={row.meta} time={row.time}
            accessibilityLabel={`Öppna ${row.label}, ${row.meta}${row.time ? `, klockan ${row.time}` : ''}`}
            disabled={Boolean(openingUpcomingPlanId)} onPress={() => onOpenUpcomingPlan(row.planId)} />
          : <ListRow key={`routine:${row.id}`} category={row.category} title={row.label} meta={row.meta}
            accessibilityLabel={`Hantera rutinen ${row.label}, nästa gång ${formatUpcomingDate(row.dateKey)}`}
            disabled={managerBlocked} onPress={() => openManager(row.routineId)} />)}
      </View> : null}
      {upcomingHealthState === 'ready' && upcomingRoutineState === 'ready' && upcomingRows.length === 0 ? <View style={styles.empty}>
        <SectionHeader title="Inga kommande aktiviteter" />
        <Text style={styles.body}>Det finns inga framtida hälsohändelser eller upprepande rutiner för den här hunden.</Text>
      </View> : null}
    </View> : null}

    {activeTab === 'Alla' && state === 'ready' && templateEntries.length === 0 ? <View style={styles.empty}>
      <SectionHeader title={canWriteTemplates ? 'Inga rutinmallar än' : 'Inga mallar i senast bekräftade listan'} />
      <Text style={styles.body}>{canWriteTemplates ? 'Skapa en rutinmall för att kunna välja den för en dag.' : 'Uppdatera listan innan du gör ändringar.'}</Text>
      {canWriteTemplates ? <Button label="Skapa rutin" accessibilityLabel="Skapa en rutinmall" onPress={() => openManager()} /> : null}
    </View> : null}
    {activeTab === 'Alla' && state === 'ready' && templateEntries.length > 0 ? <View style={styles.templates}>
      <SectionHeader title="Alla rutinmallar" />
      {templateEntries.map((entry) => renderRoutineTemplate(entry, {
        canWrite: canWriteTemplates,
        busy: mutationBusy,
        mutationKey,
        mutationMessage,
        mutationError,
        onSetRoutineCompletion: managerSetRoutineCompletion,
        onOpenManager: openManager,
        onAddRoutine: (routine) => {
          if (allowManagerMutation()) (onAddRoutineTemplateToDay ?? onAddRoutineToDay)?.(routine);
        },
        onRetryMutation: canWriteTemplates && !managerStaleLocked ? guardedRetryMutation : undefined,
      }))}
    </View> : null}

    {mutationMessage && !activities.some((item) => item.kind === 'routine' && item.routineDay && mutationKey === `complete-routine:${item.routineDay.id}:${item.routineItemId}`)
      ? <View style={styles.stateMessage}><MessageCard tone={mutationError ? 'error' : 'neutral'}>{mutationBusy ? 'Ändringen kontrolleras…' : mutationMessage}</MessageCard>{mutationError && onRetryMutation ? <Button variant="tertiary" label="Kontrollera ändringen igen" accessibilityLabel="Kontrollera dagens ändring igen" disabled={(activeTab === 'Alla' || activeTab === 'Kommande') && (!canWriteTemplates || managerStaleLocked)} onPress={activeTab === 'Alla' || activeTab === 'Kommande' ? guardedRetryMutation : onRetryMutation} /> : null}</View>
      : null}
    <DailyActivityManagerSheet key={`${scopeKey}:${focusRoutineId ?? 'all'}`} visible={managerVisible} dailyScopeKey={scopeKey}
      onClose={() => { setManagerSession(null); setManagerSessionNeedsPreservation(false); setManagerStaleLocked(false); }} focusRoutineId={focusRoutineId} activities={activities} routines={routines} routineDaySkips={routineDaySkips}
      trainingOptions={trainingOptions} busy={mutationBusy} readOnly={managerReadOnly} onGuardAction={allowManagerMutation}
      onSessionNeedsPreservationChange={handleManagerSessionNeedsPreservation}
      mutationMessage={mutationMessage} mutationError={mutationError} onRetryMutation={activeTab === 'Alla' || activeTab === 'Kommande' ? guardedRetryMutation : onRetryMutation}
      onCreateRoutine={managerCreateRoutine} onUpdateRoutine={managerUpdateRoutine} onDeleteRoutine={managerDeleteRoutine} onAddRoutineToDay={managerAddRoutine}
      onRemoveRoutineFromDay={managerRemoveRoutine} onAddTrainingToDay={managerAddTraining} onRemoveTrainingFromDay={managerRemoveTraining}
      onGoTraining={onGoTraining} />
  </View>;
}

function renderRoutineTemplate(entry: DailyRoutineTemplateEntry, actions: {
  canWrite: boolean;
  busy: boolean;
  mutationKey: string;
  mutationMessage: string;
  mutationError: boolean;
  onSetRoutineCompletion: (row: DailyRoutineDay, itemId: string, completed: boolean) => void;
  onOpenManager: (routineId: string | null) => void;
  onAddRoutine: (routine: DailyRoutine) => void;
  onRetryMutation?: () => void;
}) {
  const stateLabel = entry.state === 'selected' ? 'Vald idag' : entry.state === 'skipped' ? 'Överhoppad idag'
    : entry.state === 'scheduled' ? 'Planerad idag' : 'Inte planerad idag';
  const actionLabel = entry.state === 'skipped' ? 'Välj igen idag' : 'Välj för idag';
  return <View key={entry.routine.id} style={styles.templateCard}>
    <View style={styles.templateHeading}>
      <View style={styles.templateCopy}>
        <Text style={styles.templateTitle} accessibilityRole="header">{entry.routine.label}</Text>
        <Text style={styles.status}>{dailyRoutineRepeatSummary(entry.routine)}</Text>
      </View>
      <Text style={styles.templateState}>{stateLabel}</Text>
    </View>
    {entry.state === 'selected' && entry.selectedDay ? <>
      <Text style={styles.status}>{`${entry.activities.filter((item) => item.completed).length} av ${entry.activities.length} punkter klara`}</Text>
      <View style={styles.list}>
        {entry.activities.map((item) => {
          const row = item.routineDay as DailyRoutineDay;
          const itemMutationKey = `complete-routine:${row.id}:${item.routineItemId}`;
          const itemMutation = actions.mutationKey === itemMutationKey;
          return <DailyActivityItem key={item.id} kind="routine" category={routineIconCategory(item.label)} label={item.label}
            routineLabel={row.routine_label_snapshot} completed={item.completed}
            accessibilityLabel={`Rutinpunkt: ${row.routine_label_snapshot}, ${item.label}`}
            onToggle={actions.canWrite && !actions.busy && item.routineItemId
              ? () => actions.onSetRoutineCompletion(row, item.routineItemId as string, !item.completed) : undefined}
            onOpen={() => actions.onOpenManager(entry.routine.id)} pending={itemMutation && actions.busy}
            statusMessage={itemMutation ? actions.mutationMessage : ''} statusError={itemMutation && actions.mutationError}
            onRetry={itemMutation ? actions.onRetryMutation : undefined} />;
        })}
      </View>
    </> : <View style={styles.templateChecklist}>
      {entry.routine.checklist.map((item) => <View key={item.id} style={styles.templateItemRow}>
        <View style={styles.templateBullet} accessibilityElementsHidden />
        <Text style={styles.body}>{item.label}</Text>
      </View>)}
    </View>}
    {entry.state !== 'selected' && actions.canWrite ? <Button variant="tertiary" label={actionLabel}
      accessibilityLabel={`${actionLabel}: ${entry.routine.label}`} disabled={actions.busy} onPress={() => actions.onAddRoutine(entry.routine)} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  screen: { gap: tokens.spacing.md },
  scopeContext: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textAlign: 'center' },
  upcomingView: { gap: tokens.spacing.md },
  upcomingRows: { gap: tokens.spacing.xs },
  weekPreview: { gap: tokens.spacing.sm, padding: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.home.card },
  activityList: { gap: 0, overflow: 'hidden', paddingHorizontal: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.home.card },
  activityRow: { minHeight: tokens.size.touchMin, justifyContent: 'center', paddingVertical: tokens.spacing.xs },
  activityDivider: { borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  weekView: { gap: tokens.spacing.md },
  weekSelector: { flexDirection: 'row', justifyContent: 'space-between', gap: tokens.spacing.xs / 2 },
  weekDateButton: { flex: 1, minWidth: 0, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', gap: 2,
    paddingVertical: tokens.spacing.xs, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.home.card },
  weekDateSelected: { backgroundColor: tokens.colors.primary },
  weekDatePressed: { opacity: 0.72 },
  weekDateWeekday: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textTransform: 'capitalize' },
  weekDateNumber: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  weekDateToday: { ...tokens.typography.caption, color: tokens.colors.primary },
  weekDateTextSelected: { color: tokens.colors.onPrimary },
  weekSummary: { gap: tokens.spacing.xs },
  weekRows: { gap: tokens.spacing.xs },
  weekRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm,
    borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  weekRowCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: tokens.spacing.sm },
  progress: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  status: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  list: { gap: tokens.spacing.xs },
  templates: { gap: tokens.spacing.sm },
  templateCard: { gap: tokens.spacing.sm, padding: tokens.spacing.md, borderWidth: tokens.size.stroke,
    borderColor: tokens.colors.border, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.home.card },
  templateHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: tokens.spacing.sm },
  templateCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  templateTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, flexShrink: 1 },
  templateState: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1, textAlign: 'right' },
  templateChecklist: { gap: tokens.spacing.xs },
  templateItemRow: { minHeight: tokens.size.touchMin / 1.5, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  templateBullet: { width: tokens.spacing.sm, height: tokens.spacing.sm, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.primary },
  trainingRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  trainingCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  loading: { gap: tokens.spacing.sm },
  stateMessage: { gap: tokens.spacing.xs },
  empty: { gap: tokens.spacing.md, padding: tokens.spacing.lg, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.home.card },
  body: { ...tokens.typography.body, color: tokens.colors.textPrimary, flexShrink: 1 },
});
