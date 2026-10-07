import { useEffect, useRef, useState } from 'react';
import { useLinkingURL } from 'expo-linking';
import { useRouter } from 'expo-router';
import { AppScreen, MessageCard, PageHeading, PrimaryButton } from '../../components/AppPrimitives';
import { readAuthCode, shouldExchangeAuthCode } from '../../data/auth-callback';
import { DEV_PREVIEW_ENABLED } from './preview-policy';
import { useAuth } from './AuthProvider';

export function AuthCallbackScreen() {
  return DEV_PREVIEW_ENABLED ? <PreviewCallbackGuard /> : <ProductAuthCallbackScreen />;
}

function PreviewCallbackGuard() {
  const router = useRouter();
  return (
    <AppScreen>
      <PageHeading title="Inloggning ingår inte i testläget" description="Gå tillbaka till den lokala förhandsvisningen av Hem och exempelprofilen." />
      <PrimaryButton title="Till Hem" onPress={() => router.replace('/')} />
    </AppScreen>
  );
}

function ProductAuthCallbackScreen() {
  const url = useLinkingURL();
  const router = useRouter();
  const { cancelGoogleSignIn, client, exchangeAuthCodeForCurrentSession } = useAuth();
  const inFlightCode = useRef<string | null>(null);
  const failedCode = useRef<string | null>(null);
  const exchangedCode = useRef<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [failedCodeForDisplay, setFailedCodeForDisplay] = useState<string | null>(null);
  const code = url ? readAuthCode(url) : null;
  const invalidCallback = url !== null && (!code || !client);

  useEffect(() => {
    if (!client || !shouldExchangeAuthCode(code, inFlightCode.current, failedCode.current, exchangedCode.current)) return;
    inFlightCode.current = code;
    void exchangeAuthCodeForCurrentSession(code).then((exchanged) => {
      if (!exchanged) {
        failedCode.current = code;
        setFailedCodeForDisplay(code);
        cancelGoogleSignIn();
        return;
      }
      exchangedCode.current = code;
      router.replace('/');
    }).catch(() => {
      failedCode.current = code;
      setFailedCodeForDisplay(code);
      cancelGoogleSignIn();
    }).finally(() => {
      if (inFlightCode.current === code) inFlightCode.current = null;
      setAttempt((current) => current + 1);
    });
  }, [attempt, cancelGoogleSignIn, client, code, exchangeAuthCodeForCurrentSession, router]);

  const error = invalidCallback || Boolean(code && failedCodeForDisplay === code);

  return (
    <AppScreen>
      <PageHeading
        title={error ? 'Länken fungerar inte' : 'Välkommen till Tassla'}
        description={error ? 'Länken kan ha gått ut eller vara ogiltig. Gå tillbaka och be om en ny.' : 'Vi öppnar din trygga plats för livet med hund.'}
      />
      {!error && <MessageCard>{url ? 'Vi slutför inloggningen…' : 'Vänta medan länken öppnas…'}</MessageCard>}
      {error && <PrimaryButton title="Till inloggningen" onPress={() => { cancelGoogleSignIn(); router.replace('/'); }} />}
    </AppScreen>
  );
}
