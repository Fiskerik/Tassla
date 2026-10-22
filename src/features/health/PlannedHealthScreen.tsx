import { useEffect, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, findNodeHandle, Image, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DatePickerField, InfoModal, MessageCard, PageHeading, PrimaryButton, QuietButton, TimePickerField } from '../../components/AppPrimitives';
import { Toast } from '../../components/ui/Toast';
import { IconChip } from '../../components/ui/IconChip';
import { tokens } from '../../theme/tokens';
import {
  isValidPlannedHealthDate,
  normalizePlannedHealthDescription,
  type PlannedHealthRecord,
  type PlannedHealthType,
} from '../../data/workspace-data';
import { createLocalFireTime } from '../../notifications/notification-model';
import { localDate } from '../onboarding/dog';
import {
  EMPTY_PLANNED_HEALTH_FEEDBACK,
  feedbackTimeoutMillis,
  initialPlannedHealthStatus,
  reducePlannedHealthFeedback,
  selectPlannedHealthRecovery,
} from './planned-health-feedback';
import { parsePlannedHealthTime } from './planned-health-time';

type LoadState = 'loading' | 'ready' | 'error';

export function PlannedHealthScreen({
  onBack,
  backLabel = 'Hälsa',
  records,
  checklistFocusState = 'idle',
  checklistFocusRecord = null,
  onRetryChecklistFocus,
  loadState,
  busy = false,
  pending = false,
  statusMessage = '',
  statusError = false,
  reminderSummary = '',
  conflict,
  onRetry,
  onResolveConflict,
  onSave,
  onDelete,
}: {
  onBack: () => void;
  backLabel?: string;
  records: readonly PlannedHealthRecord[];
  checklistFocusState?: 'idle' | 'loading' | 'ready' | 'error' | 'missing';
  checklistFocusRecord?: PlannedHealthRecord | null;
  onRetryChecklistFocus?: () => void;
  loadState: LoadState;
  busy?: boolean;
  pending?: boolean;
  statusMessage?: string;
  statusError?: boolean;
  reminderSummary?: string;
  conflict?: { current: PlannedHealthRecord | null } | null;
  onRetry: () => void;
  onResolveConflict: () => void;
  onSave: (id: string | null, type: PlannedHealthType, dueOn: string, note: string, reminderEnabled: boolean, reminderMinutes: number | null, dueTime: string | null) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<PlannedHealthType>('vaccination');
  const [dueOn, setDueOn] = useState(localDate());
  const [dueTime, setDueTime] = useState('');
  const [note, setNote] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [formError, setFormError] = useState('');
  const [infoVisible, setInfoVisible] = useState(false);
  const [feedbackState, dispatchFeedback] = useReducer(reducePlannedHealthFeedback, EMPTY_PLANNED_HEALTH_FEEDBACK);
  const [feedbackTimeout, setFeedbackTimeout] = useState(2500);
  const [timedFeedbackMessage, setTimedFeedbackMessage] = useState<string | null>(null);
  const infoButtonRef = useRef<View>(null);
  const infoWasVisible = useRef(false);
  const previousStatusMessage = useRef<string | null>(initialPlannedHealthStatus(statusMessage));
  const today = localDate();
  const blocked = busy || pending;
  const editingRecord = records.find((record) => record.id === editingId) ?? null;
  const recovery = selectPlannedHealthRecovery({ conflict: Boolean(conflict), pending, statusError, loadError: loadState === 'error' });
  const recordsForView = checklistFocusState === 'ready' && checklistFocusRecord
    ? [checklistFocusRecord, ...records.filter((record) => record.id !== checklistFocusRecord.id)] : records;
  const focusedChecklistRecord = checklistFocusState === 'ready' ? checklistFocusRecord : null;
  const remainingRecords = focusedChecklistRecord
    ? recordsForView.filter((record) => record.id !== focusedChecklistRecord.id) : recordsForView;

  useEffect(() => {
    if (editingId === null || editingRecord !== null) return;
    const timer = setTimeout(() => {
      setEditingId(null);
      setType('vaccination');
      setDueOn(localDate());
      setDueTime('');
      setNote('');
      setReminderEnabled(false);
      setReminderTime('09:00');
      setFormError('');
      Keyboard.dismiss();
    }, 0);
    return () => clearTimeout(timer);
  }, [editingId, editingRecord]);

  useEffect(() => {
    const normalized = statusMessage.trim() ? statusMessage : null;
    if (normalized === previousStatusMessage.current) return;
    previousStatusMessage.current = normalized;
    dispatchFeedback({ type: 'status', message: statusMessage, infoVisible });
  }, [statusMessage, infoVisible]);

  useEffect(() => {
    const dismissed = infoWasVisible.current && !infoVisible;
    infoWasVisible.current = infoVisible;
    if (!dismissed || Platform.OS !== 'android') return;
    const frame = requestAnimationFrame(() => {
      dispatchFeedback({ type: 'info-closed' });
      const handle = findNodeHandle(infoButtonRef.current);
      if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
    });
    return () => cancelAnimationFrame(frame);
  }, [infoVisible]);

  useEffect(() => {
    const activeMessage = feedbackState.activeMessage;
    if (!activeMessage || infoVisible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimedFeedbackMessage(null);
      return;
    }
    let cancelled = false;
    const getRecommendedTimeout = async () => {
      let recommended: number | null | undefined;
      try {
        if (typeof AccessibilityInfo.getRecommendedTimeoutMillis === 'function') {
          recommended = await AccessibilityInfo.getRecommendedTimeoutMillis(2500);
        }
      } catch {
        recommended = undefined;
      }
      if (cancelled) return;
      setFeedbackTimeout(feedbackTimeoutMillis(recommended, 2500));
      setTimedFeedbackMessage(activeMessage);
    };
    void getRecommendedTimeout();
    return () => { cancelled = true; };
  }, [feedbackState.activeMessage, infoVisible]);

  function resetForm() {
    setEditingId(null);
    setType('vaccination');
    setDueOn(localDate());
    setDueTime('');
    setNote('');
    setReminderEnabled(false);
    setReminderTime('09:00');
    setFormError('');
    Keyboard.dismiss();
  }

  function edit(record: PlannedHealthRecord) {
    setEditingId(record.id);
    setType(record.event_type);
    setDueOn(record.due_on);
    setDueTime(record.due_time?.slice(0, 5) ?? '');
    setNote(record.description ?? '');
    setReminderEnabled(record.reminder_enabled);
    setReminderTime(formatTime(record.reminder_minutes ?? 9 * 60));
    setFormError('');
  }

  async function save() {
    setFormError('');
    const normalizedDate = dueOn.trim();
    if (!isValidPlannedHealthDate(normalizedDate, today) && normalizedDate !== editingRecord?.due_on) {
      setFormError('Ange ett giltigt datum som är idag eller senare. En redan passerad plan kan rättas utan att ändra datumet.');
      return;
    }
    const normalizedNote = normalizePlannedHealthDescription(note);
    if (normalizedNote === undefined) {
      setFormError('Anteckningen får innehålla högst 500 tecken.');
      return;
    }
    const minutes = parsePlannedHealthTime(reminderTime);
    if (reminderEnabled && minutes === null) {
      setFormError('Ange en giltig påminnelsetid mellan 00:00 och 23:59.');
      return;
    }
    const eventMinutes = parsePlannedHealthTime(dueTime);
    if (dueTime.trim() && eventMinutes === null) {
      setFormError('Ange en giltig händelsetid mellan 00:00 och 23:59.');
      return;
    }
    if (await onSave(editingId, type, normalizedDate, normalizedNote ?? '', reminderEnabled, reminderEnabled ? minutes : null, dueTime.trim() || null)) resetForm();
  }

  function confirmDelete(record: PlannedHealthRecord) {
    Alert.alert('Ta bort plan?', `${typeLabel(record.event_type)} tas bort från listan över planerade hälsohändelser.`, [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Ta bort', style: 'destructive', onPress: () => { void deleteRecord(record); } },
    ]);
  }

  async function deleteRecord(record: PlannedHealthRecord) {
    if (await onDelete(record.id) && editingId === record.id) resetForm();
  }

  function acceptConflict() {
    resetForm();
    onResolveConflict();
  }

  function closeInfo() {
    setInfoVisible(false);
  }

  function restoreInfoFocus() {
    const handle = findNodeHandle(infoButtonRef.current);
    if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
  }

  function finishInfoDismissal() {
    dispatchFeedback({ type: 'info-closed' });
    restoreInfoFocus();
  }

  function renderRecord(record: PlannedHealthRecord, openedFromChecklist = false) {
    const timing = record.due_on < today ? 'Passerat datum' : record.due_on === today ? 'Idag' : 'Kommande';
    const reminderText = reminderLabel(record.reminder_enabled, record.due_on, record.reminder_minutes);
    return <View key={record.id} style={styles.recordCard}>
      {openedFromChecklist ? <Text accessibilityRole="text" style={styles.sourceContext}>Öppnad från Checklistan</Text> : null}
      <View style={styles.recordHeading}>
        <View style={styles.recordType}>
          <IconChip category={record.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} />
          <Text style={styles.recordTitle}>{typeLabel(record.event_type)}</Text>
        </View>
        <Text style={[styles.timingLabel, record.due_on < today && styles.overdueLabel]}>{timing.toUpperCase()}</Text>
      </View>
      <Text style={styles.recordDate}>{record.due_on}</Text>
      {record.due_time ? <Text style={styles.reminderRow}>Tid {record.due_time.slice(0, 5)}</Text> : null}
      {record.description ? <Text style={styles.recordNote}>{record.description}</Text> : null}
      {reminderText ? <Text style={styles.reminderRow}>{reminderText}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={`Åtgärder för ${typeLabel(record.event_type)} ${record.due_on}`}
        accessibilityState={{ disabled: blocked }} disabled={blocked}
        onPress={() => Alert.alert('Åtgärder', undefined, buildPlannedHealthActionButtons(
          () => { if (!blocked) edit(record); },
          () => { if (!blocked) confirmDelete(record); },
        ))}
        style={({ pressed }) => [styles.actionsButton, pressed && !blocked && styles.actionsButtonPressed]}>
        <Ionicons name="ellipsis-horizontal" size={tokens.size.iconMd} color={blocked ? tokens.colors.textSecondary : tokens.colors.textPrimary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </Pressable>
    </View>;
  }

  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Tillbaka till ${backLabel}`} accessibilityState={{ disabled: busy }} disabled={busy}
      onPress={onBack} style={({ pressed }) => [styles.backAction, pressed && !busy && styles.actionPressed]}>
      <Ionicons name="chevron-back" size={tokens.size.iconMd} color={tokens.colors.textPrimary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <Text style={styles.backLabel}>{backLabel}</Text>
    </Pressable>
    <PageHeading title="Planerade hälsohändelser" description="Egna planer för vaccinationer och veterinärbesök." />
    <View style={styles.heroCard}>
      <View style={styles.heroIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="calendar-outline" size={tokens.size.iconMd} color={tokens.colors.support.plannedHealth.fg} />
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.description}>Planerad – inte genomförd.</Text>
      </View>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.infoHint}>Information om planerna</Text>
      <Pressable ref={infoButtonRef} accessibilityRole="button" accessibilityLabel="Visa information om planerade hälsohändelser" onPress={() => {
        dispatchFeedback({ type: 'info-opened' });
        setInfoVisible(true);
      }} style={styles.infoButton}>
        <Ionicons name="information-circle-outline" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        <Text style={styles.infoButtonText}>Läs information</Text>
      </Pressable>
    </View>
    <InfoModal visible={infoVisible} title="Om planerade hälsohändelser" onClose={closeInfo} onDismiss={finishInfoDismissal}>
      <Text style={styles.infoBody}>Planerna är ägarregistrerade och är inte en verifierad journal eller vårdrekommendation. Genomförda händelser läggs separat i hälsans historik.</Text>
      <Text style={styles.infoBody}>Datum som passerat ligger kvar som planerade tills du själv ändrar eller tar bort dem. Lokala påminnelser är frivilliga och styrs även av enhetens tillstånd.</Text>
    </InfoModal>
    {reminderSummary ? <MessageCard>{reminderSummary}</MessageCard> : null}
    {checklistFocusState === 'loading' ? <MessageCard>Hämtar den valda planen från Checklistan…</MessageCard> : null}
    {checklistFocusState === 'missing' ? <MessageCard tone="error">Planen finns inte längre. Listan har uppdaterats.</MessageCard> : null}
    {checklistFocusState === 'error' ? <View style={styles.focusMessage}>
      <MessageCard tone="error">Planen kunde inte hämtas.</MessageCard>
      {onRetryChecklistFocus ? <QuietButton title="Hämta planen igen" disabled={busy} onPress={onRetryChecklistFocus} /> : null}
    </View> : null}

    {(pending || statusError) && <MessageCard tone={statusError ? 'error' : 'neutral'}>{statusMessage || (pending ? 'Ändringen väntar på kontroll av sparstatus.' : 'Åtgärden kunde inte slutföras.')}</MessageCard>}
    {conflict && <View style={styles.conflictCard}>
      <Text style={styles.conflictTitle} accessibilityRole="header">Senast sparade plan</Text>
      {conflict.current
        ? <Text style={styles.conflictText}>{typeLabel(conflict.current.event_type)} · {conflict.current.due_on}{conflict.current.description ? `\n${conflict.current.description}` : ''}</Text>
        : <Text style={styles.conflictText}>Planen finns inte längre.</Text>}
      <Text style={styles.conflictBody}>Den väntande ändringen ligger kvar tills du använder den aktuella versionen och börjar om.</Text>
      {recovery === 'conflict' && <PrimaryButton title={busy ? 'Kontrollerar…' : 'Använd aktuell plan och börja om'} disabled={busy} onPress={acceptConflict} />}
    </View>}
    {loadState === 'loading' && <MessageCard>Hämtar planerade hälsohändelser…</MessageCard>}
    {loadState === 'error' && <MessageCard tone="error">Planerna kunde inte hämtas.</MessageCard>}
    {recovery === 'pending' && <PrimaryButton title="Kontrollera sparstatus" disabled={busy} onPress={onRetry} />}
    {recovery === 'error' && <PrimaryButton title="Försök igen" disabled={busy} onPress={onRetry} />}

    {loadState === 'ready' && focusedChecklistRecord ? renderRecord(focusedChecklistRecord, true) : null}

    {loadState === 'ready' && <>
      {busy && <MessageCard>Sparar och kontrollerar ändringen…</MessageCard>}
      <View style={styles.formCard}>
        <Text style={styles.formTitle} accessibilityRole="header">{editingRecord ? 'Rätta plan' : 'Lägg till plan'}</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Typ av planerad hälsohändelse" style={styles.typeChoices}>
          <TypeChoice selected={type === 'vaccination'} disabled={blocked || editingRecord !== null} accent={tokens.colors.category.vaccination}
            icon="bandage-outline" label="Vaccination" onPress={() => setType('vaccination')} />
          <TypeChoice selected={type === 'vet_visit'} disabled={blocked || editingRecord !== null} accent={tokens.colors.category.veterinary}
            icon="medical-outline" label="Veterinärbesök" onPress={() => setType('vet_visit')} />
        </View>
        <DatePickerField label="Planerat datum" disabled={blocked} onChangeText={setDueOn} value={dueOn} />
        <TimePickerField label="Tid (valfri)" disabled={blocked} onChangeText={setDueTime} value={dueTime} />
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: reminderEnabled, disabled: blocked }} disabled={blocked}
          onPress={() => setReminderEnabled((value) => !value)} style={styles.reminderChoice}>
          <View style={[styles.reminderCheck, reminderEnabled && styles.reminderCheckSelected]}>
            {reminderEnabled && <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.onPrimary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />}
          </View>
          <View style={styles.reminderCopy}>
            <Text style={styles.label}>Påminn mig lokalt</Text>
            <Text style={styles.reminderHint}>Visas bara om både planvalet och enhetens Tassla-val tillåter det.</Text>
          </View>
        </Pressable>
        {reminderEnabled && <TimePickerField label="Påminnelsetid, lokal tid" disabled={blocked} onChangeText={setReminderTime} value={reminderTime} />}
        <View style={styles.field}>
          <Text style={styles.label}>Kort anteckning (frivillig)</Text>
          <TextInput accessibilityLabel="Kort anteckning, högst 500 tecken" editable={!blocked} multiline
            onChangeText={setNote} onSubmitEditing={() => Keyboard.dismiss()} placeholder="Till exempel: boka årlig kontroll"
            placeholderTextColor={tokens.colors.textSecondary} returnKeyType="done" style={styles.noteInput} value={note} />
          <Text style={styles.characterHint}>{Array.from(note).length}/500 tecken</Text>
        </View>
        {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
        <PrimaryButton title={busy ? 'Sparar…' : editingRecord ? 'Spara rättning' : 'Spara plan'} disabled={blocked} onPress={() => { void save(); }} />
        <Toast visible={Boolean(feedbackState.activeMessage?.startsWith('Ändringen är sparad') && timedFeedbackMessage === feedbackState.activeMessage && !statusError && !pending && !busy && !infoVisible)}
          tone="success" confirmed message={feedbackState.activeMessage ?? undefined} autoDismissMs={feedbackTimeout}
          onAutoDismiss={() => { if (feedbackState.activeMessage) dispatchFeedback({ type: 'dismiss', message: feedbackState.activeMessage }); }} />
        {editingRecord && <QuietButton title="Avbryt rättning" disabled={blocked} onPress={resetForm} />}
      </View>

      {remainingRecords.length > 0 ? <Text style={styles.listTitle} accessibilityRole="header">Sparade planer</Text> : null}
      {records.length >= 40 && <MessageCard>{checklistFocusState === 'ready' && checklistFocusRecord
        ? 'Visar vald plan från Checklistan och upp till 40 närmaste planer.'
        : 'Visar de 40 närmaste planerna. Äldre planer kan saknas från listan.'}</MessageCard>}
      {recordsForView.length === 0 && checklistFocusState !== 'loading' && <View style={styles.emptyCard}>
        <Image source={require('../../../assets/images/dog-resting.png')} style={styles.emptyImage}
          accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        <View style={styles.emptyCopy}>
          <Text style={styles.emptyTitle}>Inga planer ännu</Text>
          <Text style={styles.emptyBody}>Lägg till något som du själv vill komma ihåg.</Text>
        </View>
      </View>}
      {remainingRecords.map((record) => renderRecord(record))}
    </>}
  </View>;
}

function TypeChoice({ selected, disabled, icon, label, accent, onPress }: {
  selected: boolean; disabled: boolean; icon: 'bandage-outline' | 'medical-outline'; label: string; accent: { fg: string; bg: string }; onPress: () => void;
}) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} accessibilityLabel={label}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.typeChoice, selected && { borderColor: accent.fg, backgroundColor: accent.bg }, pressed && !disabled && styles.typeChoicePressed]}>
    <Ionicons name={icon} size={tokens.size.iconSm} color={selected ? accent.fg : tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    <Text style={[styles.typeChoiceText, selected && { color: accent.fg }]}>{label}</Text>
  </Pressable>;
}

function typeLabel(type: PlannedHealthType): string {
  return type === 'vaccination' ? 'Planerad vaccination' : 'Planerat veterinärbesök';
}

const styles = StyleSheet.create({
  backAction: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: tokens.spacing.xs, marginLeft: -tokens.spacing.sm, paddingHorizontal: tokens.spacing.sm, borderRadius: tokens.radius.md },
  backLabel: { ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: '700' },
  actionPressed: { backgroundColor: tokens.colors.selectedSurface },
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.support.plannedHealth.bg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  heroIcon: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  description: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  infoRow: { marginTop: tokens.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: tokens.spacing.sm },
  infoHint: { color: tokens.colors.textSecondary, ...tokens.typography.caption },
  focusMessage: { gap: tokens.spacing.xs },
  sourceContext: { color: tokens.colors.primary, ...tokens.typography.caption, fontWeight: '700', marginBottom: tokens.spacing.sm },
  infoButton: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.sm },
  infoButtonText: { color: tokens.colors.primary, ...tokens.typography.caption, fontWeight: '700' },
  infoBody: { color: tokens.colors.textPrimary, ...tokens.typography.body, marginBottom: tokens.spacing.md },
  formCard: { marginTop: tokens.spacing.lg, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  formTitle: { color: tokens.colors.textPrimary, ...tokens.typography.heading, marginBottom: tokens.spacing.md },
  typeChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg },
  typeChoice: { flexGrow: 1, minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  typeChoicePressed: { opacity: 0.78 },
  typeChoiceText: { color: tokens.colors.textSecondary, ...tokens.typography.caption, fontWeight: '700' },
  reminderChoice: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.md, marginBottom: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface },
  reminderCheck: { width: tokens.size.iconMd, height: tokens.size.iconMd, borderRadius: tokens.radius.sm, borderWidth: 2, borderColor: tokens.colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  reminderCheckSelected: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary },
  reminderCopy: { flex: 1 },
  reminderHint: { color: tokens.colors.textSecondary, ...tokens.typography.caption },
  reminderRow: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs },
  field: { marginBottom: tokens.spacing.md },
  label: { color: tokens.colors.textPrimary, ...tokens.typography.caption, fontWeight: '700', marginBottom: tokens.spacing.xs },
  dateInputWrap: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  dateInput: { flex: 1, color: tokens.colors.textPrimary, ...tokens.typography.body, paddingVertical: tokens.spacing.sm },
  noteInput: { minHeight: tokens.size.touchMin * 2, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body, textAlignVertical: 'top' },
  characterHint: { color: tokens.colors.textSecondary, ...tokens.typography.caption, textAlign: 'right', marginTop: tokens.spacing.xs },
  listTitle: { color: tokens.colors.textPrimary, ...tokens.typography.heading, marginTop: tokens.layout.sectionGap },
  conflictCard: { marginTop: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.warning, backgroundColor: tokens.colors.warningSurface },
  conflictTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  conflictText: { color: tokens.colors.textPrimary, ...tokens.typography.caption, fontWeight: '700', marginTop: tokens.spacing.sm },
  conflictBody: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, marginTop: tokens.spacing.md, padding: tokens.spacing.md, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.support.plannedHealth.bg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  emptyImage: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full },
  emptyCopy: { flex: 1 },
  emptyTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  emptyBody: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs },
  recordCard: { marginTop: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  recordHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  recordType: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  recordTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  timingLabel: { color: tokens.colors.support.plannedHealth.fg, ...tokens.typography.caption, fontWeight: '800' },
  overdueLabel: { color: tokens.colors.warning },
  recordDate: { color: tokens.colors.textPrimary, ...tokens.typography.label, marginTop: tokens.spacing.sm },
  recordNote: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs },
  actionsButton: { width: tokens.size.touchMin, minWidth: tokens.size.touchMin, height: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginTop: tokens.spacing.xs, borderRadius: tokens.radius.full },
  actionsButtonPressed: { backgroundColor: tokens.colors.selectedSurface },
});

function formatTime(minutes: number): string {
  return Math.floor(minutes / 60).toString().padStart(2, '0') + ':' + (minutes % 60).toString().padStart(2, '0');
}
function reminderLabel(enabled: boolean, dueOn: string, minutes: number | null): string | null {
  if (minutes === null) return null;
  const label = `Påminnelse ${formatTime(minutes)}`;
  if (!enabled) return `${label} · av`;
  const local = createLocalFireTime(dueOn, minutes);
  if (local.status === 'passed-time') return `${label} · påminnelsetiden har passerat`;
  if (local.status === 'unrepresentable') return `${label} · kan inte schemaläggas den här dagen`;
  return `${label} · schemaläggs bara om enhetens val tillåter det`;
}

function buildPlannedHealthActionButtons(onEdit: () => void, onDelete: () => void) {
  return [
    { text: 'Ändra', onPress: onEdit },
    { text: 'Ta bort', style: 'destructive' as const, onPress: onDelete },
    { text: 'Avbryt', style: 'cancel' as const },
  ];
}
