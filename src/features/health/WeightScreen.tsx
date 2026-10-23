import { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { DatePickerField, MessageCard } from '../../components/AppPrimitives';
import { AppBar, BottomSheet, Button, Dialog, IconChip, ListRow, SectionHeader, Toast } from '../../components/ui';
import { isValidHealthWeightDate, isValidHealthWeightKg, type HealthHistoryRecord, type HealthHistoryType, type HealthWeightRecord } from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';

type LoadState = 'loading' | 'ready' | 'error';
export type WeightEditorDraft = { id: string | null; date: string; weight: string };
export type WeightEditorRecovery = WeightEditorDraft;

export function WeightScreen({
  onBack, records, loadState, busy = false, statusMessage = '', statusError = false, pendingStatus = false,
  blocked = busy, onRetry, onRetryPending, onSave, onDelete, editorRecovery, onEditorRecoveryChange,
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
  editorRecovery?: WeightEditorRecovery | null;
  onEditorRecoveryChange?: (draft: WeightEditorRecovery | null) => void;
}) {
  const cloudRecords = records ?? [];
  const cloudLoadState = loadState ?? 'ready';
  const isCloud = records !== undefined;
  const [sheetVisible, setSheetVisible] = useState(false);
  const [draft, setDraft] = useState<WeightEditorDraft | null>(null);
  const [baseline, setBaseline] = useState<WeightEditorDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [savedToastVisible, setSavedToastVisible] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HealthWeightRecord | null>(null);
  const submitLock = useRef(false);
  const selectedRecord = draft?.id ? cloudRecords.find((row) => row.id === draft.id) ?? null : null;
  const recoveryRecordMissing = Boolean(editorRecovery?.id && !cloudRecords.some((row) => row.id === editorRecovery.id));
  const dirty = Boolean(draft && baseline && JSON.stringify(draft) !== JSON.stringify(baseline));
  const normalizedWeight = draft?.weight.trim().replace(',', '.') ?? '';
  const parsedWeight = Number(normalizedWeight);
  const canSave = Boolean(draft && isValidHealthWeightDate(draft.date)
    && /^\d+(?:\.\d{1,3})?$/.test(normalizedWeight) && isValidHealthWeightKg(parsedWeight));

  useEffect(() => {
    if (draft) onEditorRecoveryChange?.(draft);
  }, [draft, onEditorRecoveryChange]);

  function openNew() {
    const next = { id: null, date: localDate(), weight: '' };
    setDraft(next);
    setBaseline(next);
    setFormError('');
    setSheetVisible(true);
  }

  function openRecord(record: HealthWeightRecord) {
    const next = { id: record.id, date: record.occurred_on, weight: String(record.weight_kg) };
    setDraft(next);
    setBaseline(next);
    setFormError('');
    setSheetVisible(true);
  }

  function openRecovery() {
    if (!editorRecovery) return;
    const record = editorRecovery.id ? cloudRecords.find((row) => row.id === editorRecovery.id) : null;
    if (editorRecovery.id && !record) return;
    const next = { ...editorRecovery };
    const original = record
      ? { id: record.id, date: record.occurred_on, weight: String(record.weight_kg) }
      : { id: null, date: localDate(), weight: '' };
    setDraft(next);
    setBaseline(original);
    setFormError('');
    setSheetVisible(true);
  }

  function clearDraft() {
    setSheetVisible(false);
    setDraft(null);
    setBaseline(null);
    setFormError('');
    onEditorRecoveryChange?.(null);
    Keyboard.dismiss();
  }

  function requestClose() {
    if (saving || busy) return;
    if (pendingStatus) { setSheetVisible(false); setDraft(null); setBaseline(null); Keyboard.dismiss(); return; }
    if (dirty) { setDiscardVisible(true); return; }
    clearDraft();
  }

  async function save() {
    if (!draft || !canSave || blocked || submitLock.current) return;
    submitLock.current = true;
    setSaving(true);
    setFormError('');
    try {
      if (await onSave?.(draft.id, draft.date, parsedWeight)) {
        setSavedToastVisible(true);
        clearDraft();
      }
      else if (!pendingStatus) setFormError('Vikten kunde inte sparas. Dina uppgifter finns kvar.');
    } catch {
      if (!pendingStatus) setFormError('Vikten kunde inte sparas. Dina uppgifter finns kvar.');
    } finally {
      submitLock.current = false;
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target || blocked) return;
    try {
      if (await onDelete?.(target.id)) {
        setSavedToastVisible(true);
        clearDraft();
      }
    } catch {
      // The workspace owns the authoritative write status; keep the exact row draft here.
    }
  }

  if (!isCloud) return <View><AppBar mode="Back" title="Vikt" onAction={onBack} /><MessageCard>Här samlas hundens vikter när du har lagt till en vikt.</MessageCard></View>;
  return <View>
    <AppBar mode="Back" title="Vikt" onAction={onBack} />
    <Toast visible={savedToastVisible} tone="success" confirmed message="Ändringen är sparad." autoDismissMs={2500}
      onAutoDismiss={() => setSavedToastVisible(false)} onExitComplete={() => setSavedToastVisible(false)} />
    {cloudLoadState === 'loading' && <MessageCard>Hämtar hundens vikthistorik…</MessageCard>}
    {cloudLoadState === 'error' && <>
      <MessageCard tone="error">Vikthistoriken kunde inte hämtas.</MessageCard>
      <Button label="Försök igen" accessibilityLabel="Försök igen" disabled={busy} onPress={() => onRetry?.()} />
    </>}
    {cloudLoadState === 'ready' && <>
      {statusMessage && statusError ? <View style={styles.status}>
        <MessageCard tone="error">{statusMessage}</MessageCard>
        {pendingStatus && <Button variant="secondary" label="Kontrollera status" accessibilityLabel="Kontrollera samma viktändring" disabled={busy} onPress={() => onRetryPending?.()} />}
      </View> : null}
      {busy && <MessageCard>Sparar och kontrollerar ändringen…</MessageCard>}
      <View style={styles.newAction}><Button label="Lägg till vikt" accessibilityLabel="Lägg till vikt" disabled={blocked || Boolean(editorRecovery)} onPress={openNew} /></View>
      {editorRecovery && (pendingStatus || statusError) ? <View style={styles.recovery}>
        <MessageCard tone={statusError ? 'error' : 'neutral'}>{pendingStatus ? 'Viktändringen väntar på kontroll. Ditt utkast finns kvar.' : 'Vikten kunde inte sparas. Ditt utkast finns kvar.'}</MessageCard>
        {recoveryRecordMissing ? <MessageCard tone="error">Viktposten finns inte längre. Den återställs inte som en ny vikt.</MessageCard> : null}
        <View style={styles.recoveryActions}>
          {pendingStatus && <Button variant="icon" label="Kontrollera sparstatus" accessibilityLabel="Kontrollera samma viktändring" iconName="refresh-outline" disabled={busy} onPress={() => onRetryPending?.()} />}
          <Button variant="icon" label="Öppna viktändring" accessibilityLabel="Öppna samma viktändring" iconName="create-outline" disabled={recoveryRecordMissing} onPress={openRecovery} />
        </View>
      </View> : null}
      <SectionHeader title="Vikthistorik" />
      {cloudRecords.length === 0 ? <MessageCard>Ingen vikt har registrerats ännu.</MessageCard> : cloudRecords.map((record) =>
        <ListRow key={record.id} category="veterinary" title={`${formatWeight(record.weight_kg)} kg`} meta={record.occurred_on}
          accessibilityLabel={`Ändra vikt ${formatWeight(record.weight_kg)} kg, ${record.occurred_on}`} disabled={blocked}
          onPress={() => openRecord(record)} />)}
    </>}
    <BottomSheet visible={sheetVisible && draft !== null} title={draft?.id ? 'Ändra vikt' : 'Lägg till vikt'} keyboardAware
      footer={<Button label={saving || busy ? 'Sparar…' : draft?.id ? 'Spara ändring' : 'Spara vikt'} accessibilityLabel={saving || busy ? 'Sparar vikt' : 'Spara vikt'} loading={saving || busy} disabled={!canSave || blocked || saving} onPress={() => { void save(); }} />}
      onRequestClose={requestClose}>
      {draft ? <View style={styles.editor}>
        <View style={styles.formHeader}><IconChip category="veterinary" /><Text style={styles.formTitle} accessibilityRole="header">{selectedRecord ? `${formatWeight(selectedRecord.weight_kg)} kg · ${selectedRecord.occurred_on}` : 'Ny vikt'}</Text></View>
        <DatePickerField label="Datum" disabled={blocked || saving} onChangeText={(date) => setDraft((current) => current ? { ...current, date } : current)} value={draft.date} />
        <View style={styles.field}>
          <Text style={styles.label}>Vikt (kg)</Text>
          <TextInput accessibilityLabel="Vikt i kilogram" editable={!blocked && !saving} keyboardType="decimal-pad"
            onChangeText={(weight) => setDraft((current) => current ? { ...current, weight } : current)}
            onSubmitEditing={() => Keyboard.dismiss()} placeholder="Till exempel 4,25" placeholderTextColor={tokens.colors.textSecondary}
            returnKeyType="done" style={styles.input} value={draft.weight} />
        </View>
        {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
        {!canSave && !formError ? <Text style={styles.validation}>Ange ett giltigt datum och en vikt mellan 0 och 200 kg.</Text> : null}
        {draft.id ? <View style={styles.deleteAction}><Button variant="icon" label="Radera vikt" iconName="trash-outline"
          accessibilityLabel={`Radera viktpost ${formatWeight(selectedRecord?.weight_kg ?? parsedWeight)} kg från ${draft.date}`}
          disabled={blocked || saving} onPress={() => selectedRecord && setDeleteTarget(selectedRecord)} /></View> : null}
      </View> : null}
    </BottomSheet>
    <Dialog visible={discardVisible} title="Kasta ändringen?" confirmLabel="Kasta ändring" compactActions
      onRequestClose={() => setDiscardVisible(false)} onConfirm={() => { setDiscardVisible(false); clearDraft(); }}>
      <MessageCard>Ändringen är inte sparad. Dina tidigare viktuppgifter påverkas inte.</MessageCard>
    </Dialog>
    <Dialog visible={Boolean(deleteTarget)} title="Radera viktpost?" compactActions
      onRequestClose={() => setDeleteTarget(null)} onConfirm={() => { void confirmDelete(); }}>
      <MessageCard>{deleteTarget ? `${formatWeight(deleteTarget.weight_kg)} kg · ${deleteTarget.occurred_on} tas bort från hundens hälsahistorik.` : ''}</MessageCard>
    </Dialog>
  </View>;
}

function formatWeight(value: number): string { return value.toLocaleString('sv-SE', { maximumFractionDigits: 3 }); }

const styles = StyleSheet.create({
  newAction: { marginTop: tokens.spacing.sm }, status: { gap: tokens.spacing.xs },
  recovery: { gap: tokens.spacing.xs, marginTop: tokens.spacing.sm }, recoveryActions: { flexDirection: 'row', gap: tokens.spacing.sm },
  editor: { gap: tokens.spacing.md }, formHeader: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  formTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label, flexShrink: 1 },
  field: { gap: tokens.spacing.xs }, label: { color: tokens.colors.textPrimary, ...tokens.typography.caption, fontWeight: '700' },
  input: { minHeight: tokens.size.touchMin + tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body },
  validation: { color: tokens.colors.textSecondary, ...tokens.typography.caption }, deleteAction: { alignItems: 'flex-end' },
});
