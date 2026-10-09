import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Text } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BottomSheet, DogCard, ErrorState, ListRow, Skeleton, Toast } from '../../components/ui';
import { fetchBreeds, type BreedOption, type OwnedDog } from '../../data/app-data';
import type { HealthHistoryRecord, HealthWeightRecord } from '../../data/workspace-data';
import { ageInWeeks, localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';
import { createAndSharePassportPdf, type PassportExportResult } from './passport-export';
import { createPassportSnapshot, type PassportSelection } from './passport-model';

type LoadState = 'loading' | 'ready' | 'error';

interface PassportScreenProps {
  onBack: () => void;
  client?: SupabaseClient;
  dog?: OwnedDog;
  lifetime?: string;
  isLifetimeCurrent?: (lifetime: string) => boolean;
  weights?: readonly HealthWeightRecord[];
  weightLoadState?: LoadState;
  weightBusy?: boolean;
  weightPending?: boolean;
  history?: readonly HealthHistoryRecord[];
  historyLoadState?: LoadState;
  historyBusy?: boolean;
  historyPending?: boolean;
  onRetryWeights?: () => void;
  onRetryHistory?: () => void;
  profileBusy?: boolean;
  profilePending?: boolean;
  profileConflict?: boolean;
}

const passportSelection: PassportSelection = { profile: true, latestWeight: true, healthHistory: true };
const emptyWeights: readonly HealthWeightRecord[] = [];
const emptyHistory: readonly HealthHistoryRecord[] = [];

export function PassportScreen(props: PassportScreenProps) {
  const { client, dog, isLifetimeCurrent } = props;
  const [breeds, setBreeds] = useState<BreedOption[]>([]);
  const [breedState, setBreedState] = useState<'loading' | 'ready' | 'error'>(props.client ? 'loading' : 'ready');
  const [breedDataLifetime, setBreedDataLifetime] = useState<string | null>(null);
  const [breedAttempt, setBreedAttempt] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const mounted = useRef(true);
  const lifetimeRef = useRef(props.lifetime ?? 'preview');
  const operationInFlight = useRef(false);
  const currentLifetime = props.lifetime ?? 'preview';

  useLayoutEffect(() => { lifetimeRef.current = currentLifetime; }, [currentLifetime]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!client || !dog) return;
    let active = true;
    const lifetime = currentLifetime;
    void fetchBreeds(client).then((options) => {
      if (!active || !mounted.current || lifetimeRef.current !== lifetime || isLifetimeCurrent?.(lifetime) === false) return;
      setBreeds(options);
      setBreedDataLifetime(lifetime);
      setBreedState('ready');
    }).catch(() => {
      if (!active || !mounted.current || lifetimeRef.current !== lifetime || isLifetimeCurrent?.(lifetime) === false) return;
      setBreedDataLifetime(lifetime);
      setBreedState('error');
    });
    return () => { active = false; };
  }, [breedAttempt, client, currentLifetime, dog, isLifetimeCurrent]);

  const weights = props.weights ?? emptyWeights;
  const history = props.history ?? emptyHistory;
  const breedName = dog ? breeds.find((breed) => breed.id === dog.breed_id)?.name ?? null : null;
  const currentBreedState = breedDataLifetime === currentLifetime ? breedState : 'loading';
  const profileReady = Boolean(dog && breedName) && currentBreedState === 'ready' && !props.profileBusy && !props.profilePending && !props.profileConflict;
  const weightReady = props.weightLoadState === 'ready' && !props.weightBusy && !props.weightPending;
  const historyReady = props.historyLoadState === 'ready' && !props.historyBusy && !props.historyPending;
  const ready = Boolean(client && dog && profileReady && weightReady && historyReady);
  const snapshot = useMemo(() => ready && dog ? createPassportSnapshot({
    dog,
    breedName,
    weights,
    performedHistory: history,
    selection: passportSelection,
    createdOn: localDate(),
  }) : null, [breedName, dog, history, ready, weights]);

  function isCurrent(lifetime: string): boolean {
    return mounted.current && lifetimeRef.current === lifetime && (props.isLifetimeCurrent?.(lifetime) ?? true);
  }

  async function createAndShare() {
    if (operationInFlight.current || !snapshot || !ready) return;
    operationInFlight.current = true;
    setExporting(true);
    setStatusMessage('');
    setStatusError(false);
    const lifetime = currentLifetime;
    try {
      const result = await createAndSharePassportPdf(snapshot, () => isCurrent(lifetime));
      if (!isCurrent(lifetime)) return;
      const message = exportMessage(result);
      setStatusMessage(message.text);
      setStatusError(message.error);
    } finally {
      operationInFlight.current = false;
      if (isCurrent(lifetime)) setExporting(false);
    }
  }

  const canShare = ready && !exporting;
  const sheetState = exporting ? 'loading' : 'default';
  const primaryState = exporting ? 'loading' : statusError ? 'error' : canShare ? 'default' : 'disabled';

  return <BottomSheet
    visible
    title="Tassla-pass"
    onRequestClose={props.onBack}
    onPrimaryAction={() => { void createAndShare(); }}
    primaryLabel={exporting ? 'Skapar PDF…' : 'Dela som PDF'}
    state={sheetState}
    primaryState={primaryState}
  >
    <Text style={styles.intro}>En lugn överblick över uppgifter du själv har registrerat och väljer att dela.</Text>
    {!client || !dog ? <ErrorState title="Hunduppgifter saknas" description="Ingen PDF skapas i den lokala förhandsvisningen." /> : <>
      {currentBreedState === 'loading' && <Skeleton shape="row" lines={3} />}
      {currentBreedState === 'error' && <ErrorState title="Rasnamnet kunde inte hämtas" description="Försök igen innan du delar passet." actionLabel="Försök igen" onRetry={() => { setBreedState('loading'); setBreedDataLifetime(currentLifetime); setBreedAttempt((count) => count + 1); }} />}
      {breedName && <DogCard name={dog.name} breed={breedName} age={formatAge(dog.birth_date)} />}
      {props.weightLoadState === 'loading' && <Skeleton shape="row" lines={2} />}
      {props.weightLoadState === 'error' && <ErrorState title="Vikten kunde inte hämtas" description="Försök igen innan du delar passet." actionLabel="Försök igen" onRetry={props.onRetryWeights} />}
      {props.historyLoadState === 'loading' && <Skeleton shape="row" lines={2} />}
      {props.historyLoadState === 'error' && <ErrorState title="Hälsoposter kunde inte hämtas" description="Försök igen innan du delar passet." actionLabel="Försök igen" onRetry={props.onRetryHistory} />}
      {snapshot?.latestWeight && <ListRow title="Senaste registrerade vikt" detail={`${formatWeight(snapshot.latestWeight.weightKg)} kg · ${snapshot.latestWeight.occurredOn}`} category="awake" chevron={false} />}
      {snapshot?.healthHistory.map((row, index) => <ListRow key={`${row.type}-${row.occurredOn}-${index}`} title={row.type} detail={row.note ? `${row.occurredOn} · ${row.note}` : row.occurredOn} category={row.type === 'Vaccination' ? 'vaccination' : 'veterinary'} chevron={false} />)}
      {snapshot && !snapshot.latestWeight && snapshot.healthHistory.length === 0 && <Text style={styles.emptyCopy}>Inga vikt- eller hälsoposter finns bland de inlästa uppgifterna.</Text>}
      {statusError && <ErrorState title="PDF:en kunde inte skapas" description={statusMessage} actionLabel="Försök igen" onRetry={() => { void createAndShare(); }} />}
      {statusMessage && !statusError && <Toast tone="success" confirmed message={statusMessage} />}
      <Text style={styles.disclaimer}>Uppgifterna är registrerade av hundägaren. Tassla-pass är ingen officiell journal, legitimation eller vaccinationshandling.</Text>
    </>}
  </BottomSheet>;
}

function formatAge(birthDate: string): string {
  const weeks = ageInWeeks(birthDate, localDate());
  return weeks < 8 ? `${weeks} ${weeks === 1 ? 'vecka' : 'veckor'}` : `${Math.max(1, Math.floor(weeks / 4.345))} månader`;
}

function formatWeight(value: number): string {
  return value.toLocaleString('sv-SE', { maximumFractionDigits: 3 });
}

function exportMessage(result: PassportExportResult): { text: string; error: boolean } {
  if (result.status === 'dialog-closed') return { text: 'PDF skapad och delningsdialogen öppnad.', error: false };
  if (result.status === 'unavailable') return { text: 'PDF:en skapades, men delning är inte tillgänglig på den här enheten.', error: true };
  if (result.status === 'busy') return { text: 'En PDF håller redan på att skapas.', error: true };
  return { text: 'PDF:en kunde inte skapas eller öppnas för delning. Försök igen.', error: true };
}

const styles = {
  intro: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  emptyCopy: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  disclaimer: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
} as const;
