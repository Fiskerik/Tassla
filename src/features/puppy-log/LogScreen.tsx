import { useEffect, useMemo, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AccessibilityInfo, Alert, LayoutAnimation, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppBar, BottomSheet, Button, Card, Dialog, ListRow, QuickLogTile, SectionHeader, Skeleton, Toast } from '../../components/ui';
import { DatePickerField, MessageCard, TimePickerField } from '../../components/AppPrimitives';
import { ScreenTransition } from '../../components/ui/Motion';
import { tokens } from '../../theme/tokens';
import { localDate } from '../onboarding/dog';
import { decideQuickLogPress, groupLogEventsByLocalDate, hasRecentCategoryLog, localDateTimeParts, LOG_ENTRY_TYPES, LOG_EVENT_LABELS, parseLocalDateTime, summarizePottyPatterns, type LogEvent, type LogEventChanges, type LogEventType } from './log-model';
import { loadQuickLogLayout, saveQuickLogLayout } from './quick-log-layout-storage';
import { DEFAULT_QUICK_LOG_LAYOUT, moveQuickLogType, type QuickLogLayout, type QuickLogLayoutType } from './quick-log-layout';

export type QuickLogMutationView = { kind: 'add' | 'update' | 'delete' | 'undo'; mutationId: string; id: string; type: LogEventType; occurredAt: string; status: 'pending' | 'failed' | 'unsure' | 'saved' };

export function LogScreen({ events, onAdd, onUpdate, onDelete, mode = 'preview', layoutOwnerId, busy = false, loading = false, loadError = false, onReload, mutation, loadMoreError = false, onRetry, onCancel, onUndo, hasMore = false, loadingMore = false, onLoadMore }: {
  events: readonly LogEvent[];
  onAdd: (type: LogEventType) => void;
  onUpdate?: (id: string, changes: LogEventChanges) => boolean | Promise<boolean>;
  onDelete?: (id: string) => boolean | void | Promise<boolean | void>;
  mode?: 'preview' | 'cloud';
  layoutOwnerId?: string;
  busy?: boolean;
  loading?: boolean;
  loadError?: boolean;
  onReload?: () => void;
  mutation?: QuickLogMutationView | null;
  loadMoreError?: boolean;
  onRetry?: () => boolean | void | Promise<boolean | void>;
  onCancel?: () => void;
  onUndo?: (id: string) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const [moreVisible, setMoreVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [duplicate, setDuplicate] = useState<{ type: LogEventType; timestamp: number } | null>(null);
  const lastSubmitAt = useRef<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dismissedMutationKey, setDismissedMutationKey] = useState<string | null>(null);
  const [layout, setLayout] = useState<QuickLogLayout>(DEFAULT_QUICK_LOG_LAYOUT);
  const [layoutEditing, setLayoutEditing] = useState(false);
  const [layoutError, setLayoutError] = useState(false);
  const groups = useMemo(() => groupLogEventsByLocalDate(events), [events]);
  const patterns = useMemo(() => summarizePottyPatterns(events).filter((item) => item.count >= 2), [events]);
  const editingEvent = events.find((event) => event.id === editingId) ?? null;
  const editLocked = busy || Boolean(editingEvent && mutation?.id === editingEvent.id && mutation.status !== 'saved');

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let active = true;
    void loadQuickLogLayout(layoutOwnerId).then((saved) => {
      if (active) setLayout(saved);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [layoutOwnerId]);

  function selectType(type: LogEventType, timestamp: number, force = false) {
    const recentDuplicate = hasRecentCategoryLog(events, type);
    const decision = decideQuickLogPress({
      blocked: busy || Boolean(mutation && mutation.status !== 'saved'),
      force,
      lastSubmitAt: lastSubmitAt.current,
      timestamp,
      recentDuplicate,
    });
    if (decision === 'blocked') return;
    if (decision === 'confirm-duplicate') {
      setDuplicate({ type, timestamp });
      setMoreVisible(false);
      return;
    }
    lastSubmitAt.current = timestamp;
    setDuplicate(null);
    setMoreVisible(false);
    onAdd(type);
  }

  function toggleMore() {
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMoreVisible((visible) => !visible);
  }

  function startLayoutEdit() {
    if (busy || Boolean(mutation && mutation.status !== 'saved')) return;
    setLayoutEditing(true);
    setMoreVisible(false);
  }

  function moveLayoutType(type: QuickLogLayoutType, destination: 'primary' | 'more') {
    const next = moveQuickLogType(layout, type, destination);
    setLayout(next);
    setLayoutError(false);
    void saveQuickLogLayout(next, layoutOwnerId).catch(() => setLayoutError(true));
  }

  const disabled = busy || Boolean(mutation && mutation.status !== 'saved');
  const renderQuickTile = (type: QuickLogLayoutType) => <QuickLogTile
    key={type}
    label={LOG_EVENT_LABELS[type]}
    accessibilityLabel={`Logga ${LOG_EVENT_LABELS[type].toLocaleLowerCase('sv-SE')}`}
    accessibilityHint="Håll inne för att ändra vilka snabbval som visas först"
    category={type}
    compact
    disabled={disabled}
    onLongPress={startLayoutEdit}
    onPress={(event) => selectType(type, event.nativeEvent.timestamp)}
  />;
  const renderRows = (types: readonly QuickLogLayoutType[]) => Array.from({ length: Math.ceil(types.length / 2) }, (_, index) => (
    <View key={`${types[index * 2]}-${types[index * 2 + 1] ?? 'single'}`} style={styles.gridRow}>
      {types.slice(index * 2, index * 2 + 2).map(renderQuickTile)}
    </View>
  ));

  function saveEdit(event: LogEvent, changes: LogEventChanges): boolean | Promise<boolean> {
    return onUpdate?.(event.id, changes) ?? false;
  }

  async function retryMutation() {
    const saved = await onRetry?.();
    if (saved && mutation && mutation.kind !== 'add' && mutation.kind !== 'undo') setEditingId(null);
  }

  function askToDelete(event: LogEvent) {
    Alert.alert('Radera loggpost?', mode === 'cloud' ? 'Posten tas bort från hundens logg.' : 'Posten tas bort från den här tillfälliga förhandsvisningen.', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Radera', style: 'destructive', onPress: () => {
        if (!onDelete) return;
        void Promise.resolve(onDelete(event.id)).then((saved) => { if (saved !== false) setEditingId(null); }).catch(() => undefined);
      } },
    ]);
  }

  const successMutationKey = mutation?.status === 'saved' ? `${mutation.kind}:${mutation.mutationId}` : '';
  const mutationFeedback = <>
      <Toast visible={mutation?.status === 'saved' && dismissedMutationKey !== successMutationKey} tone="success" confirmed message={mutation?.status === 'saved' ? mutation.kind === 'add' ? `${LOG_EVENT_LABELS[mutation.type]} loggat` : mutation.kind === 'update' ? 'Ändring sparad' : 'Händelsen är raderad' : ''}
        onUndo={mutation?.status === 'saved' && mutation.kind === 'add' ? () => onUndo?.(mutation.id) : undefined} autoDismissMs={2500}
        onAutoDismiss={() => setDismissedMutationKey(successMutationKey)} />
      <Toast visible={loadMoreError} tone="error" message="Äldre poster kunde inte hämtas" onRetry={onLoadMore} />
  </>;

  return <View style={styles.screen}>
    <AppBar mode="Title" title="Logga" />
    {mutationFeedback}
    <Toast visible={!editingEvent && mutation?.status === 'failed'} tone="error" message="Kunde inte spara" onRetry={retryMutation} onCancel={() => { onCancel?.(); if (mutation && mutation.kind !== 'add') setEditingId(null); }} />
    <Toast visible={!editingEvent && mutation?.status === 'unsure'} tone="uncertain" onRetry={retryMutation} />
    {loading ? <>
      <SectionHeader title="Snabb logg" />
      <Skeleton shape="card" lines={3} />
      <Skeleton shape="row" lines={2} />
    </> : loadError ? <View style={styles.errorState}>
      <Text style={styles.errorText}>Loggen kunde inte hämtas.</Text>
      <Button label="Försök igen" accessibilityLabel="Försök igen" onPress={onReload ?? (() => undefined)} />
    </View> : <>
      <SectionHeader title="Snabb logg" />
      <View style={styles.grid}>
        {layoutEditing ? <LayoutEditor layout={layout} onMove={moveLayoutType} onDone={() => setLayoutEditing(false)} error={layoutError} /> : renderRows(layout.primary)}
      </View>
      {!layoutEditing && <View style={styles.moreRow}><QuickLogTile subtle label="Fler" accessibilityLabel={moreVisible ? 'Dölj fler loggtyper' : 'Visa fler loggtyper'} accessibilityHint="Håll inne för att ändra snabbvalens layout" icon={<View style={styles.moreIcon}><Ionicons name={moreVisible ? 'close-outline' : 'grid-outline'} size={tokens.size.iconMd} color={tokens.colors.textPrimary} /></View>} disabled={disabled} onLongPress={startLayoutEdit} onPress={toggleMore} /></View>}
      {!layoutEditing && moreVisible ? <View style={styles.grid} accessibilityLabel="Fler loggtyper">{renderRows(layout.more)}</View> : null}

      {editingEvent ? <BottomSheet visible title="Ändra händelse" onRequestClose={() => { if (!editLocked) setEditingId(null); }}>
        <Toast visible={mutation?.status === 'failed'} tone="error" message="Kunde inte spara" onRetry={retryMutation} onCancel={() => { onCancel?.(); if (mutation && mutation.kind !== 'add') setEditingId(null); }} />
        <Toast visible={mutation?.status === 'unsure'} tone="uncertain" onRetry={retryMutation} />
        <LogEventEditor key={editingEvent.id} event={editingEvent} disabled={editLocked} onCancel={() => setEditingId(null)} onSave={(changes) => saveEdit(editingEvent, changes)} onDelete={() => askToDelete(editingEvent)} />
      </BottomSheet> : null}

      <SectionHeader title="Dagens logg" />
      {!events.some((event) => localDateTimeParts(event.occurredAt).date === localDate()) && !(mutation?.kind === 'add' && mutation.status === 'pending') ? <View style={styles.empty}><Text style={styles.emptyTitle}>Inget loggat än idag</Text><Text style={styles.emptyBody}>Tryck på en ruta ovan för att lägga till dagens första händelse.</Text></View> : null}
      {mutation?.kind === 'add' && mutation.status === 'pending' && <ListRow title={LOG_EVENT_LABELS[mutation.type]} meta="Sparar…" time={localDateTimeParts(mutation.occurredAt).time} category={mutation.type} accessibilityLabel={`${LOG_EVENT_LABELS[mutation.type]} ${localDateTimeParts(mutation.occurredAt).time}, sparar`} />}
      {groups.map((group) => <View key={group.date} style={styles.logGroup}>
        {group.date !== localDate() ? <SectionHeader title={heading(group.date)} variant="date" /> : null}
        {group.events.map((event) => {
          const rowPending = mutation?.id === event.id && mutation.status === 'pending';
          const newlyConfirmed = mutation?.kind === 'add' && mutation.status === 'saved' && mutation.id === event.id;
          const detail = [event.note, rowPending ? 'Sparar…' : null, event.origin === 'example' ? 'Exempel' : mode === 'preview' ? 'Testpost' : null].filter(Boolean).join(' · ');
          const parts = localDateTimeParts(event.occurredAt);
          const row = <ListRow title={LOG_EVENT_LABELS[event.type]} accessibilityLabel={`${LOG_EVENT_LABELS[event.type]} ${parts.time}${event.note ? `, ${event.note}` : ''}${rowPending ? ', sparar' : ''}, tryck för att ändra`} category={event.type} time={parts.time} detail={detail || undefined} onPress={() => setEditingId(event.id)} disabled={busy || Boolean(mutation && mutation.status !== 'saved')} />;
          return newlyConfirmed ? <ScreenTransition key={event.id} transitionKey={event.id}>{row}</ScreenTransition> : <View key={event.id}>{row}</View>;
        })}
      </View>)}
      {patterns.length > 0 ? <>
        <SectionHeader title="Dina senaste mönster" />
        <Card accessibilityLabel="Dina senaste mönster för Kiss och Bajs">
          {patterns.map((item) => <Text key={item.type} style={styles.patternText}>{LOG_EVENT_LABELS[item.type]}: {item.count} gånger{item.medianIntervalMinutes === null ? '' : ` · ungefär ${formatInterval(item.medianIntervalMinutes)}`}</Text>)}
        </Card>
      </> : null}

      {!loadMoreError && hasMore ? <Button label={loadingMore ? 'Hämtar…' : 'Visa äldre poster'} accessibilityLabel={loadingMore ? 'Hämtar äldre poster' : 'Visa äldre poster'} disabled={loadingMore} loading={loadingMore} onPress={onLoadMore ?? (() => undefined)} /> : null}
    </>}

    <Dialog visible={duplicate !== null} title="Du har redan loggat det här. Lägga till ändå?" onRequestClose={() => setDuplicate(null)} onConfirm={() => { if (duplicate) selectType(duplicate.type, duplicate.timestamp, true); }} confirmLabel="Lägg till ändå" confirmVariant="primary"><View /></Dialog>
  </View>;
}

function LogEventEditor({ event, disabled, onCancel, onSave, onDelete }: {
  event: LogEvent;
  disabled: boolean;
  onCancel: () => void;
  onSave: (changes: LogEventChanges) => boolean | Promise<boolean>;
  onDelete: () => void;
}) {
  const initial = localDateTimeParts(event.occurredAt);
  const [type, setType] = useState(event.type);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [note, setNote] = useState(event.note ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const timestamp = parseLocalDateTime(date, time, new Date());
  const noteLength = Array.from(note).length;
  const valid = Boolean(timestamp) && noteLength <= 500;

  async function save() {
    if (saving || disabled) return;
    const occurredAt = parseLocalDateTime(date, time, new Date());
    if (!occurredAt) { setError('Ange ett giltigt datum och en tid som inte ligger i framtiden.'); return; }
    if (noteLength > 500) { setError('Anteckningen får innehålla högst 500 tecken.'); return; }
    setError('');
    setSaving(true);
    try { if (await onSave({ type, occurredAt, note })) onCancel(); }
    finally { setSaving(false); }
  }

  return <View style={styles.editor}>

    <Text style={styles.fieldTitle}>Typ</Text>
    <View style={styles.typeGrid}>{LOG_ENTRY_TYPES.map((option) => {
      const selected = type === option;
      return <Pressable key={option} accessibilityRole="radio" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => setType(option)} style={({ pressed }) => [styles.typeOption, selected && styles.selectedTypeOption, pressed && styles.pressed]}><Text style={[styles.typeOptionText, selected && styles.selectedTypeText]}>{LOG_EVENT_LABELS[option]}</Text></Pressable>;
    })}</View>
    <View style={styles.dateTimeRow}>
      <View style={styles.dateField}><DatePickerField label="Datum" disabled={disabled} onChangeText={setDate} value={date} /></View>
      <View style={styles.timeField}><TimePickerField label="Tid" disabled={disabled} onChangeText={setTime} value={time} /></View>
    </View>
    <View style={styles.noteGroup}>
      <Text style={styles.fieldTitle}>Anteckning (valfri)</Text>
      <TextInput accessibilityLabel="Anteckning, högst 500 tecken" maxLength={1000} multiline editable={!disabled} onChangeText={setNote} placeholder="Lägg till en kort anteckning" placeholderTextColor={tokens.colors.textSecondary} style={styles.noteInput} value={note} />
      <Text style={[styles.characterCount, noteLength > 500 && styles.tooManyCharacters]}>{noteLength}/500</Text>
    </View>
    {error ? <MessageCard tone="error">{error}</MessageCard> : null}
    {!valid && !error ? <MessageCard tone="error">Kontrollera datum, tid och anteckning.</MessageCard> : null}
    <View style={styles.editorActions}>
      <View style={styles.editorSecondaryActions}>
        <View style={styles.editorSecondaryAction}><Button variant="destructive" label="Radera" accessibilityLabel="Radera händelse" disabled={disabled} onPress={onDelete} /></View>
        <View style={styles.editorSecondaryAction}><Button variant="secondary" label="Avbryt" accessibilityLabel="Avbryt ändring" disabled={saving || disabled} onPress={onCancel} /></View>
      </View>
      <Button label="Spara" accessibilityLabel={saving ? 'Sparar ändring' : 'Spara ändring'} loading={saving}
        disabled={!valid || saving || disabled} onPress={() => { void save(); }} />
    </View>
  </View>;
}

function formatInterval(minutes: number): string {
  if (minutes < 120) return `var ${Math.round(minutes)} minuter`;
  if (minutes < 36 * 60) return `var ${Math.round(minutes / 60)} timmar`;
  const halfDays = Math.max(1, Math.round(minutes / (12 * 60)));
  return `var ${(halfDays / 2).toLocaleString('sv-SE')} dygn`;
}

function heading(date: string): string {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  return date === yesterdayKey ? 'Igår' : date;
}

const styles = StyleSheet.create({
  screen: { gap: tokens.spacing.xs }, logGroup: { gap: tokens.spacing.xs }, grid: { gap: tokens.spacing.sm }, gridRow: { flexDirection: 'row', gap: tokens.spacing.sm }, moreRow: { marginTop: tokens.spacing.sm }, moreIcon: { width: tokens.size.chipLg, minHeight: tokens.size.chipLg, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.selectedSurface },
  patternText: { ...tokens.typography.body, color: tokens.colors.textPrimary, paddingVertical: tokens.spacing.xs },
  empty: { padding: tokens.spacing.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, gap: tokens.spacing.xs },
  emptyTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary }, emptyBody: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  errorState: { minHeight: tokens.size.buttonHeight, justifyContent: 'center', gap: tokens.spacing.md }, errorText: { ...tokens.typography.body, color: tokens.colors.danger },
  editor: { gap: tokens.spacing.sm },
  editorTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  fieldTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.xs },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs },
  typeOption: { minHeight: tokens.size.touchMin, minWidth: tokens.size.chipLg * 2, flexGrow: 1, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, paddingHorizontal: tokens.spacing.sm },
  selectedTypeOption: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface },
  typeOptionText: { ...tokens.typography.label, color: tokens.colors.textPrimary }, selectedTypeText: { color: tokens.colors.primary }, pressed: { opacity: 0.85 },
  dateTimeRow: { flexDirection: 'row', gap: tokens.spacing.sm }, dateField: { flex: 1.4 }, timeField: { flex: 0.8 },
  noteGroup: { gap: tokens.spacing.xs },
  noteInput: { minHeight: tokens.size.touchMin * 3, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body, padding: tokens.spacing.md, textAlignVertical: 'top' },
  characterCount: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textAlign: 'right' }, tooManyCharacters: { color: tokens.colors.danger },
  editorActions: { gap: tokens.spacing.sm },
  editorSecondaryActions: { flexDirection: 'row', gap: tokens.spacing.xs },
  editorSecondaryAction: { flex: 1 },
  layoutEditor: { gap: tokens.spacing.sm, width: '100%' },
  layoutTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  layoutBody: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  layoutGroupTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginTop: tokens.spacing.sm },
});

function LayoutEditor({ layout, onMove, onDone, error }: { layout: QuickLogLayout; onMove: (type: QuickLogLayoutType, destination: 'primary' | 'more') => void; onDone: () => void; error: boolean }) {
  return <View style={styles.layoutEditor} accessibilityLabel="Ändra snabbvalens layout">
    <Text style={styles.layoutTitle} accessibilityRole="header">Ändra snabbval</Text>
    <Text style={styles.layoutBody}>Tryck på en ruta för att flytta den mellan snabbval och Mer.</Text>
    <Text style={styles.layoutGroupTitle}>Visas först</Text>
    {layout.primary.map((type) => <ListRow key={`primary-${type}`} category={type} title={LOG_EVENT_LABELS[type]} meta="Flytta till Mer" onPress={() => onMove(type, 'more')} />)}
    <Text style={styles.layoutGroupTitle}>Under Mer</Text>
    {layout.more.map((type) => <ListRow key={`more-${type}`} category={type} title={LOG_EVENT_LABELS[type]} meta="Visa bland snabbval" onPress={() => onMove(type, 'primary')} />)}
    {error ? <MessageCard tone="error">Snabbvalen kunde inte sparas på enheten.</MessageCard> : null}
    <Button variant="tertiary" label="Klar" accessibilityLabel="Klar med snabbval" onPress={onDone} />
  </View>;
}
