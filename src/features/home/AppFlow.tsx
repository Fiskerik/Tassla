import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppScreen, MessageCard, PageHeading, PrimaryButton } from '../../components/AppPrimitives';
import { fetchOwnedDog, type OwnedDog } from '../../data/app-data';
import { DEV_PREVIEW_ENABLED } from '../account/preview-policy';
import { SignInScreen } from '../account/SignInScreen';
import { ProfileScreen } from '../onboarding/ProfileScreen';
import { DevelopmentPreview } from './DevelopmentPreview';
import { ProductWorkspace } from './ProductWorkspace';
import { useAuth } from '../account/AuthProvider';

export function AppFlow() {
  return DEV_PREVIEW_ENABLED ? <DevelopmentPreview /> : <AuthenticatedAppFlow />;
}

function AuthenticatedAppFlow() {
  const { client, session, status } = useAuth();

  if (status === 'loading') return <AppScreen><MessageCard>Öppnar Tassla…</MessageCard></AppScreen>;
  if (status === 'unavailable' || !client) return <AppScreen><PageHeading title="Tassla vilar en stund" description="Inloggningen är inte tillgänglig just nu. Försök igen senare." /></AppScreen>;
  if (status === 'signedOut' || !session) return <SignInScreen />;
  return <DogWorkspace key={session.user.id} client={client} />;
}

function DogWorkspace({ client }: { client: SupabaseClient }) {
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
  if (state === 'missing') return <ProfileScreen client={client} onCreated={(created) => { setDog(created); setState('ready'); }} />;
  return dog ? <ProductWorkspace key={dog.id} client={client} dog={dog} onDogUpdated={setDog} /> : <AppScreen><MessageCard>Öppnar hundens plats…</MessageCard></AppScreen>;
}
