import { useEffect, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DatePickerField, MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { isValidHealthWeightDate, isValidHealthWeightKg, type HealthHistoryRecord, type HealthHistoryType, type HealthWeightRecord } from '../../data/workspace-data';
import { HealthHistoryScreen } from './HealthHistoryScreen';
import { localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';
import { AppBar, InfoBanner } from '../../components/ui';
import { Toast } from '../../components/ui/Toast';
type LoadState = 'loading' | 'ready' | 'error';

export function HealthScreen({
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
  const confirmedMessage = statusMessage?.startsWith('Ändringen är sparad') && !statusError && !pendingStatus && !isBusy
    ? statusMessage : null;
  useEffect(() => {
    if (!confirmedMessage) { setToastMessage(null); return; }
    setToastMessage(confirmedMessage);
    const timer = setTimeout(() => { setToastMessage(null); setToastRecordId(null); }, 2500);
    return () => clearTimeout(timer);
  }, [confirmedMessage, toastNonce]);

  function startEditing(record: HealthWeightRecord) {
    setEditingId(record.id);
    setToastRecordId(null);
    setToastMessage(null);
    setEditDate(record.occurred_on);
    setEditWeight(String(record.weight_kg));
    setFormError('');
  }

  function cancelEditing() {
    setEditingId(null);
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

  if (!isCloud) {
    return <View>
      <AppBar mode="Back" title="Hälsa" onAction={onBack} />
      <InfoBanner>Håll ordning på hundens hälsa, en sak i taget.</InfoBanner>
      <View style={styles.foundationCard}>
        <View style={styles.iconCircle}><Text style={styles.fallback}>H</Text></View>
        <View style={styles.copy}>
          <Text style={styles.cardTitle}>Hälsan får ta plats i sin egen takt.</Text>
          <Text style={styles.cardBody}>Här visas inga hälsodata, påminnelser eller vårdscheman ännu.</Text>
        </View>
      </View>
      <MessageCard>Den här delen är en grund för framtida funktioner. Den ger inga råd om symtom eller vård.</MessageCard>
    </View>;
  }

  return (
    <View>
      <AppBar mode="Back" title="Hälsa" onAction={onBack} />
      <InfoBanner>Håll ordning på hundens vikt över tid.</InfoBanner>
      <Text style={styles.sectionTitle} accessibilityRole="header">Viktresa</Text>
      <MessageCard>Vikterna är ägarregistrerade uppgifter, inte en verifierad journal. Tassla tolkar inte viktförändringar.</MessageCard>
      {onOpenPlannedHealth && <View style={styles.plannedCard}>
        <View style={styles.plannedIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="calendar-outline" size={tokens.size.iconSm} color={tokens.colors.primary} />
        </View>
        <View style={styles.plannedCopy}>
          <Text style={styles.cardTitle}>Planerade hälsohändelser</Text>
          <Text style={styles.cardBody}>Håll vaccinationer och veterinärbesök åtskilda från det som redan har hänt.</Text>
        </View>
        <PrimaryButton title="Öppna planer" onPress={onOpenPlannedHealth} />
      </View>}
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
        <View style={styles.formCard}>
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
          {toastMessage && !toastRecordId ? <Toast tone="success" confirmed message={toastMessage} /> : null}
        </View>
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
            </> : <>
              <View style={styles.recordHeading}>
                <Text style={styles.recordWeight}>{formatWeight(record.weight_kg)} kg</Text>
              </View>
              <Text style={styles.recordDate}>{record.occurred_on}</Text>
              <View style={styles.actions}>
                <QuietButton title="Ändra" disabled={isBlocked} onPress={() => startEditing(record)} />
                <QuietButton title="Radera" disabled={isBlocked} onPress={() => confirmDelete(record)} />
              </View>
            </>}
            {toastMessage && toastRecordId === record.id ? <Toast tone="success" confirmed message={toastMessage} /> : null}
          </View>
        ))}
      </>}
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

const styles = StyleSheet.create({
  foundationCard: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, padding: tokens.layout.cardPadding },
  iconCircle: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.category.training.bg, alignItems: 'center', justifyContent: 'center' },
  fallback: { color: tokens.colors.primary, ...tokens.typography.label },
  copy: { flex: 1 },
  cardTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  cardBody: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs },
  sectionTitle: { color: tokens.colors.textPrimary, ...tokens.typography.heading, marginTop: tokens.layout.sectionGap },
  formCard: { marginTop: tokens.layout.headingGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  formTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label, marginBottom: tokens.spacing.md },
  field: { marginBottom: tokens.spacing.md },
  label: { color: tokens.colors.textPrimary, ...tokens.typography.caption, fontWeight: '700', marginBottom: tokens.spacing.xs },
  input: { minHeight: tokens.size.touchMin + tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body },
  recordCard: { marginTop: tokens.layout.listGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  plannedCard: { marginTop: tokens.layout.listGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.selectedSurface },
  plannedIcon: { width: tokens.size.chipMd + tokens.spacing.sm, height: tokens.size.chipMd + tokens.spacing.sm, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.category.vaccination.bg, alignItems: 'center', justifyContent: 'center', marginBottom: tokens.spacing.sm },
  plannedCopy: { marginBottom: tokens.spacing.sm },
  recordHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  recordWeight: { color: tokens.colors.textPrimary, ...tokens.typography.heading },
  recordDate: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'flex-start', gap: tokens.spacing.sm, marginTop: tokens.spacing.sm },
});
