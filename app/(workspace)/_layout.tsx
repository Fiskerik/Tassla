import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { AppScreen, MessageCard, PageHeading, PrimaryButton } from '../../src/components/AppPrimitives';
import { fetchOwnedDog, type OwnedDog } from '../../src/data/app-data';
import { ProfileScreen } from '../../src/features/onboarding/ProfileScreen';
import { ProductWorkspace } from '../../src/features/home/ProductWorkspace';
import { useAuth } from '../../src/features/account/AuthProvider';

export default function WorkspaceLayout() {
  const { client, session, status, accountGeneration, isCurrentAccount } = useAuth();
  const [dog, setDog] = useState<OwnedDog | null>(null);
  const [state, setState] = useState<'loading' | 'missing' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!client || !session) return undefined;
    let active = true;
    void fetchOwnedDog(client).then((loadedDog) => {
      if (!active) return;
      setDog(loadedDog);
      setState(loadedDog ? 'ready' : 'missing');
    }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [attempt, client, session]);

  if (status === 'loading' || !client || !session) return <Redirect href="/" />;
  if (state === 'loading') return <AppScreen><MessageCard>Hämtar hundens profil…</MessageCard></AppScreen>;
  if (state === 'error') return <AppScreen>
    <PageHeading title="Vi kunde inte öppna profilen" description="Kontrollera anslutningen och försök hämta profilen igen." />
    <PrimaryButton title="Försök igen" onPress={() => { setState('loading'); setAttempt((count) => count + 1); }} />
  </AppScreen>;
  if (state === 'missing') return <ProfileScreen client={client} ownerId={session.user.id} accountGeneration={accountGeneration} isCurrentAccount={isCurrentAccount} onCreated={(created) => { setDog(created); setState('ready'); }} />;
  return dog ? <ProductWorkspace client={client} dog={dog} onDogUpdated={setDog}><Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'slide_from_right', gestureEnabled: true, fullScreenGestureEnabled: true }} /></ProductWorkspace> : <AppScreen><MessageCard>Öppnar hundens plats…</MessageCard></AppScreen>;
}
