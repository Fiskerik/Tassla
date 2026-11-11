import { useEffect, useRef, useState, type ComponentProps } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchPublishedChecklistCatalog } from '../knowledge/checklist-data';
import type { ChecklistTemplate } from '../knowledge/checklist-model';
import { DevelopmentScreen } from './DevelopmentScreen';

type ScreenProps = Omit<ComponentProps<typeof DevelopmentScreen>, 'phaseTemplates' | 'phaseState' | 'onRetryPhases'>;
type CatalogResult = { client: SupabaseClient; ownerId: string; generation: number; attempt: number; status: 'ready' | 'error'; templates: readonly ChecklistTemplate[] };

/** Scoped to the development route and its current owner, dog and date. */
export function DevelopmentCatalogScreen({ client, ownerId, accountGeneration, isCurrentAccount, ...props }: ScreenProps & {
  client: SupabaseClient; ownerId: string; accountGeneration: number; isCurrentAccount: (ownerId: string, generation: number) => boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<CatalogResult | null>(null);
  const requestGeneration = useRef(0);

  useEffect(() => {
    const generationRef = requestGeneration;
    const controller = new AbortController();
    const request = ++generationRef.current;
    const current = () => !controller.signal.aborted && generationRef.current === request && isCurrentAccount(ownerId, accountGeneration);
    void fetchPublishedChecklistCatalog(client, controller.signal).then((catalog) => {
      if (current()) setResult({ client, ownerId, generation: accountGeneration, attempt, status: 'ready', templates: catalog.templates });
    }).catch(() => {
      if (current()) setResult({ client, ownerId, generation: accountGeneration, attempt, status: 'error', templates: [] });
    });
    return () => { controller.abort(); generationRef.current++; };
  }, [client, ownerId, accountGeneration, isCurrentAccount, attempt]);

  const current = result && result.client === client && result.ownerId === ownerId && result.generation === accountGeneration
    && result.attempt === attempt && isCurrentAccount(ownerId, accountGeneration) ? result : null;
  return <DevelopmentScreen {...props} phaseTemplates={current?.templates ?? []} phaseState={current?.status ?? 'loading'}
    onRetryPhases={() => setAttempt((value) => value + 1)} />;
}
