import { useEffect, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { InfoModal } from '../../components/AppPrimitives';
import { Toast } from '../../components/ui/Toast';
import {
  isValidHealthHistoryDate,
  normalizeHealthHistoryDescription,
  type HealthHistoryRecord,
  type HealthHistoryType,
} from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';
import { ActionMenu, BottomSheet, Button, EmptyState, Field, IconChip, InfoBanner, ListRow, Skeleton } from '../../components/ui';

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
  const [infoVisible, setInfoVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [menuRecordId, setMenuRecordId] = useState<string | null>(null);
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

  if (!available) return <View style={styles.section}><Skeleton shape="row" lines={2} /></View>;

  function resetForm() {
    setEditingId(null);
    setType('vaccination');
    setDate(localDate());
    setNote('');
    setFormError('');
    Keyboard.dismiss();
    setFormVisible(false);
  }

  function edit(record: HealthHistoryRecord) {
    setEditingId(record.id);
    setType(record.event_type);
    setDate(record.occurred_on);
    setNote(record.description ?? '');
    setFormError('');
    setFormVisible(true);
  }

  function startAdding() {
    resetForm();
    setFormVisible(true);
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
      <View style={styles.sectionHeading}>
        <View style={styles.headingIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <IconChip category="vaccination" size="large" />
        </View>
        <View style={styles.headingCopy}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Vaccinationer och veterinärbesök</Text>
          <Text style={styles.sectionBody}>Spara sådant som redan har hänt.</Text>
        </View>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoHint}>Om hälsans historik</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Visa information om hälsans historik" onPress={() => setInfoVisible(true)} style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={tokens.size.iconSm} color={tokens.colors.primary} />
          <Text style={styles.infoButtonText}>Läs information</Text>
        </Pressable>
      </View>
      <Text style={styles.caption}>Ägarregistrerad information, inte en verifierad journal.</Text>
      <Button label="Lägg till händelse" accessibilityLabel="Lägg till händelse" variant="secondary" onPress={startAdding} />
      <InfoModal visible={infoVisible} title="Om hälsans historik" onClose={() => setInfoVisible(false)}>
        <Text style={styles.infoBody}>Uppgifterna är ägarregistrerade, inte en verifierad journal. Undvik personuppgifter i anteckningar.</Text>
        <Text style={styles.infoBody}>Vi visar de senast hämtade händelserna. Äldre händelser kan saknas.</Text>
      </InfoModal>

      {statusMessage && statusError ? <InfoBanner action={<Button label={pending ? 'Kontrollera status' : 'Försök igen'} accessibilityLabel={pending ? 'Kontrollera status' : 'Försök igen'} variant="secondary" disabled={busy} onPress={() => onRetry?.()} />}>{statusMessage}</InfoBanner> : null}
      {conflict && <View style={styles.conflictCard}>
        <Text style={styles.conflictTitle} accessibilityRole="header">Aktuell sparad version</Text>
        {conflict.current
          ? <Text style={styles.recordNote}>{typeLabel(conflict.current.event_type)} · {conflict.current.occurred_on}{conflict.current.description ? `\n${conflict.current.description}` : ''}</Text>
          : <Text style={styles.recordNote}>Posten finns inte längre.</Text>}
        <Text style={styles.conflictBody}>Den väntande ändringen lämnas orörd tills du väljer hur du vill fortsätta.</Text>
        <Button label="Använd aktuell historik och börja om" accessibilityLabel="Använd aktuell historik och börja om" variant="secondary" disabled={busy} onPress={resolveConflict} />
      </View>}
      {loadState === 'loading' && <Skeleton shape="row" lines={2} />}
      {loadState === 'error' && <>
        <InfoBanner action={<Button label="Försök igen" accessibilityLabel="Försök igen" variant="secondary" disabled={busy} onPress={() => onRetry?.()} />}>Hälsans historik kunde inte hämtas.</InfoBanner>
      </>}

      {loadState === 'ready' && <>
        {rows.length === 0 && <EmptyState title="Ingen hälsohistorik ännu" actionLabel="Lägg till händelse" onAction={startAdding} />}
        {rows.map((record) => <View key={record.id} style={styles.rowWithMenu}>
          <View style={styles.rowCopy}><ListRow category={record.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} title={typeLabel(record.event_type)} detail={[record.occurred_on, record.description].filter(Boolean).join(' · ')} chevron={false} /></View>
          <ActionMenu visible={menuRecordId === record.id} onOpen={() => setMenuRecordId(record.id)} onClose={() => setMenuRecordId(null)} onEdit={() => edit(record)} onDelete={() => confirmDelete(record)} />
        </View>)}
      </>}
      <HistorySheet visible={formVisible} editing={editingRecord !== null} type={type} date={date} note={note} error={formError} busy={busy} blocked={blocked} onTypeChange={setType} onDateChange={setDate} onNoteChange={setNote} onClose={resetForm} onSave={() => { void save(); }} toast={toastMessage} />
    </View>
  );
}

function typeLabel(type: HealthHistoryType): string {
  return type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök';
}

function HistorySheet({ visible, editing, type, date, note, error, busy, blocked, onTypeChange, onDateChange, onNoteChange, onClose, onSave, toast }: {
  visible: boolean; editing: boolean; type: HealthHistoryType; date: string; note: string; error: string; busy: boolean; blocked: boolean;
  onTypeChange: (type: HealthHistoryType) => void; onDateChange: (value: string) => void; onNoteChange: (value: string) => void;
  onClose: () => void; onSave: () => void; toast: string | null;
}) {
  return <BottomSheet visible={visible} title={editing ? 'Rätta händelse' : 'Lägg till händelse'} onRequestClose={onClose} onPrimaryAction={onSave} primaryLabel={busy ? 'Sparar…' : 'Spara'}>
    <View accessibilityRole="radiogroup" accessibilityLabel="Typ av händelse" style={styles.typeChoices}>
      <Button label="Vaccination" accessibilityLabel="Vaccination" variant={type === 'vaccination' ? 'secondary' : 'tertiary'} disabled={blocked || editing} onPress={() => onTypeChange('vaccination')} />
      <Button label="Veterinärbesök" accessibilityLabel="Veterinärbesök" variant={type === 'vet_visit' ? 'secondary' : 'tertiary'} disabled={blocked || editing} onPress={() => onTypeChange('vet_visit')} />
    </View>
    <Field label="Datum" kind="date" value={date} onChangeText={onDateChange} state={blocked ? 'disabled' : error && !date ? 'error' : 'default'} help="ÅÅÅÅ-MM-DD" />
    <Field label="Kort anteckning (frivillig)" kind="multiline" value={note} onChangeText={onNoteChange} placeholder="Till exempel: första vaccinationen" state={blocked ? 'disabled' : error ? 'error' : 'default'} error={error || undefined} help={`${Array.from(note).length}/500 tecken`} />
    {toast ? <Toast tone="success" confirmed message={toast} /> : null}
  </BottomSheet>;
}

const styles = StyleSheet.create({
  section: { marginTop: tokens.layout.sectionGap },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, marginBottom: tokens.layout.headingGap },
  headingIcon: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  sectionTitle: { color: tokens.colors.textPrimary, ...tokens.typography.heading },
  sectionBody: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs },
  caption: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginBottom: tokens.spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.spacing.md, marginBottom: tokens.spacing.xs },
  infoHint: { color: tokens.colors.textSecondary, ...tokens.typography.caption },
  infoButton: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.sm },
  infoButtonText: { color: tokens.colors.primary, ...tokens.typography.caption, fontWeight: '700' },
  infoBody: { color: tokens.colors.textPrimary, ...tokens.typography.body, marginBottom: tokens.spacing.md },
  typeChoices: { gap: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  conflictCard: { marginTop: tokens.layout.listGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.warning, backgroundColor: tokens.colors.warningSurface },
  conflictTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  conflictBody: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  recordNote: { color: tokens.colors.textPrimary, ...tokens.typography.caption, marginTop: tokens.spacing.sm },
  rowWithMenu: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  rowCopy: { flex: 1 },
});
