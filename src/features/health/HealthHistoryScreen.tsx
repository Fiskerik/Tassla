import { useEffect, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DatePickerField, InfoModal, MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { EmptyState, ErrorState, IconChip, Skeleton } from '../../components/ui';
import { Toast } from '../../components/ui/Toast';
import {
  isValidHealthHistoryDate,
  normalizeHealthHistoryDescription,
  type HealthHistoryRecord,
  type HealthHistoryType,
} from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';

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
  filterType,
  sectionTitle = 'Genomfört',
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
  filterType?: HealthHistoryType;
  sectionTitle?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<HealthHistoryType>(filterType ?? 'vaccination');
  const [date, setDate] = useState(localDate());
  const [note, setNote] = useState('');
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

  function edit(record: HealthHistoryRecord) {
    setEditingId(record.id);
    setType(record.event_type);
    setDate(record.occurred_on);
    setNote(record.description ?? '');
    setFormError('');
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
    if (await onSave?.(editingId, filterType ?? type, date, normalized ?? '')) resetForm();
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
      <View style={styles.sectionHeading}>
        <View style={styles.headingIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <IconChip category="vaccination" size="large" />
        </View>
        <View style={styles.headingCopy}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{sectionTitle}</Text>
          <Text style={styles.sectionBody}>Ägarregistrerade hälsohändelser.</Text>
        </View>
      </View>
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
      {loadState === 'loading' && <Skeleton shape="row" lines={4} />}
      {loadState === 'error' && <ErrorState title="Hälsans historik kunde inte hämtas" description="Försök igen när du vill." actionLabel="Försök igen" onRetry={onRetry} />}

      {loadState === 'ready' && <>
        {busy && <MessageCard>Sparar och kontrollerar ändringen…</MessageCard>}
        <View style={styles.formCard}>
          <Text style={styles.formTitle} accessibilityRole="header">{editingRecord ? 'Rätta händelse' : 'Lägg till händelse'}</Text>
          {!filterType && <View accessibilityRole="radiogroup" accessibilityLabel="Typ av händelse" style={styles.typeChoices}>
            <TypeChoice selected={type === 'vaccination'} disabled={blocked || editingRecord !== null}
              icon="bandage-outline" label="Vaccination" onPress={() => setType('vaccination')} />
            <TypeChoice selected={type === 'vet_visit'} disabled={blocked || editingRecord !== null}
              icon="medical-outline" label="Veterinärbesök" onPress={() => setType('vet_visit')} />
          </View>}
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

        <Text style={styles.historyTitle} accessibilityRole="header">Sparad historik</Text>
        {rows.length === 0 && <EmptyState title="Ingen historik ännu" description="När något har hänt kan du lägga till det här." />}
        {rows.map((record) => <View key={record.id} style={styles.recordCard}>
          <View style={styles.recordHeading}>
            <View style={styles.recordType}>
              <IconChip category={record.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} />
              <Text style={styles.recordTitle}>{typeLabel(record.event_type)}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={tokens.size.iconSm} color={tokens.colors.success} accessibilityLabel="Ägarregistrerad" />
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
            <Ionicons name={icon} size={tokens.size.iconSm} color={selected ? tokens.colors.primary : tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    <Text style={[styles.typeChoiceText, selected && styles.typeChoiceTextSelected]}>{label}</Text>
  </Pressable>;
}

function typeLabel(type: HealthHistoryType): string {
  return type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök';
}

const styles = StyleSheet.create({
  section: { marginTop: tokens.layout.sectionGap },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, marginBottom: tokens.layout.headingGap },
  headingIcon: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  sectionTitle: { color: tokens.colors.textPrimary, ...tokens.typography.heading },
  sectionBody: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs },
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
  dateInputWrap: { minHeight: tokens.size.touchMin + tokens.spacing.sm, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  dateInput: { flex: 1, color: tokens.colors.textPrimary, ...tokens.typography.body, paddingVertical: tokens.spacing.sm },
  noteInput: { minHeight: tokens.size.touchMin * 2, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body, textAlignVertical: 'top' },
  characterHint: { color: tokens.colors.textSecondary, ...tokens.typography.caption, textAlign: 'right', marginTop: tokens.spacing.xs },
  historyTitle: { color: tokens.colors.textPrimary, ...tokens.typography.heading, marginTop: tokens.layout.sectionGap },
  conflictCard: { marginTop: tokens.layout.listGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.warning, backgroundColor: tokens.colors.warningSurface },
  conflictTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  conflictBody: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, marginTop: tokens.layout.listGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.selectedSurface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  emptyImage: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full },
  emptyCopy: { flex: 1 },
  emptyTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  emptyBody: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs },
  recordCard: { marginTop: tokens.layout.listGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  recordHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  recordType: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  recordDate: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs },
  recordNote: { color: tokens.colors.textPrimary, ...tokens.typography.caption, marginTop: tokens.spacing.sm },
  actions: { flexDirection: 'row', gap: tokens.spacing.sm, marginTop: tokens.spacing.sm },
});
