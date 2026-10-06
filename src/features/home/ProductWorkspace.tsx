import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Animated, AppState, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import * as ExpoCrypto from 'expo-crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppScreen, MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import {
  deleteDogEvent,
  deleteHealthWeight,
  deleteHealthHistory,
  deletePlannedHealth,
  deleteTrainingProgress,
  fetchDogEventById,
  fetchDogEvents,
  fetchHealthWeightById,
  fetchHealthWeights,
  fetchHealthHistory,
  fetchHealthHistoryById,
  fetchPlannedHealth,
  fetchFuturePlannedHealthReminders,
  fetchPlannedHealthById,
  fetchHomeContent,
  fetchTrainingWorkspace,
  isValidHealthWeightDate,
  isValidHealthWeightKg,
  isValidHealthHistoryDate,
  isValidPlannedHealthDate,
  normalizeHealthHistoryDescription,
  normalizePlannedHealthDescription,
  insertDogEvent,
  insertHealthWeight,
  insertHealthHistory,
  insertPlannedHealth,
  insertTrainingProgress,
  updateDogEvent,
  updateHealthWeight,
  updateHealthHistory,
  updatePlannedHealth,
  type DogEventOperation,
  type DogEventRecord,
  type HealthWeightChanges,
  type HealthWeightOperation,
  type HealthWeightRecord,
  type HealthHistoryChanges,
  type HealthHistoryOperation,
  type HealthHistoryRecord,
  type HealthHistoryType,
  type PlannedHealthChanges,
  type PlannedHealthOperation,
  type PlannedHealthRecord,
  type PlannedHealthType,
  type PublishedTrainingProgram,
  type PausedTrainingProgress,
  type WriteOutcome,
} from '../../data/workspace-data';
import {
  fetchOwnedDogById,
  updateOwnedDog,
  type BreedOption,
  type DogProfileWriteOutcome,
  type HomeContent,
  type OwnedDog,
  type OwnedDogProfileChanges,
} from '../../data/app-data';
import { ageInWeeks, localDate } from '../onboarding/dog';
import { HealthScreen } from '../health/HealthScreen';
import { PlannedHealthScreen } from '../health/PlannedHealthScreen';
import { EditDogProfileScreen } from '../onboarding/EditDogProfileScreen';
import { KnowledgeScreen } from '../knowledge/KnowledgeScreen';
import { getGuidePreviewText } from '../knowledge/guide-body';
import { LogScreen } from '../puppy-log/LogScreen';
import { type LogEvent, type LogEventChanges, type LogEventType } from '../puppy-log/log-model';
import { PassportScreen } from '../passport/PassportScreen';
import { PublishedTrainingScreen } from '../training/PublishedTrainingScreen';
import { theme } from '../../theme/tokens';
import { useAuth } from '../account/AuthProvider';
import { NotificationSettingsScreen } from '../notifications/NotificationSettingsScreen';
import { futureFireTimeForPlan, type NotificationPreferences } from '../../notifications/notification-model';
import { reminderService, type ReminderContext, type ReminderReconcileResult } from '../../notifications/notification-service';

type ProductPage = 'home' | 'log' | 'training' | 'more' | 'health' | 'planned-health' | 'knowledge' | 'passport' | 'profile' | 'notification-settings';
type PendingLogMutation =
  | { kind: 'insert'; operation: DogEventOperation }
  | { kind: 'update'; id: string; changes: { event_type: LogEventType; occurred_at: string; duration_minutes: number | null; description: string | null } }
  | { kind: 'delete'; id: string };
type PendingHealthMutation =
  | { kind: 'insert'; operation: HealthWeightOperation }
  | { kind: 'update'; id: string; previous: HealthWeightRecord; changes: HealthWeightChanges }
  | { kind: 'delete'; id: string; previous: HealthWeightRecord };
type PendingHealthHistoryMutation =
  | { kind: 'insert'; operation: HealthHistoryOperation; lifetime: string }
  | { kind: 'update'; id: string; eventType: HealthHistoryType; previous: HealthHistoryRecord; changes: HealthHistoryChanges; lifetime: string }
  | { kind: 'delete'; id: string; eventType: HealthHistoryType; previous: HealthHistoryRecord; lifetime: string };
type PendingPlannedHealthMutation =
  | { kind: 'insert'; operation: PlannedHealthOperation; lifetime: string }
  | { kind: 'update'; id: string; previous: PlannedHealthRecord; changes: PlannedHealthChanges; localToday: string; lifetime: string }
  | { kind: 'delete'; id: string; previous: PlannedHealthRecord; lifetime: string };
type PendingProfileMutation = { previous: OwnedDog; changes: OwnedDogProfileChanges; knownBreeds: readonly BreedOption[]; lifetime: string };

const PAGE_SIZE = 40;

export function ProductWorkspace({ client, dog, onDogUpdated }: { client: SupabaseClient; dog: OwnedDog; onDogUpdated?: (updated: OwnedDog) => void }) {
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const [page, setPage] = useState<ProductPage>('home');
  const [reduceMotion, setReduceMotion] = useState(true);
  const [pageOpacity] = useState(() => new Animated.Value(1));
  const [content, setContent] = useState<HomeContent[]>([]);
  const [contentState, setContentState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [contentSelectionKey, setContentSelectionKey] = useState<string | null>(null);
  const [knowledgeFocus, setKnowledgeFocus] = useState<{ selectionKey: string; contentId: string | null; returnPage: 'home' | 'more' } | null>(null);
  const [events, setEvents] = useState<DogEventRecord[]>([]);
  const eventRows = useRef<DogEventRecord[]>([]);
  const [logState, setLogState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [logBusy, setLogBusy] = useState(false);
  const [logMessage, setLogMessage] = useState('');
  const [logMessageError, setLogMessageError] = useState(false);
  const [healthWeights, setHealthWeights] = useState<HealthWeightRecord[]>([]);
  const healthWeightRows = useRef<HealthWeightRecord[]>([]);
  const [healthState, setHealthState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [healthBusy, setHealthBusy] = useState(false);
  const [healthPending, setHealthPending] = useState(false);
  const [healthMessage, setHealthMessage] = useState('');
  const [healthMessageError, setHealthMessageError] = useState(false);
  const [healthHistory, setHealthHistory] = useState<HealthHistoryRecord[]>([]);
  const healthHistoryRows = useRef<HealthHistoryRecord[]>([]);
  const [healthHistoryState, setHealthHistoryState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [healthHistoryBusy, setHealthHistoryBusy] = useState(false);
  const [healthHistoryPending, setHealthHistoryPending] = useState(false);
  const [healthHistoryMessage, setHealthHistoryMessage] = useState('');
  const [healthHistoryMessageError, setHealthHistoryMessageError] = useState(false);
  const [healthHistoryConflict, setHealthHistoryConflict] = useState<{ lifetime: string; mutationId: string; current: HealthHistoryRecord | null } | null>(null);
  const [plannedHealth, setPlannedHealth] = useState<PlannedHealthRecord[]>([]);
  const plannedHealthRows = useRef<PlannedHealthRecord[]>([]);
  const [plannedHealthState, setPlannedHealthState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [plannedHealthBusy, setPlannedHealthBusy] = useState(false);
  const [plannedHealthPending, setPlannedHealthPending] = useState(false);
  const [plannedHealthMessage, setPlannedHealthMessage] = useState('');
  const [plannedHealthMessageError, setPlannedHealthMessageError] = useState(false);
  const [plannedHealthConflict, setPlannedHealthConflict] = useState<{ lifetime: string; mutationId: string; current: PlannedHealthRecord | null } | null>(null);
  const notificationContextRef = useRef<ReminderContext | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({ version: 1, enabled: false, trainingEnabled: false, trainingMinutes: 540 });
  const [notificationPreferencesReady, setNotificationPreferencesReady] = useState(false);
  const [notificationStorageError, setNotificationStorageError] = useState(false);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationSaved, setNotificationSaved] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationMessageError, setNotificationMessageError] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [reminderResult, setReminderResult] = useState<ReminderReconcileResult | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profilePending, setProfilePending] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileMessageError, setProfileMessageError] = useState(false);
  const [profileConflict, setProfileConflict] = useState<OwnedDog | null>(null);
  const [training, setTraining] = useState<{ programs: PublishedTrainingProgram[]; paused: PausedTrainingProgress[] }>({ programs: [], paused: [] });
  const [trainingState, setTrainingState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [trainingSelectionKey, setTrainingSelectionKey] = useState<string | null>(null);
  const [trainingError, setTrainingError] = useState('');
  const [busyStepKey, setBusyStepKey] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const signOutInFlight = useRef(false);
  const pendingLogMutation = useRef<PendingLogMutation | null>(null);
  const logMutationInFlight = useRef(false);
  const pendingHealthMutation = useRef<PendingHealthMutation | null>(null);
  const healthMutationInFlight = useRef(false);
  const pendingHealthHistoryMutation = useRef<PendingHealthHistoryMutation | null>(null);
  const healthHistoryMutationInFlight = useRef(false);
  const healthHistoryFlightToken = useRef<object | null>(null);
  const pendingPlannedHealthMutation = useRef<PendingPlannedHealthMutation | null>(null);
  const plannedHealthMutationInFlight = useRef(false);
  const plannedHealthFlightToken = useRef<object | null>(null);
  const pendingProfileMutation = useRef<PendingProfileMutation | null>(null);
  const profileMutationInFlight = useRef(false);
  const trainingMutationInFlight = useRef(false);
  const mounted = useRef(false);
  const eventReadQueue = useRef<Promise<void>>(Promise.resolve());
  const healthReadQueue = useRef<Promise<void>>(Promise.resolve());
  const healthHistoryReadQueue = useRef<Promise<void>>(Promise.resolve());
  const plannedHealthReadQueue = useRef<Promise<void>>(Promise.resolve());
  const loadMoreInFlight = useRef(false);
  const { signOut, session } = useAuth();
  const age = ageInWeeks(dog.birth_date, localDate());
  const currentHealthHistoryLifetime = `${dog.id}:${session?.user.id ?? ''}`;
  const healthHistoryLifetime = useRef('');
  const previousHealthHistoryLifetime = useRef('');
  const currentPlannedHealthLifetime = currentHealthHistoryLifetime;
  const plannedHealthLifetime = useRef('');
  const previousPlannedHealthLifetime = useRef('');

  useLayoutEffect(() => {
    healthHistoryLifetime.current = currentHealthHistoryLifetime;
  }, [currentHealthHistoryLifetime]);
  useLayoutEffect(() => {
    plannedHealthLifetime.current = currentPlannedHealthLifetime;
  }, [currentPlannedHealthLifetime]);
  const currentProfileLifetime = currentHealthHistoryLifetime;
  const profileLifetime = useRef('');
  const previousProfileLifetime = useRef('');
  const contentGeneration = useRef(0);
  const trainingGeneration = useRef(0);
  const currentSelectionKey = `${dog.id}:${dog.breed_id}:${age}`;
  const currentSelectionKeyRef = useRef(currentSelectionKey);

  useLayoutEffect(() => {
    currentSelectionKeyRef.current = currentSelectionKey;
  }, [currentSelectionKey]);

  useLayoutEffect(() => {
    profileLifetime.current = currentProfileLifetime;
  }, [currentProfileLifetime]);
  const isPassportLifetimeCurrent = useCallback((lifetime: string) => (
    mounted.current && profileLifetime.current === lifetime
  ), []);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    pageOpacity.stopAnimation();
    if (reduceMotion) {
      pageOpacity.setValue(1);
      return;
    }
    pageOpacity.setValue(0);
    Animated.timing(pageOpacity, { toValue: 1, duration: 140, useNativeDriver: true }).start();
    return () => pageOpacity.stopAnimation();
  }, [page, pageOpacity, reduceMotion]);

  const serializeEventRead = useCallback(<T,>(read: () => Promise<T>): Promise<T> => {
    const request = eventReadQueue.current.catch(() => undefined).then(read);
    eventReadQueue.current = request.then(() => undefined, () => undefined);
    return request;
  }, []);

  const reloadEvents = useCallback(async (signal?: AbortSignal) => {
    const rows = await serializeEventRead(() => fetchDogEvents(client, dog.id, 0, PAGE_SIZE, undefined, signal));
    if (!mounted.current || signal?.aborted) return;
    eventRows.current = rows;
    setEvents(rows);
    setHasMore(rows.length === PAGE_SIZE);
    setLogState('ready');
  }, [client, dog.id, serializeEventRead]);

  const serializeHealthRead = useCallback(<T,>(read: () => Promise<T>): Promise<T> => {
    const request = healthReadQueue.current.catch(() => undefined).then(read);
    healthReadQueue.current = request.then(() => undefined, () => undefined);
    return request;
  }, []);

  const reloadHealthWeights = useCallback(async (signal?: AbortSignal) => {
    const rows = await serializeHealthRead(() => fetchHealthWeights(client, dog.id, undefined, signal));
    if (!mounted.current || signal?.aborted) return;
    healthWeightRows.current = rows;
    setHealthWeights(rows);
    setHealthState('ready');
  }, [client, dog.id, serializeHealthRead]);

  const serializeHealthHistoryRead = useCallback(<T,>(read: () => Promise<T>): Promise<T> => {
    const request = healthHistoryReadQueue.current.catch(() => undefined).then(read);
    healthHistoryReadQueue.current = request.then(() => undefined, () => undefined);
    return request;
  }, []);

  const reloadHealthHistory = useCallback(async (lifetime = healthHistoryLifetime.current, signal?: AbortSignal) => {
    const rows = await serializeHealthHistoryRead(() => fetchHealthHistory(client, dog.id, undefined, signal));
    if (!mounted.current || signal?.aborted || healthHistoryLifetime.current !== lifetime) return;
    healthHistoryRows.current = rows;
    setHealthHistory(rows);
    setHealthHistoryState('ready');
  }, [client, dog.id, serializeHealthHistoryRead]);

  const serializePlannedHealthRead = useCallback(<T,>(read: () => Promise<T>): Promise<T> => {
    const request = plannedHealthReadQueue.current.catch(() => undefined).then(read);
    plannedHealthReadQueue.current = request.then(() => undefined, () => undefined);
    return request;
  }, []);

  const reloadPlannedHealth = useCallback(async (lifetime = plannedHealthLifetime.current, signal?: AbortSignal) => {
    const rows = await serializePlannedHealthRead(() => fetchPlannedHealth(client, dog.id, undefined, signal));
    if (!mounted.current || signal?.aborted || plannedHealthLifetime.current !== lifetime) return;
    plannedHealthRows.current = rows;
    setPlannedHealth(rows);
    setPlannedHealthState('ready');
  }, [client, dog.id, serializePlannedHealthRead]);
  const refreshLocalReminders = useCallback(async () => {
    const context = notificationContextRef.current;
    if (!context || !notificationPreferencesReady || !reminderService.isCurrent(context)) return;
    const pendingMutation = pendingPlannedHealthMutation.current;
    if (plannedHealthBusy && !pendingMutation) return;
    if (notificationPreferences.enabled && plannedHealthState !== 'ready') return;
    const blockedPlanIds = new Set<string>();
    if (pendingMutation) blockedPlanIds.add(pendingMutation.kind === 'insert' ? pendingMutation.operation.id : pendingMutation.id);
    const now = new Date();
    let plans: PlannedHealthRecord[] = [];
    let overCap = false;
    try {
      if (notificationPreferences.enabled) {
        const selection = await fetchFuturePlannedHealthReminders(client, dog.id, localDate(), (record) => {
          if (blockedPlanIds.has(record.id)) return false;
          return futureFireTimeForPlan(record, now).status === 'scheduled';
        }, () => mounted.current && reminderService.isCurrent(context));
        if (!selection || !mounted.current || !reminderService.isCurrent(context)) return;
        plans = selection.records;
        overCap = selection.overCap;
      }
      const result = await reminderService.reconcile({ ...context, preferences: notificationPreferences, plans, now, overCap, blockedPlanIds });
      if (!mounted.current || !reminderService.isCurrent(context)) return;
      setReminderResult(result);
      if (result.status === 'permission-denied') setNotificationPermission('denied');
      else if (result.status === 'scheduled' || result.status === 'over-cap' || result.status === 'off') setNotificationPermission('granted');
      if (result.status === 'failed') {
        setNotificationMessage('Enhetens påminnelser kunde inte uppdateras. Kontrollera inställningarna och försök igen.');
        setNotificationMessageError(true);
      } else if (result.status === 'unknown') {
        setNotificationMessage('En plan har osäker sparstatus. Den schemaläggs inte förrän du har kontrollerat ändringen.');
        setNotificationMessageError(true);
      } else {
        setNotificationMessage('');
        setNotificationMessageError(false);
      }
    } catch {
      if (!mounted.current || !reminderService.isCurrent(context)) return;
      setReminderResult({ status: 'failed', scheduledCount: 0, overCap: false, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'local' });
      setNotificationMessage('Påminnelserna kunde inte stämmas av. Försök igen när anslutningen fungerar.');
      setNotificationMessageError(true);
    }
  }, [client, dog.id, notificationPreferences, notificationPreferencesReady, plannedHealthBusy, plannedHealthState]);

  const reloadTraining = useCallback(async (signal?: AbortSignal) => {
    const generation = trainingGeneration.current;
    const result = await fetchTrainingWorkspace(client, dog, age, undefined, signal);
    if (!mounted.current || signal?.aborted || trainingGeneration.current !== generation || currentSelectionKeyRef.current !== currentSelectionKey) return false;
    setTraining(result);
    setTrainingSelectionKey(currentSelectionKey);
    setTrainingState('ready');
    return true;
  }, [age, client, currentSelectionKey, dog]);

  useEffect(() => {
    const ownerId = session?.user.id;
    const context = ownerId ? reminderService.setActiveContext(ownerId, dog.id) : null;
    notificationContextRef.current = context;
    if (!ownerId || !context) return;
    let active = true;
    void reminderService.loadPreferences(ownerId).then((preferences) => {
      if (!active || !reminderService.isCurrent(context)) return;
      setNotificationPreferences(preferences);
      setNotificationPreferencesReady(true);
      setNotificationSaved(false);
    }).catch(() => {
      if (!active || !reminderService.isCurrent(context)) return;
      setNotificationPreferences({ version: 1, enabled: false, trainingEnabled: false, trainingMinutes: 540 });
      setNotificationPreferencesReady(true);
      setNotificationStorageError(true);
    });
    return () => {
      active = false;
      notificationContextRef.current = null;
      reminderService.setActiveContext(null, null);
      void reminderService.cleanupOwner(ownerId);
    };
  }, [dog.id, session?.user.id]);

  useEffect(() => { void refreshLocalReminders(); }, [refreshLocalReminders, plannedHealth, plannedHealthPending, plannedHealthState]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshLocalReminders();
    });
    return () => subscription.remove();
  }, [refreshLocalReminders]);

  useEffect(() => {
    mounted.current = true;
    if (previousProfileLifetime.current !== currentProfileLifetime) {
      previousProfileLifetime.current = currentProfileLifetime;
      pendingProfileMutation.current = null;
      profileMutationInFlight.current = false;
      setProfilePending(false);
      setProfileMessage('');
      setProfileMessageError(false);
      setProfileConflict(null);
    }
    const currentHistoryLifetime = currentHealthHistoryLifetime;
    if (previousHealthHistoryLifetime.current !== currentHistoryLifetime) {
      previousHealthHistoryLifetime.current = currentHistoryLifetime;
      pendingHealthHistoryMutation.current = null;
      healthHistoryMutationInFlight.current = false;
      healthHistoryFlightToken.current = null;
      healthHistoryRows.current = [];
      setHealthHistory([]);
      setHealthHistoryState('loading');
      setHealthHistoryPending(false);
      setHealthHistoryConflict(null);
      setHealthHistoryMessage('');
      setHealthHistoryMessageError(false);
    }
    if (previousPlannedHealthLifetime.current !== currentPlannedHealthLifetime) {
      previousPlannedHealthLifetime.current = currentPlannedHealthLifetime;
      pendingPlannedHealthMutation.current = null;
      plannedHealthMutationInFlight.current = false;
      plannedHealthFlightToken.current = null;
      plannedHealthRows.current = [];
      setPlannedHealth([]);
      setPlannedHealthState('loading');
      setPlannedHealthPending(false);
      setPlannedHealthConflict(null);
      setPlannedHealthMessage('');
      setPlannedHealthMessageError(false);
    }
    const controller = new AbortController();
    void serializeEventRead(() => fetchDogEvents(client, dog.id, 0, PAGE_SIZE, undefined, controller.signal)).then((rows) => {
      if (controller.signal.aborted || !mounted.current) return;
      eventRows.current = rows;
      setEvents(rows);
      setHasMore(rows.length === PAGE_SIZE);
      setLogState('ready');
    }).catch(() => {
      if (!controller.signal.aborted && mounted.current) setLogState('error');
    });
    void serializeHealthRead(() => fetchHealthWeights(client, dog.id, undefined, controller.signal)).then((rows) => {
      if (controller.signal.aborted || !mounted.current) return;
      healthWeightRows.current = rows;
      setHealthWeights(rows);
      setHealthState('ready');
    }).catch(() => {
      if (!controller.signal.aborted && mounted.current) setHealthState('error');
    });
    const historyLifetime = healthHistoryLifetime.current;
    void serializeHealthHistoryRead(() => fetchHealthHistory(client, dog.id, undefined, controller.signal)).then((rows) => {
      if (controller.signal.aborted || !mounted.current || healthHistoryLifetime.current !== historyLifetime) return;
      healthHistoryRows.current = rows;
      setHealthHistory(rows);
      setHealthHistoryState('ready');
    }).catch(() => {
      if (!controller.signal.aborted && mounted.current && healthHistoryLifetime.current === historyLifetime) setHealthHistoryState('error');
    });
    const planLifetime = plannedHealthLifetime.current;
    void serializePlannedHealthRead(() => fetchPlannedHealth(client, dog.id, undefined, controller.signal)).then((rows) => {
      if (controller.signal.aborted || !mounted.current || plannedHealthLifetime.current !== planLifetime) return;
      plannedHealthRows.current = rows;
      setPlannedHealth(rows);
      setPlannedHealthState('ready');
    }).catch(() => {
      if (!controller.signal.aborted && mounted.current && plannedHealthLifetime.current === planLifetime) setPlannedHealthState('error');
    });
    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [client, currentHealthHistoryLifetime, currentPlannedHealthLifetime, currentProfileLifetime, dog.id, serializeEventRead, serializeHealthRead, serializeHealthHistoryRead, serializePlannedHealthRead]);

  useEffect(() => {
    const generation = ++contentGeneration.current;
    const controller = new AbortController();
    void fetchHomeContent(client, dog, age, undefined, controller.signal).then((items) => {
      if (!mounted.current || controller.signal.aborted || contentGeneration.current !== generation || currentSelectionKeyRef.current !== currentSelectionKey) return;
      setContent(items);
      setContentSelectionKey(currentSelectionKey);
      setContentState('ready');
    }).catch(() => {
      if (!mounted.current || controller.signal.aborted || contentGeneration.current !== generation || currentSelectionKeyRef.current !== currentSelectionKey) return;
      setContent([]);
      setContentSelectionKey(currentSelectionKey);
      setContentState('error');
    });

    const trainingRevision = ++trainingGeneration.current;
    void fetchTrainingWorkspace(client, dog, age, undefined, controller.signal).then((result) => {
      if (!mounted.current || controller.signal.aborted || trainingGeneration.current !== trainingRevision || currentSelectionKeyRef.current !== currentSelectionKey) return;
      setTraining(result);
      setTrainingSelectionKey(currentSelectionKey);
      setTrainingError('');
      setTrainingState('ready');
    }).catch(() => {
      if (!mounted.current || controller.signal.aborted || trainingGeneration.current !== trainingRevision || currentSelectionKeyRef.current !== currentSelectionKey) return;
      setTraining({ programs: [], paused: [] });
      setTrainingSelectionKey(currentSelectionKey);
      setTrainingError('Publicerat träningsinnehåll kunde inte hämtas. Inga exempelprogram visas.');
      setTrainingState('error');
    });
    return () => controller.abort();
  }, [age, client, currentSelectionKey, dog]);

  const visibleContent = contentSelectionKey === currentSelectionKey ? content : [];
  const visibleContentState = contentSelectionKey === currentSelectionKey ? contentState : 'loading';
  const visibleTrainingState = trainingSelectionKey === currentSelectionKey ? trainingState : 'loading';
  const visibleGuideContent = visibleContent.filter((item) => item.contentType !== 'training_program');
  const focusedKnowledgeContentId = knowledgeFocus?.selectionKey === currentSelectionKey
    && visibleGuideContent.some((item) => item.id === knowledgeFocus.contentId)
    ? knowledgeFocus.contentId : null;

  const displayEvents = useMemo(() => events.map(toLogEvent), [events]);
  const latestEvent = events[0];
  const nextProgram = training.programs.find((program) => program.steps.some((step) => !program.completedStepIds.includes(step.id)));
  const nextStep = nextProgram?.steps.find((step) => !nextProgram.completedStepIds.includes(step.id));

  async function markProfileSaved(value: OwnedDog, lifetime: string): Promise<boolean> {
    if (!mounted.current || profileLifetime.current !== lifetime || value.id !== dog.id) return false;
    pendingProfileMutation.current = null;
    setProfilePending(false);
    setProfileConflict(null);
    setProfileMessage('Hundprofilen är sparad.');
    setProfileMessageError(false);
    onDogUpdated?.(value);
    return true;
  }

  async function runProfileMutation(mutation: PendingProfileMutation, retry = false): Promise<boolean> {
    const isCurrent = () => mounted.current && profileLifetime.current === mutation.lifetime;
    if (!isCurrent() || profileMutationInFlight.current) return false;
    if (pendingProfileMutation.current && !retry) {
      setProfileMessage('Kontrollera föregående profiländring innan du gör en ny.');
      setProfileMessageError(true);
      return false;
    }
    profileMutationInFlight.current = true;
    setProfileBusy(true);
    setProfileMessage('');
    setProfileMessageError(false);
    setProfileConflict(null);
    try {
      const outcome: DogProfileWriteOutcome = await updateOwnedDog(
        client, mutation.previous.id, mutation.previous, mutation.changes, mutation.knownBreeds,
      );
      if (!isCurrent()) return false;
      if (outcome.status === 'saved') return await markProfileSaved(outcome.value, mutation.lifetime);
      if (outcome.status === 'unknown') {
        pendingProfileMutation.current = mutation;
        setProfilePending(true);
        setProfileMessage('Sparstatus är osäker. Kontrollera samma profiländring innan du gör något nytt.');
        setProfileMessageError(true);
        return false;
      }
      pendingProfileMutation.current = null;
      setProfilePending(false);
      setProfileMessage('Profilen kunde inte sparas. Kontrollera uppgifterna och anslutningen och försök igen.');
      setProfileMessageError(true);
      return false;
    } catch {
      if (!isCurrent()) return false;
      pendingProfileMutation.current = mutation;
      setProfilePending(true);
      setProfileMessage('Sparstatus är osäker. Kontrollera samma profiländring innan du gör något nytt.');
      setProfileMessageError(true);
      return false;
    } finally {
      profileMutationInFlight.current = false;
      if (isCurrent()) setProfileBusy(false);
    }
  }

  function saveDogProfile(changes: OwnedDogProfileChanges, knownBreeds: readonly BreedOption[]): Promise<boolean> {
    if (profileMutationInFlight.current || pendingProfileMutation.current || !onDogUpdated) return Promise.resolve(false);
    const mutation: PendingProfileMutation = {
      previous: dog,
      changes: { ...changes, name: changes.name.trim() },
      knownBreeds: [...knownBreeds],
      lifetime: profileLifetime.current,
    };
    return runProfileMutation(mutation);
  }

  async function retryProfileStatus() {
    if (profileMutationInFlight.current) return;
    const mutation = pendingProfileMutation.current;
    if (!mutation) return;
    const isCurrent = () => mounted.current && profileLifetime.current === mutation.lifetime;
    if (!isCurrent()) return;
    profileMutationInFlight.current = true;
    setProfileBusy(true);
    setProfileMessage('Kontrollerar sparstatus…');
    setProfileMessageError(false);
    setProfileConflict(null);
    let retrySameIntent = false;
    try {
      const current = await fetchOwnedDogById(client, mutation.previous.id);
      if (!isCurrent()) return;
      if (!current) {
        setProfileMessage('Hundprofilen kunde inte hittas. Den väntande ändringen är kvar; försök kontrollera igen.');
        setProfileMessageError(true);
      } else if (sameOwnedDogProfile(current, mutation.changes, mutation.previous.id)) {
        await markProfileSaved(current, mutation.lifetime);
      } else if (sameOwnedDogProfile(current, mutation.previous, mutation.previous.id)) {
        retrySameIntent = true;
      } else {
        setProfileConflict(current);
        setProfileMessage('Profilen har ändrats sedan försöket. Granska den aktuella versionen.');
        setProfileMessageError(true);
      }
      if (!isCurrent()) return;
    } catch {
      if (isCurrent()) {
        setProfileMessage('Sparstatus kunde inte kontrolleras. Försök igen när anslutningen fungerar.');
        setProfileMessageError(true);
      }
    } finally {
      profileMutationInFlight.current = false;
      if (isCurrent()) setProfileBusy(false);
    }
    if (!isCurrent()) return;
    if (retrySameIntent) await runProfileMutation(mutation, true);
  }

  async function acceptCurrentProfile() {
    const mutation = pendingProfileMutation.current;
    if (!mutation || profileMutationInFlight.current || !profileConflict) return;
    const isCurrent = () => mounted.current && profileLifetime.current === mutation.lifetime;
    if (!isCurrent()) return;
    profileMutationInFlight.current = true;
    setProfileBusy(true);
    setProfileMessage('Kontrollerar aktuell profil…');
    setProfileMessageError(false);
    try {
      const current = await fetchOwnedDogById(client, mutation.previous.id);
      if (!isCurrent()) return;
      if (!current) {
        setProfileMessage('Hundprofilen kunde inte hittas. Den väntande ändringen är kvar.');
        setProfileMessageError(true);
        return;
      }
      await markProfileSaved(current, mutation.lifetime);
    } catch {
      if (isCurrent()) {
        setProfileMessage('Den aktuella profilen kunde inte hämtas. Den väntande ändringen är kvar.');
        setProfileMessageError(true);
      }
    } finally {
      profileMutationInFlight.current = false;
      if (isCurrent()) setProfileBusy(false);
    }
  }

  async function loadMoreEvents() {
    if (loadMoreInFlight.current || loadingMore || !hasMore) return;
    loadMoreInFlight.current = true;
    setLoadingMore(true);
    try {
      const next = await serializeEventRead(() => fetchDogEvents(client, dog.id, eventRows.current.length, PAGE_SIZE));
      if (!mounted.current) return;
      const merged = [...eventRows.current, ...next.filter((row) => !eventRows.current.some((existing) => existing.id === row.id))];
      eventRows.current = merged;
      setEvents(merged);
      setHasMore(next.length === PAGE_SIZE);
    } catch {
      if (!mounted.current) return;
      setLogMessage('Äldre poster kunde inte hämtas. Försök igen när anslutningen fungerar.');
      setLogMessageError(true);
    } finally {
      loadMoreInFlight.current = false;
      if (mounted.current) setLoadingMore(false);
    }
  }

  async function runLogMutation(mutation: PendingLogMutation) {
    if (logMutationInFlight.current) return false;
    logMutationInFlight.current = true;
    setLogBusy(true);
    setLogMessage('');
    setLogMessageError(false);
    let outcome: WriteOutcome<DogEventRecord | null>;
    try {
      if (mutation.kind === 'insert') outcome = await insertDogEvent(client, mutation.operation);
      else if (mutation.kind === 'update') outcome = await updateDogEvent(client, dog.id, mutation.id, mutation.changes);
      else outcome = await deleteDogEvent(client, dog.id, mutation.id);
      if (!mounted.current) return false;
      if (outcome.status === 'saved') {
        pendingLogMutation.current = null;
        setLogMessage('Ändringen är sparad.');
        try {
          await reloadEvents();
        } catch {
          if (mounted.current) {
            setLogMessage('Ändringen är sparad, men logghistoriken kunde inte uppdateras.');
            setLogMessageError(true);
          }
        }
        return true;
      }
      if (outcome.status === 'unknown') {
        pendingLogMutation.current = mutation;
        setLogMessage('Sparstatus är osäker. Kontrollera samma post innan du försöker igen.');
        setLogMessageError(true);
        return false;
      }
      pendingLogMutation.current = null;
      setLogMessage('Ändringen kunde inte sparas. Kontrollera anslutningen och försök igen.');
      setLogMessageError(true);
      return false;
    } catch {
      if (!mounted.current) return false;
      pendingLogMutation.current = mutation;
      setLogMessage('Sparstatus är osäker. Kontrollera samma post innan du försöker igen.');
      setLogMessageError(true);
      return false;
    } finally {
      logMutationInFlight.current = false;
      if (mounted.current) setLogBusy(false);
    }
  }

  function addEvent(type: LogEventType) {
    if (pendingLogMutation.current || logMutationInFlight.current) return;
    const operation: DogEventOperation = {
      id: ExpoCrypto.randomUUID(),
      dog_id: dog.id,
      event_type: type,
      occurred_at: new Date().toISOString(),
      duration_minutes: null,
      description: null,
    };
    const mutation: PendingLogMutation = { kind: 'insert', operation };
    pendingLogMutation.current = mutation;
    void runLogMutation(mutation);
  }

  async function updateEvent(id: string, changes: LogEventChanges): Promise<boolean> {
    if (pendingLogMutation.current || logMutationInFlight.current) return false;
    const previous = events.find((event) => event.id === id);
    if (!previous) return false;
    const eventType = changes.type ?? previous.event_type;
    const mutation: PendingLogMutation = {
      kind: 'update',
      id,
      changes: {
        event_type: eventType,
        occurred_at: changes.occurredAt ?? previous.occurred_at,
        duration_minutes: eventType === 'sleep' || eventType === 'walk' ? previous.duration_minutes : null,
        description: changes.note?.trim() || null,
      },
    };
    pendingLogMutation.current = mutation;
    return runLogMutation(mutation);
  }

  async function deleteEvent(id: string) {
    if (pendingLogMutation.current || logMutationInFlight.current) return;
    const mutation: PendingLogMutation = { kind: 'delete', id };
    pendingLogMutation.current = mutation;
    await runLogMutation(mutation);
  }

  async function retryLogMutation() {
    const mutation = pendingLogMutation.current;
    if (mutation?.kind === 'insert') {
      setLogBusy(true);
      try {
        const found = await fetchDogEventById(client, dog.id, mutation.operation.id);
        if (!mounted.current) return;
        if (found) {
          pendingLogMutation.current = null;
          try {
            await reloadEvents();
            setLogMessage('Posten är sparad och återläst.');
            setLogMessageError(false);
          } catch {
            setLogMessage('Posten är sparad, men logghistoriken kunde inte uppdateras.');
            setLogMessageError(true);
          }
          return;
        }
        await runLogMutation(mutation);
      } catch {
        if (!mounted.current) return;
        setLogMessage('Sparstatus kunde inte kontrolleras. Samma post väntar på en ny kontroll.');
        setLogMessageError(true);
      } finally {
        if (mounted.current) setLogBusy(false);
      }
    } else if (mutation) await runLogMutation(mutation);
    else {
      try {
        await reloadEvents();
        if (!mounted.current) return;
        setLogMessage('Loggen är uppdaterad.');
        setLogMessageError(false);
      } catch {
        if (!mounted.current) return;
        setLogMessage('Loggen kunde inte kontrolleras. Försök igen.');
        setLogMessageError(true);
      }
    }
  }

  async function markHealthMutationSaved(mutation: PendingHealthMutation, value: HealthWeightRecord | null): Promise<void> {
    pendingHealthMutation.current = null;
    setHealthPending(false);
    const mutationId = mutation.kind === 'insert' ? mutation.operation.id : mutation.id;
    const previous = healthWeightRows.current;
    const next = mutation.kind === 'delete'
      ? previous.filter((row) => row.id !== mutationId)
      : value
        ? [value, ...previous.filter((row) => row.id !== mutationId)]
          .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on) || b.id.localeCompare(a.id))
        : previous;
    healthWeightRows.current = next;
    setHealthWeights(next);
    setHealthMessage('Ändringen är sparad.');
    setHealthMessageError(false);
    try {
      await reloadHealthWeights();
    } catch {
      if (mounted.current) setHealthMessage('Ändringen är sparad, men vikthistoriken kunde inte uppdateras.');
    }
  }

  async function runHealthMutation(mutation: PendingHealthMutation, retry = false): Promise<boolean> {
    if (healthMutationInFlight.current) return false;
    if (pendingHealthMutation.current && !retry) {
      setHealthMessage('Kontrollera den föregående ändringens status innan du gör en ny.');
      setHealthMessageError(true);
      return false;
    }
    healthMutationInFlight.current = true;
    setHealthBusy(true);
    setHealthMessage('');
    setHealthMessageError(false);
    let outcome: WriteOutcome<HealthWeightRecord | null>;
    try {
      if (mutation.kind === 'insert') outcome = await insertHealthWeight(client, mutation.operation);
      else if (mutation.kind === 'update') outcome = await updateHealthWeight(client, dog.id, mutation.id, mutation.changes);
      else outcome = await deleteHealthWeight(client, dog.id, mutation.id);
      if (!mounted.current) return false;
      if (outcome.status === 'saved') {
        await markHealthMutationSaved(mutation, outcome.value);
        return true;
      }
      if (outcome.status === 'unknown') {
        pendingHealthMutation.current = mutation;
        setHealthPending(true);
        setHealthMessage('Sparstatus är osäker. Kontrollera samma ändring innan du försöker igen.');
        setHealthMessageError(true);
        return false;
      }
      pendingHealthMutation.current = null;
      setHealthPending(false);
      setHealthMessage('Ändringen kunde inte sparas. Kontrollera anslutningen och försök igen.');
      setHealthMessageError(true);
      return false;
    } catch {
      if (!mounted.current) return false;
      pendingHealthMutation.current = mutation;
      setHealthPending(true);
      setHealthMessage('Sparstatus är osäker. Kontrollera samma ändring innan du försöker igen.');
      setHealthMessageError(true);
      return false;
    } finally {
      healthMutationInFlight.current = false;
      if (mounted.current) setHealthBusy(false);
    }
  }

  async function saveHealthWeight(id: string | null, occurredOn: string, weightKg: number): Promise<boolean> {
    if (healthMutationInFlight.current || pendingHealthMutation.current || healthState !== 'ready') return false;
    if (!isValidHealthWeightDate(occurredOn) || !isValidHealthWeightKg(weightKg)) return false;
    let mutation: PendingHealthMutation;
    if (id === null) {
      mutation = { kind: 'insert', operation: { id: ExpoCrypto.randomUUID(), dog_id: dog.id, occurred_on: occurredOn, weight_kg: weightKg } };
    } else {
      const previous = healthWeightRows.current.find((row) => row.id === id);
      if (!previous) return false;
      mutation = { kind: 'update', id, previous, changes: { occurred_on: occurredOn, weight_kg: weightKg } };
    }
    return runHealthMutation(mutation);
  }

  async function removeHealthWeight(id: string): Promise<boolean> {
    if (healthMutationInFlight.current || pendingHealthMutation.current || healthState !== 'ready') return false;
    const previous = healthWeightRows.current.find((row) => row.id === id);
    if (!previous) return false;
    const mutation: PendingHealthMutation = { kind: 'delete', id, previous };
    return runHealthMutation(mutation);
  }

  async function retryHealthMutation() {
    if (healthMutationInFlight.current) return;
    const mutation = pendingHealthMutation.current;
    if (mutation) {
      healthMutationInFlight.current = true;
      setHealthBusy(true);
      setHealthMessage('Kontrollerar sparstatus…');
      setHealthMessageError(false);
      let retrySameOperation = false;
      try {
        const id = mutation.kind === 'insert' ? mutation.operation.id : mutation.id;
        const current = await fetchHealthWeightById(client, dog.id, id);
        if (!mounted.current) return;
        if (mutation.kind === 'insert') {
          if (current && sameHealthWeight(current, mutation.operation)) await markHealthMutationSaved(mutation, current);
          else if (!current) retrySameOperation = true;
          else setHealthMessage('Postens status är fortfarande osäker. Ingen ny post har skapats.');
        } else if (mutation.kind === 'update') {
          if (current && sameHealthWeight(current, { id: mutation.id, dog_id: dog.id, ...mutation.changes })) {
            await markHealthMutationSaved(mutation, current);
          } else if (current && sameHealthWeight(current, mutation.previous)) retrySameOperation = true;
          else setHealthMessage('Posten har ändrats sedan försöket. Kontrollera historiken innan du gör en ny rättning.');
        } else if (!current) await markHealthMutationSaved(mutation, null);
        else if (sameHealthWeight(current, mutation.previous)) retrySameOperation = true;
        else setHealthMessage('Posten har ändrats sedan försöket. Kontrollera historiken innan du försöker igen.');
        if (!retrySameOperation && pendingHealthMutation.current) setHealthMessageError(true);
      } catch {
        if (mounted.current) {
          setHealthMessage('Sparstatus kunde inte kontrolleras. Försök kontrollera igen när anslutningen fungerar.');
          setHealthMessageError(true);
        }
      } finally {
        healthMutationInFlight.current = false;
        if (mounted.current) setHealthBusy(false);
      }
      if (retrySameOperation && mounted.current) await runHealthMutation(mutation, true);
      return;
    }
    setHealthState('loading');
    setHealthMessage('');
    setHealthMessageError(false);
    try {
      await reloadHealthWeights();
    } catch {
      if (!mounted.current) return;
      setHealthState('error');
      setHealthMessage('Vikthistoriken kunde inte hämtas.');
      setHealthMessageError(true);
    }
  }

  async function markHealthHistorySaved(mutation: PendingHealthHistoryMutation, value: HealthHistoryRecord | null): Promise<void> {
    const lifetime = mutation.lifetime;
    if (!mounted.current || healthHistoryLifetime.current !== lifetime) return;
    pendingHealthHistoryMutation.current = null;
    setHealthHistoryPending(false);
    setHealthHistoryConflict(null);
    const mutationId = mutation.kind === 'insert' ? mutation.operation.id : mutation.id;
    const next = mutation.kind === 'delete'
      ? healthHistoryRows.current.filter((row) => row.id !== mutationId)
      : value
        ? [value, ...healthHistoryRows.current.filter((row) => row.id !== mutationId)]
          .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on) || b.id.localeCompare(a.id))
        : healthHistoryRows.current;
    healthHistoryRows.current = next;
    setHealthHistory(next);
    setHealthHistoryMessage('Ändringen är sparad.');
    setHealthHistoryMessageError(false);
    try {
      await reloadHealthHistory(lifetime);
      if (!mounted.current || healthHistoryLifetime.current !== lifetime) return;
    } catch {
      if (mounted.current && healthHistoryLifetime.current === lifetime) {
        setHealthHistoryMessage('Ändringen är sparad, men historiken kunde inte uppdateras.');
      }
    }
  }

  async function runHealthHistoryMutation(mutation: PendingHealthHistoryMutation, retry = false): Promise<boolean> {
    const isCurrent = () => mounted.current && healthHistoryLifetime.current === mutation.lifetime;
    if (!isCurrent() || healthHistoryMutationInFlight.current) return false;
    if (pendingHealthHistoryMutation.current && !retry) {
      setHealthHistoryMessage('Kontrollera föregående ändring innan du gör en ny.');
      setHealthHistoryMessageError(true);
      return false;
    }
    healthHistoryMutationInFlight.current = true;
    const flightToken = {};
    healthHistoryFlightToken.current = flightToken;
    setHealthHistoryBusy(true);
    setHealthHistoryMessage('');
    setHealthHistoryMessageError(false);
    setHealthHistoryConflict(null);
    try {
      let outcome: WriteOutcome<HealthHistoryRecord | null>;
      if (mutation.kind === 'insert') outcome = await insertHealthHistory(client, mutation.operation);
      else if (mutation.kind === 'update') outcome = await updateHealthHistory(client, dog.id, mutation.eventType, mutation.id, mutation.previous, mutation.changes);
      else outcome = await deleteHealthHistory(client, dog.id, mutation.eventType, mutation.id, mutation.previous);
      if (!isCurrent()) return false;
      if (outcome.status === 'saved') {
        await markHealthHistorySaved(mutation, outcome.value);
        if (!isCurrent()) return false;
        return true;
      }
      if (outcome.status === 'unknown') {
        pendingHealthHistoryMutation.current = mutation;
        setHealthHistoryPending(true);
        setHealthHistoryMessage('Sparstatus är osäker. Kontrollera samma ändring innan du försöker igen.');
        setHealthHistoryMessageError(true);
        return false;
      }
      pendingHealthHistoryMutation.current = null;
      setHealthHistoryPending(false);
      setHealthHistoryMessage('Ändringen kunde inte sparas. Kontrollera anslutningen och försök igen.');
      setHealthHistoryMessageError(true);
      return false;
    } catch {
      if (!isCurrent()) return false;
      pendingHealthHistoryMutation.current = mutation;
      setHealthHistoryPending(true);
      setHealthHistoryMessage('Sparstatus är osäker. Kontrollera samma ändring innan du försöker igen.');
      setHealthHistoryMessageError(true);
      return false;
    } finally {
      if (healthHistoryFlightToken.current === flightToken) {
        healthHistoryFlightToken.current = null;
        healthHistoryMutationInFlight.current = false;
        if (isCurrent()) setHealthHistoryBusy(false);
      }
    }
  }

  function saveHealthHistory(id: string | null, eventType: HealthHistoryType, occurredOn: string, note: string): Promise<boolean> {
    const lifetime = healthHistoryLifetime.current;
    if (healthHistoryMutationInFlight.current || pendingHealthHistoryMutation.current || healthHistoryState !== 'ready') return Promise.resolve(false);
    if (!isValidHealthHistoryDate(occurredOn)) return Promise.resolve(false);
    const description = normalizeHealthHistoryDescription(note);
    if (description === undefined || (eventType !== 'vaccination' && eventType !== 'vet_visit')) return Promise.resolve(false);
    if (id === null) {
      const operation: HealthHistoryOperation = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, event_type: eventType, occurred_on: occurredOn, description };
      return runHealthHistoryMutation({ kind: 'insert', operation, lifetime });
    }
    const previous = healthHistoryRows.current.find((row) => row.id === id && row.event_type === eventType);
    if (!previous) return Promise.resolve(false);
    return runHealthHistoryMutation({ kind: 'update', id, eventType, previous, changes: { occurred_on: occurredOn, description }, lifetime });
  }

  function removeHealthHistory(id: string): Promise<boolean> {
    const lifetime = healthHistoryLifetime.current;
    if (healthHistoryMutationInFlight.current || pendingHealthHistoryMutation.current || healthHistoryState !== 'ready') return Promise.resolve(false);
    const previous = healthHistoryRows.current.find((row) => row.id === id);
    if (!previous) return Promise.resolve(false);
    return runHealthHistoryMutation({ kind: 'delete', id, eventType: previous.event_type, previous, lifetime });
  }

  function resolveHealthHistoryConflict() {
    const conflict = healthHistoryConflict;
    const pending = pendingHealthHistoryMutation.current;
    if (!conflict || !pending || conflict.lifetime !== healthHistoryLifetime.current || conflict.lifetime !== pending.lifetime) return;
    const rows = healthHistoryRows.current.filter((row) => row.id !== conflict.mutationId);
    const next = conflict.current ? [conflict.current, ...rows]
      .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on) || b.id.localeCompare(a.id)) : rows;
    healthHistoryRows.current = next;
    setHealthHistory(next);
    pendingHealthHistoryMutation.current = null;
    setHealthHistoryPending(false);
    setHealthHistoryConflict(null);
    setHealthHistoryMessage('Visad aktuell historik används. Du kan nu börja om.');
    setHealthHistoryMessageError(false);
  }

  async function retryHealthHistory() {
    if (healthHistoryMutationInFlight.current) return;
    const mutation = pendingHealthHistoryMutation.current;
    if (mutation) {
      const isCurrent = () => mounted.current && healthHistoryLifetime.current === mutation.lifetime;
      if (!isCurrent()) return;
      healthHistoryMutationInFlight.current = true;
      const flightToken = {};
      healthHistoryFlightToken.current = flightToken;
      setHealthHistoryBusy(true);
      setHealthHistoryMessage('Kontrollerar sparstatus…');
      setHealthHistoryMessageError(false);
      let retrySameOperation = false;
      try {
        const id = mutation.kind === 'insert' ? mutation.operation.id : mutation.id;
        const current = await fetchHealthHistoryById(client, dog.id, mutation.kind === 'insert' ? mutation.operation.event_type : mutation.eventType, id);
        if (!isCurrent()) return;
        if (mutation.kind === 'insert') {
          if (current && sameHealthHistory(current, mutation.operation)) await markHealthHistorySaved(mutation, current);
          else if (!current) retrySameOperation = true;
          else {
            setHealthHistoryConflict({ lifetime: mutation.lifetime, mutationId: id, current });
            setHealthHistoryMessage('En annan post finns med samma id. Granska den innan du fortsätter.');
          }
        } else if (mutation.kind === 'update') {
          if (current && sameHealthHistory(current, { id: mutation.id, dog_id: dog.id, event_type: mutation.eventType, ...mutation.changes })) {
            await markHealthHistorySaved(mutation, current);
          } else if (current && sameHealthHistory(current, mutation.previous)) retrySameOperation = true;
          else {
            setHealthHistoryConflict({ lifetime: mutation.lifetime, mutationId: id, current });
            setHealthHistoryMessage(current ? 'Posten har ändrats sedan försöket. Granska den aktuella versionen.' : 'Posten finns inte längre. Bekräfta att du vill släppa den väntande rättningen.');
          }
        } else if (!current) await markHealthHistorySaved(mutation, null);
        else if (sameHealthHistory(current, mutation.previous)) retrySameOperation = true;
        else {
          setHealthHistoryConflict({ lifetime: mutation.lifetime, mutationId: id, current });
          setHealthHistoryMessage('Posten har ändrats sedan försöket. Granska den aktuella versionen.');
        }
        if (!isCurrent()) return;
        if (!retrySameOperation && pendingHealthHistoryMutation.current) setHealthHistoryMessageError(true);
      } catch {
        if (isCurrent()) {
          setHealthHistoryMessage('Sparstatus kunde inte kontrolleras. Försök igen när anslutningen fungerar.');
          setHealthHistoryMessageError(true);
        }
      } finally {
        if (healthHistoryFlightToken.current === flightToken) {
          healthHistoryFlightToken.current = null;
          healthHistoryMutationInFlight.current = false;
          if (isCurrent()) setHealthHistoryBusy(false);
        }
      }
      if (!isCurrent()) return;
      if (retrySameOperation) await runHealthHistoryMutation(mutation, true);
      return;
    }
    const lifetime = healthHistoryLifetime.current;
    setHealthHistoryState('loading');
    setHealthHistoryMessage('');
    setHealthHistoryMessageError(false);
    try {
      await reloadHealthHistory(lifetime);
    } catch {
      if (mounted.current && healthHistoryLifetime.current === lifetime) {
        setHealthHistoryState('error');
        setHealthHistoryMessage('Historiken kunde inte hämtas.');
        setHealthHistoryMessageError(true);
      }
    }
  }

  async function markPlannedHealthSaved(mutation: PendingPlannedHealthMutation, value: PlannedHealthRecord | null): Promise<void> {
    const lifetime = mutation.lifetime;
    if (!mounted.current || plannedHealthLifetime.current !== lifetime) return;
    pendingPlannedHealthMutation.current = null;
    setPlannedHealthPending(false);
    setPlannedHealthConflict(null);
    const mutationId = mutation.kind === 'insert' ? mutation.operation.id : mutation.id;
    const next = mutation.kind === 'delete'
      ? plannedHealthRows.current.filter((row) => row.id !== mutationId)
      : value
        ? [value, ...plannedHealthRows.current.filter((row) => row.id !== mutationId)]
          .sort((a, b) => a.due_on.localeCompare(b.due_on) || a.id.localeCompare(b.id))
        : plannedHealthRows.current;
    plannedHealthRows.current = next;
    setPlannedHealth(next);
    setPlannedHealthMessage('Ändringen är sparad.');
    setPlannedHealthMessageError(false);
    try {
      await reloadPlannedHealth(lifetime);
      if (!mounted.current || plannedHealthLifetime.current !== lifetime) return;
    } catch {
      if (mounted.current && plannedHealthLifetime.current === lifetime) {
        setPlannedHealthMessage('Ändringen är sparad, men listan kunde inte uppdateras.');
      }
    }
  }

  async function runPlannedHealthMutation(mutation: PendingPlannedHealthMutation, retry = false): Promise<boolean> {
    const isCurrent = () => mounted.current && plannedHealthLifetime.current === mutation.lifetime;
    if (!isCurrent() || plannedHealthMutationInFlight.current) return false;
    if (pendingPlannedHealthMutation.current && !retry) {
      setPlannedHealthMessage('Kontrollera föregående ändring innan du gör en ny.');
      setPlannedHealthMessageError(true);
      return false;
    }
    plannedHealthMutationInFlight.current = true;
    const flightToken = {};
    plannedHealthFlightToken.current = flightToken;
    setPlannedHealthBusy(true);
    setPlannedHealthMessage('');
    setPlannedHealthMessageError(false);
    setPlannedHealthConflict(null);
    try {
      let outcome: WriteOutcome<PlannedHealthRecord | null>;
      if (mutation.kind === 'insert') outcome = await insertPlannedHealth(client, mutation.operation);
      else if (mutation.kind === 'update') outcome = await updatePlannedHealth(client, dog.id, mutation.id, mutation.previous, mutation.changes, mutation.localToday);
      else outcome = await deletePlannedHealth(client, dog.id, mutation.id, mutation.previous);
      if (!isCurrent()) return false;
      if (outcome.status === 'saved') {
        await markPlannedHealthSaved(mutation, outcome.value);
        if (!isCurrent()) return false;
        return true;
      }
      if (outcome.status === 'unknown') {
        pendingPlannedHealthMutation.current = mutation;
        setPlannedHealthPending(true);
        setPlannedHealthMessage('Sparstatus är osäker. Kontrollera samma ändring innan du försöker igen.');
        setPlannedHealthMessageError(true);
        return false;
      }
      pendingPlannedHealthMutation.current = null;
      setPlannedHealthPending(false);
      setPlannedHealthMessage('Ändringen kunde inte sparas. Kontrollera uppgifterna och försök igen.');
      setPlannedHealthMessageError(true);
      return false;
    } catch {
      if (!isCurrent()) return false;
      pendingPlannedHealthMutation.current = mutation;
      setPlannedHealthPending(true);
      setPlannedHealthMessage('Sparstatus är osäker. Kontrollera samma ändring innan du försöker igen.');
      setPlannedHealthMessageError(true);
      return false;
    } finally {
      if (plannedHealthFlightToken.current === flightToken) {
        plannedHealthFlightToken.current = null;
        plannedHealthMutationInFlight.current = false;
        if (isCurrent()) setPlannedHealthBusy(false);
      }
    }
  }

  function savePlannedHealth(id: string | null, eventType: PlannedHealthType, dueOn: string, note: string, reminderEnabled?: boolean, reminderMinutes?: number | null): Promise<boolean> {
    const lifetime = plannedHealthLifetime.current;
    if (plannedHealthMutationInFlight.current || pendingPlannedHealthMutation.current || plannedHealthState !== 'ready') return Promise.resolve(false);
    const localToday = localDate();
    const previous = id === null ? null : plannedHealthRows.current.find((row) => row.id === id && row.event_type === eventType) ?? null;
    if ((id !== null && !previous) || (!isValidPlannedHealthDate(dueOn, localToday) && dueOn !== previous?.due_on)) return Promise.resolve(false);
    const description = normalizePlannedHealthDescription(note);
    if (description === undefined || (eventType !== 'vaccination' && eventType !== 'vet_visit')) return Promise.resolve(false);
    const enabled = reminderEnabled ?? previous?.reminder_enabled ?? false;
    const minutes = reminderMinutes === undefined ? previous?.reminder_minutes ?? null : reminderMinutes;
    if (enabled && minutes === null) return Promise.resolve(false);
    if (id === null) {
      const operation: PlannedHealthOperation = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, event_type: eventType, due_on: dueOn, description, local_today: localToday, reminder_enabled: enabled, reminder_minutes: minutes };
      return runPlannedHealthMutation({ kind: 'insert', operation, lifetime });
    }
    if (!previous) return Promise.resolve(false);
    return runPlannedHealthMutation({ kind: 'update', id, previous, changes: { due_on: dueOn, description, reminder_enabled: enabled, reminder_minutes: minutes }, localToday, lifetime });
  }

  function removePlannedHealth(id: string): Promise<boolean> {
    const lifetime = plannedHealthLifetime.current;
    if (plannedHealthMutationInFlight.current || pendingPlannedHealthMutation.current || plannedHealthState !== 'ready') return Promise.resolve(false);
    const previous = plannedHealthRows.current.find((row) => row.id === id);
    if (!previous) return Promise.resolve(false);
    return runPlannedHealthMutation({ kind: 'delete', id, previous, lifetime });
  }

  async function resolvePlannedHealthConflict() {
    const conflict = plannedHealthConflict;
    const pending = pendingPlannedHealthMutation.current;
    if (!conflict || !pending || conflict.lifetime !== plannedHealthLifetime.current || conflict.lifetime !== pending.lifetime
      || plannedHealthMutationInFlight.current) return;
    plannedHealthMutationInFlight.current = true;
    const lifetime = pending.lifetime;
    const flightToken = {};
    plannedHealthFlightToken.current = flightToken;
    setPlannedHealthBusy(true);
    try {
      const current = await fetchPlannedHealthById(client, dog.id, conflict.mutationId);
      if (!mounted.current || plannedHealthLifetime.current !== lifetime) return;
      if (!samePlannedHealthSnapshot(current, conflict.current)) {
        setPlannedHealthConflict({ lifetime, mutationId: conflict.mutationId, current });
        setPlannedHealthMessage('Planen ändrades igen. Granska den senast sparade versionen innan du börjar om.');
        setPlannedHealthMessageError(true);
        return;
      }
      const remaining = plannedHealthRows.current.filter((row) => row.id !== conflict.mutationId);
      const next = current ? [...remaining, current].sort((a, b) => a.due_on.localeCompare(b.due_on) || a.id.localeCompare(b.id)) : remaining;
      plannedHealthRows.current = next;
      setPlannedHealth(next);
      pendingPlannedHealthMutation.current = null;
      setPlannedHealthPending(false);
      setPlannedHealthConflict(null);
      setPlannedHealthMessage('Den aktuella sparade listan används. Du kan nu börja om.');
      setPlannedHealthMessageError(false);
    } catch {
      if (mounted.current && plannedHealthLifetime.current === lifetime) {
        setPlannedHealthMessage('Den aktuella planen kunde inte hämtas. Den väntande ändringen finns kvar.');
        setPlannedHealthMessageError(true);
      }
    } finally {
      if (plannedHealthFlightToken.current === flightToken) {
        plannedHealthFlightToken.current = null;
        plannedHealthMutationInFlight.current = false;
        if (mounted.current && plannedHealthLifetime.current === lifetime) setPlannedHealthBusy(false);
      }
    }
  }

  async function retryPlannedHealth() {
    if (plannedHealthMutationInFlight.current) return;
    const mutation = pendingPlannedHealthMutation.current;
    if (!mutation) {
      const lifetime = plannedHealthLifetime.current;
      setPlannedHealthState('loading');
      setPlannedHealthMessage('');
      setPlannedHealthMessageError(false);
      try {
        await reloadPlannedHealth(lifetime);
      } catch {
        if (mounted.current && plannedHealthLifetime.current === lifetime) {
          setPlannedHealthState('error');
          setPlannedHealthMessage('Planerna kunde inte hämtas.');
          setPlannedHealthMessageError(true);
        }
      }
      return;
    }
    const isCurrent = () => mounted.current && plannedHealthLifetime.current === mutation.lifetime;
    if (!isCurrent()) return;
    plannedHealthMutationInFlight.current = true;
    const flightToken = {};
    plannedHealthFlightToken.current = flightToken;
    setPlannedHealthBusy(true);
    setPlannedHealthMessage('Kontrollerar sparstatus…');
    setPlannedHealthMessageError(false);
    let retrySameOperation = false;
    try {
      const id = mutation.kind === 'insert' ? mutation.operation.id : mutation.id;
      const current = await fetchPlannedHealthById(client, dog.id, id);
      if (!isCurrent()) return;
      if (mutation.kind === 'insert') {
        if (current && samePlannedHealth(current, mutation.operation)) await markPlannedHealthSaved(mutation, current);
        else if (!current) retrySameOperation = true;
        else {
          setPlannedHealthConflict({ lifetime: mutation.lifetime, mutationId: id, current });
          setPlannedHealthMessage('En annan plan finns med samma id. Granska den innan du fortsätter.');
        }
      } else if (mutation.kind === 'update') {
        if (current && samePlannedHealth(current, { id, dog_id: dog.id, event_type: mutation.previous.event_type, ...mutation.changes })) {
          await markPlannedHealthSaved(mutation, current);
        } else if (current && samePlannedHealth(current, mutation.previous)) retrySameOperation = true;
        else {
          setPlannedHealthConflict({ lifetime: mutation.lifetime, mutationId: id, current });
          setPlannedHealthMessage(current ? 'Planen har ändrats sedan försöket. Granska den aktuella versionen.' : 'Planen finns inte längre. Bekräfta den aktuella listan innan du börjar om.');
        }
      } else if (!current) await markPlannedHealthSaved(mutation, null);
      else if (samePlannedHealth(current, mutation.previous)) retrySameOperation = true;
      else {
        setPlannedHealthConflict({ lifetime: mutation.lifetime, mutationId: id, current });
        setPlannedHealthMessage('Planen har ändrats sedan försöket. Granska den aktuella versionen.');
      }
      if (!isCurrent()) return;
      if (!retrySameOperation && pendingPlannedHealthMutation.current) setPlannedHealthMessageError(true);
    } catch {
      if (isCurrent()) {
        setPlannedHealthMessage('Sparstatus kunde inte kontrolleras. Försök igen när anslutningen fungerar.');
        setPlannedHealthMessageError(true);
      }
    } finally {
      if (plannedHealthFlightToken.current === flightToken) {
        plannedHealthFlightToken.current = null;
        plannedHealthMutationInFlight.current = false;
        if (isCurrent()) setPlannedHealthBusy(false);
      }
    }
    if (!isCurrent()) return;
    if (retrySameOperation) await runPlannedHealthMutation(mutation, true);
  }

  async function retryContent() {
    const generation = ++contentGeneration.current;
    const selectionKey = currentSelectionKey;
    setContent([]);
    setContentSelectionKey(null);
    setContentState('loading');
    try {
      const items = await fetchHomeContent(client, dog, age);
      if (!mounted.current || contentGeneration.current !== generation || currentSelectionKeyRef.current !== selectionKey) return;
      setContent(items);
      setContentSelectionKey(currentSelectionKey);
      setContentState('ready');
    } catch {
      if (mounted.current && contentGeneration.current === generation && currentSelectionKeyRef.current === selectionKey) {
        setContent([]);
        setContentSelectionKey(selectionKey);
        setContentState('error');
      }
    }
  }

  async function retryEvents() {
    setLogState('loading');
    try {
      await reloadEvents();
    } catch {
      if (mounted.current) setLogState('error');
    }
  }

  async function retryTraining() {
    const generation = ++trainingGeneration.current;
    const selectionKey = currentSelectionKey;
    setTraining({ programs: [], paused: [] });
    setTrainingSelectionKey(null);
    setTrainingState('loading');
    try {
      const loaded = await reloadTraining();
      if (!mounted.current || trainingGeneration.current !== generation) return;
      if (loaded) setTrainingError('');
    } catch {
      if (mounted.current && trainingGeneration.current === generation && currentSelectionKeyRef.current === selectionKey) {
        setTraining({ programs: [], paused: [] });
        setTrainingSelectionKey(selectionKey);
        setTrainingState('error');
      }
    }
  }

  async function completeStep(program: PublishedTrainingProgram, stepId: string): Promise<boolean> {
    if (trainingMutationInFlight.current) return false;
    const key = `${program.id}:${stepId}`;
    trainingMutationInFlight.current = true;
    setBusyStepKey(key);
    setTrainingError('');
    try {
      const outcome = await insertTrainingProgress(client, { dog_id: dog.id, program_version_id: program.id, step_id: stepId });
      if (outcome.status === 'saved') {
        try {
          await reloadTraining();
          if (!mounted.current) return false;
          return true;
        } catch {
          if (!mounted.current) return false;
          setTrainingState('error');
          setTrainingError('Steget är sparat, men programstatus kunde inte hämtas. Läs in programmet igen innan du fortsätter.');
          return false;
        }
      }
      let progressChecked = true;
      try {
        await reloadTraining();
      } catch {
        progressChecked = false;
      }
      if (!mounted.current) return false;
      setTrainingError(!progressChecked
        ? 'Stegets sparstatus kunde inte kontrolleras. Försök läsa programmet igen innan du registrerar på nytt.'
        : outcome.status === 'unknown'
          ? 'Sparstatus är osäker. Programmet har kontrollerats; om steget saknas kan du försöka igen.'
          : 'Steget kunde inte registreras. Kontrollera anslutningen och försök igen.');
      return false;
    } catch {
      if (!mounted.current) return false;
      setTrainingError('Steget kunde inte registreras. Kontrollera anslutningen och försök igen.');
      return false;
    } finally {
      trainingMutationInFlight.current = false;
      if (mounted.current) setBusyStepKey(null);
    }
  }

  async function resetProgram(program: PublishedTrainingProgram) {
    if (trainingMutationInFlight.current) return;
    trainingMutationInFlight.current = true;
    setBusyStepKey(`${program.id}:reset`);
    setTrainingError('');
    try {
      for (const stepId of program.completedStepIds) {
        const outcome = await deleteTrainingProgress(client, dog.id, program.id, stepId);
        if (!mounted.current) return;
        if (outcome.status !== 'saved') throw new Error('Progress could not be cleared');
      }
      await reloadTraining();
    } catch {
      if (!mounted.current) return;
      try {
        await reloadTraining();
        setTrainingError('Alla registreringar kunde inte rensas. Kontrollera programmet och försök igen.');
      } catch {
        setTrainingState('error');
        setTrainingError('Rensningens status kunde inte läsas in. Hämta programmet igen innan du ändrar det.');
      }
    } finally {
      trainingMutationInFlight.current = false;
      if (mounted.current) setBusyStepKey(null);
    }
  }

  async function handleSignOut() {
    if (signOutInFlight.current) return;
    signOutInFlight.current = true;
    setSigningOut(true);
    let result = { localSessionCleared: false, serverRevocationConfirmed: false };
    try {
      result = await signOut();
    } catch {
      result = { localSessionCleared: false, serverRevocationConfirmed: false };
    } finally {
      if (mounted.current) setSigningOut(false);
      signOutInFlight.current = false;
    }
    if (mounted.current) setSignOutError(!result.localSessionCleared);
  }

  function confirmSignOut() {
    if (signingOut) return;
    Alert.alert('Logga ut?', 'Du kan logga in igen när du vill.', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Bekräfta', style: 'destructive', onPress: () => { void handleSignOut(); } },
    ]);
  }

  if (!fontsLoaded && !fontError) return <AppScreen><MessageCard>Laddar Tasslas ikoner…</MessageCard></AppScreen>;
  if (fontError) return <AppScreen><MessageCard tone="error">Ikonerna kunde inte laddas. Starta om appen och försök igen.</MessageCard></AppScreen>;

  const pageContent = renderPage();
  return <AppScreen key={page} footer={<BottomNavigation page={page} onNavigate={setPage} />}>
    <Animated.View style={{ opacity: pageOpacity }}>{pageContent}</Animated.View>
  </AppScreen>;

  function renderPage() {
    if (page === 'home') return <HomePage
      dog={dog}
      iconsLoaded={fontsLoaded}
      ageWeeks={age}
      latestEvent={latestEvent ? toLogEvent(latestEvent) : null}
      nextProgram={nextProgram ?? null}
      nextStep={nextStep ?? null}
      content={visibleGuideContent}
      contentState={visibleContentState}
      trainingState={visibleTrainingState}
      onGo={setPage}
      onOpenContent={(contentId) => {
        setKnowledgeFocus({ selectionKey: currentSelectionKey, contentId, returnPage: 'home' });
        setPage('knowledge');
      }}
      onRetryContent={() => { void retryContent(); }}
    />;
    if (page === 'log') return <>
      {logState === 'loading' && <PageHeading title="Vardagslogg" description="Hämtar hundens logg…" />}
      {logState === 'error' && <>
        <PageHeading title="Vardagslogg" description="Loggen kunde inte hämtas." />
        <PrimaryButton title="Försök igen" onPress={() => { void retryEvents(); }} />
      </>}
      {logState === 'ready' && <LogScreen events={displayEvents} onAdd={addEvent} onUpdate={updateEvent} onDelete={deleteEvent}
        mode="cloud" busy={logBusy} statusMessage={logMessage} statusError={logMessageError}
        onRetryPending={() => { void retryLogMutation(); }} hasMore={hasMore} loadingMore={loadingMore}
        onLoadMore={() => { void loadMoreEvents(); }} />}
    </>;
    if (page === 'training') return <>
      {visibleTrainingState === 'loading' && <PageHeading title="Träning" description="Hämtar publicerade program…" />}
      {visibleTrainingState === 'error' && <>
        <PageHeading title="Träning" description="Programmen kunde inte hämtas." />
        <MessageCard tone="error">{trainingError}</MessageCard>
        <PrimaryButton title="Försök igen" onPress={() => { void retryTraining(); }} />
      </>}
      {visibleTrainingState === 'ready' && <PublishedTrainingScreen programs={training.programs} paused={training.paused}
        busyStepKey={busyStepKey} error={trainingError} onCompleteStep={completeStep}
        onContinue={() => setTrainingError('')} onResetProgram={(program) => { void resetProgram(program); }}
        onRetry={() => { void retryTraining(); }} />}
    </>;
    if (page === 'more') return <MorePage onNavigate={(nextPage) => {
      if (nextPage === 'knowledge') setKnowledgeFocus({ selectionKey: currentSelectionKey, contentId: null, returnPage: 'more' });
      setPage(nextPage);
    }} signOutError={signOutError} signingOut={signingOut} onSignOut={confirmSignOut} onOpenNotifications={() => { setNotificationSaved(false); setPage('notification-settings'); }} />;
    if (page === 'notification-settings') return <NotificationSettingsScreen
      key={JSON.stringify(notificationPreferences)} onBack={() => setPage('more')} preferences={notificationPreferences}
      saved={notificationSaved && !notificationStorageError} busy={notificationBusy || !notificationPreferencesReady}
      statusMessage={notificationStorageError ? 'Påminnelsevalen kunde inte läsas säkert. Inga nya påminnelser schemaläggs.' : notificationMessage}
      statusError={notificationStorageError || notificationMessageError} permissionState={notificationPermission}
      onSave={async (preferences) => {
        const context = notificationContextRef.current;
        if (!context || notificationBusy) return false;
        setNotificationBusy(true); setNotificationSaved(false); setNotificationMessage(''); setNotificationMessageError(false);
        try {
          await reminderService.savePreferences(context.ownerId, preferences);
          if (!reminderService.isCurrent(context)) return false;
          setNotificationPreferences(preferences); setNotificationSaved(true); setNotificationStorageError(false);
          return true;
        } catch {
          if (reminderService.isCurrent(context)) { setNotificationMessage('Valen kunde inte sparas säkert. Kontrollera lagringen och försök igen.'); setNotificationMessageError(true); }
          return false;
        } finally { if (reminderService.isCurrent(context)) setNotificationBusy(false); }
      }}
      onRequestPermission={async () => {
        const context = notificationContextRef.current;
        if (!context) return 'unknown';
        const result = await reminderService.requestPermission(context);
        if (reminderService.isCurrent(context)) setNotificationPermission(result);
        return result;
      }}
    />;
    if (page === 'health') return <HealthScreen
      onBack={() => setPage('more')}
      records={healthWeights}
      loadState={healthState}
      busy={healthBusy}
      blocked={healthBusy || healthPending}
      pendingStatus={healthPending}
      statusMessage={healthMessage}
      statusError={healthMessageError}
      onRetry={() => { void retryHealthMutation(); }}
      onRetryPending={() => { void retryHealthMutation(); }}
      onSave={saveHealthWeight}
      onDelete={removeHealthWeight}
      historyRecords={healthHistory}
      historyLoadState={healthHistoryState}
      historyBusy={healthHistoryBusy}
      historyPending={healthHistoryPending}
      historyMessage={healthHistoryMessage}
      historyMessageError={healthHistoryMessageError}
      historyConflict={healthHistoryConflict?.lifetime === currentHealthHistoryLifetime ? healthHistoryConflict : null}
      onRetryHistory={() => { void retryHealthHistory(); }}
      onResolveHistoryConflict={resolveHealthHistoryConflict}
      onSaveHistory={saveHealthHistory}
      onDeleteHistory={removeHealthHistory}
      onOpenPlannedHealth={() => setPage('planned-health')}
    />;
    if (page === 'planned-health') return <PlannedHealthScreen
      key={JSON.stringify(plannedHealth.map(({ id, event_type, due_on, description }) => [id, event_type, due_on, description]))}
      onBack={() => setPage('health')}
      records={plannedHealth}
      loadState={plannedHealthState}
      busy={plannedHealthBusy}
      pending={plannedHealthPending}
      statusMessage={plannedHealthMessage}
      statusError={plannedHealthMessageError}
      reminderSummary={reminderStatusSummary(reminderResult, notificationPreferences, notificationPermission)}
      conflict={plannedHealthConflict?.lifetime === currentPlannedHealthLifetime ? plannedHealthConflict : null}
      onRetry={() => { void retryPlannedHealth(); }}
      onResolveConflict={() => { void resolvePlannedHealthConflict(); }}
      onSave={savePlannedHealth}
      onDelete={removePlannedHealth}
    />;
    if (page === 'knowledge') return <KnowledgeScreen
      onBack={() => setPage(knowledgeFocus?.selectionKey === currentSelectionKey ? knowledgeFocus.returnPage : 'more')}
      items={visibleGuideContent}
      contentState={visibleContentState}
      focusedContentId={focusedKnowledgeContentId}
      onSelectContent={(contentId) => setKnowledgeFocus({
        selectionKey: currentSelectionKey,
        contentId,
        returnPage: knowledgeFocus?.selectionKey === currentSelectionKey ? knowledgeFocus.returnPage : 'more',
      })}
      onRetry={() => { void retryContent(); }}
    />;
    if (page === 'passport') return <PassportScreen
      onBack={() => setPage('more')}
      client={client}
      dog={dog}
      lifetime={currentProfileLifetime}
      isLifetimeCurrent={isPassportLifetimeCurrent}
      weights={healthWeights}
      weightLoadState={healthState}
      weightBusy={healthBusy}
      weightPending={healthPending}
      onRetryWeights={() => { void retryHealthMutation(); }}
      history={healthHistory}
      historyLoadState={healthHistoryState}
      historyBusy={healthHistoryBusy}
      historyPending={healthHistoryPending}
      onRetryHistory={() => { void retryHealthHistory(); }}
      profileBusy={profileBusy}
      profilePending={profilePending}
      profileConflict={Boolean(profileConflict)}
    />;
    if (onDogUpdated) return <EditDogProfileScreen key={`${dog.id}:${dog.name}:${dog.breed_id}:${dog.birth_date}`}
      client={client} dog={dog} busy={profileBusy} pending={profilePending} statusMessage={profileMessage}
      statusError={profileMessageError} conflict={profileConflict ?? undefined}
      onBack={() => setPage('more')} onSave={saveDogProfile}
      onRetryStatus={() => { void retryProfileStatus(); }} onAcceptCurrent={() => { void acceptCurrentProfile(); }} />;
    return <DogProfilePage dog={dog} onBack={() => setPage('more')} />;
  }
}

function HomePage({
  dog, ageWeeks, latestEvent, nextProgram, nextStep, content, contentState, trainingState,
  iconsLoaded, onGo, onOpenContent, onRetryContent,
}: {
  dog: OwnedDog;
  iconsLoaded: boolean;
  ageWeeks: number;
  latestEvent: LogEvent | null;
  nextProgram: PublishedTrainingProgram | null;
  nextStep: PublishedTrainingProgram['steps'][number] | null;
  content: HomeContent[];
  contentState: 'loading' | 'ready' | 'error';
  trainingState: 'loading' | 'ready' | 'error';
  onGo: (page: ProductPage) => void;
  onOpenContent: (contentId: string) => void;
  onRetryContent: () => void;
}) {
  return <View>
    <View style={styles.homeHeader}>
      <Text style={styles.eyebrow}>ER HUNDRESA</Text>
      <Text style={styles.homeTitle} accessibilityRole="header">Hej, {dog.name}!</Text>
      <Text style={styles.homeSubtitle}>{formatDogAge(dog.birth_date, ageWeeks)}</Text>
    </View>
    <View style={styles.welcomeCard}>
      <View style={styles.welcomeCopy}>
        <Text style={styles.welcomeEyebrow}>TILLSAMMANS</Text>
        <Text style={styles.welcomeTitle}>En dag i taget.</Text>
        <Text style={styles.welcomeBody}>Små minnen och trygga steg i hundens vardag.</Text>
      </View>
      <Image source={require('../../../assets/images/dog-welcome.png')} style={styles.welcomeImage} accessibilityLabel="Dekorativ bild av en hund i ett varmt hem" />
    </View>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle} accessibilityRole="header">För er just nu</Text><Ionicons name="sparkles-outline" size={22} color={theme.colors.accent} /></View>
    {contentState === 'loading' && <MessageCard>Hämtar publicerat innehåll…</MessageCard>}
    {contentState === 'error' && <>
      <MessageCard tone="error">Innehållet kunde inte hämtas. Vi visar inget tills anslutningen fungerar igen.</MessageCard>
      <PrimaryButton title="Försök igen" onPress={onRetryContent} />
    </>}
    {contentState === 'ready' && content.length === 0 && <MessageCard>Det finns inget publicerat innehåll för {dog.name}s ålder och ras ännu. Nya guider visas här när de är klara.</MessageCard>}
    {contentState === 'ready' && content.slice(0, 2).map((item) => <View key={item.id} style={styles.contentCard}>
      <View style={styles.contentCardHeading}>
        {iconsLoaded && <Ionicons name={item.contentType === 'checklist' ? 'checkbox-outline' : 'book-outline'} size={19} color={theme.colors.accent} />}
        <Text style={styles.cardEyebrow}>{contentTypeLabel(item.contentType)}</Text>
      </View>
      <Text style={styles.contentTitle}>{item.title}</Text>
      <Text style={styles.contentBody} numberOfLines={3} ellipsizeMode="tail">{getGuidePreviewText(item.body)}</Text>
      <QuietButton title="Läs i Kunskap" onPress={() => onOpenContent(item.id)} />
    </View>)}
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle} accessibilityRole="header">Hundens vardag</Text><Ionicons name="calendar-outline" size={22} color={theme.colors.accent} /></View>
    <View style={styles.summaryCard}>
      <Text style={styles.cardEyebrow}>SENASTE I LOGGEN</Text>
      {latestEvent
        ? <Text style={styles.summaryText}>{latestEvent.note || logTypeText(latestEvent.type)} · {new Date(latestEvent.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        : <Text style={styles.summaryText}>Inga loggposter ännu. Lägg till en liten händelse när ni vill.</Text>}
      <QuietButton title="Öppna loggen" onPress={() => onGo('log')} />
    </View>
    <View style={styles.summaryCard}>
      <Text style={styles.cardEyebrow}>NÄSTA TRÄNINGSSTEG</Text>
      {trainingState === 'loading' && <Text style={styles.summaryText}>Hämtar publicerade program…</Text>}
      {trainingState === 'error' && <Text style={styles.summaryText}>Programmen kunde inte hämtas just nu.</Text>}
      {trainingState === 'ready' && nextProgram && nextStep && <>
        <Text style={styles.summaryTitle}>{nextProgram.title}</Text>
        <Text style={styles.summaryText}>{nextStep.title}</Text>
        <QuietButton title="Öppna nästa steg" onPress={() => onGo('training')} />
      </>}
      {trainingState === 'ready' && !nextProgram && <Text style={styles.summaryText}>Inget publicerat nästa steg ännu. Nya program visas här när de är klara.</Text>}
    </View>
    <View style={styles.shortcuts}>
      <Shortcut icon="create-outline" label="Logga" onPress={() => onGo('log')} />
      <Shortcut icon="school-outline" label="Träning" onPress={() => onGo('training')} />
      <Shortcut icon="ellipsis-horizontal-circle-outline" label="Mer" onPress={() => onGo('more')} />
    </View>
  </View>;
}

function MorePage({ onNavigate, signOutError, signingOut, onSignOut, onOpenNotifications }: { onNavigate: (page: ProductPage) => void; signOutError: boolean; signingOut: boolean; onSignOut: () => void; onOpenNotifications: () => void }) {
  return <View>
    <PageHeading title="Mer" description="Fler delar av hundens resa, samlade på ett ställe." />
    <MenuRow icon="book-outline" title="Kunskap" detail="Publicerade guider och checklistor" onPress={() => onNavigate('knowledge')} />
    <MenuRow icon="id-card-outline" title="Tassla-pass" detail="En ärlig överblick, utan export" onPress={() => onNavigate('passport')} />
    <MenuRow icon="paw-outline" title="Hundprofil" detail="Din hunds uppgifter" onPress={() => onNavigate('profile')} />
    <MenuRow icon="notifications-outline" title="Påminnelser" detail="Lokala val och enhetens tillstånd" onPress={onOpenNotifications} />
    {signOutError && <MessageCard tone="error">Det gick inte att logga ut just nu. Försök igen.</MessageCard>}
    <QuietButton title={signingOut ? 'Loggar ut…' : 'Logga ut'} disabled={signingOut} onPress={onSignOut} />
  </View>;
}

function DogProfilePage({ dog, onBack }: { dog: OwnedDog; onBack: () => void }) {
  return <View>
    <QuietButton title="Tillbaka till Mer" onPress={onBack} />
    <PageHeading title="Hundprofil" description="Uppgifterna används för att välja ålders- och rasrelevant innehåll." />
    <View style={styles.profileCard}>
      <Text style={styles.cardEyebrow}>HUNDENS NAMN</Text><Text style={styles.profileValue}>{dog.name}</Text>
      <Text style={styles.cardEyebrow}>RAS</Text><Text style={styles.profileValue}>{dog.breed_id}</Text>
      <Text style={styles.cardEyebrow}>FÖDELSEDATUM</Text><Text style={styles.profileValue}>{dog.birth_date}</Text>
    </View>
    <MessageCard>Profiländring är inte tillgänglig här ännu. Hundens uppgifter har hämtats från ditt konto.</MessageCard>
  </View>;
}

function MenuRow({ icon, title, detail, onPress }: { icon: ComponentProps<typeof Ionicons>['name']; title: string; detail: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
    <Ionicons name={icon} size={23} color={theme.colors.accent} />
    <View style={styles.menuCopy}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuDetail}>{detail}</Text></View>
    <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
  </Pressable>;
}

function Shortcut({ icon, label, onPress }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}>
    <Ionicons name={icon} size={22} color={theme.colors.accent} />
    <Text style={styles.shortcutLabel}>{label}</Text>
  </Pressable>;
}

function BottomNavigation({ page, onNavigate }: { page: ProductPage; onNavigate: (page: ProductPage) => void }) {
  const tabs: { id: ProductPage; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
    { id: 'home', label: 'Hem', icon: page === 'home' ? 'home' : 'home-outline' },
    { id: 'log', label: 'Logg', icon: page === 'log' ? 'create' : 'create-outline' },
    { id: 'training', label: 'Träning', icon: page === 'training' ? 'school' : 'school-outline' },
    { id: 'health', label: 'Hälsa', icon: page === 'health' ? 'heart' : 'heart-outline' },
    { id: 'more', label: 'Mer', icon: ['more', 'knowledge', 'passport', 'profile'].includes(page) ? 'grid' : 'grid-outline' },
  ];
  return <View style={styles.bottomNavigation}>
    {tabs.map((tab) => {
      const selected = tab.id === page || (tab.id === 'more' && ['knowledge', 'passport', 'profile'].includes(page));
      return <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={tab.label}
        onPress={() => onNavigate(tab.id)} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
        <Ionicons name={tab.icon} size={22} color={selected ? theme.colors.accent : theme.colors.mutedText} />
        <Text style={[styles.tabLabel, selected && styles.selectedTabLabel]}>{tab.label}</Text>
      </Pressable>;
    })}
  </View>;
}

function reminderStatusSummary(result: ReminderReconcileResult | null, preferences: NotificationPreferences, permission: 'unknown' | 'granted' | 'denied'): string {
  if (!preferences.enabled) return 'Påminnelser av på den här enheten. Sparade planval finns kvar.';
  if (permission === 'denied' || result?.status === 'permission-denied') return 'Enheten nekar notiser; Tassla fungerar ändå.';
  if (result?.status === 'unknown') return 'En plan har osäker sparstatus och väntar på kontroll.';
  if (result?.status === 'failed') return 'Påminnelserna kunde inte stämmas av.';
  if (result?.status === 'over-cap') return 'Schemalagda högst 40 planer och en träningspåminnelse. Ytterligare planer schemaläggs inte.';
  if (result?.status === 'scheduled') return result.scheduledCount + ' lokala påminnelser schemalagda i ' + result.timezone + '. Schemaläggning är ingen leveransbekräftelse.';
  return 'Påminnelsernas status kontrolleras.';
}

function toLogEvent(row: DogEventRecord): LogEvent {
  return { id: row.id, dogId: row.dog_id, type: row.event_type, occurredAt: row.occurred_at, note: row.description, origin: 'local-test' };
}

function sameHealthWeight(
  current: HealthWeightRecord,
  expected: Pick<HealthWeightRecord, 'id' | 'dog_id' | 'occurred_on' | 'weight_kg'>,
): boolean {
  return current.id === expected.id && current.dog_id === expected.dog_id
    && current.occurred_on === expected.occurred_on && current.weight_kg === expected.weight_kg;
}

function sameHealthHistory(
  current: HealthHistoryRecord,
  expected: Pick<HealthHistoryRecord, 'id' | 'dog_id' | 'event_type' | 'occurred_on' | 'description'>,
): boolean {
  return current.id === expected.id && current.dog_id === expected.dog_id && current.event_type === expected.event_type
    && current.occurred_on === expected.occurred_on && current.description === expected.description;
}

function samePlannedHealth(
  record: PlannedHealthRecord,
  expected: Pick<PlannedHealthOperation, 'id' | 'dog_id' | 'event_type' | 'due_on' | 'description' | 'reminder_enabled' | 'reminder_minutes'>,
): boolean {
  return record.id === expected.id && record.dog_id === expected.dog_id && record.event_type === expected.event_type
    && record.due_on === expected.due_on && record.description === expected.description
    && record.reminder_enabled === expected.reminder_enabled && record.reminder_minutes === expected.reminder_minutes;
}

function samePlannedHealthSnapshot(left: PlannedHealthRecord | null, right: PlannedHealthRecord | null): boolean {
  if (left === null || right === null) return left === right;
  return samePlannedHealth(left, right) && left.created_at === right.created_at;
}

function sameOwnedDogProfile(
  current: OwnedDog,
  expected: Pick<OwnedDog, 'name' | 'breed_id' | 'birth_date'>,
  id: string,
): boolean {
  return current.id === id && current.name === expected.name
    && current.breed_id === expected.breed_id && current.birth_date === expected.birth_date;
}

function formatDogAge(birthDate: string, weeks: number): string {
  if (weeks < 8) return `${weeks} ${weeks === 1 ? 'vecka' : 'veckor'} gammal`;
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date(`${localDate()}T00:00:00`);
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years > 0 && remainingMonths > 0) return `${years} ${years === 1 ? 'år' : 'år'} och ${remainingMonths} ${remainingMonths === 1 ? 'månad' : 'månader'} gammal`;
  if (years > 0) return `${years} ${years === 1 ? 'år' : 'år'} gammal`;
  return `${Math.max(1, months)} ${months === 1 ? 'månad' : 'månader'} gammal`;
}

function contentTypeLabel(type: HomeContent['contentType']): string {
  return type === 'article' ? 'KUNSKAP' : type === 'guide' ? 'GUIDE' : type === 'checklist' ? 'CHECKLISTA' : 'TRÄNING';
}

function logTypeText(type: LogEventType): string {
  return type === 'pee' ? 'Kiss' : type === 'poop' ? 'Bajs' : type === 'food' ? 'Mat' : type === 'sleep' ? 'Sömn' : type === 'awake' ? 'Vaken' : 'Promenad';
}

const styles = StyleSheet.create({
  homeHeader: { marginTop: 30, marginBottom: 20 },
  eyebrow: { color: theme.colors.accent, fontSize: 11, letterSpacing: 1.2, fontWeight: '800' },
  homeTitle: { color: theme.colors.text, fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -0.7, marginTop: 10 },
  homeSubtitle: { color: theme.colors.mutedText, fontSize: 16, marginTop: 4 },
  welcomeCard: { minHeight: 176, flexDirection: 'row', overflow: 'hidden', borderRadius: theme.radius.card, backgroundColor: '#E8E3D6', marginBottom: 26 },
  welcomeCopy: { flex: 1, justifyContent: 'center', padding: 18 },
  welcomeEyebrow: { color: theme.colors.accent, fontSize: 10, letterSpacing: 1.1, fontWeight: '800' },
  welcomeTitle: { color: theme.colors.text, fontSize: 20, lineHeight: 25, fontWeight: '800', marginTop: 8 },
  welcomeBody: { color: theme.colors.mutedText, fontSize: 13, lineHeight: 19, marginTop: 5 },
  welcomeImage: { width: '42%', height: '100%', resizeMode: 'cover' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 10 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  contentCard: { borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 17, marginTop: 8 },
  contentCardHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardEyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.9, marginBottom: 7 },
  contentTitle: { color: theme.colors.text, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  contentBody: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 21, marginTop: 7 },
  summaryCard: { borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 16, marginTop: 8 },
  summaryTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  summaryText: { color: theme.colors.mutedText, fontSize: 15, lineHeight: 22 },
  shortcuts: { flexDirection: 'row', gap: 9, marginTop: 20 },
  shortcut: { flex: 1, minHeight: 68, borderRadius: theme.radius.button, backgroundColor: '#E8EFE8', alignItems: 'center', justifyContent: 'center', gap: 5 },
  shortcutLabel: { color: theme.colors.accent, fontSize: 12, fontWeight: '800' },
  menuRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: theme.radius.button, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, marginBottom: 10 },
  menuCopy: { flex: 1 },
  menuTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  menuDetail: { color: theme.colors.mutedText, fontSize: 13, marginTop: 3 },
  profileCard: { borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, padding: 18, borderColor: theme.colors.border, borderWidth: 1 },
  profileValue: { color: theme.colors.text, fontSize: 17, fontWeight: '700', marginBottom: 18 },
  bottomNavigation: { minHeight: 68, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 8, paddingTop: 5, paddingBottom: 4 },
  tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  tabLabel: { color: theme.colors.mutedText, fontSize: 11, fontWeight: '700', marginTop: 3 },
  selectedTabLabel: { color: theme.colors.accent, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
