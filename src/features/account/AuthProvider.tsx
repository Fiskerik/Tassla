import { AppState, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  accountGeneration: number;
  isCurrentAccount(ownerId: string, generation: number): boolean;
  signOutCurrentAccountLocally(ownerId: string, generation: number): Promise<boolean>;
  exchangeAuthCodeForCurrentSession(code: string): Promise<boolean>;
  reportDeletedAccountCleanupFailure(ownerId: string): void;
  status: AuthStatus;
  googlePending: boolean;
  signInWithGoogle(): Promise<boolean>;
  cancelGoogleSignIn(): void;
  sendMagicLink(email: string): Promise<boolean>;
  signOut(): Promise<SignOutResult>;
  reportNotificationCleanupFailure(ownerId: string): void;
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
  const [accountGeneration, setAccountGeneration] = useState(0);
  const accountGenerationRef = useRef(0);
  const [status, setStatus] = useState<AuthStatus>(clientResult.unavailable ? 'unavailable' : 'loading');
  const [googlePending, setGooglePending] = useState(false);
  const [signOutWarning, setSignOutWarning] = useState<string | null>(null);
  const authAttemptInFlight = useRef(false);
  const authMutationQueue = useRef<Promise<void>>(Promise.resolve());
  const googleBrowserPending = useRef(false);
  const currentOwnerId = useRef(session?.user.id ?? null);
  const currentRefreshToken = useRef<string | null>(null);
  const client = clientResult.client;
  const runAuthMutation = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const queued = authMutationQueue.current.then(operation, operation);
    authMutationQueue.current = queued.then(() => undefined, () => undefined);
    return queued;
  }, []);
  const adoptOwner = useCallback((ownerId: string | null, refreshToken: string | null = null, isNewSignIn = false) => {
    const previous = currentOwnerId.current?.toLowerCase() ?? null;
    const next = ownerId?.toLowerCase() ?? null;
    const startsNewSession = isNewSignIn && previous === next && next !== null
      && currentRefreshToken.current !== refreshToken;
    currentOwnerId.current = ownerId;
    currentRefreshToken.current = next === null ? null : refreshToken;
    if (previous !== next || startsNewSession) {
      accountGenerationRef.current += 1;
      setAccountGeneration(accountGenerationRef.current);
    }
  }, []);
  const isCurrentAccount = useCallback((ownerId: string, generation: number) => (
    currentOwnerId.current?.toLowerCase() === ownerId.toLowerCase()
      && accountGenerationRef.current === generation
  ), []);
  const signOutCurrentAccountLocally = useCallback(async (ownerId: string, generation: number): Promise<boolean> => {
    if (!client || !isCurrentAccount(ownerId, generation) || authAttemptInFlight.current) return false;
    authAttemptInFlight.current = true;
    try {
      return await runAuthMutation(async () => {
        if (!isCurrentAccount(ownerId, generation)) return false;
        const expectedRefreshToken = currentRefreshToken.current;
        if (!expectedRefreshToken) return false;
        const { data, error: sessionError } = await client.auth.getSession();
        if (sessionError || !isCurrentAccount(ownerId, generation)
          || data.session?.user.id.toLowerCase() !== ownerId.toLowerCase()
          || data.session.refresh_token !== expectedRefreshToken
          || currentRefreshToken.current !== expectedRefreshToken) return false;
        if (!isCurrentAccount(ownerId, generation) || currentRefreshToken.current !== expectedRefreshToken) return false;
        const { error } = await client.auth.signOut({ scope: 'local' });
        if (error) return false;
        const { data: finalData, error: finalError } = await client.auth.getSession();
        if (finalError || finalData.session) return false;
        if (currentOwnerId.current === ownerId && accountGenerationRef.current === generation) adoptOwner(null);
        return accountGenerationRef.current === generation + 1 && currentOwnerId.current === null;
      });
    } catch {
      return false;
    } finally {
      authAttemptInFlight.current = false;
    }
  }, [adoptOwner, client, isCurrentAccount, runAuthMutation]);

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    let authEvents = 0;
    const { data: { subscription } } = client.auth.onAuthStateChange((event, nextSession) => {
      authEvents += 1;
      if (!mounted) return;
      if (nextSession && googleBrowserPending.current) {
        googleBrowserPending.current = false;
        authAttemptInFlight.current = false;
        setGooglePending(false);
      }
      adoptOwner(nextSession?.user.id ?? null, nextSession?.refresh_token ?? null, event === 'SIGNED_IN');
      setSession(nextSession);
      setStatus(nextSession ? 'signedIn' : 'signedOut');
      if (nextSession) setSignOutWarning(null);
    });

    const revisionAtRead = authEvents;
    void client.auth.getSession().then(({ data, error }) => {
      if (!mounted || authEvents !== revisionAtRead) return;
      if (error) {
        adoptOwner(null);
        setSession(null);
        setStatus('unavailable');
        return;
      }
      adoptOwner(data.session?.user.id ?? null, data.session?.refresh_token ?? null);
      setSession(data.session);
      setStatus(data.session ? 'signedIn' : 'signedOut');
    }).catch(() => {
      if (mounted && authEvents === revisionAtRead) {
        adoptOwner(null);
        setSession(null);
        setStatus('unavailable');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [adoptOwner, client]);

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

  const reportNotificationCleanupFailure = useCallback((ownerId: string) => {
    const activeOwner = currentOwnerId.current;
    if (activeOwner && activeOwner.toLowerCase() !== ownerId.toLowerCase()) return;
    setSignOutWarning('Tassla kunde inte städa alla egna lokala påminnelser. Kontrollera Påminnelser när du öppnar kontot igen.');
  }, []);

  const reportDeletedAccountCleanupFailure = useCallback((ownerId: string) => {
    const activeOwner = currentOwnerId.current;
    if (activeOwner && activeOwner.toLowerCase() !== ownerId.toLowerCase()) return;
    setSignOutWarning('Kontot är raderat, men lokal städning misslyckades. Kontakta support om Tassla fortfarande visar dina uppgifter på den här enheten.');
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    client,
    session,
    accountGeneration,
    isCurrentAccount,
    signOutCurrentAccountLocally,
    async exchangeAuthCodeForCurrentSession(code) {
      if (!client || !code || code.length > 4096) return false;
      return runAuthMutation(async () => {
        const generationBefore = accountGenerationRef.current;
        try {
          const { data, error } = await client.auth.exchangeCodeForSession(code);
          if (error || !data.session) return false;
          if (accountGenerationRef.current === generationBefore) {
            adoptOwner(data.session.user.id, data.session.refresh_token, false);
            accountGenerationRef.current += 1;
            setAccountGeneration(accountGenerationRef.current);
          }
          googleBrowserPending.current = false;
          authAttemptInFlight.current = false;
          setGooglePending(false);
          return true;
        } catch {
          return false;
        }
      });
    },
    reportDeletedAccountCleanupFailure,
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
    reportNotificationCleanupFailure,
    async signOut(): Promise<SignOutResult> {
      if (!client) return { localSessionCleared: false, serverRevocationConfirmed: false };
      const ownerId = session?.user.id;
      const generation = accountGeneration;
      if (!ownerId || authAttemptInFlight.current) return { localSessionCleared: false, serverRevocationConfirmed: false };
      setSignOutWarning(null);
      const { serverRevocationConfirmed, localSessionCleared } = await runAuthMutation(async () => {
        if (!isCurrentAccount(ownerId, generation)) return { localSessionCleared: false, serverRevocationConfirmed: false };
        const expectedRefreshToken = currentRefreshToken.current;
        if (!expectedRefreshToken) return { localSessionCleared: false, serverRevocationConfirmed: false };
        let serverRevoked = false;
        try {
          const { data, error: sessionError } = await client.auth.getSession();
          if (sessionError || !isCurrentAccount(ownerId, generation)
            || data.session?.user.id.toLowerCase() !== ownerId.toLowerCase()
            || data.session.refresh_token !== expectedRefreshToken
            || currentRefreshToken.current !== expectedRefreshToken) {
            return { localSessionCleared: false, serverRevocationConfirmed: false };
          }
          if (!isCurrentAccount(ownerId, generation) || currentRefreshToken.current !== expectedRefreshToken) {
            return { localSessionCleared: false, serverRevocationConfirmed: false };
          }
          const { error } = await client.auth.signOut();
          serverRevoked = !error;
        } catch {
          serverRevoked = false;
        }
        try {
          const { data, error } = await client.auth.getSession();
          const cleared = !error && !data.session;
          if (cleared && currentOwnerId.current === ownerId && accountGenerationRef.current === generation) adoptOwner(null);
          return { localSessionCleared: cleared, serverRevocationConfirmed: serverRevoked };
        } catch {
          return { localSessionCleared: false, serverRevocationConfirmed: serverRevoked };
        }
      });
      if (localSessionCleared && !serverRevocationConfirmed && currentOwnerId.current === null) {
        setSignOutWarning('Du är utloggad på den här enheten. Servern kunde inte bekräfta att sessionen har återkallats.');
      }
      return { localSessionCleared, serverRevocationConfirmed };
    },
    signOutWarning,
  }), [accountGeneration, adoptOwner, client, googlePending, isCurrentAccount, reportDeletedAccountCleanupFailure, reportNotificationCleanupFailure, runAuthMutation, session, signOutCurrentAccountLocally, signOutWarning, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
