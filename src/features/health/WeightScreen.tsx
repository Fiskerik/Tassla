import { useEffect, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { DatePickerField, MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { isValidHealthWeightDate, isValidHealthWeightKg, type HealthHistoryRecord, type HealthHistoryType, type HealthWeightRecord } from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';
import { AppBar, Button, ListRow } from '../../components/ui';
import { Toast } from '../../components/ui/Toast';
type LoadState = 'loading' | 'ready' | 'error';

export function WeightScreen({
  onBack,
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
  const [toastVisible, setToastVisible] = useState(false);
  const confirmedMessage = statusMessage?.startsWith('Ändringen är sparad') && !statusError && !pendingStatus && !isBusy
    ? statusMessage : null;
  useEffect(() => {
    // The toast mirrors an external save-status prop and is intentionally reset here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!confirmedMessage) { setToastVisible(false); return; }
    setToastMessage(confirmedMessage);
    setToastVisible(true);
  }, [confirmedMessage, toastNonce]);

  function startEditing(record: HealthWeightRecord) {
    setEditingId(record.id);
    setToastVisible(false);
    setToastRecordId(null);
    setEditDate(record.occurred_on);
    setEditWeight(String(record.weight_kg));
    setFormError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setToastVisible(false);
    setToastRecordId(null);
    setEditDate('');
    setEditWeight('');
    setFormError('');
    Keyboard.dismiss();
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
      }
    }
  }

  function confirmDelete(record: HealthWeightRecord) {
    Alert.alert('Radera viktpost?', 'Viktposten tas bort från hundens hälsahistorik.', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Radera', style: 'destructive', onPress: () => { void onDelete?.(record.id); } },
    ]);
  }

  if (!isCloud) return <View><AppBar mode="Back" title="Vikt" onAction={onBack} /><MessageCard>Här samlas hundens vikter när du har lagt till en vikt.</MessageCard></View>;
  return (
    <View>
      <AppBar mode="Back" title="Vikt" onAction={onBack} />
      {cloudLoadState === 'loading' && <MessageCard>Hämtar hundens vikthistorik…</MessageCard>}
      {cloudLoadState === 'error' && <>
        <MessageCard tone="error">Vikthistoriken kunde inte hämtas.</MessageCard>
        <PrimaryButton title="Försök igen" disabled={isBusy} onPress={() => onRetry?.()} />
      </>}
      {cloudLoadState === 'ready' && <>
        {statusMessage && statusError ? <>
          <MessageCard tone="error">{statusMessage}</MessageCard>
          {pendingStatus && <PrimaryButton title="Kontrollera status" disabled={isBusy} onPress={() => onRetryPending?.()} />}
        </> : null}
        {isBusy && <MessageCard>Sparar och kontrollerar ändringen…</MessageCard>}
        {!editingId && <View style={styles.formCard}>
          <Text style={styles.formTitle} accessibilityRole="header">Lägg till vikt</Text>
          <DatePickerField label="Datum" disabled={isBlocked || Boolean(editingId)} onChangeText={setDate} value={date} />
          <View style={styles.field}>
            <Text style={styles.label}>Vikt (kg)</Text>
            <TextInput
              accessibilityLabel="Vikt i kilogram"
              editable={!isBlocked && !editingId}
              keyboardType="decimal-pad"
              onChangeText={setWeight}
              onSubmitEditing={() => Keyboard.dismiss()}
              placeholder="Till exempel 4,25"
              placeholderTextColor={tokens.colors.textSecondary}
              returnKeyType="done"
              style={styles.input}
              value={weight}
            />
          </View>
          {!editingId && formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
          <PrimaryButton title={isBusy ? 'Sparar…' : 'Spara vikt'} disabled={isBlocked || Boolean(editingId)} onPress={() => { void save(); }} />
          <Toast visible={toastVisible && !toastRecordId} tone="success" confirmed message={toastMessage ?? undefined} autoDismissMs={2500}
            onAutoDismiss={() => setToastVisible(false)} onExitComplete={() => {
              if (toastVisible || toastRecordId !== null) return;
              setToastMessage(null);
              setToastRecordId(null);
            }} />
        </View>}
        <Text style={styles.sectionTitle} accessibilityRole="header">Vikthistorik</Text>
        {cloudRecords.length === 0 && <MessageCard>Ingen vikt har registrerats ännu.</MessageCard>}
        {cloudRecords.map((record) => (
          <View key={record.id} style={styles.recordCard}>
            {editingId === record.id ? <>
              <Text style={styles.formTitle} accessibilityRole="header">Rätta viktpost</Text>
              <DatePickerField label="Datum" disabled={isBlocked} onChangeText={setEditDate} value={editDate} />
              <View style={styles.field}>
                <Text style={styles.label}>Vikt (kg)</Text>
                <TextInput
                  accessibilityLabel="Vikt i kilogram"
                  editable={!isBlocked}
                  keyboardType="decimal-pad"
                  onChangeText={setEditWeight}
                  onSubmitEditing={() => Keyboard.dismiss()}
                  placeholder="Till exempel 4,25"
                  placeholderTextColor={tokens.colors.textSecondary}
                  returnKeyType="done"
                  style={styles.input}
                  value={editWeight}
                />
              </View>
              {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
              <View style={styles.actions}>
                <PrimaryButton title={isBusy ? 'Sparar…' : 'Spara rättning'} disabled={isBlocked} onPress={() => { void save(); }} />
                <QuietButton title="Avbryt" disabled={isBlocked} onPress={cancelEditing} />
              </View>
              <Button variant="destructive" label="Radera vikt" accessibilityLabel="Radera viktpost" disabled={isBlocked} onPress={() => confirmDelete(record)} />
            </> : <ListRow category="veterinary" title={`${formatWeight(record.weight_kg)} kg`} meta={record.occurred_on} accessibilityLabel={`Ändra vikt ${formatWeight(record.weight_kg)} kg, ${record.occurred_on}`} disabled={isBlocked} onPress={() => startEditing(record)} />}
            <Toast visible={toastVisible && toastRecordId === record.id} tone="success" confirmed message={toastMessage ?? undefined} autoDismissMs={2500}
              onAutoDismiss={() => setToastVisible(false)} onExitComplete={() => {
                if (toastVisible || toastRecordId !== record.id) return;
                setToastMessage(null);
                setToastRecordId(null);
              }} />
          </View>
        ))}
      </>}
    </View>
  );
}

function formatWeight(value: number): string {
  return value.toLocaleString('sv-SE', { maximumFractionDigits: 3 });
}

const styles = StyleSheet.create({
  sectionTitle: { color: tokens.colors.textPrimary, ...tokens.typography.heading, marginTop: tokens.layout.sectionGap },
  formCard: { marginTop: tokens.layout.headingGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  formTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label, marginBottom: tokens.spacing.md },
  field: { marginBottom: tokens.spacing.md },
  label: { color: tokens.colors.textPrimary, ...tokens.typography.caption, fontWeight: '700', marginBottom: tokens.spacing.xs },
  input: { minHeight: tokens.size.touchMin + tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body },
  recordCard: { marginTop: tokens.layout.listGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  recordHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  recordWeight: { color: tokens.colors.textPrimary, ...tokens.typography.heading },
  recordDate: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'flex-start', gap: tokens.spacing.sm, marginTop: tokens.spacing.sm },
});
