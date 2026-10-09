import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import * as ExpoCrypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
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
  fetchOwnedDogAttribution,
  fetchOwnedDogById,
  fetchBreeds,
  updateOwnedDogAttribution,
  updateOwnedDog,
  type BreedOption,
  type DogAttributionWriteOutcome,
  type DogProfileWriteOutcome,
  type HomeContent,
  type OwnedDog,
  type OwnedDogAttribution,
  type OwnedDogProfileChanges,
} from '../../data/app-data';
import { ageInWeeks, localDate } from '../onboarding/dog';
import { HealthScreen } from '../health/HealthScreen';
import { PlannedHealthScreen } from '../health/PlannedHealthScreen';
import { EditDogProfileScreen } from '../onboarding/EditDogProfileScreen';
import { KnowledgeScreen } from '../knowledge/KnowledgeScreen';
import { HomeScreen } from './HomeScreen';
import { AppBar, BottomNav, MainSwipeNavigation, type BottomNavDestination } from '../../components/ui';
import { ScreenTransition } from '../../components/ui/Motion';
import { LogScreen, type QuickLogMutationView } from '../puppy-log/LogScreen';
import { canStartLogMutation, checkInsertRetryOperation, finishLogMutationFlight, isLogMutationLifetimeCurrent, logMutationStatusForWriteOutcome, retainLogMutationFlightForLifetime, startLogMutationFlight, type LogEvent, type LogEventChanges, type LogEventType, type LogMutationFlight } from '../puppy-log/log-model';
import { PassportScreen } from '../passport/PassportScreen';
import { PublishedTrainingScreen } from '../training/PublishedTrainingScreen';
import { theme, tokens } from '../../theme/tokens';
import { useAuth } from '../account/AuthProvider';
import { NotificationSettingsScreen } from '../notifications/NotificationSettingsScreen';
import { AccountSettingsScreen } from '../account/AccountSettingsScreen';
import { BetaInfoScreen } from '../account/BetaInfoScreen';
import { requestAccountDeletion, type AccountDeleteResult } from '../account/account-delete';
import { createAnalyticsService } from '../../analytics/analytics-service';
import { deleteNotificationPreferences } from '../../notifications/notification-storage';
import { cleanupStalePassportFiles } from '../passport/passport-export';
import { futureFireTimeForPlan, parseReminderPayload, type NotificationPreferences } from '../../notifications/notification-model';
import { reminderService, type ReminderContext, type ReminderReconcileResult } from '../../notifications/notification-service';

type ProductPage = 'home' | 'log' | 'training' | 'more' | 'health' | 'planned-health' | 'knowledge' | 'passport' | 'profile' | 'notification-settings' | 'account-settings' | 'beta-info';
type PendingLogMutation =
  | { kind: 'insert'; operation: DogEventOperation; lifetime: string }
  | { kind: 'update'; mutationId: string; id: string; type: LogEventType; occurredAt: string; changes: { event_type: LogEventType; occurred_at: string; duration_minutes: number | null; description: string | null }; lifetime: string }
  | { kind: 'delete' | 'undo'; mutationId: string; id: string; type: LogEventType; occurredAt: string; lifetime: string };
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
const MAIN_PAGES: ProductPage[] = ['home', 'log', 'training', 'health', 'knowledge', 'passport'];

export function ProductWorkspace({ client, dog, onDogUpdated }: { client: SupabaseClient; dog: OwnedDog; onDogUpdated?: (updated: OwnedDog) => void }) {
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const [page, setPage] = useState<ProductPage>('home');
  const previousPage = useRef(page);
  const [breeds, setBreeds] = useState<BreedOption[]>([]);
  useEffect(() => {
    let active = true;
    void fetchBreeds(client).then((result) => { if (active) setBreeds(result); }).catch(() => undefined);
    return () => { active = false; };
  }, [client]);
  const [content, setContent] = useState<HomeContent[]>([]);
  const [contentState, setContentState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [contentSelectionKey, setContentSelectionKey] = useState<string | null>(null);
  const [knowledgeFocus, setKnowledgeFocus] = useState<{ selectionKey: string; contentId: string | null; returnPage: 'home' | 'more' } | null>(null);
  const [events, setEvents] = useState<DogEventRecord[]>([]);
  const eventRows = useRef<DogEventRecord[]>([]);
  const [logState, setLogState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [logBusy, setLogBusy] = useState(false);
  const [quickLogMutation, setQuickLogMutation] = useState<QuickLogMutationView | null>(null);
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
  const handledNotificationResponses = useRef(new Set<string>());
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({ version: 1, enabled: false, trainingEnabled: false, trainingMinutes: 540 });
  const [notificationPreferencesReady, setNotificationPreferencesReady] = useState(false);
  const [notificationStorageError, setNotificationStorageError] = useState(false);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationSaved, setNotificationSaved] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationMessageError, setNotificationMessageError] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [reminderResult, setReminderResult] = useState<ReminderReconcileResult | null>(null);
  const [accountDeleteBusy, setAccountDeleteBusy] = useState(false);
  const [accountDeleteStatus, setAccountDeleteStatus] = useState<'idle' | 'confirmed' | 'failed' | 'unknown' | 'unavailable' | 'blocked'>('idle');
  const [accountDeleteCleanupFailed, setAccountDeleteCleanupFailed] = useState(false);
  const [accountDeleteSignOutFailed, setAccountDeleteSignOutFailed] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean | null>(null);
  const [analyticsBusy, setAnalyticsBusy] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(false);
  const analyticsOperationInFlight = useRef(false);
  const accountDeletionInvalidated = useRef(false);
  const accountDeleteInFlight = useRef(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profilePending, setProfilePending] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileMessageError, setProfileMessageError] = useState(false);
  const [profileConflict, setProfileConflict] = useState<OwnedDog | null>(null);
  const [dogAttribution, setDogAttribution] = useState<OwnedDogAttribution | null>(null);
  const [attributionState, setAttributionState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attributionBusy, setAttributionBusy] = useState(false);
  const [attributionMessage, setAttributionMessage] = useState('');
  const [attributionMessageError, setAttributionMessageError] = useState(false);
  const [training, setTraining] = useState<{ programs: PublishedTrainingProgram[]; paused: PausedTrainingProgress[] }>({ programs: [], paused: [] });
  const [trainingState, setTrainingState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [trainingSelectionKey, setTrainingSelectionKey] = useState<string | null>(null);
  const [trainingError, setTrainingError] = useState('');
  const [busyStepKey, setBusyStepKey] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const signOutInFlight = useRef(false);
  const pendingLogMutation = useRef<PendingLogMutation | null>(null);
  const logMutationFlight = useRef<LogMutationFlight | null>(null);
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
  const { signOut, session, accountGeneration, isCurrentAccount, signOutCurrentAccountLocally,
    reportNotificationCleanupFailure, reportDeletedAccountCleanupFailure } = useAuth();
  const analyticsService = useMemo(() => createAnalyticsService(async (name, args) => {
    const result = await client.rpc(name, args as never);
    return { data: result.data, error: result.error };
  }), [client, session?.user.id]);

  useEffect(() => {
    let active = true;
    // Reset consent while the account-scoped RPC is loading.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnalyticsConsent(null);
    setAnalyticsError(false);
    if (!session?.user.id) return () => { active = false; };
    void analyticsService.getConsent().then((value) => {
      if (!active) return;
      setAnalyticsConsent(value);
      setAnalyticsError(value === null);
    });
    return () => { active = false; };
  }, [analyticsService, session?.user.id]);

  useEffect(() => {
    if (page === 'home' && analyticsConsent === true) void analyticsService.track('home_viewed');
  }, [analyticsConsent, analyticsService, page]);
  useEffect(() => { previousPage.current = page; }, [page]);
  const currentHealthHistoryLifetime = `${dog.id}:${session?.user.id ?? ''}`;
  const currentLogLifetime = `${dog.id}:${session?.user.id ?? ''}`;
  const healthHistoryLifetime = useRef('');
  const logLifetime = useRef('');
  const previousHealthHistoryLifetime = useRef('');
  const previousLogLifetime = useRef('');
  const currentPlannedHealthLifetime = currentHealthHistoryLifetime;
  const plannedHealthLifetime = useRef('');
  const previousPlannedHealthLifetime = useRef('');

  useLayoutEffect(() => {
    healthHistoryLifetime.current = currentHealthHistoryLifetime;
  }, [currentHealthHistoryLifetime]);
  useLayoutEffect(() => {
    logLifetime.current = currentLogLifetime;
  }, [currentLogLifetime]);
  useLayoutEffect(() => {
    if (previousLogLifetime.current && previousLogLifetime.current !== currentLogLifetime) {
      pendingLogMutation.current = null;
      logMutationFlight.current = retainLogMutationFlightForLifetime(logMutationFlight.current, currentLogLifetime);
      setLogBusy(false);
      setQuickLogMutation(null);
      setLoadMoreError(false);
    }
    previousLogLifetime.current = currentLogLifetime;
  }, [currentLogLifetime]);
  useLayoutEffect(() => {
    plannedHealthLifetime.current = currentPlannedHealthLifetime;
  }, [currentPlannedHealthLifetime]);
  const currentProfileLifetime = currentHealthHistoryLifetime;
  const profileLifetime = useRef('');
  const previousProfileLifetime = useRef('');
  const contentGeneration = useRef(0);
  const trainingGeneration = useRef(0);
  const age = ageInWeeks(dog.birth_date, localDate());
  const currentSelectionKey = `${dog.id}:${dog.breed_id}:${age}`;
  const currentSelectionKeyRef = useRef(currentSelectionKey);

  useLayoutEffect(() => {
    currentSelectionKeyRef.current = currentSelectionKey;
  }, [currentSelectionKey]);

  useLayoutEffect(() => {
    profileLifetime.current = currentProfileLifetime;
  }, [currentProfileLifetime]);
  const isPassportLifetimeCurrent = useCallback((lifetime: string) => (
    mounted.current && !accountDeletionInvalidated.current && profileLifetime.current === lifetime
  ), []);

  const serializeEventRead = useCallback(<T,>(read: () => Promise<T>): Promise<T> => {
    const request = eventReadQueue.current.catch(() => undefined).then(read);
    eventReadQueue.current = request.then(() => undefined, () => undefined);
    return request;
  }, []);

  const reloadEvents = useCallback(async (signal?: AbortSignal) => {
    const lifetime = logLifetime.current;
    const rows = await serializeEventRead(() => fetchDogEvents(client, dog.id, 0, PAGE_SIZE, undefined, signal));
    if (!mounted.current || signal?.aborted || logLifetime.current !== lifetime) return;
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
        setNotificationMessage('Vi kunde inte kontrollera om planen sparades. Den påminnelsen är pausad tills du kontrollerar ändringen.');
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
      if (reminderService.hasCleanupFailure(ownerId)) {
        setNotificationMessage('Tassla kunde inte städa alla egna lokala påminnelser. Kontrollera dessa inställningar.');
        setNotificationMessageError(true);
      }
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
      void reminderService.cleanupOwner(ownerId).then((cleaned) => {
        if (!cleaned) reportNotificationCleanupFailure(ownerId);
      });
    };
  }, [dog.id, reportNotificationCleanupFailure, session?.user.id]);

  const handleNotificationResponse = useCallback(async (response: Notifications.NotificationResponse) => {
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const context = notificationContextRef.current;
    if (!context || !reminderService.isCurrent(context)) return;
    const payload = parseReminderPayload(response.notification.request.content.data);
    if (!payload || payload.ownerId.toLowerCase() !== context.ownerId || payload.dogId.toLowerCase() !== context.dogId) return;
    const responseId = response.notification.request.identifier;
    const deliveryDate = response.notification.date;
    if (!Number.isFinite(deliveryDate)) return;
    const responseKey = responseId + ':' + deliveryDate.toString();
    if (handledNotificationResponses.current.has(responseKey)) return;
    handledNotificationResponses.current.add(responseKey);
    if (handledNotificationResponses.current.size > 128) {
      const oldest = handledNotificationResponses.current.values().next().value;
      if (oldest) handledNotificationResponses.current.delete(oldest);
    }
    try {
      if (payload.target === 'training') {
        if (!reminderService.isCurrent(context)) return;
        setPage('training');
      } else {
        const plan = await fetchPlannedHealthById(client, context.dogId, payload.planId!);
        if (!reminderService.isCurrent(context)) return;
        if (plan && plan.id === payload.planId && plan.dog_id.toLowerCase() === context.dogId) setPage('planned-health');
      }
      if (!reminderService.isCurrent(context)) return;
      const latest = await Notifications.getLastNotificationResponseAsync();
      if (!reminderService.isCurrent(context)) return;
      if (latest?.notification.request.identifier === responseId
        && latest.notification.date === deliveryDate
        && latest.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        await Notifications.clearLastNotificationResponseAsync();
      }
    } catch {
      handledNotificationResponses.current.delete(responseKey);
    }
  }, [client]);

  useEffect(() => {
    let active = true;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (active) void handleNotificationResponse(response);
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (active && response) void handleNotificationResponse(response);
    }).catch(() => undefined);
    return () => { active = false; subscription.remove(); };
  }, [handleNotificationResponse]);

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
    setAttributionState('loading');
    setAttributionMessage('');
    setAttributionMessageError(false);
    void fetchOwnedDogAttribution(client, dog.id).then((value) => {
      if (!mounted.current || currentProfileLifetime !== profileLifetime.current) return;
      setDogAttribution(value);
      setAttributionState('ready');
    }).catch(() => {
      if (!mounted.current || currentProfileLifetime !== profileLifetime.current) return;
      setAttributionState('error');
    });
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
        setProfileMessage('Vi kunde inte kontrollera om profilen sparades. Kontrollera samma ändring innan du gör något nytt.');
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
      setProfileMessage('Vi kunde inte kontrollera om profilen sparades. Kontrollera samma ändring innan du gör något nytt.');
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

  async function retryDogAttribution() {
    if (attributionBusy) return;
    setAttributionState('loading');
    setAttributionMessage('');
    setAttributionMessageError(false);
    try {
      const value = await fetchOwnedDogAttribution(client, dog.id);
      if (!mounted.current) return;
      setDogAttribution(value);
      setAttributionState('ready');
    } catch {
      if (mounted.current) setAttributionState('error');
    }
  }

  async function saveDogAttribution(code: string | null): Promise<boolean> {
    if (attributionBusy || !mounted.current) return false;
    setAttributionBusy(true);
    setAttributionMessage('');
    setAttributionMessageError(false);
    let outcome: DogAttributionWriteOutcome;
    try {
      outcome = await updateOwnedDogAttribution(client, dog.id, code);
      if (!mounted.current) return false;
      if (outcome.status === 'saved') {
        setDogAttribution(outcome.value);
        setAttributionState('ready');
        setAttributionMessage(outcome.value ? 'Kennelkopplingen är sparad.' : 'Kennelkopplingen är borttagen.');
        return true;
      }
      setAttributionMessage(outcome.status === 'unknown'
        ? 'Vi kunde inte bekräfta kennelkopplingen. Kontrollera den innan du försöker igen.'
        : 'Kennelkoden kunde inte sparas. Kontrollera koden och försök igen.');
      setAttributionMessageError(true);
      return false;
    } catch {
      if (mounted.current) {
        setAttributionMessage('Kennelkopplingen kunde inte sparas. Kontrollera anslutningen och försök igen.');
        setAttributionMessageError(true);
      }
      return false;
    } finally {
      if (mounted.current) setAttributionBusy(false);
    }
  }

  async function retryProfileStatus() {
    if (profileMutationInFlight.current) return;
    const mutation = pendingProfileMutation.current;
    if (!mutation) return;
    const isCurrent = () => mounted.current && profileLifetime.current === mutation.lifetime;
    if (!isCurrent()) return;
    profileMutationInFlight.current = true;
    setProfileBusy(true);
    setProfileMessage('Kontrollerar profilen…');
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
        setProfileMessage('Vi kunde inte kontrollera om profilen sparades. Försök igen när anslutningen fungerar.');
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
    const lifetime = logLifetime.current;
    loadMoreInFlight.current = true;
    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const next = await serializeEventRead(() => fetchDogEvents(client, dog.id, eventRows.current.length, PAGE_SIZE));
      if (!mounted.current || logLifetime.current !== lifetime) return;
      setLoadMoreError(false);
      const merged = [...eventRows.current, ...next.filter((row) => !eventRows.current.some((existing) => existing.id === row.id))];
      eventRows.current = merged;
      setEvents(merged);
      setHasMore(next.length === PAGE_SIZE);
    } catch {
      if (!mounted.current || logLifetime.current !== lifetime) return;
      setLoadMoreError(true);
    } finally {
      loadMoreInFlight.current = false;
      if (mounted.current) setLoadingMore(false);
    }
  }

  async function runLogMutation(mutation: PendingLogMutation, ownedFlightToken?: string) {
    const lifetime = mutation.lifetime;
    const isCurrent = () => isLogMutationLifetimeCurrent(lifetime, logLifetime.current, mounted.current);
    const flightToken = ownedFlightToken ?? ExpoCrypto.randomUUID();
    if (ownedFlightToken) {
      if (logMutationFlight.current?.token !== ownedFlightToken) return false;
    } else {
      const flight = startLogMutationFlight(logMutationFlight.current, lifetime, flightToken);
      if (!flight) return false;
      logMutationFlight.current = flight;
    }
    setLogBusy(true);
    setQuickLogMutation(toQuickLogMutationView(mutation, 'pending'));
    let outcome: WriteOutcome<DogEventRecord | null>;
    try {
      if (mutation.kind === 'insert') outcome = await insertDogEvent(client, mutation.operation);
      else if (mutation.kind === 'update') outcome = await updateDogEvent(client, dog.id, mutation.id, mutation.changes);
      else outcome = await deleteDogEvent(client, dog.id, mutation.id);
      if (!isCurrent()) return false;
      if (outcome.status === 'saved') {
        if (mutation.kind === 'insert') {
          const firstConfirmedLog = logState === 'ready' && eventRows.current.length === 0;
          void analyticsService.track(firstConfirmedLog ? 'first_log' : 'meaningful_return');
        }
        pendingLogMutation.current = null;
        if (mutation.kind === 'insert') {
          const confirmedEvent = outcome.value;
          if (confirmedEvent) {
            const localEvent = toLogEvent(confirmedEvent);
            const merged = [...eventRows.current.filter((event) => event.id !== localEvent.id), confirmedEvent].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.id.localeCompare(a.id));
            eventRows.current = merged;
            setEvents(merged);
          }
          setQuickLogMutation(toQuickLogMutationView(mutation, 'saved'));
        }
        if (mutation.kind === 'update') {
          if (outcome.value) {
            eventRows.current = [...eventRows.current.filter((event) => event.id !== mutation.id), outcome.value].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.id.localeCompare(a.id));
            setEvents(eventRows.current);
          }
          setQuickLogMutation(toQuickLogMutationView(mutation, 'saved'));
        }
        if (mutation.kind === 'delete' || mutation.kind === 'undo') {
          const remaining = eventRows.current.filter((event) => event.id !== mutation.id);
          eventRows.current = remaining;
          setEvents(remaining);
          setQuickLogMutation(toQuickLogMutationView(mutation, 'saved'));
        }
        try {
          await reloadEvents();
        } catch {
          // The confirmed local row remains authoritative until a later reload succeeds.
        }
        return isCurrent();
      }
      const presentationStatus = logMutationStatusForWriteOutcome(outcome.status);
      if (presentationStatus === 'unsure') {
        pendingLogMutation.current = mutation;
        setQuickLogMutation(toQuickLogMutationView(mutation, 'unsure'));
        return false;
      }
      pendingLogMutation.current = mutation;
      setQuickLogMutation(toQuickLogMutationView(mutation, 'failed'));
      return false;
    } catch {
      if (!isCurrent()) return false;
      pendingLogMutation.current = mutation;
      setQuickLogMutation(toQuickLogMutationView(mutation, 'unsure'));
      return false;
    } finally {
      const ownsFlight = logMutationFlight.current?.token === flightToken;
      logMutationFlight.current = finishLogMutationFlight(logMutationFlight.current, flightToken);
      if (pendingLogMutation.current === mutation && !isCurrent()) pendingLogMutation.current = null;
      if (mounted.current && ownsFlight) setLogBusy(false);
    }
  }

  function addEvent(type: LogEventType) {
    if (!canStartLogMutation(Boolean(pendingLogMutation.current), Boolean(logMutationFlight.current))) return;
    const operation: DogEventOperation = {
      id: ExpoCrypto.randomUUID(),
      dog_id: dog.id,
      event_type: type,
      occurred_at: new Date().toISOString(),
      duration_minutes: null,
      description: null,
    };
    const mutation: PendingLogMutation = { kind: 'insert', operation, lifetime: logLifetime.current };
    pendingLogMutation.current = mutation;
    void runLogMutation(mutation);
  }

  async function updateEvent(id: string, changes: LogEventChanges): Promise<boolean> {
    if (!canStartLogMutation(Boolean(pendingLogMutation.current), Boolean(logMutationFlight.current))) return false;
    const previous = eventRows.current.find((event) => event.id === id);
    if (!previous) return false;
    const type = changes.type ?? previous.event_type;
    const occurredAt = changes.occurredAt ?? previous.occurred_at;
    const mutation: PendingLogMutation = {
      kind: 'update', mutationId: ExpoCrypto.randomUUID(), id, type, occurredAt,
      changes: {
        event_type: type,
        occurred_at: occurredAt,
        duration_minutes: type === 'sleep' || type === 'walk' ? previous.duration_minutes : null,
        description: changes.note?.trim() || null,
      },
      lifetime: logLifetime.current,
    };
    pendingLogMutation.current = mutation;
    return runLogMutation(mutation);
  }

  async function deleteEvent(id: string, kind: 'delete' | 'undo' = 'delete'): Promise<boolean> {
    if (!canStartLogMutation(Boolean(pendingLogMutation.current), Boolean(logMutationFlight.current))) return false;
    const previous = eventRows.current.find((event) => event.id === id);
    if (!previous) return false;
    const mutation: PendingLogMutation = { kind, mutationId: ExpoCrypto.randomUUID(), id, type: previous.event_type, occurredAt: previous.occurred_at, lifetime: logLifetime.current };
    pendingLogMutation.current = mutation;
    return runLogMutation(mutation);
  }

  async function undoQuickLog(id: string) {
    const current = quickLogMutation;
    if (!current || current.kind !== 'add' || current.id !== id || current.status !== 'saved' || pendingLogMutation.current || logMutationFlight.current) return;
    await deleteEvent(id, 'undo');
  }

  function cancelLogMutation() {
    if (logMutationFlight.current || quickLogMutation?.status !== 'failed') return;
    const pending = pendingLogMutation.current;
    if (!pending || quickLogMutation.id !== (pending.kind === 'insert' ? pending.operation.id : pending.id)) return;
    pendingLogMutation.current = null;
    setQuickLogMutation(null);
  }

  async function retryLogMutation(): Promise<boolean> {
    const mutation = pendingLogMutation.current;
    if (mutation?.kind === 'insert') {
      const lifetime = mutation.lifetime;
      const flightToken = ExpoCrypto.randomUUID();
      const flight = startLogMutationFlight(logMutationFlight.current, lifetime, flightToken);
      if (!flight) return false;
      const isCurrent = () => isLogMutationLifetimeCurrent(lifetime, logLifetime.current, mounted.current);
      logMutationFlight.current = flight;
      setLogBusy(true);
      setQuickLogMutation(toQuickLogMutationView(mutation, 'pending'));
      try {
        const retryCheck = await checkInsertRetryOperation(mutation.operation, (id) => fetchDogEventById(client, dog.id, id));
        const found = retryCheck.found;
        if (!isCurrent()) return false;
        if (found) {
          pendingLogMutation.current = null;
          const merged = [...eventRows.current.filter((event) => event.id !== found.id), found].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.id.localeCompare(a.id));
          eventRows.current = merged;
          setEvents(merged);
          setQuickLogMutation(toQuickLogMutationView(mutation, 'saved'));
          try {
            await reloadEvents();
            if (!isCurrent()) return false;
          } catch {
            if (!isCurrent()) return false;
          }
          return true;
        }
        return await runLogMutation({ ...mutation, operation: retryCheck.operation }, flightToken);
      } catch {
        if (!isCurrent()) return false;
        setQuickLogMutation(toQuickLogMutationView(mutation, 'unsure'));
        return false;
      } finally {
        const ownsFlight = logMutationFlight.current?.token === flightToken;
        logMutationFlight.current = finishLogMutationFlight(logMutationFlight.current, flightToken);
        if (pendingLogMutation.current === mutation && !isCurrent()) pendingLogMutation.current = null;
        if (mounted.current && ownsFlight) setLogBusy(false);
      }
    } else if (mutation) return runLogMutation(mutation);
    else {
      const lifetime = logLifetime.current;
      try {
        await reloadEvents();
        if (!mounted.current || logLifetime.current !== lifetime) return false;
        return true;
      } catch {
        if (!mounted.current || logLifetime.current !== lifetime) return false;
        return false;
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
        setHealthMessage('Vi kunde inte kontrollera om viktändringen sparades. Kontrollera samma ändring innan du försöker igen.');
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
      setHealthMessage('Vi kunde inte kontrollera om viktändringen sparades. Kontrollera samma ändring innan du försöker igen.');
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
      setHealthMessage('Kontrollerar viktändringen…');
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
          setHealthMessage('Vi kunde inte kontrollera om viktändringen sparades. Försök igen när anslutningen fungerar.');
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
        setHealthHistoryMessage('Vi kunde inte kontrollera om hälsohändelsen sparades. Kontrollera samma ändring innan du försöker igen.');
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
      setHealthHistoryMessage('Vi kunde inte kontrollera om hälsohändelsen sparades. Kontrollera samma ändring innan du försöker igen.');
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
      setHealthHistoryMessage('Kontrollerar hälsohändelsen…');
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
          setHealthHistoryMessage('Vi kunde inte kontrollera om hälsohändelsen sparades. Försök igen när anslutningen fungerar.');
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
        setPlannedHealthMessage('Vi kunde inte kontrollera om planen sparades. Kontrollera samma ändring innan du försöker igen.');
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
      setPlannedHealthMessage('Vi kunde inte kontrollera om planen sparades. Kontrollera samma ändring innan du försöker igen.');
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
    setPlannedHealthMessage('Kontrollerar planen…');
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
        setPlannedHealthMessage('Vi kunde inte kontrollera om planen sparades. Försök igen när anslutningen fungerar.');
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
          void analyticsService.track('training_completed');
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
        ? 'Vi kunde inte kontrollera om steget sparades. Läs in programmet igen innan du försöker på nytt.'
        : outcome.status === 'unknown'
          ? 'Vi kunde inte bekräfta att steget sparades. Programmet har hämtats igen; om steget saknas kan du försöka på nytt.'
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
        setTrainingError('Alla genomförda steg kunde inte rensas. Kontrollera programmet och försök igen.');
      } catch {
        setTrainingState('error');
        setTrainingError('Vi kunde inte kontrollera om stegen rensades. Hämta programmet igen innan du ändrar det.');
      }
    } finally {
      trainingMutationInFlight.current = false;
      if (mounted.current) setBusyStepKey(null);
    }
  }

  async function handleAccountDeletion(): Promise<AccountDeleteResult> {
    const capturedSession = session;
    const ownerId = capturedSession?.user.id;
    const generation = accountGeneration;
    if (!ownerId || !capturedSession.access_token || accountDeleteInFlight.current || accountDeleteBusy) return { status: 'unavailable' };
    const isCurrent = () => mounted.current && isCurrentAccount(ownerId, generation);
    if (!isCurrent()) return { status: 'unavailable' };
    const unresolvedWrite = pendingLogMutation.current || pendingHealthMutation.current
      || pendingHealthHistoryMutation.current || pendingPlannedHealthMutation.current
      || pendingProfileMutation.current || logMutationFlight.current || healthMutationInFlight.current
      || healthHistoryMutationInFlight.current || plannedHealthMutationInFlight.current
      || profileMutationInFlight.current || trainingMutationInFlight.current || notificationBusy || attributionBusy || accountDeleteBusy;
    if (unresolvedWrite) {
      setAccountDeleteStatus('blocked');
      return { status: 'failed' };
    }

    accountDeleteInFlight.current = true;
    setAccountDeleteBusy(true);
    setAccountDeleteStatus('idle');
    setAccountDeleteCleanupFailed(false);
    setAccountDeleteSignOutFailed(false);
    let serverConfirmed = false;
    try {
      const result = await requestAccountDeletion(client, {
        ownerId,
        accessToken: capturedSession.access_token,
      }, isCurrent);
      if (!isCurrent()) return { status: 'unknown' };
      if (result.status !== 'confirmed') {
        setAccountDeleteStatus(result.status);
        return result;
      }

      serverConfirmed = true;
      accountDeletionInvalidated.current = true;
      reminderService.setActiveContext(null, null);
      setAccountDeleteStatus('confirmed');
      let cleanupFailed = false;
      try {
        if (!isCurrent()) return { status: 'confirmed' };
        await deleteNotificationPreferences(ownerId);
      } catch {
        cleanupFailed = true;
      }
      if (!isCurrent()) return { status: 'confirmed' };

      try {
        const remindersCleaned = await reminderService.cleanupOwner(ownerId);
        if (!remindersCleaned) cleanupFailed = true;
      } catch {
        cleanupFailed = true;
      }
      if (!isCurrent()) return { status: 'confirmed' };

      try { cleanupStalePassportFiles(); } catch { cleanupFailed = true; }
      if (cleanupFailed) reportDeletedAccountCleanupFailure(ownerId);
      setAccountDeleteCleanupFailed(cleanupFailed);

      const signedOut = await signOutCurrentAccountLocally(ownerId, generation);
      if (!signedOut && isCurrent()) setAccountDeleteSignOutFailed(true);
      return { status: 'confirmed' };
    } catch {
      if (serverConfirmed) {
        if (isCurrent()) {
          setAccountDeleteStatus('confirmed');
          setAccountDeleteCleanupFailed(true);
          reportDeletedAccountCleanupFailure(ownerId);
        }
        return { status: 'confirmed' };
      }
      if (isCurrent()) setAccountDeleteStatus('unknown');
      return { status: 'unknown' };
    } finally {
      accountDeleteInFlight.current = false;
      if (mounted.current && isCurrentAccount(ownerId, generation)) setAccountDeleteBusy(false);
    }
  }

  async function saveAnalyticsConsent(enabled: boolean): Promise<boolean> {
    const ownerId = session?.user.id;
    const generation = accountGeneration;
    if (!ownerId || analyticsOperationInFlight.current || !isCurrentAccount(ownerId, generation)) return false;
    analyticsOperationInFlight.current = true;
    setAnalyticsBusy(true);
    setAnalyticsError(false);
    try {
      const saved = await analyticsService.setConsent(enabled);
      if (!isCurrentAccount(ownerId, generation)) return false;
      if (saved) setAnalyticsConsent(enabled);
      else setAnalyticsError(true);
      return saved;
    } finally {
      analyticsOperationInFlight.current = false;
      if (isCurrentAccount(ownerId, generation)) setAnalyticsBusy(false);
    }
  }

  async function retryAnalyticsConsent(): Promise<void> {
    const ownerId = session?.user.id;
    const generation = accountGeneration;
    if (!ownerId || analyticsOperationInFlight.current || !isCurrentAccount(ownerId, generation)) return;
    analyticsOperationInFlight.current = true;
    setAnalyticsBusy(true);
    setAnalyticsError(false);
    try {
      const value = await analyticsService.getConsent();
      if (!isCurrentAccount(ownerId, generation)) return;
      setAnalyticsConsent(value);
      setAnalyticsError(value === null);
    } finally {
      analyticsOperationInFlight.current = false;
      if (isCurrentAccount(ownerId, generation)) setAnalyticsBusy(false);
    }
  }

  async function signOutDeletedLocally(): Promise<boolean> {
    const ownerId = session?.user.id;
    if (!ownerId || !isCurrentAccount(ownerId, accountGeneration)) return false;
    const generation = accountGeneration;
    const signedOut = await signOutCurrentAccountLocally(ownerId, generation);
    if (!signedOut && mounted.current && isCurrentAccount(ownerId, generation)) setAccountDeleteSignOutFailed(true);
    return signedOut;
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
  const transitionDirection = navigationDirection(previousPage.current, page);
  return <AppScreen scrollKey={page} footer={accountDeleteBusy || accountDeleteStatus === 'confirmed' || accountDeleteStatus === 'unknown' ? undefined : <BottomNav active={mainDestination(page)} onChange={setPage} />}>
    <MainSwipeNavigation enabled={MAIN_PAGES.includes(page)} onSwipe={(direction) => navigateMainPage(page, direction)}>
      <ScreenTransition transitionKey={page} direction={transitionDirection} axis="x">{pageContent}</ScreenTransition>
    </MainSwipeNavigation>
  </AppScreen>;

  function renderPage() {
    if (page === 'home') return <HomeScreen
      dog={dog}
      breed={breeds.find((breed) => breed.id === dog.breed_id)?.name ?? ''}
      events={displayEvents}
      plans={plannedHealth}
      logState={logState}
      planState={plannedHealthState}
      nextStep={nextStep?.title}
      content={visibleGuideContent}
      contentState={visibleContentState}
      onGo={setPage}
      onOpenContent={(contentId) => {
        setKnowledgeFocus({ selectionKey: currentSelectionKey, contentId, returnPage: 'home' });
        setPage('knowledge');
      }}
      onRetryContent={() => { void retryContent(); }}
    />;
    if (page === 'log') return <LogScreen events={displayEvents} onAdd={addEvent}
      onUpdate={updateEvent} onDelete={(id) => deleteEvent(id)} mode="cloud"
      layoutOwnerId={session?.user.id}
      loading={logState === 'loading'} loadError={logState === 'error'} onReload={() => { void retryEvents(); }}
      busy={logBusy} mutation={quickLogMutation} loadMoreError={loadMoreError} onRetry={retryLogMutation} onCancel={cancelLogMutation}
      onUndo={(id) => { void undoQuickLog(id); }} hasMore={hasMore} loadingMore={loadingMore}
      onLoadMore={() => { void loadMoreEvents(); }} />;
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
    }} signOutError={signOutError} signingOut={signingOut} onSignOut={confirmSignOut}
      onOpenNotifications={() => { setNotificationSaved(false); setPage('notification-settings'); }}
      onOpenAccount={() => setPage('account-settings')} />;
    if (page === 'account-settings') return <AccountSettingsScreen ownerId={session?.user.id ?? ''} onBack={() => setPage('more')}
      onOpenInformation={() => setPage('beta-info')} busy={accountDeleteBusy} status={accountDeleteStatus}
      localCleanupFailed={accountDeleteCleanupFailed} signOutFailed={accountDeleteSignOutFailed}
      analyticsConsent={analyticsConsent} analyticsBusy={analyticsBusy} analyticsError={analyticsError}
      onSetAnalyticsConsent={saveAnalyticsConsent}
      onRetryAnalyticsConsent={retryAnalyticsConsent}
      onDeleteAccount={handleAccountDeletion} onSignOutLocally={signOutDeletedLocally} />;
    if (page === 'beta-info') return <BetaInfoScreen onBack={() => setPage('account-settings')} />;
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
      plannedRecords={plannedHealth}
      plannedLoadState={plannedHealthState}
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
      attribution={dogAttribution} attributionState={attributionState} attributionBusy={attributionBusy}
      attributionMessage={attributionMessage} attributionMessageError={attributionMessageError}
      onBack={() => setPage('more')} onSave={saveDogProfile}
      onSaveAttribution={saveDogAttribution} onRetryAttribution={() => { void retryDogAttribution(); }}
      onRetryStatus={() => { void retryProfileStatus(); }} onAcceptCurrent={() => { void acceptCurrentProfile(); }} />;
    return <DogProfilePage dog={dog} onBack={() => setPage('more')} />;
  }

  function navigateMainPage(current: ProductPage, direction: 'left' | 'right') {
    const index = MAIN_PAGES.indexOf(current);
    if (index < 0) return;
    const nextIndex = direction === 'left' ? index + 1 : index - 1;
    const next = MAIN_PAGES[nextIndex];
    if (next) setPage(next);
  }
}

function navigationDirection(previous: ProductPage, current: ProductPage): 'forward' | 'backward' {
  const previousIndex = MAIN_PAGES.indexOf(previous);
  const currentIndex = MAIN_PAGES.indexOf(current);
  return currentIndex >= 0 && previousIndex >= 0 && currentIndex < previousIndex ? 'backward' : 'forward';
}

function MorePage({ onNavigate, signOutError, signingOut, onSignOut, onOpenNotifications, onOpenAccount }: {
  onNavigate: (page: ProductPage) => void; signOutError: boolean; signingOut: boolean; onSignOut: () => void;
  onOpenNotifications: () => void; onOpenAccount: () => void;
}) {
  return <View>
    <AppBar mode="Title" title="Mer" />
    <MenuRow icon="book-outline" title="Kunskap" detail="Guider och checklistor" onPress={() => onNavigate('knowledge')} />
    <MenuRow icon="id-card-outline" title="Tassla-pass" detail="Hundens uppgifter som PDF" onPress={() => onNavigate('passport')} />
    <MenuRow icon="paw-outline" title="Hundprofil" detail="Din hunds uppgifter" onPress={() => onNavigate('profile')} />
    <MenuRow icon="notifications-outline" title="Påminnelser" detail="Dina valda påminnelser" onPress={onOpenNotifications} />
    <MenuRow icon="person-circle-outline" title="Konto och support" detail="Information och kontohantering" onPress={onOpenAccount} />
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

function mainDestination(page: ProductPage): BottomNavDestination {
  if (page === 'planned-health') return 'health';
  return page === 'home' || page === 'log' || page === 'training' || page === 'health' ? page : 'more';
}

function reminderStatusSummary(result: ReminderReconcileResult | null, preferences: NotificationPreferences, permission: 'unknown' | 'granted' | 'denied'): string {
  if (!preferences.enabled) return 'Påminnelser av på den här enheten. Sparade planval finns kvar.';
  if (permission === 'denied' || result?.status === 'permission-denied') return 'Enheten nekar notiser; Tassla fungerar ändå.';
  if (result?.status === 'unknown') return 'Vi kunde inte kontrollera om en plan sparades. Påminnelsen väntar tills du har kontrollerat ändringen.';
  if (result?.status === 'failed') return 'Påminnelserna kunde inte stämmas av.';
  if (result?.status === 'over-cap') return 'Schemalagda högst 40 planer och en träningspåminnelse. Ytterligare planer schemaläggs inte.';
  if (result?.status === 'scheduled') return result.scheduledCount + ' lokala påminnelser schemalagda i ' + result.timezone + '. Schemaläggning är ingen leveransbekräftelse.';
  return 'Påminnelsernas status kontrolleras.';
}

function toLogEvent(row: DogEventRecord): LogEvent {
  return { id: row.id, dogId: row.dog_id, type: row.event_type, occurredAt: row.occurred_at, note: row.description, origin: 'local-test' };
}

function toQuickLogMutationView(mutation: PendingLogMutation, status: QuickLogMutationView['status']): QuickLogMutationView {
  return mutation.kind === 'insert'
    ? { kind: 'add', mutationId: mutation.operation.id, id: mutation.operation.id, type: mutation.operation.event_type, occurredAt: mutation.operation.occurred_at, status }
    : { kind: mutation.kind, mutationId: mutation.mutationId, id: mutation.id, type: mutation.type, occurredAt: mutation.occurredAt, status };
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

const styles = StyleSheet.create({
  cardEyebrow: { color: theme.colors.accent, ...tokens.typography.caption, marginBottom: tokens.spacing.sm },
  menuRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: theme.radius.button, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, marginBottom: 10 },
  menuCopy: { flex: 1 },
  menuTitle: { color: theme.colors.text, ...tokens.typography.label },
  menuDetail: { color: theme.colors.mutedText, ...tokens.typography.caption, marginTop: tokens.spacing.xs },
  profileCard: { borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, padding: 18, borderColor: theme.colors.border, borderWidth: 1 },
  profileValue: { color: theme.colors.text, ...tokens.typography.label, marginBottom: tokens.spacing.lg },
  pressed: { opacity: 0.72 },
});
