import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AccessibilityInfo, Alert, Animated, Easing, LayoutAnimation, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppBar, BottomSheet, Button, Card, CheckboxCard, Dialog, FirstUseTip, ListRow, QuickLogTile, SectionHeader, Skeleton, Toast, useFirstUseTip } from '../../components/ui';
import { DatePickerField, MessageCard, TimePickerField } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';
import { localDate } from '../onboarding/dog';
import { decideQuickLogPress, formatLogEventDetails, groupLogEventsByLocalDate, hasRecentCategoryLog, localDateTimeParts, logAmountUnitForDraft, LOG_ENTRY_TYPES, LOG_EVENT_LABELS, normalizeLogEventDetails, parseLocalDateTime, summarizePottyPatterns, type LogAccidentKind, type LogAmountUnit, type LogEvent, type LogEventChanges, type LogEventType } from './log-model';
import { loadQuickLogLayout, saveQuickLogLayout } from './quick-log-layout-storage';
import { DEFAULT_QUICK_LOG_LAYOUT, moveQuickLogType, type QuickLogLayout, type QuickLogLayoutType } from './quick-log-layout';

export type LogUpdateSource = 'edit' | 'quick-add-details';
export type QuickLogMutationView = { kind: 'add' | 'update' | 'delete' | 'undo'; mutationId: string; id: string; type: LogEventType; occurredAt: string; status: 'pending' | 'failed' | 'unsure' | 'saved'; source?: LogUpdateSource; detailsHandled?: boolean };

type LogDetailType = Extract<LogEventType, 'accident' | 'food' | 'water'>;
type LogEditorDraft = { type: LogEventType; date: string; time: string; note: string; accidentKind: LogAccidentKind | null; amount: string; amountUnit: LogAmountUnit; foodType: string };
type QuickLogDetailSheetState = { id: string; type: LogDetailType; mutationKey: string };

export function LogScreen({ events, onAdd, onUpdate, onDelete, mode = 'preview', layoutOwnerId, busy = false, loading = false, loadError = false, onReload, mutation, loadMoreError = false, onRetry, onCancel, onUndo, onQuickDetailsSettled, hasMore = false, loadingMore = false, onLoadMore }: {
  events: readonly LogEvent[];
  onAdd: (type: LogEventType) => void;
  onUpdate?: (id: string, changes: LogEventChanges, source?: LogUpdateSource) => boolean | Promise<boolean>;
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
  onQuickDetailsSettled?: (id: string) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const [moreVisible, setMoreVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [duplicate, setDuplicate] = useState<{ type: LogEventType; timestamp: number } | null>(null);
  const lastSubmitAt = useRef<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dismissedDetailsMutationKey, setDismissedDetailsMutationKey] = useState<string | null>(null);
  const [undoDetailsSheet, setUndoDetailsSheet] = useState<QuickLogDetailSheetState | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, LogEditorDraft>>({});
  const [dismissedMutationKey, setDismissedMutationKey] = useState<string | null>(null);
  const [layout, setLayout] = useState<QuickLogLayout>(DEFAULT_QUICK_LOG_LAYOUT);
  const [layoutEditing, setLayoutEditing] = useState(false);
  const [layoutError, setLayoutError] = useState(false);
  const [deleteSnapshot, setDeleteSnapshot] = useState<{ token: number; event: LogEvent; phase: 'pending' | 'exiting' } | null>(null);
  const deleteToken = useRef(0);
  const [entryAnimationTarget, setEntryAnimationTarget] = useState<{ eventId: string; key: string } | null>(null);
  const [consumedEntryAnimationKey, setConsumedEntryAnimationKey] = useState<string | null>(null);
  const firstUseTip = useFirstUseTip(layoutOwnerId, 'log', mode === 'cloud' && !loading && !loadError);
  const handledEntryMutationKey = useRef(mutation?.kind === 'add' && mutation.status === 'saved'
    && (mutation.detailsHandled === true || !['accident', 'food', 'water'].includes(mutation.type)) ? `${mutation.kind}:${mutation.mutationId}` : '');
  const displayedEvents = useMemo(() => {
    if (!deleteSnapshot) return events;
    return [...events.filter((event) => event.id !== deleteSnapshot.event.id), deleteSnapshot.event];
  }, [deleteSnapshot, events]);
  const groups = useMemo(() => groupLogEventsByLocalDate(displayedEvents), [displayedEvents]);
  const patterns = useMemo(() => summarizePottyPatterns(events).filter((item) => item.count >= 2), [events]);
  const editingEvent = events.find((event) => event.id === editingId) ?? null;
  const detailSheet = useMemo(() => {
    const addKey = mutation?.kind === 'add' ? `${mutation.kind}:${mutation.mutationId}` : '';
    if (mutation?.kind === 'add' && mutation.status === 'saved' && mutation.detailsHandled !== true
      && (mutation.type === 'accident' || mutation.type === 'food' || mutation.type === 'water')
      && dismissedDetailsMutationKey !== addKey && events.some((event) => event.id === mutation.id)) {
      return { id: mutation.id, type: mutation.type, mutationKey: addKey };
    }
    if (mutation?.kind === 'update' && mutation.source === 'quick-add-details'
      && (mutation.type === 'accident' || mutation.type === 'food' || mutation.type === 'water')
      && events.some((event) => event.id === mutation.id)) {
      return { id: mutation.id, type: mutation.type, mutationKey: `add:${mutation.id}` };
    }
    if (undoDetailsSheet && mutation?.id === undoDetailsSheet.id && (
      mutation.kind === 'add' && mutation.status === 'saved'
      || mutation.kind === 'update' && mutation.source === 'quick-add-details'
      || mutation.kind === 'undo' && mutation.status !== 'saved'
    )) return undoDetailsSheet;
    return null;
  }, [dismissedDetailsMutationKey, events, mutation, undoDetailsSheet]);
  const foodTypeSuggestions = useMemo(() => {
    const dogId = detailSheet ? events.find((event) => event.id === detailSheet.id)?.dogId : editingEvent?.dogId;
    if (!dogId) return [];
    return Array.from(new Set(events.filter((event) => event.dogId === dogId && event.type === 'food' && event.foodType?.trim())
      .map((event) => event.foodType!.trim())));
  }, [detailSheet, editingEvent?.dogId, events]);
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
    firstUseTip.dismiss();
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
    onLongPress={() => { firstUseTip.dismiss(); startLayoutEdit(); }}
    onPress={(event) => { firstUseTip.dismiss(); selectType(type, event.nativeEvent.timestamp); }}
  />;
  const renderRows = (types: readonly QuickLogLayoutType[]) => Array.from({ length: Math.ceil(types.length / 2) }, (_, index) => (
    <View key={`${types[index * 2]}-${types[index * 2 + 1] ?? 'single'}`} style={styles.gridRow}>
      {types.slice(index * 2, index * 2 + 2).map(renderQuickTile)}
    </View>
  ));

  function clearEditDraft(id: string) {
    setEditDrafts((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function saveEdit(event: LogEvent, changes: LogEventChanges): Promise<boolean> {
    const saved = await onUpdate?.(event.id, changes, 'edit');
    if (saved) {
      clearEditDraft(event.id);
      setEditingId(null);
    }
    return Boolean(saved);
  }

  async function saveQuickDetails(changes: LogEventChanges): Promise<boolean> {
    if (!detailSheet) return false;
    return Boolean(await onUpdate?.(detailSheet.id, changes, 'quick-add-details'));
  }

  function closeQuickDetails() {
    if (detailSheet) {
      setDismissedDetailsMutationKey(detailSheet.mutationKey);
      onQuickDetailsSettled?.(detailSheet.id);
    }
    setUndoDetailsSheet(null);
    setDismissedMutationKey(null);
  }

  function skipQuickDetails() {
    if (mutation?.source === 'quick-add-details' && mutation.status === 'failed') onCancel?.();
    if (detailSheet) {
      setDismissedDetailsMutationKey(detailSheet.mutationKey);
      onQuickDetailsSettled?.(detailSheet.id);
    }
    setUndoDetailsSheet(null);
    setDismissedMutationKey(null);
  }

  async function retryMutation() {
    const saved = await onRetry?.();
    if (saved && mutation && mutation.kind === 'update' && mutation.source === 'edit') {
      clearEditDraft(mutation.id);
      setEditingId(null);
    }
  }

  async function retryQuickDetails(): Promise<boolean> {
    return Boolean(await onRetry?.());
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
  const successToast = <Toast visible={mutation?.status === 'saved' && (mutation.kind !== 'add' || mutation.detailsHandled !== false || dismissedDetailsMutationKey === `${mutation.kind}:${mutation.mutationId}`) && dismissedMutationKey !== successMutationKey} tone="success" confirmed message={mutation?.status === 'saved' ? mutation.kind === 'add' ? `${LOG_EVENT_LABELS[mutation.type]} loggat` : mutation.kind === 'update' ? 'Ändring sparad' : 'Händelsen är raderad' : ''}
    onUndo={mutation?.status === 'saved' && mutation.kind === 'add' ? () => { firstUseTip.dismiss(); onUndo?.(mutation.id); } : undefined} autoDismissMs={2500}
    onAutoDismiss={() => setDismissedMutationKey(successMutationKey)} />;
  return <View style={styles.screen}>
    <AppBar mode="Title" title="Logga" />
    {firstUseTip.visible ? <FirstUseTip text="Tryck på Fler för fler loggtyper." onDismiss={firstUseTip.dismiss} /> : null}
    <Toast visible={loadMoreError} tone="error" message="Äldre poster kunde inte hämtas" onRetry={onLoadMore ? () => { firstUseTip.dismiss(); return onLoadMore(); } : undefined} />
    <Toast visible={!editingEvent && !detailSheet && mutation?.source !== 'quick-add-details' && mutation?.status === 'failed'} tone="error" message={mutation?.kind === 'update' ? 'Kunde inte spara ändringen.' : 'Kunde inte spara'} onRetry={() => { firstUseTip.dismiss(); return retryMutation(); }} onCancel={() => { firstUseTip.dismiss(); onCancel?.(); if (mutation?.kind === 'update' && mutation.source === 'edit') { clearEditDraft(mutation.id); setEditingId(null); } }} />
    {!editingEvent && !detailSheet && mutation?.source !== 'quick-add-details' && mutation?.status === 'unsure' ? mutation.kind === 'update' ? <>
      <MessageCard tone="neutral">Vi kunde inte kontrollera om ändringen sparades.</MessageCard>
      <Button variant="secondary" label="Försök igen" accessibilityLabel="Försök igen" onPress={() => { firstUseTip.dismiss(); return retryMutation(); }} />
    </> : <Toast visible={mutation?.status === 'unsure'} tone="uncertain" onRetry={() => { firstUseTip.dismiss(); return retryMutation(); }} /> : null}
    {loading ? <>
      <SectionHeader title="Snabb logg" />
      <Skeleton shape="card" lines={3} />
      <Skeleton shape="row" lines={2} />
    </> : loadError ? <View style={styles.errorState}>
      <Text style={styles.errorText}>Loggen kunde inte hämtas.</Text>
      <Button label="Försök igen" accessibilityLabel="Försök igen" onPress={() => { firstUseTip.dismiss(); onReload?.(); }} />
    </View> : <>
      <SectionHeader title="Snabb logg" />
      <View style={styles.grid}>
        {layoutEditing ? <LayoutEditor layout={layout} onMove={moveLayoutType} onDone={() => setLayoutEditing(false)} error={layoutError} /> : renderRows(layout.primary)}
      </View>
      {successToast}
      {!layoutEditing && <View style={styles.moreRow}><QuickLogTile subtle label="Fler" accessibilityLabel={moreVisible ? 'Dölj fler loggtyper' : 'Visa fler loggtyper'} accessibilityHint="Håll inne för att ändra snabbvalens layout" icon={<View style={styles.moreIcon}><Ionicons name={moreVisible ? 'close-outline' : 'grid-outline'} size={tokens.size.iconMd} color={tokens.colors.textPrimary} /></View>} disabled={disabled} onLongPress={() => { firstUseTip.dismiss(); startLayoutEdit(); }} onPress={() => { firstUseTip.dismiss(); toggleMore(); }} /></View>}
      {!layoutEditing && moreVisible ? <View style={styles.grid} accessibilityLabel="Fler loggtyper">{renderRows(layout.more)}</View> : null}

      {detailSheet ? <BottomSheet visible title={LOG_EVENT_LABELS[detailSheet.type]} onRequestClose={() => {
        if (busy || mutation?.source === 'quick-add-details' && mutation.status !== 'saved' || mutation?.kind === 'undo' && mutation.status !== 'saved') return;
        closeQuickDetails();
      }}>
        <QuickLogDetailsForm key={detailSheet.id} type={detailSheet.type} suggestions={foodTypeSuggestions}
          mutation={mutation?.id === detailSheet.id && (mutation.source === 'quick-add-details' || mutation.kind === 'undo') ? mutation : null}
          busy={busy} onSave={saveQuickDetails} onSaved={closeQuickDetails} onSkip={skipQuickDetails} onRetry={() => { firstUseTip.dismiss(); return retryQuickDetails(); }}
          onUndo={() => { setUndoDetailsSheet(detailSheet); firstUseTip.dismiss(); onUndo?.(detailSheet.id); }} />
      </BottomSheet> : null}

      {editingEvent ? <BottomSheet visible title="Ändra händelse" onRequestClose={() => { if (!editLocked) { clearEditDraft(editingEvent.id); setEditingId(null); } }}>
        {mutation?.source !== 'quick-add-details' && mutation?.id === editingEvent.id && mutation.status === 'pending' ? <MessageCard tone="neutral">Sparar…</MessageCard> : null}
        {mutation?.source !== 'quick-add-details' && mutation?.id === editingEvent.id && mutation.status === 'failed' ? <Toast visible={mutation.status === 'failed'} tone="error" message="Kunde inte spara ändringen." onRetry={() => { firstUseTip.dismiss(); return retryMutation(); }} onCancel={() => { firstUseTip.dismiss(); onCancel?.(); clearEditDraft(editingEvent.id); setEditingId(null); }} /> : null}
        {mutation?.source !== 'quick-add-details' && mutation?.id === editingEvent.id && mutation.status === 'unsure' ? <>
          <MessageCard tone="neutral">Vi kunde inte kontrollera om ändringen sparades.</MessageCard>
          <Button variant="secondary" label="Försök igen" accessibilityLabel="Försök igen" onPress={() => { firstUseTip.dismiss(); return retryMutation(); }} />
          <Button variant="tertiary" label="Stäng och fortsätt senare" accessibilityLabel="Stäng och fortsätt senare" onPress={() => setEditingId(null)} />
        </> : null}
        <LogEventEditor key={editingEvent.id} event={editingEvent} disabled={editLocked} initialDraft={editDrafts[editingEvent.id]} suggestions={foodTypeSuggestions}
          onDraftChange={(draft) => setEditDrafts((current) => ({ ...current, [editingEvent.id]: draft }))}
          onCancel={() => { firstUseTip.dismiss(); clearEditDraft(editingEvent.id); setEditingId(null); }}
          onSave={(changes) => { firstUseTip.dismiss(); return saveEdit(editingEvent, changes); }} onDelete={() => { firstUseTip.dismiss(); askToDelete(editingEvent); }} />
      </BottomSheet> : null}

      <SectionHeader title="Dagens logg" />
      {!events.some((event) => localDateTimeParts(event.occurredAt).date === localDate()) && !(mutation?.kind === 'add' && mutation.status === 'pending') ? <View style={styles.empty}><Text style={styles.emptyTitle}>Inget loggat än idag</Text><Text style={styles.emptyBody}>Tryck på en ruta ovan för att lägga till dagens första händelse.</Text></View> : null}
      {mutation?.kind === 'add' && mutation.status === 'pending' && <ListRow title={LOG_EVENT_LABELS[mutation.type]} meta="Sparar…" time={localDateTimeParts(mutation.occurredAt).time} category={mutation.type} accessibilityLabel={`${LOG_EVENT_LABELS[mutation.type]} ${localDateTimeParts(mutation.occurredAt).time}, sparar`} />}
      {groups.map((group) => <View key={group.date} style={styles.logGroup}>
        {group.date !== localDate() ? <SectionHeader title={heading(group.date)} variant="date" /> : null}
        {group.events.map((event) => {
          const rowPending = mutation?.id === event.id && mutation.status === 'pending';
          const deleting = deleteSnapshot?.event.id === event.id;
          const detail = [formatLogEventDetails(event), event.note, rowPending ? 'Sparar…' : null, event.origin === 'example' ? 'Exempel' : mode === 'preview' ? 'Testpost' : null].filter(Boolean).join(' · ');
          const parts = localDateTimeParts(event.occurredAt);
          if (deleting && deleteSnapshot.phase === 'exiting') return <DeleteExitRow key={event.id} token={deleteSnapshot.token} event={event} reduceMotion={reduceMotion} onFinished={onDeleteAnimationEnd} />;
          const canResumeUncertainEdit = mutation?.kind === 'update' && mutation.source === 'edit' && mutation.id === event.id && mutation.status === 'unsure';
          const row = <ListRow title={LOG_EVENT_LABELS[event.type]} accessibilityLabel={`${LOG_EVENT_LABELS[event.type]} ${parts.time}${detail ? `, ${detail}` : ''}${deleting ? ', raderar' : rowPending ? ', sparar' : ''}${deleting ? '' : ', tryck för att ändra'}`} accessibilityState={deleting && deleteSnapshot.phase === 'pending' ? { busy: true, disabled: true } : undefined} category={event.type} time={parts.time} detail={deleting ? 'Raderar…' : detail || undefined} onPress={deleting ? undefined : () => { firstUseTip.dismiss(); setEditingId(event.id); }} disabled={deleting || busy || Boolean(mutation && mutation.status !== 'saved' && !canResumeUncertainEdit)} />;
          const entryTarget = entryAnimationTarget?.eventId === event.id ? entryAnimationTarget : null;
          if (entryTarget) return <LogEntryTransition key={event.id} transitionKey={consumedEntryAnimationKey === entryTarget.key ? undefined : entryTarget.key} reduceMotion={reduceMotion} onAnimationStart={consumeEntryAnimation}>{row}</LogEntryTransition>;
          return <View key={event.id}>{row}</View>;
        })}
      </View>)}
      {patterns.length > 0 ? <LatestPatternSummary key={`${events.find((event) => event.dogId)?.dogId ?? 'none'}:available`} patterns={patterns} onToggle={firstUseTip.dismiss} /> : null}

      {!loadMoreError && hasMore ? <Button label={loadingMore ? 'Hämtar…' : 'Visa äldre poster'} accessibilityLabel={loadingMore ? 'Hämtar äldre poster' : 'Visa äldre poster'} disabled={loadingMore} loading={loadingMore} onPress={() => { firstUseTip.dismiss(); onLoadMore?.(); }} /> : null}
    </>}

    <Dialog visible={duplicate !== null} title="Du har redan loggat det här. Lägga till ändå?" onRequestClose={() => setDuplicate(null)} onConfirm={() => { if (duplicate) selectType(duplicate.type, duplicate.timestamp, true); }} confirmLabel="Lägg till ändå" confirmVariant="primary"><View /></Dialog>
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

function LatestPatternSummary({ patterns, onToggle }: { patterns: ReturnType<typeof summarizePottyPatterns>; onToggle: () => void }) {
  const [visible, setVisible] = useState(false);
  return <View style={styles.patternSection}>
    <Button variant="secondary" label={visible ? 'Dölj dina senaste mönster' : 'Visa dina senaste mönster'} accessibilityLabel={visible ? 'Dölj dina senaste mönster' : 'Visa dina senaste mönster'} onPress={() => { onToggle(); setVisible((current) => !current); }} />
    {visible ? <Card accessibilityLabel="Dina senaste mönster för Kiss och Bajs">
      {patterns.map((item) => <Text key={item.type} style={styles.patternText}>{LOG_EVENT_LABELS[item.type]}: {item.count} gånger{item.medianIntervalMinutes === null ? '' : ` · ungefär ${formatInterval(item.medianIntervalMinutes)}`}</Text>)}
    </Card> : null}
  </View>;
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
    <ListRow title={LOG_EVENT_LABELS[event.type]} accessibilityLabel={`${LOG_EVENT_LABELS[event.type]} ${parts.time}, raderad`} category={event.type} time={parts.time} detail={event.note || undefined} disabled />
  </Animated.View>;
}

function LogEventEditor({ event, disabled, initialDraft, suggestions, onDraftChange, onCancel, onSave, onDelete }: {
  event: LogEvent;
  disabled: boolean;
  initialDraft?: LogEditorDraft;
  suggestions: readonly string[];
  onDraftChange: (draft: LogEditorDraft) => void;
  onCancel: () => void;
  onSave: (changes: LogEventChanges) => boolean | Promise<boolean>;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<LogEditorDraft>(() => initialDraft ?? createLogEditorDraft(event));
  const draftRef = useRef(draft);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const timestamp = parseLocalDateTime(draft.date, draft.time, new Date());
  const noteLength = Array.from(draft.note).length;
  const detailError = validateLogDetailDraft(draft);
  const valid = Boolean(timestamp) && noteLength <= 500 && !detailError;

  function updateDraft(patch: Partial<LogEditorDraft>) {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraft(next);
    onDraftChange(next);
  }

  async function save() {
    if (saving || disabled) return;
    const occurredAt = parseLocalDateTime(draft.date, draft.time, new Date());
    if (!occurredAt) { setError('Ange ett giltigt datum och en tid som inte ligger i framtiden.'); return; }
    if (noteLength > 500) { setError('Anteckningen får innehålla högst 500 tecken.'); return; }
    const detailError = validateLogDetailDraft(draft);
    if (detailError) return;
    setError('');
    setSaving(true);
    try { await onSave({ type: draft.type, occurredAt, note: draft.note, ...detailChangesFromDraft(draft) }); }
    finally { setSaving(false); }
  }

  return <View style={styles.editor}>
    <Text style={styles.fieldTitle}>Typ</Text>
    <View style={styles.typeGrid}>{LOG_ENTRY_TYPES.map((option) => {
      const selected = draft.type === option;
      return <Pressable key={option} accessibilityRole="radio" accessibilityLabel={LOG_EVENT_LABELS[option]} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => updateDraft({ type: option, accidentKind: null, amount: '', amountUnit: option === 'water' ? 'ml' : 'g', foodType: '' })} style={({ pressed }) => [styles.typeOption, selected && styles.selectedTypeOption, pressed && styles.pressed]}><Text style={[styles.typeOptionText, selected && styles.selectedTypeText]}>{LOG_EVENT_LABELS[option]}</Text></Pressable>;
    })}</View>
    <View style={styles.dateTimeRow}>
      <View style={styles.dateField}><DatePickerField label="Datum" disabled={disabled} onChangeText={(date) => updateDraft({ date })} value={draft.date} /></View>
      <View style={styles.timeField}><TimePickerField label="Tid" disabled={disabled} onChangeText={(time) => updateDraft({ time })} value={draft.time} /></View>
    </View>
    <View style={styles.noteGroup}>
      <Text style={styles.fieldTitle}>Anteckning (valfri)</Text>
      <TextInput accessibilityLabel="Anteckning, högst 500 tecken" maxLength={1000} multiline editable={!disabled} onChangeText={(note) => updateDraft({ note })} placeholder="Lägg till en kort anteckning" placeholderTextColor={tokens.colors.textSecondary} style={styles.noteInput} value={draft.note} />
      <Text style={[styles.characterCount, noteLength > 500 && styles.tooManyCharacters]}>{noteLength}/500</Text>
    </View>
    <LogEventDetailFields type={draft.type} accidentKind={draft.accidentKind} amount={draft.amount} amountUnit={draft.amountUnit} foodType={draft.foodType} suggestions={suggestions} disabled={disabled}
      onAccidentKindChange={(accidentKind) => updateDraft({ accidentKind })} onAmountChange={(amount) => updateDraft({ amount })}
      onAmountUnitChange={(amountUnit) => updateDraft({ amount: convertLogAmount(draft.amount, draft.amountUnit, amountUnit), amountUnit })}
      onFoodTypeChange={(foodType) => updateDraft({ foodType })} />
    {error ? <MessageCard tone="error">{error}</MessageCard> : null}
    {!error && !detailError && (!timestamp || noteLength > 500) ? <MessageCard tone="error">Kontrollera datum, tid och anteckning.</MessageCard> : null}
    <View style={styles.editorActions}>
      <View style={styles.editorSecondaryActions}>
        <View style={styles.editorSecondaryAction}><Button variant="destructive" label="Radera" accessibilityLabel="Radera händelse" disabled={disabled} onPress={onDelete} /></View>
        <View style={styles.editorSecondaryAction}><Button variant="secondary" label="Avbryt" accessibilityLabel="Avbryt ändring" disabled={saving || disabled} onPress={onCancel} /></View>
      </View>
      <Button label={saving ? 'Sparar…' : 'Spara'} accessibilityLabel={saving ? 'Sparar ändring' : 'Spara ändring'} loading={saving}
        disabled={!valid || saving || disabled} onPress={() => { void save(); }} />
    </View>
  </View>;
}

function QuickLogDetailsForm({ type, suggestions, mutation, busy, onSave, onSaved, onSkip, onRetry, onUndo }: {
  type: LogDetailType;
  suggestions: readonly string[];
  mutation: QuickLogMutationView | null;
  busy: boolean;
  onSave: (changes: LogEventChanges) => Promise<boolean>;
  onSaved: () => void;
  onSkip: () => void;
  onRetry: () => Promise<boolean>;
  onUndo: () => void;
}) {
  const [accidentKind, setAccidentKind] = useState<LogAccidentKind | null>(null);
  const [amount, setAmount] = useState('');
  const [amountUnit, setAmountUnit] = useState<LogAmountUnit>(type === 'water' ? 'ml' : 'g');
  const [foodType, setFoodType] = useState('');
  const [saving, setSaving] = useState(false);
  const [undoRequested, setUndoRequested] = useState(false);
  const undoRequestedRef = useRef(false);
  const pending = busy || saving || mutation?.status === 'pending';
  const failed = mutation?.source === 'quick-add-details' && mutation.status === 'failed';
  const unsure = mutation?.source === 'quick-add-details' && mutation.status === 'unsure';
  const undoFailed = mutation?.kind === 'undo' && mutation.status === 'failed';
  const undoUnsure = mutation?.kind === 'undo' && mutation.status === 'unsure';
  const locked = pending || failed || unsure || undoFailed || undoUnsure || undoRequested;
  const draft: LogEditorDraft = { type, date: '', time: '', note: '', accidentKind, amount, amountUnit, foodType };
  const validationError = validateLogDetailDraft(draft);
  const saveDisabled = pending || undoRequested || Boolean(validationError) || (type === 'accident' && accidentKind === null);

  async function save() {
    if (saveDisabled) return;
    setSaving(true);
    try {
      const saved = await onSave({ type, ...detailChangesFromDraft(draft) });
      if (saved && !undoRequestedRef.current) onSaved();
    }
    finally { setSaving(false); }
  }

  async function retry() {
    const saved = await onRetry();
    if (saved && !undoRequestedRef.current) onSaved();
  }

  return <View style={styles.detailForm}>
    <Toast visible={true} tone="success" confirmed message={`${LOG_EVENT_LABELS[type]} loggat`}
      onUndo={undoRequested ? undefined : () => { undoRequestedRef.current = true; setUndoRequested(true); onUndo(); }} />
    {pending ? <MessageCard tone="neutral">{undoRequested ? 'Ångrar…' : 'Sparar…'}</MessageCard> : null}
    {failed ? <>
      <MessageCard tone="error">Kunde inte spara detaljerna.</MessageCard>
      <View style={styles.detailActions}>
        <Button label="Försök igen" accessibilityLabel="Försök igen" onPress={() => { void retry(); }} />
        <Button variant="secondary" label="Hoppa över" accessibilityLabel="Hoppa över och kasta detaljerna" onPress={onSkip} />
      </View>
    </> : null}
    {unsure ? <>
      <MessageCard tone="neutral">Vi kunde inte kontrollera om detaljerna sparades.</MessageCard>
      <Button label="Försök igen" accessibilityLabel="Försök igen" onPress={() => { void retry(); }} />
    </> : null}
    {undoFailed ? <>
      <MessageCard tone="error">Kunde inte ångra loggningen.</MessageCard>
      <Button label="Försök igen" accessibilityLabel="Försök igen" onPress={() => { void retry(); }} />
    </> : null}
    {undoUnsure ? <>
      <MessageCard tone="neutral">Vi kunde inte kontrollera om loggningen togs bort.</MessageCard>
      <Button label="Försök igen" accessibilityLabel="Försök igen" onPress={() => { void retry(); }} />
    </> : null}
    {!locked ? <LogEventDetailFields type={type} accidentKind={accidentKind} amount={amount} amountUnit={amountUnit} foodType={foodType} suggestions={suggestions} disabled={locked}
      onAccidentKindChange={setAccidentKind} onAmountChange={setAmount} onAmountUnitChange={(nextUnit) => { setAmount(convertLogAmount(amount, amountUnit, nextUnit)); setAmountUnit(nextUnit); }} onFoodTypeChange={setFoodType} /> : null}
    {!failed && !unsure && !undoFailed && !undoUnsure ? <View style={styles.detailActions}>
      <Button label={saving || pending ? 'Sparar…' : 'Spara'} accessibilityLabel={saving || pending ? 'Sparar detaljer' : 'Spara detaljer'} loading={saving || pending}
        disabled={saveDisabled} onPress={() => { void save(); }} />
      <Button variant="secondary" label="Hoppa över" accessibilityLabel="Hoppa över detaljer" disabled={pending || undoRequested} onPress={onSkip} />
    </View> : null}
  </View>;
}

function LogEventDetailFields({ type, accidentKind, amount, amountUnit, foodType, suggestions, disabled, onAccidentKindChange, onAmountChange, onAmountUnitChange, onFoodTypeChange }: {
  type: LogEventType;
  accidentKind: LogAccidentKind | null;
  amount: string;
  amountUnit: LogAmountUnit;
  foodType: string;
  suggestions: readonly string[];
  disabled: boolean;
  onAccidentKindChange: (kind: LogAccidentKind | null) => void;
  onAmountChange: (amount: string) => void;
  onAmountUnitChange: (unit: LogAmountUnit) => void;
  onFoodTypeChange: (foodType: string) => void;
}) {
  const amountError = validateLogAmountField(type, amount, amountUnit);
  const foodTypeError = type === 'food' && Array.from(foodType.trim()).length > 60 ? 'Fodertypen får innehålla högst 60 tecken.' : null;
  if (type === 'accident') {
    const hasPee = accidentKind === 'pee' || accidentKind === 'both';
    const hasPoop = accidentKind === 'poop' || accidentKind === 'both';
    const change = (pee: boolean, poop: boolean) => onAccidentKindChange(pee && poop ? 'both' : pee ? 'pee' : poop ? 'poop' : null);
    return <View style={styles.detailFields}>
      <Text style={styles.fieldTitle}>Typ av olycka</Text>
      <CheckboxCard label="Kiss" checked={hasPee} disabled={disabled} onChange={(checked) => change(checked, hasPoop)} />
      <CheckboxCard label="Bajs" checked={hasPoop} disabled={disabled} onChange={(checked) => change(hasPee, checked)} />
    </View>;
  }
  if (type !== 'food' && type !== 'water') return null;
  return <View style={styles.detailFields}>
    <Text style={styles.fieldTitle}>Mängd (valfri)</Text>
    <TextInput accessibilityLabel="Mängd (valfri)" keyboardType="decimal-pad" editable={!disabled} value={amount} onChangeText={onAmountChange} placeholder="Ange mängd" placeholderTextColor={tokens.colors.textSecondary} style={styles.amountInput} />
    {amountError ? <Text style={styles.inlineError} accessibilityRole="alert">{amountError}</Text> : null}
    <Text style={styles.fieldTitle}>Enhet</Text>
    {type === 'food' ? <View style={styles.unitValue} accessibilityLabel="Enhet, gram"><Text style={styles.typeOptionText}>g</Text></View> : <View style={styles.unitChoices} accessibilityRole="radiogroup" accessibilityLabel="Enhet">
      {(['ml', 'dl'] as const).map((unit) => <Pressable key={unit} accessibilityRole="radio" accessibilityLabel={unit} accessibilityState={{ selected: amountUnit === unit, disabled }} disabled={disabled} onPress={() => onAmountUnitChange(unit)} style={({ pressed }) => [styles.unitChoice, amountUnit === unit && styles.selectedTypeOption, pressed && styles.pressed]}><Text style={[styles.typeOptionText, amountUnit === unit && styles.selectedTypeText]}>{unit}</Text></Pressable>)}
    </View>}
    {type === 'food' ? <>
      <Text style={styles.fieldTitle}>Fodertyp (valfri)</Text>
      <TextInput accessibilityLabel="Fodertyp (valfri)" editable={!disabled} value={foodType} onChangeText={onFoodTypeChange} maxLength={120} placeholder="Skriv fodertyp" placeholderTextColor={tokens.colors.textSecondary} style={styles.amountInput} />
      {foodTypeError ? <Text style={styles.inlineError} accessibilityRole="alert">{foodTypeError}</Text> : null}
      {suggestions.length > 0 ? <View style={styles.suggestions}>
        <Text style={styles.fieldTitle}>Dina tidigare fodertyper</Text>
        {suggestions.map((suggestion) => <Pressable key={suggestion} accessibilityRole="button" accessibilityLabel={`Välj fodertyp ${suggestion}`} disabled={disabled} onPress={() => onFoodTypeChange(suggestion)} style={({ pressed }) => [styles.suggestion, pressed && !disabled && styles.pressed]}><Text style={styles.typeOptionText}>{suggestion}</Text></Pressable>)}
      </View> : null}
    </> : null}
  </View>;
}

function createLogEditorDraft(event: LogEvent): LogEditorDraft {
  const parts = localDateTimeParts(event.occurredAt);
  return { type: event.type, date: parts.date, time: parts.time, note: event.note ?? '', accidentKind: event.accidentKind ?? null,
    amount: event.amount == null ? '' : String(event.amount).replace('.', ','), amountUnit: logAmountUnitForDraft(event.type, event.amountUnit), foodType: event.foodType ?? '' };
}

function detailChangesFromDraft(draft: LogEditorDraft): Pick<LogEventChanges, 'accidentKind' | 'amount' | 'amountUnit' | 'foodType'> {
  const amount = draft.amount.trim() ? Number(draft.amount.trim().replace(',', '.')) : null;
  return {
    accidentKind: draft.type === 'accident' ? draft.accidentKind : null,
    amount,
    amountUnit: amount === null ? null : draft.type === 'food' ? 'g' : draft.amountUnit,
    foodType: draft.type === 'food' ? draft.foodType.trim() || null : null,
  };
}

function validateLogDetailDraft(draft: LogEditorDraft): string | null {
  const amountError = validateLogAmountField(draft.type, draft.amount, draft.amountUnit);
  if (amountError) return amountError;
  if (draft.type === 'food' && Array.from(draft.foodType.trim()).length > 60) return 'Fodertypen får innehålla högst 60 tecken.';
  try { normalizeLogEventDetails(draft.type, detailChangesFromDraft(draft)); }
  catch { return 'Kontrollera mängd och enhet.'; }
  return null;
}

function validateLogAmountField(type: LogEventType, amountText: string, unit: LogAmountUnit): string | null {
  const trimmed = amountText.trim();
  if (!trimmed) return null;
  if (!/^\d+(?:[.,]\d+)?$/.test(trimmed)) return 'Ange ett tal större än 0.';
  const amount = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return 'Ange ett tal större än 0.';
  if (type === 'food' && amount > 2000) return 'Du kan ange högst 2 000 g per loggpost.';
  if (type === 'water' && unit === 'ml' && amount > 10_000) return 'Du kan ange högst 10 000 ml per loggpost.';
  if (type === 'water' && unit === 'dl' && amount > 100) return 'Du kan ange högst 100 dl per loggpost.';
  return null;
}

function convertLogAmount(value: string, from: LogAmountUnit, to: LogAmountUnit): string {
  if (!value.trim() || from === to) return value;
  const amount = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(amount)) return value;
  return String(from === 'ml' && to === 'dl' ? amount / 100 : from === 'dl' && to === 'ml' ? amount * 100 : amount).replace('.', ',');
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
  patternSection: { alignSelf: 'stretch', marginTop: tokens.layout.sectionGap, gap: tokens.layout.headingGap },
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
  detailForm: { gap: tokens.spacing.sm }, detailFields: { gap: tokens.spacing.xs }, detailActions: { gap: tokens.spacing.xs },
  inlineError: { ...tokens.typography.caption, color: tokens.colors.danger },
  amountInput: { minHeight: tokens.size.touchMin, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body, paddingHorizontal: tokens.spacing.md },
  unitValue: { minHeight: tokens.size.touchMin, justifyContent: 'center', paddingHorizontal: tokens.spacing.md },
  unitChoices: { flexDirection: 'row', gap: tokens.spacing.xs }, unitChoice: { flex: 1, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  suggestions: { gap: tokens.spacing.xs }, suggestion: { minHeight: tokens.size.touchMin, justifyContent: 'center', paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
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
