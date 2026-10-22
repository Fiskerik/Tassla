import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { View, Text } from 'react-native';
import { AppScreen } from '../../src/components/AppPrimitives';
import { BottomNav } from '../../src/components/ui';
import { HomeScreen } from '../../src/features/home/HomeScreen';
import { EditDogProfileScreen } from '../../src/features/onboarding/EditDogProfileScreen';
import { LogScreen } from '../../src/features/puppy-log/LogScreen';
import { DailyChecklistScreen } from '../../src/features/home/DailyChecklistScreen';
import { DailyProgressScreen } from '../../src/features/home/DailyProgressScreen';
import { DevelopmentScreen } from '../../src/features/home/DevelopmentScreen';
import { KnowledgeScreen } from '../../src/features/knowledge/KnowledgeScreen';
import { PlannedHealthScreen } from '../../src/features/health/PlannedHealthScreen';
import { PublishedTrainingScreen } from '../../src/features/training/PublishedTrainingScreen';
import { activeMainTabDestination, logViewScrollKeys, productRouteScrollKeys } from '../../src/features/home/main-navigation';
import type { ChecklistFilter, HomeDailyActivity } from '../../src/features/home/daily-activity-model';
import type { HomeContent, OwnedDog } from '../../src/data/app-data';
import type { HistoricalTrainingStepDetail, PlannedHealthRecord, PublishedTrainingProgram } from '../../src/data/workspace-data';
import type { DailyRoutine, DailyRoutineDay } from '../../src/features/home/daily-activity-data';
import { deriveUpcomingActivities, isRoutineDueOnDate, isoWeekdayForDateKey } from '../../src/features/home/daily-activity-model';
import type { LogEvent } from '../../src/features/puppy-log/log-model';
import type { DogEventInsights, InsightsPeriod } from '../../src/features/puppy-log/insights-model';
import type { InsightsLoadState } from '../../src/features/puppy-log/InsightsScreen';
import type { SupabaseClient } from '@supabase/supabase-js';
import { localDate } from '../../src/features/onboarding/dog';
import { tokens } from '../../src/theme/tokens';

const params = new URLSearchParams(location.search);
const scenario = params.get('homeScenario') ?? 'ready';
const requestedDevelopmentGuidesState = params.get('developmentGuidesState');
const developmentGuidesState = requestedDevelopmentGuidesState === 'loading' || requestedDevelopmentGuidesState === 'error'
  ? requestedDevelopmentGuidesState : 'ready';
const ageScenario = params.get('ageScenario') ?? 'normal';
const dailyMutationScenario = params.get('dailyMutation') ?? '';
const reviewMode = process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true';
const imageFixture = params.get('imageFixture') ?? '';
const today = localDate();
const insightsScenario = params.get('insightsState') ?? (reviewMode ? 'ready' : 'empty');
const insightsTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const dog: OwnedDog = {
  id: '00000000-0000-4000-8000-000000000021',
  name: 'Luna',
  breed_id: 'golden',
  birth_date: ageScenario === 'missing' ? null : ageScenario === 'invalid' ? '2026-02-30'
    : ageScenario === 'future' ? dateOffset(today, 30) : dateOffset(today, -77),
  age_display_unit: 'weeks',
};
const content: HomeContent[] = [{
  id: 'review-content-version',
  contentId: 'review-content',
  version: 1,
  title: 'Låt valpen landa i sin takt',
  body: 'En lugn plats, tydliga pauser och korta stunder tillsammans gör den första tiden enklare.',
  contentType: 'article',
  sources: [],
  isAiGenerated: false,
}];
const developmentGuides: HomeContent[] = [{
  id: 'published-guide-version-02',
  contentId: 'published-guide',
  version: 2,
  title: 'Så bygger ni lugna rutiner',
  body: 'Korta, återkommande stunder kan hjälpa er skapa en vardag som passar just er.',
  contentType: 'guide',
  sources: [],
  isAiGenerated: false,
}];
const knowledgeReviewGuides: HomeContent[] = [
  { id: 'review-v1:training:trygg-start', contentId: 'review-v1:training:trygg-start', version: 1, title: 'Trygg start hemma', body: 'Korta övningar för en lugn start. Anpassa tempot efter valpen.', contentType: 'guide', sources: ['Syntetisk visningsfixture.'], isAiGenerated: false },
  { id: 'review-v1:training:kontakt', contentId: 'review-v1:training:kontakt', version: 1, title: 'Kontakt och namn', body: 'Lekfulla kontaktövningar i en miljö där valpen kan lyckas.', contentType: 'guide', sources: ['Syntetisk visningsfixture.'], isAiGenerated: false },
  { id: 'review-v1:training:vardagsro', contentId: 'review-v1:training:vardagsro', version: 1, title: 'Vardagsro och hantering', body: 'Frivilliga, korta steg med pauser. Avsluta medan valpen fortfarande är trygg.', contentType: 'guide', sources: ['Syntetisk visningsfixture.'], isAiGenerated: false },
];
const imageTrainingFixture: PublishedTrainingProgram = {
  id: 'review-v1:training:trygg-start', content_id: 'review-v1:training:trygg-start', version: 1,
  title: 'Trygg start hemma', body: 'Korta övningar för en lugn start. Anpassa tempot efter valpen.',
  sources: ['Syntetisk visningsfixture.'], is_ai_generated: false,
  steps: [
    { id: 'review-v1:training:trygg-start:one', position: 1, title: 'Utforska i egen takt', instruction: 'Låt valpen nosa på en lugn plats och belöna frivilligt lugn.' },
    { id: 'review-v1:training:trygg-start:two', position: 2, title: 'Vila nära', instruction: 'Öva en kort stund på att slå sig till ro med familjen i närheten.' },
  ],
  completedStepIds: ['review-v1:training:trygg-start:one'],
  completedAtByStepId: { 'review-v1:training:trygg-start:one': `${dateOffset(today, -1)}T10:00:00.000Z` },
};
const imageTrainingNewProgram: PublishedTrainingProgram = {
  id: 'review-v1:training:kontakt', content_id: 'review-v1:training:kontakt', version: 1,
  title: 'Kontakt och namn', body: 'Lekfulla kontaktövningar i en miljö där valpen kan lyckas.',
  sources: ['Syntetisk visningsfixture.'], is_ai_generated: false,
  steps: [{ id: 'review-v1:training:kontakt:one', position: 1, title: 'Säg namnet en gång', instruction: 'När valpen vänder sig mot dig, markera och belöna lugnt.' }],
  completedStepIds: [], completedAtByStepId: {},
};
const events: LogEvent[] = [];
const rows = makeActivities(today, dog.id, scenario === 'seven' ? 7 : 5);
const routineTemplates: DailyRoutine[] = [...new Map(rows.flatMap((activity) => {
  const row = activity.routineDay;
  if (!row) return [];
  return [[row.routine_id, {
    id: row.routine_id,
    dog_id: row.dog_id,
    label: row.routine_label_snapshot,
    checklist: row.checklist_snapshot,
    checklist_revision: 1,
    legacy_single_item: false,
    repeat_unit: row.routine_id === 'routine-morning' ? 'day' : row.routine_id === 'routine-walk' ? 'week' : null,
    repeat_interval: row.routine_id === 'routine-morning' ? 3 : row.routine_id === 'routine-walk' ? 1 : null,
    repeat_weekdays: row.routine_id === 'routine-walk' ? [isoWeekdayForDateKey(dateOffset(today, 3))] : null,
    repeat_anchor_date: row.routine_id ? today : null,
  } satisfies DailyRoutine] as const];
}))].map(([, routine]) => routine);
const plannedHealthFixture: PlannedHealthRecord = {
  id: 'review-health-plan', dog_id: dog.id, event_type: 'vaccination', due_on: dateOffset(today, 2), due_time: null,
  description: 'Syntetisk framtida plan för visuell granskning.', created_at: today, reminder_enabled: false, reminder_minutes: null,
};
const upcomingActivities = deriveUpcomingActivities(
  routineTemplates, [plannedHealthFixture], dog.id, dateOffset(today, 1), dateOffset(today, 7),
);
const historicalActivities: HomeDailyActivity[] = [
  { id: 'history-routine', label: 'Torka tassar', icon: 'paw', routineLabel: 'Promenad', kind: 'routine', completed: true, dateKey: dateOffset(today, -1) },
  { id: 'history-training', label: 'Miljöträning – nya ljud', kind: 'training', completed: true, dateKey: dateOffset(today, -3), programId: 'review-program', stepId: 'review-step', programTitle: 'Trygg vardagsstart' },
];
const historicalTrainingProgram: PublishedTrainingProgram = {
  id: 'review-program', content_id: 'review-training', version: 1, title: 'Trygg vardagsstart',
  body: 'Syntetiskt träningsinnehåll för visuell granskning.', sources: ['Syntetisk UI-fixture.'], is_ai_generated: false,
  steps: [{ id: 'review-step', position: 0, title: 'Miljöträning – nya ljud', instruction: 'Syntetisk historisk instruktion för att kontrollera läsbarhet.' }],
  completedStepIds: ['review-step'], completedAtByStepId: { 'review-step': `${dateOffset(today, -3)}T10:00:00.000Z` },
};
const historicalTrainingDetail: HistoricalTrainingStepDetail = {
  programVersionId: 'review-program', programTitle: 'Trygg vardagsstart', stepId: 'review-step',
  stepTitle: 'Miljöträning – nya ljud', instruction: 'Syntetisk historisk instruktion för att kontrollera läsbarhet.',
  sources: ['Syntetisk UI-fixture.'], isAiGenerated: false,
};
const firstRoutine = rows[0]?.routineDay;
const firstRoutineItemId = rows[0]?.routineItemId;
const firstMutationKey = firstRoutine && firstRoutineItemId ? `complete-routine:${firstRoutine.id}:${firstRoutineItemId}` : '';
const mutationMessage = dailyMutationScenario === 'failed' ? 'Ändringen sparades inte. Kontrollera anslutningen och försök igen.'
  : dailyMutationScenario === 'unknown' ? 'Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.'
    : dailyMutationScenario === 'readback' ? 'Ändringen sparades, men dagens lista kunde inte hämtas. Status räknas först efter en ny avläsning.' : '';

function dateOffset(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function insightsFixture(period: InsightsPeriod): DogEventInsights {
  const now = new Date();
  const observedThroughLocal = dateInTimeZone(now, insightsTimeZone);
  const zero = { peeCount: 0, poopCount: 0, unclassifiedAccidentCount: 0, sleepCount: 0, awakeCount: 0 };
  if (period === 'since_first_log') {
    if (insightsScenario === 'empty') return {
      period, timezone: insightsTimeZone, asOf: now.toISOString(), periodStartLocal: null,
      periodEndExclusiveLocal: null, observedThroughLocal, firstLogDay: null, bucket: 'month', days: [],
    };
    const firstMonth = shiftMonthKey(observedThroughLocal.slice(0, 7), -11);
    const quietMonth = shiftMonthKey(observedThroughLocal.slice(0, 7), -7);
    const olderMonth = shiftMonthKey(observedThroughLocal.slice(0, 7), -3);
    const currentMonth = observedThroughLocal.slice(0, 7);
    return {
      period, timezone: insightsTimeZone, asOf: now.toISOString(),
      periodStartLocal: `${firstMonth}-01`, periodEndExclusiveLocal: shiftDateKey(observedThroughLocal, 1),
      observedThroughLocal, firstLogDay: `${firstMonth}-03`, bucket: 'month', days: [
        { date: firstMonth, ...zero, peeCount: 1 },
        { date: quietMonth, ...zero },
        { date: olderMonth, ...zero, poopCount: 2, unclassifiedAccidentCount: 1 },
        { date: currentMonth, ...zero, peeCount: 2, sleepCount: 1, awakeCount: 1 },
      ],
    };
  }

  const periodStartLocal = period === 'week'
    ? shiftDateKey(observedThroughLocal, -((new Date(`${observedThroughLocal}T12:00:00Z`).getUTCDay() + 6) % 7))
    : `${observedThroughLocal.slice(0, 7)}-01`;
  if (insightsScenario === 'empty') return {
    period, timezone: insightsTimeZone, asOf: now.toISOString(), periodStartLocal,
    periodEndExclusiveLocal: period === 'week' ? shiftDateKey(periodStartLocal, 7) : shiftMonthKey(observedThroughLocal.slice(0, 7), 1) + '-01',
    observedThroughLocal, firstLogDay: null, bucket: 'day',
    days: daysBetween(periodStartLocal, observedThroughLocal).map((date) => ({ date, ...zero })),
  };
  const baseDates = daysBetween(periodStartLocal, observedThroughLocal);
  const eventsByDay: Record<string, Partial<typeof zero>> = {
    [baseDates.at(-1) ?? observedThroughLocal]: { peeCount: 2, sleepCount: 1 },
    [shiftDateKey(observedThroughLocal, -1)]: { poopCount: 1, awakeCount: 1 },
    [shiftDateKey(observedThroughLocal, -3)]: { peeCount: 1, unclassifiedAccidentCount: 1 },
    [shiftDateKey(observedThroughLocal, -5)]: { awakeCount: 1 },
  };
  return {
    period, timezone: insightsTimeZone, asOf: now.toISOString(), periodStartLocal,
    periodEndExclusiveLocal: period === 'week' ? shiftDateKey(periodStartLocal, 7) : shiftMonthKey(observedThroughLocal.slice(0, 7), 1) + '-01',
    observedThroughLocal, firstLogDay: null, bucket: 'day',
    days: baseDates.map((date) => ({ date, ...zero, ...(eventsByDay[date] ?? {}) })),
  };
}

function daysBetween(start: string, end: string): string[] {
  const days: string[] = [];
  for (let date = start; date <= end; date = shiftDateKey(date, 1)) days.push(date);
  return days;
}

function shiftDateKey(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function shiftMonthKey(month: string, amount: number): string {
  const value = new Date(`${month}-01T12:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() + amount);
  return value.toISOString().slice(0, 7);
}

function dateInTimeZone(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

const syntheticProfileClient = {
  from: (table: string) => ({
    select: () => ({
      order: () => ({
        abortSignal: async () => table === 'breeds'
          ? { data: [{ id: 'golden', name: 'Golden retriever' }], error: null }
          : { data: null, error: new Error('Unexpected synthetic table') },
      }),
    }),
  }),
} as unknown as SupabaseClient;

function makeActivities(dateKey: string, dogId: string, count: number): HomeDailyActivity[] {
  const labels = ['Kissa', 'Fyll på vatten', 'Gå en kort runda', 'Torka tassar', 'Miljöträning – nya ljud', 'Borsta pälsen', 'Kvällsrutin'];
  return labels.slice(0, count).map((label, index) => {
    const routineId = index < 4 ? `routine-${index < 2 ? 'morning' : 'walk'}` : `routine-evening-${index}`;
    const itemId = `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    const routineDay: DailyRoutineDay | undefined = index === 4 ? undefined : {
      id: `00000000-0000-4000-8000-${String(index + 101).padStart(12, '0')}`,
      dog_id: dogId,
      routine_id: routineId,
      date_key: dateKey,
      time_zone: 'Europe/Stockholm',
      routine_label_snapshot: index < 2 ? 'Morgonrutin' : index < 4 ? 'Promenad' : 'Kvällsrutin',
      checklist_snapshot: [{ id: itemId, label }],
      completed_item_ids: index === 1 || index === 3 ? [itemId] : [],
      completed_at: null,
      is_recurring_occurrence: false,
      routine_revision_snapshot: 1,
      routine_day_revision: 0,
      last_state_mutation_id: null,
    };
    return {
      id: `daily-${index + 1}`,
      label,
      routineLabel: routineDay?.routine_label_snapshot,
      routineItemId: routineDay ? itemId : undefined,
      kind: index === 4 ? 'training' : 'routine',
      completed: index === 1 || index === 3,
      routineDay,
      programId: index === 4 ? 'review-program' : undefined,
      stepId: index === 4 ? 'review-step' : undefined,
    };
  });
}

const requestedProgressCount = params.get('progressCount');
const initialProgressCount = requestedProgressCount !== null && /^\d+$/.test(requestedProgressCount)
  ? Math.max(0, Math.min(rows.length, Number(requestedProgressCount))) : null;
const initialCompletion = initialProgressCount === null ? {}
  : Object.fromEntries(rows.map((activity, index) => [activity.id, index < initialProgressCount]));

function VisualCheckApp() {
  const [scrollScopeRevision, setScrollScopeRevision] = useState('base');
  const [completion, setCompletion] = useState<Record<string, boolean>>(initialCompletion);
  const [mutationFlow, setMutationFlow] = useState<'idle' | 'pending' | 'confirmed'>('idle');
  const [navigation, setNavigation] = useState(() => {
    const initialScreen = params.get('screen');
    return initialScreen === 'checklist' || initialScreen === 'progress' || initialScreen === 'development'
      || initialScreen === 'profile' || initialScreen === 'insights' || initialScreen === 'log'
      || initialScreen === 'training' || initialScreen === 'knowledge' ? initialScreen : 'home';
  });
  const [profileOrigin, setProfileOrigin] = useState(params.get('origin') === 'profile');
  const [insightsPeriod, setInsightsPeriod] = useState<InsightsPeriod>(() => {
    const requested = params.get('insightsPeriod');
    return requested === 'month' || requested === 'since_first_log' ? requested : 'week';
  });
  const [checklistFilter, setChecklistFilter] = useState<ChecklistFilter>(() => {
    const requested = params.get('checklistFilter');
    return requested === 'Denna vecka' || requested === 'Alla' || requested === 'Kommande' ? requested : 'Idag';
  });
  const [focusedPlanId, setFocusedPlanId] = useState<string | null>(null);
  const [developmentGuideId, setDevelopmentGuideId] = useState<string | null>(null);
  const [openChecklistManager, setOpenChecklistManager] = useState(false);
  window.__homePanelsChangeScrollScope = (revision: string) => setScrollScopeRevision(revision);
  const dailyState = scenario === 'loading' ? 'loading'
    : scenario === 'error' ? 'error'
      : scenario === 'unknown' ? 'hidden'
        : scenario === 'partial' ? 'partial' : 'ready';
  const activities = useMemo(() => rows.map((activity) => ({
    ...activity,
    completed: completion[activity.id] ?? activity.completed,
  })), [completion]);
  const dailyActivities = reviewMode && !['empty', 'loading', 'error', 'unknown', 'partial'].includes(scenario)
    ? activities : [];
  const rangeState = ['loading', 'partial', 'error'].includes(params.get('rangeState') ?? '')
    ? params.get('rangeState') as 'loading' | 'partial' | 'error' : 'ready';
const rangeActivities = reviewMode && params.get('rangeEmpty') !== 'true'
    ? checklistFilter === 'Kommande' ? upcomingActivities : historicalActivities
    : [];
  const historicalFocus = navigation === 'historical-training';
  const routePage = historicalFocus ? 'home-training-detail'
    : navigation === 'insights' || navigation === 'log' ? 'log' : navigation;
  const routeScroll = navigation === 'planned-health' && focusedPlanId
    ? { scrollKey: 'planned-health-checklist-source', preserveScrollKey: 'home-checklist-flow' }
    : navigation === 'insights' ? logViewScrollKeys('overview')
      : navigation === 'log' ? logViewScrollKeys('today')
        : productRouteScrollKeys(routePage, undefined, historicalFocus ? 'checklist' : undefined);
  const insightsLoadState: InsightsLoadState = insightsScenario === 'loading' ? { status: 'loading' }
    : insightsScenario === 'error' ? { status: 'error' }
      : { status: 'ready', data: insightsFixture(insightsPeriod) };

  return <View style={{ flex: 1, minHeight: 0 }}>
    {reviewMode ? <View testID="review-banner" style={{ height: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.card }}>
      <Text style={{ ...tokens.typography.caption, color: tokens.colors.home.text }}>{navigation === 'home'
        ? 'Syntetiskt granskningsläge · AI-genererad standardbild'
        : navigation === 'development' || navigation === 'knowledge' ? 'Syntetiskt granskningsläge · ålder och guide'
          : navigation === 'progress' ? 'Syntetiskt granskningsläge · dagsprogress'
            : navigation === 'profile' ? 'Syntetiskt granskningsläge · hundprofil'
              : navigation === 'insights' || navigation === 'log' ? 'Syntetiskt granskningsläge · insikter'
                : navigation === 'training' ? 'Syntetiskt granskningsläge · träning'
                  : navigation === 'knowledge' ? 'Syntetiskt granskningsläge · kunskap'
          : 'Syntetiskt granskningsläge · checklistdata'}</Text>
    </View> : null}
    <View testID="review-app-viewport" style={{ flex: 1, minHeight: 0 }}>
      <View style={{ flex: 1, minHeight: 0, paddingTop: 44 }}>
        <AppScreen {...(navigation === 'knowledge'
          ? productRouteScrollKeys(navigation, 'development') : routeScroll)}
          scrollMemoryScope={`visual-check:owner-generation:account-generation:dog:${dog.id}:breed:${dog.breed_id}:birth-date:${dog.birth_date}:age:${77}:context:${reviewMode ? 'review' : 'public'}:${scrollScopeRevision}`}
          footer={<View style={{ paddingBottom: 34 }}><BottomNav active={activeMainTabDestination(navigation === 'knowledge' && !imageFixture ? 'development' : routePage)} onChange={(destination) => { setDevelopmentGuideId(null); setProfileOrigin(false); setNavigation(destination); }} /></View>}>
          {navigation === 'home' ? <HomeScreen
            dog={dog}
            breed="Golden retriever"
            today={today}
            events={events}
            content={reviewMode && imageFixture === 'knowledge' ? knowledgeReviewGuides : imageFixture === 'training' ? [] : content}
            contentState="ready"
            trainingState="ready"
            nextStep={imageFixture ? 'Vila nära' : 'Miljöträning – nya ljud'}
            dailyState={dailyState}
            dailyDateKey={today}
            dailyScopeKey={`visual-check:${dog.id}:${today}`}
            dailyActivities={dailyActivities}
            dailyRefreshing={false}
            dailyRefreshError={false}
            dailyMutationBusy={dailyMutationScenario === 'pending' || (dailyMutationScenario === 'interaction' && mutationFlow === 'pending')}
            dailyMutationKey={dailyMutationScenario === 'interaction'
              ? mutationFlow === 'idle' ? '' : firstMutationKey
              : dailyMutationScenario ? firstMutationKey : ''}
            dailyMutationMessage={mutationMessage}
            dailyMutationError={['failed', 'unknown', 'readback'].includes(dailyMutationScenario)}
            onRetryDaily={() => {}}
            onRetryDailyMutation={() => {}}
            onOpenChecklist={() => { window.__homePanelsOpened = 'checklist'; setChecklistFilter('Idag'); setOpenChecklistManager(false); setNavigation('checklist'); }}
            onOpenProgress={() => { window.__homePanelsOpened = 'progress'; setNavigation('progress'); }}
            onOpenDevelopment={() => { window.__homePanelsOpened = 'development'; setNavigation('development'); }}
            onOpenTrainingStep={() => { window.__homePanelsOpened = 'training-step'; }}
            onSetRoutineCompletion={(_day, itemId, completed) => {
              const activity = activities.find((item) => item.routineItemId === itemId);
              if (!activity) return;
              if (dailyMutationScenario === 'interaction') {
                setMutationFlow('pending');
                window.setTimeout(() => {
                  setCompletion((current) => ({ ...current, [activity.id]: completed }));
                  setMutationFlow('confirmed');
                }, 350);
                return;
              }
              setCompletion((current) => ({ ...current, [activity.id]: completed }));
            }}
            onGo={(destination) => { setNavigation(destination); window.__homePanelsOpened = destination; }}
            onOpenContent={(id) => {
              window.__homePanelsOpened = `content:${id}`;
              if (reviewMode && imageFixture === 'knowledge' && knowledgeReviewGuides.some((item) => item.id === id)) {
                setDevelopmentGuideId(id);
                setNavigation('knowledge');
              }
            }}
            onRetryContent={() => {}}
          /> : navigation === 'progress' ? <DailyProgressScreen
            dogName={dog.name}
            dateKey={today}
            state={dailyState === 'hidden' ? 'unknown' : dailyState}
            activities={dailyActivities}
            refreshing={false}
            onBack={() => setNavigation('home')}
            onRetry={() => {}}
            onManage={() => { setOpenChecklistManager(true); setNavigation('checklist'); }}
            onOpenChecklist={() => { setOpenChecklistManager(false); setNavigation('checklist'); }}
            onOpenTrainingStep={() => { window.__homePanelsOpened = 'training-step'; }}
            onSetRoutineCompletion={(_day, itemId, completed) => {
              const activity = activities.find((item) => item.routineItemId === itemId);
              if (activity) setCompletion((current) => ({ ...current, [activity.id]: completed }));
            }}
          /> : navigation === 'development' ? <DevelopmentScreen
            dogName={dog.name}
            birthDate={dog.birth_date}
            today={today}
            guides={reviewMode ? developmentGuides : []}
            guidesState={developmentGuidesState}
            onBack={() => { setDevelopmentGuideId(null); setNavigation('home'); }}
            onOpenGuide={(id) => { setDevelopmentGuideId(id); setNavigation('knowledge'); }}
            onRetryGuides={() => { window.__developmentGuideRetryCalls = (window.__developmentGuideRetryCalls ?? 0) + 1; }}
          /> : navigation === 'knowledge' ? <KnowledgeScreen
            onBack={() => { setDevelopmentGuideId(null); setNavigation('development'); }}
            returnToDevelopment
            items={imageFixture === 'knowledge' ? (reviewMode ? knowledgeReviewGuides : []) : developmentGuides}
            contentState="ready"
            focusedContentId={developmentGuideId}
            onSelectContent={setDevelopmentGuideId}
            dogId={dog.id}
            dogName={dog.name}
            ageWeeks={77}
            sessionKey={`visual-check:${dog.id}`}
          /> : navigation === 'training' ? <PublishedTrainingScreen
            ageWeeks={77}
            programs={reviewMode && imageFixture === 'training' ? [imageTrainingFixture, imageTrainingNewProgram] : []}
            paused={[]}
            busyStepKey={null}
            error=""
            reviewMode={reviewMode}
            onCompleteStep={async () => false}
            onUnmarkStep={async () => false}
            onContinue={() => {}}
            onResetProgram={() => {}}
            onRetry={() => {}}
            onOpenKnowledge={() => setNavigation('knowledge')}
          /> : navigation === 'profile' ? <EditDogProfileScreen
            client={syntheticProfileClient}
            dog={dog}
            attribution={null}
            attributionState="ready"
            ownedDogs={[dog]}
            activeDogId={dog.id}
            onBack={() => setNavigation('more')}
            onSave={async () => true}
            onSaveAttribution={async () => true}
            onRetryStatus={() => {}}
            onAcceptCurrent={() => {}}
            onOpenInsights={(canOpen) => {
              if (!canOpen) return;
              setProfileOrigin(true);
              setNavigation('insights');
            }}
          /> : navigation === 'insights' || navigation === 'log' ? <LogScreen
            events={[]}
            onAdd={() => {}}
            mode="preview"
            persistLayout={false}
            view={navigation === 'log' ? 'today' : 'overview'}
            onViewChange={(view) => setNavigation(view === 'today' ? 'log' : 'insights')}
            profileOrigin={profileOrigin}
            onReturnToProfile={() => { setProfileOrigin(false); setNavigation('profile'); }}
            insightsPeriod={insightsPeriod}
            onInsightsPeriodChange={setInsightsPeriod}
            insightsState={insightsLoadState}
            onRefreshInsights={() => { window.__insightsRefreshCalls = (window.__insightsRefreshCalls ?? 0) + 1; }}
            dogName={dog.name}
          /> : navigation === 'checklist' ? <DailyChecklistScreen
            dogName={dog.name}
            dateKey={today}
            state={dailyState === 'loading' ? 'loading' : dailyState === 'error' ? 'error' : 'ready'}
            activities={dailyActivities}
            refreshing={false}
            refreshError={false}
            mutationBusy={false}
            mutationKey=""
            mutationMessage=""
            mutationError={false}
            onBack={() => { setOpenChecklistManager(false); setChecklistFilter('Idag'); setNavigation('home'); }}
            openManagerInitially={openChecklistManager}
            filter={checklistFilter}
            onChangeFilter={setChecklistFilter}
            rangeState={rangeState}
            rangeActivities={rangeState === 'loading' || rangeState === 'error' ? [] : rangeActivities}
            onRetryRange={() => {}}
            upcomingRoutines={reviewMode ? routineTemplates : []}
            onOpenUpcomingRoutine={async (routineId, activityDate) => {
              const routine = routineTemplates.find((item) => item.id === routineId);
              return routine && isRoutineDueOnDate(routine, activityDate)
                ? { status: 'ready' as const, routine }
                : { status: 'missing' as const };
            }}
            onOpenPlannedHealth={(planId) => { setFocusedPlanId(planId); setNavigation('planned-health'); }}
            onOpenHistoricalTrainingStep={() => { setNavigation('historical-training'); }}
            routines={routineTemplates}
            routineDaySkips={[]}
            trainingOptions={[]}
            onSetRoutineCompletion={(_day, itemId, completed) => {
              window.__routineToggleCalls = (window.__routineToggleCalls ?? 0) + 1;
              const activity = activities.find((item) => item.routineItemId === itemId);
              if (activity) setCompletion((current) => ({ ...current, [activity.id]: completed }));
            }}
            onAddRoutineToDay={() => {}}
            onGoTraining={() => setNavigation('training')}
          /> : navigation === 'planned-health' ? <PlannedHealthScreen
            onBack={() => { setFocusedPlanId(null); setNavigation('checklist'); }}
            backLabel="Checklistan"
            records={reviewMode ? [plannedHealthFixture] : []}
            checklistFocusState={focusedPlanId ? 'ready' : 'idle'}
            checklistFocusRecord={focusedPlanId === plannedHealthFixture.id ? plannedHealthFixture : null}
            loadState="ready"
            onRetry={() => {}}
            onResolveConflict={() => {}}
            onSave={async () => true}
            onDelete={async () => true}
          /> : historicalFocus ? <PublishedTrainingScreen
            ageWeeks={77}
            programs={[historicalTrainingProgram]}
            paused={[]}
            busyStepKey={null}
            error=""
            onCompleteStep={async () => false}
            onContinue={() => setNavigation('checklist')}
            onResetProgram={() => {}}
            onRetry={() => {}}
            focusStep={{ programId: historicalTrainingProgram.id, stepId: 'review-step', returnPage: 'checklist', readOnly: true, dateKey: dateOffset(today, -3), completed: true }}
            historicalDetail={{ status: 'ready', detail: historicalTrainingDetail }}
            onCloseStep={() => setNavigation('checklist')}
          /> : <View testID="destination-result"><Text>{navigation}</Text></View>}
        </AppScreen>
      </View>
    </View>
  </View>;
}

declare global {
  interface Window {
    __homePanelsOpened?: string;
    __routineToggleCalls?: number;
    __homePanelsChangeScrollScope?: (revision: string) => void;
    __developmentGuideRetryCalls?: number;
    __insightsRefreshCalls?: number;
  }
}

createRoot(document.getElementById('root')!).render(<VisualCheckApp />);
