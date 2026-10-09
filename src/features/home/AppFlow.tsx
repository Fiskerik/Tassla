import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppScreen, MessageCard, PageHeading, PrimaryButton } from '../../components/AppPrimitives';
import { fetchOwnedDog, type OwnedDog } from '../../data/app-data';
import { DEV_PREVIEW_ENABLED } from '../account/preview-policy';
import { SignInScreen } from '../account/SignInScreen';
import { ProfileScreen } from '../onboarding/ProfileScreen';
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

  if (status === 'loading') return <AppScreen><MessageCard>Öppnar Tassla…</MessageCard></AppScreen>;
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
  const [dog, setDog] = useState<OwnedDog | null>(null);
  const [state, setState] = useState<'loading' | 'missing' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void fetchOwnedDog(client).then((loadedDog) => {
      if (!active) return;
      setDog(loadedDog);
      setState(loadedDog ? 'ready' : 'missing');
    }).catch(() => {
      if (active) setState('error');
    });
    return () => { active = false; };
  }, [attempt, client]);

  if (state === 'loading') return <AppScreen><MessageCard>Hämtar hundens profil…</MessageCard></AppScreen>;
  if (state === 'error') return <AppScreen>
    <PageHeading title="Vi kunde inte öppna profilen" description="Kontrollera anslutningen och försök hämta profilen igen." />
    <PrimaryButton title="Försök igen" onPress={() => { setState('loading'); setAttempt((count) => count + 1); }} />
  </AppScreen>;
  if (state === 'missing') return <ProfileScreen client={client} ownerId={ownerId} accountGeneration={accountGeneration} isCurrentAccount={isCurrentAccount} onCreated={(created) => { setDog(created); setState('ready'); }} />;
  return dog ? <ProductWorkspace key={dog.id} client={client} dog={dog} onDogUpdated={setDog} /> : <AppScreen><MessageCard>Öppnar hundens plats…</MessageCard></AppScreen>;
}
