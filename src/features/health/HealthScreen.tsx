import { useEffect, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, View } from 'react-native';
import { isValidHealthWeightDate, isValidHealthWeightKg, type HealthHistoryRecord, type HealthHistoryType, type HealthWeightRecord } from '../../data/workspace-data';
import { HealthHistoryScreen } from './HealthHistoryScreen';
import { localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';
import { ActionMenu, BottomSheet, Button, EmptyState, Field, InfoBanner, ListRow, Skeleton } from '../../components/ui';
import { Toast } from '../../components/ui/Toast';
type LoadState = 'loading' | 'ready' | 'error';

export function HealthScreen({
  records,
  loadState,
  busy,
  statusMessage,
  statusError,
  pendingStatus,
  blocked,
  onRetry,
  onRetryPending,
  onSave,
  onDelete,
  historyRecords,
  historyLoadState,
  historyBusy,
  historyPending,
  historyMessage,
  historyMessageError,
  historyConflict,
  onRetryHistory,
  onResolveHistoryConflict,
  onSaveHistory,
  onDeleteHistory,
  onOpenPlannedHealth,
}: {
  onBack: () => void;
  records?: readonly HealthWeightRecord[];
  loadState?: LoadState;
  busy?: boolean;
  statusMessage?: string;
  statusError?: boolean;
  pendingStatus?: boolean;
  blocked?: boolean;
  onRetry?: () => void;
  onRetryPending?: () => void;
  onSave?: (id: string | null, occurredOn: string, weightKg: number) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  historyRecords?: readonly HealthHistoryRecord[];
  historyLoadState?: LoadState;
  historyBusy?: boolean;
  historyPending?: boolean;
  historyMessage?: string;
  historyMessageError?: boolean;
  historyConflict?: { current: HealthHistoryRecord | null } | null;
  onRetryHistory?: () => void;
  onResolveHistoryConflict?: () => void;
  onSaveHistory?: (id: string | null, type: HealthHistoryType, date: string, note: string) => Promise<boolean>;
  onDeleteHistory?: (id: string) => Promise<boolean>;
  onOpenPlannedHealth?: () => void;
}) {
  const cloudRecords = records ?? [];
  const cloudLoadState = loadState ?? 'ready';
  const isCloud = records !== undefined;
  const isBusy = busy ?? false;
  const isBlocked = blocked ?? isBusy;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(localDate());
  const [weight, setWeight] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [toastRecordId, setToastRecordId] = useState<string | null>(null);
  const [toastNonce, setToastNonce] = useState(0);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [weightSheet, setWeightSheet] = useState<'add' | 'edit' | null>(null);
  const [menuRecordId, setMenuRecordId] = useState<string | null>(null);
  const confirmedMessage = statusMessage?.startsWith('Ändringen är sparad') && !statusError && !pendingStatus && !isBusy
    ? statusMessage : null;
  useEffect(() => {
    if (!confirmedMessage) {
      const clearTimer = setTimeout(() => { setToastMessage(null); setToastRecordId(null); }, 0);
      return () => clearTimeout(clearTimer);
    }
    const showTimer = setTimeout(() => setToastMessage(confirmedMessage), 0);
    const timer = setTimeout(() => { setToastMessage(null); setToastRecordId(null); }, 2500);
    return () => { clearTimeout(showTimer); clearTimeout(timer); };
  }, [confirmedMessage, toastNonce]);

  function startEditing(record: HealthWeightRecord) {
    setEditingId(record.id);
    setToastRecordId(null);
    setToastMessage(null);
    setEditDate(record.occurred_on);
    setEditWeight(String(record.weight_kg));
    setFormError('');
    setWeightSheet('edit');
  }

  function cancelEditing() {
    setEditingId(null);
    setToastRecordId(null);
    setEditDate('');
    setEditWeight('');
    setFormError('');
    setWeightSheet(null);
    Keyboard.dismiss();
  }

  function startAdding() {
    setEditingId(null);
    setDate(localDate());
    setWeight('');
    setFormError('');
    setWeightSheet('add');
  }

  async function save() {
    setFormError('');
    const occurredOn = editingId ? editDate : date;
    const enteredWeight = editingId ? editWeight : weight;
    if (!isValidHealthWeightDate(occurredOn)) {
      setFormError('Ange ett giltigt datum som inte ligger i framtiden.');
      return;
    }
    const normalizedWeight = enteredWeight.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,3})?$/.test(normalizedWeight)) {
      setFormError('Ange vikten i kg med högst tre decimaler.');
      return;
    }
    const weightKg = Number(normalizedWeight);
    if (!isValidHealthWeightKg(weightKg)) {
      setFormError('Vikten måste vara större än 0 och högst 200 kg.');
      return;
    }
    if (await onSave?.(editingId, occurredOn, weightKg)) {
      setToastNonce((current) => current + 1);
      if (editingId) {
        const savedRecordId = editingId;
        cancelEditing();
        setToastRecordId(savedRecordId);
      }
      else {
        setDate(localDate());
        setWeight('');
        setFormError('');
        Keyboard.dismiss();
        setWeightSheet(null);
      }
    }
  }

  function confirmDelete(record: HealthWeightRecord) {
    Alert.alert('Radera viktpost?', 'Viktposten tas bort från hundens hälsahistorik.', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Radera', style: 'destructive', onPress: () => { void onDelete?.(record.id); } },
    ]);
  }

  if (!isCloud) {
    return <View>
      <EmptyState title="Ingen hälsodata ännu" actionLabel="Lägg till vikt" onAction={startAdding} />
      <WeightSheet visible={weightSheet !== null} mode={weightSheet ?? 'add'} date={date} weight={weight} error={formError} busy={isBusy} blocked={isBlocked} onDateChange={setDate} onWeightChange={setWeight} onClose={cancelEditing} onSave={() => { void save(); }} />
    </View>;
  }

  return (
    <View>
      <Text style={styles.sectionTitle} accessibilityRole="header">Vikt</Text>
      <Text style={styles.caption}>Ägarregistrerade uppgifter, inte en verifierad journal. Tassla tolkar inte viktförändringar.</Text>
      {onOpenPlannedHealth && <ListRow category="vaccination" title="Planerade hälsohändelser" detail="Vaccinationer och veterinärbesök" onPress={onOpenPlannedHealth} />}
      {cloudLoadState === 'loading' && <Skeleton shape="row" lines={2} />}
      {cloudLoadState === 'error' && <>
        <InfoBanner action={<Button label="Försök igen" accessibilityLabel="Försök igen" variant="secondary" onPress={() => onRetry?.()} />}>Vikthistoriken kunde inte hämtas.</InfoBanner>
      </>}
      {cloudLoadState === 'ready' && <>
        {statusMessage && statusError ? <InfoBanner action={<Button label={pendingStatus ? 'Kontrollera status' : 'Försök igen'} accessibilityLabel={pendingStatus ? 'Kontrollera status' : 'Försök igen'} variant="secondary" disabled={isBusy} onPress={() => (pendingStatus ? onRetryPending?.() : onRetry?.())} />}>{statusMessage}</InfoBanner> : null}
        <Button label="Lägg till" accessibilityLabel="Lägg till vikt" onPress={startAdding} />
        {cloudRecords.length === 0 && <EmptyState title="Ingen vikt registrerad ännu" actionLabel="Lägg till vikt" onAction={startAdding} />}
        {cloudRecords.map((record) => (
          <View key={record.id} style={styles.rowWithMenu}>
            <ListRow category="training" title={`${formatWeight(record.weight_kg)} kg`} detail={record.occurred_on} chevron={false} />
            <ActionMenu visible={menuRecordId === record.id} onOpen={() => setMenuRecordId(record.id)} onClose={() => setMenuRecordId(null)} onEdit={() => startEditing(record)} onDelete={() => confirmDelete(record)} />
            {toastMessage && toastRecordId === record.id ? <Toast tone="success" confirmed message={toastMessage} /> : null}
          </View>
        ))}
      </>}
      <WeightSheet visible={weightSheet !== null} mode={weightSheet ?? 'add'} date={editingId ? editDate : date} weight={editingId ? editWeight : weight} error={formError} busy={isBusy} blocked={isBlocked} onDateChange={editingId ? setEditDate : setDate} onWeightChange={editingId ? setEditWeight : setWeight} onClose={cancelEditing} onSave={() => { void save(); }} />
      <HealthHistoryScreen key={JSON.stringify(historyRecords?.map(({ id, event_type, occurred_on, description }) => [id, event_type, occurred_on, description]))}
        records={historyRecords} loadState={historyLoadState} busy={historyBusy}
        pending={historyPending} statusMessage={historyMessage} statusError={historyMessageError}
        conflict={historyConflict} onRetry={onRetryHistory} onResolveConflict={onResolveHistoryConflict}
        onSave={onSaveHistory} onDelete={onDeleteHistory} />
    </View>
  );
}

function formatWeight(value: number): string {
  return value.toLocaleString('sv-SE', { maximumFractionDigits: 3 });
}

function WeightSheet({ visible, mode, date, weight, error, busy, blocked, onDateChange, onWeightChange, onClose, onSave }: {
  visible: boolean; mode: 'add' | 'edit'; date: string; weight: string; error: string; busy: boolean; blocked: boolean;
  onDateChange: (value: string) => void; onWeightChange: (value: string) => void; onClose: () => void; onSave: () => void;
}) {
  return <BottomSheet visible={visible} title={mode === 'edit' ? 'Rätta vikt' : 'Lägg till vikt'} onRequestClose={onClose} onPrimaryAction={onSave} primaryLabel={busy ? 'Sparar…' : 'Spara'}>
    <Field label="Datum" kind="date" value={date} onChangeText={onDateChange} state={blocked ? 'disabled' : error && !date ? 'error' : 'default'} help="ÅÅÅÅ-MM-DD" />
    <Field label="Vikt (kg)" value={weight} onChangeText={onWeightChange} placeholder="Till exempel 4,25" state={blocked ? 'disabled' : error ? 'error' : 'default'} error={error || undefined} />
  </BottomSheet>;
}

const styles = StyleSheet.create({
  sectionTitle: { color: tokens.colors.textPrimary, ...tokens.typography.heading, marginTop: tokens.layout.sectionGap },
  caption: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs, marginBottom: tokens.spacing.md },
  rowWithMenu: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, borderRadius: tokens.radius.md },
  row: { flex: 1 },
});
