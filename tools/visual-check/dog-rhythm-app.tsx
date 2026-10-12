import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppScreen } from '../../src/components/AppPrimitives';
import { BottomNav } from '../../src/components/ui';
import { HomeScreen } from '../../src/features/home/HomeScreen';

const params = new URLSearchParams(location.search);
const scenario = params.get('state') ?? 'insufficient';
const dog = { id: 'dog-1', name: 'Luna', breed_id: 'mixed', birth_date: '2025-11-01' };
const now = Date.now();
const personal = (['pee', 'poop'] as const).flatMap((type) => Array.from({ length: 10 }, (_, index) => ({
  id: `${type}-${index}`, dogId: dog.id, type, occurredAt: new Date(now - (9 - index) * 180 * 60_000).toISOString(), note: null, origin: 'local-test' as const,
})));
const events = scenario === 'personal' ? personal : [{ id: 'pee-1', dogId: dog.id, type: 'pee' as const, occurredAt: new Date(now - 30 * 60_000).toISOString(), note: null, origin: 'local-test' as const }];
const pottyHistoryState = scenario === 'loading' || scenario === 'retrying' ? 'loading' : scenario === 'error' ? 'error' : 'ready';
const homeContent = [{ id: 'guide', title: 'Trygg start hemma', body: 'Ett steg i taget.', contentType: 'guide' as const, contentId: 'guide', version: 1, sources: ['Syntetiskt UI-innehåll.'] }];

function App() {
  const [state, setState] = React.useState(pottyHistoryState);
  const [retrying, setRetrying] = React.useState(scenario === 'retrying');
  const onRetry = () => { setState('loading'); setRetrying(true); setTimeout(() => { setState('ready'); setRetrying(false); }, 450); };
  const go = () => {};
  return <AppScreen footer={<BottomNav active="home" onChange={go} />}><HomeScreen
    dog={dog} breed="Blandras" events={[]} pottyEvents={events} pottyHistoryState={state} pottyRetrying={retrying} onRetryPotty={onRetry}
    content={homeContent} contentState="ready" logState="ready" planState="ready" healthHistoryState="ready" plans={[]}
    onGo={go} onOpenContent={go} onRetryContent={go} onRetryHealthHistory={go}
  /></AppScreen>;
}

createRoot(document.getElementById('root')!).render(<App />);
