import { useEffect, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, findNodeHandle, Image, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DatePickerField, InfoModal, MessageCard, PageHeading, PrimaryButton, QuietButton, TimePickerField } from '../../components/AppPrimitives';
import { Toast } from '../../components/ui/Toast';
import { IconChip } from '../../components/ui/IconChip';
import { theme, tokens } from '../../theme/tokens';
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
  records,
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
  records: readonly PlannedHealthRecord[];
  loadState: LoadState;
  busy?: boolean;
  pending?: boolean;
  statusMessage?: string;
  statusError?: boolean;
  reminderSummary?: string;
  conflict?: { current: PlannedHealthRecord | null } | null;
  onRetry: () => void;
  onResolveConflict: () => void;
  onSave: (id: string | null, type: PlannedHealthType, dueOn: string, note: string, reminderEnabled: boolean, reminderMinutes: number | null) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<PlannedHealthType>('vaccination');
  const [dueOn, setDueOn] = useState(localDate());
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

  useEffect(() => {
    if (editingId === null || editingRecord !== null) return;
    const timer = setTimeout(() => {
      setEditingId(null);
      setType('vaccination');
      setDueOn(localDate());
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
    if (await onSave(editingId, type, normalizedDate, normalizedNote ?? '', reminderEnabled, reminderEnabled ? minutes : null)) resetForm();
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

  return <View>
    <QuietButton title="Tillbaka till hälsa" disabled={busy} onPress={onBack} />
    <View style={styles.heroCard}>
      <View style={styles.heroIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="calendar-outline" size={tokens.size.iconMd} color={tokens.colors.primary} />
      </View>
      <View style={styles.heroCopy}>
        <PageHeading title="Planerade hälsohändelser" description="Skriv in vaccinationer och veterinärbesök som ska ske framöver." />
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

    {loadState === 'ready' && <>
      {busy && <MessageCard>Sparar och kontrollerar ändringen…</MessageCard>}
      <View style={styles.formCard}>
        <Text style={styles.formTitle} accessibilityRole="header">{editingRecord ? 'Rätta plan' : 'Lägg till plan'}</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Typ av planerad hälsohändelse" style={styles.typeChoices}>
          <TypeChoice selected={type === 'vaccination'} disabled={blocked || editingRecord !== null}
            icon="bandage-outline" label="Vaccination" onPress={() => setType('vaccination')} />
          <TypeChoice selected={type === 'vet_visit'} disabled={blocked || editingRecord !== null}
            icon="medical-outline" label="Veterinärbesök" onPress={() => setType('vet_visit')} />
        </View>
        <DatePickerField label="Planerat datum" disabled={blocked} onChangeText={setDueOn} value={dueOn} />
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

      <Text style={styles.listTitle} accessibilityRole="header">Sparade planer</Text>
      {records.length >= 40 && <MessageCard>Visar de 40 närmaste planerna. Äldre planer kan saknas från listan.</MessageCard>}
      {records.length === 0 && <View style={styles.emptyCard}>
        <Image source={require('../../../assets/images/dog-resting.png')} style={styles.emptyImage}
          accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        <View style={styles.emptyCopy}>
          <Text style={styles.emptyTitle}>Inga planer ännu</Text>
          <Text style={styles.emptyBody}>Lägg till något som du själv vill komma ihåg.</Text>
        </View>
      </View>}
      {records.map((record) => {
        const timing = record.due_on < today ? 'Passerat datum' : record.due_on === today ? 'Idag' : 'Kommande';
        return <View key={record.id} style={styles.recordCard}>
          <View style={styles.recordHeading}>
            <View style={styles.recordType}>
              <IconChip category={record.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} />
              <Text style={styles.recordTitle}>{typeLabel(record.event_type)}</Text>
            </View>
            <Text style={[styles.timingLabel, record.due_on < today && styles.overdueLabel]}>{timing.toUpperCase()}</Text>
          </View>
          <Text style={styles.recordDate}>{record.due_on}</Text>
          {record.description ? <Text style={styles.recordNote}>{record.description}</Text> : null}
          <Text style={styles.reminderRow}>{reminderLabel(record.reminder_enabled, record.due_on, record.reminder_minutes)}</Text>
          <View style={styles.actions}>
            <QuietButton title="Ändra" disabled={blocked} onPress={() => edit(record)} />
            <QuietButton title="Ta bort" disabled={blocked} onPress={() => confirmDelete(record)} />
          </View>
        </View>;
      })}
    </>}
  </View>;
}

function TypeChoice({ selected, disabled, icon, label, onPress }: {
  selected: boolean; disabled: boolean; icon: 'bandage-outline' | 'medical-outline'; label: string; onPress: () => void;
}) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} accessibilityLabel={label}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.typeChoice, selected && styles.typeChoiceSelected, pressed && !disabled && styles.typeChoicePressed]}>
    <Ionicons name={icon} size={tokens.size.iconSm} color={selected ? tokens.colors.primary : tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    <Text style={[styles.typeChoiceText, selected && styles.typeChoiceTextSelected]}>{label}</Text>
  </Pressable>;
}

function typeLabel(type: PlannedHealthType): string {
  return type === 'vaccination' ? 'Planerad vaccination' : 'Planerat veterinärbesök';
}

const styles = StyleSheet.create({
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, padding: 16, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border },
  heroIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  infoRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  infoHint: { color: theme.colors.mutedText, fontSize: 14 },
  infoButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10 },
  infoButtonText: { color: theme.colors.accent, fontSize: 15, fontWeight: '700' },
  infoBody: { color: theme.colors.text, fontSize: 16, lineHeight: 24, marginBottom: 14 },
  formCard: { marginTop: 18, padding: 17, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#FBFCFA' },
  formTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 14 },
  typeChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChoice: { flexGrow: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 11, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  typeChoiceSelected: { borderColor: theme.colors.accent, backgroundColor: '#EAF2EC' },
  typeChoicePressed: { opacity: 0.78 },
  typeChoiceText: { color: theme.colors.mutedText, fontSize: 14, fontWeight: '700' },
  typeChoiceTextSelected: { color: theme.colors.accent },
  reminderChoice: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.button, backgroundColor: '#F5F8F4' },
  reminderCheck: { width: 26, height: 26, borderRadius: 7, borderWidth: 2, borderColor: theme.colors.mutedText, alignItems: 'center', justifyContent: 'center' },
  reminderCheckSelected: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  reminderCopy: { flex: 1 },
  reminderHint: { color: theme.colors.mutedText, fontSize: 13, lineHeight: 18 },
  reminderRow: { color: theme.colors.mutedText, fontSize: 13, lineHeight: 18, marginTop: 5 },
  field: { marginBottom: 14 },
  label: { color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 7 },
  dateInputWrap: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  dateInput: { flex: 1, color: theme.colors.text, fontSize: 17, paddingVertical: 10 },
  noteInput: { minHeight: 84, paddingHorizontal: 14, paddingVertical: 12, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 16, textAlignVertical: 'top' },
  characterHint: { color: theme.colors.mutedText, fontSize: 12, textAlign: 'right', marginTop: 5 },
  listTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '800', marginTop: 22 },
  conflictCard: { marginTop: 10, padding: 15, borderRadius: theme.radius.card, borderWidth: 1, borderColor: '#D6C59B', backgroundColor: '#FBF6EA' },
  conflictTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  conflictText: { color: theme.colors.text, fontSize: 15, fontWeight: '700', lineHeight: 22, marginTop: 8 },
  conflictBody: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 10 },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, padding: 14, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border },
  emptyImage: { width: 48, height: 48, borderRadius: 24 },
  emptyCopy: { flex: 1 },
  emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  emptyBody: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 19, marginTop: 3 },
  recordCard: { marginTop: 10, padding: 15, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  recordHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  recordType: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  timingLabel: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  overdueLabel: { color: '#936324' },
  recordDate: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: 7 },
  recordNote: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 5 },
  actions: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8, marginTop: 8 },
});

function formatTime(minutes: number): string {
  return Math.floor(minutes / 60).toString().padStart(2, '0') + ':' + (minutes % 60).toString().padStart(2, '0');
}
function reminderLabel(enabled: boolean, dueOn: string, minutes: number | null): string {
  if (!enabled || minutes === null) return 'Påminnelse av';
  const local = createLocalFireTime(dueOn, minutes);
  if (local.status === 'passed-time') return 'Påminnelsetiden har passerat';
  if (local.status === 'unrepresentable') return 'Tiden kan inte schemaläggas den här dagen';
  return 'Vald tid ' + formatTime(minutes) + ' · schemaläggs bara om enhetens val tillåter det';
}
