import { useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ScrollView, View } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import bundle from '../../docs/content/knowledge-phase-checklists-v1.json';
import { DevelopmentCatalogScreen } from '../../src/features/home/DevelopmentCatalogScreen';

type ResponseRow = { data: unknown; error: null | { message: string } };
type PendingRequest = { tag: string; resolve: (value: ResponseRow) => void; response: ResponseRow };
const pending: PendingRequest[] = [];
const sources = new Map(bundle.sources.map((source) => [source.id, source.url]));
const roots = bundle.templates.map((template, index) => ({ id: template.template_id, context: template.context,
  content_item_id: `50000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}` }));
const versions = bundle.templates.map((template, index) => ({ id: template.version_id, content_id: roots[index].content_item_id,
  version: template.version, title: template.title, body: template.body, min_age_weeks: template.min_age_weeks,
  max_age_weeks: template.max_age_weeks, context: template.context, sources: template.sources.map((source) => sources.get(source)),
  is_ai_generated: true, status: 'published', reviewed_at: '2026-10-26T00:00:00.000Z', review_reference: 'synthetic reviewed fixture' }));

function makeClient(tag: string, mode: 'ready' | 'slow' | 'error' | 'empty'): SupabaseClient {
  let failOnce = mode === 'error';
  const items = bundle.templates.flatMap((template) => template.items.map((item) => ({ content_version_id: template.version_id,
    template_id: template.template_id, item_key: item.key, position: item.position, title: item.key === 'name' ? `${item.title} · ${tag}` : item.title })));
  return { from(table: string) {
    const query = {
      select() { return query; }, in() { return query; }, eq() { return query; }, abortSignal() { return query; },
      then(resolve: (value: ResponseRow) => unknown, reject: (error: unknown) => unknown) {
        const data = table === 'checklist_templates' ? (mode === 'empty' ? [] : roots) : table === 'content_versions' ? versions : items;
        const response = failOnce ? { data: null, error: { message: 'synthetic unavailable' } } : { data, error: null };
        failOnce = false;
        if (table === 'checklist_templates' && mode === 'slow') {
          return new Promise<ResponseRow>((done) => pending.push({ tag, resolve: done, response })).then(resolve, reject);
        }
        return Promise.resolve(response).then(resolve, reject);
      },
    };
    return query;
  } } as unknown as SupabaseClient;
}

function Fixture() {
  const [dog, setDog] = useState('A');
  const [owner, setOwner] = useState('owner-A');
  const [mounted, setMounted] = useState(true);
  const [client, setClient] = useState(() => makeClient('A', 'ready'));
  const [guidesState, setGuidesState] = useState<'ready' | 'error'>('ready');
  const [reader, setReader] = useState('');
  const currentOwner = useRef(owner); currentOwner.current = owner;
  const isCurrentAccount = useCallback((id: string, generation: number) => id === currentOwner.current && generation === 1, []);
  return <View style={{ flex: 1 }}>
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      <button onClick={() => setClient(makeClient(dog + '-slow', 'slow'))}>Ladda långsamt</button>
      <button onClick={() => setClient(makeClient(dog + '-new', 'ready'))}>Byt klient</button>
      <button onClick={() => { setDog('B'); setClient(makeClient('B', 'ready')); }}>Byt hund</button>
      <button onClick={() => { setOwner('owner-B'); setClient(makeClient('owner-B', 'ready')); }}>Byt konto</button>
      <button onClick={() => setClient(makeClient(dog + '-error', 'error'))}>Simulera fasfel</button>
      <button onClick={() => setClient(makeClient(dog + '-empty', 'empty'))}>Simulera tom fas</button>
      <button onClick={() => setClient(makeClient(dog + '-recovered', 'ready'))}>Återställ klient</button>
      <button onClick={() => { for (const request of pending.splice(0)) request.resolve(request.response); }}>Släpp sena svar</button>
      <button onClick={() => setGuidesState((state) => state === 'ready' ? 'error' : 'ready')}>Växla läsfel</button>
      <button onClick={() => setMounted((value) => !value)}>Visa eller stäng vy</button>
    </div>
    {reader ? <button onClick={() => setReader('')}>Tillbaka från {reader}</button> : mounted ? <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
      <DevelopmentCatalogScreen key={`${owner}:${dog}`} client={client} ownerId={owner} accountGeneration={1} isCurrentAccount={isCurrentAccount}
        dogName={dog} birthDate="2026-01-01" today="2026-03-19" guidesState={guidesState}
        guides={[{ id: 'published-v1', contentId: 'published', version: 1, title: 'En lugn start', body: 'Publicerad syntetisk text', contentType: 'article', recommended: true, isAiGenerated: true, sources: [] }]}
        onBack={() => setMounted(false)} onOpenGuide={setReader} onRetryGuides={() => setGuidesState('ready')} />
    </ScrollView> : null}
  </View>;
}

createRoot(document.getElementById('root')!).render(<Fixture />);
