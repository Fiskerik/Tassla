import { useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppScreen, MessageCard, PageHeading, PrimaryButton } from '../../components/AppPrimitives';
import { fetchOwnedDogs, type OwnedDog } from '../../data/app-data';
import { DEV_PREVIEW_ENABLED } from '../account/preview-policy';
import { SignInScreen } from '../account/SignInScreen';
import { ProfileScreen, type DogCreationRecoverySnapshot } from '../onboarding/ProfileScreen';
import { DevelopmentPreview } from './DevelopmentPreview';
import { ProductWorkspace } from './ProductWorkspace';
import { useAuth } from '../account/AuthProvider';
import { cleanupStalePassportFiles } from '../passport/passport-export';
import { captureSecureKennelJoinUrl } from '../../onboarding-referral/referral-secure-storage';

export function AppFlow() {
  const [referralReady, setReferralReady] = useState(false);
  useEffect(() => {
    cleanupStalePassportFiles();
    let active = true;
    void Linking.getInitialURL().then(async (url) => {
      if (active && url) await captureSecureKennelJoinUrl(url).catch(() => undefined);
    }).catch(() => undefined).finally(() => { if (active) setReferralReady(true); });
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void captureSecureKennelJoinUrl(url);
    });
    return () => { active = false; subscription.remove(); };
  }, []);
  if (!referralReady) return <AppScreen><MessageCard>Förbereder Tassla…</MessageCard></AppScreen>;
  return DEV_PREVIEW_ENABLED ? <DevelopmentPreview /> : <AuthenticatedAppFlow />;
}

function AuthenticatedAppFlow() {
  const { client, session, status, accountGeneration, isCurrentAccount } = useAuth();

  if (status === 'loading') return <AppScreen>
    <PageHeading title="Öppnar Tassla" description="Hämtar din hunds plats." />
    <MessageCard>Öppnar Tassla…</MessageCard>
  </AppScreen>;
  if (status === 'unavailable' || !client) return <AppScreen><PageHeading title="Tassla vilar en stund" description="Inloggningen är inte tillgänglig just nu. Försök igen senare." /></AppScreen>;
  if (status === 'signedOut' || !session) return <SignInScreen />;
  return <DogWorkspace key={session.user.id + ':' + accountGeneration} client={client} ownerId={session.user.id} accountGeneration={accountGeneration} isCurrentAccount={isCurrentAccount} />;
}

function DogWorkspace({ client, ownerId, accountGeneration, isCurrentAccount }: {
  client: SupabaseClient;
  ownerId: string;
  accountGeneration: number;
  isCurrentAccount(ownerId: string, generation: number): boolean;
}) {
  const [dogs, setDogs] = useState<OwnedDog[]>([]);
  const [activeDogId, setActiveDogId] = useState<string | null>(null);
  const [dogSelectionGeneration, setDogSelectionGeneration] = useState(0);
  const dogsRef = useRef<OwnedDog[]>(dogs);
  const activeDogIdRef = useRef<string | null>(activeDogId);
  const dogSelectionGenerationRef = useRef(0);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [addingDog, setAddingDog] = useState(false);
  const [addEntryPoint, setAddEntryPoint] = useState<'home' | 'settings'>('home');
  const [pendingAddRecoverySnapshot, setPendingAddRecoverySnapshot] = useState<DogCreationRecoverySnapshot | null>(null);
  const [openDogSwitcherOnReturn, setOpenDogSwitcherOnReturn] = useState(false);
  const [openDogProfileOnReturn, setOpenDogProfileOnReturn] = useState(false);

  function selectDog(dogId: string | null) {
    if (activeDogIdRef.current !== dogId) {
      const nextGeneration = dogSelectionGenerationRef.current + 1;
      dogSelectionGenerationRef.current = nextGeneration;
      setDogSelectionGeneration(nextGeneration);
    }
    activeDogIdRef.current = dogId;
    setActiveDogId(dogId);
  }

  async function handleDogDeleted(deletedDogId: string, selectionGeneration: number, remainingDogs: OwnedDog[] | null) {
    if (!isCurrentAccount(ownerId, accountGeneration)) return;
    if (selectionGeneration === dogSelectionGenerationRef.current && activeDogIdRef.current === deletedDogId) {
      const nextDogs = remainingDogs ?? dogsRef.current.filter((dog) => dog.id !== deletedDogId);
      setDogs(nextDogs);
      dogsRef.current = nextDogs;
      if (!nextDogs.some((dog) => dog.id === activeDogIdRef.current)) {
        selectDog(nextDogs[0]?.id ?? null);
      }
      setState('ready');
      return;
    }

    // A confirmed response from an older selection is reconciled through the
    // owner's list, never applied as if it belonged to the currently open dog.
    try {
      const latestDogs = await fetchOwnedDogs(client);
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      setDogs(latestDogs);
      dogsRef.current = latestDogs;
      if (!latestDogs.some((dog) => dog.id === activeDogIdRef.current)) {
        selectDog(latestDogs[0]?.id ?? null);
      }
      setState('ready');
    } catch {
      if (isCurrentAccount(ownerId, accountGeneration)) setState('error');
    }
  }

  useEffect(() => {
    let active = true;
    void fetchOwnedDogs(client).then((loadedDogs) => {
      if (!active) return;
      setDogs(loadedDogs);
      dogsRef.current = loadedDogs;
      const nextActiveDogId = activeDogIdRef.current && loadedDogs.some((dog) => dog.id === activeDogIdRef.current)
        ? activeDogIdRef.current : loadedDogs[0]?.id ?? null;
      activeDogIdRef.current = nextActiveDogId;
      setActiveDogId(nextActiveDogId);
      setState('ready');
    }).catch(() => {
      if (active) setState('error');
    });
    return () => { active = false; };
  }, [attempt, client]);

  function acceptCreatedDog(created: OwnedDog) {
    if (!isCurrentAccount(ownerId, accountGeneration)) return;
    setDogs((current) => current.some((dog) => dog.id === created.id)
      ? current.map((dog) => dog.id === created.id ? created : dog)
      : [...current, created]);
    const latestDogs = dogsRef.current.some((dog) => dog.id === created.id)
      ? dogsRef.current.map((dog) => dog.id === created.id ? created : dog)
      : [...dogsRef.current, created];
    dogsRef.current = latestDogs;
    selectDog(created.id);
    setAddingDog(false);
    setPendingAddRecoverySnapshot(null);
    setOpenDogSwitcherOnReturn(false);
    setOpenDogProfileOnReturn(addEntryPoint === 'settings');
    setState('ready');
    void fetchOwnedDogs(client).then((loadedDogs) => {
      if (isCurrentAccount(ownerId, accountGeneration)) {
        setDogs(loadedDogs);
        dogsRef.current = loadedDogs;
      }
    }).catch(() => undefined);
  }

  function startAddingDog(entryPoint: 'home' | 'settings' = 'home') {
    const restoredEntryPoint = pendingAddRecoverySnapshot?.ownerId === ownerId
      && pendingAddRecoverySnapshot.accountGeneration === accountGeneration
      ? pendingAddRecoverySnapshot.entryPoint : entryPoint;
    setAddEntryPoint(restoredEntryPoint);
    setAddingDog(true);
  }

  async function cancelAddingDog(result: { kind: 'discard' } | { kind: 'resume'; snapshot: DogCreationRecoverySnapshot }) {
    const returnEntryPoint = result.kind === 'resume' ? result.snapshot.entryPoint : addEntryPoint;
    if (result.kind === 'resume') setPendingAddRecoverySnapshot(result.snapshot);
    else setPendingAddRecoverySnapshot(null);
    setAddingDog(false);
    setAddEntryPoint(returnEntryPoint);
    setOpenDogSwitcherOnReturn(returnEntryPoint === 'home');
    setOpenDogProfileOnReturn(returnEntryPoint === 'settings');
    setState('loading');
    try {
      const loadedDogs = await fetchOwnedDogs(client);
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      setDogs(loadedDogs);
      dogsRef.current = loadedDogs;
      const nextActiveDogId = activeDogIdRef.current && loadedDogs.some((dog) => dog.id === activeDogIdRef.current)
        ? activeDogIdRef.current : loadedDogs[0]?.id ?? null;
      selectDog(nextActiveDogId);
      setState('ready');
    } catch {
      if (isCurrentAccount(ownerId, accountGeneration)) setState('error');
    }
  }

  if (state === 'loading') return <AppScreen>
    <PageHeading title="Hundprofil" description="Hämtar hundens sparade uppgifter." />
    <MessageCard>Hämtar hundens profil…</MessageCard>
  </AppScreen>;
  if (state === 'error') return <AppScreen>
    <PageHeading title="Vi kunde inte öppna profilen" description="Kontrollera anslutningen och försök hämta profilen igen." />
    <PrimaryButton title="Försök igen" onPress={() => { setState('loading'); setAttempt((count) => count + 1); }} />
  </AppScreen>;
  if (state === 'ready' && (dogs.length === 0 || addingDog)) return <ProfileScreen
    key={`${ownerId}:${addingDog ? 'add' : 'initial'}`}
    client={client} ownerId={ownerId} accountGeneration={accountGeneration} isCurrentAccount={isCurrentAccount}
    mode={dogs.length > 0 ? 'add' : 'initial'} onCreated={acceptCreatedDog}
    entryPoint={addEntryPoint} recoverySnapshot={pendingAddRecoverySnapshot}
    onClearRecoverySnapshot={() => setPendingAddRecoverySnapshot(null)}
    onCancel={dogs.length > 0 ? cancelAddingDog : undefined}
  />;
  const activeDog = dogs.find((dog) => dog.id === activeDogId) ?? dogs[0];
  if (state === 'ready' && activeDog) return <ProductWorkspace
    key={activeDog.id} client={client} dog={activeDog} ownedDogs={dogs}
    dogSelectionGeneration={dogSelectionGeneration} onDogDeleted={(dogId, generation, remaining) => { void handleDogDeleted(dogId, generation, remaining); }}
    onDogUpdated={(updated) => {
      const nextDogs = dogsRef.current.map((dog) => dog.id === updated.id ? updated : dog);
      dogsRef.current = nextDogs;
      setDogs(nextDogs);
    }}
    onSelectDog={(dogId) => { if (dogsRef.current.some((dog) => dog.id === dogId)) selectDog(dogId); }}
    onAddDog={startAddingDog} openDogSwitcherInitially={openDogSwitcherOnReturn}
    onDogSwitcherInitiallyOpened={() => setOpenDogSwitcherOnReturn(false)}
    initialPage={openDogProfileOnReturn ? 'profile' : 'home'}
    onInitialPageOpened={() => setOpenDogProfileOnReturn(false)}
  />;
  return <AppScreen><MessageCard>Öppnar hundens plats…</MessageCard></AppScreen>;
}
