import { useEffect, useRef, useState } from 'react';
import { useLinkingURL } from 'expo-linking';
import { useRouter } from 'expo-router';
import { readAuthCode, shouldExchangeAuthCode } from '../../data/auth-callback';
import { DEV_PREVIEW_ENABLED } from './preview-policy';
import { useAuth } from './AuthProvider';
import { AuthCallbackView } from './AuthCallbackView';

export function AuthCallbackScreen() {
  return DEV_PREVIEW_ENABLED ? <PreviewCallbackGuard /> : <ProductAuthCallbackScreen />;
}

function PreviewCallbackGuard() {
  const router = useRouter();
  return <AuthCallbackView mode="preview" onReturn={() => router.replace('/')} />;
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

  return <AuthCallbackView mode={error ? 'error' : 'pending'}
    pendingMessage={url ? 'Vi slutför inloggningen…' : 'Vänta medan länken öppnas…'}
    onReturn={() => { cancelGoogleSignIn(); router.replace('/'); }} />;
}
