import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppBar, DailyActivityItem, Button, IconChip, SectionHeader, Skeleton, Tabs } from '../../components/ui';
import { MessageCard } from '../../components/AppPrimitives';
import type { DailyRoutine, DailyRoutineChecklistItem, DailyRoutineCreateInput, DailyRoutineDay, DailyRoutineDaySkip, DailyRoutineRepeatValues, DailyTrainingSelection } from './daily-activity-data';
import { dailyActivityProgressLabel, deriveDailyRoutineTemplateEntries, dailyRoutineRepeatSummary, isoWeekdayForDateKey, summarizeDailyActivityProgress, type DailyRoutineTemplateEntry, type HomeDailyActivity, type WeeklyActivityProjection } from './daily-activity-model';
import type { HomeDailyTrainingOption } from './HomeScreen';
import { DailyActivityManagerSheet } from './DailyActivityManagerSheet';
import { tokens } from '../../theme/tokens';

type ActionResult = { status: 'saved' | 'failed' | 'unknown' } | void;
type ChecklistTab = 'Idag' | 'Denna vecka' | 'Alla';
const WEEKDAY_SHORT_LABELS = ['mån', 'tis', 'ons', 'tors', 'fre', 'lör', 'sön'];
const WEEKDAY_LONG_LABELS = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'];
const MONTH_SHORT_LABELS = ['jan', 'feb', 'mars', 'apr', 'maj', 'juni', 'juli', 'aug', 'sep', 'okt', 'nov', 'dec'];

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

export function DailyChecklistScreen({ dogName, dateKey, dogId, scopeKey, initialTab, onActiveTabChange, weekDateKeys, weekState, weekProjection, weekCurrentDateKey, weekSelectedDateKey, onSelectWeekDate, onRetryWeek, onOpenWeekTrainingTarget, state, refreshing, refreshError, activities, routines, routineDays, routineDaySkips,
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
  const canWriteTemplates = state === 'ready' && routineTemplatesWritable;
  const managerBlocked = activeTab === 'Alla' && !canWriteTemplates;
  const managerVisible = Boolean(managerSession && managerSession.tab === activeTab && managerSession.dateKey === dateKey && managerSession.scopeKey === scopeKey);
  const managerReadOnly = Boolean(managerSession?.tab === 'Alla'
    && (managerStaleLocked || !canWriteTemplates || managerSession.snapshotVersion !== routineTemplatesSnapshotVersion));

  const handleManagerSessionNeedsPreservation = useCallback((needsPreservation: boolean) => {
    setManagerSessionNeedsPreservation(needsPreservation);
  }, []);

  useEffect(() => {
    if (managerSession?.tab !== 'Alla' || managerStaleLocked) return;
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
    if (activeTab !== 'Alla' && managerSession?.tab !== 'Alla') return true;
    if (managerStaleLocked) return false;
    const expectedVersion = managerSession?.tab === 'Alla' ? managerSession.snapshotVersion : routineTemplatesSnapshotVersion;
    return (onGuardAllAction ?? (() => canWriteTemplates))(expectedVersion);
  }

  function openManager(routineId: string | null = null) {
    if (activeTab === 'Alla' && !(onGuardAllAction ?? (() => canWriteTemplates))(routineTemplatesSnapshotVersion)) return;
    setFocusRoutineId(routineId);
    setManagerSession({ tab: activeTab, dateKey, scopeKey, snapshotVersion: routineTemplatesSnapshotVersion });
    setManagerSessionNeedsPreservation(false);
    setManagerStaleLocked(false);
  }

  const managerCreateRoutine = onCreateRoutine ? async (routine: DailyRoutineCreateInput): Promise<ActionResult> => {
    if (!allowManagerMutation()) return { status: 'failed' };
    return await onCreateRoutine(routine);
  } : undefined;
  const managerUpdateRoutine = onUpdateRoutine ? async (routine: DailyRoutine, label: string, checklist: DailyRoutineChecklistItem[], repeat: DailyRoutineRepeatValues): Promise<ActionResult> => {
    if (!allowManagerMutation()) return { status: 'failed' };
    return await onUpdateRoutine(routine, label, checklist, repeat);
  } : undefined;
  const managerDeleteRoutine = onDeleteRoutine ? async (routine: DailyRoutine): Promise<ActionResult> => {
    if (!allowManagerMutation()) return { status: 'failed' };
    return await onDeleteRoutine(routine);
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

  return <View style={styles.screen}>
    <AppBar mode="Back" variant="compact" title="Checklista" actionLabel="Tillbaka till Hem" onAction={onBack} />
    <Text style={styles.scopeContext} accessibilityRole="text">{dogName} · {activeTab === 'Denna vecka' ? formatWeekRange(weekDateKeys) : dateKey}</Text>
    <Tabs items={['Idag', 'Denna vecka', 'Alla']} active={activeTab} onChange={(tab) => {
      const nextTab = tab as ChecklistTab;
      setManagerSession(null); setManagerSessionNeedsPreservation(false); setManagerStaleLocked(false); setActiveTab(nextTab); onActiveTabChange(nextTab);
    }} variant="rev02-segmented" />
    <View style={styles.actions}>
      <Text style={styles.progress} accessibilityRole="text">
        {activeTab === 'Alla'
          ? state === 'ready' ? `${templateEntries.length} ${templateEntries.length === 1 ? 'rutinmall' : 'rutinmallar'}` : 'Rutinmallar'
          : activeTab === 'Denna vecka' ? 'Veckans sparade aktiviteter' : state === 'ready' ? progressLabel : 'Dagens checklista'}
      </Text>
      {refreshing && activeTab !== 'Denna vecka' ? <Text style={styles.status}>Uppdaterar…</Text> : null}
      {activeTab !== 'Denna vecka' ? <Button variant="tertiary" label="Hantera rutiner" accessibilityLabel="Hantera rutiner och dagens aktiviteter"
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
    {activeTab === 'Idag' && state === 'ready' && activities.length > 0 ? <View style={styles.list}>
      {activities.map((item) => {
        const row = item.routineDay;
        const itemMutationKey = row && item.routineItemId ? `complete-routine:${row.id}:${item.routineItemId}` : '';
        const itemMutation = Boolean(itemMutationKey && mutationKey === itemMutationKey);
        const detail = item.availability === 'adult-restricted' ? 'Inte tillgängligt för vuxna ännu'
          : item.availability === 'unavailable' ? 'Källan kunde inte hämtas' : item.kind === 'training' ? item.programTitle : item.routineLabel;
        if (item.kind === 'training') {
          const completionStatus = item.availability === 'unavailable' ? 'status kan inte bekräftas'
            : item.completed ? 'genomförd' : 'inte genomförd';
          return <View key={item.id} style={styles.trainingRow}
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
          </View>;
        }
        return <DailyActivityItem key={item.id} kind={item.kind} category="walk" label={item.label}
          detail={detail} routineLabel={item.routineLabel} completed={item.completed}
          accessibilityLabel={`Rutinpunkt: ${item.routineLabel ?? ''}, ${item.label}`}
          onToggle={row && item.routineItemId ? () => onSetRoutineCompletion(row, item.routineItemId as string, !item.completed) : undefined}
          onOpen={() => openManager(row?.routine_id ?? null)} pending={itemMutation && mutationBusy}
          statusMessage={itemMutation ? mutationMessage : ''} statusError={itemMutation && mutationError}
          onRetry={itemMutation ? onRetryMutation : undefined} />;
      })}
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
      ? <View style={styles.stateMessage}><MessageCard tone={mutationError ? 'error' : 'neutral'}>{mutationBusy ? 'Ändringen kontrolleras…' : mutationMessage}</MessageCard>{mutationError && onRetryMutation ? <Button variant="tertiary" label="Kontrollera ändringen igen" accessibilityLabel="Kontrollera dagens ändring igen" disabled={activeTab === 'Alla' && (!canWriteTemplates || managerStaleLocked)} onPress={activeTab === 'Alla' ? guardedRetryMutation : onRetryMutation} /> : null}</View>
      : null}
    <DailyActivityManagerSheet key={`${scopeKey}:${focusRoutineId ?? 'all'}:${managerVisible}`} visible={managerVisible} dailyScopeKey={scopeKey}
      onClose={() => { setManagerSession(null); setManagerSessionNeedsPreservation(false); setManagerStaleLocked(false); }} focusRoutineId={focusRoutineId} activities={activities} routines={routines} routineDaySkips={routineDaySkips}
      trainingOptions={trainingOptions} busy={mutationBusy} readOnly={managerReadOnly} onGuardAction={allowManagerMutation}
      onSessionNeedsPreservationChange={handleManagerSessionNeedsPreservation}
      mutationMessage={mutationMessage} mutationError={mutationError} onRetryMutation={activeTab === 'Alla' ? guardedRetryMutation : onRetryMutation}
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
          return <DailyActivityItem key={item.id} kind="routine" category="walk" label={item.label}
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
  trainingRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  trainingCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  loading: { gap: tokens.spacing.sm },
  stateMessage: { gap: tokens.spacing.xs },
  empty: { gap: tokens.spacing.md, padding: tokens.spacing.lg, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.home.card },
  body: { ...tokens.typography.body, color: tokens.colors.textPrimary, flexShrink: 1 },
});
