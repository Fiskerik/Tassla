import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '../../components/ui/Button';
import { useFonts } from 'expo-font';
import * as ExpoCrypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppScreen, MessageCard, PageHeading, PrimaryButton } from '../../components/AppPrimitives';
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
  fetchUpcomingPlannedHealth,
  normalizePlannedHealthTime,
  fetchFuturePlannedHealthReminders,
  fetchPlannedHealthById,
  fetchHomeContent,
  fetchTrainingWorkspace,
  isValidHealthWeightDate,
  isValidHealthWeightKg,
  isValidHealthHistoryDate,
  isValidHealthHistoryTime,
  isValidPlannedHealthDate,
  normalizeHealthHistoryDescription,
  normalizePlannedHealthDescription,
  insertDogEvent,
  matchesDogEventOperation,
  insertHealthWeight,
  insertHealthHistory,
  insertPlannedHealth,
  insertTrainingProgress,
  updateDogEvent,
  updateHealthWeight,
  updateHealthHistory,
  updatePlannedHealth,
  workspaceSnapshotReadDecision,
  type DogEventOperation,
  type DogEventChanges,
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
  type UpcomingPlannedHealthRecord,
  type PlannedHealthType,
  type PublishedTrainingProgram,
  type PausedTrainingProgress,
  type WriteOutcome,
} from '../../data/workspace-data';
import {
  addRoutineToDay,
  addTrainingSelection,
  createDailyRoutine,
  deleteDailyRoutine,
  fetchDailyActivitySnapshot,
  fetchUpcomingDailyRoutineSchedules,
  fetchWeeklyActivitySnapshot,
  removeRoutineFromDay,
  removeTrainingSelection,
  replaceDailyRoutine,
  setRoutineDayCompletion,
  type DailyActivitySnapshot,
  type DailyRoutine,
  type DailyRoutineSchedule,
  type DailyRoutineChecklistItem,
  type DailyRoutineCreateInput,
  type DailyRoutineDay,
  type DailyRoutineDayDraft,
  type DailyRoutineRepeatValues,
  type DailyTrainingSelection,
  type WeeklyActivitySnapshot,
} from './daily-activity-data';
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
import { automaticDogAge, localDate } from '../onboarding/dog';
import { homeAgeInWeeks } from './home-today';
import { HealthScreen, type HealthHistoryConfirmation } from '../health/HealthScreen';
import { PlannedHealthScreen } from '../health/PlannedHealthScreen';
import { EditDogProfileScreen } from '../onboarding/EditDogProfileScreen';
import { filterScopedValue, matchesAttributionPostimage, resolveAttributionReadback, sameAttributionScope, type AttributionReadbackToken, type AttributionScope, type KennelAttributionIntent, type ScopedValue } from '../onboarding/profile-draft';
import { DogProfileScreen } from '../onboarding/DogProfileScreen';
import { KnowledgeScreen } from '../knowledge/KnowledgeScreen';
import { checklistMemoryScope, keepChecklistMemoryForScope, updateChecklistMemory, type PendingChecklistMemory } from '../knowledge/checklist-intent';
import { checklistReadCacheScope, clearChecklistReadCache, keepChecklistReadCacheForScope } from '../knowledge/checklist-data';
import { CHECKLIST_DESTINATION_ID, FAQ_DESTINATION_ID, REVIEW_TRAINING_GUIDES, REVIEW_TRAINING_PROGRAMS } from '../knowledge/review-content';
import { HomeScreen, type HomeDailyTrainingOption } from './HomeScreen';
import { ADULT_APPROVED_DAILY_TRAINING_VERSION_IDS, dateKeysForIsoWeek, deriveHomeDailyActivities, isDailyActivityDateCurrent, isDailyActivitySnapshotWritable, isValidIanaTimeZone, isWeeklyActivityResponseCurrent, isoWeekStartForDateKey, localDateKeyAt, nextSelectableTrainingStep, projectWeeklyActivity, runDailyActivityActionIfWritable, runDailyActivityMutationGateway, scheduleDailyActivitySnapshotExpiry, weeklyActivityLifetimeKey, type DailyMutationOrigin, type WeeklyActivityProjection } from './daily-activity-model';
import { activeMainTabDestination, isMainTabDestination, mainTabTransitionDirection, nextMainTabDestination, requestMainTabNavigation } from './main-navigation';
import { BottomNav, MainSwipeNavigation } from '../../components/ui';
import { ScreenTransition } from '../../components/ui/Motion';
import { LogScreen, type QuickLogMutationView } from '../puppy-log/LogScreen';
import { canStartLogMutation, checkInsertRetryOperation, finishLogMutationFlight, isCanonicalAccidentKinds, isLogMutationLifetimeCurrent, logMutationStatusForWriteOutcome, retainLogMutationFlightForLifetime, startLogMutationFlight, type AccidentKind, type AccidentLogIntent, type LogEvent, type LogEventChanges, type LogEventType, type LogMutationFlight } from '../puppy-log/log-model';
import { PassportScreen } from '../passport/PassportScreen';
import { PublishedTrainingScreen } from '../training/PublishedTrainingScreen';
import { DailyChecklistScreen } from './DailyChecklistScreen';
import { useAuth } from '../account/AuthProvider';
import { NotificationSettingsScreen } from '../notifications/NotificationSettingsScreen';
import { AccountSettingsScreen } from '../account/AccountSettingsScreen';
import { BetaInfoScreen } from '../account/BetaInfoScreen';
import { MoreScreen } from '../more/MoreScreen';
import { requestAccountDeletion, type AccountDeleteResult } from '../account/account-delete';
import { createAnalyticsService } from '../../analytics/analytics-service';
import { deleteFirstUseTipStatus, deleteNotificationPreferences } from '../../notifications/notification-storage';
import { cleanupStalePassportFiles } from '../passport/passport-export';
import { futureFireTimeForPlan, parseReminderPayload, type NotificationPreferences } from '../../notifications/notification-model';
import { reminderService, type ReminderContext, type ReminderReconcileResult } from '../../notifications/notification-service';

const reviewContentEnabled = process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true';

type ProductPage = 'home' | 'checklist' | 'log' | 'training' | 'more' | 'health' | 'planned-health' | 'knowledge' | 'passport' | 'profile' | 'notification-settings' | 'account-settings' | 'beta-info';
type PendingLogMutation =
  | { kind: 'insert'; operation: DogEventOperation; lifetime: string }
  | { kind: 'update'; mutationId: string; id: string; type: LogEventType; occurredAt: string; changes: DogEventChanges; lifetime: string }
  | { kind: 'delete' | 'undo'; mutationId: string; id: string; type: LogEventType; occurredAt: string; lifetime: string };
type PendingHealthMutation =
  | { kind: 'insert'; operation: HealthWeightOperation }
  | { kind: 'update'; id: string; previous: HealthWeightRecord; changes: HealthWeightChanges }
  | { kind: 'delete'; id: string; previous: HealthWeightRecord };
type PendingHealthHistoryMutation =
  | { kind: 'insert'; operation: HealthHistoryOperation; lifetime: string }
  | { kind: 'update'; id: string; eventType: HealthHistoryType; previous: Pick<HealthHistoryRecord, 'id' | 'dog_id' | 'event_type' | 'occurred_on' | 'occurred_time' | 'description'>; changes: HealthHistoryChanges; lifetime: string }
  | { kind: 'delete'; id: string; eventType: HealthHistoryType; previous: Pick<HealthHistoryRecord, 'id' | 'dog_id' | 'event_type' | 'occurred_on' | 'occurred_time' | 'description'>; lifetime: string };
type PendingPlannedHealthMutation =
  | { kind: 'insert'; operation: PlannedHealthOperation; lifetime: string }
  | { kind: 'update'; id: string; previous: PlannedHealthRecord; changes: PlannedHealthChanges; localToday: string; lifetime: string }
  | { kind: 'delete'; id: string; previous: PlannedHealthRecord; lifetime: string };
type PendingProfileMutation = { previous: OwnedDog; changes: OwnedDogProfileChanges; knownBreeds: readonly BreedOption[]; lifetime: string };
type AttributionSnapshot = { value: OwnedDogAttribution | null; state: 'loading' | 'ready' | 'error'; message: string; messageError: boolean };
type AttributionOperation = AttributionReadbackToken & { kind: 'write' | 'read' };

const PAGE_SIZE = 40;
const WORKSPACE_REFRESH_AFTER_MS = 60_000;
type TrainingWorkspaceSnapshot = Awaited<ReturnType<typeof fetchTrainingWorkspace>>;
type WorkspaceResourceFlight<T> = { scope: string; generation: number; controller: AbortController; promise: Promise<T> };
type UpcomingLoadSnapshot<T> = { scope: string; state: 'loading' | 'ready' | 'error'; rows: T[] };
type EditorLeaveRequest = (commit: () => void) => void;

export function ProductWorkspace({ client, dog, onDogUpdated }: { client: SupabaseClient; dog: OwnedDog; onDogUpdated?: (updated: OwnedDog) => void }) {
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const [navigation, setNavigation] = useState<{ page: ProductPage; previousPage: ProductPage }>({ page: 'home', previousPage: 'home' });
  const { page, previousPage } = navigation;
  const currentPageRef = useRef<ProductPage>(page);
  const [openingUpcomingPlan, setOpeningUpcomingPlan] = useState<{ scope: string; planId: string; generation: number } | null>(null);
  const [upcomingPlanOpenFailure, setUpcomingPlanOpenFailure] = useState<{ scope: string; generation: number; message: string } | null>(null);
  const upcomingPlanReadGeneration = useRef(0);
  const [trainingEntry, setTrainingEntry] = useState<{ programVersionId: string | null; stepId: string | null; scope: string; returnPage: 'home' | 'checklist' | 'week'; returnWeekDateKey?: string } | null>(null);
  const [homeTrainingTargetFeedback, setHomeTrainingTargetFeedback] = useState<{ activityId: string; message: string } | null>(null);
  const setPage = useCallback((nextPage: ProductPage) => {
    const currentPage = currentPageRef.current;
    if (currentPage === nextPage) return;
    if (currentPage === 'checklist' && nextPage !== 'checklist') {
      upcomingPlanReadGeneration.current += 1;
      setOpeningUpcomingPlan(null);
      setUpcomingPlanOpenFailure(null);
    }
    currentPageRef.current = nextPage;
    setNavigation((current) => current.page === nextPage
      ? current
      : { page: nextPage, previousPage: current.page });
  }, []);
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
  const [knowledgeDetailOpen, setKnowledgeDetailOpen] = useState(false);
  const editorLeaveGuard = useRef<{ owner: symbol; requestLeave: EditorLeaveRequest } | null>(null);
  const registerEditorLeaveGuard = useCallback((owner: symbol, requestLeave: EditorLeaveRequest) => {
    editorLeaveGuard.current = { owner, requestLeave };
    return () => { if (editorLeaveGuard.current?.owner === owner) editorLeaveGuard.current = null; };
  }, []);
  const commitMainTabNavigation = useCallback((destination: ProductPage) => {
    if (destination !== 'checklist') setTrainingEntry(null);
    const enteringKnowledge = page !== 'knowledge' && destination === 'knowledge';
    const leavingKnowledge = page === 'knowledge' && destination !== 'knowledge';
    if (enteringKnowledge || leavingKnowledge) {
      setKnowledgeFocus(null);
      setKnowledgeDetailOpen(false);
    }
    setPage(destination);
  }, [page, setPage]);
  const navigateMainTab = useCallback((destination: ProductPage) => {
    if (activeMainTabDestination(page) === destination) return;
    requestMainTabNavigation(page, destination, (commit) => {
      const guard = editorLeaveGuard.current;
      if (guard) guard.requestLeave(commit);
      else commit();
    }, commitMainTabNavigation);
  }, [commitMainTabNavigation, page]);
  const handleMainSwipe = useCallback((direction: 'left' | 'right') => {
    const destination = nextMainTabDestination(page, direction);
    if (destination) navigateMainTab(destination);
  }, [navigateMainTab, page]);
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
  const [healthHistoryConfirmation, setHealthHistoryConfirmation] = useState<HealthHistoryConfirmation | null>(null);
  const [plannedHealth, setPlannedHealth] = useState<PlannedHealthRecord[]>([]);
  const plannedHealthRows = useRef<PlannedHealthRecord[]>([]);
  const selectedUpcomingPlan = useRef<{ record: PlannedHealthRecord; lifetime: string; accountGeneration: number } | null>(null);
  const [plannedHealthState, setPlannedHealthState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [plannedHealthEntry, setPlannedHealthEntry] = useState<{ origin: 'health' } | { origin: 'checklist'; scope: string; selectedPlanId: string } | null>(null);
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
  const [attributionSnapshot, setAttributionSnapshot] = useState<ScopedValue<AttributionSnapshot> | null>(null);
  const [attributionIntent, setAttributionIntent] = useState<KennelAttributionIntent | null>(null);
  const [attributionOperation, setAttributionOperation] = useState<AttributionOperation | null>(null);
  const [training, setTraining] = useState<{ programs: PublishedTrainingProgram[]; paused: PausedTrainingProgress[] }>({ programs: [], paused: [] });
  const [trainingState, setTrainingState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [trainingSelectionKey, setTrainingSelectionKey] = useState<string | null>(null);
  const [trainingError, setTrainingError] = useState('');
  const [busyStepKey, setBusyStepKey] = useState<string | null>(null);
  const [dailySnapshot, setDailySnapshot] = useState<DailyActivitySnapshot | null>(null);
  const [dailyTrainingSnapshot, setDailyTrainingSnapshot] = useState<TrainingWorkspaceSnapshot | null>(null);
  const [dailySnapshotLifetime, setDailySnapshotLifetime] = useState('');
  const [dailySnapshotUpdatedAt, setDailySnapshotUpdatedAt] = useState<number | null>(null);
  const [dailyState, setDailyState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dailyStateLifetime, setDailyStateLifetime] = useState('');
  const [dailyRefreshing, setDailyRefreshing] = useState(false);
  const [dailyRefreshError, setDailyRefreshError] = useState(false);
  const [weeklySnapshot, setWeeklySnapshot] = useState<WeeklyActivitySnapshot | null>(null);
  const [weeklySnapshotLifetime, setWeeklySnapshotLifetime] = useState('');
  const [weeklyState, setWeeklyState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [weeklyStateLifetime, setWeeklyStateLifetime] = useState('');
  const [weeklyRetryToken, setWeeklyRetryToken] = useState(0);
  const [weeklyDaySelection, setWeeklyDaySelection] = useState<{ scopeKey: string; dateKey: string } | null>(null);
  const [checklistTabSelection, setChecklistTabSelection] = useState<{ scopeKey: string; tab: 'Idag' | 'Denna vecka' | 'Alla' | 'Kommande' } | null>(null);
  const [upcomingHealthSnapshot, setUpcomingHealthSnapshot] = useState<UpcomingLoadSnapshot<UpcomingPlannedHealthRecord> | null>(null);
  const [upcomingRoutineSnapshot, setUpcomingRoutineSnapshot] = useState<UpcomingLoadSnapshot<DailyRoutineSchedule> | null>(null);
  const [upcomingHealthRetryToken, setUpcomingHealthRetryToken] = useState(0);
  const [upcomingRoutineRetryToken, setUpcomingRoutineRetryToken] = useState(0);
  const weeklyReadGeneration = useRef(0);
  const weeklyRequestScopeRef = useRef('');
  const upcomingHealthGeneration = useRef(0);
  const upcomingRoutineGeneration = useRef(0);
  const upcomingHealthController = useRef<AbortController | null>(null);
  const upcomingRoutineController = useRef<AbortController | null>(null);
  const upcomingScopeRef = useRef('');
  const [dailyClock, setDailyClock] = useState(() => new Date());
  const [dailyBusyKey, setDailyBusyKey] = useState<string | null>(null);
  const [dailyMessageKey, setDailyMessageKey] = useState('');
  const [dailyMessage, setDailyMessage] = useState('');
  const [dailyMessageError, setDailyMessageError] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const signOutInFlight = useRef(false);
  const pendingLogMutation = useRef<PendingLogMutation | null>(null);
  const logMutationFlight = useRef<LogMutationFlight | null>(null);
  const pendingHealthMutation = useRef<PendingHealthMutation | null>(null);
  const healthMutationInFlight = useRef(false);
  const pendingHealthHistoryMutation = useRef<PendingHealthHistoryMutation | null>(null);
  const healthHistoryConfirmationSequence = useRef(0);
  const healthHistoryMutationInFlight = useRef(false);
  const healthHistoryFlightToken = useRef<object | null>(null);
  const pendingPlannedHealthMutation = useRef<PendingPlannedHealthMutation | null>(null);
  const plannedHealthMutationInFlight = useRef(false);
  const plannedHealthFlightToken = useRef<object | null>(null);
  const attributionIntentRef = useRef<KennelAttributionIntent | null>(null);
  const attributionOperationRef = useRef<AttributionOperation | null>(null);
  const attributionReadTokenRef = useRef<AttributionReadbackToken | null>(null);
  const attributionOperationId = useRef(0);
  const pendingProfileMutation = useRef<PendingProfileMutation | null>(null);
  const profileMutationInFlight = useRef(false);
  const trainingMutationInFlight = useRef(false);
  const dailyGeneration = useRef(0);
  const dailyMutationInFlight = useRef(false);
  const trainingSnapshotRef = useRef<{ scope: string; value: TrainingWorkspaceSnapshot; updatedAt: number } | null>(null);
  const trainingReadFlight = useRef<WorkspaceResourceFlight<TrainingWorkspaceSnapshot> | null>(null);
  const dailySnapshotRef = useRef<{ scope: string; daily: DailyActivitySnapshot; training: TrainingWorkspaceSnapshot; dailyUpdatedAt: number } | null>(null);
  const dailyReadFlight = useRef<WorkspaceResourceFlight<boolean> | null>(null);
  const dailyRoutineWriteGateRef = useRef<{
    expectedScope: string;
    snapshotScope: string;
    updatedAt: number | null;
    ready: boolean;
    refreshing: boolean;
    refreshError: boolean;
  } | null>(null);
  const pendingDailyRetry = useRef<{ lifetime: string; key: string; origin: DailyMutationOrigin; status: 'failed' | 'unknown'; run: () => Promise<WriteOutcome<unknown>> } | null>(null);
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
  }), [client]);

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
  useEffect(() => {
    if (page !== 'home' && page !== 'checklist' && page !== 'training') return undefined;
    const refreshClock = () => setDailyClock(new Date());
    const interval = setInterval(refreshClock, 30_000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refreshClock(); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [page]);
  const currentHealthHistoryLifetime = JSON.stringify([session?.user.id ?? '', accountGeneration, dog.id]);
  const currentAttributionScope = useMemo<AttributionScope>(() => ({ ownerId: session?.user.id ?? '', accountGeneration, dogId: dog.id }), [session?.user.id, accountGeneration, dog.id]);
  const currentAttributionScopeRef = useRef(currentAttributionScope);
  const previousAttributionScope = useRef(currentAttributionScope);
  const isCurrentAttributionScope = useCallback((scope: AttributionScope) => mounted.current
    && !accountDeletionInvalidated.current
    && sameAttributionScope(scope, currentAttributionScopeRef.current), []);
  useLayoutEffect(() => {
    currentAttributionScopeRef.current = currentAttributionScope;
    if (!sameAttributionScope(previousAttributionScope.current, currentAttributionScope)) {
      const currentIntent = attributionIntentRef.current;
      if (currentIntent && !sameAttributionScope(currentIntent, currentAttributionScope)) {
        attributionIntentRef.current = null;
        setAttributionIntent(null);
      }
      if (attributionOperationRef.current && !sameAttributionScope(attributionOperationRef.current, currentAttributionScope)) {
        attributionOperationRef.current = null;
        setAttributionOperation(null);
      }
      if (attributionReadTokenRef.current && !sameAttributionScope(attributionReadTokenRef.current, currentAttributionScope)) {
        attributionReadTokenRef.current = null;
      }
      setAttributionSnapshot((current) => current && sameAttributionScope(current.scope, currentAttributionScope) ? current : null);
    }
    previousAttributionScope.current = currentAttributionScope;
  }, [currentAttributionScope]);
  const visibleAttributionSnapshot = filterScopedValue(attributionSnapshot, currentAttributionScope);
  const visibleAttributionIntent = attributionIntent && sameAttributionScope(attributionIntent, currentAttributionScope) ? attributionIntent : null;
  const visibleAttributionOperation = attributionOperation && sameAttributionScope(attributionOperation, currentAttributionScope) ? attributionOperation : null;
  const dogAttribution = visibleAttributionSnapshot?.value ?? null;
  const attributionState = visibleAttributionSnapshot?.state ?? 'loading';
  const attributionBusy = Boolean(visibleAttributionOperation);
  const attributionMessage = visibleAttributionSnapshot?.message ?? '';
  const attributionMessageError = visibleAttributionSnapshot?.messageError ?? false;
  const currentLogLifetime = `${dog.id}:${session?.user.id ?? ''}`;
  const healthHistoryLifetime = useRef('');
  const logLifetime = useRef('');
  const previousHealthHistoryLifetime = useRef('');
  const previousLogLifetime = useRef('');
  const currentPlannedHealthLifetime = `${dog.id}:${session?.user.id ?? ''}`;
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
    if (selectedUpcomingPlan.current && (selectedUpcomingPlan.current.lifetime !== currentPlannedHealthLifetime
      || selectedUpcomingPlan.current.accountGeneration !== accountGeneration)) selectedUpcomingPlan.current = null;
  }, [accountGeneration, currentPlannedHealthLifetime]);
  const currentProfileLifetime = `${dog.id}:${session?.user.id ?? ''}`;
  const profileLifetime = useRef('');
  const previousProfileLifetime = useRef('');
  const contentGeneration = useRef(0);
  const trainingGeneration = useRef(0);
  const homeToday = localDate();
  // An unknown date has no age-based content selection and must not crash Home.
  const age = homeAgeInWeeks(dog.birth_date, homeToday);
  const currentSelectionKey = `${session?.user.id ?? 'signed-out'}:${accountGeneration}:${dog.id}:${dog.breed_id}:${age ?? 'unknown-age'}:${reviewContentEnabled ? 'review' : 'public'}`;
  const dailyTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const validDailyTimeZone = isValidIanaTimeZone(dailyTimeZone);
  const dailyDateKey = validDailyTimeZone ? localDateKeyAt(dailyClock, dailyTimeZone) : null;
  const currentDailyLifetime = `${session?.user.id ?? 'signed-out'}:${accountGeneration}:${currentSelectionKey}:${dailyDateKey ?? 'invalid-date'}:${dailyTimeZone}:${reviewContentEnabled ? 'review' : 'public'}`;
  const dailyLifetime = useRef('');
  const dailyWeekStart = dailyDateKey ? isoWeekStartForDateKey(dailyDateKey) : null;
  const dailyWeekDates = dailyWeekStart ? dateKeysForIsoWeek(dailyWeekStart) ?? [] : [];
  const weeklyUiScopeKey = JSON.stringify([session?.user.id ?? '', accountGeneration, dog.id, dailyWeekStart, dailyTimeZone, reviewContentEnabled ? 'review' : 'public']);
  const checklistUiScopeKey = JSON.stringify([weeklyUiScopeKey, dailyDateKey]);
  const upcomingScopeKey = JSON.stringify([session?.user.id ?? '', accountGeneration, dog.id, dailyDateKey, dailyTimeZone]);
  const upcomingScopeUnavailable = !session?.user.id || !dailyDateKey || !validDailyTimeZone;
  const upcomingHealthState = upcomingScopeUnavailable ? 'error' : upcomingHealthSnapshot?.scope === upcomingScopeKey ? upcomingHealthSnapshot.state : 'loading';
  const upcomingHealthPlans = !upcomingScopeUnavailable && upcomingHealthSnapshot?.scope === upcomingScopeKey ? upcomingHealthSnapshot.rows : [];
  const upcomingRoutineState = upcomingScopeUnavailable ? 'error' : upcomingRoutineSnapshot?.scope === upcomingScopeKey ? upcomingRoutineSnapshot.state : 'loading';
  const upcomingRoutineSchedules = !upcomingScopeUnavailable && upcomingRoutineSnapshot?.scope === upcomingScopeKey ? upcomingRoutineSnapshot.rows : [];
  const openingUpcomingPlanId = openingUpcomingPlan?.scope === upcomingScopeKey ? openingUpcomingPlan.planId : null;
  const upcomingPlanOpenError = upcomingPlanOpenFailure?.scope === upcomingScopeKey ? upcomingPlanOpenFailure.message : '';
  const weeklyLifetime = weeklyActivityLifetimeKey({ ownerId: session?.user.id ?? null, accountGeneration, dogId: dog.id,
    currentDateKey: dailyDateKey, weekStart: dailyWeekStart, timeZone: dailyTimeZone,
    dailySnapshotUpdatedAt: dailySnapshotLifetime === currentDailyLifetime ? dailySnapshotUpdatedAt : null,
    contentMode: reviewContentEnabled ? 'review' : 'public' });
  const weeklyRequestScope = JSON.stringify([weeklyLifetime, page, weeklyRetryToken]);
  const selectedWeeklyDateKey = weeklyDaySelection?.scopeKey === weeklyUiScopeKey && dailyWeekDates.includes(weeklyDaySelection.dateKey)
    ? weeklyDaySelection.dateKey : dailyDateKey;
  const checklistInitialTab = checklistTabSelection?.scopeKey === checklistUiScopeKey ? checklistTabSelection.tab : 'Idag';
  const checklistTabRef = useRef(checklistInitialTab);
  useLayoutEffect(() => {
    currentPageRef.current = page;
  }, [page]);
  useLayoutEffect(() => { checklistTabRef.current = checklistInitialTab; }, [checklistInitialTab]);
  useLayoutEffect(() => { weeklyRequestScopeRef.current = weeklyRequestScope; }, [weeklyRequestScope]);
  useLayoutEffect(() => {
    upcomingScopeRef.current = upcomingScopeKey;
    upcomingPlanReadGeneration.current += 1;
  }, [upcomingScopeKey]);
  const checklistMemory = useRef<{ scope: string; state: PendingChecklistMemory } | null>(null);
  const [checklistMemoryView, setChecklistMemoryView] = useState<{ scope: string; state: PendingChecklistMemory } | null>(null);
  const currentChecklistMemoryScope = checklistMemoryScope(session?.user.id ?? null, accountGeneration, dog.id);
  const currentChecklistReadScope = checklistReadCacheScope(`${session?.user.id ?? 'signed-out'}:${accountGeneration}`, dog.id, reviewContentEnabled);
  useLayoutEffect(() => {
    keepChecklistReadCacheForScope(currentChecklistReadScope);
    checklistMemory.current = keepChecklistMemoryForScope(checklistMemory.current, currentChecklistMemoryScope);
    setChecklistMemoryView(checklistMemory.current);
  }, [currentChecklistMemoryScope, currentChecklistReadScope]);
  useEffect(() => () => clearChecklistReadCache(currentChecklistReadScope), [currentChecklistReadScope]);
  const currentSelectionKeyRef = useRef(currentSelectionKey);
  const previousTrainingLifetime = useRef(currentSelectionKey);

  useLayoutEffect(() => {
    currentSelectionKeyRef.current = currentSelectionKey;
    if (previousTrainingLifetime.current !== currentSelectionKey) {
      trainingGeneration.current += 1;
      trainingReadFlight.current?.controller.abort();
      trainingReadFlight.current = null;
      trainingSnapshotRef.current = null;
      setTraining({ programs: [], paused: [] });
      setTrainingSelectionKey(null);
      setTrainingState('loading');
      setTrainingError('');
    }
    previousTrainingLifetime.current = currentSelectionKey;
  }, [currentSelectionKey]);

  useLayoutEffect(() => {
    if (dailyLifetime.current && dailyLifetime.current !== currentDailyLifetime) {
      dailyGeneration.current += 1;
      dailyReadFlight.current?.controller.abort();
      dailyReadFlight.current = null;
      dailySnapshotRef.current = null;
      setDailySnapshot(null);
      setDailyTrainingSnapshot(null);
      setDailySnapshotLifetime('');
      setDailySnapshotUpdatedAt(null);
      setDailyState('loading');
      setDailyStateLifetime(currentDailyLifetime);
      setDailyRefreshing(false);
      setDailyRefreshError(false);
      pendingDailyRetry.current = null;
      setDailyMessage('');
      setDailyMessageError(false);
      setHomeTrainingTargetFeedback(null);
    }
    dailyLifetime.current = currentDailyLifetime;
  }, [currentDailyLifetime]);

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

  const preserveSelectedUpcomingPlan = useCallback((rows: PlannedHealthRecord[]): PlannedHealthRecord[] => {
    const selected = selectedUpcomingPlan.current;
    if (!selected || selected.lifetime !== currentPlannedHealthLifetime || selected.accountGeneration !== accountGeneration
      || selected.record.dog_id !== dog.id || rows.some((row) => row.id === selected.record.id)) return rows;
    return [...rows, selected.record].sort((left, right) => left.due_on.localeCompare(right.due_on) || left.id.localeCompare(right.id));
  }, [accountGeneration, currentPlannedHealthLifetime, dog.id]);

  const reloadPlannedHealth = useCallback(async (lifetime = plannedHealthLifetime.current, signal?: AbortSignal) => {
    const rows = await serializePlannedHealthRead(() => fetchPlannedHealth(client, dog.id, undefined, signal));
    if (!mounted.current || signal?.aborted || plannedHealthLifetime.current !== lifetime) return;
    const visibleRows = preserveSelectedUpcomingPlan(rows);
    plannedHealthRows.current = visibleRows;
    setPlannedHealth(visibleRows);
    setPlannedHealthState('ready');
  }, [client, dog.id, preserveSelectedUpcomingPlan, serializePlannedHealthRead]);

  async function openUpcomingPlannedHealth(planId: string) {
    const scope = upcomingScopeKey;
    const localToday = dailyDateKey;
    if (!localToday || !session?.user.id || currentPageRef.current !== 'checklist' || checklistTabRef.current !== 'Kommande') return;
    const generation = ++upcomingPlanReadGeneration.current;
    setOpeningUpcomingPlan({ scope, planId, generation });
    setUpcomingPlanOpenFailure(null);
    const isCurrent = () => mounted.current && generation === upcomingPlanReadGeneration.current
      && upcomingScopeRef.current === scope && plannedHealthLifetime.current === currentPlannedHealthLifetime
      && currentPageRef.current === 'checklist' && checklistTabRef.current === 'Kommande';
    try {
      const record = await fetchPlannedHealthById(client, dog.id, planId);
      if (!isCurrent()) return;
      if (!record || record.dog_id !== dog.id || record.id !== planId || record.due_on <= localToday) {
        setUpcomingPlanOpenFailure({ scope, generation, message: 'Planen kunde inte bekräftas. Uppdatera listan och försök igen.' });
        return;
      }
      selectedUpcomingPlan.current = { record, lifetime: currentPlannedHealthLifetime, accountGeneration };
      const rows = [record, ...plannedHealthRows.current.filter((row) => row.id !== record.id)]
        .sort((left, right) => left.due_on.localeCompare(right.due_on) || left.id.localeCompare(right.id));
      plannedHealthRows.current = rows;
      setPlannedHealth(rows);
      setPlannedHealthState('ready');
      setPlannedHealthEntry({ origin: 'checklist', scope, selectedPlanId: record.id });
      setUpcomingPlanOpenFailure(null);
      setPage('planned-health');
    } catch {
      if (isCurrent()) setUpcomingPlanOpenFailure({ scope, generation, message: 'Planen kunde inte öppnas. Försök igen.' });
    } finally {
      if (generation === upcomingPlanReadGeneration.current) setOpeningUpcomingPlan(null);
    }
  }

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

  const reloadTraining = useCallback(async (options: { force?: boolean; supersede?: boolean; publishToDaily?: boolean; deferCommit?: boolean } = {}): Promise<TrainingWorkspaceSnapshot> => {
    const { force = false, supersede = false, publishToDaily = false, deferCommit = false } = options;
    const scope = currentSelectionKey;
    const cached = trainingSnapshotRef.current;
    const hasSnapshot = cached?.scope === scope;
    const existing = trainingReadFlight.current;
    const decision = workspaceSnapshotReadDecision({
      scope,
      cacheScope: cached?.scope,
      cachedAt: cached?.updatedAt,
      inFlightScope: existing?.scope,
      now: Date.now(),
      maxAgeMs: WORKSPACE_REFRESH_AFTER_MS,
      force,
      supersede,
    });
    if (decision === 'cache' && cached) return cached.value;
    if (decision === 'join' && existing?.scope === scope) return existing.promise;
    if (existing && supersede) {
      existing.controller.abort();
      if (trainingReadFlight.current === existing) trainingReadFlight.current = null;
    }
    if (supersede) {
      dailyGeneration.current += 1;
      dailyReadFlight.current?.controller.abort();
      dailyReadFlight.current = null;
      setDailyRefreshing(false);
    }
    const generation = ++trainingGeneration.current;
    const controller = new AbortController();
    if (!hasSnapshot) {
      setTrainingSelectionKey(scope);
      setTrainingState('loading');
    }
    setTrainingError('');
    let promise: Promise<TrainingWorkspaceSnapshot>;
    promise = fetchTrainingWorkspace(client, dog, age, undefined, controller.signal).then((result) => {
      const visibleResult = reviewContentEnabled && result.programs.length === 0
        ? { programs: [...REVIEW_TRAINING_PROGRAMS], paused: [] } : result;
      if (!mounted.current || controller.signal.aborted || trainingGeneration.current !== generation
        || currentSelectionKeyRef.current !== scope) return visibleResult;
      if (deferCommit) return visibleResult;
      const updatedAt = Date.now();
      trainingSnapshotRef.current = { scope, value: visibleResult, updatedAt };
      setTraining(visibleResult);
      setTrainingSelectionKey(scope);
      setTrainingState('ready');
      setTrainingError('');
      if (publishToDaily && dailySnapshotRef.current?.scope === currentDailyLifetime) {
        dailySnapshotRef.current = { ...dailySnapshotRef.current, training: visibleResult };
        setDailyTrainingSnapshot(visibleResult);
      }
      return visibleResult;
    }).catch((error: unknown) => {
      const current = mounted.current && !controller.signal.aborted && trainingGeneration.current === generation
        && currentSelectionKeyRef.current === scope;
      if (current) {
        if (trainingSnapshotRef.current?.scope === scope) {
          setTrainingState('ready');
          setTrainingError('Programmen kunde inte uppdateras. Du ser senast hämtade program.');
        } else {
          setTraining({ programs: [], paused: [] });
          setTrainingSelectionKey(scope);
          setTrainingState('error');
          setTrainingError('Publicerat träningsinnehåll kunde inte hämtas. Inga exempelprogram visas.');
        }
      }
      throw error;
    }).finally(() => {
      if (trainingReadFlight.current?.promise === promise) trainingReadFlight.current = null;
    });
    trainingReadFlight.current = { scope, generation, controller, promise };
    return promise;
  }, [age, client, currentDailyLifetime, currentSelectionKey, dog]);

  const reloadDailyActivity = useCallback(async (force = false, supersede = false): Promise<boolean> => {
    const scope = currentDailyLifetime;
    if (!dailyDateKey || !validDailyTimeZone) {
      setDailyState('error');
      setDailyStateLifetime(scope);
      setDailyRefreshError(false);
      return false;
    }
    const cached = dailySnapshotRef.current;
    const trainingCached = trainingSnapshotRef.current;
    const hasSnapshot = cached?.scope === scope;
    const readNow = Date.now();
    const isFresh = hasSnapshot && readNow >= cached.dailyUpdatedAt && readNow - cached.dailyUpdatedAt < WORKSPACE_REFRESH_AFTER_MS
      && trainingCached?.scope === currentSelectionKey
      && readNow >= trainingCached.updatedAt && readNow - trainingCached.updatedAt < WORKSPACE_REFRESH_AFTER_MS;
    const existing = dailyReadFlight.current;
    const decision = workspaceSnapshotReadDecision({
      scope,
      cacheScope: cached?.scope,
      cachedAt: cached?.dailyUpdatedAt,
      inFlightScope: existing?.scope,
      now: Date.now(),
      maxAgeMs: WORKSPACE_REFRESH_AFTER_MS,
      cacheValid: isFresh,
      force,
      supersede,
    });
    if (decision === 'cache') return true;
    if (decision === 'join' && existing?.scope === scope) return existing.promise;
    if (existing && supersede) {
      existing.controller.abort();
      if (dailyReadFlight.current === existing) dailyReadFlight.current = null;
    }
    if (supersede) {
      trainingReadFlight.current?.controller.abort();
      trainingReadFlight.current = null;
      trainingGeneration.current += 1;
    }
    if (dailyRoutineWriteGateRef.current?.expectedScope === scope) {
      dailyRoutineWriteGateRef.current = { ...dailyRoutineWriteGateRef.current, refreshing: true, refreshError: false };
    }
    const generation = ++dailyGeneration.current;
    const controller = new AbortController();
    if (!hasSnapshot) {
      setDailyState('loading');
      setDailyStateLifetime(scope);
    }
    setDailyRefreshing(true);
    setDailyRefreshError(false);
    const trainingPromise = reloadTraining({ force, deferCommit: true });
    const trainingRevision = trainingGeneration.current;
    let promise: Promise<boolean>;
    promise = Promise.allSettled([
      trainingPromise,
      fetchDailyActivitySnapshot(client, dog.id, dailyDateKey, dailyTimeZone, controller.signal),
    ]).then(([trainingResult, dailyResult]) => {
      if (!mounted.current || controller.signal.aborted || generation !== dailyGeneration.current
        || trainingRevision !== trainingGeneration.current || dailyLifetime.current !== scope
        || currentSelectionKeyRef.current !== currentSelectionKey) return false;
      if (trainingResult.status === 'fulfilled' && dailyResult.status === 'fulfilled') {
        const trainingUpdatedAt = Date.now();
        trainingSnapshotRef.current = { scope: currentSelectionKey, value: trainingResult.value, updatedAt: trainingUpdatedAt };
        setTraining(trainingResult.value);
        setTrainingSelectionKey(currentSelectionKey);
        setTrainingState('ready');
        setTrainingError('');
        const dailyUpdatedAt = Math.max(Date.now(), (dailySnapshotRef.current?.dailyUpdatedAt ?? 0) + 1);
        dailySnapshotRef.current = { scope, daily: dailyResult.value, training: trainingResult.value, dailyUpdatedAt };
        dailyRoutineWriteGateRef.current = { expectedScope: scope, snapshotScope: scope, updatedAt: dailyUpdatedAt,
          ready: true, refreshing: true, refreshError: false };
        setDailySnapshot(dailyResult.value);
        setDailyTrainingSnapshot(trainingResult.value);
        setDailySnapshotLifetime(scope);
        setDailySnapshotUpdatedAt(dailyUpdatedAt);
        setDailyState('ready');
        setDailyStateLifetime(scope);
        setDailyRefreshError(false);
        const unresolvedDailyRetry = pendingDailyRetry.current?.lifetime === scope ? pendingDailyRetry.current : null;
        if (unresolvedDailyRetry) {
          setDailyMessage(unresolvedDailyRetry.status === 'unknown'
            ? 'Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.'
            : 'Ändringen sparades inte. Kontrollera anslutningen och försök igen.');
          setDailyMessageError(true);
        } else {
          setDailyMessage('');
          setDailyMessageError(false);
        }
        return true;
      }
      if (hasSnapshot) {
        if (dailyRoutineWriteGateRef.current?.expectedScope === scope) {
          dailyRoutineWriteGateRef.current = { ...dailyRoutineWriteGateRef.current, refreshing: true, refreshError: true };
        }
        setDailyRefreshError(true);
      } else {
        if (dailyRoutineWriteGateRef.current?.expectedScope === scope) {
          dailyRoutineWriteGateRef.current = { ...dailyRoutineWriteGateRef.current, ready: false, refreshing: true, refreshError: true };
        }
        setDailySnapshot(null);
        setDailyTrainingSnapshot(null);
        setDailySnapshotLifetime('');
        setDailySnapshotUpdatedAt(null);
        setDailyState('error');
        setDailyStateLifetime(scope);
        if (trainingResult.status === 'fulfilled') {
          trainingSnapshotRef.current = { scope: currentSelectionKey, value: trainingResult.value, updatedAt: Date.now() };
          setTraining(trainingResult.value);
          setTrainingSelectionKey(currentSelectionKey);
          setTrainingState('ready');
        }
      }
      return false;
    }).finally(() => {
      if (dailyReadFlight.current?.promise === promise) dailyReadFlight.current = null;
      if (mounted.current && generation === dailyGeneration.current && dailyLifetime.current === scope) {
        setDailyRefreshing(false);
        if (dailyRoutineWriteGateRef.current?.expectedScope === scope) {
          dailyRoutineWriteGateRef.current = { ...dailyRoutineWriteGateRef.current, refreshing: false };
        }
      }
    });
    dailyReadFlight.current = { scope, generation, controller, promise };
    return promise;
  }, [client, currentDailyLifetime, currentSelectionKey, dailyDateKey, dailyTimeZone, dog.id, reloadTraining, validDailyTimeZone]);

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
        if (plan && plan.id === payload.planId && plan.dog_id.toLowerCase() === context.dogId) {
          selectedUpcomingPlan.current = null;
          setPlannedHealthEntry({ origin: 'health' });
          setPage('planned-health');
        }
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
  }, [client, setPage]);

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
      const visibleRows = preserveSelectedUpcomingPlan(rows);
      plannedHealthRows.current = visibleRows;
      setPlannedHealth(visibleRows);
      setPlannedHealthState('ready');
    }).catch(() => {
      if (!controller.signal.aborted && mounted.current && plannedHealthLifetime.current === planLifetime) setPlannedHealthState('error');
    });
    return () => {
      mounted.current = false;
      attributionReadTokenRef.current = null;
      attributionOperationRef.current = null;
      attributionIntentRef.current = null;
      controller.abort();
      trainingReadFlight.current?.controller.abort();
      dailyReadFlight.current?.controller.abort();
    };
  }, [client, currentHealthHistoryLifetime, currentPlannedHealthLifetime, currentProfileLifetime, dog.id, preserveSelectedUpcomingPlan, serializeEventRead, serializeHealthRead, serializeHealthHistoryRead, serializePlannedHealthRead]);

  useEffect(() => {
    const scope = upcomingScopeKey;
    const generation = ++upcomingHealthGeneration.current;
    upcomingHealthController.current?.abort();
    const controller = new AbortController();
    upcomingHealthController.current = controller;
    if (!upcomingScopeUnavailable) {
      void fetchUpcomingPlannedHealth(client, dog.id, dailyDateKey, undefined, controller.signal).then((rows) => {
        if (controller.signal.aborted || !mounted.current || generation !== upcomingHealthGeneration.current || upcomingScopeRef.current !== scope) return;
        setUpcomingHealthSnapshot({ scope, state: 'ready', rows });
      }).catch(() => {
        if (!controller.signal.aborted && mounted.current && generation === upcomingHealthGeneration.current && upcomingScopeRef.current === scope) {
          setUpcomingHealthSnapshot((current) => ({ scope, state: 'error', rows: current?.scope === scope ? current.rows : [] }));
        }
      });
    }
    return () => {
      controller.abort();
      if (upcomingHealthController.current === controller) upcomingHealthController.current = null;
    };
  }, [accountGeneration, client, dailyDateKey, dailyTimeZone, dog.id, upcomingHealthRetryToken, upcomingScopeKey, upcomingScopeUnavailable]);

  useEffect(() => {
    const scope = upcomingScopeKey;
    const generation = ++upcomingRoutineGeneration.current;
    upcomingRoutineController.current?.abort();
    const controller = new AbortController();
    upcomingRoutineController.current = controller;
    if (!upcomingScopeUnavailable) {
      void fetchUpcomingDailyRoutineSchedules(client, dog.id, controller.signal).then((rows) => {
        if (controller.signal.aborted || !mounted.current || generation !== upcomingRoutineGeneration.current || upcomingScopeRef.current !== scope) return;
        setUpcomingRoutineSnapshot({ scope, state: 'ready', rows });
      }).catch(() => {
        if (!controller.signal.aborted && mounted.current && generation === upcomingRoutineGeneration.current && upcomingScopeRef.current === scope) {
          setUpcomingRoutineSnapshot((current) => ({ scope, state: 'error', rows: current?.scope === scope ? current.rows : [] }));
        }
      });
    }
    return () => {
      controller.abort();
      if (upcomingRoutineController.current === controller) upcomingRoutineController.current = null;
    };
  }, [accountGeneration, client, dailyDateKey, dailyTimeZone, dog.id, upcomingRoutineRetryToken, upcomingScopeKey, upcomingScopeUnavailable]);

  useEffect(() => {
    const scope = currentAttributionScope;
    if (!isCurrentAttributionScope(scope)) return undefined;
    const token: AttributionReadbackToken = { ...scope, operationId: ++attributionOperationId.current };
    attributionReadTokenRef.current = token;
    void fetchOwnedDogAttribution(client, scope.dogId).then((value) => {
      if (!isCurrentAttributionScope(scope) || attributionReadTokenRef.current !== token) return;
      setAttributionSnapshot((current) => {
        if (!isCurrentAttributionScope(scope) || attributionReadTokenRef.current !== token) return current;
        return { scope, value: { value, state: 'ready', message: '', messageError: false } };
      });
    }).catch(() => {
      if (!isCurrentAttributionScope(scope) || attributionReadTokenRef.current !== token) return;
      setAttributionSnapshot((current) => {
        if (!isCurrentAttributionScope(scope) || attributionReadTokenRef.current !== token) return current;
        return { scope, value: { value: null, state: 'error', message: '', messageError: false } };
      });
    });
    return () => { if (attributionReadTokenRef.current === token) attributionReadTokenRef.current = null; };
  }, [client, currentAttributionScope, isCurrentAttributionScope]);

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

    return () => controller.abort();
  }, [age, client, currentSelectionKey, dog]);

  useEffect(() => {
    if (page !== 'home' && page !== 'checklist' && page !== 'training') return;
    const refresh = setTimeout(() => { void reloadDailyActivity(); }, 0);
    return () => clearTimeout(refresh);
  }, [currentDailyLifetime, page, reloadDailyActivity]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || (page !== 'home' && page !== 'checklist' && page !== 'training')) return;
      void reloadDailyActivity();
      if (page === 'checklist') setWeeklyRetryToken((token) => token + 1);
    });
    return () => subscription.remove();
  }, [page, reloadDailyActivity]);

  useEffect(() => {
    if (page !== 'checklist' || !dailyWeekStart || !validDailyTimeZone) return undefined;
    const scope = weeklyRequestScope;
    const generation = ++weeklyReadGeneration.current;
    const controller = new AbortController();
    const responseIsCurrent = () => isWeeklyActivityResponseCurrent(
      { generation, scopeKey: scope, aborted: controller.signal.aborted },
      { generation: weeklyReadGeneration.current, scopeKey: weeklyRequestScopeRef.current, mounted: mounted.current },
    );
    void fetchWeeklyActivitySnapshot(client, dog.id, dailyWeekStart, controller.signal).then((snapshot) => {
      if (!responseIsCurrent()) return;
      setWeeklySnapshot(snapshot);
      setWeeklySnapshotLifetime(weeklyLifetime);
      setWeeklyStateLifetime(scope);
      setWeeklyState('ready');
    }).catch(() => {
      if (!responseIsCurrent()) return;
      setWeeklyStateLifetime(scope);
      setWeeklyState('error');
    });
    return () => {
      controller.abort();
      if (generation === weeklyReadGeneration.current) weeklyReadGeneration.current += 1;
    };
  }, [client, dailyWeekStart, dog.id, page, validDailyTimeZone, weeklyLifetime, weeklyRequestScope]);

  const visibleContent = contentSelectionKey === currentSelectionKey ? content : [];
  const visibleContentState = contentSelectionKey === currentSelectionKey ? contentState : 'loading';
  const visibleTrainingState = trainingSelectionKey === currentSelectionKey ? trainingState : 'loading';
  const dailyStateForView = dailyStateLifetime === currentDailyLifetime ? dailyState : 'loading';
  const dailySnapshotForView = dailySnapshotLifetime === currentDailyLifetime ? dailySnapshot : null;
  const dailyTrainingForView = dailySnapshotLifetime === currentDailyLifetime ? dailyTrainingSnapshot : null;
  const weeklyStateForView = weeklyStateLifetime === weeklyRequestScope ? weeklyState : 'loading';
  const weeklySnapshotForView = weeklySnapshotLifetime === weeklyLifetime ? weeklySnapshot : null;
  const weeklyProjection: WeeklyActivityProjection | null = weeklyStateForView === 'ready' && weeklySnapshotForView && dailyWeekStart && dailyDateKey
    ? projectWeeklyActivity({ snapshot: weeklySnapshotForView, weekStart: dailyWeekStart, currentDateKey: dailyDateKey, dogId: dog.id,
      timeZone: dailyTimeZone, dailySnapshot: dailySnapshotForView, dailyState: dailyStateForView,
      programs: dailyTrainingForView?.programs.filter((program) => !program.id.startsWith('review-v1:training:')) ?? [],
      trainingState: dailyStateForView === 'ready' && !dailyRefreshError && dailyTrainingForView ? 'ready' : dailyStateForView === 'loading' ? 'loading' : 'error',
      lifeStage: automaticDogAge(dog.birth_date, dailyDateKey)?.stage ?? null,
      adultApprovedVersionIds: ADULT_APPROVED_DAILY_TRAINING_VERSION_IDS }) : null;
  const dailyRoutineWriteGate = {
    expectedScope: currentDailyLifetime,
    snapshotScope: dailySnapshotForView ? dailySnapshotLifetime : '',
    updatedAt: dailySnapshotLifetime === currentDailyLifetime ? dailySnapshotUpdatedAt : null,
    ready: dailyStateForView === 'ready' && dailySnapshotForView !== null,
    refreshing: dailyRefreshing,
    refreshError: dailyRefreshError,
  };
  useLayoutEffect(() => {
    dailyRoutineWriteGateRef.current = {
      expectedScope: currentDailyLifetime,
      snapshotScope: dailyRoutineWriteGate.snapshotScope,
      updatedAt: dailyRoutineWriteGate.updatedAt,
      ready: dailyRoutineWriteGate.ready,
      refreshing: dailyRoutineWriteGate.refreshing,
      refreshError: dailyRoutineWriteGate.refreshError,
    };
  }, [currentDailyLifetime, dailyRoutineWriteGate.snapshotScope, dailyRoutineWriteGate.updatedAt,
    dailyRoutineWriteGate.ready, dailyRoutineWriteGate.refreshing, dailyRoutineWriteGate.refreshError]);
  const hasDailyActivityReadInFlight = useCallback((scope: string) => dailyReadFlight.current?.scope === scope
    || (currentSelectionKeyRef.current === currentSelectionKey && trainingReadFlight.current?.scope === currentSelectionKey), [currentSelectionKey]);
  const dailyRoutineTemplatesWritable = isDailyActivitySnapshotWritable({ ...dailyRoutineWriteGate, now: dailyClock.getTime(),
    maxAgeMs: WORKSPACE_REFRESH_AFTER_MS, sameScopeReadInFlight: dailyRefreshing });
  const isDailyRoutineTemplatesWritableNow = useCallback((scope = currentDailyLifetime, expectedSnapshotVersion?: number | null) => {
    const gate = dailyRoutineWriteGateRef.current;
    if (!gate || scope !== currentDailyLifetime || scope !== dailyLifetime.current || gate.expectedScope !== scope
      || currentSelectionKeyRef.current !== currentSelectionKey
      || (expectedSnapshotVersion !== undefined && gate.updatedAt !== expectedSnapshotVersion)) return false;
    return runDailyActivityActionIfWritable({ ...gate, expectedScope: scope, now: Date.now(), maxAgeMs: WORKSPACE_REFRESH_AFTER_MS,
      sameScopeReadInFlight: hasDailyActivityReadInFlight(scope) }, () => true).allowed;
  }, [currentDailyLifetime, currentSelectionKey, hasDailyActivityReadInFlight]);
  const guardDailyAllAction = useCallback((scope = currentDailyLifetime, expectedSnapshotVersion?: number | null) => {
    if (scope === currentDailyLifetime && scope === dailyLifetime.current
      && !isDailyActivityDateCurrent(dailyDateKey, Date.now(), dailyTimeZone)) {
      setDailyClock(new Date());
      return false;
    }
    const liveGate = dailyRoutineWriteGateRef.current;
    if (expectedSnapshotVersion !== undefined && liveGate?.expectedScope === scope
      && liveGate.updatedAt !== expectedSnapshotVersion) {
      setDailyMessage('Listan har uppdaterats. Stäng och öppna rutinmallarna igen innan du ändrar.');
      setDailyMessageError(false);
      return false;
    }
    if (isDailyRoutineTemplatesWritableNow(scope, expectedSnapshotVersion)) return true;
    if (scope === dailyLifetime.current && scope === currentDailyLifetime) {
      setDailyClock(new Date());
      setDailyMessage('Dagens rutinmallar behöver uppdateras innan du kan ändra dem.');
      setDailyMessageError(false);
      const flight = dailyReadFlight.current;
      if (flight?.scope === scope) void flight.promise;
      else void reloadDailyActivity();
    }
    return false;
  }, [currentDailyLifetime, dailyDateKey, dailyTimeZone, isDailyRoutineTemplatesWritableNow, reloadDailyActivity]);
  useEffect(() => {
    if (page !== 'checklist' || !dailyRoutineWriteGate.ready || dailyRoutineWriteGate.expectedScope !== currentDailyLifetime
      || !dailyRoutineWriteGate.updatedAt) return undefined;
    return scheduleDailyActivitySnapshotExpiry({ updatedAt: dailyRoutineWriteGate.updatedAt, maxAgeMs: WORKSPACE_REFRESH_AFTER_MS,
      now: Date.now, setTimer: (callback, delay) => setTimeout(callback, delay), clearTimer: (timer) => clearTimeout(timer),
      onExpired: () => {
        if (dailyClock.getTime() < dailyRoutineWriteGate.updatedAt! + WORKSPACE_REFRESH_AFTER_MS) setDailyClock(new Date());
        if (dailyLifetime.current === currentDailyLifetime) void reloadDailyActivity();
      } });
  }, [currentDailyLifetime, dailyClock, dailyRoutineWriteGate.expectedScope, dailyRoutineWriteGate.ready, dailyRoutineWriteGate.updatedAt, isDailyRoutineTemplatesWritableNow, page, reloadDailyActivity]);
  const dailyLifeStage = automaticDogAge(dog.birth_date, dailyDateKey ?? homeToday)?.stage ?? null;
  const dailyActivities = dailyStateForView === 'ready' && dailySnapshotForView && dailyTrainingForView && dailyDateKey
    ? deriveHomeDailyActivities(dailySnapshotForView, dailyTrainingForView.programs.filter((program) => !program.id.startsWith('review-v1:training:')), dog.id, dailyDateKey, dailyLifeStage, ADULT_APPROVED_DAILY_TRAINING_VERSION_IDS)
    : [];
  const selectedTrainingKeys = new Set(dailySnapshotForView?.trainingSelections.map((row) => `${row.program_version_id}:${row.step_id}`) ?? []);
  const dailyTrainingOptions: HomeDailyTrainingOption[] = dailyStateForView === 'ready' && dailyDateKey
    ? (dailyTrainingForView?.programs ?? []).filter((program) => !program.id.startsWith('review-v1:training:')).flatMap((program) => {
      const step = nextSelectableTrainingStep(program);
      if (!step || selectedTrainingKeys.has(`${program.id}:${step.id}`)) return [];
      return [{ programId: program.content_id, versionId: program.id, stepId: step.id, programTitle: program.title, stepTitle: step.title }];
    })
    : [];
  const publishedGuides = visibleContent.filter((item) => item.contentType !== 'training_program');
  const hasReviewTraining = reviewContentEnabled && visibleTrainingState === 'ready'
    && training.programs.some((program) => program.id.startsWith('review-v1:training:'));
  const visibleGuideContent = hasReviewTraining && visibleContentState === 'ready'
    ? [...publishedGuides, ...REVIEW_TRAINING_GUIDES.filter((guide) => !publishedGuides.some((item) => item.id === guide.id))]
    : publishedGuides;
  const focusedKnowledgeContentId = knowledgeFocus?.selectionKey === currentSelectionKey
    && (visibleGuideContent.some((item) => item.id === knowledgeFocus.contentId)
      || knowledgeFocus.contentId === CHECKLIST_DESTINATION_ID || knowledgeFocus.contentId === FAQ_DESTINATION_ID)
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

  function isCurrentAttributionOperation(token: AttributionOperation): boolean {
    const active = attributionOperationRef.current;
    return isCurrentAttributionScope(token)
      && Boolean(active)
      && sameAttributionScope(active, token)
      && active!.operationId === token.operationId
      && active!.kind === token.kind;
  }

  function setAttributionSnapshotForOperation(token: AttributionOperation, value: AttributionSnapshot): boolean {
    if (!isCurrentAttributionOperation(token)) return false;
    setAttributionSnapshot((current) => {
      if (!isCurrentAttributionOperation(token)) return current;
      return { scope: token, value };
    });
    return true;
  }

  function finishAttributionOperation(token: AttributionOperation): void {
    if (!isCurrentAttributionOperation(token)) return;
    attributionOperationRef.current = null;
    setAttributionOperation((current) => current && sameAttributionScope(current, token)
      && current.operationId === token.operationId && current.kind === token.kind ? null : current);
  }

  function beginAttributionOperation(scope: AttributionScope, kind: AttributionOperation['kind']): AttributionOperation | null {
    if (!isCurrentAttributionScope(scope)) return null;
    const active = attributionOperationRef.current;
    if (active && sameAttributionScope(active, scope)) return null;
    attributionReadTokenRef.current = null;
    const token: AttributionOperation = { ...scope, operationId: ++attributionOperationId.current, kind };
    attributionOperationRef.current = token;
    setAttributionOperation(token);
    return token;
  }

  function replaceAttributionIntent(expected: KennelAttributionIntent | null, next: KennelAttributionIntent | null): boolean {
    const current = attributionIntentRef.current;
    if (expected ? current !== expected : current !== null) return false;
    if (next && !isCurrentAttributionScope(next)) return false;
    attributionIntentRef.current = next;
    setAttributionIntent(next);
    return true;
  }

  async function retryDogAttribution(): Promise<void> {
    const scope = currentAttributionScopeRef.current;
    const existingIntent = attributionIntentRef.current;
    if (existingIntent && !sameAttributionScope(existingIntent, scope)) return;
    const operation = beginAttributionOperation(scope, 'read');
    if (!operation) return;
    const intent = existingIntent && sameAttributionScope(existingIntent, scope) ? existingIntent : null;
    const readbackToken: AttributionReadbackToken = intent
      ? { ownerId: intent.ownerId, accountGeneration: intent.accountGeneration, dogId: intent.dogId, operationId: intent.operationId }
      : { ownerId: operation.ownerId, accountGeneration: operation.accountGeneration, dogId: operation.dogId, operationId: operation.operationId };
    if (intent) replaceAttributionIntent(intent, { ...intent, status: 'unknown' });
    setAttributionSnapshot((current) => isCurrentAttributionOperation(operation)
      ? { scope: operation, value: { value: current && sameAttributionScope(current.scope, scope) ? current.value.value : null, state: 'loading', message: '', messageError: false } }
      : current);
    try {
      const value = await fetchOwnedDogAttribution(client, scope.dogId);
      if (!isCurrentAttributionOperation(operation)) return;
      if (intent) {
        const currentIntent = attributionIntentRef.current;
        const resolution = resolveAttributionReadback(currentIntent, readbackToken, currentAttributionScopeRef.current, value);
        if (resolution.status === 'stale') return;
        replaceAttributionIntent(currentIntent, resolution.intent);
        setAttributionSnapshotForOperation(operation, {
          value: resolution.value,
          state: 'ready',
          message: resolution.status === 'confirmed'
            ? value ? 'Kennelkopplingen är sparad.' : 'Kennelkopplingen är borttagen.'
            : '',
          messageError: false,
        });
      } else {
        setAttributionSnapshotForOperation(operation, { value, state: 'ready', message: '', messageError: false });
      }
    } catch {
      if (!isCurrentAttributionOperation(operation)) return;
      const currentIntent = attributionIntentRef.current;
      if (intent && currentIntent && currentIntent.operationId === intent.operationId && sameAttributionScope(currentIntent, scope)) {
        replaceAttributionIntent(currentIntent, { ...currentIntent, status: 'unknown' });
      }
      setAttributionSnapshotForOperation(operation, {
        value: null,
        state: 'error',
        message: 'Kennelkopplingen kunde inte kontrolleras. Försök igen.',
        messageError: true,
      });
    } finally {
      finishAttributionOperation(operation);
    }
  }

  function acceptCurrentDogAttribution(operationId: number): void {
    const scope = currentAttributionScopeRef.current;
    const intent = attributionIntentRef.current;
    if (!intent || !sameAttributionScope(intent, scope) || intent.operationId !== operationId || intent.status !== 'mismatch') return;
    const snapshot = attributionSnapshot;
    if (!snapshot || !sameAttributionScope(snapshot.scope, scope) || snapshot.value.state !== 'ready') return;
    replaceAttributionIntent(intent, null);
  }

  async function saveDogAttribution(code: string | null): Promise<boolean> {
    const scope = currentAttributionScopeRef.current;
    if (!scope.ownerId || attributionIntentRef.current || !mounted.current) return false;
    const operation = beginAttributionOperation(scope, 'write');
    if (!operation) return false;
    const attemptedCode = code?.trim().toUpperCase() || null;
    setAttributionSnapshot((current) => isCurrentAttributionOperation(operation) && current && sameAttributionScope(current.scope, scope)
      ? { scope, value: { ...current.value, message: '', messageError: false } }
      : current);
    try {
      const outcome: DogAttributionWriteOutcome = await updateOwnedDogAttribution(client, scope.dogId, attemptedCode);
      if (!isCurrentAttributionOperation(operation)) return false;
      if (outcome.status === 'saved' && matchesAttributionPostimage(attemptedCode, outcome.value)) {
        setAttributionSnapshotForOperation(operation, {
          value: outcome.value,
          state: 'ready',
          message: outcome.value ? 'Kennelkopplingen är sparad.' : 'Kennelkopplingen är borttagen.',
          messageError: false,
        });
        return true;
      }
      if (outcome.status === 'unknown' || outcome.status === 'saved') {
        replaceAttributionIntent(null, { ...scope, attemptedCode, operationId: operation.operationId, status: 'unknown' });
        setAttributionSnapshotForOperation(operation, {
          value: dogAttribution,
          state: 'ready',
          message: '',
          messageError: false,
        });
        return false;
      }
      setAttributionSnapshotForOperation(operation, {
        value: dogAttribution,
        state: 'ready',
        message: 'Kennelkoden kunde inte sparas. Kontrollera koden och försök igen.',
        messageError: true,
      });
      return false;
    } catch {
      setAttributionSnapshotForOperation(operation, {
        value: dogAttribution,
        state: 'ready',
        message: 'Kennelkopplingen kunde inte sparas. Kontrollera anslutningen och försök igen.',
        messageError: true,
      });
      return false;
    } finally {
      finishAttributionOperation(operation);
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

  function addEvent(type: LogEventType, accidentIntent?: AccidentLogIntent) {
    if (!canStartLogMutation(Boolean(pendingLogMutation.current), Boolean(logMutationFlight.current))) return;
    if (type === 'accident' && (!accidentIntent || !isCanonicalAccidentKinds(accidentIntent.accidentKinds))) return;
    if (type !== 'accident' && accidentIntent) return;
    const operation: DogEventOperation = {
      id: accidentIntent?.id ?? ExpoCrypto.randomUUID(),
      dog_id: dog.id,
      event_type: type,
      occurred_at: accidentIntent?.occurredAt ?? new Date().toISOString(),
      duration_minutes: null,
      description: null,
      accident_kinds: type === 'accident' ? accidentIntent?.accidentKinds ?? null : null,
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
    const accidentKinds = type !== 'accident' ? null
      : changes.accidentKinds !== undefined ? changes.accidentKinds === null ? null : [...changes.accidentKinds]
        : previous.event_type === 'accident' ? previous.accident_kinds : ['pee'] as AccidentKind[];
    if (type === 'accident' && (accidentKinds === null
      ? previous.event_type !== 'accident' || previous.accident_kinds !== null
      : !isCanonicalAccidentKinds(accidentKinds))) return false;
    const mutation: PendingLogMutation = {
      kind: 'update', mutationId: ExpoCrypto.randomUUID(), id, type, occurredAt,
      changes: {
        event_type: type,
        occurred_at: occurredAt,
        duration_minutes: type === 'sleep' || type === 'walk' ? previous.duration_minutes : null,
        description: changes.note?.trim() || null,
        accident_kinds: accidentKinds,
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
        const retryCheck = await checkInsertRetryOperation(mutation.operation, async (id) => {
          const found = await fetchDogEventById(client, dog.id, id);
          return found && matchesDogEventOperation(found, mutation.operation) ? found : null;
        });
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
    const sequence = ++healthHistoryConfirmationSequence.current;
    setHealthHistoryConfirmation({ lifetime, sequence, kind: mutation.kind, targetId: mutationId });
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

  function saveHealthHistory(
    id: string | null,
    eventType: HealthHistoryType,
    occurredOn: string,
    occurredTime: string | null,
    note: string,
    openingRecord: Pick<HealthHistoryRecord, 'id' | 'dog_id' | 'event_type' | 'occurred_on' | 'occurred_time' | 'description'> | null,
  ): Promise<boolean> {
    const lifetime = healthHistoryLifetime.current;
    if (healthHistoryMutationInFlight.current || pendingHealthHistoryMutation.current || healthHistoryState !== 'ready') return Promise.resolve(false);
    if (!isValidHealthHistoryDate(occurredOn) || !isValidHealthHistoryTime(occurredTime)) return Promise.resolve(false);
    const description = normalizeHealthHistoryDescription(note);
    if (description === undefined || (eventType !== 'vaccination' && eventType !== 'vet_visit')) return Promise.resolve(false);
    if (id === null) {
      const operation: HealthHistoryOperation = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, event_type: eventType, occurred_on: occurredOn, occurred_time: occurredTime, description };
      return runHealthHistoryMutation({ kind: 'insert', operation, lifetime });
    }
    const previous = openingRecord;
    if (!previous || previous.id !== id || previous.dog_id !== dog.id || previous.event_type !== eventType) return Promise.resolve(false);
    return runHealthHistoryMutation({ kind: 'update', id, eventType, previous, changes: { occurred_on: occurredOn, occurred_time: occurredTime, description }, lifetime });
  }

  function removeHealthHistory(
    id: string,
    openingRecord: Pick<HealthHistoryRecord, 'id' | 'dog_id' | 'event_type' | 'occurred_on' | 'occurred_time' | 'description'>,
  ): Promise<boolean> {
    const lifetime = healthHistoryLifetime.current;
    if (healthHistoryMutationInFlight.current || pendingHealthHistoryMutation.current || healthHistoryState !== 'ready') return Promise.resolve(false);
    const previous = openingRecord;
    if (previous.id !== id || previous.dog_id !== dog.id) return Promise.resolve(false);
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
        const current = await fetchHealthHistoryById(client, dog.id, id);
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

  function syncUpcomingHealthAfterPlanMutation(value: PlannedHealthRecord | null, mutationId: string) {
    if (selectedUpcomingPlan.current?.record.id === mutationId) {
      selectedUpcomingPlan.current = !value ? null : { ...selectedUpcomingPlan.current, record: value };
    }
    const upcomingPostimage = value && dailyDateKey && value.due_on > dailyDateKey
      ? { id: value.id, dog_id: value.dog_id, event_type: value.event_type, due_on: value.due_on, due_time: value.due_time, description: value.description }
      : null;
    setUpcomingHealthSnapshot((current) => {
      if (current?.scope !== upcomingScopeKey) return current;
      const rows = current.rows.filter((row) => row.id !== mutationId);
      if (upcomingPostimage) rows.push(upcomingPostimage);
      rows.sort((left, right) => left.due_on.localeCompare(right.due_on) || left.id.localeCompare(right.id));
      return { scope: current.scope, state: 'loading', rows: rows.slice(0, 40) };
    });
    setUpcomingHealthRetryToken((token) => token + 1);
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

  async function runPlannedHealthMutation(mutation: PendingPlannedHealthMutation, retry = false, onSaved?: (value: PlannedHealthRecord | null, id: string) => void): Promise<boolean> {
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
        onSaved?.(outcome.value, mutation.kind === 'insert' ? mutation.operation.id : mutation.id);
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

  function savePlannedHealth(id: string | null, eventType: PlannedHealthType, dueOn: string, note: string, reminderEnabled?: boolean, reminderMinutes?: number | null, dueTime?: string | null, onSaved?: (value: PlannedHealthRecord | null, mutationId: string) => void): Promise<boolean> {
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
      const operation: PlannedHealthOperation = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, event_type: eventType, due_on: dueOn, due_time: dueTime ?? null, description, local_today: localToday, reminder_enabled: enabled, reminder_minutes: minutes };
      return runPlannedHealthMutation({ kind: 'insert', operation, lifetime }, false, onSaved);
    }
    if (!previous) return Promise.resolve(false);
    return runPlannedHealthMutation({ kind: 'update', id, previous, changes: { due_on: dueOn, due_time: dueTime === undefined ? previous.due_time : dueTime, description, reminder_enabled: enabled, reminder_minutes: minutes }, localToday, lifetime }, false, onSaved);
  }

  function removePlannedHealth(id: string, onSaved?: (value: PlannedHealthRecord | null, mutationId: string) => void): Promise<boolean> {
    const lifetime = plannedHealthLifetime.current;
    if (plannedHealthMutationInFlight.current || pendingPlannedHealthMutation.current || plannedHealthState !== 'ready') return Promise.resolve(false);
    const previous = plannedHealthRows.current.find((row) => row.id === id);
    if (!previous) return Promise.resolve(false);
    return runPlannedHealthMutation({ kind: 'delete', id, previous, lifetime }, false, onSaved);
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

  async function retryPlannedHealth(onSaved?: (value: PlannedHealthRecord | null, mutationId: string) => void) {
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
        if (current && samePlannedHealth(current, mutation.operation)) {
          await markPlannedHealthSaved(mutation, current);
          if (!isCurrent()) return;
          onSaved?.(current, id);
        }
        else if (!current) retrySameOperation = true;
        else {
          setPlannedHealthConflict({ lifetime: mutation.lifetime, mutationId: id, current });
          setPlannedHealthMessage('En annan plan finns med samma id. Granska den innan du fortsätter.');
        }
      } else if (mutation.kind === 'update') {
        if (current && samePlannedHealth(current, { id, dog_id: dog.id, event_type: mutation.previous.event_type, ...mutation.changes })) {
          await markPlannedHealthSaved(mutation, current);
          if (!isCurrent()) return;
          onSaved?.(current, id);
        } else if (current && samePlannedHealth(current, mutation.previous)) retrySameOperation = true;
        else {
          setPlannedHealthConflict({ lifetime: mutation.lifetime, mutationId: id, current });
          setPlannedHealthMessage(current ? 'Planen har ändrats sedan försöket. Granska den aktuella versionen.' : 'Planen finns inte längre. Bekräfta den aktuella listan innan du börjar om.');
        }
      } else if (!current) {
        await markPlannedHealthSaved(mutation, null);
        if (!isCurrent()) return;
        onSaved?.(null, id);
      } else if (samePlannedHealth(current, mutation.previous)) retrySameOperation = true;
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
    if (retrySameOperation) await runPlannedHealthMutation(mutation, true, onSaved);
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
    await reloadDailyActivity(true, true);
  }

  async function completeStep(program: PublishedTrainingProgram, stepId: string): Promise<{ programId: string; stepId: string } | false> {
    if (trainingMutationInFlight.current) return false;
    const key = `${program.id}:${stepId}`;
    trainingMutationInFlight.current = true;
    setBusyStepKey(key);
    setTrainingError('');
    try {
      const outcome = await insertTrainingProgress(client, { dog_id: dog.id, program_version_id: program.id, step_id: stepId });
      if (outcome.status === 'saved') {
        try {
          const refreshed = await reloadTraining({ force: true, supersede: true, publishToDaily: true });
          if (!mounted.current) return false;
          const confirmedProgram = refreshed ? refreshed.programs.find((item) => item.id === program.id) : undefined;
          if (program.completedStepIds.includes(stepId) || !confirmedProgram?.completedStepIds.includes(stepId)) {
            setTrainingError('Steget sparades, men en ny statusändring kunde inte bekräftas. Läs in programmet igen innan du fortsätter.');
            return false;
          }
          void analyticsService.track('training_completed');
          return { programId: program.id, stepId };
        } catch {
          if (!mounted.current) return false;
          setTrainingState('error');
          setTrainingError('Steget är sparat, men programstatus kunde inte hämtas. Läs in programmet igen innan du fortsätter.');
          return false;
        }
      }
      let progressChecked = true;
      try {
        await reloadTraining({ force: true, supersede: true, publishToDaily: true });
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

  async function unmarkStep(program: PublishedTrainingProgram, stepId: string): Promise<{ programId: string; stepId: string } | false> {
    if (trainingMutationInFlight.current) return false;
    const selectionKey = currentSelectionKey;
    const key = `${program.id}:${stepId}:unmark`;
    trainingMutationInFlight.current = true;
    setBusyStepKey(key);
    setTrainingError('');
    try {
      const outcome = await deleteTrainingProgress(client, dog.id, program.id, stepId);
      if (!mounted.current || currentSelectionKeyRef.current !== selectionKey) return false;
      const refreshed = await reloadTraining({ force: true, supersede: true, publishToDaily: true });
      if (!mounted.current || currentSelectionKeyRef.current !== selectionKey) return false;
      const confirmedProgram = refreshed.programs.find((item) => item.id === program.id);
      if (confirmedProgram && !confirmedProgram.completedStepIds.includes(stepId)) return { programId: program.id, stepId };
      setTrainingError(!confirmedProgram
        ? 'Programmet kunde inte verifieras efter ändringen. Hämta programmet igen innan du fortsätter.'
        : outcome.status === 'failed'
          ? 'Steget är fortfarande markerat. Kontrollera anslutningen och försök igen.'
          : 'Vi kunde inte bekräfta att steget avmarkerades. Programmet har hämtats igen; kontrollera statusen innan du försöker på nytt.');
      return false;
    } catch {
      if (!mounted.current || currentSelectionKeyRef.current !== selectionKey) return false;
      setTrainingError('Vi kunde inte kontrollera om steget avmarkerades. Hämta programmet igen innan du ändrar det.');
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
      await reloadTraining({ force: true, supersede: true, publishToDaily: true });
    } catch {
      if (!mounted.current) return;
      try {
        await reloadTraining({ force: true, supersede: true, publishToDaily: true });
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

  async function runDailyMutation<T>(key: string, operation: () => Promise<WriteOutcome<T>>, retry = false, origin: DailyMutationOrigin = 'home', expectedSnapshotVersion?: number | null): Promise<WriteOutcome<T> | undefined> {
    const lifetime = currentDailyLifetime;
    await Promise.resolve();
    if (dailyLifetime.current !== lifetime || currentSelectionKeyRef.current !== currentSelectionKey) return undefined;
    if (!dailyDateKey || !validDailyTimeZone || dailyMutationInFlight.current) return undefined;
    if (pendingDailyRetry.current && pendingDailyRetry.current.lifetime === lifetime && !retry) {
      setDailyMessage('Kontrollera den föregående ändringen innan du gör en ny.');
      setDailyMessageError(true);
      return undefined;
    }
    if (retry && (pendingDailyRetry.current?.lifetime !== lifetime || pendingDailyRetry.current.key !== key)) return undefined;
    const gated = runDailyActivityMutationGateway({ origin,
      snapshot: { ...(dailyRoutineWriteGateRef.current ?? { expectedScope: '', snapshotScope: '', updatedAt: null, ready: false, refreshing: false, refreshError: true }),
        expectedScope: lifetime, now: Date.now(), maxAgeMs: WORKSPACE_REFRESH_AFTER_MS,
        sameScopeReadInFlight: hasDailyActivityReadInFlight(lifetime) },
      retryOrigins: retry ? { requested: origin, pending: pendingDailyRetry.current?.origin ?? null } : null,
      isRetry: retry,
      isCurrentDate: isDailyActivityDateCurrent(dailyDateKey, Date.now(), dailyTimeZone),
      expectedSnapshotVersion,
      onBlocked: () => { if (origin === 'all') void guardDailyAllAction(lifetime, expectedSnapshotVersion); },
      operation: () => {
        dailyMutationInFlight.current = true;
        setDailyBusyKey(key);
        setDailyMessageKey(key);
        setDailyMessage('');
        setDailyMessageError(false);
        return operation();
      },
    });
    if (!gated.allowed) return undefined;
    let outcome: WriteOutcome<T>;
    try {
      outcome = await gated.value;
    } catch {
      outcome = { status: 'unknown' };
    }
    if (!mounted.current || dailyLifetime.current !== lifetime || currentSelectionKeyRef.current !== currentSelectionKey) {
      dailyMutationInFlight.current = false;
      if (mounted.current) setDailyBusyKey(null);
      return;
    }
    if (outcome.status === 'saved') {
      pendingDailyRetry.current = null;
      setDailyMessage('');
      setDailyMessageError(false);
      setHomeTrainingTargetFeedback(null);
      const refreshed = await reloadDailyActivity(true, true);
      if (!refreshed && mounted.current && dailyLifetime.current === lifetime) {
        setDailyMessage('Ändringen sparades, men dagens lista kunde inte hämtas. Status räknas först efter en ny avläsning.');
        setDailyMessageError(true);
      }
    } else if (outcome.status === 'unknown') {
      pendingDailyRetry.current = { lifetime, key, origin, status: 'unknown', run: operation };
      setDailyMessage('Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.');
      setDailyMessageError(true);
    } else {
      pendingDailyRetry.current = { lifetime, key, origin, status: 'failed', run: operation };
      setDailyMessage('Ändringen sparades inte. Kontrollera anslutningen och försök igen.');
      setDailyMessageError(true);
    }
    dailyMutationInFlight.current = false;
    if (mounted.current) setDailyBusyKey(null);
    return outcome;
  }

  function retryDailyMutation(origin: DailyMutationOrigin = 'home', expectedSnapshotVersion?: number | null) {
    const pending = pendingDailyRetry.current;
    if (!pending || pending.lifetime !== currentDailyLifetime || pending.origin !== origin) return;
    void runDailyMutation(pending.key, pending.run, true, pending.origin, expectedSnapshotVersion);
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
      || profileMutationInFlight.current || trainingMutationInFlight.current || dailyMutationInFlight.current
      || pendingDailyRetry.current || notificationBusy || attributionBusy || accountDeleteBusy;
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
      try {
        if (!isCurrent()) return { status: 'confirmed' };
        await deleteFirstUseTipStatus(ownerId);
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

  const dailyManagerActions = {
    onCreateRoutine: (input: DailyRoutineCreateInput) => {
      const row = { ...input, dog_id: dog.id };
      return runDailyMutation(`create-routine:${row.id}`, () => createDailyRoutine(client, row, dailyTimeZone));
    },
    onUpdateRoutine: (routine: DailyRoutine, label: string, checklist: DailyRoutineChecklistItem[], repeat: DailyRoutineRepeatValues) =>
      runDailyMutation(`update-routine:${routine.id}`, () => replaceDailyRoutine(client, routine, label, checklist, repeat, dailyTimeZone)),
    onDeleteRoutine: (routine: DailyRoutine) => runDailyMutation(`delete-routine:${routine.id}`, () => deleteDailyRoutine(client, routine)),
    onAddRoutineToDay: (routine: DailyRoutine) => {
      if (!dailyDateKey) return;
      const skipped = dailySnapshotForView?.routineDaySkips.find((row) => row.routine_id === routine.id) ?? null;
      const row: DailyRoutineDayDraft = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, routine_id: routine.id,
        date_key: dailyDateKey, time_zone: dailyTimeZone, routine_label_snapshot: routine.label, checklist_snapshot: routine.checklist };
      const mutationId = ExpoCrypto.randomUUID();
      void runDailyMutation(`select-routine:${routine.id}`, () => addRoutineToDay(client, row, skipped, mutationId));
    },
    onRemoveRoutineFromDay: (row: DailyRoutineDay, routine: DailyRoutine) => {
      const mutationId = ExpoCrypto.randomUUID();
      void runDailyMutation(`remove-routine:${row.id}`, () => removeRoutineFromDay(client, row, routine, mutationId));
    },
    onSetRoutineCompletion: (row: DailyRoutineDay, itemId: string, completed: boolean) => {
      void runDailyMutation(`complete-routine:${row.id}:${itemId}`, () => setRoutineDayCompletion(client, row, itemId, completed));
    },
    onAddTrainingToDay: (option: HomeDailyTrainingOption) => {
      if (!dailyDateKey) return;
      const row: DailyTrainingSelection = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, program_version_id: option.versionId, step_id: option.stepId, date_key: dailyDateKey, time_zone: dailyTimeZone };
      void runDailyMutation(`select-training:${option.versionId}:${option.stepId}`, () => addTrainingSelection(client, row));
    },
    onRemoveTrainingFromDay: (row: DailyTrainingSelection) => {
      void runDailyMutation(`remove-training:${row.id}`, () => removeTrainingSelection(client, row));
    },
  };
  const dailyAllSnapshotVersion = dailyRoutineWriteGate.updatedAt;
  const dailyAllManagerActions = {
    onCreateRoutine: (input: DailyRoutineCreateInput) => {
      const row = { ...input, dog_id: dog.id };
      return runDailyMutation(`create-routine:${row.id}`, () => createDailyRoutine(client, row, dailyTimeZone), false, 'all', dailyAllSnapshotVersion);
    },
    onUpdateRoutine: (routine: DailyRoutine, label: string, checklist: DailyRoutineChecklistItem[], repeat: DailyRoutineRepeatValues) =>
      runDailyMutation(`update-routine:${routine.id}`, () => replaceDailyRoutine(client, routine, label, checklist, repeat, dailyTimeZone), false, 'all', dailyAllSnapshotVersion),
    onDeleteRoutine: (routine: DailyRoutine) => runDailyMutation(`delete-routine:${routine.id}`, () => deleteDailyRoutine(client, routine), false, 'all', dailyAllSnapshotVersion),
    onAddRoutineToDay: (routine: DailyRoutine) => {
      if (!dailyDateKey) return;
      const skipped = dailySnapshotForView?.routineDaySkips.find((row) => row.routine_id === routine.id) ?? null;
      const row: DailyRoutineDayDraft = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, routine_id: routine.id,
        date_key: dailyDateKey, time_zone: dailyTimeZone, routine_label_snapshot: routine.label, checklist_snapshot: routine.checklist };
      const mutationId = ExpoCrypto.randomUUID();
      void runDailyMutation(`select-routine:${routine.id}`, () => addRoutineToDay(client, row, skipped, mutationId), false, 'all', dailyAllSnapshotVersion);
    },
    onRemoveRoutineFromDay: (row: DailyRoutineDay, routine: DailyRoutine) => {
      const mutationId = ExpoCrypto.randomUUID();
      void runDailyMutation(`remove-routine:${row.id}`, () => removeRoutineFromDay(client, row, routine, mutationId), false, 'all', dailyAllSnapshotVersion);
    },
    onSetRoutineCompletion: (row: DailyRoutineDay, itemId: string, completed: boolean) => {
      void runDailyMutation(`complete-routine:${row.id}:${itemId}`, () => setRoutineDayCompletion(client, row, itemId, completed), false, 'all', dailyAllSnapshotVersion);
    },
    onAddTrainingToDay: (option: HomeDailyTrainingOption) => {
      if (!dailyDateKey) return;
      const row: DailyTrainingSelection = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, program_version_id: option.versionId, step_id: option.stepId, date_key: dailyDateKey, time_zone: dailyTimeZone };
      void runDailyMutation(`select-training:${option.versionId}:${option.stepId}`, () => addTrainingSelection(client, row), false, 'all', dailyAllSnapshotVersion);
    },
    onRemoveTrainingFromDay: (row: DailyTrainingSelection) => {
      void runDailyMutation(`remove-training:${row.id}`, () => removeTrainingSelection(client, row), false, 'all', dailyAllSnapshotVersion);
    },
  };
  const pageContent = renderPage();
  const transitionDirection = navigationDirection(previousPage, page);
  return <AppScreen scrollKey={page} footer={accountDeleteBusy || accountDeleteStatus === 'confirmed' || accountDeleteStatus === 'unknown' ? undefined : <BottomNav active={activeMainTabDestination(page)} onChange={navigateMainTab} />}>
    <MainSwipeNavigation enabled={isMainTabDestination(page) && !(page === 'knowledge' && knowledgeDetailOpen)} onSwipe={handleMainSwipe}>
      <ScreenTransition transitionKey={page} direction={transitionDirection} axis="x">{pageContent}</ScreenTransition>
    </MainSwipeNavigation>
  </AppScreen>;

  function renderPage() {
    if (page === 'home') return <HomeScreen
      dog={dog}
      today={homeToday}
      breed={breeds.find((breed) => breed.id === dog.breed_id)?.name ?? ''}
      events={displayEvents}
      healthHistory={healthHistory}
      healthHistoryState={healthHistoryState}
      plans={plannedHealth}
      logState={logState}
      planState={plannedHealthState}
      nextStep={visibleTrainingState === 'ready' ? nextStep?.title : undefined}
      trainingState={visibleTrainingState}
      reviewTrainingStep={hasReviewTraining}
      content={visibleGuideContent}
      contentState={visibleContentState}
      dailyState={dailyStateForView}
      dailyRefreshing={dailyRefreshing}
      dailyRefreshError={dailyRefreshError}
      dailyDateKey={dailyDateKey ?? '—'}
      dailyScopeKey={currentDailyLifetime}
      dailyActivities={dailyActivities}
      routineTemplates={dailySnapshotForView?.routines ?? []}
      routineDaySkips={dailySnapshotForView?.routineDaySkips ?? []}
      dailyTrainingOptions={dailyTrainingOptions}
      dailyMutationBusy={Boolean(dailyBusyKey)}
      dailyMutationKey={dailyMessageKey}
      dailyMutationMessage={dailyMessage}
      dailyMutationError={dailyMessageError}
      trainingTargetFeedback={homeTrainingTargetFeedback}
      onRetryDaily={() => { void reloadDailyActivity(true); }}
      {...dailyManagerActions}
      onRetryDailyMutation={retryDailyMutation}
      onGo={(destination) => {
        if (destination === 'checklist') {
          setChecklistTabSelection({ scopeKey: checklistUiScopeKey, tab: 'Idag' });
          setPage('checklist');
        }
        else navigateMainTab(destination);
      }}
      onOpenTrainingTarget={(programVersionId, stepId, activityId) => {
        const activity = dailyActivities.find((item) => item.id === activityId && item.kind === 'training');
        const program = visibleTrainingState === 'ready' ? training.programs.find((item) => item.id === programVersionId) : undefined;
        const step = program?.steps.find((item) => item.id === stepId);
        const adultBlocked = dailyLifeStage === 'VUXEN' && !ADULT_APPROVED_DAILY_TRAINING_VERSION_IDS.includes(programVersionId);
        const isCurrent = dailyStateForView === 'ready' && dailySnapshotLifetime === currentDailyLifetime
          && dailyLifetime.current === currentDailyLifetime && activity?.availability === 'available'
          && activity.programId === programVersionId && activity.stepId === stepId && Boolean(program && step) && !adultBlocked;
        if (!isCurrent) {
          setHomeTrainingTargetFeedback({ activityId, message: 'Uppgiften har ändrats. Öppna dagens checklista för att se det aktuella valet.' });
          return;
        }
        setHomeTrainingTargetFeedback(null);
        setTrainingEntry({ programVersionId, stepId, scope: currentDailyLifetime, returnPage: 'home' });
        setPage('training');
      }}
      onOpenContent={(contentId) => {
        setKnowledgeDetailOpen(false);
        setKnowledgeFocus({ selectionKey: currentSelectionKey, contentId, returnPage: 'home' });
        setPage('knowledge');
      }}
      onRetryContent={() => { void retryContent(); }}
    />;
    if (page === 'checklist') return <DailyChecklistScreen key={checklistUiScopeKey} dogName={dog.name} dogId={dog.id} dateKey={dailyDateKey ?? '—'} scopeKey={currentDailyLifetime}
      initialTab={checklistInitialTab} onActiveTabChange={(tab) => {
        checklistTabRef.current = tab;
        if (tab !== 'Kommande') {
          upcomingPlanReadGeneration.current += 1;
          setOpeningUpcomingPlan(null);
          setUpcomingPlanOpenFailure(null);
        }
        setChecklistTabSelection({ scopeKey: checklistUiScopeKey, tab });
      }} state={dailyStateForView}
      weekDateKeys={dailyWeekDates} weekState={weeklyStateForView} weekProjection={weeklyProjection} weekCurrentDateKey={dailyDateKey}
      weekSelectedDateKey={selectedWeeklyDateKey} onSelectWeekDate={(selectedDateKey) => setWeeklyDaySelection({ scopeKey: weeklyUiScopeKey, dateKey: selectedDateKey })}
      onRetryWeek={() => setWeeklyRetryToken((token) => token + 1)}
      refreshing={dailyRefreshing} refreshError={dailyRefreshError} activities={dailyActivities} routines={dailySnapshotForView?.routines ?? []}
      upcomingHealthPlans={upcomingHealthPlans} upcomingHealthState={upcomingHealthState}
      upcomingRoutineSchedules={upcomingRoutineSchedules} upcomingRoutineState={upcomingRoutineState}
      openingUpcomingPlanId={openingUpcomingPlanId} upcomingPlanOpenError={upcomingPlanOpenError}
      onRetryUpcomingHealth={() => {
        setUpcomingHealthSnapshot((current) => ({ scope: upcomingScopeKey, state: 'loading', rows: current?.scope === upcomingScopeKey ? current.rows : [] }));
        setUpcomingHealthRetryToken((token) => token + 1);
      }}
      onRetryUpcomingRoutines={() => {
        setUpcomingRoutineSnapshot((current) => ({ scope: upcomingScopeKey, state: 'loading', rows: current?.scope === upcomingScopeKey ? current.rows : [] }));
        setUpcomingRoutineRetryToken((token) => token + 1);
      }}
      onOpenUpcomingPlan={(planId) => { void openUpcomingPlannedHealth(planId); }}
      routineDays={dailySnapshotForView?.routineDays ?? []} routineDaySkips={dailySnapshotForView?.routineDaySkips ?? []}
      routineTemplatesWritable={dailyRoutineTemplatesWritable} routineTemplatesSnapshotVersion={dailyRoutineWriteGate.updatedAt}
      trainingOptions={dailyTrainingOptions}
      mutationBusy={Boolean(dailyBusyKey)} mutationKey={dailyMessageKey} mutationMessage={dailyMessage} mutationError={dailyMessageError}
      onRetry={() => { void reloadDailyActivity(true); }} onRetryMutation={() => retryDailyMutation('all', dailyAllSnapshotVersion)}
      {...dailyAllManagerActions}
      onAddRoutineTemplateToDay={dailyAllManagerActions.onAddRoutineToDay}
      onGuardAllAction={(expectedVersion) => guardDailyAllAction(currentDailyLifetime, expectedVersion)}
      onOpenTrainingTarget={(programVersionId, stepId) => {
        setTrainingEntry({ programVersionId, stepId, scope: currentDailyLifetime, returnPage: 'checklist' });
        setPage('training');
      }}
      onOpenWeekTrainingTarget={(programVersionId, stepId) => {
        const activity = dailyActivities.find((item) => item.kind === 'training' && item.programId === programVersionId && item.stepId === stepId);
        const program = dailyTrainingForView?.programs.find((item) => item.id === programVersionId);
        const step = program?.steps.find((item) => item.id === stepId);
        const isCurrent = selectedWeeklyDateKey === dailyDateKey && dailyStateForView === 'ready' && !dailyRefreshError
          && dailySnapshotLifetime === currentDailyLifetime && dailyLifetime.current === currentDailyLifetime
          && activity?.availability === 'available' && Boolean(program && step)
          && !(dailyLifeStage === 'VUXEN' && !ADULT_APPROVED_DAILY_TRAINING_VERSION_IDS.includes(programVersionId));
        if (!isCurrent) { void reloadDailyActivity(true, true); return; }
        setTrainingEntry({ programVersionId, stepId, scope: currentDailyLifetime, returnPage: 'week', returnWeekDateKey: selectedWeeklyDateKey ?? undefined });
        setPage('training');
      }}
      onGoTraining={() => {
        setTrainingEntry({ programVersionId: null, stepId: null, scope: currentDailyLifetime, returnPage: 'checklist' });
        setPage('training');
      }}
      onBack={() => { setTrainingEntry(null); setChecklistTabSelection({ scopeKey: checklistUiScopeKey, tab: 'Idag' }); setPage('home'); }} />;
    if (page === 'log') return <LogScreen events={displayEvents} onAdd={addEvent}
      onUpdate={updateEvent} onDelete={(id) => deleteEvent(id)} mode="cloud"
      layoutOwnerId={session?.user.id}
      loading={logState === 'loading'} loadError={logState === 'error'} onReload={() => { void retryEvents(); }}
      busy={logBusy} mutation={quickLogMutation} loadMoreError={loadMoreError} onRetry={retryLogMutation} onCancel={cancelLogMutation} registerEditorLeaveGuard={registerEditorLeaveGuard}
      onUndo={(id) => { void undoQuickLog(id); }} hasMore={hasMore} loadingMore={loadingMore}
      onLoadMore={() => { void loadMoreEvents(); }} />;
    if (page === 'training' && trainingEntry) {
      const targetIsExact = Boolean(trainingEntry.programVersionId && trainingEntry.stepId);
      const staleScope = targetIsExact && trainingEntry.scope !== currentDailyLifetime;
      const targetProgram = targetIsExact && !staleScope && visibleTrainingState === 'ready'
        ? training.programs.find((program) => program.id === trainingEntry.programVersionId) : undefined;
      const targetStep = targetProgram?.steps.find((step) => step.id === trainingEntry.stepId);
      const adultBlocked = targetIsExact && dailyLifeStage === 'VUXEN'
        && !ADULT_APPROVED_DAILY_TRAINING_VERSION_IDS.includes(trainingEntry.programVersionId ?? '');
      const returnPage = trainingEntry.returnPage;
      const originPage = returnPage === 'home' ? 'home' : 'checklist';
      const backLabel = returnPage === 'home' ? 'Tillbaka till Hem' : returnPage === 'week' ? 'Tillbaka till veckans dag' : 'Tillbaka till dagens checklista';
      const backToOrigin = () => {
        if (returnPage === 'week' && trainingEntry.returnWeekDateKey) setWeeklyDaySelection({ scopeKey: weeklyUiScopeKey, dateKey: trainingEntry.returnWeekDateKey });
        setTrainingEntry(null);
        setPage(originPage);
      };
      if (staleScope || (visibleTrainingState === 'ready' && targetIsExact && (!targetProgram || !targetStep || adultBlocked))) return <>
        <PageHeading title="Träning" description="Dagens val" />
        <MessageCard tone="neutral">{staleScope ? (returnPage === 'home' ? 'Dagens val har ändrats. Gå tillbaka till Hem för att öppna det aktuella valet.' : 'Dagens val har ändrats. Öppna checklistan för att välja ett aktuellt steg.')
          : adultBlocked ? 'Det här träningssteget är inte godkänt för vuxna hundar.'
            : 'Det valda träningssteget finns inte längre i den publicerade versionen.'}</MessageCard>
        <PrimaryButton title={backLabel} onPress={backToOrigin} />
      </>;
      if (visibleTrainingState === 'loading') return <>
        <PageHeading title="Träning" description="Hämtar publicerade program…" />
        <Button variant="tertiary" label={backLabel} accessibilityLabel={backLabel} onPress={backToOrigin} />
      </>;
      if (visibleTrainingState === 'error') return <>
        <PageHeading title="Träning" description="Programmen kunde inte hämtas." />
        <MessageCard tone="error">{trainingError || 'Det valda träningssteget kunde inte kontrolleras.'}</MessageCard>
        <PrimaryButton title="Försök igen" onPress={() => { void retryTraining(); }} />
        <Button variant="tertiary" label={backLabel} accessibilityLabel={backLabel} onPress={backToOrigin} />
      </>;
      return <PublishedTrainingScreen ageWeeks={age} programs={training.programs} paused={training.paused}
        reviewMode={reviewContentEnabled && training.programs.some((program) => program.id.startsWith('review-v1:training:'))}
        busyStepKey={busyStepKey} error={trainingError} onCompleteStep={completeStep} onUnmarkStep={unmarkStep}
        onContinue={() => setTrainingError('')} onResetProgram={(program) => { void resetProgram(program); }}
        onRetry={() => { void retryTraining(); }} initialSelection={targetIsExact ? { programId: trainingEntry.programVersionId as string, stepId: trainingEntry.stepId as string } : undefined}
        backLabel={backLabel} onBackToChecklist={backToOrigin} />;
    }
    if (page === 'training') return <>
      {visibleTrainingState === 'loading' && <PageHeading title="Träning" description="Hämtar publicerade program…" />}
      {visibleTrainingState === 'error' && <>
        <PageHeading title="Träning" description="Programmen kunde inte hämtas." />
        <MessageCard tone="error">{trainingError}</MessageCard>
        <PrimaryButton title="Försök igen" onPress={() => { void retryTraining(); }} />
      </>}
      {visibleTrainingState === 'ready' && <PublishedTrainingScreen ageWeeks={age} programs={training.programs} paused={training.paused}
        reviewMode={reviewContentEnabled && training.programs.some((program) => program.id.startsWith('review-v1:training:'))}
        busyStepKey={busyStepKey} error={trainingError} onCompleteStep={completeStep} onUnmarkStep={unmarkStep}
        onContinue={() => setTrainingError('')} onResetProgram={(program) => { void resetProgram(program); }}
        onRetry={() => { void retryTraining(); }} />}
    </>;
    if (page === 'more') return <MoreScreen onNavigate={(destination) => {
      if (destination === 'reminders') {
        setNotificationSaved(false);
        setPage('notification-settings');
      } else if (destination === 'account') setPage('account-settings');
      else setPage(destination);
    }} signOutError={signOutError} signingOut={signingOut} onSignOut={confirmSignOut} />;
    if (page === 'account-settings') return <AccountSettingsScreen ownerId={session?.user.id ?? ''} onBack={() => setPage('more')}
      onOpenInformation={() => setPage('beta-info')} busy={accountDeleteBusy} status={accountDeleteStatus}
      localCleanupFailed={accountDeleteCleanupFailed} signOutFailed={accountDeleteSignOutFailed}
      analyticsConsent={analyticsConsent} analyticsBusy={analyticsBusy} analyticsError={analyticsError}
      onSetAnalyticsConsent={saveAnalyticsConsent}
      onRetryAnalyticsConsent={retryAnalyticsConsent}
      onDeleteAccount={handleAccountDeletion} onSignOutLocally={signOutDeletedLocally} />;
    if (page === 'beta-info') return <BetaInfoScreen onBack={() => setPage('account-settings')} />;
    if (page === 'notification-settings') return <NotificationSettingsScreen
      key={JSON.stringify([session?.user.id ?? 'signed-out', accountGeneration, dog.id, notificationPreferences])}
      registerEditorLeaveGuard={registerEditorLeaveGuard} onBack={() => setPage('more')} preferences={notificationPreferences}
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
      key={currentHealthHistoryLifetime}
      historyLifetime={currentHealthHistoryLifetime}
      historyScope={{ ownerId: session?.user.id ?? '', accountGeneration, dogId: dog.id }}
      historyConfirmation={healthHistoryConfirmation}
      registerEditorLeaveGuard={registerEditorLeaveGuard}
      plannedRecords={plannedHealth}
      plannedLoadState={plannedHealthState}
      onRetryPlannedHealth={() => { void retryPlannedHealth(syncUpcomingHealthAfterPlanMutation); }}
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
      onOpenPlannedHealth={() => { selectedUpcomingPlan.current = null; setPlannedHealthEntry({ origin: 'health' }); setPage('planned-health'); }}
    />;
    if (page === 'planned-health') {
      const checklistEntry = plannedHealthEntry?.origin === 'checklist' ? plannedHealthEntry : null;
      const selectedPlanIsCurrent = Boolean(checklistEntry && checklistEntry.scope === upcomingScopeKey);
      return <PlannedHealthScreen
      backLabel={checklistEntry ? 'Checklista' : 'Hälsa'}
      initialEditId={selectedPlanIsCurrent ? checklistEntry?.selectedPlanId : undefined}
      onBack={() => { selectedUpcomingPlan.current = null; setPlannedHealthEntry(null); setPage(checklistEntry ? 'checklist' : 'health'); }}
      records={plannedHealth}
      loadState={plannedHealthState}
      busy={plannedHealthBusy}
      pending={plannedHealthPending}
      statusMessage={plannedHealthMessage}
      statusError={plannedHealthMessageError}
      reminderSummary={reminderStatusSummary(reminderResult, notificationPreferences, notificationPermission)}
      conflict={plannedHealthConflict?.lifetime === currentPlannedHealthLifetime ? plannedHealthConflict : null}
      registerEditorLeaveGuard={registerEditorLeaveGuard}
      onRetry={() => { void retryPlannedHealth(syncUpcomingHealthAfterPlanMutation); }}
      onResolveConflict={() => { void resolvePlannedHealthConflict(); }}
      onSave={(id, eventType, dueOn, note, reminderEnabled, reminderMinutes, dueTime) =>
        savePlannedHealth(id, eventType, dueOn, note, reminderEnabled, reminderMinutes, dueTime, syncUpcomingHealthAfterPlanMutation)}
      onDelete={(id) => removePlannedHealth(id, syncUpcomingHealthAfterPlanMutation)}
    />;
    }
    if (page === 'knowledge') return <KnowledgeScreen
      onBack={() => setPage(knowledgeFocus?.selectionKey === currentSelectionKey ? knowledgeFocus.returnPage : 'more')}
      items={visibleGuideContent}
      contentState={visibleContentState}
      focusedContentId={focusedKnowledgeContentId}
      onDetailChange={setKnowledgeDetailOpen}
      onSelectContent={(contentId) => setKnowledgeFocus({
        selectionKey: currentSelectionKey,
        contentId,
        returnPage: knowledgeFocus?.selectionKey === currentSelectionKey ? knowledgeFocus.returnPage : 'more',
      })}
      onRetry={() => { void retryContent(); }}
      client={client}
      dogId={dog.id}
      ageWeeks={age}
      sessionKey={`${session?.user.id ?? 'signed-out'}:${accountGeneration}`}
      checklistPending={checklistMemoryView?.scope === currentChecklistMemoryScope ? checklistMemoryView.state : null}
      onChecklistPendingChange={(state) => {
        const next = updateChecklistMemory(checklistMemory.current, currentChecklistMemoryScope, state);
        checklistMemory.current = next;
        setChecklistMemoryView(next);
      }}
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
    if (onDogUpdated) return <EditDogProfileScreen key={`${dog.id}:${dog.name}:${dog.breed_id}:${dog.birth_date}:${dog.age_display_unit}`}
      client={client} dog={dog} busy={profileBusy} pending={profilePending} statusMessage={profileMessage}
      statusError={profileMessageError} conflict={profileConflict ?? undefined}
      attribution={dogAttribution} attributionState={attributionState} attributionBusy={attributionBusy}
      attributionMessage={attributionMessage} attributionMessageError={attributionMessageError} attributionIntent={visibleAttributionIntent}
      registerEditorLeaveGuard={registerEditorLeaveGuard} onAcceptCurrentAttribution={acceptCurrentDogAttribution}
      onBack={() => setPage('more')} onSave={saveDogProfile}
      onSaveAttribution={saveDogAttribution} onRetryAttribution={() => { void retryDogAttribution(); }}
      onRetryStatus={() => { void retryProfileStatus(); }} onAcceptCurrent={() => { void acceptCurrentProfile(); }} />;
    return <DogProfileScreen dog={dog} breed={breeds.find((breed) => breed.id === dog.breed_id)?.name} onBack={() => setPage('more')} />;
  }

}

function navigationDirection(previous: ProductPage, current: ProductPage): 'forward' | 'backward' {
  return mainTabTransitionDirection(previous, current);
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
  return { id: row.id, dogId: row.dog_id, type: row.event_type, occurredAt: row.occurred_at, note: row.description, origin: 'local-test', accidentKinds: row.accident_kinds };
}

function toQuickLogMutationView(mutation: PendingLogMutation, status: QuickLogMutationView['status']): QuickLogMutationView {
  return mutation.kind === 'insert'
    ? { kind: 'add', mutationId: mutation.operation.id, id: mutation.operation.id, type: mutation.operation.event_type, occurredAt: mutation.operation.occurred_at, accidentKinds: mutation.operation.accident_kinds, status }
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
  expected: Pick<HealthHistoryRecord, 'id' | 'dog_id' | 'event_type' | 'occurred_on' | 'occurred_time' | 'description'>,
): boolean {
  return current.id === expected.id && current.dog_id === expected.dog_id && current.event_type === expected.event_type
    && current.occurred_on === expected.occurred_on && current.occurred_time === expected.occurred_time && current.description === expected.description;
}

function samePlannedHealth(
  record: PlannedHealthRecord,
  expected: Pick<PlannedHealthOperation, 'id' | 'dog_id' | 'event_type' | 'due_on' | 'due_time' | 'description' | 'reminder_enabled' | 'reminder_minutes'>,
): boolean {
  return record.id === expected.id && record.dog_id === expected.dog_id && record.event_type === expected.event_type
    && record.due_on === expected.due_on && normalizePlannedHealthTime(record.due_time) === normalizePlannedHealthTime(expected.due_time) && record.description === expected.description
    && record.reminder_enabled === expected.reminder_enabled && record.reminder_minutes === expected.reminder_minutes;
}

function samePlannedHealthSnapshot(left: PlannedHealthRecord | null, right: PlannedHealthRecord | null): boolean {
  if (left === null || right === null) return left === right;
  return samePlannedHealth(left, right) && left.created_at === right.created_at;
}

function sameOwnedDogProfile(
  current: OwnedDog,
  expected: Pick<OwnedDog, 'name' | 'breed_id' | 'birth_date' | 'age_display_unit'>,
  id: string,
): boolean {
  return current.id === id && current.name === expected.name
    && current.breed_id === expected.breed_id && current.birth_date === expected.birth_date
    && current.age_display_unit === expected.age_display_unit;
}
