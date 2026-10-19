import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ExpoCrypto from 'expo-crypto';
import { AccessibilityInfo, ActivityIndicator, Alert, Animated, Easing, LayoutAnimation, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet, Button, Card, CheckboxCard, Dialog, FirstUseTip, HorizontalGestureRegion, IconChip, ListRow, QuickLogTile, SectionHeader, Skeleton, Toast, useFirstUseTip } from '../../components/ui';
import { DatePickerField, MessageCard, TimePickerField } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';
import { localDate } from '../onboarding/dog';
import { canonicalAccidentKinds, decideQuickLogPress, hasRecentCategoryLog, isCanonicalAccidentKinds, localDateTimeParts, LOG_ENTRY_TYPES, LOG_EVENT_LABELS, parseLocalDateTime, summarizePottyPatterns, type AccidentKind, type AccidentLogIntent, type LogEvent, type LogEventChanges, type LogEventType } from './log-model';
import { loadQuickLogLayout, saveQuickLogLayout } from './quick-log-layout-storage';
import { DEFAULT_QUICK_LOG_LAYOUT, moveQuickLogType, type QuickLogLayout, type QuickLogLayoutType } from './quick-log-layout';

export type QuickLogMutationView = { kind: 'add' | 'update' | 'delete' | 'undo'; mutationId: string; id: string; type: LogEventType; occurredAt: string; accidentKinds?: readonly AccidentKind[] | null; status: 'pending' | 'failed' | 'unsure' | 'saved' };
type EditorActionState = { canSave: boolean; saving: boolean };

export function LogScreen({ events, onAdd, onUpdate, onDelete, mode = 'preview', layoutOwnerId, persistLayout = true, busy = false, loading = false, loadError = false, refreshError = false, onReload, mutation, loadMoreError = false, onRetry, onCancel, onUndo, hasMore = false, loadingMore = false, onLoadMore }: {
  events: readonly LogEvent[];
  onAdd: (type: LogEventType, intent?: AccidentLogIntent) => void;
  onUpdate?: (id: string, changes: LogEventChanges) => boolean | Promise<boolean>;
  onDelete?: (id: string) => boolean | void | Promise<boolean | void>;
  mode?: 'preview' | 'cloud';
  layoutOwnerId?: string;
  persistLayout?: boolean;
  busy?: boolean;
  loading?: boolean;
  loadError?: boolean;
  refreshError?: boolean;
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
  const [addEventVisible, setAddEventVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [duplicate, setDuplicate] = useState<{ type: LogEventType; timestamp: number; accidentIntent?: AccidentLogIntent } | null>(null);
  const [accidentDraft, setAccidentDraft] = useState<{ kinds: AccidentKind[]; error: string; submitting: boolean } | null>(null);
  const accidentSubmitLocked = useRef(false);
  const lastSubmitAt = useRef<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorActionState, setEditorActionState] = useState<EditorActionState>({ canSave: false, saving: false });
  const editorSubmitRef = useRef<(() => Promise<void>) | null>(null);
  const updateEditorActionState = useCallback((state: EditorActionState) => {
    setEditorActionState((current) => current.canSave === state.canSave && current.saving === state.saving ? current : state);
  }, []);
  const [dismissedMutationKey, setDismissedMutationKey] = useState<string | null>(null);
  const [layout, setLayout] = useState<QuickLogLayout>(DEFAULT_QUICK_LOG_LAYOUT);
  const [layoutEditing, setLayoutEditing] = useState(false);
  const [layoutError, setLayoutError] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => localDate());
  const [deleteSnapshot, setDeleteSnapshot] = useState<{ token: number; event: LogEvent; phase: 'pending' | 'exiting' } | null>(null);
  const deleteToken = useRef(0);
  const [entryAnimationTarget, setEntryAnimationTarget] = useState<{ eventId: string; key: string } | null>(null);
  const [consumedEntryAnimationKey, setConsumedEntryAnimationKey] = useState<string | null>(null);
  const firstUseTip = useFirstUseTip(layoutOwnerId, 'log', mode === 'cloud' && !loading && !loadError);
  const handledEntryMutationKey = useRef(mutation?.kind === 'add' && mutation.status === 'saved' ? `${mutation.kind}:${mutation.mutationId}` : '');
  const displayedEvents = useMemo(() => {
    if (!deleteSnapshot) return events;
    return [...events.filter((event) => event.id !== deleteSnapshot.event.id), deleteSnapshot.event];
  }, [deleteSnapshot, events]);
  const todayDate = localDate();
  const selectedDateEvents = useMemo(() => displayedEvents
    .filter((event) => localDateTimeParts(event.occurredAt).date === selectedDate)
    .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt) || a.id.localeCompare(b.id)), [displayedEvents, selectedDate]);
  const oldestLoadedEvent = useMemo(() => displayedEvents.reduce<LogEvent | null>((current, event) => !current || Date.parse(event.occurredAt) < Date.parse(current.occurredAt) ? event : current, null), [displayedEvents]);
  const oldestLoadedDate = oldestLoadedEvent ? localDateTimeParts(oldestLoadedEvent.occurredAt).date : null;
  const hasOlderDateBoundary = oldestLoadedDate !== null && oldestLoadedDate < selectedDate;
  const dayReadComplete = !hasMore || hasOlderDateBoundary;
  const pendingAdd = mutation?.kind === 'add' && mutation.status === 'pending'
    && localDateTimeParts(mutation.occurredAt).date === selectedDate
    && !displayedEvents.some((event) => event.id === mutation.id)
    ? mutation : null;
  const timelineItems = useMemo(() => [
    ...selectedDateEvents.map((event) => ({ kind: 'event' as const, event, occurredAt: event.occurredAt })),
    ...(pendingAdd ? [{ kind: 'pending' as const, event: pendingAdd, occurredAt: pendingAdd.occurredAt }] : []),
  ].sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt) || a.event.id.localeCompare(b.event.id)), [pendingAdd, selectedDateEvents]);
  const autoLoadAnchor = useRef('');
  const needsDatePage = hasMore && !hasOlderDateBoundary && !loadMoreError && !loadError && !loading;
  const patterns = useMemo(() => summarizePottyPatterns(events).filter((item) => item.count >= 2), [events]);
  const editingEvent = events.find((event) => event.id === editingId) ?? null;
  const editLocked = busy || Boolean(editingEvent && mutation?.id === editingEvent.id && mutation.status !== 'saved');
  const onDeleteAnimationEnd = useCallback((token: number) => {
    setDeleteSnapshot((current) => current?.token === token ? null : current);
  }, []);
  const consumeEntryAnimation = useCallback((key: string) => {
    setConsumedEntryAnimationKey(key);
  }, []);

  useEffect(() => {
    const isConfirmedAdd = mutation?.kind === 'add' && mutation.status === 'saved' && events.some((event) => event.id === mutation.id);
    if (!isConfirmedAdd) return;
    const key = `${mutation.kind}:${mutation.mutationId}`;
    if (handledEntryMutationKey.current === key) return;
    handledEntryMutationKey.current = key;
    setEntryAnimationTarget({ eventId: mutation.id, key });
    setConsumedEntryAnimationKey(null);
  }, [events, mutation]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!persistLayout) return;
    let active = true;
    void loadQuickLogLayout(layoutOwnerId).then((saved) => {
      if (active) setLayout(saved);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [layoutOwnerId, persistLayout]);

  useEffect(() => {
    if (!needsDatePage || loadingMore || !onLoadMore) {
      if (!loadingMore) autoLoadAnchor.current = '';
      return;
    }
    const anchor = `${selectedDate}:${displayedEvents.length}:${oldestLoadedEvent?.id ?? 'empty'}`;
    if (autoLoadAnchor.current === anchor) return;
    autoLoadAnchor.current = anchor;
    onLoadMore();
  }, [displayedEvents, loadingMore, loadError, loadMoreError, needsDatePage, onLoadMore, oldestLoadedEvent, selectedDate]);

  function selectType(type: LogEventType, timestamp: number, force = false) {
    setAddEventVisible(false);
    if (type === 'accident') {
      if (disabled) return;
      accidentSubmitLocked.current = false;
      setAccidentDraft({ kinds: ['pee'], error: '', submitting: false });
      setMoreVisible(false);
      return;
    }
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
    if (selectedDate !== todayDate) setSelectedDate(todayDate);
    firstUseTip.dismiss();
    onAdd(type);
  }

  function closeAccidentSelector() {
    if (accidentDraft?.submitting && duplicate?.accidentIntent) {
      accidentSubmitLocked.current = false;
      setAccidentDraft((current) => current ? { ...current, submitting: false } : null);
      setDuplicate(null);
      return;
    }
    if (accidentDraft?.submitting) return;
    accidentSubmitLocked.current = false;
    setAccidentDraft(null);
  }

  function submitAccidentIntent(intent: AccidentLogIntent, timestamp: number) {
    lastSubmitAt.current = timestamp;
    setDuplicate(null);
    setAccidentDraft(null);
    if (selectedDate !== todayDate) setSelectedDate(todayDate);
    firstUseTip.dismiss();
    onAdd('accident', intent);
  }

  function submitAccidentDraft() {
    if (!accidentDraft || disabled || accidentSubmitLocked.current) return;
    const accidentKinds = canonicalAccidentKinds(accidentDraft.kinds);
    if (!isCanonicalAccidentKinds(accidentKinds)) {
      setAccidentDraft((current) => current ? { ...current, error: 'Välj minst Kiss eller Bajs för att spara olyckan.' } : null);
      return;
    }
    accidentSubmitLocked.current = true;
    const occurredAt = new Date().toISOString();
    const intent: AccidentLogIntent = { id: ExpoCrypto.randomUUID(), occurredAt, accidentKinds };
    const timestamp = Date.parse(occurredAt);
    const decision = decideQuickLogPress({
      blocked: Boolean(mutation && mutation.status !== 'saved'),
      force: false,
      lastSubmitAt: lastSubmitAt.current,
      timestamp,
      recentDuplicate: hasRecentCategoryLog(events, 'accident', timestamp),
    });
    if (decision === 'blocked') {
      accidentSubmitLocked.current = false;
      return;
    }
    if (decision === 'confirm-duplicate') {
      setAccidentDraft((current) => current ? { ...current, submitting: true } : null);
      setDuplicate({ type: 'accident', timestamp, accidentIntent: intent });
      return;
    }
    submitAccidentIntent(intent, timestamp);
  }

  function toggleAccidentKind(kind: AccidentKind, checked: boolean) {
    setAccidentDraft((current) => {
      if (!current || current.submitting) return current;
      const kinds = canonicalAccidentKinds(checked
        ? [...current.kinds, kind]
        : current.kinds.filter((value) => value !== kind));
      return { ...current, kinds, error: kinds.length > 0 ? '' : 'Välj minst Kiss eller Bajs för att spara olyckan.' };
    });
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
    if (!persistLayout) return;
    void saveQuickLogLayout(next, layoutOwnerId).catch(() => setLayoutError(true));
  }

  const disabled = busy || Boolean(mutation && mutation.status !== 'saved');
  const renderQuickTile = (type: QuickLogLayoutType) => <QuickLogTile
    key={type}
    variant="rev02-log"
    label={LOG_EVENT_LABELS[type]}
    accessibilityLabel={`Logga ${LOG_EVENT_LABELS[type].toLocaleLowerCase('sv-SE')}`}
    accessibilityHint="Håll inne för att ändra vilka snabbval som visas först"
    category={type}
    compact
    disabled={disabled}
    onLongPress={() => { firstUseTip.dismiss(); startLayoutEdit(); }}
    onPress={(event) => { firstUseTip.dismiss(); selectType(type, event.nativeEvent.timestamp); }}
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
        const token = ++deleteToken.current;
        setDeleteSnapshot({ token, event, phase: 'pending' });
        void Promise.resolve(onDelete(event.id)).then((saved) => {
          if (deleteToken.current !== token) return;
          if (saved === true) {
            setDeleteSnapshot((current) => current?.token === token ? { ...current, phase: 'exiting' } : current);
            setEditingId(null);
          } else {
            setDeleteSnapshot((current) => current?.token === token ? null : current);
            if (saved !== false) setEditingId(null);
          }
        }).catch(() => {
          if (deleteToken.current === token) setDeleteSnapshot((current) => current?.token === token ? null : current);
        });
      } },
    ]);
  }

  const successMutationKey = mutation?.status === 'saved' ? `${mutation.kind}:${mutation.mutationId}` : '';
  const successToast = <Toast visible={mutation?.status === 'saved' && dismissedMutationKey !== successMutationKey} tone="success" confirmed message={mutation?.status === 'saved' ? mutation.kind === 'add' ? `${LOG_EVENT_LABELS[mutation.type]} loggat` : mutation.kind === 'update' ? 'Ändring sparad' : 'Händelsen är raderad' : ''}
    onUndo={mutation?.status === 'saved' && mutation.kind === 'add' ? () => { firstUseTip.dismiss(); onUndo?.(mutation.id); } : undefined} autoDismissMs={2500}
    onAutoDismiss={() => setDismissedMutationKey(successMutationKey)} />;
  return <View style={styles.screen}>
    <Text accessibilityRole="header" style={styles.pageTitle}>Logga</Text>
    {firstUseTip.visible ? <FirstUseTip text="Tryck på Fler för fler loggtyper." onDismiss={firstUseTip.dismiss} /> : null}
    <Toast visible={loadMoreError} tone="error" message="Äldre poster kunde inte hämtas" onRetry={onLoadMore ? () => { firstUseTip.dismiss(); return onLoadMore(); } : undefined} />
    <Toast visible={!editingEvent && mutation?.status === 'failed'} tone="error" message="Kunde inte spara" onRetry={() => { firstUseTip.dismiss(); return retryMutation(); }} onCancel={() => { firstUseTip.dismiss(); onCancel?.(); if (mutation && mutation.kind !== 'add') setEditingId(null); }} />
    <Toast visible={!editingEvent && mutation?.status === 'unsure'} tone="uncertain" onRetry={() => { firstUseTip.dismiss(); return retryMutation(); }} />
    <View style={styles.dateNavigator}>
      <Pressable accessibilityRole="button" accessibilityLabel="Visa föregående dag" onPress={() => setSelectedDate((date) => shiftLocalDate(date, -1))} style={({ pressed }) => [styles.dateButton, pressed && styles.datePressed]}>
        <Ionicons name="chevron-back" size={tokens.size.iconMd} color={tokens.colors.textPrimary} />
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.selectedDate}>{formatSelectedDate(selectedDate, todayDate)}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Visa nästa dag" accessibilityState={{ disabled: selectedDate >= todayDate }} disabled={selectedDate >= todayDate} onPress={() => setSelectedDate((date) => shiftLocalDate(date, 1))} style={({ pressed }) => [styles.dateButton, pressed && styles.datePressed]}>
        <Ionicons name="chevron-forward" size={tokens.size.iconMd} color={selectedDate >= todayDate ? tokens.colors.textSecondary : tokens.colors.textPrimary} />
      </Pressable>
    </View>
    {loading ? <>
      <SectionHeader title="Snabb logg" />
      <Skeleton shape="card" lines={3} />
      <Skeleton shape="row" lines={2} />
    </> : loadError ? <View style={styles.errorState}>
      <Text style={styles.errorText}>Loggen kunde inte hämtas.</Text>
      <Button label="Försök igen" accessibilityLabel="Försök igen" onPress={() => { firstUseTip.dismiss(); onReload?.(); }} />
    </View> : <>
      {refreshError ? <View style={styles.refreshErrorState} accessibilityLiveRegion="polite">
        <MessageCard tone="error">Loggen kunde inte uppdateras. Dina visade händelser är kvar.</MessageCard>
        <Button variant="tertiary" label="Försök igen" accessibilityLabel="Försök uppdatera loggen igen" onPress={() => { firstUseTip.dismiss(); onReload?.(); }} />
      </View> : null}
      <SectionHeader title="Snabb logg" />
      <View style={styles.grid}>
        {layoutEditing ? <LayoutEditor layout={layout} onMove={moveLayoutType} onDone={() => setLayoutEditing(false)} error={layoutError} /> : renderRows(layout.primary)}
      </View>
      {successToast}
      {!layoutEditing && <View style={styles.moreRow}><QuickLogTile subtle label="Fler" accessibilityLabel={moreVisible ? 'Dölj fler loggtyper' : 'Visa fler loggtyper'} accessibilityHint="Håll inne för att ändra snabbvalens layout" icon={<View style={styles.moreIcon}><Ionicons name={moreVisible ? 'close-outline' : 'grid-outline'} size={tokens.size.iconMd} color={tokens.colors.textPrimary} /></View>} disabled={disabled} onLongPress={() => { firstUseTip.dismiss(); startLayoutEdit(); }} onPress={() => { firstUseTip.dismiss(); toggleMore(); }} /></View>}
      {!layoutEditing && moreVisible ? <View style={styles.grid} accessibilityLabel="Fler loggtyper">{renderRows(layout.more)}</View> : null}

      {accidentDraft ? <BottomSheet visible={!duplicate?.accidentIntent} title="Logga olycka" onRequestClose={closeAccidentSelector}>
        <View style={styles.accidentTypeGroup}>
          <Text accessibilityRole="header" accessibilityLabel="Vad hände?" style={styles.fieldTitle}>Vad hände?</Text>
          <Text style={styles.accidentHelp}>Välj Kiss, Bajs eller båda så räknas olyckan i dina mönster.</Text>
          <CheckboxCard label="Kiss" checked={accidentDraft.kinds.includes('pee')} disabled={accidentDraft.submitting} onChange={(checked) => toggleAccidentKind('pee', checked)} />
          <CheckboxCard label="Bajs" checked={accidentDraft.kinds.includes('poop')} disabled={accidentDraft.submitting} onChange={(checked) => toggleAccidentKind('poop', checked)} />
        </View>
        {accidentDraft.error ? <MessageCard tone="error">{accidentDraft.error}</MessageCard> : null}
        <View style={styles.accidentActions}>
          <View style={styles.accidentAction}><Button variant="secondary" label="Avbryt" accessibilityLabel="Avbryt olycksloggning" disabled={accidentDraft.submitting} onPress={closeAccidentSelector} /></View>
          <View style={styles.accidentAction}><Button label="Spara olycka" accessibilityLabel={accidentDraft.submitting ? 'Sparar olycka' : 'Spara olycka'} disabled={accidentDraft.kinds.length === 0 || accidentDraft.submitting || disabled} loading={accidentDraft.submitting && !duplicate} onPress={submitAccidentDraft} /></View>
        </View>
      </BottomSheet> : null}
      {editingEvent ? <BottomSheet visible title="Ändra händelse" keyboardAware footer={<Button label={editorActionState.saving ? 'Sparar…' : 'Spara ändring'} accessibilityLabel={editorActionState.saving ? 'Sparar ändring' : 'Spara ändring'} loading={editorActionState.saving} disabled={!editorActionState.canSave || editLocked} onPress={() => { firstUseTip.dismiss(); void editorSubmitRef.current?.(); }} />} onRequestClose={() => { if (!editLocked && !editorActionState.saving) setEditingId(null); }}>
        <Toast visible={mutation?.status === 'failed'} tone="error" message="Kunde inte spara" onRetry={() => { firstUseTip.dismiss(); return retryMutation(); }} onCancel={() => { firstUseTip.dismiss(); onCancel?.(); if (mutation && mutation.kind !== 'add') setEditingId(null); }} />
        <Toast visible={mutation?.status === 'unsure'} tone="uncertain" onRetry={() => { firstUseTip.dismiss(); return retryMutation(); }} />
        <LogEventEditor key={editingEvent.id} event={editingEvent} disabled={editLocked} onSave={(changes) => { firstUseTip.dismiss(); return saveEdit(editingEvent, changes); }} onSaved={() => setEditingId(null)} onCancel={() => { firstUseTip.dismiss(); setEditingId(null); }} onDelete={() => { firstUseTip.dismiss(); askToDelete(editingEvent); }} submitRef={editorSubmitRef} onActionStateChange={updateEditorActionState} />
      </BottomSheet> : null}

      <SectionHeader title={selectedDate === todayDate ? 'Dagens logg' : 'Händelser'} />
      {timelineItems.map((item, index) => {
        if (item.kind === 'pending') {
          const parts = localDateTimeParts(item.event.occurredAt);
          return <ListRow key={`pending-${item.event.mutationId}`} variant="log-timeline" showDivider={index < timelineItems.length - 1} title={LOG_EVENT_LABELS[item.event.type]} meta="Sparar…" time={parts.time} category={item.event.type} accidentKinds={item.event.accidentKinds ?? null} accessibilityLabel={`${LOG_EVENT_LABELS[item.event.type]} ${parts.time}, sparar`} chevron={false} />;
        }
        const event = item.event;
          const rowPending = mutation?.id === event.id && mutation.status === 'pending';
          const deleting = deleteSnapshot?.event.id === event.id;
          const detail = [event.note, rowPending ? 'Sparar…' : null, event.origin === 'example' ? 'Exempel' : mode === 'preview' ? 'Testpost' : null].filter(Boolean).join(' · ');
          const parts = localDateTimeParts(event.occurredAt);
          if (deleting && deleteSnapshot.phase === 'exiting') return <DeleteExitRow key={event.id} token={deleteSnapshot.token} event={event} reduceMotion={reduceMotion} onFinished={onDeleteAnimationEnd} />;
          const row = <ListRow variant="log-timeline" showDivider={index < timelineItems.length - 1} title={LOG_EVENT_LABELS[event.type]} accessibilityLabel={`${LOG_EVENT_LABELS[event.type]} ${parts.time}${event.note ? `, ${event.note}` : ''}${deleting ? ', raderar' : rowPending ? ', sparar' : ''}${deleting ? '' : ', tryck för att ändra'}`} accessibilityState={deleting && deleteSnapshot.phase === 'pending' ? { busy: true, disabled: true } : undefined} category={event.type} accidentKinds={event.accidentKinds} time={parts.time} detail={deleting ? 'Raderar…' : detail || undefined} onPress={deleting ? undefined : () => { firstUseTip.dismiss(); editorSubmitRef.current = null; setEditorActionState({ canSave: false, saving: false }); setEditingId(event.id); }} disabled={deleting || busy || Boolean(mutation && mutation.status !== 'saved')} />;
          const entryTarget = entryAnimationTarget?.eventId === event.id ? entryAnimationTarget : null;
          if (entryTarget) return <LogEntryTransition key={event.id} transitionKey={consumedEntryAnimationKey === entryTarget.key ? undefined : entryTarget.key} reduceMotion={reduceMotion} onAnimationStart={consumeEntryAnimation}>{row}</LogEntryTransition>;
          return <View key={event.id}>{row}</View>;
      })}
      {!dayReadComplete && !loadMoreError ? <View style={styles.loadingOlder} accessibilityLiveRegion="polite"><ActivityIndicator color={tokens.colors.primary} size="small" /><Text style={styles.loadingOlderText}>{loadingMore ? 'Hämtar fler händelser…' : 'Söker efter fler händelser…'}</Text></View> : null}
      {dayReadComplete && timelineItems.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Inga händelser den här dagen</Text><Text style={styles.emptyBody}>Välj en annan dag eller tryck på en ruta ovan för att logga en händelse idag.</Text></View> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Lägg till händelse" accessibilityHint="Öppnar fler loggtyper" accessibilityState={{ disabled }} disabled={disabled} onPress={() => { firstUseTip.dismiss(); setAddEventVisible(true); }} style={({ pressed }) => [styles.addEventButton, pressed && !disabled && styles.addEventPressed, disabled && styles.addEventDisabled]}>
        <Ionicons name="add" size={tokens.size.iconMd} color={tokens.colors.onPrimary} />
        <Text style={styles.addEventLabel}>Lägg till händelse</Text>
      </Pressable>
      <BottomSheet visible={addEventVisible} title="Lägg till händelse" onRequestClose={() => setAddEventVisible(false)}>
        <Text style={styles.addEventHelp}>Välj vilken typ av händelse du vill registrera.</Text>
        <View style={styles.grid} accessibilityLabel="Fler loggtyper">{renderRows(layout.more)}</View>
      </BottomSheet>
      {patterns.length > 0 ? <>
        <SectionHeader title="Dina senaste mönster" />
        <Card accessibilityLabel="Dina senaste mönster för Kiss och Bajs">
          {patterns.map((item) => <Text key={item.type} style={styles.patternText}>{LOG_EVENT_LABELS[item.type]}: {item.count} gånger{item.medianIntervalMinutes === null ? '' : ` · ungefär ${formatInterval(item.medianIntervalMinutes)}`}</Text>)}
        </Card>
      </> : null}

      {!loadMoreError && dayReadComplete && hasMore ? <Button label={loadingMore ? 'Hämtar…' : 'Visa äldre poster'} accessibilityLabel={loadingMore ? 'Hämtar äldre poster' : 'Visa äldre poster'} disabled={loadingMore} loading={loadingMore} onPress={() => { firstUseTip.dismiss(); onLoadMore?.(); }} /> : null}
    </>}

    <Dialog visible={duplicate !== null} title="Du har redan loggat det här. Lägga till ändå?" onRequestClose={() => {
      setDuplicate(null);
      if (duplicate?.accidentIntent) {
        accidentSubmitLocked.current = false;
        setAccidentDraft((current) => current ? { ...current, submitting: false } : null);
      }
    }} onConfirm={() => {
      if (!duplicate) return;
      if (duplicate.accidentIntent) submitAccidentIntent(duplicate.accidentIntent, duplicate.timestamp);
      else selectType(duplicate.type, duplicate.timestamp, true);
    }} confirmLabel="Lägg till ändå" confirmVariant="primary"><View /></Dialog>
  </View>;
}

function LogEntryTransition({ children, transitionKey, reduceMotion, onAnimationStart }: { children: ReactNode; transitionKey?: string; reduceMotion: boolean; onAnimationStart: (key: string) => void }) {
  const [progress] = useState(() => new Animated.Value(1));
  const playedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!transitionKey) return;
    if (playedKey.current === transitionKey) {
      if (reduceMotion) { progress.stopAnimation(); progress.setValue(1); }
      return;
    }
    playedKey.current = transitionKey;
    onAnimationStart(transitionKey);
    progress.stopAnimation();
    if (reduceMotion) { progress.setValue(1); return; }
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: tokens.motion.enter, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [onAnimationStart, progress, reduceMotion, transitionKey]);
  useEffect(() => {
    if (!reduceMotion) return;
    progress.stopAnimation();
    progress.setValue(1);
  }, [progress, reduceMotion]);
  useEffect(() => () => progress.stopAnimation(), [progress]);
  const translation = progress.interpolate({ inputRange: [0, 1], outputRange: [tokens.motion.distance, 0] });
  return <Animated.View style={{ opacity: progress, transform: [{ translateY: translation }] }}>{children}</Animated.View>;
}

function DeleteExitRow({ token, event, reduceMotion, onFinished }: { token: number; event: LogEvent; reduceMotion: boolean; onFinished: (token: number) => void }) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduceMotion) { onFinished(token); return; }
    const animation = Animated.timing(progress, { toValue: 1, duration: tokens.motion.release, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start(({ finished }) => { if (finished) onFinished(token); });
    return () => animation.stop();
  }, [onFinished, progress, reduceMotion, token]);
  const parts = localDateTimeParts(event.occurredAt);
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -tokens.motion.distance] }) }] }}>
    <ListRow variant="log-timeline" title={LOG_EVENT_LABELS[event.type]} accessibilityLabel={`${LOG_EVENT_LABELS[event.type]} ${parts.time}, raderad`} category={event.type} accidentKinds={event.accidentKinds} time={parts.time} detail={event.note || undefined} disabled />
  </Animated.View>;
}

function LogEventEditor({ event, disabled, onSave, onSaved, onCancel, onDelete, submitRef, onActionStateChange }: {
  event: LogEvent;
  disabled: boolean;
  onSave: (changes: LogEventChanges) => boolean | Promise<boolean>;
  onSaved: () => void;
  onCancel: () => void;
  onDelete: () => void;
  submitRef: MutableRefObject<(() => Promise<void>) | null>;
  onActionStateChange: (state: EditorActionState) => void;
}) {
  const initial = localDateTimeParts(event.occurredAt);
  const [type, setType] = useState(event.type);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [accidentKinds, setAccidentKinds] = useState<AccidentKind[]>(event.accidentKinds ?? []);
  const [preserveLegacyUnknownAccident, setPreserveLegacyUnknownAccident] = useState(
    event.type === 'accident' && event.accidentKinds === null,
  );
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [note, setNote] = useState(event.note ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const timestamp = parseLocalDateTime(date, time, new Date());
  const noteLength = Array.from(note).length;
  const legacyUnknownAccident = type === 'accident'
    && preserveLegacyUnknownAccident && accidentKinds.length === 0;
  const accidentKindsValid = type !== 'accident' || isCanonicalAccidentKinds(accidentKinds) || legacyUnknownAccident;
  const valid = Boolean(timestamp) && noteLength <= 500 && accidentKindsValid;

  function changeType(nextType: LogEventType) {
    if (nextType === type) return;
    setType(nextType);
    if (nextType === 'accident' && !preserveLegacyUnknownAccident && accidentKinds.length === 0) {
      setAccidentKinds(['pee']);
    }
  }

  const save = useCallback(async () => {
    if (saving || disabled) return;
    const occurredAt = parseLocalDateTime(date, time, new Date());
    if (!occurredAt) { setError('Ange ett giltigt datum och en tid som inte ligger i framtiden.'); return; }
    if (noteLength > 500) { setError('Anteckningen får innehålla högst 500 tecken.'); return; }
    if (!accidentKindsValid) { setError('Välj minst Kiss eller Bajs för att spara olyckan.'); return; }
    setError('');
    setSaving(true);
    try { if (await onSave({ type, occurredAt, note, accidentKinds: type === 'accident' ? legacyUnknownAccident ? null : accidentKinds : null })) onSaved(); }
    finally { setSaving(false); }
  }, [accidentKinds, accidentKindsValid, date, disabled, legacyUnknownAccident, note, noteLength, onSave, onSaved, saving, time, type]);
  useEffect(() => {
    submitRef.current = save;
    return () => { if (submitRef.current === save) submitRef.current = null; };
  }, [save, submitRef]);
  useEffect(() => {
    onActionStateChange({ canSave: valid && !disabled && !saving, saving });
  }, [disabled, onActionStateChange, saving, valid]);

  return <View style={styles.editor}>

    <Text style={styles.fieldTitle}>Typ</Text>
    <View style={styles.typePicker}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Händelsetyp: ${LOG_EVENT_LABELS[type]}`}
        accessibilityHint={typePickerOpen ? 'Dölj händelsetyper' : 'Visa händelsetyper'}
        accessibilityState={{ disabled, expanded: typePickerOpen }} aria-expanded={typePickerOpen}
        disabled={disabled} onPress={() => setTypePickerOpen((open) => !open)}
        style={({ pressed }) => [styles.typePickerTrigger, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <IconChip category={type} size="medium" variant="rev02-log" />
        </View>
        <Ionicons name="chevron-down" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden />
      </Pressable>
      {typePickerOpen ? <View style={styles.typePickerOptions}>
        {LOG_ENTRY_TYPES.map((option) => {
          const selected = type === option;
          return <Pressable key={option} accessibilityRole="radio" accessibilityLabel={LOG_EVENT_LABELS[option]} aria-checked={selected}
            accessibilityState={{ selected, disabled }} disabled={disabled}
            onPress={() => { changeType(option); setTypePickerOpen(false); }}
            style={({ pressed }) => [styles.typePickerOption, selected && styles.selectedTypeOption, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <IconChip category={option} size="medium" variant="rev02-log" />
            </View>
            <Text style={[styles.typeOptionText, selected && styles.selectedTypeText]}>{LOG_EVENT_LABELS[option]}</Text>
            {selected ? <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden /> : null}
          </Pressable>;
        })}
      </View> : null}
    </View>
    {type === 'accident' ? <View style={styles.accidentTypeGroup}>
      <Text accessibilityRole="header" accessibilityLabel="Vad hände?" style={styles.fieldTitle}>Vad hände?</Text>
      <Text style={styles.accidentHelp}>{legacyUnknownAccident
        ? 'Typen saknas på den äldre posten. Lämna den okänd eller välj bara det du vet.'
        : 'Välj Kiss, Bajs eller båda så räknas olyckan i dina mönster.'}</Text>
      <CheckboxCard label="Kiss" checked={accidentKinds.includes('pee')} disabled={disabled} onChange={(checked) => { setPreserveLegacyUnknownAccident(false); setAccidentKinds((current) => canonicalAccidentKinds(checked ? [...current, 'pee'] : current.filter((kind) => kind !== 'pee'))); }} />
      <CheckboxCard label="Bajs" checked={accidentKinds.includes('poop')} disabled={disabled} onChange={(checked) => { setPreserveLegacyUnknownAccident(false); setAccidentKinds((current) => canonicalAccidentKinds(checked ? [...current, 'poop'] : current.filter((kind) => kind !== 'poop'))); }} />
      {accidentKinds.length === 0 && !legacyUnknownAccident ? <Text accessibilityLiveRegion="polite" style={styles.accidentValidation}>Välj minst Kiss eller Bajs för att spara olyckan.</Text> : null}
    </View> : null}
    <View style={styles.dateTimeRow}>
      <View style={styles.dateField}><DatePickerField label="Datum" disabled={disabled} onChangeText={setDate} value={date} /></View>
      <View style={styles.timeField}><TimePickerField label="Tid" disabled={disabled} onChangeText={setTime} value={time} /></View>
    </View>
    <View style={styles.noteGroup}>
      <Text style={styles.fieldTitle}>Anteckning (valfri)</Text>
      <HorizontalGestureRegion><TextInput accessibilityLabel="Anteckning, högst 500 tecken" maxLength={1000} multiline editable={!disabled} onChangeText={setNote} placeholder="Lägg till en kort anteckning" placeholderTextColor={tokens.colors.textSecondary} style={styles.noteInput} value={note} /></HorizontalGestureRegion>
      <Text style={[styles.characterCount, noteLength > 500 && styles.tooManyCharacters]}>{noteLength}/500</Text>
    </View>
    {error ? <MessageCard tone="error">{error}</MessageCard> : null}
    {!valid && !error ? <MessageCard tone="error">Kontrollera datum, tid och anteckning.</MessageCard> : null}
    <View style={styles.editorSecondaryActions}>
      <View style={styles.editorSecondaryAction}><Button variant="destructive" label="Radera" accessibilityLabel="Radera händelse" disabled={disabled || saving} onPress={onDelete} /></View>
      <View style={styles.editorSecondaryAction}><Button variant="secondary" label="Avbryt" accessibilityLabel="Avbryt ändring" disabled={saving || disabled} onPress={onCancel} /></View>
    </View>
  </View>;
}

function formatInterval(minutes: number): string {
  if (minutes < 120) return `var ${Math.round(minutes)} minut`;
  if (minutes < 36 * 60) return `var ${Math.round(minutes / 60)} timme`;
  const halfDays = Math.max(1, Math.round(minutes / (12 * 60)));
  return `var ${(halfDays / 2).toLocaleString('sv-SE')} dygn`;
}

function shiftLocalDate(dateKey: string, amount: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const shifted = new Date(year, month - 1, day + amount, 12);
  return localDateTimeParts(shifted.toISOString()).date;
}

function formatSelectedDate(dateKey: string, today: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  const readableDate = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
  if (dateKey === today) return `Idag · ${readableDate}`;
  if (dateKey === shiftLocalDate(today, -1)) return `Igår · ${readableDate}`;
  const label = date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
  return `${label.charAt(0).toLocaleUpperCase('sv-SE')}${label.slice(1)}`;
}

const styles = StyleSheet.create({
  screen: { gap: tokens.spacing.xs }, pageTitle: { ...tokens.typography.title, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.xs },
  accidentTypeGroup: { gap: tokens.spacing.sm },
  accidentHelp: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  accidentValidation: { ...tokens.typography.caption, color: tokens.colors.danger },
  accidentActions: { flexDirection: 'row', gap: tokens.spacing.sm }, accidentAction: { flex: 1 },
  dateNavigator: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.xs, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface },
  dateButton: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full },
  datePressed: { backgroundColor: tokens.colors.selectedSurface },
  selectedDate: { ...tokens.typography.label, flex: 1, flexShrink: 1, color: tokens.colors.textPrimary, textAlign: 'center' },
  grid: { gap: tokens.spacing.sm }, gridRow: { flexDirection: 'row', gap: tokens.spacing.sm }, moreRow: { marginTop: tokens.spacing.sm }, moreIcon: { width: tokens.size.chipLg, minHeight: tokens.size.chipLg, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.selectedSurface },
  addEventButton: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.primary, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.primary }, addEventPressed: { backgroundColor: tokens.colors.primaryPressed, borderColor: tokens.colors.primaryPressed }, addEventDisabled: { opacity: 0.55 }, addEventLabel: { ...tokens.typography.label, color: tokens.colors.onPrimary }, addEventHelp: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  loadingOlder: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.sm }, loadingOlderText: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  patternText: { ...tokens.typography.body, color: tokens.colors.textPrimary, paddingVertical: tokens.spacing.xs },
  empty: { padding: tokens.spacing.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, gap: tokens.spacing.xs },
  emptyTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary }, emptyBody: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  refreshErrorState: { gap: tokens.spacing.xs },
  errorState: { minHeight: tokens.size.buttonHeight, justifyContent: 'center', gap: tokens.spacing.md }, errorText: { ...tokens.typography.body, color: tokens.colors.danger },
  editor: { gap: tokens.spacing.md },
  editorTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  fieldTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.xs },
  typePicker: { gap: tokens.spacing.xs, alignItems: 'flex-start' },
  typePickerTrigger: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.xs, borderRadius: tokens.radius.full, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  typePickerOptions: { alignSelf: 'stretch', gap: tokens.spacing.xs },
  typePickerOption: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.sm, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  selectedTypeOption: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface },
  typeOptionText: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 }, selectedTypeText: { color: tokens.colors.primary }, pressed: { opacity: 0.85 }, disabled: { opacity: 0.55 },
  dateTimeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }, dateField: { flex: 1, minWidth: 180 }, timeField: { flex: 1, minWidth: 112 },
  noteGroup: { gap: tokens.spacing.xs },
  noteInput: { minHeight: tokens.size.touchMin + tokens.spacing.xl + tokens.spacing.sm, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body, padding: tokens.spacing.md, textAlignVertical: 'top' },
  characterCount: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textAlign: 'right' }, tooManyCharacters: { color: tokens.colors.danger },
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
