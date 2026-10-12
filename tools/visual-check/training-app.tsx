import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppScreen } from '../../src/components/AppPrimitives';
import { BottomNav } from '../../src/components/ui';
import { PublishedTrainingScreen } from '../../src/features/training/PublishedTrainingScreen';
import type { PublishedTrainingProgram } from '../../src/data/workspace-data';

const programs: PublishedTrainingProgram[] = [
  {
    id: 'program-home', content_id: 'trygg-start-hemma', version: 1, title: 'Trygg start hemma',
    body: 'Ett steg i taget. Följ hundens tempo och ge utrymme för pauser.', sources: ['Syntetiskt UI-innehåll.'],
    steps: [
      { id: 'utforska', position: 1, title: 'Utforska i egen takt', instruction: 'Låt hunden undersöka ett rum i lugn takt.' },
      { id: 'vila', position: 2, title: 'Vila nära', instruction: 'Erbjud en trygg plats nära familjen.' },
    ], completedStepIds: [],
  },
  {
    id: 'program-contact', content_id: 'kontakt-namn', version: 1, title: 'Kontakt och namn',
    body: 'Bygg kontakt i korta, belöningsbaserade stunder.', sources: ['Syntetiskt UI-innehåll.'],
    steps: [
      { id: 'namn', position: 1, title: 'Säg namnet en gång', instruction: 'Belöna när hunden vänder sig mot dig.' },
      { id: 'folj', position: 2, title: 'Följ en rörelse', instruction: 'Belöna ett lugnt steg tillsammans.' },
    ], completedStepIds: ['namn'],
  },
  {
    id: 'program-calm', content_id: 'vardagsro-hantering', version: 1, title: 'Vardagsro och hantering',
    body: 'Öva kort och avbryt om hunden visar obehag.', sources: ['Syntetiskt UI-innehåll.'],
    steps: [{ id: 'paus', position: 1, title: 'Paus på filt', instruction: 'Belöna frivilligt lugn på filten.' }], completedStepIds: [],
  },
];

const scenario = new URLSearchParams(location.search).get('state') ?? 'loaded';

function App() {
  const [items, setItems] = React.useState(programs);
  const [focusGeneration, setFocusGeneration] = React.useState(0);
  const [error, setError] = React.useState(scenario === 'error' ? 'Vi kunde inte uppdatera övningen. Försök igen.' : '');
  const [busy, setBusy] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState('home');
  const activeItems = scenario === 'empty' ? [] : items;

  const changeCompleted = (program: PublishedTrainingProgram, stepId: string, complete: boolean) => {
    setItems((current) => current.map((item) => item.id !== program.id ? item : {
      ...item,
      completedStepIds: complete
        ? [...new Set([...item.completedStepIds, stepId])]
        : item.completedStepIds.filter((id) => id !== stepId),
    }));
  };

  return <AppScreen scrollKey={`training:${focusGeneration}`} footer={<BottomNav active="training" onChange={setTab} />}>
    {scenario === 'loading' ? <div style={{ padding: 24 }}>Laddar träningsprogram…</div> : null}
    {scenario !== 'loading' ? <PublishedTrainingScreen
      programs={activeItems} paused={[]} busyStepKey={busy} error={error}
      onCompleteStep={async (program, stepId) => {
        setBusy(`${program.id}:${stepId}`);
        await new Promise((resolve) => setTimeout(resolve, 180));
        if (scenario === 'failure') { setError('Övningen kunde inte sparas. Försök igen.'); setBusy(null); return false; }
        changeCompleted(program, stepId, true);
        setBusy(null); setError('');
        return { programId: program.id, stepId };
      }}
      onContinue={() => {}}
      onResetProgram={(program) => setItems((current) => current.map((item) => item.id === program.id ? { ...item, completedStepIds: [] } : item))}
      onUndoStep={async (program, stepId) => {
        setBusy(`${program.id}:${stepId}:undo`);
        await new Promise((resolve) => setTimeout(resolve, 180));
        changeCompleted(program, stepId, false);
        setBusy(null); setError('');
        return true;
      }}
      onFocusProgram={() => setFocusGeneration((current) => current + 1)}
      onRetry={() => setError('')}
    /> : null}
  </AppScreen>;
}

createRoot(document.getElementById('root')!).render(<App />);
