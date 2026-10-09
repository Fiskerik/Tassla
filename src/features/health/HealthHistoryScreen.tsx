import { useEffect, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DatePickerField, InfoModal, MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { Toast } from '../../components/ui/Toast';
import {
  isValidHealthHistoryDate,
  normalizeHealthHistoryDescription,
  type HealthHistoryRecord,
  type HealthHistoryType,
} from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';
import { Button } from '../../components/ui';

type LoadState = 'loading' | 'ready' | 'error';

export function HealthHistoryScreen({
  records,
  initialEditingId = null,
  initialType = 'vaccination',
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
  initialEditingId?: string | null;
  initialType?: HealthHistoryType;
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
  const [editingId, setEditingId] = useState<string | null>(initialEditingId);
  const [type, setType] = useState<HealthHistoryType>(records?.find((row) => row.id === initialEditingId)?.event_type ?? initialType);
  const [date, setDate] = useState(records?.find((row) => row.id === initialEditingId)?.occurred_on ?? localDate());
  const [note, setNote] = useState(records?.find((row) => row.id === initialEditingId)?.description ?? '');
  const [formError, setFormError] = useState('');
  const [infoVisible, setInfoVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const confirmedMessage = statusMessage.startsWith('Ändringen är sparad') && !statusError && !pending && !busy
    ? statusMessage : null;
  const available = records !== undefined;
  const rows = records ?? [];
  const blocked = busy || pending;
  const editingRecord = rows.find((row) => row.id === editingId) ?? null;

  useEffect(() => {
    // The toast mirrors an external save-status prop and is intentionally reset here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!confirmedMessage) { setToastMessage(null); return; }
    setToastMessage(confirmedMessage);
    const timer = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [confirmedMessage]);

  if (!available) return null;

  function resetForm() {
    setEditingId(null);
    setType('vaccination');
    setDate(localDate());
    setNote('');
    setFormError('');
    Keyboard.dismiss();
  }

  async function save() {
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
    if (await onDelete?.(record.id) && editingId === record.id) resetForm();
  }

  function resolveConflict() {
    resetForm();
    onResolveConflict?.();
  }

  return (
    <View style={styles.section}>
      <View style={styles.infoRow}>
        <Text style={styles.infoHint}>Om hälsans historik</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Visa information om hälsans historik" onPress={() => setInfoVisible(true)} style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={tokens.size.iconSm} color={tokens.colors.primary} />
          <Text style={styles.infoButtonText}>Läs information</Text>
        </Pressable>
      </View>
      <InfoModal visible={infoVisible} title="Om hälsans historik" onClose={() => setInfoVisible(false)}>
        <Text style={styles.infoBody}>Uppgifterna är ägarregistrerade, inte en verifierad journal. Undvik personuppgifter i anteckningar.</Text>
        <Text style={styles.infoBody}>Vi visar de senast hämtade händelserna. Äldre händelser kan saknas.</Text>
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
              placeholderTextColor={tokens.colors.textSecondary} returnKeyType="done" style={styles.noteInput} value={note} />
            <Text style={styles.characterHint}>{Array.from(note).length}/500 tecken</Text>
          </View>
          {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
          <PrimaryButton title={busy ? 'Sparar…' : editingRecord ? 'Spara rättning' : 'Spara händelse'} disabled={blocked} onPress={() => { void save(); }} />
          {toastMessage ? <Toast tone="success" confirmed message={toastMessage} /> : null}
          {editingRecord && <QuietButton title="Avbryt rättning" disabled={blocked} onPress={resetForm} />}
        </View>

        {editingRecord && <Button variant="destructive" label="Radera händelse" accessibilityLabel="Radera händelse" disabled={blocked} onPress={() => confirmDelete(editingRecord)} />}
      </>}
    </View>
  );
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

function typeLabel(type: HealthHistoryType): string {
  return type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök';
}

const styles = StyleSheet.create({
  section: { marginTop: tokens.layout.sectionGap },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.spacing.md, marginBottom: tokens.spacing.xs },
  infoHint: { color: tokens.colors.textSecondary, ...tokens.typography.caption },
  infoButton: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.sm },
  infoButtonText: { color: tokens.colors.primary, ...tokens.typography.caption, fontWeight: '700' },
  infoBody: { color: tokens.colors.textPrimary, ...tokens.typography.body, marginBottom: tokens.spacing.md },
  formCard: { marginTop: tokens.layout.sectionGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  formTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label, marginBottom: tokens.spacing.md },
  typeChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg },
  typeChoice: { flexGrow: 1, minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  typeChoiceSelected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface },
  typeChoicePressed: { opacity: 0.78 },
  typeChoiceText: { color: tokens.colors.textSecondary, ...tokens.typography.caption, fontWeight: '700' },
  typeChoiceTextSelected: { color: tokens.colors.primary },
  field: { marginBottom: tokens.spacing.md },
  label: { color: tokens.colors.textPrimary, ...tokens.typography.caption, fontWeight: '700', marginBottom: tokens.spacing.xs },
  noteInput: { minHeight: tokens.size.touchMin * 2, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body, textAlignVertical: 'top' },
  characterHint: { color: tokens.colors.textSecondary, ...tokens.typography.caption, textAlign: 'right', marginTop: tokens.spacing.xs },
  conflictCard: { marginTop: tokens.layout.listGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.warning, backgroundColor: tokens.colors.warningSurface },
  conflictTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  conflictBody: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  recordNote: { color: tokens.colors.textPrimary, ...tokens.typography.caption, marginTop: tokens.spacing.sm },
});
