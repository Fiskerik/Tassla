import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, AppState, BackHandler } from 'react-native';
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
  fetchDogEventInsights,
  fetchDogLogMonthMarkers,
  fetchHealthWeightById,
  fetchHealthWeights,
  fetchHealthHistory,
  fetchHealthHistoryById,
  fetchPlannedHealth,
  normalizePlannedHealthTime,
  fetchFuturePlannedHealthReminders,
  fetchPlannedHealthById,
  fetchPlannedHealthChecklistRange,
  fetchExactPublishedTrainingStep,
  fetchHomeContent,
  fetchTrainingWorkspace,
  fetchExactHistoricalTrainingSources,
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
  type PlannedHealthType,
  type PublishedTrainingProgram,
  type HistoricalTrainingSource,
  type HistoricalTrainingStepDetail,
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
  fetchDailyRoutineTemplates,
  fetchDailyRoutineTemplateById,
  removeRoutineFromDay,
  removeTrainingSelection,
  replaceDailyRoutine,
  setRoutineDayCompletion,
  type DailyActivitySnapshot,
  type DailyActivityRangeSnapshot,
  type DailyRoutine,
  type DailyRoutineCreateInput,
  type DailyRoutineDayDraft,
  type DailyRoutineWriteResult,
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
import { canStartDailyMutation, clearDailyMutationForLifetimeChange, dailyMutationBlocksAccountDeletion, dailyMutationForOwner, dailyMutationStore, recoverDailyMutation, resolvedDailyMutation, routineConflictAfterWrite, routineDraftStore, type PendingDailyMutation } from './daily-activity-recovery';
import { HealthScreen } from '../health/HealthScreen';
import { PlannedHealthScreen } from '../health/PlannedHealthScreen';
import { EditDogProfileScreen } from '../onboarding/EditDogProfileScreen';
import { DogProfileScreen } from '../onboarding/DogProfileScreen';
import { KnowledgeScreen } from '../knowledge/KnowledgeScreen';
import { checklistMemoryScope, keepChecklistMemoryForScope, updateChecklistMemory, type PendingChecklistMemory } from '../knowledge/checklist-intent';
import { checklistReadCacheScope, clearChecklistReadCache, keepChecklistReadCacheForScope } from '../knowledge/checklist-data';
import { CHECKLIST_DESTINATION_ID, FAQ_DESTINATION_ID, REVIEW_TRAINING_GUIDES, REVIEW_TRAINING_PROGRAMS } from '../knowledge/review-content';
import { HomeScreen, type HomeDailyTrainingOption } from './HomeScreen';
import { DevelopmentScreen } from './DevelopmentScreen';
import { DailyProgressScreen } from './DailyProgressScreen';
import { DailyChecklistScreen } from './DailyChecklistScreen';
import { checklistFilterRange, checklistRangeReadStatus, deriveHomeDailyActivities, deriveSavedRangeActivities, deriveUpcomingActivities, isRoutineDueOnDate, isValidIanaTimeZone, localDateKeyAt, nextSelectableTrainingStep, type ChecklistFilter, type HomeDailyActivity } from './daily-activity-model';
import { activeMainTabDestination, isMainTabDestination, logViewScrollKeys, mainTabTransitionDirection, nextMainTabDestination, productRouteScrollKeys, profileInsightsOriginMatches, type InsightsOrigin } from './main-navigation';
import { AppBar, BottomNav, Dialog, MainSwipeNavigation } from '../../components/ui';
import { ScreenTransition } from '../../components/ui/Motion';
import { tokens } from '../../theme/tokens';
import { decideProfileExit, profileExitScopeKey, type ProfileExitBlockReason, type ProfileExitScope, type ProfileExitSnapshot } from '../onboarding/profile-exit';
import { LogScreen, type QuickLogMutationView } from '../puppy-log/LogScreen';
import { insightsRequestIsCurrent, parseDogEventInsights, type InsightsPeriod, type InsightsRequestScope } from '../puppy-log/insights-model';
import type { InsightsLoadState } from '../puppy-log/InsightsScreen';
import { canStartLogMutation, checkInsertRetryOperation, finishLogMutationFlight, isCanonicalAccidentKinds, isLogMutationLifetimeCurrent, logMutationStatusForWriteOutcome, retainLogMutationFlightForLifetime, startLogMutationFlight, type AccidentKind, type AccidentLogIntent, type LogEvent, type LogEventChanges, type LogEventType, type LogMutationFlight } from '../puppy-log/log-model';
import { PassportScreen } from '../passport/PassportScreen';
import { PublishedTrainingScreen } from '../training/PublishedTrainingScreen';
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

type ProductPage = 'home' | 'development' | 'progress' | 'checklist' | 'home-training-detail' | 'log' | 'training' | 'more' | 'health' | 'planned-health' | 'knowledge' | 'passport' | 'profile' | 'notification-settings' | 'account-settings' | 'beta-info';
type HomeTrainingFocus = { selectionKey: string; dailyLifetime: string; programId: string; stepId: string; returnPage: 'home' | 'checklist' | 'progress'; readOnly?: boolean; dateKey?: string; completed?: boolean };
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

function dailyMutationActionLabel(key: string): string {
  const action = key.split(':', 1)[0];
  switch (action) {
    case 'update-routine': return 'Ändra rutin';
    case 'create-routine': return 'Skapa rutin';
    case 'delete-routine': return 'Ta bort rutin';
    case 'complete-routine': return 'Ändra checklista';
    case 'select-routine': return 'Lägga till rutin på Hemskärmen';
    case 'remove-routine': return 'Ta bort rutin från Hemskärmen';
    case 'select-training': return 'Lägga till träningssteg';
    case 'remove-training': return 'Ta bort träningssteg';
    default: return 'Ändring';
  }
}

type LogReadFlight = { scope: string; generation: number; controller: AbortController; promise: Promise<boolean>; baseline: DogEventRecord[]; refreshRequested: boolean };
type LogPaginationFlight = { scope: string; generation: number; controller: AbortController };
type TrainingWorkspaceSnapshot = Awaited<ReturnType<typeof fetchTrainingWorkspace>>;
type WorkspaceResourceFlight<T> = { scope: string; generation: number; controller: AbortController; promise: Promise<T> };
type ChecklistRangeView = { scope: string; status: 'loading' | 'ready' | 'partial' | 'error'; activities: HomeDailyActivity[]; failedSources: string[]; unresolvedCount: number; routines?: DailyRoutine[] };
type HistoricalTrainingDetailView = { scope: string; status: 'loading' | 'ready' | 'partial' | 'unavailable'; detail: HistoricalTrainingStepDetail | null };
type UpcomingRoutineLookup = { status: 'ready'; routine: DailyRoutine } | { status: 'missing' } | { status: 'error' };
type ProfileExitDestination = { kind: 'return' } | { kind: 'tab'; page: ProductPage } | { kind: 'switchDog'; dogId: string } | { kind: 'addDog' };
type ProfileExitDialogState = { destination: ProfileExitDestination };

function profileExitDestinationLabel(destination: ProfileExitDestination, returnPage: 'more' | 'training', dogs: readonly OwnedDog[]): string {
  if (destination.kind === 'return') return returnPage === 'training' ? 'Träning' : 'Mer';
  if (destination.kind === 'addDog') return 'Lägg till hund';
  if (destination.kind === 'switchDog') return dogs.find((dog) => dog.id === destination.dogId)?.name ?? 'en annan hund';
  const labels: Partial<Record<ProductPage, string>> = { home: 'Hem', log: 'Logg', training: 'Träning', more: 'Mer', knowledge: 'Kunskap', development: 'Utveckling' };
  return labels[destination.page] ?? 'nästa vy';
}

function profileExitPrompt(destination: ProfileExitDestination, returnPage: 'more' | 'training', dogs: readonly OwnedDog[]) {
  const target = profileExitDestinationLabel(destination, returnPage, dogs);
  const title = destination.kind === 'switchDog' ? `Byta till ${target}?`
    : destination.kind === 'addDog' ? 'Lägga till hund?'
      : destination.kind === 'return' ? `Lämna hundprofilen till ${target}?`
        : `Byta till ${target}?`;
  return { title, body: `Hundprofilens ändringar är inte sparade. ${target} öppnas och de här lokala ändringarna kastas. Sparade uppgifter påverkas inte.` };
}

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
  const [logView, setLogView] = useState<'today' | 'overview'>('today');
  const [insightsPeriod, setInsightsPeriod] = useState<InsightsPeriod>('week');
  const [insightsState, setInsightsState] = useState<InsightsLoadState>({ status: 'loading' });
  const [insightsRefreshNonce, setInsightsRefreshNonce] = useState(0);
  const [logMutationGeneration, setLogMutationGeneration] = useState(0);
  const [insightsOrigin, setInsightsOrigin] = useState<InsightsOrigin | null>(null);
  const insightsRequestGeneration = useRef(0);
  const insightsFlight = useRef<{ scope: InsightsRequestScope; controller: AbortController } | null>(null);
  const [checklistFilter, setChecklistFilter] = useState<ChecklistFilter>('Idag');
  const [homeTrainingFocus, setHomeTrainingFocus] = useState<HomeTrainingFocus | null>(null);
  const [historicalTrainingDetailView, setHistoricalTrainingDetailView] = useState<HistoricalTrainingDetailView | null>(null);
  const [historicalTrainingDetailRetry, setHistoricalTrainingDetailRetry] = useState(0);
  const [plannedHealthChecklistFocus, setPlannedHealthChecklistFocus] = useState<{ selectionKey: string; dailyLifetime: string; planId: string } | null>(null);
  const [plannedHealthChecklistRecord, setPlannedHealthChecklistRecord] = useState<{ scope: string; status: 'loading' | 'ready' | 'error' | 'missing'; record: PlannedHealthRecord | null } | null>(null);
  const [plannedHealthChecklistRetry, setPlannedHealthChecklistRetry] = useState(0);
  const [homeChecklistScope, setHomeChecklistScope] = useState<{ selectionKey: string; dailyLifetime: string; openManagerOnEntry: boolean } | null>(null);
  const [deviceTimeZone, setDeviceTimeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const initialPageConsumed = useRef(false);
  useEffect(() => {
    if (initialPage === 'profile' && !initialPageConsumed.current) {
      initialPageConsumed.current = true;
      onInitialPageOpened?.();
    }
  }, [initialPage, onInitialPageOpened]);
  const { page, previousPage } = navigation;
  const setPage = useCallback((nextPage: ProductPage) => {
    setNavigation((current) => current.page === nextPage
      ? current
      : { page: nextPage, previousPage: current.page });
  }, []);
  const [profileReturnPage, setProfileReturnPage] = useState<'more' | 'training'>('more');
  const requestProfileExitRef = useRef<(destination: ProfileExitDestination) => void>(() => undefined);
  const [profileExitDialog, setProfileExitDialog] = useState<ProfileExitDialogState | null>(null);
  const profileExitSnapshot = useRef<ProfileExitSnapshot | null>(null);
  function returnFromProfile() {
    requestProfileExitRef.current({ kind: 'return' });
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
  const [knowledgeFocus, setKnowledgeFocus] = useState<{ selectionKey: string; contentId: string | null; returnPage: 'home' | 'more' | 'training' | 'development' } | null>(null);
  const [developmentFocus, setDevelopmentFocus] = useState<{ selectionKey: string } | null>(null);
  const [knowledgeDetailOpen, setKnowledgeDetailOpen] = useState(false);
  const navigateMainTabNow = useCallback((destination: ProductPage) => {
    if (destination === 'log' && page === 'log') {
      setInsightsOrigin(null);
      setLogView('today');
      return;
    }
    if (page === 'checklist' || page === 'home-training-detail') setChecklistFilter('Idag');
    setPlannedHealthChecklistFocus(null);
    if (page === 'home-training-detail') setHomeTrainingFocus(null);
    const enteringKnowledge = page !== 'knowledge' && destination === 'knowledge';
    const leavingKnowledge = page === 'knowledge' && destination !== 'knowledge';
    if (enteringKnowledge || leavingKnowledge) {
      setKnowledgeFocus(null);
      setKnowledgeDetailOpen(false);
    }
    setInsightsOrigin(null);
    if (destination === 'log') setLogView('today');
    setPage(destination);
  }, [page, setPage]);
  const navigateMainTab = useCallback((destination: ProductPage) => {
    if (page === 'profile') {
      requestProfileExitRef.current({ kind: 'tab', page: destination });
      return;
    }
    navigateMainTabNow(destination);
  }, [navigateMainTabNow, page]);
  const handleMainSwipe = useCallback((direction: 'left' | 'right') => {
    const destination = nextMainTabDestination(page, direction);
    if (destination) navigateMainTab(destination);
  }, [navigateMainTab, page]);
  const [events, setEvents] = useState<DogEventRecord[]>([]);
  const eventRows = useRef<DogEventRecord[]>([]);
  const [logState, setLogState] = useState<'loading' | 'ready' | 'error'>('loading');
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
  const [attributionWriteUnresolved, setAttributionWriteUnresolved] = useState(false);
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
  const [checklistRangeView, setChecklistRangeView] = useState<ChecklistRangeView | null>(null);
  const [checklistRangeRetry, setChecklistRangeRetry] = useState(0);
  const [dailyRefreshing, setDailyRefreshing] = useState(false);
  const [dailyRefreshError, setDailyRefreshError] = useState(false);
  const [dailyClock, setDailyClock] = useState(() => new Date());
  const [dailyBusyKey, setDailyBusyKey] = useState<string | null>(null);
  const [dailyMessageKey, setDailyMessageKey] = useState('');
  const [dailyMessage, setDailyMessage] = useState('');
  const [dailyMessageError, setDailyMessageError] = useState(false);
  const [dailyMessageIsGlobal, setDailyMessageIsGlobal] = useState(false);
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
  const historicalTrainingDetailGeneration = useRef(0);
  const plannedHealthChecklistGeneration = useRef(0);
  const upcomingRoutineSourceFlight = useRef<AbortController | null>(null);
  const plannedHealthMutationInFlight = useRef(false);
  const plannedHealthFlightToken = useRef<object | null>(null);
  const pendingProfileMutation = useRef<PendingProfileMutation | null>(null);
  const profileMutationInFlight = useRef(false);
  const attributionMutationInFlight = useRef(false);
  const trainingMutationLease = useRef<TrainingMutationLease | null>(null);
  const dailyGeneration = useRef(0);
  const checklistRangeGeneration = useRef(0);
  const checklistRangeFlight = useRef<{ scope: string; controller: AbortController } | null>(null);
  const dailyMutationInFlight = useRef(false);
  const trainingSnapshotRef = useRef<{ scope: string; value: TrainingWorkspaceSnapshot; updatedAt: number } | null>(null);
  const trainingReadFlight = useRef<WorkspaceResourceFlight<TrainingWorkspaceSnapshot> | null>(null);
  const dailySnapshotRef = useRef<{ scope: string; daily: DailyActivitySnapshot; training: TrainingWorkspaceSnapshot; dailyUpdatedAt: number } | null>(null);
  const dailyReadFlight = useRef<WorkspaceResourceFlight<boolean> | null>(null);
  const mounted = useRef(false);
  const eventReadQueue = useRef<Promise<void>>(Promise.resolve());
  const logDataLifetimeRef = useRef('');
  const logReadGeneration = useRef(0);
  const logReadFlight = useRef<LogReadFlight | null>(null);
  const logPaginationGeneration = useRef(0);
  const logPaginationFlight = useRef<LogPaginationFlight | null>(null);
  const logCalendarGeneration = useRef(0);
  const logCalendarFlight = useRef<{ key: string; controller: AbortController } | null>(null);
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
    if (page !== 'home' && page !== 'checklist' && page !== 'training' && !(page === 'log' && logView === 'overview')) return undefined;
    const refreshClock = () => setDailyClock(new Date());
    const interval = setInterval(refreshClock, 30_000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refreshClock(); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [logView, page]);
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
  const currentSelectionKey = `${session?.user.id ?? 'signed-out'}:${accountGeneration}:${dog.id}:${dog.breed_id}:${dog.birth_date}:${age ?? 'unknown-age'}:${reviewContentEnabled ? 'review' : 'public'}`;
  const validInsightsTimeZone = isValidIanaTimeZone(deviceTimeZone);
  const insightsTimeZone = validInsightsTimeZone ? deviceTimeZone : 'UTC';
  const insightsLocalDateAnchor = validInsightsTimeZone ? localDateKeyAt(dailyClock, deviceTimeZone) : localDate();
  const dailyTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const validDailyTimeZone = isValidIanaTimeZone(dailyTimeZone);
  const dailyDateKey = validDailyTimeZone ? localDateKeyAt(dailyClock, dailyTimeZone) : null;
  const currentDailyOwnerScope = session?.user.id ?? 'signed-out';
  const pendingDailyWriteForOwner = useSyncExternalStore(
    dailyMutationStore.subscribe,
    () => dailyMutationStore.getSnapshot().get(currentDailyOwnerScope) ?? null,
    () => dailyMutationStore.getSnapshot().get(currentDailyOwnerScope) ?? null,
  );
  const currentDailyLifetime = `${session?.user.id ?? 'signed-out'}:${accountGeneration}:${currentSelectionKey}:${dailyDateKey ?? 'invalid-date'}:${dailyTimeZone}:${reviewContentEnabled ? 'review' : 'public'}`;
  // The editor owns keystroke state locally. Read recovery only when this workspace renders
  // (for example when returning to a dog) so every draft keystroke does not rerender the shell.
  const routineRecovery = routineDraftStore.get(currentDailyOwnerScope, dog.id, currentDailyLifetime);
  const routineDraftOwnerGeneration = routineDraftStore.ownerGeneration(currentDailyOwnerScope);
  const checklistRange = useMemo(() => checklistFilter === 'Idag' || !dailyDateKey ? null : checklistFilterRange(checklistFilter, dailyDateKey), [checklistFilter, dailyDateKey]);
  const currentChecklistRangeScope = currentDailyLifetime + ':' + checklistFilter + ':'
    + (checklistRange ? checklistRange.from + ':' + checklistRange.to : 'invalid-range');
  const dailyLifetime = useRef('');
  const checklistMemory = useRef<{ scope: string; state: PendingChecklistMemory } | null>(null);
  const [checklistMemoryView, setChecklistMemoryView] = useState<{ scope: string; state: PendingChecklistMemory } | null>(null);
  const currentChecklistMemoryScope = checklistMemoryScope(session?.user.id ?? null, accountGeneration, dog.id);
  const currentChecklistReadScope = checklistReadCacheScope(`${session?.user.id ?? 'signed-out'}:${accountGeneration}`, dog.id, reviewContentEnabled);

  useLayoutEffect(() => {
    const flight = insightsFlight.current;
    if (flight && (flight.scope.ownerId !== (session?.user.id ?? '')
      || flight.scope.accountGeneration !== accountGeneration || flight.scope.dogId !== dog.id)) {
      insightsRequestGeneration.current += 1;
      flight.controller.abort();
      insightsFlight.current = null;
    }
    if (insightsOrigin?.kind === 'profile'
      && !profileInsightsOriginMatches(insightsOrigin, currentSelectionKey, accountGeneration, dog.id)) {
      // Clear a profile-origin route in the same commit as its dog/account scope changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInsightsOrigin(null);
      if (page === 'log') setLogView('today');
    }
  }, [accountGeneration, currentSelectionKey, dog.id, insightsOrigin, page, session?.user.id]);

  const changeLogView = useCallback((next: 'today' | 'overview') => {
    if (next === 'overview') {
      if (!insightsOrigin || insightsOrigin.kind !== 'profile') setInsightsOrigin({ kind: 'log' });
      insightsRequestGeneration.current += 1;
      insightsFlight.current?.controller.abort();
      insightsFlight.current = null;
      setInsightsState({ status: 'loading' });
      setLogView('overview');
      return;
    }
    insightsRequestGeneration.current += 1;
    insightsFlight.current?.controller.abort();
    insightsFlight.current = null;
    setInsightsState({ status: 'loading' });
    setLogView('today');
    if (insightsOrigin?.kind === 'log') setInsightsOrigin(null);
  }, [insightsOrigin]);

  const changeInsightsPeriod = useCallback((period: InsightsPeriod) => {
    if (period === insightsPeriod) return;
    insightsRequestGeneration.current += 1;
    insightsFlight.current?.controller.abort();
    insightsFlight.current = null;
    setInsightsState({ status: 'loading' });
    setInsightsPeriod(period);
  }, [insightsPeriod]);

  const refreshInsights = useCallback(() => {
    insightsRequestGeneration.current += 1;
    insightsFlight.current?.controller.abort();
    insightsFlight.current = null;
    setInsightsState({ status: 'loading' });
    setInsightsRefreshNonce((value) => value + 1);
  }, []);

  const openInsightsFromProfile = useCallback((canOpen: boolean) => {
    if (!canOpen || page !== 'profile' || profileBusy || profilePending || profileConflict
      || attributionBusy || attributionWriteUnresolved) return;
    setInsightsOrigin({
      kind: 'profile', selectionKey: currentSelectionKey, accountGeneration,
      dogId: dog.id, profileReturnPage,
    });
    insightsRequestGeneration.current += 1;
    insightsFlight.current?.controller.abort();
    insightsFlight.current = null;
    setInsightsState({ status: 'loading' });
    setLogView('overview');
    setPage('log');
  }, [accountGeneration, attributionBusy, attributionWriteUnresolved, currentSelectionKey, dog.id, page, profileBusy, profileConflict, profilePending, profileReturnPage, setPage]);

  const returnToProfileFromInsights = useCallback(() => {
    if (profileInsightsOriginMatches(insightsOrigin, currentSelectionKey, accountGeneration, dog.id)) {
      setInsightsOrigin(null);
      setPage('profile');
    } else {
      setInsightsOrigin(null);
      setLogView('today');
    }
  }, [accountGeneration, currentSelectionKey, dog.id, insightsOrigin, setPage]);

  const currentInsightsRequestScope = useMemo<Omit<InsightsRequestScope, 'requestGeneration' | 'flightId'>>(() => ({
    ownerId: session?.user.id ?? '', accountGeneration, dogId: dog.id,
    timezone: insightsTimeZone, period: insightsPeriod, localDateAnchor: insightsLocalDateAnchor ?? localDate(),
    logMutationGeneration,
  }), [accountGeneration, dog.id, insightsLocalDateAnchor, insightsPeriod, insightsTimeZone, logMutationGeneration, session?.user.id]);

  const invalidateInsightsForLogMutation = useCallback(() => {
    insightsRequestGeneration.current += 1;
    insightsFlight.current?.controller.abort();
    insightsFlight.current = null;
    setInsightsState({ status: 'loading' });
    setLogMutationGeneration((generation) => generation + 1);
  }, []);
  useLayoutEffect(() => {
    keepChecklistReadCacheForScope(currentChecklistReadScope);
    checklistMemory.current = keepChecklistMemoryForScope(checklistMemory.current, currentChecklistMemoryScope);
    setChecklistMemoryView(checklistMemory.current);
  }, [currentChecklistMemoryScope, currentChecklistReadScope]);
  useEffect(() => () => clearChecklistReadCache(currentChecklistReadScope), [currentChecklistReadScope]);
  const currentSelectionKeyRef = useRef(currentSelectionKey);
  const currentDailyOwnerScopeRef = useRef(currentDailyOwnerScope);
  const previousTrainingLifetime = useRef(currentSelectionKey);

  useLayoutEffect(() => {
    currentSelectionKeyRef.current = currentSelectionKey;
    currentDailyOwnerScopeRef.current = currentDailyOwnerScope;
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
      setDevelopmentFocus(null);
      const staleDevelopmentGuide = page === 'knowledge' && knowledgeFocus?.returnPage === 'development';
      if (staleDevelopmentGuide) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- clear scope-owned article focus before this account/dog view can paint.
        setKnowledgeFocus(null);
        setKnowledgeDetailOpen(false);
      }
      if (page === 'checklist' || page === 'progress' || page === 'home-training-detail' || page === 'development' || staleDevelopmentGuide) {
        setPage('home');
      }
    }
    previousTrainingLifetime.current = currentSelectionKey;
  }, [currentDailyOwnerScope, currentSelectionKey, knowledgeFocus, page, setPage]);

  useLayoutEffect(() => {
    if (dailyLifetime.current && dailyLifetime.current !== currentDailyLifetime) {
      const clearedMutation = clearDailyMutationForLifetimeChange();
      dailyGeneration.current += 1;
      dailyReadFlight.current?.controller.abort();
      dailyReadFlight.current = null;
      dailySnapshotRef.current = null;
      checklistRangeGeneration.current += 1;
      checklistRangeFlight.current?.controller.abort();
      checklistRangeFlight.current = null;
      setChecklistRangeView(null);
      // A new dog, account, local day or time zone starts the checklist at its default view.
      setChecklistFilter('Idag');
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
      setDailyMessage(clearedMutation.message);
      setDailyMessageError(clearedMutation.error);
      setDailyMessageIsGlobal(false);
      setHomeChecklistScope(null);
      if (page === 'checklist' || page === 'progress' || page === 'home-training-detail') {
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
        const pending = dailyMutationForOwner(dailyMutationStore.getSnapshot().get(currentDailyOwnerScope) ?? null, currentDailyOwnerScope);
        if (pending && pending.phase !== 'resolved' && shouldClearDailyMutationFeedback(pending.lifetime, scope)) {
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
  }, [client, currentDailyLifetime, currentDailyOwnerScope, currentSelectionKey, dailyDateKey, dailyTimeZone, dog.id, reloadTraining, validDailyTimeZone]);

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
      setAttributionWriteUnresolved(false);
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
    };
  }, [client, currentHealthHistoryLifetime, currentLogLifetime, currentPlannedHealthLifetime, currentProfileLifetime, dog.id, serializeHealthRead, serializeHealthHistoryRead, serializePlannedHealthRead]);

  useEffect(() => {
    if (page !== 'log' || logView !== 'today') return undefined;
    const timer = setTimeout(() => { void reloadEvents(); }, 0);
    return () => clearTimeout(timer);
  }, [currentLogLifetime, logView, page, reloadEvents]);

  useEffect(() => {
    if (page !== 'log' || logView !== 'overview') return undefined;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshInsights();
    });
    return () => subscription.remove();
  }, [logView, page, refreshInsights]);

  useEffect(() => {
    if (page !== 'log' || logView !== 'overview' || logBusy) return undefined;

    const requestGeneration = ++insightsRequestGeneration.current;
    const controller = new AbortController();
    const scope: InsightsRequestScope = {
      ...currentInsightsRequestScope,
      requestGeneration,
      flightId: ExpoCrypto.randomUUID(),
    };
    const flight = { scope, controller };
    insightsFlight.current = flight;
    // The selected period/scope must replace stale counts before the asynchronous read starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInsightsState({ status: 'loading' });
    const isCurrent = () => mounted.current && !controller.signal.aborted
      && insightsRequestIsCurrent(insightsFlight.current?.scope ?? null, scope)
      && logLifetime.current === currentLogLifetime
      && currentSelectionKeyRef.current === currentSelectionKey;

    if (!scope.ownerId || !validInsightsTimeZone) {
      setInsightsState({ status: 'error' });
    } else {
      void fetchDogEventInsights(client, scope.dogId, scope.period, scope.timezone, controller.signal)
        .then((raw) => parseDogEventInsights(raw, scope.period, scope.timezone))
        .then((data) => { if (isCurrent()) setInsightsState({ status: 'ready', data }); })
        .catch(() => { if (isCurrent()) setInsightsState({ status: 'error' }); });
    }

    return () => {
      controller.abort();
      if (insightsFlight.current === flight) insightsFlight.current = null;
    };
  }, [client, currentInsightsRequestScope, currentLogLifetime, currentSelectionKey, dog.id,
    insightsRefreshNonce, logBusy, logView, page, validInsightsTimeZone]);

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
    const needsDailyRefresh = page === 'home' || page === 'progress' || page === 'training'
      || page === 'checklist' && checklistFilter === 'Idag'
      || page === 'home-training-detail' && !homeTrainingFocus?.readOnly;
    if (!needsDailyRefresh) return;
    const refresh = setTimeout(() => { void reloadDailyActivity(); }, 0);
    return () => clearTimeout(refresh);
  }, [checklistFilter, currentDailyLifetime, homeTrainingFocus?.readOnly, page, reloadDailyActivity]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      const needsDailyRefresh = page === 'home' || page === 'progress' || page === 'training'
        || page === 'checklist' && checklistFilter === 'Idag'
        || page === 'home-training-detail' && !homeTrainingFocus?.readOnly;
      if (state === 'active' && needsDailyRefresh) void reloadDailyActivity();
    });
    return () => subscription.remove();
  }, [checklistFilter, homeTrainingFocus?.readOnly, page, reloadDailyActivity]);

  useEffect(() => {
    if (page !== 'checklist' || checklistFilter === 'Idag') {
      checklistRangeFlight.current?.controller.abort();
      checklistRangeFlight.current = null;
      return undefined;
    }

    const scope = currentChecklistRangeScope;
    const range = checklistRange;
    const filter = checklistFilter;
    if (!range || !dailyDateKey || !validDailyTimeZone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Invalid date scopes must be surfaced rather than shown as empty.
      setChecklistRangeView({ scope, status: 'error', activities: [], failedSources: ['range'], unresolvedCount: 0 });
      return undefined;
    }

    const generation = ++checklistRangeGeneration.current;
    const controller = new AbortController();
    checklistRangeFlight.current = { scope, controller };
    setChecklistRangeView({ scope, status: 'loading', activities: [], failedSources: [], unresolvedCount: 0 });
    const isCurrent = () => mounted.current && !controller.signal.aborted && !accountDeletionInvalidated.current
      && checklistRangeGeneration.current === generation && dailyLifetime.current === currentDailyLifetime
      && page === 'checklist' && checklistFilter === filter && currentChecklistRangeScope === scope;

    void (async () => {
      try {
        if (filter === 'Kommande') {
          const [routineResult, healthResult] = await Promise.allSettled([
            fetchDailyRoutineTemplates(client, dog.id, controller.signal),
            fetchPlannedHealthChecklistRange(client, dog.id, range.from, range.to, controller.signal),
          ]);
          if (!isCurrent()) return;
          const routines = routineResult.status === 'fulfilled' ? routineResult.value : [];
          const plannedHealth = healthResult.status === 'fulfilled' ? healthResult.value : [];
          const completeSources = [
            ...(routineResult.status === 'fulfilled' ? ['routines'] : []),
            ...(healthResult.status === 'fulfilled' ? ['plannedHealth'] : []),
          ];
          const failedSources = [
            ...(routineResult.status === 'rejected' ? ['routines'] : []),
            ...(healthResult.status === 'rejected' ? ['plannedHealth'] : []),
          ];
          const status: ChecklistRangeView['status'] = failedSources.length === 0 ? 'ready'
            : completeSources.length > 0 ? 'partial' : 'error';
          const activities = status === 'error' ? [] : deriveUpcomingActivities(routines, plannedHealth, dog.id, range.from, range.to);
          setChecklistRangeView({ scope, status, activities, failedSources, unresolvedCount: 0, routines });
          return;
        }

        const snapshot: DailyActivityRangeSnapshot = await fetchDailyActivityRangeSnapshot(
          client, dog.id, range.from, range.to, false, controller.signal,
        );
        if (!isCurrent()) return;

        let sources: ReadonlyMap<string, HistoricalTrainingSource> = new Map();
        let unresolvedCount = 0;
        let trainingSourceFailed = false;
        if (snapshot.completeSources.includes('trainingSelections') && snapshot.trainingSelections.length > 0) {
          try {
            const result = await fetchExactHistoricalTrainingSources(client, dog.id, snapshot.trainingSelections.map((row) => ({
              programVersionId: row.program_version_id,
              stepId: row.step_id,
            })), controller.signal);
            sources = result.sources;
            unresolvedCount = result.unresolvedKeys.length;
          } catch {
            if (!isCurrent()) return;
            trainingSourceFailed = true;
          }
        }
        if (!isCurrent()) return;

        const failedSources = [...snapshot.failedSources];
        if (trainingSourceFailed) failedSources.push('trainingSources');
        const status = checklistRangeReadStatus(snapshot.completeSources, failedSources, unresolvedCount);
        const activities = status === 'error' ? [] : deriveSavedRangeActivities(snapshot, sources, dog.id, range.from, range.to);
        setChecklistRangeView({ scope, status, activities, failedSources, unresolvedCount });
      } catch {
        if (isCurrent()) setChecklistRangeView({ scope, status: 'error', activities: [], failedSources: ['range'], unresolvedCount: 0 });
      } finally {
        if (checklistRangeFlight.current?.controller === controller) checklistRangeFlight.current = null;
      }
    })();

    return () => {
      controller.abort();
      if (checklistRangeFlight.current?.controller === controller) checklistRangeFlight.current = null;
    };
  }, [checklistFilter, checklistRange, checklistRangeRetry, client, currentChecklistRangeScope, currentDailyLifetime, dailyDateKey, dog.id, page, validDailyTimeZone]);

  useEffect(() => {
    if (page === 'checklist' && checklistFilter === 'Kommande') return () => {
      upcomingRoutineSourceFlight.current?.abort();
      upcomingRoutineSourceFlight.current = null;
    };
    upcomingRoutineSourceFlight.current?.abort();
    upcomingRoutineSourceFlight.current = null;
    return undefined;
  }, [checklistFilter, currentDailyLifetime, currentSelectionKey, page]);

  useEffect(() => {
    const focus = homeTrainingFocus;
    if (page !== 'home-training-detail' || !focus?.readOnly) {
      historicalTrainingDetailGeneration.current += 1;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Source detail is scoped to the active route.
      setHistoricalTrainingDetailView(null);
      return undefined;
    }
    const scope = `${focus.selectionKey}:${focus.dailyLifetime}:${focus.programId}:${focus.stepId}`;
    const generation = ++historicalTrainingDetailGeneration.current;
    const controller = new AbortController();
    setHistoricalTrainingDetailView({ scope, status: 'loading', detail: null });
    const isCurrent = () => mounted.current && !controller.signal.aborted && !accountDeletionInvalidated.current
      && historicalTrainingDetailGeneration.current === generation && homeTrainingFocus === focus
      && currentSelectionKeyRef.current === focus.selectionKey && dailyLifetime.current === focus.dailyLifetime
      && page === 'home-training-detail';
    void fetchExactPublishedTrainingStep(client, focus.programId, focus.stepId, controller.signal).then((detail) => {
      if (isCurrent()) setHistoricalTrainingDetailView({ scope, status: detail ? 'ready' : 'unavailable', detail });
    }).catch(() => {
      if (isCurrent()) setHistoricalTrainingDetailView({ scope, status: 'partial', detail: null });
    });
    return () => controller.abort();
  }, [client, currentDailyLifetime, currentSelectionKey, historicalTrainingDetailRetry, homeTrainingFocus, page]);

  useEffect(() => {
    const focus = plannedHealthChecklistFocus;
    if (page !== 'planned-health' || !focus || focus.selectionKey !== currentSelectionKey || focus.dailyLifetime !== currentDailyLifetime) {
      plannedHealthChecklistGeneration.current += 1;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Source detail is scoped to the active route.
      setPlannedHealthChecklistRecord(null);
      return undefined;
    }
    const scope = `${focus.selectionKey}:${focus.dailyLifetime}:${focus.planId}`;
    const generation = ++plannedHealthChecklistGeneration.current;
    const controller = new AbortController();
    setPlannedHealthChecklistRecord({ scope, status: 'loading', record: null });
    const isCurrent = () => mounted.current && !controller.signal.aborted && !accountDeletionInvalidated.current
      && plannedHealthChecklistGeneration.current === generation && plannedHealthChecklistFocus === focus
      && currentSelectionKeyRef.current === focus.selectionKey && dailyLifetime.current === focus.dailyLifetime
      && page === 'planned-health';
    void serializePlannedHealthRead(() => fetchPlannedHealthById(client, dog.id, focus.planId, undefined, controller.signal)).then(async (record) => {
      if (!isCurrent()) return;
      if (record) {
        setPlannedHealthChecklistRecord({ scope, status: 'ready', record });
        return;
      }
      setPlannedHealthChecklistRecord({ scope, status: 'missing', record: null });
      try { await reloadPlannedHealth(currentPlannedHealthLifetime); } catch { /* Keep the exact source marked missing; retry remains available. */ }
    }).catch(() => {
      if (isCurrent()) setPlannedHealthChecklistRecord({ scope, status: 'error', record: null });
    });
    return () => controller.abort();
  }, [client, currentDailyLifetime, currentPlannedHealthLifetime, currentSelectionKey, dog.id, page, plannedHealthChecklistFocus, plannedHealthChecklistRetry, reloadPlannedHealth, serializePlannedHealthRead]);

  const visibleContent = contentSelectionKey === currentSelectionKey ? content : [];
  const visibleContentState = contentSelectionKey === currentSelectionKey ? contentState : 'loading';
  const visibleTrainingState = trainingSelectionKey === currentSelectionKey ? trainingState : 'loading';
  const dailyStateForView = dailyStateLifetime === currentDailyLifetime ? dailyState : 'loading';
  const dailySnapshotForView = dailySnapshotLifetime === currentDailyLifetime ? dailySnapshot : null;
  const dailyTrainingForView = dailySnapshotLifetime === currentDailyLifetime ? dailyTrainingSnapshot : null;
  const dailyActivities = dailyStateForView === 'ready' && dailySnapshotForView && dailyTrainingForView && dailyDateKey
    ? deriveHomeDailyActivities(dailySnapshotForView, dailyTrainingForView.programs.filter((program) => !program.id.startsWith('review-v1:training:')), dog.id, dailyDateKey)
    : [];
  const visibleHomeTrainingFocus = homeTrainingFocus?.selectionKey === currentSelectionKey
    && homeTrainingFocus.dailyLifetime === currentDailyLifetime ? homeTrainingFocus : null;
  const historicalTrainingDetailScope = visibleHomeTrainingFocus?.readOnly
    ? `${visibleHomeTrainingFocus.selectionKey}:${visibleHomeTrainingFocus.dailyLifetime}:${visibleHomeTrainingFocus.programId}:${visibleHomeTrainingFocus.stepId}` : '';
  const visibleHistoricalTrainingDetail = historicalTrainingDetailView?.scope === historicalTrainingDetailScope
    ? historicalTrainingDetailView : null;
  const visiblePlannedHealthChecklistFocus = plannedHealthChecklistFocus?.selectionKey === currentSelectionKey
    && plannedHealthChecklistFocus.dailyLifetime === currentDailyLifetime ? plannedHealthChecklistFocus : null;
  const plannedHealthChecklistScope = visiblePlannedHealthChecklistFocus
    ? `${visiblePlannedHealthChecklistFocus.selectionKey}:${visiblePlannedHealthChecklistFocus.dailyLifetime}:${visiblePlannedHealthChecklistFocus.planId}` : '';
  const visiblePlannedHealthChecklistRecord = plannedHealthChecklistRecord?.scope === plannedHealthChecklistScope
    ? plannedHealthChecklistRecord : null;
  const homeChecklistScopeIsCurrent = homeChecklistScope?.selectionKey === currentSelectionKey
    && homeChecklistScope.dailyLifetime === currentDailyLifetime;
  const developmentScopeIsCurrent = developmentFocus?.selectionKey === currentSelectionKey;
  const developmentGuideScopeIsCurrent = knowledgeFocus?.returnPage !== 'development'
    || knowledgeFocus.selectionKey === currentSelectionKey;
  const visiblePage: ProductPage = (page === 'checklist' || page === 'progress' || page === 'home-training-detail') && !homeChecklistScopeIsCurrent
    || page === 'development' && !developmentScopeIsCurrent
    || page === 'knowledge' && !developmentGuideScopeIsCurrent
    ? 'home' : page;
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
  const calendarTimeZone = deviceTimeZone;
  const calendarKeyPrefix = `${currentLogLifetime}:${calendarTimeZone}:`;
  const calendarDataIsCurrent = logCalendarData.key.startsWith(calendarKeyPrefix);
  const calendarDataMonth = calendarDataIsCurrent ? logCalendarData.key.slice(calendarKeyPrefix.length) : '';
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
    if (attributionBusy || attributionMutationInFlight.current) return;
    const lifetime = profileLifetime.current;
    attributionMutationInFlight.current = true;
    setAttributionBusy(true);
    setAttributionState('loading');
    setAttributionMessage('');
    setAttributionMessageError(false);
    try {
      const value = await fetchOwnedDogAttribution(client, dog.id);
      if (!mounted.current || profileLifetime.current !== lifetime) return;
      setDogAttribution(value);
      setAttributionState('ready');
      if (attributionWriteUnresolved) {
        setAttributionWriteUnresolved(false);
        setAttributionMessage('Kennelkopplingen har kontrollerats mot det sparade värdet.');
      }
    } catch {
      if (mounted.current && profileLifetime.current === lifetime) {
        setAttributionState('error');
        if (attributionWriteUnresolved) {
          setAttributionMessage('Vi kunde inte kontrollera om kenneländringen sparades. Försök läsa in den igen.');
          setAttributionMessageError(true);
        }
      }
    } finally {
      attributionMutationInFlight.current = false;
      if (mounted.current && profileLifetime.current === lifetime) setAttributionBusy(false);
    }
  }

  async function saveDogAttribution(code: string | null): Promise<boolean> {
    if (attributionBusy || attributionMutationInFlight.current || !mounted.current) return false;
    const lifetime = profileLifetime.current;
    attributionMutationInFlight.current = true;
    setAttributionBusy(true);
    setAttributionMessage('');
    setAttributionMessageError(false);
    let outcome: DogAttributionWriteOutcome;
    try {
      outcome = await updateOwnedDogAttribution(client, dog.id, code);
      if (!mounted.current || profileLifetime.current !== lifetime) return false;
      if (outcome.status === 'saved') {
        setAttributionWriteUnresolved(false);
        setDogAttribution(outcome.value);
        setAttributionState('ready');
        setAttributionMessage(outcome.value ? 'Kennelkopplingen är sparad.' : 'Kennelkopplingen är borttagen.');
        return true;
      }
      setAttributionWriteUnresolved(outcome.status === 'unknown');
      setAttributionMessage(outcome.status === 'unknown'
        ? 'Vi kunde inte bekräfta kennelkopplingen. Kontrollera den innan du försöker igen.'
        : 'Kennelkoden kunde inte sparas. Kontrollera koden och försök igen.');
      setAttributionMessageError(true);
      return false;
    } catch {
      if (mounted.current && profileLifetime.current === lifetime) {
        setAttributionWriteUnresolved(true);
        setAttributionMessage('Kennelkopplingen kunde inte sparas. Kontrollera anslutningen och försök igen.');
        setAttributionMessageError(true);
      }
      return false;
    } finally {
      attributionMutationInFlight.current = false;
      if (mounted.current && profileLifetime.current === lifetime) setAttributionBusy(false);
    }
  }

  const currentProfileExitScope: ProfileExitScope = {
    ownerId: session?.user.id ?? '',
    accountGeneration,
    dogId: dog.id,
  };

  function commitProfileExit(destination: ProfileExitDestination) {
    setProfileExitDialog(null);
    if (destination.kind === 'return') {
      const returnPage = profileReturnPage;
      setProfileReturnPage('more');
      navigateMainTabNow(returnPage);
    } else if (destination.kind === 'tab') {
      navigateMainTabNow(destination.page);
    } else if (destination.kind === 'switchDog') {
      onSelectDog?.(destination.dogId);
    } else {
      onAddDog?.('settings');
    }
  }

  function requestProfileExit(destination: ProfileExitDestination, announceBlock = true) {
    const decision = decideProfileExit(profileExitSnapshot.current, currentProfileExitScope, {
      profileBusy: profileBusy || profileMutationInFlight.current,
      profilePending: profilePending || Boolean(pendingProfileMutation.current),
      profileConflict: Boolean(profileConflict),
      attributionBusy: attributionBusy || attributionMutationInFlight.current,
      attributionUnresolved: attributionWriteUnresolved,
    });
    if (decision.kind === 'allow') commitProfileExit(destination);
    else if (decision.kind === 'confirm-discard') setProfileExitDialog({ destination });
    else if (announceBlock) Alert.alert('Stanna på hundprofilen', profileExitBlockedMessage(decision.reason), [{ text: 'Stanna kvar' }]);
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
    invalidateInsightsForLogMutation();
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
      invalidateInsightsForLogMutation();
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
    if (plannedHealthChecklistFocus?.planId === mutationId) {
      const focusScope = `${plannedHealthChecklistFocus.selectionKey}:${plannedHealthChecklistFocus.dailyLifetime}:${mutationId}`;
      setPlannedHealthChecklistRecord({ scope: focusScope, status: value ? 'ready' : 'missing', record: value });
    }
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
    const focusedRecord = plannedHealthChecklistRecord?.scope === plannedHealthChecklistScope && plannedHealthChecklistRecord.status === 'ready'
      && plannedHealthChecklistFocus?.planId === id ? plannedHealthChecklistRecord.record : null;
    const previous = id === null ? null : plannedHealthRows.current.find((row) => row.id === id && row.event_type === eventType)
      ?? (focusedRecord?.event_type === eventType ? focusedRecord : null);
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
    const focusedRecord = plannedHealthChecklistRecord?.scope === plannedHealthChecklistScope && plannedHealthChecklistRecord.status === 'ready'
      && plannedHealthChecklistFocus?.planId === id ? plannedHealthChecklistRecord.record : null;
    const previous = plannedHealthRows.current.find((row) => row.id === id) ?? focusedRecord ?? undefined;
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

  function openHomeChecklist(openManagerOnEntry = false) {
    setChecklistFilter('Idag');
    setHomeChecklistScope({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime, openManagerOnEntry });
    setPage('checklist');
  }

  function openHomeProgress() {
    setHomeChecklistScope({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime, openManagerOnEntry: false });
    setPage('progress');
  }

  function openHomeTrainingStep(programId: string, stepId: string, returnPage: 'home' | 'checklist' | 'progress') {
    const isSelectedToday = dailyActivities.some((activity) => activity.kind === 'training'
      && activity.programId === programId && activity.stepId === stepId);
    if (!isSelectedToday || accountDeletionInvalidated.current || currentSelectionKeyRef.current !== currentSelectionKey) return;
    setHomeChecklistScope({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime, openManagerOnEntry: false });
    setHomeTrainingFocus({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime, programId, stepId, returnPage });
    setPage('home-training-detail');
  }

  function openHistoricalTrainingStep(programId: string, stepId: string) {
    const activity = checklistRangeView?.scope === currentChecklistRangeScope
      ? checklistRangeView.activities.find((item) => item.kind === 'training' && item.programId === programId && item.stepId === stepId)
      : undefined;
    if (page !== 'checklist' || checklistFilter === 'Idag' || !activity || accountDeletionInvalidated.current) return;
    setHomeChecklistScope({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime, openManagerOnEntry: false });
    setHomeTrainingFocus({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime, programId, stepId,
      returnPage: 'checklist', readOnly: true, dateKey: activity.dateKey, completed: activity.completed });
    setPage('home-training-detail');
  }

  async function openUpcomingRoutine(routineId: string, dateKey: string): Promise<UpcomingRoutineLookup> {
    const scope = currentChecklistRangeScope;
    const activityIsCurrent = checklistRangeView?.scope === scope && checklistRangeView.activities.some((item) =>
      item.planned && item.routineId === routineId && item.dateKey === dateKey);
    if (page !== 'checklist' || checklistFilter !== 'Kommande' || !activityIsCurrent || accountDeletionInvalidated.current) return { status: 'missing' };
    upcomingRoutineSourceFlight.current?.abort();
    const controller = new AbortController();
    upcomingRoutineSourceFlight.current = controller;
    const isCurrent = () => !controller.signal.aborted && mounted.current && !accountDeletionInvalidated.current
      && dailyLifetime.current === currentDailyLifetime && currentChecklistRangeScope === scope
      && page === 'checklist' && checklistFilter === 'Kommande';
    try {
      const routine = await fetchDailyRoutineTemplateById(client, dog.id, routineId, controller.signal);
      if (!isCurrent()) return { status: 'missing' };
      if (!routine || !isRoutineDueOnDate(routine, dateKey)) {
        setChecklistRangeRetry((value) => value + 1);
        return { status: 'missing' };
      }
      return { status: 'ready', routine };
    } catch {
      return isCurrent() ? { status: 'error' } : { status: 'missing' };
    } finally {
      if (upcomingRoutineSourceFlight.current === controller) upcomingRoutineSourceFlight.current = null;
    }
  }

  function openUpcomingHealthPlan(planId: string) {
    const activityIsCurrent = checklistRangeView?.scope === currentChecklistRangeScope && checklistRangeView.activities.some((item) =>
      item.planned && item.healthPlanId === planId);
    if (page !== 'checklist' || checklistFilter !== 'Kommande' || !activityIsCurrent || accountDeletionInvalidated.current) return;
    setPlannedHealthChecklistFocus({ selectionKey: currentSelectionKey, dailyLifetime: currentDailyLifetime, planId });
    setPage('planned-health');
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

  async function runDailyMutation<T>(key: string, operation: () => Promise<WriteOutcome<T>>, retry?: boolean, retryPending?: PendingDailyMutation): Promise<WriteOutcome<T> | undefined>;
  async function runDailyMutation(key: string, operation: () => Promise<DailyRoutineWriteResult>, retry?: boolean, retryPending?: PendingDailyMutation): Promise<DailyRoutineWriteResult | undefined>;
  async function runDailyMutation(key: string, operation: () => Promise<WriteOutcome<unknown> | DailyRoutineWriteResult>, retry?: boolean, retryPending?: PendingDailyMutation): Promise<WriteOutcome<unknown> | DailyRoutineWriteResult | undefined>;
  async function runDailyMutation<T>(key: string, operation: () => Promise<WriteOutcome<T> | { status: 'conflict'; value: DailyRoutine }>, retry = false, retryPending?: PendingDailyMutation): Promise<WriteOutcome<T> | { status: 'conflict'; value: DailyRoutine } | undefined> {
    const retryablePending = retryPending && retryPending.phase !== 'resolved' ? retryPending : undefined;
    const ownerScope = retryablePending?.ownerScope ?? currentDailyOwnerScope;
    const dailyMutationOwnerGeneration = dailyMutationStore.ownerGeneration(ownerScope);
    const routineDraftOwnerGeneration = routineDraftStore.ownerGeneration(ownerScope);
    const lifetime = retryablePending?.lifetime ?? currentDailyLifetime;
    const pending = dailyMutationForOwner(dailyMutationStore.getSnapshot().get(ownerScope) ?? null, ownerScope);
    if (ownerScope !== currentDailyOwnerScope) return undefined;
    if ((!retryPending && (!dailyDateKey || !validDailyTimeZone)) || dailyMutationInFlight.current) return undefined;
    if (!canStartDailyMutation(pending, ownerScope, retryablePending)) {
      if (!retry && pending && pending.phase !== 'resolved') {
        setDailyMessage(pending.phase === 'in-flight'
          ? `${pending.actionLabel} för ${pending.dogName} behandlas fortfarande.`
          : `Kontrollera samma ${pending.actionLabel.toLowerCase()} för ${pending.dogName} innan du gör en ny.`);
        setDailyMessageError(true);
      }
      return undefined;
    }
    dailyMutationInFlight.current = true;
    setDailyBusyKey(key);
    setDailyMessageKey(key);
    const origin = retryablePending ?? { dogId: dog.id, dogName: dog.name, actionLabel: dailyMutationActionLabel(key) };
    const inFlightMutation = { ownerScope, ...origin, lifetime, key, run: operation, phase: 'in-flight' as const };
    updatePendingDailyWrite(ownerScope, inFlightMutation, dailyMutationOwnerGeneration);
    if (!retry || (pending && pending.phase !== 'resolved' && shouldClearDailyMutationFeedback(pending.lifetime, lifetime))) {
      setDailyMessage('');
      setDailyMessageError(false);
      setDailyMessageIsGlobal(false);
    }
    let outcome: WriteOutcome<T> | { status: 'conflict'; value: DailyRoutine };
    try {
      outcome = await operation();
    } catch {
      outcome = { status: 'unknown' };
    }
    const recovery = recoverDailyMutation(outcome.status, ownerScope, lifetime, key, operation,
      { dogId: origin.dogId, dogName: origin.dogName, actionLabel: origin.actionLabel });
    if (outcome.status === 'conflict' && key.startsWith('update-routine:') && outcome.value.dog_id === origin.dogId) {
      const draftRecovery = routineDraftStore.get(ownerScope, origin.dogId, lifetime);
      const draft = draftRecovery?.draft;
      if (draft?.mode === 'edit' && draft.routineId === outcome.value.id) {
        const conflict = routineConflictAfterWrite(draft, outcome, lifetime);
        if (conflict) routineDraftStore.update(ownerScope, origin.dogId, lifetime, draft, conflict, routineDraftOwnerGeneration);
      }
    }
    if (outcome.status === 'saved' && (key.startsWith('create-routine:') || key.startsWith('update-routine:'))) {
      const draftRecovery = routineDraftStore.get(ownerScope, origin.dogId, lifetime);
      const matchesMutation = draftRecovery && (key.startsWith('create-routine:')
        ? draftRecovery.draft.submissionId === key.slice('create-routine:'.length)
        : draftRecovery.draft.routineId === key.slice('update-routine:'.length));
      if (matchesMutation) routineDraftStore.update(ownerScope, origin.dogId, lifetime, null, null, routineDraftOwnerGeneration);
    }
    const ownerStillCurrent = currentDailyOwnerScopeRef.current === ownerScope
      && dailyMutationStore.ownerGeneration(ownerScope) === dailyMutationOwnerGeneration;
    const lifetimeStillCurrent = dailyLifetime.current === lifetime && currentSelectionKeyRef.current === currentSelectionKey;
    if (!mounted.current || !ownerStillCurrent || !lifetimeStillCurrent) {
      const staleResolution = recovery.pendingRetry ?? (outcome.status === 'unknown' ? null : resolvedDailyMutation(inFlightMutation, outcome.status));
      const currentMutation = dailyMutationStore.getSnapshot().get(ownerScope);
      if (currentMutation && currentMutation.phase !== 'resolved' && currentMutation.run === operation) {
        updatePendingDailyWrite(ownerScope, staleResolution, dailyMutationOwnerGeneration);
      }
      if (mounted.current && ownerStillCurrent && staleResolution?.phase === 'resolved') {
        setDailyMessageKey(key);
        setDailyMessage(staleResolution.notice.message);
        setDailyMessageError(staleResolution.notice.error);
        setDailyMessageIsGlobal(true);
      }
      dailyMutationInFlight.current = false;
      if (mounted.current) setDailyBusyKey(null);
      return outcome;
    }
    updatePendingDailyWrite(ownerScope, recovery.pendingRetry, dailyMutationOwnerGeneration);
    setDailyMessage(recovery.message);
    setDailyMessageError(recovery.error);
    setDailyMessageIsGlobal(false);
    if (outcome.status === 'saved') {
      const refreshed = await reloadDailyActivity(true, true);
      if (!refreshed && mounted.current && dailyLifetime.current === lifetime) {
        setDailyMessage('Ändringen sparades, men dagens lista kunde inte hämtas. Status räknas först efter en ny avläsning.');
        setDailyMessageError(true);
      }
    } else if (outcome.status === 'conflict') {
      void reloadDailyActivity(true, true).catch(() => false);
      setDailyMessage(recovery.message);
      setDailyMessageError(recovery.error);
    }
    dailyMutationInFlight.current = false;
    if (mounted.current) setDailyBusyKey(null);
    return outcome;
  }

  function retryDailyMutation() {
    const pending = dailyMutationForOwner(dailyMutationStore.getSnapshot().get(currentDailyOwnerScope) ?? null, currentDailyOwnerScope);
    if (!pending || pending.phase !== 'unknown') return;
    void runDailyMutation(pending.key, pending.run, true, pending);
  }

  function updatePendingDailyWrite(ownerScope: string, pending: PendingDailyMutation | null, expectedOwnerGeneration?: number) {
    dailyMutationStore.update(ownerScope, pending, expectedOwnerGeneration);
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
      || profileMutationInFlight.current || trainingMutationLease.current !== null
      || dailyMutationBlocksAccountDeletion(dailyMutationInFlight.current,
        dailyMutationForOwner(dailyMutationStore.getSnapshot().get(currentDailyOwnerScope) ?? null, currentDailyOwnerScope), currentDailyOwnerScope)
      || notificationBusy || attributionBusy || accountDeleteBusy;
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
      dailyMutationStore.clearOwner(ownerId);
      routineDraftStore.clearOwner(ownerId);
      checklistRangeGeneration.current += 1;
      checklistRangeFlight.current?.controller.abort();
      checklistRangeFlight.current = null;
      setChecklistRangeView(null);
      setChecklistFilter('Idag');
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

  function confirmProfileExit() {
    const pendingExit = profileExitDialog;
    if (pendingExit) commitProfileExit(pendingExit.destination);
  }

  async function handleSignOut() {
    if (signOutInFlight.current) return;
    const ownerId = session?.user.id;
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
    if (result.localSessionCleared && ownerId) {
      dailyMutationStore.clearOwner(ownerId);
      routineDraftStore.clearOwner(ownerId);
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

  useLayoutEffect(() => {
    requestProfileExitRef.current = requestProfileExit;
    if (page !== 'profile') profileExitSnapshot.current = null;
  });

  useEffect(() => {
    if (page !== 'profile') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestProfileExitRef.current({ kind: 'return' });
      return true;
    });
    return () => subscription.remove();
  }, [page]);

  if (!fontsLoaded && !fontError) return <AppScreen><MessageCard>Laddar Tasslas ikoner…</MessageCard></AppScreen>;
  if (fontError) return <AppScreen><MessageCard tone="error">Ikonerna kunde inte laddas. Starta om appen och försök igen.</MessageCard></AppScreen>;

  const pendingDailyWriteFromOtherLifetime = Boolean(pendingDailyWriteForOwner && pendingDailyWriteForOwner.phase !== 'resolved'
    && pendingDailyWriteForOwner.lifetime !== currentDailyLifetime);
  const dailyMutationIsBusy = Boolean(dailyBusyKey) || pendingDailyWriteForOwner?.phase === 'in-flight';
  const dailyMutationMessageForView = pendingDailyWriteForOwner?.phase === 'resolved'
    ? pendingDailyWriteForOwner.notice.message
    : pendingDailyWriteForOwner?.phase === 'in-flight'
      ? `${pendingDailyWriteForOwner.actionLabel} för ${pendingDailyWriteForOwner.dogName} behandlas fortfarande.`
      : pendingDailyWriteForOwner?.phase === 'unknown'
        ? dailyMessage || `Vi kunde inte bekräfta om ${pendingDailyWriteForOwner.actionLabel.toLowerCase()} för ${pendingDailyWriteForOwner.dogName} sparades. Kontrollera samma ändring innan du fortsätter.`
        : pendingDailyWriteFromOtherLifetime && pendingDailyWriteForOwner
          ? `${pendingDailyWriteForOwner.actionLabel} för ${pendingDailyWriteForOwner.dogName} behöver kontrolleras innan du fortsätter.`
          : dailyMessage;
  const dailyMutationErrorForView = pendingDailyWriteForOwner?.phase === 'resolved'
    ? pendingDailyWriteForOwner.notice.error
    : pendingDailyWriteForOwner?.phase === 'unknown' || pendingDailyWriteFromOtherLifetime || dailyMessageError;
  const showDailyRecoveryBanner = Boolean(dailyMessageIsGlobal || pendingDailyWriteForOwner?.phase === 'resolved'
    || (pendingDailyWriteForOwner && (pendingDailyWriteForOwner.phase === 'unknown' || pendingDailyWriteFromOtherLifetime
      || pendingDailyWriteForOwner.phase === 'in-flight') && !dailyBusyKey));
  const dailyRecoveryBannerMessage = pendingDailyWriteForOwner
    ? pendingDailyWriteForOwner.phase === 'resolved'
      ? pendingDailyWriteForOwner.notice.message
      : pendingDailyWriteForOwner.phase === 'in-flight'
        ? `${pendingDailyWriteForOwner.actionLabel} för ${pendingDailyWriteForOwner.dogName} behandlas fortfarande. Vänta tills resultatet är känt.`
        : dailyBusyKey ? `${pendingDailyWriteForOwner.actionLabel} för ${pendingDailyWriteForOwner.dogName} kontrolleras fortfarande.`
          : `Vi kunde inte bekräfta om ${pendingDailyWriteForOwner.actionLabel.toLowerCase()} för ${pendingDailyWriteForOwner.dogName} sparades. Kontrollera samma ändring innan du fortsätter.`
    : dailyMessage;
  const dailyRecoveryBannerError = pendingDailyWriteForOwner?.phase === 'resolved'
    ? pendingDailyWriteForOwner.notice.error
    : pendingDailyWriteForOwner?.phase === 'unknown' || dailyMessageError;
  const pageContent = renderPage();
  const transitionDirection = navigationDirection(previousPage, page);
  const mainTabToMainTab = isMainTabDestination(previousPage) && isMainTabDestination(page);
  const transitionDistance = mainTabToMainTab ? tokens.motion.pageDistance : tokens.motion.distance;
  const defaultRouteScroll = visiblePage === 'log' ? logViewScrollKeys(logView) : productRouteScrollKeys(visiblePage,
    knowledgeFocus?.selectionKey === currentSelectionKey ? knowledgeFocus.returnPage : undefined,
    visibleHomeTrainingFocus?.returnPage);
  const routeScroll = visiblePage === 'planned-health' && visiblePlannedHealthChecklistFocus
    ? { scrollKey: 'planned-health-checklist-source', preserveScrollKey: 'home-checklist-flow' }
    : defaultRouteScroll;
  const pendingProfileExitPrompt = profileExitDialog
    ? profileExitPrompt(profileExitDialog.destination, profileReturnPage, ownedDogs) : null;
  const activeTabPage = visiblePage === 'knowledge' && knowledgeFocus?.selectionKey === currentSelectionKey && knowledgeFocus.returnPage === 'development'
    ? 'development' : visiblePage;
  return <AppScreen scrollKey={routeScroll.scrollKey} preserveScrollKey={routeScroll.preserveScrollKey} scrollMemoryScope={`${currentSelectionKey}:${currentDailyLifetime}`}
    footer={accountDeleteBusy || accountDeleteStatus === 'confirmed' || accountDeleteStatus === 'unknown' ? undefined : <BottomNav active={activeMainTabDestination(activeTabPage)} onChange={navigateMainTab} />}
    refreshing={page === 'home' || page === 'progress' ? dailyRefreshing : page === 'log' && logView === 'today' ? logRefreshing : page === 'log' && logView === 'overview' ? insightsState.status === 'loading' : false}
    onRefresh={page === 'home' || page === 'progress' ? () => { void reloadDailyActivity(true, false); } : page === 'log' && logView === 'today' ? () => { void reloadEvents('refresh'); } : page === 'log' && logView === 'overview' ? refreshInsights : undefined}
    refreshAccessibilityLabel={page === 'log' && logView === 'overview' ? 'Uppdatera insikter' : page === 'log' ? 'Uppdatera loggen' : 'Uppdatera Hem'}>
    <Dialog visible={Boolean(profileExitDialog)} title={pendingProfileExitPrompt?.title ?? 'Lämna hundprofilen?'}
      confirmLabel="Kasta ändringar" cancelLabel="Fortsätt redigera" confirmVariant="destructive"
      onRequestClose={() => setProfileExitDialog(null)} onConfirm={confirmProfileExit}>
      <MessageCard>{pendingProfileExitPrompt?.body ?? 'Hundprofilens ändringar är inte sparade.'}</MessageCard>
    </Dialog>
    {showDailyRecoveryBanner ? <>
      <MessageCard tone={dailyRecoveryBannerError ? 'error' : 'neutral'}>{dailyRecoveryBannerMessage}</MessageCard>
      {pendingDailyWriteForOwner?.phase === 'unknown' ? <PrimaryButton title={dailyMutationIsBusy ? 'Kontrollerar ändringen…' : 'Kontrollera samma ändring igen'}
        disabled={dailyMutationIsBusy} onPress={retryDailyMutation} /> : null}
      {pendingDailyWriteForOwner?.phase === 'resolved' ? <QuietButton title="Stäng" onPress={() => {
        if (dailyMutationStore.getSnapshot().get(currentDailyOwnerScope) === pendingDailyWriteForOwner) {
          dailyMutationStore.update(currentDailyOwnerScope, null);
        }
        setDailyMessage('');
        setDailyMessageError(false);
        setDailyMessageIsGlobal(false);
      }} /> : null}
    </> : null}
    <MainSwipeNavigation enabled={isMainTabDestination(page) && !(page === 'knowledge' && knowledgeDetailOpen)} onSwipe={handleMainSwipe}>
      <ScreenTransition transitionKey={page} direction={transitionDirection} axis="x" distance={transitionDistance}>{pageContent}</ScreenTransition>
    </MainSwipeNavigation>
  </AppScreen>;

  function renderPage() {
    const page = visiblePage;
    if (page === 'progress') return <DailyProgressScreen
      dogName={dog.name} dateKey={dailyDateKey ?? ''} state={dailyStateForView} activities={dailyActivities}
      refreshing={dailyRefreshing} refreshError={dailyRefreshError} mutationBusy={dailyMutationIsBusy}
      mutationKey={dailyMessageKey} mutationMessage={dailyMutationMessageForView} mutationError={dailyMutationErrorForView}
      onBack={() => { setHomeChecklistScope(null); setPage('home'); }}
      onRetry={() => { void reloadDailyActivity(true); }}
      onRetryMutation={pendingDailyWriteForOwner?.phase === 'unknown' ? retryDailyMutation : undefined}
      onManage={() => openHomeChecklist(true)} onOpenChecklist={() => openHomeChecklist()}
      onOpenTrainingStep={(programId, stepId) => openHomeTrainingStep(programId, stepId, 'progress')}
      onSetRoutineCompletion={(row, itemId, completed) => { void runDailyMutation(`complete-routine:${row.id}:${itemId}`, () => setRoutineDayCompletion(client, row, itemId, completed)); }} />;
    if (page === 'checklist') return <DailyChecklistScreen key={`${currentDailyLifetime}:checklist:${homeChecklistScope?.openManagerOnEntry ? 'manager' : 'list'}`}
      dateKey={dailyDateKey ?? ''} dailyScopeKey={currentDailyLifetime} routineRecovery={routineRecovery}
      onRoutineRecoveryChange={(draft, conflict) => routineDraftStore.update(currentDailyOwnerScope, dog.id, currentDailyLifetime, draft, conflict, routineDraftOwnerGeneration)}
      state={dailyStateForView} activities={dailyActivities}
      refreshing={dailyRefreshing} refreshError={dailyRefreshError} mutationBusy={dailyMutationIsBusy}
      mutationKey={dailyMessageKey} mutationMessage={dailyMutationMessageForView} mutationError={dailyMutationErrorForView}
      onBack={() => { setHomeChecklistScope(null); setPage('home'); }} onRetry={() => { void reloadDailyActivity(true); }}
      filter={checklistFilter} onChangeFilter={setChecklistFilter}
      rangeState={checklistRangeView?.scope === currentChecklistRangeScope ? checklistRangeView.status : 'loading'}
      rangeActivities={checklistRangeView?.scope === currentChecklistRangeScope ? checklistRangeView.activities : []}
      onRetryRange={() => setChecklistRangeRetry((value) => value + 1)}
      onRetryMutation={pendingDailyWriteForOwner?.phase === 'unknown' ? retryDailyMutation : undefined}
      openManagerInitially={homeChecklistScopeIsCurrent && Boolean(homeChecklistScope?.openManagerOnEntry)}
      onOpenTrainingStep={openHomeTrainingStep} onOpenHistoricalTrainingStep={openHistoricalTrainingStep}
      onOpenUpcomingRoutine={openUpcomingRoutine} onOpenPlannedHealth={openUpcomingHealthPlan}
      upcomingRoutines={checklistRangeView?.scope === currentChecklistRangeScope ? checklistRangeView.routines ?? [] : []}
      onSetRoutineCompletion={(row, itemId, completed) => {
        void runDailyMutation(`complete-routine:${row.id}:${itemId}`, () => setRoutineDayCompletion(client, row, itemId, completed));
      }}
      routines={dailySnapshotForView?.routines ?? []} routineDaySkips={dailySnapshotForView?.routineDaySkips ?? []}
      trainingOptions={dailyTrainingOptions}
      onCreateRoutine={(input: DailyRoutineCreateInput) => {
        const row = { ...input, dog_id: dog.id };
        return runDailyMutation(`create-routine:${row.id}`, () => createDailyRoutine(client, row, dailyTimeZone));
      }}
      onUpdateRoutine={async (routine, label, checklist, repeat) => {
        const result = await runDailyMutation(`update-routine:${routine.id}`,
          () => replaceDailyRoutine(client, routine, label, checklist, repeat, dailyTimeZone));
        if (result?.status === 'saved' && checklistFilter === 'Kommande') setChecklistRangeRetry((value) => value + 1);
        return result;
      }}
      onDeleteRoutine={async (routine) => {
        const result = await runDailyMutation(`delete-routine:${routine.id}`, () => deleteDailyRoutine(client, routine));
        if (result?.status === 'saved' && checklistFilter === 'Kommande') setChecklistRangeRetry((value) => value + 1);
        return result;
      }}
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
      routineRecovery={routineRecovery}
      onRoutineRecoveryChange={(draft, conflict) => routineDraftStore.update(currentDailyOwnerScope, dog.id, currentDailyLifetime, draft, conflict, routineDraftOwnerGeneration)}
      dailyActivities={dailyActivities}
      routineTemplates={dailySnapshotForView?.routines ?? []}
      routineDaySkips={dailySnapshotForView?.routineDaySkips ?? []}
      dailyTrainingOptions={dailyTrainingOptions}
      dailyMutationBusy={dailyMutationIsBusy}
      dailyMutationKey={dailyMessageKey}
      dailyMutationMessage={dailyMutationMessageForView}
      dailyMutationError={dailyMutationErrorForView}
      onRetryDaily={() => { void reloadDailyActivity(true); }}
      onOpenDevelopment={() => {
        setDevelopmentFocus({ selectionKey: currentSelectionKey });
        setPage('development');
      }}
      onOpenProgress={openHomeProgress}
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
      onRetryDailyMutation={pendingDailyWriteForOwner?.phase === 'unknown' ? retryDailyMutation : undefined}
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
    if (page === 'development') return <DevelopmentScreen
      dogName={dog.name}
      birthDate={dog.birth_date}
      today={homeToday}
      guides={age === null ? [] : visibleContent.filter((item) => item.contentType === 'guide')}
      guidesState={age === null ? 'ready' : visibleContentState}
      onBack={() => {
        setDevelopmentFocus(null);
        setPage('home');
      }}
      onOpenGuide={(contentId) => {
        setKnowledgeDetailOpen(false);
        setKnowledgeFocus({ selectionKey: currentSelectionKey, contentId, returnPage: 'development' });
        setPage('knowledge');
      }}
      onRetryGuides={() => { void retryContent(); }}
    />;
    if (page === 'log') return <LogScreen events={displayEvents} onAdd={addEvent}
      onUpdate={updateEvent} onDelete={(id) => deleteEvent(id)} mode="cloud"
      calendarMarkerMonth={calendarDataMonth} calendarMarkers={calendarDataIsCurrent ? logCalendarData.markers : []}
      calendarStatus={calendarDataIsCurrent ? logCalendarData.status : 'loading'}
      onLoadCalendarMonth={(month) => { void loadLogCalendarMarkers(month); }} onCancelCalendarRead={cancelLogCalendarRead}
      layoutOwnerId={session?.user.id}
      loading={visibleLogState === 'loading'} loadError={visibleLogState === 'error'} refreshError={logRefreshError} onReload={() => { void retryEvents(); }}
      busy={logBusy} mutation={quickLogMutation} loadMoreError={loadMoreError} onRetry={retryLogMutation} onCancel={cancelLogMutation}
      onUndo={(id) => { void undoQuickLog(id); }} hasMore={hasMore} loadingMore={loadingMore}
      onLoadMore={() => { void loadMoreEvents(); }} view={logView} onViewChange={changeLogView}
      profileOrigin={profileInsightsOriginMatches(insightsOrigin, currentSelectionKey, accountGeneration, dog.id)}
      onReturnToProfile={returnToProfileFromInsights} insightsPeriod={insightsPeriod} onInsightsPeriodChange={changeInsightsPeriod}
      insightsState={insightsState} onRefreshInsights={refreshInsights} dogName={dog.name} />;
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
        if (focus?.readOnly) setChecklistRangeRetry((value) => value + 1);
        setHomeTrainingFocus(null);
        setPage(focus?.returnPage ?? 'home');
      };
      if (!focus) return <>
        <AppBar mode="Back" title="Träningssteg" actionLabel="Tillbaka till Hem" onAction={() => setPage('home')} variant="compact" />
        <MessageCard>Träningssteget hör inte längre till dagens aktiva lista.</MessageCard>
      </>;
      if (focus.readOnly) return <PublishedTrainingScreen ageWeeks={age} programs={training.programs} paused={training.paused}
        busyStepKey={null} error="" onCompleteStep={async () => false} onContinue={returnToSource}
        onResetProgram={() => undefined} onRetry={() => setHistoricalTrainingDetailRetry((value) => value + 1)}
        focusStep={{ programId: focus.programId, stepId: focus.stepId, returnPage: 'checklist', readOnly: true, dateKey: focus.dateKey, completed: focus.completed }}
        historicalDetail={visibleHistoricalTrainingDetail ?? { status: 'loading', detail: null }} onCloseStep={returnToSource} />;
      const sourceReturnLabel = focus.returnPage === 'checklist' ? 'Tillbaka till Checklistan'
        : focus.returnPage === 'progress' ? 'Tillbaka till Dagens framsteg' : 'Tillbaka till Hem';
      if (visibleTrainingState === 'loading') return <>
        <AppBar mode="Back" title="Träningssteg" actionLabel={sourceReturnLabel} onAction={returnToSource} variant="compact" />
        <PageHeading title="Träningssteg" description="Hämtar det valda programmet…" />
      </>;
      if (visibleTrainingState === 'error') return <>
        <AppBar mode="Back" title="Träningssteg" actionLabel={sourceReturnLabel} onAction={returnToSource} variant="compact" />
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
      onBack={() => {
        if (!visiblePlannedHealthChecklistFocus) { setPage('health'); return; }
        setPlannedHealthChecklistFocus(null);
        setChecklistRangeRetry((value) => value + 1);
        void reloadPlannedHealth(currentPlannedHealthLifetime).catch(() => undefined);
        setPage('checklist');
      }}
      backLabel={visiblePlannedHealthChecklistFocus ? 'Checklistan' : 'Hälsa'}
      records={plannedHealth}
      checklistFocusState={visiblePlannedHealthChecklistFocus ? visiblePlannedHealthChecklistRecord?.status ?? 'loading' : 'idle'}
      checklistFocusRecord={visiblePlannedHealthChecklistFocus && visiblePlannedHealthChecklistRecord?.status === 'ready'
        ? visiblePlannedHealthChecklistRecord.record : null}
      onRetryChecklistFocus={() => setPlannedHealthChecklistRetry((value) => value + 1)}
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
      returnToDevelopment={knowledgeFocus?.selectionKey === currentSelectionKey && knowledgeFocus.returnPage === 'development'}
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
      ownedDogs={ownedDogs} activeDogId={dog.id} exitScope={currentProfileExitScope}
      onExitStateChange={(snapshot) => {
        if (profileExitScopeKey(snapshot.scope) === profileExitScopeKey(currentProfileExitScope)) profileExitSnapshot.current = snapshot;
      }}
      onSelectDog={(dogId) => requestProfileExitRef.current({ kind: 'switchDog', dogId })}
      onAddDog={() => requestProfileExitRef.current({ kind: 'addDog' })}
      attribution={dogAttribution} attributionState={attributionState} attributionBusy={attributionBusy}
      attributionWriteUnresolved={attributionWriteUnresolved}
      attributionMessage={attributionMessage} attributionMessageError={attributionMessageError}
      onBack={returnFromProfile} onSave={async (changes, knownBreeds) => {
        const saved = await saveDogProfile(changes, knownBreeds);
        if (saved && profileReturnPage === 'training') returnFromProfile();
        return saved;
      }}
      onSaveAttribution={saveDogAttribution} onRetryAttribution={() => { void retryDogAttribution(); }}
      onOpenInsights={openInsightsFromProfile}
      onRetryStatus={() => { void retryProfileStatus(); }} onAcceptCurrent={() => { void acceptCurrentProfile(); }} />;
    return <DogProfileScreen dog={dog} breed={breeds.find((breed) => breed.id === dog.breed_id)?.name} onBack={returnFromProfile} />;
  }

}

function navigationDirection(previous: ProductPage, current: ProductPage): 'forward' | 'backward' {
  return mainTabTransitionDirection(previous, current);
}

function profileExitBlockedMessage(reason: ProfileExitBlockReason): string {
  if (reason === 'profileBusy' || reason === 'attributionBusy') return 'En ändring sparas eller kontrolleras fortfarande. Vänta tills resultatet visas innan du lämnar profilen.';
  if (reason === 'profilePending') return 'Profiländringen väntar på en säker kontroll. Kontrollera den på profilsidan innan du fortsätter.';
  if (reason === 'profileConflict') return 'Profilen har ändrats någon annanstans. Granska den aktuella versionen på profilsidan innan du fortsätter.';
  if (reason === 'attributionUnresolved') return 'Kennelkopplingen behöver kontrolleras på profilsidan innan du fortsätter.';
  return 'Profilens aktuella ändringar läses in. Vänta ett ögonblick och försök igen.';
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
