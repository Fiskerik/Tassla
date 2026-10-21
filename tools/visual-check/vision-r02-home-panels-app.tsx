import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { View, Text } from 'react-native';
import { AppScreen } from '../../src/components/AppPrimitives';
import { BottomNav } from '../../src/components/ui';
import { HomeScreen } from '../../src/features/home/HomeScreen';
import { DailyChecklistScreen } from '../../src/features/home/DailyChecklistScreen';
import type { HomeDailyActivity } from '../../src/features/home/daily-activity-model';
import type { HomeContent, OwnedDog } from '../../src/data/app-data';
import type { DailyRoutine, DailyRoutineDay } from '../../src/features/home/daily-activity-data';
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
    repeat_unit: null,
    repeat_interval: null,
    repeat_weekdays: null,
    repeat_anchor_date: null,
  } satisfies DailyRoutine] as const];
}))].map(([, routine]) => routine);
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
  const [navigation, setNavigation] = useState('home');
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

  return <View style={{ flex: 1, minHeight: 0 }}>
    {reviewMode ? <View testID="review-banner" style={{ height: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.card }}>
      <Text style={{ ...tokens.typography.caption, color: tokens.colors.home.text }}>Syntetiskt granskningsläge · AI-genererad standardbild</Text>
    </View> : null}
    <View testID="review-app-viewport" style={{ flex: 1, minHeight: 0 }}>
      <View style={{ flex: 1, minHeight: 0, paddingTop: 44 }}>
        <AppScreen scrollKey={navigation} footer={<View style={{ paddingBottom: 34 }}><BottomNav active="home" onChange={(destination) => setNavigation(destination)} /></View>}>
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
            onOpenChecklist={() => { window.__homePanelsOpened = 'checklist'; setNavigation('checklist'); }}
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
            onBack={() => setNavigation('home')}
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
