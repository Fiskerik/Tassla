import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { AppScreen, MessageCard, PageHeading, PrimaryButton } from '../../components/AppPrimitives';
import { DEV_PREVIEW_ENABLED } from '../account/preview-policy';
import { SignInScreen } from '../account/SignInScreen';
import { DevelopmentPreview } from './DevelopmentPreview';
import { useAuth } from '../account/AuthProvider';
import { cleanupStalePassportFiles } from '../passport/passport-export';
import { captureSecureKennelJoinUrl } from '../../onboarding-referral/referral-secure-storage';
import { Redirect } from 'expo-router';

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
  const { client, session, status } = useAuth();

  if (status === 'loading') return <AppScreen><MessageCard>Öppnar Tassla…</MessageCard></AppScreen>;
  if (status === 'unavailable' || !client) return <AppScreen><PageHeading title="Tassla vilar en stund" description="Inloggningen är inte tillgänglig just nu. Försök igen senare." /></AppScreen>;
  if (status === 'signedOut' || !session) return <SignInScreen />;
  return <Redirect href="/home" />;
}
