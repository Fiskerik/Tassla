import { useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppBar, BottomSheet, Button, ListRow, SectionHeader, Skeleton, Tabs } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import type { PlannedHealthRecord } from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { HealthHistoryScreen } from './HealthHistoryScreen';
import { WeightScreen } from './WeightScreen';

type Props = ComponentProps<typeof WeightScreen> & {
  plannedRecords?: readonly PlannedHealthRecord[];
  plannedLoadState?: 'loading' | 'ready' | 'error';
};
export function HealthScreen(props: Props) {
  const [tab, setTab] = useState('Översikt');
  const [sheet, setSheet] = useState<'choose' | 'history' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const type = tab === 'Veterinär' ? 'vet_visit' : 'vaccination';
  const history = (props.historyRecords ?? []).filter((row) => tab === 'Översikt' || row.event_type === type);
  const plans = (props.plannedRecords ?? []).filter((row) => tab === 'Översikt' || row.event_type === type);
  const overdue = plans.filter((row) => row.due_on < localDate());
  const upcoming = plans.filter((row) => row.due_on >= localDate());
  const historyEditorKey = JSON.stringify([editingId, type, props.historyRecords?.map(({ id, event_type, occurred_on, description }) => [id, event_type, occurred_on, description])]);
  const blocked = props.historyBusy || props.historyPending;
  if (tab === 'Vikt') return <WeightScreen {...props} onBack={() => setTab('Översikt')} />;
  return <View>
    <AppBar mode="Title" title="Hälsa" />
    <Tabs items={['Översikt', 'Vaccinationer', 'Veterinär', 'Vikt']} active={tab} onChange={setTab} />
    {props.plannedLoadState === 'ready' && overdue.length ? <><SectionHeader title="Datum har passerat" /><View style={styles.rows}>{overdue.map((row) => <ListRow key={row.id} category={row.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} title={row.description || (row.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök')} meta={`Planerad ${shortDate(row.due_on)}`} onPress={props.onOpenPlannedHealth} />)}</View></> : null}
    <SectionHeader title="Kommande" />
    {props.plannedLoadState === 'loading' ? <Skeleton shape="row" lines={2} /> : props.plannedLoadState === 'error' ? <Button variant="secondary" label="Hämta planer igen" accessibilityLabel="Hämta planer igen" onPress={() => props.onOpenPlannedHealth?.()} /> : <View style={styles.rows}>
      {upcoming.length ? upcoming.map((row) => <ListRow key={row.id} category={row.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} title={row.description || (row.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök')} meta={`${relativeDate(row.due_on)} · ${shortDate(row.due_on)}`} onPress={props.onOpenPlannedHealth} />) : <Text style={styles.empty}>Inga kommande händelser.</Text>}
    </View>}
    <SectionHeader title="Genomfört" />
    {props.historyLoadState === 'loading' ? <Skeleton shape="row" lines={3} /> : props.historyLoadState === 'error' ? <Button variant="secondary" label="Hämta historiken igen" accessibilityLabel="Hämta historiken igen" onPress={() => props.onRetryHistory?.()} /> : <View style={styles.rows}>
      {history.length ? history.map((row) => <ListRow key={row.id} category={row.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} title={row.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök'} meta={[shortDate(row.occurred_on), row.description].filter(Boolean).join(' · ')} complete onPress={() => { setEditingId(row.id); setSheet('history'); }} />) : <Text style={styles.empty}>Inga händelser ännu. Lägg till när något har hänt.</Text>}
    </View>}
    {tab === 'Översikt' && props.records?.length ? <><SectionHeader title="Senaste vikten" /><ListRow category="veterinary" title={`${props.records[0].weight_kg.toLocaleString('sv-SE')} kg`} meta={shortDate(props.records[0].occurred_on)} onPress={() => setTab('Vikt')} /></> : null}
    <View style={styles.action}><Button label="Lägg till händelse" accessibilityLabel="Lägg till hälsohändelse" disabled={!props.onSaveHistory || Boolean(blocked)} onPress={() => { setEditingId(null); setSheet('choose'); }} /></View>
    <BottomSheet visible={sheet !== null} title={sheet === 'choose' ? 'Lägg till händelse' : editingId ? 'Ändra händelse' : 'Genomförd händelse'} onRequestClose={() => { if (!blocked) setSheet(null); }}>
      {sheet === 'choose' ? <>
        <ListRow category="vaccination" title="Något som har hänt" meta="Vaccination eller veterinärbesök" onPress={() => setSheet('history')} />
        {props.onOpenPlannedHealth ? <ListRow category="veterinary" title="Planera en händelse" meta="Datum och påminnelse" onPress={() => { setSheet(null); props.onOpenPlannedHealth?.(); }} /> : null}
        <ListRow category="veterinary" title="Lägg till vikt" onPress={() => { setSheet(null); setTab('Vikt'); }} />
      </> : sheet === 'history' ? <HealthHistoryScreen key={historyEditorKey} initialEditingId={editingId} initialType={type}
        records={props.historyRecords} loadState={props.historyLoadState} busy={props.historyBusy} pending={props.historyPending}
        statusMessage={props.historyMessage} statusError={props.historyMessageError} conflict={props.historyConflict}
        onRetry={props.onRetryHistory} onResolveConflict={props.onResolveHistoryConflict}
        onSave={async (...args) => { const saved = await props.onSaveHistory?.(...args); if (saved) setSheet(null); return saved ?? false; }}
        onDelete={async (id) => { const saved = await props.onDeleteHistory?.(id); if (saved) setSheet(null); return saved ?? false; }} /> : null}
    </BottomSheet>
  </View>;
}
function shortDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }); }
function relativeDate(value: string) {
  const days = Math.round((Date.parse(`${value}T12:00:00Z`) - Date.parse(`${localDate()}T12:00:00Z`)) / 86400000);
  return days === 0 ? 'Idag' : days === 1 ? 'Imorgon' : `Om ${days} dagar`;
}
const styles = StyleSheet.create({ rows: { gap: tokens.spacing.xs }, empty: { ...tokens.typography.body, color: tokens.colors.textSecondary, paddingVertical: tokens.spacing.md }, action: { marginTop: tokens.spacing.xl } });
