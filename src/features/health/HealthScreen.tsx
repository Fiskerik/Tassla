import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageCard, PageHeading } from '../../components/AppPrimitives';
import { BottomSheet, Button, ListRow, SectionHeader, Skeleton, Tabs, Toast } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import type { HealthHistoryRecord, HealthHistoryType, PlannedHealthRecord } from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { HealthHistoryScreen } from './HealthHistoryScreen';
import { WeightScreen } from './WeightScreen';

type OpeningRecord = Pick<HealthHistoryRecord, 'id' | 'dog_id' | 'event_type' | 'occurred_on' | 'occurred_time' | 'description'>;
type LeaveRequest = (commit: () => void) => void;
export type HealthHistoryConfirmation = { lifetime: string; sequence: number; kind: 'insert' | 'update' | 'delete'; targetId: string };
type Props = Omit<ComponentProps<typeof WeightScreen>, 'onSaveHistory' | 'onDeleteHistory'> & {
  plannedRecords?: readonly PlannedHealthRecord[];
  plannedLoadState?: 'loading' | 'ready' | 'error';
  onRetryPlannedHealth?: () => void;
  onSaveHistory?: (id: string | null, type: HealthHistoryType, date: string, time: string | null, note: string, openingRecord: OpeningRecord | null) => Promise<boolean>;
  onDeleteHistory?: (id: string, openingRecord: OpeningRecord) => Promise<boolean>;
  historyLifetime?: string;
  historyScope?: { ownerId: string; accountGeneration: number; dogId: string };
  historyConfirmation?: HealthHistoryConfirmation | null;
  registerEditorLeaveGuard?: (owner: symbol, requestLeave: LeaveRequest) => () => void;
};

export function HealthScreen(props: Props) {
  const { onSaveHistory, onDeleteHistory, ...weightProps } = props;
  const [tab, setTab] = useState('Översikt');
  const [sheet, setSheet] = useState<'choose' | 'history' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<HealthHistoryType | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const historyGuard = useRef<{ owner: symbol; requestLeave: LeaveRequest } | null>(null);
  const consumedConfirmationSequence = useRef(props.historyConfirmation?.sequence ?? 0);
  const historyLifetime = props.historyLifetime ?? 'preview';
  const historyScope = props.historyScope ?? { ownerId: '', accountGeneration: 0, dogId: '' };
  const type = tab === 'Veterinär' ? 'vet_visit' : 'vaccination';
  const history = (props.historyRecords ?? []).filter((row) => tab === 'Översikt' || row.event_type === type);
  const plans = (props.plannedRecords ?? []).filter((row) => tab === 'Översikt' || row.event_type === type);
  const overdue = plans.filter((row) => row.due_on < localDate());
  const upcoming = plans.filter((row) => row.due_on >= localDate());
  const blocked = props.historyBusy || props.historyPending;
  const initialType = editingType ?? (editingId ? props.historyRecords?.find((row) => row.id === editingId)?.event_type : undefined) ?? type;
  const historyEditorKey = JSON.stringify([
    historyScope.ownerId,
    historyScope.accountGeneration,
    historyScope.dogId,
    editingId ?? 'new',
    initialType,
  ]);
  const registerSheetLeaveGuard = useCallback((owner: symbol, requestLeave: LeaveRequest) => {
    historyGuard.current = { owner, requestLeave };
    return () => { if (historyGuard.current?.owner === owner) historyGuard.current = null; };
  }, []);
  const leaveHistoryEditor = useCallback(() => {
    setSheet(null);
    setEditingId(null);
    setEditingType(null);
  }, []);
  const historyReloadWarning = props.historyMessage?.startsWith('Ändringen är sparad, men historiken kunde inte uppdateras.')
    ? <MessageCard>{props.historyMessage}</MessageCard> : null;
  const confirmationToast = <Toast visible={toastVisible} tone="success" confirmed message={toastMessage ?? undefined} autoDismissMs={2500}
    onAutoDismiss={() => setToastVisible(false)} onExitComplete={() => setToastMessage(null)} />;

  useEffect(() => {
    const event = props.historyConfirmation;
    if (!event || event.lifetime !== historyLifetime || event.sequence <= consumedConfirmationSequence.current) return;
    consumedConfirmationSequence.current = event.sequence;
    setSheet(null);
    setEditingId(null);
    setToastMessage(event.kind === 'insert' ? 'Hälsohändelsen lades till.' : event.kind === 'update' ? 'Hälsohändelsen uppdaterades.' : 'Hälsohändelsen raderades.');
    setToastVisible(true);
  }, [historyLifetime, props.historyConfirmation]);

  function requestSheetClose() {
    if (sheet === 'history' && historyGuard.current) {
      historyGuard.current.requestLeave(leaveHistoryEditor);
      return;
    }
    leaveHistoryEditor();
  }

  if (tab === 'Vikt') return <View>{historyReloadWarning}<WeightScreen {...weightProps} onBack={() => setTab('Översikt')} />{confirmationToast}</View>;
  return <View>
    <PageHeading title="Hälsa" description="Vikt, planerade och genomförda hälsohändelser." />
    {historyReloadWarning}
    {confirmationToast}
    <Tabs items={['Översikt', 'Vaccinationer', 'Veterinär', 'Vikt']} active={tab} onChange={setTab} variant="rev02-segmented" />
    {props.plannedLoadState === 'ready' && overdue.length ? <><SectionHeader title="Datum har passerat" /><View style={styles.rows}>{overdue.map((row) => <ListRow key={row.id} category={row.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} title={row.description || (row.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök')} time={row.due_time?.slice(0, 5)} meta={planMeta(row, `Planerad ${shortDate(row.due_on)}`)} onPress={props.onOpenPlannedHealth} />)}</View></> : null}
    <SectionHeader title="Kommande" />
    {props.plannedLoadState === 'loading' ? <Skeleton shape="row" lines={2} /> : props.plannedLoadState === 'error' ? <Button variant="secondary" label="Hämta planer igen" accessibilityLabel="Hämta planer igen" disabled={!props.onRetryPlannedHealth} onPress={() => props.onRetryPlannedHealth?.()} /> : <View style={styles.rows}>
      {upcoming.length ? upcoming.map((row) => <ListRow key={row.id} category={row.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} title={row.description || (row.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök')} time={row.due_time?.slice(0, 5)} meta={planMeta(row, `${relativeDate(row.due_on)} · ${shortDate(row.due_on)}`)} onPress={props.onOpenPlannedHealth} />) : <Text style={styles.empty}>Inga kommande händelser.</Text>}
    </View>}
    <SectionHeader title="Genomfört" />
    {props.historyLoadState === 'loading' ? <Skeleton shape="row" lines={3} /> : props.historyLoadState === 'error' ? <Button variant="secondary" label="Hämta historiken igen" accessibilityLabel="Hämta historiken igen" onPress={() => props.onRetryHistory?.()} /> : <View style={styles.rows}>
    {history.length ? history.map((row) => <ListRow key={row.id} category={row.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} title={row.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök'} time={row.occurred_time ?? undefined} meta={[shortDate(row.occurred_on), row.description].filter(Boolean).join(' · ')} complete onPress={() => { setEditingId(row.id); setEditingType(row.event_type); setSheet('history'); }} />) : <Text style={styles.empty}>Inga händelser ännu. Lägg till när något har hänt.</Text>}
    </View>}
    {tab === 'Översikt' && props.records?.length ? <><SectionHeader title="Senaste vikten" /><ListRow category="veterinary" title={`${props.records[0].weight_kg.toLocaleString('sv-SE')} kg`} meta={shortDate(props.records[0].occurred_on)} onPress={() => setTab('Vikt')} /></> : null}
    <View style={styles.action}><Button label="Lägg till händelse" accessibilityLabel="Lägg till hälsohändelse" disabled={!onSaveHistory || Boolean(blocked)} onPress={() => { setEditingId(null); setEditingType(null); setSheet('choose'); }} /></View>
    <BottomSheet visible={sheet !== null} title={sheet === 'choose' ? 'Lägg till händelse' : editingId ? 'Ändra händelse' : 'Genomförd händelse'} onRequestClose={requestSheetClose}>
      {sheet === 'choose' ? <>
        <ListRow category="vaccination" title="Något som har hänt" meta="Vaccination eller veterinärbesök" onPress={() => setSheet('history')} />
        {props.onOpenPlannedHealth ? <ListRow category="veterinary" title="Planera en händelse" meta="Datum och påminnelse" onPress={() => { setSheet(null); props.onOpenPlannedHealth?.(); }} /> : null}
        <ListRow category="veterinary" title="Lägg till vikt" onPress={() => { setSheet(null); setTab('Vikt'); }} />
      </> : sheet === 'history' ? <HealthHistoryScreen key={historyEditorKey} initialEditingId={editingId} initialType={initialType}
        lifetime={historyLifetime}
        records={props.historyRecords} loadState={props.historyLoadState} busy={props.historyBusy} pending={props.historyPending}
        statusMessage={props.historyMessage} statusError={props.historyMessageError} conflict={props.historyConflict}
        onRetry={props.onRetryHistory} onResolveConflict={props.onResolveHistoryConflict}
        onSave={onSaveHistory} onDelete={onDeleteHistory}
        registerEditorLeaveGuard={props.registerEditorLeaveGuard} registerSheetLeaveGuard={registerSheetLeaveGuard}
        onLeaveConfirmed={leaveHistoryEditor} /> : null}
    </BottomSheet>
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
function formatMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
const styles = StyleSheet.create({ rows: { gap: tokens.spacing.xs }, empty: { ...tokens.typography.body, color: tokens.colors.textSecondary, paddingVertical: tokens.spacing.md }, action: { marginTop: tokens.spacing.xl } });
