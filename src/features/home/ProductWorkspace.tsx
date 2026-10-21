import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  fetchDogLogMonthMarkers,
  fetchDogInsightsEvents,
  fetchExactHistoricalTrainingDetail,
  fetchExactHistoricalTrainingSources,
  fetchHealthWeightById,
  fetchHealthWeights,
  fetchHealthHistory,
  fetchHealthHistoryById,
  fetchPlannedHealth,
  fetchPlannedHealthChecklistRange,
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
  type DogInsightsReadResult,
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
  addRoutineToDay,
  addTrainingSelection,
  createDailyRoutine,
  deleteDailyRoutine,
  fetchDailyActivitySnapshot,
  fetchDailyActivityRangeSnapshot,
  removeRoutineFromDay,
  removeTrainingSelection,
  replaceDailyRoutine,
  setRoutineDayCompletion,
  type DailyActivitySnapshot,
  type DailyActivityRangeSnapshot,
  type DailyRoutineCreateInput,
  type DailyRoutineDayDraft,
  type DailyTrainingSelection,
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
import { localDate } from '../onboarding/dog';
import { calendarMarkerScopeKey } from '../puppy-log/log-calendar-model';
import { acquireTrainingMutationLease, homeAgeInWeeks, ownsTrainingMutationLease, releaseTrainingMutationLease, type TrainingMutationLease } from './home-today';
import { HealthScreen } from '../health/HealthScreen';
import { PlannedHealthScreen } from '../health/PlannedHealthScreen';
import { EditDogProfileScreen } from '../onboarding/EditDogProfileScreen';
import { DogProfileScreen } from '../onboarding/DogProfileScreen';
import { KnowledgeScreen } from '../knowledge/KnowledgeScreen';
import { checklistMemoryScope, keepChecklistMemoryForScope, updateChecklistMemory, type PendingChecklistMemory } from '../knowledge/checklist-intent';
import { checklistReadCacheScope, clearChecklistReadCache, keepChecklistReadCacheForScope } from '../knowledge/checklist-data';
import { CHECKLIST_DESTINATION_ID, FAQ_DESTINATION_ID, REVIEW_TRAINING_GUIDES, REVIEW_TRAINING_PROGRAMS } from '../knowledge/review-content';
import { HomeScreen, type HomeDailyTrainingOption } from './HomeScreen';
import { DailyChecklistScreen } from './DailyChecklistScreen';
import { checklistFilterRange, dailyActivityScopeKey, deriveHomeDailyActivities, deriveSavedRangeActivities, isValidIanaTimeZone, localDateKeyAt, nextSelectableTrainingStep,
  projectUpcomingRoutineDates, type ChecklistFilter, type HomeDailyActivity } from './daily-activity-model';
import { activeMainTabDestination, isMainTabDestination, mainTabTransitionDirection, nextMainTabDestination } from './main-navigation';
import { AppBar, BottomNav, MainSwipeNavigation } from '../../components/ui';
import { ScreenTransition } from '../../components/ui/Motion';
import { tokens } from '../../theme/tokens';
import { LogScreen, type QuickLogMutationView } from '../puppy-log/LogScreen';
import { InsightsScreen } from '../puppy-log/InsightsScreen';
import { createInsightsRange, projectInsights, type InsightsPeriod, type InsightsProjection } from '../puppy-log/insights-model';
import { canStartLogMutation, checkInsertRetryOperation, finishLogMutationFlight, isCanonicalAccidentKinds, isLogMutationLifetimeCurrent, logMutationStatusForWriteOutcome, retainLogMutationFlightForLifetime, startLogMutationFlight, type AccidentKind, type AccidentLogIntent, type LogEvent, type LogEventChanges, type LogEventType, type LogMutationFlight } from '../puppy-log/log-model';
import { PassportScreen } from '../passport/PassportScreen';
import { PublishedTrainingScreen } from '../training/PublishedTrainingScreen';
import { pickNextExercise } from '../training/training-overview';
import { useAuth } from '../account/AuthProvider';
import { NotificationSettingsScreen } from '../notifications/NotificationSettingsScreen';
import { AccountSettingsScreen } from '../account/AccountSettingsScreen';
import { BetaInfoScreen } from '../account/BetaInfoScreen';
import { MoreScreen } from '../more/MoreScreen';
import { requestAccountDeletion, type AccountDeleteResult } from '../account/account-delete';
import { createAnalyticsService } from '../../analytics/analytics-service';
import { deleteFirstUseTipStatus, deleteNotificationPreferences } from '../../notifications/notification-storage';
import { cleanupStalePassportFiles } from '../passport/passport-export';
import { clearDogCreationRequest } from '../onboarding/dog-creation-storage';
import { futureFireTimeForPlan, parseReminderPayload, type NotificationPreferences } from '../../notifications/notification-model';
import { reminderService, type ReminderContext, type ReminderReconcileResult } from '../../notifications/notification-service';

const reviewContentEnabled = process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true';

type ProductPage = 'home' | 'checklist' | 'home-training-detail' | 'log' | 'insights' | 'training' | 'more' | 'health' | 'planned-health' | 'knowledge' | 'passport' | 'profile' | 'notification-settings' | 'account-settings' | 'beta-info';
type HomeTrainingFocus = { selectionKey: string; dailyLifetime: string; programId: string; stepId: string; returnPage: 'home' | 'checklist'; readOnly?: boolean };
type ChecklistRangeView = {
  key: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
  activities: HomeDailyActivity[];
  routines: DailyActivityRangeSnapshot['routines'];
  routineDaySkips: DailyActivityRangeSnapshot['routineDaySkips'];
  snapshot: DailyActivityRangeSnapshot | null;
  completeSources: string[];
  failedSources: string[];
};
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
  | { kind: 'update'; id: string; eventType: HealthHistoryType; previous: HealthHistoryRecord; changes: HealthHistoryChanges; lifetime: string }
  | { kind: 'delete'; id: string; eventType: HealthHistoryType; previous: HealthHistoryRecord; lifetime: string };
type PendingPlannedHealthMutation =
  | { kind: 'insert'; operation: PlannedHealthOperation; lifetime: string }
  | { kind: 'update'; id: string; previous: PlannedHealthRecord; changes: PlannedHealthChanges; localToday: string; lifetime: string }
  | { kind: 'delete'; id: string; previous: PlannedHealthRecord; lifetime: string };
type PendingProfileMutation = { previous: OwnedDog; changes: OwnedDogProfileChanges; knownBreeds: readonly BreedOption[]; lifetime: string };

const PAGE_SIZE = 40;
const WORKSPACE_REFRESH_AFTER_MS = 60_000;

function mergeConfirmedLogRows(fetched: readonly DogEventRecord[], baseline: readonly DogEventRecord[], current: readonly DogEventRecord[]): DogEventRecord[] {
  const baselineById = new Map(baseline.map((row) => [row.id, row]));
  const currentById = new Map(current.map((row) => [row.id, row]));
  const deletedLocally = new Set(baseline.filter((row) => !currentById.has(row.id)).map((row) => row.id));
  const changedLocally = new Map(current.filter((row) => baselineById.get(row.id) !== row).map((row) => [row.id, row]));
  const merged = new Map<string, DogEventRecord>();
  for (const row of fetched) {
    if (!deletedLocally.has(row.id)) merged.set(row.id, changedLocally.get(row.id) ?? row);
  }
  for (const row of changedLocally.values()) merged.set(row.id, row);
  return [...merged.values()].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.id.localeCompare(a.id));
}

function shouldClearDailyMutationFeedback(pendingRetryLifetime: string | undefined, activeLifetime: string): boolean {
  return pendingRetryLifetime !== activeLifetime;
}

type LogReadFlight = { scope: string; generation: number; controller: AbortController; promise: Promise<boolean>; baseline: DogEventRecord[]; refreshRequested: boolean };
type LogPaginationFlight = { scope: string; generation: number; controller: AbortController };
type TrainingWorkspaceSnapshot = Awaited<ReturnType<typeof fetchTrainingWorkspace>>;
type WorkspaceResourceFlight<T> = { scope: string; generation: number; controller: AbortController; promise: Promise<T> };

export function ProductWorkspace({ client, dog, onDogUpdated, ownedDogs = [dog], onSelectDog, onAddDog, openDogSwitcherInitially = false, onDogSwitcherInitiallyOpened, initialPage = 'home', onInitialPageOpened }: {
  client: SupabaseClient;
  dog: OwnedDog;
  onDogUpdated?: (updated: OwnedDog) => void;
  ownedDogs?: readonly OwnedDog[];
  onSelectDog?: (dogId: string) => void;
  onAddDog?: (entryPoint: 'home' | 'settings') => void;
  openDogSwitcherInitially?: boolean;
  onDogSwitcherInitiallyOpened?: () => void;
  initialPage?: 'home' | 'profile';
  onInitialPageOpened?: () => void;
}) {
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const [navigation, setNavigation] = useState<{ page: ProductPage; previousPage: ProductPage }>(() => ({ page: initialPage, previousPage: 'home' }));
  const [homeTrainingFocus, setHomeTrainingFocus] = useState<HomeTrainingFocus | null>(null);
  const [homeChecklistScope, setHomeChecklistScope] = useState<{ selectionKey: string; dailyLifetime: string } | null>(null);
  const [checklistFilter, setChecklistFilter] = useState<ChecklistFilter>('Idag');
  const [checklistRangeView, setChecklistRangeView] = useState<ChecklistRangeView>({ key: '', status: 'idle', activities: [], routines: [], routineDaySkips: [], snapshot: null, completeSources: [], failedSources: [] });
  const [upcomingPreviewView, setUpcomingPreviewView] = useState<ChecklistRangeView>({ key: '', status: 'idle', activities: [], routines: [], routineDaySkips: [], snapshot: null, completeSources: [], failedSources: [] });
  const [historicalTrainingDetail, setHistoricalTrainingDetail] = useState<PublishedTrainingProgram | null>(null);
  const [historicalTrainingDetailState, setHistoricalTrainingDetailState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [deviceTimeZone, setDeviceTimeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const initialPageConsumed = useRef(false);
  useEffect(() => {
    if (initialPage === 'profile' && !initialPageConsumed.current) {
      initialPageConsumed.current = true;
      onInitialPageOpened?.();
    }
  }, [initialPage, onInitialPageOpened]);
  const { page, previousPage } = navigation;
  const pageRef = useRef(page);
  const checklistFilterRef = useRef(checklistFilter);
  const checklistRequestContext = useRef({ page: '', filter: checklistFilter, resumeRefresh: -1 });
  useLayoutEffect(() => { pageRef.current = page; }, [page]);
  useLayoutEffect(() => { checklistFilterRef.current = checklistFilter; }, [checklistFilter]);
  const setPage = useCallback((nextPage: ProductPage) => {
    setNavigation((current) => current.page === nextPage
      ? current
      : { page: nextPage, previousPage: current.page });
  }, []);
  const [profileReturnPage, setProfileReturnPage] = useState<'more' | 'training'>('more');
  function returnFromProfile() {
    const destination = profileReturnPage;
    setProfileReturnPage('more');
    setPage(destination);
  }
  const [breeds, setBreeds] = useState<BreedOption[]>([]);
  useEffect(() => {
    let active = true;
    void fetchBreeds(client).then((result) => { if (active) setBreeds(result); }).catch(() => undefined);
    return () => { active = false; };
  }, [client]);
  const [content, setContent] = useState<HomeContent[]>([]);
  const [contentState, setContentState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [contentSelectionKey, setContentSelectionKey] = useState<string | null>(null);
  const [knowledgeFocus, setKnowledgeFocus] = useState<{ selectionKey: string; contentId: string | null; returnPage: 'home' | 'more' | 'training' } | null>(null);
  const [knowledgeDetailOpen, setKnowledgeDetailOpen] = useState(false);
  const navigateMainTab = useCallback((destination: ProductPage) => {
    const enteringKnowledge = page !== 'knowledge' && destination === 'knowledge';
    const leavingKnowledge = page === 'knowledge' && destination !== 'knowledge';
    if ((page === 'checklist' || page === 'home-training-detail' || page === 'planned-health' && previousPage === 'checklist')
      && isMainTabDestination(destination)) {
      checklistRangeGeneration.current += 1;
      checklistRangeFlight.current?.controller.abort();
      checklistRangeFlight.current = null;
      historicalDetailGeneration.current += 1;
      historicalDetailController.current?.abort();
      historicalDetailController.current = null;
      setChecklistFilter('Idag');
      setChecklistRangeView({ key: '', status: 'idle', activities: [], routines: [], routineDaySkips: [], snapshot: null, completeSources: [], failedSources: [] });
      setHomeChecklistScope(null);
      setHomeTrainingFocus(null);
      setHistoricalTrainingDetail(null);
      setHistoricalTrainingDetailState('idle');
    }
    if (enteringKnowledge || leavingKnowledge) {
      setKnowledgeFocus(null);
      setKnowledgeDetailOpen(false);
    }
    setPage(destination);
  }, [page, previousPage, setPage]);
  const handleMainSwipe = useCallback((direction: 'left' | 'right') => {
    const destination = nextMainTabDestination(page, direction);
    if (destination) navigateMainTab(destination);
  }, [navigateMainTab, page]);
  const [events, setEvents] = useState<DogEventRecord[]>([]);
  const eventRows = useRef<DogEventRecord[]>([]);
  const [logState, setLogState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [logSelectedDate, setLogSelectedDate] = useState(() => localDate());
  const [logStateLifetime, setLogStateLifetime] = useState('');
  const [logDataLifetime, setLogDataLifetime] = useState('');
  const [logRefreshing, setLogRefreshing] = useState(false);
  const [logRefreshError, setLogRefreshError] = useState(false);
  const [logCalendarData, setLogCalendarData] = useState<{ key: string; markers: string[]; status: 'loading' | 'ready' | 'error' }>({ key: '', markers: [], status: 'loading' });
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [logBusy, setLogBusy] = useState(false);
  const [quickLogMutation, setQuickLogMutation] = useState<QuickLogMutationView | null>(null);
  const [insightsPeriod, setInsightsPeriod] = useState<InsightsPeriod>('Vecka');
  const [insightsRetryRevision, setInsightsRetryRevision] = useState(0);
  const [insightsView, setInsightsView] = useState<{ key: string; status: 'loading' | 'error' | 'ready' | 'partial'; projection: InsightsProjection | null }>({ key: '', status: 'loading', projection: null });
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
  const [dailySnapshot, setDailySnapshot] = useState<DailyActivitySnapshot | null>(null);
  const [dailyTrainingSnapshot, setDailyTrainingSnapshot] = useState<TrainingWorkspaceSnapshot | null>(null);
  const [dailySnapshotLifetime, setDailySnapshotLifetime] = useState('');
  const [dailyState, setDailyState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dailyStateLifetime, setDailyStateLifetime] = useState('');
  const [dailyRefreshing, setDailyRefreshing] = useState(false);
  const [dailyRefreshError, setDailyRefreshError] = useState(false);
  const [dailyClock, setDailyClock] = useState(() => new Date());
  const [dailyResumeRefresh, setDailyResumeRefresh] = useState(0);
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
  const healthHistoryMutationInFlight = useRef(false);
  const healthHistoryFlightToken = useRef<object | null>(null);
  const pendingPlannedHealthMutation = useRef<PendingPlannedHealthMutation | null>(null);
  const plannedHealthMutationInFlight = useRef(false);
  const plannedHealthFlightToken = useRef<object | null>(null);
  const pendingProfileMutation = useRef<PendingProfileMutation | null>(null);
  const profileMutationInFlight = useRef(false);
  const trainingMutationLease = useRef<TrainingMutationLease | null>(null);
  const dailyGeneration = useRef(0);
  const dailyMutationInFlight = useRef(false);
  const trainingSnapshotRef = useRef<{ scope: string; value: TrainingWorkspaceSnapshot; updatedAt: number } | null>(null);
  const trainingReadFlight = useRef<WorkspaceResourceFlight<TrainingWorkspaceSnapshot> | null>(null);
  const dailySnapshotRef = useRef<{ scope: string; daily: DailyActivitySnapshot; training: TrainingWorkspaceSnapshot; dailyUpdatedAt: number } | null>(null);
  const dailyReadFlight = useRef<WorkspaceResourceFlight<boolean> | null>(null);
  const checklistRangeGeneration = useRef(0);
  const checklistRangeFlight = useRef<{ key: string; generation: number; controller: AbortController; promise: Promise<void> } | null>(null);
  const upcomingPreviewCache = useRef<ChecklistRangeView | null>(null);
  const historicalDetailGeneration = useRef(0);
  const historicalDetailController = useRef<AbortController | null>(null);
  const pendingDailyRetry = useRef<{ lifetime: string; key: string; run: () => Promise<WriteOutcome<unknown>> } | null>(null);
  const mounted = useRef(false);
  const eventReadQueue = useRef<Promise<void>>(Promise.resolve());
  const logDataLifetimeRef = useRef('');
  const logReadGeneration = useRef(0);
  const logReadFlight = useRef<LogReadFlight | null>(null);
  const logPaginationGeneration = useRef(0);
  const logPaginationFlight = useRef<LogPaginationFlight | null>(null);
  const logCalendarGeneration = useRef(0);
  const logCalendarFlight = useRef<{ key: string; controller: AbortController } | null>(null);
  const insightsGeneration = useRef(0);
  const insightsFlight = useRef<{ key: string; generation: number; controller: AbortController } | null>(null);
  const healthReadQueue = useRef<Promise<void>>(Promise.resolve());
  const healthHistoryReadQueue = useRef<Promise<void>>(Promise.resolve());
  const plannedHealthReadQueue = useRef<Promise<void>>(Promise.resolve());
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
    const checklistHealthChild = page === 'planned-health' && previousPage === 'checklist';
    if (page !== 'home' && page !== 'checklist' && page !== 'home-training-detail' && page !== 'training' && !checklistHealthChild) return undefined;
    const refreshClock = () => setDailyClock(new Date());
    const interval = setInterval(refreshClock, 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      refreshClock();
      setDailyResumeRefresh((revision) => revision + 1);
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [page, previousPage]);
  const currentHealthHistoryLifetime = `${dog.id}:${session?.user.id ?? ''}`;
  const currentLogLifetime = `${session?.user.id ?? 'signed-out'}:${accountGeneration}:${dog.id}`;
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
    const previous = previousLogLifetime.current;
    logLifetime.current = currentLogLifetime;
    if (previous !== currentLogLifetime) {
      setLogSelectedDate(localDate());
      logCalendarGeneration.current += 1;
      logCalendarFlight.current?.controller.abort();
      logCalendarFlight.current = null;
      setLogCalendarData({ key: '', markers: [], status: 'loading' });
      const paginationFlight = logPaginationFlight.current;
      if (paginationFlight) {
        logPaginationGeneration.current += 1;
        paginationFlight.controller.abort();
        logPaginationFlight.current = null;
      }
      const flight = logReadFlight.current;
      if (flight) {
        logReadGeneration.current += 1;
        flight.controller.abort();
        logReadFlight.current = null;
      }
      if (previous) {
        pendingLogMutation.current = null;
        logMutationFlight.current = retainLogMutationFlightForLifetime(logMutationFlight.current, currentLogLifetime);
        setLogBusy(false);
        setQuickLogMutation(null);
        setLoadingMore(false);
        setLoadMoreError(false);
        eventRows.current = [];
        setEvents([]);
        logDataLifetimeRef.current = '';
        setLogDataLifetime('');
        setLogRefreshing(false);
        setLogRefreshError(false);
        setLogState('loading');
      }
      setLogStateLifetime(currentLogLifetime);
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
  const homeToday = localDate();
  // An unknown date has no age-based content selection and must not crash Home.
  const age = homeAgeInWeeks(dog.birth_date, homeToday);
  const currentSelectionKey = `${session?.user.id ?? 'signed-out'}:${accountGeneration}:${dog.id}:${dog.breed_id}:${age ?? 'unknown-age'}:${reviewContentEnabled ? 'review' : 'public'}`;
  const dailyTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const validDailyTimeZone = isValidIanaTimeZone(dailyTimeZone);
  const dailyDateKey = validDailyTimeZone ? localDateKeyAt(dailyClock, dailyTimeZone) : null;
  const currentDailyLifetime = dailyActivityScopeKey({ accountId: session?.user.id ?? null, accountGeneration, selectionKey: currentSelectionKey,
    instant: dailyClock, timeZone: dailyTimeZone, review: reviewContentEnabled });
  const dailyLifetime = useRef('');
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
      trainingMutationLease.current = null;
      setBusyStepKey(null);
      trainingSnapshotRef.current = null;
      setTraining({ programs: [], paused: [] });
      setTrainingSelectionKey(null);
      setTrainingState('loading');
      setTrainingError('');
      setHomeChecklistScope(null);
      setHomeTrainingFocus(null);
      if (page === 'checklist' || page === 'home-training-detail') {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- scope ownership invalidates the child route before it can render for a different dog/account.
        setPage('home');
      }
    }
    previousTrainingLifetime.current = currentSelectionKey;
  }, [currentSelectionKey, page, setPage]);

  useLayoutEffect(() => {
    if (dailyLifetime.current && dailyLifetime.current !== currentDailyLifetime) {
      dailyGeneration.current += 1;
      dailyReadFlight.current?.controller.abort();
      dailyReadFlight.current = null;
      // eslint-disable-next-line react-hooks/immutability -- dog/day/timezone scope change fences old range responses before render.
      checklistRangeGeneration.current += 1;
      checklistRangeFlight.current?.controller.abort();
      // eslint-disable-next-line react-hooks/immutability -- old range requests must not be joinable under the new scope.
      checklistRangeFlight.current = null;
      // eslint-disable-next-line react-hooks/immutability -- scope change invalidates historical detail reads.
      historicalDetailGeneration.current += 1;
      historicalDetailController.current?.abort();
      // eslint-disable-next-line react-hooks/immutability -- clear the canceled detail controller after scope change.
      historicalDetailController.current = null;
      setChecklistFilter('Idag');
      setChecklistRangeView({ key: '', status: 'idle', activities: [], routines: [], routineDaySkips: [], snapshot: null, completeSources: [], failedSources: [] });
      upcomingPreviewCache.current = null;
      setUpcomingPreviewView({ key: '', status: 'idle', activities: [], routines: [], routineDaySkips: [], snapshot: null, completeSources: [], failedSources: [] });
      setHistoricalTrainingDetail(null);
      setHistoricalTrainingDetailState('idle');
      dailySnapshotRef.current = null;
      trainingMutationLease.current = null;
      setBusyStepKey(null);
      setHomeTrainingFocus(null);
      setDailySnapshot(null);
      setDailyTrainingSnapshot(null);
      setDailySnapshotLifetime('');
      setDailyState('loading');
      setDailyStateLifetime(currentDailyLifetime);
      setDailyRefreshing(false);
      setDailyRefreshError(false);
      pendingDailyRetry.current = null;
      setDailyMessage('');
      setDailyMessageError(false);
      setHomeChecklistScope(null);
      if (page === 'checklist' || page === 'home-training-detail') {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- a day/timezone boundary invalidates the child route before it can render stale data.
        setPage('home');
      }
    }
    dailyLifetime.current = currentDailyLifetime;
  }, [currentDailyLifetime, page, setPage]);

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

  const loadLogCalendarMarkers = useCallback(async (month: string, force = true) => {
    const scope = currentLogLifetime;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const key = calendarMarkerScopeKey(scope, timeZone, month);
    const active = logCalendarFlight.current;
    if (active?.key === key && !force) return;
    logCalendarGeneration.current += 1;
    const generation = logCalendarGeneration.current;
    active?.controller.abort();
    const controller = new AbortController();
    const flight = { key, controller };
    logCalendarFlight.current = flight;
    setLogCalendarData({ key, markers: [], status: 'loading' });
    try {
      const markers = await serializeEventRead(() => fetchDogLogMonthMarkers(client, dog.id, month, controller.signal));
      if (controller.signal.aborted || !mounted.current || logLifetime.current !== scope
        || logCalendarGeneration.current !== generation || logCalendarFlight.current !== flight) return;
      setLogCalendarData({ key, markers, status: 'ready' });
    } catch {
      if (controller.signal.aborted || !mounted.current || logLifetime.current !== scope
        || logCalendarGeneration.current !== generation || logCalendarFlight.current !== flight) return;
      setLogCalendarData({ key, markers: [], status: 'error' });
    } finally {
      if (logCalendarFlight.current === flight) logCalendarFlight.current = null;
    }
  }, [client, currentLogLifetime, dog.id, serializeEventRead]);

  const cancelLogCalendarRead = useCallback(() => {
    logCalendarGeneration.current += 1;
    logCalendarFlight.current?.controller.abort();
    logCalendarFlight.current = null;
  }, []);

  useEffect(() => {
    if (page !== 'insights') return undefined;
    const scope = currentLogLifetime;
    const timeZone = deviceTimeZone;
    const period = insightsPeriod;
    const key = `${scope}:${timeZone}:${period}`;
    const generation = ++insightsGeneration.current;
    insightsFlight.current?.controller.abort();
    const controller = new AbortController();
    const flight = { key, generation, controller };
    insightsFlight.current = flight;
    const range = createInsightsRange(period, new Date(), timeZone);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- entering a new route/scope must replace stale Insights with a loading state.
    setInsightsView({ key, status: 'loading', projection: null });
    const isCurrent = () => mounted.current && pageRef.current === 'insights'
      && logLifetime.current === scope && insightsGeneration.current === generation
      && insightsFlight.current === flight;
    void serializeEventRead(() => fetchDogInsightsEvents(client, dog.id, range.startIso, range.endIso, controller.signal))
      .then((result: DogInsightsReadResult) => {
        if (!isCurrent()) return;
        const projection = projectInsights({
          events: result.events,
          range,
          timeZone,
          status: result.status,
          partialReason: result.partialReason,
        });
        setInsightsView({ key, status: result.status, projection });
      })
      .catch(() => {
        if (!isCurrent()) return;
        setInsightsView({ key, status: 'error', projection: null });
      });
    return () => {
      controller.abort();
      if (insightsFlight.current === flight) insightsFlight.current = null;
      insightsGeneration.current += 1;
    };
  }, [client, currentLogLifetime, deviceTimeZone, dog.id, insightsPeriod, insightsRetryRevision, page, serializeEventRead]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const nextTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (nextTimeZone === deviceTimeZone) return;
      setDeviceTimeZone(nextTimeZone);
      const month = logCalendarData.key.startsWith(`${currentLogLifetime}:`)
        ? logCalendarData.key.slice(logCalendarData.key.lastIndexOf(':') + 1) : '';
      if (page === 'log' && /^\d{4}-\d{2}$/.test(month)) void loadLogCalendarMarkers(month);
      else cancelLogCalendarRead();
    });
    return () => subscription.remove();
  }, [cancelLogCalendarRead, currentLogLifetime, deviceTimeZone, loadLogCalendarMarkers, logCalendarData.key, page]);

  const reloadEvents = useCallback((intent: 'initial' | 'refresh' = 'initial'): Promise<boolean> => {
    const scope = currentLogLifetime;
    const existing = logReadFlight.current;
    if (existing?.scope === scope) {
      if (intent === 'refresh') {
        existing.refreshRequested = true;
        setLogRefreshing(true);
        setLogRefreshError(false);
      }
      return existing.promise;
    }
    if (existing) {
      existing.controller.abort();
      if (logReadFlight.current === existing) logReadFlight.current = null;
    }

    const generation = ++logReadGeneration.current;
    const controller = new AbortController();
    const baseline = eventRows.current.slice();
    const hasSnapshot = logDataLifetimeRef.current === scope;
    const flight: LogReadFlight = { scope, generation, controller, promise: Promise.resolve(false), baseline, refreshRequested: intent === 'refresh' };
    if (intent === 'refresh') {
      setLogRefreshing(true);
      setLogRefreshError(false);
    } else if (!hasSnapshot) {
      setLogStateLifetime(scope);
      setLogState('loading');
    }
    const isCurrent = () => mounted.current && !controller.signal.aborted
      && logReadGeneration.current === generation && logLifetime.current === scope && logReadFlight.current === flight;
    const promise = serializeEventRead(() => fetchDogEvents(client, dog.id, 0, PAGE_SIZE, undefined, controller.signal)).then((rows) => {
      if (!isCurrent()) return false;
      const merged = mergeConfirmedLogRows(rows, flight.baseline, eventRows.current);
      eventRows.current = merged;
      setEvents(merged);
      logDataLifetimeRef.current = scope;
      setLogDataLifetime(scope);
      setLogStateLifetime(scope);
      setHasMore(rows.length === PAGE_SIZE);
      setLogState('ready');
      setLogRefreshError(false);
      return true;
    }).catch(() => {
      if (!mounted.current || controller.signal.aborted || logReadGeneration.current !== generation
        || logLifetime.current !== scope || logReadFlight.current !== flight) return false;
      if (flight.refreshRequested && hasSnapshot) {
        setLogRefreshError(true);
      } else if (!hasSnapshot) {
        setLogStateLifetime(scope);
        setLogState('error');
      }
      return false;
    }).finally(() => {
      if (logReadFlight.current === flight) logReadFlight.current = null;
      if (mounted.current && !controller.signal.aborted && logReadGeneration.current === generation && logLifetime.current === scope) {
        setLogRefreshing(false);
      }
    });
    flight.promise = promise;
    logReadFlight.current = flight;
    return promise;
  }, [client, currentLogLifetime, dog.id, serializeEventRead]);

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
    const isFresh = hasSnapshot && Date.now() - cached.dailyUpdatedAt < WORKSPACE_REFRESH_AFTER_MS
      && trainingCached?.scope === currentSelectionKey
      && Date.now() - trainingCached.updatedAt < WORKSPACE_REFRESH_AFTER_MS;
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
        dailySnapshotRef.current = { scope, daily: dailyResult.value, training: trainingResult.value, dailyUpdatedAt: Date.now() };
        setDailySnapshot(dailyResult.value);
        setDailyTrainingSnapshot(trainingResult.value);
        setDailySnapshotLifetime(scope);
        setDailyState('ready');
        setDailyStateLifetime(scope);
        setDailyRefreshError(false);
        if (shouldClearDailyMutationFeedback(pendingDailyRetry.current?.lifetime, scope)) {
          setDailyMessage('');
          setDailyMessageError(false);
        }
        return true;
      }
      if (hasSnapshot) {
        setDailyRefreshError(true);
      } else {
        setDailySnapshot(null);
        setDailyTrainingSnapshot(null);
        setDailySnapshotLifetime('');
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
    // Hide the previous dog's kennel link while the next dog's attribution loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    void reloadEvents();
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
      const logFlight = logReadFlight.current;
      if (logFlight?.scope === currentLogLifetime) {
        logReadGeneration.current += 1;
        logFlight.controller.abort();
        logReadFlight.current = null;
      }
      const paginationFlight = logPaginationFlight.current;
      if (paginationFlight?.scope === currentLogLifetime) {
        logPaginationGeneration.current += 1;
        paginationFlight.controller.abort();
        logPaginationFlight.current = null;
      }
      trainingReadFlight.current?.controller.abort();
      dailyReadFlight.current?.controller.abort();
      checklistRangeFlight.current?.controller.abort();
      historicalDetailController.current?.abort();
    };
  }, [client, currentHealthHistoryLifetime, currentLogLifetime, currentPlannedHealthLifetime, currentProfileLifetime, dog.id, reloadEvents, serializeHealthRead, serializeHealthHistoryRead, serializePlannedHealthRead]);

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
    if (page !== 'home' && page !== 'checklist' && page !== 'home-training-detail' && page !== 'training') return;
    const refresh = setTimeout(() => { void reloadDailyActivity(); }, 0);
    return () => clearTimeout(refresh);
  }, [currentDailyLifetime, dailyResumeRefresh, page, reloadDailyActivity]);

  const visibleContent = contentSelectionKey === currentSelectionKey ? content : [];
  const visibleContentState = contentSelectionKey === currentSelectionKey ? contentState : 'loading';
  const visibleTrainingState = trainingSelectionKey === currentSelectionKey ? trainingState : 'loading';
  const dailyStateForView = dailyStateLifetime === currentDailyLifetime ? dailyState : 'loading';
  const dailySnapshotForView = dailySnapshotLifetime === currentDailyLifetime ? dailySnapshot : null;
  const dailyTrainingForView = dailySnapshotLifetime === currentDailyLifetime ? dailyTrainingSnapshot : null;
  const dailyActivities = dailyStateForView === 'ready' && dailySnapshotForView && dailyTrainingForView && dailyDateKey
    ? deriveHomeDailyActivities(dailySnapshotForView, dailyTrainingForView.programs.filter((program) => !program.id.startsWith('review-v1:training:')), dog.id, dailyDateKey)
    : [];
  const checklistRangeKey = `${currentDailyLifetime}:${checklistFilter}`;
  const checklistRangeForView: ChecklistRangeView = checklistRangeView.key === checklistRangeKey
    ? checklistRangeView : { key: checklistRangeKey, status: 'idle', activities: [], routines: [], routineDaySkips: [], snapshot: null, completeSources: [], failedSources: [] };
  const upcomingPreviewKey = `${currentDailyLifetime}:Kommande`;
  const upcomingPreviewForView: ChecklistRangeView = upcomingPreviewView.key === upcomingPreviewKey
    ? upcomingPreviewView : { key: upcomingPreviewKey, status: 'idle', activities: [], routines: [], routineDaySkips: [], snapshot: null, completeSources: [], failedSources: [] };
  const loadChecklistRange = useCallback(async (filter: Exclude<ChecklistFilter, 'Idag'>, force = false) => {
    if (!dailyDateKey || !validDailyTimeZone) return;
    const scope = currentDailyLifetime;
    const key = `${scope}:${filter}`;
    const active = checklistRangeFlight.current;
    if (!force && active?.key === key) {
      if (checklistFilterRef.current === filter) setChecklistRangeView({ key, status: 'loading', activities: [], routines: [], routineDaySkips: [], snapshot: null, completeSources: [], failedSources: [] });
      return active.promise;
    }
    const cachedUpcoming = upcomingPreviewCache.current;
    if (!force && filter === 'Kommande' && cachedUpcoming?.key === key
      && (cachedUpcoming.status === 'ready' || cachedUpcoming.status === 'error')) {
      if (checklistFilterRef.current === filter) setChecklistRangeView(cachedUpcoming);
      return;
    }
    active?.controller.abort();
    // eslint-disable-next-line react-hooks/immutability -- request generation is a mutable lifetime fence changed only when a filter read starts.
    const generation = ++checklistRangeGeneration.current;
    const controller = new AbortController();
    const isCurrent = () => mounted.current && !accountDeletionInvalidated.current && !controller.signal.aborted
      && checklistRangeGeneration.current === generation && checklistRangeFlight.current?.generation === generation
      && dailyLifetime.current === scope && currentSelectionKeyRef.current === currentSelectionKey
      && (filter === 'Kommande' || checklistFilterRef.current === filter) && pageRef.current === 'checklist';
    const loadingView: ChecklistRangeView = { key, status: 'loading', activities: [], routines: [], routineDaySkips: [], snapshot: null, completeSources: [], failedSources: [] };
    if (checklistFilterRef.current === filter) setChecklistRangeView(loadingView);
    if (filter === 'Kommande') {
      upcomingPreviewCache.current = loadingView;
      setUpcomingPreviewView(loadingView);
    }
    let promise: Promise<void>;
    promise = (async () => {
      try {
        const range = checklistFilterRange(filter, dailyDateKey);
        if (!range) throw new Error('Invalid checklist date range');
        const snapshot = await fetchDailyActivityRangeSnapshot(client, dog.id, range.from, range.to, filter === 'Kommande', controller.signal);
        if (!isCurrent()) return;
        const failedSources = [...snapshot.failedSources];
        const trainingSources = new Map<string, { programVersionId: string; programTitle: string; stepId: string; stepTitle: string; completedAt: string | null }>();
        const selections = [...new Map(snapshot.trainingSelections.map((item) => [`${item.program_version_id}:${item.step_id}`, {
          programVersionId: item.program_version_id, stepId: item.step_id,
        }])).values()];
        if (selections.length > 0) {
          try {
            const resolved = await fetchExactHistoricalTrainingSources(client, dog.id, selections, controller.signal);
            if (!isCurrent()) return;
            for (const [lookupKey, value] of resolved.sources) trainingSources.set(lookupKey, value);
            if (resolved.unresolvedKeys.length) failedSources.push('historicalTrainingSources');
          } catch {
            if (!isCurrent()) return;
            failedSources.push('historicalTrainingSources');
          }
        }
        const activities = deriveSavedRangeActivities(snapshot, trainingSources, dog.id, range.from, range.to);
        if (filter === 'Kommande' && snapshot.completeSources.includes('routines')) {
          activities.push(...projectUpcomingRoutineDates(snapshot.routines, range.from, range.to).map(({ routine, dateKey }) => ({
            id: `planned-routine:${routine.id}:${dateKey}`, label: routine.label, routineLabel: routine.label, routineId: routine.id,
            icon: routine.checklist.find((item) => item.icon)?.icon,
            kind: 'routine' as const, completed: false, planned: true, dateKey,
          })));
        }
        if (filter === 'Kommande') {
          let plannedHealthRows = [] as Awaited<ReturnType<typeof fetchPlannedHealthChecklistRange>>;
          let healthSourceRead = false;
          try {
            plannedHealthRows = await fetchPlannedHealthChecklistRange(client, dog.id, range.from, range.to, controller.signal);
            healthSourceRead = true;
            if (!isCurrent()) return;
          } catch {
            if (!isCurrent()) return;
            failedSources.push('plannedHealth');
          }
          if (healthSourceRead) activities.push(...plannedHealthRows.map((row) => ({
            id: `planned-health:${row.id}`, label: row.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök',
            kind: 'health' as const, completed: false, planned: true, dateKey: row.due_on, healthType: row.event_type,
          })));
        }
        if (!isCurrent()) return;
        const successfulSources = snapshot.completeSources.length + (filter === 'Kommande' && !failedSources.includes('plannedHealth') ? 1 : 0);
        const resultView: ChecklistRangeView = { key, status: successfulSources === 0 ? 'error' : 'ready', activities: activities.sort((left, right) =>
          (left.dateKey ?? '').localeCompare(right.dateKey ?? '') || left.id.localeCompare(right.id)), routines: snapshot.routines,
          routineDaySkips: snapshot.routineDaySkips, snapshot, completeSources: snapshot.completeSources, failedSources };
        if (checklistFilterRef.current === filter) setChecklistRangeView(resultView);
        if (filter === 'Kommande') {
          upcomingPreviewCache.current = resultView;
          setUpcomingPreviewView(resultView);
        }
      } catch {
        if (!isCurrent()) return;
        const errorView: ChecklistRangeView = { key, status: 'error', activities: [], routines: [], routineDaySkips: [], snapshot: null, completeSources: [], failedSources: ['range'] };
        if (checklistFilterRef.current === filter) setChecklistRangeView(errorView);
        if (filter === 'Kommande') {
          upcomingPreviewCache.current = errorView;
          setUpcomingPreviewView(errorView);
        }
      } finally {
        if (checklistRangeFlight.current?.generation === generation) checklistRangeFlight.current = null;
      }
    })();
    // eslint-disable-next-line react-hooks/immutability -- retain a cancellable request handle outside render for its async lifetime.
    checklistRangeFlight.current = { key, generation, controller, promise };
    return promise;
  }, [client, currentDailyLifetime, currentSelectionKey, dailyDateKey, dog.id, validDailyTimeZone]);
  useLayoutEffect(() => {
    const previous = checklistRequestContext.current;
    const pageChanged = previous.page !== page;
    const filterChanged = previous.filter !== checklistFilter;
    const resumed = previous.resumeRefresh !== dailyResumeRefresh;
    checklistRequestContext.current = { page, filter: checklistFilter, resumeRefresh: dailyResumeRefresh };
    if (page !== 'checklist') {
      // eslint-disable-next-line react-hooks/immutability -- leaving Checklist fences the in-flight range read before it can publish stale rows.
      checklistRangeGeneration.current += 1;
      checklistRangeFlight.current?.controller.abort();
      // eslint-disable-next-line react-hooks/immutability -- discard the canceled request handle before another range can start.
      checklistRangeFlight.current = null;
      return;
    }
    const requestedFilter = checklistFilter === 'Idag' ? 'Kommande' : checklistFilter;
    const force = pageChanged || resumed || filterChanged && requestedFilter !== 'Kommande';
    void loadChecklistRange(requestedFilter, force);
  }, [checklistFilter, dailyResumeRefresh, loadChecklistRange, page]);
  const visibleHomeTrainingFocus = homeTrainingFocus?.selectionKey === currentSelectionKey
    && homeTrainingFocus.dailyLifetime === currentDailyLifetime ? homeTrainingFocus : null;
  const homeChecklistScopeIsCurrent = homeChecklistScope?.selectionKey === currentSelectionKey
    && homeChecklistScope.dailyLifetime === currentDailyLifetime;
  const visiblePage: ProductPage = (page === 'checklist' || page === 'home-training-detail') && !homeChecklistScopeIsCurrent ? 'home' : page;
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

  const displayEvents = useMemo(() => logDataLifetime === currentLogLifetime ? events.map(toLogEvent) : [], [currentLogLifetime, events, logDataLifetime]);
  const visibleLogState = logStateLifetime === currentLogLifetime ? logState : 'loading';
  const insightsScopeKey = `${currentLogLifetime}:${deviceTimeZone}:${insightsPeriod}:${insightsRetryRevision}`;
  const visibleInsightsView = insightsView.key === insightsScopeKey
    ? insightsView
    : { key: insightsScopeKey, status: 'loading' as const, projection: null };
  const calendarTimeZone = deviceTimeZone;
  const calendarKeyPrefix = `${currentLogLifetime}:${calendarTimeZone}:`;
  const calendarDataIsCurrent = logCalendarData.key.startsWith(calendarKeyPrefix);
  const calendarDataMonth = calendarDataIsCurrent ? logCalendarData.key.slice(calendarKeyPrefix.length) : '';
  const nextExercise = pickNextExercise(training.programs);
  const nextProgram = training.programs.find((program) => program.id === nextExercise?.programId);
  const nextStep = nextProgram?.steps.find((step) => step.id === nextExercise?.stepId);

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
    const lifetime = logLifetime.current;
    const existing = logPaginationFlight.current;
    if (existing?.scope === lifetime || loadingMore || !hasMore) return;
    if (existing) {
      logPaginationGeneration.current += 1;
      existing.controller.abort();
      logPaginationFlight.current = null;
    }
    const generation = ++logPaginationGeneration.current;
    const controller = new AbortController();
    const flight: LogPaginationFlight = { scope: lifetime, generation, controller };
    logPaginationFlight.current = flight;
    const isCurrent = () => mounted.current && !controller.signal.aborted
      && logPaginationGeneration.current === generation && logLifetime.current === lifetime
      && logPaginationFlight.current === flight;
    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const next = await serializeEventRead(() => fetchDogEvents(client, dog.id, eventRows.current.length, PAGE_SIZE, undefined, controller.signal));
      if (!isCurrent()) return;
      setLoadMoreError(false);
      const merged = [...eventRows.current, ...next.filter((row) => !eventRows.current.some((existing) => existing.id === row.id))];
      eventRows.current = merged;
      setEvents(merged);
      setHasMore(next.length === PAGE_SIZE);
    } catch {
      if (!isCurrent()) return;
      setLoadMoreError(true);
    } finally {
      if (logPaginationFlight.current === flight) {
        logPaginationFlight.current = null;
        if (mounted.current && !controller.signal.aborted && logPaginationGeneration.current === generation
          && logLifetime.current === lifetime) setLoadingMore(false);
      }
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

  function saveHealthHistory(id: string | null, eventType: HealthHistoryType, occurredOn: string, occurredTime: string | null, note: string): Promise<boolean> {
    const lifetime = healthHistoryLifetime.current;
    if (healthHistoryMutationInFlight.current || pendingHealthHistoryMutation.current || healthHistoryState !== 'ready') return Promise.resolve(false);
    if (!isValidHealthHistoryDate(occurredOn) || !isValidHealthHistoryTime(occurredTime)) return Promise.resolve(false);
    const description = normalizeHealthHistoryDescription(note);
    if (description === undefined || (eventType !== 'vaccination' && eventType !== 'vet_visit')) return Promise.resolve(false);
    if (id === null) {
      const operation: HealthHistoryOperation = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, event_type: eventType, occurred_on: occurredOn, occurred_time: occurredTime, description };
      return runHealthHistoryMutation({ kind: 'insert', operation, lifetime });
    }
    const previous = healthHistoryRows.current.find((row) => row.id === id && row.event_type === eventType);
    if (!previous) return Promise.resolve(false);
    return runHealthHistoryMutation({ kind: 'update', id, eventType, previous, changes: { occurred_on: occurredOn, occurred_time: occurredTime, description }, lifetime });
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

  function savePlannedHealth(id: string | null, eventType: PlannedHealthType, dueOn: string, note: string, reminderEnabled?: boolean, reminderMinutes?: number | null, dueTime?: string | null): Promise<boolean> {
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
      return runPlannedHealthMutation({ kind: 'insert', operation, lifetime });
    }
    if (!previous) return Promise.resolve(false);
    return runPlannedHealthMutation({ kind: 'update', id, previous, changes: { due_on: dueOn, due_time: dueTime === undefined ? previous.due_time : dueTime, description, reminder_enabled: enabled, reminder_minutes: minutes }, localToday, lifetime });
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
    await reloadEvents(logDataLifetimeRef.current === currentLogLifetime ? 'refresh' : 'initial');
  }

  async function retryTraining() {
    await reloadDailyActivity(true, true);
  }

  function openHomeChecklist() {
    setChecklistFilter('Idag');
    checklistRangeGeneration.current += 1;
    checklistRangeFlight.current?.controller.abort();
    checklistRangeFlight.current = null;
    upcomingPreviewCache.current = null;
    setUpcomingPreviewView({ key: '', status: 'idle', activities: [], routines: [], routineDaySkips: [], snapshot: null, completeSources: [], failedSources: [] });
    setHomeChecklistScope({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime });
    setPage('checklist');
  }

  function openHomeTrainingStep(programId: string, stepId: string, returnPage: 'home' | 'checklist') {
    const isSelectedToday = dailyActivities.some((activity) => activity.kind === 'training'
      && activity.programId === programId && activity.stepId === stepId);
    if (!isSelectedToday || accountDeletionInvalidated.current || currentSelectionKeyRef.current !== currentSelectionKey) return;
    setHomeChecklistScope({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime });
    setHomeTrainingFocus({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime, programId, stepId, returnPage });
    setPage('home-training-detail');
  }

  function openHistoricalTrainingStep(programId: string, stepId: string) {
    const range = checklistRangeForView.snapshot;
    const selected = range?.trainingSelections.some((item) => item.dog_id === dog.id
      && item.program_version_id === programId && item.step_id === stepId);
    if (checklistRangeForView.status !== 'ready' || !selected || accountDeletionInvalidated.current
      || currentSelectionKeyRef.current !== currentSelectionKey) return;
    setHomeChecklistScope({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime });
    setHomeTrainingFocus({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime, programId, stepId, returnPage: 'checklist', readOnly: true });
    historicalDetailGeneration.current += 1;
    const generation = historicalDetailGeneration.current;
    historicalDetailController.current?.abort();
    const controller = new AbortController();
    historicalDetailController.current = controller;
    setHistoricalTrainingDetail(null);
    setHistoricalTrainingDetailState('loading');
    setPage('home-training-detail');
    void fetchExactHistoricalTrainingDetail(client, dog.id, programId, stepId, controller.signal).then((program) => {
      if (!mounted.current || controller.signal.aborted || historicalDetailGeneration.current !== generation
        || dailyLifetime.current !== currentDailyLifetime || currentSelectionKeyRef.current !== currentSelectionKey
        || pageRef.current !== 'home-training-detail') return;
      if (!program) {
        setHistoricalTrainingDetailState('error');
        return;
      }
      setHistoricalTrainingDetail(program);
      setHistoricalTrainingDetailState('ready');
    }).catch(() => {
      if (!mounted.current || controller.signal.aborted || historicalDetailGeneration.current !== generation
        || dailyLifetime.current !== currentDailyLifetime || currentSelectionKeyRef.current !== currentSelectionKey
        || pageRef.current !== 'home-training-detail') return;
      setHistoricalTrainingDetailState('error');
    });
  }

  function openPlannedRoutineManager(routineId: string): boolean {
    const currentRoutine = checklistRangeForView.routines.find((routine) => routine.id === routineId);
    const projected = checklistRangeForView.activities.some((item) => item.planned && item.routineId === routineId);
    if (checklistFilter !== 'Kommande' || checklistRangeForView.status !== 'ready' || !currentRoutine || !projected) {
      void loadChecklistRange('Kommande', true);
      return false;
    }
    setHomeChecklistScope({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime });
    return true;
  }

  function openPlannedHealthFromChecklist(activity: HomeDailyActivity) {
    const isCurrentPlan = checklistFilter === 'Kommande' && activity.kind === 'health' && activity.planned
      && checklistRangeForView.activities.some((item) => item.id === activity.id);
    if (!isCurrentPlan || checklistRangeForView.status !== 'ready') {
      void loadChecklistRange('Kommande', true);
      return;
    }
    const lifetime = currentPlannedHealthLifetime;
    setPlannedHealthState('loading');
    setPage('planned-health');
    void reloadPlannedHealth(lifetime).catch(() => {
      if (mounted.current && plannedHealthLifetime.current === lifetime) setPlannedHealthState('error');
    });
  }

  function beginTrainingMutation(key: string, expectedScope: string | null): TrainingMutationLease | null {
    const scope = currentSelectionKeyRef.current;
    if (!mounted.current) return null;
    const lease = acquireTrainingMutationLease(trainingMutationLease.current, expectedScope, scope, accountDeletionInvalidated.current);
    if (!lease) return null;
    trainingMutationLease.current = lease;
    setBusyStepKey(key);
    setTrainingError('');
    return lease;
  }

  function isTrainingMutationCurrent(lease: TrainingMutationLease): boolean {
    return ownsTrainingMutationLease(trainingMutationLease.current, lease, currentSelectionKeyRef.current, accountDeletionInvalidated.current);
  }

  function finishTrainingMutation(lease: TrainingMutationLease) {
    const ownsLock = trainingMutationLease.current === lease;
    trainingMutationLease.current = releaseTrainingMutationLease(trainingMutationLease.current, lease);
    if (ownsLock && mounted.current && currentSelectionKeyRef.current === lease.scope && !accountDeletionInvalidated.current) setBusyStepKey(null);
  }

  async function completeStep(program: PublishedTrainingProgram, stepId: string): Promise<{ programId: string; stepId: string } | false> {
    const key = `${program.id}:${stepId}`;
    const lease = beginTrainingMutation(key, currentSelectionKey);
    if (!lease || !isTrainingMutationCurrent(lease)) return false;
    try {
      const outcome = await insertTrainingProgress(client, { dog_id: dog.id, program_version_id: program.id, step_id: stepId });
      if (!isTrainingMutationCurrent(lease)) return false;
      if (outcome.status === 'saved') {
        try {
          const refreshed = await reloadTraining({ force: true, supersede: true, publishToDaily: true });
          if (!isTrainingMutationCurrent(lease)) return false;
          const confirmedProgram = refreshed ? refreshed.programs.find((item) => item.id === program.id) : undefined;
          if (program.completedStepIds.includes(stepId) || !confirmedProgram?.completedStepIds.includes(stepId)) {
            setTrainingError('Steget sparades, men en ny statusändring kunde inte bekräftas. Läs in programmet igen innan du fortsätter.');
            return false;
          }
          void analyticsService.track('training_completed');
          return { programId: program.id, stepId };
        } catch {
          if (!isTrainingMutationCurrent(lease)) return false;
          setTrainingState('error');
          setTrainingError('Steget är sparat, men programstatus kunde inte hämtas. Läs in programmet igen innan du fortsätter.');
          return false;
        }
      }
      let progressChecked = true;
      try {
        if (!isTrainingMutationCurrent(lease)) return false;
        await reloadTraining({ force: true, supersede: true, publishToDaily: true });
        if (!isTrainingMutationCurrent(lease)) return false;
      } catch {
        if (!isTrainingMutationCurrent(lease)) return false;
        progressChecked = false;
      }
      if (!isTrainingMutationCurrent(lease)) return false;
      setTrainingError(!progressChecked
        ? 'Vi kunde inte kontrollera om steget sparades. Läs in programmet igen innan du försöker på nytt.'
        : outcome.status === 'unknown'
          ? 'Vi kunde inte bekräfta att steget sparades. Programmet har hämtats igen; om steget saknas kan du försöka på nytt.'
          : 'Steget kunde inte registreras. Kontrollera anslutningen och försök igen.');
      return false;
    } catch {
      if (!isTrainingMutationCurrent(lease)) return false;
      setTrainingError('Steget kunde inte registreras. Kontrollera anslutningen och försök igen.');
      return false;
    } finally {
      finishTrainingMutation(lease);
    }
  }

  async function unmarkStep(program: PublishedTrainingProgram, stepId: string): Promise<{ programId: string; stepId: string } | false> {
    const key = `${program.id}:${stepId}:unmark`;
    const lease = beginTrainingMutation(key, currentSelectionKey);
    if (!lease || !isTrainingMutationCurrent(lease)) return false;
    try {
      const outcome = await deleteTrainingProgress(client, dog.id, program.id, stepId);
      if (!isTrainingMutationCurrent(lease)) return false;
      const refreshed = await reloadTraining({ force: true, supersede: true, publishToDaily: true });
      if (!isTrainingMutationCurrent(lease)) return false;
      const confirmedProgram = refreshed.programs.find((item) => item.id === program.id);
      if (confirmedProgram && !confirmedProgram.completedStepIds.includes(stepId)) return { programId: program.id, stepId };
      setTrainingError(!confirmedProgram
        ? 'Programmet kunde inte verifieras efter ändringen. Hämta programmet igen innan du fortsätter.'
        : outcome.status === 'failed'
          ? 'Steget är fortfarande markerat. Kontrollera anslutningen och försök igen.'
          : 'Vi kunde inte bekräfta att steget avmarkerades. Programmet har hämtats igen; kontrollera statusen innan du försöker på nytt.');
      return false;
    } catch {
      if (!isTrainingMutationCurrent(lease)) return false;
      setTrainingError('Vi kunde inte kontrollera om steget avmarkerades. Hämta programmet igen innan du ändrar det.');
      return false;
    } finally {
      finishTrainingMutation(lease);
    }
  }

  async function resetProgram(program: PublishedTrainingProgram) {
    const lease = beginTrainingMutation(`${program.id}:reset`, currentSelectionKey);
    if (!lease || !isTrainingMutationCurrent(lease)) return;
    try {
      for (const stepId of program.completedStepIds) {
        if (!isTrainingMutationCurrent(lease)) return;
        const outcome = await deleteTrainingProgress(client, dog.id, program.id, stepId);
        if (!isTrainingMutationCurrent(lease)) return;
        if (outcome.status !== 'saved') throw new Error('Progress could not be cleared');
      }
      if (!isTrainingMutationCurrent(lease)) return;
      await reloadTraining({ force: true, supersede: true, publishToDaily: true });
      if (!isTrainingMutationCurrent(lease)) return;
    } catch {
      if (!isTrainingMutationCurrent(lease)) return;
      try {
        await reloadTraining({ force: true, supersede: true, publishToDaily: true });
        if (!isTrainingMutationCurrent(lease)) return;
        setTrainingError('Alla genomförda steg kunde inte rensas. Kontrollera programmet och försök igen.');
      } catch {
        if (!isTrainingMutationCurrent(lease)) return;
        setTrainingState('error');
        setTrainingError('Vi kunde inte kontrollera om stegen rensades. Hämta programmet igen innan du ändrar det.');
      }
    } finally {
      finishTrainingMutation(lease);
    }
  }

  async function runDailyMutation<T>(key: string, operation: () => Promise<WriteOutcome<T>>, retry = false): Promise<WriteOutcome<T> | undefined> {
    const lifetime = currentDailyLifetime;
    if (!dailyDateKey || !validDailyTimeZone || dailyMutationInFlight.current) return undefined;
    if (pendingDailyRetry.current && pendingDailyRetry.current.lifetime === lifetime && !retry) {
      setDailyMessage('Kontrollera den föregående ändringen innan du gör en ny.');
      setDailyMessageError(true);
      return undefined;
    }
    dailyMutationInFlight.current = true;
    setDailyBusyKey(key);
    setDailyMessageKey(key);
    if (!retry || shouldClearDailyMutationFeedback(pendingDailyRetry.current?.lifetime, lifetime)) {
      setDailyMessage('');
      setDailyMessageError(false);
    }
    let outcome: WriteOutcome<T>;
    try {
      outcome = await operation();
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
      const refreshed = await reloadDailyActivity(true, true);
      if (mounted.current && dailyLifetime.current === lifetime && currentSelectionKeyRef.current === currentSelectionKey
        && pageRef.current === 'checklist' && checklistFilterRef.current !== 'Idag') {
        await loadChecklistRange(checklistFilterRef.current, true);
      } else if (mounted.current && dailyLifetime.current === lifetime && currentSelectionKeyRef.current === currentSelectionKey
        && pageRef.current === 'checklist' && checklistFilterRef.current === 'Idag'
        && /^(create|update|delete)-routine:/.test(key)) {
        await loadChecklistRange('Kommande', true);
      }
      if (!refreshed && mounted.current && dailyLifetime.current === lifetime) {
        setDailyMessage('Ändringen sparades, men dagens lista kunde inte hämtas. Status räknas först efter en ny avläsning.');
        setDailyMessageError(true);
      }
    } else if (outcome.status === 'unknown') {
      pendingDailyRetry.current = { lifetime, key, run: operation };
      setDailyMessage('Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.');
      setDailyMessageError(true);
    } else {
      pendingDailyRetry.current = { lifetime, key, run: operation };
      setDailyMessage('Ändringen sparades inte. Kontrollera anslutningen och försök igen.');
      setDailyMessageError(true);
    }
    dailyMutationInFlight.current = false;
    if (mounted.current) setDailyBusyKey(null);
    return outcome;
  }

  function retryDailyMutation() {
    const pending = pendingDailyRetry.current;
    if (!pending || pending.lifetime !== currentDailyLifetime) return;
    void runDailyMutation(pending.key, pending.run, true);
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
      || profileMutationInFlight.current || trainingMutationLease.current !== null || dailyMutationInFlight.current
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
      trainingMutationLease.current = null;
      setBusyStepKey(null);
      setHomeTrainingFocus(null);
      if (page === 'checklist' || page === 'home-training-detail') setPage('home');
      reminderService.setActiveContext(null, null);
      setAccountDeleteStatus('confirmed');
      let cleanupFailed = false;
      let cleanupFailureReported = false;
      // The request key is scoped to the deleted owner and is independent of
      // whichever account is active now, so always clear it after server
      // confirmation before any account-generation early return.
      try {
        await clearDogCreationRequest(ownerId);
      } catch {
        cleanupFailed = true;
        reportDeletedAccountCleanupFailure(ownerId);
        cleanupFailureReported = true;
      }
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
      if (cleanupFailed && !cleanupFailureReported) reportDeletedAccountCleanupFailure(ownerId);
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
  const transitionDirection = navigationDirection(previousPage, page);
  const mainTabToMainTab = isMainTabDestination(previousPage) && isMainTabDestination(page);
  const transitionDistance = mainTabToMainTab ? tokens.motion.pageDistance : tokens.motion.distance;
  const scrollKey = visiblePage === 'checklist' ? 'home-checklist-flow' : visiblePage;
  const preserveScrollKey = visiblePage === 'checklist' || visiblePage === 'home-training-detail'
    || visiblePage === 'planned-health' && previousPage === 'checklist' ? 'home-checklist-flow'
      : visiblePage === 'log' || visiblePage === 'insights' ? 'log-insights-flow' : undefined;
  return <AppScreen scrollKey={scrollKey} preserveScrollKey={preserveScrollKey}
    scrollResetKey={preserveScrollKey === 'home-checklist-flow' ? checklistFilter : undefined}
    footer={accountDeleteBusy || accountDeleteStatus === 'confirmed' || accountDeleteStatus === 'unknown' ? undefined : <BottomNav active={activeMainTabDestination(visiblePage)} onChange={navigateMainTab} />}
    refreshing={page === 'home' ? dailyRefreshing : page === 'log' ? logRefreshing : false}
    onRefresh={page === 'home' ? () => { void reloadDailyActivity(true, false); } : page === 'log' ? () => { void reloadEvents('refresh'); } : undefined}
    refreshAccessibilityLabel={page === 'log' ? 'Uppdatera loggen' : 'Uppdatera Hem'}>
    <MainSwipeNavigation enabled={isMainTabDestination(page) && !(page === 'knowledge' && knowledgeDetailOpen)} onSwipe={handleMainSwipe}>
      <ScreenTransition transitionKey={page} direction={transitionDirection} axis="x" distance={transitionDistance}>{pageContent}</ScreenTransition>
    </MainSwipeNavigation>
  </AppScreen>;

  function renderPage() {
    const page = visiblePage;
    if (page === 'checklist') return <DailyChecklistScreen key={`${currentDailyLifetime}:checklist`}
      dateKey={dailyDateKey ?? ''} filter={checklistFilter} onChangeFilter={setChecklistFilter}
      state={dailyStateForView} rangeState={checklistRangeForView.status} rangeFailedSources={checklistRangeForView.failedSources}
      upcomingPreviewState={upcomingPreviewForView.status} upcomingPreviewActivities={upcomingPreviewForView.activities}
      upcomingPreviewFailedSources={upcomingPreviewForView.failedSources}
      activities={checklistFilter === 'Idag' ? dailyActivities : checklistRangeForView.activities} todayActivities={dailyActivities}
      refreshing={dailyRefreshing} refreshError={dailyRefreshError} mutationBusy={Boolean(dailyBusyKey)}
      mutationKey={dailyMessageKey} mutationMessage={dailyMessage} mutationError={dailyMessageError}
      onBack={() => navigateMainTab('home')} onRetry={() => { void reloadDailyActivity(true); }}
      onRetryRange={() => { if (checklistFilter !== 'Idag') void loadChecklistRange(checklistFilter, true); }}
      onRetryUpcomingPreview={() => { void loadChecklistRange('Kommande', true); }}
      onRetryMutation={pendingDailyRetry.current?.lifetime === currentDailyLifetime ? retryDailyMutation : undefined}
      onOpenTrainingStep={(programId, stepId, returnPage, readOnly) => readOnly
        ? openHistoricalTrainingStep(programId, stepId) : openHomeTrainingStep(programId, stepId, returnPage)}
      onOpenPlannedRoutine={openPlannedRoutineManager} onOpenPlannedHealth={openPlannedHealthFromChecklist}
      onSetRoutineCompletion={(row, itemId, completed) => {
        void runDailyMutation(`complete-routine:${row.id}:${itemId}`, () => setRoutineDayCompletion(client, row, itemId, completed));
      }}
      routines={checklistFilter === 'Kommande' ? checklistRangeForView.routines : dailySnapshotForView?.routines ?? []}
      routineDaySkips={checklistFilter === 'Kommande' ? checklistRangeForView.routineDaySkips : dailySnapshotForView?.routineDaySkips ?? []}
      trainingOptions={dailyTrainingOptions}
      onCreateRoutine={(input: DailyRoutineCreateInput) => {
        const row = { ...input, dog_id: dog.id };
        return runDailyMutation(`create-routine:${row.id}`, () => createDailyRoutine(client, row, dailyTimeZone));
      }}
      onUpdateRoutine={(routine, label, checklist, repeat) => runDailyMutation(`update-routine:${routine.id}`,
        () => replaceDailyRoutine(client, routine, label, checklist, repeat, dailyTimeZone))}
      onDeleteRoutine={(routine) => runDailyMutation(`delete-routine:${routine.id}`, () => deleteDailyRoutine(client, routine))}
      onAddRoutineToDay={(routine) => {
        if (!dailyDateKey) return;
        const skipped = dailySnapshotForView?.routineDaySkips.find((row) => row.routine_id === routine.id) ?? null;
        const row: DailyRoutineDayDraft = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, routine_id: routine.id,
          date_key: dailyDateKey, time_zone: dailyTimeZone, routine_label_snapshot: routine.label, checklist_snapshot: routine.checklist };
        void runDailyMutation(`select-routine:${routine.id}`, () => addRoutineToDay(client, row, skipped, ExpoCrypto.randomUUID()));
      }}
      onRemoveRoutineFromDay={(row, routine) => { void runDailyMutation(`remove-routine:${row.id}`,
        () => removeRoutineFromDay(client, row, routine, ExpoCrypto.randomUUID())); }}
      onAddTrainingToDay={(option) => {
        if (!dailyDateKey) return;
        const row: DailyTrainingSelection = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, program_version_id: option.versionId,
          step_id: option.stepId, date_key: dailyDateKey, time_zone: dailyTimeZone };
        void runDailyMutation(`select-training:${option.versionId}:${option.stepId}`, () => addTrainingSelection(client, row));
      }}
      onRemoveTrainingFromDay={(row) => { void runDailyMutation(`remove-training:${row.id}`, () => removeTrainingSelection(client, row)); }}
      onGoTraining={() => navigateMainTab('training')} />;
    if (page === 'home') return <HomeScreen
      dog={dog}
      ownedDogs={ownedDogs}
      onSelectDog={onSelectDog}
      onAddDog={() => onAddDog?.('home')}
      openDogSwitcherInitially={openDogSwitcherInitially}
      onDogSwitcherInitiallyOpened={onDogSwitcherInitiallyOpened}
      today={homeToday}
      breed={breeds.find((breed) => breed.id === dog.breed_id)?.name ?? ''}
      events={displayEvents}
      healthHistory={healthHistory}
      healthHistoryState={healthHistoryState}
      plans={plannedHealth}
      logState={visibleLogState}
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
      onRetryDaily={() => { void reloadDailyActivity(true); }}
      onOpenChecklist={openHomeChecklist}
      onOpenTrainingStep={openHomeTrainingStep}
      onCreateRoutine={(input: DailyRoutineCreateInput) => {
        const row = { ...input, dog_id: dog.id };
        return runDailyMutation(`create-routine:${row.id}`, () => createDailyRoutine(client, row, dailyTimeZone));
      }}
      onUpdateRoutine={(routine, label, checklist, repeat) => {
        return runDailyMutation(`update-routine:${routine.id}`, () => replaceDailyRoutine(client, routine, label, checklist, repeat, dailyTimeZone));
      }}
      onDeleteRoutine={(routine) => runDailyMutation(`delete-routine:${routine.id}`, () => deleteDailyRoutine(client, routine))}
      onAddRoutineToDay={(routine) => {
        if (!dailyDateKey) return;
        const skipped = dailySnapshotForView?.routineDaySkips.find((row) => row.routine_id === routine.id) ?? null;
        const row: DailyRoutineDayDraft = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, routine_id: routine.id,
          date_key: dailyDateKey, time_zone: dailyTimeZone, routine_label_snapshot: routine.label, checklist_snapshot: routine.checklist };
        const mutationId = ExpoCrypto.randomUUID();
        void runDailyMutation(`select-routine:${routine.id}`, () => addRoutineToDay(client, row, skipped, mutationId));
      }}
      onRemoveRoutineFromDay={(row, routine) => {
        const mutationId = ExpoCrypto.randomUUID();
        void runDailyMutation(`remove-routine:${row.id}`, () => removeRoutineFromDay(client, row, routine, mutationId));
      }}
      onSetRoutineCompletion={(row, itemId, completed) => { void runDailyMutation(`complete-routine:${row.id}:${itemId}`, () => setRoutineDayCompletion(client, row, itemId, completed)); }}
      onAddTrainingToDay={(option) => {
        if (!dailyDateKey) return;
        const row: DailyTrainingSelection = { id: ExpoCrypto.randomUUID(), dog_id: dog.id, program_version_id: option.versionId, step_id: option.stepId, date_key: dailyDateKey, time_zone: dailyTimeZone };
        void runDailyMutation(`select-training:${option.versionId}:${option.stepId}`, () => addTrainingSelection(client, row));
      }}
      onRemoveTrainingFromDay={(row) => { void runDailyMutation(`remove-training:${row.id}`, () => removeTrainingSelection(client, row)); }}
      onRetryDailyMutation={pendingDailyRetry.current?.lifetime === currentDailyLifetime ? retryDailyMutation : undefined}
      onGo={(destination) => {
        navigateMainTab(destination);
      }}
      onOpenContent={(contentId) => {
        setKnowledgeDetailOpen(false);
        setKnowledgeFocus({ selectionKey: currentSelectionKey, contentId, returnPage: 'home' });
        setPage('knowledge');
      }}
      onRetryContent={() => { void retryContent(); }}
    />;
    if (page === 'log') return <LogScreen events={displayEvents} onAdd={addEvent}
      onUpdate={updateEvent} onDelete={(id) => deleteEvent(id)} mode="cloud"
      selectedDate={logSelectedDate} onSelectedDateChange={setLogSelectedDate}
      onOpenInsights={() => { setInsightsRetryRevision((revision) => revision + 1); setPage('insights'); }}
      calendarMarkerMonth={calendarDataMonth} calendarMarkers={calendarDataIsCurrent ? logCalendarData.markers : []}
      calendarStatus={calendarDataIsCurrent ? logCalendarData.status : 'loading'}
      onLoadCalendarMonth={(month) => { void loadLogCalendarMarkers(month); }} onCancelCalendarRead={cancelLogCalendarRead}
      layoutOwnerId={session?.user.id}
      loading={visibleLogState === 'loading'} loadError={visibleLogState === 'error'} refreshError={logRefreshError} onReload={() => { void retryEvents(); }}
      busy={logBusy} mutation={quickLogMutation} loadMoreError={loadMoreError} onRetry={retryLogMutation} onCancel={cancelLogMutation}
      onUndo={(id) => { void undoQuickLog(id); }} hasMore={hasMore} loadingMore={loadingMore}
      onLoadMore={() => { void loadMoreEvents(); }} />;
    if (page === 'insights') return <InsightsScreen
      period={insightsPeriod}
      onPeriodChange={setInsightsPeriod}
      onBack={() => setPage('log')}
      status={visibleInsightsView.status}
      projection={visibleInsightsView.projection}
      onRetry={() => setInsightsRetryRevision((revision) => revision + 1)}
    />;
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
        onRetry={() => { void retryTraining(); }}
        onAddBirthDate={() => { setProfileReturnPage('training'); setPage('profile'); }}
        onOpenKnowledge={() => {
          setKnowledgeDetailOpen(false);
          setKnowledgeFocus({ selectionKey: currentSelectionKey, contentId: null, returnPage: 'training' });
          setPage('knowledge');
        }} />}
    </>;
    if (page === 'home-training-detail') {
      const focus = visibleHomeTrainingFocus;
      const returnToSource = () => {
        historicalDetailGeneration.current += 1;
        historicalDetailController.current?.abort();
        historicalDetailController.current = null;
        if (focus?.readOnly) {
          setHistoricalTrainingDetail(null);
          setHistoricalTrainingDetailState('idle');
        }
        setHomeTrainingFocus(null);
        setPage(focus?.returnPage ?? 'home');
      };
      if (!focus) return <>
        <AppBar mode="Back" title="Träningssteg" actionLabel="Tillbaka till Hem" onAction={() => setPage('home')} variant="compact" />
        <MessageCard>Träningssteget hör inte längre till dagens aktiva lista.</MessageCard>
      </>;
      if (focus.readOnly && historicalTrainingDetailState === 'loading') return <>
        <AppBar mode="Back" title="Träningssteg" actionLabel="Tillbaka till Checklistan" onAction={returnToSource} variant="compact" />
        <PageHeading title="Träningssteg" description="Hämtar den sparade träningskällan…" />
      </>;
      if (focus.readOnly && historicalTrainingDetailState !== 'ready') return <>
        <AppBar mode="Back" title="Träningssteg" actionLabel="Tillbaka till Checklistan" onAction={returnToSource} variant="compact" />
        <MessageCard tone="error">Den publicerade träningskällan kunde inte hämtas. Den sparade aktiviteten finns kvar i listan.</MessageCard>
        <PrimaryButton title="Försök igen" onPress={() => openHistoricalTrainingStep(focus.programId, focus.stepId)} />
      </>;
      if (focus.readOnly && historicalTrainingDetail) return <PublishedTrainingScreen ageWeeks={age} programs={[historicalTrainingDetail]} paused={[]}
        busyStepKey={null} error="" onCompleteStep={async () => false} onContinue={returnToSource} onResetProgram={() => undefined} onRetry={() => openHistoricalTrainingStep(focus.programId, focus.stepId)}
        focusStep={{ programId: focus.programId, stepId: focus.stepId, returnPage: 'checklist', readOnly: true }} onCloseStep={returnToSource} />;
      if (visibleTrainingState === 'loading') return <>
        <AppBar mode="Back" title="Träningssteg" actionLabel={focus.returnPage === 'checklist' ? 'Tillbaka till Checklistan' : 'Tillbaka till Hem'} onAction={returnToSource} variant="compact" />
        <PageHeading title="Träningssteg" description="Hämtar det valda programmet…" />
      </>;
      if (visibleTrainingState === 'error') return <>
        <AppBar mode="Back" title="Träningssteg" actionLabel={focus.returnPage === 'checklist' ? 'Tillbaka till Checklistan' : 'Tillbaka till Hem'} onAction={returnToSource} variant="compact" />
        <MessageCard tone="error">{trainingError || 'Programmet kunde inte hämtas.'}</MessageCard>
        <PrimaryButton title="Försök igen" onPress={() => { void retryTraining(); }} />
      </>;
      return <PublishedTrainingScreen ageWeeks={age} programs={training.programs} paused={training.paused}
        reviewMode={reviewContentEnabled && training.programs.some((program) => program.id.startsWith('review-v1:training:'))}
        busyStepKey={busyStepKey} error={trainingError} onCompleteStep={completeStep} onUnmarkStep={unmarkStep}
        focusStep={{ programId: focus.programId, stepId: focus.stepId, returnPage: focus.returnPage }}
        onCloseStep={returnToSource} onContinue={returnToSource} onResetProgram={(program) => { void resetProgram(program); }}
        onRetry={() => { void retryTraining(); }} />;
    }
    if (page === 'more') return <MoreScreen onNavigate={(destination) => {
      if (destination === 'reminders') {
        setNotificationSaved(false);
        setPage('notification-settings');
      } else if (destination === 'account') setPage('account-settings');
      else {
        if (destination === 'profile') setProfileReturnPage('more');
        setPage(destination);
      }
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
      onRetryPlannedHealth={() => { void retryPlannedHealth(); }}
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
      backLabel={previousPage === 'checklist' ? 'Checklistan' : 'Hälsa'}
      onBack={() => setPage(previousPage === 'checklist' ? 'checklist' : 'health')}
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
      returnToTraining={knowledgeFocus?.selectionKey === currentSelectionKey && knowledgeFocus.returnPage === 'training'}
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
      dogName={dog.name}
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
      backLabel={profileReturnPage === 'training' ? 'Tillbaka till Träning' : 'Tillbaka till Mer'}
      ownedDogs={ownedDogs} activeDogId={dog.id} onSelectDog={onSelectDog}
      onAddDog={() => onAddDog?.('settings')}
      attribution={dogAttribution} attributionState={attributionState} attributionBusy={attributionBusy}
      attributionMessage={attributionMessage} attributionMessageError={attributionMessageError}
      onBack={returnFromProfile} onSave={async (changes, knownBreeds) => {
        const saved = await saveDogProfile(changes, knownBreeds);
        if (saved && profileReturnPage === 'training') returnFromProfile();
        return saved;
      }}
      onSaveAttribution={saveDogAttribution} onRetryAttribution={() => { void retryDogAttribution(); }}
      onRetryStatus={() => { void retryProfileStatus(); }} onAcceptCurrent={() => { void acceptCurrentProfile(); }} />;
    return <DogProfileScreen dog={dog} breed={breeds.find((breed) => breed.id === dog.breed_id)?.name} onBack={returnFromProfile} />;
  }

}

function navigationDirection(previous: ProductPage, current: ProductPage): 'forward' | 'backward' {
  if (previous === 'insights' && current === 'log') return 'backward';
  if (previous === 'log' && current === 'insights') return 'forward';
  return mainTabTransitionDirection(previous === 'insights' ? 'log' : previous, current === 'insights' ? 'log' : current);
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
