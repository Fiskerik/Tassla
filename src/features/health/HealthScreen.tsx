import { useCallback, useRef, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PageHeading } from '../../components/AppPrimitives';
import { BottomSheet, Button, Dialog, ListRow, SectionHeader, Skeleton, Tabs } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import type { PlannedHealthRecord } from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { HealthHistoryScreen, type HealthHistoryDraft, type HealthHistoryEditorState } from './HealthHistoryScreen';
import { WeightScreen, type WeightEditorRecovery } from './WeightScreen';

export type HealthTab = 'Översikt' | 'Vaccinationer' | 'Veterinär' | 'Vikt';
type Props = Omit<ComponentProps<typeof WeightScreen>, 'onSaveHistory' | 'onOpenPlannedHealth'> & {
  activeTab?: HealthTab;
  onActiveTabChange?: (tab: HealthTab) => void;
  plannedRecords?: readonly PlannedHealthRecord[];
  plannedLoadState?: 'loading' | 'ready' | 'error';
  onRetryPlannedHealth?: () => void;
  onSaveHistory?: (id: string | null, type: 'vaccination' | 'vet_visit', date: string, time: string | null, note: string) => Promise<boolean>;
  onOpenPlannedHealth?: (planId: string, returnTab: HealthTab) => void;
  onCreatePlannedHealth?: (returnTab: HealthTab) => void;
  historyEditorRecovery?: HealthHistoryDraft | null;
  onHistoryEditorRecoveryChange?: (draft: HealthHistoryDraft | null) => void;
  weightEditorRecovery?: WeightEditorRecovery | null;
  onWeightEditorRecoveryChange?: (draft: WeightEditorRecovery | null) => void;
};

export function HealthScreen(props: Props) {
  const { onSaveHistory, onOpenPlannedHealth, onHistoryEditorRecoveryChange, activeTab, onActiveTabChange, ...weightProps } = props;
  const [localTab, setLocalTab] = useState<HealthTab>('Översikt');
  const tab = activeTab ?? localTab;
  const setTab = (next: string) => {
    const value = next as HealthTab;
    setLocalTab(value);
    onActiveTabChange?.(value);
  };
  const [sheet, setSheet] = useState<'choose' | 'history' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyType, setHistoryType] = useState<'vaccination' | 'vet_visit'>(tab === 'Veterinär' ? 'vet_visit' : 'vaccination');
  const [restoringRecovery, setRestoringRecovery] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);
  const [editorState, setEditorState] = useState<HealthHistoryEditorState>({ canSave: false, saving: false, dirty: false });
  const submitRef = useRef<(() => Promise<void>) | null>(null);
  const type = tab === 'Veterinär' ? 'vet_visit' : 'vaccination';
  const history = (props.historyRecords ?? []).filter((row) => tab === 'Översikt' || row.event_type === type);
  const plans = (props.plannedRecords ?? []).filter((row) => tab === 'Översikt' || row.event_type === type);
  const overdue = plans.filter((row) => row.due_on < localDate());
  const upcoming = plans.filter((row) => row.due_on >= localDate());
  const blocked = Boolean(props.historyBusy || props.historyPending);
  const historyRecovery = props.historyEditorRecovery;
  const recoveryMatches = restoringRecovery && Boolean(historyRecovery && historyRecovery.id === editingId);

  const updateEditorState = useCallback((next: HealthHistoryEditorState) => {
    setEditorState((current) => current.canSave === next.canSave && current.saving === next.saving && current.dirty === next.dirty ? current : next);
  }, []);
  const updateHistoryDraft = useCallback((draft: HealthHistoryDraft) => {
    onHistoryEditorRecoveryChange?.(draft);
  }, [onHistoryEditorRecoveryChange]);

  function openHistory(id: string | null, initialType: 'vaccination' | 'vet_visit' = type) {
    setEditingId(id);
    setHistoryType(initialType);
    setRestoringRecovery(false);
    setEditorState({ canSave: false, saving: false, dirty: false });
    setSheet('history');
  }

  function openHistoryRecovery() {
    if (!historyRecovery) return;
    setEditingId(historyRecovery.id);
    setHistoryType(historyRecovery.type);
    setRestoringRecovery(true);
    setEditorState({ canSave: false, saving: false, dirty: false });
    setSheet('history');
  }

  function closeHistorySheet() {
    if (editorState.saving || props.historyBusy) return;
    if (props.historyPending) {
      setSheet(null);
      setEditingId(null);
      return;
    }
    if (editorState.dirty) { setDiscardVisible(true); return; }
    setSheet(null);
    setEditingId(null);
    onHistoryEditorRecoveryChange?.(null);
    setRestoringRecovery(false);
  }

  const finishHistoryEditor = useCallback(() => {
    setSheet(null);
    setEditingId(null);
    setRestoringRecovery(false);
    setDiscardVisible(false);
    onHistoryEditorRecoveryChange?.(null);
  }, [onHistoryEditorRecoveryChange]);

  if (tab === 'Vikt') return <WeightScreen {...weightProps} onBack={() => setTab('Översikt')}
    editorRecovery={props.weightEditorRecovery} onEditorRecoveryChange={props.onWeightEditorRecoveryChange} />;

  const openPlan = (planId: string) => onOpenPlannedHealth?.(planId, tab);
  const planTypeLabel = (row: PlannedHealthRecord) => row.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök';
  const renderPlan = (row: PlannedHealthRecord, dateLabel: string) => <ListRow key={row.id}
    category={row.event_type === 'vaccination' ? 'vaccination' : 'veterinary'}
    title={row.description || planTypeLabel(row)} time={row.due_time?.slice(0, 5)}
    meta={planMeta(row, dateLabel)} onPress={() => openPlan(row.id)} />;

  return <View>
    <PageHeading title="Hälsa" description="Vikt, planerade och genomförda hälsohändelser." />
    <Tabs items={['Översikt', 'Vaccinationer', 'Veterinär', 'Vikt']} active={tab} onChange={setTab} variant="rev02-segmented" />
    {props.plannedLoadState === 'ready' && overdue.length ? <><SectionHeader title="Datum har passerat" /><View style={styles.rows}>{overdue.map((row) => renderPlan(row, `Planerad ${shortDate(row.due_on)}`))}</View></> : null}
    <SectionHeader title="Kommande" />
    {props.plannedLoadState === 'loading' ? <Skeleton shape="row" lines={2} /> : props.plannedLoadState === 'error' ? <Button variant="secondary" label="Hämta planer igen" accessibilityLabel="Hämta planer igen" disabled={!props.onRetryPlannedHealth} onPress={() => props.onRetryPlannedHealth?.()} /> : <View style={styles.rows}>
      {upcoming.length ? upcoming.map((row) => renderPlan(row, `${relativeDate(row.due_on)} · ${shortDate(row.due_on)}`)) : <Text style={styles.empty}>Inga kommande händelser.</Text>}
    </View>}
    {props.onCreatePlannedHealth ? <Button variant="tertiary" label="Planera en händelse" accessibilityLabel="Planera en hälsohändelse" onPress={() => props.onCreatePlannedHealth?.(tab)} /> : null}
    <SectionHeader title="Genomfört" />
    {props.historyLoadState === 'loading' ? <Skeleton shape="row" lines={3} /> : props.historyLoadState === 'error' ? <Button variant="secondary" label="Hämta historiken igen" accessibilityLabel="Hämta historiken igen" onPress={() => props.onRetryHistory?.()} /> : <View style={styles.rows}>
      {history.length ? history.map((row) => <ListRow key={row.id} category={row.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} title={row.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök'} time={row.occurred_time ?? undefined} meta={[shortDate(row.occurred_on), row.description].filter(Boolean).join(' · ')} complete onPress={() => openHistory(row.id, row.event_type)} />) : <Text style={styles.empty}>Inga händelser ännu. Lägg till när något har hänt.</Text>}
    </View>}
    {tab === 'Översikt' && props.records?.length ? <><SectionHeader title="Senaste vikten" /><ListRow category="veterinary" title={`${props.records[0].weight_kg.toLocaleString('sv-SE')} kg`} meta={shortDate(props.records[0].occurred_on)} onPress={() => setTab('Vikt')} /></> : null}
    {historyRecovery && (props.historyPending || props.historyMessageError) ? <View style={styles.recovery}>
      <Text style={styles.recoveryCopy}>{props.historyPending ? 'Händelsen väntar på kontroll. Ditt utkast finns kvar.' : 'Händelsen kunde inte sparas. Ditt utkast finns kvar.'}</Text>
      <View style={styles.recoveryActions}>
        {props.historyPending && <Button variant="icon" label="Kontrollera sparstatus" accessibilityLabel="Kontrollera samma hälsohändelse" iconName="refresh-outline" disabled={props.historyBusy} onPress={() => props.onRetryHistory?.()} />}
        <Button variant="icon" label="Öppna händelse" accessibilityLabel="Öppna samma hälsohändelse" iconName="create-outline" onPress={openHistoryRecovery} />
      </View>
    </View> : null}
    <View style={styles.action}><Button label="Lägg till händelse" accessibilityLabel="Lägg till hälsohändelse" disabled={!onSaveHistory || blocked} onPress={() => { setEditingId(null); setSheet('choose'); }} /></View>
    <BottomSheet visible={sheet === 'choose'} title="Lägg till händelse" onRequestClose={() => setSheet(null)}>
      <ListRow category="vaccination" title="Registrera utförd händelse" meta="Vaccination eller veterinärbesök" onPress={() => openHistory(null, type)} />
      {props.onCreatePlannedHealth ? <ListRow category="veterinary" title="Planera en händelse" meta="Datum och påminnelse" onPress={() => { setSheet(null); props.onCreatePlannedHealth?.(tab); }} /> : null}
      <ListRow category="veterinary" title="Lägg till vikt" onPress={() => { setSheet(null); setTab('Vikt'); }} />
    </BottomSheet>
    <BottomSheet visible={sheet === 'history'} title={editingId ? 'Ändra hälsohändelse' : 'Registrera hälsohändelse'} keyboardAware
      footer={<Button label={editorState.saving ? 'Sparar…' : editingId ? 'Spara ändring' : 'Spara händelse'} accessibilityLabel={editorState.saving ? 'Sparar hälsohändelse' : 'Spara hälsohändelse'} loading={editorState.saving}
        disabled={!editorState.canSave || blocked || editorState.saving} onPress={() => { void submitRef.current?.(); }} />}
      onRequestClose={closeHistorySheet}>
      <HealthHistoryScreen key={`${editingId ?? 'new'}:${historyRecovery?.id ?? ''}`} initialEditingId={editingId}
        initialType={restoringRecovery && historyRecovery ? historyRecovery.type : historyType} initialDraft={recoveryMatches ? historyRecovery ?? undefined : undefined}
        records={props.historyRecords} loadState={props.historyLoadState} busy={props.historyBusy} pending={props.historyPending}
        statusMessage={props.historyMessage} statusError={props.historyMessageError} conflict={props.historyConflict}
        onRetry={props.onRetryHistory} onResolveConflict={props.onResolveHistoryConflict} onDraftChange={updateHistoryDraft}
        onActionStateChange={updateEditorState} submitRef={submitRef} onSaved={finishHistoryEditor}
        onSave={async (...args) => await onSaveHistory?.(...args) ?? false}
        onDelete={async (id) => await props.onDeleteHistory?.(id) ?? false} />
    </BottomSheet>
    <Dialog visible={discardVisible} title="Kasta ändringen?" confirmLabel="Kasta ändring" compactActions
      onRequestClose={() => setDiscardVisible(false)} onConfirm={() => { setDiscardVisible(false); finishHistoryEditor(); }}>
      <Text style={styles.empty}>Ändringen är inte sparad. Din tidigare hälsahistorik påverkas inte.</Text>
    </Dialog>
  </View>;
}

function shortDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }); }
function relativeDate(value: string) {
  const days = Math.round((Date.parse(`${value}T12:00:00Z`) - Date.parse(`${localDate()}T12:00:00Z`)) / 86400000);
  return days === 0 ? 'Idag' : days === 1 ? 'Imorgon' : `Om ${days} dagar`;
}
function planMeta(row: PlannedHealthRecord, dateLabel: string): string {
  const parts = [dateLabel];
  if (row.reminder_minutes !== null) parts.push(`Påminnelse ${formatMinutes(row.reminder_minutes)}`);
  return parts.join(' · ');
}
function formatMinutes(minutes: number): string { return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; }
const styles = StyleSheet.create({
  rows: { gap: tokens.spacing.xs }, empty: { ...tokens.typography.body, color: tokens.colors.textSecondary, paddingVertical: tokens.spacing.md },
  action: { marginTop: tokens.spacing.xl }, recovery: { gap: tokens.spacing.xs, marginTop: tokens.spacing.sm },
  recoveryCopy: { ...tokens.typography.body, color: tokens.colors.danger }, recoveryActions: { flexDirection: 'row', gap: tokens.spacing.sm },
});
