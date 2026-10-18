import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Linking } from 'react-native';
import type { HomeContent, OwnedDog } from '../../src/data/app-data';
import type { PublishedTrainingProgram } from '../../src/data/workspace-data';
import contentBundle from '../../docs/content/mvp-content-bundle-v1.json';
import { AppScreen } from '../../src/components/AppPrimitives';
import { BottomNav } from '../../src/components/ui';
import { HomeCarousel } from '../../src/features/home/HomeCarousel';
import { CHECKLIST_DESTINATION_ID, FAQ_DESTINATION_ID, REVIEW_TRAINING_GUIDES, REVIEW_TRAINING_PROGRAMS } from '../../src/features/knowledge/review-content';
import { KnowledgeScreen } from '../../src/features/knowledge/KnowledgeScreen';
import type { PendingChecklistMemory } from '../../src/features/knowledge/PuppyChecklistScreen';
import { PublishedTrainingScreen } from '../../src/features/training/PublishedTrainingScreen';

const DOG_ID = 'synthetic-dog-know02';
const FIRST_DAYS = 'review-v1:first-days';
const CUSTOM_ID = '00000000-0000-4000-8000-000000000002';
const query = new URLSearchParams(location.search);
const initialState = query.get('state') ?? 'ready';
const ageWeeksQuery = query.get('ageWeeks');
const faqState = query.get('faqState') ?? 'eligible';
const knowledgeScenario = query.get('knowledgeScenario') ?? 'eligible';
const ageWeeks = faqState === 'missing_age' || ageWeeksQuery === 'missing' ? null : ageWeeksQuery === null ? 14 : Number.isFinite(Number(ageWeeksQuery)) ? Number(ageWeeksQuery) : null;

declare global {
  interface Window {
    __know02MutationFault?: string;
    __know02WriteAttempts?: { table: string; mode: string; filters: Record<string, unknown>; payload: Record<string, unknown> }[];
    __know02PreferenceFailuresRemaining?: number;
    __know02ChecklistReads?: number;
    __know02ChecklistWrites?: number;
    __know02ReadDelayMs?: number;
    __know02CloudWrites?: number;
    __know02ContinueCount?: number;
    __know02WriteDelayMs?: number;
    __know02Mutations?: { table: string; mode: string; filters: Record<string, unknown>; payload: Record<string, unknown> }[];
    __know02OpenedContent?: string;
    __know02ProfileOpens?: number;
    __know02FaqRetries?: number;
    __know02SourceOpens?: string[];
    __know02UnmountRoute?: () => void;
    __know02RemountRoute?: () => void;
    __know02ChangeScope?: () => void;
  }
}

Object.defineProperty(Linking, 'openURL', {
  configurable: true,
  writable: true,
  value: async (url: string) => {
    window.__know02SourceOpens = [...(window.__know02SourceOpens ?? []), url];
  },
});

function makeClient() {
  const completedPresetRows = ['quiet-start', 'routine', 'rest'].map((item_key) => ({ dog_id: DOG_ID, template_id: FIRST_DAYS, item_key }));
  let failDetailRead = initialState === 'detail-error';
  const tables: Record<string, Record<string, unknown>[]> = {
    dog_checklist_progress: initialState === 'empty' || initialState === 'zero' ? [] : initialState === 'complete' ? completedPresetRows : [completedPresetRows[0]],
    dog_checklist_custom_items: initialState === 'empty' ? [] : [{ id: CUSTOM_ID, dog_id: DOG_ID, template_id: FIRST_DAYS, title: 'Boka valpkurs', completed: initialState === 'complete' }],
    dog_checklist_preferences: initialState === 'empty' ? [] : [{ dog_id: DOG_ID, context: 'first_days' }],
  };
  let failNextRead = initialState === 'error';

  function from(table: string) {
    let mode = 'select';
    let filters: Record<string, unknown> = {};
    let payload: Record<string, unknown> = {};
    let selected = false;
    const matches = (row: Record<string, unknown>) => Object.entries(filters).every(([key, value]) => row[key] === value);
    async function execute() {
      if (table.startsWith('dog_checklist_')) {
        if (mode === 'select') window.__know02ChecklistReads = (window.__know02ChecklistReads ?? 0) + 1;
        else {
          window.__know02ChecklistWrites = (window.__know02ChecklistWrites ?? 0) + 1;
          (window.__know02WriteAttempts ??= []).push({ table, mode, filters: { ...filters }, payload: { ...payload } });
        }
      }
      const rows = tables[table] ?? (tables[table] = []);
      let data: unknown = null;
      if (initialState === 'loading') await new Promise((resolve) => setTimeout(resolve, 1600));
      if (mode === 'select' && window.__know02ReadDelayMs) await new Promise((resolve) => setTimeout(resolve, window.__know02ReadDelayMs));
      if (mode !== 'select' && window.__know02WriteDelayMs) await new Promise((resolve) => setTimeout(resolve, window.__know02WriteDelayMs));
      if (mode === 'select' && failNextRead) { failNextRead = false; return { data: null, error: { message: 'Synthetic read error' } }; }
      if (mode === 'select' && failDetailRead && filters.template_id === FIRST_DAYS) { failDetailRead = false; return { data: null, error: { message: 'Synthetic detail read error' } }; }
      if (mode === 'select' && window.__know02MutationFault === 'unknown-read') {
        window.__know02MutationFault = undefined;
        return { data: null, error: { message: 'Synthetic uncertain read' } };
      }
      if (mode !== 'select' && table === 'dog_checklist_preferences' && (window.__know02PreferenceFailuresRemaining ?? 0) > 0) {
        window.__know02Mutations ??= [];
        window.__know02Mutations.push({ table, mode, filters: { ...filters }, payload: { ...payload } });
        window.__know02PreferenceFailuresRemaining = (window.__know02PreferenceFailuresRemaining ?? 1) - 1;
        return { data: null, error: { message: 'Synthetic preference write error' } };
      }
      if (mode !== 'select' && window.__know02MutationFault === 'failed') {
        window.__know02MutationFault = undefined;
        return { data: null, error: { message: 'Synthetic write error' } };
      }
      if (mode !== 'select') (window.__know02Mutations ??= []).push({ table, mode, filters: { ...filters }, payload: { ...payload } });
      if (mode === 'select') {
        data = rows.filter(matches);
        if (initialState === 'detail-newer' && table === 'dog_checklist_progress' && filters.template_id === FIRST_DAYS) {
          data = [...(data as Record<string, unknown>[]), { dog_id: DOG_ID, template_id: FIRST_DAYS, item_key: 'routine' }];
        }
      }
      if (mode === 'upsert') {
        const keys = table === 'dog_checklist_progress' ? ['dog_id', 'template_id', 'item_key'] : ['dog_id'];
        const existing = rows.find((row) => keys.every((key) => row[key] === payload[key]));
        if (existing) Object.assign(existing, payload); else rows.push({ ...payload });
      }
      if (mode === 'insert') {
        const row = { ...payload };
        rows.push(row);
        if (selected) data = [row];
      }
      if (mode === 'update') {
        const matched = rows.filter(matches);
        for (const row of matched) Object.assign(row, payload);
        if (selected) data = matched;
      }
      if (mode === 'delete') {
        const removed = rows.filter(matches);
        tables[table] = rows.filter((row) => !matches(row));
        if (selected) data = removed;
      }
      if (mode !== 'select' && window.__know02MutationFault === 'unknown') {
        window.__know02MutationFault = 'unknown-read';
        return { data: null, error: { message: 'Synthetic uncertain write' } };
      }
      return { data, error: null };
    }
    const chain = {
      select() { selected = true; return chain; },
      eq(key: string, value: unknown) { filters[key] = value; return chain; },
      match(values: Record<string, unknown>) { filters = { ...filters, ...values }; return chain; },
      order() { return chain; },
      abortSignal() { return chain; },
      upsert(values: Record<string, unknown>) { mode = 'upsert'; payload = values; return chain; },
      insert(values: Record<string, unknown>) { mode = 'insert'; payload = values; return chain; },
      update(values: Record<string, unknown>) { mode = 'update'; payload = values; return chain; },
      delete() { mode = 'delete'; return chain; },
      maybeSingle() { return execute().then(({ data, error }) => ({ data: Array.isArray(data) ? data[0] ?? null : data, error })); },
      then(resolve: (value: { data: unknown; error: unknown }) => unknown, reject?: (reason: unknown) => unknown) { return execute().then(resolve, reject); },
    };
    return chain;
  }
  return { from };
}

const client = makeClient();
const faqSourceUrls = new Map((contentBundle.sources as { id: string; url: string }[]).map(({ id, url }) => [id, url]));
const faqFixtureVersions: (HomeContent & { minAgeWeeks: number; maxAgeWeeks: number | null })[] = contentBundle.items
  .filter((item) => ['handling-guide', 'being-alone-guide'].includes(item.slug))
  .flatMap((item) => item.versions.filter((version) => version.status === 'published').map((version) => ({
    id: version.id,
    contentId: item.id,
    version: version.version,
    title: version.title,
    body: version.body,
    contentType: item.content_type as HomeContent['contentType'],
    sources: [...new Set(version.claim_trace.flatMap((claim) => claim.source_refs)
      .map((sourceId) => faqSourceUrls.get(sourceId)).filter((url): url is string => Boolean(url)))],
    minAgeWeeks: version.min_age_weeks,
    maxAgeWeeks: version.max_age_weeks,
  })));
const faqSelection = (() => {
  if (faqState === 'missing_age' || ageWeeks === null) return { status: 'unknown' as const, reason: 'missing_age' as const, items: [] as HomeContent[] };
  if (faqState === 'invalid_request') return { status: 'unknown' as const, reason: 'invalid_request' as const, items: [] as HomeContent[] };
  if (faqState === 'unmapped_version') return { status: 'unknown' as const, reason: 'unmapped_version' as const, items: [] as HomeContent[] };
  if (faqState === 'empty') return { status: 'empty' as const, items: [] as HomeContent[] };
  const matched = faqFixtureVersions.filter((item) => ageWeeks >= item.minAgeWeeks
    && (item.maxAgeWeeks === null || ageWeeks <= item.maxAgeWeeks));
  return matched.length ? { status: 'eligible' as const, items: matched } : { status: 'empty' as const, items: [] as HomeContent[] };
})();

const knowledgeSelection = (() => {
  if (initialState === 'empty' || knowledgeScenario === 'empty') return { status: 'empty' as const, items: [] as HomeContent[] };
  // This layout-only visual scenario intentionally places both exact published
  // versions together so the hero/compact-card path can be inspected. It does
  // not represent an age-eligible selector response or change production data.
  if (knowledgeScenario === 'multi-layout') return { status: 'eligible' as const, items: faqFixtureVersions };
  if (knowledgeScenario === 'unknown' || ageWeeks === null) return { status: 'unknown' as const, reason: 'missing_age' as const, items: [] as HomeContent[] };
  if (knowledgeScenario === 'invalid_request') return { status: 'unknown' as const, reason: 'invalid_request' as const, items: [] as HomeContent[] };
  if (knowledgeScenario === 'unmapped_version') return { status: 'unknown' as const, reason: 'unmapped_version' as const, items: [] as HomeContent[] };
  const matched = faqFixtureVersions.filter((item) => ageWeeks >= item.minAgeWeeks
    && (item.maxAgeWeeks === null || ageWeeks <= item.maxAgeWeeks));
  return matched.length ? { status: 'eligible' as const, items: matched } : { status: 'empty' as const, items: [] as HomeContent[] };
})();

function KnowledgeRoute({ pending, onPendingChange, sessionKey, dogId, routedContentId, onHome }: { pending: PendingChecklistMemory | null; onPendingChange: (state: PendingChecklistMemory | null) => void; sessionKey: string; dogId: string; routedContentId: string | null; onHome: () => void }) {
  const focusedContentId = routedContentId ?? (query.get('screen') === 'faq' ? FAQ_DESTINATION_ID : query.get('screen') === 'checklist-detail' || query.get('screen') === 'checklist-overview' ? CHECKLIST_DESTINATION_ID : null);
  const contentState = initialState === 'empty' ? 'ready' : initialState === 'error' ? 'error' : initialState === 'loading' ? 'loading' : 'ready';
  return <AppScreen scrollKey="know02-knowledge" footer={<BottomNav active="knowledge" onChange={(destination) => { if (destination === 'home') onHome(); }} />}>
    <KnowledgeScreen onBack={() => undefined} items={knowledgeSelection.items} forYouItems={knowledgeSelection.items} articleItems={knowledgeSelection.items} contentState={contentState} focusedContentId={focusedContentId}
      forYouSelectionStatus={knowledgeSelection.status} articleSelectionStatus={knowledgeSelection.status}
      unknownSelectionReason={knowledgeSelection.status === 'unknown' ? knowledgeSelection.reason : undefined}
      client={client as never} dogId={dogId} ageWeeks={ageWeeks} sessionKey={sessionKey}
      faqItems={faqSelection.items} faqSelectionStatus={faqSelection.status}
      faqUnknownReason={faqSelection.status === 'unknown' ? faqSelection.reason : undefined}
      onOpenDogProfile={() => { window.__know02ProfileOpens = (window.__know02ProfileOpens ?? 0) + 1; }}
      onRetry={() => { window.__know02FaqRetries = (window.__know02FaqRetries ?? 0) + 1; }}
      checklistPending={pending} onChecklistPendingChange={onPendingChange} />
  </AppScreen>;
}

function TrainingRoute() {
  const [programs, setPrograms] = useState<readonly PublishedTrainingProgram[]>(REVIEW_TRAINING_PROGRAMS);
  const onCompleteStep = async (program: PublishedTrainingProgram, stepId: string) => {
    window.__know02CloudWrites = (window.__know02CloudWrites ?? 0) + 1;
    setPrograms((current) => current.map((item) => item.id === program.id ? { ...item, completedStepIds: [...item.completedStepIds, stepId] } : item));
    return { programId: program.id, stepId };
  };
  return <AppScreen scrollKey="know02-training" footer={<BottomNav active="training" onChange={() => undefined} />}>
    <PublishedTrainingScreen programs={programs} paused={[]} busyStepKey={null} error="" reviewMode
      onCompleteStep={onCompleteStep} onContinue={() => { window.__know02ContinueCount = (window.__know02ContinueCount ?? 0) + 1; }}
      onResetProgram={() => undefined} onRetry={() => undefined} />
  </AppScreen>;
}

function HomeRoute({ onOpenFAQ }: { onOpenFAQ: (id: string) => void }) {
  const dog: OwnedDog = { id: DOG_ID, name: 'Luna', breed_id: 'synthetic-mix', birth_date: '2026-08-01' };
  return <AppScreen scrollKey="know02-home-carousel" footer={<BottomNav active="home" onChange={() => undefined} />}>
    <HomeCarousel dog={dog} plans={[]} selectedDatePlans={[]} content={REVIEW_TRAINING_GUIDES} contentState="ready"
      onGo={() => undefined} onOpenContent={(id) => { window.__know02OpenedContent = id; if (id === FAQ_DESTINATION_ID) onOpenFAQ(id); }} />
  </AppScreen>;
}

function App() {
  const [screen, setScreen] = useState(query.get('screen') ?? 'checklist-overview');
  const [routedContentId, setRoutedContentId] = useState<string | null>(null);
  const [routeMounted, setRouteMounted] = useState(true);
  const [pending, setPending] = useState<PendingChecklistMemory | null>(null);
  const [scope, setScope] = useState(0);
  useEffect(() => {
    window.__know02UnmountRoute = () => setRouteMounted(false);
    window.__know02RemountRoute = () => setRouteMounted(true);
    window.__know02ChangeScope = () => { setPending(null); setScope((value) => value + 1); };
    return () => {
      delete window.__know02UnmountRoute;
      delete window.__know02RemountRoute;
      delete window.__know02ChangeScope;
    };
  }, []);
  if (screen === 'home-carousel') return <HomeRoute onOpenFAQ={(id) => { setRoutedContentId(id); setScreen('knowledge'); }} />;
  if (!routeMounted) return null;
  if (screen === 'review-training-list' || screen === 'review-training-detail') return <TrainingRoute />;
  return <KnowledgeRoute key={`scope-${scope}-${routedContentId ?? 'default'}`} pending={pending} onPendingChange={setPending} sessionKey={`synthetic-session-${scope}`} dogId={scope ? `${DOG_ID}-scope-${scope}` : DOG_ID} routedContentId={routedContentId} onHome={() => { setRoutedContentId(null); setScreen('home-carousel'); }} />;
}

createRoot(document.getElementById('root')!).render(<App />);
