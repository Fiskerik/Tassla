import { useCallback, useEffect, useMemo, useState, type MutableRefObject } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DatePickerField, MessageCard, PrimaryButton, TimePickerField } from '../../components/AppPrimitives';
import { Toast } from '../../components/ui/Toast';
import {
  isValidHealthHistoryDate,
  isValidHealthHistoryTime,
  normalizeHealthHistoryDescription,
  type HealthHistoryRecord,
  type HealthHistoryType,
} from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';
import { Button, Dialog } from '../../components/ui';

type LoadState = 'loading' | 'ready' | 'error';
export type HealthHistoryDraft = { id: string | null; type: HealthHistoryType; date: string; time: string; note: string };
export type HealthHistoryEditorState = { canSave: boolean; saving: boolean; dirty: boolean };

export function HealthHistoryScreen({
  records,
  initialEditingId = null,
  initialType = 'vaccination',
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
  initialDraft,
  onDraftChange,
  onActionStateChange,
  submitRef,
  onSaved,
}: {
  records?: readonly HealthHistoryRecord[];
  initialEditingId?: string | null;
  initialType?: HealthHistoryType;
  loadState?: LoadState;
  busy?: boolean;
  pending?: boolean;
  statusMessage?: string;
  statusError?: boolean;
  conflict?: { current: HealthHistoryRecord | null } | null;
  onRetry?: () => void;
  onResolveConflict?: () => void;
  onSave?: (id: string | null, type: HealthHistoryType, date: string, time: string | null, note: string) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  initialDraft?: HealthHistoryDraft;
  onDraftChange?: (draft: HealthHistoryDraft) => void;
  onActionStateChange?: (state: HealthHistoryEditorState) => void;
  submitRef?: MutableRefObject<(() => Promise<void>) | null>;
  onSaved?: () => void;
}) {
  const initialRecord = records?.find((row) => row.id === initialEditingId) ?? null;
  const baseline: HealthHistoryDraft = {
    id: initialRecord?.id ?? null, type: initialRecord?.event_type ?? initialType,
    date: initialRecord?.occurred_on ?? localDate(), time: initialRecord?.occurred_time ?? '', note: initialRecord?.description ?? '',
  };
  const [savedBaseline] = useState(() => baseline);
  const [editingId, setEditingId] = useState<string | null>(initialDraft?.id ?? initialEditingId);
  const [type, setType] = useState<HealthHistoryType>(initialDraft?.type ?? baseline.type);
  const [date, setDate] = useState(initialDraft?.date ?? baseline.date);
  const [time, setTime] = useState(initialDraft?.time ?? baseline.time);
  const [note, setNote] = useState(initialDraft?.note ?? baseline.note);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HealthHistoryRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const confirmedMessage = statusMessage.startsWith('Ändringen är sparad') && !statusError && !pending && !busy
    ? statusMessage : null;
  const available = records !== undefined;
  const rows = records ?? [];
  const blocked = busy || pending;
  const editingRecord = rows.find((row) => row.id === editingId) ?? null;
  const draft = useMemo<HealthHistoryDraft>(() => ({ id: editingId, type, date, time, note }), [date, editingId, note, time, type]);
  const occurredTime = time === '' ? null : time;
  const normalizedNote = normalizeHealthHistoryDescription(note);
  const canSave = isValidHealthHistoryDate(date) && isValidHealthHistoryTime(occurredTime) && normalizedNote !== undefined;
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedBaseline);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setType('vaccination');
    setDate(localDate());
    setTime('');
    setNote('');
    setFormError('');
    setSaving(false);
    Keyboard.dismiss();
  }, []);

  const save = useCallback(async () => {
    setFormError('');
    if (!isValidHealthHistoryDate(date)) {
      setFormError('Ange ett giltigt datum som inte ligger i framtiden.');
      return;
    }
    if (!isValidHealthHistoryTime(occurredTime)) {
      setFormError('Ange en giltig tid då händelsen inträffade.');
      return;
    }
    if (normalizedNote === undefined) {
      setFormError('Anteckningen får innehålla högst 500 tecken.');
      return;
    }
    setSaving(true);
    try {
      if (await onSave?.(editingId, type, date, occurredTime, normalizedNote ?? '')) { resetForm(); onSaved?.(); }
    } finally { setSaving(false); }
  }, [date, editingId, normalizedNote, occurredTime, onSave, onSaved, resetForm, type]);

  useEffect(() => {
    // The toast mirrors an external save-status prop and is intentionally reset here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!confirmedMessage) { setToastVisible(false); return; }
    setToastMessage(confirmedMessage);
    setToastVisible(true);
  }, [confirmedMessage]);

  useEffect(() => { onDraftChange?.(draft); }, [draft, onDraftChange]);
  useEffect(() => { onActionStateChange?.({ canSave: canSave && !blocked && !saving, saving, dirty }); }, [blocked, canSave, dirty, onActionStateChange, saving]);
  useEffect(() => {
    if (!submitRef) return undefined;
    submitRef.current = save;
    return () => { if (submitRef.current === save) submitRef.current = null; };
  }, [save, submitRef]);

  if (!available) return null;

  function confirmDelete(record: HealthHistoryRecord) {
    setDeleteTarget(record);
  }

  async function deleteRecord(record: HealthHistoryRecord) {
    setDeleteTarget(null);
    if (await onDelete?.(record.id) && editingId === record.id) { resetForm(); onSaved?.(); }
  }

  function resolveConflict() {
    resetForm();
    onResolveConflict?.();
  }

  return (
    <View style={styles.section}>
      {statusMessage && statusError ? <>
        <MessageCard tone="error">{statusMessage}</MessageCard>
        {(pending || statusError) && <PrimaryButton title={pending ? 'Kontrollera status' : 'Försök igen'} disabled={busy} onPress={() => onRetry?.()} />}
      </> : null}
      {conflict && <View style={styles.conflictCard}>
        <Text style={styles.conflictTitle} accessibilityRole="header">Aktuell sparad version</Text>
        {conflict.current
          ? <Text style={styles.recordNote}>{typeLabel(conflict.current.event_type)} · {conflict.current.occurred_on}{conflict.current.occurred_time ? ` · ${conflict.current.occurred_time}` : ''}{conflict.current.description ? `\n${conflict.current.description}` : ''}</Text>
          : <Text style={styles.recordNote}>Posten finns inte längre.</Text>}
        <Text style={styles.conflictBody}>Den väntande ändringen lämnas orörd tills du väljer hur du vill fortsätta.</Text>
        <PrimaryButton title="Använd aktuell historik och börja om" disabled={busy} onPress={resolveConflict} />
      </View>}
      {loadState === 'loading' && <MessageCard>Hämtar hälsans historik…</MessageCard>}
      {loadState === 'error' && <>
        <MessageCard tone="error">Hälsans historik kunde inte hämtas.</MessageCard>
        {loadState === 'error' && <PrimaryButton title="Försök igen" disabled={busy} onPress={() => onRetry?.()} />}
      </>}

      {loadState === 'ready' && <>
        {busy && <MessageCard>Sparar och kontrollerar ändringen…</MessageCard>}
        <View style={styles.formFields}>
          <View accessibilityRole="radiogroup" accessibilityLabel="Typ av händelse" style={styles.typeChoices}>
            <TypeChoice selected={type === 'vaccination'} disabled={blocked || editingRecord !== null} accent={tokens.colors.category.vaccination}
              icon="bandage-outline" label="Vaccination" onPress={() => setType('vaccination')} />
            <TypeChoice selected={type === 'vet_visit'} disabled={blocked || editingRecord !== null} accent={tokens.colors.category.veterinary}
              icon="medical-outline" label="Veterinärbesök" onPress={() => setType('vet_visit')} />
          </View>
          <DatePickerField label="Datum" disabled={blocked || saving} onChangeText={setDate} value={date} />
          <TimePickerField label="Tid (valfri)" disabled={blocked || saving} onChangeText={setTime} value={time} />
          <Text style={styles.timeHint}>Välj när händelsen inträffade, eller lämna tomt.</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Kort anteckning (frivillig)</Text>
            <TextInput accessibilityLabel="Kort anteckning, högst 500 tecken" editable={!blocked && !saving} multiline
              onChangeText={setNote} onSubmitEditing={() => Keyboard.dismiss()} placeholder="Till exempel: valpens första vaccination"
              placeholderTextColor={tokens.colors.textSecondary} returnKeyType="done" style={styles.noteInput} value={note} />
            <Text style={styles.characterHint}>{Array.from(note).length}/500 tecken</Text>
          </View>
          {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
          <Toast visible={toastVisible} tone="success" confirmed message={toastMessage ?? undefined} autoDismissMs={2500} onAutoDismiss={() => setToastVisible(false)} onExitComplete={() => setToastMessage(null)} />
          {editingRecord && <View style={styles.deleteAction}><Button variant="icon" label="Radera" iconName="trash-outline"
            accessibilityLabel={`Radera ${typeLabel(editingRecord.event_type).toLocaleLowerCase('sv-SE')} från ${editingRecord.occurred_on}`}
            disabled={blocked || saving} onPress={() => confirmDelete(editingRecord)} /></View>}
        </View>

      </>}
      <Dialog visible={Boolean(deleteTarget)} title="Radera hälsohändelse?" compactActions onRequestClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) void deleteRecord(deleteTarget); }}>
        <Text>{deleteTarget ? `${typeLabel(deleteTarget.event_type)} · ${deleteTarget.occurred_on} tas bort från hundens historik.` : ''}</Text>
      </Dialog>
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
  formFields: { gap: tokens.spacing.md },
  typeChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg },
  typeChoice: { flexGrow: 1, minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  typeChoicePressed: { opacity: 0.78 },
  typeChoiceText: { color: tokens.colors.textSecondary, ...tokens.typography.caption, fontWeight: '700' },
  typeChoiceTextSelected: { color: tokens.colors.primary },
  field: { marginBottom: tokens.spacing.md },
  label: { color: tokens.colors.textPrimary, ...tokens.typography.caption, fontWeight: '700', marginBottom: tokens.spacing.xs },
  noteInput: { minHeight: tokens.size.touchMin * 2, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body, textAlignVertical: 'top' },
  characterHint: { color: tokens.colors.textSecondary, ...tokens.typography.caption, textAlign: 'right', marginTop: tokens.spacing.xs },
  timeHint: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs, marginBottom: tokens.spacing.md },
  conflictCard: { marginTop: tokens.layout.listGap, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.warning, backgroundColor: tokens.colors.warningSurface },
  conflictTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  conflictBody: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  recordNote: { color: tokens.colors.textPrimary, ...tokens.typography.caption, marginTop: tokens.spacing.sm },
  deleteAction: { alignItems: 'flex-end' },
});
