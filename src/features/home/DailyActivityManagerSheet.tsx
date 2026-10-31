import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Crypto from 'expo-crypto';
import { BottomSheet, Button, Dialog } from '../../components/ui';
import { ThemedIcon } from '../../components/ui/ThemedIcon';
import { MotionPressable } from '../../components/ui/Motion';
import { KnowledgeImage } from '../knowledge/KnowledgeImage';
import { Tabs } from '../../components/ui/Tabs';
import { tokens } from '../../theme/tokens';
import { ChecklistIconPickerChoices, ChecklistIconPickerTrigger } from '../checklists/ChecklistIconPicker';
import { dailyRoutineChecklistDisplayIcon, dailyRoutineChecklistIconTone, isDailyRoutineChecklistIcon, type DailyRoutineChecklistIcon } from './daily-routine-checklist-icons';
import type { DailyRoutine, DailyRoutineChecklistItem, DailyRoutineCreateInput, DailyRoutineDay, DailyRoutineDaySkip, DailyRoutineRepeatValues, DailyTrainingSelection } from './daily-activity-data';
import { dailyRoutineRepeatSummary, isoWeekdayForDateKey, type HomeDailyActivity } from './daily-activity-model';
import { routineConflictAfterWrite, routineConflictForDraft, routineDraftAfterWrite, routineConflictMessage, routineEditDraftFromConflict, type RoutineDraft, type RoutineDraftConflict, type RoutineDraftRecovery } from './daily-activity-recovery';
import type { HomeDailyTrainingOption } from './HomeScreen';

type ActionResult = { status: 'saved' | 'failed' | 'unknown' } | { status: 'conflict'; value: DailyRoutine } | void;

function copyChecklist(items: readonly DailyRoutineChecklistItem[]) {
  return items.map((item) => ({ ...item }));
}

function cleanRoutineLabel(value: string) {
  return value.trim();
}

function cleanChecklist(items: readonly DailyRoutineChecklistItem[]) {
  return items.map((item) => ({ ...item, label: item.label.trim() }));
}

function sameChecklist(left: readonly DailyRoutineChecklistItem[], right: readonly DailyRoutineChecklistItem[]) {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id
    && item.label === right[index]?.label && item.icon === right[index]?.icon);
}

function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function localDateKeyToday() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function sameWeekdays(left: readonly number[] | null, right: readonly number[] | null, anchorDate: string) {
  const fallback = isValidDateKey(anchorDate) ? [isoWeekdayForDateKey(anchorDate)] : [];
  const effectiveLeft = left ?? fallback;
  const effectiveRight = right ?? fallback;
  return effectiveLeft.length === effectiveRight.length && effectiveLeft.every((day, index) => day === effectiveRight[index]);
}

function sameRepeat(left: DailyRoutineRepeatValues, right: DailyRoutineRepeatValues, anchorDate: string) {
  return left.repeat_unit === right.repeat_unit && left.repeat_interval === right.repeat_interval
    && (left.repeat_unit !== 'week' || sameWeekdays(left.repeat_weekdays, right.repeat_weekdays, anchorDate));
}

function routineDraftIsDirty(draft: RoutineDraft) {
  return cleanRoutineLabel(draft.label) !== cleanRoutineLabel(draft.initialLabel)
    || !sameChecklist(cleanChecklist(draft.checklist), cleanChecklist(draft.initialChecklist))
    || !sameRepeat(draft.repeat, draft.initialRepeat, draft.anchorDate);
}

function routineDraftIsValid(draft: RoutineDraft) {
  const label = cleanRoutineLabel(draft.label);
  const checklist = cleanChecklist(draft.checklist);
  const weekdaysValid = draft.repeat.repeat_unit !== 'week' || (draft.repeat.repeat_weekdays === null
    ? isValidDateKey(draft.anchorDate) : draft.repeat.repeat_weekdays.length > 0);
  return label.length > 0 && Array.from(label).length <= 160 && checklist.length >= 1 && checklist.length <= 50
    && checklist.every((item) => item.label.length > 0 && Array.from(item.label).length <= 160
      && (!item.icon || isDailyRoutineChecklistIcon(item.icon))) && weekdaysValid;
}

function routineDraftHasReadback(draft: RoutineDraft, routines: readonly DailyRoutine[]) {
  const routine = draft.mode === 'create'
    ? routines.find((item) => item.id === draft.submissionId)
    : routines.find((item) => item.id === draft.routineId);
  if (!routine) return false;
  const matchesDraft = routine.label === cleanRoutineLabel(draft.label)
    && sameChecklist(routine.checklist, cleanChecklist(draft.checklist))
    && sameRepeat(routine, draft.repeat, routine.repeat_anchor_date ?? draft.anchorDate);
  return draft.mode === 'create' ? matchesDraft : routine.checklist_revision > (draft.baseRevision ?? routine.checklist_revision) && matchesDraft;
}

export function DailyActivityManagerSheet({ visible, dailyScopeKey, onClose, focusRoutineId, focusRoutineItemId, editFocusedRoutineOnOpen = false, activities, routines, routineDaySkips, trainingOptions, trainingOptionsState = 'ready',
  busy, mutationMessage, mutationError, onRetryMutation, onCreateRoutine, onUpdateRoutine, onDeleteRoutine,
  onAddRoutineToDay, onRemoveRoutineFromDay, onAddTrainingToDay, onRemoveTrainingFromDay, onGoTraining, upcomingRoutineOnly = false,
  routineRecovery = null, onRoutineRecoveryChange }: {
  visible: boolean;
  dailyScopeKey?: string;
  onClose: () => void;
  focusRoutineId?: string | null;
  focusRoutineItemId?: string | null;
  editFocusedRoutineOnOpen?: boolean;
  activities: readonly HomeDailyActivity[];
  routines: readonly DailyRoutine[];
  routineDaySkips: readonly DailyRoutineDaySkip[];
  trainingOptions: readonly HomeDailyTrainingOption[];
  trainingOptionsState?: 'ready' | 'error';
  busy: boolean;
  mutationMessage: string;
  mutationError: boolean;
  onRetryMutation?: () => void;
  onCreateRoutine?: (routine: DailyRoutineCreateInput) => Promise<ActionResult>;
  onUpdateRoutine?: (routine: DailyRoutine, label: string, checklist: DailyRoutineChecklistItem[], repeat: DailyRoutineRepeatValues) => Promise<ActionResult>;
  onDeleteRoutine?: (routine: DailyRoutine) => Promise<ActionResult>;
  onAddRoutineToDay?: (routine: DailyRoutine) => void;
  onRemoveRoutineFromDay?: (row: DailyRoutineDay, routine: DailyRoutine) => void;
  onAddTrainingToDay?: (option: HomeDailyTrainingOption) => void;
  onRemoveTrainingFromDay?: (row: DailyTrainingSelection) => void;
  onGoTraining: () => void;
  upcomingRoutineOnly?: boolean;
  routineRecovery?: RoutineDraftRecovery | null;
  onRoutineRecoveryChange?: (draft: RoutineDraft | null, conflict: RoutineDraftConflict | null) => void;
}) {
  const [draft, setDraftState] = useState<RoutineDraft | null>(() => routineRecovery?.draft ?? null);
  const [iconPickerItemId, setIconPickerItemId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [openedRoutineId, setOpenedRoutineId] = useState<string | null>(null);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const [managerSection, setManagerSection] = useState<'Rutiner' | 'Träning'>('Rutiner');
  const [routineConflict, setRoutineConflictState] = useState<RoutineDraftConflict | null>(() => routineRecovery?.conflict ?? null);
  const recoveryState = useRef({ draft: routineRecovery?.draft ?? null, conflict: routineRecovery?.conflict ?? null });
  const mounted = useRef(true);
  const leaveAction = useRef<(() => void) | null>(null);
  const autoEditStarted = useRef(false);
  const selectedRoutines = new Map(activities.filter((item) => item.routineDay)
    .map((item) => [item.routineDay?.routine_id, item.routineDay as DailyRoutineDay]));
  const skippedRoutines = new Map(routineDaySkips.map((row) => [row.routine_id, row]));
  const focusedRoutineOnly = Boolean(focusRoutineId);
  const selectedTraining = upcomingRoutineOnly || focusedRoutineOnly ? [] : activities.filter((item) => item.kind === 'training' && item.trainingSelection);
  const visibleRoutines = upcomingRoutineOnly || focusedRoutineOnly ? routines.filter((routine) => routine.id === focusRoutineId) : routines;
  const draftSource = draft?.mode === 'edit' ? draft.sourceRoutine : null;
  const draftHasConflict = routineConflictForDraft(draft, routineConflict, dailyScopeKey ?? '');
  const draftConfirmed = draft && !draftHasConflict ? routineDraftHasReadback(draft, routines) : false;
  const activeDraft = draftConfirmed ? null : draft;
  const routinesForDisplay = activeDraft?.mode === 'edit'
    ? [activeDraft.sourceRoutine ?? visibleRoutines.find((routine) => routine.id === activeDraft.routineId)].filter((routine): routine is DailyRoutine => Boolean(routine))
    : draftSource && !visibleRoutines.some((routine) => routine.id === draftSource.id)
      ? [...visibleRoutines, draftSource] : visibleRoutines;
  const focusedRoutine = routinesForDisplay.find((routine) => routine.id === (focusRoutineId ?? openedRoutineId ?? draft?.routineId));
  const conflictForDraft = draftHasConflict;
  const creating = activeDraft?.mode === 'create';
  const editing = activeDraft?.mode === 'edit';
  const formActive = Boolean(activeDraft);
  const unresolvedMutation = busy || Boolean(mutationError && onRetryMutation);
  const selectionLocked = Boolean(activeDraft) || unresolvedMutation || showDiscardConfirmation;
  const showMutationMessage = Boolean(conflictForDraft) || Boolean(mutationMessage);
  const visibleMutationMessage = conflictForDraft
    ? routineConflictMessage
    : mutationMessage;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const updateRecovery = useCallback((nextDraft: RoutineDraft | null, nextConflict: RoutineDraftConflict | null = recoveryState.current.conflict) => {
    recoveryState.current = { draft: nextDraft, conflict: nextConflict };
    setDraftState(nextDraft);
    setRoutineConflictState(nextConflict);
    onRoutineRecoveryChange?.(nextDraft, nextConflict);
  }, [onRoutineRecoveryChange]);

  function setDraft(nextDraft: RoutineDraft | null) {
    updateRecovery(nextDraft);
  }

  function setRoutineConflict(nextConflict: RoutineDraftConflict | null) {
    updateRecovery(recoveryState.current.draft, nextConflict);
  }

  function requestLeave(action: () => void) {
    if (unresolvedMutation || savingDraft || showDiscardConfirmation) return;
    if (!activeDraft || !routineDraftIsDirty(activeDraft)) {
      setDraft(null);
      action();
      return;
    }
    leaveAction.current = action;
    setShowDiscardConfirmation(true);
  }

  function cancelDiscard() {
    leaveAction.current = null;
    setShowDiscardConfirmation(false);
  }

  function confirmDiscard() {
    const action = leaveAction.current;
    leaveAction.current = null;
    setShowDiscardConfirmation(false);
    setDraft(null);
    action?.();
  }

  function startCreate() {
    setOpenedRoutineId(null);
    const firstItem = { id: Crypto.randomUUID(), label: '' };
    const anchorDate = localDateKeyToday();
    setIconPickerItemId(null);
    const nextDraft = { mode: 'create' as const, submissionId: Crypto.randomUUID(), routineId: null, baseRevision: null, sourceRoutine: null,
      initialLabel: '', initialChecklist: [firstItem], initialRepeat: { repeat_unit: null, repeat_interval: null, repeat_weekdays: null }, anchorDate, newAnchorDate: anchorDate,
      label: '', checklist: [firstItem], repeat: { repeat_unit: null, repeat_interval: null, repeat_weekdays: null } };
    updateRecovery(nextDraft, null);
  }

  const startEdit = useCallback((routine: DailyRoutine, focusItemId?: string | null) => {
    if (selectionLocked) return;
    setOpenedRoutineId(routine.id);
    const checklist = copyChecklist(routine.checklist);
    setIconPickerItemId(focusItemId && checklist.some((item) => item.id === focusItemId) ? focusItemId : null);
    const repeat = { repeat_unit: routine.repeat_unit, repeat_interval: routine.repeat_interval, repeat_weekdays: routine.repeat_weekdays };
    const newAnchorDate = localDateKeyToday();
    const nextDraft = { mode: 'edit' as const, submissionId: Crypto.randomUUID(), routineId: routine.id, baseRevision: routine.checklist_revision, sourceRoutine: routine,
      initialLabel: routine.label, initialChecklist: checklist, initialRepeat: repeat, anchorDate: routine.repeat_anchor_date ?? newAnchorDate, newAnchorDate,
      label: routine.label, checklist, repeat };
    updateRecovery(nextDraft, null);
  }, [selectionLocked, updateRecovery]);

  useEffect(() => {
    if (!visible || !editFocusedRoutineOnOpen || !focusedRoutine || selectionLocked || autoEditStarted.current) return;
    autoEditStarted.current = true;
    startEdit(focusedRoutine, focusRoutineItemId);
  }, [visible, editFocusedRoutineOnOpen, focusedRoutine, focusRoutineItemId, selectionLocked, startEdit]);

  function updateDraft(patch: Partial<Pick<RoutineDraft, 'label' | 'checklist' | 'repeat'>>) {
    const current = recoveryState.current.draft;
    if (current) setDraft({ ...current, ...patch });
  }

  function replaceDraftWithLatestRoutine() {
    if (busy || savingDraft) return;
    const replacement = routineEditDraftFromConflict(draft, routineConflict, dailyScopeKey ?? '', Crypto.randomUUID(), localDateKeyToday());
    if (!replacement) return;
    setIconPickerItemId(null);
    updateRecovery(replacement, null);
  }

  function selectChecklistIcon(itemId: string, icon: DailyRoutineChecklistIcon) {
    const current = recoveryState.current.draft;
    if (current) setDraft({ ...current, checklist: current.checklist.map((item) => item.id === itemId ? { ...item, icon } : item) });
    setIconPickerItemId(null);
  }

  async function saveDraft() {
    if (!draft || !routineDraftIsValid(draft) || !routineDraftIsDirty(draft) || unresolvedMutation || savingDraft || conflictForDraft) return;
    const submittedDraft = draft;
    const submissionId = submittedDraft.submissionId;
    const label = cleanRoutineLabel(submittedDraft.label);
    const checklist = cleanChecklist(submittedDraft.checklist);
    const repeat = { ...submittedDraft.repeat };
    setSavingDraft(true);
    try {
      const sourceRoutine = submittedDraft.mode === 'edit'
        ? submittedDraft.sourceRoutine ?? routines.find((routine) => routine.id === submittedDraft.routineId) ?? null : null;
      const result = submittedDraft.mode === 'create'
        ? await onCreateRoutine?.({ id: submissionId, label, checklist, ...repeat })
        : sourceRoutine ? await onUpdateRoutine?.(sourceRoutine, label, checklist, repeat) : undefined;
      if (!mounted.current) return;
      setDraft(routineDraftAfterWrite(recoveryState.current.draft, submissionId, result?.status));
      if (result?.status === 'conflict') setRoutineConflict(routineConflictAfterWrite(submittedDraft, result, dailyScopeKey ?? ''));
    } finally {
      if (mounted.current) setSavingDraft(false);
    }
  }

  function closeSheet() {
    requestLeave(onClose);
  }

  function goToTraining() {
    requestLeave(() => { onClose(); onGoTraining(); });
  }

  const detailOpen = Boolean(focusedRoutine) || formActive || upcomingRoutineOnly || focusedRoutineOnly;
  const formDisabled = unresolvedMutation || savingDraft || showDiscardConfirmation || Boolean(conflictForDraft);
  const goBack = () => requestLeave(() => {
    setDraft(null);
    if (!formActive) {
      if (focusedRoutineOnly || upcomingRoutineOnly) onClose();
      else setOpenedRoutineId(null);
    }
  });
  const message = showMutationMessage ? <View style={[styles.message, (mutationError || Boolean(conflictForDraft)) && styles.errorMessage]}>
    <Text accessibilityRole={mutationError || conflictForDraft ? 'alert' : undefined} style={[styles.body, (mutationError || Boolean(conflictForDraft)) && styles.errorText]}>{visibleMutationMessage}</Text>
    {onRetryMutation ? <Button variant="tertiary" label="Kontrollera samma ändring igen" accessibilityLabel="Kontrollera samma ändring igen" disabled={busy} onPress={onRetryMutation} /> : null}
    {conflictForDraft ? <Button variant="tertiary" label="Ersätt utkastet med senaste versionen" accessibilityLabel="Ersätt utkastet med senaste versionen" disabled={busy || savingDraft} onPress={replaceDraftWithLatestRoutine} /> : null}
  </View> : null;

  return <>
    <BottomSheet visible={visible} title={creating ? 'Ny rutin' : editing ? 'Redigera rutin' : focusedRoutine ? 'Rutin' : 'Rutiner och aktiviteter'}
      keyboardAware onRequestClose={closeSheet}
      headerContent={detailOpen ? <MotionPressable accessibilityRole="button" accessibilityLabel="Tillbaka" accessibilityState={{ disabled: formDisabled }}
        disabled={formDisabled} onPress={goBack} style={({ pressed }) => [styles.backAction, formDisabled && styles.disabled, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden /><Text style={styles.backLabel}>Tillbaka</Text>
      </MotionPressable>
        : <Tabs items={['Rutiner', 'Träning']} active={managerSection} variant="rev02-segmented" activeTone="home" accessibilityLabel="Hantera aktiviteter" onChange={(value) => {
          if (value === 'Rutiner' || value === 'Träning') setManagerSection(value);
        }} />}
      footer={<>{message}{activeDraft ? <Button label="Spara rutin" accessibilityLabel={editing && focusedRoutine ? `Spara rutin ${focusedRoutine.label}` : 'Spara rutin'}
        loading={savingDraft || busy} disabled={formDisabled || !routineDraftIsValid(activeDraft) || !routineDraftIsDirty(activeDraft)} onPress={() => { void saveDraft(); }} />
        : <Button variant="tertiary" label="Klar" accessibilityLabel="Klar" disabled={unresolvedMutation || showDiscardConfirmation} onPress={closeSheet} />}</>}>
      {creating && activeDraft ? <CreateRoutineForm draft={activeDraft} disabled={formDisabled}
        iconPickerItemId={iconPickerItemId} onToggleIconPicker={(itemId) => setIconPickerItemId((current) => current === itemId ? null : itemId)}
        onSelectChecklistIcon={selectChecklistIcon} onChange={updateDraft} />
        : focusedRoutine ? <RoutineTemplateRow key={focusedRoutine.id} routine={focusedRoutine}
          selectedDay={selectedRoutines.get(focusedRoutine.id) ?? null} skippedDay={skippedRoutines.get(focusedRoutine.id) ?? null}
          draft={activeDraft?.mode === 'edit' ? activeDraft : null}
          iconPickerItemId={iconPickerItemId} onToggleIconPicker={(itemId) => setIconPickerItemId((current) => current === itemId ? null : itemId)}
          onSelectChecklistIcon={selectChecklistIcon} disabled={selectionLocked} fieldsDisabled={formDisabled}
          highlighted={false} isLast hideDayActions={upcomingRoutineOnly || formActive}
          onStartEdit={() => startEdit(focusedRoutine)} onChangeDraft={updateDraft}
          onDelete={() => onDeleteRoutine?.(focusedRoutine)} onAdd={() => onAddRoutineToDay?.(focusedRoutine)}
          onRemove={() => { const row = selectedRoutines.get(focusedRoutine.id); if (row) onRemoveRoutineFromDay?.(row, focusedRoutine); }} />
        : managerSection === 'Rutiner' ? <View style={styles.section}>
          <Button label="Skapa rutin" iconName="add-outline" accessibilityLabel="Skapa en ny rutin" disabled={unresolvedMutation || Boolean(draft)} onPress={startCreate} />
          {visibleRoutines.length ? <View style={styles.routineList}>{visibleRoutines.map((routine, index) => <MotionPressable key={routine.id}
            accessibilityRole="button" accessibilityLabel={`Öppna rutin ${routine.label}`} disabled={selectionLocked}
            style={({ pressed }) => [styles.summaryRow, index < visibleRoutines.length - 1 && styles.routineGroupSeparator, pressed && styles.pressed]}
            onPress={() => setOpenedRoutineId(routine.id)}>
            <ThemedIcon name={dailyRoutineChecklistDisplayIcon(routine.checklist[0] ?? { label: '' })} tone={dailyRoutineChecklistIconTone(dailyRoutineChecklistDisplayIcon(routine.checklist[0] ?? { label: '' }))} size="medium" />
            <View style={styles.copy}><Text style={styles.routineName}>{routine.label}</Text>
              <Text style={styles.muted}>{routine.checklist.length} {routine.checklist.length === 1 ? 'punkt' : 'punkter'} · {routine.repeat_unit === null ? 'Utan upprepning' : dailyRoutineRepeatSummary(routine)}</Text>
              {selectedRoutines.has(routine.id) ? <Text style={styles.todayLabel}>Med idag</Text> : null}</View>
            <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden />
          </MotionPressable>)}</View> : <View style={styles.emptyState}>
            <ThemedIcon name="list-outline" tone={dailyRoutineChecklistIconTone('list-outline')} size="medium" />
            <Text style={styles.sectionTitle}>Samla vardagens små saker</Text>
            <Text style={styles.muted}>Skapa en egen lista och välj när den ska återkomma.</Text>
          </View>}
        </View> : <View style={styles.section}>
          {selectedTraining.length ? <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Valt idag</Text>
            {selectedTraining.map((item) => <TrainingChoiceRow key={item.id} title={item.label} program={item.programTitle ?? ''} selected disabled={selectionLocked}
              onPress={() => item.trainingSelection && onRemoveTrainingFromDay?.(item.trainingSelection)} />)}
          </View> : null}
          {trainingOptionsState === 'error' ? <Text accessibilityRole="alert" style={styles.muted}>Träningen behöver kontrolleras. Öppna Träning och försök igen.</Text> : <>
            <Text style={styles.sectionTitle} accessibilityRole="header">{trainingOptions.some((option) => option.source === 'journey') ? 'Fortsätt där ni var' : 'Nästa förslag'}</Text>
            {trainingOptions.length ? trainingOptions.map((option) => <TrainingChoiceRow key={`${option.versionId}:${option.stepId}`}
              title={option.stepTitle} program={option.programTitle}
              detail={option.stepNumber && option.stepCount ? `Steg ${option.stepNumber} av ${option.stepCount}` : undefined}
              disabled={selectionLocked} onPress={() => onAddTrainingToDay?.(option)} />)
              : <Text style={styles.muted}>{selectedTraining.length ? 'Dagens träningsval finns ovan.' : 'Inget nytt steg finns att välja just nu.'}</Text>}
          </>}
          <Button variant="tertiary" label="Alla övningar" accessibilityLabel="Öppna Träning" disabled={unresolvedMutation || showDiscardConfirmation} onPress={goToTraining} />
        </View>}
    </BottomSheet>
    <Dialog visible={showDiscardConfirmation} title="Lämna utan att spara?" onRequestClose={cancelDiscard} onConfirm={confirmDiscard}
      confirmLabel="Lämna utan att spara" cancelLabel="Fortsätt redigera" confirmVariant="destructive" compactActions>
      <Text style={styles.body}>Dina osparade ändringar försvinner.</Text>
    </Dialog>
  </>;
}

function CreateRoutineForm({ draft, disabled, iconPickerItemId, onToggleIconPicker, onSelectChecklistIcon, onChange }: {
  draft: RoutineDraft;
  disabled: boolean;
  iconPickerItemId: string | null;
  onToggleIconPicker: (itemId: string) => void;
  onSelectChecklistIcon: (itemId: string, icon: DailyRoutineChecklistIcon) => void;
  onChange: (patch: Partial<Pick<RoutineDraft, 'label' | 'checklist' | 'repeat'>>) => void;
}) {
  const editable = !disabled;
  return <View style={styles.formCard}>
    <Text style={styles.formHeading} accessibilityRole="header">Namn</Text>
    <TextInput accessibilityLabel="Namn på rutin" placeholder="Till exempel Morgon" value={draft.label} onChangeText={(label) => onChange({ label })}
      editable={editable} maxLength={160} returnKeyType="done" style={styles.input} />
    <Text style={styles.sectionTitle} accessibilityRole="header">Checklista</Text>
    {draft.checklist.map((item, index) => <View key={item.id} style={styles.checklistEditorGroup}>
      <View style={styles.createItemRow}>
        <ChecklistIconPickerTrigger value={item.icon ?? null} label={item.label || `checklistepunkt ${index + 1}`}
          expanded={iconPickerItemId === item.id} disabled={disabled} testIDPrefix="routine" itemKey={item.id}
          onToggle={() => onToggleIconPicker(item.id)} />
        <TextInput accessibilityLabel={`Checklistepunkt ${index + 1}`} placeholder={`Punkt ${index + 1}`} value={item.label}
          onChangeText={(value) => onChange({ checklist: draft.checklist.map((entry) => entry.id === item.id ? { ...entry, label: value } : entry) })}
          editable={editable} maxLength={160} returnKeyType="done" style={[styles.input, styles.itemInput]} />

        <IconOnlyButton icon="close-outline" accessibilityLabel={`Ta bort checklistepunkt ${index + 1}`}
          disabled={disabled || draft.checklist.length <= 1} onPress={() => onChange({ checklist: draft.checklist.filter((entry) => entry.id !== item.id) })} />
      </View>
      <ChecklistIconPickerChoices value={item.icon ?? null} label={item.label || `checklistepunkt ${index + 1}`}
        expanded={iconPickerItemId === item.id} disabled={disabled} testIDPrefix="routine"
        onSelect={(icon) => onSelectChecklistIcon(item.id, icon)} />
    </View>)}
    {draft.checklist.length >= 50 ? <Text style={styles.muted}>En rutin kan ha högst 50 punkter.</Text> : <IconOnlyButton icon="add-outline" accessibilityLabel="Lägg till checklistepunkt sist"
      disabled={disabled} onPress={() => { const item = { id: Crypto.randomUUID(), label: '' }; onChange({ checklist: [...draft.checklist, item] }); }} />}
    <RepeatRuleDisclosure value={draft.repeat} anchorDate={draft.anchorDate} newAnchorDate={draft.newAnchorDate}
      onChange={(repeat) => onChange({ repeat })} disabled={disabled} />
  </View>;
}

function RepeatRuleDisclosure(props: React.ComponentProps<typeof RepeatRuleControls>) {
  const [expanded, setExpanded] = useState(false);
  const summary = props.value.repeat_unit === null ? 'Utan upprepning' : dailyRoutineRepeatSummary({ ...props.value, repeat_anchor_date: props.anchorDate });
  return <View style={styles.section}>
    <MotionPressable accessibilityRole="button" accessibilityLabel={`Ändra upprepning. ${summary}`} accessibilityState={{ expanded, disabled: props.disabled }}
      disabled={props.disabled} onPress={() => setExpanded((value) => !value)} style={styles.repeatSummaryButton}>
      <Ionicons name="repeat-outline" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden />
      <View style={styles.copy}><Text style={styles.sectionTitle}>Upprepning</Text><Text style={styles.muted}>{summary}</Text></View>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden />
    </MotionPressable>
    {expanded ? <RepeatRuleControls {...props} /> : null}
  </View>;
}

function TrainingChoiceRow({ title, program, detail, selected = false, disabled, onPress }: {
  title: string; program: string; detail?: string; selected?: boolean; disabled: boolean; onPress: () => void;
}) {
  return <View style={styles.trainingChoice}>
    <View style={styles.trainingImage}><KnowledgeImage source={require('../../../assets/images/training-recommendation-puppy-black-tan-park.jpg')}
      focus={{ x: 0.5, y: 0.35, zoom: 1, aspectRatio: 4 / 3 }} /></View>
    <View style={styles.copy}><Text style={styles.routineName}>{title}</Text><Text style={styles.muted}>{program}</Text>
      {detail ? <Text style={styles.todayLabel}>{detail}</Text> : null}</View>
    <View style={styles.trainingSelect}><Button variant="secondary" iconName={selected ? 'checkmark' : 'add-outline'} label={selected ? 'Vald' : 'Välj'}
      accessibilityLabel={selected ? `Ta bort ${title} från idag` : `Lägg till ${title} för idag`} disabled={disabled} onPress={onPress} /></View>
  </View>;
}

function RepeatRuleControls({ value, anchorDate, newAnchorDate, onChange, disabled }: {
  value: DailyRoutineRepeatValues;
  anchorDate: string;
  newAnchorDate: string;
  onChange: (next: DailyRoutineRepeatValues) => void;
  disabled: boolean;
}) {
  const never = value.repeat_unit === null;
  const daily = value.repeat_unit === 'day' && value.repeat_interval === 1;
  const custom = !never && !daily;
  const unit = value.repeat_unit ?? 'day';
  const interval = value.repeat_interval ?? 2;
  const anchorWeekday = isValidDateKey(anchorDate) ? isoWeekdayForDateKey(anchorDate) : 1;
  const newAnchorWeekday = isValidDateKey(newAnchorDate) ? isoWeekdayForDateKey(newAnchorDate) : anchorWeekday;
  const selectedWeekdays = value.repeat_weekdays ?? (unit === 'week' ? [anchorWeekday] : []);
  const weekdayNames = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
  const weekdayShortNames = ['Må', 'Ti', 'On', 'To', 'Fr', 'Lö', 'Sö'];
  function selectUnit(nextUnit: 'day' | 'week' | 'month') {
    const repeat_weekdays = nextUnit === 'week'
      ? unit === 'week' ? value.repeat_weekdays : [newAnchorWeekday]
      : null;
    onChange({ repeat_unit: nextUnit, repeat_interval: interval, repeat_weekdays });
  }
  return <View style={styles.repeatControls}>
    <View style={styles.repeatChoices} accessibilityRole="radiogroup" accessibilityLabel="Upprepning">
      <ChoiceButton label="Utan upprepning" selected={never} disabled={disabled} onPress={() => onChange({ repeat_unit: null, repeat_interval: null, repeat_weekdays: null })} />
      <ChoiceButton label="Dagligen" selected={daily} disabled={disabled} onPress={() => onChange({ repeat_unit: 'day', repeat_interval: 1, repeat_weekdays: null })} />
      <ChoiceButton label="Eget intervall" selected={custom} disabled={disabled}
        onPress={() => onChange(custom ? value : { repeat_unit: 'day', repeat_interval: 2, repeat_weekdays: null })} />
    </View>
    {custom ? <>
      <View style={styles.intervalControl}>
        <IconOnlyButton icon="remove-outline" accessibilityLabel="Minska intervall" disabled={disabled || interval <= 1}
          onPress={() => onChange({ ...value, repeat_unit: unit, repeat_interval: Math.max(1, interval - 1) })} />
        <Text style={styles.intervalValue}>{interval}</Text>
        <IconOnlyButton icon="add-outline" accessibilityLabel="Öka intervall" disabled={disabled || interval >= 30}
          onPress={() => onChange({ ...value, repeat_unit: unit, repeat_interval: Math.min(30, interval + 1) })} />
      </View>
      <View style={styles.repeatChoices}>
        {(['day', 'week', 'month'] as const).map((option) => <ChoiceButton key={option}
          label={option === 'day' ? 'Dagar' : option === 'week' ? 'Veckor' : 'Månader'}
          selected={unit === option} disabled={disabled} onPress={() => selectUnit(option)} />)}
      </View>
      {unit === 'week' ? <View style={styles.weekdayPicker} accessibilityLabel="Välj veckodagar">
        <Text style={styles.muted}>Välj minst en veckodag. Första dagen följer startdagen.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekdayChoices}>{weekdayNames.map((name, index) => {
          const day = index + 1;
          const selected = selectedWeekdays.includes(day);
          return <MotionPressable key={name} accessibilityRole="checkbox" accessibilityLabel={name}
            accessibilityState={{ checked: selected, disabled }} aria-checked={selected} disabled={disabled}
            onPress={() => onChange({ ...value, repeat_weekdays: selected
              ? selectedWeekdays.filter((selectedDay) => selectedDay !== day)
              : [...selectedWeekdays, day].sort((left, right) => left - right) })}
            style={({ pressed }) => [styles.weekdayButton, selected && styles.choiceButtonSelected, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
            <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{weekdayShortNames[index]}</Text>
          </MotionPressable>;
        })}</ScrollView>
        {selectedWeekdays.length === 0 ? <Text style={[styles.helper, styles.errorText]}>Välj minst en veckodag.</Text> : null}
      </View> : null}
    </> : null}
  </View>;
}

function ChoiceButton({ label, selected, disabled, onPress }: { label: string; selected: boolean; disabled: boolean; onPress: () => void }) {
  return <MotionPressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected, disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [styles.choiceButton, selected && styles.choiceButtonSelected, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
    <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
  </MotionPressable>;
}

function RoutineTemplateRow({ routine, selectedDay, skippedDay, draft, iconPickerItemId, onToggleIconPicker, onSelectChecklistIcon,
  disabled, fieldsDisabled, highlighted, isLast, hideDayActions = false,
  onStartEdit, onChangeDraft, onDelete, onAdd, onRemove }: {
  routine: DailyRoutine;
  selectedDay: DailyRoutineDay | null;
  skippedDay: DailyRoutineDaySkip | null;
  draft: RoutineDraft | null;
  iconPickerItemId: string | null;
  onToggleIconPicker: (itemId: string) => void;
  onSelectChecklistIcon: (itemId: string, icon: DailyRoutineChecklistIcon) => void;
  disabled: boolean;
  fieldsDisabled: boolean;
  highlighted: boolean;
  isLast: boolean;
  hideDayActions?: boolean;
  onStartEdit: () => void;
  onChangeDraft: (patch: Partial<Pick<RoutineDraft, 'label' | 'checklist' | 'repeat'>>) => void;
  onDelete: () => Promise<ActionResult> | undefined;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const editing = draft?.mode === 'edit' && draft.routineId === routine.id;
  const value = editing ? draft : null;
  const selected = selectedDay !== null;

  return <View style={[styles.routineGroup, !isLast && styles.routineGroupSeparator, highlighted && styles.highlightedRoutineGroup]}>
    <View style={styles.routineHeading}>
      {editing && value ? <TextInput accessibilityLabel={`Namn på rutin ${routine.label}`} placeholder="Namn på rutin" value={value.label}
        onChangeText={(label) => onChangeDraft({ label })} editable={!fieldsDisabled} maxLength={160} style={[styles.input, styles.routineNameInput]} />
        : <Text style={styles.routineName} accessibilityRole="header">{routine.label}</Text>}
      {!editing ? <IconOnlyButton icon="create-outline" accessibilityLabel={`Redigera rutin ${routine.label}`}
        disabled={disabled} onPress={onStartEdit} /> : null}
    </View>
    <Text style={styles.listHeading} accessibilityRole="header">Checklista</Text>
    {(value?.checklist ?? routine.checklist).map((item, index) => <View key={item.id} style={styles.checklistEditorGroup}>
      <View style={styles.editItemRow}>
        {editing && value ? <>
          <ChecklistIconPickerTrigger value={item.icon ?? null} label={item.label || `checklistepunkt ${index + 1}`}
            expanded={iconPickerItemId === item.id} disabled={fieldsDisabled} testIDPrefix="routine" itemKey={item.id}
            onToggle={() => onToggleIconPicker(item.id)} />
          <TextInput accessibilityLabel={`Checklistepunkt ${index + 1}`} value={item.label}
            onChangeText={(label) => onChangeDraft({ checklist: value.checklist.map((entry) => entry.id === item.id ? { ...entry, label } : entry) })}
            editable={!fieldsDisabled} maxLength={160} returnKeyType="done" style={[styles.input, styles.itemInput]} />

          <IconOnlyButton icon="close-outline" accessibilityLabel={`Ta bort checklistepunkt ${index + 1}: ${item.label || 'utan namn'}`}
            disabled={fieldsDisabled || value.checklist.length <= 1} onPress={() => onChangeDraft({ checklist: value.checklist.filter((entry) => entry.id !== item.id) })} />
        </> : <View style={styles.itemRow}>
          <ThemedIcon name={dailyRoutineChecklistDisplayIcon(item)} tone={dailyRoutineChecklistIconTone(dailyRoutineChecklistDisplayIcon(item))}
            size="small" testID={`routine-template-icon-${item.id}`} />
          <Text style={styles.itemLabel}>{item.label}</Text>
        </View>}
      </View>
      {editing && value ? <ChecklistIconPickerChoices value={item.icon ?? null} label={item.label || `checklistepunkt ${index + 1}`}
        expanded={iconPickerItemId === item.id} disabled={fieldsDisabled} testIDPrefix="routine"
        onSelect={(icon) => onSelectChecklistIcon(item.id, icon)} /> : null}
    </View>)}
    {editing && value ? <>
      {value.checklist.length >= 50 ? <Text style={styles.muted}>Rutinen har högsta tillåtna antal, 50 punkter.</Text> : <IconOnlyButton icon="add-outline"
        accessibilityLabel="Lägg till checklistepunkt sist" disabled={fieldsDisabled}
        onPress={() => { const item = { id: Crypto.randomUUID(), label: '' }; onChangeDraft({ checklist: [...value.checklist, item] }); }} />}
      {value.checklist.length === 1 ? <Text style={styles.helper}>En rutin behöver minst en checklistepunkt.</Text> : null}
      <RepeatRuleDisclosure value={value.repeat} anchorDate={value.anchorDate} newAnchorDate={value.newAnchorDate}
        onChange={(repeat) => onChangeDraft({ repeat })} disabled={fieldsDisabled} />
    </> : <View style={styles.scheduleSummaryRow}>
      <Text style={styles.repeatSummary}>{routine.repeat_unit === null ? 'Utan upprepning' : dailyRoutineRepeatSummary(routine)}</Text>
    </View>}
    {!hideDayActions ? <View style={styles.routineActions}>
      <IconOnlyButton icon={selected ? 'remove-outline' : 'add-outline'}
        accessibilityLabel={`${selected ? 'Ta bort' : skippedDay ? 'Lägg tillbaka' : 'Lägg till'} rutinen ${routine.label} ${selected ? 'från' : 'på'} Hemskärmen`}
        disabled={disabled} onPress={selected ? () => Alert.alert('Ta bort från Hemskärmen?', `”${routine.label}” tas bort från dagens lista. Rutinen finns kvar och kan läggas till igen.`, [
          { text: 'Avbryt', style: 'cancel' }, { text: 'Ta bort', onPress: onRemove },
        ]) : onAdd} />
      <IconOnlyButton icon="trash-outline" accessibilityLabel={`Ta bort rutin ${routine.label}`}
        disabled={disabled} onPress={() => Alert.alert('Ta bort rutin?', `Rutinen ”${routine.label}” och alla dess dagskopior och sparade överhoppningar tas bort.`, [
          { text: 'Avbryt', style: 'cancel' }, { text: 'Ta bort rutin', style: 'destructive', onPress: () => { void onDelete(); } },
        ])} />
    </View> : null}
  </View>;
}

function IconOnlyButton({ icon, accessibilityLabel, disabled = false, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return <Button variant="icon" iconName={icon} label={accessibilityLabel} accessibilityLabel={accessibilityLabel} disabled={disabled} onPress={onPress} />;
}

const styles = StyleSheet.create({
  backAction: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  backLabel: { ...tokens.typography.label, color: tokens.colors.primary },
  summaryRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, padding: tokens.spacing.md },
  todayLabel: { ...tokens.typography.smallCaption, color: tokens.colors.primary, fontWeight: '600' },
  emptyState: { alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.xl },
  trainingChoice: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.sm, borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  trainingSelect: { width: tokens.size.activityChoiceActionWidth },
  trainingImage: { width: tokens.size.activityChoiceImage, height: tokens.size.activityChoiceImage, borderRadius: tokens.radius.sm, overflow: 'hidden' },
  repeatSummaryButton: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.sm },
  section: { gap: tokens.spacing.md },
  sectionTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  formHeading: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  body: { ...tokens.typography.caption, color: tokens.colors.textPrimary, flexShrink: 1 },
  muted: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 },
  helper: { ...tokens.typography.caption, color: tokens.colors.textSecondary, paddingLeft: tokens.spacing.sm },
  message: { gap: tokens.spacing.xs, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.selectedSurface },
  errorMessage: { backgroundColor: tokens.colors.dangerSurface },
  errorText: { color: tokens.colors.danger },
  formCard: { gap: tokens.spacing.md },
  input: { ...tokens.typography.body, minHeight: tokens.size.touchMin, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, paddingHorizontal: tokens.spacing.sm, color: tokens.colors.textPrimary, backgroundColor: tokens.colors.surface },
  itemInput: { flex: 1, minWidth: 0 },
  createItemRow: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: tokens.spacing.xs },
  checklistEditorGroup: { gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  routineList: { overflow: 'hidden', borderRadius: tokens.radius.md, backgroundColor: tokens.colors.home.card },
  routineGroup: { gap: tokens.spacing.xs, padding: tokens.spacing.md },
  routineGroupSeparator: { borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  highlightedRoutineGroup: { backgroundColor: tokens.colors.home.canvas },
  routineHeading: { minHeight: tokens.size.touchMin, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: tokens.spacing.xs },
  routineName: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
  routineNameInput: { flex: 1, minWidth: 0 },
  listHeading: { ...tokens.typography.caption, color: tokens.colors.textSecondary, fontWeight: '700', paddingTop: tokens.spacing.xs },
  itemRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  editItemRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  itemLabel: { ...tokens.typography.caption, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
  routineActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: tokens.spacing.xs, paddingTop: tokens.spacing.xs },
  scheduleSummaryRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, paddingTop: tokens.spacing.xs },
  repeatSummary: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flex: 1 },
  repeatControls: { gap: tokens.spacing.xs },
  repeatChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs },
  weekdayPicker: { gap: tokens.spacing.xs, paddingTop: tokens.spacing.xs },
  weekdayChoices: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: tokens.spacing.xs },
  weekdayButton: { flexShrink: 0, minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, paddingHorizontal: tokens.spacing.xs, alignItems: 'center', justifyContent: 'center', borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.surface },
  choiceButton: { minHeight: tokens.size.touchMin, justifyContent: 'center', paddingHorizontal: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.surface },
  choiceButtonSelected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface },
  choiceLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary, fontWeight: '600' },
  choiceLabelSelected: { color: tokens.colors.primary },
  intervalControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.md },
  intervalValue: { ...tokens.typography.label, color: tokens.colors.textPrimary, minWidth: 40, textAlign: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
  copy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs / 2 },
});
