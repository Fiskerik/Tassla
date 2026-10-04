import { AppState, Platform } from 'react-native';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { AUTH_CALLBACK_URL } from '../../data/auth-callback';
import { getSupabaseClient } from '../../data/supabase';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'unavailable';

interface AuthContextValue {
  client: SupabaseClient | null;
  session: Session | null;
  status: AuthStatus;
  sendMagicLink(email: string): Promise<boolean>;
  signOut(): Promise<boolean>;
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
  const client = clientResult.client;

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    let authEvents = 0;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      authEvents += 1;
      if (!mounted) return;
      setSession(nextSession);
      setStatus(nextSession ? 'signedIn' : 'signedOut');
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
    async sendMagicLink(email) {
      if (!client) return false;
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: AUTH_CALLBACK_URL, shouldCreateUser: true },
      });
      return !error;
    },
    async signOut() {
      if (!client) return false;
      const { error } = await client.auth.signOut();
      return !error;
    },
  }), [client, session, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
