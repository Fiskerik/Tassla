import { AppState, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { AUTH_CALLBACK_URL, isTrustedGoogleOAuthUrl } from '../../data/auth-callback';
import { verifyPkceWebCrypto } from '../../data/pkce-crypto';
import { getSupabaseClient, getSupabaseProjectUrl } from '../../data/supabase';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'unavailable';

export interface SignOutResult {
  localSessionCleared: boolean;
  serverRevocationConfirmed: boolean;
}

interface AuthContextValue {
  client: SupabaseClient | null;
  session: Session | null;
  status: AuthStatus;
  googlePending: boolean;
  signInWithGoogle(): Promise<boolean>;
  cancelGoogleSignIn(): void;
  sendMagicLink(email: string): Promise<boolean>;
  signOut(): Promise<SignOutResult>;
  signOutWarning: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [clientResult] = useState(() => {
    try {
      return { client: getSupabaseClient(), unavailable: false };
    } catch {
      return { client: null, unavailable: true };
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(clientResult.unavailable ? 'unavailable' : 'loading');
  const [googlePending, setGooglePending] = useState(false);
  const [signOutWarning, setSignOutWarning] = useState<string | null>(null);
  const authAttemptInFlight = useRef(false);
  const googleBrowserPending = useRef(false);
  const client = clientResult.client;

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    let authEvents = 0;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      authEvents += 1;
      if (!mounted) return;
      if (nextSession && googleBrowserPending.current) {
        googleBrowserPending.current = false;
        authAttemptInFlight.current = false;
        setGooglePending(false);
      }
      setSession(nextSession);
      setStatus(nextSession ? 'signedIn' : 'signedOut');
      if (nextSession) setSignOutWarning(null);
    });

    const revisionAtRead = authEvents;
    void client.auth.getSession().then(({ data, error }) => {
      if (!mounted || authEvents !== revisionAtRead) return;
      if (error) {
        setSession(null);
        setStatus('unavailable');
        return;
      }
      setSession(data.session);
      setStatus(data.session ? 'signedIn' : 'signedOut');
    }).catch(() => {
      if (mounted && authEvents === revisionAtRead) {
        setSession(null);
        setStatus('unavailable');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (!client || Platform.OS === 'web') return;
    const updateRefresh = (state: string) => {
      const action = state === 'active'
        ? client.auth.startAutoRefresh()
        : client.auth.stopAutoRefresh();
      void action.catch(() => undefined);
    };
    updateRefresh(AppState.currentState ?? 'active');
    const subscription = AppState.addEventListener('change', updateRefresh);
    return () => {
      subscription.remove();
      void client.auth.stopAutoRefresh().catch(() => undefined);
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(() => ({
    client,
    session,
    status,
    googlePending,
    async signInWithGoogle() {
      if (!client || authAttemptInFlight.current) return false;
      authAttemptInFlight.current = true;
      try {
        await verifyPkceWebCrypto();
        const { data, error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: AUTH_CALLBACK_URL, skipBrowserRedirect: true },
        });
        if (error || !data.url || !isTrustedGoogleOAuthUrl(data.url, getSupabaseProjectUrl())) return false;
        googleBrowserPending.current = true;
        setGooglePending(true);
        await Linking.openURL(data.url);
        return true;
      } catch {
        googleBrowserPending.current = false;
        setGooglePending(false);
        return false;
      } finally {
        if (!googleBrowserPending.current) authAttemptInFlight.current = false;
      }
    },
    cancelGoogleSignIn() {
      if (!googleBrowserPending.current) return;
      googleBrowserPending.current = false;
      authAttemptInFlight.current = false;
      setGooglePending(false);
    },
    async sendMagicLink(email) {
      if (!client || authAttemptInFlight.current) return false;
      authAttemptInFlight.current = true;
      try {
        await verifyPkceWebCrypto();
        const { error } = await client.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: AUTH_CALLBACK_URL, shouldCreateUser: true },
        });
        return !error;
      } catch {
        return false;
      } finally {
        authAttemptInFlight.current = false;
      }
    },
    async signOut(): Promise<SignOutResult> {
      if (!client) return { localSessionCleared: false, serverRevocationConfirmed: false };
      setSignOutWarning(null);
      let serverRevocationConfirmed = false;
      try {
        const { error } = await client.auth.signOut();
        serverRevocationConfirmed = !error;
      } catch {
        serverRevocationConfirmed = false;
      }

      let localSessionCleared = false;
      try {
        const { data, error } = await client.auth.getSession();
        localSessionCleared = !error && !data.session;
      } catch {
        localSessionCleared = false;
      }
      if (localSessionCleared && !serverRevocationConfirmed) {
        setSignOutWarning('Du är utloggad på den här enheten. Servern kunde inte bekräfta att sessionen har återkallats.');
      }
      return { localSessionCleared, serverRevocationConfirmed };
    },
    signOutWarning,
  }), [client, googlePending, session, signOutWarning, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
