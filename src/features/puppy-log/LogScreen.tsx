import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionFeedbackModal, DatePickerField, MessageCard, PageHeading, PrimaryButton, QuietButton, TimePickerField } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';
import { localDate } from '../onboarding/dog';
import {
  groupLogEventsByLocalDate,
  localDateTimeParts,
  LOG_EVENT_LABELS,
  LOG_EVENT_TYPES,
  parseLocalDateTime,
  summarizePottyPatterns,
  type LogEvent,
  type LogEventChanges,
  type LogEventType,
} from './log-model';

export function LogScreen({
  events,
  onAdd,
  onUpdate,
  onDelete,
  onMutationStart,
  mode = 'preview',
  busy = false,
  statusMessage,
  statusError = false,
  onRetryPending,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: {
  events: readonly LogEvent[];
  onAdd: (type: LogEventType) => void;
  onUpdate: (id: string, changes: LogEventChanges) => boolean | Promise<boolean>;
  onDelete: (id: string) => void | Promise<void>;
  onMutationStart?: () => void;
  mode?: 'preview' | 'cloud';
  busy?: boolean;
  statusMessage?: string;
  statusError?: boolean;
  onRetryPending?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedbackEventId, setFeedbackEventId] = useState<string | null>(null);
  const [deletedFeedbackEvent, setDeletedFeedbackEvent] = useState<LogEvent | null>(null);
  const [dismissedStatus, setDismissedStatus] = useState<string | null>(null);
  const editingEvent = events.find((event) => event.id === editingId) ?? null;
  const groups = groupLogEventsByLocalDate(events);
  const pottyPatterns = summarizePottyPatterns(events);
  const feedbackAttached = feedbackEventId !== null && (events.some((event) => event.id === feedbackEventId) || deletedFeedbackEvent?.id === feedbackEventId);

  function confirmDelete(event: LogEvent) {
    Alert.alert(
      'Radera loggpost?',
      mode === 'cloud' ? 'Posten tas bort från hundens logg.' : 'Posten tas bort från den här tillfälliga förhandsvisningen.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Radera', style: 'destructive', onPress: () => { onMutationStart?.(); setDismissedStatus(null); setDeletedFeedbackEvent(event); setFeedbackEventId(event.id); void onDelete(event.id); } },
      ],
    );
  }

  return (
    <View>
      <PageHeading title="Vardagslogg" description={mode === 'cloud' ? 'Lägg till en händelse eller rätta något i hundens vardag.' : 'Lägg till en liten händelse eller rätta en exempelpost.'} />
      <Text style={styles.sectionTitle} accessibilityRole="header">Snabb logg</Text>
      <View style={styles.quickGrid}>
        {LOG_EVENT_TYPES.map((type) => (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityLabel={`Lägg till ${LOG_EVENT_LABELS[type]}`}
            disabled={busy}
            onPress={() => { onMutationStart?.(); setDismissedStatus(null); setFeedbackEventId(null); setDeletedFeedbackEvent(null); onAdd(type); }}
            style={({ pressed }) => [styles.quickButton, busy && styles.disabled, pressed && !busy && styles.pressed]}
          >
            <View style={styles.quickMark}><Text style={styles.quickMarkText}>{quickMark[type]}</Text></View>
            <Text style={styles.quickLabel}>{LOG_EVENT_LABELS[type]}</Text>
          </Pressable>
        ))}
      </View>
      {statusMessage && !statusError && !feedbackAttached ? <ActionFeedbackModal visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => setDismissedStatus(statusMessage)} /> : null}
      <MessageCard>{mode === 'cloud'
        ? 'Loggen hämtas från ditt konto. Ändringar visas som sparade först när servern har bekräftat dem.'
        : 'Exempelposter är märkta. Nya poster finns bara i minnet och försvinner när appen stängs.'}</MessageCard>
      <View style={styles.patternCard} accessibilityLabel="Historiskt mönsterunderlag för Kiss och Bajs">
        <Text style={styles.patternTitle}>Historiskt mönsterunderlag</Text>
        <Text style={styles.patternBody}>Sammanfattningen beskriver bara tidigare ägarregistreringar. Den förutsäger inte när hunden behöver gå ut.</Text>
        {pottyPatterns.map((pattern) => <Text key={pattern.type} style={styles.patternRow}>{LOG_EVENT_LABELS[pattern.type]}: {pattern.count} registreringar{pattern.medianIntervalMinutes === null ? '' : ` · typiskt intervall ${formatInterval(pattern.medianIntervalMinutes)}`}</Text>)}
      </View>
      {statusMessage && statusError ? <>
        <MessageCard tone="error">{statusMessage}</MessageCard>
        {onRetryPending && <PrimaryButton title="Kontrollera status" disabled={busy} onPress={onRetryPending} />}
      </> : null}
      {mode === 'cloud' && busy && <MessageCard>Sparar och kontrollerar ändringen…</MessageCard>}
      {editingEvent && (
        <LogEventEditor
          key={editingEvent.id}
          event={editingEvent}
          onCancel={() => setEditingId(null)}
          onSave={(changes) => { onMutationStart?.(); setDismissedStatus(null); setDeletedFeedbackEvent(null); setFeedbackEventId(editingEvent.id); return onUpdate(editingEvent.id, changes); }}
          onSaved={() => setEditingId(null)}
        />
      )}
      <Text style={styles.sectionTitle} accessibilityRole="header">Logghistorik</Text>
      {groups.length === 0 && <MessageCard>Loggen är tom. Lägg till en händelse med snabbknapparna ovan.</MessageCard>}
      {groups.map((group) => (
        <View key={group.date} style={styles.dateGroup}>
          <Text style={styles.dateHeading}>{dateHeading(group.date)}</Text>
          {group.events.map((event) => {
            const { time } = localDateTimeParts(event.occurredAt);
            return (
              <View key={event.id} style={styles.eventCard}>
                <Text style={styles.eventTime}>{time}</Text>
                <View style={styles.eventCopy}>
                  <View style={styles.eventTitleRow}>
                    <Text style={styles.eventTitle}>{LOG_EVENT_LABELS[event.type]}</Text>
                    <Text style={event.origin === 'example' ? styles.exampleLabel : styles.testLabel}>
                      {mode === 'cloud' ? 'SPARAD' : event.origin === 'example' ? 'EXEMPEL' : 'TESTPOST'}
                    </Text>
                  </View>
                  {event.note && <Text style={styles.eventNote}>{event.note}</Text>}
                  <View style={styles.eventActions}>
                    <QuietButton title="Ändra" disabled={busy} onPress={() => setEditingId(event.id)} />
                    <QuietButton title="Radera" disabled={busy} onPress={() => confirmDelete(event)} />
                  </View>
                  {statusMessage && !statusError && feedbackEventId === event.id ? <ActionFeedbackModal visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => { setDismissedStatus(statusMessage); setDeletedFeedbackEvent(null); }} /> : null}
                </View>
              </View>
            );
          })}
          {deletedFeedbackEvent && feedbackEventId === deletedFeedbackEvent.id && localDateTimeParts(deletedFeedbackEvent.occurredAt).date === group.date && !events.some((event) => event.id === deletedFeedbackEvent.id) ? (
            <View style={styles.eventCard} accessibilityLabel="Raderad loggpost">
              <Text style={styles.eventTime}>{localDateTimeParts(deletedFeedbackEvent.occurredAt).time}</Text>
              <View style={styles.eventCopy}>
                <Text style={styles.eventTitle}>Loggpost raderad</Text>
                {statusMessage && !statusError ? <ActionFeedbackModal visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => { setDismissedStatus(statusMessage); setDeletedFeedbackEvent(null); }} /> : null}
              </View>
            </View>
          ) : null}
        </View>
      ))}
      {deletedFeedbackEvent && feedbackEventId === deletedFeedbackEvent.id && !events.some((event) => event.id === deletedFeedbackEvent.id) && !groups.some((group) => group.date === localDateTimeParts(deletedFeedbackEvent.occurredAt).date) ? (
        <View style={styles.dateGroup}>
          <Text style={styles.dateHeading}>{dateHeading(localDateTimeParts(deletedFeedbackEvent.occurredAt).date)}</Text>
          <View style={styles.eventCard} accessibilityLabel="Raderad loggpost">
            <Text style={styles.eventTime}>{localDateTimeParts(deletedFeedbackEvent.occurredAt).time}</Text>
            <View style={styles.eventCopy}>
              <Text style={styles.eventTitle}>Loggpost raderad</Text>
              {statusMessage && !statusError ? <ActionFeedbackModal visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => { setDismissedStatus(statusMessage); setDeletedFeedbackEvent(null); }} /> : null}
            </View>
          </View>
        </View>
      ) : null}
      {mode === 'cloud' && hasMore && <PrimaryButton title={loadingMore ? 'Hämtar…' : 'Visa äldre poster'} disabled={loadingMore || busy} onPress={onLoadMore ?? (() => undefined)} />}
      <View style={styles.footerSpace} />
    </View>
  );
}

function LogEventEditor({
  event,
  onSave,
  onSaved,
  onCancel,
}: {
  event: LogEvent;
  onSave: (changes: LogEventChanges) => boolean | Promise<boolean>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const initial = localDateTimeParts(event.occurredAt);
  const [type, setType] = useState(event.type);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [note, setNote] = useState(event.note ?? '');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const timestamp = parseLocalDateTime(date, time, new Date());
  const noteLength = Array.from(note).length;
  const valid = Boolean(timestamp) && noteLength <= 500;

  async function save() {
    if (saving) return;
    const occurredAt = parseLocalDateTime(date, time, new Date());
    if (!occurredAt) {
      setSaveError('Ange ett giltigt datum och en tid som inte ligger i framtiden.');
      return;
    }
    if (Array.from(note).length > 500) {
      setSaveError('Noteringen får innehålla högst 500 tecken.');
      return;
    }
    setSaveError('');
    setSaving(true);
    try {
      if (await onSave({ type, occurredAt, note })) onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.editor}>
      <Text style={styles.editorTitle} accessibilityRole="header">Ändra loggpost</Text>
      <Text style={styles.fieldTitle}>Typ</Text>
      <View style={styles.typeGrid}>
        {LOG_EVENT_TYPES.map((option) => {
          const selected = type === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setType(option)}
              style={({ pressed }) => [styles.typeOption, selected && styles.selectedTypeOption, pressed && styles.pressed]}
            >
              <Text style={[styles.typeOptionText, selected && styles.selectedTypeText]}>{LOG_EVENT_LABELS[option]}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.dateTimeRow}>
        <View style={styles.dateField}>
          <DatePickerField label="Datum" onChangeText={setDate} value={date} />
        </View>
        <View style={styles.timeField}>
          <TimePickerField label="Tid" onChangeText={setTime} value={time} />
        </View>
      </View>
      <View style={styles.noteGroup}>
        <Text style={styles.fieldTitle}>Notering (valfri)</Text>
        <TextInput
          accessibilityLabel="Notering, högst 500 tecken"
          maxLength={1000}
          multiline
          onChangeText={setNote}
          placeholder="Lägg till en kort notering"
          placeholderTextColor={theme.colors.mutedText}
          style={styles.noteInput}
          value={note}
        />
        <Text style={[styles.characterCount, noteLength > 500 && styles.tooManyCharacters]}>{noteLength}/500</Text>
      </View>
      {saveError ? <MessageCard tone="error">{saveError}</MessageCard> : null}
      {!valid && !saveError && <MessageCard tone="error">Kontrollera datum, tid och notering.</MessageCard>}
      <PrimaryButton title={saving ? 'Sparar…' : 'Spara ändring'} disabled={!valid || saving} onPress={() => { void save(); }} />
      <QuietButton title="Avbryt" onPress={onCancel} />
    </View>
  );
}

function dateHeading(date: string): string {
  if (date === localDate()) return 'Idag';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
  return date === yesterdayKey ? 'Igår' : date;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

const quickMark: Record<LogEventType, string> = {
  pee: '💧',
  poop: '💩',
  food: '◒',
  sleep: '☾',
  awake: '◉',
  walk: '↗',
};

const styles = StyleSheet.create({
  sectionTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '800', marginTop: 2, marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickButton: { flexBasis: '31%', flexGrow: 1, minHeight: 80, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.button, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 8 },
  quickMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E4EEF4', alignItems: 'center', justifyContent: 'center' },
  quickMarkText: { color: theme.colors.accent, fontSize: 19, fontWeight: '800' },
  quickLabel: { color: theme.colors.text, fontSize: 13, fontWeight: '700', marginTop: 6 },
  dateGroup: { marginTop: 18 },
  dateHeading: { color: theme.colors.mutedText, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  eventCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: theme.radius.button, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 8 },
  eventTime: { color: theme.colors.mutedText, fontSize: 13, fontWeight: '700', width: 52, paddingTop: 3 },
  eventCopy: { flex: 1 },
  eventTitleRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  eventTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
  exampleLabel: { color: '#785716', backgroundColor: '#F5E7BF', fontSize: 9, fontWeight: '800', letterSpacing: 0.4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  testLabel: { color: theme.colors.accent, backgroundColor: '#E5EFE8', fontSize: 9, fontWeight: '800', letterSpacing: 0.4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  eventNote: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 5 },
  eventActions: { flexDirection: 'row', alignSelf: 'flex-start', gap: 4, marginLeft: -12, marginTop: 2 },
  editor: { backgroundColor: '#F0E9DC', borderRadius: theme.radius.card, padding: 16, marginTop: 22, marginBottom: 24 },
  editorTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 14 },
  fieldTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
  typeOption: { minHeight: 44, minWidth: 74, flexGrow: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, paddingHorizontal: 8 },
  selectedTypeOption: { borderColor: theme.colors.accent, backgroundColor: '#E5EFE8' },
  typeOptionText: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
  selectedTypeText: { color: theme.colors.accent },
  dateTimeRow: { flexDirection: 'row', gap: 10 },
  dateField: { flex: 1.4 },
  timeField: { flex: 0.8 },
  noteGroup: { marginBottom: 12 },
  noteInput: { minHeight: 92, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 16, lineHeight: 22, padding: 12, textAlignVertical: 'top' },
  characterCount: { color: theme.colors.mutedText, fontSize: 12, textAlign: 'right', marginTop: 5 },
  tooManyCharacters: { color: theme.colors.error, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
  footerSpace: { height: 8 },
  patternCard: { marginTop: 16, padding: 14, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#F1F5F0' },
  patternTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  patternBody: { color: theme.colors.mutedText, fontSize: 13, lineHeight: 19, marginTop: 5 },
  patternRow: { color: theme.colors.text, fontSize: 14, fontWeight: '700', marginTop: 7 },
});

function formatInterval(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return remainder === 0 ? `${hours} h` : `${hours} h ${remainder} min`;
}
