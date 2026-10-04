import { useEffect, useRef, useState } from 'react';
import { useLinkingURL } from 'expo-linking';
import { useRouter } from 'expo-router';
import { AppScreen, MessageCard, PageHeading, PrimaryButton } from '../../components/AppPrimitives';
import { readAuthCode } from '../../data/auth-callback';
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
  const { client } = useAuth();
  const handled = useRef(false);
  const [exchangeError, setExchangeError] = useState(false);
  const code = url ? readAuthCode(url) : null;
  const invalidCallback = url !== null && (!code || !client);

  useEffect(() => {
    if (!url || handled.current) return;
    handled.current = true;
    const authCode = readAuthCode(url);
    if (!authCode || !client) return;
    void client.auth.exchangeCodeForSession(authCode).then(({ error }) => {
      if (error) {
        setExchangeError(true);
        return;
      }
      router.replace('/');
    }).catch(() => setExchangeError(true));
  }, [client, router, url]);

  const error = invalidCallback || exchangeError;

  return (
    <AppScreen>
      <PageHeading
        title={error ? 'Länken fungerar inte' : 'Välkommen till Tassla'}
        description={error ? 'Länken kan ha gått ut eller vara ogiltig. Gå tillbaka och be om en ny.' : 'Vi öppnar din trygga plats för livet med hund.'}
      />
      {!error && <MessageCard>{url ? 'Vi slutför inloggningen…' : 'Vänta medan länken öppnas…'}</MessageCard>}
      {error && <PrimaryButton title="Till inloggningen" onPress={() => router.replace('/')} />}
    </AppScreen>
  );
}
