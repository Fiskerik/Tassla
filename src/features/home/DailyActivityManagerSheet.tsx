import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Crypto from 'expo-crypto';
import { BottomSheet, Button } from '../../components/ui';
import { MotionPressable } from '../../components/ui/Motion';
import { tokens } from '../../theme/tokens';
import type { DailyRoutine, DailyRoutineChecklistItem, DailyRoutineCreateInput, DailyRoutineDay, DailyRoutineDaySkip, DailyRoutineRepeatValues, DailyTrainingSelection } from './daily-activity-data';
import { dailyRoutineRepeatSummary, isoWeekdayForDateKey, type HomeDailyActivity } from './daily-activity-model';
import type { HomeDailyTrainingOption } from './HomeScreen';

type ActionResult = { status: 'saved' | 'failed' | 'unknown' } | void;

type RoutineDraft = {
  mode: 'create' | 'edit';
  submissionId: string;
  routineId: string | null;
  baseRevision: number | null;
  initialLabel: string;
  initialChecklist: DailyRoutineChecklistItem[];
  initialRepeat: DailyRoutineRepeatValues;
  anchorDate: string;
  newAnchorDate: string;
  label: string;
  checklist: DailyRoutineChecklistItem[];
  repeat: DailyRoutineRepeatValues;
};

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
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id && item.label === right[index]?.label);
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
    && checklist.every((item) => item.label.length > 0 && Array.from(item.label).length <= 160) && weekdaysValid;
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

export function DailyActivityManagerSheet({ visible, dailyScopeKey, onClose, focusRoutineId, editFocusedRoutineOnOpen = false, activities, routines, routineDaySkips, trainingOptions,
  busy, mutationMessage, mutationError, onRetryMutation, onCreateRoutine, onUpdateRoutine, onDeleteRoutine,
  onAddRoutineToDay, onRemoveRoutineFromDay, onAddTrainingToDay, onRemoveTrainingFromDay, onGoTraining }: {
  visible: boolean;
  dailyScopeKey?: string;
  onClose: () => void;
  focusRoutineId?: string | null;
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
}) {
  const [draft, setDraft] = useState<RoutineDraft | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const leaveAction = useRef<(() => void) | null>(null);
  const autoEditStarted = useRef(false);
  const selectedRoutines = new Map(activities.filter((item) => item.routineDay)
    .map((item) => [item.routineDay?.routine_id, item.routineDay as DailyRoutineDay]));
  const skippedRoutines = new Map(routineDaySkips.map((row) => [row.routine_id, row]));
  const selectedTraining = activities.filter((item) => item.kind === 'training' && item.trainingSelection);
  const focusedRoutine = routines.find((routine) => routine.id === focusRoutineId);
  const draftConfirmed = draft ? routineDraftHasReadback(draft, routines) : false;
  const activeDraft = draftConfirmed ? null : draft;
  const creating = activeDraft?.mode === 'create';
  const unresolvedMutation = busy || Boolean(mutationError && onRetryMutation);
  const selectionLocked = Boolean(activeDraft) || unresolvedMutation || showDiscardConfirmation;

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
    setDraft({ mode: 'create', submissionId: Crypto.randomUUID(), routineId: null, baseRevision: null,
      initialLabel: '', initialChecklist: [firstItem], initialRepeat: { repeat_unit: null, repeat_interval: null, repeat_weekdays: null }, anchorDate, newAnchorDate: anchorDate,
      label: '', checklist: [firstItem], repeat: { repeat_unit: null, repeat_interval: null, repeat_weekdays: null } });
  }

  const startEdit = useCallback((routine: DailyRoutine) => {
    if (selectionLocked) return;
    const checklist = copyChecklist(routine.checklist);
    const repeat = { repeat_unit: routine.repeat_unit, repeat_interval: routine.repeat_interval, repeat_weekdays: routine.repeat_weekdays };
    const newAnchorDate = localDateKeyToday();
    setDraft({ mode: 'edit', submissionId: Crypto.randomUUID(), routineId: routine.id, baseRevision: routine.checklist_revision,
      initialLabel: routine.label, initialChecklist: checklist, initialRepeat: repeat, anchorDate: routine.repeat_anchor_date ?? newAnchorDate, newAnchorDate,
      label: routine.label, checklist, repeat });
  }, [selectionLocked]);

  useEffect(() => {
    if (!visible || !editFocusedRoutineOnOpen || !focusedRoutine || autoEditStarted.current) return;
    autoEditStarted.current = true;
    startEdit(focusedRoutine);
  }, [visible, editFocusedRoutineOnOpen, focusedRoutine, startEdit]);

  function updateDraft(patch: Partial<Pick<RoutineDraft, 'label' | 'checklist' | 'repeat'>>) {
    setDraft((current) => current ? { ...current, ...patch } : current);
  }

  async function saveDraft() {
    if (!draft || !routineDraftIsValid(draft) || !routineDraftIsDirty(draft) || unresolvedMutation || savingDraft) return;
    const submissionId = draft.submissionId;
    const label = cleanRoutineLabel(draft.label);
    const checklist = cleanChecklist(draft.checklist);
    const repeat = { ...draft.repeat };
    setSavingDraft(true);
    try {
      const sourceRoutine = draft.mode === 'edit' ? routines.find((routine) => routine.id === draft.routineId) : null;
      const result = draft.mode === 'create'
        ? await onCreateRoutine?.({ id: submissionId, label, checklist, ...repeat })
        : sourceRoutine ? await onUpdateRoutine?.(sourceRoutine, label, checklist, repeat) : undefined;
      if (result?.status === 'saved') setDraft((current) => current?.submissionId === submissionId ? null : current);
    } finally {
      setSavingDraft(false);
    }
  }

  function closeSheet() {
    requestLeave(onClose);
  }

  function goToTraining() {
    requestLeave(() => { onClose(); onGoTraining(); });
  }

  return <BottomSheet visible={visible} title={focusedRoutine ? `Hantera ${focusedRoutine.label}` : 'Rutiner och aktiviteter'}
    onRequestClose={closeSheet} onPrimaryAction={activeDraft ? undefined : closeSheet} primaryLabel="Klar">
    {mutationMessage ? <View style={[styles.message, mutationError && styles.errorMessage]}>
      <Text accessibilityRole={mutationError ? 'alert' : undefined} style={[styles.body, mutationError && styles.errorText]}>{mutationMessage}</Text>
      {onRetryMutation ? <Button variant="tertiary" label="Kontrollera samma ändring igen" accessibilityLabel="Kontrollera samma ändring igen" disabled={busy} onPress={onRetryMutation} /> : null}
    </View> : null}
    {showDiscardConfirmation ? <View style={styles.discardConfirmation} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Text style={styles.sectionTitle} accessibilityRole="header">Kasta ändringar?</Text>
      <Text style={styles.body}>Dina osparade ändringar försvinner.</Text>
      <View style={styles.formActions}>
        <ActionButton icon="trash-outline" label="Kasta ändringar" accessibilityLabel="Kasta osparade ändringar"
          danger onPress={confirmDiscard} />
        <ActionButton icon="create-outline" label="Fortsätt redigera" accessibilityLabel="Fortsätt redigera"
          onPress={cancelDiscard} />
      </View>
    </View> : null}

    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Egna rutiner</Text>
        <IconOnlyButton icon="information-circle-outline" accessibilityLabel="Info om rutiner" onPress={() => setHelpOpen((open) => !open)} />
        <ActionButton icon="add-outline" label={creating ? 'Avbryt' : 'Skapa rutin'} accessibilityLabel={creating ? 'Avbryt skapa rutin' : 'Skapa en ny rutin'}
          disabled={unresolvedMutation || (Boolean(draft) && !creating)} onPress={() => creating ? requestLeave(() => setDraft(null)) : startCreate()} />
      </View>
      {helpOpen ? <Text style={styles.helpText}>Startar idag. Veckor följer valda veckodagar och månader datumet. Upprepade rutiner kan hoppas över idag. Malländringar gäller nästa gång; engångsrutiner tas bort från dagen.</Text> : null}
      {creating && activeDraft ? <CreateRoutineForm draft={activeDraft} disabled={unresolvedMutation || savingDraft || showDiscardConfirmation}
        onChange={updateDraft} onCancel={() => requestLeave(() => setDraft(null))} onSave={() => { void saveDraft(); }} /> : null}
      {routines.length > 0 ? <View style={styles.routineList}>
        {routines.map((routine, index) => <RoutineTemplateRow key={`${dailyScopeKey ?? ''}:${visible}:${focusRoutineId ?? 'all'}:${routine.id}`}
          routine={routine} selectedDay={selectedRoutines.get(routine.id) ?? null} skippedDay={skippedRoutines.get(routine.id) ?? null}
          draft={activeDraft?.mode === 'edit' && activeDraft.routineId === routine.id ? activeDraft : null}
          disabled={selectionLocked} fieldsDisabled={unresolvedMutation || savingDraft || showDiscardConfirmation}
          highlighted={routine.id === focusRoutineId} isLast={index === routines.length - 1}
          onStartEdit={() => startEdit(routine)} onChangeDraft={updateDraft}
          onCancelEdit={() => requestLeave(() => setDraft(null))} onSave={() => { void saveDraft(); }}
          onDelete={() => onDeleteRoutine?.(routine)}
          onAdd={() => onAddRoutineToDay?.(routine)}
          onRemove={() => {
            const row = selectedRoutines.get(routine.id);
            if (row) onRemoveRoutineFromDay?.(row, routine);
          }} />)}
      </View> : null}
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Valda träningssteg</Text>
      {selectedTraining.length === 0 ? <Text style={styles.muted}>Inget träningssteg valt idag.</Text> : selectedTraining.map((item) => <View key={item.id} style={styles.selectedRow}>
        <View style={styles.copy}>
          <Text style={styles.body}>{item.label}</Text>
          {item.programTitle ? <Text style={styles.muted}>{item.programTitle}</Text> : null}
        </View>
        <Button variant="tertiary" label="Ta bort idag" accessibilityLabel={`Ta bort ${item.label} från idag`} disabled={selectionLocked}
          onPress={() => item.trainingSelection && onRemoveTrainingFromDay?.(item.trainingSelection)} />
      </View>)}
      <Button variant="tertiary" label="Öppna Träning" accessibilityLabel="Öppna Träning" disabled={unresolvedMutation || showDiscardConfirmation} onPress={goToTraining} />
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Lägg till ett träningssteg</Text>
      {trainingOptions.length === 0 ? <Text style={styles.muted}>Inget nytt steg finns att välja just nu.</Text> : trainingOptions.map((option) => <View key={`${option.versionId}:${option.stepId}`} style={styles.optionRow}>
        <View style={styles.copy}>
          <Text style={styles.body}>{option.stepTitle}</Text>
          <Text style={styles.muted}>{option.programTitle}</Text>
        </View>
        <Button variant="tertiary" label="Lägg till" accessibilityLabel={`Lägg till ${option.stepTitle} för idag`} disabled={selectionLocked}
          onPress={() => onAddTrainingToDay?.(option)} />
      </View>)}
    </View>
  </BottomSheet>;
}

function CreateRoutineForm({ draft, disabled, onChange, onCancel, onSave }: {
  draft: RoutineDraft;
  disabled: boolean;
  onChange: (patch: Partial<Pick<RoutineDraft, 'label' | 'checklist' | 'repeat'>>) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const valid = routineDraftIsValid(draft);
  const editable = !disabled;
  return <View style={styles.formCard}>
    <Text style={styles.formHeading} accessibilityRole="header">Ny rutin</Text>
    <TextInput accessibilityLabel="Namn på rutin" placeholder="Namn på rutin" value={draft.label} onChangeText={(label) => onChange({ label })}
      editable={editable} maxLength={160} returnKeyType="done" style={styles.input} />
    <Text style={styles.sectionTitle} accessibilityRole="header">Checklista</Text>
    {draft.checklist.map((item, index) => <View key={item.id} style={styles.createItemRow}>
      <TextInput accessibilityLabel={`Checklistepunkt ${index + 1}`} placeholder={`Punkt ${index + 1}`} value={item.label}
        onChangeText={(value) => onChange({ checklist: draft.checklist.map((entry) => entry.id === item.id ? { ...entry, label: value } : entry) })}
        editable={editable} maxLength={160} returnKeyType="done" style={[styles.input, styles.itemInput]} />
      <IconOnlyButton icon="remove-outline" accessibilityLabel={`Ta bort checklistepunkt ${index + 1}`}
        disabled={disabled || draft.checklist.length <= 1} onPress={() => onChange({ checklist: draft.checklist.filter((entry) => entry.id !== item.id) })} />
    </View>)}
    {draft.checklist.length >= 50 ? <Text style={styles.muted}>En rutin kan ha högst 50 punkter.</Text> : <IconOnlyButton icon="add-outline" accessibilityLabel="Lägg till checklistepunkt sist"
      disabled={disabled} onPress={() => { const item = { id: Crypto.randomUUID(), label: '' }; onChange({ checklist: [...draft.checklist, item] }); }} />}
    <RepeatRuleControls value={draft.repeat} anchorDate={draft.anchorDate} newAnchorDate={draft.newAnchorDate}
      onChange={(repeat) => onChange({ repeat })} disabled={disabled} />
    <View style={styles.formActions}>
      <Button variant="primary" label="Spara rutin" accessibilityLabel="Spara rutin" disabled={!valid || !routineDraftIsDirty(draft) || disabled} onPress={onSave} />
      <Button variant="tertiary" label="Avbryt" accessibilityLabel="Avbryt skapa rutin" disabled={disabled} onPress={onCancel} />
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

function RoutineTemplateRow({ routine, selectedDay, skippedDay, draft, disabled, fieldsDisabled, highlighted, isLast,
  onStartEdit, onChangeDraft, onCancelEdit, onSave, onDelete, onAdd, onRemove }: {
  routine: DailyRoutine;
  selectedDay: DailyRoutineDay | null;
  skippedDay: DailyRoutineDaySkip | null;
  draft: RoutineDraft | null;
  disabled: boolean;
  fieldsDisabled: boolean;
  highlighted: boolean;
  isLast: boolean;
  onStartEdit: () => void;
  onChangeDraft: (patch: Partial<Pick<RoutineDraft, 'label' | 'checklist' | 'repeat'>>) => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => Promise<ActionResult> | undefined;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const stackRoutineActions = width < 360 || fontScale >= 1.25;
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
    {(value?.checklist ?? routine.checklist).map((item, index) => <View key={item.id} style={styles.editItemRow}>
      {editing && value ? <TextInput accessibilityLabel={`Checklistepunkt ${index + 1}`} value={item.label}
        onChangeText={(label) => onChangeDraft({ checklist: value.checklist.map((entry) => entry.id === item.id ? { ...entry, label } : entry) })}
        editable={!fieldsDisabled} maxLength={160} returnKeyType="done" style={[styles.input, styles.itemInput]} />
        : <View style={styles.itemRow}>
          <View style={styles.bullet} accessibilityElementsHidden><Ionicons name="ellipse" size={tokens.spacing.xs} color={tokens.colors.primary} /></View>
          <Text style={styles.itemLabel}>{item.label}</Text>
        </View>}
      {editing && value ? <IconOnlyButton icon="remove-outline" accessibilityLabel={`Ta bort checklistepunkt ${index + 1}: ${item.label || 'utan namn'}`}
        disabled={fieldsDisabled || value.checklist.length <= 1} onPress={() => onChangeDraft({ checklist: value.checklist.filter((entry) => entry.id !== item.id) })} /> : null}
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
        <Button variant="tertiary" label="Avbryt" accessibilityLabel={`Avbryt ändring av ${routine.label}`}
          disabled={fieldsDisabled} onPress={onCancelEdit} />
      </View>
    </> : <View style={styles.scheduleSummaryRow}>
      <Text style={styles.repeatSummary}>{dailyRoutineRepeatSummary(routine)}</Text>
    </View>}
    <View style={[styles.routineActions, stackRoutineActions && styles.routineActionsStacked]}>
      <ActionButton icon={selected ? 'remove-outline' : 'add-outline'} label={selected ? 'Ta bort från Hemskärmen' : 'Lägg till på Hemskärmen'}
        accessibilityLabel={`${selected ? 'Ta bort' : skippedDay ? 'Lägg tillbaka' : 'Lägg till'} rutinen ${routine.label} ${selected ? 'från' : 'på'} Hemskärmen`}
        disabled={disabled} onPress={selected ? onRemove : onAdd} dayAction responsiveRow stacked={stackRoutineActions} />
      <ActionButton icon="trash-outline" label="Ta bort rutin" accessibilityLabel={`Ta bort rutin ${routine.label}`}
        disabled={disabled} danger responsiveRow stacked={stackRoutineActions} onPress={() => Alert.alert('Ta bort rutin?', `Rutinen ”${routine.label}” och alla dess dagskopior och sparade överhoppningar tas bort.`, [
          { text: 'Avbryt', style: 'cancel' }, { text: 'Ta bort rutin', style: 'destructive', onPress: () => { void onDelete(); } },
        ])} />
    </View>
  </View>;
}

function ActionButton({ icon, label, accessibilityLabel, disabled = false, onPress, dayAction = false, danger = false, quiet = false, responsiveRow = false, stacked = false }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: () => void;
  dayAction?: boolean;
  danger?: boolean;
  quiet?: boolean;
  responsiveRow?: boolean;
  stacked?: boolean;
}) {
  return <MotionPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionButton, dayAction && styles.actionButtonDay,
      responsiveRow && styles.routineActionButton, stacked && styles.routineActionButtonStacked,
      danger && styles.actionButtonDanger, quiet && styles.actionButtonQuiet, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
    <Ionicons name={icon} size={tokens.size.iconSm} color={danger ? tokens.colors.danger : tokens.colors.primary} accessibilityElementsHidden />
    <Text style={[styles.actionButtonText, dayAction && styles.actionButtonDayText, danger && styles.actionButtonDangerText]}>{label}</Text>
  </MotionPressable>;
}

function IconOnlyButton({ icon, accessibilityLabel, disabled = false, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return <MotionPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.iconOnlyButton, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
    <Ionicons name={icon} size={tokens.size.iconMd} color={tokens.colors.primary} accessibilityElementsHidden />
  </MotionPressable>;
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
  discardConfirmation: { gap: tokens.spacing.xs, padding: tokens.spacing.sm, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.danger, backgroundColor: tokens.colors.surface },
  formActions: { gap: tokens.spacing.xs },
  input: { minHeight: tokens.size.touchMin, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, paddingHorizontal: tokens.spacing.sm, color: tokens.colors.textPrimary, backgroundColor: tokens.colors.surface },
  itemInput: { flex: 1 },
  createItemRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: tokens.spacing.xs },
  routineList: { overflow: 'hidden', borderRadius: tokens.radius.md, backgroundColor: tokens.colors.home.card },
  routineGroup: { gap: tokens.spacing.xs, padding: tokens.spacing.md },
  routineGroupSeparator: { borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  highlightedRoutineGroup: { backgroundColor: tokens.colors.home.canvas },
  routineHeading: { minHeight: tokens.size.touchMin, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: tokens.spacing.xs },
  routineName: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
  routineNameInput: { flex: 1 },
  listHeading: { ...tokens.typography.caption, color: tokens.colors.textSecondary, fontWeight: '700', paddingTop: tokens.spacing.xs },
  itemRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  editItemRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  bullet: { width: tokens.size.touchMin / 2, alignItems: 'center' },
  itemLabel: { ...tokens.typography.caption, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
  itemActions: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs },
  inlineEditor: { gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs },
  routineActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: tokens.spacing.xs, paddingTop: tokens.spacing.xs },
  routineActionsStacked: { flexDirection: 'column' },
  routineActionButton: { flex: 1, flexBasis: '45%', minWidth: tokens.size.touchMin },
  routineActionButtonStacked: { flex: 0, flexBasis: 'auto', alignSelf: 'stretch' },
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
  actionButtonDay: { flex: 2, borderColor: tokens.colors.selectedSurface, backgroundColor: tokens.colors.selectedSurface },
  actionButtonDanger: { borderColor: tokens.colors.danger, backgroundColor: tokens.colors.surface },
  actionButtonQuiet: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', borderColor: 'transparent', backgroundColor: 'transparent', paddingHorizontal: tokens.spacing.xs },
  actionButtonText: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  actionButtonDayText: { color: tokens.colors.primary },
  actionButtonDangerText: { color: tokens.colors.danger },
  disabled: { opacity: 0.5 },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
  optionRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.xs },
  selectedRow: { gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs, borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  copy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs / 2 },
});
