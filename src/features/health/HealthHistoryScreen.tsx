import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DatePickerField, InfoModal, MessageCard, PrimaryButton, QuietButton, TimePickerField } from '../../components/AppPrimitives';
import { Button } from '../../components/ui';
import {
  isValidHealthHistoryDate,
  isValidHealthHistoryTime,
  normalizeHealthHistoryDescription,
  type HealthHistoryRecord,
  type HealthHistoryType,
} from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';
import { isDirtyHealthHistoryDraft, type HealthHistoryDraftValue } from './health-history-draft';

type LoadState = 'loading' | 'ready' | 'error';
type LeaveRequest = (commit: () => void) => void;
type OpeningRecord = Pick<HealthHistoryRecord, 'id' | 'dog_id' | 'event_type' | 'occurred_on' | 'occurred_time' | 'description'>;

export function HealthHistoryScreen({
  records,
  initialEditingId = null,
  initialType = 'vaccination',
  lifetime,
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
  registerEditorLeaveGuard,
  registerSheetLeaveGuard,
  onLeaveConfirmed,
}: {
  records?: readonly HealthHistoryRecord[];
  initialEditingId?: string | null;
  initialType?: HealthHistoryType;
  lifetime: string;
  loadState?: LoadState;
  busy?: boolean;
  pending?: boolean;
  statusMessage?: string;
  statusError?: boolean;
  conflict?: { current: HealthHistoryRecord | null } | null;
  onRetry?: () => void;
  onResolveConflict?: () => void;
  onSave?: (id: string | null, type: HealthHistoryType, date: string, time: string | null, note: string, openingRecord: OpeningRecord | null) => Promise<boolean>;
  onDelete?: (id: string, openingRecord: OpeningRecord) => Promise<boolean>;
  registerEditorLeaveGuard?: (owner: symbol, requestLeave: LeaveRequest) => () => void;
  registerSheetLeaveGuard?: (owner: symbol, requestLeave: LeaveRequest) => () => void;
  onLeaveConfirmed: () => void;
}) {
  const [opening] = useState(() => {
    const record = records?.find((row) => row.id === initialEditingId) ?? null;
    const draft: HealthHistoryDraftValue = record
      ? { type: record.event_type, date: record.occurred_on, time: record.occurred_time ?? '', note: record.description ?? '' }
      : { type: initialType, date: localDate(), time: '', note: '' };
    return { record, draft };
  });
  const editingId = initialEditingId;
  const [type, setType] = useState<HealthHistoryType>(opening.draft.type);
  const [date, setDate] = useState(opening.draft.date);
  const [time, setTime] = useState(opening.draft.time);
  const [note, setNote] = useState(opening.draft.note);
  const [formError, setFormError] = useState('');
  const [infoVisible, setInfoVisible] = useState(false);
  const [flight, setFlight] = useState(false);
  const editorOwnerToken = useRef(Symbol('health-history-editor'));
  const mounted = useRef(true);
  const activeLifetime = useRef(lifetime);
  const requestLeaveAlertOpen = useRef(false);
  const flightInProgress = useRef(false);
  const requestLeaveRef = useRef<LeaveRequest>(() => undefined);
  const dirty = isDirtyHealthHistoryDraft(opening.draft, { type, date, time, note });
  const available = records !== undefined;
  const rows = records ?? [];
  const blocked = busy || pending || flight;
  const editingRecord = rows.find((row) => row.id === editingId) ?? null;
  const isEditing = editingId !== null;

  useLayoutEffect(() => {
    mounted.current = true;
    activeLifetime.current = lifetime;
    return () => { mounted.current = false; };
  }, [lifetime]);

  const requestLeave = useCallback((commit: () => void) => {
    if (!mounted.current || activeLifetime.current !== lifetime || flightInProgress.current || busy || pending || requestLeaveAlertOpen.current) return;
    if (!dirty) { commit(); return; }
    requestLeaveAlertOpen.current = true;
    const owner = editorOwnerToken.current;
    Alert.alert('Osparade ändringar', 'Vill du lämna utan att spara?', [
      { text: 'Stanna kvar', style: 'cancel', onPress: () => {
        if (mounted.current && editorOwnerToken.current === owner && activeLifetime.current === lifetime) requestLeaveAlertOpen.current = false;
      } },
      { text: 'Lämna utan att spara', style: 'destructive', onPress: () => {
        if (!mounted.current || editorOwnerToken.current !== owner || activeLifetime.current !== lifetime) return;
        requestLeaveAlertOpen.current = false;
        commit();
      } },
    ], { cancelable: true, onDismiss: () => {
      if (mounted.current && editorOwnerToken.current === owner && activeLifetime.current === lifetime) requestLeaveAlertOpen.current = false;
    } });
  }, [busy, dirty, lifetime, pending]);

  useLayoutEffect(() => { requestLeaveRef.current = requestLeave; }, [requestLeave]);
  useLayoutEffect(() => {
    if (!registerEditorLeaveGuard) return undefined;
    return registerEditorLeaveGuard(editorOwnerToken.current, (commit) => requestLeaveRef.current(commit));
  }, [registerEditorLeaveGuard]);
  useLayoutEffect(() => {
    if (!registerSheetLeaveGuard) return undefined;
    return registerSheetLeaveGuard(editorOwnerToken.current, (commit) => requestLeaveRef.current(commit));
  }, [registerSheetLeaveGuard]);

  if (!available) return null;

  async function save() {
    if (flightInProgress.current || busy || pending || requestLeaveAlertOpen.current) return;
    setFormError('');
    if (!isValidHealthHistoryDate(date)) {
      setFormError('Ange ett giltigt datum som inte ligger i framtiden.');
      return;
    }
    const occurredTime = time === '' ? null : time;
    if (!isValidHealthHistoryTime(occurredTime)) {
      setFormError('Ange en giltig tid då händelsen inträffade.');
      return;
    }
    const normalized = normalizeHealthHistoryDescription(note);
    if (normalized === undefined) {
      setFormError('Anteckningen får innehålla högst 500 tecken.');
      return;
    }
    flightInProgress.current = true;
    setFlight(true);
    try {
      await onSave?.(editingId, type, date, occurredTime, normalized ?? '', opening.record);
    } catch {
      if (mounted.current && activeLifetime.current === lifetime) setFormError('Ändringen kunde inte sparas. Dina fält finns kvar.');
    } finally {
      flightInProgress.current = false;
      if (mounted.current && activeLifetime.current === lifetime) setFlight(false);
    }
  }

  function confirmDelete(record: HealthHistoryRecord) {
    if (flightInProgress.current || busy || pending || requestLeaveAlertOpen.current || !opening.record) return;
    const owner = editorOwnerToken.current;
    const message = dirty
      ? 'Den sparade händelsen raderas och dina osparade ändringar i rättningen kastas bort.'
      : `${typeLabel(record.event_type)} tas bort från hundens historik.`;
    Alert.alert('Radera händelse?', message, [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Radera', style: 'destructive', onPress: () => {
        if (!mounted.current || editorOwnerToken.current !== owner || activeLifetime.current !== lifetime) return;
        void deleteRecord(record, owner);
      } },
    ]);
  }

  async function deleteRecord(record: HealthHistoryRecord, owner: symbol) {
    if (flightInProgress.current || busy || pending || !opening.record) return;
    flightInProgress.current = true;
    setFlight(true);
    try {
      await onDelete?.(record.id, opening.record);
    } catch {
      if (mounted.current && editorOwnerToken.current === owner && activeLifetime.current === lifetime) setFormError('Händelsen kunde inte raderas. Dina fält finns kvar.');
    } finally {
      flightInProgress.current = false;
      if (mounted.current && editorOwnerToken.current === owner && activeLifetime.current === lifetime) setFlight(false);
    }
  }

  function resolveConflict() {
    if (busy || flight) return;
    onResolveConflict?.();
    onLeaveConfirmed();
  }

  return (
    <View style={styles.section}>
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
        {(pending || statusError) && <PrimaryButton title={pending ? 'Kontrollera status' : 'Försök igen'} disabled={busy || flight} onPress={() => onRetry?.()} />}
      </> : null}
      {conflict && <View style={styles.conflictCard}>
        <Text style={styles.conflictTitle} accessibilityRole="header">Aktuell sparad version</Text>
        {conflict.current
          ? <Text style={styles.recordNote}>{typeLabel(conflict.current.event_type)} · {conflict.current.occurred_on}{conflict.current.occurred_time ? ` · ${conflict.current.occurred_time}` : ''}{conflict.current.description ? `\n${conflict.current.description}` : ''}</Text>
          : <Text style={styles.recordNote}>Posten finns inte längre.</Text>}
        <Text style={styles.conflictBody}>Den väntande ändringen lämnas orörd tills du väljer hur du vill fortsätta.</Text>
        <PrimaryButton title="Använd aktuell historik och börja om" disabled={busy || flight} onPress={resolveConflict} />
      </View>}
      {loadState === 'loading' && <MessageCard>Hämtar hälsans historik…</MessageCard>}
      {loadState === 'error' && <>
        <MessageCard tone="error">Hälsans historik kunde inte hämtas.</MessageCard>
        <PrimaryButton title="Försök igen" disabled={busy || flight} onPress={() => onRetry?.()} />
      </>}

      {loadState === 'ready' && <>
        {busy && <MessageCard>Sparar och kontrollerar ändringen…</MessageCard>}
        <View style={styles.formCard}>
          <Text style={styles.formTitle} accessibilityRole="header">{isEditing ? 'Rätta händelse' : 'Lägg till händelse'}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel="Typ av händelse" style={styles.typeChoices}>
            <TypeChoice selected={type === 'vaccination'} disabled={blocked || isEditing} accent={tokens.colors.category.vaccination}
              icon="bandage-outline" label="Vaccination" onPress={() => setType('vaccination')} />
            <TypeChoice selected={type === 'vet_visit'} disabled={blocked || isEditing} accent={tokens.colors.category.veterinary}
              icon="medical-outline" label="Veterinärbesök" onPress={() => setType('vet_visit')} />
          </View>
          <DatePickerField label="Datum" disabled={blocked} onChangeText={setDate} value={date} />
          <TimePickerField label="Tid (valfri)" disabled={blocked} onChangeText={setTime} value={time} />
          <Text style={styles.timeHint}>Välj när händelsen inträffade, eller lämna tomt.</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Kort anteckning (frivillig)</Text>
            <TextInput accessibilityLabel="Kort anteckning, högst 500 tecken" editable={!blocked} multiline
              onChangeText={setNote} onSubmitEditing={() => Keyboard.dismiss()} placeholder="Till exempel: valpens första vaccination"
              placeholderTextColor={tokens.colors.textSecondary} returnKeyType="done" style={styles.noteInput} value={note} />
            <Text style={styles.characterHint}>{Array.from(note).length}/500 tecken</Text>
          </View>
          {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
          <PrimaryButton title={flight ? 'Sparar…' : isEditing ? 'Spara rättning' : 'Spara händelse'} disabled={blocked} onPress={() => { void save(); }} />
          {isEditing && <QuietButton title="Avbryt rättning" disabled={blocked} onPress={() => requestLeaveRef.current(onLeaveConfirmed)} />}
        </View>

        {isEditing && editingRecord && opening.record && <Button variant="destructive" label="Radera händelse" accessibilityLabel="Radera händelse" disabled={blocked} onPress={() => confirmDelete(editingRecord)} />}
      </>}
    </View>
  );
}

function TypeChoice({ selected, disabled, icon, label, accent, onPress }: {
  selected: boolean; disabled: boolean; icon: 'bandage-outline' | 'medical-outline'; label: string; accent: { fg: string; bg: string }; onPress: () => void;
}) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} accessibilityLabel={label}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.typeChoice, selected && { borderColor: accent.fg, backgroundColor: accent.bg }, pressed && !disabled && styles.typeChoicePressed]}>
    <Ionicons name={icon} size={tokens.size.iconSm} color={selected ? accent.fg : tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    <Text style={[styles.typeChoiceText, selected && { color: accent.fg }]}>{label}</Text>
  </Pressable>;
}

function typeLabel(type: HealthHistoryType): string {
  return type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök';
}

const styles = StyleSheet.create({
  section: { marginTop: tokens.layout.sectionGap },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.spacing.md, marginBottom: tokens.spacing.xs },
  infoHint: { color: tokens.colors.textSecondary, ...tokens.typography.caption },
  infoButton: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.sm },
  infoButtonText: { color: tokens.colors.primary, ...tokens.typography.caption, fontWeight: '700' },
  infoBody: { color: tokens.colors.textPrimary, ...tokens.typography.body, marginBottom: tokens.spacing.md },
  formCard: { marginTop: tokens.layout.sectionGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  formTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label, marginBottom: tokens.spacing.md },
  typeChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg },
  typeChoice: { flexGrow: 1, minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  typeChoicePressed: { opacity: 0.78 },
  typeChoiceText: { color: tokens.colors.textSecondary, ...tokens.typography.caption, fontWeight: '700' },
  field: { marginBottom: tokens.spacing.md },
  label: { color: tokens.colors.textPrimary, ...tokens.typography.caption, fontWeight: '700', marginBottom: tokens.spacing.xs },
  noteInput: { minHeight: tokens.size.touchMin * 2, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body, textAlignVertical: 'top' },
  characterHint: { color: tokens.colors.textSecondary, ...tokens.typography.caption, textAlign: 'right', marginTop: tokens.spacing.xs },
  timeHint: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs, marginBottom: tokens.spacing.md },
  conflictCard: { marginTop: tokens.layout.listGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.warning, backgroundColor: tokens.colors.warningSurface },
  conflictTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  conflictBody: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  recordNote: { color: tokens.colors.textPrimary, ...tokens.typography.caption, marginTop: tokens.spacing.sm },
});
