import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { View, Text } from 'react-native';
import { AppScreen } from '../../src/components/AppPrimitives';
import { BottomNav } from '../../src/components/ui';
import { HomeScreen } from '../../src/features/home/HomeScreen';
import { DailyChecklistScreen } from '../../src/features/home/DailyChecklistScreen';
import { DailyProgressScreen } from '../../src/features/home/DailyProgressScreen';
import { DevelopmentScreen } from '../../src/features/home/DevelopmentScreen';
import { KnowledgeScreen } from '../../src/features/knowledge/KnowledgeScreen';
import { PlannedHealthScreen } from '../../src/features/health/PlannedHealthScreen';
import { PublishedTrainingScreen } from '../../src/features/training/PublishedTrainingScreen';
import { activeMainTabDestination, productRouteScrollKeys } from '../../src/features/home/main-navigation';
import type { ChecklistFilter, HomeDailyActivity } from '../../src/features/home/daily-activity-model';
import type { HomeContent, OwnedDog } from '../../src/data/app-data';
import type { HistoricalTrainingStepDetail, PlannedHealthRecord, PublishedTrainingProgram } from '../../src/data/workspace-data';
import type { DailyRoutine, DailyRoutineDay } from '../../src/features/home/daily-activity-data';
import { deriveUpcomingActivities, isRoutineDueOnDate, isoWeekdayForDateKey } from '../../src/features/home/daily-activity-model';
import type { LogEvent } from '../../src/features/puppy-log/log-model';
import { localDate } from '../../src/features/onboarding/dog';
import { tokens } from '../../src/theme/tokens';

const params = new URLSearchParams(location.search);
const scenario = params.get('homeScenario') ?? 'ready';
const dailyMutationScenario = params.get('dailyMutation') ?? '';
const reviewMode = process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true';
const today = localDate();
const dog: OwnedDog = {
  id: '00000000-0000-4000-8000-000000000021',
  name: 'Luna',
  breed_id: 'golden',
  birth_date: dateOffset(today, -77),
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

function VisualCheckApp() {
  const [completion, setCompletion] = useState<Record<string, boolean>>({});
  const [mutationFlow, setMutationFlow] = useState<'idle' | 'pending' | 'confirmed'>('idle');
  const [navigation, setNavigation] = useState(() => params.get('screen') === 'checklist' ? 'checklist' : 'home');
  const [checklistFilter, setChecklistFilter] = useState<ChecklistFilter>(() => {
    const requested = params.get('checklistFilter');
    return requested === 'Denna vecka' || requested === 'Alla' || requested === 'Kommande' ? requested : 'Idag';
  });
  const [focusedPlanId, setFocusedPlanId] = useState<string | null>(null);
  const [developmentGuideId, setDevelopmentGuideId] = useState<string | null>(null);
  const [openChecklistManager, setOpenChecklistManager] = useState(false);
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
  const routePage = historicalFocus ? 'home-training-detail' : navigation;
  const routeScroll = navigation === 'planned-health' && focusedPlanId
    ? { scrollKey: 'planned-health-checklist-source', preserveScrollKey: 'home-checklist-flow' }
    : productRouteScrollKeys(routePage, undefined, historicalFocus ? 'checklist' : undefined);

  return <View style={{ flex: 1, minHeight: 0 }}>
    {reviewMode ? <View testID="review-banner" style={{ height: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.card }}>
      <Text style={{ ...tokens.typography.caption, color: tokens.colors.home.text }}>{navigation === 'home'
        ? 'Syntetiskt granskningsläge · AI-genererad standardbild' : 'Syntetiskt granskningsläge · checklistdata'}</Text>
    </View> : null}
    <View testID="review-app-viewport" style={{ flex: 1, minHeight: 0 }}>
      <View style={{ flex: 1, minHeight: 0, paddingTop: 44 }}>
        <AppScreen {...(navigation === 'knowledge'
          ? productRouteScrollKeys(navigation, 'development') : routeScroll)}
          scrollMemoryScope={`visual-check:${dog.id}:${dog.birth_date}`}
          footer={<View style={{ paddingBottom: 34 }}><BottomNav active={activeMainTabDestination(navigation === 'knowledge' ? 'development' : routePage)} onChange={(destination) => { setDevelopmentGuideId(null); setNavigation(destination); }} /></View>}>
          {navigation === 'home' ? <HomeScreen
            dog={dog}
            breed="Golden retriever"
            today={today}
            events={events}
            content={content}
            contentState="ready"
            trainingState="ready"
            nextStep="Miljöträning – nya ljud"
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
            onOpenContent={(id) => { window.__homePanelsOpened = `content:${id}`; }}
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
            guides={developmentGuides}
            guidesState="ready"
            onBack={() => { setDevelopmentGuideId(null); setNavigation('home'); }}
            onOpenGuide={(id) => { setDevelopmentGuideId(id); setNavigation('knowledge'); }}
            onRetryGuides={() => {}}
          /> : navigation === 'knowledge' ? <KnowledgeScreen
            onBack={() => { setDevelopmentGuideId(null); setNavigation('development'); }}
            returnToDevelopment
            items={developmentGuides}
            contentState="ready"
            focusedContentId={developmentGuideId}
            onSelectContent={setDevelopmentGuideId}
            dogId={dog.id}
            dogName={dog.name}
            ageWeeks={77}
            sessionKey={`visual-check:${dog.id}`}
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
  interface Window { __homePanelsOpened?: string; __routineToggleCalls?: number }
}

createRoot(document.getElementById('root')!).render(<VisualCheckApp />);
