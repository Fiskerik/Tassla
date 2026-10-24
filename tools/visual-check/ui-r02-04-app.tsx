import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { HomeContent } from '../../src/data/app-data';
import type { PublishedTrainingProgram } from '../../src/data/workspace-data';
import { BottomNav } from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';
import { KnowledgeScreen } from '../../src/features/knowledge/KnowledgeScreen';
import { REVIEW_TRAINING_GUIDES, REVIEW_TRAINING_PROGRAMS } from '../../src/features/knowledge/review-content';
import { NotificationSettingsScreen } from '../../src/features/notifications/NotificationSettingsScreen';
import { InsightsScreen } from '../../src/features/puppy-log/InsightsScreen';
import type { DogEventInsights, InsightsPeriod } from '../../src/features/puppy-log/insights-model';
import { PublishedTrainingScreen } from '../../src/features/training/PublishedTrainingScreen';
import type { NotificationPreferences } from '../../src/notifications/notification-model';

declare global {
  interface Window {
    __ui04Counts: { saves: number; permissions: number };
    __ui04ResetCalls: number;
    __ui04RemoveTrainingProgram: (id: string) => void;
    __ui04RestoreTrainingProgram: (id: string) => void;
    __ui04ChangeTrainingProgram: (id: string) => void;
    __ui04FocusTrainingStep: (focused: boolean) => void;
  }
}

const params = new URLSearchParams(location.search);
const page = params.get('screen') ?? 'knowledge';
const review = process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true';
function emptyChecklistQuery() {
  const result = { data: [] as Record<string, unknown>[], error: null };
  const query = new Proxy({}, {
    get(_target, property) {
      if (property === 'then') return (resolve: (value: typeof result) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
      if (property === 'maybeSingle') return () => Promise.resolve({ data: null, error: null });
      return () => query;
    },
  });
  return query;
}
const checklistClient = { from: () => emptyChecklistQuery() } as unknown as SupabaseClient;
if (!window.__ui04Counts) window.__ui04Counts = { saves: 0, permissions: 0 };
window.__ui04ResetCalls ??= 0;

const guides: HomeContent[] = [
  { ...REVIEW_TRAINING_GUIDES[0], id: 'fixture-guide:calm-start:1', contentId: 'fixture-guide:calm-start', title: 'En lugn start tillsammans', contentType: 'guide' },
  { ...REVIEW_TRAINING_GUIDES[1], id: 'fixture-guide:rest:1', contentId: 'fixture-guide:rest', title: 'Kontakt och namn', contentType: 'article' },
  { ...REVIEW_TRAINING_GUIDES[2], id: 'fixture-guide:handling:1', contentId: 'fixture-guide:handling', title: 'Vardagsro och hantering', contentType: 'guide' },
];

const publishedTraining: PublishedTrainingProgram = {
  ...REVIEW_TRAINING_PROGRAMS[1], id: 'fixture:contact', content_id: 'fixture:contact', title: 'Kontakt i vardagen', currentAgeBreedMatch: false,
  steps: REVIEW_TRAINING_PROGRAMS[1].steps.map((step, index) => ({ ...step, id: index === 0 ? 'fixture:contact:one' : 'fixture:contact:two' })),
  completedStepIds: ['fixture:contact:one'], completedAtByStepId: {},
};

const reviewTraining = REVIEW_TRAINING_PROGRAMS[1];
const continuationProgram: PublishedTrainingProgram = review
  ? { ...reviewTraining, currentAgeBreedMatch: false, completedStepIds: [reviewTraining.steps[0].id] }
  : publishedTraining;
const recommendedPrograms: readonly PublishedTrainingProgram[] = review
  ? [REVIEW_TRAINING_PROGRAMS[0], REVIEW_TRAINING_PROGRAMS[2]].map((program) => ({
      ...program, currentAgeBreedMatch: true, completedStepIds: [],
    }))
  : [
      { ...REVIEW_TRAINING_PROGRAMS[0], id: 'fixture:calm-start', content_id: 'fixture:calm-start', currentAgeBreedMatch: true, completedStepIds: [] },
      { ...REVIEW_TRAINING_PROGRAMS[2], id: 'fixture:outdoors', content_id: 'fixture:outdoors', currentAgeBreedMatch: true, completedStepIds: [] },
    ];

function makeInsights(period: InsightsPeriod): DogEventInsights {
  return {
    period, timezone: 'Europe/Stockholm', asOf: '2026-10-23T12:00:00Z',
    periodStartLocal: '2026-10-19', periodEndExclusiveLocal: '2026-10-26',
    observedThroughLocal: '2026-10-22', firstLogDay: '2026-10-19', bucket: 'day',
    days: [
      { date: '2026-10-19', peeCount: 2, poopCount: 1, unclassifiedAccidentCount: 0, sleepCount: 1, awakeCount: 1 },
      { date: '2026-10-20', peeCount: 1, poopCount: 0, unclassifiedAccidentCount: 1, sleepCount: 2, awakeCount: 0 },
      { date: '2026-10-22', peeCount: 2, poopCount: 1, unclassifiedAccidentCount: 0, sleepCount: 1, awakeCount: 2 },
    ],
  };
}

export default function UiR02Panel04App() {
  const [programs, setPrograms] = useState<readonly PublishedTrainingProgram[]>(() => [...recommendedPrograms, continuationProgram].map((program, index) => params.get('trainingTitles') === 'long' && index === 0
    ? { ...program, title: 'Trygg vardagsstart med lugna steg för nya situationer', steps: program.steps.map((step, stepIndex) => stepIndex === 0 ? { ...step, title: 'Öva på att pausa och hitta trygghet i en ny miljö' } : step) }
    : program));
  const [busyStepKey] = useState<string | null>(null);
  const [focusedTrainingStep, setFocusedTrainingStep] = useState(false);
  const [period, setPeriod] = useState<InsightsPeriod>('week');
  const [preferences, setPreferences] = useState<NotificationPreferences>({ version: 1, enabled: false, trainingEnabled: false, trainingMinutes: 510 });
  const [saved, setSaved] = useState(false);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [focusContentId, setFocusContentId] = useState<string | null>(null);
  window.__ui04RemoveTrainingProgram = (id) => setPrograms((current) => current.filter((program) => program.id !== id));
  window.__ui04RestoreTrainingProgram = (id) => {
    const original = [...recommendedPrograms, continuationProgram].find((program) => program.id === id);
    if (original) setPrograms((current) => [...current.filter((program) => program.id !== id), original]);
  };
  window.__ui04ChangeTrainingProgram = (id) => setPrograms((current) => current.map((program) => program.id === id
    ? { ...program, version: program.version + 1 } : program));
  window.__ui04FocusTrainingStep = setFocusedTrainingStep;
  const visibleGuides: readonly HomeContent[] = review
    ? REVIEW_TRAINING_GUIDES.map((guide) => ({ ...guide, contentType: 'guide' }))
    : guides;
  const visibleTraining = programs;
  const active: 'home' | 'log' | 'training' | 'knowledge' | 'more' = page === 'training' ? 'training' : page === 'insights' ? 'log' : page === 'reminders' ? 'more' : 'knowledge';

  return <View style={styles.root}>
    {!review || !['knowledge', 'training'].includes(page) ? <Text style={styles.fixtureStatus}>Granskningsdata</Text> : null}
    <View style={styles.viewport}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {page === 'knowledge' ? <KnowledgeScreen items={visibleGuides} contentState="ready" focusedContentId={focusContentId}
          onSelectContent={setFocusContentId} onBack={() => setFocusContentId(null)} client={checklistClient} dogId="00000000-0000-4000-8000-000000000004"
          dogName="Luna" ageWeeks={11} sessionKey="ui-r02-04-fixture" /> : null}
        {page === 'training' ? <PublishedTrainingScreen ageWeeks={11} programs={visibleTraining} paused={[]} busyStepKey={busyStepKey} error=""
          onCompleteStep={async (program, stepId) => ({ programId: program.id, stepId })} onContinue={() => undefined}
          onResetProgram={(program) => {
            window.__ui04ResetCalls += 1;
            setPrograms((current) => current.map((item) => item.id === program.id ? { ...item, completedStepIds: [] } : item));
          }}
          onRetry={() => undefined} reviewMode={review}
          focusStep={focusedTrainingStep ? { programId: continuationProgram.id, stepId: continuationProgram.steps[0].id, returnPage: 'home' } : undefined}
          onCloseStep={() => setFocusedTrainingStep(false)} /> : null}
        {page === 'reminders' ? <NotificationSettingsScreen onBack={() => undefined} preferences={preferences} saved={saved} busy={false}
          statusMessage={statusMessage} statusError={statusError} permissionState={permissionState}
          onSave={async (next) => {
            window.__ui04Counts.saves += 1;
            if (params.get('save') === 'failed') { setSaved(false); setStatusError(true); setStatusMessage('Valen kunde inte sparas.'); return false; }
            setPreferences(next); setSaved(true); setStatusError(false); setStatusMessage(''); return true;
          }}
          onRequestPermission={async () => {
            window.__ui04Counts.permissions += 1;
            const next = params.get('permission') === 'denied' ? 'denied' : 'granted';
            setPermissionState(next); return next;
          }} /> : null}
        {page === 'insights' ? <InsightsScreen period={period} onPeriodChange={setPeriod} state={{ status: 'ready', data: makeInsights(period) }}
          onRefresh={() => undefined} onOpenLog={() => undefined} onBack={() => undefined} backLabel="Tillbaka till Logga" dogName="Luna" /> : null}
      </ScrollView>
    </View>
    <BottomNav active={active} onChange={(destination) => { window.location.search = `?screen=${destination === 'log' ? 'insights' : destination === 'more' ? 'reminders' : destination}`; }} />
  </View>;
}

const styles = StyleSheet.create({
  fixtureStatus: { ...tokens.typography.smallCaption, color: tokens.colors.textSecondary, paddingHorizontal: tokens.layout.pageInset, paddingTop: tokens.spacing.xs },
  root: { flex: 1, minHeight: '100%', backgroundColor: tokens.colors.home.background },
  viewport: { flex: 1, minHeight: 0 },
  scroll: { flex: 1 },
  content: { gap: tokens.spacing.md, paddingHorizontal: tokens.layout.pageInset, paddingTop: tokens.spacing.md, paddingBottom: tokens.spacing.xl },
});

createRoot(document.getElementById('root')!).render(<UiR02Panel04App />);
