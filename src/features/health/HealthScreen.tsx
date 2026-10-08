import { useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActionFeedbackModal, DatePickerField, MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { isValidHealthWeightDate, isValidHealthWeightKg, type HealthHistoryRecord, type HealthHistoryType, type HealthWeightRecord } from '../../data/workspace-data';
import { HealthHistoryScreen } from './HealthHistoryScreen';
import { localDate } from '../onboarding/dog';
import { theme } from '../../theme/tokens';
import { AppBar, InfoBanner } from '../../components/ui';

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
  const [formError, setFormError] = useState('');
  const [dismissedStatus, setDismissedStatus] = useState<string | null>(null);
  const editingRecord = cloudRecords.find((record) => record.id === editingId) ?? null;

  function startEditing(record: HealthWeightRecord) {
    setEditingId(record.id);
    setDate(record.occurred_on);
    setWeight(String(record.weight_kg));
    setFormError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setDate(localDate());
    setWeight('');
    setFormError('');
    Keyboard.dismiss();
  }

  async function save() {
    setDismissedStatus(null);
    setFormError('');
    if (!isValidHealthWeightDate(date)) {
      setFormError('Ange ett giltigt datum som inte ligger i framtiden.');
      return;
    }
    const normalizedWeight = weight.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,3})?$/.test(normalizedWeight)) {
      setFormError('Ange vikten i kg med högst tre decimaler.');
      return;
    }
    const weightKg = Number(normalizedWeight);
    if (!isValidHealthWeightKg(weightKg)) {
      setFormError('Vikten måste vara större än 0 och högst 200 kg.');
      return;
    }
    if (await onSave?.(editingId, date, weightKg)) cancelEditing();
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
          <Ionicons name="calendar-outline" size={21} color={theme.colors.accent} />
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
          <Text style={styles.formTitle} accessibilityRole="header">{editingRecord ? 'Rätta viktpost' : 'Lägg till vikt'}</Text>
          <DatePickerField label="Datum" disabled={isBlocked} onChangeText={setDate} value={date} />
          <View style={styles.field}>
            <Text style={styles.label}>Vikt (kg)</Text>
            <TextInput
              accessibilityLabel="Vikt i kilogram"
              editable={!isBlocked}
              keyboardType="decimal-pad"
              onChangeText={setWeight}
              onSubmitEditing={() => Keyboard.dismiss()}
              placeholder="Till exempel 4,25"
              placeholderTextColor={theme.colors.mutedText}
              returnKeyType="done"
              style={styles.input}
              value={weight}
            />
          </View>
          {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
          <PrimaryButton title={isBusy ? 'Sparar…' : editingRecord ? 'Spara rättning' : 'Spara vikt'} disabled={isBlocked} onPress={() => { void save(); }} />
          {statusMessage && !statusError ? <ActionFeedbackModal visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => setDismissedStatus(statusMessage)} /> : null}
          {editingRecord && <QuietButton title="Avbryt rättning" disabled={isBlocked} onPress={cancelEditing} />}
        </View>
        <Text style={styles.sectionTitle} accessibilityRole="header">Vikthistorik</Text>
        {cloudRecords.length === 0 && <MessageCard>Ingen vikt har registrerats ännu.</MessageCard>}
        {cloudRecords.map((record) => (
          <View key={record.id} style={styles.recordCard}>
            <View style={styles.recordHeading}>
              <Text style={styles.recordWeight}>{formatWeight(record.weight_kg)} kg</Text>
              <Text style={styles.ownerLabel}>ÄGARREGISTRERAD</Text>
            </View>
            <Text style={styles.recordDate}>{record.occurred_on}</Text>
            <View style={styles.actions}>
              <QuietButton title="Ändra" disabled={isBlocked} onPress={() => startEditing(record)} />
              <QuietButton title="Radera" disabled={isBlocked} onPress={() => confirmDelete(record)} />
            </View>
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
  foundationCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 17 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center' },
  fallback: { color: theme.colors.accent, fontSize: 19, fontWeight: '800' },
  copy: { flex: 1 },
  cardTitle: { color: theme.colors.text, fontSize: 17, lineHeight: 23, fontWeight: '800' },
  cardBody: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 5 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800', marginTop: 14 },
  formCard: { marginTop: 20, padding: 17, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  formTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 16 },
  field: { marginBottom: 14 },
  label: { color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 54, paddingHorizontal: 14, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 17 },
  recordCard: { marginTop: 10, padding: 16, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  plannedCard: { marginTop: 13, padding: 15, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#F1F5F0' },
  plannedIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  plannedCopy: { marginBottom: 8 },
  recordHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  recordWeight: { color: theme.colors.text, fontSize: 21, fontWeight: '800' },
  ownerLabel: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  recordDate: { color: theme.colors.mutedText, fontSize: 15, marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8, marginTop: 8 },
});
