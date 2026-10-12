import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { HomeContent } from '../../src/data/app-data';
import type { OwnedDog } from '../../src/data/app-data';
import type { PublishedTrainingProgram } from '../../src/data/workspace-data';
import { AppScreen } from '../../src/components/AppPrimitives';
import { BottomNav } from '../../src/components/ui';
import { HomeCarousel } from '../../src/features/home/HomeCarousel';
import { CHECKLIST_DESTINATION_ID, FAQ_DESTINATION_ID, REVIEW_TRAINING_PROGRAMS } from '../../src/features/knowledge/review-content';
import { KnowledgeScreen } from '../../src/features/knowledge/KnowledgeScreen';
import type { PendingChecklistMemory } from '../../src/features/knowledge/PuppyChecklistScreen';
import { PublishedTrainingScreen } from '../../src/features/training/PublishedTrainingScreen';

const DOG_ID = 'synthetic-dog-know02';
const FIRST_DAYS = 'review-v1:first-days';
const CUSTOM_ID = '00000000-0000-4000-8000-000000000002';
const query = new URLSearchParams(location.search);
const initialState = query.get('state') ?? 'ready';

declare global {
  interface Window {
    __know02MutationFault?: string;
    __know02CloudWrites?: number;
    __know02ContinueCount?: number;
    __know02WriteDelayMs?: number;
    __know02Mutations?: Array<{ table: string; mode: string; filters: Record<string, unknown>; payload: Record<string, unknown> }>;
    __know02OpenedContent?: string;
    __know02UnmountRoute?: () => void;
    __know02RemountRoute?: () => void;
    __know02ChangeScope?: () => void;
  }
}

function makeClient() {
  const tables: Record<string, Record<string, unknown>[]> = {
    dog_checklist_progress: initialState === 'empty' ? [] : [{ dog_id: DOG_ID, template_id: FIRST_DAYS, item_key: 'quiet-start' }],
    dog_checklist_custom_items: initialState === 'empty' ? [] : [{ id: CUSTOM_ID, dog_id: DOG_ID, template_id: FIRST_DAYS, title: 'Boka valpkurs', completed: false }],
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
      const rows = tables[table] ?? (tables[table] = []);
      let data: unknown = null;
      if (initialState === 'loading') await new Promise((resolve) => setTimeout(resolve, 1600));
      if (mode !== 'select' && window.__know02WriteDelayMs) await new Promise((resolve) => setTimeout(resolve, window.__know02WriteDelayMs));
      if (mode === 'select' && failNextRead) { failNextRead = false; return { data: null, error: { message: 'Synthetic read error' } }; }
      if (mode === 'select' && window.__know02MutationFault === 'unknown-read') {
        window.__know02MutationFault = undefined;
        return { data: null, error: { message: 'Synthetic uncertain read' } };
      }
      if (mode !== 'select' && window.__know02MutationFault === 'failed') {
        window.__know02MutationFault = undefined;
        return { data: null, error: { message: 'Synthetic write error' } };
      }
      if (mode !== 'select') (window.__know02Mutations ??= []).push({ table, mode, filters: { ...filters }, payload: { ...payload } });
      if (mode === 'select') data = rows.filter(matches);
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
const items: readonly HomeContent[] = [
  { id: 'review-v1:guide:first-days', contentId: 'review-v1:guide:first-days', version: 1, title: 'En lugn start hemma', body: 'Tillfälligt exempel – innehållet är inte sakgranskat.\n\nLåt valpen landa i sin egen takt.', contentType: 'article', sources: [] },
];

function KnowledgeRoute({ pending, onPendingChange, sessionKey, dogId, directContentId, directFromHome = false, onBack = () => undefined }: { pending: PendingChecklistMemory | null; onPendingChange: (state: PendingChecklistMemory | null) => void; sessionKey: string; dogId: string; directContentId?: string | null; directFromHome?: boolean; onBack?: () => void }) {
  const focusedContentId = directContentId !== undefined ? directContentId : query.get('screen') === 'faq' ? FAQ_DESTINATION_ID : query.get('screen') === 'checklist-detail' || query.get('screen') === 'checklist-overview' ? CHECKLIST_DESTINATION_ID : null;
  return <AppScreen scrollKey="know02-knowledge" footer={<BottomNav active="more" onChange={() => undefined} />}>
    <KnowledgeScreen onBack={onBack} items={items} contentState="ready" focusedContentId={focusedContentId}
      focusedContentOrigin={directFromHome ? 'home-carousel' : focusedContentId ? 'knowledge-list' : null} focusScopeKey={`${sessionKey}:${dogId}`}
      client={client as never} dogId={dogId} ageWeeks={Number(query.get('ageWeeks') ?? 10)} sessionKey={sessionKey}
      checklistPending={pending} onChecklistPendingChange={onPendingChange} />
  </AppScreen>;
}

function TrainingRoute() {
  const [programs, setPrograms] = useState<readonly PublishedTrainingProgram[]>(REVIEW_TRAINING_PROGRAMS);
  const [focusGeneration, setFocusGeneration] = useState(0);
  const onCompleteStep = async (program: PublishedTrainingProgram, stepId: string) => {
    window.__know02CloudWrites = (window.__know02CloudWrites ?? 0) + 1;
    setPrograms((current) => current.map((item) => item.id === program.id ? { ...item, completedStepIds: [...item.completedStepIds, stepId] } : item));
    return { programId: program.id, stepId };
  };
  return <AppScreen scrollKey={`know02-training:${focusGeneration}`} footer={<BottomNav active="training" onChange={() => undefined} />}>
    <PublishedTrainingScreen programs={programs} paused={[]} busyStepKey={null} error="" reviewMode
      onCompleteStep={onCompleteStep} onContinue={() => { window.__know02ContinueCount = (window.__know02ContinueCount ?? 0) + 1; }}
      onResetProgram={() => undefined} onUndoStep={async () => {
        window.__know02CloudWrites = (window.__know02CloudWrites ?? 0) + 1;
        return false;
      }} onFocusProgram={() => setFocusGeneration((current) => current + 1)} onRetry={() => undefined} />
  </AppScreen>;
}

function HomeRoute() {
  const [openedContentId, setOpenedContentId] = useState<string | null>(null);
  const dog: OwnedDog = { id: DOG_ID, name: 'Luna', breed_id: 'synthetic-mix', birth_date: '2026-08-01' };
  if (openedContentId) return <KnowledgeRoute pending={null} onPendingChange={() => undefined} sessionKey="synthetic-home-session" dogId={DOG_ID}
    directContentId={openedContentId} directFromHome onBack={() => setOpenedContentId(null)} />;
  return <AppScreen scrollKey="know02-home-carousel" footer={<BottomNav active="home" onChange={() => undefined} />}>
    <HomeCarousel dog={dog} pottyEvents={[]} pottyHistoryState="ready" pottyRetrying={false} onRetryPotty={() => undefined}
      today="2026-10-11" plans={[]} selectedDatePlans={[]} content={items} contentState="ready"
      onGo={() => undefined} onOpenContent={(id) => { window.__know02OpenedContent = id; setOpenedContentId(id); }} />
  </AppScreen>;
}

function App() {
  const screen = query.get('screen') ?? 'checklist-overview';
  const [routeMounted, setRouteMounted] = useState(true);
  const [pending, setPending] = useState<PendingChecklistMemory | null>(null);
  const [scope, setScope] = useState(0);
  window.__know02UnmountRoute = () => setRouteMounted(false);
  window.__know02RemountRoute = () => setRouteMounted(true);
  window.__know02ChangeScope = () => { setPending(null); setScope((value) => value + 1); };
  if (screen === 'home-carousel') return <HomeRoute />;
  if (!routeMounted) return null;
  if (screen === 'review-training-list' || screen === 'review-training-detail') return <TrainingRoute />;
  return <KnowledgeRoute pending={pending} onPendingChange={setPending} sessionKey={`synthetic-session-${scope}`} dogId={scope ? `${DOG_ID}-scope-${scope}` : DOG_ID} />;
}

createRoot(document.getElementById('root')!).render(<App />);
