import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Crypto from 'expo-crypto';
import { BottomSheet, Button, Dialog } from '../../components/ui';
import { ThemedIcon } from '../../components/ui/ThemedIcon';
import { MotionPressable } from '../../components/ui/Motion';
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

export function DailyActivityManagerSheet({ visible, dailyScopeKey, onClose, focusRoutineId, focusRoutineItemId, editFocusedRoutineOnOpen = false, activities, routines, routineDaySkips, trainingOptions,
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
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
  const routinesForDisplay = draftSource && !visibleRoutines.some((routine) => routine.id === draftSource.id)
    ? [...visibleRoutines, draftSource] : visibleRoutines;
  const focusedRoutine = routinesForDisplay.find((routine) => routine.id === (focusRoutineId ?? draft?.routineId));
  const draftHasConflict = routineConflictForDraft(draft, routineConflict, dailyScopeKey ?? '');
  const draftConfirmed = draft && !draftHasConflict ? routineDraftHasReadback(draft, routines) : false;
  const activeDraft = draftConfirmed ? null : draft;
  const conflictForDraft = draftHasConflict;
  const creating = activeDraft?.mode === 'create';
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

  return <>
    <BottomSheet visible={visible} title={focusedRoutine ? `Hantera ${focusedRoutine.label}` : 'Rutiner och aktiviteter'}
    onRequestClose={closeSheet} onPrimaryAction={activeDraft ? undefined : closeSheet} primaryLabel="Klar">
    {showMutationMessage ? <View style={[styles.message, (mutationError || Boolean(conflictForDraft)) && styles.errorMessage]}>
      <Text accessibilityRole={mutationError || conflictForDraft ? 'alert' : undefined} style={[styles.body, (mutationError || Boolean(conflictForDraft)) && styles.errorText]}>{visibleMutationMessage}</Text>
      {onRetryMutation ? <Button variant="tertiary" label="Kontrollera samma ändring igen" accessibilityLabel="Kontrollera samma ändring igen" disabled={busy} onPress={onRetryMutation} /> : null}
      {conflictForDraft ? <Button variant="tertiary" label="Ersätt utkastet med senaste versionen" accessibilityLabel="Ersätt utkastet med senaste versionen"
        disabled={busy || savingDraft} onPress={replaceDraftWithLatestRoutine} /> : null}
    </View> : null}
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle} accessibilityRole="header">{upcomingRoutineOnly ? 'Återkommande rutin' : focusedRoutineOnly ? 'Rutin' : 'Egna rutiner'}</Text>
        {!upcomingRoutineOnly && !focusedRoutineOnly ? <>
          <IconOnlyButton icon="information-circle-outline" accessibilityLabel="Info om rutiner" onPress={() => setHelpOpen((open) => !open)} />
          {!creating ? <ActionButton icon="add-outline" label="Skapa rutin" accessibilityLabel="Skapa en ny rutin"
            disabled={unresolvedMutation || Boolean(draft)} onPress={startCreate} /> : null}
        </> : null}
      </View>
      {helpOpen && !upcomingRoutineOnly && !focusedRoutineOnly ? <Text style={styles.helpText}>Startar idag. Veckor följer valda veckodagar och månader datumet. Upprepade rutiner kan hoppas över idag. Malländringar gäller nästa gång; engångsrutiner tas bort från dagen.</Text> : null}
      {creating && activeDraft ? <CreateRoutineForm draft={activeDraft} disabled={unresolvedMutation || savingDraft || showDiscardConfirmation}
        iconPickerItemId={iconPickerItemId} onToggleIconPicker={(itemId) => setIconPickerItemId((current) => current === itemId ? null : itemId)}
        onSelectChecklistIcon={selectChecklistIcon} onChange={updateDraft} onSave={() => { void saveDraft(); }} /> : null}
      {routinesForDisplay.length > 0 ? <View style={styles.routineList}>
        {routinesForDisplay.map((routine, index) => <RoutineTemplateRow key={`${dailyScopeKey ?? ''}:${visible}:${focusRoutineId ?? 'all'}:${routine.id}`}
          routine={routine} selectedDay={selectedRoutines.get(routine.id) ?? null} skippedDay={skippedRoutines.get(routine.id) ?? null}
          draft={activeDraft?.mode === 'edit' && activeDraft.routineId === routine.id ? activeDraft : null}
          iconPickerItemId={iconPickerItemId} onToggleIconPicker={(itemId) => setIconPickerItemId((current) => current === itemId ? null : itemId)}
          onSelectChecklistIcon={selectChecklistIcon}
          disabled={selectionLocked} fieldsDisabled={unresolvedMutation || savingDraft || showDiscardConfirmation || Boolean(conflictForDraft)}
          highlighted={routine.id === focusRoutineId} isLast={index === visibleRoutines.length - 1} hideDayActions={upcomingRoutineOnly}
          onStartEdit={() => startEdit(routine)} onChangeDraft={updateDraft}
          onSave={() => { void saveDraft(); }}
          onDelete={() => onDeleteRoutine?.(routine)}
          onAdd={() => onAddRoutineToDay?.(routine)}
          onRemove={() => {
            const row = selectedRoutines.get(routine.id);
            if (row) onRemoveRoutineFromDay?.(row, routine);
          }} />)}
      </View> : null}
    </View>

    {!upcomingRoutineOnly && !focusedRoutineOnly ? <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Valda träningssteg</Text>
      {selectedTraining.length === 0 ? <Text style={styles.muted}>Inget träningssteg valt idag.</Text> : selectedTraining.map((item) => <View key={item.id} style={styles.selectedRow}>
        <View style={styles.copy}>
          <Text style={styles.body}>{item.label}</Text>
          {item.programTitle ? <Text style={styles.muted}>{item.programTitle}</Text> : null}
        </View>
        <Button variant="icon" iconName="remove-outline" label="Ta bort idag" accessibilityLabel={`Ta bort ${item.label} från idag`} disabled={selectionLocked}
          onPress={() => item.trainingSelection && onRemoveTrainingFromDay?.(item.trainingSelection)} />
      </View>)}
      <Button variant="tertiary" label="Öppna Träning" accessibilityLabel="Öppna Träning" disabled={unresolvedMutation || showDiscardConfirmation} onPress={goToTraining} />
    </View> : null}

    {!upcomingRoutineOnly && !focusedRoutineOnly ? <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Lägg till ett träningssteg</Text>
      {trainingOptions.length === 0 ? <Text style={styles.muted}>Inget nytt steg finns att välja just nu.</Text> : trainingOptions.map((option) => <View key={`${option.versionId}:${option.stepId}`} style={styles.optionRow}>
        <View style={styles.copy}>
          <Text style={styles.body}>{option.stepTitle}</Text>
          <Text style={styles.muted}>{option.programTitle}</Text>
        </View>
        <Button variant="tertiary" label="Lägg till" accessibilityLabel={`Lägg till ${option.stepTitle} för idag`} disabled={selectionLocked}
          onPress={() => onAddTrainingToDay?.(option)} />
      </View>)}
    </View> : null}
    </BottomSheet>
    <Dialog visible={showDiscardConfirmation} title="Kasta ändringar?" onRequestClose={cancelDiscard} onConfirm={confirmDiscard}
      confirmLabel="Kasta" cancelLabel="Fortsätt redigera" confirmVariant="destructive" compactActions>
      <Text style={styles.body}>Dina osparade ändringar försvinner.</Text>
    </Dialog>
  </>;
}

function CreateRoutineForm({ draft, disabled, iconPickerItemId, onToggleIconPicker, onSelectChecklistIcon, onChange, onSave }: {
  draft: RoutineDraft;
  disabled: boolean;
  iconPickerItemId: string | null;
  onToggleIconPicker: (itemId: string) => void;
  onSelectChecklistIcon: (itemId: string, icon: DailyRoutineChecklistIcon) => void;
  onChange: (patch: Partial<Pick<RoutineDraft, 'label' | 'checklist' | 'repeat'>>) => void;
  onSave: () => void;
}) {
  const valid = routineDraftIsValid(draft);
  const editable = !disabled;
  return <View style={styles.formCard}>
    <Text style={styles.formHeading} accessibilityRole="header">Ny rutin</Text>
    <TextInput accessibilityLabel="Namn på rutin" placeholder="Namn på rutin" value={draft.label} onChangeText={(label) => onChange({ label })}
      editable={editable} maxLength={160} returnKeyType="done" style={styles.input} />
    <Text style={styles.sectionTitle} accessibilityRole="header">Checklista</Text>
    {draft.checklist.map((item, index) => <View key={item.id} style={styles.checklistEditorGroup}>
      <View style={styles.createItemRow}>
        <TextInput accessibilityLabel={`Checklistepunkt ${index + 1}`} placeholder={`Punkt ${index + 1}`} value={item.label}
          onChangeText={(value) => onChange({ checklist: draft.checklist.map((entry) => entry.id === item.id ? { ...entry, label: value } : entry) })}
          editable={editable} maxLength={160} returnKeyType="done" style={[styles.input, styles.itemInput]} />
        <ChecklistIconPickerTrigger value={item.icon ?? null} label={item.label || `checklistepunkt ${index + 1}`}
          expanded={iconPickerItemId === item.id} disabled={disabled} testIDPrefix="routine" itemKey={item.id}
          onToggle={() => onToggleIconPicker(item.id)} />
        <IconOnlyButton icon="trash-outline" accessibilityLabel={`Ta bort checklistepunkt ${index + 1}`}
          disabled={disabled || draft.checklist.length <= 1} onPress={() => onChange({ checklist: draft.checklist.filter((entry) => entry.id !== item.id) })} />
      </View>
      <ChecklistIconPickerChoices value={item.icon ?? null} label={item.label || `checklistepunkt ${index + 1}`}
        expanded={iconPickerItemId === item.id} disabled={disabled} testIDPrefix="routine"
        onSelect={(icon) => onSelectChecklistIcon(item.id, icon)} />
    </View>)}
    {draft.checklist.length >= 50 ? <Text style={styles.muted}>En rutin kan ha högst 50 punkter.</Text> : <IconOnlyButton icon="add-outline" accessibilityLabel="Lägg till checklistepunkt sist"
      disabled={disabled} onPress={() => { const item = { id: Crypto.randomUUID(), label: '' }; onChange({ checklist: [...draft.checklist, item] }); }} />}
    <RepeatRuleControls value={draft.repeat} anchorDate={draft.anchorDate} newAnchorDate={draft.newAnchorDate}
      onChange={(repeat) => onChange({ repeat })} disabled={disabled} />
    <View style={styles.formActions}>
      <Button variant="primary" label="Spara rutin" accessibilityLabel="Spara rutin" disabled={!valid || !routineDraftIsDirty(draft) || disabled} onPress={onSave} />
    </View>
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
    <Text style={styles.listHeading} accessibilityRole="header">Upprepning</Text>
    <View style={styles.repeatChoices}>
      <ChoiceButton label="Aldrig" selected={never} disabled={disabled} onPress={() => onChange({ repeat_unit: null, repeat_interval: null, repeat_weekdays: null })} />
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
  onStartEdit, onChangeDraft, onSave, onDelete, onAdd, onRemove }: {
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
  onSave: () => void;
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
          <TextInput accessibilityLabel={`Checklistepunkt ${index + 1}`} value={item.label}
            onChangeText={(label) => onChangeDraft({ checklist: value.checklist.map((entry) => entry.id === item.id ? { ...entry, label } : entry) })}
            editable={!fieldsDisabled} maxLength={160} returnKeyType="done" style={[styles.input, styles.itemInput]} />
          <ChecklistIconPickerTrigger value={item.icon ?? null} label={item.label || `checklistepunkt ${index + 1}`}
            expanded={iconPickerItemId === item.id} disabled={fieldsDisabled} testIDPrefix="routine" itemKey={item.id}
            onToggle={() => onToggleIconPicker(item.id)} />
          <IconOnlyButton icon="trash-outline" accessibilityLabel={`Ta bort checklistepunkt ${index + 1}: ${item.label || 'utan namn'}`}
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
      <RepeatRuleControls value={value.repeat} anchorDate={value.anchorDate} newAnchorDate={value.newAnchorDate}
        onChange={(repeat) => onChangeDraft({ repeat })} disabled={fieldsDisabled} />
      <View style={styles.formActions}>
        <Button variant="primary" label="Spara rutin" accessibilityLabel={`Spara rutin ${routine.label}`}
          disabled={!routineDraftIsValid(value) || !routineDraftIsDirty(value) || fieldsDisabled} onPress={onSave} />
      </View>
    </> : <View style={styles.scheduleSummaryRow}>
      <Text style={styles.repeatSummary}>{dailyRoutineRepeatSummary(routine)}</Text>
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

function ActionButton({ icon, label, accessibilityLabel, disabled = false, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return <MotionPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionButton, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
    <Ionicons name={icon} size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden />
    <Text style={styles.actionButtonText}>{label}</Text>
  </MotionPressable>;
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
  section: { gap: tokens.spacing.sm, paddingTop: tokens.spacing.sm, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  sectionHeading: { minHeight: tokens.size.touchMin, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  sectionTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  formHeading: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  body: { ...tokens.typography.caption, color: tokens.colors.textPrimary, flexShrink: 1 },
  muted: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 },
  helpText: { ...tokens.typography.caption, color: tokens.colors.textSecondary, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.home.canvas },
  helper: { ...tokens.typography.caption, color: tokens.colors.textSecondary, paddingLeft: tokens.spacing.sm },
  message: { gap: tokens.spacing.xs, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.selectedSurface },
  errorMessage: { backgroundColor: tokens.colors.dangerSurface },
  errorText: { color: tokens.colors.danger },
  formCard: { gap: tokens.spacing.sm, padding: tokens.spacing.sm, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.home.canvas },
  formActions: { gap: tokens.spacing.xs },
  input: { minHeight: tokens.size.touchMin, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, paddingHorizontal: tokens.spacing.sm, color: tokens.colors.textPrimary, backgroundColor: tokens.colors.surface },
  itemInput: { flex: 1 },
  createItemRow: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: tokens.spacing.xs },
  checklistEditorGroup: { gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  routineList: { overflow: 'hidden', borderRadius: tokens.radius.md, backgroundColor: tokens.colors.home.card },
  routineGroup: { gap: tokens.spacing.xs, padding: tokens.spacing.md },
  routineGroupSeparator: { borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  highlightedRoutineGroup: { backgroundColor: tokens.colors.home.canvas },
  routineHeading: { minHeight: tokens.size.touchMin, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: tokens.spacing.xs },
  routineName: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
  routineNameInput: { flex: 1 },
  listHeading: { ...tokens.typography.caption, color: tokens.colors.textSecondary, fontWeight: '700', paddingTop: tokens.spacing.xs },
  itemRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  editItemRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  itemLabel: { ...tokens.typography.caption, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
  itemActions: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs },
  inlineEditor: { gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs },
  routineActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: tokens.spacing.xs, paddingTop: tokens.spacing.xs },
  routineIconAction: { borderWidth: tokens.size.stroke, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.surface },
  routineIconActionDay: { borderColor: tokens.colors.selectedSurface, backgroundColor: tokens.colors.selectedSurface },
  routineIconActionDanger: { borderColor: tokens.colors.danger },
  scheduleSummaryRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, paddingTop: tokens.spacing.xs },
  repeatSummary: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flex: 1 },
  scheduleEdit: { gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs },
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
  iconOnlyButton: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.sm },
  actionButton: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.sm, borderRadius: tokens.radius.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  actionButtonText: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
  optionRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.xs },
  selectedRow: { gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs, borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  copy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs / 2 },
});
