import { useState } from 'react';
import { Alert, Image, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActionFeedbackModal, DatePickerField, InfoModal, MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import {
  isValidHealthHistoryDate,
  normalizeHealthHistoryDescription,
  type HealthHistoryRecord,
  type HealthHistoryType,
} from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { theme } from '../../theme/tokens';

type LoadState = 'loading' | 'ready' | 'error';

export function HealthHistoryScreen({
  records,
  loadState = 'loading',
  busy = false,
  pending = false,
  statusMessage = '',
  statusError = false,
  conflict,
  onRetry,
  onResolveConflict,
  onSave,
  onDelete,
}: {
  records?: readonly HealthHistoryRecord[];
  loadState?: LoadState;
  busy?: boolean;
  pending?: boolean;
  statusMessage?: string;
  statusError?: boolean;
  conflict?: { current: HealthHistoryRecord | null } | null;
  onRetry?: () => void;
  onResolveConflict?: () => void;
  onSave?: (id: string | null, type: HealthHistoryType, date: string, note: string) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<HealthHistoryType>('vaccination');
  const [date, setDate] = useState(localDate());
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [dismissedStatus, setDismissedStatus] = useState<string | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const available = records !== undefined;
  const rows = records ?? [];
  const blocked = busy || pending;
  const editingRecord = rows.find((row) => row.id === editingId) ?? null;

  if (!available) return null;

  function resetForm() {
    setEditingId(null);
    setType('vaccination');
    setDate(localDate());
    setNote('');
    setFormError('');
    Keyboard.dismiss();
  }

  function edit(record: HealthHistoryRecord) {
    setEditingId(record.id);
    setType(record.event_type);
    setDate(record.occurred_on);
    setNote(record.description ?? '');
    setFormError('');
  }

  async function save() {
    setDismissedStatus(null);
    setFormError('');
    if (!isValidHealthHistoryDate(date)) {
      setFormError('Ange ett giltigt datum som inte ligger i framtiden.');
      return;
    }
    const normalized = normalizeHealthHistoryDescription(note);
    if (normalized === undefined) {
      setFormError('Anteckningen får innehålla högst 500 tecken.');
      return;
    }
    if (await onSave?.(editingId, type, date, normalized ?? '')) resetForm();
  }

  function confirmDelete(record: HealthHistoryRecord) {
    Alert.alert('Radera händelse?', `${typeLabel(record.event_type)} tas bort från hundens historik.`, [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Radera', style: 'destructive', onPress: () => { void deleteRecord(record); } },
    ]);
  }

  async function deleteRecord(record: HealthHistoryRecord) {
    setDismissedStatus(null);
    if (await onDelete?.(record.id) && editingId === record.id) resetForm();
  }

  function resolveConflict() {
    resetForm();
    onResolveConflict?.();
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View style={styles.headingIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="medical-outline" size={21} color={theme.colors.accent} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Vaccinationer och veterinärbesök</Text>
          <Text style={styles.sectionBody}>Spara sådant som redan har hänt.</Text>
        </View>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoHint}>Om hälsans historik</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Visa information om hälsans historik" onPress={() => setInfoVisible(true)} style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={21} color={theme.colors.accent} />
          <Text style={styles.infoButtonText}>Läs information</Text>
        </Pressable>
      </View>
      <InfoModal visible={infoVisible} title="Om hälsans historik" onClose={() => setInfoVisible(false)}>
        <Text style={styles.infoBody}>Uppgifterna är ägarregistrerade, inte en verifierad journal. Undvik personuppgifter i anteckningar.</Text>
        <Text style={styles.infoBody}>Historiken hämtas i en läsning. Om listan når serverns svarstak kan äldre händelser saknas.</Text>
      </InfoModal>

      {statusMessage && statusError ? <>
        <MessageCard tone="error">{statusMessage}</MessageCard>
        {(pending || statusError) && <PrimaryButton title={pending ? 'Kontrollera status' : 'Försök igen'} disabled={busy} onPress={() => onRetry?.()} />}
      </> : null}
      {conflict && <View style={styles.conflictCard}>
        <Text style={styles.conflictTitle} accessibilityRole="header">Aktuell sparad version</Text>
        {conflict.current
          ? <Text style={styles.recordNote}>{typeLabel(conflict.current.event_type)} · {conflict.current.occurred_on}{conflict.current.description ? `\n${conflict.current.description}` : ''}</Text>
          : <Text style={styles.recordNote}>Posten finns inte längre.</Text>}
        <Text style={styles.conflictBody}>Den väntande ändringen lämnas orörd tills du väljer hur du vill fortsätta.</Text>
        <PrimaryButton title="Använd aktuell historik och börja om" disabled={busy} onPress={resolveConflict} />
      </View>}
      {loadState === 'loading' && <MessageCard>Hämtar hälsans historik…</MessageCard>}
      {loadState === 'error' && <>
        <MessageCard tone="error">Hälsans historik kunde inte hämtas.</MessageCard>
        {loadState === 'error' && <PrimaryButton title="Försök igen" disabled={busy} onPress={() => onRetry?.()} />}
      </>}

      {loadState === 'ready' && <>
        {busy && <MessageCard>Sparar och kontrollerar ändringen…</MessageCard>}
        <View style={styles.formCard}>
          <Text style={styles.formTitle} accessibilityRole="header">{editingRecord ? 'Rätta händelse' : 'Lägg till händelse'}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel="Typ av händelse" style={styles.typeChoices}>
            <TypeChoice selected={type === 'vaccination'} disabled={blocked || editingRecord !== null}
              icon="bandage-outline" label="Vaccination" onPress={() => setType('vaccination')} />
            <TypeChoice selected={type === 'vet_visit'} disabled={blocked || editingRecord !== null}
              icon="medical-outline" label="Veterinärbesök" onPress={() => setType('vet_visit')} />
          </View>
          <DatePickerField label="Datum" disabled={blocked} onChangeText={setDate} value={date} />
          <View style={styles.field}>
            <Text style={styles.label}>Kort anteckning (frivillig)</Text>
            <TextInput accessibilityLabel="Kort anteckning, högst 500 tecken" editable={!blocked} multiline
              onChangeText={setNote} onSubmitEditing={() => Keyboard.dismiss()} placeholder="Till exempel: valpens första vaccination"
              placeholderTextColor={theme.colors.mutedText} returnKeyType="done" style={styles.noteInput} value={note} />
            <Text style={styles.characterHint}>{Array.from(note).length}/500 tecken</Text>
          </View>
          {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
          <PrimaryButton title={busy ? 'Sparar…' : editingRecord ? 'Spara rättning' : 'Spara händelse'} disabled={blocked} onPress={() => { void save(); }} />
          {statusMessage && !statusError ? <ActionFeedbackModal visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => setDismissedStatus(statusMessage)} /> : null}
          {editingRecord && <QuietButton title="Avbryt rättning" disabled={blocked} onPress={resetForm} />}
        </View>

        <Text style={styles.historyTitle} accessibilityRole="header">Sparad historik</Text>
        {rows.length === 0 && <View style={styles.emptyCard}>
          <Image source={require('../../../assets/images/dog-resting.png')} style={styles.emptyImage}
            accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>Ingen historik ännu</Text>
            <Text style={styles.emptyBody}>När något har hänt kan du enkelt lägga till det här.</Text>
          </View>
        </View>}
        {rows.map((record) => <View key={record.id} style={styles.recordCard}>
          <View style={styles.recordHeading}>
            <View style={styles.recordType}>
              <Ionicons name={record.event_type === 'vaccination' ? 'bandage-outline' : 'medical-outline'} size={19} color={theme.colors.accent}
                accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
              <Text style={styles.recordTitle}>{typeLabel(record.event_type)}</Text>
            </View>
            <Text style={styles.ownerLabel}>ÄGARREGISTRERAD</Text>
          </View>
          <Text style={styles.recordDate}>{record.occurred_on}</Text>
          {record.description ? <Text style={styles.recordNote}>{record.description}</Text> : null}
          <View style={styles.actions}>
            <QuietButton title="Ändra" disabled={blocked} onPress={() => edit(record)} />
            <QuietButton title="Radera" disabled={blocked} onPress={() => confirmDelete(record)} />
          </View>
        </View>)}
      </>}
    </View>
  );
}

function TypeChoice({ selected, disabled, icon, label, onPress }: {
  selected: boolean; disabled: boolean; icon: 'bandage-outline' | 'medical-outline'; label: string; onPress: () => void;
}) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} accessibilityLabel={label}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.typeChoice, selected && styles.typeChoiceSelected, pressed && !disabled && styles.typeChoicePressed]}>
    <Ionicons name={icon} size={20} color={selected ? theme.colors.accent : theme.colors.mutedText} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    <Text style={[styles.typeChoiceText, selected && styles.typeChoiceTextSelected]}>{label}</Text>
  </Pressable>;
}

function typeLabel(type: HealthHistoryType): string {
  return type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök';
}

const styles = StyleSheet.create({
  section: { marginTop: 28 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  headingIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, lineHeight: 27, fontWeight: '800' },
  sectionBody: { color: theme.colors.mutedText, fontSize: 14, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 },
  infoHint: { color: theme.colors.mutedText, fontSize: 14 },
  infoButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8 },
  infoButtonText: { color: theme.colors.accent, fontSize: 14, fontWeight: '700' },
  infoBody: { color: theme.colors.text, fontSize: 16, lineHeight: 24, marginBottom: 14 },
  formCard: { marginTop: 18, padding: 17, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#FBFCFA' },
  formTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 14 },
  typeChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChoice: { flexGrow: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 11, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  typeChoiceSelected: { borderColor: theme.colors.accent, backgroundColor: '#EAF2EC' },
  typeChoicePressed: { opacity: 0.78 },
  typeChoiceText: { color: theme.colors.mutedText, fontSize: 14, fontWeight: '700' },
  typeChoiceTextSelected: { color: theme.colors.accent },
  field: { marginBottom: 14 },
  label: { color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 7 },
  dateInputWrap: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  dateInput: { flex: 1, color: theme.colors.text, fontSize: 17, paddingVertical: 10 },
  noteInput: { minHeight: 84, paddingHorizontal: 14, paddingVertical: 12, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 16, textAlignVertical: 'top' },
  characterHint: { color: theme.colors.mutedText, fontSize: 12, textAlign: 'right', marginTop: 5 },
  historyTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '800', marginTop: 22 },
  conflictCard: { marginTop: 10, padding: 15, borderRadius: theme.radius.card, borderWidth: 1, borderColor: '#D6C59B', backgroundColor: '#FBF6EA' },
  conflictTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  conflictBody: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 10 },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, padding: 14, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border },
  emptyImage: { width: 48, height: 48, borderRadius: 24 },
  emptyCopy: { flex: 1 },
  emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  emptyBody: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 19, marginTop: 3 },
  recordCard: { marginTop: 10, padding: 15, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  recordHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  recordType: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
  ownerLabel: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  recordDate: { color: theme.colors.mutedText, fontSize: 15, marginTop: 5 },
  recordNote: { color: theme.colors.text, fontSize: 15, lineHeight: 21, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 9 },
});
